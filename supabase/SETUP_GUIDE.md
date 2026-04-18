# Supabase Setup Guide for DataLens

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: "DataLens EDA"
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run the Migration Scripts in Order

Run these SQL files in order (copy and paste the contents):

1. **Create Tables** (5 minutes)
   - Open: `supabase/migrations/001_create_tables.sql`
   - Copy all SQL code
   - Paste into Supabase SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - ✅ You should see: "Database tables created successfully!"

2. **Enable RLS** (2 minutes)
   - Open: `supabase/migrations/002_enable_rls.sql`
   - Copy all SQL code
   - Paste into Supabase SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - ✅ You should see: "Row Level Security enabled successfully!"

3. **Create Storage Buckets** (2 minutes)
   - Open: `supabase/migrations/003_create_storage_buckets.sql`
   - Copy all SQL code
   - Paste into Supabase SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - ✅ You should see: "Storage buckets created successfully!"

### Step 3: Verify Setup

1. **Check Tables**
   - Go to "Table Editor" in Supabase
   - You should see: `analysis_jobs`, `analysis_results`, `reports`

2. **Check Storage**
   - Go to "Storage" in Supabase
   - You should see: `uploads`, `reports` buckets

3. **Check RLS**
   - Go to "Authentication" → "Policies"
   - You should see policies for all tables

### Step 4: Test with Sample Data (Optional)

1. **Insert Test Job**
   ```sql
   INSERT INTO analysis_jobs (user_id, file_name, file_size, status)
   VALUES (auth.uid(), 'test.csv', 1024, 'completed');
   ```

2. **Verify You Can See Your Data**
   ```sql
   SELECT * FROM get_user_jobs();
   ```

## What We Just Created

### Database Tables
- **analysis_jobs**: Stores file upload metadata and job status
- **analysis_results**: Stores all analysis results (quality, correlation, etc.)
- **reports**: Stores generated report metadata

### Security Features
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only see their own data
- ✅ Service role (workers) can access all data
- ✅ Storage buckets protected by policies

### Storage Buckets
- **uploads**: Private bucket for user files (50MB limit, CSV/Excel only)
- **reports**: Public bucket for generated reports

### Helper Functions
- `get_user_jobs()`: Get all jobs for current user
- `get_job_with_results(job_id)`: Get job with all results
- `generate_upload_path(user_id, filename)`: Generate safe file path

## Next Steps

After Supabase setup is complete:

1. **Test from Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   - Visit http://localhost:5173
   - We'll create authentication next

2. **Deploy to Railway**
   - Connect your GitHub repo to Railway
   - Deploy the 3 workers
   - Add environment variables in Railway dashboard

3. **Set up Authentication**
   - We'll create login/signup pages
   - Configure email templates (optional)

## Troubleshooting

### Error: "relation does not exist"
- **Cause**: Tables not created yet
- **Fix**: Run the migration scripts in order

### Error: "permission denied"
- **Cause**: RLS policies not set up
- **Fix**: Run the RLS migration script

### Error: "bucket does not exist"
- **Cause**: Storage buckets not created
- **Fix**: Run the storage buckets migration script

### Storage files not accessible
- **Cause**: Storage policies not set up
- **Fix**: Check storage policies in Supabase dashboard

## Security Checklist

- [x] RLS enabled on all tables
- [x] Users can only access their own data
- [x] Service role has full access
- [x] Storage buckets protected
- [x] File size limits enforced (50MB)
- [x] File type validation (CSV/Excel only)
- [x] Users can only upload to their own folder

---

**Status**: Ready to run migration scripts!
**Time**: 10 minutes total
**Difficulty**: Beginner-friendly
