# scripts/process_metrics.py
import json
from pathlib import Path
import pandas as pd
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parents[1]
outputs_dir = ROOT / "outputs"
output_dir = ROOT / "output"
zones_file = ROOT / "zones_config.json"

# CSV files
density_csv = outputs_dir / "density_metrics.csv"   # Frame,ZoneID,Density
speed_csv = output_dir / "speed_metrics.csv"        # frame,ZoneID,avg_speed
risk_csv = output_dir / "risk_metrics.csv"          # frame,zone_id,...

def build_combined_json():
    if not zones_file.exists():
        raise SystemExit("zones_config.json missing")

    cfg = json.loads(zones_file.read_text())
    zones_layout = cfg.get("zones_layout", [])
    exits_layout = cfg.get("exits_layout", [])
    start_time_utc = cfg.get("start_time_utc", None)
    fps = cfg.get("fps", 25.0)
    if start_time_utc is None:
        start_time = datetime.utcnow()
    else:
        start_time = datetime.fromisoformat(start_time_utc.replace("Z", ""))

    # load CSVs
    if not risk_csv.exists():
        print("❌ risk_metrics.csv missing. Run generate_risk.py first.")
        raise SystemExit(1)

    risk_df = pd.read_csv(risk_csv)

    combined = []
    for _, row in risk_df.iterrows():
        fr = int(row["frame"])
        ts = (start_time + timedelta(seconds=fr / fps)).isoformat() + "Z"
        zone_entry = {
            "zone_id": row["zone_id"],
            "zone_name": next((z["name"] for z in zones_layout if z["zone_id"]==row["zone_id"]), ""),
            "density": float(row.get("density",0.0)),
            "avg_speed": float(row.get("avg_speed",0.0)),
            "risk_score": float(row.get("risk_score",0.0)),
            "direction_conflict": float(row.get("direction_conflict",0.0)),
            "surge_index": float(row.get("surge_index",0.0)),
            "bottleneck_index": float(row.get("bottleneck_index",0.0)),
            "swirl_index": float(row.get("swirl_index",0.0))
        }

        # exits: simple per-frame copy of config with placeholders for flow metrics
        exits_per_frame = []
        for e in exits_layout:
            exits_per_frame.append({
                "exit_id": e.get("exit_id"),
                "exit_name": e.get("name"),
                "approaching_count": 0,
                "current_flow_rate": 0,
                "bottleneck_factor": 0.0,
                "capacity": e.get("capacity", None)
            })

        # find if we already have a combined entry for this frame
        existing = next((c for c in combined if c["frame"]==fr), None)
        if existing:
            existing["zones"].append(zone_entry)
        else:
            combined.append({
                "frame": fr,
                "timestamp": ts,
                "zones": [zone_entry],
                "exits": exits_per_frame
            })

    # save full JSON
    out_file = outputs_dir / "metrics_full.json"
    out_file.write_text(json.dumps(combined, indent=2))

    # also save a combined CSV for easy viewing (one row per frame-zone)
    combined_rows = []
    for f in combined:
        for z in f["zones"]:
            r = {
                "frame": f["frame"],
                "timestamp": f["timestamp"],
                "zone_id": z["zone_id"],
                "zone_name": z["zone_name"],
                "density": z["density"],
                "avg_speed": z["avg_speed"],
                "risk_score": z["risk_score"],
                "direction_conflict": z["direction_conflict"],
                "surge_index": z["surge_index"],
                "bottleneck_index": z["bottleneck_index"],
                "swirl_index": z["swirl_index"]
            }
            combined_rows.append(r)
    pd.DataFrame(combined_rows).to_csv(outputs_dir / "combined_metrics.csv", index=False)

    print(f"✔ metrics_full.json saved at {out_file}")
    print(f"✔ combined_metrics.csv saved at {outputs_dir / 'combined_metrics.csv'}")

if __name__ == "__main__":
    build_combined_json()
