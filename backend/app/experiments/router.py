from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas
from app.database import get_db
from app.auth.utils import get_current_user
from . import service

router = APIRouter(prefix="/experiments", tags=["Experiments"])

# --- CREATE ---
@router.post("/", response_model=schemas.ExperimentResponse)
def create_exp(exp: schemas.ExperimentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return service.create_experiment(db, exp, current_user.id)

# --- READ ALL ---
@router.get("/", response_model=List[schemas.ExperimentResponse])
def list_exp(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return service.get_all_experiments(db)

# --- READ ONE ---
@router.get("/{exp_id}", response_model=schemas.ExperimentResponse)
def get_exp(exp_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return service.get_experiment(db, exp_id)

# --- UPDATE ---
@router.put("/{exp_id}", response_model=schemas.ExperimentResponse)
def update_exp(exp_id: int, exp: schemas.ExperimentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return service.update_experiment(db, exp_id, exp)

# --- DELETE ---
@router.delete("/{exp_id}")
def delete_exp(exp_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return service.delete_experiment(db, exp_id)