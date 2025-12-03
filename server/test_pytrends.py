from pytrends.request import TrendReq
import pandas as pd

def get_google_trends():
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Get daily trending searches for US
        trending = pytrends.trending_searches(pn='united_states')
        
        print("Columns:", trending.columns)
        print(trending.head())
        
        # Extract titles (column name is usually 0)
        titles = trending[0].tolist()
        return titles
        
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    keywords = get_google_trends()
    print(f"Found {len(keywords)} keywords:")
    for k in keywords[:10]:
        print(f"- {k}")
