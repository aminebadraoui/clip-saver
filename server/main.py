from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import yt_dlp
import os
from pathlib import Path
import shutil
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from dotenv import load_dotenv
import threading
import time
import json

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

# Global progress storage
download_progress = {}

class DownloadRequest(BaseModel):
    videoId: str

class CleanupRequest(BaseModel):
    filename: str

def progress_hook(d, task_id):
    if d['status'] == 'downloading':
        progress = 0
        try:
            if 'total_bytes' in d and d['total_bytes'] > 0:
                progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
            elif 'total_bytes_estimate' in d and d['total_bytes_estimate'] > 0:
                progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
            elif '_percent_str' in d:
                p = d.get('_percent_str', '0%').replace('%', '')
                progress = float(p)
            
            # Debug log for progress
            print(f"DEBUG: Task {task_id} - Progress: {progress}% - Keys: {list(d.keys())}")
        except Exception as e:
            print(f"Error calculating progress: {e}")
            progress = 0
        
        download_progress[task_id] = {
            "status": "downloading",
            "progress": progress,
            "speed": d.get('_speed_str', 'N/A'),
            "eta": d.get('_eta_str', 'N/A')
        }
    elif d['status'] == 'finished':
        print(f"DEBUG: Task {task_id} - Finished")
        download_progress[task_id] = {
            "status": "processing",
            "progress": 100,
            "message": "Processing video..."
        }

def run_download(video_id, task_id, output_template):
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Optimized options
    ydl_opts = {
        'format': 'bestvideo[height>=720][ext=mp4]+bestaudio[ext=m4a]/best[height>=720][ext=mp4]/best[ext=mp4]/best',
        'outtmpl': str(TEMP_DIR / "%(title).100s-%(id)s.%(ext)s"), # Limit title length
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'restrictfilenames': True, # Ensure ASCII filenames
        # 'concurrent_fragment_downloads': 4, # Removed as it might cause throttling
        'extractor_args': {'youtube': {'player_client': ['android', 'web']}}, # Use android client for better speed
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            filename = ydl.prepare_filename(info)
            basename = os.path.basename(filename)
            
            print(f"DEBUG: Generated filename: {filename}")
            print(f"DEBUG: Basename: {basename}")
            
            download_progress[task_id] = {
                "status": "completed",
                "progress": 100,
                "url": f"/temp/{basename}",
                "filename": basename
            }
    except Exception as e:
        print(f"Download failed: {str(e)}")
        download_progress[task_id] = {
            "status": "error",
            "error": str(e)
        }

@app.post("/api/download")
async def start_download(request: DownloadRequest):
    video_id = request.videoId
    if not video_id:
        raise HTTPException(status_code=400, detail="Missing videoId")
    
    # Check if file already exists
    existing_files = [f for f in os.listdir(TEMP_DIR) if video_id in f and not f.endswith('.part')]
    print(f"DEBUG: Checking for existing files with ID {video_id}. Found: {existing_files}")
    
    if existing_files:
        return JSONResponse({
            "status": "exists",
            "url": f"/temp/{existing_files[0]}",
            "filename": existing_files[0]
        })
    
    task_id = f"{video_id}_{int(time.time())}"
    output_template = str(TEMP_DIR / "%(title)s-%(id)s.%(ext)s")
    
    # Initialize progress
    download_progress[task_id] = {"status": "starting", "progress": 0}
    
    # Start background thread
    thread = threading.Thread(
        target=run_download,
        args=(video_id, task_id, output_template)
    )
    thread.start()
    
    return JSONResponse({"taskId": task_id})

import asyncio

@app.get("/api/download/progress/{task_id}")
async def get_download_progress(task_id: str):
    async def event_generator():
        while True:
            if task_id in download_progress:
                data = download_progress[task_id]
                yield f"data: {json.dumps(data)}\n\n"
                
                if data["status"] in ["completed", "error"]:
                    break
            else:
                yield f"data: {json.dumps({'status': 'error', 'error': 'Task not found'})}\n\n"
                break
            
            await asyncio.sleep(0.1)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

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

class CaptureRequest(BaseModel):
    videoId: str
    timestamp: float

@app.post("/api/capture-thumbnail")
async def capture_thumbnail(request: CaptureRequest):
    print(f"DEBUG: Received capture request for video {request.videoId} at {request.timestamp}")
    video_id = request.videoId
    timestamp = request.timestamp
    
    if not video_id:
        print("DEBUG: Missing videoId")
        raise HTTPException(status_code=400, detail="Missing videoId")

    # Create a unique filename for this capture
    base_filename = f"{video_id}_{int(timestamp)}"
    temp_video_path = TEMP_DIR / f"{base_filename}.mp4"
    output_image_path = TEMP_DIR / f"{base_filename}.jpg"
    
    print(f"DEBUG: Output path: {output_image_path}")

    # Return existing if available
    if output_image_path.exists():
         print("DEBUG: Returning existing thumbnail")
         return JSONResponse({"url": f"/temp/{output_image_path.name}"})

    try:
        print("DEBUG: Starting capture process...")
        # 1. Get the streaming URL using yt-dlp
        # We use -g to get the URL, and we select a format that is video-only or combined, 
        # preferably 720p or best available to ensure good thumbnail quality but fast response.
        cmd_get_url = [
            "yt-dlp",
            "-g",
            "-f", "bestvideo[height<=720]/best[height<=720]",
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd_get_url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            print(f"yt-dlp error: {stderr.decode()}")
            raise Exception("Failed to get video URL")
            
        stream_url = stdout.decode().strip().split('\n')[0] # Take the first URL (video)

        # 2. Use ffmpeg to extract the frame directly from the stream
        # -ss seeks to the timestamp
        # -i input url
        # -frames:v 1 captures one frame
        # -q:v 2 sets high quality jpeg
        cmd_ffmpeg = [
            "ffmpeg",
            "-ss", str(timestamp),
            "-i", stream_url,
            "-frames:v", "1",
            "-q:v", "2",
            "-y", # Overwrite
            str(output_image_path)
        ]
        
        process_ffmpeg = await asyncio.create_subprocess_exec(
            *cmd_ffmpeg,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process_ffmpeg.communicate()
        
        if process_ffmpeg.returncode != 0 or not output_image_path.exists():
             # Fallback: Try downloading a small section if streaming fails (slower but more robust)
             print("Direct stream capture failed, trying download section...")
             
             ydl_opts = {
                'format': 'bestvideo[height<=720]/best[height<=720]',
                'outtmpl': str(temp_video_path),
                'download_ranges': lambda info, ydl: [{'start_time': timestamp, 'end_time': timestamp + 1}],
                'quiet': True,
                'force_keyframes_at_cuts': True,
             }
             
             # Run blocking yt-dlp in thread
             loop = asyncio.get_event_loop()
             await loop.run_in_executor(None, lambda: yt_dlp.YoutubeDL(ydl_opts).download([f"https://www.youtube.com/watch?v={video_id}"]))
             
             # Now extract frame from local file
             cmd_ffmpeg_local = [
                "ffmpeg",
                "-i", str(temp_video_path),
                "-frames:v", "1",
                "-q:v", "2",
                "-y",
                str(output_image_path)
             ]
             
             process_local = await asyncio.create_subprocess_exec(
                *cmd_ffmpeg_local,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
             )
             await process_local.communicate()
             
             # Cleanup temp video
             if temp_video_path.exists():
                 os.remove(temp_video_path)

        if output_image_path.exists():
            return JSONResponse({"url": f"/temp/{output_image_path.name}"})
        else:
            raise Exception("Failed to generate thumbnail image")

    except Exception as e:
        print(f"Thumbnail capture error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
