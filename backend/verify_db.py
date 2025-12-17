from sqlmodel import text
from database import engine

def verify():
    with engine.connect() as conn:
        try:
            # Check for scriptOutline in clip - Note: postgres might lower case it unless quoted.
            # In fix_db_ideation we quoted "scriptOutline".
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='clip' AND column_name='scriptOutline'"))
            if res.first():
                print("scriptOutline column exists in clip.")
            else:
                print("scriptOutline column DOES NOT EXIST in clip.")

            # Check for videoideation table
            res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name='videoideation'"))
            if res.first():
                print("videoideation table exists.")
            else:
                print("videoideation table DOES NOT EXIST.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    verify()
