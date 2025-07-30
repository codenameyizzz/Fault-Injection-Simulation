import os, json
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app import models
from uuid import uuid4

BASE_TRACE_DIR = "storage/traces"

async def create_job(db: Session, exp_id, user, fault_config_str, trace_file):
    # 1) Cek experiment ownership
    from app.experiments.service import get_experiment
    exp = get_experiment(db, exp_id)
    if exp.owner_id != user.id and user.role != "mentor":
        raise HTTPException(403, "Not permitted")

    # 2) Simpan file trace
    os.makedirs(BASE_TRACE_DIR, exist_ok=True)
    filename = f"{uuid4()}_{trace_file.filename}"
    path = os.path.join(BASE_TRACE_DIR, filename)
    with open(path, "wb") as f:
        f.write(await trace_file.read())

    # 3) Buat record Job
    job = models.Job(
      experiment_id=exp_id,
      trace_path=path,
      fault_config=json.loads(fault_config_str)
    )
    db.add(job); db.commit(); db.refresh(job)
    return job

def list_jobs(db: Session, user):
    q = db.query(models.Job)
    if user.role != "mentor":
        q = q.join(models.Experiment).filter(models.Experiment.owner_id == user.id)
    return q.all()
