-- P87-08: additive p_engagement_types TEXT[] so the UI's engagement-type BUCKETS
-- (meeting/travel/event -> many engagement_type values) can be served by the SAME
-- predicate path as the list + its exact count, replacing a divergent direct-PostgREST
-- query that used an invalid `dossier:id(...)` embed (400s) and bypassed the
-- archived-exclusion / dossier-name-search predicates.
--
-- Strict superset: p_engagement_types DEFAULT NULL reproduces the prior behavior
-- byte-for-byte. p_engagement_type is retained (the engagement-dossiers edge function
-- passes it). DROP+CREATE in one transaction so no overload ambiguity and no
-- visibility gap for concurrent callers.

DROP FUNCTION IF EXISTS search_engagements_advanced(
  TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER
);

CREATE FUNCTION search_engagements_advanced(
  p_search_term TEXT DEFAULT NULL,
  p_engagement_type TEXT DEFAULT NULL,
  p_engagement_category TEXT DEFAULT NULL,
  p_engagement_status TEXT DEFAULT NULL,
  p_host_country_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_engagement_types TEXT[] DEFAULT NULL
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
    AND (p_engagement_types IS NULL OR ed.engagement_type = ANY(p_engagement_types))
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

COMMENT ON FUNCTION search_engagements_advanced IS 'Advanced engagement search with multiple filter options (G11: corrected dossier type filter from engagement_dossier -> engagement; P87-08: additive p_engagement_types TEXT[] for UI type buckets — NULL reproduces prior behavior)';

GRANT EXECUTE ON FUNCTION search_engagements_advanced(
  TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER, TEXT[]
) TO anon, authenticated, service_role;
