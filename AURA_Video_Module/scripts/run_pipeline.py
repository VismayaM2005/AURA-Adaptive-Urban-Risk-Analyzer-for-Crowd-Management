# scripts/run_pipeline.py
import subprocess
import sys
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"

# default video (if not provided as first CLI arg)
import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--video", help="video path (relative to project root)", default="test_videos/crowd1.mp4")
args = parser.parse_args()
video = Path(args.video)

def run(script, extra_args=None):
    cmd = [sys.executable, str(SCRIPTS / script)]
    if extra_args:
        cmd += extra_args
    print(f"\n▶ Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

def main():
    # 0) check zones_config exists
    zones = ROOT / "zones_config.json"
    if not zones.exists():
        print("❌ zones_config.json missing in project root.")
        sys.exit(1)
    cfg = json.loads(zones.read_text())
    zcount = len(cfg.get("zones_layout", []))
    print(f"✔ Zones loaded dynamically ({zcount} zones)")

    # 1) detect crowd
    run("detect_crowd.py", ["--video", str(video)])

    # 2) extract speed
    run("extract_speed.py", ["--video", str(video)])

    # 3) generate risk
    run("generate_risk.py")

    # 4) process metrics (build metrics_full.json)
    run("process_metrics.py")

    # 5) try to send to backend (optional)
    try:
        run("send_metrics.py")
    except subprocess.CalledProcessError:
        print("⚠ send_metrics failed. You can still share outputs/metrics_full.json manually with Member 1.")

    print("\n🎉 Pipeline finished. Check outputs/ and output/ for results.")

if __name__ == "__main__":
    main()
