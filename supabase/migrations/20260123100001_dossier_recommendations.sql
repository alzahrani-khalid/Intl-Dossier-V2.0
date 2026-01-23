-- Migration: Dossier Recommendations with pgvector Similarity Search
-- Feature: ai-dossier-recommendations
-- Description: Creates tables for proactive dossier recommendations using pgvector embeddings,
--              including similarity search, interaction tracking, and explainability.

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Recommendation reason type (why this dossier was recommended)
CREATE TYPE dossier_recommendation_reason AS ENUM (
  'similar_content',      -- Content similarity via embeddings
  'shared_relationships', -- Connected to same entities
  'topic_overlap',        -- Overlapping topics/tags
  'recent_activity',      -- Recent activity pattern similarity
  'collaboration_history',-- Past collaboration patterns
  'geographic_proximity', -- Same region/country focus
  'strategic_alignment'   -- Strategic priority alignment
);

-- Recommendation status
CREATE TYPE dossier_recommendation_status AS ENUM (
  'pending',    -- Newly generated
  'viewed',     -- User has seen it
  'accepted',   -- User clicked/navigated to recommended dossier
  'dismissed',  -- User dismissed the recommendation
  'expired'     -- Past relevance window
);

-- ============================================================================
-- MAIN RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dossier_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source dossier (the dossier being viewed)
  source_dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Recommended dossier (the suggestion)
  recommended_dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Similarity metrics
  similarity_score float NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  confidence_score float NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Primary recommendation reason
  primary_reason dossier_recommendation_reason NOT NULL,

  -- All contributing reasons with their weights (explainability)
  reason_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{"reason": "similar_content", "weight": 0.6, "details": "..."}, ...]

  -- Human-readable explanation (bilingual)
  explanation_en text NOT NULL,
  explanation_ar text NOT NULL,

  -- Status and tracking
  status dossier_recommendation_status NOT NULL DEFAULT 'pending',

  -- Priority (1-5, where 5 is highest)
  priority int NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),

  -- Expiration (recommendations become stale)
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),

  -- Organization scoping for multi-tenancy
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Audit timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  actioned_at timestamptz,

  -- Prevent duplicate recommendations
  CONSTRAINT uq_dossier_recommendation UNIQUE (source_dossier_id, recommended_dossier_id),

  -- Prevent self-recommendations
  CONSTRAINT chk_no_self_recommendation CHECK (source_dossier_id != recommended_dossier_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_dossier_recommendations_source ON dossier_recommendations(source_dossier_id);
CREATE INDEX idx_dossier_recommendations_recommended ON dossier_recommendations(recommended_dossier_id);
CREATE INDEX idx_dossier_recommendations_status ON dossier_recommendations(status) WHERE status IN ('pending', 'viewed');
CREATE INDEX idx_dossier_recommendations_org ON dossier_recommendations(org_id);
CREATE INDEX idx_dossier_recommendations_priority ON dossier_recommendations(priority DESC, similarity_score DESC);
CREATE INDEX idx_dossier_recommendations_expires ON dossier_recommendations(expires_at) WHERE status = 'pending';

-- ============================================================================
-- INTERACTION TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dossier_recommendation_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the recommendation
  recommendation_id uuid NOT NULL REFERENCES dossier_recommendations(id) ON DELETE CASCADE,

  -- User who interacted
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Interaction type
  interaction_type text NOT NULL CHECK (interaction_type IN (
    'viewed',      -- User saw the recommendation in the panel
    'expanded',    -- User expanded to see "Why recommended"
    'clicked',     -- User clicked to navigate to the dossier
    'dismissed',   -- User dismissed the recommendation
    'feedback_positive',  -- User gave positive feedback
    'feedback_negative'   -- User gave negative feedback
  )),

  -- Optional feedback text
  feedback_text text,

  -- Context about the interaction
  context jsonb DEFAULT '{}'::jsonb,
  -- Format: {"view_duration_ms": 5000, "scroll_position": 0.5, ...}

  -- Timestamp
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendation_interactions_rec ON dossier_recommendation_interactions(recommendation_id);
CREATE INDEX idx_recommendation_interactions_user ON dossier_recommendation_interactions(user_id);
CREATE INDEX idx_recommendation_interactions_type ON dossier_recommendation_interactions(interaction_type);

-- ============================================================================
-- SIMILARITY SEARCH FUNCTION FOR DOSSIERS
-- ============================================================================

-- Enhanced function specifically for dossier-to-dossier recommendations
CREATE OR REPLACE FUNCTION find_similar_dossiers(
  p_source_dossier_id uuid,
  p_match_threshold float DEFAULT 0.70,
  p_match_count int DEFAULT 10,
  p_user_clearance int DEFAULT 0,
  p_organization_id uuid DEFAULT NULL,
  p_exclude_types text[] DEFAULT ARRAY[]::text[]
)
RETURNS TABLE (
  dossier_id uuid,
  dossier_type text,
  name_en text,
  name_ar text,
  similarity_score float,
  shared_relationship_count int,
  shared_tag_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_embedding vector(1536);
  v_source_org_id uuid;
BEGIN
  -- Get the source dossier's embedding and org_id
  SELECT ee.embedding, d.org_id
  INTO v_source_embedding, v_source_org_id
  FROM entity_embeddings ee
  JOIN dossiers d ON d.id = ee.entity_id
  WHERE ee.entity_id = p_source_dossier_id
    AND ee.entity_type = 'dossiers'
  LIMIT 1;

  -- If no embedding found, return empty
  IF v_source_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Use provided org_id or fall back to source dossier's org
  IF p_organization_id IS NULL THEN
    p_organization_id := v_source_org_id;
  END IF;

  RETURN QUERY
  WITH similar_by_embedding AS (
    -- Find similar dossiers by vector similarity
    SELECT
      ee.entity_id AS dossier_id,
      d.dossier_type,
      d.name_en,
      d.name_ar,
      1 - (ee.embedding <=> v_source_embedding) AS similarity_score,
      d.org_id,
      d.classification_level,
      d.archived_at
    FROM entity_embeddings ee
    JOIN dossiers d ON d.id = ee.entity_id
    WHERE
      ee.entity_type = 'dossiers'
      AND ee.entity_id != p_source_dossier_id
      AND d.archived_at IS NULL
      AND d.org_id = p_organization_id
      AND d.classification_level <= p_user_clearance
      AND (array_length(p_exclude_types, 1) IS NULL OR d.dossier_type != ALL(p_exclude_types))
      AND 1 - (ee.embedding <=> v_source_embedding) >= p_match_threshold
    ORDER BY similarity_score DESC
    LIMIT p_match_count * 2  -- Get more to filter by relationships
  ),
  shared_relationships AS (
    -- Count shared relationships between source and candidate dossiers
    SELECT
      dr2.target_dossier_id AS candidate_id,
      COUNT(DISTINCT dr1.target_dossier_id) AS shared_count
    FROM dossier_relationships dr1
    JOIN dossier_relationships dr2 ON dr1.target_dossier_id = dr2.target_dossier_id
    WHERE
      dr1.source_dossier_id = p_source_dossier_id
      AND dr2.source_dossier_id != p_source_dossier_id
      AND dr2.source_dossier_id IN (SELECT dossier_id FROM similar_by_embedding)
    GROUP BY dr2.target_dossier_id
  ),
  shared_tags AS (
    -- Count shared tags (if tags table exists)
    SELECT
      dt2.dossier_id AS candidate_id,
      COUNT(DISTINCT dt1.tag_id) AS shared_count
    FROM dossier_tags dt1
    JOIN dossier_tags dt2 ON dt1.tag_id = dt2.tag_id
    WHERE
      dt1.dossier_id = p_source_dossier_id
      AND dt2.dossier_id != p_source_dossier_id
      AND dt2.dossier_id IN (SELECT dossier_id FROM similar_by_embedding)
    GROUP BY dt2.dossier_id
  )
  SELECT
    s.dossier_id,
    s.dossier_type,
    s.name_en,
    s.name_ar,
    s.similarity_score,
    COALESCE(sr.shared_count, 0)::int AS shared_relationship_count,
    COALESCE(st.shared_count, 0)::int AS shared_tag_count
  FROM similar_by_embedding s
  LEFT JOIN shared_relationships sr ON sr.candidate_id = s.dossier_id
  LEFT JOIN shared_tags st ON st.candidate_id = s.dossier_id
  ORDER BY
    s.similarity_score DESC,
    COALESCE(sr.shared_count, 0) DESC,
    COALESCE(st.shared_count, 0) DESC
  LIMIT p_match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_similar_dossiers TO authenticated;

-- ============================================================================
-- GENERATE RECOMMENDATIONS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_dossier_recommendations(
  p_source_dossier_id uuid,
  p_user_id uuid,
  p_user_clearance int DEFAULT 0,
  p_max_recommendations int DEFAULT 5
)
RETURNS TABLE (
  recommendation_id uuid,
  recommended_dossier_id uuid,
  similarity_score float,
  primary_reason dossier_recommendation_reason,
  explanation_en text,
  explanation_ar text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_source_name_en text;
  v_source_name_ar text;
  v_source_type text;
  rec RECORD;
  v_reason dossier_recommendation_reason;
  v_reason_breakdown jsonb;
  v_explanation_en text;
  v_explanation_ar text;
  v_priority int;
BEGIN
  -- Get source dossier info
  SELECT org_id, name_en, name_ar, dossier_type
  INTO v_org_id, v_source_name_en, v_source_name_ar, v_source_type
  FROM dossiers
  WHERE id = p_source_dossier_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Source dossier not found: %', p_source_dossier_id;
  END IF;

  -- Find similar dossiers and create recommendations
  FOR rec IN
    SELECT *
    FROM find_similar_dossiers(
      p_source_dossier_id,
      0.70,
      p_max_recommendations,
      p_user_clearance,
      v_org_id,
      ARRAY[]::text[]
    )
  LOOP
    -- Determine primary reason based on scores
    IF rec.similarity_score >= 0.85 THEN
      v_reason := 'similar_content';
    ELSIF rec.shared_relationship_count >= 3 THEN
      v_reason := 'shared_relationships';
    ELSIF rec.shared_tag_count >= 2 THEN
      v_reason := 'topic_overlap';
    ELSE
      v_reason := 'similar_content';
    END IF;

    -- Build reason breakdown
    v_reason_breakdown := jsonb_build_array(
      jsonb_build_object(
        'reason', 'similar_content',
        'weight', rec.similarity_score,
        'details', format('%.0f%% content similarity', rec.similarity_score * 100)
      ),
      jsonb_build_object(
        'reason', 'shared_relationships',
        'weight', LEAST(rec.shared_relationship_count::float / 5, 1.0),
        'details', format('%s shared connections', rec.shared_relationship_count)
      ),
      jsonb_build_object(
        'reason', 'topic_overlap',
        'weight', LEAST(rec.shared_tag_count::float / 3, 1.0),
        'details', format('%s common topics', rec.shared_tag_count)
      )
    );

    -- Generate bilingual explanations
    CASE v_reason
      WHEN 'similar_content' THEN
        v_explanation_en := format(
          'This %s has %.0f%% content similarity with %s. They cover related themes and may contain complementary information.',
          rec.dossier_type, rec.similarity_score * 100, v_source_name_en
        );
        v_explanation_ar := format(
          'يحتوي هذا %s على %.0f%% تشابه في المحتوى مع %s. يغطيان مواضيع مترابطة وقد يحتويان على معلومات متكاملة.',
          rec.dossier_type, rec.similarity_score * 100, v_source_name_ar
        );
      WHEN 'shared_relationships' THEN
        v_explanation_en := format(
          'This %s shares %s connections with %s. Viewing related dossiers may provide broader context.',
          rec.dossier_type, rec.shared_relationship_count, v_source_name_en
        );
        v_explanation_ar := format(
          'يشترك هذا %s في %s اتصالات مع %s. قد توفر عرض الملفات ذات الصلة سياقًا أوسع.',
          rec.dossier_type, rec.shared_relationship_count, v_source_name_ar
        );
      WHEN 'topic_overlap' THEN
        v_explanation_en := format(
          'This %s covers %s topics in common with %s. Related policy areas may be interconnected.',
          rec.dossier_type, rec.shared_tag_count, v_source_name_en
        );
        v_explanation_ar := format(
          'يغطي هذا %s %s مواضيع مشتركة مع %s. قد تكون مجالات السياسة ذات الصلة مترابطة.',
          rec.dossier_type, rec.shared_tag_count, v_source_name_ar
        );
      ELSE
        v_explanation_en := format('Related to %s based on content analysis.', v_source_name_en);
        v_explanation_ar := format('مرتبط بـ %s بناءً على تحليل المحتوى.', v_source_name_ar);
    END CASE;

    -- Calculate priority based on similarity and relationships
    v_priority := CASE
      WHEN rec.similarity_score >= 0.90 AND rec.shared_relationship_count >= 3 THEN 5
      WHEN rec.similarity_score >= 0.85 OR rec.shared_relationship_count >= 3 THEN 4
      WHEN rec.similarity_score >= 0.80 OR rec.shared_relationship_count >= 2 THEN 3
      WHEN rec.similarity_score >= 0.75 THEN 2
      ELSE 1
    END;

    -- Insert or update recommendation
    INSERT INTO dossier_recommendations (
      source_dossier_id,
      recommended_dossier_id,
      similarity_score,
      confidence_score,
      primary_reason,
      reason_breakdown,
      explanation_en,
      explanation_ar,
      priority,
      org_id,
      status,
      expires_at
    )
    VALUES (
      p_source_dossier_id,
      rec.dossier_id,
      rec.similarity_score,
      rec.similarity_score * 0.9 + (rec.shared_relationship_count::float / 10) * 0.1,
      v_reason,
      v_reason_breakdown,
      v_explanation_en,
      v_explanation_ar,
      v_priority,
      v_org_id,
      'pending',
      now() + interval '30 days'
    )
    ON CONFLICT (source_dossier_id, recommended_dossier_id)
    DO UPDATE SET
      similarity_score = EXCLUDED.similarity_score,
      confidence_score = EXCLUDED.confidence_score,
      primary_reason = EXCLUDED.primary_reason,
      reason_breakdown = EXCLUDED.reason_breakdown,
      explanation_en = EXCLUDED.explanation_en,
      explanation_ar = EXCLUDED.explanation_ar,
      priority = EXCLUDED.priority,
      status = CASE WHEN dossier_recommendations.status = 'dismissed' THEN 'dismissed' ELSE 'pending' END,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
    RETURNING
      dossier_recommendations.id,
      dossier_recommendations.recommended_dossier_id,
      dossier_recommendations.similarity_score,
      dossier_recommendations.primary_reason,
      dossier_recommendations.explanation_en,
      dossier_recommendations.explanation_ar
    INTO
      recommendation_id,
      recommended_dossier_id,
      similarity_score,
      primary_reason,
      explanation_en,
      explanation_ar;

    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_dossier_recommendations TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to mark recommendation as viewed
CREATE OR REPLACE FUNCTION mark_recommendation_viewed(
  p_recommendation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update status if pending
  UPDATE dossier_recommendations
  SET
    status = 'viewed',
    viewed_at = now(),
    updated_at = now()
  WHERE id = p_recommendation_id
    AND status = 'pending';

  -- Log interaction
  INSERT INTO dossier_recommendation_interactions (
    recommendation_id,
    user_id,
    interaction_type
  )
  VALUES (p_recommendation_id, p_user_id, 'viewed');
END;
$$;

-- Function to record recommendation click/acceptance
CREATE OR REPLACE FUNCTION accept_recommendation(
  p_recommendation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE dossier_recommendations
  SET
    status = 'accepted',
    actioned_at = now(),
    updated_at = now()
  WHERE id = p_recommendation_id;

  INSERT INTO dossier_recommendation_interactions (
    recommendation_id,
    user_id,
    interaction_type
  )
  VALUES (p_recommendation_id, p_user_id, 'clicked');
END;
$$;

-- Function to dismiss recommendation
CREATE OR REPLACE FUNCTION dismiss_recommendation(
  p_recommendation_id uuid,
  p_user_id uuid,
  p_feedback_text text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE dossier_recommendations
  SET
    status = 'dismissed',
    actioned_at = now(),
    updated_at = now()
  WHERE id = p_recommendation_id;

  INSERT INTO dossier_recommendation_interactions (
    recommendation_id,
    user_id,
    interaction_type,
    feedback_text
  )
  VALUES (p_recommendation_id, p_user_id, 'dismissed', p_feedback_text);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_recommendation_viewed TO authenticated;
GRANT EXECUTE ON FUNCTION accept_recommendation TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_recommendation TO authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE dossier_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_recommendation_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view recommendations for their organization
CREATE POLICY "Users can view recommendations in their org"
ON dossier_recommendations
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT organization_id FROM user_organization_roles
    WHERE user_id = auth.uid()
  )
);

-- Users can update recommendations they have access to
CREATE POLICY "Users can update recommendations in their org"
ON dossier_recommendations
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT organization_id FROM user_organization_roles
    WHERE user_id = auth.uid()
  )
);

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions"
ON dossier_recommendation_interactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own interactions
CREATE POLICY "Users can create own interactions"
ON dossier_recommendation_interactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_dossier_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dossier_recommendations_updated_at
BEFORE UPDATE ON dossier_recommendations
FOR EACH ROW
EXECUTE FUNCTION update_dossier_recommendations_updated_at();

-- ============================================================================
-- EXPIRE OLD RECOMMENDATIONS (CRON JOB)
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_recommendations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE dossier_recommendations
  SET status = 'expired', updated_at = now()
  WHERE status IN ('pending', 'viewed')
    AND expires_at < now();
END;
$$;

-- Note: Schedule via pg_cron if available:
-- SELECT cron.schedule('expire-recommendations', '0 2 * * *', 'SELECT expire_old_recommendations()');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE dossier_recommendations IS 'Proactive dossier recommendations using pgvector similarity search';
COMMENT ON TABLE dossier_recommendation_interactions IS 'Tracks user interactions with dossier recommendations for ML feedback';
COMMENT ON FUNCTION find_similar_dossiers IS 'Finds similar dossiers using pgvector cosine similarity with relationship and tag enrichment';
COMMENT ON FUNCTION generate_dossier_recommendations IS 'Generates and stores dossier recommendations with bilingual explainability';
