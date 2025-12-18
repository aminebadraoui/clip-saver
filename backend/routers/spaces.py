import uuid
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from models import Space, User
from database import get_session
from auth import get_current_user

router = APIRouter(prefix="/spaces", tags=["spaces"])

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
