from sqlmodel import Session, select
from database import engine
from models import VideoIdeation, Space, User
import time

def fix_legacy_ideations():
    with Session(engine) as session:
        # Find ideations with no space
        statement = select(VideoIdeation).where(VideoIdeation.space_id == None)
        ideations = session.exec(statement).all()
        
        print(f"Found {len(ideations)} ideations with no Space ID.")
        
        if not ideations:
            return

        updated_count = 0
        for ideation in ideations:
            # Find user's default space
            user = session.get(User, ideation.user_id)
            if not user:
                print(f"Skipping ideation {ideation.id} (User {ideation.user_id} not found)")
                continue
                
            # Get spaces for user
            spaces_stmt = select(Space).where(Space.user_id == user.id)
            spaces = session.exec(spaces_stmt).all()
            
            target_space = None
            
            if not spaces:
                # Create default space if none exists
                print(f"User {user.email} has no spaces. Creating 'My Space'.")
                new_space = Space(name="My Space", createdAt=int(time.time()*1000), user_id=user.id)
                session.add(new_space)
                # Need commit to get ID
                session.commit()
                session.refresh(new_space)
                target_space = new_space
            else:
                # Use first space
                target_space = spaces[0]
            
            ideation.space_id = target_space.id
            session.add(ideation)
            updated_count += 1
            
        session.commit()
        print(f"Successfully migrated {updated_count} ideations to default spaces.")

if __name__ == "__main__":
    fix_legacy_ideations()
