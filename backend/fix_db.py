from sqlmodel import text
from database import engine

def fix_schema():
    with engine.connect() as conn:
        try:
            print("Adding metrics columns to clip...")
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "subscriberCount" INTEGER;'))
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "viewCount" INTEGER;'))
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "uploadDate" TEXT;'))
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "viralRatio" FLOAT;'))
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "timeSinceUploadRatio" FLOAT;'))
            conn.execute(text('ALTER TABLE clip ADD COLUMN IF NOT EXISTS "engagementScore" FLOAT;'))
            conn.commit()
            print("Schema updated successfully.")
        except Exception as e:
            print(f"Error updating schema: {e}")
            conn.rollback()

if __name__ == "__main__":
    fix_schema()
