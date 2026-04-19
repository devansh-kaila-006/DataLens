"""
Data Processor Worker - Service 1
Handles file upload validation, data profiling, and statistical analysis.
"""
import os
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Import our processing modules
from supabase_client import SupabaseClient
from profiler import FileProfiler
from statistical_analyzer import StatisticalAnalyzer
from ml_readiness import MLReadinessAssessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Data Processor Worker")

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
file_profiler = FileProfiler(supabase_client.client)
statistical_analyzer = StatisticalAnalyzer()
ml_assessor = MLReadinessAssessor()


class JobRequest(BaseModel):
    """Request model for processing jobs."""
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
        "service": "data-processor"
    }


@app.post("/process")
async def process_data(job_request: JobRequest, background_tasks: BackgroundTasks):
    """
    Process data analysis job.

    Args:
        job_request: Job ID to process
        background_tasks: FastAPI background tasks

    Returns:
        202 Accepted if job started successfully
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

        logger.info(f"Received processing request for job: {job_id}")

        # Add background task for processing
        background_tasks.add_task(process_job_background, job_id)

        return {
            "status": "accepted",
            "job_id": job_id,
            "message": "Job processing started"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_job_background(job_id: str):
    """
    Background task to process the job.

    Args:
        job_id: Job ID to process
    """
    try:
        logger.info(f"Starting background processing for job {job_id}")

        # Update status to processing
        supabase_client.update_job_status(job_id, 'processing')

        # Get job details
        job = supabase_client.get_job(job_id)
        file_path = job.get('file_path')

        # Download and validate file
        logger.info(f"Downloading file: {file_path}")
        file_data = file_profiler.download_file_from_storage(file_path)

        # Validate file type
        is_valid, mime_type = file_profiler.validate_file_type(file_data, file_path)
        if not is_valid:
            raise ValueError(f"Invalid file type: {mime_type}")

        # Read file into DataFrame
        logger.info("Reading file into DataFrame")
        df = file_profiler.read_file(file_data, file_path)

        # Create data profile
        logger.info("Creating data profile")
        profile = file_profiler.create_data_profile(df)

        # Save profile
        logger.info("Saving profile to database")
        if not supabase_client.save_analysis_result(job_id, 'profile', profile):
            logger.error("Failed to save profile")

        # Perform statistical analysis
        logger.info("Performing statistical analysis")
        analysis_results = statistical_analyzer.analyze_dataset(df, profile['column_types'])

        # Save statistics
        logger.info("Saving statistics to database")
        if not supabase_client.save_analysis_result(job_id, 'statistics', analysis_results['statistics']):
            logger.error("Failed to save statistics")

        # Save correlations
        logger.info("Saving correlations to database")
        if not supabase_client.save_analysis_result(job_id, 'correlations', {
            'correlations': analysis_results['correlations']
        }):
            logger.error("Failed to save correlations")

        # Save distributions
        logger.info("Saving distributions to database")
        if not supabase_client.save_analysis_result(job_id, 'distributions', analysis_results['distributions']):
            logger.error("Failed to save distributions")

        # Save outliers
        logger.info("Saving outliers to database")
        if not supabase_client.save_analysis_result(job_id, 'outliers', analysis_results['outliers']):
            logger.error("Failed to save outliers")

        # Save data quality
        logger.info("Saving data quality to database")
        if not supabase_client.save_analysis_result(job_id, 'data_quality', analysis_results['data_quality']):
            logger.error("Failed to save data quality")

        # ML readiness assessment
        logger.info("Assessing ML readiness")
        ml_assessment = ml_assessor.assess_ml_readiness(analysis_results)

        # Save ML readiness
        supabase_client.save_analysis_result(job_id, 'ml_readiness', ml_assessment)

        # Create comprehensive summary
        summary = {
            'dataset_name': job.get('file_name', 'Unknown Dataset'),
            'total_rows': profile['row_count'],
            'total_columns': profile['column_count'],
            'numerical_columns': len([col for col, dtype in profile['column_types'].items() if dtype == 'numerical']),
            'categorical_columns': len([col for col, dtype in profile['column_types'].items() if dtype == 'categorical']),
            'missing_values': profile['missing_values'],
            'duplicate_rows': profile['duplicate_rows'],
            'ml_readiness_score': ml_assessment['overall_score'],
            'ml_readiness_level': ml_assessment['readiness_level']
        }

        supabase_client.save_analysis_result(job_id, 'summary', summary)

        # Update job status to completed
        supabase_client.update_job_status(job_id, 'completed')

        logger.info(f"Job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        supabase_client.update_job_status(job_id, 'failed', error_message=str(e))


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Data Processor Worker",
        "version": "2.0.0",
        "status": "running",
        "capabilities": [
            "File validation (CSV, Excel)",
            "Data profiling",
            "Statistical analysis",
            "Correlation analysis",
            "Outlier detection",
            "ML readiness assessment"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
