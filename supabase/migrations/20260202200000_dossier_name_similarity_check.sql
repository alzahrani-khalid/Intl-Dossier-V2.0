-- Migration: Dossier Name Similarity Check
-- Feature: P1 - Real-time duplicate detection during dossier creation
-- Date: 2026-02-02
-- Description: Creates an RPC function to check for similar dossier names using pg_trgm

-- Ensure pg_trgm is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- Function: check_dossier_name_similarity
-- Checks for existing dossiers with similar names
-- ============================================================================

CREATE OR REPLACE FUNCTION check_dossier_name_similarity(
  p_name_en TEXT,
  p_name_ar TEXT DEFAULT NULL,
  p_dossier_type TEXT DEFAULT NULL,
  p_similarity_threshold NUMERIC DEFAULT 0.4,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  type TEXT,
  status TEXT,
  similarity_score_en NUMERIC,
  similarity_score_ar NUMERIC,
  highest_similarity NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name_en,
    d.name_ar,
    d.type,
    d.status,
    ROUND(similarity(LOWER(TRIM(d.name_en)), LOWER(TRIM(p_name_en)))::NUMERIC, 4) AS similarity_score_en,
    CASE 
      WHEN p_name_ar IS NOT NULL AND d.name_ar IS NOT NULL 
      THEN ROUND(similarity(LOWER(TRIM(d.name_ar)), LOWER(TRIM(p_name_ar)))::NUMERIC, 4)
      ELSE 0::NUMERIC
    END AS similarity_score_ar,
    GREATEST(
      ROUND(similarity(LOWER(TRIM(d.name_en)), LOWER(TRIM(p_name_en)))::NUMERIC, 4),
      CASE 
        WHEN p_name_ar IS NOT NULL AND d.name_ar IS NOT NULL 
        THEN ROUND(similarity(LOWER(TRIM(d.name_ar)), LOWER(TRIM(p_name_ar)))::NUMERIC, 4)
        ELSE 0::NUMERIC
      END
    ) AS highest_similarity
  FROM dossiers d
  WHERE 
    -- Only check active dossiers
    d.status NOT IN ('deleted', 'archived')
    -- Filter by type if specified
    AND (p_dossier_type IS NULL OR d.type = p_dossier_type)
    -- Only return results above threshold
    AND (
      similarity(LOWER(TRIM(d.name_en)), LOWER(TRIM(p_name_en))) >= p_similarity_threshold
      OR (
        p_name_ar IS NOT NULL 
        AND d.name_ar IS NOT NULL 
        AND similarity(LOWER(TRIM(d.name_ar)), LOWER(TRIM(p_name_ar))) >= p_similarity_threshold
      )
    )
  ORDER BY highest_similarity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_dossier_name_similarity TO authenticated;
GRANT EXECUTE ON FUNCTION check_dossier_name_similarity TO service_role;

-- Add comment
COMMENT ON FUNCTION check_dossier_name_similarity IS 
  'Checks for existing dossiers with similar names using pg_trgm similarity. '
  'Returns up to 5 similar dossiers sorted by similarity score. '
  'Used for duplicate detection during dossier creation.';

-- Create index for faster similarity searches (if not exists)
CREATE INDEX IF NOT EXISTS idx_dossiers_name_en_trgm ON dossiers USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dossiers_name_ar_trgm ON dossiers USING gin (name_ar gin_trgm_ops);
