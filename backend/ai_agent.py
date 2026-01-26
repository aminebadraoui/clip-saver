import os
from typing import Optional
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
import replicate
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import json

# Define structured output models
class TitleIdea(BaseModel):
    text: str = Field(description="The generated title text")
    score: int = Field(description="Predicted viral score from 1-10", default=7)

class TitleList(BaseModel):
    titles: List[TitleIdea] = Field(description="List of generated titles")


load_dotenv()

def fetch_transcript(video_id: str) -> Optional[str]:
    """
    Fetches the transcript for a given YouTube video ID.
    Returns the transcript as a single string, or None if not found/error.
    """
    try:
        # 1.2.3+ API requires instantiation
        ytt = YouTubeTranscriptApi()
        transcript_list = ytt.fetch(video_id)
        
        # Check if it returns a list of dicts (old style) or object
        # Based on _api.py docstring it returns FetchedTranscript. 
        # But if it acts like the old one, we iterate.
        # Let's handle both just in case or rely on test to confirm.
        # Assuming list of dicts for now based on typical behavior, or list of objects?
        # Actually _api.py says it returns FetchedTranscript.
        # Let's convert it to string.
        
        # If it's a list (standard old behavior)
        if isinstance(transcript_list, list):
             full_text = " ".join([item['text'] for item in transcript_list])
        else:
             # It acts as an iterable of objects (FetchedTranscriptSnippet)
             # Based on error 'FetchedTranscriptSnippet' object is not subscriptable
             full_text = " ".join([item.text for item in transcript_list])
             
        return full_text
    except Exception as e:
        print(f"Error fetching transcript for {video_id}: {e}")
        return None

import time
import random

def run_with_retry(func, retries=3, base_delay=2):
    """
    Executes a function with exponential backoff retry logic for Rate Limit errors.
    """
    for attempt in range(retries):
        try:
            return func()
        except Exception as e:
            # Check for Replicate 429 (Rate Limit)
            error_msg = str(e)
            if "429" in error_msg or "rate limit" in error_msg.lower():
                if attempt < retries - 1:
                    sleep_time = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
                    print(f"Replicate Rate Limit hit. Retrying in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    continue
            raise e

def generate_video_outline(transcript: str, video_title: str) -> str:
    """
    Generates a viral script outline/skeleton from a video transcript using Gemini 3 Pro.
    """
    
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        return "Error: REPLICATE_API_TOKEN not found in environment variables."

    system_prompt = """You are an expert viral video strategist and scriptwriter. 
Your goal is to deconstruct a successful YouTube video into its core skeletal structure/outline.
Identify the hidden structure that makes it engaging.
Focus on:
1. The Hook (how they grabbed attention immediately).
2. The Setup/Context (how they introduced the premise).
3. The Core Conflict/Journey (the middle meat structure).
4. The Payoff/Climax.
5. The Call to Action/Ending.

Do NOT just summarize the content. Extract the *structural template* that could be reused for another video.
Format the output as a clean Markdown outline."""

    user_prompt = f"""Analyze the following YouTube video transcript and extract its viral structure/outline.
    
    Video Title: {video_title}
    
    Transcript:
    {transcript[:15000]} 
    (Transcript truncated if too long)
    
    Output the outline in Markdown format."""

    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                "google/gemini-1.5-pro",
                input={
                    "prompt": user_prompt,
                    "system_instruction": system_prompt,
                    "temperature": 0.7,
                    "thinking_level": "low",
                },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
        
        # Clean up markdown code blocks if present
        content = output.replace("```markdown", "").replace("```", "").strip()
        
        return content
    except Exception as e:
        return f"Error generating outline: {str(e)}"

def generate_title_ideas(inspiration_titles: List[Dict[str, Any]], concept_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates new title ideas based on inspiration titles and concept data using Gemini 3 Pro.
    """
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        raise ValueError("REPLICATE_API_TOKEN not found")

    # Format inspiration titles for prompt
    inspiration_text = "\n".join([f"- {t.get('text', '')}" for t in inspiration_titles if t.get('text')])

    system_prompt = """You are a viral YouTube title expert. 
Your task is to analyze the patterns, hooks, and structures of the provided 'Inspiration Titles' 
and generate 5 NEW, different title ideas that follow those same winning patterns but are adapted 
to the user's 'Main Concept'.

The new titles must:
1. Be catchy and high CTR (Click Through Rate).
2. Strictly relate to the 'Main Concept' provided.
3. Mimic the style/format of the inspiration titles (e.g. if they use lists, use lists; if they use 'How to', use 'How to').
4. Be different from each other.
"""

    user_prompt = f"""
    MAIN CONCEPT DATA:
    - Main Idea: {concept_data.get('mainIdea', '')}
    - Why Viewer Cares: {concept_data.get('whyViewerCare', '')}
    - Common Assumptions: {concept_data.get('commonAssumptions', '')}
    - Breaking Assumptions: {concept_data.get('breakingAssumptions', '')}
    - Viewer Feeling: {concept_data.get('viewerFeeling', '')}

    INSPIRATION TITLES:
    {inspiration_text}

    Generate 5 new viral titles.
    """

    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                "google/gemini-1.5-pro",
                input={
                    "prompt": user_prompt,
                    "system_instruction": system_prompt,
                    "temperature": 0.7,
                    "thinking_level": "low",
                },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
        
        # Parse JSON response
        import uuid
        try:
            # Try to extract JSON from response
            lines = output.strip().split('\n')
            titles = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#'):
                    titles.append({
                        "id": str(uuid.uuid4()),
                        "text": line.lstrip('0123456789.-) '),
                        "score": 7
                    })
            return titles[:5] if titles else []
        except:
            return []
    except Exception as e:
        print(f"Error generating titles: {e}")
        return []

def readapt_script_outline(current_outline: str, concept_data: Dict[str, Any]) -> str:
    """
    Readapts an existing script outline to match the new Main Concept using Gemini 3 Pro.
    """
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        return "Error: REPLICATE_API_TOKEN not found"

    system_prompt = """You are an expert script editor.
Your task is to take an EXISTING script outline (structure) and rewrite its content points 
to fit a NEW 'Main Concept'.

1. Keep the same structural beats (Hook, Setup, conflict, Payoff, etc.) as the original outline.
2. COMPLETELY CHANGE the topic/content to match the 'Main Concept'.
3. Output the result in clean Markdown.
"""

    user_prompt = f"""
    NEW MAIN CONCEPT:
    - Main Idea: {concept_data.get('mainIdea', '')}
    - Why Viewer Cares: {concept_data.get('whyViewerCare', '')}
    - Common Assumptions: {concept_data.get('commonAssumptions', '')}
    - Breaking Assumptions: {concept_data.get('breakingAssumptions', '')}

    ORIGINAL OUTLINE (Structure to keep):
    {current_outline}

    Rewrite the outline for the new concept.
    """

    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                "google/gemini-1.5-pro",
                input={
                    "prompt": user_prompt,
                    "system_instruction": system_prompt,
                    "temperature": 0.7,
                    "thinking_level": "low",
                },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
        
        content = output.replace("```markdown", "").replace("```", "").strip()
        return content
    except Exception as e:
        return f"Error readapting outline: {str(e)}"

def generate_viral_script(outline: str, titles: List[Dict[str, Any]], concept_data: Dict[str, Any]) -> str:
    """
    Generates a full viral script based on outline, titles, and concept using Gemini 3 Pro.
    """
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        return "Error: REPLICATE_API_TOKEN not found"

    # Pick the best title or list them
    title_text = "\n".join([f"- {t.get('text', '')}" for t in titles])

    system_prompt = """You are a world-class YouTube scriptwriter (MrBeast style).
Write a full, engaging, high-retention script based on the provided Outline and Main Concept.

Guidelines:
1. **Tone**: Conversational, high energy, fast-paced.
2. **Hook**: The first 30 seconds must be incredibly gripping.
3. **Structure**: Follow the provided Outline strictly.
4. **Formatting**: Use Markdown. identifying speakers (if any) or Visual Cues in [Brackets].
5. **Content**: Integrate the 'Common Assumptions' and 'Breaking Assumptions' to create curiosity gaps.
"""

    user_prompt = f"""
    MAIN CONCEPT:
    - Main Idea: {concept_data.get('mainIdea', '')}
    - Why Viewer Cares: {concept_data.get('whyViewerCare', '')}
    - Assumptions to Break: {concept_data.get('breakingAssumptions', '')}

    POTENTIAL TITLES:
    {title_text}

    APPROVED OUTLINE:
    {outline}

    Write the full script now.
    """

    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                "google/gemini-1.5-pro",
                input={
                    "prompt": user_prompt,
                    "system_instruction": system_prompt,
                    "temperature": 0.7,
                    "thinking_level": "low",
                },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
        
        content = output.replace("```markdown", "").replace("```", "").strip()
        return content
    except Exception as e:
        return f"Error generating script: {str(e)}"

def extract_title_structure(title: str) -> str:
    """
    Analyzes a video title and extracts its repeatable structural pattern using Gemini.
    """
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        return "Error: REPLICATE_API_TOKEN not found"

    system_prompt = """You are an expert YouTube strategist.
    Your task is to analyze a successful video title and extract its "Viral Structure" or pattern.
    Identify the template that can be reused.
    
    Examples:
    Input: "I Survived 100 Days in Hardcore Minecraft"
    Output: "I Survived [Time Period] in [Hard Challenge]"
    
    Input: "Why iPhone 15 is a Waste of Money"
    Output: "Why [Popular Product] is [Controversial Opinion]"
    
    Output ONLY the structural pattern string.
    """
    
    user_prompt = f"Extract the structure for: {title}"
    
    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                "google/gemini-3-pro",
                input={
                    "prompt": user_prompt,
                    "system_instruction": system_prompt,
                    "temperature": 0.3, # Low temp for precision
                    "thinking_level": "low",
                },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
        
        return output.strip().replace('"', '')
    except Exception as e:
        return f"Error extracting title structure: {str(e)}"

def extract_thumbnail_description(image_url: str) -> str:
    """
    Analyzes a thumbnail image and extracts a detailed descriptive structure using Gemini Multimodal.
    """
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        return "Error: REPLICATE_API_TOKEN not found"
        
    system_prompt = """You are a YouTube thumbnail analyst.
    Analyze the provided thumbnail image and describe its structural composition so it can be recreated.
    Focus on:
    1. Subject placement (Left, Right, Center).
    2. Facial expression/Emotion (if any).
    3. Background elements/Colors (Contrast, brightness).
    4. Text overlays (Font style, color, placement, shortness).
    5. The "Visual Hook" (what draws the eye).
    
    Output a concise paragraph describing this "Thumbnail Template".
    """
    
    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                 "google/gemini-3-pro",
                 input={
                     "prompt": "Describe the structural template of this thumbnail.",
                     "system_instruction": system_prompt,
                     "image": image_url,
                     "temperature": 0.5,
                     "thinking_level": "low",
                 },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
            
        return output.strip()
    except Exception as e:
         return f"Error extracting thumbnail description: {str(e)}"

def extract_script_structure(transcript: str) -> str:
    """
    Wrapper for generate_video_outline to standardize naming.
    """
    return generate_video_outline(transcript, "Video")

def summarize_video(transcript: str) -> str:
    """
    Generates a concise 2-3 sentence summary of the video content.
    """
    api_key = os.getenv("REPLICATE_API_TOKEN")
    if not api_key:
        return "Error: REPLICATE_API_TOKEN not found"

    system_prompt = """You are a concise video summarizer.
    Summarize the provided video transcript into 2-3 sentences.
    Focus on the main topic, the key insight/conflict, and the resolution.
    Keep it engaging but brief.
    """

    user_prompt = f"""Summarize this transcript:
    {transcript[:10000]}
    """

    try:
        def api_call():
            output = ""
            for event in replicate.stream(
                "google/gemini-3-pro",
                input={
                    "prompt": user_prompt,
                    "system_instruction": system_prompt,
                    "temperature": 0.5,
                    "thinking_level": "low",
                },
            ):
                output += str(event)
            return output

        output = run_with_retry(api_call)
        
        return output.strip()
    except Exception as e:
        return f"Error generating summary: {str(e)}"
