# Report Generator Worker

**Service 3**: PDF/HTML report generation using Jinja2 templates.

## Overview

This worker handles:
- PDF report generation with WeasyPrint
- HTML report generation with Jinja2
- JSON report export for API consumers
- Report customization (sections, format options)
- Chart embedding from Plotly JSON
- AI insights inclusion

## Environment Variables

Required environment variables (set in Railway dashboard):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (keep secret!)
- `PORT`: Port number (default: 8002)
- `RAILWAY_ENVIRONMENT`: Environment (development/production)

## API Endpoints

### POST /generate-report
Generate report for analysis results.

**Request:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "format": "pdf"
}
```

**Response:** 202 Accepted

### GET /health
Health check endpoint for Railway monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "report-generator"
}
```

## Development

Run locally:
```bash
python main.py
```

Run with Docker:
```bash
docker build -t report-generator .
docker run -p 8002:8002 report-generator
```

## Security

- Sanitizes user input to prevent XSS in generated HTML
- Validates report download permissions (user can only download their own reports)
- Tests report XSS prevention
- Validates all input parameters

## Report Features

- **PDF Reports**: Professional, print-ready PDFs with embedded charts
- **HTML Reports**: Interactive HTML with responsive design
- **JSON Reports**: Machine-readable format for API consumers
- **Customization**: Choose sections, format options, branding

## Deployment

Deployed on Railway via GitHub integration.
Automatic deployment on push to main branch.
