-- Migration: Add abbreviation column to dossiers table
-- Feature: Forum Dossier Creation Wizard improvements
-- Purpose: Support short codes/acronyms for all dossier types (e.g., WDF, WHO, ECOSOC, SDGs)

-- Add abbreviation column
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS abbreviation TEXT;

-- Add constraint to limit abbreviation length (max 20 characters for flexibility)
ALTER TABLE dossiers ADD CONSTRAINT dossiers_abbreviation_length_check
  CHECK (abbreviation IS NULL OR char_length(abbreviation) <= 20);

-- Add index for quick lookups by abbreviation
CREATE INDEX IF NOT EXISTS idx_dossiers_abbreviation ON dossiers (abbreviation)
  WHERE abbreviation IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN dossiers.abbreviation IS 'Short code or acronym for the dossier (e.g., WDF for World Data Forum, WHO for World Health Organization)';

-- Update search vector to include abbreviation for better discoverability
-- Note: This assumes there's an existing search_vector column. If not, this will be a no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'search_vector'
  ) THEN
    -- Update existing search vector trigger to include abbreviation
    -- The actual trigger function may need to be updated separately
    RAISE NOTICE 'Search vector column exists - abbreviation should be included in search trigger';
  END IF;
END $$;
