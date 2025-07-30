from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.utils import get_current_user, require_mentor
from app import schemas, models
from .service import create_job, list_jobs

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=schemas.JobResponse)
async def upload_job(
    experiment_id: int,
    fault_config: str,                           # kirim sebagai JSON string
    trace: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return await create_job(db, experiment_id, user, fault_config, trace)

@router.get("/", response_model=List[schemas.JobResponse])
def get_jobs(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return list_jobs(db, user)

# (opsional) detail, update status, dll.
