-- Migration: Create additional performance indexes
-- Feature: 010-after-action-notes
-- Task: T012

-- Composite index for dossier ownership checks (performance optimization)
CREATE INDEX IF NOT EXISTS idx_dossier_owners_composite ON dossier_owners(user_id, dossier_id);

-- Additional composite index for permission checks
CREATE INDEX IF NOT EXISTS idx_dossier_owners_dossier_user ON dossier_owners(dossier_id, user_id);
