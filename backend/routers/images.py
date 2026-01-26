from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select, or_
from typing import List, Optional
from database import get_session
from models import Image, User, Tag, ImageTagLink
from auth import get_current_user
from dependencies import get_current_space
from pydantic import BaseModel
import uuid
import time
from urllib.parse import urlparse

router = APIRouter(prefix="/api/images", tags=["images"])

class ImageCreate(BaseModel):
    title: str
    image_url: str
    source_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    notes: Optional[str] = None
    tagIds: List[uuid.UUID] = []
    moodboard_id: Optional[uuid.UUID] = None

class ImageUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    tagIds: Optional[List[uuid.UUID]] = None

@router.post("")
async def create_image(
    image_data: ImageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    space_id: Optional[uuid.UUID] = Depends(get_current_space)
):
    """Save a new image to the moodboard"""
    
    # Extract domain from source URL
    source_domain = None
    if image_data.source_url:
        try:
            parsed = urlparse(image_data.source_url)
            source_domain = parsed.netloc
        except:
            pass
    
    # Create image
    new_image = Image(
        id=uuid.uuid4(),
        title=image_data.title,
        image_url=image_data.image_url,
        source_url=image_data.source_url,
        source_domain=source_domain,
        thumbnail_url=image_data.thumbnail_url,
        width=image_data.width,
        height=image_data.height,
        notes=image_data.notes,
        createdAt=int(time.time() * 1000),
        user_id=current_user.id,
        space_id=space_id,
        moodboard_id=image_data.moodboard_id
    )
    
    session.add(new_image)
    session.flush()
    
    # Add tags
    if image_data.tagIds:
        for tag_id in image_data.tagIds:
            # Verify tag exists and belongs to user or is global
            tag = session.get(Tag, tag_id)
            if tag and (tag.user_id == current_user.id or tag.user_id is None):
                link = ImageTagLink(image_id=new_image.id, tag_id=tag_id)
                session.add(link)
    
    session.commit()
    session.refresh(new_image)
    
    return new_image

@router.get("")
async def get_images(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    space_id: Optional[uuid.UUID] = Depends(get_current_space),
    search: Optional[str] = None,
    tag_ids: Optional[str] = None,  # Comma-separated tag IDs
    limit: int = 100,
    offset: int = 0
):
    """Get all images with optional filtering"""
    
    # Base query
    query = select(Image).where(
        Image.user_id == current_user.id,
        Image.space_id == space_id
    )
    
    # Search filter
    if search:
        query = query.where(
            or_(
                Image.title.contains(search),
                Image.notes.contains(search),
                Image.source_domain.contains(search)
            )
        )
    
    # Tag filter
    if tag_ids:
        tag_id_list = [uuid.UUID(tid.strip()) for tid in tag_ids.split(",")]
        # Join with ImageTagLink to filter by tags
        query = query.join(ImageTagLink).where(ImageTagLink.tag_id.in_(tag_id_list))
    
    # Order by creation date (newest first)
    query = query.order_by(Image.createdAt.desc())
    
    # Pagination
    query = query.offset(offset).limit(limit)
    
    images = session.exec(query).all()
    
    return images

@router.get("/{image_id}")
async def get_image(
    image_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific image"""
    
    image = session.get(Image, image_id)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return image

@router.put("/{image_id}")
async def update_image(
    image_id: uuid.UUID,
    update_data: ImageUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update image metadata"""
    
    image = session.get(Image, image_id)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields
    if update_data.title is not None:
        image.title = update_data.title
    if update_data.notes is not None:
        image.notes = update_data.notes
    
    # Update tags
    if update_data.tagIds is not None:
        # Remove existing tags
        session.exec(
            select(ImageTagLink).where(ImageTagLink.image_id == image_id)
        ).all()
        for link in session.exec(select(ImageTagLink).where(ImageTagLink.image_id == image_id)).all():
            session.delete(link)
        
        # Add new tags
        for tag_id in update_data.tagIds:
            tag = session.get(Tag, tag_id)
            if tag and (tag.user_id == current_user.id or tag.user_id is None):
                link = ImageTagLink(image_id=image_id, tag_id=tag_id)
                session.add(link)
    
    session.commit()
    session.refresh(image)
    
    return image

@router.delete("/{image_id}")
async def delete_image(
    image_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an image"""
    
    image = session.get(Image, image_id)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete tag links first
    for link in session.exec(select(ImageTagLink).where(ImageTagLink.image_id == image_id)).all():
        session.delete(link)
    
    session.delete(image)
    session.commit()
    
    return {"message": "Image deleted successfully"}
