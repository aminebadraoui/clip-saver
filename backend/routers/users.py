from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import User
from auth import get_current_user
from database import get_session # Assuming get_session is in database.py

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=User)
def read_users_me(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get current user profile.
    Useful for frontend to refresh subscription status.
    """
    # Ensure user has at least one space
    if not current_user.spaces:
        # Avoid circular import if possible, or import inside function
        from models import Space
        import time
        
        default_space = Space(
            name="My Space",
            createdAt=int(time.time() * 1000),
            user_id=current_user.id
        )
        session.add(default_space)
        session.commit()
        session.refresh(current_user)
        
    print(f"[DEBUG] /me called for {current_user.email}. SubStatus: {current_user.subscription_status}, Canceled: {current_user.cancel_at_period_end}, Ends: {current_user.current_period_end}")
    return current_user
