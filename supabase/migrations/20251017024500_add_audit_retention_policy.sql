-- Migration: Add 7-year audit retention policy
-- Feature: 024-intake-entity-linking
-- Task: T016a

-- ========================================
-- Audit Retention Policy (7-year minimum)
-- ========================================

-- Revoke UPDATE and DELETE permissions on link_audit_logs to ensure immutability
REVOKE UPDATE, DELETE ON link_audit_logs FROM PUBLIC;
REVOKE UPDATE, DELETE ON link_audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON link_audit_logs FROM anon;

-- Add CHECK constraint to prevent backdating of audit logs
-- This ensures audit logs cannot be created with timestamps older than 7 years
ALTER TABLE link_audit_logs
ADD CONSTRAINT chk_audit_retention_min_date CHECK (
  timestamp >= NOW() - INTERVAL '7 years'
);

-- Add comment explaining the retention policy
COMMENT ON CONSTRAINT chk_audit_retention_min_date ON link_audit_logs IS
  '7-year minimum retention: Prevents creation of audit logs older than 7 years. ' ||
  'For compliance, audit logs must be archived (not deleted) after 7 years using external archival process.';

-- Grant INSERT to authenticated users (via trigger/function)
GRANT INSERT ON link_audit_logs TO authenticated;

-- Add table comment about immutability
COMMENT ON TABLE link_audit_logs IS
  'Immutable audit trail of all link operations for compliance (7-year minimum retention). ' ||
  'No UPDATE or DELETE permissions granted. Archival after 7 years must be handled externally.';
