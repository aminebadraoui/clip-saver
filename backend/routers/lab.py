from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from sqlmodel import Session, select
from database import get_session
from models import User, Clip, TitleTemplate, ThumbnailTemplate, ScriptTemplate, TitleTemplateClipLink, ThumbnailTemplateClipLink, ScriptTemplateClipLink
from auth import get_current_user
from ai_agent import extract_script_structure, extract_title_structure, extract_thumbnail_description, summarize_video
from pydantic import BaseModel
import uuid
import time

router = APIRouter(prefix="/api/lab", tags=["lab"])

# --- Request Models ---

class ExtractRequest(BaseModel):
    clipId: str

class SaveTemplateRequest(BaseModel):
    content: str # The structure/description/text
    category: str = "General"
    sourceClipId: Optional[str] = None

# --- Extraction Endpoints ---

@router.post("/extract/script")
async def extract_script_endpoint(request: ExtractRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    clip = session.get(Clip, request.clipId)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    transcript = ""
    # Try fetching transcript if not present (assuming ai_agent used to fetch)
    # But wait, clip doesn't store transcript text directly in db usually, dynamic fetch?
    # ai_agent.fetch_transcript(video_id)
    # Let's import fetch_transcript
    from ai_agent import fetch_transcript
    
    try:
        transcript = fetch_transcript(clip.videoId)
    except Exception as e:
         error_msg = str(e)
         print(f"DEBUG: Failed to fetch transcript/proxies for {clip.videoId}. Error: {error_msg}")
         raise HTTPException(status_code=400, detail=f"Transcript Error: {error_msg}")

    structure = extract_script_structure(transcript)

    # Auto-Save / Upsert Logic
    # 1. Check for existing link
    # We join ScriptTemplateClipLink to find if this clip already has a template
    # Since we want to update the latest one or creating a new one if none.
    # Actually, simpler: check if there is any link.
    
    existing_link = session.exec(
        select(ScriptTemplateClipLink).where(ScriptTemplateClipLink.clip_id == clip.id)
    ).first()

    if existing_link:
        # Update existing template
        template = session.get(ScriptTemplate, existing_link.template_id)
        if template:
            template.structure = structure
            template.created_at = int(time.time() * 1000)
            session.add(template)
            session.commit()
    else:
        # Create new
        template = ScriptTemplate(
            structure=structure,
            category="General",
            created_at=int(time.time() * 1000),
            user_id=user.id
        )
        session.add(template)
        session.commit()
        session.refresh(template)
        
        # Create link
        link = ScriptTemplateClipLink(template_id=template.id, clip_id=clip.id)
        session.add(link)
        session.commit()

    return {"structure": structure}

@router.post("/extract/title")
async def extract_title_endpoint(request: ExtractRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    clip = session.get(Clip, request.clipId)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
        
    structure = extract_title_structure(clip.title)

    # Auto-Save / Upsert Logic
    existing_link = session.exec(
        select(TitleTemplateClipLink).where(TitleTemplateClipLink.clip_id == clip.id)
    ).first()

    if existing_link:
        template = session.get(TitleTemplate, existing_link.template_id)
        if template:
            template.text = structure
            template.created_at = int(time.time() * 1000)
            session.add(template)
            session.commit()
    else:
        template = TitleTemplate(
            text=structure,
            category="General",
            created_at=int(time.time() * 1000),
            user_id=user.id
        )
        session.add(template)
        session.commit()
        session.refresh(template)
        
        link = TitleTemplateClipLink(template_id=template.id, clip_id=clip.id)
        session.add(link)
        session.commit()

    return {"structure": structure}

@router.post("/extract/thumbnail")
async def extract_thumbnail_endpoint(request: ExtractRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    clip = session.get(Clip, request.clipId)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    if not clip.thumbnail:
         raise HTTPException(status_code=400, detail="Clip has no thumbnail")

    structure = extract_thumbnail_description(clip.thumbnail)

    # Auto-Save / Upsert Logic
    existing_link = session.exec(
        select(ThumbnailTemplateClipLink).where(ThumbnailTemplateClipLink.clip_id == clip.id)
    ).first()

    if existing_link:
        template = session.get(ThumbnailTemplate, existing_link.template_id)
        if template:
            template.description = structure
            template.created_at = int(time.time() * 1000)
            session.add(template)
            session.commit()
    else:
        template = ThumbnailTemplate(
            description=structure,
            category="General",
            created_at=int(time.time() * 1000),
            user_id=user.id
        )
        session.add(template)
        session.commit()
        session.refresh(template)
        
        link = ThumbnailTemplateClipLink(template_id=template.id, clip_id=clip.id)
        session.add(link)
        session.commit()

    return {"structure": structure}

# --- Library Endpoints (Save) ---

@router.post("/save/title")
async def save_title_template(request: SaveTemplateRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    # Simple save as requested (User: "forget deduplication")
    template = TitleTemplate(
        text=request.content,
        category=request.category,
        created_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    
    if request.sourceClipId:
        link = TitleTemplateClipLink(template_id=template.id, clip_id=uuid.UUID(request.sourceClipId))
        session.add(link)
        session.commit()
        
    return template

@router.post("/save/thumbnail")
async def save_thumbnail_template(request: SaveTemplateRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    template = ThumbnailTemplate(
        description=request.content,
        category=request.category,
        created_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    
    if request.sourceClipId:
        link = ThumbnailTemplateClipLink(template_id=template.id, clip_id=uuid.UUID(request.sourceClipId))
        session.add(link)
        session.commit()

    return template

@router.post("/save/script")
async def save_script_template(request: SaveTemplateRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    template = ScriptTemplate(
        structure=request.content,
        category=request.category,
        created_at=int(time.time() * 1000),
        user_id=user.id
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    
    if request.sourceClipId:
        link = ScriptTemplateClipLink(template_id=template.id, clip_id=uuid.UUID(request.sourceClipId))
        session.add(link)
        session.commit()

    return template

# --- Library Endpoints (Get) ---

@router.get("/libraries/titles")
async def get_title_templates(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    # Fetch templates and join sources
    # select(TitleTemplate).where(TitleTemplate.user_id == user.id)
    # But we want to include sources. SQLModel automatic relationship loading works if accessing property, 
    # but for JSON response fastAPI might not serialize relationships automatically unless configured or using response_model with valid config.
    # Check if we need to explicitly join or use response model.
    # For simplicity, returning list.
    stmt = select(TitleTemplate).where(TitleTemplate.user_id == user.id).order_by(TitleTemplate.created_at.desc())
    templates = session.exec(stmt).all()
    
    # Manually populate sources info if needed for lightweight response, or trust default serialization?
    # Default serialization of SQLModel usually excludes relationships to avoid loops.
    # We'll construct a custom response list to include source details (like thumbnail/title of source clip).
    
    result = []
    for t in templates:
        sources_data = []
        for s in t.sources:
             sources_data.append({
                 "id": str(s.id),
                 "title": s.title,
                 "thumbnail": s.thumbnail
             })
        
        result.append({
            "id": str(t.id),
            "text": t.text,
            "category": t.category,
            "createdAt": t.created_at,
            "sources": sources_data
        })
    return result

@router.get("/libraries/thumbnails")
async def get_thumbnail_templates(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    stmt = select(ThumbnailTemplate).where(ThumbnailTemplate.user_id == user.id).order_by(ThumbnailTemplate.created_at.desc())
    templates = session.exec(stmt).all()
    
    result = []
    for t in templates:
        sources_data = []
        for s in t.sources:
             sources_data.append({
                 "id": str(s.id),
                 "title": s.title,
                 "thumbnail": s.thumbnail
             })
        result.append({
            "id": str(t.id),
            "description": t.description,
            "category": t.category,
            "createdAt": t.created_at,
            "sources": sources_data
        })
    return result

@router.get("/libraries/scripts")
async def get_script_templates(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    stmt = select(ScriptTemplate).where(ScriptTemplate.user_id == user.id).order_by(ScriptTemplate.created_at.desc())
    templates = session.exec(stmt).all()
    
    result = []
    for t in templates:
        sources_data = []
        for s in t.sources:
             sources_data.append({
                 "id": str(s.id),
                 "title": s.title,
                 "thumbnail": s.thumbnail
             })
        result.append({
            "id": str(t.id),
            "structure": t.structure,
            "category": t.category,
            "createdAt": t.created_at,
            "sources": sources_data
        })
    return result

@router.delete("/libraries/titles/{id}")
async def delete_title_template(id: str, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    template = session.get(TitleTemplate, id)
    if template and template.user_id == user.id:
        session.delete(template)
        session.commit()
    return {"status": "deleted"}

@router.delete("/libraries/thumbnails/{id}")
async def delete_thumbnail_template(id: str, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    template = session.get(ThumbnailTemplate, id)
    if template and template.user_id == user.id:
        session.delete(template)
        session.commit()
    return {"status": "deleted"}

@router.delete("/libraries/scripts/{id}")
async def delete_script_template(id: str, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    template = session.get(ScriptTemplate, id)
    if template and template.user_id == user.id:
        session.delete(template)
        session.commit()
    return {"status": "deleted"}

@router.post("/extract/summary")
async def extract_summary_endpoint(request: ExtractRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    clip = session.get(Clip, request.clipId)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    from ai_agent import fetch_transcript
    try:
        transcript = fetch_transcript(clip.videoId)
    except Exception as e:
         error_msg = str(e)
         print(f"DEBUG: Failed to fetch transcript/proxies for {clip.videoId}. Error: {error_msg}")
         raise HTTPException(status_code=400, detail=f"Transcript Error: {error_msg}")

    summary = summarize_video(transcript)
    
    # Save to Clip.notes ONLY if it's not an error
    if not summary.startswith("Error"):
        clip.notes = summary
        session.add(clip)
        session.commit()
        session.refresh(clip)
    else:
        # If it is an error, we return it but don't save it, 
        # so next time the frontend checks, it's still null/empty (unless we already saved garbage previously)
        pass

    return {"summary": summary}

class UpdateSummaryRequest(BaseModel):
    clipId: str
    summary: str

@router.patch("/extract/summary")
async def update_summary_endpoint(request: UpdateSummaryRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    clip = session.get(Clip, request.clipId)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.notes = request.summary
    session.add(clip)
    session.commit()
    return {"status": "updated", "summary": clip.notes}

class UpdateUserNotesRequest(BaseModel):
    clipId: str
    notes: str

@router.patch("/notes")
async def update_user_notes_endpoint(request: UpdateUserNotesRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    clip = session.get(Clip, request.clipId)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.user_notes = request.notes
    session.add(clip)
    session.commit()
    return {"status": "updated", "notes": clip.user_notes}
