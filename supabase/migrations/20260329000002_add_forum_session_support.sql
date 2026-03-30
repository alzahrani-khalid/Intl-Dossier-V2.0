-- Migration: Add forum_session engagement type + parent_forum_id column
-- Requirements: LIFE-06

-- 1. Find and drop existing engagement_type CHECK constraint, then add new one with 'forum_session'
-- Note: Constraint name may vary; using DO block to find it dynamically
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'engagement_dossiers'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%engagement_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE engagement_dossiers DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE engagement_dossiers
ADD CONSTRAINT engagement_dossiers_engagement_type_check CHECK (engagement_type IN (
  'bilateral_meeting','mission','delegation','summit','working_group',
  'roundtable','official_visit','consultation','forum_session','other'
));

-- 2. Add parent_forum_id column for linking forum sessions to parent forum dossiers
ALTER TABLE engagement_dossiers
ADD COLUMN parent_forum_id UUID REFERENCES dossiers(id) ON DELETE SET NULL;

-- 3. Add partial index on parent_forum_id (only for non-null values)
CREATE INDEX idx_engagement_dossiers_parent_forum_id
ON engagement_dossiers(parent_forum_id)
WHERE parent_forum_id IS NOT NULL;
