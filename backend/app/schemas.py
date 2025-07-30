# app/schemas.py

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# === User Schemas ===
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        orm_mode = True        # Pydantic v1; if v2 use 'from_attributes = True'


# === Experiment Schemas ===
class ExperimentBase(BaseModel):
    name: str
    description: Optional[str]
    fault_type: Optional[str]

class ExperimentCreate(ExperimentBase):
    pass

class ExperimentResponse(ExperimentBase):
    id: int
    owner_id: int
    owner: UserResponse       # ← Tambahkan nested owner
    status: str
    notes: Optional[str]

    class Config:
        orm_mode = True        # or use 'from_attributes = True' for Pydantic v2


class ReviewUpdate(BaseModel):
    status: str              # "under_review", "accepted", or "need_revision"
    notes: Optional[str]
