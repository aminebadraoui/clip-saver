from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
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
# Load environment variables first
load_dotenv()

import threading
import time
import json
import statistics
from sqlmodel import Session, select
from database import get_session, engine, create_db_and_tables
from models import Clip, Tag, ClipTagLink, User, Note
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from auth import get_password_hash, verify_password, create_access_token, get_current_user, get_active_subscriber, ACCESS_TOKEN_EXPIRE_MINUTES
from routers import ideation as ideation_router
from routers import billing as billing_router
from routers import users as users_router
from routers import spaces
from dependencies import get_current_space
from models import Space

# Valid base tags
BASE_TAGS = {
    "video": [
        "educational", "entertainment", "2d animation", "3d animation", 
        "anime style", "talking head", "compilation", "documentary", 
        "avatar", "vlog", "motivational"
    ],
    "title": [
        "List", "How to", "Casual", "Bold claim", "Order", "Personal experience", "Authority"
    ],
    "thumbnail": [
        "High contrast", "Polished", "Amateur", "Face", "No face", "Text", "Graph", "Screenshot", "Minimalist"
    ]
}

def init_global_tags(session: Session):
    for category, tags in BASE_TAGS.items():
        for tag_name in tags:
            # Check if exists as a global tag with same category
            existing = session.exec(select(Tag).where(Tag.name == tag_name, Tag.user_id == None, Tag.category == category)).first()
            if not existing:
                # Create global tag
                tag = Tag(
                    name=tag_name,
                    color="#71717a", # Default gray
                    category=category,
                    createdAt=int(time.time() * 1000),
                    user_id=None
                )
                try:
                    session.add(tag)
                    session.commit()
                except Exception as e:
                    print(f"Error creating tag {tag_name}: {e}")
                    session.rollback()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    # Initialize global tags
    with Session(engine) as session:
        init_global_tags(session)
    yield

app = FastAPI(lifespan=lifespan)

# Trust proxy headers (Traefik/Coolify) to ensure https redirects
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://www.youtube.com",
        "https://www.clipcoba.com",
        "https://www.dev.clipcoba.com",
        "https://clipcoba.com"
    ],
    allow_origin_regex=r"https://.*\.clipcoba\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ideation_router.router)
app.include_router(billing_router.router)
app.include_router(users_router.router)
app.include_router(spaces.router)

# Ensure temp directory exists
# forcing reload for env vars 2
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

def calculate_outlier_score(video_view_count: int, channel_id: str):
    """
    Calculates the outlier score by comparing the video's views to the median views
    of the channel's most recent 30 videos.
    Returns: (score, median_views)
    """
    if not video_view_count or not channel_id:
        return None, None
        
    try:
        # Construct channel videos URL
        channel_url = f"https://www.youtube.com/channel/{channel_id}/videos"
        
        ydl_opts = {
            'extract_flat': True, # Only get metadata, don't download
            'playlistend': 30,    # Last 30 videos
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)
            
            if 'entries' not in info:
                return None, None
                
            views = []
            for entry in info['entries']:
                # entry is a dict with video metadata
                if entry.get('view_count'):
                    views.append(entry['view_count'])
            
            if not views:
                return None, None
                
            # Calculate median (robust to outliers)
            median_views = statistics.median(views)
            
            if median_views == 0:
                return None, 0
                
            score = round(video_view_count / median_views, 2)
            return score, int(median_views)
            
    except Exception as e:
        print(f"Error calculating outlier score: {e}")
        return None, None

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

@app.get("/api/info")
async def get_video_info(videoId: str):
    if not videoId:
        raise HTTPException(status_code=400, detail="Missing videoId")
    
    # Try using YouTube Data API first if key is available
    api_key = os.getenv("YOUTUBE_API_KEY")
    if api_key:
        try:
            youtube = build("youtube", "v3", developerKey=api_key)
            
            # Get video details
            video_response = youtube.videos().list(
                part="snippet,statistics,contentDetails",
                id=videoId
            ).execute()
            
            if video_response.get("items"):
                video_item = video_response["items"][0]
                snippet = video_item["snippet"]
                statistics = video_item["statistics"]
                channel_id = snippet["channelId"]
                
                # Get channel details for subscriber count
                channel_response = youtube.channels().list(
                    part="statistics",
                    id=channel_id
                ).execute()
                
                subscriber_count = 0
                if channel_response.get("items"):
                    subscriber_count = int(channel_response["items"][0]["statistics"].get("subscriberCount", 0))
                
                # Calculate Outlier Score
                loop = asyncio.get_event_loop()
                outlier_score, channel_avg_views = await loop.run_in_executor(
                    None, 
                    lambda: calculate_outlier_score(int(statistics.get("viewCount", 0)), channel_id)
                )

                return JSONResponse({
                    "title": snippet["title"],
                    "thumbnail": snippet["thumbnails"]["high"]["url"],
                    "duration": video_item["contentDetails"]["duration"], # ISO format, might need parsing if frontend expects seconds
                    "uploadDate": snippet["publishedAt"].split("T")[0].replace("-", ""), # Format YYYYMMDD
                    "uploader": snippet["channelTitle"],
                    "viewCount": int(statistics.get("viewCount", 0)),
                    "subscriberCount": subscriber_count,
                    "outlierScore": outlier_score,
                    "channelAverageViews": channel_avg_views
                })
        except Exception as e:
            print(f"YouTube API failed, falling back to yt-dlp: {e}")

    # Fallback to yt-dlp
    video_url = f"https://www.youtube.com/watch?v={videoId}"
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    
    try:
        # Run in executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, lambda: yt_dlp.YoutubeDL(ydl_opts).extract_info(video_url, download=False))


        # Calculate Outlier Score
        channel_id = info.get('channel_id')
        view_count = info.get('view_count')
        
        # We are already in an executor here (sort of, info was fetched in one), 
        # but let's run this separately or part of the same flow.
        # Since we are already async, let's just call it.
        # Wait, calculate_outlier_score is blocking IO (yt-dlp). We should run it in executor.
        
        outlier_score, channel_avg_views = await loop.run_in_executor(
            None, 
            lambda: calculate_outlier_score(view_count, channel_id)
        )

        return JSONResponse({
            "title": info.get('title'),
            "thumbnail": info.get('thumbnail'),
            "duration": info.get('duration'),
            "uploadDate": info.get('upload_date'),
            "uploader": info.get('uploader'),
            "viewCount": info.get('view_count'),
            "subscriberCount": info.get('channel_follower_count') or info.get('subscriber_count'),
            "outlierScore": outlier_score,
            "channelAverageViews": channel_avg_views
        })
    except Exception as e:
        print(f"Error fetching video info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch video info")

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
        
        # Step 1: Search for recent videos (handling pagination for > 50 results)
        video_ids = []
        next_page_token = None
        # Fetch more videos initially to allow for filtering
        initial_fetch_target = 200
        
        while len(video_ids) < initial_fetch_target:
            # Calculate how many more we need, capped at 50 per request
            remaining = initial_fetch_target - len(video_ids)
            current_limit = min(remaining, 50)
            
            search_params = {
                "part": "id,snippet",
                "type": "video",
                "publishedAfter": published_after,
                "order": "viewCount",
                "maxResults": current_limit,
                "relevanceLanguage": "en",
                "regionCode": "US",
                "safeSearch": "moderate"
            }
            
            if q:
                search_params["q"] = q
            
            if next_page_token:
                search_params["pageToken"] = next_page_token
                
            search_response = youtube.search().list(**search_params).execute()
            
            if not search_response.get("items"):
                break
                
            # Extract video IDs
            new_ids = [item["id"]["videoId"] for item in search_response["items"]]
            video_ids.extend(new_ids)
            
            next_page_token = search_response.get("nextPageToken")
            if not next_page_token:
                break
        
        if not video_ids:
            return JSONResponse({"videos": []})
        
        # Step 2: Get video statistics (batching in chunks of 50)
        all_videos_items = []
        for i in range(0, len(video_ids), 50):
            batch_ids = video_ids[i:i+50]
            videos_response = youtube.videos().list(
                part="statistics,snippet",
                id=",".join(batch_ids)
            ).execute()
            all_videos_items.extend(videos_response.get("items", []))
        
        # Extract channel IDs
        channel_ids = list(set([video["snippet"]["channelId"] for video in all_videos_items]))
        
        # Step 3: Get channel statistics (batching in chunks of 50)
        channels = {}
        for i in range(0, len(channel_ids), 50):
            batch_channel_ids = channel_ids[i:i+50]
            channels_response = youtube.channels().list(
                part="statistics,snippet",
                id=",".join(batch_channel_ids)
            ).execute()
            
            for channel in channels_response.get("items", []):
                channels[channel["id"]] = {
                    "subscriberCount": int(channel["statistics"].get("subscriberCount", 1)),
                    "channelTitle": channel["snippet"]["title"],
                    "country": channel["snippet"].get("country", "")
                }
        
        # Step 4: Filter, Calculate viral ratio and build response
        viral_videos = []
        target_countries = ["US", "GB", "CA", "AU", "NZ", "IE"]
        
        for video in all_videos_items:
            channel_id = video["snippet"]["channelId"]
            channel_info = channels.get(channel_id, {"subscriberCount": 1, "channelTitle": "Unknown", "country": ""})
            
            # Strict Filtering Logic
            video_lang = video["snippet"].get("defaultAudioLanguage", "") or video["snippet"].get("defaultLanguage", "")
            channel_country = channel_info["country"]
            
            is_english = video_lang.startswith("en")
            is_target_country = channel_country in target_countries
            
            # If we can't determine language, rely on country. If country is missing, be lenient if language is missing? 
            # Or strict? User said "from US or at least in english".
            # Let's be strict: Must be target country OR English language.
            if not (is_target_country or is_english):
                 continue

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
        
        # Take top 100 from the filtered list (they are already roughly sorted by view count from search, 
        # but search results aren't perfectly strictly ordered by view count across pages, though close enough for this purpose.
        # However, to be precise with "100 highest views videos", we should sort by viewCount first, take top 100, then sort by ratio.
        
        # Sort by view count descending to get the true "top 100 views" from our filtered pool
        viral_videos.sort(key=lambda x: x["viewCount"], reverse=True)
        viral_videos = viral_videos[:100]
        
        # Now sort these 100 by viral ratio
        viral_videos.sort(key=lambda x: x["viralRatio"], reverse=True)
        
        return JSONResponse({"videos": viral_videos})
        
    except Exception as e:
        print(f"YouTube API error: {str(e)}")
        # Log the full traceback for debugging if needed
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")

# Cache for trending keywords
trending_cache = {
    "timestamp": 0,
    "keywords": []
}

@app.get("/api/youtube/trending-keywords")
def get_trending_keywords():
    # Check cache (1 hour)
    if time.time() - trending_cache["timestamp"] < 3600 and trending_cache["keywords"]:
        return JSONResponse({"keywords": trending_cache["keywords"]})

    try:
        # Scrape YouTube Trending (Gaming & Music) to get a mix
        # Gaming: 4gIcGhpnYW1pbmdfY29ycHVzX21vc3RfcG9wdWxhcg%3D%3D
        # Music:  4gIcGhptdXNpY19jb3JwdXNfbW9zdF9wb3B1bGFy
        urls = [
            "https://www.youtube.com/feed/trending?bp=4gIcGhpnYW1pbmdfY29ycHVzX21vc3RfcG9wdWxhcg%3D%3D", # Gaming
            "https://www.youtube.com/feed/trending?bp=4gIcGhptdXNpY19jb3JwdXNfbW9zdF9wb3B1bGFy" # Music
        ]
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        import urllib.request
        import re
        from collections import Counter
        
        all_titles = []
        
        for url in urls:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    html = response.read().decode("utf-8")
                    
                match = re.search(r'var ytInitialData = ({.*?});', html)
                if match:
                    data = json.loads(match.group(1))
                    
                    def extract_titles(obj):
                        if isinstance(obj, dict):
                            if "videoRenderer" in obj:
                                video = obj["videoRenderer"]
                                if "title" in video and "runs" in video["title"]:
                                    all_titles.append(video["title"]["runs"][0]["text"])
                                elif "title" in video and "simpleText" in video["title"]:
                                    all_titles.append(video["title"]["simpleText"])
                            
                            if "gridVideoRenderer" in obj:
                                video = obj["gridVideoRenderer"]
                                if "title" in video and "runs" in video["title"]:
                                    all_titles.append(video["title"]["runs"][0]["text"])
                                elif "title" in video and "simpleText" in video["title"]:
                                    all_titles.append(video["title"]["simpleText"])

                            for key, value in obj.items():
                                extract_titles(value)
                        elif isinstance(obj, list):
                            for item in obj:
                                extract_titles(item)
                                
                    extract_titles(data)
            except Exception as e:
                print(f"Error scraping {url}: {e}")
                continue

        if not all_titles:
            # Fallback if scraping fails entirely
            return JSONResponse({"keywords": ["Minecraft", "Fortnite", "Roblox", "GTA 6", "Taylor Swift", "MrBeast", "Elden Ring", "SpaceX", "AI", "ChatGPT"]})

        # Extract keywords logic
        stop_words = set([
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", 
            "is", "are", "was", "were", "be", "been", "this", "that", "it", "i", "you", "he", "she", 
            "we", "they", "my", "your", "his", "her", "our", "their", "what", "which", "who", "whom", 
            "whose", "how", "where", "when", "why", "video", "youtube", "channel", "subscribe", "like", 
            "comment", "share", "official", "music", "video", "lyric", "lyrics", "full", "hd", "hq", 
            "4k", "1080p", "2024", "2025", "new", "vs", "feat", "ft", "live", "stream", "trailer", 
            "episode", "season", "part", "gameplay", "walkthrough", "review", "reaction", "highlights",
            "moment", "moments", "best", "top", "funny", "compilation", "clip", "clips", "shorts"
        ])
        
        phrases = []
        for title in all_titles:
            title_lower = title.lower()
            clean_title = re.sub(r'[^\w\s]', ' ', title_lower)
            words = clean_title.split()
            
            # 3-grams
            for i in range(len(words) - 2):
                if any(w in stop_words for w in [words[i], words[i+1], words[i+2]]):
                    if words[i] in stop_words or words[i+2] in stop_words:
                        continue
                phrases.append(f"{words[i]} {words[i+1]} {words[i+2]}")

            # 4-grams
            for i in range(len(words) - 3):
                if words[i] in stop_words or words[i+3] in stop_words:
                    continue
                phrases.append(f"{words[i]} {words[i+1]} {words[i+2]} {words[i+3]}")
                
        # Get top 20 most common phrases
        counts = Counter(phrases)
        common = counts.most_common(30)
        
        keywords = []
        seen = set()
        for item in common:
            phrase = item[0]
            if phrase not in seen:
                keywords.append(phrase)
                seen.add(phrase)
        
        result = keywords[:20]
        
        # Update cache
        trending_cache["timestamp"] = time.time()
        trending_cache["keywords"] = result
        
        return JSONResponse({"keywords": result})

    except Exception as e:
        print(f"Error fetching trending keywords: {str(e)}")
        # Return cache if available even if expired, or fallback
        if trending_cache["keywords"]:
             return JSONResponse({"keywords": trending_cache["keywords"]})
        return JSONResponse({"keywords": []})

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
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=15.0) # Increased timeout
        except asyncio.TimeoutError:
            process.kill()
            print("DEBUG: yt-dlp -g timed out")
            # Don't raise immediately, try fallback
            stdout = b""
            stderr = b"Timeout"
        
        if process.returncode != 0 or not stdout:
            print(f"yt-dlp error (will try fallback): {stderr.decode()}")
            stream_url = None
        else:
            stream_url = stdout.decode().strip().split('\n')[0]

        if stream_url:
            # 2. Use ffmpeg to extract the frame directly from the stream
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
            stdout_ffmpeg, stderr_ffmpeg = await process_ffmpeg.communicate()
            
            if process_ffmpeg.returncode != 0:
                print(f"ffmpeg stream capture failed: {stderr_ffmpeg.decode()}")

        if not output_image_path.exists():
             # Fallback: Try downloading a small section if streaming fails (slower but more robust)
             print("Direct stream capture failed or skipped, trying download section...")
             
             ydl_opts = {
                'format': 'bestvideo[height<=720]/best[height<=720]',
                'outtmpl': str(temp_video_path),
                'download_ranges': lambda info, ydl: [{'start_time': timestamp, 'end_time': timestamp + 1}],
                'quiet': True,
                'force_keyframes_at_cuts': True,
             }
             
             # Run blocking yt-dlp in thread
             try:
                 loop = asyncio.get_event_loop()
                 await loop.run_in_executor(None, lambda: yt_dlp.YoutubeDL(ydl_opts).download([f"https://www.youtube.com/watch?v={video_id}"]))
                 
                 if temp_video_path.exists():
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
                     out, err = await process_local.communicate()
                     if process_local.returncode != 0:
                         print(f"ffmpeg local capture failed: {err.decode()}")
                     
                     # Cleanup temp video
                     os.remove(temp_video_path)
                 else:
                     print("Fallback download failed: Temp video file not created")

             except Exception as e:
                 print(f"Fallback download exception: {str(e)}")

        if output_image_path.exists():
            return JSONResponse({"url": f"/temp/{output_image_path.name}"})
        else:
            raise Exception("Failed to generate thumbnail image after all attempts")

    except Exception as e:
        print(f"Thumbnail capture error: {str(e)}")
        import traceback
        traceback.print_exc()
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

# --- Auth Endpoints ---

class UserCreate(BaseModel):
    email: str
    password: str

@app.post("/auth/register")
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        created_at=int(time.time() * 1000)
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Generate access token for auto-login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "id": user.id, 
        "email": user.email,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user:
        print(f"DEBUG: User not found: {form_data.username}")
    elif not verify_password(form_data.password, user.password_hash):
        print(f"DEBUG: Password verification failed for {form_data.username}")
    else:
        print(f"DEBUG: Login successful for {form_data.username}")

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Database Endpoints ---

from routers import tags as tags_router

# ... (imports)

app.include_router(ideation_router.router)
app.include_router(billing_router.router)
app.include_router(users_router.router)
app.include_router(spaces.router)
app.include_router(tags_router.router)

@app.get("/api/clips")
def read_clips(
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_active_subscriber),
    current_space: Space = Depends(get_current_space)
):
    clips = session.exec(select(Clip).where(Clip.user_id == current_user.id, Clip.space_id == current_space.id)).all()
    # Convert to frontend format (include tagIds and notes)
    result = []
    for clip in clips:
        clip_dict = clip.model_dump()
        clip_dict["tagIds"] = [tag.id for tag in clip.tags]
        # Include granular notes
        # We need to explicitly convert Note objects to dicts or rely on FastAPI/Pydantic serialization 
        # But since we are manually building the dict, let's include them.
        # Assuming notes_list is loaded or lazy loaded.
        clip_dict["notesList"] = [note.model_dump() for note in clip.notes_list]
        result.append(clip_dict)
    return result

from typing import Optional, List

class ClipCreate(BaseModel):
    id: str
    type: str
    videoId: str
    start: Optional[float] = None
    end: Optional[float] = None
    title: str
    thumbnail: str
    createdAt: int
    folderId: Optional[str] = None
    tagIds: List[str] = []
    notes: Optional[str] = None
    aiPrompt: Optional[str] = None
    originalVideoUrl: Optional[str] = None
    sourceVideoId: Optional[str] = None
    originalTitle: Optional[str] = None
    channelName: Optional[str] = None
    subscriberCount: Optional[int] = None
    viewCount: Optional[int] = None
    uploadDate: Optional[str] = None
    viralRatio: Optional[float] = None
    timeSinceUploadRatio: Optional[float] = None
    engagementScore: Optional[float] = None
    outlierScore: Optional[float] = None
    channelAverageViews: Optional[int] = None

@app.post("/api/clips")
def create_clip(
    clip_data: ClipCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_active_subscriber),
    current_space: Space = Depends(get_current_space)
):
    # Check if clip exists for this user in this space (or globally for this user? Clips are unique by ID but usually tied to space)
    # If we allow same video in different spaces, ID must be different or we need check.
    # Clip ID is UUID default, but here it seems passed from frontend?
    # ClipCreate has `id: str`. If frontend generates UUID, it's fine.
    
    existing_clip = session.exec(select(Clip).where(Clip.id == clip_data.id, Clip.user_id == current_user.id)).first()
    if existing_clip:
        # Update existing
        return update_clip(clip_data.id, clip_data, session, current_user, current_space)

    clip = Clip.model_validate(clip_data, update={"tags": [], "user_id": current_user.id, "space_id": current_space.id})
    
    # Handle tags (ensure they belong to user or are global)
    if clip_data.tagIds:
        for tag_id in clip_data.tagIds:
            # Allow user tags OR global tags (user_id is None)
            tag = session.exec(select(Tag).where(Tag.id == tag_id, (Tag.user_id == current_user.id) | (Tag.user_id == None))).first()
            if tag:
                clip.tags.append(tag)
    
    # Calculate metrics
    if clip.viewCount is not None and clip.subscriberCount is not None and clip.subscriberCount > 0:
        # Calculate metrics
        try:
            # Viral Ratio (Raw)
            viral_ratio_norm = 0.0
            if clip.subscriberCount and clip.subscriberCount > 0:
                clip.viralRatio = clip.viewCount / clip.subscriberCount
                # Normalize for Engagement Score calculation
                # 0.01x = 0, 1x = 5, 100x = 10
                import math
                viral_ratio_norm = min(10.0, max(0.0, (math.log10(max(clip.viralRatio, 0.0001)) + 2) * 2.5))
            
            # Time Ratio / Velocity (Normalized 0-10)
            upload_dt = datetime.strptime(clip.uploadDate, "%Y%m%d")
            days_since = (datetime.now() - upload_dt).days
            if days_since < 1: days_since = 1
            raw_velocity = clip.viewCount / days_since
            # 100k views/day = 10
            clip.timeSinceUploadRatio = min(10.0, (math.log10(raw_velocity + 1) / 5) * 10)
            
            # Engagement Score (Average of Normalized Ratios)
            if clip.viralRatio is not None and clip.timeSinceUploadRatio is not None:
                clip.engagementScore = (viral_ratio_norm + clip.timeSinceUploadRatio) / 2
            
                
        except ValueError:
            pass
            
    session.add(clip)
    session.commit()
    session.refresh(clip)
    return clip

@app.put("/api/clips/{clip_id}")
def update_clip(
    clip_id: str, 
    clip_data: ClipCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_active_subscriber),
    current_space: Space = Depends(get_current_space)
):
    # Ensure clip belongs to user and space (optional: move clip between spaces? For now restrict to space)
    clip = session.exec(select(Clip).where(Clip.id == clip_id, Clip.user_id == current_user.id)).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    clip_data_dict = clip_data.model_dump(exclude={"tagIds"})
    for key, value in clip_data_dict.items():
        setattr(clip, key, value)
    
    # Update tags
    clip.tags = []
    if clip_data.tagIds:
        for tag_id in clip_data.tagIds:
            # Allow user tags OR global tags
            tag = session.exec(select(Tag).where(Tag.id == tag_id, (Tag.user_id == current_user.id) | (Tag.user_id == None))).first()
            if tag:
                clip.tags.append(tag)
                
    session.add(clip)
    session.commit()
    session.refresh(clip)
    return clip

@app.delete("/api/clips/{clip_id}")
def delete_clip(clip_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_active_subscriber)):
    clip = session.exec(select(Clip).where(Clip.id == clip_id, Clip.user_id == current_user.id)).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    session.delete(clip)
    session.commit()
    return {"ok": True}



# --- Note Endpoints ---

class NoteCreate(BaseModel):
    clip_id: str
    content: str
    category: str

@app.post("/api/notes")
def create_note(note_data: NoteCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Verify clip ownership
    clip = session.exec(select(Clip).where(Clip.id == note_data.clip_id, Clip.user_id == current_user.id)).first()
    if not clip:
         raise HTTPException(status_code=404, detail="Clip not found")
         
    note = Note(
        content=note_data.content,
        category=note_data.category,
        clip_id=UUID(note_data.clip_id),
        user_id=current_user.id,
        createdAt=int(time.time() * 1000)
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    note = session.exec(select(Note).where(Note.id == note_id, Note.user_id == current_user.id)).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    session.delete(note)
    session.commit()
    return {"ok": True}

from uuid import UUID

@app.get("/api/notes/{clip_id}")
def read_notes(clip_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    notes = session.exec(select(Note).where(Note.clip_id == UUID(clip_id), Note.user_id == current_user.id)).all()
    return notes

