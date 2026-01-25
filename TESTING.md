# Local Testing Guide

This document provides comprehensive instructions for testing the Clip Saver application locally.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Browser Extension Testing](#browser-extension-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

Before testing the application, ensure you have the following installed:

### Required Software
- **Python 3.9+** - For the backend server
- **Node.js 18+** and **npm** - For the frontend application
- **PostgreSQL** - Database (or use the configured Supabase instance)
- **FFmpeg** - For video processing
- **yt-dlp** - For YouTube video downloads

### Installation Commands (macOS)

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install python@3.9 node ffmpeg yt-dlp postgresql
```

---

## Environment Setup

### 1. Clone and Navigate to Project

```bash
cd /Users/amean/PROJECTS/DEV/clip-saver
```

### 2. Backend Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables

The backend uses a `.env` file located at `backend/.env`. Verify the following variables are set:

```env
# YouTube API
YOUTUBE_API_KEY=<your-youtube-api-key>

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe (for billing)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_PRICE_ID=<your-price-id>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
CLIENT_URL=http://localhost:5173

# OpenAI (for AI features)
OPENAI_API_KEY=<your-openai-api-key>

# Replicate (for AI workflows)
REPLICATE_API_TOKEN=<your-replicate-token>
```

> **Note**: The existing `.env` file contains test/development credentials. For production testing, replace with production keys.

### 4. Frontend Environment Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

The frontend also has a `.env` file at `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

---

## Backend Testing

### 1. Database Setup

```bash
# From the backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Run database migrations
alembic upgrade head

# Verify database connection
python check_db.py
```

### 2. Start the Backend Server

```bash
# Option 1: Using the start script
./start.sh

# Option 2: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend server will start at `http://localhost:8000`

### 3. Verify Backend is Running

Open your browser and navigate to:
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/info?videoId=dQw4w9WgXcQ

### 4. Test Core Backend Endpoints

#### Test Video Info Endpoint
```bash
curl "http://localhost:8000/api/info?videoId=dQw4w9WgXcQ"
```

Expected response: JSON with video metadata (title, thumbnail, duration, etc.)

#### Test Authentication
```bash
# Register a new user
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

#### Test Viral Videos Endpoint
```bash
curl "http://localhost:8000/api/youtube/viral?timeFilter=today&maxResults=10"
```

### 5. Test AI Workflows

```bash
# Test ideation endpoint (requires authentication)
curl -X POST "http://localhost:8000/api/ideation/generate" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a video about coding tutorials"}'
```

### 6. Monitor Backend Logs

Check the following log files for errors:
- `backend/server.log` - Main server logs
- `backend/error.log` - Error logs
- `backend/portal_debug.log` - Stripe portal debugging

---

## Frontend Testing

### 1. Start the Frontend Development Server

```bash
# From the frontend directory
cd frontend

# Start dev server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 2. Verify Frontend is Running

Open your browser and navigate to:
- **Main App**: http://localhost:5173

### 3. Test Frontend Features

#### Authentication Flow
1. Navigate to http://localhost:5173
2. Click "Sign Up" or "Login"
3. Create a test account
4. Verify successful login and redirect

#### Video Download Flow
1. Login to the application
2. Enter a YouTube video ID or URL
3. Click "Download" or "Analyze"
4. Verify video information is displayed
5. Test the download functionality

#### Viral Tracker
1. Navigate to the Viral Tracker section
2. Select a time filter (today, week, month)
3. Verify viral videos are displayed with metrics
4. Test sorting and filtering

#### AI Ideation
1. Navigate to the Ideation section
2. Enter a prompt or topic
3. Click "Generate Ideas"
4. Verify AI-generated content appears

#### Workflow Builder
1. Navigate to Workflows section
2. Create a new workflow
3. Add nodes and connections
4. Test workflow execution

### 4. Run Frontend Tests

```bash
# Run linter
npm run lint

# Build for production (to verify no build errors)
npm run build

# Preview production build
npm run preview
```

---

## Browser Extension Testing

### 1. Load Extension in Chrome/Brave

1. Open Chrome/Brave browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `/Users/amean/PROJECTS/DEV/clip-saver/extension` directory
6. Verify the extension appears in the extensions list

### 2. Test Extension Features

#### Popup Functionality
1. Click the extension icon in the browser toolbar
2. Verify the popup opens
3. Test login/authentication from popup
4. Verify connection to backend API

#### Content Script on YouTube
1. Navigate to any YouTube video page
2. Open browser DevTools Console
3. Look for extension-related console logs
4. Test any injected UI elements or features

#### Authentication Sync
1. Login via the web app (http://localhost:5173)
2. Open the extension popup
3. Verify authentication state is synced
4. Test logout from extension

### 3. Debug Extension

```bash
# Check extension console
# Right-click extension icon → "Inspect popup"

# Check content script console
# Open DevTools on YouTube page → Console tab
```

---

## End-to-End Testing

### Complete User Journey Test

1. **Start all services**
   ```bash
   # Terminal 1: Backend
   cd backend && source venv/bin/activate && ./start.sh
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Test Registration Flow**
   - Open http://localhost:5173
   - Register a new user account
   - Verify email/password validation
   - Verify successful registration

3. **Test Video Analysis Flow**
   - Login with test account
   - Enter a YouTube video URL
   - Verify video metadata is fetched
   - Test download functionality
   - Verify file appears in `backend/temp/`

4. **Test Viral Tracker**
   - Navigate to Viral Tracker
   - Select different time filters
   - Verify videos load correctly
   - Test video card interactions

5. **Test AI Features**
   - Navigate to Ideation
   - Generate content ideas
   - Verify AI responses
   - Test workflow creation and execution

6. **Test Billing (if applicable)**
   - Navigate to subscription/billing page
   - Test Stripe integration (use test cards)
   - Verify subscription status updates

7. **Test Browser Extension Integration**
   - Load extension in browser
   - Navigate to YouTube
   - Test extension features on YouTube pages
   - Verify data sync between extension and web app

---

## Common Issues & Troubleshooting

### Backend Issues

#### Database Connection Errors
```bash
# Check database connection
python backend/check_db.py

# Reset database (WARNING: deletes all data)
cd backend
alembic downgrade base
alembic upgrade head
```

#### Port Already in Use
```bash
# Find process using port 8000
lsof -ti:8000

# Kill the process
kill -9 $(lsof -ti:8000)
```

#### Missing Dependencies
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Frontend Issues

#### Port Already in Use
```bash
# Kill process on port 5173
kill -9 $(lsof -ti:5173)

# Or use a different port
npm run dev -- --port 5174
```

#### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors
```bash
# Clear build cache
rm -rf dist
npm run build
```

### Extension Issues

#### Extension Not Loading
- Verify manifest.json is valid
- Check for syntax errors in JavaScript files
- Look for errors in chrome://extensions/

#### Extension Not Connecting to Backend
- Verify backend is running on http://localhost:8000
- Check CORS settings in `backend/main.py`
- Verify API URLs in extension files

#### Content Script Not Injecting
- Check manifest.json permissions
- Verify content script matches patterns
- Reload the extension after changes

### General Issues

#### FFmpeg Not Found
```bash
# Install FFmpeg
brew install ffmpeg

# Verify installation
ffmpeg -version
```

#### yt-dlp Not Working
```bash
# Update yt-dlp
pip install --upgrade yt-dlp

# Or via Homebrew
brew upgrade yt-dlp
```

#### API Rate Limits
- YouTube API has daily quota limits
- Use test data or mock responses for extensive testing
- Consider implementing caching for repeated requests

---

## Testing Checklist

Use this checklist to ensure comprehensive testing:

### Backend
- [ ] Server starts without errors
- [ ] Database migrations run successfully
- [ ] API documentation accessible at /docs
- [ ] Authentication endpoints working
- [ ] Video info endpoint returns data
- [ ] Download endpoint works
- [ ] Viral tracker returns results
- [ ] AI endpoints respond correctly
- [ ] Billing/Stripe integration works
- [ ] Logs are being written correctly

### Frontend
- [ ] Dev server starts without errors
- [ ] Login/registration works
- [ ] Video search/analysis works
- [ ] Downloads initiate correctly
- [ ] Viral tracker displays data
- [ ] AI ideation generates content
- [ ] Workflow builder functions
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Production build succeeds

### Browser Extension
- [ ] Extension loads in browser
- [ ] Popup opens and displays correctly
- [ ] Authentication syncs with web app
- [ ] Content scripts inject on YouTube
- [ ] Extension communicates with backend
- [ ] No console errors in extension

### Integration
- [ ] End-to-end user journey completes
- [ ] Data persists across sessions
- [ ] Real-time updates work (if applicable)
- [ ] File uploads/downloads work
- [ ] Payment flow works (test mode)

---

## Performance Testing

### Load Testing Backend

```bash
# Install Apache Bench
brew install apache-bench

# Test endpoint performance
ab -n 1000 -c 10 http://localhost:8000/api/info?videoId=dQw4w9WgXcQ
```

### Monitor Resource Usage

```bash
# Monitor backend process
top -pid $(pgrep -f "uvicorn main:app")

# Check disk space in temp directory
du -sh backend/temp/
```

---

## Automated Testing

### Backend Unit Tests

```bash
cd backend

# Run specific test files
python test_ai_models.py
python test_ideation_ai.py
python test_ideation_e2e.py
```

### Frontend Tests (if configured)

```bash
cd frontend

# Run tests (if test framework is set up)
npm test
```

---

## Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **yt-dlp Documentation**: https://github.com/yt-dlp/yt-dlp
- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/

---

## Quick Start Commands

```bash
# Start everything in one go (requires tmux or multiple terminals)

# Terminal 1: Backend
cd /Users/amean/PROJECTS/DEV/clip-saver/backend && source venv/bin/activate && ./start.sh

# Terminal 2: Frontend
cd /Users/amean/PROJECTS/DEV/clip-saver/frontend && npm run dev

# Then load the extension manually in Chrome
```

---

## Notes

- Always test with the backend running first, as the frontend depends on it
- Use test credentials for Stripe (test mode is already configured)
- The YouTube API has quota limits - use sparingly during testing
- Clear the `backend/temp/` directory periodically to free up space
- Check logs regularly for errors and warnings
