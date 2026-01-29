import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
import replicate
from typing import Optional

router = APIRouter(prefix="/api/transcribe", tags=["transcribe"])

class TranscriptionResponse(BaseModel):
    text: str

@router.post("/", response_model=TranscriptionResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribes uploaded audio file using Replicate (vaibhavs10/incredibly-fast-whisper).
    """
    try:
        # Create a temp file to store the upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as temp_audio:
            shutil.copyfileobj(audio.file, temp_audio)
            temp_audio_path = temp_audio.name

        try:
            # Run Replicate model
            # Note: We need to upload the file to a public URL or pass the file object if the client supports it.
            # However, Replicate Python client supports passing a file handler for 'path' inputs if standard.
            # But for this specific model, it usually expects a URL or a file.
            # The python client handles file uploads automatically if you pass a file handle.
            
            output = replicate.run(
                "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
                input={
                    "audio": open(temp_audio_path, "rb"),
                    "batch_size": 64
                }
            )
            
            # The output model usually returns a dictionary with 'text' or chunks.
            # Let's inspect typical output. For this model it returns: 
            # { "text": "...", "chunks": [...] }
            
            transcription_text = ""
            if isinstance(output, dict) and "text" in output:
                transcription_text = output["text"]
            elif isinstance(output, str):
                transcription_text = output
            else:
                 # Fallback if structure is different
                transcription_text = str(output)

            return {"text": transcription_text}

        finally:
            # Cleanup temp file
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

    except Exception as e:
        print(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
