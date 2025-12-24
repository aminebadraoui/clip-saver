#!/bin/bash

# Configuration
API_URL="https://api.clipcoba.com"
# API_URL="http://localhost:3001" # Uncomment for local testing

TIMESTAMP=$(date +%s)
EMAIL="tester_${TIMESTAMP}@clipcoba.com"
PASSWORD="TestPassword123!"

echo "🔹 Creating account for: $EMAIL"

# 1. Register User (Returns Access Token)
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract Token
TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed or no token received."
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ Account created!"
# echo "Token: $TOKEN"

# 2. Activate Subscription
echo "🔹 Activating PRO subscription..."

ACTIVATE_RESPONSE=$(curl -s -X POST "$API_URL/billing/debug-activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Check success (simple check for "activated" string)
if [[ "$ACTIVATE_RESPONSE" == *"activated"* ]]; then
  echo "✅ Subscription fully unlocked!"
  echo ""
  echo "==========================================="
  echo "Credentials for Reviewer:"
  echo "Username: $EMAIL"
  echo "Password: $PASSWORD"
  echo "==========================================="
else
  echo "❌ Activation failed."
  echo "Response: $ACTIVATE_RESPONSE"
fi
