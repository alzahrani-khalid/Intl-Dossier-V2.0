-- Migration: Fix Graph Traversal Recursive CTEs
-- Description: Fix recursive CTE structure to comply with PostgreSQL requirements
-- Feature: relationship-graph-traversal
-- Issue: Recursive CTEs can only have ONE non-recursive term

-- ==================================================
-- Function: traverse_relationship_graph_bidirectional (FIXED)
-- ==================================================
-- Issue: Multiple UNION ALL in non-recursive part causes "recursive reference must not appear within its non-recursive term"

DROP FUNCTION IF EXISTS traverse_relationship_graph_bidirectional(UUID, INTEGER, TEXT[], BOOLEAN, TEXT[]);

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
    -- Base case: All direct neighbors (both outgoing and incoming)
    SELECT
      CASE
        WHEN dr.source_dossier_id = start_dossier_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS current_id,
      1 AS current_degree,
      ARRAY[start_dossier_id,
        CASE
          WHEN dr.source_dossier_id = start_dossier_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END
      ] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY[
        CASE
          WHEN dr.source_dossier_id = start_dossier_id THEN 'outgoing'::TEXT
          ELSE 'incoming'::TEXT
        END
      ] AS dir_path
    FROM dossier_relationships dr
    WHERE (dr.source_dossier_id = start_dossier_id OR dr.target_dossier_id = start_dossier_id)
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))

    UNION ALL

    -- Recursive case: Follow all edges from current nodes
    SELECT
      CASE
        WHEN dr.source_dossier_id = rg.current_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END,
      rg.current_degree + 1,
      rg.current_path || CASE
        WHEN dr.source_dossier_id = rg.current_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END,
      rg.rel_path || dr.relationship_type,
      rg.dir_path || CASE
        WHEN dr.source_dossier_id = rg.current_id THEN 'outgoing'::TEXT
        ELSE 'incoming'::TEXT
      END
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON (dr.source_dossier_id = rg.current_id OR dr.target_dossier_id = rg.current_id)
    WHERE rg.current_degree < max_degrees
      AND NOT (
        CASE
          WHEN dr.source_dossier_id = rg.current_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END = ANY(rg.current_path)
      )
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


-- ==================================================
-- Function: find_shortest_path_bidirectional (FIXED)
-- ==================================================

DROP FUNCTION IF EXISTS find_shortest_path_bidirectional(UUID, UUID, INTEGER, TEXT[], BOOLEAN);

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
    -- Base case: All neighbors of source
    SELECT
      ARRAY[source_id,
        CASE
          WHEN dr.source_dossier_id = source_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END
      ] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY[
        CASE
          WHEN dr.source_dossier_id = source_id THEN 'outgoing'::TEXT
          ELSE 'incoming'::TEXT
        END
      ] AS dir_path,
      1 AS depth,
      CASE
        WHEN dr.source_dossier_id = source_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS current_node
    FROM dossier_relationships dr
    JOIN dossiers d ON d.id = CASE
      WHEN dr.source_dossier_id = source_id THEN dr.target_dossier_id
      ELSE dr.source_dossier_id
    END
    WHERE (dr.source_dossier_id = source_id OR dr.target_dossier_id = source_id)
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Recursive case: Expand from current nodes
    SELECT
      ps.current_path || CASE
        WHEN dr.source_dossier_id = ps.current_node THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END,
      ps.rel_path || dr.relationship_type,
      ps.dir_path || CASE
        WHEN dr.source_dossier_id = ps.current_node THEN 'outgoing'::TEXT
        ELSE 'incoming'::TEXT
      END,
      ps.depth + 1,
      CASE
        WHEN dr.source_dossier_id = ps.current_node THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END
    FROM path_search ps
    JOIN dossier_relationships dr ON (dr.source_dossier_id = ps.current_node OR dr.target_dossier_id = ps.current_node)
    JOIN dossiers d ON d.id = CASE
      WHEN dr.source_dossier_id = ps.current_node THEN dr.target_dossier_id
      ELSE dr.source_dossier_id
    END
    WHERE ps.depth < max_depth
      AND NOT (
        CASE
          WHEN dr.source_dossier_id = ps.current_node THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END = ANY(ps.current_path)
      )
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


-- ==================================================
-- Function: find_all_paths (FIXED)
-- ==================================================

DROP FUNCTION IF EXISTS find_all_paths(UUID, UUID, INTEGER, INTEGER, TEXT[], BOOLEAN);

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
    -- Base case: All neighbors of source
    SELECT
      ARRAY[source_id,
        CASE
          WHEN dr.source_dossier_id = source_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END
      ] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY[
        CASE
          WHEN dr.source_dossier_id = source_id THEN 'outgoing'::TEXT
          ELSE 'incoming'::TEXT
        END
      ] AS dir_path,
      1 AS depth
    FROM dossier_relationships dr
    JOIN dossiers d ON d.id = CASE
      WHEN dr.source_dossier_id = source_id THEN dr.target_dossier_id
      ELSE dr.source_dossier_id
    END
    WHERE (dr.source_dossier_id = source_id OR dr.target_dossier_id = source_id)
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND d.status != 'deleted'
      AND d.sensitivity_level <= user_clearance

    UNION ALL

    -- Recursive case
    SELECT
      ap.current_path || CASE
        WHEN dr.source_dossier_id = ap.current_path[array_length(ap.current_path, 1)] THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END,
      ap.rel_path || dr.relationship_type,
      ap.dir_path || CASE
        WHEN dr.source_dossier_id = ap.current_path[array_length(ap.current_path, 1)] THEN 'outgoing'::TEXT
        ELSE 'incoming'::TEXT
      END,
      ap.depth + 1
    FROM all_paths ap
    JOIN dossier_relationships dr ON (
      dr.source_dossier_id = ap.current_path[array_length(ap.current_path, 1)]
      OR dr.target_dossier_id = ap.current_path[array_length(ap.current_path, 1)]
    )
    JOIN dossiers d ON d.id = CASE
      WHEN dr.source_dossier_id = ap.current_path[array_length(ap.current_path, 1)] THEN dr.target_dossier_id
      ELSE dr.source_dossier_id
    END
    WHERE ap.depth < max_depth
      AND NOT (
        CASE
          WHEN dr.source_dossier_id = ap.current_path[array_length(ap.current_path, 1)] THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END = ANY(ap.current_path)
      )
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


-- ==================================================
-- Function: find_connected_entities (FIXED)
-- ==================================================

DROP FUNCTION IF EXISTS find_connected_entities(UUID, INTEGER, TEXT[], BOOLEAN, TEXT[]);

CREATE OR REPLACE FUNCTION find_connected_entities(
  start_dossier_id UUID,
  max_entities INTEGER DEFAULT 100,
  relationship_types TEXT[] DEFAULT NULL,
  include_inactive BOOLEAN DEFAULT FALSE,
  dossier_type_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  min_distance INTEGER,
  connection_count BIGINT
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

    UNION ALL

    -- Follow all edges bidirectionally (single recursive term)
    SELECT
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
    JOIN dossier_relationships dr ON (dr.source_dossier_id = c.current_id OR dr.target_dossier_id = c.current_id)
    WHERE NOT (
        CASE
          WHEN dr.source_dossier_id = c.current_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END = ANY(c.visited)
      )
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
      AND c.distance < 10  -- Prevent infinite recursion
  ),
  -- Aggregate to get minimum distance
  entity_stats AS (
    SELECT
      c.current_id,
      MIN(c.distance) AS min_dist
    FROM connected c
    GROUP BY c.current_id
  ),
  -- Count connections per entity
  conn_counts AS (
    SELECT
      es.current_id,
      es.min_dist,
      COUNT(DISTINCT dr.id) AS conn_cnt
    FROM entity_stats es
    LEFT JOIN dossier_relationships dr ON (dr.source_dossier_id = es.current_id OR dr.target_dossier_id = es.current_id)
      AND (include_inactive OR dr.status = 'active')
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_types IS NULL OR dr.relationship_type = ANY(relationship_types))
    GROUP BY es.current_id, es.min_dist
  )
  SELECT
    d.id,
    d.type,
    d.name_en,
    d.name_ar,
    d.status,
    cc.min_dist AS min_distance,
    cc.conn_cnt AS connection_count
  FROM conn_counts cc
  JOIN dossiers d ON d.id = cc.current_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= user_clearance
    AND (dossier_type_filter IS NULL OR d.type = ANY(dossier_type_filter))
  ORDER BY cc.min_dist, d.name_en
  LIMIT max_entities;
END;
$$;

GRANT EXECUTE ON FUNCTION find_connected_entities(UUID, INTEGER, TEXT[], BOOLEAN, TEXT[]) TO authenticated;


-- ==================================================
-- Function: get_graph_statistics (FIXED)
-- ==================================================
-- Need to fix the call to traverse_relationship_graph_bidirectional since it returns different columns now

DROP FUNCTION IF EXISTS get_graph_statistics(UUID, INTEGER, TEXT[], BOOLEAN);

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
      SELECT t.dossier_id
      FROM traverse_relationship_graph_bidirectional(
        start_dossier_id,
        max_degrees,
        relationship_types,
        include_inactive,
        NULL
      ) t
      UNION
      SELECT start_dossier_id
    ),
    subgraph_edges AS (
      SELECT DISTINCT dr.id, dr.source_dossier_id, dr.target_dossier_id
      FROM dossier_relationships dr
      WHERE dr.source_dossier_id IN (SELECT sn.dossier_id FROM subgraph_nodes sn)
        AND dr.target_dossier_id IN (SELECT sn.dossier_id FROM subgraph_nodes sn)
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
        WHEN (SELECT COUNT(*) FROM subgraph_nodes) <= 1 THEN 0::NUMERIC
        ELSE ROUND(
          (SELECT COUNT(*) FROM subgraph_edges)::NUMERIC * 2 /
          ((SELECT COUNT(*) FROM subgraph_nodes) * ((SELECT COUNT(*) FROM subgraph_nodes) - 1)),
          4
        )
      END AS graph_density,
      ROUND((SELECT AVG(degree) FROM node_degrees), 2) AS avg_degree,
      (SELECT COALESCE(MAX(degree), 0) FROM node_degrees)::BIGINT AS max_degree,
      (SELECT COUNT(*) FROM node_degrees WHERE degree = 0)::BIGINT AS isolated_nodes,
      COALESCE((SELECT jsonb_object_agg(type, cnt) FROM type_counts), '{}'::JSONB) AS dossier_type_distribution;
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
        WHEN (SELECT COUNT(*) FROM visible_dossiers) <= 1 THEN 0::NUMERIC
        ELSE ROUND(
          (SELECT COUNT(*) FROM visible_edges)::NUMERIC * 2 /
          ((SELECT COUNT(*) FROM visible_dossiers) * ((SELECT COUNT(*) FROM visible_dossiers) - 1)),
          4
        )
      END AS graph_density,
      ROUND((SELECT AVG(degree) FROM node_degrees), 2) AS avg_degree,
      (SELECT COALESCE(MAX(degree), 0) FROM node_degrees)::BIGINT AS max_degree,
      (SELECT COUNT(*) FROM node_degrees WHERE degree = 0)::BIGINT AS isolated_nodes,
      COALESCE((SELECT jsonb_object_agg(type, cnt) FROM type_counts), '{}'::JSONB) AS dossier_type_distribution;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_graph_statistics(UUID, INTEGER, TEXT[], BOOLEAN) TO authenticated;

-- Add comments
COMMENT ON FUNCTION traverse_relationship_graph_bidirectional IS
'Bidirectional recursive graph traversal. Finds all entities within N degrees of separation following both incoming and outgoing relationships. Fixed recursive CTE structure.';

COMMENT ON FUNCTION find_shortest_path_bidirectional IS
'Finds the shortest path between two dossiers using bidirectional search. Fixed recursive CTE structure.';

COMMENT ON FUNCTION find_all_paths IS
'Finds all unique paths between two dossiers up to a specified depth and count limit. Fixed recursive CTE structure.';

COMMENT ON FUNCTION find_connected_entities IS
'Finds all entities in the connected component containing the starting dossier. Returns entities with their minimum distance and connection count. Fixed recursive CTE structure.';

COMMENT ON FUNCTION get_graph_statistics IS
'Calculates network statistics for the entire graph or a subgraph. Fixed to work with updated traverse function.';
