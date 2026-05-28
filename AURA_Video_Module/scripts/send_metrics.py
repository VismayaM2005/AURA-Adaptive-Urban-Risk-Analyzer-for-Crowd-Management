# scripts/send_metrics.py
import os
import json
import requests
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
metrics_file = ROOT / "outputs" / "metrics_full.json"
BACKEND_URL = os.environ.get("AURA_BACKEND_URL", "http://127.0.0.1:8000/receive_metrics")

def send_metrics():
    if not metrics_file.exists():
        print(f"❌ Metrics file not found: {metrics_file}")
        return 1
    payload = json.loads(metrics_file.read_text())
    try:
        print(f"📥 Sending metrics to {BACKEND_URL} ...")
        r = requests.post(BACKEND_URL, json=payload, timeout=10)
        print(f"➡ {r.status_code}: {r.text}")
        if r.status_code == 200:
            print("✅ Metrics sent successfully.")
            return 0
        else:
            print("❌ Backend returned non-200 code.")
            return 2
    except Exception as e:
        print("❌ Exception occurred while sending metrics:", e)
        print(f"⚠ You can still share {metrics_file} manually with Member 1.")
        return 3

if __name__ == "__main__":
    sys.exit(send_metrics())
