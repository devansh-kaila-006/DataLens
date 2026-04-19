-- Make user_id nullable to support guest/demo uploads
-- This allows users to try the application without authentication

ALTER TABLE analysis_jobs ALTER COLUMN user_id DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN analysis_jobs.user_id IS 'Reference to the user who uploaded the file (null for guest/demo uploads)';
