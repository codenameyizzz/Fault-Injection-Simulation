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
    status: str
    created_at: datetime
    owner_id: int
    class Config:
        orm_mode = True