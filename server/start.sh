#!/bin/bash

# Download static ffmpeg binary if not present
FFMPEG_DIR="$(pwd)/bin"
FFMPEG_BIN="$FFMPEG_DIR/ffmpeg"

if [ ! -f "$FFMPEG_BIN" ]; then
    echo "Downloading static ffmpeg binary..."
    mkdir -p "$FFMPEG_DIR"
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        FFMPEG_URL="https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip"
        curl -L "$FFMPEG_URL" -o "$FFMPEG_DIR/ffmpeg.zip"
        unzip -o "$FFMPEG_DIR/ffmpeg.zip" -d "$FFMPEG_DIR"
        rm "$FFMPEG_DIR/ffmpeg.zip"
        chmod +x "$FFMPEG_BIN"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
        curl -L "$FFMPEG_URL" -o "$FFMPEG_DIR/ffmpeg.tar.xz"
        tar -xf "$FFMPEG_DIR/ffmpeg.tar.xz" -C "$FFMPEG_DIR" --strip-components=1
        rm "$FFMPEG_DIR/ffmpeg.tar.xz"
        chmod +x "$FFMPEG_BIN"
    else
        echo "ERROR: Unsupported OS. Please install ffmpeg manually."
        exit 1
    fi
    
    echo "ffmpeg downloaded to $FFMPEG_BIN"
fi

# Add ffmpeg to PATH for this session
export PATH="$FFMPEG_DIR:$PATH"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the server
echo "Starting FastAPI server on http://localhost:3001"
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
