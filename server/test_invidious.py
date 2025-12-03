import urllib.request
import json
import time

INSTANCES = [
    "https://vid.puffyan.us",
    "https://inv.tux.pizza",
    "https://yt.artemislena.eu",
    "https://invidious.drgns.space",
    "https://inv.bp.projectsegfau.lt",
    "https://yewtu.be",
    "https://invidious.flokinet.to",
    "https://invidious.privacydev.net"
]

def get_trending_from_invidious():
    for instance in INSTANCES:
        url = f"{instance}/api/v1/trending"
        print(f"Trying {instance}...")
        try:
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    print(f"Success with {instance}!")
                    return data
        except Exception as e:
            print(f"Failed {instance}: {e}")
            continue
            
    return []

def extract_keywords(videos):
    import re
    from collections import Counter
    
    stop_words = set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "this", "that", "it", "i", "you", "he", "she", "we", "they", "my", "your", "his", "her", "our", "their", "what", "which", "who", "whom", "whose", "how", "where", "when", "why", "video", "youtube", "channel", "subscribe", "like", "comment", "share", "official", "music", "video", "lyric", "lyrics", "full", "hd", "hq", "4k", "1080p", "2024", "2025", "new", "vs", "feat", "ft", "live", "stream", "trailer", "episode", "season", "part", "gameplay", "walkthrough", "review", "reaction", "highlights", "moment", "moments", "best", "top", "funny", "compilation", "clip", "clips", "shorts"])
    
    phrases = []
    for video in videos:
        title = video["title"].lower()
        clean_title = re.sub(r'[^\w\s]', ' ', title)
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
            
    counts = Counter(phrases)
    common = counts.most_common(20)
    return [item[0] for item in common]

if __name__ == "__main__":
    videos = get_trending_from_invidious()
    if videos:
        keywords = extract_keywords(videos)
        print(f"Found {len(keywords)} keywords:")
        for k in keywords:
            print(f"- {k}")
    else:
        print("All instances failed.")
