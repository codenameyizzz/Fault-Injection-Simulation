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
                for ln in chan.recv(4096).decode().splitlines():
                    yield f"data: {ln}\n\n"
            while chan.recv_stderr_ready():
                for ln in chan.recv_stderr(4096).decode().splitlines():
                    yield f"data: ❌ {ln}\n\n"
            if chan.exit_status_ready():
                break
            time.sleep(0.1)
        yield f"data: ▶️ Process exited {chan.recv_exit_status()}\n\n"
    finally:
        ssh.close()


@router.get("/sweep-stream", dependencies=[], openapi_extra={"security": []})
def sweep_stream(
    fault: str = Query(..., description="Fault key, e.g. media_retries"),
    param: str = Query(..., description="Param to sweep, e.g. INJECT_PCT"),
    start: int = Query(..., ge=0, description="Start value"),
    step:  int = Query(..., gt=0, description="Step increment"),
    end:   int = Query(..., ge=0, description="End value"),
    label: Optional[str] = Query(None, description="Run label; auto-generated if missing"),
    extras: List[str]   = Query([], description="KEY=VAL compile-time defines"),
):
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
    Try both:
      /home/cc/sweep_logs/{fault}_sweep_{param}_run_{label}
      /home/cc/sweep_logs/{fault}_sweep_{param}_{label}
    """
    base = "/home/cc/sweep_logs"
    candidate1 = f"{base}/{fault}_sweep_{param}_run_{label}"
    candidate2 = f"{base}/{fault}_sweep_{param}_{label}"

    for remote_dir in (candidate1, candidate2):
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(
                hostname=os.getenv("SSH_HOST"),
                username=os.getenv("SSH_USER"),
                key_filename=os.getenv("SSH_KEY_PATH"),
            )
            sftp = ssh.open_sftp()
            files = sftp.listdir(remote_dir)
            # if we succeed in listing, use this directory
            tmp = Path(tempfile.gettempdir()) / f"{fault}_sweep_{param}_{label}"
            tmp.mkdir(exist_ok=True)
            for fn in files:
                if fn.endswith(".log"):
                    sftp.get(f"{remote_dir}/{fn}", str(tmp / fn))
            sftp.close()
            ssh.close()
            return str(tmp)
        except IOError:
            # try next candidate
            continue

    # if neither worked, error
    raise HTTPException(404, f"No logs found in {candidate1} or {candidate2}")


@router.get("/analyze-sweep")
def analyze_sweep(
    fault: str    = Query(..., description="Fault key, e.g. media_retries"),
    param: Optional[str] = Query(None, description="Param swept; omit to list all"),
    label: Optional[str] = Query(None, description="Run label; omit to list labels"),
):
    # list all remote sweep dirs
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        hostname=os.getenv("SSH_HOST"),
        username=os.getenv("SSH_USER"),
        key_filename=os.getenv("SSH_KEY_PATH"),
    )
    sftp = ssh.open_sftp()
    try:
        all_dirs = sftp.listdir("/home/cc/sweep_logs")
    except IOError as e:
        sftp.close()
        ssh.close()
        raise HTTPException(500, f"Cannot list remote sweeps: {e}")

    prefix = f"{fault}_sweep_"
    runs = [d for d in all_dirs if d.startswith(prefix)]
    sftp.close()
    ssh.close()

    if not runs:
        raise HTTPException(404, f"No runs found for fault '{fault}'")

    # only fault → list (param,label)
    if param is None and label is None:
        out = []
        for d in runs:
            rest = d[len(prefix):]
            if "_run_" in rest:
                p, _, lbl = rest.partition("_run_")
            else:
                idx = rest.rfind("_")
                p, lbl = (rest[:idx], rest[idx+1:]) if idx!=-1 else (rest, "")
            out.append({"param": p, "label": lbl})
        return {"runs": sorted(out, key=lambda x: (x["param"], x["label"]))}

    # fault+param → list labels
    if param is not None and label is None:
        labels = []
        for d in runs:
            rest = d[len(prefix):]
            if rest.startswith(f"{param}_run_"):
                labels.append(rest[len(param)+len("_run_"):])
            elif rest.startswith(f"{param}_"):
                labels.append(rest[len(param)+1:])
        labels = sorted(set(labels))
        if not labels:
            raise HTTPException(404, f"No runs for {fault}/{param}")
        return {"labels": labels}

    # fault+param+label → fetch logs & plot
    if param and label:
        local = fetch_remote_logs(fault, param, label)
        out_fname = f"{fault}_{param}_{label}.png"
        analyze_and_save(
            fault,
            param,
            logs_root=local,
            output_filename=out_fname
        )
        return {"url": f"/plots/{out_fname}"}

    raise HTTPException(400, "Invalid query combination")
