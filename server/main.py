from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import yt_dlp
import os
from pathlib import Path
import shutil

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure temp directory exists
TEMP_DIR = Path(__file__).parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)

# Serve static files from temp directory
app.mount("/temp", StaticFiles(directory=str(TEMP_DIR)), name="temp")

class DownloadRequest(BaseModel):
    videoId: str

class CleanupRequest(BaseModel):
    filename: str

@app.post("/api/download")
async def download_video(request: DownloadRequest):
    video_id = request.videoId
    
    if not video_id:
        raise HTTPException(status_code=400, detail="Missing videoId")
    
    # Check if file already exists
    existing_files = [f for f in os.listdir(TEMP_DIR) if video_id in f]
    if existing_files:
        return JSONResponse({
            "url": f"/temp/{existing_files[0]}",
            "filename": existing_files[0]
        })
    
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    output_template = str(TEMP_DIR / "%(title)s-%(id)s.%(ext)s")
    
    print(f"Downloading video: {video_id}")
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_template,
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            filename = ydl.prepare_filename(info)
            basename = os.path.basename(filename)
            
            print(f"Download complete: {basename}")
            
            return JSONResponse({
                "url": f"/temp/{basename}",
                "filename": basename
            })
    except Exception as e:
        print(f"Download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.delete("/api/cleanup")
async def cleanup_video(request: CleanupRequest):
    filename = request.filename
    
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    
    # Security check: prevent path traversal
    if "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    file_path = TEMP_DIR / filename
    
    if file_path.exists():
        os.unlink(file_path)
        print(f"Deleted file: {file_path}")
    
    return JSONResponse({"success": True})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
