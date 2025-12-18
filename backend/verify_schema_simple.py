from sqlmodel import create_engine, inspect, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found")
    exit(1)

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('tag')]

if 'space_id' in columns:
    print("SUCCESS: space_id column found in tag table")
else:
    print("FAILURE: space_id column NOT found in tag table")
    print("Columns found:", columns)
