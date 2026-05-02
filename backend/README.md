# Trace Backend

FastAPI + Manim rendering server. Runs in Docker via WSL.

## Prerequisites

- Docker Desktop with WSL2 backend  
- WSL2 (Ubuntu recommended)

## Quick Start

```bash
# From this directory (inside WSL or Windows with Docker Desktop):
docker compose up --build
```

The API will be available at `http://localhost:8000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/zip` | Bundle `.py` + `.svg` into a `.zip` (no rendering) |
| `POST` | `/render` | Queue a Manim render → returns `{job_id}` |
| `GET` | `/jobs/{id}` | Poll job status + progress |
| `GET` | `/jobs/{id}/download` | Download the rendered video |

## Render Quality Flags

| UI Label | `quality` param | Resolution |
|----------|-----------------|------------|
| 720p | `m` | 1280×720 |
| 1080p | `h` | 1920×1080 |
| 4K | `k` | 3840×2160 |

## Notes

- This is a single-user local tool — job state is stored in memory and resets on restart.  
- Rendered files are stored in a Docker volume (`trace_jobs`) and survive restarts.  
- CORS is open (`*`) since this only runs on localhost.
