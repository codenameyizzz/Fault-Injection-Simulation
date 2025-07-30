# app/experiments/router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import schemas, models
from app.auth.utils import get_current_user, require_mentor
from . import service

router = APIRouter(prefix="/experiments", tags=["Experiments"])

# === CREATE ===
@router.post("/", response_model=schemas.ExperimentResponse)
def create_exp(
    exp: schemas.ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.create_experiment(db, exp, current_user.id)


# === READ ALL ===
@router.get("/", response_model=List[schemas.ExperimentResponse])
def list_exp(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.get_all_experiments(db)


# === REVIEW ROUTES (mentor only) ===

# 1) List semua eksperimen untuk review
@router.get(
    "/reviews",
    response_model=List[schemas.ExperimentResponse],
)
def list_for_review(
    db: Session = Depends(get_db),
    mentor: models.User = Depends(require_mentor),
):
    return service.get_all_experiments(db)


# 2) Update status & notes (review) untuk satu eksperimen
@router.put(
    "/reviews/{exp_id}",
    response_model=schemas.ExperimentResponse,
)
def review_experiment(
    exp_id: int,
    review: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    mentor: models.User = Depends(require_mentor),
):
    return service.review_experiment(db, exp_id, review)


# === READ ONE ===
@router.get("/{exp_id}", response_model=schemas.ExperimentResponse)
def get_exp(
    exp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.get_experiment(db, exp_id)


# === UPDATE ===
@router.put("/{exp_id}", response_model=schemas.ExperimentResponse)
def update_exp(
    exp_id: int,
    exp: schemas.ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.update_experiment(db, exp_id, exp)


# === DELETE ===
@router.delete("/{exp_id}")
def delete_exp(
    exp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return service.delete_experiment(db, exp_id)