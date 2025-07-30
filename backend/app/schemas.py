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
        orm_mode = True      


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
    owner: UserResponse    
    status: str
    notes: Optional[str]

    class Config:
        orm_mode = True        


class ReviewUpdate(BaseModel):
    status: str            
    notes: Optional[str]

class ChangePassword(BaseModel):
    current_password: str
    new_password: str