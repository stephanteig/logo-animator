"""
Trace Backend — FastAPI server for Manim rendering.
Run inside Docker (manimcommunity/manim:stable base).

Endpoints:
  GET  /health                  — liveness check
  POST /zip                     — return .zip with py + svg (no render)
  POST /render                  — queue a Manim render job → {job_id}
  GET  /jobs/{job_id}           — poll job status / progress
  GET  /jobs/{job_id}/download  — stream the rendered video file
"""

from __future__ import annotations

import asyncio
import io
import os
import shutil
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Trace Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Job store (in-memory, single-user local tool) ────────────────────────────

_jobs: dict[str, dict] = {}

JOBS_DIR = Path("/tmp/trace_jobs")
JOBS_DIR.mkdir(parents=True, exist_ok=True)

# ── Models ───────────────────────────────────────────────────────────────────

class ZipRequest(BaseModel):
    svg_content: str
    python_script: str
    file_name: str = "logo"           # base name, no extension


class RenderRequest(BaseModel):
    svg_content: str
    python_script: str
    file_name: str = "logo"           # base name, no extension
    quality: str = "h"                # l=480p · m=720p · h=1080p · k=4K
    fps: int = 60
    transparent: bool = False

# ── Helpers ──────────────────────────────────────────────────────────────────

def _find_output(root: Path, exts: tuple[str, ...]) -> Optional[Path]:
    """Walk root looking for the first file with one of the given extensions."""
    for path in root.rglob("*"):
        if path.suffix.lower() in exts:
            return path
    return None


def _job(job_id: str) -> dict:
    j = _jobs.get(job_id)
    if j is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return j

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/zip")
async def create_zip(req: ZipRequest):
    """Bundle py + svg into a zip and stream it back — no rendering."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{req.file_name}.svg", req.svg_content)
        zf.writestr("logo_animation.py", req.python_script)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{req.file_name}_animation.zip"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@app.post("/render")
async def render(req: RenderRequest, background_tasks: BackgroundTasks):
    """Queue a Manim render job and return its ID."""
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "status": "queued",
        "progress": 0,
        "log": [],
        "file": None,
        "ext": None,
        "error": None,
    }
    background_tasks.add_task(_run_manim, job_id, req)
    return {"job_id": job_id}


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    j = _job(job_id)
    return {
        "status": j["status"],
        "progress": j["progress"],
        "error": j["error"],
    }


@app.get("/jobs/{job_id}/download")
async def download_job(job_id: str):
    j = _job(job_id)
    if j["status"] != "done":
        raise HTTPException(status_code=400, detail=f"Job not ready (status: {j['status']})")
    file_path: Path = j["file"]
    ext = j["ext"]
    media_type = "video/quicktime" if ext == "mov" else "video/mp4"
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=f"logo_animation.{ext}",
        headers={"Access-Control-Expose-Headers": "Content-Disposition"},
    )

# ── Background task ───────────────────────────────────────────────────────────

async def _run_manim(job_id: str, req: RenderRequest) -> None:
    j = _jobs[job_id]
    j["status"] = "running"
    j["progress"] = 5

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        # Write assets
        svg_path = tmp / f"{req.file_name}.svg"
        svg_path.write_text(req.svg_content, encoding="utf-8")

        py_path = tmp / "logo_animation.py"
        py_path.write_text(req.python_script, encoding="utf-8")

        # Build command
        ext = "mov" if req.transparent else "mp4"
        cmd = [
            "manim",
            f"-q{req.quality}",
            "--fps", str(req.fps),
            "--media_dir", str(tmp / "media"),
        ]
        if req.transparent:
            cmd += ["--transparent", "--format", "mov"]

        cmd += [str(py_path), "LogoAnimation"]

        j["log"].append(f"CMD: {' '.join(cmd)}")

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(tmp),
            )

            # Consume stderr for progress updates
            while True:
                line_bytes = await proc.stderr.readline()
                if not line_bytes:
                    break
                line = line_bytes.decode("utf-8", errors="replace").strip()
                if line:
                    j["log"].append(line)
                    # Manim renders with rich progress bars — try parsing %
                    if "%" in line:
                        for token in line.split():
                            token = token.replace("%", "").replace(",", "")
                            try:
                                pct = int(token)
                                if 0 <= pct <= 100:
                                    # Scale 5–95 during rendering
                                    j["progress"] = 5 + int(pct * 0.90)
                                break
                            except ValueError:
                                pass

            stdout = (await proc.stdout.read()).decode("utf-8", errors="replace")
            if stdout:
                j["log"].append(stdout)

            await proc.wait()

        except Exception as exc:
            j["status"] = "failed"
            j["error"] = str(exc)
            return

        if proc.returncode != 0:
            j["status"] = "failed"
            j["error"] = "\n".join(j["log"][-30:])
            return

        # Locate the output video
        media_dir = tmp / "media"
        out = _find_output(media_dir, (".mp4", ".mov", ".webm"))

        if out is None:
            j["status"] = "failed"
            j["error"] = "Manim finished but no video file was found."
            return

        # Copy to persistent jobs directory
        dest = JOBS_DIR / f"{job_id}.{ext}"
        shutil.copy(str(out), str(dest))

        j["status"] = "done"
        j["progress"] = 100
        j["file"] = dest
        j["ext"] = ext
