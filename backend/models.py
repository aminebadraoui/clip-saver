import uuid
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import BigInteger, Text
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

    clips: List["Clip"] = Relationship(back_populates="user")
    folders: List["Folder"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")
    ideations: List["VideoIdeation"] = Relationship(back_populates="user")

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

    clips: List["Clip"] = Relationship(back_populates="tags", link_model=ClipTagLink)

class Folder(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    parentId: Optional[uuid.UUID] = Field(default=None, foreign_key="folder.id")
    category: str = Field(default="video") # 'video' | 'image'
    createdAt: int = Field(sa_type=BigInteger)

    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="folders")

    clips: List["Clip"] = Relationship(back_populates="folder")

class Clip(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    type: str = Field(default="video") # 'video' | 'clip'
    videoId: str
    start: Optional[int] = None
    end: Optional[int] = None
    title: str
    thumbnail: str
    createdAt: int = Field(sa_type=BigInteger)
    folderId: Optional[uuid.UUID] = Field(default=None, foreign_key="folder.id")
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
    engagementScore: Optional[float] = None

    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="clips")

    folder: Optional[Folder] = Relationship(back_populates="clips")
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
