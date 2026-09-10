CREATE OR REPLACE FUNCTION public.get_user_productivity_metrics(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  user_id uuid,
  completed_count_30d bigint,
  on_time_rate_30d numeric,
  avg_completion_hours_30d numeric,
  completed_count_all bigint,
  on_time_rate_all numeric,
  avg_completion_hours_all numeric,
  commitment_completed_30d bigint,
  task_completed_30d bigint,
  intake_completed_30d bigint,
  last_refreshed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.user_id,
    pm.completed_count_30d,
    pm.on_time_rate_30d,
    pm.avg_completion_hours_30d,
    pm.completed_count_all,
    pm.on_time_rate_all,
    pm.avg_completion_hours_all,
    pm.commitment_completed_30d,
    pm.task_completed_30d,
    pm.intake_completed_30d,
    pm.last_refreshed_at
  FROM public.user_productivity_metrics pm
  WHERE pm.user_id = p_user_id
    AND pm.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_entity_citations(
  p_entity_type citation_source_type,
  p_entity_id uuid,
  p_direction text DEFAULT 'both',
  p_include_external boolean DEFAULT true,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  citation_id uuid,
  direction text,
  related_entity_type citation_source_type,
  related_entity_id uuid,
  related_entity_name text,
  external_url text,
  external_title text,
  status citation_status,
  relevance_score numeric,
  detection_method citation_detection_method,
  citation_context text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH outgoing AS (
        SELECT cn.citation_id, 'outgoing'::TEXT, cn.target_type, cn.target_id, cn.target_name, cn.external_url, ec.external_title, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM public.citation_network cn JOIN public.entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.source_type = p_entity_type
          AND cn.source_id = p_entity_id
          AND (p_include_external OR cn.target_id IS NOT NULL)
          AND ec.organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
              AND om.left_at IS NULL
          )
    ),
    incoming AS (
        SELECT cn.citation_id, 'incoming'::TEXT, cn.source_type, cn.source_id, cn.source_name, NULL::TEXT, ec.external_title, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM public.citation_network cn JOIN public.entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.target_type = p_entity_type
          AND cn.target_id = p_entity_id
          AND ec.organization_id IN (
            SELECT om.organization_id
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
              AND om.left_at IS NULL
          )
    )
    SELECT o.* FROM outgoing o WHERE p_direction IN ('outgoing', 'both')
    UNION ALL SELECT i.* FROM incoming i WHERE p_direction IN ('incoming', 'both')
    ORDER BY created_at DESC LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_citation_network_graph(
  p_start_entity_type citation_source_type,
  p_start_entity_id uuid,
  p_depth integer DEFAULT 2,
  p_max_nodes integer DEFAULT 50
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
    WITH RECURSIVE citation_tree AS (
        SELECT p_start_entity_type AS entity_type, p_start_entity_id AS entity_id, 0 AS depth, ARRAY[p_start_entity_id] AS path
        WHERE EXISTS (
            SELECT 1
            FROM public.entity_citations ec
            WHERE ec.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_members om
                WHERE om.user_id = auth.uid()
                  AND om.left_at IS NULL
            )
            AND (
                (ec.citing_entity_type = p_start_entity_type AND ec.citing_entity_id = p_start_entity_id)
                OR (ec.cited_entity_type = p_start_entity_type AND ec.cited_entity_id = p_start_entity_id)
            )
        )
        UNION SELECT cn.target_type, cn.target_id, ct.depth + 1, ct.path || cn.target_id FROM citation_tree ct JOIN public.citation_network cn ON cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id WHERE ct.depth < p_depth AND cn.target_id IS NOT NULL AND NOT cn.target_id = ANY(ct.path)
          AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid() AND om.left_at IS NULL AND om.organization_id = cn.organization_id
          )
        UNION SELECT cn.source_type, cn.source_id, ct.depth + 1, ct.path || cn.source_id FROM citation_tree ct JOIN public.citation_network cn ON cn.target_type = ct.entity_type AND cn.target_id = ct.entity_id WHERE ct.depth < p_depth AND NOT cn.source_id = ANY(ct.path)
          AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid() AND om.left_at IS NULL AND om.organization_id = cn.organization_id
          )
    ),
    nodes AS (SELECT DISTINCT ON (entity_id) entity_type, entity_id, MIN(depth) AS depth FROM citation_tree GROUP BY entity_type, entity_id ORDER BY entity_id, depth LIMIT p_max_nodes),
    edges AS (SELECT DISTINCT cn.citation_id AS id, cn.source_type, cn.source_id, cn.target_type, cn.target_id, cn.status, cn.relevance_score FROM public.citation_network cn WHERE (cn.source_type, cn.source_id) IN (SELECT entity_type, entity_id FROM nodes) AND (cn.target_type, cn.target_id) IN (SELECT entity_type, entity_id FROM nodes)
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid() AND om.left_at IS NULL AND om.organization_id = cn.organization_id
        ))
    SELECT json_build_object(
        'nodes', (SELECT json_agg(json_build_object('id', n.entity_id, 'type', n.entity_type, 'depth', n.depth, 'name', COALESCE(d.name_en, b.title, ab.title, doc.title, p.title_en, m.title, e.location_en, n.entity_id::text), 'name_ar', COALESCE(d.name_ar, b.title, ab.title, doc.title, p.title_ar, m.title_ar, e.location_ar, n.entity_id::text)))
            FROM nodes n LEFT JOIN public.dossiers d ON n.entity_type = 'dossier' AND n.entity_id = d.id LEFT JOIN public.briefs b ON n.entity_type = 'brief' AND n.entity_id = b.id LEFT JOIN public.ai_briefs ab ON n.entity_type = 'ai_brief' AND n.entity_id = ab.id LEFT JOIN public.documents doc ON n.entity_type = 'document' AND n.entity_id = doc.id LEFT JOIN public.positions p ON n.entity_type = 'position' AND n.entity_id = p.id LEFT JOIN public.mous m ON n.entity_type = 'mou' AND n.entity_id = m.id LEFT JOIN public.engagements e ON n.entity_type = 'engagement' AND n.entity_id = e.id),
        'edges', (SELECT json_agg(json_build_object('id', ed.id, 'source', ed.source_id, 'target', ed.target_id, 'source_type', ed.source_type, 'target_type', ed.target_type, 'relevance_score', ed.relevance_score)) FROM edges ed),
        'start_node', p_start_entity_id, 'depth', p_depth, 'total_nodes', (SELECT COUNT(*) FROM nodes)
    ) INTO result;
    RETURN result;
END;
$$;

ALTER FUNCTION public.refresh_citation_network_on_change()
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.refresh_relationship_health_stats()
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION public.refresh_aa_commitment_summary()
  SECURITY DEFINER
  SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_relationship_health_summary()
RETURNS SETOF public.relationship_health_summary
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rhs.*
  FROM public.relationship_health_summary rhs
  WHERE EXISTS (
    SELECT 1
    FROM public.dossiers source_dossier
    WHERE source_dossier.id = rhs.source_dossier_id
      AND source_dossier.sensitivity_level <= (SELECT COALESCE(p.clearance_level, 1) FROM public.profiles p WHERE p.user_id = auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.dossiers target_dossier
    WHERE target_dossier.id = rhs.target_dossier_id
      AND target_dossier.sensitivity_level <= (SELECT COALESCE(p.clearance_level, 1) FROM public.profiles p WHERE p.user_id = auth.uid())
  )
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_productivity_metrics(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_entity_citations(citation_source_type, uuid, text, boolean, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_citation_network_graph(citation_source_type, uuid, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_citation_network_on_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_relationship_health_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_aa_commitment_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_relationship_health_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_relationship_health_summary() TO authenticated, service_role;

REVOKE ALL ON public.user_productivity_metrics FROM anon, authenticated;
REVOKE ALL ON public.relationship_engagement_stats FROM anon, authenticated;
REVOKE ALL ON public.relationship_commitment_stats FROM anon, authenticated;
REVOKE ALL ON public.citation_network FROM anon, authenticated;
REVOKE ALL ON public.aa_commitment_summary_by_dossier FROM anon, authenticated;
