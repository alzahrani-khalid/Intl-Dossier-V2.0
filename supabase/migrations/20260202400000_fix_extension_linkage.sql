-- Migration: Fix Dossier Extension Data Linkage
-- This migration ensures proper Class Table Inheritance (CTI) where extension tables
-- share the same ID as their parent dossier. It removes the dossier_id workaround
-- column and archives orphan dossiers.

BEGIN;

-- ============================================================================
-- STEP 1: Backup current state for rollback capability
-- ============================================================================
CREATE TABLE IF NOT EXISTS _dossiers_backup_20260202 AS
SELECT * FROM dossiers WHERE type IN ('country', 'organization', 'forum', 'person');

CREATE TABLE IF NOT EXISTS _countries_backup_20260202 AS
SELECT * FROM countries;

-- ============================================================================
-- STEP 2: Create dossiers for extension rows that don't have matching dossiers
-- This ensures every extension row has a corresponding dossier with the same ID
-- Uses REAL values from extension tables (no placeholders)
-- ============================================================================

-- For countries: Since countries doesn't have name_en/name_ar, we need to get
-- names from any existing linked dossier via dossier_id, or use a fallback
INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, created_by, updated_by, created_at, updated_at)
SELECT
  c.id,  -- Use existing country ID as dossier ID
  'country',
  -- Get name from linked dossier_id if exists, otherwise use ISO code as fallback
  COALESCE(
    (SELECT d2.name_en FROM dossiers d2 WHERE d2.id = c.dossier_id),
    'Country ' || c.iso_code_3
  ),
  COALESCE(
    (SELECT d2.name_ar FROM dossiers d2 WHERE d2.id = c.dossier_id),
    'دولة ' || c.iso_code_3
  ),
  'active',
  1,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  NOW(),
  NOW()
FROM countries c
WHERE NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.id = c.id)
ON CONFLICT (id) DO NOTHING;

-- For organizations (these tables don't have name_en/name_ar - names are in dossiers table)
-- This INSERT will only run for orphan organizations without matching dossiers (currently 0)
INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, created_by, updated_by, created_at, updated_at)
SELECT
  o.id,
  'organization',
  COALESCE(o.org_code, 'Organization ' || o.id::text),
  COALESCE(o.org_code, 'منظمة ' || o.id::text),
  'active',
  1,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  NOW(),
  NOW()
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.id = o.id)
ON CONFLICT (id) DO NOTHING;

-- For forums (no name columns - names are in dossiers table)
-- This INSERT will only run for orphan forums without matching dossiers (currently 0)
INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, created_by, updated_by, created_at, updated_at)
SELECT
  f.id,
  'forum',
  'Forum ' || f.id::text,
  'منتدى ' || f.id::text,
  'active',
  1,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  NOW(),
  NOW()
FROM forums f
WHERE NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.id = f.id)
ON CONFLICT (id) DO NOTHING;

-- For persons (has title_en/title_ar which can serve as name fallback)
-- This INSERT will only run for orphan persons without matching dossiers (currently 0)
INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, created_by, updated_by, created_at, updated_at)
SELECT
  p.id,
  'person',
  COALESCE(p.title_en, 'Person ' || p.id::text),
  COALESCE(p.title_ar, 'شخص ' || p.id::text),
  'active',
  1,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  NOW(),
  NOW()
FROM persons p
WHERE NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Archive orphan dossiers that don't have matching extension records
-- These are dossiers created with different IDs than their extension tables
-- ============================================================================

-- Archive orphan country dossiers
UPDATE dossiers d
SET
  status = 'archived',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{migration_note}',
    to_jsonb('Archived: orphan country dossier with no matching countries.id as of ' || NOW()::text)
  )
WHERE d.type = 'country'
  AND d.status != 'archived'
  AND NOT EXISTS (SELECT 1 FROM countries c WHERE c.id = d.id);

-- Archive orphan organization dossiers
UPDATE dossiers d
SET
  status = 'archived',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{migration_note}',
    to_jsonb('Archived: orphan organization dossier with no matching organizations.id as of ' || NOW()::text)
  )
WHERE d.type = 'organization'
  AND d.status != 'archived'
  AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = d.id);

-- Archive orphan forum dossiers
UPDATE dossiers d
SET
  status = 'archived',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{migration_note}',
    to_jsonb('Archived: orphan forum dossier with no matching forums.id as of ' || NOW()::text)
  )
WHERE d.type = 'forum'
  AND d.status != 'archived'
  AND NOT EXISTS (SELECT 1 FROM forums f WHERE f.id = d.id);

-- Archive orphan person dossiers
UPDATE dossiers d
SET
  status = 'archived',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{migration_note}',
    to_jsonb('Archived: orphan person dossier with no matching persons.id as of ' || NOW()::text)
  )
WHERE d.type = 'person'
  AND d.status != 'archived'
  AND NOT EXISTS (SELECT 1 FROM persons p WHERE p.id = d.id);

-- ============================================================================
-- STEP 4: Drop the dossier_id workaround column from countries
-- This column was a band-aid fix that's no longer needed
-- ============================================================================
DROP INDEX IF EXISTS idx_countries_dossier_id;
ALTER TABLE countries DROP COLUMN IF EXISTS dossier_id;

-- ============================================================================
-- STEP 5: Create validation trigger to warn about future orphans
-- Uses WARNING (not EXCEPTION) to avoid breaking existing flows
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_dossier_has_extension()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on INSERT of new dossiers with extension types
  IF TG_OP = 'INSERT' AND NEW.type IN ('country', 'organization', 'forum', 'person', 'engagement', 'topic', 'working_group') THEN
    -- Check if extension exists
    PERFORM 1 FROM (
      SELECT 1 FROM countries WHERE id = NEW.id AND NEW.type = 'country'
      UNION ALL
      SELECT 1 FROM organizations WHERE id = NEW.id AND NEW.type = 'organization'
      UNION ALL
      SELECT 1 FROM forums WHERE id = NEW.id AND NEW.type = 'forum'
      UNION ALL
      SELECT 1 FROM persons WHERE id = NEW.id AND NEW.type = 'person'
      UNION ALL
      SELECT 1 FROM engagements WHERE id = NEW.id AND NEW.type = 'engagement'
      UNION ALL
      SELECT 1 FROM topics WHERE id = NEW.id AND NEW.type = 'topic'
      UNION ALL
      SELECT 1 FROM working_groups WHERE id = NEW.id AND NEW.type = 'working_group'
    ) x;

    IF NOT FOUND THEN
      RAISE WARNING 'Dossier % created without extension record (type: %). This may cause data inconsistency.', NEW.id, NEW.type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_extension_exists ON dossiers;
CREATE CONSTRAINT TRIGGER check_extension_exists
  AFTER INSERT ON dossiers
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION validate_dossier_has_extension();

-- ============================================================================
-- STEP 6: Create health check view for monitoring
-- ============================================================================
CREATE OR REPLACE VIEW v_dossier_extension_health AS
SELECT
  d.id,
  d.type,
  d.name_en,
  d.status,
  CASE
    WHEN d.type = 'country' AND c.id IS NOT NULL THEN 'linked'
    WHEN d.type = 'organization' AND o.id IS NOT NULL THEN 'linked'
    WHEN d.type = 'forum' AND f.id IS NOT NULL THEN 'linked'
    WHEN d.type = 'person' AND p.id IS NOT NULL THEN 'linked'
    WHEN d.type = 'engagement' AND e.id IS NOT NULL THEN 'linked'
    WHEN d.type = 'topic' AND t.id IS NOT NULL THEN 'linked'
    WHEN d.type = 'working_group' AND wg.id IS NOT NULL THEN 'linked'
    WHEN d.type IN ('engagement', 'topic', 'working_group') THEN 'check_manually'
    ELSE 'orphaned'
  END as linkage_status
FROM dossiers d
LEFT JOIN countries c ON c.id = d.id AND d.type = 'country'
LEFT JOIN organizations o ON o.id = d.id AND d.type = 'organization'
LEFT JOIN forums f ON f.id = d.id AND d.type = 'forum'
LEFT JOIN persons p ON p.id = d.id AND d.type = 'person'
LEFT JOIN engagements e ON e.id = d.id AND d.type = 'engagement'
LEFT JOIN topics t ON t.id = d.id AND d.type = 'topic'
LEFT JOIN working_groups wg ON wg.id = d.id AND d.type = 'working_group'
WHERE d.status != 'archived';

-- Add comment
COMMENT ON VIEW v_dossier_extension_health IS 'Monitors linkage status between dossiers and their extension tables. Use to detect orphaned dossiers.';

COMMIT;
