from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
import time
import uuid

from database import get_session
from models import Tag, User, Space
from auth import get_current_user
from dependencies import get_current_space
from dependencies import get_current_space, get_current_space_optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/tags", tags=["tags"])

class TagCreate(BaseModel):
    name: str
    color: str
    category: str = "video"

@router.get("/", response_model=List[Tag])
def read_tags(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    current_space: Optional[Space] = Depends(get_current_space_optional)
):
    # Return user tags for this space (or all) and global tags
    # Assuming global tags have user_id=None

    query = select(Tag).where(Tag.user_id == current_user.id)
    if current_space:
        query = query.where(Tag.space_id == current_space.id)

    user_tags = session.exec(query).all()
    global_tags = session.exec(select(Tag).where(Tag.user_id == None)).all()

    return user_tags + global_tags

@router.post("/", response_model=Tag)
def create_tag(
    tag_data: TagCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user),
    current_space: Space = Depends(get_current_space)
):
    # Check for existing tag with same name and category for this user in this space
    existing_tag = session.exec(select(Tag).where(
        Tag.name == tag_data.name, 
        Tag.user_id == current_user.id,
        Tag.category == tag_data.category,
        Tag.space_id == current_space.id
    )).first()
    if existing_tag:
        return existing_tag
    
    # Check if a global tag exists with this name and category
    global_tag = session.exec(select(Tag).where(
        Tag.name == tag_data.name, 
        Tag.user_id == None,
        Tag.category == tag_data.category
    )).first()
    if global_tag:
        return global_tag
    
    tag = Tag(
        name=tag_data.name,
        color=tag_data.color,
        category=tag_data.category,
        createdAt=int(time.time() * 1000),
        user_id=current_user.id,
        space_id=current_space.id
    )
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag

@router.delete("/{tag_id}")
def delete_tag(
    tag_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only allow deleting user's own tags
    tag = session.exec(select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)).first()
    if not tag:
        # Check if it was a global tag, if so, forbid
        global_tag = session.exec(select(Tag).where(Tag.id == tag_id, Tag.user_id == None)).first()
        if global_tag:
             raise HTTPException(status_code=403, detail="Cannot delete global tags")
        raise HTTPException(status_code=404, detail="Tag not found")
    
    session.delete(tag)
    session.commit()
    return {"ok": True}
