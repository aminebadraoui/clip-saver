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
    print(f"[DEBUG] /me called for {current_user.email}. SubStatus: {current_user.subscription_status}, Canceled: {current_user.cancel_at_period_end}, Ends: {current_user.current_period_end}")
    return current_user
