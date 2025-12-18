import requests
import os
from dotenv import load_dotenv

load_dotenv()

# We need a valid token. Since I can't easily get one from here without login flow,
# I will use a simplified approach assuming I can run this against the local backend 
# using a hardcoded token if I had one, OR I can just skip the API and inspect the backend function environment directly.

# Actually, the best way is to emulate the backend function environment.
import stripe
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock env vars
os.environ["CLIENT_URL"] = "http://localhost:5173"
CLIENT_URL = os.getenv("CLIENT_URL")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Hardcode the customer ID for the user we know exists
CUSTOMER_ID = "cus_Td1ymnEnFf428Q"

try:
    print(f"Creating portal session for {CUSTOMER_ID}")
    print(f"Return URL: {CLIENT_URL}/settings")
    
    session = stripe.billing_portal.Session.create(
        customer=CUSTOMER_ID,
        return_url=f'{CLIENT_URL}/settings',
    )
    
    print("SUCCESS!")
    print(f"URL: {session.url}")
except Exception as e:
    print(f"FAILED: {e}")
