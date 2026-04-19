-- Fix the check constraint to allow all result types that Railway workers use
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_result_type_check;

-- Add new constraint with all allowed result types
ALTER TABLE analysis_results
ADD CONSTRAINT analysis_results_result_type_check
CHECK (result_type IN (
  'quality', 'univariate', 'correlation', 'target', 'ml_readiness',
  'profile', 'statistics', 'correlations', 'distributions', 'outliers',
  'data_quality', 'summary'
));

-- Add comment for documentation
COMMENT ON CONSTRAINT analysis_results_result_type_check ON analysis_results IS 'Allowed result types from Railway workers and frontend';
