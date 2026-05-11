-- Phase 40 Gap-Closure G11: fix search_engagements_advanced RPC type filter +
-- backfill engagement_dossiers extension rows for any dossiers WHERE type='engagement'
-- that lack one.
-- ----------------------------------------------------------------------------
-- Root cause (per 40-22-PLAN.md):
--   Canonical dossier type is 'engagement' (validated by trigger in migration
--   20260202400000_fix_extension_linkage.sql). The RPC search_engagements
--   in 20260110000006_create_engagement_dossiers.sql:485 filtered on the
--   wrong type discriminator (legacy underscore-suffixed value), so 0 rows
--   matched and the Phase 40 view rendered empty. The Edge Function
--   (engagement-dossiers) is patched in a separate code change + redeploy
--   (Task 5).
--
-- This migration:
--   1. Replaces the search_engagements RPC with a corrected body — full body
--      copied from 20260110000006 (lines 435-502), with the WHERE clause
--      type discriminator corrected to the canonical 'engagement'.
--      Security disposition unchanged (plpgsql STABLE, no SECURITY DEFINER).
--   2. Backfill engagement_dossiers extension rows for any dossiers row where
--      type='engagement' but no extension row exists. Idempotent via the
--      LEFT JOIN ... WHERE ed.id IS NULL pattern + ON CONFLICT (id) DO NOTHING.
--      No new dossier rows are created; RLS gating at SELECT time is unchanged.
--
-- Verification SQL:
--   SELECT (SELECT count(*) FROM dossiers WHERE type='engagement')::int AS dossier_count,
--          (SELECT count(*) FROM dossiers d
--             JOIN engagement_dossiers ed ON ed.id=d.id
--             WHERE d.type='engagement')::int AS joined_count,
--          (SELECT count(*) FROM search_engagements_advanced(
--             NULL, NULL, NULL, NULL, NULL, NULL, NULL, 50, 0))::int AS rpc_count;
--   Expected post-apply: dossier_count >= 3, joined_count >= 3, rpc_count >= 3.
-- ----------------------------------------------------------------------------

-- Section 1: corrected RPC body
CREATE OR REPLACE FUNCTION search_engagements_advanced(
  p_search_term TEXT DEFAULT NULL,
  p_engagement_type TEXT DEFAULT NULL,
  p_engagement_category TEXT DEFAULT NULL,
  p_engagement_status TEXT DEFAULT NULL,
  p_host_country_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  engagement_type TEXT,
  engagement_category TEXT,
  engagement_status TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN,
  host_country_id UUID,
  host_country_name_en TEXT,
  host_country_name_ar TEXT,
  participant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ed.id,
    d.name_en,
    d.name_ar,
    ed.engagement_type,
    ed.engagement_category,
    ed.engagement_status,
    ed.start_date,
    ed.end_date,
    ed.location_en,
    ed.location_ar,
    ed.is_virtual,
    ed.host_country_id,
    hc.name_en as host_country_name_en,
    hc.name_ar as host_country_name_ar,
    (SELECT COUNT(*) FROM engagement_participants ep WHERE ep.engagement_id = ed.id) as participant_count
  FROM engagement_dossiers ed
  JOIN dossiers d ON d.id = ed.id
  LEFT JOIN dossiers hc ON hc.id = ed.host_country_id
  WHERE d.status != 'archived'
    AND d.type = 'engagement'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR ed.location_en ILIKE '%' || p_search_term || '%'
      OR ed.objectives_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_engagement_type IS NULL OR ed.engagement_type = p_engagement_type)
    AND (p_engagement_category IS NULL OR ed.engagement_category = p_engagement_category)
    AND (p_engagement_status IS NULL OR ed.engagement_status = p_engagement_status)
    AND (p_host_country_id IS NULL OR ed.host_country_id = p_host_country_id)
    AND (p_start_date IS NULL OR ed.start_date >= p_start_date)
    AND (p_end_date IS NULL OR ed.end_date <= p_end_date)
  ORDER BY ed.start_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_engagements_advanced IS 'Advanced engagement search with multiple filter options (G11: corrected dossier type filter from engagement_dossier → engagement)';

-- Section 2: backfill extension rows for type='engagement' dossiers without one
INSERT INTO engagement_dossiers (
  id,
  engagement_type,
  engagement_category,
  engagement_status,
  start_date,
  end_date,
  location_en,
  location_ar,
  is_virtual,
  objectives_en,
  objectives_ar
)
SELECT
  d.id,
  'bilateral_meeting' AS engagement_type,
  'diplomatic' AS engagement_category,
  'planned' AS engagement_status,
  COALESCE(d.created_at, NOW()) AS start_date,
  COALESCE(d.created_at, NOW()) + INTERVAL '2 hours' AS end_date,
  'TBD' AS location_en,
  'يحدد لاحقًا' AS location_ar,
  FALSE AS is_virtual,
  COALESCE(d.description_en, 'Engagement objectives (backfilled by G11 closure).') AS objectives_en,
  COALESCE(d.description_ar, 'أهداف الارتباط (سد الثغرة G11).') AS objectives_ar
FROM dossiers d
LEFT JOIN engagement_dossiers ed ON ed.id = d.id
WHERE d.type = 'engagement'
  AND ed.id IS NULL
ON CONFLICT (id) DO NOTHING;
