# backend/app/ssh/router.py

import os
import paramiko
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/ssh", tags=["SSH"])

class SSHRequest(BaseModel):
    command: str

@router.post("/")
async def run_ssh(req: SSHRequest):
    # Load from env vars
    key_path = os.getenv("SSH_KEY_PATH")
    host     = os.getenv("SSH_HOST")
    user     = os.getenv("SSH_USER")

    if not all([key_path, host, user]):
        raise HTTPException(status_code=500, detail="SSH not configured")

    # Set up client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(hostname=host, username=user, key_filename=key_path)
        stdin, stdout, stderr = ssh.exec_command(req.command)
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SSH error: {e}")
    finally:
        ssh.close()

    return {"stdout": out, "stderr": err}
