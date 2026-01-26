"""Replicate API service wrapper."""
import os
import replicate
from typing import Dict, Any, List, Optional
import time
from sqlmodel import Session, select
from models import ReplicateModelCache
import uuid
import json


# Official Replicate models with realistic pricing (2-3x markup over Replicate costs)
# Pricing based on actual Replicate costs as of Jan 2025
CURATED_MODELS = {
    "image-generation": [
        {
            "model_id": "black-forest-labs/flux-1.1-pro",
            "model_name": "Flux 1.1 Pro",
            "description": "Faster, better FLUX Pro. Excellent image quality and prompt adherence",
            "cost_per_run": 2,  # Replicate: $0.04 → 2 credits ($0.10 at $0.05/credit)
        },
        {
            "model_id": "black-forest-labs/flux-1.1-pro-ultra",
            "model_name": "Flux 1.1 Pro Ultra",
            "description": "Ultra high-quality 4MP images with raw mode for maximum realism",
            "cost_per_run": 3,  # Replicate: $0.06 → 3 credits
        },
        {
            "model_id": "stability-ai/sdxl",
            "model_name": "Stable Diffusion XL",
            "description": "High-quality image generation with great detail",
            "cost_per_run": 1,  # Replicate: $0.0037 → 1 credit
        },
        {
            "model_id": "google/imagen-4",
            "model_name": "Google Imagen 4",
            "description": "Google's flagship image generation model",
            "cost_per_run": 2,  # Similar to Flux Pro
        },
        {
            "model_id": "google/imagen-4-fast",
            "model_name": "Google Imagen 4 Fast",
            "description": "Fast version when speed matters more than quality",
            "cost_per_run": 1,
        },
        {
            "model_id": "ideogram-ai/ideogram-v3-turbo",
            "model_name": "Ideogram V3 Turbo",
            "description": "Fast, high-quality images with excellent text rendering",
            "cost_per_run": 1,
        },
        {
            "model_id": "recraft-ai/recraft-v3",
            "model_name": "Recraft V3",
            "description": "SOTA text-to-image with long text generation capability",
            "cost_per_run": 4,  # Replicate: ~$0.08 → 4 credits
        },
    ],
    "video-generation": [
        {
            "model_id": "google/veo-3.1",
            "model_name": "Google Veo 3.1",
            "description": "High-fidelity video with context-aware audio",
            "cost_per_run": 10,
        },
        {
            "model_id": "google/veo-3.1-fast",
            "model_name": "Google Veo 3.1 Fast",
            "description": "Faster, cheaper version of Veo 3.1",
            "cost_per_run": 6,
        },
        {
            "model_id": "luma/ray-2-720p",
            "model_name": "Luma Ray 2 (720p)",
            "description": "Generate 5s and 9s 720p videos",
            "cost_per_run": 8,
        },
        {
            "model_id": "luma/ray-flash-2-720p",
            "model_name": "Luma Ray Flash 2 (720p)",
            "description": "Faster and cheaper than Ray 2",
            "cost_per_run": 5,
        },
        {
            "model_id": "minimax/video-01",
            "model_name": "Minimax Video-01",
            "description": "Generate 6s videos with prompts or images",
            "cost_per_run": 8,
        },
        {
            "model_id": "runwayml/gen4-turbo",
            "model_name": "Runway Gen-4 Turbo",
            "description": "Generate 5s and 10s 720p videos fast",
            "cost_per_run": 10,
        },
    ],
    "image-editing": [
        {
            "model_id": "black-forest-labs/flux-fill-pro",
            "model_name": "Flux Fill Pro",
            "description": "Professional inpainting and outpainting",
            "cost_per_run": 2,
        },
        {
            "model_id": "black-forest-labs/flux-kontext-pro",
            "model_name": "Flux Kontext Pro",
            "description": "Text-based image editing with natural language",
            "cost_per_run": 2,
        },
        {
            "model_id": "google/nano-banana-pro",
            "model_name": "Google Nano Banana Pro",
            "description": "State-of-the-art image editing model",
            "cost_per_run": 2,
        },
        {
            "model_id": "ideogram-ai/ideogram-v2",
            "model_name": "Ideogram V2",
            "description": "Excellent inpainting and prompt comprehension",
            "cost_per_run": 1,
        },
    ],
    "background-removal": [
        {
            "model_id": "recraft-ai/recraft-remove-background",
            "model_name": "Recraft Background Removal",
            "description": "Automated background removal for images",
            "cost_per_run": 1,
        },
        {
            "model_id": "bria/remove-background",
            "model_name": "Bria Remove Background",
            "description": "Commercial-ready background removal",
            "cost_per_run": 1,
        },
    ],
    "upscaling": [
        {
            "model_id": "nightmareai/real-esrgan",
            "model_name": "Real-ESRGAN",
            "description": "AI-powered image upscaling with face correction",
            "cost_per_run": 1,  # Replicate: ~$0.003 → 1 credit
        },
        {
            "model_id": "philz1337x/crystal-upscaler",
            "model_name": "Crystal Upscaler",
            "description": "High-precision upscaler for portraits and products",
            "cost_per_run": 2,
        },
        {
            "model_id": "topazlabs/image-upscale",
            "model_name": "Topaz Image Upscale",
            "description": "Professional-grade image upscaling",
            "cost_per_run": 3,
        },
    ],
}


class ReplicateService:
    """Service for interacting with Replicate API."""
    
    def __init__(self):
        self.api_key = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_key:
            raise ValueError("REPLICATE_API_TOKEN not found in environment variables")
        
        # Set the API token explicitly for the library if needed, 
        # though standard lib usages pick it up automatically.
        os.environ["REPLICATE_API_TOKEN"] = self.api_key
    
    def initialize_model_cache(self, session: Session) -> None:
        """Initialize the model cache with curated models."""
        current_time = int(time.time() * 1000)
        
        for category, models in CURATED_MODELS.items():
            for model_data in models:
                # Check if model already exists
                existing = session.exec(
                    select(ReplicateModelCache)
                    .where(ReplicateModelCache.model_id == model_data["model_id"])
                ).first()
                
                if not existing:
                    # Create new cache entry
                    cache_entry = ReplicateModelCache(
                        model_id=model_data["model_id"],
                        model_name=model_data["model_name"],
                        description=model_data["description"],
                        category=category,
                        input_schema=json.dumps({}),  # Will be populated on first use
                        output_schema=json.dumps({}),
                        cost_per_run=model_data["cost_per_run"],
                        is_active=True,
                        last_updated=current_time
                    )
                    session.add(cache_entry)
        
        session.commit()
    
    def get_available_models(self, session: Session, category: Optional[str] = None) -> List[ReplicateModelCache]:
        """Get list of available models, optionally filtered by category."""
        query = select(ReplicateModelCache).where(ReplicateModelCache.is_active == True)
        
        if category:
            query = query.where(ReplicateModelCache.category == category)
        
        models = session.exec(query).all()
        return list(models)
    
    def get_model_details(self, session: Session, model_id: str) -> Optional[ReplicateModelCache]:
        """Get details for a specific model."""
        model = session.exec(
            select(ReplicateModelCache)
            .where(ReplicateModelCache.model_id == model_id)
        ).first()
        
        return model
    
    def run_prediction(self, model_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run a prediction on Replicate."""
        try:
            # Run the model
            output = replicate.run(model_id, input=inputs)
            
            # Handle different output types
            if isinstance(output, list):
                result = output
            elif isinstance(output, str):
                result = [output]
            else:
                result = [str(output)]
            
            return {
                "status": "succeeded",
                "output": result
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def run_prediction_async(self, model_id: str, inputs: Dict[str, Any]) -> str:
        """Start an async prediction and return prediction ID."""
        try:
            prediction = await replicate.predictions.create(
                version=model_id,
                input=inputs
            )
            return prediction.id
        except Exception as e:
            raise ValueError(f"Failed to start prediction: {str(e)}")
    
    async def get_prediction_status(self, prediction_id: str) -> Dict[str, Any]:
        """Get status of a running prediction."""
        try:
            prediction = await replicate.predictions.get(prediction_id)
            
            return {
                "id": prediction.id,
                "status": prediction.status,
                "output": prediction.output,
                "error": prediction.error,
                "logs": prediction.logs
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def cancel_prediction(self, prediction_id: str) -> bool:
        """Cancel a running prediction."""
        try:
            await replicate.predictions.cancel(prediction_id)
            return True
        except Exception as e:
            print(f"Failed to cancel prediction: {e}")
            return False
    
    def estimate_cost(self, session: Session, model_id: str) -> int:
        """Estimate credit cost for running a model."""
        model = self.get_model_details(session, model_id)
        if not model:
            return 10  # Default cost
        
        return int(model.cost_per_run)
