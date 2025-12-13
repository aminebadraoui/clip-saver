import uuid
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import BigInteger
# from enum import Enum # Removed as it's no longer used

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: int = Field(sa_type=BigInteger)

    clips: List["Clip"] = Relationship(back_populates="user")
    folders: List["Folder"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")

class ClipTagLink(SQLModel, table=True):
    clip_id: Optional[uuid.UUID] = Field(default=None, foreign_key="clip.id", primary_key=True)
    tag_id: Optional[uuid.UUID] = Field(default=None, foreign_key="tag.id", primary_key=True)

class Tag(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    color: str
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
    channelName: Optional[str] = None

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
