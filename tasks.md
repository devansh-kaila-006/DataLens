# Automated EDA Report Generator - Detailed Implementation Tasks

> **Tech Stack**: Supabase (Backend/DB/Storage/Auth) + Railway Workers (Python Data Processing) + React (Frontend) + Gemini API (AI)
> **Timeline**: 8-10 weeks
> **Architecture**: Serverless - No server management!
> **Monthly Cost**: ~$5-20 (Railway free credits + paid)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (Vercel)                   │
│                    - Free hosting                           │
│                    - Global CDN                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │     │
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Auto-generated REST & GraphQL APIs            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Railway Services                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service 1: Data Processing                          │  │
│  │  - File upload validation                           │  │
│  │  - Data profiling (pandas)                          │  │
│  │  - Statistical analysis (scipy)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service 2: AI Insights                              │  │
│  │  - Gemini API integration                           │  │
│  │  - Narrative generation                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service 3: Report Generation                       │  │
│  │  - PDF generation (weasyprint)                      │  │
│  │  - HTML templating (Jinja2)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Gemini API  │
                     └─────────────┘
```

---

## Phase 1: Foundation & Account Setup (Week 1)

### 1.1 Account Creation & Setup ✅
- [ ] **1.1.1** Create essential accounts
  - [ ] **Supabase account**: https://supabase.com (free tier)
  - [ ] **Railway account**: https://railway.app (free tier + $5 credits/month)
  - [ ] **Vercel account**: https://vercel.com (free tier for frontend)
  - [ ] **Google Cloud**: For Gemini API (free tier generous)
  - [ ] **GitHub account**: For code repository and Railway deployment

- [ ] **1.1.2** API Keys & Authentication
  - [ ] Generate Gemini API key from Google AI Studio
  - [ ] Note Supabase project URL and anon key
  - [ ] Generate Supabase service role key (for Render workers)
  - [ ] Store all keys in secure password manager
  - [ ] Create `.env.example` file (don't commit real keys!)

### 1.2 Supabase Project Setup 🗄️
- [ ] **1.2.1** Create Supabase project
  - [ ] Create new project: "DataLens EDA"
  - [ ] Choose region closest to your users (recommend US/EU)
  - [ ] Wait for PostgreSQL database to be provisioned (~2 minutes)
  - [ ] Note database connection string

- [ ] **1.2.2** Database schema design
  - [ ] Create `analysis_jobs` table:
    ```sql
    - id (uuid, primary key)
    - user_id (uuid, references auth.users)
    - status (text: pending/processing/completed/failed)
    - file_name (text)
    - file_size (integer)
    - row_count (integer)
    - column_count (integer)
    - upload_timestamp (timestamptz)
    - processing_started_at (timestamptz)
    - processing_completed_at (timestamptz)
    - error_message (text, nullable)
    ```
  - [ ] Create `analysis_results` table:
    ```sql
    - id (uuid, primary key)
    - job_id (uuid, references analysis_jobs)
    - result_type (text: quality/univariate/correlation/target/ml_readiness)
    - result_data (jsonb)
    - created_at (timestamptz)
    ```
  - [ ] Create `reports` table:
    ```sql
    - id (uuid, primary key)
    - job_id (uuid, references analysis_jobs)
    - format (text: pdf/html/json)
    - file_path (text, references Storage)
    - status (text: generating/completed/failed)
    - created_at (timestamptz)
    ```
  - [ ] Enable Row Level Security (RLS) on all tables
  - [ ] Create RLS policies for user data isolation

- [ ] **1.2.3** Supabase Storage setup
  - [ ] Create storage bucket: "uploads"
  - [ ] Create storage bucket: "reports"
  - [ ] Configure bucket policies (public read for reports, private for uploads)
  - [ ] Enable file size limits (50MB max)
  - [ ] Add allowed file extensions: .csv, .xlsx, .xls

- [ ] **1.2.4** Supabase Auth setup
  - [ ] Enable email/password authentication
  - [ ] Enable magic link authentication (optional, for better UX)
  - [ ] Configure email templates (if using email auth)
  - [ ] Set up redirect URLs for your Vercel frontend
  - [ ] Create user_profiles table (optional, for user settings)

- [ ] **1.2.5** Supabase API exploration
  - [ ] Explore auto-generated REST API in Supabase dashboard
  - [ ] Test API endpoints with API panel (PostgreSQL → API)
  - [ ] Review GraphQL API (optional, can use REST instead)
  - [ ] Set up Real-time subscriptions for job status updates
  - [ ] Test database functions and triggers

### 1.3 Project Repository Setup 📁
- [ ] **1.3.1** Initialize Git repository
  - [ ] Create root project directory: `DataLens/`
  - [ ] `git init` to initialize repository
  - [ ] Create comprehensive `.gitignore`:
    ```
    # Dependencies
    node_modules/
    __pycache__/
    *.pyc
    venv/
    .venv/

    # Environment
    .env
    .env.local
    .env.production

    # IDE
    .vscode/
    .idea/
    *.swp
    *.swo

    # OS
    .DS_Store
    Thumbs.db

    # Render
    .render/

    # Build outputs
    dist/
    build/
    *.egg-info/
    ```

- [ ] **1.3.2** Create directory structure
  ```
  DataLens/
  ├── frontend/                 # React application
  ├── workers/                  # Railway Python services
  │   ├── data_processor/      # Service 1: Data processing
  │   ├── ai_insights/         # Service 2: AI insights
  │   └── report_generator/    # Service 3: Report generation
  ├── shared/                   # Shared utilities and types
  ├── tests/                    # Test files
  ├── docs/                     # Documentation
  ├── .gitignore
  ├── .env.example
  ├── README.md
  └── tasks.md                 # This file
  ```

- [ ] **1.3.3** Create README.md
  - [ ] Project title and description
  - [ ] Architecture overview
  - [ ] Tech stack badges
  - [ ] Features list
  - [ ] Getting started guide
  - [ ] Deployment instructions
  - [ ] License information

### 1.4 Frontend Project Setup (React + TypeScript) ⚛️
- [ ] **1.4.1** Initialize React app
  - [ ] Navigate to `frontend/` directory
  - [ ] Create Vite + TypeScript app: `npm create vite@latest . -- --template react-ts`
  - [ ] Install dependencies: `npm install`
  - [ ] Verify dev server: `npm run dev`

- [ ] **1.4.2** Install frontend dependencies
  - [ ] Supabase client: `npm install @supabase/supabase-js`
  - [ ] Routing: `npm install react-router-dom`
  - [ ] Data fetching: `npm install @tanstack/react-query`
  - [ ] Forms: `npm install react-hook-form @hookform/resolvers zod`
  - [ ] File upload: `npm install react-dropzone`
  - [ ] Charts: `npm install plotly.js react-plotly.js`
  - [ ] UI components (optional): `npm install @radix-ui/react-*` or Material-UI
  - [ ] Styling: `npm install tailwindcss` (optional) or use CSS modules
  - [ ] Date handling: `npm install date-fns`
  - [ ] Dev tools: `npm install -D @types/react plotly.js-dist-min`

- [ ] **1.4.3** Configure frontend
  - [ ] Update `vite.config.ts` with env variables
  - [ ] Create `.env` file with:
    ```
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_API_URL=your_render_worker_url (optional)
    ```
  - [ ] Set up Tailwind CSS (if using): `npx tailwindcss init -p`
  - [ ] Configure absolute imports in `tsconfig.json`
  - [ ] Set up ESLint and Prettier

### 1.5 Render Workers Setup (Python) 🔧
- [ ] **1.5.1** Set up shared Python environment
  - [ ] Python version: 3.11 or later
  - [ ] Create `shared/requirements.txt`:
    ```
    # Data processing
    pandas==2.1.0
    numpy==1.24.0
    scipy==1.11.0
    openpyxl==3.1.0
    chardet==5.2.0

    # Visualization
    plotly==5.17.0
    kaleido==0.2.0  # For static image export

    # PDF generation
    weasyprint==60.0
    jinja2==3.1.0
    pillow==10.0.0

    # Supabase client
    supabase==2.3.0

    # AI integration
    google-generativeai==0.3.0

    # Utilities
    python-dotenv==1.0.0
    pydantic==2.4.0
    httpx==0.25.0
    ```
  - [ ] Create `shared/python_version` file: `3.11`

- [ ] **1.5.2** Create worker structure (for each of 3 workers)
  - [ ] Create `workers/data_processor/` directory
  - [ ] Create `workers/ai_insights/` directory
  - [ ] Create `workers/report_generator/` directory
  - [ ] Each worker needs:
    - `requirements.txt` (symlink to `../shared/requirements.txt`)
    - `Dockerfile` (for Railway deployment)
    - `main.py` (worker entry point)
    - `railway.toml` (Railway configuration)
    - `.env` (environment variables)
    - `README.md` (worker-specific docs)

- [ ] **1.5.3** Create Dockerfile template (for each worker)
  ```dockerfile
  FROM python:3.11-slim

  WORKDIR /app

  # Install system dependencies
  RUN apt-get update && apt-get install -y \
      build-essential \
      curl \
      && rm -rf /var/lib/apt/lists/*

  # Copy requirements
  COPY requirements.txt .

  # Install Python dependencies
  RUN pip install --no-cache-dir -r requirements.txt

  # Copy application code
  COPY . .

  # Expose port (Render sets PORT env var)
  ENV PYTHONUNBUFFERED=1

  # Run worker
  CMD ["python", "main.py"]
  ```

### 1.6 CI/CD & Automation Setup 🔄
- [ ] **1.6.1** Connect GitHub to Railway
  - [ ] Log in to Railway dashboard
  - [ ] Click "New Project" → "Deploy from GitHub repo"
  - [ ] Connect GitHub repository
  - [ ] Configure workers (we'll do this in later phases)
  - [ ] Set up automatic deployments on push to main branch
  - [ ] Add Railway GitHub app for automatic deployments

- [ ] **1.6.2** Connect GitHub to Vercel (for frontend)
  - [ ] Log in to Vercel dashboard
  - [ ] Import GitHub repository
  - [ ] Configure root directory as `frontend/`
  - [ ] Set up environment variables
  - [ ] Enable automatic deployments

- [ ] **1.6.3** Create GitHub Actions workflow (optional, for testing)
  - [ ] Create `.github/workflows/test.yml`
  - [ ] Run tests on pull requests
  - [ ] Run linting checks
  - [ ] Auto-cancel redundant workflows

---

## Phase 1.5: Security Fundamentals (CRITICAL - Do This First!) 🔒

### Why Security Matters:
- **Portfolio project**: Employers WILL ask about security
- **Real threats**: File uploads, API keys, user data are all attack vectors
- **Legal compliance**: GDPR, data protection laws
- **Professional quality**: Security separates toys from production apps

### 1.5.1 File Upload Security 📁
- [ ] **CRITICAL: File type validation**
  - [ ] Validate file MIME type (not just extension!)
  - [ ] Use python-magic or file command to detect real file type
  - [ ] Whitelist allowed types: `.csv`, `.xlsx`, `.xls`
  - [ ] Reject: executables, scripts, malformed files
  - [ ] Implementation in `workers/shared/security.py`:
    ```python
    import magic

    ALLOWED_MIME_TYPES = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    def validate_file_type(file_path: str) -> bool:
        mime = magic.from_file(file_path, mime=True)
        return mime in ALLOWED_MIME_TYPES
    ```

- [ ] **CRITICAL: File size limits**
  - [ ] Enforce 50MB max file size
  - [ ] Validate on frontend AND backend
  - [ ] Reject files exceeding limit immediately
  - [ ] Log rejected upload attempts

- [ ] **CRITICAL: Filename sanitization**
  - [ ] Remove path traversal sequences: `../`, `..\`
  - [ ] Remove special characters: `<`, `>`, `:`, `"`, `/`, `\`, `|`, `?`, `*`
  - [ ] Limit filename length (255 chars)
  - [ ] Use UUID for actual filename, keep original for display
  - [ ] Implementation:
    ```python
    import re
    import uuid
    from pathlib import Path

    def sanitize_filename(filename: str) -> str:
        # Remove path separators
        filename = Path(filename).name
        # Remove dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        # Limit length
        filename = filename[:255]
        # Generate safe storage name
        safe_name = f"{uuid.uuid4()}_{filename}"
        return safe_name
    ```

- [ ] **CRITICAL: File content scanning**
  - [ ] Scan for malicious patterns (script tags, SQL injection attempts)
  - [ ] Check for embedded macros in Excel files
  - [ ] Validate CSV structure (consistent column count)
  - [ ] Reject files with suspicious content

- [ ] **IMPORTANT: Upload rate limiting**
  - [ ] Limit uploads per user: 10/hour
  - [ ] Limit uploads per IP: 20/hour
  - [ ] Track upload attempts in database
  - [ ] Implement progressive delays for repeated failures

### 1.5.2 API Security 🔐
- [ ] **CRITICAL: Environment variable protection**
  - [ ] NEVER commit `.env` files (already in .gitignore)
  - [ ] Use `.env.example` with placeholder values only
  - [ ] Add `.env` to `.gitignore` (already done)
  - [ ] Rotate API keys if accidentally exposed
  - [ ] Use different keys for dev/staging/production

- [ ] **CRITICAL: API key management**
  - [ ] Store API keys in Railway environment variables (not code)
  - [ ] Use Supabase service role key ONLY in backend services
  - [ ] Use Supabase anon key in frontend (limited permissions)
  - [ ] Implement key rotation strategy
  - [ ] Monitor API key usage for anomalies

- [ ] **IMPORTANT: Webhook security**
  - [ ] Implement webhook signature verification
  - [ ] Use HMAC signatures for all webhooks
  - [ ] Reject unsigned webhooks
  - [ ] Log webhook verification failures
  - [ ] Implementation:
    ```python
    import hmac
    import hashlib

    def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    ```

- [ ] **IMPORTANT: CORS configuration**
  - [ ] Configure CORS in Supabase settings
  - [ ] Whitelist ONLY your frontend domains
  - [ ] Development: `http://localhost:5173`
  - [ ] Production: `https://your-domain.vercel.app`
  - [ ] Reject all other origins

- [ ] **CRITICAL: Input validation**
  - [ ] Validate ALL user inputs (job IDs, file names, etc.)
  - [ ] Use Pydantic models for type validation
  - [ ] Sanitize strings to prevent injection attacks
  - [ ] Validate UUIDs for job IDs
  - [ ] Implementation:
    ```python
    from pydantic import BaseModel, validator
    import uuid

    class JobRequest(BaseModel):
        job_id: str

        @validator('job_id')
        def validate_job_id(cls, v):
            try:
                uuid.UUID(v)
                return v
            except ValueError:
                raise ValueError('Invalid job ID format')
    ```

- [ ] **IMPORTANT: Rate limiting**
  - [ ] Implement per-IP rate limiting
  - [ ] Implement per-user rate limiting
  - [ ] Use Supabase database to track requests
  - [ ] Return 429 Too Many Requests when limit exceeded
  - [ ] Implement exponential backoff for retries

### 1.5.3 Database Security 🗄️
- [ ] **CRITICAL: Row Level Security (RLS)**
  - [ ] Enable RLS on ALL Supabase tables
  - [ ] Create RLS policies:
    - Users can only read their own jobs
    - Users can only create jobs with their user_id
    - Users can only update their own jobs
    - Service role can bypass RLS (for workers)
  - [ ] Test RLS policies thoroughly
  - [ ] Implementation in Supabase SQL Editor:
    ```sql
    -- Enable RLS
    ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

    -- User can see their own jobs
    CREATE POLICY "Users can view own jobs"
    ON analysis_jobs FOR SELECT
    USING (auth.uid() = user_id);

    -- User can create jobs
    CREATE POLICY "Users can create own jobs"
    ON analysis_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    -- Service role can do anything
    CREATE POLICY "Service role full access"
    ON analysis_jobs FOR ALL
    USING (auth.role() = 'service_role');
    ```

- [ ] **CRITICAL: SQL injection prevention**
  - [ ] ALWAYS use parameterized queries (Supabase client does this)
  - [ ] NEVER concatenate strings into SQL queries
  - [ ] Use Supabase query builder, not raw SQL
  - [ ] Validate all inputs before querying

- [ ] **IMPORTANT: Database connection security**
  - [ ] Use connection string from Railway environment variables
  - [ ] Never hardcode connection strings
  - [ ] Use SSL/TLS for database connections
  - [ ] Implement connection pooling

- [ ] **IMPORTANT: Data encryption**
  - [ ] Supabase encrypts data at rest (enabled by default)
  - [ ] Use HTTPS for all database connections
  - [ ] Encrypt sensitive data before storage (if needed)
  - [ ] Never store passwords (use Supabase Auth)

### 1.5.4 Authentication Security 🔑
- [ ] **CRITICAL: Supabase Auth configuration**
  - [ ] Enable email verification (require before access)
  - [ ] Implement password strength requirements:
    - Minimum 8 characters
    - Require uppercase, lowercase, number, special char
  - [ ] Enable rate limiting on auth endpoints
  - [ ] Implement account lockout after failed attempts
  - [ ] Set session timeout (30 days recommended)

- [ ] **IMPORTANT: Session management**
  - [ ] Use Supabase's built-in session management
  - [ ] Implement session refresh tokens
  - [ ] Clear sessions on logout
  - [ ] Implement "remember me" functionality safely
  - [ ] Store session in secure HTTP-only cookies

- [ ] **IMPORTANT: OAuth security** (if using Google/GitHub login)
  - [ ] Validate OAuth tokens
  - [ ] Implement CSRF protection
  - [ ] Store OAuth tokens securely
  - [ ] Implement token refresh logic
  - [ ] Revoke OAuth tokens on logout

### 1.5.5 Secret Management 🔒
- [ ] **CRITICAL: Never expose secrets in code**
  - [ ] Check for accidentally committed secrets
  - [ ] Use `git-secrets` or similar tool
  - [ ] Scan repository for API keys, passwords
  - [ ] Rotate secrets if exposed

- [ ] **CRITICAL: Railway environment variables**
  - [ ] Add ALL secrets in Railway dashboard (not .env files)
  - [ ] Use Railway's encrypted environment variables
  - [ ] Different variables for dev/prod environments
  - [ ] Never log environment variables
  - [ ] Required variables:
    ```
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    GEMINI_API_KEY
    RAILWAY_PRIVATE_DOMAIN (optional)
    WEBHOOK_SECRET (for webhook verification)
    ```

- [ ] **IMPORTANT: Secret rotation strategy**
  - [ ] Document secret rotation procedures
  - [ ] Rotate API keys every 90 days
  - [ ] Rotate webhook secrets periodically
  - [ ] Test secret rotation process
  - [ ] Have emergency rotation plan

### 1.5.6 Dependencies Security 📦
- [ ] **IMPORTANT: Keep dependencies updated**
  - [ ] Run `pip-audit` to check for vulnerable Python packages
  - [ ] Run `npm audit` for frontend dependencies
  - [ ] Update dependencies regularly
  - [ ] Use `pip-audit` in CI/CD pipeline
  - [ ] Implementation:
    ```bash
    # Install pip-audit
    pip install pip-audit

    # Check for vulnerabilities
    pip-audit --desc

    # Auto-fix (when possible)
    pip-audit --fix
    ```

- [ ] **IMPORTANT: Pin dependency versions**
  - [ ] Use exact versions in requirements.txt
  - [ ] Use package-lock.json for frontend
  - [ ] Document why specific versions are needed
  - [ ] Test updates before deploying

- [ ] **IMPORTANT: Use dependency scanning tools**
  - [ ] Add `safety` to requirements.txt for Python
  - [ ] Configure GitHub Dependabot
  - [ ] Review dependency updates weekly
  - [ ] Automate security updates

### 1.5.7 Logging & Monitoring for Security 📊
- [ ] **CRITICAL: Security event logging**
  - [ ] Log ALL failed authentication attempts
  - [ ] Log rejected file uploads (with reason)
  - [ ] Log webhook verification failures
  - [ ] Log rate limit violations
  - [ ] Log suspicious API usage patterns
  - [ ] Implementation:
    ```python
    import logging
    from datetime import datetime

    security_logger = logging.getLogger('security')

    def log_security_event(event_type: str, details: dict, user_id: str = None):
        security_logger.warning({
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'details': details
        })

    # Usage examples
    log_security_event('failed_auth', {'ip': request.ip}, user_id)
    log_security_event('file_rejected', {'reason': 'invalid_type', 'file': filename})
    ```

- [ ] **IMPORTANT: Implement security monitoring**
  - [ ] Monitor for suspicious patterns:
    - Multiple failed logins from same IP
    - Unusual upload frequency
    - Large number of failed webhooks
  - [ ] Set up alerts for security events
  - [ ] Review security logs weekly
  - [ ] Implement automatic blocking for repeated violations

- [ ] **IMPORTANT: Error message security**
  - [ ] NEVER expose internal errors to users
  - [ ] Use generic error messages for users
  - [ ] Log detailed errors for debugging
  - [ ] Sanitize error messages before displaying
  - [ ] Don't reveal file paths, database schemas, etc.

### 1.5.8 Railway-Specific Security 🚂
- [ ] **IMPORTANT: Railway service security**
  - [ ] Use Railway private networking for worker-to-worker communication
  - [ ] Restrict service exposure (use private domains)
  - [ ] Implement health check endpoints
  - [ ] Don't expose debug endpoints in production
  - [ ] Use Railway's built-in secrets management

- [ ] **IMPORTANT: Railway deployment security**
  - [ ] Enable GitHub branch protection rules
  - [ ] Require approval for production deployments
  - [ ] Use separate Railway projects for dev/prod
  - [ ] Implement deployment verification
  - [ ] Roll back automatically on health check failures

### 1.5.9 Frontend Security 🌐
- [ ] **CRITICAL: XSS prevention**
  - [ ] React automatically escapes JSX (good!)
  - [ ] NEVER use `dangerouslySetInnerHTML` with user input
  - [ ] Sanitize user-generated content
  - [ ] Implement Content Security Policy (CSP)
  - [ ] Implementation in `index.html`:
    ```html
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self';
                   script-src 'self' 'unsafe-inline';
                   style-src 'self' 'unsafe-inline';
                   img-src 'self' data: https:;
                   connect-src 'self' https://*.supabase.co;">
    ```

- [ ] **IMPORTANT: CSRF protection**
  - [ ] Supabase handles CSRF automatically
  - [ ] Verify CSRF tokens for state-changing operations
  - [ ] Use SameSite cookies for session tokens
  - [ ] Implement referrer checking

- [ ] **IMPORTANT: Secure storage in browser**
  - [ ] Use Supabase Auth (don't implement your own)
  - [ ] Store tokens securely (Supabase handles this)
  - [ ] Clear sensitive data on logout
  - [ ] Don't store sensitive data in localStorage
  - [ ] Implement auto-logout on inactivity

### 1.5.10 GDPR & Privacy Compliance ⚖️
- [ ] **IMPORTANT: User data rights**
  - [ ] Implement data export functionality
  - [ ] Implement account deletion (cascade delete all data)
  - [ ] Provide privacy policy
  - [ ] Implement cookie consent (if using analytics)
  - [ ] Allow users to view their data

- [ ] **IMPORTANT: Data minimization**
  - [ ] Only collect necessary data
  - [ ] Delete uploaded files after processing (24 hours)
  - [ ] Delete reports after 7 days
  - [ ] Implement automatic data cleanup
  - [ ] Document data retention policy

- [ ] **IMPORTANT: Privacy by design**
  - [ ] Anonymize data when possible
  - [ ] Use user IDs instead of emails in logs
  - [ ] Encrypt sensitive data
  - [ ] Implement data access logging
  - [ ] Provide transparency about data usage

### Security Checklist ✅
Before deploying to production, verify:

- [ ] All API keys in Railway environment variables (not code)
- [ ] Row Level Security enabled on all Supabase tables
- [ ] File upload validation implemented (type, size, content)
- [ ] Rate limiting configured
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured
- [ ] Secrets never logged or exposed
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security event logging implemented
- [ ] Error messages don't leak information
- [ ] Session timeout configured
- [ ] Password strength requirements enforced
- [ ] Webhook signatures verified
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention implemented
- [ ] CSRF protection enabled
- [ ] Data retention policy implemented
- [ ] User can delete their data
- [ ] Privacy policy created

---

## Phase 2: Supabase Integration & Data Model (Week 1-2)

### 2.1 Database Functions & Triggers ⚡
- [ ] **2.1.1** Create database functions
  - [ ] Function: `create_job(user_id, file_name, file_size)` - Creates new analysis job
  - [ ] Function: `update_job_status(job_id, status, error_message)` - Updates job status
  - [ ] Function: `save_analysis_result(job_id, result_type, result_data)` - Saves analysis results
  - [ ] Function: `get_job_results(job_id)` - Retrieves all results for a job
  - [ ] Test functions in Supabase SQL Editor

- [ ] **2.1.2** Set up Real-time for job status
  - [ ] Enable Real-time for `analysis_jobs` table
  - [ ] Test Real-time subscription in Supabase dashboard
  - [ ] Create frontend subscription hook (later phase)
  - [ ] Handle connection errors and reconnection logic

- [ ] **2.1.3** Create database views
  - [ ] View: `job_summary` - Aggregates job info with latest status
  - [ ] View: `user_jobs` - All jobs for a user with metadata
  - [ ] View: `job_results_summary` - Summary of analysis results by type
  - [ ] Test views in Supabase table editor

### 2.2 Supabase Client Setup 🔌
- [ ] **2.2.1** Create Supabase client utility
  - [ ] Create `frontend/src/lib/supabase.ts`:
    ```typescript
    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    export const supabase = createClient(supabaseUrl, supabaseAnonKey)
    ```
  - [ ] Add TypeScript types for database tables
  - [ ] Create type definitions file: `frontend/src/types/database.ts`
  - [ ] Test connection with a simple query

- [ ] **2.2.2** Create Supabase client for workers
  - [ ] Create `shared/supabase_client.py`:
    ```python
    import os
    from supabase import create_client, Client

    supabase_url: str = os.getenv("SUPABASE_URL")
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    supabase: Client = create_client(supabase_url, supabase_key)
    ```
  - [ ] Test connection from worker environment
  - [ ] Add error handling and retry logic

- [ ] **2.2.3** Create data access layer
  - [ ] Create `frontend/src/lib/db.ts` with helper functions:
    - `createJob(file: File)` - Creates job and uploads file
    - `getJob(jobId: string)` - Fetches job details
    - `subscribeToJob(jobId: string)` - Real-time subscription
    - `getJobResults(jobId: string)` - Fetches analysis results
  - [ ] Add TypeScript types for all functions
  - [ ] Add error handling and loading states

### 2.3 File Upload Integration 📁
- [ ] **2.3.1** Implement file upload to Supabase Storage
  - [ ] Create upload function in `frontend/src/lib/upload.ts`:
    ```typescript
    async function uploadFile(file: File, jobId: string) {
      const fileName = `${jobId}/${file.name}`
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file)

      return { data, error }
    }
    ```
  - [ ] Add progress tracking for uploads
  - [ ] Implement file size validation (client-side)
  - [ ] Implement file type validation (client-side)
  - [ ] Handle upload errors gracefully

- [ ] **2.3.2** Create file processing trigger
  - [ ] When file is uploaded to Storage, trigger Railway service
  - [ ] Option A: Use Supabase Webhooks (simpler)
  - [ ] Option B: Use Database function with HTTP call (more control)
  - [ ] Implement webhook endpoint in Railway service
  - [ ] Secure webhook with signature verification

- [ ] **2.3.3** File cleanup automation
  - [ ] Create Supabase Edge Function to schedule cleanup
  - [ ] Delete uploaded files after 24 hours
  - [ ] Delete generated reports after 7 days
  - [ ] Add cron job for periodic cleanup

---

## Phase 3: Data Processing Worker (Worker 1) (Weeks 2-3)

### 3.1 Worker 1 Setup & Deployment 🚀
- [ ] **3.1.1** Create data processor worker structure
  - [ ] Directory: `workers/data_processor/`
  - [ ] Create `main.py` with FastAPI app (for HTTP endpoint)
  - [ ] Create `profiler.py` for data profiling
  - [ ] Create `quality_analyzer.py` for quality analysis
  - [ ] Create `univariate_analyzer.py` for column analysis
  - [ ] Create `correlation_analyzer.py` for correlation analysis
  - [ ] Create `target_analyzer.py` for target analysis
  - [ ] Create `ml_readiness.py` for ML recommendations

- [ ] **3.1.2** Implement HTTP endpoint in worker
  - [ ] POST `/process` endpoint to trigger processing
  - [ ] Accept job_id and file_path as parameters
  - [ ] Return 202 Accepted immediately (async processing)
  - [ ] Update job status to "processing"
  - [ ] Run analysis in background thread
  - [ ] Handle errors and update job status to "failed"

- [ ] **3.1.3** Deploy to Railway
  - [ ] Create new service on Railway dashboard
  - [ ] Click "New Service" → "Deploy from GitHub repo"
  - [ ] Select repository and set root directory to `workers/data_processor/`
  - [ ] Railway will auto-detect Dockerfile
  - [ ] **SECURITY: Set environment variables in Railway dashboard (never in code)**:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY` (treat as secret!)
    - `GEMINI_API_KEY` (treat as secret!)
    - `WEBHOOK_SECRET` (generate random string, keep secret!)
    - `PORT=8000` (or your preferred port)
    - `RAILWAY_ENVIRONMENT=production`
  - [ ] **SECURITY: Enable private networking** (for worker-to-worker communication)
  - [ ] **SECURITY: Configure health check endpoint** (`/health`)
  - [ ] Click "Deploy" and wait for build (~2-3 minutes)
  - [ ] Test the endpoint from Railway dashboard
  - [ ] **SECURITY: Verify no secrets in logs**
  - [ ] Note the service URL for webhook configuration

### 3.2 Data Profiling Engine 🔍
- [ ] **3.2.1** File download and validation
  - [ ] Download file from Supabase Storage
  - [ ] Validate file type (CSV/Excel)
  - [ ] Detect encoding (chardet)
  - [ ] Handle encoding errors gracefully
  - [ ] Read file with pandas (chunked if > 100MB)

- [ ] **3.2.2** Column type detection
  - [ ] Implement `detect_column_types(df: pd.DataFrame)` function
  - [ ] Detect numeric columns (int, float)
  - [ ] Detect categorical columns (string, low cardinality)
  - [ ] Detect datetime columns (parseable dates)
  - [ ] Detect boolean columns
  - [ ] Detect text columns (high cardinality strings)
  - [ ] Handle mixed-type columns

- [ ] **3.2.3** Basic statistics computation
  - [ ] Implement `compute_basic_stats(df: pd.DataFrame)` function
  - [ ] Calculate: row count, column count, memory usage
  - [ ] Count duplicate rows
  - [ ] Generate column list with types
  - [ ] Create data profile dictionary
  - [ ] Save to Supabase `analysis_results` table

### 3.3 Data Quality Analysis ✅
- [ ] **3.3.1** Missing value analysis
  - [ ] Implement `analyze_missing_values(df: pd.DataFrame)` function
  - [ ] Count missing values per column
  - [ ] Calculate missing percentage
  - [ ] Generate missing value heatmap data
  - [ ] Save to Supabase with result_type: "quality"

- [ ] **3.3.2** Duplicate detection
  - [ ] Implement `detect_duplicates(df: pd.DataFrame)` function
  - [ ] Count exact duplicate rows
  - [ ] Return indices of duplicate rows
  - [ ] Calculate duplicate percentage
  - [ ] Save to quality results

- [ ] **3.3.3** Outlier detection
  - [ ] Implement `detect_outliers(df: pd.DataFrame)` function
  - [ ] IQR method for outlier detection
  - [ ] Z-score method for outlier detection
  - [ ] Return outlier count and values per numeric column
  - [ ] Save to quality results

- [ ] **3.3.4** Constant & unique column detection
  - [ ] Implement `find_constant_columns(df: pd.DataFrame)` function
  - [ ] Detect columns with zero variance
  - [ ] Detect unique identifiers (near-unique values)
  - [ ] Flag columns with suspicious cardinality
  - [ ] Generate data quality score (0-100)
  - [ ] Save to quality results

### 3.4 Univariate Analysis 📊
- [ ] **3.4.1** Numeric column analysis
  - [ ] Implement `analyze_numeric(series: pd.Series)` function
  - [ ] Calculate: mean, median, std, min, max, quartiles
  - [ ] Calculate skewness and kurtosis
  - [ ] Perform normality test (Shapiro-Wilk/D'Agostino)
  - [ ] Generate histogram with KDE (Plotly JSON)
  - [ ] Generate box plot (Plotly JSON)
  - [ ] Save per-column results

- [ ] **3.4.2** Categorical column analysis
  - [ ] Implement `analyze_categorical(series: pd.Series)` function
  - [ ] Count unique values
  - [ ] Calculate mode
  - [ ] Generate frequency table (top N values)
  - [ ] Generate bar chart (Plotly JSON)
  - [ ] Generate pie chart if cardinality ≤ 6
  - [ ] Flag high cardinality columns
  - [ ] Save per-column results

- [ ] **3.4.3** Datetime column analysis
  - [ ] Implement `analyze_datetime(series: pd.Series)` function
  - [ ] Detect time series frequency
  - [ ] Generate time series line chart (Plotly JSON)
  - [ ] Detect gaps in time series
  - [ ] Calculate time range and duration
  - [ ] Extract temporal features
  - [ ] Save per-column results

### 3.5 Correlation Analysis 🔗
- [ ] **3.5.1** Correlation matrix computation
  - [ ] Implement `compute_correlation_matrix(df: pd.DataFrame, method: str)` function
  - [ ] Support Pearson, Spearman, Kendall methods
  - [ ] Handle missing values
  - [ ] Generate correlation heatmap (Plotly JSON)
  - [ ] Save to Supabase with result_type: "correlation"

- [ ] **3.5.2** Multicollinearity detection
  - [ ] Implement `calculate_vif(df: pd.DataFrame)` function
  - [ ] Calculate VIF for each numeric column
  - [ ] Flag high VIF columns (> 5.0)
  - [ ] Generate multicollinearity warnings
  - [ ] Save to correlation results

- [ ] **3.5.3** High correlation detection
  - [ ] Implement `detect_high_correlations(correlation_matrix)` function
  - [ ] Identify correlation pairs with |r| > 0.8
  - [ ] Generate list of high-correlation pairs
  - [ ] Provide interpretation and recommendations
  - [ ] Save to correlation results

### 3.6 Target Variable Analysis 🎯
- [ ] **3.6.1** Target variable identification
  - [ ] Implement `analyze_target_variable(df: pd.DataFrame, target_column: str)` function
  - [ ] Detect problem type (classification/regression)
  - [ ] Calculate class/target distribution
  - [ ] Save to Supabase with result_type: "target"

- [ ] **3.6.2** Class imbalance detection
  - [ ] Implement `detect_imbalance(series: pd.Series)` function
  - [ ] Calculate class ratios
  - [ ] Flag imbalanced datasets (ratio > 2:1)
  - [ ] Determine severity (mild/moderate/severe)
  - [ ] Suggest handling strategies
  - [ ] Save to target results

- [ ] **3.6.3** Feature-target correlation
  - [ ] Implement `rank_features_by_correlation(df, target_column)` function
  - [ ] Calculate feature-target correlations
  - [ ] Rank features by correlation strength
  - [ ] Return top N features
  - [ ] Save to target results

- [ ] **3.6.4** Data leakage detection
  - [ ] Implement `detect_data_leakage(df, target_column)` function
  - [ ] Identify features with r > 0.95 to target
  - [ ] Flag potential ID columns or derivatives
  - [ ] Generate leakage warnings
  - [ ] Save to target results

### 3.7 ML Readiness Assessment 🤖
- [ ] **3.7.1** ML readiness summary
  - [ ] Implement `generate_ml_readiness_report(analysis_results)` function
  - [ ] Synthesize all analysis results
  - [ ] Identify columns to drop
  - [ ] Suggest imputation strategies
  - [ ] Suggest encoding methods
  - [ ] Suggest scaling/normalization
  - [ ] Save to Supabase with result_type: "ml_readiness"

- [ ] **3.7.2** Model recommendations
  - [ ] Implement `recommend_models(problem_type, data_characteristics)` function
  - [ ] Suggest 3 baseline models
  - [ ] Include justification
  - [ ] Suggest evaluation metrics
  - [ ] Save to ML readiness results

- [ ] **3.7.3** Validation strategy
  - [ ] Implement `recommend_validation_strategy(data_characteristics)` function
  - [ ] Suggest cross-validation method
  - [ ] Justify recommendation
  - [ ] Suggest train/test split ratio
  - [ ] Save to ML readiness results

- [ ] **3.7.4** Final job status update
  - [ ] Update job status to "completed"
  - [ ] Set processing_completed_at timestamp
  - [ ] Trigger AI insights worker (via webhook or direct call)
  - [ ] Handle any errors and set status to "failed"

---

## Phase 4: AI Insights Worker (Worker 2) (Week 4)

### 4.1 Worker 2 Setup & Deployment 🚀
- [ ] **4.1.1** Create AI insights worker structure
  - [ ] Directory: `workers/ai_insights/`
  - [ ] Create `main.py` with FastAPI app
  - [ ] Create `gemini_client.py` for Gemini API integration
  - [ ] Create `prompts.py` for prompt templates
  - [ ] Create `insight_generator.py` for insight generation
  - [ ] Create `Dockerfile`

- [ ] **4.1.2** Implement HTTP endpoint
  - [ ] POST `/generate-insights` endpoint
  - [ ] Accept job_id as parameter
  - [ ] Fetch analysis results from Supabase
  - [ ] Generate insights for each result type
  - [ ] Update results with AI insights
  - [ ] Save back to Supabase

- [ ] **4.1.3** Deploy to Railway
  - [ ] Create new service on Railway dashboard
  - [ ] Click "New Service" → "Deploy from GitHub repo"
  - [ ] Select repository and set root directory to `workers/ai_insights/`
  - [ ] **SECURITY: Set environment variables in Railway dashboard**:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `GEMINI_API_KEY` (treat as secret!)
    - `PORT=8001`
    - `RAILWAY_ENVIRONMENT=production`
  - [ ] **SECURITY: Implement API usage monitoring** (detect anomalies)
  - [ ] **SECURITY: Implement rate limiting for Gemini API** (avoid abuse)
  - [ ] Deploy and test
  - [ ] **SECURITY: Verify API key not exposed in any responses**
  - [ ] Note the service URL

### 4.2 Gemini API Integration 🔮
- [ ] **4.2.1** Create Gemini client
  - [ ] Implement `GeminiClient` class in `gemini_client.py`
  - [ ] Configure API authentication
  - [ ] Implement exponential backoff retry logic
  - [ ] Implement rate limiting (60 calls/minute)
  - [ ] Implement timeout handling
  - [ ] Add comprehensive error handling

- [ ] **4.2.2** Create prompt templates
  - [ ] DATASET_SUMMARY_PROMPT template
  - [ ] COLUMN_INSIGHT_PROMPT template
  - [ ] CORRELATION_INSIGHT_PROMPT template
  - [ ] TARGET_ANALYSIS_PROMPT template
  - [ ] ML_READINESS_PROMPT template
  - [ ] Implement template variable substitution

- [ ] **4.2.3** Context building utilities
  - [ ] Implement `build_context(analysis_results)` function
  - [ ] Format statistics for prompts
  - [ ] Create data summaries for large datasets
  - [ ] Implement safe data serialization
  - [ ] Add character limits

### 4.3 Insight Generation Engine 💡
- [ ] **4.3.1** Dataset summary insights
  - [ ] Implement `generate_dataset_summary(job_data)` function
  - [ ] Call Gemini API with dataset profile
  - [ ] Parse and validate response
  - [ ] Cache results
  - [ ] Add fallback to generic insights

- [ ] **4.3.2** Column-specific insights
  - [ ] Implement `generate_column_insights(column_data)` function
  - [ ] Generate insights for each column type
  - [ ] Batch API calls for efficiency
  - [ ] Handle rate limiting
  - [ ] Update column results with insights

- [ ] **4.3.3** Correlation insights
  - [ ] Implement `generate_correlation_insights(correlation_data)` function
  - [ ] Focus on high-correlation pairs
  - [ ] Provide domain-agnostic interpretations
  - [ ] Update correlation results with insights

- [ ] **4.3.4** Target analysis insights
  - [ ] Implement `generate_target_insights(target_data)` function
  - [ ] Interpret class imbalance
  - [ ] Suggest modeling approaches
  - [ ] Update target results with insights

- [ ] **4.3.5** ML readiness insights
  - [ ] Implement `generate_ml_readiness_insights(ml_readiness_data)` function
  - [ ] Synthesize all findings into narrative
  - [ ] Provide actionable next steps
  - [ ] Update ML readiness results with insights

- [ ] **4.3.6** Insight validation
  - [ ] Implement `validate_insight(insight_text)` function
  - [ ] Check for hallucinations
  - [ ] Ensure data-specific insights
  - [ ] Filter out unhelpful insights
  - [ ] Implement quality scoring

### 4.4 Fallback Mechanisms 🛡️
- [ ] **4.4.1** Generic insights
  - [ ] Implement generic insight templates for each analysis type
  - [ ] Use when Gemini API is unavailable
  - [ ] Provide still-useful, data-agnostic guidance
  - [ ] Log API failures for monitoring

- [ ] **4.4.2** Cost management
  - [ ] Implement API call tracking
  - [ ] Add usage statistics
  - [ ] Implement budget limits
  - [ ] Add warnings for approaching limits
  - [ ] Create usage dashboard (optional)

---

## Phase 5: Report Generation Worker (Worker 3) (Week 5)

### 5.1 Worker 3 Setup & Deployment 🚀
- [ ] **5.1.1** Create report generator worker structure
  - [ ] Directory: `workers/report_generator/`
  - [ ] Create `main.py` with FastAPI app
  - [ ] Create `report_generator.py` for report generation
  - [ ] Create templates directory for Jinja2 templates
  - [ ] Create `Dockerfile`

- [ ] **5.1.2** Implement HTTP endpoint
  - [ ] POST `/generate-report` endpoint
  - [ ] Accept job_id and format (pdf/html/json)
  - [ ] Fetch all analysis results from Supabase
  - [ ] Generate report
  - [ ] Upload to Supabase Storage
  - [ ] Update reports table

- [ ] **5.1.3** Deploy to Railway
  - [ ] Create new service on Railway dashboard
  - [ ] Click "New Service" → "Deploy from GitHub repo"
  - [ ] Select repository and set root directory to `workers/report_generator/`
  - [ ] **SECURITY: Set environment variables in Railway dashboard**:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `PORT=8002`
    - `RAILWAY_ENVIRONMENT=production`
  - [ ] **SECURITY: Sanitize user input in reports** (prevent XSS in generated HTML)
  - [ ] **SECURITY: Validate report download permissions** (user can only download their own reports)
  - [ ] Deploy and test
  - [ ] **SECURITY: Test report XSS prevention** (try injecting scripts in data)
  - [ ] Note the service URL

### 5.2 Report Generation Engine 📄
- [ ] **5.2.1** HTML report generation
  - [ ] Implement `generate_html_report(job_data, results)` function
  - [ ] Create Jinja2 template structure
  - [ ] Render all analysis sections
  - [ ] Include Plotly charts as HTML
  - [ ] Include AI insights
  - [ ] Generate responsive HTML

- [ ] **5.2.2** PDF report generation
  - [ ] Implement `generate_pdf_report(html_content)` function
  - [ ] Use weasyprint for HTML→PDF conversion
  - [ ] Implement page break logic
  - [ ] Add table of contents
  - [ ] Add page numbers
  - [ ] Embed charts as static images

- [ ] **5.2.3** JSON report generation
  - [ ] Implement `generate_json_report(job_data, results)` function
  - [ ] Export all analysis data as JSON
  - [ ] Include chart data as Plotly JSON
  - [ ] Include AI insights
  - [ ] Useful for API consumers

### 5.3 Jinja2 Templates 🎨
- [ ] **5.3.1** Create master template
  - [ ] `templates/base.html` - Master template with layout
  - [ ] Include CSS styling
  - [ ] Include JavaScript for interactivity
  - [ ] Define blocks for sections

- [ ] **5.3.2** Create section templates
  - [ ] `templates/sections/executive_summary.html` - AI-generated summary
  - [ ] `templates/sections/dataset_overview.html` - Basic stats
  - [ ] `templates/sections/data_quality.html` - Quality analysis
  - [ ] `templates/sections/univariate_analysis.html` - Column analysis
  - [ ] `templates/sections/correlation_analysis.html` - Correlation analysis
  - [ ] `templates/sections/target_analysis.html` - Target analysis
  - [ ] `templates/sections/ml_readiness.html` - ML recommendations

- [ ] **5.3.3** Create component templates
  - [ ] `templates/components/stat_card.html` - Statistic display card
  - [ ] `templates/components/plot_container.html` - Chart container
  - [ ] `templates/components/insight_box.html` - AI insight display
  - [ ] `templates/components/table.html` - Data table

- [ ] **5.3.4** Create CSS styling
  - [ ] `templates/static/css/report.css`
  - [ ] Professional, clean layout
  - [ ] Responsive design
  - [ ] Print-friendly styles
  - [ ] Color scheme and typography

### 5.4 Report Customization 🎛️
- [ ] **5.4.1** Section selection
  - [ ] Allow user to select which sections to include
  - [ ] Implement section filtering
  - [ ] Update table of contents dynamically

- [ ] **5.4.2** Format options
  - [ ] Option to include/exclude plots
  - [ ] Option to include/exclude AI insights
  - [ ] Option to include detailed statistics
  - [ ] Option to include appendix

- [ ] **5.4.3** Branding options (optional)
  - [ ] Add cover page with dataset metadata
  - [ ] Add custom logo
  - [ ] Add custom color scheme
  - [ ] Add footer with branding

### 5.5 Report Quality Assurance ✅
- [ ] **5.5.1** Report testing
  - [ ] Test with sample datasets
  - [ ] Verify all sections render correctly
  - [ ] Check PDF rendering quality
  - [ ] Verify all charts are included
  - [ ] Test with large datasets

- [ ] **5.5.2** Performance optimization
  - [ ] Implement report generation caching
  - [ ] Optimize PDF generation time
  - [ ] Add compression for storage
  - [ ] Implement incremental generation

---

## Phase 6: Frontend Development (Weeks 5-7)

### 6.1 Core Frontend Structure ⚛️
- [ ] **6.1.1** Set up routing
  - [ ] Configure react-router-dom
  - [ ] Create routes:
    - `/` - Home/Landing page
    - `/upload` - File upload page
    - `/analysis/:jobId` - Analysis dashboard
    - `/report/:jobId` - Report generation/viewing
    - `/history` - User's analysis history
    - `/profile` - User profile (optional)

- [ ] **6.1.2** Create layout components
  - [ ] `components/layout/Header.tsx` - Navigation header
  - [ ] `components/layout/Sidebar.tsx` - Navigation sidebar
  - [ ] `components/layout/Footer.tsx` - Footer
  - [ ] `components/layout/MainLayout.tsx` - Layout wrapper
  - [ ] Implement responsive design

- [ ] **6.1.3** Set up state management
  - [ ] Create `contexts/AuthContext.tsx` for authentication
  - [ ] Create `contexts/AnalysisContext.tsx` for analysis state
  - [ ] Create custom hooks:
    - `hooks/useAuth.ts` - Auth state and methods
    - `hooks/useAnalysis.ts` - Analysis data and operations
    - `hooks/useRealtime.ts` - Real-time subscriptions
    - `hooks/useLocalStorage.ts` - Local persistence

- [ ] **6.1.4] Set up React Query
  - [ ] Configure QueryClient in `App.tsx`
  - [ ] Set up query cache and mutation cache
  - [ ] Configure stale time and cache time
  - [ ] Set up error boundaries

### 6.2 Authentication Flow 🔐
- [ ] **6.2.1** Create auth components
  - [ ] `pages/LoginPage.tsx` - Login form
  - [ ] `pages/SignupPage.tsx` - Signup form
  - [ ] `pages/ForgotPasswordPage.tsx` - Password reset
  - [ ] `components/auth/AuthForm.tsx` - Reusable auth form

- [ ] **6.2.2** Implement auth logic
  - [ ] Email/password authentication
  - [ ] Magic link authentication (optional)
  - [ ] OAuth providers (Google, GitHub) - optional
  - [ ] Session management
  - [ ] Protected routes (require auth)
  - [ ] Auto-login on page load

### 6.3 File Upload Flow 📁
- [ ] **6.3.1** Create upload components
  - [ ] `components/upload/UploadZone.tsx` - Drag-and-drop zone
  - [ ] `components/upload/UploadProgress.tsx` - Upload progress bar
  - [ ] `components/upload/FileMetadata.tsx` - File info display
  - [ ] `components/upload/UploadSuccess.tsx` - Success message

- [ ] **6.3.2** Implement upload logic
  - [ ] Handle file selection and drag-drop
  - [ ] Validate file size and type
  - [ ] Create job in Supabase
  - [ ] Upload file to Supabase Storage
  - [ ] Trigger data processing worker
  - [ ] Track upload progress
  - [ ] Handle upload errors

- [ ] **6.3.3** Upload page
  - [ ] `pages/UploadPage.tsx` - Main upload page
  - [ ] Combine upload components
  - [ ] Show upload history
  - [ ] Implement file cancellation
  - [ ] Redirect to analysis page on success

### 6.4 Analysis Dashboard 📊
- [ ] **6.4.1** Dashboard layout
  - [ ] `pages/AnalysisPage.tsx` - Main dashboard
  - [ ] Sidebar with analysis sections
  - [ ] Main content area with tabs
  - [ ] Real-time status updates
  - [ ] Loading states

- [ ] **6.4.2** Data quality section
  - [ ] `components/analysis/DataQualityDashboard.tsx`
  - [ ] `components/analysis/QualityScoreCard.tsx` - Overall quality score
  - [ ] `components/analysis/MissingValuesChart.tsx` - Missing values visualization
  - [ ] `components/analysis/DuplicatesTable.tsx` - Duplicate rows table
  - [ ] `components/analysis/OutliersPanel.tsx` - Outlier summary

- [ ] **6.4.3** Univariate analysis section
  - [ ] `components/analysis/UnivariateAnalysis.tsx` - Section container
  - [ ] `components/analysis/ColumnSelector.tsx` - Column selection sidebar
  - [ ] `components/analysis/DistributionChart.tsx` - Distribution plot
  - [ ] `components/analysis/StatisticsCard.tsx` - Stats display
  - [ ] Tabbed interface for column types

- [ ] **6.4.4** Correlation analysis section
  - [ ] `components/analysis/CorrelationAnalysis.tsx` - Section container
  - [ ] `components/analysis/CorrelationHeatmap.tsx` - Heatmap display
  - [ ] `components/analysis/CorrelationMethodSelector.tsx` - Method selection
  - [ ] `components/analysis/HighCorrelationsTable.tsx` - High corr pairs
  - [ ] `components/analysis/MulticollinearityWarnings.tsx` - VIF warnings

- [ ] **6.4.5** Target analysis section
  - [ ] `components/analysis/TargetAnalysis.tsx` - Section container
  - [ ] `components/analysis/TargetVariableSelector.tsx` - Target selection
  - [ ] `components/analysis/ClassDistributionChart.tsx` - Class distribution
  - [ ] `components/analysis/FeatureImportanceChart.tsx` - Feature ranking
  - [ ] `components/analysis/LeakageWarnings.tsx` - Leakage warnings
  - [ ] `components/analysis/ImbalanceAlerts.tsx` - Imbalance warnings

- [ ] **6.4.6** ML readiness section
  - [ ] `components/analysis/MLReadinessSummary.tsx` - Section container
  - [ ] `components/analysis/PreprocessingChecklist.tsx` - Preprocessing steps
  - [ ] `components/analysis/ModelRecommendations.tsx` - Model suggestions
  - [ ] `components/analysis/ValidationStrategy.tsx` - Validation approach
  - [ ] `components/analysis/RisksAndConsiderations.tsx` - Risks summary

### 6.5 AI Insights Components 🤖
- [ ] **6.5.1** Insight display components
  - [ ] `components/ai/InsightCard.tsx` - Insight display card
  - [ ] `components/ai/AIRecommendation.tsx` - AI recommendation display
  - [ ] `components/ai/NarrativeSection.tsx` - Narrative text section
  - [ ] Loading states for AI generation
  - [ ] Error/fallback states

- [ ] **6.5.2** Insight integration
  - [ ] Embed AI insights in all analysis sections
  - [ ] Add toggle to show/hide AI insights
  - [ ] Implement insight regeneration (re-run AI)
  - [ ] Add insight rating/feedback (optional)

### 6.6 Visualization Components 📈
- [ ] **6.6.1** Plotly integration
  - [ ] `components/charts/PlotlyChart.tsx` - Plotly wrapper component
  - [ ] Configure responsive charts
  - [ ] Implement chart export (PNG, SVG)
  - [ ] Add chart theme consistency
  - [ ] Optimize chart performance

- [ ] **6.6.2** Custom visualizations
  - [ ] `components/charts/CorrelationMatrix.tsx` - Specialized heatmap
  - [ ] `components/charts/DistributionChart.tsx` - Distribution plot
  - [ ] `components/charts/TimeSeriesChart.tsx` - Time series plot
  - [ ] `components/charts/ScatterPlot.tsx` - Scatter plot with trend line
  - [ ] Chart animations and transitions

### 6.7 Report Components 📄
- [ ] **6.7.1** Report generation
  - [ ] `pages/ReportPage.tsx` - Report page
  - [ ] `components/report/ReportGenerator.tsx` - Report generation form
  - [ ] `components/report/ReportCustomizer.tsx` - Report options
  - [ ] `components/report/ReportPreview.tsx` - HTML preview
  - [ ] `components/report/ReportDownload.tsx` - Download buttons

- [ ] **6.7.2** Report viewing
  - [ ] Embed PDF viewer
  - [ ] Embed HTML viewer (iframe)
  - [ ] Navigation between sections
  - [ ] Full-screen mode
  - [ ] Print functionality

### 6.8 Real-time Updates ⚡
- [ ] **6.8.1** Real-time subscriptions
  - [ ] Subscribe to job status changes
  - [ ] Update UI when job completes
  - [ ] Show progress indicators
  - [ ] Handle connection errors
  - [ ] Implement reconnection logic

- [ ] **6.8.2] Real-time notifications
  - [ ] Toast notifications for job status changes
  - [ ] Progress bar for long-running jobs
  - [ ] Success/error notifications
  - [ ] Sound notifications (optional)

### 6.9 Polish & UX ✨
- [ ] **6.9.1** Loading states
  - [ ] Skeleton screens for all major sections
  - [ ] Spinner components
  - [ ] Progress bars
  - [ ] Optimistic UI updates

- [ ] **6.9.2** Error handling
  - [ ] Error boundary components
  - [ ] Error message components
  - [ ] Retry logic for failed requests
  - [ ] User-friendly error messages

- [ ] **6.9.3] Responsive design
  - [ ] Mobile-friendly layouts
  - [ ] Tablet-optimized views
  - [ ] Touch-friendly interactions
  - [ ] Adaptive navigation

---

## Phase 7: Testing & Quality Assurance (Week 8)

### 7.1 Worker Testing 🧪
- [ ] **7.1.1** Unit tests for workers
  - [ ] `workers/data_processor/tests/test_profiler.py`
  - [ ] `workers/data_processor/tests/test_quality_analyzer.py`
  - [ ] `workers/data_processor/tests/test_univariate_analyzer.py`
  - [ ] `workers/data_processor/tests/test_correlation_analyzer.py`
  - [ ] `workers/ai_insights/tests/test_gemini_client.py` (mocked)
  - [ ] `workers/report_generator/tests/test_report_generator.py`
  - [ ] Achieve > 80% coverage

- [ ] **7.1.2** Integration tests
  - [ ] Test worker → Supabase integration
  - [ ] Test complete analysis pipeline
  - [ ] Test error handling and edge cases
  - [ ] Test file upload and processing

- [ ] **7.1.3** Test fixtures
  - [ ] Create sample datasets
  - [ ] Titanic dataset
  - [ ] Housing prices dataset
  - [ ] Adult Income dataset
  - [ ] Messy dataset for error testing

### 7.2 Frontend Testing ⚛️
- [ ] **7.2.1** Component tests
  - [ ] `components/upload/UploadZone.test.tsx`
  - [ ] `components/analysis/DataQualityDashboard.test.tsx`
  - [ ] `components/analysis/CorrelationHeatmap.test.tsx`
  - [ ] Test user interactions and state changes

- [ ] **7.2.2** Integration tests
  - [ ] Test complete upload → analysis → report flow
  - [ ] Test error states and recovery
  - [ ] Test navigation between pages

- [ ] **7.2.3** E2E tests
  - [ ] Set up Playwright or Cypress
  - [ ] Test complete workflows
  - [ ] Test file upload validation
  - [ ] Cross-browser testing

### 7.3 Performance Testing ⚡
- [ ] **7.3.1** Worker performance
  - [ ] Test with large datasets (100k+ rows)
  - [ ] Measure processing time
  - [ ] Profile memory usage
  - [ ] Optimize slow operations

- [ ] **7.3.2** Frontend performance
  - [ ] Measure page load times
  - [ ] Test rendering with large datasets
  - [ ] Optimize bundle size
  - [ ] Implement lazy loading

### 7.4 Security Testing 🔒
- [ ] **7.4.1** Input validation testing
  - [ ] **Test SQL injection prevention**:
    - [ ] Try SQL injection in file names: `'; DROP TABLE--`
    - [ ] Try SQL injection in job IDs: `test' OR '1'='1`
    - [ ] Try SQL injection in all text input fields
    - [ ] Verify all attempts are blocked/sanitized
  - [ ] **Test XSS prevention**:
    - [ ] Inject `<script>alert('XSS')</script>` in file names
    - [ ] Inject HTML tags in data fields
    - [ ] Test report HTML for XSS vulnerabilities
    - [ ] Verify no scripts execute in browser
  - [ ] **Test file upload security**:
    - [ ] Upload malicious file types: `.exe`, `.sh`, `.php`, `.bat`
    - [ ] Upload files exceeding 50MB limit
    - [ ] Upload files with fake extensions: rename `.exe` to `.csv`
    - [ ] Try path traversal attacks: `../../etc/passwd`
    - [ ] Try uploading 0-byte files
    - [ ] Try uploading corrupted files
    - [ ] Verify all malicious uploads are rejected
  - [ ] **Test path traversal prevention**:
    - [ ] Try `../` sequences in filenames
    - [ ] Try absolute paths: `/etc/passwd`
    - [ ] Try encoded path separators: `%2e%2e%2f`
    - [ ] Verify path traversal attempts are blocked

- [ ] **7.4.2** API security testing**
  - [ ] **Test rate limiting**:
    - [ ] Send 100 requests in 1 minute from same IP
    - [ ] Verify rate limit kicks in (HTTP 429)
    - [ ] Try bypassing rate limit with different user agents
    - [ ] Try distributed rate limit bypass
    - [ ] Verify rate limit resets correctly
  - [ ] **Test CORS configuration**:
    - [ ] Try accessing API from unauthorized domain
    - [ ] Verify CORS headers block unauthorized domains
    - [ ] Test CORS preflight (OPTIONS) requests
    - [ ] Verify only whitelisted domains allowed
  - [ ] **Test authentication/authorization**:
    - [ ] Try accessing another user's jobs (without auth)
    - [ ] Try accessing another user's reports
    - [ ] Try creating jobs without authentication
    - [ ] Try modifying other users' data
    - [ ] Try deleting other users' data
    - [ ] Verify RLS policies block all unauthorized access
  - [ ] **Test sensitive data handling**:
    - [ ] Check if API keys appear in API responses
    - [ ] Check if passwords appear in any logs
    - [ ] Check if error messages leak internal info
    - [ ] Check if session tokens exposed in URLs
    - [ ] Verify no sensitive data in client-side code

- [ ] **7.4.3** Automated security scanning**
  - [ ] **Python security scanning**:
    - [ ] Install and run `bandit`:
      ```bash
      pip install bandit
      bandit -r workers/
      ```
    - [ ] Review and fix all security issues found
    - [ ] Run `safety` check:
      ```bash
      pip install safety
      safety check --file workers/shared/requirements.txt
      ```
  - [ ] **Frontend security scanning**:
    - [ ] Run `npm audit`:
      ```bash
      cd frontend
      npm audit --audit-level=moderate
      ```
    - [ ] Fix all moderate and high vulnerabilities
    - [ ] Run `npm audit fix` for automatic fixes
  - [ ] **Dependency vulnerability scanning**:
    - [ ] Use `pip-audit`:
      ```bash
      pip-audit --desc
      ```
    - [ ] Update vulnerable dependencies
    - [ ] Document any security advisories

- [ ] **7.4.4** Penetration testing**
  - [ ] **Webhook security testing**:
    - [ ] Send webhooks without signatures
    - [ ] Send webhooks with invalid signatures
    - [ ] Replay old webhook requests
    - [ ] Try timing attacks on webhook verification
    - [ ] Verify all invalid webhooks are rejected
  - [ ] **Manual security testing**:
    - [ ] Try to bypass RLS policies directly
    - [ ] Try to access Railway services directly
    - [ ] Try to inject malicious data in CSV files
    - [ ] Try to abuse API endpoints with crafted requests
    - [ ] Test for race conditions in file uploads
  - [ ] **Document security test results**:
    - [ ] Create security test report
    - [ ] Document all vulnerabilities found
    - [ ] Document all fixes applied
    - [ ] Create remediation plan for any remaining issues

- [ ] **7.4.5** Security audit checklist**
  - [ ] **Code review**:
    - [ ] Review all code for security issues
    - [ ] Check for hardcoded secrets:
      ```bash
      # Search for potential secrets
      git grep -i "api_key\|secret\|password\|token"
      ```
    - [ ] Check for insecure code patterns
    - [ ] Verify all inputs are validated
    - [ ] Verify all outputs are sanitized
  - [ ] **Configuration review**:
    - [ ] Verify no secrets in repository
    - [ ] Check environment variable exposure
    - [ ] Verify RLS policies are enabled and working
    - [ ] Check CORS configuration
    - [ ] Verify rate limiting is configured
  - [ ] **Security controls verification**:
    - [ ] Test all security controls are functioning
    - [ ] Verify file upload validation works
    - [ ] Verify authentication works correctly
    - [ ] Verify authorization works correctly
    - [ ] Verify rate limiting works
  - [ ] **Documentation**:
    - [ ] Document security architecture
    - [ ] Create incident response plan
    - [ ] Document security monitoring setup
    - [ ] Create security runbook

- [ ] **7.4.6** Security monitoring setup**
  - [ ] **Set up security alerts**:
    - [ ] Alert on multiple failed authentications
    - [ ] Alert on suspicious file upload patterns
    - [ ] Alert on unusual API usage
    - [ ] Alert on webhook verification failures
    - [ ] Alert on rate limit violations
  - [ ] **Configure log monitoring**:
    - [ ] Set up dashboards for security logs
    - [ ] Create alerts for security events
    - [ ] Review logs weekly
    - [ ] Set up automated log analysis
  - [ ] **Incident response**:
    - [ ] Create incident response playbook
    - [ ] Document escalation procedures
    - [ ] Set up emergency contacts
    - [ ] Test incident response procedures

---

## Phase 8: Deployment & Production (Week 9)

### 8.1 Production Deployment 🚀
- [ ] **8.1.1** Deploy workers to Railway
  - [ ] Deploy data_processor service
  - [ ] Deploy ai_insights service
  - [ ] Deploy report_generator service
  - [ ] Configure environment variables
  - [ ] Test all endpoints
  - [ ] Set up monitoring on Railway dashboard

- [ ] **8.1.2** Deploy frontend to Vercel
  - [ ] Connect GitHub repository
  - [ ] Configure environment variables
  - [ ] Deploy to production
  - [ ] Test live application
  - [ ] Set up custom domain (optional)

- [ ] **8.1.3** Configure Supabase for production
  - [ ] Set up production database
  - [ ] Configure backup strategy
  - [ ] Set up monitoring
  - [ ] Configure rate limiting
  - [ ] Enable production-ready features

### 8.2 Monitoring & Logging 📊
- [ ] **8.2.1** Set up monitoring
  - [ ] Railway dashboard monitoring (built-in metrics, logs, traces)
  - [ ] Vercel analytics for frontend
  - [ ] Supabase dashboard for database/storage
  - [ ] Custom logging for services (use Python logging module)
  - [ ] Error tracking (Sentry - optional)

- [ ] **8.2.2] Set up alerts
  - [ ] Worker failure alerts
  - [ ] High error rate alerts
  - [ ] Cost alerts
  - [ ] Performance degradation alerts

### 8.3 Documentation & Maintenance 📚
- [ ] **8.3.1** User documentation
  - [ ] Update README with deployment URLs
  - [ ] Create user guide
  - [ ] Create FAQ
  - [ ] Record demo video

- [ ] **8.3.2** Developer documentation
  - [ ] Document worker APIs
  - [ ] Create architecture diagram
  - [ ] Document deployment process
  - [ ] Create troubleshooting guide

---

## Phase 9: Polish & Portfolio Preparation (Week 10)

### 9.1 UI/UX Polish ✨
- [ ] **9.1.1** Visual design
  - [ ] Refine color scheme
  - [ ] Improve typography
  - [ ] Add loading animations
  - [ ] Improve error displays
  - [ ] Add success notifications

- [ ] **9.1.2** User experience
  - [ ] Add keyboard shortcuts
  - [ ] Improve navigation
  - [ ] Add help tooltips
  - [ ] Add onboarding tour
  - [ ] Implement undo/redo where applicable

### 9.2 Portfolio Preparation 🎨
- [ ] **9.2.1** Demo preparation
  - [ ] Create demo datasets
  - [ ] Generate sample reports
  - [ ] Record demo video
  - [ ] Write case studies

- [ ] **9.2.2** GitHub polish
  - [ ] Update README with badges
  - [ ] Add screenshots/GIFs
  - [ ] Create features section
  - [ ] Add getting started guide
  - [ ] Include live demo link

- [ ] **9.2.3** Presentation preparation
  - [ ] Create slides about project
  - [ ] Prepare technical talking points
  - [ ] Document architectural decisions
  - [ ] Prepare demo for interviews
  - [ ] Write blog post (optional)

### 9.3 Final Testing & Bug Fixes 🐛
- [ ] **9.3.1** Comprehensive testing
  - [ ] Run all test suites
  - [ ] Manual testing
  - [ ] Test with various datasets
  - [ ] Cross-browser testing
  - [ ] Cross-platform testing

- [ ] **9.3.2** Bug fixing
  - [ ] Fix identified bugs
  - [ ] Address performance issues
  - [ ] Fix accessibility issues
  - [ ] Handle edge cases
  - [ ] Improve error messages

---

## Success Criteria 🎯

The project will be considered complete when:

1. ✅ **Functional Requirements**
   - [ ] Users can upload CSV/Excel files
   - [ ] Complete EDA analysis is performed
   - [ ] AI-generated insights are included
   - [ ] Professional PDF reports can be downloaded
   - [ ] All visualizations render correctly

2. ✅ **Quality Requirements**
   - [ ] > 80% test coverage for workers
   - [ ] > 70% test coverage for frontend
   - [ ] All tests passing
   - [ ] No critical bugs
   - [ ] Production-ready code quality

3. ✅ **Performance Requirements**
   - [ ] Can handle files up to 50MB
   - [ ] Analysis completes in < 2 minutes
   - [ ] Report generation completes in < 1 minute
   - [ ] UI remains responsive during processing

4. ✅ **Portfolio Requirements**
   - [ ] Impressive visual design
   - [ ] Clear documentation
   - [ ] Demo video available
   - [ ] Deployed live version available
   - [ ] Code is clean and well-structured

---

## Cost Breakdown 💰

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| **Supabase** | Free | $0 |
| **Vercel** | Hobby (Free) | $0 |
| **Railway** | Free tier + credits | $5-20 |
| **Gemini API** | Free tier | $0 |
| **Total** | | **$5-20/month** |

**Railway Pricing Details:**
- **Free tier**: $5 one-time credit + $5/month credits
- **After free credits**: ~$5-20/month depending on usage
- **3 services**: Data processing, AI insights, report generation
- **Pay-per-use**: Only pay when services are running
- **Development**: Can pause services when not testing = $0-5/month
- **Portfolio/demo**: Keep all services running = $5-20/month

---

## Next Steps 🚀

1. **Start with Phase 1** - Set up accounts and create project structure
2. **Deploy in phases** - Don't wait until everything is done
3. **Test continuously** - Don't leave testing to the end
4. **Document as you go** - Update README and docs
5. **Get feedback** - Share with others and iterate

---

**Last Updated**: 2025-01-18
**Status**: Ready to begin implementation
**Architecture**: Serverless with Supabase + Render + Vercel
