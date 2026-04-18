# Data Processor Worker

**Service 1**: Data processing and statistical analysis worker.

## Overview

This worker handles:
- File upload validation and security checks
- Data profiling with pandas
- Statistical analysis with scipy
- Data quality assessment
- Univariate analysis
- Correlation analysis
- Target variable analysis
- ML readiness assessment

## Environment Variables

Required environment variables (set in Railway dashboard):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (keep secret!)
- `PORT`: Port number (default: 8000)
- `RAILWAY_ENVIRONMENT`: Environment (development/production)

## API Endpoints

### POST /process
Trigger data processing for a job.

**Request:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** 202 Accepted

### GET /health
Health check endpoint for Railway monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "data-processor"
}
```

## Development

Run locally:
```bash
python main.py
```

Run with Docker:
```bash
docker build -t data-processor .
docker run -p 8000:8000 data-processor
```

## Security

- Validates file MIME types (not just extensions)
- Enforces 50MB file size limit
- Sanitizes filenames to prevent path traversal
- Scans file content for malicious patterns
- Uses Supabase service role key (backend-only)

## Deployment

Deployed on Railway via GitHub integration.
Automatic deployment on push to main branch.
