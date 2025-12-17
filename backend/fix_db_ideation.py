from sqlmodel import text, SQLModel
from database import engine
# Import models so SQLModel knows about them
from models import VideoIdeation, Clip

def fix_schema():
    print("Creating new tables if not exist...")
    SQLModel.metadata.create_all(engine)
    
    with engine.connect() as conn:
        try:
            print("Adding scriptOutline column to clip...")
            # Note: Postgres column names are case sensitive if quoted.
            # In models.py it is scriptOutline
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "scriptOutline" TEXT;'))
            conn.commit()
            print("Schema updated successfully.")
        except Exception as e:
            print(f"Error updating schema: {e}")
            conn.rollback()

if __name__ == "__main__":
    fix_schema()
