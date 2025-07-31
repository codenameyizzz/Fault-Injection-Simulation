import os
import paramiko
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/ssh", tags=["SSH"])

class SSHRequest(BaseModel):
    command: str
    cwd: Optional[str] = None  # Optional current working directory :contentReference[oaicite:3]{index=3}

class SSHResponse(BaseModel):
    stdout: str
    stderr: str
    cwd: str  # return updated cwd

@router.post("/", response_model=SSHResponse)
async def run_ssh(req: SSHRequest):
    # Load SSH credentials
    key_path = os.getenv("SSH_KEY_PATH")
    host     = os.getenv("SSH_HOST")
    user     = os.getenv("SSH_USER")
    if not all([key_path, host, user]):
        raise HTTPException(500, "SSH not configured")

    # Determine start directory (default to home)
    cwd = req.cwd or "."

    # Build a single command: cd → run cmd → echo new cwd marker
    full_cmd = f'cd "{cwd}" && {req.command} && echo "__CWD__$PWD"'

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(hostname=host, username=user, key_filename=key_path)
        stdin, stdout, stderr = ssh.exec_command(full_cmd)  # new channel each time :contentReference[oaicite:4]{index=4}
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(500, f"SSH error: {e}")
    finally:
        ssh.close()

    # Parse new cwd from marker line
    new_cwd = cwd
    lines = out.splitlines()
    cleaned_lines = []
    for line in lines:
        if line.startswith("__CWD__"):
            new_cwd = line.replace("__CWD__", "").strip()
        else:
            cleaned_lines.append(line)
    cleaned_out = "\n".join(cleaned_lines)

    return SSHResponse(stdout=cleaned_out, stderr=err, cwd=new_cwd)
