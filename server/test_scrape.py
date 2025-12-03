import urllib.request
import json
import re

def get_trending_titles():
    url = "https://www.youtube.com/feed/trending?bp=4gIcGhpnYW1pbmdfY29ycHVzX21vc3RfcG9wdWxhcg%3D%3D"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode("utf-8")
            
        print(f"HTML length: {len(html)}")
            
        # Find ytInitialData
        match = re.search(r'var ytInitialData = ({.*?});', html)
        if not match:
            print("Could not find ytInitialData")
            # Try finding it without 'var'
            match = re.search(r'ytInitialData = ({.*?});', html)
            
        if not match:
             print("Still could not find ytInitialData")
             return []
             
        print("Found ytInitialData")
        data = json.loads(match.group(1))
        
        # Debug structure
        # Debug structure
        if "contents" in data:
            print("Found 'contents'")
            contents = data["contents"]
            if "twoColumnBrowseResultsRenderer" in contents:
                print("Found 'twoColumnBrowseResultsRenderer'")
                tabs = contents["twoColumnBrowseResultsRenderer"]["tabs"]
                print(f"Found {len(tabs)} tabs")
                for i, tab in enumerate(tabs):
                    if "tabRenderer" in tab:
                        print(f"Tab {i}: {tab['tabRenderer'].get('title', 'No Title')}")
                        if "content" in tab["tabRenderer"]:
                            tab_content = tab["tabRenderer"]["content"]
                            print(f"  Tab Content Keys: {list(tab_content.keys())}")
                            titles = []
                            if "richGridRenderer" in tab_content:
                                print("  Found richGridRenderer")
                                contents = tab_content["richGridRenderer"]["contents"]
                                print(f"  Found {len(contents)} items in grid")
                                for k, item in enumerate(contents):
                                    if "richItemRenderer" in item:
                                        content = item["richItemRenderer"]["content"]
                                        if "videoRenderer" in content:
                                            video = content["videoRenderer"]
                                            title = video["title"]["runs"][0]["text"]
                                            print(f"    Video {k}: {title}")
                                            titles.append(title)
                                    elif "richSectionRenderer" in item:
                                        print(f"    Section {k}: richSectionRenderer")
                                        section_content = item["richSectionRenderer"]["content"]
                                        print(f"    Section Content Keys: {list(section_content.keys())}")
                                        if "richShelfRenderer" in section_content:
                                            shelf = section_content["richShelfRenderer"]
                                            shelf_title = shelf.get("title", {}).get("runs", [{}])[0].get("text", "No Title")
                                            print(f"      Shelf: {shelf_title}")
                                            shelf_contents = shelf["contents"]
                                            for m, shelf_item in enumerate(shelf_contents):
                                                if "richItemRenderer" in shelf_item:
                                                    content = shelf_item["richItemRenderer"]["content"]
                                                    if "videoRenderer" in content:
                                                        video = content["videoRenderer"]
                                                        title = video["title"]["runs"][0]["text"]
                                                        print(f"        Video {m}: {title}")
                                                        titles.append(title)
                            if "sectionListRenderer" in tab_content:
                                sections = tab_content["sectionListRenderer"]["contents"]
                                print(f"  Found {len(sections)} sections")
                                for j, section in enumerate(sections):
                                    print(f"    Section {j} Keys: {list(section.keys())}")
                                    if "itemSectionRenderer" in section:
                                        items = section["itemSectionRenderer"]["contents"]
                                        print(f"      ItemSection has {len(items)} items")
                                        if len(items) > 0:
                                            print(f"      Item 0 Keys: {list(items[0].keys())}")
                                            if "shelfRenderer" in items[0]:
                                                shelf = items[0]["shelfRenderer"]
                                                print(f"        Shelf Title: {shelf.get('title', {}).get('runs', [{}])[0].get('text', 'No Title')}")
                                                if "content" in shelf:
                                                    print(f"        Shelf Content Keys: {list(shelf['content'].keys())}")
                            
        
        def extract_titles(obj):
            if isinstance(obj, dict):
                # Check for videoRenderer or gridVideoRenderer
                if "videoRenderer" in obj:
                    video = obj["videoRenderer"]
                    if "title" in video and "runs" in video["title"]:
                        titles.append(video["title"]["runs"][0]["text"])
                    elif "title" in video and "simpleText" in video["title"]:
                        titles.append(video["title"]["simpleText"])
                        
                if "gridVideoRenderer" in obj:
                    video = obj["gridVideoRenderer"]
                    if "title" in video and "runs" in video["title"]:
                        titles.append(video["title"]["runs"][0]["text"])
                    elif "title" in video and "simpleText" in video["title"]:
                        titles.append(video["title"]["simpleText"])

                for key, value in obj.items():
                    extract_titles(value)
            elif isinstance(obj, list):
                for item in obj:
                    extract_titles(item)
                    
        extract_titles(data)
        return titles[:50]
        
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    titles = get_trending_titles()
    print(f"Found {len(titles)} titles:")
    for t in titles[:10]:
        print(f"- {t}")
