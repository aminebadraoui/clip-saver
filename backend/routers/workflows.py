"""API routes for workflow management."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
import time
import uuid
import json

from database import get_session
from models import AIWorkflow, User
from auth import get_current_user
from dependencies import get_current_space
from models import Space


router = APIRouter(prefix="/api/workflows", tags=["workflows"])


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_data: str  # JSON string
    is_public: bool = False


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_data: Optional[str] = None
    is_public: Optional[bool] = None
    thumbnail: Optional[str] = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    thumbnail: Optional[str]
    is_public: bool
    workflow_data: str
    created_at: int
    updated_at: int
    user_id: str
    space_id: Optional[str]


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow: WorkflowCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    current_space: Space = Depends(get_current_space)
):
    """Create a new workflow."""
    # Validate workflow_data is valid JSON
    try:
        json.loads(workflow.workflow_data)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="workflow_data must be valid JSON"
        )
    
    current_time = int(time.time() * 1000)
    
    new_workflow = AIWorkflow(
        name=workflow.name,
        description=workflow.description,
        workflow_data=workflow.workflow_data,
        is_public=workflow.is_public,
        created_at=current_time,
        updated_at=current_time,
        user_id=current_user.id,
        space_id=current_space.id
    )
    
    session.add(new_workflow)
    session.commit()
    session.refresh(new_workflow)
    
    return WorkflowResponse(
        id=str(new_workflow.id),
        name=new_workflow.name,
        description=new_workflow.description,
        thumbnail=new_workflow.thumbnail,
        is_public=new_workflow.is_public,
        workflow_data=new_workflow.workflow_data,
        created_at=new_workflow.created_at,
        updated_at=new_workflow.updated_at,
        user_id=str(new_workflow.user_id),
        space_id=str(new_workflow.space_id) if new_workflow.space_id else None
    )


@router.get("", response_model=List[WorkflowResponse])
def list_workflows(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    current_space: Space = Depends(get_current_space),
    include_public: bool = False
):
    """List workflows for the current user and space."""
    query = select(AIWorkflow).where(
        AIWorkflow.user_id == current_user.id,
        AIWorkflow.space_id == current_space.id
    )
    
    workflows = session.exec(query).all()
    
    # Optionally include public workflows from other users
    if include_public:
        public_workflows = session.exec(
            select(AIWorkflow).where(
                AIWorkflow.is_public == True,
                AIWorkflow.user_id != current_user.id
            )
        ).all()
        workflows = list(workflows) + list(public_workflows)
    
    return [
        WorkflowResponse(
            id=str(w.id),
            name=w.name,
            description=w.description,
            thumbnail=w.thumbnail,
            is_public=w.is_public,
            workflow_data=w.workflow_data,
            created_at=w.created_at,
            updated_at=w.updated_at,
            user_id=str(w.user_id),
            space_id=str(w.space_id) if w.space_id else None
        )
        for w in workflows
    ]


@router.get("/templates", response_model=List[WorkflowResponse])
def list_templates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List public workflow templates."""
    workflows = session.exec(
        select(AIWorkflow).where(AIWorkflow.is_public == True)
    ).all()
    
    return [
        WorkflowResponse(
            id=str(w.id),
            name=w.name,
            description=w.description,
            thumbnail=w.thumbnail,
            is_public=w.is_public,
            workflow_data=w.workflow_data,
            created_at=w.created_at,
            updated_at=w.updated_at,
            user_id=str(w.user_id),
            space_id=str(w.space_id) if w.space_id else None
        )
        for w in workflows
    ]


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID"
        )
    
    workflow = session.get(AIWorkflow, workflow_uuid)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Check permissions
    if workflow.user_id != current_user.id and not workflow.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this workflow"
        )
    
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        thumbnail=workflow.thumbnail,
        is_public=workflow.is_public,
        workflow_data=workflow.workflow_data,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        user_id=str(workflow.user_id),
        space_id=str(workflow.space_id) if workflow.space_id else None
    )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID"
        )
    
    workflow = session.get(AIWorkflow, workflow_uuid)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Check permissions
    if workflow.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this workflow"
        )
    
    # Update fields
    if workflow_update.name is not None:
        workflow.name = workflow_update.name
    if workflow_update.description is not None:
        workflow.description = workflow_update.description
    if workflow_update.workflow_data is not None:
        # Validate JSON
        try:
            json.loads(workflow_update.workflow_data)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="workflow_data must be valid JSON"
            )
        workflow.workflow_data = workflow_update.workflow_data
    if workflow_update.is_public is not None:
        workflow.is_public = workflow_update.is_public
    if workflow_update.thumbnail is not None:
        workflow.thumbnail = workflow_update.thumbnail
    
    workflow.updated_at = int(time.time() * 1000)
    
    session.add(workflow)
    session.commit()
    session.refresh(workflow)
    
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        thumbnail=workflow.thumbnail,
        is_public=workflow.is_public,
        workflow_data=workflow.workflow_data,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        user_id=str(workflow.user_id),
        space_id=str(workflow.space_id) if workflow.space_id else None
    )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID"
        )
    
    workflow = session.get(AIWorkflow, workflow_uuid)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Check permissions
    if workflow.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this workflow"
        )
    
    session.delete(workflow)
    session.commit()
    
    return None


@router.post("/{workflow_id}/duplicate", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def duplicate_workflow(
    workflow_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    current_space: Space = Depends(get_current_space)
):
    """Duplicate a workflow (useful for templates)."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID"
        )
    
    original = session.get(AIWorkflow, workflow_uuid)
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Check permissions (can duplicate own workflows or public ones)
    if original.user_id != current_user.id and not original.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to duplicate this workflow"
        )
    
    current_time = int(time.time() * 1000)
    
    duplicate = AIWorkflow(
        name=f"{original.name} (Copy)",
        description=original.description,
        workflow_data=original.workflow_data,
        is_public=False,  # Duplicates are private by default
        created_at=current_time,
        updated_at=current_time,
        user_id=current_user.id,
        space_id=current_space.id
    )
    
    session.add(duplicate)
    session.commit()
    session.refresh(duplicate)
    
    return WorkflowResponse(
        id=str(duplicate.id),
        name=duplicate.name,
        description=duplicate.description,
        thumbnail=duplicate.thumbnail,
        is_public=duplicate.is_public,
        workflow_data=duplicate.workflow_data,
        created_at=duplicate.created_at,
        updated_at=duplicate.updated_at,
        user_id=str(duplicate.user_id),
        space_id=str(duplicate.space_id) if duplicate.space_id else None
    )
