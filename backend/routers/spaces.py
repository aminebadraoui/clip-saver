import uuid
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from models import Space, User
from database import get_session
from auth import get_current_user
from dependencies import get_current_space

router = APIRouter(prefix="/api/spaces", tags=["spaces"])

@router.get("/", response_model=List[Space])
def get_user_spaces(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return current_user.spaces

@router.post("/", response_model=Space)
def create_space(
    name: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_space = Space(
        name=name,
        createdAt=int(time.time() * 1000),
        user=current_user
    )
    
    session.add(new_space)
    session.commit()
    session.refresh(new_space)
    return new_space

@router.put("/{space_id}", response_model=Space)
def update_space(
    space_id: uuid.UUID,
    name: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    space = session.exec(select(Space).where(Space.id == space_id, Space.user_id == current_user.id)).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    space.name = name
    session.add(space)
    session.commit()
    session.refresh(space)
    return space

@router.delete("/{space_id}")
def delete_space(
    space_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    space = session.exec(select(Space).where(Space.id == space_id, Space.user_id == current_user.id)).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    # Check if it's the last space, maybe prevent deleting?
    if len(current_user.spaces) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last space")

    session.delete(space)
    session.commit()
    return {"ok": True}

from models import Image, Clip

@router.get("/current/assets")
def get_space_assets(
    current_space: Space = Depends(get_current_space),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all media assets (images + clip thumbnails) for the current space"""
    
    # Get images
    images = session.exec(
        select(Image).where(Image.space_id == current_space.id)
    ).all()
    
    # Get clips
    clips = session.exec(
        select(Clip).where(Clip.space_id == current_space.id)
    ).all()
    
    assets = []
    
    for img in images:
        assets.append({
            "id": str(img.id),
            "type": "image",
            "url": img.image_url,
            "thumbnail": img.thumbnail_url or img.image_url,
            "title": img.title,
            "created_at": img.createdAt
        })
        
    for clip in clips:
        # For clips, we offer the thumbnail as the "image" output
        if clip.thumbnail:
            assets.append({
                "id": str(clip.id),
                "type": "video",
                "url": clip.thumbnail, # Input node expects an image URL usually
                "thumbnail": clip.thumbnail,
                "title": clip.title,
                "created_at": clip.createdAt
            })
            
    # Sort by newest first
    assets.sort(key=lambda x: x["created_at"], reverse=True)
    
    return assets
