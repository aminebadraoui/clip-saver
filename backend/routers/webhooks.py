from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
import uuid
import json
import time
from database import get_session
from models import AsyncJob

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

@router.post("/replicate")
async def replicate_webhook(request: Request, session: Session = Depends(get_session)):
    """
    Handle webhook callbacks from Replicate.
    """
    payload = await request.json()
    
    # Replicate payload structure:
    # { "id": "...", "status": "succeeded", "output": ..., "error": ..., "logs": ... }
    
    prediction_id = payload.get("id")
    status = payload.get("status")
    
    if not prediction_id:
        return {"ok": False, "error": "Missing prediction_id"}

    # Find the job
    job = session.exec(select(AsyncJob).where(AsyncJob.prediction_id == prediction_id)).first()
    
    if not job:
        print(f"Received webhook for unknown prediction: {prediction_id}")
        # Return 200 to acknowledge receipt even if we don't know the job, 
        # to prevent Replicate from retrying indefinitely.
        return {"ok": True} 
        
    print(f"Updating job {job.id} (prediction {prediction_id}) -> {status}")

    # Update job fields
    job.status = status
    
    if status == "succeeded":
        # Output can be any structure, save as JSON string
        job.output_payload = json.dumps(payload.get("output"))
    
    if status == "failed":
         job.error_message = payload.get("error")
         
    job.updated_at = int(time.time() * 1000)
    
    session.add(job)
    session.commit()
    
    return {"ok": True}
