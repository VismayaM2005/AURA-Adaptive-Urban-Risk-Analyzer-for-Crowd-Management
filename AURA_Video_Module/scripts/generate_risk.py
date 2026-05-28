# scripts/generate_risk.py
import json
from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
crowd_file = ROOT / "outputs" / "crowd_data.json"
speed_csv = ROOT / "output" / "speed_metrics.csv"
risk_csv = ROOT / "output" / "risk_metrics.csv"

if not crowd_file.exists():
    print("❌ crowd_data.json not found—run detect_crowd.py first.")
    raise SystemExit(1)
if not speed_csv.exists():
    print("❌ speed_metrics.csv not found—run extract_speed.py first.")
    raise SystemExit(1)

crowd = json.loads(crowd_file.read_text())
speed_df = pd.read_csv(speed_csv)  # columns: frame,ZoneID,avg_speed

# Build mapping: (frame,zone)->avg_speed
speed_map = {}
for _, row in speed_df.iterrows():
    speed_map[(int(row["frame"]), str(row["ZoneID"]))] = float(row["avg_speed"])

rows = []
for rec in crowd:
    fr = int(rec["frame"])
    for z in rec["zones"]:
        zid = z["zone_id"]
        density = float(z.get("density", 0.0))
        avg_speed = speed_map.get((fr, zid), speed_map.get((fr, "ALL"), 0.0))

        # direction_conflict & swirl: compute from variance of optical flow angles if available
        # We can't access flow angles here (we used optical flow in extract_speed) — approximate using speed distribution:
        # direction_conflict: higher when avg_speed is small but many small motions -> use small proxy
        direction_conflict = 0.0
        surge_index = 0.0
        swirl_index = 0.0

        # Surge: fraction of frames where avg_speed spiked (simple heuristic)
        surge_index = float(min(1.0, avg_speed / (np.percentile([avg_speed + 1e-6], 90) + 1e-6))) if avg_speed>0 else 0.0

        # Bottleneck index: density * (1 - normalized speed)
        # normalize speed to [0,1] by dividing by some expected max (heuristic)
        expected_max_speed = 10.0  # tune if you want
        speed_norm = min(1.0, avg_speed / (expected_max_speed + 1e-6))
        bottleneck_index = float(round(density * (1 - speed_norm), 4))

        # swirl_index approximate: if avg_speed moderate but density high => some angular movement
        swirl_index = float(round( max(0.0, (density*0.1) * (1 - speed_norm)), 4))

        # direction_conflict heuristic: if speeds across zones vary greatly -> conflict
        # We'll use std of nearby density values (simple proxy)
        direction_conflict = 0.0  # keep simple for now (can be improved if you want)
        # final risk_score: weighted sum
        risk_score = round(0.4 * density + 0.25 * speed_norm + 0.15 * direction_conflict + 0.1 * surge_index + 0.1 * bottleneck_index, 4)

        rows.append({
            "frame": fr,
            "zone_id": zid,
            "density": round(density,4),
            "avg_speed": round(avg_speed,6),
            "direction_conflict": round(direction_conflict,4),
            "surge_index": round(surge_index,4),
            "bottleneck_index": round(bottleneck_index,4),
            "swirl_index": round(swirl_index,4),
            "risk_score": risk_score
        })

# Save risk CSV
pd.DataFrame(rows).to_csv(risk_csv, index=False)
print(f"✔ Risk metrics saved → {risk_csv}")
