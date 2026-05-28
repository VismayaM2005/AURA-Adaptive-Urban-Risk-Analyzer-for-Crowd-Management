# AURA

This folder contains the minimal files required to upload the selected AURA modules:

- `aura-admin/` — React/Vite frontend and Express backend for the admin dashboard
- `AURA_core_intelligence/` — Python risk engine and analytics helper files
- `AURA_Video_Module/` — Python video analytics scripts and configuration

## Included content

### aura-admin
- `package.json`, `package-lock.json`
- `src/`, `public/`
- `backend/` with server code, routes, and data files

### AURA_core_intelligence
- `risk_engine.py`
- `member1_demo.py`
- JSON config/data files
- optional `sync_to_backend.ps1`

### AURA_Video_Module
- `scripts/`
- `zones_config.json`

## Excluded content

- `node_modules/`
- `venv/`
- `backend/.env`
- `backend/aura.db`
- generated output directories: `output/`, `outputs/`
- large files such as video test assets and weight files (`*.pt`)

## Setup

### 1. Install Node.js dependencies

```bash
cd aura-admin
npm install
cd backend
npm install
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the app

- Admin frontend: `npm run dev` from `aura-admin`
- Admin backend: `npm run dev` from `aura-admin/backend`

### 4. Run video analytics

```bash
cd AURA_Video_Module
python scripts/run_pipeline.py --video path/to/video.mp4
```

> Make sure `AURA_Video_Module/zones_config.json` is present and your video file exists.
