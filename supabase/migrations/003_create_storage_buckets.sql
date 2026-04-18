-- =====================================================
-- Supabase Storage Setup
-- =====================================================
-- Creates storage buckets for file uploads and reports
-- Run this AFTER enabling RLS

-- =====================================================
-- Insert storage buckets
-- =====================================================

-- Create uploads bucket (for user uploaded files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'uploads',
    'uploads',
    false, -- Private bucket
    52428800, -- 50MB limit (50 * 1024 * 1024)
    ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create reports bucket (for generated reports)
INSERT INTO storage.buckets (id, name, public)
VALUES (
    'reports',
    'reports',
    true -- Public bucket (users can download their reports)
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies for uploads bucket
-- =====================================================

-- Policy: Users can upload files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text -- User can only upload to their folder
);

-- Policy: Users can view their own uploaded files
CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Service role can do anything (for workers)
CREATE POLICY "Service role full access on uploads"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- =====================================================
-- Storage Policies for reports bucket
-- =====================================================

-- Policy: Authenticated users can view reports (reports are public but we track access)
CREATE POLICY "Public can view reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- Policy: Service role can upload reports
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'reports');

-- Policy: Service role can delete reports
CREATE POLICY "Service role can delete reports"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'reports');

-- =====================================================
-- Create helpful storage functions
-- =====================================================

-- Function: Generate file path for upload
CREATE OR REPLACE FUNCTION generate_upload_path(user_uuid UUID, file_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN user_uuid::text || '/' || gen_random_uuid()::text || '_' || file_name;
END;
$$;

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Storage buckets created successfully!';
    RAISE NOTICE 'uploads: Private bucket for user files (50MB limit)';
    RAISE NOTICE 'reports: Public bucket for generated reports';
    RAISE NOTICE 'Users can only upload to their own folder';
END $$;
