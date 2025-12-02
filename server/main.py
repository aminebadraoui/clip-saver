from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import yt_dlp
import os
from pathlib import Path
import shutil
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

# Remove global initialization to avoid stale connections/thread-safety issues
# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
# youtube = None
# if YOUTUBE_API_KEY:
#     youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
# else:
#     print("WARNING: YOUTUBE_API_KEY not found in environment variables. Viral tracker will not work.")

class DownloadRequest(BaseModel):
    videoId: str

class CleanupRequest(BaseModel):
    filename: str

@app.post("/api/download")
async def download_video(request: DownloadRequest):
    # ... (keep existing download_video code)
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
        # Run blocking yt-dlp in a thread pool
        # Note: yt-dlp is blocking, so we should ideally run it in a thread pool too, 
        # but for now we focus on the viral endpoint fix.
        # Actually, let's keep download_video as is for now if it was working, 
        # but technically it should also be 'def' or run_in_executor.
        # However, the user issue is specifically about the viral endpoint.
        
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

@app.get("/api/youtube/viral")
def get_viral_videos(timeFilter: str = "today", maxResults: int = 50, q: str = None):
    # Initialize client per request to ensure thread safety and fresh connections
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="YouTube API not configured. Please set YOUTUBE_API_KEY.")
    
    try:
        # Build service inside the request
        # cache_discovery=True is default and helps performance
        youtube = build("youtube", "v3", developerKey=api_key)
        
        # Calculate publishedAfter timestamp based on timeFilter
        now = datetime.utcnow()
        time_filters = {
            "hour": now - timedelta(hours=1),
            "today": now - timedelta(days=1),
            "week": now - timedelta(weeks=1),
            "month": now - timedelta(days=30),
            "year": now - timedelta(days=365)
        }
        
        if timeFilter not in time_filters:
            raise HTTPException(status_code=400, detail=f"Invalid timeFilter. Must be one of: {', '.join(time_filters.keys())}")
        
        published_after = time_filters[timeFilter].isoformat("T") + "Z"
        
        # Step 1: Search for recent videos
        search_params = {
            "part": "id,snippet",
            "type": "video",
            "publishedAfter": published_after,
            "order": "viewCount",
            "maxResults": min(maxResults, 50),
            "relevanceLanguage": "en",
            "safeSearch": "moderate"
        }
        
        if q:
            search_params["q"] = q
            
        search_response = youtube.search().list(**search_params).execute()
        
        if not search_response.get("items"):
            return JSONResponse({"videos": []})
        
        # Extract video IDs
        video_ids = [item["id"]["videoId"] for item in search_response["items"]]
        
        # Step 2: Get video statistics
        videos_response = youtube.videos().list(
            part="statistics,snippet",
            id=",".join(video_ids)
        ).execute()
        
        # Extract channel IDs
        channel_ids = list(set([video["snippet"]["channelId"] for video in videos_response["items"]]))
        
        # Step 3: Get channel statistics
        channels_response = youtube.channels().list(
            part="statistics,snippet",
            id=",".join(channel_ids)
        ).execute()
        
        # Create channel lookup
        channels = {
            channel["id"]: {
                "subscriberCount": int(channel["statistics"].get("subscriberCount", 1)),
                "channelTitle": channel["snippet"]["title"]
            }
            for channel in channels_response["items"]
        }
        
        # Step 4: Calculate viral ratio and build response
        viral_videos = []
        for video in videos_response["items"]:
            channel_id = video["snippet"]["channelId"]
            channel_info = channels.get(channel_id, {"subscriberCount": 1, "channelTitle": "Unknown"})
            
            view_count = int(video["statistics"].get("viewCount", 0))
            subscriber_count = max(channel_info["subscriberCount"], 1)  # Avoid division by zero
            viral_ratio = view_count / subscriber_count
            
            viral_videos.append({
                "videoId": video["id"],
                "title": video["snippet"]["title"],
                "thumbnail": video["snippet"]["thumbnails"]["high"]["url"],
                "channelName": channel_info["channelTitle"],
                "channelId": channel_id,
                "viewCount": view_count,
                "subscriberCount": subscriber_count,
                "viralRatio": round(viral_ratio, 4),
                "publishedAt": video["snippet"]["publishedAt"],
                "url": f"https://www.youtube.com/watch?v={video['id']}"
            })
        
        # Sort by viral ratio (highest first)
        viral_videos.sort(key=lambda x: x["viralRatio"], reverse=True)
        
        return JSONResponse({"videos": viral_videos})
        
    except Exception as e:
        print(f"YouTube API error: {str(e)}")
        # Log the full traceback for debugging if needed
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")

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
