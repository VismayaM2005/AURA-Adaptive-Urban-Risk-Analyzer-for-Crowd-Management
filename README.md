# AURA — Adaptive Urban Risk Analyzer for Crowd Management

Real-time AI system for crowd safety monitoring and stampede prevention 
at large public gatherings. Processes live video to compute zone-level 
risk scores and dynamically recalculates safe evacuation routes every frame.

## Key Technical Highlights
- Real-time crowd analysis at ~25–30 FPS using optical flow + contour analytics
- Custom risk metrics: Crowd Pressure Index (CPI), Risk Score (0–100), 
  Exit Load Balance Score (ELBS)
- Zone classification: Safe / Warning / Critical updated per frame
- Dynamic evacuation routing prioritizing safety over shortest path
- Admin dashboard with live heatmaps, alerts, and playback
  
This repository contains the the AURA project, with the three main functional modules included:

- `aura-admin/` — Admin dashboard UI built with React and Vite, plus the Express backend for data services and alerts
- `AURA_core_intelligence/` — Crowd risk analytics engine, alert generation, and safe-route analysis logic
- `AURA_Video_Module/` — Video-based crowd sensing and metrics extraction pipeline using OpenCV and analytics scripts


## Project overview

AURA is designed to support adaptive crowd management in urban environments by combining:

- real-time or recorded crowd video analysis
- zone-level crowd density and movement metrics
- risk scoring and event detection
- admin dashboards for alert visualization, analytics, and recommended routes

The project is built as a modular package that separates the video analytics pipeline, the core intelligence engine, and the web admin interface.

## Module breakdown

### `aura-admin/`

This module contains the web application and backend API.

- Frontend: React + Vite
- Backend: Node.js + Express
- Features:
  - Dashboard and analytics pages
  - Incident timeline and alert center
  - Approved routes and safe-route recommendations
  - Playback view and zone status visualization

### `AURA_core_intelligence/`

This module contains the core risk calculation and event-processing logic.

- `risk_engine.py` — risk and CPI computation functions
- `member1_demo.py` — analytics aggregation, alert generation, playback history generation, and safe-route analysis
- JSON fixtures for alerts, analytics, playback, safe routes, and zones
- Optional sync script: `sync_to_backend.ps1`

### `AURA_Video_Module/`

This module contains the video analytics pipeline that extracts crowd metrics from video.

- `scripts/detect_crowd.py` — crowd density detection using background subtraction and contour analysis
- `scripts/extract_speed.py` — optical flow-based speed extraction from video frames
- `scripts/generate_risk.py` — risk metrics assembly from crowd and speed outputs
- `scripts/process_metrics.py` — combine metrics into a full JSON timeline for core intelligence
- `scripts/run_pipeline.py` — orchestrates the pipeline steps
- `scripts/send_metrics.py` — optional backend delivery of metrics
- `zones_config.json` — zone definitions used by the video analytics pipeline

## Setup instructions

### 1. Install Node dependencies

```bash
cd aura-admin
npm install
cd backend
npm install
```

### 2. Install Python dependencies

```bash
cd ..\AURA_Video_Module
pip install -r ..\requirements.txt
```

### 3. Run the admin app

From the `aura-admin` folder:

```bash
npm run dev
```

For the backend in a separate terminal:

```bash
cd aura-admin/backend
npm run dev
```

### 4. Run the video analytics pipeline

From `AURA_Video_Module`:

```bash
python scripts/run_pipeline.py --video path/to/video.mp4
````
