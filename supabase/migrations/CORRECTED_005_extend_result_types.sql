-- =====================================================
-- CORRECTED: Extend Analysis Result Types
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing constraint
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_result_type_check;

-- Add new constraint with all allowed result types (including new ones)
ALTER TABLE analysis_results
ADD CONSTRAINT analysis_results_result_type_check
CHECK (result_type IN (
  -- Original types
  'quality', 'univariate', 'correlation', 'target', 'ml_readiness',
  'profile', 'statistics', 'correlations', 'distributions', 'outliers',
  'data_quality', 'summary', 'ai_insights',
  -- New types for advanced EDA
  'time_series', 'statistical_tests', 'forecasting', 'regression'
));

-- Add comment for documentation
COMMENT ON CONSTRAINT analysis_results_result_type_check ON analysis_results IS 'Allowed result types from Railway workers and frontend including advanced EDA features';
