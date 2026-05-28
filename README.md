# AURA

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
