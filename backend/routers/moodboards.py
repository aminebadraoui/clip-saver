from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models import Moodboard, User, Space, Image, ImageTagLink, Spark, Clip, MoodboardSparkLink, MoodboardClipLink
from auth import get_current_user
from dependencies import get_current_space
from pydantic import BaseModel
import uuid
import time

router = APIRouter(prefix="/api/moodboards", tags=["moodboards"])

class MoodboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    space_id: uuid.UUID

class MoodboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@router.post("")
async def create_moodboard(
    moodboard_data: MoodboardCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new moodboard"""
    
    # Verify space exists and belongs to user
    space = session.get(Space, moodboard_data.space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create moodboard in this space")
    
    # Create moodboard
    now = int(time.time() * 1000)
    new_moodboard = Moodboard(
        id=uuid.uuid4(),
        name=moodboard_data.name,
        description=moodboard_data.description,
        createdAt=now,
        updatedAt=now,
        user_id=current_user.id,
        space_id=moodboard_data.space_id
    )
    
    session.add(new_moodboard)
    session.commit()
    session.refresh(new_moodboard)
    
    return new_moodboard

@router.get("")
async def get_moodboards(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    space_id: Optional[uuid.UUID] = None
):
    """Get all moodboards, optionally filtered by space"""
    
    query = select(Moodboard).where(Moodboard.user_id == current_user.id)
    
    if space_id:
        query = query.where(Moodboard.space_id == space_id)
    
    query = query.order_by(Moodboard.createdAt.desc())
    
    moodboards = session.exec(query).all()
    
    return moodboards

@router.get("/{moodboard_id}")
async def get_moodboard(
    moodboard_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific moodboard"""
    
    moodboard = session.get(Moodboard, moodboard_id)
    
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    if moodboard.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return moodboard

@router.put("/{moodboard_id}")
async def update_moodboard(
    moodboard_id: uuid.UUID,
    update_data: MoodboardUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a moodboard"""
    
    moodboard = session.get(Moodboard, moodboard_id)
    
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    if moodboard.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields
    if update_data.name is not None:
        moodboard.name = update_data.name
    if update_data.description is not None:
        moodboard.description = update_data.description
    
    moodboard.updatedAt = int(time.time() * 1000)
    
    session.commit()
    session.refresh(moodboard)
    
    return moodboard

@router.delete("/{moodboard_id}")
async def delete_moodboard(
    moodboard_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a moodboard"""
    
    moodboard = session.get(Moodboard, moodboard_id)
    
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    if moodboard.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Manually cascade delete images
    # 1. Get all images in this moodboard
    images = session.exec(select(Image).where(Image.moodboard_id == moodboard.id)).all()
    
    for image in images:
        # 2. Delete tag links for each image
        for link in session.exec(select(ImageTagLink).where(ImageTagLink.image_id == image.id)).all():
            session.delete(link)
        
        # 3. Delete the image
        session.delete(image)
        
    session.delete(moodboard)
    session.commit()
    
    return {"message": "Moodboard deleted successfully"}

    return {"message": "Moodboard deleted successfully"}

# Association Endpoints

class AssociationRequest(BaseModel):
    item_id: uuid.UUID

@router.post("/{moodboard_id}/sparks")
async def add_spark_to_moodboard(
    moodboard_id: uuid.UUID,
    request: AssociationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    moodboard = session.get(Moodboard, moodboard_id)
    if not moodboard or moodboard.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Moodboard not found")
        
    spark = session.get(Spark, request.item_id)
    if not spark:
        raise HTTPException(status_code=404, detail="Spark not found")
        
    # Check if already linked
    link = session.get(MoodboardSparkLink, (moodboard_id, request.item_id))
    if not link:
        link = MoodboardSparkLink(moodboard_id=moodboard_id, spark_id=request.item_id)
        session.add(link)
        session.commit()
        
    return {"ok": True}

@router.delete("/{moodboard_id}/sparks/{spark_id}")
async def remove_spark_from_moodboard(
    moodboard_id: uuid.UUID,
    spark_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    moodboard = session.get(Moodboard, moodboard_id)
    if not moodboard or moodboard.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Moodboard not found")
        
    link = session.get(MoodboardSparkLink, (moodboard_id, spark_id))
    if link:
        session.delete(link)
        session.commit()
        
    return {"ok": True}

@router.get("/{moodboard_id}/sparks", response_model=List[Spark])
async def get_moodboard_sparks(
    moodboard_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    moodboard = session.get(Moodboard, moodboard_id)
    if not moodboard or moodboard.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    
    # Explicitly join via the link table if needed, or rely on relationship
    # Since relationship is lazy, accessing it triggers a query if session is active
    return moodboard.sparks

@router.post("/{moodboard_id}/clips")
async def add_clip_to_moodboard(
    moodboard_id: uuid.UUID,
    request: AssociationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    moodboard = session.get(Moodboard, moodboard_id)
    if not moodboard or moodboard.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Moodboard not found")
        
    clip = session.get(Clip, request.item_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
        
    # Check if already linked
    link = session.get(MoodboardClipLink, (moodboard_id, request.item_id))
    if not link:
        link = MoodboardClipLink(moodboard_id=moodboard_id, clip_id=request.item_id)
        session.add(link)
        session.commit()
        
    return {"ok": True}

@router.delete("/{moodboard_id}/clips/{clip_id}")
async def remove_clip_from_moodboard(
    moodboard_id: uuid.UUID,
    clip_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    moodboard = session.get(Moodboard, moodboard_id)
    if not moodboard or moodboard.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Moodboard not found")
        
    link = session.get(MoodboardClipLink, (moodboard_id, clip_id))
    if link:
        session.delete(link)
        session.commit()
        
    return {"ok": True}

@router.get("/{moodboard_id}/clips", response_model=List[Clip])
async def get_moodboard_clips(
    moodboard_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    moodboard = session.get(Moodboard, moodboard_id)
    if not moodboard or moodboard.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Moodboard not found")
        
    return moodboard.clips


