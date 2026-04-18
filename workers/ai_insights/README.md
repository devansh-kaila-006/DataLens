# AI Insights Worker

**Service 2**: AI-powered insight generation using Gemini API.

## Overview

This worker handles:
- Gemini API integration
- Dataset summary insights
- Column-specific insights
- Correlation insights
- Target analysis insights
- ML readiness insights
- Narrative generation

## Environment Variables

Required environment variables (set in Railway dashboard):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (keep secret!)
- `GEMINI_API_KEY`: Google Gemini API key (keep secret!)
- `PORT`: Port number (default: 8001)
- `RAILWAY_ENVIRONMENT`: Environment (development/production)

## API Endpoints

### POST /generate-insights
Generate AI insights for analysis results.

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
  "service": "ai-insights"
}
```

## Development

Run locally:
```bash
python main.py
```

Run with Docker:
```bash
docker build -t ai-insights .
docker run -p 8001:8001 ai-insights
```

## Security

- Implements rate limiting for Gemini API (60 calls/minute)
- Uses exponential backoff retry logic
- Validates all inputs before processing
- Never exposes API keys in responses
- Implements fallback mechanisms for API failures

## Cost Management

- Monitors API call usage
- Implements budget limits
- Provides usage statistics
- Caches results when possible

## Deployment

Deployed on Railway via GitHub integration.
Automatic deployment on push to main branch.
