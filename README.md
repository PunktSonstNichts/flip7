# Flip 7 Punkte

Offline-first score tracker for Flip 7. Vue 3 PWA on the table, Python/FastAPI + SQLite for shareable URLs and later analysis.

## Development

Start the API, then the frontend (Vite proxies `/api` to port 7777).

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 7777
```

```bash
cd frontend
npm install
npm run dev
```

Scoring tests:

```bash
cd frontend && npm test
```

## Production

```bash
cd frontend && npm run build
cd ../backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 7777
```

FastAPI serves `frontend/dist` and `/api/games`. Games created offline keep their URL and sync when the connection returns.
