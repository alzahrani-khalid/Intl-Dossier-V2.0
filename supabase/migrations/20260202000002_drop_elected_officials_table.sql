-- ============================================================================
-- Migration: Drop Elected Officials Table
-- Date: 2026-02-02
-- Feature: Complete cleanup after merging elected_official into person
-- Description: Drop the elected_officials table and related objects after
--              successful migration of data to persons table
-- ============================================================================

-- NOTE: This migration should be run AFTER verifying that:
-- 1. All elected officials have been migrated to persons table
-- 2. All dossiers with type='elected_official' have been updated to type='person'
-- 3. Frontend and backend code has been updated to use person with subtype

-- ============================================================================
-- PART 1: Drop Helper Functions
-- ============================================================================

-- Drop elected official specific functions
DROP FUNCTION IF EXISTS get_elected_official_full(UUID);
DROP FUNCTION IF EXISTS search_elected_officials(TEXT, TEXT, UUID, TEXT, BOOLEAN, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_officials_needing_refresh(INTEGER);
DROP FUNCTION IF EXISTS mark_official_refreshed(UUID, BOOLEAN);

-- ============================================================================
-- PART 2: Drop RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view elected officials" ON elected_officials;
DROP POLICY IF EXISTS "Users can create elected officials" ON elected_officials;
DROP POLICY IF EXISTS "Users can update elected officials" ON elected_officials;
DROP POLICY IF EXISTS "Users can delete elected officials" ON elected_officials;

-- ============================================================================
-- PART 3: Drop Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS validate_elected_official_type ON elected_officials;
DROP TRIGGER IF EXISTS trigger_update_elected_officials_updated_at ON elected_officials;
DROP TRIGGER IF EXISTS trg_elected_officials_refresh_mv ON elected_officials;

-- ============================================================================
-- PART 4: Drop Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_elected_officials_office_type;
DROP INDEX IF EXISTS idx_elected_officials_country;
DROP INDEX IF EXISTS idx_elected_officials_organization;
DROP INDEX IF EXISTS idx_elected_officials_importance;
DROP INDEX IF EXISTS idx_elected_officials_current_term;
DROP INDEX IF EXISTS idx_elected_officials_term_dates;
DROP INDEX IF EXISTS idx_elected_officials_party;
DROP INDEX IF EXISTS idx_elected_officials_district;
DROP INDEX IF EXISTS idx_elected_officials_data_refresh;
DROP INDEX IF EXISTS idx_elected_officials_committees;
DROP INDEX IF EXISTS idx_elected_officials_policy_priorities;
DROP INDEX IF EXISTS idx_elected_officials_social_media;
DROP INDEX IF EXISTS idx_elected_officials_staff;
DROP INDEX IF EXISTS idx_elected_officials_search_vector;

-- ============================================================================
-- PART 5: Drop Trigger Function
-- ============================================================================

DROP FUNCTION IF EXISTS update_elected_officials_updated_at();

-- ============================================================================
-- PART 6: Drop Table
-- ============================================================================

DROP TABLE IF EXISTS elected_officials CASCADE;

-- ============================================================================
-- PART 7: Verification
-- ============================================================================

-- Verify migration was successful
DO $$
DECLARE
  elected_official_count INTEGER;
  person_elected_count INTEGER;
BEGIN
  -- Check no dossiers with type 'elected_official' remain
  SELECT COUNT(*) INTO elected_official_count
  FROM dossiers
  WHERE type = 'elected_official';

  IF elected_official_count > 0 THEN
    RAISE WARNING 'Found % dossiers still with type=elected_official', elected_official_count;
  END IF;

  -- Check persons with subtype 'elected_official' exist
  SELECT COUNT(*) INTO person_elected_count
  FROM persons
  WHERE person_subtype = 'elected_official';

  RAISE NOTICE 'Migration verification: % elected official persons found', person_elected_count;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
