-- =====================================================
-- DataLens Database Schema
-- =====================================================
-- Run this in Supabase SQL Editor
-- This creates all tables for the EDA analysis platform

-- =====================================================
-- 1. Create analysis_jobs table
-- =====================================================
-- Stores metadata about uploaded files and analysis jobs
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_id ON analysis_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_upload_timestamp ON analysis_jobs(upload_timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE analysis_jobs IS 'Stores metadata about uploaded files and their analysis status';
COMMENT ON COLUMN analysis_jobs.status IS 'Job status: pending, processing, completed, failed';
COMMENT ON COLUMN analysis_jobs.user_id IS 'Reference to the user who uploaded the file';

-- =====================================================
-- 2. Create analysis_results table
-- =====================================================
-- Stores analysis results for each job
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    result_type TEXT NOT NULL CHECK (result_type IN ('quality', 'univariate', 'correlation', 'target', 'ml_readiness')),
    result_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_results_job_id ON analysis_results(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_result_type ON analysis_results(result_type);

-- Add comments for documentation
COMMENT ON TABLE analysis_results IS 'Stores analysis results for each job type';
COMMENT ON COLUMN analysis_results.result_type IS 'Type of analysis: quality, univariate, correlation, target, ml_readiness';
COMMENT ON COLUMN analysis_results.result_data IS 'JSON data containing the analysis results';

-- =====================================================
-- 3. Create reports table
-- =====================================================
-- Stores generated reports for each job
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'html', 'json')),
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_format ON reports(format);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Add comments for documentation
COMMENT ON TABLE reports IS 'Stores generated reports for each job';
COMMENT ON COLUMN reports.format IS 'Report format: pdf, html, or json';
COMMENT ON COLUMN reports.file_path IS 'Path to the report file in Supabase Storage';

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Database tables created successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Enable Row Level Security (RLS)';
    RAISE NOTICE '2. Create RLS policies';
    RAISE NOTICE '3. Create storage buckets';
END $$;
