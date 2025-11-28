-- Migration: 20251128000001_add_creation_metadata_fields.sql
-- Feature: 033-unified-work-creation-hub
-- Purpose: Add creation source tracking fields for audit trail

-- Add creation metadata to aa_commitments table
ALTER TABLE aa_commitments
  ADD COLUMN IF NOT EXISTS created_from_route TEXT,
  ADD COLUMN IF NOT EXISTS created_from_entity JSONB;

COMMENT ON COLUMN aa_commitments.created_from_route IS 'URL path where the commitment was created from';
COMMENT ON COLUMN aa_commitments.created_from_entity IS 'Entity context when created, e.g. {"type": "dossier", "id": "uuid"}';

-- Add creation metadata to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS created_from_route TEXT,
  ADD COLUMN IF NOT EXISTS created_from_entity JSONB;

COMMENT ON COLUMN tasks.created_from_route IS 'URL path where the task was created from';
COMMENT ON COLUMN tasks.created_from_entity IS 'Entity context when created, e.g. {"type": "engagement", "id": "uuid"}';

-- Add creation metadata to intake_tickets table
ALTER TABLE intake_tickets
  ADD COLUMN IF NOT EXISTS created_from_route TEXT,
  ADD COLUMN IF NOT EXISTS created_from_entity JSONB;

COMMENT ON COLUMN intake_tickets.created_from_route IS 'URL path where the intake ticket was created from';
COMMENT ON COLUMN intake_tickets.created_from_entity IS 'Entity context when created, e.g. {"type": "dossier", "id": "uuid"}';

-- Create indexes for querying by creation context
CREATE INDEX IF NOT EXISTS idx_aa_commitments_created_from_entity
  ON aa_commitments USING GIN (created_from_entity);

CREATE INDEX IF NOT EXISTS idx_tasks_created_from_entity
  ON tasks USING GIN (created_from_entity);

CREATE INDEX IF NOT EXISTS idx_intake_tickets_created_from_entity
  ON intake_tickets USING GIN (created_from_entity);
