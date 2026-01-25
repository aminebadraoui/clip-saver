"""
Test script for AI model integration
Tests both Nano Banana Pro (thumbnails) and Gemini 3 Pro (text generation)
"""

import os
from dotenv import load_dotenv
import replicate

load_dotenv()

def test_nano_banana_pro():
    """Test thumbnail generation with Google Nano Banana Pro"""
    print("\n🎨 Testing Nano Banana Pro (Thumbnail Generation)...")
    
    try:
        output = replicate.run(
            "google/nano-banana-pro",
            input={
                "prompt": "Create a bold, eye-catching YouTube thumbnail for: How to Build AI Apps in 2025. Use vibrant colors, dramatic lighting, and make it attention-grabbing.",
                "aspect_ratio": "16:9",
                "resolution": "2K",
                "output_format": "png",
                "safety_filter_level": "block_only_high",
            }
        )
        
        print(f"✅ Success! Thumbnail URL: {output}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_gemini_3_pro():
    """Test text generation with Google Gemini 3 Pro"""
    print("\n🤖 Testing Gemini 3 Pro (Title Generation)...")
    
    try:
        output = ""
        for event in replicate.stream(
            "google/gemini-3-pro",
            input={
                "prompt": "Generate 3 viral YouTube title ideas for a video about building AI apps in 2025. Make them catchy and high CTR.",
                "system_instruction": "You are a viral YouTube title expert. Generate engaging, clickable titles.",
                "temperature": 0.7,
                "thinking_level": "low",
            },
        ):
            output += str(event)
        
        print(f"✅ Success! Generated titles:\n{output}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 AI Model Integration Test")
    print("=" * 60)
    
    # Check API token
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        print("❌ REPLICATE_API_TOKEN not found in environment variables!")
        print("Please add it to your .env file")
        return
    
    print(f"✅ REPLICATE_API_TOKEN found: {api_token[:10]}...")
    
    # Run tests
    nano_success = test_nano_banana_pro()
    gemini_success = test_gemini_3_pro()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"Nano Banana Pro (Thumbnails): {'✅ PASS' if nano_success else '❌ FAIL'}")
    print(f"Gemini 3 Pro (Text): {'✅ PASS' if gemini_success else '❌ FAIL'}")
    
    if nano_success and gemini_success:
        print("\n🎉 All tests passed! Integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
