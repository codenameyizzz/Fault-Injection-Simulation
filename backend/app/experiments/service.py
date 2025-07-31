from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas import ReviewUpdate
from app.models import Experiment
from app import models, schemas
import os, paramiko
from pathlib import Path

# --- Create Experiment ---
def create_experiment(db: Session, experiment: schemas.ExperimentCreate, user_id: int):
    new_exp = models.Experiment(
        name=experiment.name,
        description=experiment.description,
        fault_type=experiment.fault_type,
        owner_id=user_id
    )
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp

# --- Get All Experiments (mentor can see all) ---
def get_all_experiments(db: Session):
    return db.query(models.Experiment).all()

# --- Get Experiment by ID ---
def get_experiment(db: Session, exp_id: int):
    exp = db.query(models.Experiment).filter(models.Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp

# --- Update Experiment ---
def update_experiment(db: Session, exp_id: int, exp_data: schemas.ExperimentCreate):
    exp = get_experiment(db, exp_id)
    exp.name = exp_data.name
    exp.description = exp_data.description
    exp.fault_type = exp_data.fault_type
    db.commit()
    db.refresh(exp)
    return exp


# --- Delete Experiment ---
def delete_experiment(db: Session, exp_id: int):
    exp = get_experiment(db, exp_id)
    db.delete(exp)
    db.commit()
    return {"message": "Experiment deleted"}

# --- Review Experiment (mentor only) ---
def review_experiment(db: Session, exp_id: int, review: ReviewUpdate):
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    exp.status = review.status
    exp.notes  = review.notes
    db.commit()
    db.refresh(exp)
    return exp

def fetch_experiment_logs(label: str):
    host       = os.getenv("SSH_HOST")
    user       = os.getenv("SSH_USER")
    key        = os.getenv("SSH_KEY_PATH")
    base_remote = "cassandra-demo/etcd_bench_results"
    local_base  = Path("data") / label
    local_base.mkdir(parents=True, exist_ok=True)

    ssh  = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, username=user, key_filename=key)
    sftp = ssh.open_sftp()

    # 1) Dapatkan daftar folder di etcd_bench_results
    try:
        all_entries = sftp.listdir(base_remote)
    except IOError:
        raise FileNotFoundError(f"Remote dir not found: {base_remote}")

    # 2) Cari folder yang mengandung label
    matched = [
        name for name in all_entries
        if name.endswith(f"_{label}")
    ]
    if not matched:
        raise FileNotFoundError(f"No remote experiment folder matching: {label}")
    # Misal ambil folder pertama bila >1
    remote_folder = matched[0]
    remote_path   = f"{base_remote}/{remote_folder}"

    # 3) Download semua file dalam folder itu
    for entry in sftp.listdir(remote_path):
        remote_file = f"{remote_path}/{entry}"
        local_file  = local_base / entry
        sftp.get(remote_file, str(local_file))

    sftp.close()
    ssh.close()
    return str(local_base)