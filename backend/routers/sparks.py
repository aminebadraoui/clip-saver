from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models import Spark, User, Space
from auth import get_current_user
from dependencies import get_current_space, get_current_space_optional
from pydantic import BaseModel
import uuid
import time

router = APIRouter(prefix="/api/sparks", tags=["sparks"])

class SparkCreate(BaseModel):
    content: str
    title: Optional[str] = None
    status: Optional[str] = "inbox"

class SparkUpdate(BaseModel):
    content: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None

@router.post("/", response_model=Spark)
async def create_spark(
    spark_data: SparkCreate,
    user: User = Depends(get_current_user),
    current_space: Space = Depends(get_current_space),
    session: Session = Depends(get_session)
):
    """Create a new spark"""
    now = int(time.time() * 1000)
    new_spark = Spark(
        id=uuid.uuid4(),
        content=spark_data.content,
        title=spark_data.title,
        status=spark_data.status or "inbox",
        createdAt=now,
        updatedAt=now,
        user_id=user.id,
        space_id=current_space.id
    )
    
    session.add(new_spark)
    session.commit()
    session.refresh(new_spark)
    
    return new_spark

@router.get("/", response_model=List[Spark])
async def list_sparks(
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    current_space: Optional[Space] = Depends(get_current_space_optional),
    session: Session = Depends(get_session)
):
    """Get all sparks, optionally filtered by status and space"""
    query = select(Spark).where(Spark.user_id == user.id)
    
    if current_space:
        query = query.where(Spark.space_id == current_space.id)
        
    if status:
        query = query.where(Spark.status == status)
        
    query = query.order_by(Spark.createdAt.desc())
    
    return session.exec(query).all()

@router.get("/{spark_id}", response_model=Spark)
async def get_spark(
    spark_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific spark"""
    spark = session.exec(select(Spark).where(Spark.id == spark_id, Spark.user_id == user.id)).first()
    if not spark:
        raise HTTPException(status_code=404, detail="Spark not found")
    return spark

@router.put("/{spark_id}", response_model=Spark)
async def update_spark(
    spark_id: uuid.UUID,
    update_data: SparkUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a spark"""
    spark = session.exec(select(Spark).where(Spark.id == spark_id, Spark.user_id == user.id)).first()
    if not spark:
        raise HTTPException(status_code=404, detail="Spark not found")
    
    if update_data.content is not None:
        spark.content = update_data.content
    if update_data.title is not None:
        spark.title = update_data.title
    if update_data.status is not None:
        spark.status = update_data.status
        
    spark.updatedAt = int(time.time() * 1000)
    
    session.add(spark)
    session.commit()
    session.refresh(spark)
    return spark

@router.delete("/{spark_id}")
async def delete_spark(
    spark_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a spark"""
    spark = session.exec(select(Spark).where(Spark.id == spark_id, Spark.user_id == user.id)).first()
    if not spark:
        raise HTTPException(status_code=404, detail="Spark not found")
    
    session.delete(spark)
    session.commit()
    return {"ok": True}
