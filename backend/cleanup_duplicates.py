from sqlmodel import Session, select, func, col
from database import engine
from models import Clip
import sys

def cleanup_all_duplicates():
    with Session(engine) as session:
        print("Scanning for all duplicates...")
        
        # Find groups of duplicates
        # Group by videoId and space_id
        statement = select(Clip.videoId, Clip.space_id).group_by(Clip.videoId, Clip.space_id).having(func.count(Clip.id) > 1)
        duplicates_groups = session.exec(statement).all()
        
        print(f"Found {len(duplicates_groups)} groups with duplicates.")
        
        for vid, sid in duplicates_groups:
            if not sid: continue
            
            # Get all clips for this group
            clips = session.exec(select(Clip).where(Clip.videoId == vid, Clip.space_id == sid)).all()
            
            if len(clips) > 1:
                # Sort by creation date
                clips.sort(key=lambda x: x.createdAt)
                
                original = clips[0]
                to_delete = clips[1:]
                
                print(f"fixing duplicate group for VID {vid} in Space {sid}:")
                print(f"  Keeping: {original.id} ({original.createdAt})")
                
                for c in to_delete:
                    print(f"  Deleting: {c.id} ({c.createdAt})")
                    session.delete(c)
        
        session.commit()
        print("Full cleanup complete.")

if __name__ == "__main__":
    cleanup_all_duplicates()
