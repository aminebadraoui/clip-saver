from sqlmodel import text
from database import engine

def check_schema():
    with engine.connect() as conn:
        try:
            print("Checking clip columns:")
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'clip';"))
            print([row[0] for row in result])
            
            print("Checking folder columns:")
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'folder';"))
            print([row[0] for row in result])

            print("Checking tag columns:")
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'tag';"))
            print([row[0] for row in result])
            
        except Exception as e:
            print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_schema()
