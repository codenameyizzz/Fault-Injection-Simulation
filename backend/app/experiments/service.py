from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app import models, schemas

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