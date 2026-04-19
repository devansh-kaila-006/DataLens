"""
AI Insights Worker - Service 2
Generates AI-powered insights using Gemini API.
"""
import os
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Import our modules
from insight_generator import InsightGenerator
from supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Insights Worker")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://data-lens-five.vercel.app",
        "*"  # Allow all origins during development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
supabase_client = SupabaseClient()
insight_generator = InsightGenerator()


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

        # Check if job exists
        job = supabase_client.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        logger.info(f"Received insight generation request for job: {job_id}")

        # Add background task for insight generation
        background_tasks.add_task(generate_insights_background, job_id)

        return {
            "status": "accepted",
            "job_id": job_id,
            "message": "Insight generation started"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_insights_background(job_id: str):
    """
    Background task to generate insights.

    Args:
        job_id: Job ID to generate insights for
    """
    try:
        logger.info(f"Starting insight generation for job {job_id}")

        # Get job details
        job = supabase_client.get_job(job_id)
        dataset_name = job.get('file_name', 'Unknown Dataset')

        # Fetch all analysis results
        logger.info("Fetching analysis results")
        response = supabase_client.client.table('analysis_results').select('*').eq('job_id', job_id).execute()

        if not response.data:
            raise Exception("No analysis results found for this job")

        # Compile analysis results
        analysis_results = {}
        for result in response.data:
            result_type = result['result_type']
            result_data = result['result_data']
            analysis_results[result_type] = result_data

        # Generate insights
        logger.info("Generating AI insights")
        insights = insight_generator.generate_all_insights(analysis_results, dataset_name)

        # Save insights
        logger.info("Saving insights to database")
        supabase_client.save_analysis_result(job_id, 'ai_insights', insights)

        logger.info(f"Successfully generated insights for job {job_id}")

    except Exception as e:
        logger.error(f"Error generating insights for job {job_id}: {str(e)}")
        # Don't update job status as this is a secondary process


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "AI Insights Worker",
        "version": "2.0.0",
        "status": "running",
        "capabilities": [
            "AI-powered narrative insights",
            "Column-specific analysis",
            "Data transformation suggestions",
            "Quality recommendations"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
