-- =============================================================================
-- Phase 63: Redefine traverse_relationship_graph with bidirectional traversal
--
-- The return shape changes by adding direction_path, so this must be DROP +
-- CREATE rather than CREATE OR REPLACE. Keep the legacy input signature intact
-- for PostgREST named-argument callers.
-- =============================================================================

DROP FUNCTION IF EXISTS traverse_relationship_graph(UUID, INTEGER, TEXT);

CREATE FUNCTION traverse_relationship_graph(
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
  relationship_path TEXT[],
  direction_path TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE relationship_graph AS (
    -- Base case: outgoing and incoming relationships from the starting dossier.
    SELECT
      CASE
        WHEN dr.source_dossier_id = start_dossier_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS node_id,
      1 AS degree,
      ARRAY[
        start_dossier_id,
        CASE
          WHEN dr.source_dossier_id = start_dossier_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END
      ] AS path,
      ARRAY[dr.relationship_type] AS relationship_path,
      ARRAY[
        CASE
          WHEN dr.source_dossier_id = start_dossier_id THEN 'outgoing'::TEXT
          ELSE 'incoming'::TEXT
        END
      ] AS direction_path
    FROM dossier_relationships dr
    WHERE (dr.source_dossier_id = start_dossier_id OR dr.target_dossier_id = start_dossier_id)
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)

    UNION

    -- Recursive case: follow outgoing and incoming edges from each reached dossier.
    SELECT
      CASE
        WHEN dr.source_dossier_id = rg.node_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS node_id,
      rg.degree + 1 AS degree,
      rg.path || CASE
        WHEN dr.source_dossier_id = rg.node_id THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END AS path,
      rg.relationship_path || dr.relationship_type AS relationship_path,
      rg.direction_path || CASE
        WHEN dr.source_dossier_id = rg.node_id THEN 'outgoing'::TEXT
        ELSE 'incoming'::TEXT
      END AS direction_path
    FROM relationship_graph rg
    JOIN dossier_relationships dr
      ON dr.source_dossier_id = rg.node_id OR dr.target_dossier_id = rg.node_id
    WHERE rg.degree < max_degrees
      AND NOT (
        CASE
          WHEN dr.source_dossier_id = rg.node_id THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END = ANY(rg.path)
      )
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
    rg.relationship_path,
    rg.direction_path
  FROM relationship_graph rg
  JOIN dossiers d ON d.id = rg.node_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= (
      SELECT COALESCE(clearance_level, 1)
      FROM profiles
      WHERE user_id = auth.uid()
    )
  ORDER BY d.id, rg.degree
$$;

GRANT EXECUTE ON FUNCTION traverse_relationship_graph(UUID, INTEGER, TEXT) TO authenticated;
