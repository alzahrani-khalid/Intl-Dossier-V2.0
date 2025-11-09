-- Migration: Rename 'themes' extension table to 'topics'
-- Feature: Terminology consistency update (follow-up to 20250129000001)
-- Date: 2025-10-30
-- Description: Rename the themes extension table to topics to match the dossier type name

-- Drop the old trigger first
DROP TRIGGER IF EXISTS validate_theme_type ON themes;

-- Rename the table
ALTER TABLE IF EXISTS themes RENAME TO topics;

-- Update the self-referencing constraint
ALTER TABLE topics DROP CONSTRAINT IF EXISTS themes_parent_theme_id_check;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS themes_parent_theme_id_fkey;
ALTER TABLE topics ADD CONSTRAINT topics_parent_topic_id_check CHECK (parent_theme_id != id);
ALTER TABLE topics ADD CONSTRAINT topics_parent_topic_id_fkey FOREIGN KEY (parent_theme_id) REFERENCES topics(id);

-- Rename the parent column for consistency (optional - keeping old name for backward compatibility)
-- We keep parent_theme_id as-is to avoid breaking existing data

-- Update the foreign key constraint to dossiers
ALTER TABLE topics DROP CONSTRAINT IF EXISTS themes_id_fkey;
ALTER TABLE topics ADD CONSTRAINT topics_id_fkey FOREIGN KEY (id) REFERENCES dossiers(id) ON DELETE CASCADE;

-- Recreate the trigger with the new name
CREATE TRIGGER validate_topic_type
  BEFORE INSERT OR UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('topic');

-- Update table comment
COMMENT ON TABLE topics IS 'Type-specific fields for topic dossiers - policy areas and strategic priorities';
