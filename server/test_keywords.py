import re
from collections import Counter

def extract_keywords(videos):
    text_corpus = []
    stop_words = set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "this", "that", "it", "i", "you", "he", "she", "we", "they", "my", "your", "his", "her", "our", "their", "what", "which", "who", "whom", "whose", "how", "where", "when", "why", "video", "youtube", "channel", "subscribe", "like", "comment", "share", "official", "music", "video", "lyric", "lyrics", "full", "hd", "hq", "4k", "1080p", "2024", "2025", "new", "vs", "feat", "ft", "live", "stream"])

    for video in videos:
        # Combine title and tags (if available)
        content = video['title']
        # Simple cleaning
        content = re.sub(r'[^\w\s]', '', content.lower())
        words = content.split()
        filtered_words = [w for w in words if w not in stop_words and len(w) > 2]
        text_corpus.extend(filtered_words)
        
        # Also add tags if we had them, but for now just title
        
    # Generate n-grams (2 and 3 words)
    # Actually, for "long tail", we want phrases.
    # Let's try 2-grams and 3-grams from the *original* sentences (minus punctuation)
    
    phrases = []
    for video in videos:
        content = video['title'].lower()
        # Remove special chars but keep spaces
        content = re.sub(r'[^\w\s]', ' ', content)
        words = content.split()
        
        # 2-grams
        for i in range(len(words) - 1):
            phrase = f"{words[i]} {words[i+1]}"
            # Filter out if both are stop words
            if words[i] in stop_words and words[i+1] in stop_words:
                continue
            phrases.append(phrase)
            
        # 3-grams
        for i in range(len(words) - 2):
            phrase = f"{words[i]} {words[i+1]} {words[i+2]}"
             # Filter out if all are stop words
            if words[i] in stop_words and words[i+1] in stop_words and words[i+2] in stop_words:
                continue
            phrases.append(phrase)

    # Count frequencies
    counts = Counter(phrases)
    return counts.most_common(20)

# Dummy data
videos = [
    {"title": "Minecraft Survival Guide - Part 1"},
    {"title": "Minecraft Survival Guide - Part 2"},
    {"title": "How to build a house in Minecraft"},
    {"title": "Best Minecraft Mods 2024"},
    {"title": "Top 10 Minecraft Mods"},
    {"title": "Elden Ring Shadow of the Erdtree Gameplay"},
    {"title": "Elden Ring Shadow of the Erdtree Boss Fight"},
    {"title": "Elden Ring DLC Review"},
    {"title": "Funny Cat Videos 2024"},
    {"title": "Cute Cat Compilation"},
    {"title": "Cats being funny"},
]

print(extract_keywords(videos))
