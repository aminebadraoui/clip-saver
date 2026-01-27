import sys
import os

print(f"Python executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")
print("sys.path:")
for p in sys.path:
    print(f"  {p}")

try:
    import sqlalchemy
    print(f"SQLAlchemy imported successfully. Version: {sqlalchemy.__version__}")
    print(f"File: {sqlalchemy.__file__}")
except ImportError as e:
    print(f"Failed to import sqlalchemy: {e}")

try:
    import sqlmodel
    print(f"SQLModel imported successfully.")
except ImportError as e:
    print(f"Failed to import sqlmodel: {e}")
