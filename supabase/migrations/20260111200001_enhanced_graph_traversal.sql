-- Migration: Enhanced Graph Traversal Functions
-- Description: Recursive graph traversal for finding connected entities, shortest paths, and relationship chains
-- Feature: relationship-graph-traversal
-- Supports: Multi-hop queries with depth limits and relationship type filtering

-- ==================================================
-- Function: traverse_relationship_graph_bidirectional
-- ==================================================
-- Purpose: Bidirectional N-degree graph traversal (follows both source→target AND target→source)
-- Returns: All entities within N degrees including the path taken and relationship types
-- Performance: Optimized with cycle prevention and early termination

CREATE OR REPLACE FUNCTION traverse_relationship_graph_bidirectional(
  start_dossier_id UUID,
  max_degrees INTEGER DEFAULT 2,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE,
  dossier_type_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  degree INTEGER,
  path UUID[],
  relationship_path TEXT[],
  direction_path TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  RETURN QUERY
  WITH RECURSIVE relationship_graph AS (
    -- Base case: Direct outgoing relationships
    SELECT
      dr.target_dossier_id AS current_id,
      1 AS current_degree,
      ARRAY[start_dossier_id, dr.target_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['outgoing'::TEXT] AS dir_path
    FROM dossier_relationships dr
    WHERE dr.source_dossier_id = start_dossier_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))

    UNION ALL

    -- Base case: Direct incoming relationships
    SELECT
      dr.source_dossier_id AS current_id,
      1 AS current_degree,
      ARRAY[start_dossier_id, dr.source_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['incoming'::TEXT] AS dir_path
    FROM dossier_relationships dr
    WHERE dr.target_dossier_id = start_dossier_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))

    UNION ALL

    -- Recursive case: Follow outgoing edges
    SELECT
      dr.target_dossier_id,
      rg.current_degree + 1,
      rg.current_path || dr.target_dossier_id,
      rg.rel_path || dr.relationship_type,
      rg.dir_path || 'outgoing'::TEXT
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON dr.source_dossier_id = rg.current_id
    WHERE rg.current_degree < max_degrees
      AND NOT (dr.target_dossier_id = ANY(rg.current_path))
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))

    UNION ALL

    -- Recursive case: Follow incoming edges
    SELECT
      dr.source_dossier_id,
      rg.current_degree + 1,
      rg.current_path || dr.source_dossier_id,
      rg.rel_path || dr.relationship_type,
      rg.dir_path || 'incoming'::TEXT
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON dr.target_dossier_id = rg.current_id
    WHERE rg.current_degree < max_degrees
      AND NOT (dr.source_dossier_id = ANY(rg.current_path))
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
  )
  SELECT DISTINCT ON (d.id)
    d.id AS dossier_id,
    d.type AS dossier_type,
    d.name_en,
    d.name_ar,
    d.status,
    rg.current_degree AS degree,
    rg.current_path AS path,
    rg.rel_path AS relationship_path,
    rg.dir_path AS direction_path
  FROM relationship_graph rg
  JOIN dossiers d ON d.id = rg.current_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= user_clearance
    AND (dossier_type_filter IS NULL OR d.type = ANY(dossier_type_filter))
  ORDER BY d.id, rg.current_degree;
END;
$$;

GRANT EXECUTE ON FUNCTION traverse_relationship_graph_bidirectional(UUID, INTEGER, TEXT[], BOOLEAN, TEXT[]) TO authenticated;

COMMENT ON FUNCTION traverse_relationship_graph_bidirectional IS
'Bidirectional recursive graph traversal. Finds all entities within N degrees of separation following both incoming and outgoing relationships. Supports multiple relationship type filtering and dossier type filtering.';


-- ==================================================
-- Function: find_shortest_path_bidirectional
-- ==================================================
-- Purpose: Find the shortest path between two entities using bidirectional BFS
-- Returns: Shortest path with relationship types and directions
-- Performance: Bidirectional BFS for O(b^(d/2)) vs O(b^d) complexity

CREATE OR REPLACE FUNCTION find_shortest_path_bidirectional(
  source_id UUID,
  target_id UUID,
  max_depth INTEGER DEFAULT 6,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  path UUID[],
  relationship_path TEXT[],
  direction_path TEXT[],
  path_length INTEGER,
  found BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  -- Check if source and target are the same
  IF source_id = target_id THEN
    RETURN QUERY SELECT
      ARRAY[source_id]::UUID[] AS path,
      ARRAY[]::TEXT[] AS relationship_path,
      ARRAY[]::TEXT[] AS direction_path,
      0 AS path_length,
      TRUE AS found;
    RETURN;
  END IF;

  RETURN QUERY
  WITH RECURSIVE path_search AS (
    -- Base case: Outgoing from source
    SELECT
      ARRAY[source_id, dr.target_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['outgoing'::TEXT] AS dir_path,
      1 AS depth,
      dr.target_dossier_id AS current_node
    FROM dossier_relationships dr
    JOIN dossiers d ON d.id = dr.target_dossier_id
    WHERE dr.source_dossier_id = source_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Base case: Incoming to source
    SELECT
      ARRAY[source_id, dr.source_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['incoming'::TEXT] AS dir_path,
      1 AS depth,
      dr.source_dossier_id AS current_node
    FROM dossier_relationships dr
    JOIN dossiers d ON d.id = dr.source_dossier_id
    WHERE dr.target_dossier_id = source_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Recursive outgoing
    SELECT
      ps.current_path || dr.target_dossier_id,
      ps.rel_path || dr.relationship_type,
      ps.dir_path || 'outgoing'::TEXT,
      ps.depth + 1,
      dr.target_dossier_id
    FROM path_search ps
    JOIN dossier_relationships dr ON dr.source_dossier_id = ps.current_node
    JOIN dossiers d ON d.id = dr.target_dossier_id
    WHERE ps.depth < max_depth
      AND NOT (dr.target_dossier_id = ANY(ps.current_path))
      AND ps.current_node != target_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Recursive incoming
    SELECT
      ps.current_path || dr.source_dossier_id,
      ps.rel_path || dr.relationship_type,
      ps.dir_path || 'incoming'::TEXT,
      ps.depth + 1,
      dr.source_dossier_id
    FROM path_search ps
    JOIN dossier_relationships dr ON dr.target_dossier_id = ps.current_node
    JOIN dossiers d ON d.id = dr.source_dossier_id
    WHERE ps.depth < max_depth
      AND NOT (dr.source_dossier_id = ANY(ps.current_path))
      AND ps.current_node != target_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance
  )
  SELECT
    ps.current_path AS path,
    ps.rel_path AS relationship_path,
    ps.dir_path AS direction_path,
    ps.depth AS path_length,
    TRUE AS found
  FROM path_search ps
  WHERE ps.current_node = target_id
  ORDER BY ps.depth
  LIMIT 1;

  -- If no path found, return NULL with found=false
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::UUID[] AS path,
      NULL::TEXT[] AS relationship_path,
      NULL::TEXT[] AS direction_path,
      NULL::INTEGER AS path_length,
      FALSE AS found;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION find_shortest_path_bidirectional(UUID, UUID, INTEGER, TEXT[], BOOLEAN) TO authenticated;

COMMENT ON FUNCTION find_shortest_path_bidirectional IS
'Finds the shortest path between two dossiers using bidirectional search. Supports relationship type filtering and returns the complete path with relationship types and directions.';


-- ==================================================
-- Function: find_all_paths
-- ==================================================
-- Purpose: Find all unique paths between two entities (up to a limit)
-- Returns: All distinct paths sorted by length
-- Use case: Understanding multiple connection routes between entities

CREATE OR REPLACE FUNCTION find_all_paths(
  source_id UUID,
  target_id UUID,
  max_depth INTEGER DEFAULT 4,
  max_paths INTEGER DEFAULT 10,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  path UUID[],
  relationship_path TEXT[],
  direction_path TEXT[],
  path_length INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  -- Check if source and target are the same
  IF source_id = target_id THEN
    RETURN QUERY SELECT
      ARRAY[source_id]::UUID[] AS path,
      ARRAY[]::TEXT[] AS relationship_path,
      ARRAY[]::TEXT[] AS direction_path,
      0 AS path_length
    LIMIT 1;
    RETURN;
  END IF;

  RETURN QUERY
  WITH RECURSIVE all_paths AS (
    -- Base case: Outgoing from source
    SELECT
      ARRAY[source_id, dr.target_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['outgoing'::TEXT] AS dir_path,
      1 AS depth
    FROM dossier_relationships dr
    JOIN dossiers d ON d.id = dr.target_dossier_id
    WHERE dr.source_dossier_id = source_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Base case: Incoming to source
    SELECT
      ARRAY[source_id, dr.source_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['incoming'::TEXT] AS dir_path,
      1 AS depth
    FROM dossier_relationships dr
    JOIN dossiers d ON d.id = dr.source_dossier_id
    WHERE dr.target_dossier_id = source_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Recursive outgoing
    SELECT
      ap.current_path || dr.target_dossier_id,
      ap.rel_path || dr.relationship_type,
      ap.dir_path || 'outgoing'::TEXT,
      ap.depth + 1
    FROM all_paths ap
    JOIN dossier_relationships dr ON dr.source_dossier_id = ap.current_path[array_length(ap.current_path, 1)]
    JOIN dossiers d ON d.id = dr.target_dossier_id
    WHERE ap.depth < max_depth
      AND NOT (dr.target_dossier_id = ANY(ap.current_path))
      AND ap.current_path[array_length(ap.current_path, 1)] != target_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Recursive incoming
    SELECT
      ap.current_path || dr.source_dossier_id,
      ap.rel_path || dr.relationship_type,
      ap.dir_path || 'incoming'::TEXT,
      ap.depth + 1
    FROM all_paths ap
    JOIN dossier_relationships dr ON dr.target_dossier_id = ap.current_path[array_length(ap.current_path, 1)]
    JOIN dossiers d ON d.id = dr.source_dossier_id
    WHERE ap.depth < max_depth
      AND NOT (dr.source_dossier_id = ANY(ap.current_path))
      AND ap.current_path[array_length(ap.current_path, 1)] != target_id
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance
  )
  SELECT
    ap.current_path AS path,
    ap.rel_path AS relationship_path,
    ap.dir_path AS direction_path,
    ap.depth AS path_length
  FROM all_paths ap
  WHERE ap.current_path[array_length(ap.current_path, 1)] = target_id
  ORDER BY ap.depth, ap.current_path
  LIMIT max_paths;
END;
$$;

GRANT EXECUTE ON FUNCTION find_all_paths(UUID, UUID, INTEGER, INTEGER, TEXT[], BOOLEAN) TO authenticated;

COMMENT ON FUNCTION find_all_paths IS
'Finds all unique paths between two dossiers up to a specified depth and count limit. Useful for understanding multiple connection routes between entities.';


-- ==================================================
-- Function: find_connected_entities
-- ==================================================
-- Purpose: Find all entities connected to a starting point (connected component)
-- Returns: All reachable entities regardless of relationship direction
-- Use case: Network analysis, impact assessment

CREATE OR REPLACE FUNCTION find_connected_entities(
  start_dossier_id UUID,
  max_entities INTEGER DEFAULT 100,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE,
  dossier_type_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  min_distance INTEGER,
  connection_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  RETURN QUERY
  WITH RECURSIVE connected AS (
    -- Starting node
    SELECT
      start_dossier_id AS current_id,
      0 AS distance,
      ARRAY[start_dossier_id] AS visited

    UNION

    -- Follow all edges bidirectionally
    SELECT DISTINCT
      CASE
        WHEN dr.source_dossier_id = c.current_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS current_id,
      c.distance + 1,
      c.visited || CASE
        WHEN dr.source_dossier_id = c.current_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END
    FROM connected c
    JOIN dossier_relationships dr ON
      (dr.source_dossier_id = c.current_id OR dr.target_dossier_id = c.current_id)
    WHERE
      NOT (
        CASE
          WHEN dr.source_dossier_id = c.current_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END = ANY(c.visited)
      )
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
  ),
  -- Aggregate to get minimum distance and count connections
  entity_stats AS (
    SELECT
      c.current_id,
      MIN(c.distance) AS min_dist,
      COUNT(*) FILTER (WHERE c.distance > 0) AS conn_count
    FROM connected c
    GROUP BY c.current_id
  )
  SELECT
    d.id AS dossier_id,
    d.type AS dossier_type,
    d.name_en,
    d.name_ar,
    d.status,
    es.min_dist AS min_distance,
    COALESCE(es.conn_count::INTEGER, 0) AS connection_count
  FROM entity_stats es
  JOIN dossiers d ON d.id = es.current_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= user_clearance
    AND (dossier_type_filter IS NULL OR d.type = ANY(dossier_type_filter))
  ORDER BY es.min_dist, d.name_en
  LIMIT max_entities;
END;
$$;

GRANT EXECUTE ON FUNCTION find_connected_entities(UUID, INTEGER, TEXT[], BOOLEAN, TEXT[]) TO authenticated;

COMMENT ON FUNCTION find_connected_entities IS
'Finds all entities in the connected component containing the starting dossier. Returns entities with their minimum distance and connection count. Useful for network analysis and impact assessment.';


-- ==================================================
-- Function: get_relationship_chain
-- ==================================================
-- Purpose: Find chains of specific relationship patterns
-- Returns: Entities matching a specific chain of relationship types
-- Use case: Finding patterns like "Country → member_of → Organization → participates_in → Forum"

CREATE OR REPLACE FUNCTION get_relationship_chain(
  start_dossier_id UUID,
  relationship_chain TEXT[],
  bidirectional_chain BOOLEAN[] DEFAULT NULL
)
RETURNS TABLE (
  chain_position INTEGER,
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  relationship_type TEXT,
  direction TEXT,
  full_path UUID[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
  chain_length INTEGER;
  bidir_chain BOOLEAN[];
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  chain_length := array_length(relationship_chain, 1);

  -- Default to all outgoing if bidirectional_chain not specified
  IF bidirectional_chain IS NULL THEN
    bidir_chain := ARRAY_FILL(FALSE, ARRAY[chain_length]);
  ELSE
    bidir_chain := bidirectional_chain;
  END IF;

  RETURN QUERY
  WITH RECURSIVE chain_search AS (
    -- Position 0: Starting dossier
    SELECT
      0 AS pos,
      start_dossier_id AS current_id,
      NULL::TEXT AS rel_type,
      'start'::TEXT AS dir,
      ARRAY[start_dossier_id] AS path_arr

    UNION ALL

    -- Follow the chain pattern
    SELECT
      cs.pos + 1,
      CASE
        WHEN bidir_chain[cs.pos + 1] THEN
          CASE
            WHEN dr.source_dossier_id = cs.current_id THEN dr.target_dossier_id
            ELSE dr.source_dossier_id
          END
        ELSE dr.target_dossier_id
      END,
      dr.relationship_type,
      CASE
        WHEN dr.source_dossier_id = cs.current_id THEN 'outgoing'
        ELSE 'incoming'
      END,
      cs.path_arr || CASE
        WHEN bidir_chain[cs.pos + 1] THEN
          CASE
            WHEN dr.source_dossier_id = cs.current_id THEN dr.target_dossier_id
            ELSE dr.source_dossier_id
          END
        ELSE dr.target_dossier_id
      END
    FROM chain_search cs
    JOIN dossier_relationships dr ON
      CASE
        WHEN bidir_chain[cs.pos + 1] THEN
          (dr.source_dossier_id = cs.current_id OR dr.target_dossier_id = cs.current_id)
        ELSE
          dr.source_dossier_id = cs.current_id
      END
    WHERE cs.pos < chain_length
      AND dr.relationship_type = relationship_chain[cs.pos + 1]
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND NOT (
        CASE
          WHEN bidir_chain[cs.pos + 1] THEN
            CASE
              WHEN dr.source_dossier_id = cs.current_id THEN dr.target_dossier_id
              ELSE dr.source_dossier_id
            END
          ELSE dr.target_dossier_id
        END = ANY(cs.path_arr)
      )
  )
  SELECT
    cs.pos AS chain_position,
    d.id AS dossier_id,
    d.type AS dossier_type,
    d.name_en,
    d.name_ar,
    d.status,
    cs.rel_type AS relationship_type,
    cs.dir AS direction,
    cs.path_arr AS full_path
  FROM chain_search cs
  JOIN dossiers d ON d.id = cs.current_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= user_clearance
  ORDER BY cs.path_arr, cs.pos;
END;
$$;

GRANT EXECUTE ON FUNCTION get_relationship_chain(UUID, TEXT[], BOOLEAN[]) TO authenticated;

COMMENT ON FUNCTION get_relationship_chain IS
'Finds entities matching a specific chain of relationship types. Use for pattern matching like "Country → member_of → Organization → participates_in → Forum". Returns all entities along matching chains with their positions.';


-- ==================================================
-- Function: get_common_connections
-- ==================================================
-- Purpose: Find entities that connect two dossiers (mutual connections)
-- Returns: Entities that have relationships with both source and target
-- Use case: Finding bridge entities, common affiliations

CREATE OR REPLACE FUNCTION get_common_connections(
  dossier_a_id UUID,
  dossier_b_id UUID,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  relationship_to_a TEXT,
  direction_to_a TEXT,
  relationship_to_b TEXT,
  direction_to_b TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  RETURN QUERY
  WITH connections_a AS (
    -- Get all connections to dossier A
    SELECT
      CASE
        WHEN dr.source_dossier_id = dossier_a_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS connected_id,
      dr.relationship_type,
      CASE
        WHEN dr.source_dossier_id = dossier_a_id THEN 'outgoing'
        ELSE 'incoming'
      END AS direction
    FROM dossier_relationships dr
    WHERE (dr.source_dossier_id = dossier_a_id OR dr.target_dossier_id = dossier_a_id)
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
  ),
  connections_b AS (
    -- Get all connections to dossier B
    SELECT
      CASE
        WHEN dr.source_dossier_id = dossier_b_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS connected_id,
      dr.relationship_type,
      CASE
        WHEN dr.source_dossier_id = dossier_b_id THEN 'outgoing'
        ELSE 'incoming'
      END AS direction
    FROM dossier_relationships dr
    WHERE (dr.source_dossier_id = dossier_b_id OR dr.target_dossier_id = dossier_b_id)
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
  )
  SELECT DISTINCT ON (d.id)
    d.id AS dossier_id,
    d.type AS dossier_type,
    d.name_en,
    d.name_ar,
    d.status,
    ca.relationship_type AS relationship_to_a,
    ca.direction AS direction_to_a,
    cb.relationship_type AS relationship_to_b,
    cb.direction AS direction_to_b
  FROM connections_a ca
  JOIN connections_b cb ON ca.connected_id = cb.connected_id
  JOIN dossiers d ON d.id = ca.connected_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= user_clearance
    AND d.id != dossier_a_id
    AND d.id != dossier_b_id
  ORDER BY d.id, d.name_en;
END;
$$;

GRANT EXECUTE ON FUNCTION get_common_connections(UUID, UUID, TEXT[], BOOLEAN) TO authenticated;

COMMENT ON FUNCTION get_common_connections IS
'Finds entities that have relationships with both specified dossiers. Useful for finding bridge entities, common affiliations, and mutual connections between two entities.';


-- ==================================================
-- Function: get_graph_statistics
-- ==================================================
-- Purpose: Calculate network statistics for a subgraph
-- Returns: Node count, edge count, density, average degree, etc.
-- Use case: Network analysis dashboard

CREATE OR REPLACE FUNCTION get_graph_statistics(
  start_dossier_id UUID DEFAULT NULL,
  max_degrees INTEGER DEFAULT 3,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  total_nodes BIGINT,
  total_edges BIGINT,
  graph_density NUMERIC,
  avg_degree NUMERIC,
  max_degree BIGINT,
  isolated_nodes BIGINT,
  dossier_type_distribution JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_clearance INTEGER;
BEGIN
  -- Get user's clearance level
  SELECT COALESCE(clearance_level, 1) INTO user_clearance
  FROM profiles
  WHERE user_id = auth.uid();

  IF start_dossier_id IS NOT NULL THEN
    -- Calculate stats for subgraph starting from a dossier
    RETURN QUERY
    WITH subgraph_nodes AS (
      SELECT DISTINCT dossier_id
      FROM traverse_relationship_graph_bidirectional(
        start_dossier_id,
        max_degrees,
        relationship_types,
        include_inactive,
        NULL
      )
      UNION
      SELECT start_dossier_id
    ),
    subgraph_edges AS (
      SELECT DISTINCT dr.id, dr.source_dossier_id, dr.target_dossier_id
      FROM dossier_relationships dr
      WHERE dr.source_dossier_id IN (SELECT dossier_id FROM subgraph_nodes)
        AND dr.target_dossier_id IN (SELECT dossier_id FROM subgraph_nodes)
        AND (include_inactive OR dr.status = 'active')
        AND (dr.effective_to IS NULL OR dr.effective_to > now())
        AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
    ),
    node_degrees AS (
      SELECT
        sn.dossier_id,
        COUNT(DISTINCT se.id) AS degree
      FROM subgraph_nodes sn
      LEFT JOIN subgraph_edges se ON
        se.source_dossier_id = sn.dossier_id OR se.target_dossier_id = sn.dossier_id
      GROUP BY sn.dossier_id
    ),
    type_counts AS (
      SELECT
        d.type,
        COUNT(*) AS cnt
      FROM subgraph_nodes sn
      JOIN dossiers d ON d.id = sn.dossier_id
      GROUP BY d.type
    )
    SELECT
      (SELECT COUNT(*) FROM subgraph_nodes)::BIGINT AS total_nodes,
      (SELECT COUNT(*) FROM subgraph_edges)::BIGINT AS total_edges,
      CASE
        WHEN (SELECT COUNT(*) FROM subgraph_nodes) <= 1 THEN 0
        ELSE ROUND(
          (SELECT COUNT(*) FROM subgraph_edges)::NUMERIC * 2 /
          ((SELECT COUNT(*) FROM subgraph_nodes) * ((SELECT COUNT(*) FROM subgraph_nodes) - 1)),
          4
        )
      END AS graph_density,
      ROUND((SELECT AVG(degree) FROM node_degrees), 2) AS avg_degree,
      (SELECT MAX(degree) FROM node_degrees)::BIGINT AS max_degree,
      (SELECT COUNT(*) FROM node_degrees WHERE degree = 0)::BIGINT AS isolated_nodes,
      (SELECT jsonb_object_agg(type, cnt) FROM type_counts) AS dossier_type_distribution;
  ELSE
    -- Calculate stats for entire graph (visible to user)
    RETURN QUERY
    WITH visible_dossiers AS (
      SELECT id, type
      FROM dossiers
      WHERE status != 'deleted'
        AND sensitivity_level <= user_clearance
    ),
    visible_edges AS (
      SELECT DISTINCT dr.id, dr.source_dossier_id, dr.target_dossier_id
      FROM dossier_relationships dr
      WHERE dr.source_dossier_id IN (SELECT id FROM visible_dossiers)
        AND dr.target_dossier_id IN (SELECT id FROM visible_dossiers)
        AND (include_inactive OR dr.status = 'active')
        AND (dr.effective_to IS NULL OR dr.effective_to > now())
        AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
    ),
    node_degrees AS (
      SELECT
        vd.id,
        COUNT(DISTINCT ve.id) AS degree
      FROM visible_dossiers vd
      LEFT JOIN visible_edges ve ON
        ve.source_dossier_id = vd.id OR ve.target_dossier_id = vd.id
      GROUP BY vd.id
    ),
    type_counts AS (
      SELECT
        type,
        COUNT(*) AS cnt
      FROM visible_dossiers
      GROUP BY type
    )
    SELECT
      (SELECT COUNT(*) FROM visible_dossiers)::BIGINT AS total_nodes,
      (SELECT COUNT(*) FROM visible_edges)::BIGINT AS total_edges,
      CASE
        WHEN (SELECT COUNT(*) FROM visible_dossiers) <= 1 THEN 0
        ELSE ROUND(
          (SELECT COUNT(*) FROM visible_edges)::NUMERIC * 2 /
          ((SELECT COUNT(*) FROM visible_dossiers) * ((SELECT COUNT(*) FROM visible_dossiers) - 1)),
          4
        )
      END AS graph_density,
      ROUND((SELECT AVG(degree) FROM node_degrees), 2) AS avg_degree,
      (SELECT MAX(degree) FROM node_degrees)::BIGINT AS max_degree,
      (SELECT COUNT(*) FROM node_degrees WHERE degree = 0)::BIGINT AS isolated_nodes,
      (SELECT jsonb_object_agg(type, cnt) FROM type_counts) AS dossier_type_distribution;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_graph_statistics(UUID, INTEGER, TEXT[], BOOLEAN) TO authenticated;

COMMENT ON FUNCTION get_graph_statistics IS
'Calculates network statistics for the entire graph or a subgraph starting from a specific dossier. Returns metrics like density, average degree, and type distribution.';


-- ==================================================
-- Indexes for performance optimization
-- ==================================================

-- Composite index for bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_dossier_relationships_source_status_type
ON dossier_relationships(source_dossier_id, status, relationship_type);

CREATE INDEX IF NOT EXISTS idx_dossier_relationships_target_status_type
ON dossier_relationships(target_dossier_id, status, relationship_type);

-- Index for temporal queries
CREATE INDEX IF NOT EXISTS idx_dossier_relationships_effective_dates
ON dossier_relationships(effective_from, effective_to)
WHERE status = 'active';

-- Partial index for active relationships (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_dossier_relationships_active_source
ON dossier_relationships(source_dossier_id)
WHERE status = 'active' AND (effective_to IS NULL OR effective_to > now());

CREATE INDEX IF NOT EXISTS idx_dossier_relationships_active_target
ON dossier_relationships(target_dossier_id)
WHERE status = 'active' AND (effective_to IS NULL OR effective_to > now());
