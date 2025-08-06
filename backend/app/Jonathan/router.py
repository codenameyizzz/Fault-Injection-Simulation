# backend/app/Jonathan/router.py

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
import os, time, paramiko, tempfile
from typing import List, Optional
from pathlib import Path
from datetime import datetime

from .analysis import analyze_and_save

router = APIRouter(prefix="/Jonathan", tags=["Jonathan"])

def stream_sweep(cmd: str):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        hostname=os.getenv("SSH_HOST"),
        username=os.getenv("SSH_USER"),
        key_filename=os.getenv("SSH_KEY_PATH"),
    )
    chan = ssh.get_transport().open_session()
    chan.get_pty()
    chan.exec_command(cmd)
    try:
        while True:
            while chan.recv_ready():
                for ln in chan.recv(1024).decode().splitlines():
                    yield f"data: {ln}\n\n"
            while chan.recv_stderr_ready():
                for ln in chan.recv_stderr(1024).decode().splitlines():
                    yield f"data: ❌ {ln}\n\n"
            if chan.exit_status_ready():
                break
            time.sleep(0.1)
        yield f"data: ▶️ Process exited {chan.recv_exit_status()}\n\n"
    finally:
        ssh.close()

@router.get(
    "/sweep-stream",
    dependencies=[],
    openapi_extra={"security": []},
)
def sweep_stream(
    fault: str = Query(..., description="Fault key, e.g. media_retries"),
    param: str = Query(..., description="Param to sweep, e.g. INJECT_PCT"),
    start: int = Query(..., ge=0, description="Start value"),
    step: int = Query(..., gt=0, description="Step increment"),
    end: int = Query(..., ge=0, description="End value"),
    label: Optional[str] = Query(
        None, description="Run label; auto‐generated if missing"
    ),
    extras: List[str] = Query(default=[], description="KEY=VAL flags"),
):
    # auto‐generate label
    if not label:
        label = datetime.now().strftime("run_%Y%m%d%H%M%S")

    script = "sweep_experiment.sh"
    cmd = (
        f"cd ~/trace-ACER/trace_replayer && ./{script} "
        f"{fault} {param} {start} {step} {end} LABEL={label}"
    )
    for kv in extras:
        cmd += f" {kv}"

    print("[DEBUG CMD]", cmd)
    return StreamingResponse(stream_sweep(cmd), media_type="text/event-stream")

def fetch_remote_logs(fault: str, param: str, label: str) -> str:
    """
    SFTP all .log from /home/cc/sweep_logs/{fault}_sweep_{param}_{label}
    into a temp folder, return its local path.
    """
    host = os.getenv("SSH_HOST")
    user = os.getenv("SSH_USER")
    key  = os.getenv("SSH_KEY_PATH")
    remote_dir = f"/home/cc/sweep_logs/{fault}_sweep_{param}_{label}"

    tmp = Path(tempfile.gettempdir()) / f"{fault}_sweep_{param}_{label}"
    tmp.mkdir(parents=True, exist_ok=True)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, username=user, key_filename=key)
    sftp = ssh.open_sftp()

    try:
        files = sftp.listdir(remote_dir)
    except IOError:
        sftp.close()
        ssh.close()
        raise HTTPException(404, f"No logs at remote {remote_dir}")

    for fn in files:
        if fn.endswith(".log"):
            sftp.get(f"{remote_dir}/{fn}", str(tmp / fn))

    sftp.close()
    ssh.close()
    return str(tmp)

@router.get("/analyze-sweep")
def analyze_sweep(
    fault: str = Query(..., description="Fault key"),
    param: str = Query(..., description="Param swept"),
    label: Optional[str] = Query(None, description="Run label"),
):
    """
    If no label: list all run labels.
    If label: fetch logs + plot, return {"url": "/plots/..."}.
    """
    # connect once to list remote dirs
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        hostname=os.getenv("SSH_HOST"),
        username=os.getenv("SSH_USER"),
        key_filename=os.getenv("SSH_KEY_PATH"),
    )
    sftp = ssh.open_sftp()
    base = "/home/cc/sweep_logs"
    try:
        dirs = sftp.listdir(base)
    except IOError as e:
        sftp.close()
        ssh.close()
        raise HTTPException(500, f"Cannot list remote sweeps: {e}")

    prefix = f"{fault}_sweep_{param}_"
    runs = [d for d in dirs if d.startswith(prefix)]
    labels = [d[len(prefix):] for d in runs]
    sftp.close()
    ssh.close()

    if not runs:
        raise HTTPException(404, f"No runs found for {fault}/{param}")

    if label is None:
        # return the sorted list of labels
        return {"labels": sorted(labels)}

    if label not in labels:
        raise HTTPException(404, f"Unknown label '{label}'")

    # fetch and plot that single run
    local = fetch_remote_logs(fault, param, label)
    filename = f"{fault}_{param}_{label}.png"
    analyze_and_save(fault, param, logs_root=local, output_filename=filename)
    return {"url": f"/plots/{filename}"}
