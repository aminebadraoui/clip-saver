from ai_agent import fetch_transcript
import sys

# Test Video ID (MrBeast: I Survived 50 Hours In Antarctica)
VIDEO_ID = "CR1TvxyLS_M" # User's video with en-GB transcript

print(f"Testing fetch_transcript with ID: {VIDEO_ID}")
try:
    transcript = fetch_transcript(VIDEO_ID)
    if transcript:
        print(f"SUCCESS! Transcript length: {len(transcript)} chars")
        print(f"Snippet: {transcript[:100]}...")
    else:
        print("FAILED to get transcript (returned None)")
except Exception as e:
    print(f"CRITICAL ERROR in fetch_transcript: {e}")
    import traceback
    traceback.print_exc()
