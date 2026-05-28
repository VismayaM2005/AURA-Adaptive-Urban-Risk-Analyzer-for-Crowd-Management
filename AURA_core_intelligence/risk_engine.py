import heapq

# Smoothing + spike detection settings
ALPHA_SMOOTHING = 0.6        # between 0 and 1, higher = more reactive
SPIKE_THRESHOLD = 0.25       # difference between new risk and previous smoothed risk
SPIKE_MIN_BASE_RISK = 0.6    # only consider spikes if base risk itself is high
CPI_ALPHA_SMOOTHING = 0.7   # separate smoothing factor for CPI




def clamp(x, lo=0.0, hi=1.0):
    """Clamp value to [lo, hi]."""
    return max(lo, min(hi, x))

def huddle_level_penalty(level: str) -> float:
    level = (level or "").upper()
    if level == "NONE":
        return 0.0
    if level == "MILD":
        return 0.4
    if level == "ELEVATED":
        return 0.7
    if level == "SEVERE":
        return 1.0
    return 0.0  # default


def panic_level_penalty(level: str) -> float:
    level = (level or "").upper()
    if level == "NORMAL":
        return 0.0
    if level == "MILD":
        return 0.3
    if level == "ELEVATED":
        return 0.7
    if level == "SEVERE":
        return 1.0
    return 0.0  # default


def zone_color_penalty(color: str) -> float:
    color = (color or "").upper()
    if color == "GREEN":
        return 0.0
    if color == "YELLOW":
        return 0.3
    if color == "ORANGE":
        return 0.6
    if color == "RED":
        return 1.0
    return 0.0  # default



def compute_risk_step(prev_risk_smooth,
                      density,
                      speed,
                      direction_conflict,
                      surge,
                      bottleneck):
    """
    Advanced version:
    - computes base_risk from current metrics
    - applies time-based smoothing using previous smoothed risk
    - detects sudden spikes
    - returns a dict with detailed info
    """

    # -----------------------------
    # 1. NORMALIZE INPUTS TO 0–1
    # -----------------------------

    density_score = clamp(density / 6.0)

    normal_speed = 1.3
    speed_drop_raw = (normal_speed - speed) / normal_speed
    speed_drop_score = clamp(speed_drop_raw)

    direction_conflict_score = clamp(direction_conflict)
    surge_score = clamp(surge)
    bottleneck_score = clamp(bottleneck)

    # -----------------------------
    # 2. COMPONENTS
    # -----------------------------

    pressure_component = density_score
    flow_instability = 0.6 * speed_drop_score + 0.4 * direction_conflict_score
    structural_risk = 0.5 * surge_score + 0.5 * bottleneck_score

    # -----------------------------
    # 3. BASE RISK (0–1)
    # -----------------------------

    W_PRESSURE = 0.45
    W_FLOW = 0.30
    W_STRUCT = 0.25

    base_risk = (
        W_PRESSURE * pressure_component +
        W_FLOW * flow_instability +
        W_STRUCT * structural_risk
    )

    base_risk = clamp(base_risk, 0.0, 1.0)

    # -----------------------------
    # 4. TIME-BASED SMOOTHING
    # -----------------------------

    risk_smooth = (
        ALPHA_SMOOTHING * base_risk +
        (1.0 - ALPHA_SMOOTHING) * prev_risk_smooth
    )

    # -----------------------------
    # 5. SPIKE DETECTION
    # -----------------------------

    delta = base_risk - prev_risk_smooth
    is_spike = (delta >= SPIKE_THRESHOLD) and (base_risk >= SPIKE_MIN_BASE_RISK)

    # -----------------------------
    # 6. SCALE TO 0–100
    # -----------------------------

    risk_score = risk_smooth * 100.0

    # -----------------------------
    # 7. BUILD RESULT
    # -----------------------------

    return {
        "risk_score": risk_score,           # smoothed 0–100
        "risk_smooth": risk_smooth,         # 0–1, feed this into next step
        "base_risk": base_risk,             # current raw risk 0–1
        "is_spike": is_spike,
        "components": {
            "pressure_component": pressure_component,
            "flow_instability": flow_instability,
            "structural_risk": structural_risk,
            "density_score": density_score,
            "speed_drop_score": speed_drop_score,
            "direction_conflict_score": direction_conflict_score,
            "surge_score": surge_score,
            "bottleneck_score": bottleneck_score,
        }
    }

def compute_cpi_step(prev_cpi_smooth,
                     density,
                     speed,
                     direction_conflict,
                     surge,
                     bottleneck):
    """
    Crowd Pressure Index (CPI)

    Concept:
        CPI = density * relative_speed_change * compression_effect

    - density: people per m^2
    - speed: m/s
    - direction_conflict: 0–1
    - surge: 0–1
    - bottleneck: 0–1

    Returns:
        dict with:
            cpi          : smoothed CPI in [0,1]
            cpi_0_100    : CPI in [0,100]
            level        : LOW / MEDIUM / HIGH / CRITICAL
            raw_cpi      : current unsmoothed CPI
            components   : debug breakdown
    """

    # 1. Normalize basics (reuse same logic style as risk engine)
    density_score = clamp(density / 6.0)

    normal_speed = 1.3
    speed_drop_raw = (normal_speed - speed) / normal_speed
    speed_drop_score = clamp(speed_drop_raw)

    direction_conflict_score = clamp(direction_conflict)
    surge_score = clamp(surge)
    bottleneck_score = clamp(bottleneck)

    # 2. Relative speed change (captures stall + opposing flows)
    #    We combine speed drop + direction conflict
    relative_speed_change = 0.5 * speed_drop_score + 0.5 * direction_conflict_score

    # 3. Compression factor from surge + bottlenecks
    compression_factor = 0.5 * surge_score + 0.5 * bottleneck_score

    # Make compression effect at least 0.5 so CPI is not zero when compression is low
    compression_effect = 0.5 + 0.5 * compression_factor  # in [0.5, 1.0]

    # 4. Raw CPI (0–1)
    raw_cpi = density_score * relative_speed_change * compression_effect
    raw_cpi = clamp(raw_cpi, 0.0, 1.0)

    # 5. Smooth CPI over time
    cpi_smooth = (
        CPI_ALPHA_SMOOTHING * raw_cpi +
        (1.0 - CPI_ALPHA_SMOOTHING) * prev_cpi_smooth
    )

    # 6. Convert to 0–100 scale
    cpi_0_100 = cpi_smooth * 100.0

    # 7. Classify level based on CPI
    if cpi_smooth < 0.3:
        level = "LOW"
    elif cpi_smooth < 0.6:
        level = "MEDIUM"
    elif cpi_smooth < 0.8:
        level = "HIGH"
    else:
        level = "CRITICAL"

    return {
        "cpi": cpi_smooth,
        "cpi_0_100": cpi_0_100,
        "level": level,
        "raw_cpi": raw_cpi,
        "components": {
            "density_score": density_score,
            "speed_drop_score": speed_drop_score,
            "direction_conflict_score": direction_conflict_score,
            "relative_speed_change": relative_speed_change,
            "surge_score": surge_score,
            "bottleneck_score": bottleneck_score,
            "compression_factor": compression_factor,
            "compression_effect": compression_effect,
        },
    }

def classify_zone(risk_result, cpi_result):
    """
    Classify zone into Green / Yellow / Orange / Red
    based on combined risk and CPI.

    Inputs:
        risk_result: dict from compute_risk_step(...)
        cpi_result : dict from compute_cpi_step(...)

    Returns:
        dict with:
            status_color: "GREEN" / "YELLOW" / "ORANGE" / "RED"
            status_label: human-friendly string
            combined_score_0_100: numeric combined score (0–100)
    """

    # Normalize risk and CPI to 0–1
    risk_norm = risk_result["risk_score"] / 100.0      # already smoothed
    cpi_norm = cpi_result["cpi_0_100"] / 100.0         # already smoothed

    # Weighted combination: risk slightly more important than CPI
    combined = 0.6 * risk_norm + 0.4 * cpi_norm

    # Basic classification thresholds
    if combined < 0.25:
        status_color = "GREEN"
        status_label = "Safe"
    elif combined < 0.5:
        status_color = "YELLOW"
        status_label = "Crowded"
    elif combined < 0.75:
        status_color = "ORANGE"
        status_label = "High Pressure"
    else:
        status_color = "RED"
        status_label = "Critical"

    # Optional: auto-escalate if CPI says CRITICAL
    if cpi_result["level"] == "CRITICAL" and status_color != "RED":
        status_color = "RED"
        status_label = "Critical (Pressure)"

    # Optional: if spike detected, bump at least to ORANGE
    if risk_result["is_spike"] and status_color == "YELLOW":
        status_color = "ORANGE"
        status_label = "High Pressure (Spike)"

    return {
        "status_color": status_color,
        "status_label": status_label,
        "combined_score_0_100": combined * 100.0,
    }

def detect_surge_and_panic(prev_speed,
                           curr_speed,
                           direction_conflict,
                           surge,
                           risk_result):
    """
    Detect surge & panic-like movement patterns in a zone.

    Inputs:
        prev_speed          : previous avg speed (m/s)
        curr_speed          : current avg speed (m/s)
        direction_conflict  : 0–1
        surge               : 0–1
        risk_result         : dict from compute_risk_step(...)

    Returns:
        dict with:
            is_forward_surge
            is_speed_spike
            is_direction_chaos
            is_panic_like
            panic_level
    """

    # 1. Speed change
    speed_delta = curr_speed - prev_speed

    # Forward surge: people suddenly moving faster forward + surge high
    is_forward_surge = (speed_delta > 0.4) and (surge > 0.6)

    # Speed spike: any big jump in speed (even if surge not super high)
    is_speed_spike = speed_delta > 0.5

    # Direction chaos: too many people moving against each other
    is_direction_chaos = direction_conflict > 0.75

    # Risk spike already computed by risk engine
    is_risk_spike = risk_result.get("is_spike", False)

    # 2. Decide panic-like behaviour
    # Panic if multiple anomaly signals + high risk
    high_risk = risk_result["risk_score"] >= 60.0

    anomaly_count = sum([
        1 if is_forward_surge else 0,
        1 if is_speed_spike else 0,
        1 if is_direction_chaos else 0,
        1 if is_risk_spike else 0,
    ])

    if high_risk and anomaly_count >= 3:
        is_panic_like = True
        panic_level = "SEVERE"
    elif high_risk and anomaly_count >= 2:
        is_panic_like = True
        panic_level = "ELEVATED"
    elif anomaly_count >= 2:
        is_panic_like = True
        panic_level = "MILD"
    else:
        is_panic_like = False
        panic_level = "NORMAL"

    return {
        "is_forward_surge": is_forward_surge,
        "is_speed_spike": is_speed_spike,
        "is_direction_chaos": is_direction_chaos,
        "is_panic_like": is_panic_like,
        "panic_level": panic_level,
        "speed_delta": speed_delta,
        "anomaly_count": anomaly_count,
    }

def detect_huddle(prev_density,
                  curr_density,
                  speed,
                  swirl_index,
                  risk_result):
    """
    Detect abnormal huddle / clumping behavior in a zone.

    Inputs:
        prev_density : previous density (people per m^2)
        curr_density : current density (people per m^2)
        speed        : current avg speed (m/s)
        swirl_index  : 0–1, how much circular/rotational pattern is detected
        risk_result  : dict from compute_risk_step(...)

    Returns:
        dict with:
            is_huddle
            huddle_level
            density_delta
            signals_used
    """

    density_delta = curr_density - prev_density

    # Conditions for huddle
    high_density = curr_density >= 4.0           # crowded
    very_high_density = curr_density >= 6.0      # extreme
    fast_density_rise = density_delta >= 1.5     # people piling in quickly
    very_low_speed = speed <= 0.3                # almost stationary
    high_swirl = swirl_index >= 0.6              # strong circular motion

    high_risk = risk_result["risk_score"] >= 60.0

    # Count how many huddle-like signals are active
    signals = {
        "high_density": high_density,
        "very_high_density": very_high_density,
        "fast_density_rise": fast_density_rise,
        "very_low_speed": very_low_speed,
        "high_swirl": high_swirl,
        "high_risk": high_risk,
    }

    active_signals = sum(1 for v in signals.values() if v)

    # Decide huddle level based on active signals
    if active_signals >= 4 and very_high_density and very_low_speed:
        is_huddle = True
        huddle_level = "SEVERE"
    elif active_signals >= 3 and high_density and very_low_speed:
        is_huddle = True
        huddle_level = "ELEVATED"
    elif active_signals >= 2 and high_density:
        is_huddle = True
        huddle_level = "MILD"
    else:
        is_huddle = False
        huddle_level = "NONE"

    return {
        "is_huddle": is_huddle,
        "huddle_level": huddle_level,
        "density_delta": density_delta,
        "active_signals": active_signals,
        "signals_used": signals,
    }

def compute_elbs(exits):
    """
    Exit Load Balance Score (ELBS)

    Inputs:
        exits: list of dicts, each like:
            {
                "exit_id": str,
                "approaching_count": float,   # people heading towards this exit
                "capacity": float,            # safe throughput (people per minute)
                "current_flow_rate": float,   # actual people per minute exiting
                "bottleneck_factor": float,   # 0–1 (0 = no bottleneck, 1 = severe)
            }

    Returns:
        dict with:
            overall_elbs_0_100
            imbalance_index
            exit_scores: list of per-exit dicts
    """

    exit_scores = []

    if not exits:
        return {
            "overall_elbs_0_100": 0.0,
            "imbalance_index": 0.0,
            "exit_scores": [],
        }

    load_ratios = []

    for ex in exits:
        exit_id = ex["exit_id"]
        approaching = float(ex.get("approaching_count", 0.0))
        capacity = float(ex.get("capacity", 1.0))  # avoid division by zero
        flow = float(ex.get("current_flow_rate", 0.0))
        bottleneck = clamp(float(ex.get("bottleneck_factor", 0.0)), 0.0, 1.0)

        # 1. How loaded is this exit compared to its capacity?
        #    load_ratio = 1 means at capacity, >1 means overloaded.
        load_ratio = approaching / capacity
        load_ratios.append(load_ratio)

        # Normalize to [0,1] but allow some over-cap (cap at 2x)
        pressure = clamp(load_ratio / 2.0)  # 0 when empty, 1 when >= 2x capacity

        # 2. Queue build-up: if many approaching but few exiting
        #    queue_ratio = (approaching - flow) / capacity
        queue_ratio = (approaching - flow) / capacity
        queue_building = clamp(queue_ratio / 2.0)  # again clamp; higher = worse

        # 3. Structural risk from bottlenecks
        structural = bottleneck

        # 4. Combine into exit ELBS (0–1)
        #    Weights: pressure more important than queue, then structural
        elbs_norm = (
            0.5 * pressure +
            0.3 * queue_building +
            0.2 * structural
        )
        elbs_norm = clamp(elbs_norm, 0.0, 1.0)

        elbs_0_100 = elbs_norm * 100.0

        # 5. Status label
        if elbs_norm < 0.4:
            status = "NORMAL"
        elif elbs_norm < 0.7:
            status = "BUSY"
        else:
            status = "OVERLOADED"

        exit_scores.append({
            "exit_id": exit_id,
            "elbs_0_100": elbs_0_100,
            "status": status,
            "pressure": pressure,
            "queue_building": queue_building,
            "structural": structural,
            "load_ratio": load_ratio,
            "approaching_count": approaching,
            "capacity": capacity,
            "current_flow_rate": flow,
        })

    # 6. Overall ELBS = worst exit
    overall_elbs_0_100 = max(es["elbs_0_100"] for es in exit_scores)

    # 7. Imbalance index: how uneven are the exits?
    #    simple: (max_load - min_load) / max_load  in [0,1]
    max_load = max(load_ratios)
    min_load = min(load_ratios)
    if max_load > 0:
        imbalance_index = (max_load - min_load) / max_load
    else:
        imbalance_index = 0.0

    return {
        "overall_elbs_0_100": overall_elbs_0_100,
        "imbalance_index": imbalance_index,
        "exit_scores": exit_scores,
    }

def compute_zone_safety_cost(risk_score_0_100: float,
                             cpi_0_100: float,
                             huddle_level: str,
                             panic_level: str,
                             zone_color: str) -> dict:
    """
    Compute a single safety cost for a zone using multiple metrics.

    Inputs:
        risk_score_0_100 : from risk engine
        cpi_0_100        : from CPI
        huddle_level     : NONE / MILD / ELEVATED / SEVERE
        panic_level      : NORMAL / MILD / ELEVATED / SEVERE
        zone_color       : GREEN / YELLOW / ORANGE / RED

    Returns:
        dict:
            cost: float in [0,1]
            components: breakdown
    """

    risk_norm = clamp(risk_score_0_100 / 100.0)
    cpi_norm = clamp(cpi_0_100 / 100.0)

    h_pen = huddle_level_penalty(huddle_level)
    p_pen = panic_level_penalty(panic_level)
    c_pen = zone_color_penalty(zone_color)

    # Weights (tuneable)
    W_RISK = 0.35
    W_CPI = 0.25
    W_HUDDLE = 0.15
    W_PANIC = 0.15
    W_COLOR = 0.10

    cost = (
        W_RISK * risk_norm +
        W_CPI * cpi_norm +
        W_HUDDLE * h_pen +
        W_PANIC * p_pen +
        W_COLOR * c_pen
    )

    cost = clamp(cost, 0.0, 1.0)

    return {
        "cost": cost,
        "components": {
            "risk_norm": risk_norm,
            "cpi_norm": cpi_norm,
            "huddle_penalty": h_pen,
            "panic_penalty": p_pen,
            "color_penalty": c_pen,
        }
    }

def compute_safe_route_greedy_multi(start_zone: str,
                                    safe_zones: list,
                                    neighbors: dict,
                                    zone_cost: dict,
                                    high_cost_block: float = 0.85,
                                    dist_weight: float = 0.2,
                                    max_steps: int = 50) -> dict:
    """
    AURA Greedy SafeRoute (Multi-Metric Version)

    Uses a precomputed zone_cost[z] in [0,1] that already combines:
      - risk score
      - CPI
      - huddle level
      - panic level
      - zone color

    At each step:
      - pick neighbor with minimum ( (1 - dist_weight)*zone_cost + dist_weight*distance_penalty )
      - avoid neighbors with zone_cost >= high_cost_block (unless they are safe_zones)
      - avoid loops via visited set

    Inputs:
        start_zone     : current zone id
        safe_zones     : list of zone ids considered safe targets
        neighbors      : dict[zone] -> list of neighbors or list[(neighbor, dist)]
        zone_cost      : dict[zone] -> cost in [0,1]
        high_cost_block: threshold above which zones are treated as blocked
        dist_weight    : how much to care about distance vs safety (0..1)
        max_steps      : safety limit on path length

    Returns:
        dict:
            path         : list of zones
            reached_safe : bool
            reason       : str
    """

    safe_set = set(safe_zones)

    # If already in safe zone
    if start_zone in safe_set:
        return {
            "path": [start_zone],
            "reached_safe": True,
            "reason": "Already in safe zone",
        }

    current = start_zone
    path = [current]
    visited = {current}

    for _ in range(max_steps):
        if current in safe_set:
            return {
                "path": path,
                "reached_safe": True,
                "reason": "Reached safe zone",
            }

        nbrs_raw = neighbors.get(current, [])
        normalized_neighbors = []
        for item in nbrs_raw:
            if isinstance(item, (tuple, list)):
                nbr, dist = item
            else:
                nbr, dist = item, 1.0
            normalized_neighbors.append((nbr, dist))

        if not normalized_neighbors:
            return {
                "path": path,
                "reached_safe": False,
                "reason": "No neighbors from current zone",
            }

        best_nbr = None
        best_score = float("inf")

        for (nbr, dist) in normalized_neighbors:
            if nbr in visited:
                continue

            c = float(zone_cost.get(nbr, 0.0))

            # Hard block very dangerous zones (unless they are explicitly safe targets)
            if nbr not in safe_set and c >= high_cost_block:
                continue

            # Normalize distance penalty (we treat each hop as ~1)
            distance_penalty = float(dist)

            # Safety-first score: mostly cost, small distance influence
            score = (1.0 - dist_weight) * c + dist_weight * distance_penalty

            if score < best_score:
                best_score = score
                best_nbr = nbr

        if best_nbr is None:
            return {
                "path": path,
                "reached_safe": False,
                "reason": "No acceptable neighbor (too dangerous or visited)",
            }

        current = best_nbr
        path.append(current)
        visited.add(current)

    return {
        "path": path,
        "reached_safe": current in safe_set,
        "reason": "Max steps reached",
    }

def compute_redistribution_recommendations(zones,
                                           elbs_result,
                                           high_risk_threshold: float = 60.0,
                                           max_redirect_fraction: float = 0.4):
    """
    Generate crowd redistribution & exit recommendations based on:
      - zone risk & status
      - huddle & panic levels
      - ELBS (exit load balance)

    Inputs:
        zones: list of dicts, each:
            {
                "zone_id": str,
                "risk_score": float,      # 0–100
                "status_color": str,      # GREEN/YELLOW/ORANGE/RED
                "huddle_level": str,      # NONE/MILD/ELEVATED/SEVERE
                "panic_level": str,       # NORMAL/MILD/ELEVATED/SEVERE
                "population": int,
                "nearest_exits": list[str]
            }

        elbs_result: dict from compute_elbs(...)
        high_risk_threshold: risk_score above which zones are considered high-risk
        max_redirect_fraction: fraction of population to suggest for redirection

    Returns:
        dict:
            zone_actions: list of dicts (redistribution suggestions)
            exit_actions: list of dicts (exit-level suggestions)
    """

    exit_scores = elbs_result.get("exit_scores", [])

    # Identify underused and overloaded exits
    underused_exits = [
        e for e in exit_scores
        if e["status"] == "NORMAL" and e["load_ratio"] < 1.0
    ]
    overloaded_exits = [
        e for e in exit_scores
        if e["status"] == "OVERLOADED" or e["load_ratio"] > 1.2
    ]

    # Helper: pick best exit from a list of candidate ids
    def pick_best_exit(exit_ids):
        candidates = [e for e in exit_scores if e["exit_id"] in exit_ids]
        if not candidates:
            return None

        # Prefer NORMAL with low ELBS, then BUSY, etc.
        candidates.sort(key=lambda e: (0 if e["status"] == "NORMAL" else 1,
                                       e["elbs_0_100"]))
        return candidates[0]

    # Identify high-risk zones and relief zones
    high_zones = []
    relief_zones = []

    for z in zones:
        risk = z["risk_score"]
        color = (z["status_color"] or "").upper()
        huddle = (z["huddle_level"] or "").upper()
        panic = (z["panic_level"] or "").upper()

        is_high = (
            risk >= high_risk_threshold or
            color in ("ORANGE", "RED") or
            huddle in ("ELEVATED", "SEVERE") or
            panic in ("ELEVATED", "SEVERE")
        )

        if is_high:
            high_zones.append(z)
        else:
            # Relief candidates: GREEN or low-YELLOW
            if color == "GREEN" or (color == "YELLOW" and risk < 50.0):
                relief_zones.append(z)

    # Sort relief zones by safety (lower risk preferred)
    relief_zones.sort(key=lambda z: z["risk_score"])

    zone_actions = []

    for hz in high_zones:
        hz_id = hz["zone_id"]
        pop = hz["population"]
        color = hz["status_color"]
        risk = hz["risk_score"]
        huddle = hz["huddle_level"]
        panic = hz["panic_level"]

        # How many people to suggest moving (e.g. 40% of zone population)
        redirect_count = max(10, int(pop * max_redirect_fraction))

        # Pick safest relief zone (if any)
        relief = relief_zones[0] if relief_zones else None

        # Pick best exit among nearest exits for this zone
        nearest_exits = hz.get("nearest_exits", [])
        best_exit = pick_best_exit(nearest_exits)

        # Build a human-readable message
        msg_parts = []

        msg_parts.append(
            f"Zone {hz_id} is {color} with risk {risk:.0f}, "
            f"huddle={huddle}, panic={panic}, population≈{pop}."
        )

        if relief:
            msg_parts.append(
                f"Recommend redirecting ≈{redirect_count} people towards safer Zone "
                f"{relief['zone_id']} (risk {relief['risk_score']:.0f}, color {relief['status_color']})."
            )
        else:
            msg_parts.append(
                "No clearly safer relief zone available in the current snapshot."
            )

        if best_exit:
            msg_parts.append(
                f"Prefer Exit {best_exit['exit_id']} (status={best_exit['status']}, "
                f"ELBS≈{best_exit['elbs_0_100']:.0f}) for outflow from this zone."
            )

        zone_actions.append({
            "zone_id": hz_id,
            "redirect_count": redirect_count,
            "relief_zone": relief["zone_id"] if relief else None,
            "preferred_exit": best_exit["exit_id"] if best_exit else None,
            "message": " ".join(msg_parts),
        })

    exit_actions = []

    # Exit-specific recommendations: slow inflow or promote underused exits
    for ex in overloaded_exits:
        exit_actions.append({
            "exit_id": ex["exit_id"],
            "type": "LIMIT_INFLOW",
            "message": (
                f"Exit {ex['exit_id']} is overloaded (load_ratio={ex['load_ratio']:.2f}, "
                f"ELBS={ex['elbs_0_100']:.0f}). Suggest slowing inflow and redirecting "
                "new arrivals to underused exits where possible."
            ),
        })

    for ex in underused_exits:
        exit_actions.append({
            "exit_id": ex["exit_id"],
            "type": "PROMOTE_EXIT",
            "message": (
                f"Exit {ex['exit_id']} is underused (load_ratio={ex['load_ratio']:.2f}, "
                f"ELBS={ex['elbs_0_100']:.0f}). Recommend routing additional crowd "
                "towards this exit."
            ),
        })

    return {
        "zone_actions": zone_actions,
        "exit_actions": exit_actions,
    }

