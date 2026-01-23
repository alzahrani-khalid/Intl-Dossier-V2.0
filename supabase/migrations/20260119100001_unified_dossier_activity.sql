-- Migration: Unified Dossier Activity API
-- Feature: 035-dossier-context
-- Date: 2026-01-19
-- Description: Creates RPC function to aggregate all activity related to a dossier
--              from tasks, commitments, intakes, positions, events, relationships,
--              documents, and comments with cursor pagination and filtering.

-- ============================================================================
-- Create activity type enum for unified activity feed
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unified_activity_type') THEN
    CREATE TYPE unified_activity_type AS ENUM (
      'task',
      'commitment',
      'intake',
      'position',
      'event',
      'relationship',
      'document',
      'comment'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unified_activity_action') THEN
    CREATE TYPE unified_activity_action AS ENUM (
      'created',
      'updated',
      'completed',
      'linked',
      'commented',
      'status_change',
      'assigned'
    );
  END IF;
END $$;

-- ============================================================================
-- Create unified_dossier_activities function
-- ============================================================================

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
    -- ===== TASKS =====
    SELECT
      t.id,
      'task'::TEXT as activity_type,
      CASE
        WHEN t.status = 'completed' THEN 'completed'
        WHEN t.updated_at > t.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      t.title as title_en,
      COALESCE(t.title_ar, t.title) as title_ar,
      t.description as description_en,
      COALESCE(t.description_ar, t.description) as description_ar,
      COALESCE(t.updated_at, t.created_at) as timestamp,
      t.created_by as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      t.id as source_id,
      'tasks'::TEXT as source_table,
      COALESCE(wid.inheritance_source, 'direct') as inheritance_source,
      jsonb_build_object(
        'assignee_id', t.assignee_id,
        'deadline', t.deadline,
        'workflow_stage', t.workflow_stage,
        'engagement_id', t.engagement_id
      ) as metadata,
      t.priority::TEXT as priority,
      t.status::TEXT as status
    FROM tasks t
    LEFT JOIN work_item_dossiers wid ON wid.work_item_type = 'task'
      AND wid.work_item_id = t.id
      AND wid.dossier_id = p_dossier_id
      AND wid.deleted_at IS NULL
    LEFT JOIN auth.users u ON u.id = t.created_by
    LEFT JOIN profiles p ON p.id = t.created_by
    WHERE t.is_deleted = false
      AND (
        wid.id IS NOT NULL
        OR t.dossier_id = p_dossier_id
      )
      AND (p_activity_types IS NULL OR 'task' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR COALESCE(t.updated_at, t.created_at) < p_cursor)
      AND (p_date_from IS NULL OR COALESCE(t.updated_at, t.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR COALESCE(t.updated_at, t.created_at) <= p_date_to)

    UNION ALL

    -- ===== COMMITMENTS =====
    SELECT
      c.id,
      'commitment'::TEXT as activity_type,
      CASE
        WHEN c.status = 'completed' THEN 'completed'
        WHEN c.updated_at > c.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      c.title as title_en,
      COALESCE(c.title_ar, c.title) as title_ar,
      c.description as description_en,
      COALESCE(c.description_ar, c.description) as description_ar,
      COALESCE(c.updated_at, c.created_at) as timestamp,
      c.created_by as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      c.id as source_id,
      'commitments'::TEXT as source_table,
      COALESCE(wid.inheritance_source, 'direct') as inheritance_source,
      jsonb_build_object(
        'responsible', c.responsible,
        'tracking_type', c.tracking_type,
        'deadline', c.deadline,
        'after_action_id', c.after_action_id
      ) as metadata,
      c.priority::TEXT as priority,
      c.status::TEXT as status
    FROM commitments c
    LEFT JOIN work_item_dossiers wid ON wid.work_item_type = 'commitment'
      AND wid.work_item_id = c.id
      AND wid.dossier_id = p_dossier_id
      AND wid.deleted_at IS NULL
    LEFT JOIN auth.users u ON u.id = c.created_by
    LEFT JOIN profiles p ON p.id = c.created_by
    WHERE (
        wid.id IS NOT NULL
        OR c.dossier_id = p_dossier_id
      )
      AND (p_activity_types IS NULL OR 'commitment' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR COALESCE(c.updated_at, c.created_at) < p_cursor)
      AND (p_date_from IS NULL OR COALESCE(c.updated_at, c.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR COALESCE(c.updated_at, c.created_at) <= p_date_to)

    UNION ALL

    -- ===== INTAKE TICKETS =====
    SELECT
      it.id,
      'intake'::TEXT as activity_type,
      CASE
        WHEN it.status IN ('resolved', 'closed') THEN 'completed'
        WHEN it.updated_at > it.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      it.title as title_en,
      COALESCE(it.title_ar, it.title) as title_ar,
      it.description as description_en,
      COALESCE(it.description_ar, it.description) as description_ar,
      COALESCE(it.updated_at, it.created_at) as timestamp,
      it.created_by as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      it.id as source_id,
      'intake_tickets'::TEXT as source_table,
      COALESCE(wid.inheritance_source, 'direct') as inheritance_source,
      jsonb_build_object(
        'assigned_to', it.assigned_to,
        'sla_deadline', it.sla_deadline,
        'service_type', it.service_type,
        'ticket_number', it.ticket_number
      ) as metadata,
      it.priority::TEXT as priority,
      it.status::TEXT as status
    FROM intake_tickets it
    LEFT JOIN work_item_dossiers wid ON wid.work_item_type = 'intake'
      AND wid.work_item_id = it.id
      AND wid.dossier_id = p_dossier_id
      AND wid.deleted_at IS NULL
    LEFT JOIN auth.users u ON u.id = it.created_by
    LEFT JOIN profiles p ON p.id = it.created_by
    WHERE (
        wid.id IS NOT NULL
        OR it.dossier_id = p_dossier_id
      )
      AND (p_activity_types IS NULL OR 'intake' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR COALESCE(it.updated_at, it.created_at) < p_cursor)
      AND (p_date_from IS NULL OR COALESCE(it.updated_at, it.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR COALESCE(it.updated_at, it.created_at) <= p_date_to)

    UNION ALL

    -- ===== POSITIONS =====
    SELECT
      pos.id,
      'position'::TEXT as activity_type,
      CASE
        WHEN pos.status = 'published' THEN 'completed'
        WHEN pos.updated_at > pos.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      pos.title_en,
      pos.title_ar,
      pos.content_en as description_en,
      pos.content_ar as description_ar,
      COALESCE(pos.updated_at, pos.created_at) as timestamp,
      pos.author_id as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      pos.id as source_id,
      'positions'::TEXT as source_table,
      'position'::TEXT as inheritance_source,
      jsonb_build_object(
        'position_type_id', pos.position_type_id,
        'consistency_score', pos.consistency_score,
        'current_stage', pos.current_stage,
        'link_type', pdl.link_type
      ) as metadata,
      'medium'::TEXT as priority,
      pos.status::TEXT as status
    FROM positions pos
    JOIN position_dossier_links pdl ON pdl.position_id = pos.id
      AND pdl.dossier_id = p_dossier_id
    LEFT JOIN auth.users u ON u.id = pos.author_id
    LEFT JOIN profiles p ON p.id = pos.author_id
    WHERE (p_activity_types IS NULL OR 'position' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR COALESCE(pos.updated_at, pos.created_at) < p_cursor)
      AND (p_date_from IS NULL OR COALESCE(pos.updated_at, pos.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR COALESCE(pos.updated_at, pos.created_at) <= p_date_to)

    UNION ALL

    -- ===== CALENDAR EVENTS =====
    SELECT
      ce.id,
      'event'::TEXT as activity_type,
      CASE
        WHEN ce.status = 'completed' THEN 'completed'
        WHEN ce.status = 'cancelled' THEN 'status_change'
        WHEN ce.updated_at > ce.created_at + INTERVAL '1 minute' THEN 'updated'
        ELSE 'created'
      END as action,
      ce.title_en,
      ce.title_ar,
      ce.description_en,
      ce.description_ar,
      COALESCE(ce.updated_at, ce.created_at) as timestamp,
      NULL::UUID as actor_id,
      NULL::TEXT as actor_name,
      NULL::TEXT as actor_email,
      NULL::TEXT as actor_avatar_url,
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
      'medium'::TEXT as priority,
      ce.status::TEXT as status
    FROM calendar_events ce
    WHERE ce.dossier_id = p_dossier_id
      AND (p_activity_types IS NULL OR 'event' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR COALESCE(ce.updated_at, ce.created_at) < p_cursor)
      AND (p_date_from IS NULL OR COALESCE(ce.updated_at, ce.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR COALESCE(ce.updated_at, ce.created_at) <= p_date_to)

    UNION ALL

    -- ===== RELATIONSHIPS =====
    SELECT
      dr.id,
      'relationship'::TEXT as activity_type,
      CASE
        WHEN dr.status = 'terminated' THEN 'status_change'
        ELSE 'linked'
      END as action,
      COALESCE(target_d.name_en, 'Related Dossier') as title_en,
      COALESCE(target_d.name_ar, target_d.name_en, 'ملف مرتبط') as title_ar,
      dr.notes_en as description_en,
      dr.notes_ar as description_ar,
      dr.created_at as timestamp,
      dr.created_by as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      dr.id as source_id,
      'dossier_relationships'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      jsonb_build_object(
        'relationship_type', dr.relationship_type,
        'target_dossier_id', dr.target_dossier_id,
        'target_dossier_type', target_d.type,
        'effective_from', dr.effective_from,
        'effective_to', dr.effective_to
      ) as metadata,
      'low'::TEXT as priority,
      dr.status::TEXT as status
    FROM dossier_relationships dr
    LEFT JOIN dossiers target_d ON target_d.id = dr.target_dossier_id
    LEFT JOIN auth.users u ON u.id = dr.created_by
    LEFT JOIN profiles p ON p.id = dr.created_by
    WHERE dr.source_dossier_id = p_dossier_id
      AND (p_activity_types IS NULL OR 'relationship' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR dr.created_at < p_cursor)
      AND (p_date_from IS NULL OR dr.created_at >= p_date_from)
      AND (p_date_to IS NULL OR dr.created_at <= p_date_to)

    UNION ALL

    -- ===== RELATIONSHIPS (incoming) =====
    SELECT
      dr.id,
      'relationship'::TEXT as activity_type,
      'linked'::TEXT as action,
      COALESCE(source_d.name_en, 'Related Dossier') as title_en,
      COALESCE(source_d.name_ar, source_d.name_en, 'ملف مرتبط') as title_ar,
      dr.notes_en as description_en,
      dr.notes_ar as description_ar,
      dr.created_at as timestamp,
      dr.created_by as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      dr.id as source_id,
      'dossier_relationships'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      jsonb_build_object(
        'relationship_type', dr.relationship_type,
        'source_dossier_id', dr.source_dossier_id,
        'source_dossier_type', source_d.type,
        'effective_from', dr.effective_from,
        'effective_to', dr.effective_to,
        'is_incoming', true
      ) as metadata,
      'low'::TEXT as priority,
      dr.status::TEXT as status
    FROM dossier_relationships dr
    LEFT JOIN dossiers source_d ON source_d.id = dr.source_dossier_id
    LEFT JOIN auth.users u ON u.id = dr.created_by
    LEFT JOIN profiles p ON p.id = dr.created_by
    WHERE dr.target_dossier_id = p_dossier_id
      AND (p_activity_types IS NULL OR 'relationship' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR dr.created_at < p_cursor)
      AND (p_date_from IS NULL OR dr.created_at >= p_date_from)
      AND (p_date_to IS NULL OR dr.created_at <= p_date_to)

    UNION ALL

    -- ===== COMMENTS =====
    SELECT
      ec.id,
      'comment'::TEXT as activity_type,
      'commented'::TEXT as action,
      SUBSTRING(ec.content FROM 1 FOR 100) as title_en,
      SUBSTRING(ec.content FROM 1 FOR 100) as title_ar,
      ec.content as description_en,
      ec.content as description_ar,
      ec.created_at as timestamp,
      ec.author_id as actor_id,
      p.full_name as actor_name,
      u.email as actor_email,
      p.avatar_url as actor_avatar_url,
      ec.id as source_id,
      'entity_comments'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      jsonb_build_object(
        'entity_type', ec.entity_type,
        'entity_id', ec.entity_id,
        'parent_id', ec.parent_id,
        'thread_root_id', ec.thread_root_id,
        'visibility', ec.visibility
      ) as metadata,
      'low'::TEXT as priority,
      CASE WHEN ec.is_deleted THEN 'deleted' ELSE 'active' END::TEXT as status
    FROM entity_comments ec
    LEFT JOIN auth.users u ON u.id = ec.author_id
    LEFT JOIN profiles p ON p.id = ec.author_id
    WHERE ec.entity_type = 'dossier'
      AND ec.entity_id = p_dossier_id
      AND ec.is_deleted = false
      AND (p_activity_types IS NULL OR 'comment' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR ec.created_at < p_cursor)
      AND (p_date_from IS NULL OR ec.created_at >= p_date_from)
      AND (p_date_to IS NULL OR ec.created_at <= p_date_to)

    UNION ALL

    -- ===== ACTIVITY STREAM (documents, uploads, etc.) =====
    SELECT
      ast.id,
      CASE
        WHEN ast.entity_type = 'document' THEN 'document'
        ELSE ast.entity_type
      END::TEXT as activity_type,
      ast.action_type::TEXT as action,
      ast.entity_name_en as title_en,
      COALESCE(ast.entity_name_ar, ast.entity_name_en) as title_ar,
      ast.description_en,
      ast.description_ar,
      ast.created_at as timestamp,
      ast.actor_id,
      ast.actor_name,
      ast.actor_email,
      ast.actor_avatar_url,
      ast.entity_id as source_id,
      'activity_stream'::TEXT as source_table,
      'direct'::TEXT as inheritance_source,
      ast.metadata,
      'low'::TEXT as priority,
      'logged'::TEXT as status
    FROM activity_stream ast
    WHERE ast.related_entity_type = 'dossier'
      AND ast.related_entity_id = p_dossier_id
      AND ast.entity_type = 'document'
      AND (p_activity_types IS NULL OR 'document' = ANY(p_activity_types))
      AND (p_cursor IS NULL OR ast.created_at < p_cursor)
      AND (p_date_from IS NULL OR ast.created_at >= p_date_from)
      AND (p_date_to IS NULL OR ast.created_at <= p_date_to)
  )
  SELECT * FROM all_activities
  ORDER BY timestamp DESC
  LIMIT v_effective_limit + 1;  -- Fetch one extra to check for next page
END;
$$;

COMMENT ON FUNCTION get_unified_dossier_activities IS
  'Aggregates all activity related to a dossier from tasks, commitments, intakes, positions, events, relationships, documents, and comments. Supports cursor pagination and filtering by activity type and date range.';

-- ============================================================================
-- Create index for activity_stream dossier lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_stream_related_dossier
  ON activity_stream(related_entity_id, created_at DESC)
  WHERE related_entity_type = 'dossier';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_unified_dossier_activities TO authenticated;
