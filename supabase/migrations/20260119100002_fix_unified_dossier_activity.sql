-- Migration: Fix Unified Dossier Activity RPC Function
-- Feature: 035-dossier-context
-- Date: 2026-01-19
-- Description: Fixes column references in get_unified_dossier_activities function
--              based on actual table schemas discovered during testing.

-- Schema summary from actual tables:
-- tasks: id, title, description (NO title_ar/description_ar), status, priority, assignee_id, engagement_id, sla_deadline, created_by, created_at, updated_at
-- commitments: id, title (NO title_ar), type, status, priority, responsible (jsonb), created_by, created_at, updated_at
-- intake_tickets: id, title, title_ar, description, description_ar, status, priority, dossier_id, assigned_to, created_by, created_at, updated_at
-- positions: id, title_en, title_ar, content_en, content_ar, status, author_id, created_at, updated_at
-- calendar_events: id, title_en, title_ar, description_en, description_ar, dossier_id, event_type, status, start_datetime, created_at, updated_at
-- dossier_relationships: id, source_dossier_id, target_dossier_id, relationship_type, notes_en, notes_ar, status, created_by, created_at
-- entity_comments: id, entity_type, entity_id, content, author_id, created_at, updated_at
-- documents: id, title (NO title_ar), type, classification, created_by, created_at, updated_at
-- activity_stream: id, action_type, entity_type, entity_id, entity_name_en, entity_name_ar, actor_id, actor_name, actor_email, description_en, description_ar, metadata, created_at
-- work_item_dossiers: id, work_item_type, work_item_id, dossier_id, inheritance_source, created_by, created_at

-- ============================================================================
-- Drop and recreate the function with correct column references
-- ============================================================================

DROP FUNCTION IF EXISTS get_unified_dossier_activities(UUID, TIMESTAMPTZ, INTEGER, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_unified_dossier_activities(
  p_dossier_id UUID,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_activity_types TEXT[] DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  action TEXT,
  title_en TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  "timestamp" TIMESTAMPTZ,
  actor_id UUID,
  actor_name TEXT,
  actor_email TEXT,
  actor_avatar_url TEXT,
  source_id UUID,
  source_table TEXT,
  inheritance_source TEXT,
  metadata JSONB,
  priority TEXT,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_effective_limit INTEGER;
BEGIN
  -- Cap limit to 100 maximum
  v_effective_limit := LEAST(COALESCE(p_limit, 20), 100);

  RETURN QUERY
  WITH all_activities AS (
    -- ===== TASKS (via work_item_dossiers junction) =====
    SELECT
      t.id,
      'task'::TEXT as activity_type,
      CASE
        WHEN t.status::TEXT = 'completed' THEN 'completed'
        WHEN t.updated_at > t.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      t.title as title_en,
      t.title as title_ar, -- tasks table has no title_ar
      t.description as description_en,
      t.description as description_ar, -- tasks table has no description_ar
      COALESCE(t.updated_at, t.created_at) as "timestamp",
      t.created_by as actor_id,
      u_t.raw_user_meta_data->>'full_name' as actor_name,
      u_t.email as actor_email,
      u_t.raw_user_meta_data->>'avatar_url' as actor_avatar_url,
      t.id as source_id,
      'tasks'::TEXT as source_table,
      wid_t.inheritance_source as inheritance_source,
      jsonb_build_object(
        'assignee_id', t.assignee_id,
        'engagement_id', t.engagement_id,
        'workflow_stage', t.workflow_stage,
        'sla_deadline', t.sla_deadline
      ) as metadata,
      t.priority::TEXT as priority,
      t.status::TEXT as status
    FROM work_item_dossiers wid_t
    JOIN tasks t ON wid_t.work_item_id = t.id AND wid_t.work_item_type = 'task'
    LEFT JOIN auth.users u_t ON t.created_by = u_t.id
    WHERE wid_t.dossier_id = p_dossier_id
      AND wid_t.deleted_at IS NULL
      AND (t.is_deleted = false OR t.is_deleted IS NULL)

    UNION ALL

    -- ===== COMMITMENTS (via work_item_dossiers junction) =====
    SELECT
      c.id,
      'commitment'::TEXT as activity_type,
      CASE
        WHEN c.status::TEXT = 'completed' THEN 'completed'
        WHEN c.updated_at > c.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      c.title as title_en,
      c.title as title_ar, -- commitments table has no title_ar
      NULL as description_en, -- commitments has no description column
      NULL as description_ar,
      COALESCE(c.updated_at, c.created_at) as "timestamp",
      c.created_by as actor_id,
      u_c.raw_user_meta_data->>'full_name' as actor_name,
      u_c.email as actor_email,
      u_c.raw_user_meta_data->>'avatar_url' as actor_avatar_url,
      c.id as source_id,
      'commitments'::TEXT as source_table,
      wid_c.inheritance_source as inheritance_source,
      jsonb_build_object(
        'type', c.type,
        'responsible', c.responsible,
        'timeline', c.timeline,
        'deliverable_details', c.deliverable_details
      ) as metadata,
      c.priority::TEXT as priority,
      c.status::TEXT as status
    FROM work_item_dossiers wid_c
    JOIN commitments c ON wid_c.work_item_id = c.id AND wid_c.work_item_type = 'commitment'
    LEFT JOIN auth.users u_c ON c.created_by = u_c.id
    WHERE wid_c.dossier_id = p_dossier_id
      AND wid_c.deleted_at IS NULL
      AND (c.is_deleted = false OR c.is_deleted IS NULL)

    UNION ALL

    -- ===== INTAKE TICKETS (direct dossier_id + via work_item_dossiers) =====
    SELECT
      it.id,
      'intake'::TEXT as activity_type,
      CASE
        WHEN it.status::TEXT IN ('resolved', 'closed') THEN 'completed'
        WHEN it.updated_at > it.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      it.title as title_en,
      COALESCE(it.title_ar, it.title) as title_ar,
      it.description as description_en,
      COALESCE(it.description_ar, it.description) as description_ar,
      COALESCE(it.updated_at, it.created_at) as "timestamp",
      it.created_by as actor_id,
      u_it.raw_user_meta_data->>'full_name' as actor_name,
      u_it.email as actor_email,
      u_it.raw_user_meta_data->>'avatar_url' as actor_avatar_url,
      it.id as source_id,
      'intake_tickets'::TEXT as source_table,
      COALESCE(wid_it.inheritance_source, 'direct') as inheritance_source,
      jsonb_build_object(
        'ticket_number', it.ticket_number,
        'request_type', it.request_type,
        'urgency', it.urgency,
        'assigned_to', it.assigned_to,
        'assigned_unit', it.assigned_unit
      ) as metadata,
      it.priority::TEXT as priority,
      it.status::TEXT as status
    FROM intake_tickets it
    LEFT JOIN work_item_dossiers wid_it ON wid_it.work_item_id = it.id AND wid_it.work_item_type = 'intake'
    LEFT JOIN auth.users u_it ON it.created_by = u_it.id
    WHERE (it.dossier_id = p_dossier_id OR wid_it.dossier_id = p_dossier_id)
      AND (wid_it.deleted_at IS NULL OR wid_it.id IS NULL)

    UNION ALL

    -- ===== POSITIONS (via position_dossier_links) =====
    SELECT
      pos.id,
      'position'::TEXT as activity_type,
      CASE
        WHEN pos.status = 'approved' THEN 'completed'
        WHEN pos.updated_at > pos.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      pos.title_en as title_en,
      COALESCE(pos.title_ar, pos.title_en) as title_ar,
      pos.content_en as description_en,
      COALESCE(pos.content_ar, pos.content_en) as description_ar,
      COALESCE(pos.updated_at, pos.created_at) as "timestamp",
      pos.author_id as actor_id,
      u_pos.raw_user_meta_data->>'full_name' as actor_name,
      u_pos.email as actor_email,
      u_pos.raw_user_meta_data->>'avatar_url' as actor_avatar_url,
      pos.id as source_id,
      'positions'::TEXT as source_table,
      'position'::TEXT as inheritance_source,
      jsonb_build_object(
        'thematic_category', pos.thematic_category,
        'current_stage', pos.current_stage,
        'consistency_score', pos.consistency_score,
        'expires_at', pos.expires_at,
        'freshness_status', pos.freshness_status
      ) as metadata,
      NULL as priority,
      pos.status as status
    FROM position_dossier_links pdl
    JOIN positions pos ON pdl.position_id = pos.id
    LEFT JOIN auth.users u_pos ON pos.author_id = u_pos.id
    WHERE pdl.dossier_id = p_dossier_id

    UNION ALL

    -- ===== CALENDAR EVENTS (direct dossier_id) =====
    SELECT
      ce.id,
      'event'::TEXT as activity_type,
      CASE
        WHEN ce.status = 'completed' THEN 'completed'
        WHEN ce.updated_at > ce.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      ce.title_en as title_en,
      COALESCE(ce.title_ar, ce.title_en) as title_ar,
      ce.description_en as description_en,
      COALESCE(ce.description_ar, ce.description_en) as description_ar,
      COALESCE(ce.updated_at, ce.created_at) as "timestamp",
      NULL as actor_id, -- calendar_events has no created_by
      NULL as actor_name,
      NULL as actor_email,
      NULL as actor_avatar_url,
      ce.id as source_id,
      'calendar_events'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      jsonb_build_object(
        'event_type', ce.event_type,
        'start_datetime', ce.start_datetime,
        'end_datetime', ce.end_datetime,
        'location_en', ce.location_en,
        'location_ar', ce.location_ar,
        'is_virtual', ce.is_virtual
      ) as metadata,
      NULL as priority,
      ce.status as status
    FROM calendar_events ce
    WHERE ce.dossier_id = p_dossier_id

    UNION ALL

    -- ===== DOSSIER RELATIONSHIPS (source or target) =====
    SELECT
      dr.id,
      'relationship'::TEXT as activity_type,
      'linked'::TEXT as action,
      CASE
        WHEN dr.source_dossier_id = p_dossier_id THEN
          (SELECT d.name_en FROM dossiers d WHERE d.id = dr.target_dossier_id)
        ELSE
          (SELECT d.name_en FROM dossiers d WHERE d.id = dr.source_dossier_id)
      END as title_en,
      CASE
        WHEN dr.source_dossier_id = p_dossier_id THEN
          (SELECT COALESCE(d.name_ar, d.name_en) FROM dossiers d WHERE d.id = dr.target_dossier_id)
        ELSE
          (SELECT COALESCE(d.name_ar, d.name_en) FROM dossiers d WHERE d.id = dr.source_dossier_id)
      END as title_ar,
      dr.notes_en as description_en,
      COALESCE(dr.notes_ar, dr.notes_en) as description_ar,
      dr.created_at as "timestamp",
      dr.created_by as actor_id,
      u_dr.raw_user_meta_data->>'full_name' as actor_name,
      u_dr.email as actor_email,
      u_dr.raw_user_meta_data->>'avatar_url' as actor_avatar_url,
      dr.id as source_id,
      'dossier_relationships'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      jsonb_build_object(
        'relationship_type', dr.relationship_type,
        'source_dossier_id', dr.source_dossier_id,
        'target_dossier_id', dr.target_dossier_id,
        'effective_from', dr.effective_from,
        'effective_to', dr.effective_to,
        'relationship_metadata', dr.relationship_metadata
      ) as metadata,
      NULL as priority,
      dr.status as status
    FROM dossier_relationships dr
    LEFT JOIN auth.users u_dr ON dr.created_by = u_dr.id
    WHERE dr.source_dossier_id = p_dossier_id OR dr.target_dossier_id = p_dossier_id

    UNION ALL

    -- ===== ENTITY COMMENTS (on dossier itself) =====
    SELECT
      ec.id,
      'comment'::TEXT as activity_type,
      CASE
        WHEN ec.is_edited THEN 'updated'
        ELSE 'commented'
      END as action,
      LEFT(ec.content, 100) as title_en,
      LEFT(ec.content, 100) as title_ar,
      ec.content as description_en,
      ec.content as description_ar,
      COALESCE(ec.updated_at, ec.created_at) as "timestamp",
      ec.author_id as actor_id,
      u_ec.raw_user_meta_data->>'full_name' as actor_name,
      u_ec.email as actor_email,
      u_ec.raw_user_meta_data->>'avatar_url' as actor_avatar_url,
      ec.id as source_id,
      'entity_comments'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      jsonb_build_object(
        'entity_type', ec.entity_type,
        'visibility', ec.visibility,
        'is_edited', ec.is_edited,
        'edit_count', ec.edit_count,
        'thread_depth', ec.thread_depth
      ) as metadata,
      NULL as priority,
      NULL as status
    FROM entity_comments ec
    LEFT JOIN auth.users u_ec ON ec.author_id = u_ec.id
    WHERE ec.entity_type = 'dossier' AND ec.entity_id = p_dossier_id
      AND (ec.is_deleted = false OR ec.is_deleted IS NULL)

    UNION ALL

    -- ===== ACTIVITY STREAM (for this dossier) =====
    SELECT
      ast.id,
      ast.entity_type::TEXT as activity_type,
      ast.action_type::TEXT as action,
      ast.entity_name_en as title_en,
      COALESCE(ast.entity_name_ar, ast.entity_name_en) as title_ar,
      ast.description_en as description_en,
      COALESCE(ast.description_ar, ast.description_en) as description_ar,
      ast.created_at as "timestamp",
      ast.actor_id as actor_id,
      ast.actor_name as actor_name,
      ast.actor_email as actor_email,
      ast.actor_avatar_url as actor_avatar_url,
      ast.entity_id as source_id,
      'activity_stream'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      ast.metadata as metadata,
      NULL as priority,
      NULL as status
    FROM activity_stream ast
    WHERE (ast.entity_type = 'dossier' AND ast.entity_id = p_dossier_id)
       OR (ast.related_entity_type = 'dossier' AND ast.related_entity_id = p_dossier_id)
  )
  SELECT *
  FROM all_activities a
  WHERE
    -- Cursor pagination
    (p_cursor IS NULL OR a."timestamp" < p_cursor)
    -- Activity type filter
    AND (p_activity_types IS NULL OR a.activity_type = ANY(p_activity_types))
    -- Date range filters
    AND (p_date_from IS NULL OR a."timestamp" >= p_date_from)
    AND (p_date_to IS NULL OR a."timestamp" <= p_date_to)
  ORDER BY a."timestamp" DESC
  LIMIT v_effective_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unified_dossier_activities TO authenticated;

COMMENT ON FUNCTION get_unified_dossier_activities IS
  'Aggregates all activity related to a dossier from tasks, commitments, intakes, positions, events, relationships, documents, and comments. Supports cursor pagination and filtering.';
