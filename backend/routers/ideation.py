from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import time
import uuid
import json

from database import get_session
from models import VideoIdeation, User, Clip, Space, AsyncJob
from auth import get_current_user
from dependencies import get_current_space, get_current_space_optional
from ai_agent import (
    fetch_transcript, 
    generate_video_outline, 
    generate_title_ideas, 
    readapt_script_outline, 
    generate_viral_script,
    generate_video_outline_async,
    generate_title_ideas_async,
    readapt_script_outline_async,
    readapt_script_outline_async,
    generate_viral_script_async,
    generate_thumbnail_concepts_async
)
import os

router = APIRouter(prefix="/api/ideation", tags=["ideation"])

class IdeationCreate(BaseModel):
    projectName: str

class IdeationUpdate(BaseModel):
    projectName: Optional[str] = None
    mainIdea: Optional[str] = None
    whyViewerCare: Optional[str] = None
    commonAssumptions: Optional[str] = None
    breakingAssumptions: Optional[str] = None
    viewerFeeling: Optional[str] = None
    targetAudience: Optional[str] = None
    visualVibe: Optional[str] = None
    brainstormedTitles: Optional[List[Dict[str, Any]]] = None # Frontend sends list of objects
    brainstormedThumbnails: Optional[List[Dict[str, Any]]] = None
    scriptOutline: Optional[str] = None
    scriptContent: Optional[str] = None

@router.post("/", response_model=VideoIdeation)
async def create_ideation(
    ideation_data: IdeationCreate,
    user: User = Depends(get_current_user),
    current_space: Space = Depends(get_current_space),
    session: Session = Depends(get_session)
):
    new_ideation = VideoIdeation(
        projectName=ideation_data.projectName,
        createdAt=int(time.time() * 1000),
        updatedAt=int(time.time() * 1000),
        user_id=user.id,
        space_id=current_space.id
    )
    session.add(new_ideation)
    session.commit()
    session.refresh(new_ideation)
    return new_ideation

@router.get("/", response_model=List[VideoIdeation])
async def list_ideations(
    user: User = Depends(get_current_user),
    current_space: Optional[Space] = Depends(get_current_space_optional),
    session: Session = Depends(get_session)
):
    query = select(VideoIdeation).where(VideoIdeation.user_id == user.id)
    if current_space:
        query = query.where(VideoIdeation.space_id == current_space.id)
        
    return session.exec(query).all()

@router.get("/{ideation_id}", response_model=VideoIdeation)
async def get_ideation(
    ideation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    ideation = session.exec(select(VideoIdeation).where(VideoIdeation.id == ideation_id, VideoIdeation.user_id == user.id)).first()
    if not ideation:
        raise HTTPException(status_code=404, detail="Ideation project not found")
    return ideation

@router.put("/{ideation_id}", response_model=VideoIdeation)
async def update_ideation(
    ideation_id: uuid.UUID,
    update_data: IdeationUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    ideation = session.exec(select(VideoIdeation).where(VideoIdeation.id == ideation_id, VideoIdeation.user_id == user.id)).first()
    if not ideation:
        raise HTTPException(status_code=404, detail="Ideation project not found")
    
    data_dict = update_data.model_dump(exclude_unset=True)
    
    # Handle JSON fields special case
    if "brainstormedTitles" in data_dict:
        data_dict["brainstormedTitles"] = json.dumps(data_dict["brainstormedTitles"])
    if "brainstormedThumbnails" in data_dict:
        data_dict["brainstormedThumbnails"] = json.dumps(data_dict["brainstormedThumbnails"])
        
    for key, value in data_dict.items():
        setattr(ideation, key, value)
        
    ideation.updatedAt = int(time.time() * 1000)
    session.add(ideation)
    session.commit()
    session.refresh(ideation)
    return ideation

    return ideation

@router.delete("/{ideation_id}")
async def delete_ideation(
    ideation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    ideation = session.exec(select(VideoIdeation).where(VideoIdeation.id == ideation_id, VideoIdeation.user_id == user.id)).first()
    if not ideation:
        raise HTTPException(status_code=404, detail="Ideation project not found")
    
    session.delete(ideation)
    session.commit()
    return {"ok": True}

@router.post("/clips/{clip_id}/outline")
async def generate_outline(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    clip = session.exec(select(Clip).where(Clip.id == clip_id, Clip.user_id == user.id)).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    # Caching Logic: Check if outline already exists
    if clip.scriptOutline:
        return {"outline": clip.scriptOutline}

    # Fetch transcript
    transcript = fetch_transcript(clip.videoId)
    if not transcript:
        # Fallback if transcript fails (e.g. no captions)
        raise HTTPException(status_code=400, detail="Could not fetch transcript for this video. Use manual creation.")

    # Async Job Creation
    webhook_url = os.getenv("REPLICATE_WEBHOOK_URL")
    if not webhook_url:
         raise HTTPException(status_code=500, detail="REPLICATE_WEBHOOK_URL not configured")
         
    # Create Job
    job = AsyncJob(
        type="video_outline",
        status="pending",
        input_payload=json.dumps({"transcript": transcript[:100], "title": clip.title}), # Log partial input
        created_at=int(time.time() * 1000),
        updated_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    
    try:
        prediction = await generate_video_outline_async(transcript, clip.title, webhook_url)
        job.prediction_id = prediction.id
        session.add(job)
        session.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start AI job: {e}")
    
    return {"jobId": str(job.id)}

@router.post("/generate-titles")
async def generate_titles_endpoint(
    concept_data: Dict[str, Any], 
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Generate new title ideas based on concept and inspiration.
    """
    # Extract inspiration titles from the format the frontend sends
    inspiration = concept_data.get("inspirationTitles", [])
    
    webhook_url = os.getenv("REPLICATE_WEBHOOK_URL")
    if not webhook_url:
         raise HTTPException(status_code=500, detail="REPLICATE_WEBHOOK_URL not configured")
         
    # Create Job
    job = AsyncJob(
        type="title_generation",
        status="pending",
        input_payload=json.dumps({"concept": concept_data.get("mainIdea")}),
        created_at=int(time.time() * 1000),
        updated_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    
    try:
        prediction = await generate_title_ideas_async(inspiration, concept_data, webhook_url)
        job.prediction_id = prediction.id
        session.add(job)
        session.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start AI job: {e}")
    
    return {"jobId": str(job.id)}

@router.post("/readapt-outline")
async def readapt_outline_endpoint(
    payload: Dict[str, Any],
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Readapt existing outline to main concept.
    """
    current_outline = payload.get("outline", "")
    concept_data = payload.get("conceptData", {})
    
    if not current_outline:
        raise HTTPException(status_code=400, detail="No outline provided")
        
    webhook_url = os.getenv("REPLICATE_WEBHOOK_URL")
    if not webhook_url:
         raise HTTPException(status_code=500, detail="REPLICATE_WEBHOOK_URL not configured")
         
    # Create Job
    job = AsyncJob(
        type="script_readaptation",
        status="pending",
        input_payload=json.dumps({"concept": concept_data.get("mainIdea")}),
        created_at=int(time.time() * 1000),
        updated_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    
    try:
        prediction = await readapt_script_outline_async(current_outline, concept_data, webhook_url)
        job.prediction_id = prediction.id
        session.add(job)
        session.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start AI job: {e}")
    
    return {"jobId": str(job.id)}

@router.post("/generate-script")
async def generate_script_endpoint(
    payload: Dict[str, Any],
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Generate full script from outline, titles, and concept.
    """
    outline = payload.get("outline", "")
    titles = payload.get("titles", []) # List of title objects or strings
    concept_data = payload.get("conceptData", {})
    
    if not outline:
        raise HTTPException(status_code=400, detail="No outline provided")
        
    webhook_url = os.getenv("REPLICATE_WEBHOOK_URL")
    if not webhook_url:
         raise HTTPException(status_code=500, detail="REPLICATE_WEBHOOK_URL not configured")
         
    # Create Job
    job = AsyncJob(
        type="script_generation",
        status="pending",
        input_payload=json.dumps({"concept": concept_data.get("mainIdea")}),
        created_at=int(time.time() * 1000),
        updated_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    
    try:
        prediction = await generate_viral_script_async(outline, titles, concept_data, webhook_url)
        job.prediction_id = prediction.id
        session.add(job)
        session.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start AI job: {e}")
    
    return {"jobId": str(job.id)}

@router.post("/generate-thumbnails")
async def generate_thumbnails_endpoint(
    payload: Dict[str, Any],
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Generate thumbnail concepts based on strategy and titles.
    """
    concept_data = payload.get("conceptData", {})
    titles = payload.get("titles", [])
    
    webhook_url = os.getenv("REPLICATE_WEBHOOK_URL")
    if not webhook_url:
         raise HTTPException(status_code=500, detail="REPLICATE_WEBHOOK_URL not configured")
         
    # Create Job
    job = AsyncJob(
        type="thumbnail_ideation",
        status="pending",
        input_payload=json.dumps({"concept": concept_data.get("mainIdea")}),
        created_at=int(time.time() * 1000),
        updated_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    
    try:
        prediction = await generate_thumbnail_concepts_async(concept_data, titles, webhook_url)
        job.prediction_id = prediction.id
        session.add(job)
        session.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start AI job: {e}")
    
    return {"jobId": str(job.id)}
