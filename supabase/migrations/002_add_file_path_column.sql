-- Add file_path column to analysis_jobs table
-- This stores the Supabase Storage path for downloading files during processing

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN analysis_jobs.file_path IS 'Storage path in Supabase Storage for file download during processing';
