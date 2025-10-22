-- Fix foreign key constraints in intake_entity_links
-- Feature: 024-intake-entity-linking
-- Issue: Foreign keys reference profiles(id) but profiles uses user_id as PRIMARY KEY

-- Drop existing foreign key constraints
ALTER TABLE intake_entity_links
DROP CONSTRAINT IF EXISTS intake_entity_links_suggested_by_fkey;

ALTER TABLE intake_entity_links
DROP CONSTRAINT IF EXISTS intake_entity_links_linked_by_fkey;

-- Recreate foreign key constraints to reference profiles(user_id)
ALTER TABLE intake_entity_links
ADD CONSTRAINT intake_entity_links_suggested_by_fkey
FOREIGN KEY (suggested_by) REFERENCES profiles(user_id)
ON DELETE SET NULL;

ALTER TABLE intake_entity_links
ADD CONSTRAINT intake_entity_links_linked_by_fkey
FOREIGN KEY (linked_by) REFERENCES profiles(user_id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT intake_entity_links_suggested_by_fkey ON intake_entity_links IS 'Foreign key to profiles.user_id for AI suggestion author (nullable)';
COMMENT ON CONSTRAINT intake_entity_links_linked_by_fkey ON intake_entity_links IS 'Foreign key to profiles.user_id for link creator';
