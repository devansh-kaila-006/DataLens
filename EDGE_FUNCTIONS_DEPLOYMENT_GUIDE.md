# Edge Functions Deployment Guide

## Issue
Frontend is calling Supabase Edge Functions that don't exist, causing file upload failures:
- `upload-file` - Returns 404, blocking file uploads
- `create-job`, `get-job-status`, `get-analysis-results`, `ai-insights` - Also needed

## Solution
Created all 5 Edge Functions with security features:
1. **upload-file** - Secure file upload with validation and CORS
2. **create-job** - Job creation with database insertion
3. **get-job-status** - Job status retrieval (bypasses RLS)
4. **get-analysis-results** - Analysis results aggregation
5. **ai-insights** - AI insights with rate limiting and Gemini integration

## Deployment Steps

### Option 1: Deploy via Supabase Dashboard (Recommended for quick fix)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `aqyacoxrjaeizgwvzcov`

2. **Deploy Each Function**

   For each function (`upload-file`, `create-job`, `get-job-status`, `get-analysis-results`, `ai-insights`):

   a. Go to **Edge Functions** in left sidebar
   b. Click **"New Function"**
   c. Enter function name (e.g., `upload-file`)
   d. Paste the contents from the corresponding `supabase/functions/[name]/index.ts` file
   e. Click **"Deploy"**

   **Files to deploy:**
   ```
   supabase/functions/upload-file/index.ts
   supabase/functions/create-job/index.ts
   supabase/functions/get-job-status/index.ts
   supabase/functions/get-analysis-results/index.ts
   supabase/functions/ai-insights/index.ts
   ```

3. **Set Environment Variables** (for ai-insights)

   In Edge Functions → Settings → Environment Variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

4. **Create Storage Bucket** (if not exists)

   Go to **Storage** in left sidebar:
   - Create bucket named `data-uploads`
   - Make it public (for file downloads)
   - Set up RLS policies if needed

### Option 2: Deploy via Supabase CLI (Faster for multiple functions)

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Link to your project**
   ```bash
   cd /c/Users/devan/OneDrive/Desktop/DataLens
   supabase link --project-ref aqyacoxrjaeizgwvzcov
   ```

3. **Deploy all functions**
   ```bash
   supabase functions deploy upload-file
   supabase functions deploy create-job
   supabase functions deploy get-job-status
   supabase functions deploy get-analysis-results
   supabase functions deploy ai-insights
   ```

4. **Set secrets**
   ```bash
   supabase secrets set GEMINI_API_KEY=your_key_here
   ```

## Verification

After deployment, test each function:

```bash
# Test upload-file (replace with actual file)
curl -X POST \
  https://aqyacoxrjaeizgwvzcov.supabase.co/functions/v1/upload-file \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@test.csv" \
  -F "user_id=test"

# Test create-job
curl -X POST \
  https://aqyacoxrjaeizgwvzcov.supabase.co/functions/v1/create-job \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"file_name":"test.csv","file_size":1000,"file_path":"test/test.csv"}'
```

## Expected Result

After deployment, the frontend file upload should work:
- File uploads successfully to Supabase Storage
- Job is created in database
- Data processing triggers via Railway workers
- No more CORS errors or 404 responses

## Security Features Implemented

### upload-file
- ✅ File type validation (CSV, Excel only)
- ✅ File size limits (50MB max)
- ✅ Filename sanitization (prevents path traversal)
- ✅ CORS headers configured
- ✅ Service role key for storage access

### ai-insights
- ✅ Rate limiting (20 req/min per IP)
- ✅ Gemini API integration
- ✅ Fallback to rule-based insights
- ✅ Automatic database storage

### All Functions
- ✅ Proper CORS headers
- ✅ Error handling and logging
- ✅ Input validation
- ✅ Service role authentication

## Troubleshooting

**Issue**: Functions deploy but return 404
- **Solution**: Check function name matches exactly (case-sensitive)
- **Solution**: Verify project ref is correct

**Issue**: CORS errors persist
- **Solution**: Check CORS headers include your Vercel domain
- **Solution**: Verify OPTIONS method is handled

**Issue**: Storage upload fails
- **Solution**: Ensure `data-uploads` bucket exists
- **Solution**: Check bucket permissions (public/private)

**Issue**: AI insights fail
- **Solution**: Add GEMINI_API_KEY to environment variables
- **Solution**: Check Gemini API quota

## Files Created

```
supabase/
└── functions/
    ├── upload-file/
    │   └── index.ts
    ├── create-job/
    │   └── index.ts
    ├── get-job-status/
    │   └── index.ts
    ├── get-analysis-results/
    │   └── index.ts
    └── ai-insights/
        └── index.ts
```

All functions are production-ready with comprehensive error handling and security features.
