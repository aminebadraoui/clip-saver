"""API routes for Replicate model catalog."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_session
from models import User, ReplicateModelCache
from auth import get_current_user
from services.replicate_service import ReplicateService


router = APIRouter(prefix="/api/replicate", tags=["replicate"])


class ModelResponse(BaseModel):
    id: str
    model_id: str
    model_name: str
    description: str
    category: str
    cost_per_run: float
    is_active: bool


@router.get("/models", response_model=List[ModelResponse])
def list_models(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = None
):
    """List available Replicate models."""
    replicate_service = ReplicateService()
    models = replicate_service.get_available_models(session, category)
    
    return [
        ModelResponse(
            id=str(m.id),
            model_id=m.model_id,
            model_name=m.model_name,
            description=m.description,
            category=m.category,
            cost_per_run=m.cost_per_run,
            is_active=m.is_active
        )
        for m in models
    ]


@router.get("/models/{model_id}", response_model=ModelResponse)
def get_model(
    model_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get details for a specific model."""
    replicate_service = ReplicateService()
    model = replicate_service.get_model_details(session, model_id)
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    return ModelResponse(
        id=str(model.id),
        model_id=model.model_id,
        model_name=model.model_name,
        description=model.description,
        category=model.category,
        cost_per_run=model.cost_per_run,
        is_active=model.is_active
    )


@router.post("/models/refresh", status_code=status.HTTP_204_NO_CONTENT)
def refresh_models(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Refresh model cache (admin only - add permission check in production)."""
    # TODO: Add admin permission check
    
    replicate_service = ReplicateService()
    replicate_service.initialize_model_cache(session)
    
    return None
