-- Migration: Statistical Tests Metadata Table
-- Created: 2025-04-20
-- Description: Stores metadata about statistical tests performed and assumptions checked

-- Create statistical tests metadata table
CREATE TABLE IF NOT EXISTS statistical_tests_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,

    -- Tests performed
    tests_performed JSONB NOT NULL DEFAULT '{}',

    -- Assumptions checked
    assumptions_checked JSONB NOT NULL DEFAULT '{}',

    -- Sample sizes
    sample_sizes JSONB DEFAULT '{}',

    -- Warnings about violations
    warnings JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per job for statistical tests metadata
    UNIQUE(job_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_statistical_tests_metadata_job_id ON statistical_tests_metadata(job_id);
CREATE INDEX IF NOT EXISTS idx_statistical_tests_metadata_created_at ON statistical_tests_metadata(created_at);

-- Add comments for documentation
COMMENT ON TABLE statistical_tests_metadata IS 'Stores metadata about statistical tests performed, assumptions checked, and any warnings';
COMMENT ON COLUMN statistical_tests_metadata.tests_performed IS 'JSONB object listing all tests performed (e.g., t_tests, anova, chi_square)';
COMMENT ON COLUMN statistical_tests_metadata.assumptions_checked IS 'JSONB object storing results of assumption checks (normality, homogeneity of variance)';
COMMENT ON COLUMN statistical_tests_metadata.sample_sizes IS 'JSONB object storing sample sizes for each test';
COMMENT ON COLUMN statistical_tests_metadata.warnings IS 'Array of warnings about assumption violations or test limitations';
