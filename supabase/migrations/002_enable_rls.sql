-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- CRITICAL: This ensures users can only access their own data
-- Run this AFTER creating tables

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for analysis_jobs table
-- =====================================================

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view own jobs"
ON analysis_jobs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own jobs
CREATE POLICY "Users can create own jobs"
ON analysis_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can do anything (for workers)
CREATE POLICY "Service role full access on analysis_jobs"
ON analysis_jobs FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- RLS Policies for analysis_results table
-- =====================================================

-- Policy: Users can view results for their own jobs
CREATE POLICY "Users can view own results"
ON analysis_results FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM analysis_jobs
        WHERE analysis_jobs.id = analysis_results.job_id
        AND analysis_jobs.user_id = auth.uid()
    )
);

-- Policy: Service role can do anything (for workers)
CREATE POLICY "Service role full access on analysis_results"
ON analysis_results FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- RLS Policies for reports table
-- =====================================================

-- Policy: Users can view reports for their own jobs
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM analysis_jobs
        WHERE analysis_jobs.id = reports.job_id
        AND analysis_jobs.user_id = auth.uid()
    )
);

-- Policy: Service role can do anything (for workers)
CREATE POLICY "Service role full access on reports"
ON reports FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- Create helpful database functions
-- =====================================================

-- Function: Get user's jobs with metadata
CREATE OR REPLACE FUNCTION get_user_jobs()
RETURNS SETOF analysis_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM analysis_jobs
    WHERE user_id = auth.uid()
    ORDER BY upload_timestamp DESC;
END;
$$;

-- Function: Get job with all results
CREATE OR REPLACE FUNCTION get_job_with_results(job_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_data JSON;
    results_data JSON;
    final_data JSON;
BEGIN
    -- Check if user owns this job
    SELECT *
    INTO job_data
    FROM analysis_jobs
    WHERE id = job_uuid AND user_id = auth.uid();

    IF job_data IS NULL THEN
        RAISE EXCEPTION 'Job not found or access denied';
    END IF;

    -- Get all results for this job
    SELECT coalesce(json_agg(row_to_json(results)), '[]'::json)
    INTO results_data
    FROM (
        SELECT result_type, result_data, created_at
        FROM analysis_results
        WHERE job_id = job_uuid
        ORDER BY created_at
    ) results;

    -- Combine job and results
    final_data = job_data || jsonb_build_object('results', results_data);

    RETURN final_data;
END;
$$;

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Row Level Security enabled successfully!';
    RAISE NOTICE 'Users can now only access their own data.';
    RAISE NOTICE 'Workers with service role key can access all data.';
END $$;
