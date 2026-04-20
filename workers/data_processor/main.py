"""
Data Processor Worker - Service 1
Handles file upload validation, data profiling, and statistical analysis.
Includes rate limiting and security monitoring.
"""
import os
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional

# Import our processing modules
from supabase_client import SupabaseClient
from profiler import FileProfiler
from statistical_analyzer import StatisticalAnalyzer
from ml_readiness import MLReadinessAssessor
from time_series_analyzer import TimeSeriesAnalyzer
from statistical_tests import StatisticalTests

# Import rate limiting and security utilities (local copies)
from rate_limiter import STRICT_LIMITER, STANDARD_LIMITER
from security import (
    validate_uuid,
    sanitize_filename,
    security_monitor
)

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
time_series_analyzer = TimeSeriesAnalyzer()
statistical_tests = StatisticalTests()
ml_assessor = MLReadinessAssessor()


class JobRequest(BaseModel):
    """Request model for processing jobs with enhanced validation."""
    job_id: str

    @validator('job_id')
    def validate_job_id(cls, v):
        """Validate UUID format to prevent injection attacks."""
        if not validate_uuid(v):
            raise ValueError('Invalid job ID format. Must be a valid UUID.')
        return v

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


def _extract_client_ip(request: Request) -> str:
    """
    Extract client IP address from request, handling proxy headers.

    Args:
        request: FastAPI request object

    Returns:
        Client IP address
    """
    # Try to get real IP from headers (for proxied requests)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fallback to client host
    return request.client.host if request.client else "unknown"


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
async def process_data(job_request: JobRequest, background_tasks: BackgroundTasks, request: Request):
    """
    Process data analysis job with rate limiting and security monitoring.

    Args:
        job_request: Job ID to process
        background_tasks: FastAPI background tasks
        request: FastAPI request object for rate limiting

    Returns:
        202 Accepted if job started successfully
    """
    try:
        # Extract client IP for rate limiting and security
        client_ip = _extract_client_ip(request)

        # Check IP blocklist
        if security_monitor.is_ip_blocked(client_ip):
            security_monitor.log_event(
                'blocked_request_attempt',
                {'endpoint': '/process', 'job_id': job_request.job_id},
                severity='critical',
                ip_address=client_ip
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied. Too many suspicious requests."
            )

        # Check rate limit (use strict limiter for expensive processing)
        allowed, limit_info = STRICT_LIMITER.check_rate_limit(client_ip, "minute")

        if not allowed:
            security_monitor.log_event(
                'rate_limit_exceeded',
                {'endpoint': '/process', 'limit': limit_info},
                severity='warning',
                ip_address=client_ip
            )
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": limit_info["limit"],
                    "reset_time": limit_info["reset_time"],
                    "reason": limit_info["reason"]
                },
                headers={
                    "X-RateLimit-Limit": str(limit_info["limit"]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(limit_info["reset_time"]),
                    "Retry-After": str(limit_info["reset_time"] - int(__import__('time').time()))
                }
            )

        # Log the request for security monitoring
        security_monitor.log_event(
            'process_request',
            {'job_id': job_request.job_id, 'user_agent': request.headers.get('user-agent')},
            severity='info',
            ip_address=client_ip
        )

        job_id = job_request.job_id

        # Check if job exists
        job = supabase_client.get_job(job_id)
        if not job:
            security_monitor.log_event(
                'job_not_found',
                {'job_id': job_id},
                severity='warning',
                ip_address=client_ip
            )
            raise HTTPException(status_code=404, detail="Job not found")

        logger.info(f"Received processing request for job: {job_id} from {client_ip}")

        # Add background task for processing
        background_tasks.add_task(process_job_background, job_id)

        return {
            "status": "accepted",
            "job_id": job_id,
            "message": "Job processing started",
            "rate_limit": {
                "limit": limit_info["limit"],
                "remaining": limit_info["remaining"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing job: {str(e)}")
        security_monitor.log_event(
            'processing_error',
            {'error': str(e), 'job_id': job_request.job_id},
            severity='critical',
            ip_address=client_ip
        )
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

        # Detect time columns for time series analysis
        numerical_cols = [col for col, dtype in profile['column_types'].items() if dtype == 'numerical']
        time_cols = file_profiler.detect_time_columns(df)

        if time_cols:
            logger.info(f"🕰️ Detected {len(time_cols)} time columns: {time_cols}")

            # Run time series analysis
            try:
                ts_results = time_series_analyzer.analyze_time_series(
                    df=df,
                    time_col=time_cols[0],
                    value_cols=numerical_cols[:5]  # Limit to 5 columns
                )

                supabase_client.save_analysis_result(job_id, 'time_series', ts_results)
                logger.info(f"✅ Time series analysis complete")

                # Generate forecasts for top 2 columns
                forecast_results = {}
                for col in numerical_cols[:2]:
                    series = df[col].dropna()
                    if len(series) >= 20:  # Minimum for forecasting
                        for method in ['arima', 'exponential_smoothing', 'moving_average']:
                            try:
                                forecast = time_series_analyzer.forecast_time_series(
                                    series=series,
                                    method=method,
                                    forecast_periods=12
                                )
                                if 'error' not in forecast:
                                    forecast_results[f'{col}_{method}'] = forecast
                            except Exception as e:
                                logger.warning(f"⚠️ Forecast failed for {col} using {method}: {e}")

                if forecast_results:
                    supabase_client.save_analysis_result(job_id, 'forecasting', forecast_results)
                    logger.info(f"✅ Forecasting complete for {len(forecast_results)} models")

            except Exception as e:
                logger.error(f"❌ Time series analysis failed: {e}")

        # Advanced statistical testing
        if len(numerical_cols) >= 2:
            logger.info(f"📊 Running advanced statistical testing on {len(numerical_cols)} numerical columns")

            try:
                test_results = statistical_tests.run_all_tests(df, profile['column_types'])
                supabase_client.save_analysis_result(job_id, 'statistical_tests', test_results)
                logger.info(f"✅ Statistical testing complete")
            except Exception as e:
                logger.error(f"❌ Statistical testing failed: {e}")

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
