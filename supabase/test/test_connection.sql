-- =====================================================
-- Supabase Connection Test Script
-- =====================================================
-- Run this after completing all migrations to verify setup

-- =====================================================
-- Test 1: Check if tables exist
-- =====================================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('analysis_jobs', 'analysis_results', 'reports');

    IF table_count = 3 THEN
        RAISE NOTICE '✅ Test 1 PASSED: All tables exist';
    ELSE
        RAISE NOTICE '❌ Test 1 FAILED: Missing tables (found: %)', table_count;
    END IF;
END $$;

-- =====================================================
-- Test 2: Check if RLS is enabled
-- =====================================================
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('analysis_jobs', 'analysis_results', 'reports')
    AND rowsecurity = true;

    IF rls_count = 3 THEN
        RAISE NOTICE '✅ Test 2 PASSED: RLS enabled on all tables';
    ELSE
        RAISE NOTICE '❌ Test 2 FAILED: RLS not enabled (found: %)', rls_count;
    END IF;
END $$;

-- =====================================================
-- Test 3: Check if storage buckets exist
-- =====================================================
DO $$
DECLARE
    bucket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id IN ('uploads', 'reports');

    IF bucket_count = 2 THEN
        RAISE NOTICE '✅ Test 3 PASSED: Storage buckets exist';
    ELSE
        RAISE NOTICE '❌ Test 3 FAILED: Missing buckets (found: %)', bucket_count;
    END IF;
END $$;

-- =====================================================
-- Test 4: Check if RLS policies exist
-- =====================================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename IN ('analysis_jobs', 'analysis_results', 'reports');

    IF policy_count >= 7 THEN
        RAISE NOTICE '✅ Test 4 PASSED: RLS policies created (found: % policies)', policy_count;
    ELSE
        RAISE NOTICE '❌ Test 4 FAILED: Missing RLS policies (found: %)', policy_count;
    END IF;
END $$;

-- =====================================================
-- Test 5: Check if helper functions exist
-- =====================================================
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('get_user_jobs', 'get_job_with_results', 'generate_upload_path');

    IF function_count = 3 THEN
        RAISE NOTICE '✅ Test 5 PASSED: Helper functions exist';
    ELSE
        RAISE NOTICE '❌ Test 5 FAILED: Missing functions (found: %)', function_count;
    END IF;
END $$;

-- =====================================================
-- Test 6: Insert test job (requires authenticated user)
-- =====================================================
-- Uncomment this to test inserting data (you must be logged in)
/*
DO $$
DECLARE
    test_job_id UUID;
BEGIN
    -- Insert test job
    INSERT INTO analysis_jobs (user_id, file_name, file_size, status)
    VALUES (auth.uid(), 'test.csv', 1024, 'completed')
    RETURNING id INTO test_job_id;

    RAISE NOTICE '✅ Test 6 PASSED: Test job created (ID: %)', test_job_id;

    -- Test helper function
    PERFORM * FROM get_user_jobs();
    RAISE NOTICE '✅ Test 6 PASSED: Helper function works';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Test 6 SKIPPED: Not authenticated or error: %', SQLERRM;
END $$;
*/

-- =====================================================
-- Summary
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'Supabase Setup Test Complete!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'All tests should show ✅ (passed)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. If all tests passed: Your Supabase is ready!';
    RAISE NOTICE '2. If any tests failed: Re-run the migration scripts';
    RAISE NOTICE '3. Test from frontend: Start building authentication';
    RAISE NOTICE '';
    RAISE NOTICE 'For detailed setup: See SETUP_GUIDE.md';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
