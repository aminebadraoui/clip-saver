import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"
# Using the port from USER_METADATA (8000)

def test_ai_features():
    print("Starting AI Features Test...")
    
    # 1. Login
    print("Logging in...")
    email = "test@example.com" # Assuming this user exists or register
    password = "password123"
    
    # Try register first just in case
    try:
        requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    except:
        pass

    auth_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if auth_res.status_code != 200:
        print(f"Login failed: {auth_res.text}")
        return
        
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in.")

    # Concept Data
    concept_data = {
        "mainIdea": "SpaceX is actually a front for alien communication",
        "whyViewerCare": "It explains why they are launching so many satellites",
        "commonAssumptions": "SpaceX is for internet and mars colonization",
        "breakingAssumptions": "Starlink is a planetary receiver array",
        "viewerFeeling": "Mind blown, suspicious",
        "inspirationTitles": [
            {"text": "The Secret Reason Elon Bought Twitter", "id": "1"},
            {"text": "Why NASA is Scared of SpaceX", "id": "2"}
        ]
    }

    # 2. Test Generate Titles
    print("\nTesting Generate Titles...")
    titles_res = requests.post(
        f"{BASE_URL}/api/ideation/generate-titles", 
        json=concept_data, 
        headers=headers
    )
    if titles_res.status_code == 200:
        print("Generate Titles: SUCCESS")
        print(json.dumps(titles_res.json(), indent=2))
        new_titles = titles_res.json()["titles"]
    else:
        print(f"Generate Titles FAILED: {titles_res.text}")
        new_titles = []

    # 3. Test Readapt Outline
    print("\nTesting Readapt Outline...")
    mock_outline = """
    ## Hook
    Show a rocket launching.
    ## Setup
    Explain standard SpaceX mission.
    ## Conflict
    Reveal the anomaly in the data.
    ## Climax
    The signal is received.
    """
    
    readapt_payload = {
        "outline": mock_outline,
        "conceptData": concept_data
    }
    
    readapt_res = requests.post(
        f"{BASE_URL}/api/ideation/readapt-outline",
        json=readapt_payload,
        headers=headers
    )
    
    if readapt_res.status_code == 200:
        print("Readapt Outline: SUCCESS")
        print(readapt_res.json()["outline"][:100] + "...")
        adapted_outline = readapt_res.json()["outline"]
    else:
        print(f"Readapt Outline FAILED: {readapt_res.text}")
        adapted_outline = mock_outline

    # 4. Test Generate Script
    print("\nTesting Generate Script...")
    script_payload = {
        "outline": adapted_outline,
        "titles": new_titles,
        "conceptData": concept_data
    }
    
    script_res = requests.post(
        f"{BASE_URL}/api/ideation/generate-script",
        json=script_payload,
        headers=headers
    )
    
    if script_res.status_code == 200:
        print("Generate Script: SUCCESS")
        print(script_res.json()["script"][:100] + "...")
    else:
        print(f"Generate Script FAILED: {script_res.text}")

if __name__ == "__main__":
    test_ai_features()
