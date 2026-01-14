-- Migration: Stakeholder Influence Analysis
-- Feature: stakeholder-influence-visualization
-- Date: 2026-01-14
-- Purpose: Analyze stakeholder influence based on relationship strength,
--          engagement frequency, and network position. Identify key connectors,
--          decision-makers, and clusters for strategic planning.

-- ============================================================================
-- Influence Score Types
-- ============================================================================

-- Create enum for influence tier classification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'influence_tier') THEN
    CREATE TYPE influence_tier AS ENUM (
      'key_influencer',     -- Top 10% - most influential stakeholders
      'high_influence',     -- 70-90th percentile
      'moderate_influence', -- 40-70th percentile
      'low_influence',      -- 10-40th percentile
      'peripheral'          -- Bottom 10%
    );
  END IF;
END $$;

-- Create enum for stakeholder role classification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stakeholder_role') THEN
    CREATE TYPE stakeholder_role AS ENUM (
      'hub',           -- High degree centrality - many direct connections
      'bridge',        -- High betweenness - connects different groups
      'gatekeeper',    -- Controls access to clusters
      'peripheral',    -- Few connections, edge of network
      'isolate'        -- No or minimal connections
    );
  END IF;
END $$;

-- ============================================================================
-- Stakeholder Influence Scores Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_influence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The dossier being scored (stakeholder)
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Network Position Metrics (0-100)
  degree_centrality_score INTEGER NOT NULL DEFAULT 0
    CHECK (degree_centrality_score >= 0 AND degree_centrality_score <= 100),
  betweenness_centrality_score INTEGER NOT NULL DEFAULT 0
    CHECK (betweenness_centrality_score >= 0 AND betweenness_centrality_score <= 100),
  closeness_centrality_score INTEGER NOT NULL DEFAULT 0
    CHECK (closeness_centrality_score >= 0 AND closeness_centrality_score <= 100),
  eigenvector_centrality_score INTEGER NOT NULL DEFAULT 0
    CHECK (eigenvector_centrality_score >= 0 AND eigenvector_centrality_score <= 100),

  -- Engagement Metrics (0-100)
  engagement_frequency_score INTEGER NOT NULL DEFAULT 0
    CHECK (engagement_frequency_score >= 0 AND engagement_frequency_score <= 100),
  engagement_reach_score INTEGER NOT NULL DEFAULT 0
    CHECK (engagement_reach_score >= 0 AND engagement_reach_score <= 100),

  -- Relationship Strength (0-100)
  avg_relationship_health INTEGER NOT NULL DEFAULT 0
    CHECK (avg_relationship_health >= 0 AND avg_relationship_health <= 100),
  strong_relationships_count INTEGER NOT NULL DEFAULT 0,
  weak_relationships_count INTEGER NOT NULL DEFAULT 0,

  -- Overall Influence Score (0-100, weighted composite)
  overall_influence_score INTEGER NOT NULL DEFAULT 0
    CHECK (overall_influence_score >= 0 AND overall_influence_score <= 100),

  -- Classification
  influence_tier influence_tier NOT NULL DEFAULT 'peripheral',
  stakeholder_role stakeholder_role NOT NULL DEFAULT 'peripheral',

  -- Raw Metrics (for detailed analysis)
  raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Cluster Information
  cluster_id INTEGER,
  cluster_role TEXT CHECK (cluster_role IN ('leader', 'member', 'bridge', NULL)),

  -- Calculation timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW() - INTERVAL '365 days',
  period_end TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one score per dossier
  CONSTRAINT unique_stakeholder_influence_score UNIQUE (dossier_id)
);

-- ============================================================================
-- Influence History Table (for trend analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_influence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  overall_influence_score INTEGER NOT NULL,
  degree_centrality_score INTEGER NOT NULL,
  betweenness_centrality_score INTEGER NOT NULL,
  engagement_frequency_score INTEGER NOT NULL,
  avg_relationship_health INTEGER NOT NULL,
  influence_tier influence_tier NOT NULL,
  stakeholder_role stakeholder_role NOT NULL,
  raw_metrics JSONB DEFAULT '{}'::jsonb,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Network Clusters Table (for cluster identification)
-- ============================================================================

CREATE TABLE IF NOT EXISTS network_clusters (
  id SERIAL PRIMARY KEY,
  cluster_name_en TEXT NOT NULL,
  cluster_name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  cluster_type TEXT CHECK (cluster_type IN ('geographic', 'organizational', 'thematic', 'auto_detected')),
  member_count INTEGER NOT NULL DEFAULT 0,
  avg_influence_score INTEGER,
  leader_dossier_id UUID REFERENCES dossiers(id),
  cluster_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Cluster Memberships Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cluster_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id INTEGER NOT NULL REFERENCES network_clusters(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  membership_strength NUMERIC(5,4) DEFAULT 1.0 CHECK (membership_strength >= 0 AND membership_strength <= 1),
  role_in_cluster TEXT CHECK (role_in_cluster IN ('leader', 'core_member', 'member', 'peripheral')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_cluster_membership UNIQUE (cluster_id, dossier_id)
);

-- ============================================================================
-- Influence Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS influence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'full_network_analysis',
    'stakeholder_profile',
    'cluster_analysis',
    'strategic_planning',
    'comparison_report',
    'trend_analysis'
  )),

  -- Scope
  scope_dossier_ids UUID[] DEFAULT '{}',
  scope_dossier_types TEXT[] DEFAULT '{}',
  scope_cluster_ids INTEGER[] DEFAULT '{}',

  -- Report data
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  key_findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,

  -- Generation info
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Report status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Stakeholder influence scores indexes
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_dossier
  ON stakeholder_influence_scores(dossier_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_overall
  ON stakeholder_influence_scores(overall_influence_score DESC);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_tier
  ON stakeholder_influence_scores(influence_tier);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_role
  ON stakeholder_influence_scores(stakeholder_role);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_cluster
  ON stakeholder_influence_scores(cluster_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_degree_centrality
  ON stakeholder_influence_scores(degree_centrality_score DESC);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_scores_betweenness
  ON stakeholder_influence_scores(betweenness_centrality_score DESC);

-- History indexes
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_history_dossier
  ON stakeholder_influence_history(dossier_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_influence_history_calculated
  ON stakeholder_influence_history(calculated_at DESC);

-- Cluster indexes
CREATE INDEX IF NOT EXISTS idx_network_clusters_type
  ON network_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_network_clusters_leader
  ON network_clusters(leader_dossier_id);

-- Membership indexes
CREATE INDEX IF NOT EXISTS idx_cluster_memberships_dossier
  ON cluster_memberships(dossier_id);
CREATE INDEX IF NOT EXISTS idx_cluster_memberships_cluster
  ON cluster_memberships(cluster_id);

-- Report indexes
CREATE INDEX IF NOT EXISTS idx_influence_reports_type
  ON influence_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_influence_reports_generated_at
  ON influence_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_influence_reports_scope_dossiers
  ON influence_reports USING gin(scope_dossier_ids);

-- ============================================================================
-- Row-Level Security
-- ============================================================================

ALTER TABLE stakeholder_influence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_influence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE influence_reports ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated users)
CREATE POLICY stakeholder_influence_scores_read ON stakeholder_influence_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY stakeholder_influence_history_read ON stakeholder_influence_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY network_clusters_read ON network_clusters
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY cluster_memberships_read ON cluster_memberships
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY influence_reports_read ON influence_reports
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Write policies (service role only for scores, authenticated for reports)
CREATE POLICY stakeholder_influence_scores_write ON stakeholder_influence_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY stakeholder_influence_history_write ON stakeholder_influence_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY network_clusters_write ON network_clusters
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY cluster_memberships_write ON cluster_memberships
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY influence_reports_insert ON influence_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY influence_reports_update ON influence_reports
  FOR UPDATE USING (auth.uid() = generated_by OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY influence_reports_delete ON influence_reports
  FOR DELETE USING (auth.uid() = generated_by OR auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Functions for Influence Calculation
-- ============================================================================

-- Function to calculate degree centrality for a dossier
CREATE OR REPLACE FUNCTION calculate_degree_centrality(target_dossier_id UUID)
RETURNS TABLE (
  direct_connections INTEGER,
  inbound_connections INTEGER,
  outbound_connections INTEGER,
  normalized_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_dossiers INTEGER;
  in_count INTEGER;
  out_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Get total number of dossiers for normalization
  SELECT COUNT(*) INTO total_dossiers FROM dossiers WHERE status = 'active';

  -- Count inbound connections
  SELECT COUNT(*) INTO in_count
  FROM dossier_relationships
  WHERE target_dossier_id = target_dossier_id
    AND status = 'active'
    AND (effective_to IS NULL OR effective_to > NOW());

  -- Count outbound connections
  SELECT COUNT(*) INTO out_count
  FROM dossier_relationships
  WHERE source_dossier_id = target_dossier_id
    AND status = 'active'
    AND (effective_to IS NULL OR effective_to > NOW());

  total_count := in_count + out_count;

  RETURN QUERY SELECT
    total_count,
    in_count,
    out_count,
    CASE
      WHEN total_dossiers <= 1 THEN 0
      ELSE LEAST(100, (total_count * 100) / (total_dossiers - 1))
    END;
END;
$$;

-- Function to get stakeholder influence metrics
CREATE OR REPLACE FUNCTION get_stakeholder_influence_metrics(
  target_dossier_id UUID,
  period_days INTEGER DEFAULT 365
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  direct_connections INTEGER,
  two_hop_connections INTEGER,
  total_engagements INTEGER,
  unique_engagement_partners INTEGER,
  avg_relationship_health NUMERIC,
  strong_relationship_count INTEGER,
  engagement_frequency_score INTEGER,
  degree_centrality_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_start TIMESTAMPTZ := NOW() - (period_days || ' days')::INTERVAL;
BEGIN
  RETURN QUERY
  WITH degree_calc AS (
    SELECT * FROM calculate_degree_centrality(target_dossier_id)
  ),
  two_hop AS (
    SELECT COUNT(DISTINCT rg.dossier_id) as cnt
    FROM traverse_relationship_graph(target_dossier_id, 2, NULL) rg
  ),
  engagement_stats AS (
    SELECT
      COUNT(*) as total_eng,
      COUNT(DISTINCT
        CASE
          WHEN di.source_dossier_id = target_dossier_id THEN di.target_dossier_id
          ELSE di.source_dossier_id
        END
      ) as unique_partners
    FROM dossier_interactions di
    WHERE (di.source_dossier_id = target_dossier_id OR di.target_dossier_id = target_dossier_id)
      AND di.interaction_date >= period_start
  ),
  health_stats AS (
    SELECT
      COALESCE(AVG(rhs.overall_score), 0) as avg_health,
      COUNT(*) FILTER (WHERE rhs.overall_score >= 70) as strong_count
    FROM relationship_health_scores rhs
    JOIN dossier_relationships dr ON dr.id = rhs.relationship_id
    WHERE dr.source_dossier_id = target_dossier_id
       OR dr.target_dossier_id = target_dossier_id
  )
  SELECT
    d.id,
    d.type,
    d.name_en,
    d.name_ar,
    COALESCE(dc.direct_connections, 0),
    COALESCE(th.cnt::INTEGER, 0),
    COALESCE(es.total_eng::INTEGER, 0),
    COALESCE(es.unique_partners::INTEGER, 0),
    COALESCE(hs.avg_health, 0),
    COALESCE(hs.strong_count::INTEGER, 0),
    CASE
      WHEN es.total_eng IS NULL OR es.total_eng = 0 THEN 0
      ELSE LEAST(100, (es.total_eng * 100) / 50)::INTEGER -- 50 engagements/year = 100
    END,
    COALESCE(dc.normalized_score, 0)
  FROM dossiers d
  LEFT JOIN degree_calc dc ON TRUE
  LEFT JOIN two_hop th ON TRUE
  LEFT JOIN engagement_stats es ON TRUE
  LEFT JOIN health_stats hs ON TRUE
  WHERE d.id = target_dossier_id;
END;
$$;

-- Function to identify key connectors (bridges between groups)
CREATE OR REPLACE FUNCTION identify_key_connectors(
  min_bridge_score INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  dossier_id UUID,
  name_en TEXT,
  name_ar TEXT,
  dossier_type TEXT,
  groups_connected INTEGER,
  bridge_score INTEGER,
  influence_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sis.dossier_id,
    d.name_en,
    d.name_ar,
    d.type,
    COALESCE((sis.raw_metrics->>'groups_connected')::INTEGER, 0),
    sis.betweenness_centrality_score,
    sis.overall_influence_score
  FROM stakeholder_influence_scores sis
  JOIN dossiers d ON d.id = sis.dossier_id
  WHERE sis.betweenness_centrality_score >= min_bridge_score
    AND sis.stakeholder_role IN ('bridge', 'gatekeeper')
  ORDER BY sis.betweenness_centrality_score DESC
  LIMIT limit_count;
END;
$$;

-- Function to get top influencers by type
CREATE OR REPLACE FUNCTION get_top_influencers(
  dossier_type_filter TEXT DEFAULT NULL,
  tier_filter influence_tier DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  dossier_id UUID,
  name_en TEXT,
  name_ar TEXT,
  dossier_type TEXT,
  influence_tier influence_tier,
  stakeholder_role stakeholder_role,
  overall_score INTEGER,
  degree_centrality INTEGER,
  engagement_score INTEGER,
  relationship_health INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sis.dossier_id,
    d.name_en,
    d.name_ar,
    d.type,
    sis.influence_tier,
    sis.stakeholder_role,
    sis.overall_influence_score,
    sis.degree_centrality_score,
    sis.engagement_frequency_score,
    sis.avg_relationship_health
  FROM stakeholder_influence_scores sis
  JOIN dossiers d ON d.id = sis.dossier_id
  WHERE (dossier_type_filter IS NULL OR d.type = dossier_type_filter)
    AND (tier_filter IS NULL OR sis.influence_tier = tier_filter)
  ORDER BY sis.overall_influence_score DESC
  LIMIT limit_count;
END;
$$;

-- Function to get network statistics
CREATE OR REPLACE FUNCTION get_network_statistics()
RETURNS TABLE (
  total_stakeholders INTEGER,
  total_relationships INTEGER,
  avg_connections_per_stakeholder NUMERIC,
  key_influencer_count INTEGER,
  cluster_count INTEGER,
  avg_influence_score NUMERIC,
  network_density NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stakeholder_count INTEGER;
  relationship_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stakeholder_count FROM dossiers WHERE status = 'active';
  SELECT COUNT(*) INTO relationship_count FROM dossier_relationships WHERE status = 'active';

  RETURN QUERY
  SELECT
    stakeholder_count,
    relationship_count,
    CASE WHEN stakeholder_count > 0 THEN (relationship_count * 2.0 / stakeholder_count) ELSE 0 END,
    (SELECT COUNT(*)::INTEGER FROM stakeholder_influence_scores WHERE influence_tier = 'key_influencer'),
    (SELECT COUNT(*)::INTEGER FROM network_clusters),
    (SELECT COALESCE(AVG(overall_influence_score), 0) FROM stakeholder_influence_scores),
    CASE
      WHEN stakeholder_count <= 1 THEN 0
      ELSE (relationship_count * 2.0) / (stakeholder_count * (stakeholder_count - 1))
    END;
END;
$$;

-- ============================================================================
-- Materialized View for Fast Network Analytics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS stakeholder_network_summary AS
SELECT
  d.id AS dossier_id,
  d.type AS dossier_type,
  d.name_en,
  d.name_ar,
  COALESCE(sis.overall_influence_score, 0) AS influence_score,
  COALESCE(sis.influence_tier, 'peripheral') AS influence_tier,
  COALESCE(sis.stakeholder_role, 'peripheral') AS stakeholder_role,
  COALESCE(sis.degree_centrality_score, 0) AS degree_centrality,
  COALESCE(sis.betweenness_centrality_score, 0) AS betweenness_centrality,
  COALESCE(sis.engagement_frequency_score, 0) AS engagement_score,
  COALESCE(sis.avg_relationship_health, 0) AS avg_health,
  COALESCE(sis.strong_relationships_count, 0) AS strong_relationships,
  COALESCE(sis.cluster_id, 0) AS cluster_id,
  COALESCE(nc.cluster_name_en, 'Unclustered') AS cluster_name_en,
  COALESCE(nc.cluster_name_ar, 'غير مجمع') AS cluster_name_ar,
  sis.calculated_at
FROM dossiers d
LEFT JOIN stakeholder_influence_scores sis ON sis.dossier_id = d.id
LEFT JOIN network_clusters nc ON nc.id = sis.cluster_id
WHERE d.status = 'active';

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_stakeholder_network_summary_dossier
  ON stakeholder_network_summary(dossier_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_network_summary_influence
  ON stakeholder_network_summary(influence_score DESC);
CREATE INDEX IF NOT EXISTS idx_stakeholder_network_summary_tier
  ON stakeholder_network_summary(influence_tier);
CREATE INDEX IF NOT EXISTS idx_stakeholder_network_summary_type
  ON stakeholder_network_summary(dossier_type);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_stakeholder_network_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY stakeholder_network_summary;
END;
$$;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_stakeholder_influence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stakeholder_influence_scores_updated_at
  BEFORE UPDATE ON stakeholder_influence_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholder_influence_updated_at();

CREATE TRIGGER network_clusters_updated_at
  BEFORE UPDATE ON network_clusters
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholder_influence_updated_at();

CREATE TRIGGER influence_reports_updated_at
  BEFORE UPDATE ON influence_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholder_influence_updated_at();

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_degree_centrality(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stakeholder_influence_metrics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION identify_key_connectors(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_influencers(TEXT, influence_tier, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_network_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_stakeholder_network_summary() TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE stakeholder_influence_scores IS 'Influence scores and network position metrics for stakeholders';
COMMENT ON TABLE stakeholder_influence_history IS 'Historical influence scores for trend analysis';
COMMENT ON TABLE network_clusters IS 'Identified clusters/communities within the stakeholder network';
COMMENT ON TABLE cluster_memberships IS 'Stakeholder membership in network clusters';
COMMENT ON TABLE influence_reports IS 'Generated influence analysis reports for strategic planning';

COMMENT ON FUNCTION calculate_degree_centrality IS 'Calculate degree centrality (connection count) for a stakeholder';
COMMENT ON FUNCTION get_stakeholder_influence_metrics IS 'Get comprehensive influence metrics for a stakeholder';
COMMENT ON FUNCTION identify_key_connectors IS 'Find stakeholders who bridge different groups';
COMMENT ON FUNCTION get_top_influencers IS 'List top influencers with optional filtering';
COMMENT ON FUNCTION get_network_statistics IS 'Get overall network statistics';
