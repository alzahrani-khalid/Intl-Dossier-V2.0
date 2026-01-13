-- ============================================================================
-- Migration: Engagement Brief Linking
-- Date: 2026-01-10
-- Feature: engagement-brief-linking
-- Description: Link AI-generated briefs to engagement dossiers with automatic
--              context gathering.
-- ============================================================================

-- ============================================================================
-- PART 1: Add engagement_dossier_id column to briefs table
-- ============================================================================

-- Add engagement_dossier_id to briefs table
ALTER TABLE briefs
ADD COLUMN IF NOT EXISTS engagement_dossier_id UUID REFERENCES engagement_dossiers(id) ON DELETE CASCADE;

-- Add index for engagement_dossier_id
CREATE INDEX IF NOT EXISTS idx_briefs_engagement_dossier ON briefs(engagement_dossier_id)
WHERE engagement_dossier_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN briefs.engagement_dossier_id IS 'Link to engagement dossier for pre-meeting briefs';

-- ============================================================================
-- PART 2: Add engagement_dossier_id column to ai_briefs table
-- ============================================================================

-- Add engagement_dossier_id to ai_briefs table (separate from legacy engagement_id)
ALTER TABLE ai_briefs
ADD COLUMN IF NOT EXISTS engagement_dossier_id UUID REFERENCES engagement_dossiers(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_ai_briefs_engagement_dossier ON ai_briefs(engagement_dossier_id)
WHERE engagement_dossier_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN ai_briefs.engagement_dossier_id IS 'Link to engagement dossier for AI-generated pre-meeting briefs';

-- ============================================================================
-- PART 3: Create engagement_briefs VIEW for unified access
-- ============================================================================

CREATE OR REPLACE VIEW engagement_briefs AS
-- Briefs linked to engagements via new engagement_dossier_id
SELECT
  b.id,
  'legacy' AS brief_type,
  b.engagement_dossier_id,
  b.country_id AS source_dossier_id,
  b.organization_id,
  b.created_by,
  -- Content (using existing columns)
  b.title AS title_en,
  b.summary AS summary_en,
  b.content AS full_content_en,
  -- Arabic (fallback to English)
  b.title AS title_ar,
  b.summary AS summary_ar,
  b.content AS full_content_ar,
  -- Metadata
  b.status::TEXT AS status,
  'legacy' AS source,
  NULL::TIMESTAMPTZ AS date_range_start,
  NULL::TIMESTAMPTZ AS date_range_end,
  b.created_at,
  b.updated_at AS completed_at,
  NULL::JSONB AS citations,
  b.parameters AS generation_params
FROM briefs b
WHERE b.engagement_dossier_id IS NOT NULL
  AND b.is_deleted = FALSE

UNION ALL

-- AI briefs linked to engagement dossiers
SELECT
  ab.id,
  'ai' AS brief_type,
  ab.engagement_dossier_id,
  ab.dossier_id AS source_dossier_id,
  ab.organization_id,
  ab.created_by,
  -- Content (English - AI briefs are single language)
  ab.title AS title_en,
  ab.executive_summary AS summary_en,
  ab.full_content AS full_content_en,
  -- Content (Arabic - same content, will be translated at display time)
  ab.title AS title_ar,
  ab.executive_summary AS summary_ar,
  ab.full_content AS full_content_ar,
  -- Metadata
  ab.status::TEXT,
  'ai' AS source,
  NULL::TIMESTAMPTZ AS date_range_start,
  NULL::TIMESTAMPTZ AS date_range_end,
  ab.created_at,
  ab.completed_at,
  ab.citations,
  ab.generation_params
FROM ai_briefs ab
WHERE ab.engagement_dossier_id IS NOT NULL;

COMMENT ON VIEW engagement_briefs IS 'Unified view of all briefs linked to engagement dossiers';

-- ============================================================================
-- PART 4: Helper Functions
-- ============================================================================

-- Function: Get briefs for an engagement dossier
CREATE OR REPLACE FUNCTION get_engagement_briefs(p_engagement_id UUID)
RETURNS TABLE (
  id UUID,
  brief_type TEXT,
  title TEXT,
  summary TEXT,
  status TEXT,
  source TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  has_citations BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eb.id,
    eb.brief_type,
    COALESCE(eb.title_en, eb.title_ar) AS title,
    COALESCE(eb.summary_en, eb.summary_ar) AS summary,
    eb.status,
    eb.source,
    eb.created_at,
    eb.completed_at,
    eb.created_by,
    (eb.citations IS NOT NULL AND eb.citations != '[]'::JSONB) AS has_citations
  FROM engagement_briefs eb
  WHERE eb.engagement_dossier_id = p_engagement_id
  ORDER BY eb.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_engagement_briefs(UUID) IS 'Get all briefs linked to an engagement dossier';

-- Function: Get engagement context for brief generation
CREATE OR REPLACE FUNCTION get_engagement_brief_context(p_engagement_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Engagement details
    'engagement', (
      SELECT row_to_json(e)
      FROM (
        SELECT
          ed.id,
          d.name_en,
          d.name_ar,
          d.description_en,
          d.description_ar,
          ed.engagement_type,
          ed.engagement_category,
          ed.start_date,
          ed.end_date,
          ed.location_en,
          ed.location_ar,
          ed.objectives_en,
          ed.objectives_ar,
          ed.engagement_status
        FROM engagement_dossiers ed
        JOIN dossiers d ON d.id = ed.id
        WHERE ed.id = p_engagement_id
      ) e
    ),

    -- Participants with dossier info
    'participants', (
      SELECT json_agg(json_build_object(
        'id', ep.id,
        'role', ep.role,
        'participant_type', ep.participant_type,
        'name_en', COALESCE(pd.name_en, ep.external_name_en),
        'name_ar', COALESCE(pd.name_ar, ep.external_name_ar),
        'title_en', ep.external_title_en,
        'title_ar', ep.external_title_ar,
        'dossier_id', ep.participant_dossier_id,
        'dossier_type', pd.type
      ))
      FROM engagement_participants ep
      LEFT JOIN dossiers pd ON pd.id = ep.participant_dossier_id
      WHERE ep.engagement_id = p_engagement_id
    ),

    -- Agenda items
    'agenda', (
      SELECT json_agg(json_build_object(
        'id', ea.id,
        'order_number', ea.order_number,
        'title_en', ea.title_en,
        'title_ar', ea.title_ar,
        'description_en', ea.description_en,
        'description_ar', ea.description_ar,
        'item_status', ea.item_status
      ) ORDER BY ea.order_number)
      FROM engagement_agenda ea
      WHERE ea.engagement_id = p_engagement_id
    ),

    -- Host country info
    'host_country', (
      SELECT row_to_json(hc)
      FROM (
        SELECT d.id, d.name_en, d.name_ar, d.type
        FROM dossiers d
        JOIN engagement_dossiers ed ON d.id = ed.host_country_id
        WHERE ed.id = p_engagement_id
      ) hc
    ),

    -- Host organization info
    'host_organization', (
      SELECT row_to_json(ho)
      FROM (
        SELECT d.id, d.name_en, d.name_ar, d.type
        FROM dossiers d
        JOIN engagement_dossiers ed ON d.id = ed.host_organization_id
        WHERE ed.id = p_engagement_id
      ) ho
    ),

    -- Related positions (from participant dossiers)
    'positions', (
      SELECT json_agg(DISTINCT jsonb_build_object(
        'id', p.id,
        'title_en', p.title_en,
        'title_ar', p.title_ar,
        'position_type', p.position_type,
        'stance', p.stance,
        'dossier_id', p.dossier_id,
        'dossier_name_en', d.name_en,
        'dossier_name_ar', d.name_ar
      ))
      FROM positions p
      JOIN dossiers d ON d.id = p.dossier_id
      JOIN engagement_participants ep ON ep.participant_dossier_id = p.dossier_id
      WHERE ep.engagement_id = p_engagement_id
        AND p.status = 'active'
      LIMIT 20
    ),

    -- Previous briefs count
    'previous_briefs_count', (
      SELECT COUNT(*)::INTEGER
      FROM engagement_briefs eb
      WHERE eb.engagement_dossier_id = p_engagement_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_engagement_brief_context(UUID) IS 'Get comprehensive context for generating an engagement brief';

-- Function: Link existing brief to engagement
CREATE OR REPLACE FUNCTION link_brief_to_engagement(
  p_brief_id UUID,
  p_engagement_id UUID,
  p_brief_type TEXT DEFAULT 'legacy'
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  IF p_brief_type = 'legacy' THEN
    UPDATE briefs
    SET engagement_dossier_id = p_engagement_id
    WHERE id = p_brief_id
      AND engagement_dossier_id IS NULL;
    v_updated := FOUND;
  ELSIF p_brief_type = 'ai' THEN
    UPDATE ai_briefs
    SET engagement_dossier_id = p_engagement_id
    WHERE id = p_brief_id
      AND engagement_dossier_id IS NULL;
    v_updated := FOUND;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_brief_to_engagement(UUID, UUID, TEXT) IS 'Link an existing brief to an engagement dossier';

-- Function: Unlink brief from engagement
CREATE OR REPLACE FUNCTION unlink_brief_from_engagement(
  p_brief_id UUID,
  p_brief_type TEXT DEFAULT 'legacy'
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  IF p_brief_type = 'legacy' THEN
    UPDATE briefs
    SET engagement_dossier_id = NULL
    WHERE id = p_brief_id
      AND engagement_dossier_id IS NOT NULL;
    v_updated := FOUND;
  ELSIF p_brief_type = 'ai' THEN
    UPDATE ai_briefs
    SET engagement_dossier_id = NULL
    WHERE id = p_brief_id
      AND engagement_dossier_id IS NOT NULL;
    v_updated := FOUND;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION unlink_brief_from_engagement(UUID, TEXT) IS 'Remove link between a brief and an engagement dossier';
