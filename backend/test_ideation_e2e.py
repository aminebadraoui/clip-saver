import requests
import json
import time

BASE_URL = "http://localhost:3001"

def test_ideation_flow():
    print("Starting Ideation E2E Test...")
    
    # 1. Login to get token
    print("Logging in...")
    # Assuming a test user exists or we can register one. I'll try to register a temp one.
    email = f"test_{int(time.time())}@example.com"
    password = "password123"
    
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if reg_res.status_code == 200 or reg_res.status_code == 400: # 400 if exists
        pass
    else:
        print(f"Register failed: {reg_res.text}")
        return

    auth_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if auth_res.status_code != 200:
        print(f"Login failed: {auth_res.text}")
        return
        
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 2. Create Project
    print("Creating project...")
    create_res = requests.post(f"{BASE_URL}/api/ideation/", json={"projectName": "Test Project"}, headers=headers)
    if create_res.status_code != 200:
        print(f"Create failed: {create_res.text}")
        return
    project = create_res.json()
    project_id = project["id"]
    print(f"Project created: {project_id}")
    
    # 3. List projects
    print("Listing projects...")
    list_res = requests.get(f"{BASE_URL}/api/ideation/", headers=headers)
    projects = list_res.json()
    if not any(p["id"] == project_id for p in projects):
        print("Project not found in list")
        return
    print("List verify: OK")

    # 4. Update Project (Main Idea & Titles)
    print("Updating project...")
    titles = [{"id": "1", "text": "Awesome Video Idea", "score": 5}]
    update_data = {
        "mainIdea": "Test main idea",
        "brainstormedTitles": titles
    }
    update_res = requests.put(f"{BASE_URL}/api/ideation/{project_id}", json=update_data, headers=headers)
    if update_res.status_code != 200:
        print(f"Update failed: {update_res.text}")
        return
    
    updated_project = update_res.json()
    # Check if titles persisted (serialized)
    stored_titles = json.loads(updated_project["brainstormedTitles"])
    if stored_titles[0]["text"] != "Awesome Video Idea":
        print(f"Titles not saved correctly: {updated_project['brainstormedTitles']}")
        return
    print("Update verify: OK")
    
    # 5. Outline Stub (Optional, needs existing clip)
    # We'll skip creating a clip for now unless we have one.
    # But we can verify the stub endpoint exists
    
    print("All tests passed!")

if __name__ == "__main__":
    test_ideation_flow()
