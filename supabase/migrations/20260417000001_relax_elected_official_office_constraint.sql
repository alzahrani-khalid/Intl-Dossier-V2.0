-- ============================================================================
-- Migration: Relax persons_elected_official_requires_office CHECK constraint
-- Date: 2026-04-17
-- Phase: 30 (Elected Official Wizard) — D-19
-- Description: Allow Arabic-only office_name for elected officials.
--              Previously required office_name_en IS NOT NULL.
--              Now requires at least one of office_name_en / office_name_ar.
-- Rollback: DROP CONSTRAINT persons_elected_official_requires_office;
--           ADD CONSTRAINT persons_elected_official_requires_office
--             CHECK (person_subtype != 'elected_official' OR office_name_en IS NOT NULL);
-- ============================================================================

DO $$
BEGIN
  -- Drop old constraint if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'persons_elected_official_requires_office'
  ) THEN
    ALTER TABLE persons DROP CONSTRAINT persons_elected_official_requires_office;
  END IF;

  -- Re-add relaxed constraint: at least one of EN/AR
  ALTER TABLE persons ADD CONSTRAINT persons_elected_official_requires_office
    CHECK (
      person_subtype != 'elected_official'
      OR office_name_en IS NOT NULL
      OR office_name_ar IS NOT NULL
    );
END $$;

COMMENT ON CONSTRAINT persons_elected_official_requires_office ON persons IS
  'Phase 30 (D-19): Elected officials must have at least one of office_name_en or office_name_ar populated.';
