-- Migration: Time Series Metadata Table
-- Created: 2025-04-20
-- Description: Stores metadata and configuration for time series analysis

-- Create time series metadata table
CREATE TABLE IF NOT EXISTS time_series_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,

    -- Time column identification
    time_column TEXT NOT NULL,

    -- Frequency detection
    inferred_frequency TEXT,
    is_regular BOOLEAN DEFAULT false,

    -- Date range
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    n_observations INTEGER,

    -- Preprocessing steps applied
    preprocessing_steps JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per job for time series metadata
    UNIQUE(job_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_series_metadata_job_id ON time_series_metadata(job_id);
CREATE INDEX IF NOT EXISTS idx_time_series_metadata_time_column ON time_series_metadata(time_column);
CREATE INDEX IF NOT EXISTS idx_time_series_metadata_is_regular ON time_series_metadata(is_regular);
CREATE INDEX IF NOT EXISTS idx_time_series_metadata_created_at ON time_series_metadata(created_at);

-- Add comments for documentation
COMMENT ON TABLE time_series_metadata IS 'Stores metadata about time series analysis including frequency, regularity, and preprocessing steps';
COMMENT ON COLUMN time_series_metadata.time_column IS 'The column name identified as the time/date column';
COMMENT ON COLUMN time_series_metadata.inferred_frequency IS 'Inferred frequency code (e.g., D=daily, W=weekly, M=monthly, H=hourly)';
COMMENT ON COLUMN time_series_metadata.is_regular IS 'Whether the time series has regular intervals';
COMMENT ON COLUMN time_series_metadata.preprocessing_steps IS 'JSONB object storing preprocessing steps applied (e.g., missing value imputation, resampling)';
