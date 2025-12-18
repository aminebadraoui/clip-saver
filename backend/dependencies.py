from fastapi import Header, HTTPException, Depends
from sqlmodel import Session, select
from models import Space, User
from database import get_session
from auth import get_current_user
import uuid

def get_current_space(
    x_space_id: str = Header(None, alias="X-Space-Id"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Space:
    if not x_space_id:
        # If no header, return the first created space (default)
        if current_user.spaces:
            # Sort by creation time to get the oldest one as default "My Space"
            sorted_spaces = sorted(current_user.spaces, key=lambda s: s.createdAt)
            return sorted_spaces[0]
        else:
            # Should be handled by users/me logic, but as fallback
            raise HTTPException(status_code=400, detail="No space selected and no default space found.")
            
    try:
        space_uuid = uuid.UUID(x_space_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Space-Id format")

    space = session.exec(select(Space).where(Space.id == space_uuid, Space.user_id == current_user.id)).first()
    
    if not space:
        raise HTTPException(status_code=404, detail="Space not found or access denied")
        
    return space
