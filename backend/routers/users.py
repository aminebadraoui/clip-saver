from fastapi import APIRouter, Depends
from models import User
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user profile.
    Useful for frontend to refresh subscription status.
    """
    return current_user
