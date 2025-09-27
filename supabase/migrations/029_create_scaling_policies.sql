-- Migration: Create Scaling Policies table
-- Purpose: Auto-scaling configuration (FR-014 to FR-019)
-- Feature: 004-refine-specification-to Phase 3.4

-- Create scaling_policies table
CREATE TABLE scaling_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    
    -- Capacity (FR-014, FR-015)
    min_concurrent_users INTEGER NOT NULL DEFAULT 1000 CHECK (min_concurrent_users > 0),
    max_requests_per_minute INTEGER NOT NULL DEFAULT 10000 CHECK (max_requests_per_minute > 0),
    
    -- Instance limits (FR-018)
    min_instances INTEGER NOT NULL DEFAULT 2 CHECK (min_instances >= 1),
    max_instances INTEGER NOT NULL DEFAULT 20 CHECK (max_instances > min_instances AND max_instances <= 50),
    
    -- Triggers (FR-016, FR-017)
    cpu_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 70.00 CHECK (cpu_threshold_percent >= 10 AND cpu_threshold_percent <= 95),
    memory_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 80.00 CHECK (memory_threshold_percent >= 10 AND memory_threshold_percent <= 95),
    threshold_duration_minutes INTEGER NOT NULL DEFAULT 5 CHECK (threshold_duration_minutes > 0),
    
    -- Degradation (FR-019a)
    max_limit_action TEXT NOT NULL DEFAULT 'alert' CHECK (max_limit_action IN ('alert', 'degrade', 'reject')),
    degraded_features TEXT[] DEFAULT '{}',
    
    -- Session handling (FR-019)
    maintain_session_affinity BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient lookups
CREATE INDEX idx_scaling_policies_enabled ON scaling_policies(enabled) WHERE enabled = true;
CREATE INDEX idx_scaling_policies_cpu_threshold ON scaling_policies(cpu_threshold_percent);
CREATE INDEX idx_scaling_policies_memory_threshold ON scaling_policies(memory_threshold_percent);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scaling_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_scaling_policies_updated_at
    BEFORE UPDATE ON scaling_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_scaling_policies_updated_at();

-- Create function to validate instance limits
CREATE OR REPLACE FUNCTION validate_scaling_instances()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.max_instances <= NEW.min_instances THEN
        RAISE EXCEPTION 'max_instances (%) must be greater than min_instances (%)', NEW.max_instances, NEW.min_instances;
    END IF;
    
    IF NEW.max_instances > 50 THEN
        RAISE EXCEPTION 'max_instances (%) cannot exceed 50', NEW.max_instances;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for instance validation
CREATE TRIGGER trigger_validate_scaling_instances
    BEFORE INSERT OR UPDATE ON scaling_policies
    FOR EACH ROW
    EXECUTE FUNCTION validate_scaling_instances();

-- Insert default scaling policy
INSERT INTO scaling_policies (name, min_concurrent_users, max_requests_per_minute, min_instances, max_instances, cpu_threshold_percent, memory_threshold_percent, threshold_duration_minutes, max_limit_action, degraded_features, maintain_session_affinity, created_by) VALUES
('Default Scaling Policy', 1000, 10000, 2, 20, 70.00, 80.00, 5, 'alert', ARRAY['advanced_search', 'real_time_updates'], true, (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1));

-- Add comments
COMMENT ON TABLE scaling_policies IS 'Auto-scaling configuration for system capacity management';
COMMENT ON COLUMN scaling_policies.min_concurrent_users IS 'Minimum concurrent users before scaling up';
COMMENT ON COLUMN scaling_policies.max_requests_per_minute IS 'Maximum requests per minute capacity';
COMMENT ON COLUMN scaling_policies.min_instances IS 'Minimum number of instances (≥1)';
COMMENT ON COLUMN scaling_policies.max_instances IS 'Maximum number of instances (≤50)';
COMMENT ON COLUMN scaling_policies.cpu_threshold_percent IS 'CPU usage threshold for scaling (10-95%)';
COMMENT ON COLUMN scaling_policies.memory_threshold_percent IS 'Memory usage threshold for scaling (10-95%)';
COMMENT ON COLUMN scaling_policies.threshold_duration_minutes IS 'Duration threshold must be exceeded before scaling';
COMMENT ON COLUMN scaling_policies.max_limit_action IS 'Action when max capacity reached: alert, degrade, or reject';
COMMENT ON COLUMN scaling_policies.degraded_features IS 'Features to disable when degrading service';
COMMENT ON COLUMN scaling_policies.maintain_session_affinity IS 'Whether to maintain session affinity during scaling';
