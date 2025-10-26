-- Migration: Create Graph Traversal Functions
-- Description: Recursive CTE functions for N-degree relationship exploration
-- Feature: 026-unified-dossier-architecture
-- User Story: US3 - Traverse Entity Relationships as Graph
-- Task: T075

-- ==================================================
-- Function: traverse_relationship_graph
-- ==================================================
-- Purpose: Find all entities within N degrees of separation from a starting dossier
-- Returns: Table with dossier info, degree, path, and relationship path
-- Performance: <2s for 5-degree traversal (per SC-003)

CREATE OR REPLACE FUNCTION traverse_relationship_graph(
  start_dossier_id UUID,
  max_degrees INTEGER DEFAULT 2,
  relationship_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  degree INTEGER,
  path UUID[],
  relationship_path TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE relationship_graph AS (
    -- Base case: Direct relationships from starting dossier
    SELECT
      dr.target_dossier_id AS dossier_id,
      1 AS degree,
      ARRAY[start_dossier_id, dr.target_dossier_id] AS path,
      ARRAY[dr.relationship_type] AS relationship_path
    FROM dossier_relationships dr
    WHERE dr.source_dossier_id = start_dossier_id
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)

    UNION

    -- Recursive case: Traverse to next degree
    SELECT
      dr.target_dossier_id,
      rg.degree + 1,
      rg.path || dr.target_dossier_id,
      rg.relationship_path || dr.relationship_type
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON dr.source_dossier_id = rg.dossier_id
    WHERE rg.degree < max_degrees
      AND NOT (dr.target_dossier_id = ANY(rg.path)) -- Prevent cycles
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
  )
  SELECT DISTINCT ON (d.id)
    d.id AS dossier_id,
    d.type AS dossier_type,
    d.name_en,
    d.name_ar,
    d.status,
    rg.degree,
    rg.path,
    rg.relationship_path
  FROM relationship_graph rg
  JOIN dossiers d ON d.id = rg.dossier_id
  WHERE d.status != 'deleted'
    -- RLS filtering: Only return dossiers within user's clearance
    AND d.sensitivity_level <= (
      SELECT COALESCE(clearance_level, 1)
      FROM profiles
      WHERE user_id = auth.uid()
    )
  ORDER BY d.id, rg.degree
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION traverse_relationship_graph(UUID, INTEGER, TEXT) TO authenticated;

-- ==================================================
-- Function: get_bidirectional_relationships
-- ==================================================
-- Purpose: Get all relationships where dossier is either source OR target
-- Returns: Combined view of outgoing and incoming relationships
-- Used for: Relationship browser UI, showing all connections

CREATE OR REPLACE FUNCTION get_bidirectional_relationships(
  dossier_id_param UUID,
  relationship_type_filter TEXT DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  relationship_id UUID,
  related_dossier_id UUID,
  related_dossier_type TEXT,
  related_name_en TEXT,
  related_name_ar TEXT,
  relationship_type TEXT,
  direction TEXT,
  status TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  notes_en TEXT,
  notes_ar TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Outgoing relationships (this dossier is source)
  SELECT
    dr.id AS relationship_id,
    dr.target_dossier_id AS related_dossier_id,
    d.type AS related_dossier_type,
    d.name_en AS related_name_en,
    d.name_ar AS related_name_ar,
    dr.relationship_type,
    'outgoing'::TEXT AS direction,
    dr.status,
    dr.effective_from,
    dr.effective_to,
    dr.notes_en,
    dr.notes_ar
  FROM dossier_relationships dr
  JOIN dossiers d ON d.id = dr.target_dossier_id
  WHERE dr.source_dossier_id = dossier_id_param
    AND (include_inactive OR dr.status = 'active')
    AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
    -- RLS filtering
    AND d.sensitivity_level <= (
      SELECT COALESCE(clearance_level, 1)
      FROM profiles
      WHERE user_id = auth.uid()
    )

  UNION ALL

  -- Incoming relationships (this dossier is target)
  SELECT
    dr.id AS relationship_id,
    dr.source_dossier_id AS related_dossier_id,
    d.type AS related_dossier_type,
    d.name_en AS related_name_en,
    d.name_ar AS related_name_ar,
    dr.relationship_type,
    'incoming'::TEXT AS direction,
    dr.status,
    dr.effective_from,
    dr.effective_to,
    dr.notes_en,
    dr.notes_ar
  FROM dossier_relationships dr
  JOIN dossiers d ON d.id = dr.source_dossier_id
  WHERE dr.target_dossier_id = dossier_id_param
    AND (include_inactive OR dr.status = 'active')
    AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
    -- RLS filtering
    AND d.sensitivity_level <= (
      SELECT COALESCE(clearance_level, 1)
      FROM profiles
      WHERE user_id = auth.uid()
    )

  ORDER BY effective_from DESC NULLS LAST, related_name_en
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_bidirectional_relationships(UUID, TEXT, BOOLEAN) TO authenticated;

-- ==================================================
-- Function: get_relationship_path
-- ==================================================
-- Purpose: Find the shortest path between two dossiers
-- Returns: Path as array of dossier IDs and relationship types
-- Used for: "How are these entities connected?" queries

CREATE OR REPLACE FUNCTION get_relationship_path(
  source_dossier_id UUID,
  target_dossier_id UUID,
  max_depth INTEGER DEFAULT 5
)
RETURNS TABLE (
  path UUID[],
  relationship_path TEXT[],
  path_length INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE path_search AS (
    -- Base case: Direct relationship
    SELECT
      ARRAY[source_dossier_id, dr.target_dossier_id] AS path,
      ARRAY[dr.relationship_type] AS relationship_path,
      1 AS path_length,
      dr.target_dossier_id AS current_dossier
    FROM dossier_relationships dr
    WHERE dr.source_dossier_id = source_dossier_id
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())

    UNION

    -- Recursive case: Extend path
    SELECT
      ps.path || dr.target_dossier_id,
      ps.relationship_path || dr.relationship_type,
      ps.path_length + 1,
      dr.target_dossier_id
    FROM path_search ps
    JOIN dossier_relationships dr ON dr.source_dossier_id = ps.current_dossier
    WHERE ps.path_length < max_depth
      AND NOT (dr.target_dossier_id = ANY(ps.path)) -- Prevent cycles
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND ps.current_dossier != target_dossier_id -- Stop once target reached
  )
  SELECT
    ps.path,
    ps.relationship_path,
    ps.path_length
  FROM path_search ps
  WHERE ps.current_dossier = target_dossier_id
  ORDER BY ps.path_length
  LIMIT 1 -- Return shortest path only
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_relationship_path(UUID, UUID, INTEGER) TO authenticated;

-- ==================================================
-- Comments for documentation
-- ==================================================
COMMENT ON FUNCTION traverse_relationship_graph IS
'Recursive graph traversal function. Finds all entities within N degrees of separation from a starting dossier. Respects RLS policies and filters deleted entities. Performance target: <2s for 5 degrees.';

COMMENT ON FUNCTION get_bidirectional_relationships IS
'Returns all relationships for a dossier in both directions (source and target). Used for relationship browser UI showing all connections to/from an entity.';

COMMENT ON FUNCTION get_relationship_path IS
'Finds the shortest path between two dossiers. Useful for "How are these entities connected?" queries. Returns path as array of dossier IDs and relationship types.';
