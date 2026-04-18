"""
Report Generator Worker - Service 3
Generates PDF/HTML reports using Jinja2 templates.
"""
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Literal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Report Generator Worker")


class ReportRequest(BaseModel):
    """Request model for report generation."""
    job_id: str
    format: Literal["pdf", "html", "json"] = "pdf"

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "format": "pdf"
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
        "service": "report-generator"
    }


@app.post("/generate-report")
async def generate_report(report_request: ReportRequest, background_tasks: BackgroundTasks):
    """
    Generate report for analysis results.

    Args:
        report_request: Job ID and format for report generation
        background_tasks: FastAPI background tasks

    Returns:
        202 Accepted if report generation started successfully
    """
    try:
        job_id = report_request.job_id
        report_format = report_request.format

        # Validate job_id format (UUID)
        import uuid
        try:
            uuid.UUID(job_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

        # TODO: Implement actual report generation logic
        # For now, just log the request
        logger.info(f"Received report generation request for job: {job_id}, format: {report_format}")

        # Add background task for report generation
        background_tasks.add_task(generate_report_background, job_id, report_format)

        return {
            "status": "accepted",
            "job_id": job_id,
            "format": report_format,
            "message": "Report generation started"
        }

    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_report_background(job_id: str, report_format: str):
    """
    Background task to generate report.
    This will be implemented in Phase 5.

    Args:
        job_id: Job ID to generate report for
        report_format: Format of report (pdf/html/json)
    """
    # TODO: Implement actual report generation logic
    logger.info(f"Generating {report_format} report for job {job_id} in background")


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Report Generator Worker",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
