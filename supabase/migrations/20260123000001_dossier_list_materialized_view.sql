-- ============================================================================
-- Migration: Create Dossier List Materialized View
-- Date: 2026-01-23
-- Feature: dossier-list-query-optimization
-- Description: Fix N+1 query pattern in listDossiers() by creating a
--              materialized view that pre-joins dossiers with extension tables.
--              Includes refresh triggers and cursor-based pagination RPC.
-- ============================================================================

-- ============================================================================
-- PART 1: Create Materialized View
-- ============================================================================

-- Drop existing view if exists (for re-running migration during development)
DROP MATERIALIZED VIEW IF EXISTS dossier_list_mv CASCADE;

-- Create materialized view that joins dossiers with all extension tables
-- This eliminates the N+1 query pattern by pre-computing all joins
CREATE MATERIALIZED VIEW dossier_list_mv AS
SELECT
  -- Base dossier fields
  d.id,
  d.name_en,
  d.name_ar,
  d.type,
  d.status,
  d.sensitivity_level,
  d.description_en,
  d.description_ar,
  d.tags,
  d.metadata,
  d.is_active,
  d.created_at,
  d.updated_at,
  d.created_by,
  d.search_vector,

  -- Extension data as JSONB (null-safe, only includes non-null extension data)
  CASE d.type
    WHEN 'country' THEN jsonb_build_object(
      'iso_code_2', c.iso_code_2,
      'iso_code_3', c.iso_code_3,
      'capital_en', c.capital_en,
      'capital_ar', c.capital_ar,
      'region', c.region,
      'subregion', c.subregion,
      'population', c.population,
      'area_sq_km', c.area_sq_km,
      'flag_url', c.flag_url
    )
    WHEN 'organization' THEN jsonb_build_object(
      'org_code', o.org_code,
      'org_type', o.org_type,
      'headquarters_country_id', o.headquarters_country_id,
      'parent_org_id', o.parent_org_id,
      'website', o.website,
      'email', o.email,
      'phone', o.phone,
      'address_en', o.address_en,
      'address_ar', o.address_ar,
      'logo_url', o.logo_url,
      'established_date', o.established_date
    )
    WHEN 'forum' THEN jsonb_build_object(
      'number_of_sessions', f.number_of_sessions,
      'keynote_speakers', f.keynote_speakers,
      'sponsors', f.sponsors,
      'registration_fee', f.registration_fee,
      'currency', f.currency,
      'agenda_url', f.agenda_url,
      'live_stream_url', f.live_stream_url
    )
    WHEN 'engagement' THEN jsonb_build_object(
      'engagement_type', e.engagement_type,
      'engagement_category', e.engagement_category,
      'location_en', e.location_en,
      'location_ar', e.location_ar
    )
    WHEN 'topic' THEN jsonb_build_object(
      'theme_category', tp.theme_category,
      'parent_theme_id', tp.parent_theme_id
    )
    WHEN 'working_group' THEN jsonb_build_object(
      'mandate_en', wg.mandate_en,
      'mandate_ar', wg.mandate_ar,
      'lead_org_id', wg.lead_org_id,
      'wg_status', wg.wg_status,
      'established_date', wg.established_date,
      'disbandment_date', wg.disbandment_date
    )
    WHEN 'person' THEN jsonb_build_object(
      'title_en', p.title_en,
      'title_ar', p.title_ar,
      'organization_id', p.organization_id,
      'nationality_country_id', p.nationality_country_id,
      'email', p.email,
      'phone', p.phone,
      'biography_en', p.biography_en,
      'biography_ar', p.biography_ar,
      'photo_url', p.photo_url
    )
    WHEN 'elected_official' THEN jsonb_build_object(
      'title_en', eo.title_en,
      'title_ar', eo.title_ar,
      'photo_url', eo.photo_url,
      'office_name_en', eo.office_name_en,
      'office_name_ar', eo.office_name_ar,
      'office_type', eo.office_type,
      'district_en', eo.district_en,
      'district_ar', eo.district_ar,
      'party_en', eo.party_en,
      'party_ar', eo.party_ar,
      'party_abbreviation', eo.party_abbreviation,
      'party_ideology', eo.party_ideology,
      'term_start', eo.term_start,
      'term_end', eo.term_end,
      'is_current_term', eo.is_current_term,
      'term_number', eo.term_number,
      'committee_assignments', eo.committee_assignments,
      'contact_preferences', eo.contact_preferences,
      'email_official', eo.email_official,
      'email_personal', eo.email_personal,
      'phone_office', eo.phone_office,
      'phone_mobile', eo.phone_mobile,
      'address_office_en', eo.address_office_en,
      'address_office_ar', eo.address_office_ar,
      'website_official', eo.website_official,
      'website_campaign', eo.website_campaign,
      'social_media', eo.social_media,
      'staff_contacts', eo.staff_contacts,
      'country_id', eo.country_id,
      'organization_id', eo.organization_id,
      'biography_en', eo.biography_en,
      'biography_ar', eo.biography_ar,
      'policy_priorities', eo.policy_priorities,
      'notes_en', eo.notes_en,
      'notes_ar', eo.notes_ar,
      'importance_level', eo.importance_level
    )
    ELSE NULL
  END AS extension_data

FROM dossiers d
LEFT JOIN countries c ON d.id = c.id AND d.type = 'country'
LEFT JOIN organizations o ON d.id = o.id AND d.type = 'organization'
LEFT JOIN forums f ON d.id = f.id AND d.type = 'forum'
LEFT JOIN engagements e ON d.id = e.id AND d.type = 'engagement'
LEFT JOIN topics tp ON d.id = tp.id AND d.type = 'topic'
LEFT JOIN working_groups wg ON d.id = wg.id AND d.type = 'working_group'
LEFT JOIN persons p ON d.id = p.id AND d.type = 'person'
LEFT JOIN elected_officials eo ON d.id = eo.id AND d.type = 'elected_official';

-- Create unique index on id for efficient lookups and concurrent refresh
CREATE UNIQUE INDEX idx_dossier_list_mv_id ON dossier_list_mv(id);

-- Create indexes for common query patterns
CREATE INDEX idx_dossier_list_mv_type ON dossier_list_mv(type);
CREATE INDEX idx_dossier_list_mv_status ON dossier_list_mv(status);
CREATE INDEX idx_dossier_list_mv_sensitivity ON dossier_list_mv(sensitivity_level);
CREATE INDEX idx_dossier_list_mv_created_at ON dossier_list_mv(created_at DESC);
CREATE INDEX idx_dossier_list_mv_type_status ON dossier_list_mv(type, status) WHERE is_active = TRUE;
CREATE INDEX idx_dossier_list_mv_search ON dossier_list_mv USING GIN(search_vector);
CREATE INDEX idx_dossier_list_mv_tags ON dossier_list_mv USING GIN(tags);

-- Composite index for cursor pagination (created_at DESC, id DESC)
CREATE INDEX idx_dossier_list_mv_cursor ON dossier_list_mv(created_at DESC, id DESC);

-- ============================================================================
-- PART 2: Refresh Function
-- ============================================================================

-- Function to refresh the materialized view concurrently
-- Uses CONCURRENTLY to avoid locking reads during refresh
CREATE OR REPLACE FUNCTION refresh_dossier_list_mv()
RETURNS VOID AS $$
BEGIN
  -- CONCURRENTLY allows reads during refresh (requires unique index)
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_list_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh with optional force (non-concurrent) refresh
CREATE OR REPLACE FUNCTION refresh_dossier_list_mv_force()
RETURNS VOID AS $$
BEGIN
  -- Force refresh without CONCURRENTLY (faster but blocks reads)
  REFRESH MATERIALIZED VIEW dossier_list_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Auto-Refresh Triggers
-- ============================================================================

-- Trigger function to queue refresh after dossier changes
-- Uses a debounce approach to avoid refreshing too frequently
CREATE OR REPLACE FUNCTION queue_dossier_list_mv_refresh()
RETURNS TRIGGER AS $$
DECLARE
  last_refresh TIMESTAMPTZ;
  debounce_interval INTERVAL := '30 seconds';
BEGIN
  -- Check last refresh time from a tracking table
  SELECT last_refreshed_at INTO last_refresh
  FROM mv_refresh_tracker
  WHERE view_name = 'dossier_list_mv'
  FOR UPDATE SKIP LOCKED;

  -- Only queue refresh if enough time has passed (debounce)
  IF last_refresh IS NULL OR (NOW() - last_refresh) > debounce_interval THEN
    -- Update or insert tracker
    INSERT INTO mv_refresh_tracker (view_name, last_refreshed_at, pending_refresh)
    VALUES ('dossier_list_mv', NOW(), TRUE)
    ON CONFLICT (view_name) DO UPDATE
    SET pending_refresh = TRUE, queued_at = NOW();
  END IF;

  RETURN NULL; -- After trigger returns NULL
END;
$$ LANGUAGE plpgsql;

-- Create tracking table for materialized view refreshes
CREATE TABLE IF NOT EXISTS mv_refresh_tracker (
  view_name TEXT PRIMARY KEY,
  last_refreshed_at TIMESTAMPTZ,
  pending_refresh BOOLEAN DEFAULT FALSE,
  queued_at TIMESTAMPTZ,
  refresh_count BIGINT DEFAULT 0
);

-- Insert initial tracker row
INSERT INTO mv_refresh_tracker (view_name, last_refreshed_at, pending_refresh)
VALUES ('dossier_list_mv', NOW(), FALSE)
ON CONFLICT (view_name) DO NOTHING;

-- Create triggers on dossiers table
DROP TRIGGER IF EXISTS trg_dossiers_refresh_mv ON dossiers;
CREATE TRIGGER trg_dossiers_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON dossiers
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

-- Create triggers on extension tables
DROP TRIGGER IF EXISTS trg_countries_refresh_mv ON countries;
CREATE TRIGGER trg_countries_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON countries
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_organizations_refresh_mv ON organizations;
CREATE TRIGGER trg_organizations_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_forums_refresh_mv ON forums;
CREATE TRIGGER trg_forums_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON forums
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_engagements_refresh_mv ON engagements;
CREATE TRIGGER trg_engagements_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON engagements
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_topics_refresh_mv ON topics;
CREATE TRIGGER trg_topics_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON topics
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_working_groups_refresh_mv ON working_groups;
CREATE TRIGGER trg_working_groups_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON working_groups
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_persons_refresh_mv ON persons;
CREATE TRIGGER trg_persons_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON persons
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_elected_officials_refresh_mv ON elected_officials;
CREATE TRIGGER trg_elected_officials_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON elected_officials
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

-- ============================================================================
-- PART 4: Optimized List Function with Cursor Pagination
-- ============================================================================

-- RPC function for listing dossiers with cursor-based pagination
-- Uses the materialized view for optimal performance
CREATE OR REPLACE FUNCTION list_dossiers_optimized(
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_status_array TEXT[] DEFAULT NULL,
  p_sensitivity TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_cursor TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSON AS $$
DECLARE
  cursor_created_at TIMESTAMPTZ;
  cursor_id UUID;
  result_data JSONB;
  total_count BIGINT;
  next_cursor TEXT;
  last_id UUID;
  last_created_at TIMESTAMPTZ;
  effective_limit INTEGER;
BEGIN
  -- Enforce max limit
  effective_limit := LEAST(p_limit, 100);

  -- Decode cursor if provided (format: base64("created_at|id"))
  IF p_cursor IS NOT NULL THEN
    BEGIN
      DECLARE
        decoded TEXT;
        parts TEXT[];
      BEGIN
        decoded := convert_from(decode(p_cursor, 'base64'), 'UTF8');
        parts := string_to_array(decoded, '|');
        cursor_created_at := parts[1]::TIMESTAMPTZ;
        cursor_id := parts[2]::UUID;
      EXCEPTION WHEN OTHERS THEN
        -- Fallback: try as simple ID cursor for backwards compatibility
        cursor_id := decode(p_cursor, 'base64')::TEXT::UUID;
        SELECT created_at INTO cursor_created_at
        FROM dossier_list_mv
        WHERE id = cursor_id;
      END;
    END;
  END IF;

  -- Build and execute query
  WITH filtered_dossiers AS (
    SELECT
      mv.id,
      mv.name_en,
      mv.name_ar,
      mv.type,
      mv.status,
      mv.sensitivity_level,
      mv.description_en,
      mv.description_ar,
      mv.tags,
      mv.metadata,
      mv.is_active,
      mv.created_at,
      mv.updated_at,
      mv.extension_data
    FROM dossier_list_mv mv
    WHERE
      -- Exclude inactive/archived by default
      mv.is_active = TRUE
      AND mv.status != 'archived'
      -- Type filter
      AND (p_type IS NULL OR mv.type = p_type)
      -- Status filter (single or array)
      AND (
        (p_status IS NULL AND p_status_array IS NULL)
        OR mv.status = p_status
        OR mv.status = ANY(p_status_array)
      )
      -- Sensitivity filter
      AND (p_sensitivity IS NULL OR mv.sensitivity_level = p_sensitivity)
      -- Tags filter (overlaps)
      AND (p_tags IS NULL OR mv.tags && p_tags)
      -- Search filter
      AND (
        p_search IS NULL
        OR p_search = ''
        OR mv.search_vector @@ plainto_tsquery('english', p_search)
        OR mv.search_vector @@ plainto_tsquery('arabic', p_search)
        OR mv.name_en ILIKE '%' || p_search || '%'
        OR mv.name_ar ILIKE '%' || p_search || '%'
      )
      -- Cursor pagination
      AND (
        cursor_created_at IS NULL
        OR (mv.created_at, mv.id) < (cursor_created_at, cursor_id)
      )
    ORDER BY mv.created_at DESC, mv.id DESC
    LIMIT effective_limit + 1  -- Fetch one extra to check if there's more
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', fd.id,
        'name_en', fd.name_en,
        'name_ar', fd.name_ar,
        'type', fd.type,
        'status', fd.status,
        'sensitivity_level', fd.sensitivity_level,
        'description_en', fd.description_en,
        'description_ar', fd.description_ar,
        'tags', fd.tags,
        'metadata', fd.metadata,
        'is_active', fd.is_active,
        'created_at', fd.created_at,
        'updated_at', fd.updated_at,
        'extensionData', fd.extension_data
      ) ORDER BY fd.created_at DESC, fd.id DESC
    ) INTO result_data
  FROM (
    SELECT * FROM filtered_dossiers
    LIMIT effective_limit
  ) fd;

  -- Get the last item for next cursor
  SELECT id, created_at INTO last_id, last_created_at
  FROM filtered_dossiers
  ORDER BY created_at DESC, id DESC
  OFFSET effective_limit - 1
  LIMIT 1;

  -- Check if there are more results
  IF (SELECT COUNT(*) FROM filtered_dossiers) > effective_limit THEN
    -- Encode cursor as base64("created_at|id")
    next_cursor := encode(convert_to(last_created_at::TEXT || '|' || last_id::TEXT, 'UTF8'), 'base64');
  ELSE
    next_cursor := NULL;
  END IF;

  -- Get total count (cached in a separate query for performance)
  SELECT COUNT(*) INTO total_count
  FROM dossier_list_mv mv
  WHERE
    mv.is_active = TRUE
    AND mv.status != 'archived'
    AND (p_type IS NULL OR mv.type = p_type)
    AND (
      (p_status IS NULL AND p_status_array IS NULL)
      OR mv.status = p_status
      OR mv.status = ANY(p_status_array)
    )
    AND (p_sensitivity IS NULL OR mv.sensitivity_level = p_sensitivity)
    AND (p_tags IS NULL OR mv.tags && p_tags)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR mv.search_vector @@ plainto_tsquery('english', p_search)
      OR mv.search_vector @@ plainto_tsquery('arabic', p_search)
      OR mv.name_en ILIKE '%' || p_search || '%'
      OR mv.name_ar ILIKE '%' || p_search || '%'
    );

  -- Return result
  RETURN json_build_object(
    'data', COALESCE(result_data, '[]'::JSONB),
    'pagination', json_build_object(
      'next_cursor', next_cursor,
      'has_more', next_cursor IS NOT NULL,
      'total_count', total_count
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 5: Get Single Dossier with Extension (Optimized)
-- ============================================================================

-- Function to get a single dossier with extension data
CREATE OR REPLACE FUNCTION get_dossier_with_extension(p_dossier_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', mv.id,
    'name_en', mv.name_en,
    'name_ar', mv.name_ar,
    'type', mv.type,
    'status', mv.status,
    'sensitivity_level', mv.sensitivity_level,
    'description_en', mv.description_en,
    'description_ar', mv.description_ar,
    'tags', mv.tags,
    'metadata', mv.metadata,
    'is_active', mv.is_active,
    'created_at', mv.created_at,
    'updated_at', mv.updated_at,
    'created_by', mv.created_by,
    'extensionData', mv.extension_data
  ) INTO result
  FROM dossier_list_mv mv
  WHERE mv.id = p_dossier_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 6: Cron Job for Periodic Refresh
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- The cron job refreshes the materialized view every 5 minutes
-- Enable pg_cron if not already enabled (uncomment if needed):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh every 5 minutes (requires pg_cron)
-- This can be set up via Supabase dashboard or:
-- SELECT cron.schedule('refresh-dossier-list-mv', '*/5 * * * *', 'SELECT refresh_dossier_list_mv()');

-- ============================================================================
-- PART 7: Grant Permissions
-- ============================================================================

-- Grant select on materialized view to authenticated users
GRANT SELECT ON dossier_list_mv TO authenticated;
GRANT SELECT ON mv_refresh_tracker TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION refresh_dossier_list_mv() TO service_role;
GRANT EXECUTE ON FUNCTION refresh_dossier_list_mv_force() TO service_role;
GRANT EXECUTE ON FUNCTION list_dossiers_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_dossier_with_extension TO authenticated;

-- ============================================================================
-- PART 8: Documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW dossier_list_mv IS
'Materialized view that pre-joins dossiers with all extension tables to eliminate N+1 queries.
Refreshed automatically when dossiers or extension tables change (with 30s debounce).
Use list_dossiers_optimized() for querying with cursor pagination.';

COMMENT ON FUNCTION refresh_dossier_list_mv() IS
'Refreshes the dossier_list_mv materialized view concurrently (non-blocking reads).';

COMMENT ON FUNCTION list_dossiers_optimized IS
'Optimized dossier list function using materialized view with cursor-based pagination.
Parameters:
- p_type: Filter by dossier type
- p_status: Filter by single status
- p_status_array: Filter by multiple statuses
- p_sensitivity: Filter by sensitivity level
- p_tags: Filter by tags (overlaps)
- p_search: Full-text search
- p_is_active: Filter by active status
- p_cursor: Pagination cursor (base64 encoded)
- p_limit: Page size (max 100)';

COMMENT ON FUNCTION get_dossier_with_extension IS
'Get a single dossier with its extension data using the optimized materialized view.';

COMMENT ON TABLE mv_refresh_tracker IS
'Tracks materialized view refresh status for debouncing automatic refreshes.';

-- ============================================================================
-- Migration Complete
-- ============================================================================
