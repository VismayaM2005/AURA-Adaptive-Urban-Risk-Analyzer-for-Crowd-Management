import json
from datetime import datetime

from risk_engine import (
    compute_risk_step,
    compute_cpi_step,
    classify_zone,
    detect_surge_and_panic,
    detect_huddle,
    compute_elbs,
)

METRICS_PATH = "C:\\Users\\Harshitha\\Desktop\\AURA\\AURA_HKBK\\AURA_Video_Module\\outputs\\metrics_full.json"
MAX_DENSITY_PEOPLE_PER_M2 = 10.0  # 1.0 from Member2 -> 10 people/m²


def map_color_to_risk_word(color: str) -> str:
    color = (color or "").upper()
    return {
        "GREEN": "low",
        "YELLOW": "moderate",
        "ORANGE": "high",
        "RED": "critical",
    }.get(color, "unknown")


def risk_score_to_word(score_0_100: float) -> str:
    """Convert numeric risk score (0–100) into low/moderate/high/critical."""
    if score_0_100 < 20:
        return "low"
    elif score_0_100 < 40:
        return "moderate"
    elif score_0_100 < 70:
        return "high"
    else:
        return "critical"


def iso_to_hhmmss(iso_ts: str) -> str:
    """2025-12-02T07:52:50.392011Z -> 07:52:50"""
    if iso_ts.endswith("Z"):
        iso_ts = iso_ts.replace("Z", "+00:00")
    dt = datetime.fromisoformat(iso_ts)
    return f"{dt.hour:02d}:{dt.minute:02d}:{dt.second:02d}"


if __name__ == "__main__":
    # ---------------------------------------------------
    # 1. LOAD & SORT ALL FRAMES FROM MEMBER2 (REAL DATA)
    # ---------------------------------------------------
    with open(METRICS_PATH, "r") as f:
        frames = json.load(f)

    frames_sorted = sorted(frames, key=lambda fr: fr["frame"])
    last_frame_index = frames_sorted[-1]["frame"]

    print(f"Loaded {len(frames_sorted)} frames. Last frame index = {last_frame_index}")

    # Temporal state per zone
    prev_risk_smooth = {}
    prev_cpi_smooth = {}
    prev_speed = {}
    prev_density = {}

    # Global per-zone summary over ALL frames (for /zones)
    zone_summary = {}  # zone_id -> {zone_name, max_density_people_m2, max_risk_score_100}

    # Outputs we’re building
    analytics_metrics = []   # one entry per frame
    playback_history = []    # one entry per frame per zone
    timeline_events = []     # one entry per alert over all frames
    all_alerts = []          # for /alerts endpoint (all frames)

    # Snapshots for analytics etc.
    last_frame_zone_results = None
    last_frame_timestamp_iso = None
    last_frame_elbs_result = None
    last_frame_exits_raw = None

    # For safeRoute: frame with highest risk across all frames & zones
    worst_global_risk = -1.0
    safe_route_frame_zone_results = None
    safe_route_frame_exits_raw = None

    # ---------------------------------------------------
    # 2. PROCESS *EVERY* FRAME
    # ---------------------------------------------------
    for frame in frames_sorted:
        frame_id = frame["frame"]
        timestamp_iso = frame["timestamp"]
        timestamp_hhmmss = iso_to_hhmmss(timestamp_iso)
        zones_raw = frame["zones"]
        exits_raw = frame["exits"]

        zone_results_for_frame = {}
        frame_alerts = []

        # ----------------- PER-ZONE PROCESSING -----------------
        for z in zones_raw:
            zone_id = z["zone_id"]
            zone_name = z["zone_name"]

            raw_density_0_1 = z["density"]
            raw_avg_speed = z["avg_speed"]
            direction_conflict = z["direction_conflict"]
            surge = z["surge_index"]
            bottleneck = z["bottleneck_index"]
            swirl_index = z["swirl_index"]

            density_people_m2 = raw_density_0_1 * MAX_DENSITY_PEOPLE_PER_M2
            speed_mps = min(raw_avg_speed, 1.3)

            # temporal inputs
            pr = prev_risk_smooth.get(zone_id, 0.0)
            pc = prev_cpi_smooth.get(zone_id, 0.0)
            ps = prev_speed.get(zone_id, speed_mps)
            pd = prev_density.get(zone_id, density_people_m2)

            risk_result = compute_risk_step(
                prev_risk_smooth=pr,
                density=density_people_m2,
                speed=speed_mps,
                direction_conflict=direction_conflict,
                surge=surge,
                bottleneck=bottleneck,
            )

            cpi_result = compute_cpi_step(
                prev_cpi_smooth=pc,
                density=density_people_m2,
                speed=speed_mps,
                direction_conflict=direction_conflict,
                surge=surge,
                bottleneck=bottleneck,
            )

            zone_status = classify_zone(risk_result, cpi_result)

            panic_result = detect_surge_and_panic(
                prev_speed=ps,
                curr_speed=speed_mps,
                direction_conflict=direction_conflict,
                surge=surge,
                risk_result=risk_result,
            )

            huddle_result = detect_huddle(
                prev_density=pd,
                curr_density=density_people_m2,
                speed=speed_mps,
                swirl_index=swirl_index,
                risk_result=risk_result,
            )

            # update temporal state
            prev_risk_smooth[zone_id] = risk_result["risk_smooth"]
            prev_cpi_smooth[zone_id] = cpi_result["cpi"]
            prev_speed[zone_id] = speed_mps
            prev_density[zone_id] = density_people_m2

            zr = {
                "meta": z,
                "risk": risk_result,
                "cpi": cpi_result,
                "status": zone_status,
                "panic": panic_result,
                "huddle": huddle_result,
                "density_people_m2": density_people_m2,
                "timestamp_iso": timestamp_iso,
                "timestamp_hhmmss": timestamp_hhmmss,
            }

            zone_results_for_frame[zone_id] = zr

            # --------- PLAYBACK HISTORY (ALL FRAMES) ----------
            # using a simple UI scaling: people/m² * 100
            density_ui_value = int(density_people_m2 * 100)
            zone_color = zone_status["status_color"]
            risk_word = map_color_to_risk_word(zone_color)

            playback_history.append(
                {
                    "timestamp": timestamp_hhmmss,
                    "density": density_ui_value,
                    "risk": risk_word,
                    "zone": zone_name,
                }
            )

            # --------- ALERTS (ALL FRAMES) ----------
            if (
                zone_color in ("ORANGE", "RED")
                or panic_result["is_panic_like"]
                or huddle_result["is_huddle"]
            ):
                if zone_color == "RED" or panic_result["is_panic_like"]:
                    severity = "critical"
                else:
                    severity = "high"

                alert_obj = {
                    "zone": zone_name,
                    "message": "Crowd risk elevated",
                    "severity": severity,
                    "timestamp": timestamp_iso,
                }
                frame_alerts.append(alert_obj)
                all_alerts.append(alert_obj)

                # timeline event (for playback)
                timeline_events.append(
                    {
                        "time": timestamp_hhmmss,
                        "message": alert_obj["message"],
                        "severity": severity.upper(),
                    }
                )

            # --------- GLOBAL WORST RISK (FOR SAFEROUTE) ----------
            risk_score_100 = risk_result["risk_score"]
            if risk_score_100 > worst_global_risk:
                worst_global_risk = risk_score_100
                safe_route_frame_zone_results = zone_results_for_frame
                safe_route_frame_exits_raw = exits_raw

            # --------- PER-ZONE SUMMARY (FOR /ZONES) ----------
            zs = zone_summary.get(zone_id)
            if zs is None:
                zone_summary[zone_id] = {
                    "zone_name": zone_name,
                    "max_density_people_m2": density_people_m2,
                    "max_risk_score_100": risk_score_100,
                }
            else:
                if density_people_m2 > zs["max_density_people_m2"]:
                    zs["max_density_people_m2"] = density_people_m2
                if risk_score_100 > zs["max_risk_score_100"]:
                    zs["max_risk_score_100"] = risk_score_100

        # ----------------- PER-FRAME EXITS / ELBS -----------------
        exits_data = []
        for e in exits_raw:
            cap = e.get("capacity")
            if cap is None:
                # fallback capacity if not provided (still based on real counts)
                cap = max(e.get("approaching_count", 0), 1)

            exits_data.append(
                {
                    "exit_id": e["exit_id"],
                    "approaching_count": e["approaching_count"],
                    "capacity": cap,
                    "current_flow_rate": e["current_flow_rate"],
                    "bottleneck_factor": e["bottleneck_factor"],
                }
            )

        elbs_result = compute_elbs(exits_data)

        # ---------- ANALYTICS METRICS: ONE PER FRAME ----------
        if zone_results_for_frame:
            avg_cpi = (
                sum(zr["cpi"]["cpi_0_100"] for zr in zone_results_for_frame.values())
                / len(zone_results_for_frame)
            )
            avg_density_people = (
                sum(zr["density_people_m2"] for zr in zone_results_for_frame.values())
                / len(zone_results_for_frame)
            )
        else:
            avg_cpi = 0.0
            avg_density_people = 0.0

        analytics_metrics.append(
            {
                "timestamp": timestamp_iso,
                "cpi": avg_cpi,
                "density": int(avg_density_people * 100),
                "elbs": elbs_result["overall_elbs_0_100"],
            }
        )

        # ---------- SAVE SNAPSHOT FOR LAST FRAME ----------
        if frame_id == last_frame_index:
            last_frame_zone_results = zone_results_for_frame
            last_frame_timestamp_iso = timestamp_iso
            last_frame_elbs_result = elbs_result
            last_frame_exits_raw = exits_raw

    # If there were no alerts at all in entire video, create one low-info event
    if not timeline_events and frames_sorted:
        latest_ts_hhmmss = iso_to_hhmmss(frames_sorted[-1]["timestamp"])
        timeline_events.append(
            {
                "time": latest_ts_hhmmss,
                "message": "No critical events",
                "severity": "LOW",
            }
        )

    # ---------------------------------------------------
    # 3. BUILD JSON PAYLOADS FOR MEMBER3
    # ---------------------------------------------------

    # -------- /zones  (SUMMARY over ALL FRAMES per zone) --------
    zones_payload = {"zones": []}

    # deterministic ordering by zone_id
    for idx, zone_id in enumerate(sorted(zone_summary.keys()), start=1):
        zs = zone_summary[zone_id]
        zone_name = zs["zone_name"]
        max_density_people_m2 = zs["max_density_people_m2"]
        max_risk_score_100 = zs["max_risk_score_100"]

        density_ui_value = int(max_density_people_m2 * 100)
        risk_word = risk_score_to_word(max_risk_score_100)

        zones_payload["zones"].append(
            {
                "id": idx,
                "name": zone_name,
                "density": density_ui_value,
                "risk": risk_word,
                # Member2 doesn’t send coordinates → keep null (unknown, not dummy)
                "coordinates": None,
            }
        )

    with open("zones.json", "w") as f:
        json.dump(zones_payload, f, indent=2)

    # -------- /alerts  (ALL alerts over ALL frames) --------
    alerts_payload = {"alerts": all_alerts}
    with open("alerts.json", "w") as f:
        json.dump(alerts_payload, f, indent=2)

    # -------- /analytics  (full time series + last-frame zone insights) --------
    analytics_payload = {
        "metrics": analytics_metrics,   # length ~= number of frames
        "zoneInsights": [],
    }

    if last_frame_zone_results and last_frame_elbs_result:
        for zone_id, zr in last_frame_zone_results.items():
            meta = zr["meta"]
            analytics_payload["zoneInsights"].append(
                {
                    "zone": meta["zone_name"],
                    "cpi": zr["cpi"]["cpi_0_100"],
                    "elbs": last_frame_elbs_result["overall_elbs_0_100"],
                    "risk": zr["risk"]["risk_score"],
                }
            )

    with open("analytics.json", "w") as f:
        json.dump(analytics_payload, f, indent=2)

    # -------- /playback  (full history) --------
    playback_payload = {
        "history": playback_history,       # one entry per frame per zone
        "timelineEvents": timeline_events  # all alert moments
    }

    with open("playback.json", "w") as f:
        json.dump(playback_payload, f, indent=2)

    # -------- /safeRoute  (at *worst* moment in video) --------
    if safe_route_frame_zone_results is not None:
        # zone with highest risk at worst frame
        worst_zone_id, worst_zr = max(
            safe_route_frame_zone_results.items(),
            key=lambda item: item[1]["risk"]["risk_score"],
        )
        worst_zone_name = worst_zr["meta"]["zone_name"]

        # riskLevel based on numeric risk score (0–100), NOT just color
        worst_score = worst_zr["risk"]["risk_score"]
        risk_level_word = risk_score_to_word(worst_score).upper()

        # find a safer zone at that frame (if any) to act as "via"
        other_zones = [
            (zid, zr)
            for zid, zr in safe_route_frame_zone_results.items()
            if zid != worst_zone_id
        ]
        via_zone_name = None
        if other_zones:
            # pick the lowest-risk zone at that frame
            via_zone_id, via_zr = min(
                other_zones,
                key=lambda item: item[1]["risk"]["risk_score"],
            )
            via_zone_name = via_zr["meta"]["zone_name"]
    else:
        worst_zone_name = "Unknown Zone"
        risk_level_word = "UNKNOWN"
        via_zone_name = None

    # compute ELBS again for that frame’s exits (for "to")
    if safe_route_frame_exits_raw is not None:
        exits_data_sr = []
        for e in safe_route_frame_exits_raw:
            cap = e.get("capacity")
            if cap is None:
                cap = max(e.get("approaching_count", 0), 1)
            exits_data_sr.append(
                {
                    "exit_id": e["exit_id"],
                    "approaching_count": e["approaching_count"],
                    "capacity": cap,
                    "current_flow_rate": e["current_flow_rate"],
                    "bottleneck_factor": e["bottleneck_factor"],
                }
            )
        safe_route_frame_elbs_result = compute_elbs(exits_data_sr)
    else:
        safe_route_frame_elbs_result = None

    # best exit = lowest load_ratio
    if safe_route_frame_elbs_result and safe_route_frame_elbs_result["exit_scores"]:
        best_exit = min(
            safe_route_frame_elbs_result["exit_scores"],
            key=lambda es: es["load_ratio"],
        )
        best_exit_id = best_exit["exit_id"]
        exit_name_map = {
            e["exit_id"]: e["exit_name"] for e in (safe_route_frame_exits_raw or [])
        }
        best_exit_name = exit_name_map.get(best_exit_id, best_exit_id)
    else:
        best_exit_name = "Unknown Exit"

    # Build path: from -> (optional via zone) -> exit
    path = [worst_zone_name]
    if via_zone_name and via_zone_name != worst_zone_name:
        path.append(via_zone_name)
    path.append(best_exit_name)

    safe_route_payload = {
        "safeRoute": {
            "from": worst_zone_name,
            "to": best_exit_name,
            "path": path,
            "riskLevel": risk_level_word,
        }
    }

    with open("safeRoute.json", "w") as f:
        json.dump(safe_route_payload, f, indent=2)

    print("All 5 JSON files generated using ALL frames (no dummy values).")
