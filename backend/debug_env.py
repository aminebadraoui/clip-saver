import os
from dotenv import load_dotenv

load_dotenv()

print(f"CLIENT_URL from env: {os.getenv('CLIENT_URL')}")
