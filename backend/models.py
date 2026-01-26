import uuid
from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import BigInteger, Text, UniqueConstraint
# from enum import Enum # Removed as it's no longer used

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: int = Field(sa_type=BigInteger)
    
    # Stripe Subscription
    stripe_customer_id: Optional[str] = Field(default=None, index=True)
    subscription_status: Optional[str] = Field(default="inactive")
    subscription_id: Optional[str] = Field(default=None)
    cancel_at_period_end: bool = Field(default=False)
    current_period_end: Optional[int] = Field(default=None, sa_type=BigInteger)

    # Credit system
    credit_balance: int = Field(default=100)  # Starting credits for new users

    clips: List["Clip"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")
    ideations: List["VideoIdeation"] = Relationship(back_populates="user")
    spaces: List["Space"] = Relationship(back_populates="user")
    workflows: List["AIWorkflow"] = Relationship(back_populates="user")
    workflow_executions: List["WorkflowExecution"] = Relationship(back_populates="user")
    credit_transactions: List["CreditTransaction"] = Relationship(back_populates="user")
    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="user")

class RefreshToken(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    token_hash: str = Field(index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="refresh_tokens")
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked: bool = Field(default=False)

class Space(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(default="My Space")
    createdAt: int = Field(sa_type=BigInteger)
    
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="spaces")

    clips: List["Clip"] = Relationship(back_populates="space")
    tags: List["Tag"] = Relationship(back_populates="space")
    ideations: List["VideoIdeation"] = Relationship(back_populates="space")
    workflows: List["AIWorkflow"] = Relationship(back_populates="space")



class ClipTagLink(SQLModel, table=True):
    clip_id: Optional[uuid.UUID] = Field(default=None, foreign_key="clip.id", primary_key=True)
    tag_id: Optional[uuid.UUID] = Field(default=None, foreign_key="tag.id", primary_key=True)

class Tag(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    color: str
    category: str = Field(default="video") # 'video' | 'title' | 'thumbnail'
    createdAt: int = Field(sa_type=BigInteger) # Milliseconds timestamp

    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="tags")

    space_id: Optional[uuid.UUID] = Field(default=None, foreign_key="space.id")
    space: Optional["Space"] = Relationship(back_populates="tags")

    clips: List["Clip"] = Relationship(back_populates="tags", link_model=ClipTagLink)

class Clip(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("videoId", "space_id", name="unique_clip_video_space"),
    )
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    type: str = Field(default="video") # 'video' | 'clip' | 'short'
    videoId: str
    start: Optional[int] = None
    end: Optional[int] = None
    title: str
    thumbnail: str
    createdAt: int = Field(sa_type=BigInteger)
    # folderId removed
    notes: Optional[str] = None
    aiPrompt: Optional[str] = None
    originalVideoUrl: Optional[str] = None
    sourceVideoId: Optional[str] = None
    originalTitle: Optional[str] = None
    originalTitle: Optional[str] = None
    channelName: Optional[str] = None
    scriptOutline: Optional[str] = Field(default=None, sa_type=Text)

    # New Metrics
    subscriberCount: Optional[int] = None
    viewCount: Optional[int] = None
    uploadDate: Optional[str] = None
    viralRatio: Optional[float] = None
    timeSinceUploadRatio: Optional[float] = None
    timeSinceUploadRatio: Optional[float] = None
    engagementScore: Optional[float] = None
    outlierScore: Optional[float] = None
    channelAverageViews: Optional[int] = None

    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="clips")

    space_id: Optional[uuid.UUID] = Field(default=None, foreign_key="space.id")
    space: Optional["Space"] = Relationship(back_populates="clips")

    # folder relationship removed
    tags: List[Tag] = Relationship(back_populates="clips", link_model=ClipTagLink)
    notes_list: List["Note"] = Relationship(back_populates="clip", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Note(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    content: str
    category: str = Field(default="general") # 'video' | 'title' | 'thumbnail'
    createdAt: int = Field(sa_type=BigInteger)
    
    clip_id: Optional[uuid.UUID] = Field(default=None, foreign_key="clip.id")
    clip: Optional[Clip] = Relationship(back_populates="notes_list")
    
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")

    space_id: Optional[uuid.UUID] = Field(default=None, foreign_key="space.id")

class VideoIdeation(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    projectName: str
    
    # 5 Big Questions
    mainIdea: Optional[str] = Field(default=None, sa_type=Text)
    whyViewerCare: Optional[str] = Field(default=None, sa_type=Text)
    commonAssumptions: Optional[str] = Field(default=None, sa_type=Text)
    breakingAssumptions: Optional[str] = Field(default=None, sa_type=Text)
    viewerFeeling: Optional[str] = Field(default=None, sa_type=Text)

    # JSON lists stored as text
    brainstormedTitles: Optional[str] = Field(default="[]", sa_type=Text) 
    brainstormedThumbnails: Optional[str] = Field(default="[]", sa_type=Text) 
    
    scriptOutline: Optional[str] = Field(default=None, sa_type=Text)
    scriptContent: Optional[str] = Field(default=None, sa_type=Text)
    
    createdAt: int = Field(sa_type=BigInteger)
    updatedAt: int = Field(sa_type=BigInteger)
    
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="ideations")

    space_id: Optional[uuid.UUID] = Field(default=None, foreign_key="space.id")
    space: Optional["Space"] = Relationship(back_populates="ideations")

class AIWorkflow(SQLModel, table=True):
    """Represents a saved AI workflow/pipeline"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None  # Preview image URL
    is_public: bool = Field(default=False)  # Shareable with other users
    workflow_data: str = Field(sa_type=Text)  # JSON string of node graph
    created_at: int = Field(sa_type=BigInteger)
    updated_at: int = Field(sa_type=BigInteger)
    
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="workflows")
    
    space_id: Optional[uuid.UUID] = Field(default=None, foreign_key="space.id")
    space: Optional["Space"] = Relationship(back_populates="workflows")
    
    executions: List["WorkflowExecution"] = Relationship(back_populates="workflow")

class WorkflowExecution(SQLModel, table=True):
    """Tracks execution history and results"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workflow_id: uuid.UUID = Field(foreign_key="aiworkflow.id")
    status: str = Field(default="pending")  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    input_data: str = Field(sa_type=Text)  # JSON of input parameters
    output_data: Optional[str] = Field(default=None, sa_type=Text)  # JSON of results
    error_message: Optional[str] = Field(default=None, sa_type=Text)
    credits_used: int = Field(default=0)
    execution_time_ms: Optional[int] = None
    created_at: int = Field(sa_type=BigInteger)
    completed_at: Optional[int] = Field(default=None, sa_type=BigInteger)
    
    user_id: uuid.UUID = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="workflow_executions")
    
    workflow: Optional[AIWorkflow] = Relationship(back_populates="executions")
    credit_transactions: List["CreditTransaction"] = Relationship(back_populates="workflow_execution")

class CreditTransaction(SQLModel, table=True):
    """Tracks all credit additions/deductions"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    amount: int  # Positive for additions, negative for deductions
    transaction_type: str  # 'purchase', 'subscription', 'workflow_execution', 'refund', 'bonus'
    description: str
    workflow_execution_id: Optional[uuid.UUID] = Field(default=None, foreign_key="workflowexecution.id")
    stripe_payment_intent_id: Optional[str] = None
    created_at: int = Field(sa_type=BigInteger)
    
    user: Optional[User] = Relationship(back_populates="credit_transactions")
    workflow_execution: Optional[WorkflowExecution] = Relationship(back_populates="credit_transactions")

class ReplicateModelCache(SQLModel, table=True):
    """Cache for Replicate model metadata"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    model_id: str = Field(unique=True, index=True)  # e.g., "stability-ai/sdxl"
    model_name: str
    description: str = Field(sa_type=Text)
    category: str  # 'image-generation', 'video-generation', 'image-editing', 'upscaling', 'background-removal'
    input_schema: str = Field(sa_type=Text)  # JSON schema
    output_schema: str = Field(sa_type=Text)  # JSON schema
    cost_per_run: float  # Estimated cost in credits
    is_active: bool = Field(default=True)
    last_updated: int = Field(sa_type=BigInteger)
