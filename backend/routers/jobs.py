from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import uuid
import json
from database import get_session
from models import AsyncJob, User
from auth import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("/{job_id}")
async def get_job_status(
    job_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get the status of an async job.
    """
    job = session.exec(select(AsyncJob).where(AsyncJob.id == job_id, AsyncJob.user_id == user.id)).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    result = {
        "id": job.id,
        "type": job.type,
        "status": job.status,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "error": job.error_message
    }
    
    # Parse input/output if needed, or send raw if frontend expects it
    if job.output_payload:
        try:
             result["output"] = json.loads(job.output_payload)
        except:
             result["output"] = job.output_payload
             
    if job.input_payload:
        try:
            result["input"] = json.loads(job.input_payload)
        except:
            result["input"] = job.input_payload

    return result
