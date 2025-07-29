from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas
from app.database import get_db
from app.auth.utils import get_current_user
from . import service
from app.schemas import ReviewUpdate
from app.auth.utils import require_mentor


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

# --- GET /reviews (mentor only) ---
@router.get("/reviews", response_model=list[schemas.ExperimentResponse])
def list_for_review(
    db: Session = Depends(get_db),
    current_user=Depends(require_mentor),   # only mentor
):
    return service.get_all_experiments(db)

# --- PUT /reviews/{exp_id} (mentor only) ---
@router.put("/reviews/{exp_id}", response_model=schemas.ExperimentResponse)
def review_experiment(
    exp_id: int,
    review: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_mentor),
):
    return service.review_experiment(db, exp_id, review)