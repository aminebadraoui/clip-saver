import os
from typing import Optional
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict, Any

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

def generate_video_outline(transcript: str, video_title: str) -> str:
    """
    Generates a viral script outline/skeleton from a video transcript using OpenAI.
    """
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "Error: OPENAI_API_KEY not found in environment variables."

    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

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

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    try:
        response = llm.invoke(messages)
        content = response.content
        
        # Clean up markdown code blocks if present
        content = content.replace("```markdown", "").replace("```", "").strip()
        
        return content
    except Exception as e:
        return f"Error generating outline: {str(e)}"

def generate_title_ideas(inspiration_titles: List[Dict[str, Any]], concept_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates new title ideas based on inspiration titles and concept data.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found")

    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    structured_llm = llm.with_structured_output(TitleList)

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

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    try:
        title_list = structured_llm.invoke(messages)
        # Convert back to dict list with IDs
        import uuid
        return [
            {"id": str(uuid.uuid4()), "text": t.text, "score": t.score}
            for t in title_list.titles
        ]
    except Exception as e:
        print(f"Error generating titles: {e}")
        return []

def readapt_script_outline(current_outline: str, concept_data: Dict[str, Any]) -> str:
    """
    Readapts an existing script outline to match the new Main Concept.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "Error: OPENAI_API_KEY not found"

    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

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

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    try:
        response = llm.invoke(messages)
        content = response.content
        content = content.replace("```markdown", "").replace("```", "").strip()
        return content
    except Exception as e:
        return f"Error readapting outline: {str(e)}"

def generate_viral_script(outline: str, titles: List[Dict[str, Any]], concept_data: Dict[str, Any]) -> str:
    """
    Generates a full viral script based on outline, titles, and concept.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "Error: OPENAI_API_KEY not found"

    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

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

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    try:
        response = llm.invoke(messages)
        content = response.content
        content = content.replace("```markdown", "").replace("```", "").strip()
        return content
    except Exception as e:
        return f"Error generating script: {str(e)}"
