from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, schemas
from .utils import hash_password, verify_password, create_access_token

from .utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,    # ← pastikan ini diimpor
    require_mentor       # ← optional, untuk reviews
)

router = APIRouter(prefix="/auth", tags=["Auth"])

# === REGISTER ===
@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Cek username sudah ada?
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = hash_password(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# === LOGIN ===
@router.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Buat JWT
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.role}

@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(
    current_user: models.User = Depends(get_current_user)
):
    """
    Endpoint untuk fetch detail user (username, role, dsb.)
    Berdasarkan JWT yang dikirim di Authorization header.
    """
    return current_user

@router.put("/me/password", response_model=schemas.UserResponse)
def change_password(
    payload: schemas.ChangePassword,         # schema baru
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verifikasi current password
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    # Update ke password baru
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user