from sqlmodel import Session, select
from models import User, Space, Clip, Tag, VideoIdeation, Note
from database import engine
import uuid
import time

def migrate_user_data(email: str):
    with Session(engine) as session:
        # 1. Get User
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"Found user: {user.email} (ID: {user.id})")

        # 2. Get or Create Space
        # Check for existing spaces
        space = session.exec(select(Space).where(Space.user_id == user.id)).first()
        
        if not space:
            print("No space found. Creating 'My Space'...")
            space = Space(
                name="My Space",
                createdAt=int(time.time() * 1000),
                user_id=user.id
            )
            session.add(space)
            session.commit()
            session.refresh(space)
            print(f"Created space: {space.name} (ID: {space.id})")
        else:
            print(f"Using existing space: {space.name} (ID: {space.id})")

        # 3. Update Data
        
        # Update Clips
        clips = session.exec(select(Clip).where(Clip.user_id == user.id, Clip.space_id == None)).all()
        print(f"Found {len(clips)} clips to migrate.")
        for clip in clips:
            clip.space_id = space.id
            session.add(clip)
            
        # Update Tags
        tags = session.exec(select(Tag).where(Tag.user_id == user.id, Tag.space_id == None)).all()
        print(f"Found {len(tags)} tags to migrate.")
        for tag in tags:
            tag.space_id = space.id
            session.add(tag)

        # Update Ideations
        ideations = session.exec(select(VideoIdeation).where(VideoIdeation.user_id == user.id, VideoIdeation.space_id == None)).all()
        print(f"Found {len(ideations)} ideations to migrate.")
        for ideation in ideations:
            ideation.space_id = space.id
            session.add(ideation)
            
        # Update Notes
        notes = session.exec(select(Note).where(Note.user_id == user.id, Note.space_id == None)).all()
        print(f"Found {len(notes)} notes to migrate.")
        for note in notes:
            note.space_id = space.id
            session.add(note)

        session.commit()
        print("Migration complete successfully.")

if __name__ == "__main__":
    email = "aminebadraoui94@gmail.com"
    migrate_user_data(email)
