-- Fix foreign key constraint in link_audit_logs
-- Feature: 024-intake-entity-linking
-- Issue: Foreign key references profiles(id) but profiles uses user_id as PRIMARY KEY

-- Drop the existing foreign key constraint
ALTER TABLE link_audit_logs
DROP CONSTRAINT IF EXISTS link_audit_logs_performed_by_fkey;

-- Recreate the foreign key constraint to reference profiles(user_id)
ALTER TABLE link_audit_logs
ADD CONSTRAINT link_audit_logs_performed_by_fkey
FOREIGN KEY (performed_by) REFERENCES profiles(user_id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT link_audit_logs_performed_by_fkey ON link_audit_logs IS 'Foreign key to profiles.user_id for audit trail';
