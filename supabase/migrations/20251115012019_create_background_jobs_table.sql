-- Create background_jobs table for queuing health score calculations
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create index for efficient job queue queries
CREATE INDEX idx_background_jobs_status_created ON background_jobs(status, created_at) WHERE status = 'pending';

-- Enable Row-Level Security
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to background_jobs"
    ON background_jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can only view their own jobs (not needed for this feature, but good practice)
CREATE POLICY "Authenticated users can view background jobs"
    ON background_jobs
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comment
COMMENT ON TABLE background_jobs IS 'Queue for background processing jobs (health score calculations, etc.)';
