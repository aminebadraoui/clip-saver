from fastapi.testclient import TestClient
from main import app


client = TestClient(app)

def test_get_video_info_metrics():
    # Test with a known video (e.g., a popular one likely to have views/subs)
    # Rick Astley - Never Gonna Give You Up
    video_id = "dQw4w9WgXcQ" 
    
    response = client.get(f"/api/info?videoId={video_id}")
    assert response.status_code == 200
    data = response.json()
    
    print(f"Data: {data}")
    
    assert "viewCount" in data
    assert "uploadDate" in data
    # subscriberCount might be missing if yt-dlp can't find it easily without API key, 
    # but let's check if the key exists at least
    assert "subscriberCount" in data 
    
    if data["viewCount"]:
        assert isinstance(data["viewCount"], int)
    
    if data["uploadDate"]:
        assert len(data["uploadDate"]) == 8 # YYYYMMDD

if __name__ == "__main__":
    test_get_video_info_metrics()
