import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SCRAPECREATORS_API_KEY") or "n1lUavPVa9gl8qGoRzHwuDm6k0k2"
VIDEO_ID = "CR1TvxyLS_M"
URL = f"https://www.youtube.com/watch?v={VIDEO_ID}"

print(f"Testing ScrapeCreators for {URL}...")

try:
    response = requests.get(
        f"https://api.scrapecreators.com/v1/youtube/video/transcript?url={URL}",
        headers={"x-api-key": API_KEY}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        # Print type and first few items to understand structure
        print(f"Type: {type(data)}")
        if isinstance(data, list):
            print(f"First item: {data[0] if data else 'Empty list'}")
        elif isinstance(data, dict):
            print(f"Keys: {data.keys()}")
            # Check for common transcript keys
            if 'transcript' in data:
                print(f"Transcript field type: {type(data['transcript'])}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Exception: {e}")
