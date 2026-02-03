-- Migration: Create QuickSwitcher Search RPC
-- Feature: Command K Search Optimization
-- Date: 2026-02-02
-- Description: Unified search function for fast QuickSwitcher results using GIN indexes

-- Drop existing function if exists
DROP FUNCTION IF EXISTS quickswitcher_search_v2(text, integer);

/**
 * quickswitcher_search_v2
 *
 * Unified search function for QuickSwitcher (Cmd+K) that searches across:
 * - Dossiers (using GIN-indexed search_vector)
 * - Positions (using GIN-indexed search_vector)
 * - Tasks (using title text search)
 * - Commitments (using description text search)
 *
 * Performance target: <50ms for typical queries
 *
 * @param p_query - Search query text (min 2 characters)
 * @param p_limit - Max results to return (default 20)
 * @returns JSONB with grouped results: { dossiers: [...], positions: [...], tasks: [...], commitments: [...] }
 */
CREATE OR REPLACE FUNCTION quickswitcher_search_v2(
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_query_normalized text;
  v_tsquery tsquery;
  v_dossier_limit integer;
  v_work_limit integer;
  v_result jsonb;
BEGIN
  -- Validate input
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN jsonb_build_object(
      'dossiers', '[]'::jsonb,
      'positions', '[]'::jsonb,
      'tasks', '[]'::jsonb,
      'commitments', '[]'::jsonb,
      'error', 'Query must be at least 2 characters'
    );
  END IF;

  -- Normalize query
  v_query_normalized := lower(trim(p_query));

  -- Convert to tsquery with prefix matching for typeahead
  -- Use plainto_tsquery for multi-word, append :* for prefix matching
  BEGIN
    v_tsquery := to_tsquery('simple',
      regexp_replace(v_query_normalized, '\s+', ':* & ', 'g') || ':*'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to simple prefix search
    v_tsquery := to_tsquery('simple', v_query_normalized || ':*');
  END;

  -- Calculate limits: 60% dossiers, 40% work items
  v_dossier_limit := GREATEST(5, (p_limit * 6 / 10));
  v_work_limit := GREATEST(3, (p_limit * 4 / 10) / 3);

  -- Build result using CTEs for optimal query planning
  WITH
  -- Search dossiers using GIN index on search_vector
  dossier_matches AS (
    SELECT
      d.id,
      d.type,
      d.name_en,
      d.name_ar,
      d.description_en,
      d.description_ar,
      d.status,
      d.updated_at,
      -- Rank by: tsquery match > prefix match > contains
      CASE
        WHEN d.search_vector @@ v_tsquery THEN
          ts_rank_cd(d.search_vector, v_tsquery) + 1.0
        WHEN lower(d.name_en) LIKE v_query_normalized || '%' OR
             lower(d.name_ar) LIKE v_query_normalized || '%' THEN
          0.9
        WHEN lower(d.name_en) LIKE '%' || v_query_normalized || '%' OR
             lower(d.name_ar) LIKE '%' || v_query_normalized || '%' THEN
          0.5
        ELSE
          0.1
      END AS rank_score,
      CASE
        WHEN d.search_vector @@ v_tsquery THEN 'search_vector'
        WHEN lower(d.name_en) LIKE v_query_normalized || '%' THEN 'name_en_prefix'
        WHEN lower(d.name_ar) LIKE v_query_normalized || '%' THEN 'name_ar_prefix'
        ELSE 'contains'
      END AS matched_field
    FROM dossiers d
    WHERE
      d.status != 'deleted'
      AND (
        -- Primary: Use GIN index
        d.search_vector @@ v_tsquery
        -- Fallback: Trigram/LIKE for fuzzy matching
        OR lower(d.name_en) LIKE '%' || v_query_normalized || '%'
        OR lower(d.name_ar) LIKE '%' || v_query_normalized || '%'
      )
    ORDER BY rank_score DESC, d.updated_at DESC
    LIMIT v_dossier_limit
  ),

  -- Search positions using GIN index on search_vector
  position_matches AS (
    SELECT
      p.id,
      p.title_en,
      p.title_ar,
      p.status,
      p.updated_at,
      p.dossier_id,
      d.name_en AS dossier_name_en,
      d.name_ar AS dossier_name_ar,
      d.type AS dossier_type,
      CASE
        WHEN p.search_vector @@ v_tsquery THEN
          ts_rank_cd(p.search_vector, v_tsquery) + 1.0
        WHEN lower(p.title_en) LIKE v_query_normalized || '%' OR
             lower(p.title_ar) LIKE v_query_normalized || '%' THEN
          0.9
        ELSE
          0.5
      END AS rank_score,
      CASE
        WHEN p.search_vector @@ v_tsquery THEN 'search_vector'
        ELSE 'title'
      END AS matched_field
    FROM positions p
    LEFT JOIN dossiers d ON p.dossier_id = d.id
    WHERE
      p.status != 'archived'
      AND (
        p.search_vector @@ v_tsquery
        OR lower(p.title_en) LIKE '%' || v_query_normalized || '%'
        OR lower(p.title_ar) LIKE '%' || v_query_normalized || '%'
      )
    ORDER BY rank_score DESC, p.updated_at DESC
    LIMIT v_work_limit
  ),

  -- Search tasks (no search_vector, use LIKE)
  task_matches AS (
    SELECT
      t.id,
      t.title AS title_en,
      t.title AS title_ar,  -- Tasks only have single title field
      t.description,
      t.status,
      t.priority,
      t.sla_deadline AS deadline,
      t.updated_at,
      CASE
        WHEN lower(t.title) LIKE v_query_normalized || '%' THEN 0.9
        ELSE 0.5
      END AS rank_score,
      'title' AS matched_field
    FROM tasks t
    WHERE
      t.is_deleted = false
      AND t.status NOT IN ('cancelled', 'completed')
      AND lower(t.title) LIKE '%' || v_query_normalized || '%'
    ORDER BY rank_score DESC, t.updated_at DESC
    LIMIT v_work_limit
  ),

  -- Search commitments
  commitment_matches AS (
    SELECT
      c.id,
      COALESCE(
        NULLIF(LEFT(c.description, 100), ''),
        'Commitment'
      ) AS title_en,
      COALESCE(
        NULLIF(LEFT(c.description, 100), ''),
        'التزام'
      ) AS title_ar,
      c.description,
      c.status::text,
      c.priority::text,
      c.due_date::timestamptz AS deadline,
      c.updated_at,
      c.dossier_id,
      d.name_en AS dossier_name_en,
      d.name_ar AS dossier_name_ar,
      d.type AS dossier_type,
      0.5 AS rank_score,
      'description' AS matched_field
    FROM commitments c
    LEFT JOIN dossiers d ON c.dossier_id = d.id
    WHERE
      c.status NOT IN ('cancelled', 'completed')
      AND lower(c.description) LIKE '%' || v_query_normalized || '%'
    ORDER BY c.updated_at DESC
    LIMIT v_work_limit
  )

  -- Combine results into JSONB
  SELECT jsonb_build_object(
    'dossiers', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', dm.id,
        'type', dm.type,
        'name_en', dm.name_en,
        'name_ar', dm.name_ar,
        'description_en', dm.description_en,
        'description_ar', dm.description_ar,
        'status', dm.status,
        'relevance_score', dm.rank_score,
        'matched_field', dm.matched_field,
        'updated_at', dm.updated_at
      ) ORDER BY dm.rank_score DESC, dm.updated_at DESC)
      FROM dossier_matches dm),
      '[]'::jsonb
    ),
    'positions', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', pm.id,
        'type', 'position',
        'title_en', pm.title_en,
        'title_ar', pm.title_ar,
        'status', pm.status,
        'relevance_score', pm.rank_score,
        'matched_field', pm.matched_field,
        'updated_at', pm.updated_at,
        'dossier_context', CASE WHEN pm.dossier_id IS NOT NULL THEN
          jsonb_build_object(
            'id', pm.dossier_id,
            'type', pm.dossier_type,
            'name_en', pm.dossier_name_en,
            'name_ar', pm.dossier_name_ar
          )
        END
      ) ORDER BY pm.rank_score DESC, pm.updated_at DESC)
      FROM position_matches pm),
      '[]'::jsonb
    ),
    'tasks', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', tm.id,
        'type', 'task',
        'title_en', tm.title_en,
        'title_ar', tm.title_ar,
        'description_en', tm.description,
        'status', tm.status,
        'priority', tm.priority,
        'deadline', tm.deadline,
        'relevance_score', tm.rank_score,
        'matched_field', tm.matched_field,
        'updated_at', tm.updated_at
      ) ORDER BY tm.rank_score DESC, tm.updated_at DESC)
      FROM task_matches tm),
      '[]'::jsonb
    ),
    'commitments', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', cm.id,
        'type', 'commitment',
        'title_en', cm.title_en,
        'title_ar', cm.title_ar,
        'description_en', cm.description,
        'status', cm.status,
        'priority', cm.priority,
        'deadline', cm.deadline,
        'relevance_score', cm.rank_score,
        'matched_field', cm.matched_field,
        'updated_at', cm.updated_at,
        'dossier_context', CASE WHEN cm.dossier_id IS NOT NULL THEN
          jsonb_build_object(
            'id', cm.dossier_id,
            'type', cm.dossier_type,
            'name_en', cm.dossier_name_en,
            'name_ar', cm.dossier_name_ar
          )
        END
      ) ORDER BY cm.rank_score DESC, cm.updated_at DESC)
      FROM commitment_matches cm),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Add comment
COMMENT ON FUNCTION quickswitcher_search_v2 IS
'Unified search function for QuickSwitcher (Cmd+K). Uses GIN-indexed search_vector for fast full-text search. Returns JSONB with grouped results. Target: <50ms execution.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION quickswitcher_search_v2 TO authenticated;
