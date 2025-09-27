-- Migration: Create Rate Limit Policies table
-- Purpose: Configurable rate limiting rules (FR-009 to FR-013)
-- Feature: 004-refine-specification-to Phase 3.4

-- Create rate_limit_policies table
CREATE TABLE rate_limit_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Limits (FR-009, FR-013a)
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    burst_capacity INTEGER NOT NULL CHECK (burst_capacity > 0 AND burst_capacity <= requests_per_minute),
    
    -- Targeting
    applies_to TEXT NOT NULL CHECK (applies_to IN ('authenticated', 'anonymous', 'role')),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Tracking (FR-012)
    endpoint_type TEXT NOT NULL DEFAULT 'all' CHECK (endpoint_type IN ('api', 'upload', 'report', 'all')),
    
    -- Response (FR-011)
    retry_after_seconds INTEGER NOT NULL DEFAULT 60 CHECK (retry_after_seconds >= 1 AND retry_after_seconds <= 3600),
    
    -- Status
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient lookups
CREATE INDEX idx_rate_limit_policies_applies ON rate_limit_policies(applies_to, endpoint_type);
CREATE INDEX idx_rate_limit_policies_role ON rate_limit_policies(role_id) WHERE role_id IS NOT NULL;
CREATE INDEX idx_rate_limit_policies_enabled ON rate_limit_policies(enabled) WHERE enabled = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limit_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_rate_limit_policies_updated_at
    BEFORE UPDATE ON rate_limit_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limit_policies_updated_at();

-- Create function to validate role_id when applies_to = 'role'
CREATE OR REPLACE FUNCTION validate_rate_limit_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.applies_to = 'role' AND NEW.role_id IS NULL THEN
        RAISE EXCEPTION 'role_id must be provided when applies_to = ''role''';
    END IF;
    
    IF NEW.applies_to != 'role' AND NEW.role_id IS NOT NULL THEN
        RAISE EXCEPTION 'role_id must be NULL when applies_to != ''role''';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role validation
CREATE TRIGGER trigger_validate_rate_limit_role
    BEFORE INSERT OR UPDATE ON rate_limit_policies
    FOR EACH ROW
    EXECUTE FUNCTION validate_rate_limit_role();

-- Insert default rate limit policies
INSERT INTO rate_limit_policies (name, description, requests_per_minute, burst_capacity, applies_to, endpoint_type, retry_after_seconds, created_by) VALUES
('Authenticated Users', 'Standard rate limit for authenticated users', 300, 50, 'authenticated', 'all', 60, (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1)),
('Anonymous Users', 'Restrictive rate limit for anonymous users', 50, 10, 'anonymous', 'all', 60, (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1)),
('API Endpoints', 'Rate limit for API endpoints', 300, 50, 'authenticated', 'api', 60, (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1)),
('File Uploads', 'Rate limit for file upload endpoints', 20, 5, 'authenticated', 'upload', 3600, (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1)),
('Report Generation', 'Rate limit for report generation', 10, 2, 'authenticated', 'report', 3600, (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1));

-- Add comments
COMMENT ON TABLE rate_limit_policies IS 'Configurable rate limiting rules for different user types and endpoints';
COMMENT ON COLUMN rate_limit_policies.requests_per_minute IS 'Maximum requests allowed per minute';
COMMENT ON COLUMN rate_limit_policies.burst_capacity IS 'Token bucket burst capacity (≤ requests_per_minute)';
COMMENT ON COLUMN rate_limit_policies.applies_to IS 'Target audience: authenticated, anonymous, or specific role';
COMMENT ON COLUMN rate_limit_policies.endpoint_type IS 'Type of endpoints this policy applies to';
COMMENT ON COLUMN rate_limit_policies.retry_after_seconds IS 'Retry-After header value for 429 responses (1-3600)';
