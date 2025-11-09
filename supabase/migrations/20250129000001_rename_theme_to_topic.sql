-- Migration: Rename 'theme' dossier type to 'topic'
-- Feature: Terminology consistency update
-- Date: 2025-01-29
-- Description: Update dossier type from 'theme' to 'topic' for better clarity

-- Update existing theme dossiers to topic
UPDATE dossiers
SET type = 'topic'
WHERE type = 'theme';

-- Drop the old constraint
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_type_check;

-- Add new constraint with 'topic' instead of 'theme'
ALTER TABLE dossiers ADD CONSTRAINT dossiers_type_check
CHECK (type IN (
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person'
));

-- Update the table comment
COMMENT ON TABLE dossiers IS 'Universal base table for all diplomatic entities (countries, organizations, forums, engagements, topics, working groups, persons)';

-- Update extension table similarly
ALTER TABLE dossier_extensions_theme DROP CONSTRAINT IF EXISTS dossier_extensions_theme_dossier_id_fkey;
ALTER TABLE dossier_extensions_theme RENAME TO dossier_extensions_topic;

-- Re-add foreign key constraint
ALTER TABLE dossier_extensions_topic ADD CONSTRAINT dossier_extensions_topic_dossier_id_fkey
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE;

-- Update extension table comment
COMMENT ON TABLE dossier_extensions_topic IS 'Type-specific fields for topic dossiers - policy areas and strategic priorities';
