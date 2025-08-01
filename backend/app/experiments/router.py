# backend/app/experiments/router.py

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
from app.experiments.analysis import analyze_experiment, analyze_sweep

router = APIRouter(prefix="/experiments", tags=["Experiments"])

# -------------------------------------------------------------------------
# SSH live‐stream helper
# -------------------------------------------------------------------------
SCRIPT_MAP = {
    "firmware_tail": "sweep_ftcx.sh",
    "raid_tail":     "sweep_raid.sh",
    "gc_slowness":   "sweep_xp_gc.sh",
}

def stream_ssh_output(p: ExperimentParams):
    # 1) pilih skrip
    script = SCRIPT_MAP.get(p.fault_type)
    if not script:
        yield "data: ❌ Unknown fault_type\n\n"
        return

    # 2) build command
    cmd = (
        f"cd ~/trace-ACER/trace_replayer && sudo ./{script} INJECT_PCT "
        f"{p.start_pct} {p.step_pct} {p.end_pct} "
        f"TARGET_DISK_ID={p.disk_id} "
        f"FTCX_SLOW_IO_COUNT={p.slow_io_count} "
        f"DELAY_MIN_US={p.delay_min_us} "
        f"DELAY_MAX_US={p.delay_max_us}"
    )
    yield f"data: ▶️ {cmd}\n\n"

    # 3) SSH + exec
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

    # 4) stream sampai selesai
    while True:
        made = False
        while chan.recv_ready():
            made = True
            chunk = chan.recv(1024).decode("utf-8", errors="ignore")
            for ln in chunk.splitlines():
                yield f"data: {ln}\n\n"
        while chan.recv_stderr_ready():
            made = True
            chunk = chan.recv_stderr(1024).decode("utf-8", errors="ignore")
            for ln in chunk.splitlines():
                yield f"data: ❌ {ln}\n\n"
        if chan.exit_status_ready() and not made:
            break
        time.sleep(0.1)

    code = chan.recv_exit_status()
    yield f"data: Process exited with code {code}\n\n"
    ssh.close()

@router.get(
    "/run-stream",
    # bypass auth so browser can subscribe SSE
    dependencies=[],
    openapi_extra={"security": []},
)
def run_stream(p: ExperimentParams = Depends()):
    """
    SSE endpoint: stream real‐time SSH output.
    Params via query‐string matching ExperimentParams.
    """
    return StreamingResponse(
        stream_ssh_output(p),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )

# -------------------------------------------------------------------------
# one‐off blocking run
# -------------------------------------------------------------------------
@router.post("/run", response_model=schemas.ExperimentResponse)
def run_experiment(p: ExperimentParams):
    script = SCRIPT_MAP.get(p.fault_type)
    if not script:
        raise HTTPException(400, f"Unknown fault_type: {p.fault_type}")
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
            logging.error(f"Run failed: {err}")
            raise HTTPException(500, f"Experiment failed: {err.strip()}")

        return {"status": "completed", "label": p.label, "notes": out}

    except HTTPException:
        raise
    except Exception as ex:
        logging.exception("Error running experiment")
        raise HTTPException(500, f"Internal error: {ex}")

# -------------------------------------------------------------------------
# download sweep‐logs via SFTP (untuk analysis)
# -------------------------------------------------------------------------
@router.get("/logs")
def get_logs(
    fault_type: str = Query(...),
    label:      str = Query(...),
):
    """
    Download semua .log dari ~/sweep_logs/<fault_type>_INJECT_PCT
    ke backend `$LOGS_ROOT/<fault_type>_INJECT_PCT`.
    """
    local_dir = service.fetch_logs(fault_type, label)
    return {"local_dir": local_dir}

# -------------------------------------------------------------------------
# analysis & plotting
# -------------------------------------------------------------------------
@router.get("/analyze-sweep")
def analyze_sweep_endpoint(
    fault_type: str = Query(...),
    label:      str = Query(...),
):
    """
    1) Unduh logs ke local folder (via service.fetch_logs)
    2) Analisis dari folder local tersebut
    """
    # 1) Download sweeplog (.log) ke local temp/data
    local_dir = service.fetch_logs(fault_type, label)

    # 2) Karena analyze_sweep saat ini cuma membaca folder:
    #    kita modifikasi supaya analyze_sweep menerima path folder
    chart_b64 = analyze_sweep(fault_type, label, custom_dir=local_dir)
    return {"chart": chart_b64}

@router.get("/analyze")
def analyze_endpoint(
    fault_type: str = Query(...),
    label:      str = Query(...),
):
    """Alias lama, sama dengan analyze-sweep"""
    try:
        b64 = analyze_experiment(fault_type, label)
        return {"chart": b64}
    except Exception as e:
        raise HTTPException(500, str(e))

# -------------------------------------------------------------------------
# CRUD eksperimen biasa
# -------------------------------------------------------------------------
@router.get("/", response_model=List[schemas.ExperimentResponse])
def list_exp(db: Session = Depends(get_db),
             current_user: models.User = Depends(get_current_user)):
    return service.get_all_experiments(db)

@router.post("/", response_model=schemas.ExperimentResponse)
def create_exp(exp: schemas.ExperimentCreate,
               db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    return service.create_experiment(db, exp, current_user.id)

@router.get("/reviews", response_model=List[schemas.ExperimentResponse])
def list_for_review(db: Session = Depends(get_db),
                    mentor: models.User = Depends(require_mentor)):
    return service.get_all_experiments(db)

@router.put("/reviews/{exp_id}", response_model=schemas.ExperimentResponse)
def review_experiment(exp_id: int,
                      review: schemas.ReviewUpdate,
                      db: Session = Depends(get_db),
                      mentor: models.User = Depends(require_mentor)):
    return service.review_experiment(db, exp_id, review)

@router.get("/{exp_id}", response_model=schemas.ExperimentResponse)
def get_exp(exp_id: int, db: Session = Depends(get_db),
            current_user: models.User = Depends(get_current_user)):
    return service.get_experiment(db, exp_id)

@router.put("/{exp_id}", response_model=schemas.ExperimentResponse)
def update_exp(exp_id: int, exp: schemas.ExperimentCreate,
               db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    return service.update_experiment(db, exp_id, exp)

@router.delete("/{exp_id}")
def delete_exp(exp_id: int, db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    return service.delete_experiment(db, exp_id)
