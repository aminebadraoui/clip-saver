import yt_dlp
from pathlib import Path

TEMP_DIR = Path("server/temp")
ydl_opts = {
    'outtmpl': str(TEMP_DIR / "%(title).100s-%(id)s.%(ext)s"),
    'restrictfilenames': True,
    'quiet': True,
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    # Use a video with special characters in title
    info = ydl.extract_info("https://www.youtube.com/watch?v=NGvittScQj4", download=False)
    filename = ydl.prepare_filename(info)
    print(f"Generated filename: {filename}")
