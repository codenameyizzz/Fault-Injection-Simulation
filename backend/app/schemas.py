from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# user
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    class Config:
        orm_mode = True

# experiment
class ExperimentBase(BaseModel):
    name: str
    description: Optional[str]
    fault_type: Optional[str]

class ExperimentCreate(ExperimentBase):
    pass

class ExperimentResponse(ExperimentBase):
    id: int
    owner_id: int
    status: str
    notes: str | None

    class Config:
        from_attributes = True

class ReviewUpdate(BaseModel):
    status: str              # expected: "under_review", "accepted", "need_revision"
    notes: str | None