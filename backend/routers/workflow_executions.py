"""API routes for workflow execution."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import time
import uuid
import json
import asyncio

from database import get_session
from models import AIWorkflow, WorkflowExecution, User
from auth import get_current_user
from services.workflow_engine import WorkflowEngine
from services.credit_service import CreditService


router = APIRouter(prefix="/api", tags=["executions"])


class ExecutionCreate(BaseModel):
    input_data: Dict[str, Any]
    target_node_ids: Optional[List[str]] = None


class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    credits_used: int
    execution_time_ms: Optional[int]
    created_at: int
    completed_at: Optional[int]


@router.post("/workflows/{workflow_id}/execute", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED)
def execute_workflow(
    workflow_id: str,
    execution: ExecutionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID"
        )
    
    # Get workflow
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
            detail="You don't have permission to execute this workflow"
        )
    
    current_time = int(time.time() * 1000)
    
    # Create execution record
    new_execution = WorkflowExecution(
        workflow_id=workflow.id,
        status="pending",
        input_data=json.dumps(execution.input_data),
        created_at=current_time,
        user_id=current_user.id
    )
    
    session.add(new_execution)
    session.commit()
    session.refresh(new_execution)
    
    # Execute workflow
    try:
        new_execution.status = "running"
        session.add(new_execution)
        session.commit()
        
        # Run workflow engine
        engine = WorkflowEngine(session)
        result = engine.execute(
            workflow_data=workflow.workflow_data,
            input_data=execution.input_data,
            user_id=current_user.id,
            target_node_ids=execution.target_node_ids
        )
        
        # Update execution record
        if result["status"] == "completed":
            new_execution.status = "completed"
            new_execution.output_data = json.dumps(result["outputs"])
            new_execution.credits_used = result["credits_used"]
            new_execution.execution_time_ms = result["execution_time_ms"]
            new_execution.completed_at = int(time.time() * 1000)
            
            # Deduct credits
            credit_service = CreditService()
            credit_service.deduct_credits(
                session=session,
                user_id=current_user.id,
                amount=result["credits_used"],
                description=f"Workflow execution: {workflow.name}",
                execution_id=new_execution.id
            )
        else:
            new_execution.status = "failed"
            new_execution.error_message = result.get("error")
            new_execution.credits_used = result.get("credits_used", 0)
            new_execution.execution_time_ms = result.get("execution_time_ms")
            new_execution.completed_at = int(time.time() * 1000)
            
            # Refund any credits if partially used
            if new_execution.credits_used > 0:
                credit_service = CreditService()
                credit_service.refund_credits(session, new_execution.id)
        
        session.add(new_execution)
        session.commit()
        session.refresh(new_execution)
    
    except Exception as e:
        new_execution.status = "failed"
        new_execution.error_message = str(e)
        new_execution.completed_at = int(time.time() * 1000)
        session.add(new_execution)
        session.commit()
        session.refresh(new_execution)
    
    return ExecutionResponse(
        id=str(new_execution.id),
        workflow_id=str(new_execution.workflow_id),
        status=new_execution.status,
        input_data=json.loads(new_execution.input_data),
        output_data=json.loads(new_execution.output_data) if new_execution.output_data else None,
        error_message=new_execution.error_message,
        credits_used=new_execution.credits_used,
        execution_time_ms=new_execution.execution_time_ms,
        created_at=new_execution.created_at,
        completed_at=new_execution.completed_at
    )


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
def get_execution(
    execution_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get execution status and results."""
    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID"
        )
    
    execution = session.get(WorkflowExecution, execution_uuid)
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # Check permissions
    if execution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this execution"
        )
    
    return ExecutionResponse(
        id=str(execution.id),
        workflow_id=str(execution.workflow_id),
        status=execution.status,
        input_data=json.loads(execution.input_data),
        output_data=json.loads(execution.output_data) if execution.output_data else None,
        error_message=execution.error_message,
        credits_used=execution.credits_used,
        execution_time_ms=execution.execution_time_ms,
        created_at=execution.created_at,
        completed_at=execution.completed_at
    )


from auth import get_current_user, get_current_user_from_token

# ... (rest of imports)

@router.get("/executions/{execution_id}/stream")
async def stream_execution(
    execution_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Stream execution status updates via Server-Sent Events."""
    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID"
        )
    
    execution = session.get(WorkflowExecution, execution_uuid)
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # Check permissions
    if execution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this execution"
        )
    
    from database import engine
    from functools import partial

    async def event_generator():
        """Generate SSE events for execution status."""
        while True:
            # Create a new session for this poll to ensure fresh data and valid connection
            # We must use proper context management here
            try:
                with Session(engine) as db:
                    # Re-fetch the execution
                    current_execution = db.get(WorkflowExecution, execution_uuid)
                    
                    if not current_execution:
                        # Should not happen, but handle it
                        yield f"data: {json.dumps({'error': 'Execution not found'})}\n\n"
                        break
                    
                    # Send status update
                    data = {
                        "status": current_execution.status,
                        "credits_used": current_execution.credits_used,
                        "execution_time_ms": current_execution.execution_time_ms,
                        "error_message": current_execution.error_message
                    }
                    
                    yield f"data: {json.dumps(data)}\n\n"
                    
                    # Stop streaming if execution is complete
                    if current_execution.status in ["completed", "failed", "cancelled"]:
                        if current_execution.output_data:
                            output_data = json.loads(current_execution.output_data)
                            yield f"data: {json.dumps({'outputs': output_data})}\n\n"
                        break
            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
                
            # Wait before next update
            await asyncio.sleep(0.5)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/workflows/{workflow_id}/executions", response_model=List[ExecutionResponse])
def list_executions(
    workflow_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """List executions for a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID"
        )
    
    # Get workflow to check permissions
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
    
    # Get executions
    executions = session.exec(
        select(WorkflowExecution)
        .where(WorkflowExecution.workflow_id == workflow_uuid)
        .where(WorkflowExecution.user_id == current_user.id)
        .order_by(WorkflowExecution.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    
    return [
        ExecutionResponse(
            id=str(e.id),
            workflow_id=str(e.workflow_id),
            status=e.status,
            input_data=json.loads(e.input_data),
            output_data=json.loads(e.output_data) if e.output_data else None,
            error_message=e.error_message,
            credits_used=e.credits_used,
            execution_time_ms=e.execution_time_ms,
            created_at=e.created_at,
            completed_at=e.completed_at
        )
        for e in executions
    ]


@router.delete("/executions/{execution_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_execution(
    execution_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Cancel a running execution."""
    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID"
        )
    
    execution = session.get(WorkflowExecution, execution_uuid)
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # Check permissions
    if execution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this execution"
        )
    
    # Can only cancel running executions
    if execution.status not in ["pending", "running"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending or running executions"
        )
    
    # Update status
    execution.status = "cancelled"
    execution.completed_at = int(time.time() * 1000)
    
    # Refund credits if any were used
    if execution.credits_used > 0:
        credit_service = CreditService()
        credit_service.refund_credits(session, execution.id)
    
    session.add(execution)
    session.commit()
    
    return None
