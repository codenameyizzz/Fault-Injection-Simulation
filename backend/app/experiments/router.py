from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import os
import time
import paramiko
import logging

from app.database import get_db
from app import schemas, models
from app.auth.utils import get_current_user, require_mentor
from app.experiments import service
from app.experiments.model import ExperimentParams
from app.experiments.service import fetch_logs
from app.experiments.analysis import analyze_experiment

router = APIRouter(prefix="/experiments", tags=["Experiments"])


# -----------------------------------------------------------------------------
# 1) SSE: Live Stream Output via /run-stream
# -----------------------------------------------------------------------------
SCRIPT_MAP = {
    "firmware_tail": "sweep_ftcx.sh",
    "raid_tail":     "sweep_raid.sh",
    "gc_slowness":   "sweep_xp_gc.sh",
}

def stream_ssh_output(p: ExperimentParams):
    # 1) Validasi fault_type
    script = SCRIPT_MAP.get(p.fault_type)
    if not script:
        yield "data: ⚠️ Unknown fault_type\n\n"
        return

    # 2) Build command
    cmd = (
        f"cd ~/trace-ACER/trace_replayer && sudo ./{script} INJECT_PCT "
        f"{p.start_pct} {p.step_pct} {p.end_pct} "
        f"TARGET_DISK_ID={p.disk_id} "
        f"FTCX_SLOW_IO_COUNT={p.slow_io_count} "
        f"DELAY_MIN_US={p.delay_min_us} "
        f"DELAY_MAX_US={p.delay_max_us}"
    )
    yield f"data: ▶️ Executing: {cmd}\n\n"

    # 3) SSH connect & exec
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        hostname=os.getenv("SSH_HOST"),
        username=os.getenv("SSH_USER"),
        key_filename=os.getenv("SSH_KEY_PATH"),
    )
    transport = ssh.get_transport()
    chan = transport.open_session()
    chan.get_pty()
    chan.exec_command(cmd)

    # 4) Stream until done, drain stdout & stderr fully
    while True:
        made_output = False

        # stdout
        while chan.recv_ready():
            made_output = True
            chunk = chan.recv(1024).decode("utf-8", errors="ignore")
            for line in chunk.splitlines():
                yield f"data: {line}\n\n"

        # stderr
        while chan.recv_stderr_ready():
            made_output = True
            chunk = chan.recv_stderr(1024).decode("utf-8", errors="ignore")
            for line in chunk.splitlines():
                yield f"data: ❌ {line}\n\n"

        # Check exit
        if chan.exit_status_ready():
            # drain any remaining on this iteration
            if not made_output:
                break

        time.sleep(0.1)

    exit_code = chan.recv_exit_status()
    yield f"data: ✅ Process exited with code {exit_code}\n\n"
    ssh.close()


@router.get(
    "/run-stream",
    # bypass auth for SSE
    dependencies=[],                    
    openapi_extra={"security": []},
)
def run_stream(p: ExperimentParams = Depends()):
    """
    SSE endpoint: stream real-time SSH output.
    Params via query-string matching ExperimentParams.
    """
    return StreamingResponse(
        stream_ssh_output(p),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )


# -----------------------------------------------------------------------------
# 2) One-off Run (blocking)
# -----------------------------------------------------------------------------
@router.post("/run", response_model=schemas.ExperimentResponse)
def run_experiment(p: ExperimentParams):
    """
    Jalankan eksperimen secara blocking via SSH,
    kembalikan stdout penuh jika sukses, atau HTTPException jika error.
    """
    script = SCRIPT_MAP.get(p.fault_type)
    if not script:
        raise HTTPException(status_code=400, detail=f"Unknown fault_type: {p.fault_type}")

    cmd = (
        f"cd ~/trace-ACER/trace_replayer && sudo ./{script} INJECT_PCT "
        f"{p.start_pct} {p.step_pct} {p.end_pct} "
        f"TARGET_DISK_ID={p.disk_id} "
        f"FTCX_SLOW_IO_COUNT={p.slow_io_count} "
        f"DELAY_MIN_US={p.delay_min_us} "
        f"DELAY_MAX_US={p.delay_max_us}"
    )

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(
            hostname=os.getenv("SSH_HOST"),
            username=os.getenv("SSH_USER"),
            key_filename=os.getenv("SSH_KEY_PATH"),
        )
        stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
        ssh.close()

        if exit_code != 0:
            logging.error(f"Experiment '{p.label}' failed (exit {exit_code}): {err}")
            raise HTTPException(
                status_code=500,
                detail=f"Experiment failed (exit {exit_code}): {err.strip()}",
            )

        return {"status": "completed", "label": p.label, "notes": out}

    except HTTPException:
        raise
    except Exception as ex:
        logging.exception(f"Error running experiment '{p.label}'")
        raise HTTPException(status_code=500, detail=f"Internal server error: {ex}")


# -----------------------------------------------------------------------------
# 3) Download logs via SFTP
# -----------------------------------------------------------------------------
@router.get("/logs")
def get_logs(
    fault_type: str = Query(..., description="Jenis fault, misal firmware_tail"),
    label:      str = Query(..., description="Label, misal firmware_tail_5-30pct"),
):
    """
    Unduh folder logs untuk fault_type/label via SFTP,
    return path lokal di backend.
    """
    local_dir = fetch_logs(fault_type, label)
    return {"local_dir": local_dir}


# -----------------------------------------------------------------------------
# 4) Analisis & Visualisasi Otomatis
# -----------------------------------------------------------------------------
@router.get("/analyze")
def analyze(
    fault_type: str = Query(..., description="Jenis fault, misal firmware_tail"),
    label:      str = Query(..., description="Label, misal firmware_tail_5-30pct"),
):
    """
    Analisis log yang sudah diunduh, return chart PNG sebagai Base64.
    """
    img_b64 = analyze_experiment(fault_type, label)
    return {"chart": img_b64}


# -----------------------------------------------------------------------------
# 5) CRUD Eksperimen Biasa
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[schemas.ExperimentResponse])
def list_exp(
    db: Session             = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.get_all_experiments(db)


@router.post("/", response_model=schemas.ExperimentResponse)
def create_exp(
    exp: schemas.ExperimentCreate,
    db: Session             = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.create_experiment(db, exp, current_user.id)


@router.get("/reviews", response_model=List[schemas.ExperimentResponse])
def list_for_review(
    db: Session             = Depends(get_db),
    mentor: models.User       = Depends(require_mentor),
):
    return service.get_all_experiments(db)


@router.put("/reviews/{exp_id}", response_model=schemas.ExperimentResponse)
def review_experiment(
    exp_id: int,
    review: schemas.ReviewUpdate,
    db: Session             = Depends(get_db),
    mentor: models.User       = Depends(require_mentor),
):
    return service.review_experiment(db, exp_id, review)


# -----------------------------------------------------------------------------
# 6) Dynamic by ID (HARUS TERAKHIR)
# -----------------------------------------------------------------------------
@router.get("/{exp_id}", response_model=schemas.ExperimentResponse)
def get_exp(
    exp_id: int,
    db: Session             = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.get_experiment(db, exp_id)


@router.put("/{exp_id}", response_model=schemas.ExperimentResponse)
def update_exp(
    exp_id: int,
    exp: schemas.ExperimentCreate,
    db: Session             = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.update_experiment(db, exp_id, exp)


@router.delete("/{exp_id}")
def delete_exp(
    exp_id: int,
    db: Session             = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.delete_experiment(db, exp_id)
