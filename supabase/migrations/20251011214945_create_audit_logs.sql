-- Migration: Create partitioned audit_logs table with yearly partitions
-- Feature: 019-user-management-access
-- Task: T010
-- Date: 2025-10-11

-- Create partitioned audit_logs table (partitioned by year)
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,  -- 'user_created', 'role_assigned', 'delegation_created', 'user_deactivated', etc.
  user_id UUID REFERENCES auth.users(id),  -- User who performed the action
  target_user_id UUID REFERENCES auth.users(id),  -- User affected by the action
  resource_type TEXT,  -- 'user', 'role', 'delegation', 'session'
  resource_id UUID,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'approve', 'reject'
  changes JSONB,  -- Before/after values: {before: {...}, after: {...}}
  metadata JSONB DEFAULT '{}'::jsonb,  -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create yearly partitions (2025-2031 for 7-year retention)
CREATE TABLE audit_logs_2025 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audit_logs_2026 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE audit_logs_2027 PARTITION OF audit_logs
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE audit_logs_2028 PARTITION OF audit_logs
  FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

CREATE TABLE audit_logs_2029 PARTITION OF audit_logs
  FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');

CREATE TABLE audit_logs_2030 PARTITION OF audit_logs
  FOR VALUES FROM ('2030-01-01') TO ('2031-01-01');

CREATE TABLE audit_logs_2031 PARTITION OF audit_logs
  FOR VALUES FROM ('2031-01-01') TO ('2032-01-01');

-- Create indexes on parent table (will be inherited by partitions)
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Helper function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_target_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT,
  p_changes JSONB,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    event_type,
    user_id,
    target_user_id,
    resource_type,
    resource_id,
    action,
    changes,
    metadata,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_event_type,
    p_user_id,
    p_target_user_id,
    p_resource_type,
    p_resource_id,
    p_action,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent,
    now()
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Prevent UPDATE and DELETE on audit logs (immutable)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_audit_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trigger_prevent_audit_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- Add comments
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all user management actions (7-year retention, yearly partitions)';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (user_created, role_assigned, delegation_created, etc.)';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.target_user_id IS 'User affected by the action';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource (user, role, delegation, session)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (create, update, delete, approve, reject)';
COMMENT ON COLUMN audit_logs.changes IS 'Before/after values for the action';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the actor';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp of the event (partition key)';
