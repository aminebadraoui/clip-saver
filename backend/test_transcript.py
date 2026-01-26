from youtube_transcript_api import YouTubeTranscriptApi
import sys

print(f"Python executable: {sys.executable}")
print(f"Type: {type(YouTubeTranscriptApi)}")
print(f"Dir: {dir(YouTubeTranscriptApi)}")

try:
    print("Testing instantiation...")
    api = YouTubeTranscriptApi()
    print("Instantiation successful.")
    
    print("Testing instance .list() ...")
    res = api.list("CR1TvxyLS_M")
    print(f"Success instance .list(): {type(res)} {res}")
except Exception as e:
    print(f"Instance test failed: {e}")

try:
    print("\nTesting instance .fetch() ...")
    api = YouTubeTranscriptApi()
    res = api.fetch("CR1TvxyLS_M")
    print(f"Success instance .fetch(): {type(res)} {res}") # Likely list of dicts
except Exception as e:
    print(f"Instance fetch failed: {e}")
