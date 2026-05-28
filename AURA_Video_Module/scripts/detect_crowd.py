# scripts/detect_crowd.py
import cv2
import json
from pathlib import Path
import argparse
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("--video", required=True, help="path to video file (relative to project root)")
args = parser.parse_args()
video_path = Path(args.video)
ROOT = Path(__file__).resolve().parents[1]

if not video_path.exists():
    print(f"❌ Video not found: {video_path}")
    raise SystemExit(1)

# load zones config
zones_file = ROOT / "zones_config.json"
if not zones_file.exists():
    print("❌ zones_config.json not found in project root.")
    raise SystemExit(1)
cfg = json.loads(zones_file.read_text())
zones = cfg.get("zones_layout", [])
# optional fps/start_time
fps_cfg = cfg.get("fps", 25.0)

# outputs
out_dir = ROOT / "outputs"
out_dir.mkdir(exist_ok=True)
crowd_out = out_dir / "crowd_data.json"
density_csv = out_dir / "density_metrics.csv"

cap = cv2.VideoCapture(str(video_path))
fgbg = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=False)

frame_idx = 0
crowd_list = []

# We'll treat zone coordinates as approximate pixel positions (config should be approximate relative to video frame)
# If coordinates in config are lat-lon, user should map them to pixel coords — here we assume simple pixel coords or small mapping.
# If coordinate values look like floats within [0,1], we scale by frame width/height.

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# detect whether coordinates are normalized (0..1) or pixel coords >1
normalize_coords = False
if zones and isinstance(zones[0].get("coordinates", [0,0])[0], float) and max(z[ "coordinates"][0] for z in zones) <= 1.0:
    normalize_coords = True

while True:
    ret, frame = cap.read()
    if not ret:
        break

    mask = fgbg.apply(frame)
    # morphological clean
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    zones_data = []
    for z in zones:
        zx, zy = z.get("coordinates", [0,0])
        if normalize_coords:
            px = int(zx * width)
            py = int(zy * height)
        else:
            px = int(zx)
            py = int(zy)

        # region window size (config-free default)
        w = int(min(width, 200))
        h = int(min(height, 200))
        x1 = max(0, px - w//2)
        y1 = max(0, py - h//2)
        x2 = min(width, x1 + w)
        y2 = min(height, y1 + h)
        roi = mask[y1:y2, x1:x2]

        # count connected components / contours
        contours, _ = cv2.findContours(roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        person_like = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 200:   # threshold => tune for your video
                person_like += 1

        # density estimate: people per zone area (people / (w*h) normalized)
        zone_area = (x2-x1)*(y2-y1)
        density = person_like / (zone_area/10000 + 1e-6)  # scaled so small numbers are ok
        # for simpler normalized density between 0..10, clamp
        density = float(round(min(10.0, density), 4))

        zones_data.append({
            "zone_id": z["zone_id"],
            "zone_name": z.get("name", ""),
            "density": density,
            "roi": [x1, y1, x2, y2]
        })

    crowd_list.append({
        "frame": frame_idx,
        "zones": zones_data
    })

    frame_idx += 1

cap.release()

# Save crowd_data.json
crowd_out.write_text(json.dumps(crowd_list, indent=2))
# Save density CSV (one row per frame-zone)
with open(density_csv, "w") as f:
    f.write("Frame,ZoneID,Density\n")
    for rec in crowd_list:
        fr = rec["frame"]
        for z in rec["zones"]:
            f.write(f"{fr},{z['zone_id']},{z['density']}\n")

print(f"✔ crowd_data.json saved → {crowd_out}")
print(f"✔ density_metrics.csv saved → {density_csv}")
