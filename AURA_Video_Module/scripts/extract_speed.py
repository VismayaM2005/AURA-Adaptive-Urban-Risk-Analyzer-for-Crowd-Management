# scripts/extract_speed.py
import cv2
import json
from pathlib import Path
import argparse
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("--video", required=True)
args = parser.parse_args()
video_path = Path(args.video)
ROOT = Path(__file__).resolve().parents[1]

if not video_path.exists():
    print(f"❌ Video not found: {video_path}")
    raise SystemExit(1)

crowd_json = ROOT / "outputs" / "crowd_data.json"
if not crowd_json.exists():
    print("❌ crowd_data.json not found (run detect_crowd.py first).")
    raise SystemExit(1)
crowd_list = json.loads(crowd_json.read_text())

# prepare output folder
out_dir = ROOT / "output"
out_dir.mkdir(exist_ok=True)
speed_csv = out_dir / "speed_metrics.csv"

cap = cv2.VideoCapture(str(video_path))
ret, prev_frame = cap.read()
if not ret:
    print("❌ Cannot read video frames.")
    raise SystemExit(1)
prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)

frame_idx = 0
speed_rows = []

# iterate each frame, compute optical flow with next frame
while True:
    ret, frame = cap.read()
    if not ret:
        break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None,
                                        pyr_scale=0.5, levels=3, winsize=15, iterations=3,
                                        poly_n=5, poly_sigma=1.2, flags=0)
    # find corresponding crowd entry
    if frame_idx < len(crowd_list):
        entry = crowd_list[frame_idx]
        for z in entry["zones"]:
            x1, y1, x2, y2 = z.get("roi", [0,0,0,0])
            if x2<=x1 or y2<=y1:
                avg_speed = 0.0
            else:
                fz = flow[y1:y2, x1:x2]
                mag = np.sqrt(fz[...,0]**2 + fz[...,1]**2)
                # convert pixel/frame to approximate m/s? We skip unit conversion; keep relative speed
                avg_speed = float(np.mean(mag)) if mag.size>0 else 0.0
            speed_rows.append({"frame": frame_idx, "zone_id": z["zone_id"], "avg_speed": round(avg_speed, 6)})
    else:
        # no crowd metadata; compute a global average
        mag = np.sqrt(flow[...,0]**2 + flow[...,1]**2)
        speed_rows.append({"frame": frame_idx, "zone_id": "ALL", "avg_speed": float(np.mean(mag))})

    prev_gray = gray
    frame_idx += 1

cap.release()

# Write CSV (frame,zone_id,avg_speed)
with open(speed_csv, "w") as f:
    f.write("frame,ZoneID,avg_speed\n")
    for r in speed_rows:
        f.write(f"{r['frame']},{r['zone_id']},{r['avg_speed']}\n")

print(f"✔ speed_metrics.csv saved → {speed_csv}")
