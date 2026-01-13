-- Citation Tracking System Migration
-- Description: Automatically detect and track citations between dossiers, briefs,
--              and external sources. Enables visualization of citation networks and
--              alerts when referenced documents are updated or archived.
-- Author: Claude Code
-- Date: 2026-01-12
-- Feature: citation-tracking

-- ENUM TYPES
CREATE TYPE citation_source_type AS ENUM (
    'dossier', 'brief', 'ai_brief', 'document', 'position', 'mou', 'engagement',
    'external_url', 'external_document', 'academic_paper', 'news_article', 'government_doc', 'report'
);

CREATE TYPE citation_status AS ENUM ('active', 'source_updated', 'source_archived', 'source_deleted', 'broken');

CREATE TYPE citation_detection_method AS ENUM ('manual', 'ai_detected', 'auto_link', 'import');

CREATE TYPE citation_alert_type AS ENUM ('source_updated', 'source_archived', 'source_deleted', 'link_broken', 'new_version');

-- ENTITY CITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.entity_citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    citing_entity_type citation_source_type NOT NULL,
    citing_entity_id UUID NOT NULL,
    cited_entity_type citation_source_type NOT NULL,
    cited_entity_id UUID,
    external_url TEXT,
    external_title TEXT,
    external_author TEXT,
    external_publication_date DATE,
    external_accessed_date DATE,
    external_metadata JSONB DEFAULT '{}',
    citation_context TEXT,
    citation_location JSONB,
    citation_note TEXT,
    relevance_score DECIMAL(3, 2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    status citation_status NOT NULL DEFAULT 'active',
    detection_method citation_detection_method NOT NULL DEFAULT 'manual',
    cited_version_at TIMESTAMPTZ,
    cited_version_hash TEXT,
    last_verified_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_internal_citation CHECK (
        (cited_entity_id IS NOT NULL AND cited_entity_type IN ('dossier', 'brief', 'ai_brief', 'document', 'position', 'mou', 'engagement'))
        OR (cited_entity_id IS NULL AND cited_entity_type IN ('external_url', 'external_document', 'academic_paper', 'news_article', 'government_doc', 'report') AND external_url IS NOT NULL)
    ),
    CONSTRAINT no_self_citation CHECK (NOT (citing_entity_type = cited_entity_type AND citing_entity_id = cited_entity_id))
);

CREATE INDEX idx_entity_citations_citing ON public.entity_citations(citing_entity_type, citing_entity_id);
CREATE INDEX idx_entity_citations_cited ON public.entity_citations(cited_entity_type, cited_entity_id) WHERE cited_entity_id IS NOT NULL;
CREATE INDEX idx_entity_citations_org ON public.entity_citations(organization_id);
CREATE INDEX idx_entity_citations_status ON public.entity_citations(status) WHERE status != 'active';
CREATE INDEX idx_entity_citations_external ON public.entity_citations(external_url) WHERE external_url IS NOT NULL;
CREATE INDEX idx_entity_citations_created ON public.entity_citations(created_at DESC);
CREATE INDEX idx_entity_citations_external_meta ON public.entity_citations USING GIN (external_metadata) WHERE external_metadata IS NOT NULL AND external_metadata != '{}'::JSONB;

-- CITATION ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.citation_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    citation_id UUID NOT NULL REFERENCES public.entity_citations(id) ON DELETE CASCADE,
    alert_type citation_alert_type NOT NULL,
    message TEXT NOT NULL,
    message_ar TEXT,
    old_value JSONB,
    new_value JSONB,
    change_summary TEXT,
    affected_users UUID[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_citation_alerts_citation ON public.citation_alerts(citation_id);
CREATE INDEX idx_citation_alerts_org ON public.citation_alerts(organization_id);
CREATE INDEX idx_citation_alerts_unread ON public.citation_alerts(organization_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_citation_alerts_unresolved ON public.citation_alerts(organization_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_citation_alerts_users ON public.citation_alerts USING GIN (affected_users);

-- CITATION NETWORK MATERIALIZED VIEW
CREATE MATERIALIZED VIEW IF NOT EXISTS citation_network AS
SELECT
    ec.id AS citation_id, ec.organization_id,
    ec.citing_entity_type AS source_type, ec.citing_entity_id AS source_id,
    COALESCE(sd.name_en, sb.title, sab.title, sdoc.title, sp.title_en, sm.title, se.location_en, ec.citing_entity_id::text) AS source_name,
    COALESCE(sd.name_ar, sb.title, sab.title, sdoc.title, sp.title_ar, sm.title_ar, se.location_ar, ec.citing_entity_id::text) AS source_name_ar,
    ec.cited_entity_type AS target_type, ec.cited_entity_id AS target_id,
    COALESCE(ec.external_title, td.name_en, tb.title, tab.title, tdoc.title, tp.title_en, tm.title, te.location_en, ec.cited_entity_id::text) AS target_name,
    COALESCE(ec.external_title, td.name_ar, tb.title, tab.title, tdoc.title, tp.title_ar, tm.title_ar, te.location_ar, ec.cited_entity_id::text) AS target_name_ar,
    ec.status, ec.relevance_score, ec.confidence_score, ec.detection_method, ec.created_at, ec.external_url,
    ROW_NUMBER() OVER (PARTITION BY ec.citing_entity_id ORDER BY ec.created_at DESC) AS citation_rank
FROM public.entity_citations ec
LEFT JOIN dossiers sd ON ec.citing_entity_type = 'dossier' AND ec.citing_entity_id = sd.id
LEFT JOIN briefs sb ON ec.citing_entity_type = 'brief' AND ec.citing_entity_id = sb.id
LEFT JOIN ai_briefs sab ON ec.citing_entity_type = 'ai_brief' AND ec.citing_entity_id = sab.id
LEFT JOIN documents sdoc ON ec.citing_entity_type = 'document' AND ec.citing_entity_id = sdoc.id
LEFT JOIN positions sp ON ec.citing_entity_type = 'position' AND ec.citing_entity_id = sp.id
LEFT JOIN mous sm ON ec.citing_entity_type = 'mou' AND ec.citing_entity_id = sm.id
LEFT JOIN engagements se ON ec.citing_entity_type = 'engagement' AND ec.citing_entity_id = se.id
LEFT JOIN dossiers td ON ec.cited_entity_type = 'dossier' AND ec.cited_entity_id = td.id
LEFT JOIN briefs tb ON ec.cited_entity_type = 'brief' AND ec.cited_entity_id = tb.id
LEFT JOIN ai_briefs tab ON ec.cited_entity_type = 'ai_brief' AND ec.cited_entity_id = tab.id
LEFT JOIN documents tdoc ON ec.cited_entity_type = 'document' AND ec.cited_entity_id = tdoc.id
LEFT JOIN positions tp ON ec.cited_entity_type = 'position' AND ec.cited_entity_id = tp.id
LEFT JOIN mous tm ON ec.cited_entity_type = 'mou' AND ec.cited_entity_id = tm.id
LEFT JOIN engagements te ON ec.cited_entity_type = 'engagement' AND ec.cited_entity_id = te.id
WHERE ec.status = 'active';

CREATE UNIQUE INDEX idx_citation_network_id ON citation_network(citation_id);
CREATE INDEX idx_citation_network_source ON citation_network(source_type, source_id);
CREATE INDEX idx_citation_network_target ON citation_network(target_type, target_id);
CREATE INDEX idx_citation_network_org ON citation_network(organization_id);

-- CITATION STATISTICS VIEW
CREATE OR REPLACE VIEW citation_statistics AS
SELECT entity_type, entity_id, organization_id, outgoing_citations, incoming_citations, external_citations, total_citations, avg_relevance_score, last_citation_at
FROM (
    SELECT citing_entity_type AS entity_type, citing_entity_id AS entity_id, organization_id,
        COUNT(*) AS outgoing_citations, 0 AS incoming_citations,
        COUNT(*) FILTER (WHERE cited_entity_type IN ('external_url', 'external_document', 'academic_paper', 'news_article', 'government_doc', 'report')) AS external_citations,
        COUNT(*) AS total_citations, AVG(relevance_score)::DECIMAL(3, 2) AS avg_relevance_score, MAX(created_at) AS last_citation_at
    FROM public.entity_citations WHERE status = 'active' GROUP BY citing_entity_type, citing_entity_id, organization_id
    UNION ALL
    SELECT cited_entity_type AS entity_type, cited_entity_id AS entity_id, organization_id,
        0 AS outgoing_citations, COUNT(*) AS incoming_citations, 0 AS external_citations,
        COUNT(*) AS total_citations, AVG(relevance_score)::DECIMAL(3, 2) AS avg_relevance_score, MAX(created_at) AS last_citation_at
    FROM public.entity_citations WHERE status = 'active' AND cited_entity_id IS NOT NULL GROUP BY cited_entity_type, cited_entity_id, organization_id
) combined GROUP BY entity_type, entity_id, organization_id, outgoing_citations, incoming_citations, external_citations, total_citations, avg_relevance_score, last_citation_at;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_entity_citations(p_entity_type citation_source_type, p_entity_id UUID, p_direction TEXT DEFAULT 'both', p_include_external BOOLEAN DEFAULT TRUE, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (citation_id UUID, direction TEXT, related_entity_type citation_source_type, related_entity_id UUID, related_entity_name TEXT, external_url TEXT, external_title TEXT, status citation_status, relevance_score DECIMAL, detection_method citation_detection_method, citation_context TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    WITH outgoing AS (
        SELECT cn.citation_id, 'outgoing'::TEXT, cn.target_type, cn.target_id, cn.target_name, cn.external_url, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM citation_network cn JOIN entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.source_type = p_entity_type AND cn.source_id = p_entity_id AND (p_include_external OR cn.target_id IS NOT NULL)
    ),
    incoming AS (
        SELECT cn.citation_id, 'incoming'::TEXT, cn.source_type, cn.source_id, cn.source_name, NULL::TEXT, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM citation_network cn JOIN entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.target_type = p_entity_type AND cn.target_id = p_entity_id
    )
    SELECT o.* FROM outgoing o WHERE p_direction IN ('outgoing', 'both')
    UNION ALL SELECT i.* FROM incoming i WHERE p_direction IN ('incoming', 'both')
    ORDER BY created_at DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id UUID, p_depth INTEGER DEFAULT 2, p_max_nodes INTEGER DEFAULT 50)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    WITH RECURSIVE citation_tree AS (
        SELECT p_start_entity_type AS entity_type, p_start_entity_id AS entity_id, 0 AS depth, ARRAY[p_start_entity_id] AS path
        UNION SELECT cn.target_type, cn.target_id, ct.depth + 1, ct.path || cn.target_id FROM citation_tree ct JOIN citation_network cn ON cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id WHERE ct.depth < p_depth AND cn.target_id IS NOT NULL AND NOT cn.target_id = ANY(ct.path)
        UNION SELECT cn.source_type, cn.source_id, ct.depth + 1, ct.path || cn.source_id FROM citation_tree ct JOIN citation_network cn ON cn.target_type = ct.entity_type AND cn.target_id = ct.entity_id WHERE ct.depth < p_depth AND NOT cn.source_id = ANY(ct.path)
    ),
    nodes AS (SELECT DISTINCT ON (entity_id) entity_type, entity_id, MIN(depth) AS depth FROM citation_tree GROUP BY entity_type, entity_id ORDER BY entity_id, depth LIMIT p_max_nodes),
    edges AS (SELECT DISTINCT cn.citation_id AS id, cn.source_type, cn.source_id, cn.target_type, cn.target_id, cn.status, cn.relevance_score FROM citation_network cn WHERE (cn.source_type, cn.source_id) IN (SELECT entity_type, entity_id FROM nodes) AND (cn.target_type, cn.target_id) IN (SELECT entity_type, entity_id FROM nodes))
    SELECT json_build_object(
        'nodes', (SELECT json_agg(json_build_object('id', n.entity_id, 'type', n.entity_type, 'depth', n.depth, 'name', COALESCE(d.name_en, b.title, ab.title, doc.title, p.title_en, m.title, e.location_en, n.entity_id::text), 'name_ar', COALESCE(d.name_ar, b.title, ab.title, doc.title, p.title_ar, m.title_ar, e.location_ar, n.entity_id::text)))
            FROM nodes n LEFT JOIN dossiers d ON n.entity_type = 'dossier' AND n.entity_id = d.id LEFT JOIN briefs b ON n.entity_type = 'brief' AND n.entity_id = b.id LEFT JOIN ai_briefs ab ON n.entity_type = 'ai_brief' AND n.entity_id = ab.id LEFT JOIN documents doc ON n.entity_type = 'document' AND n.entity_id = doc.id LEFT JOIN positions p ON n.entity_type = 'position' AND n.entity_id = p.id LEFT JOIN mous m ON n.entity_type = 'mou' AND n.entity_id = m.id LEFT JOIN engagements e ON n.entity_type = 'engagement' AND n.entity_id = e.id),
        'edges', (SELECT json_agg(json_build_object('id', ed.id, 'source', ed.source_id, 'target', ed.target_id, 'source_type', ed.source_type, 'target_type', ed.target_type, 'relevance_score', ed.relevance_score)) FROM edges ed),
        'start_node', p_start_entity_id, 'depth', p_depth, 'total_nodes', (SELECT COUNT(*) FROM nodes)
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION create_citation(p_citing_type citation_source_type, p_citing_id UUID, p_cited_type citation_source_type, p_cited_id UUID DEFAULT NULL, p_external_url TEXT DEFAULT NULL, p_external_title TEXT DEFAULT NULL, p_context TEXT DEFAULT NULL, p_relevance_score DECIMAL DEFAULT NULL, p_detection_method citation_detection_method DEFAULT 'manual', p_organization_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE v_citation_id UUID; v_org_id UUID;
BEGIN
    IF p_organization_id IS NULL THEN
        SELECT organization_id INTO v_org_id FROM (SELECT organization_id FROM dossiers WHERE id = p_citing_id AND p_citing_type = 'dossier' UNION ALL SELECT organization_id FROM briefs WHERE id = p_citing_id AND p_citing_type = 'brief' UNION ALL SELECT organization_id FROM ai_briefs WHERE id = p_citing_id AND p_citing_type = 'ai_brief') orgs LIMIT 1;
    ELSE v_org_id := p_organization_id; END IF;
    INSERT INTO entity_citations (organization_id, citing_entity_type, citing_entity_id, cited_entity_type, cited_entity_id, external_url, external_title, citation_context, relevance_score, detection_method, created_by, cited_version_at)
    VALUES (v_org_id, p_citing_type, p_citing_id, p_cited_type, p_cited_id, p_external_url, p_external_title, p_context, p_relevance_score, p_detection_method, auth.uid(), NOW()) RETURNING id INTO v_citation_id;
    RETURN v_citation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_citation_source_updates() RETURNS INTEGER AS $$
DECLARE v_count INTEGER := 0; v_citation RECORD; v_source_updated_at TIMESTAMPTZ; v_source_status TEXT;
BEGIN
    FOR v_citation IN SELECT ec.* FROM entity_citations ec WHERE ec.status = 'active' AND ec.cited_entity_id IS NOT NULL AND (ec.last_verified_at IS NULL OR ec.last_verified_at < NOW() - INTERVAL '1 day') LOOP
        CASE v_citation.cited_entity_type
            WHEN 'dossier' THEN SELECT updated_at, status INTO v_source_updated_at, v_source_status FROM dossiers WHERE id = v_citation.cited_entity_id;
            WHEN 'brief' THEN SELECT updated_at, status INTO v_source_updated_at, v_source_status FROM briefs WHERE id = v_citation.cited_entity_id;
            WHEN 'ai_brief' THEN SELECT completed_at, status INTO v_source_updated_at, v_source_status FROM ai_briefs WHERE id = v_citation.cited_entity_id;
            WHEN 'document' THEN SELECT updated_at, 'active' INTO v_source_updated_at, v_source_status FROM documents WHERE id = v_citation.cited_entity_id;
            WHEN 'position' THEN SELECT updated_at, status INTO v_source_updated_at, v_source_status FROM positions WHERE id = v_citation.cited_entity_id;
            ELSE CONTINUE;
        END CASE;
        IF v_source_updated_at IS NULL THEN
            UPDATE entity_citations SET status = 'source_deleted', updated_at = NOW() WHERE id = v_citation.id;
            INSERT INTO citation_alerts (organization_id, citation_id, alert_type, message, message_ar) VALUES (v_citation.organization_id, v_citation.id, 'source_deleted', 'Referenced source has been deleted', 'تم حذف المصدر المرجعي');
            v_count := v_count + 1; CONTINUE;
        END IF;
        IF v_source_status = 'archived' AND v_citation.status = 'active' THEN
            UPDATE entity_citations SET status = 'source_archived', updated_at = NOW() WHERE id = v_citation.id;
            INSERT INTO citation_alerts (organization_id, citation_id, alert_type, message, message_ar) VALUES (v_citation.organization_id, v_citation.id, 'source_archived', 'Referenced source has been archived', 'تم أرشفة المصدر المرجعي');
            v_count := v_count + 1; CONTINUE;
        END IF;
        IF v_citation.cited_version_at IS NOT NULL AND v_source_updated_at > v_citation.cited_version_at THEN
            UPDATE entity_citations SET status = 'source_updated', updated_at = NOW() WHERE id = v_citation.id;
            INSERT INTO citation_alerts (organization_id, citation_id, alert_type, message, message_ar, old_value, new_value) VALUES (v_citation.organization_id, v_citation.id, 'source_updated', 'Referenced source has been updated', 'تم تحديث المصدر المرجعي', jsonb_build_object('version_at', v_citation.cited_version_at), jsonb_build_object('version_at', v_source_updated_at));
            v_count := v_count + 1;
        END IF;
        UPDATE entity_citations SET last_verified_at = NOW() WHERE id = v_citation.id;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_citation_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_citation_updated BEFORE UPDATE ON entity_citations FOR EACH ROW EXECUTE FUNCTION update_citation_timestamp();

CREATE OR REPLACE FUNCTION refresh_citation_network_on_change() RETURNS TRIGGER AS $$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY citation_network; RETURN NULL; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_refresh_citation_network AFTER INSERT OR UPDATE OR DELETE ON entity_citations FOR EACH STATEMENT EXECUTE FUNCTION refresh_citation_network_on_change();

-- ROW LEVEL SECURITY
ALTER TABLE entity_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view citations in their organization" ON entity_citations FOR SELECT TO authenticated USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid() AND om.left_at IS NULL));
CREATE POLICY "Users can create citations in their organization" ON entity_citations FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid() AND om.left_at IS NULL));
CREATE POLICY "Users can update citations they created" ON entity_citations FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Users can delete citations they created" ON entity_citations FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Service role full access to citations" ON entity_citations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view alerts in their organization" ON citation_alerts FOR SELECT TO authenticated USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid() AND om.left_at IS NULL) OR auth.uid() = ANY(affected_users));
CREATE POLICY "Service role full access to alerts" ON citation_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE entity_citations IS 'Tracks citations between dossiers, briefs, documents, and external sources';
COMMENT ON TABLE citation_alerts IS 'Alerts when cited sources are updated, archived, or deleted';
