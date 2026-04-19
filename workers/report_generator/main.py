"""
Report Generator Worker - Service 3
Generates PDF/HTML reports using Jinja2 templates.
"""
import os
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Literal
from report_builder import ReportBuilder
from supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Report Generator Worker")

# Initialize components
supabase_client = SupabaseClient()
report_builder = ReportBuilder()


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

        # Check if job exists
        job = supabase_client.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        logger.info(f"Received report generation request for job: {job_id}, format: {report_format}")

        # Add background task for report generation
        background_tasks.add_task(generate_report_background, job_id, report_format)

        return {
            "status": "accepted",
            "job_id": job_id,
            "format": report_format,
            "message": "Report generation started"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_report_background(job_id: str, report_format: str):
    """
    Background task to generate report.

    Args:
        job_id: Job ID to generate report for
        report_format: Format of report (pdf/html/json)
    """
    try:
        logger.info(f"Starting {report_format} report generation for job {job_id}")

        # Get job details
        job = supabase_client.get_job(job_id)
        dataset_name = job.get('dataset_name', 'Unknown Dataset')

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

        # Generate report based on format
        if report_format == "html":
            logger.info("Generating HTML report")
            html_content = report_builder.generate_html_report(analysis_results, dataset_name)

            # Save to Supabase Storage
            file_path = f"reports/{job_id}/report.html"
            supabase_client.client.storage.from_('reports').upload(
                file_path,
                html_content.encode('utf-8'),
                {'content-type': 'text/html'}
            )

            # Update job with report URL
            public_url = supabase_client.client.storage.from_('reports').get_public_url(file_path)
            logger.info(f"HTML report saved: {public_url}")

        elif report_format == "pdf":
            logger.info("Generating PDF report")
            html_content = report_builder.generate_html_report(analysis_results, dataset_name)
            pdf_bytes = report_builder.generate_pdf_report(html_content)

            # Save to Supabase Storage
            file_path = f"reports/{job_id}/report.pdf"
            supabase_client.client.storage.from_('reports').upload(
                file_path,
                pdf_bytes,
                {'content-type': 'application/pdf'}
            )

            public_url = supabase_client.client.storage.from_('reports').get_public_url(file_path)
            logger.info(f"PDF report saved: {public_url}")

        elif report_format == "json":
            logger.info("Generating JSON report")
            json_content = report_builder.generate_json_report(analysis_results, dataset_name)

            # Save to Supabase Storage
            file_path = f"reports/{job_id}/report.json"
            supabase_client.client.storage.from_('reports').upload(
                file_path,
                json_content.encode('utf-8'),
                {'content-type': 'application/json'}
            )

            public_url = supabase_client.client.storage.from_('reports').get_public_url(file_path)
            logger.info(f"JSON report saved: {public_url}")

        logger.info(f"Successfully generated {report_format} report for job {job_id}")

    except Exception as e:
        logger.error(f"Error generating report for job {job_id}: {str(e)}")
        # Don't update job status as this is a secondary process


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Report Generator Worker",
        "version": "2.0.0",
        "status": "running",
        "capabilities": [
            "Professional HTML reports",
            "PDF generation",
            "JSON export",
            "AI-powered insights integration",
            "Statistical summaries"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
