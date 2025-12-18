import requests
import getpass
import sys

# Configuration
API_URL = "https://api.clipcoba.com"
EMAIL = "amean.mgmt@gmail.com"  # Default from your message

def unlock_subscription():
    print(f"--- Emergency Unlock Tool for {API_URL} ---")
    
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    password = getpass.getpass("Enter your password: ")
    
    try:
        login_resp = requests.post(
            f"{API_URL}/auth/login",
            data={"username": EMAIL, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_resp.status_code != 200:
            print(f"❌ Login failed: {login_resp.status_code} - {login_resp.text}")
            return
            
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            print("❌ No access token returned.")
            return
            
        print("✅ Login successful.")
        
        # 2. Call Sync
        print("Triggering subscription sync...")
        sync_resp = requests.post(
            f"{API_URL}/billing/sync",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if sync_resp.status_code == 200:
            result = sync_resp.json()
            print("✅ Sync successful!")
            print(f"Status: {result.get('status')}")
            print(f"User Data: {result.get('user')}")
            print("\n🎉 You should now have access on the dashboard.")
        else:
            print(f"❌ Sync failed: {sync_resp.status_code} - {sync_resp.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    unlock_subscription()
