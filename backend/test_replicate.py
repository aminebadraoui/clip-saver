
import os
import replicate
from dotenv import load_dotenv

load_dotenv()

# Manually setting expected correct model
MODEL = "google/gemini-1.5-pro"

print(f"Testing model: {MODEL}")

try:
    input_data = {
        "prompt": "Say hello",
        "temperature": 0.5,
    }
    
    # Simple test
    output = ""
    for event in replicate.stream(MODEL, input=input_data):
        output += str(event)
    
    print(f"Success! Output: {output}")

except Exception as e:
    print(f"Failed: {e}")
