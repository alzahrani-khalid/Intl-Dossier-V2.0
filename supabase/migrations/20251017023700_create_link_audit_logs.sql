-- Migration: Create link_audit_logs table (immutable)
-- Feature: 024-intake-entity-linking
-- Task: T009

CREATE TABLE IF NOT EXISTS link_audit_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL, -- References intake_entity_links(id), no FK to preserve deleted links

  -- Operation metadata
  intake_id UUID NOT NULL, -- Denormalized for fast querying
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'deleted', 'restored', 'migrated', 'updated')),

  -- Actor
  performed_by UUID NOT NULL REFERENCES profiles(id),

  -- Details
  details JSONB, -- Stores action-specific data (e.g., old_values, new_values, migration_target)

  -- Audit
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE link_audit_logs IS 'Immutable audit trail of all link operations for compliance (7-year retention)';
COMMENT ON COLUMN link_audit_logs.link_id IS 'References intake_entity_links(id) - no FK to preserve history of deleted links';
COMMENT ON COLUMN link_audit_logs.details IS 'JSONB containing action-specific metadata (old_values, new_values, migration data, etc.)';
