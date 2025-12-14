import os
from dotenv import load_dotenv
from database import create_db_and_tables, engine
from sqlmodel import Session, select, text

# Load environment variables
load_dotenv()

print("Starting database initialization debug...")
try:
    create_db_and_tables()
    print("Database tables created successfully.")
    
    # Test connection
    with Session(engine) as session:
        result = session.exec(text("SELECT 1")).first()
        print(f"Connection test result: {result}")
        
except Exception as e:
    print(f"Error during initialization: {e}")
    import traceback
    traceback.print_exc()
