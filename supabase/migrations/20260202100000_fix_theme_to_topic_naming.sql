-- Migration: Fix theme to topic table naming
-- Feature: P0 - Resolve theme vs topic end-to-end
-- Date: 2026-02-02
-- Description: Rename themes table to topics while keeping column names for MV compatibility

-- ============================================================================
-- PART 1: Rename the table (keep column names for MV compatibility)
-- ============================================================================

-- Rename themes table to topics (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'themes') THEN
    -- Drop the old trigger first
    DROP TRIGGER IF EXISTS validate_theme_type ON themes;
    
    -- Rename the table
    ALTER TABLE themes RENAME TO topics;
    
    RAISE NOTICE 'Renamed themes table to topics';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
    -- Create topics table if neither exists (for fresh installs)
    CREATE TABLE topics (
      id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
      theme_category TEXT NOT NULL CHECK (theme_category IN ('policy', 'technical', 'strategic', 'operational')),
      parent_theme_id UUID REFERENCES topics(id) CHECK (parent_theme_id != id)
    );
    RAISE NOTICE 'Created new topics table';
  ELSE
    RAISE NOTICE 'topics table already exists';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Update the validation trigger
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS validate_theme_type ON topics;
DROP TRIGGER IF EXISTS validate_topic_type ON topics;

-- Create new validation trigger for topics (validates type='topic' in dossiers)
CREATE TRIGGER validate_topic_type
  BEFORE INSERT OR UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('topic');

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(theme_category);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_theme_id);

-- ============================================================================
-- PART 4: Ensure MV refresh trigger exists
-- ============================================================================

DROP TRIGGER IF EXISTS trg_topics_refresh_mv ON topics;

-- Only create trigger if the function exists (from MV migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'queue_dossier_list_mv_refresh') THEN
    CREATE TRIGGER trg_topics_refresh_mv
      AFTER INSERT OR UPDATE OR DELETE ON topics
      FOR EACH STATEMENT
      EXECUTE FUNCTION queue_dossier_list_mv_refresh();
    RAISE NOTICE 'Created MV refresh trigger for topics';
  ELSE
    RAISE NOTICE 'MV refresh function not found, skipping trigger creation';
  END IF;
END $$;

-- ============================================================================
-- PART 5: Update table comment
-- ============================================================================

COMMENT ON TABLE topics IS 'Extension table for topic dossiers - policy areas, strategic priorities, and thematic initiatives';
COMMENT ON COLUMN topics.theme_category IS 'Category: policy, technical, strategic, or operational (named theme_category for backward compatibility)';
COMMENT ON COLUMN topics.parent_theme_id IS 'Parent topic for hierarchical organization (named parent_theme_id for backward compatibility)';

-- ============================================================================
-- PART 6: Clean up any incorrect table remnants
-- ============================================================================

DROP TABLE IF EXISTS dossier_extensions_theme CASCADE;
DROP TABLE IF EXISTS dossier_extensions_topic CASCADE;
