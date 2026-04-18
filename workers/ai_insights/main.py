"""
AI Insights Worker - Service 2
Generates AI-powered insights using Gemini API.
"""
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Insights Worker")


class JobRequest(BaseModel):
    """Request model for generating insights."""
    job_id: str

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for Railway monitoring.
    """
    return {
        "status": "healthy",
        "service": "ai-insights"
    }


@app.post("/generate-insights")
async def generate_insights(job_request: JobRequest, background_tasks: BackgroundTasks):
    """
    Generate AI insights for analysis results.

    Args:
        job_request: Job ID to generate insights for
        background_tasks: FastAPI background tasks

    Returns:
        202 Accepted if insight generation started successfully
    """
    try:
        job_id = job_request.job_id

        # Validate job_id format (UUID)
        import uuid
        try:
            uuid.UUID(job_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

        # TODO: Implement actual insight generation logic
        # For now, just log the request
        logger.info(f"Received insight generation request for job: {job_id}")

        # Add background task for insight generation
        background_tasks.add_task(generate_insights_background, job_id)

        return {
            "status": "accepted",
            "job_id": job_id,
            "message": "Insight generation started"
        }

    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_insights_background(job_id: str):
    """
    Background task to generate insights.
    This will be implemented in Phase 4.

    Args:
        job_id: Job ID to generate insights for
    """
    # TODO: Implement actual AI insight generation logic
    logger.info(f"Generating insights for job {job_id} in background")


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "AI Insights Worker",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
