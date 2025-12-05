
import sqlite3
from sqlalchemy import create_engine, text
from database import engine

def add_column():
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE clip ADD COLUMN "originalTitle" VARCHAR'))
        conn.commit()
        print("Added originalTitle column to clip table")

if __name__ == "__main__":
    add_column()
