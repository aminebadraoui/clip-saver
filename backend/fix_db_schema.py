
import sqlite3
from sqlalchemy import create_engine, text
from database import engine

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE clip ADD COLUMN "transcript" TEXT'))
            conn.commit()
            print("Added transcript column to clip table")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_column()
