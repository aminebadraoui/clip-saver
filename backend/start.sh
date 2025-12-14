#!/bin/bash

# Add ffmpeg to PATH for this session
FFMPEG_DIR="$(pwd)/bin"
export PATH="$FFMPEG_DIR:$PATH"

# Activate virtual environment
source venv/bin/activate

# Run the server
echo "Starting FastAPI server on http://localhost:3001"
uvicorn main:app --host 0.0.0.0 --port 3001
