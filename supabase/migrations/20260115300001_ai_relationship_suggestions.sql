-- ============================================================================
-- Migration: AI-Powered Relationship Suggestions
-- Date: 2026-01-15
-- Feature: ai-relationship-suggestions
-- Description: Database schema and functions for AI-powered relationship suggestions
--              based on co-attendance at events, shared organizations, and hierarchy
-- ============================================================================

-- ============================================================================
-- PART 1: Relationship Suggestions Cache Table
-- ============================================================================

-- Store generated relationship suggestions with confidence scores and context
CREATE TABLE IF NOT EXISTS person_relationship_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  suggested_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,

  -- Suggestion metadata
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'co_event_attendance',   -- Both attended same event
    'same_organization',     -- Work at same organization
    'shared_role_period',    -- Overlapping roles at same org
    'organizational_hierarchy', -- Supervisor/subordinate based on roles
    'shared_affiliation',    -- Same affiliation (board member, advisor, etc.)
    'mutual_connection',     -- Have mutual relationships
    'expertise_match'        -- Similar expertise areas
  )),

  -- Confidence and reasoning
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  suggested_relationship_type TEXT NOT NULL CHECK (suggested_relationship_type IN (
    'reports_to', 'supervises', 'colleague', 'collaborates_with',
    'mentors', 'knows', 'former_colleague', 'referral'
  )),
  suggested_strength INTEGER DEFAULT 3 CHECK (suggested_strength BETWEEN 1 AND 5),

  -- Context notes (why this suggestion was made)
  context_notes_en TEXT,
  context_notes_ar TEXT,

  -- Supporting evidence (JSON with details)
  evidence JSONB DEFAULT '{}',
  -- Example: { "shared_events": [...], "shared_orgs": [...], "mutual_contacts": [...] }

  -- Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT no_self_suggestion CHECK (person_id != suggested_person_id),
  CONSTRAINT unique_pending_suggestion UNIQUE (person_id, suggested_person_id, suggestion_type)
    WHERE status = 'pending'
);

-- Indexes for efficient querying
CREATE INDEX idx_person_suggestions_person ON person_relationship_suggestions(person_id);
CREATE INDEX idx_person_suggestions_suggested ON person_relationship_suggestions(suggested_person_id);
CREATE INDEX idx_person_suggestions_status ON person_relationship_suggestions(status);
CREATE INDEX idx_person_suggestions_type ON person_relationship_suggestions(suggestion_type);
CREATE INDEX idx_person_suggestions_confidence ON person_relationship_suggestions(confidence_score DESC);
CREATE INDEX idx_person_suggestions_expires ON person_relationship_suggestions(expires_at)
  WHERE status = 'pending';

-- RLS Policies
ALTER TABLE person_relationship_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for accessible persons"
  ON person_relationship_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons p
      JOIN dossiers d ON d.id = p.id
      WHERE p.id = person_relationship_suggestions.person_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can update suggestion status"
  ON person_relationship_suggestions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 2: Function to Generate Co-Event Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_co_event_suggestions(p_person_id UUID)
RETURNS TABLE (
  suggested_person_id UUID,
  suggested_person_name_en TEXT,
  suggested_person_name_ar TEXT,
  suggested_person_photo_url TEXT,
  suggested_person_title_en TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_relationship_type TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_person_org_id UUID;
BEGIN
  -- Get the person's organization for context
  SELECT organization_id INTO v_person_org_id FROM persons WHERE id = p_person_id;

  RETURN QUERY
  WITH person_events AS (
    -- Get all events this person attended
    SELECT pe.engagement_id, pe.role, e.name_en, e.name_ar, ed.start_date
    FROM person_engagements pe
    JOIN engagements e ON e.id = pe.engagement_id
    LEFT JOIN engagement_dossiers ed ON ed.dossier_id = e.dossier_id
    WHERE pe.person_id = p_person_id
    AND pe.attended = TRUE
  ),
  co_attendees AS (
    -- Find other people at same events
    SELECT
      pe2.person_id AS other_person_id,
      COUNT(DISTINCT pe.engagement_id) AS shared_event_count,
      json_agg(DISTINCT jsonb_build_object(
        'event_id', pe.engagement_id,
        'event_name_en', pe.name_en,
        'event_name_ar', pe.name_ar,
        'event_date', pe.start_date,
        'their_role', pe2.role,
        'your_role', pe.role
      )) AS shared_events
    FROM person_events pe
    JOIN person_engagements pe2 ON pe2.engagement_id = pe.engagement_id
    WHERE pe2.person_id != p_person_id
    AND pe2.attended = TRUE
    -- Exclude existing relationships
    AND NOT EXISTS (
      SELECT 1 FROM person_relationships pr
      WHERE (pr.from_person_id = p_person_id AND pr.to_person_id = pe2.person_id)
         OR (pr.from_person_id = pe2.person_id AND pr.to_person_id = p_person_id)
    )
    GROUP BY pe2.person_id
  )
  SELECT
    ca.other_person_id,
    d.name_en,
    d.name_ar,
    p.photo_url,
    p.title_en,
    'co_event_attendance'::TEXT,
    -- Confidence based on shared event count
    CASE
      WHEN ca.shared_event_count >= 5 THEN 0.95
      WHEN ca.shared_event_count >= 3 THEN 0.85
      WHEN ca.shared_event_count >= 2 THEN 0.75
      ELSE 0.60
    END::NUMERIC(3,2),
    -- Suggest relationship type based on same org
    CASE
      WHEN p.organization_id = v_person_org_id THEN 'colleague'
      ELSE 'knows'
    END::TEXT,
    -- Context notes
    format('Met at %s shared events', ca.shared_event_count)::TEXT,
    format('التقى في %s فعاليات مشتركة', ca.shared_event_count)::TEXT,
    jsonb_build_object(
      'shared_event_count', ca.shared_event_count,
      'shared_events', ca.shared_events
    )
  FROM co_attendees ca
  JOIN persons p ON p.id = ca.other_person_id
  JOIN dossiers d ON d.id = p.id
  WHERE d.status = 'active'
  ORDER BY ca.shared_event_count DESC
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 3: Function to Generate Organization-Based Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_organization_suggestions(p_person_id UUID)
RETURNS TABLE (
  suggested_person_id UUID,
  suggested_person_name_en TEXT,
  suggested_person_name_ar TEXT,
  suggested_person_photo_url TEXT,
  suggested_person_title_en TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_relationship_type TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_person_org_id UUID;
  v_org_name_en TEXT;
  v_org_name_ar TEXT;
BEGIN
  -- Get the person's organization
  SELECT p.organization_id, o.name_en, o.name_ar
  INTO v_person_org_id, v_org_name_en, v_org_name_ar
  FROM persons p
  LEFT JOIN organizations o ON o.id = p.organization_id
  WHERE p.id = p_person_id;

  IF v_person_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH same_org_persons AS (
    -- Find other people in the same organization
    SELECT
      p.id AS other_person_id,
      d.name_en,
      d.name_ar,
      p.photo_url,
      p.title_en,
      p.importance_level
    FROM persons p
    JOIN dossiers d ON d.id = p.id
    WHERE p.organization_id = v_person_org_id
    AND p.id != p_person_id
    AND d.status = 'active'
    -- Exclude existing relationships
    AND NOT EXISTS (
      SELECT 1 FROM person_relationships pr
      WHERE (pr.from_person_id = p_person_id AND pr.to_person_id = p.id)
         OR (pr.from_person_id = p.id AND pr.to_person_id = p_person_id)
    )
  )
  SELECT
    sop.other_person_id,
    sop.name_en,
    sop.name_ar,
    sop.photo_url,
    sop.title_en,
    'same_organization'::TEXT,
    -- Higher confidence for same org
    0.85::NUMERIC(3,2),
    'colleague'::TEXT,
    format('Works at %s', v_org_name_en)::TEXT,
    format('يعمل في %s', COALESCE(v_org_name_ar, v_org_name_en))::TEXT,
    jsonb_build_object(
      'organization_id', v_person_org_id,
      'organization_name_en', v_org_name_en,
      'organization_name_ar', v_org_name_ar
    )
  FROM same_org_persons sop
  ORDER BY sop.importance_level DESC NULLS LAST
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 4: Function to Generate Role/Hierarchy Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_hierarchy_suggestions(p_person_id UUID)
RETURNS TABLE (
  suggested_person_id UUID,
  suggested_person_name_en TEXT,
  suggested_person_name_ar TEXT,
  suggested_person_photo_url TEXT,
  suggested_person_title_en TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_relationship_type TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH person_roles_cte AS (
    -- Get all roles for the person
    SELECT
      pr.organization_id,
      pr.role_title_en,
      pr.department_en,
      pr.start_date,
      pr.end_date,
      pr.is_current
    FROM person_roles pr
    WHERE pr.person_id = p_person_id
  ),
  overlapping_roles AS (
    -- Find people with overlapping roles at same organizations
    SELECT
      pr2.person_id AS other_person_id,
      prc.organization_id,
      prc.department_en AS my_dept,
      pr2.department_en AS their_dept,
      prc.role_title_en AS my_role,
      pr2.role_title_en AS their_role,
      prc.is_current AND pr2.is_current AS both_current,
      -- Determine hierarchy based on role titles (simple heuristic)
      CASE
        WHEN pr2.role_title_en ILIKE '%director%' OR pr2.role_title_en ILIKE '%head%'
             OR pr2.role_title_en ILIKE '%chief%' OR pr2.role_title_en ILIKE '%مدير%'
        THEN 'senior'
        WHEN pr2.role_title_en ILIKE '%assistant%' OR pr2.role_title_en ILIKE '%junior%'
             OR pr2.role_title_en ILIKE '%مساعد%'
        THEN 'junior'
        ELSE 'peer'
      END AS seniority
    FROM person_roles_cte prc
    JOIN person_roles pr2 ON pr2.organization_id = prc.organization_id
    WHERE pr2.person_id != p_person_id
    -- Overlapping time periods
    AND (prc.end_date IS NULL OR prc.end_date >= pr2.start_date)
    AND (pr2.end_date IS NULL OR pr2.end_date >= prc.start_date)
    -- Exclude existing relationships
    AND NOT EXISTS (
      SELECT 1 FROM person_relationships pr
      WHERE (pr.from_person_id = p_person_id AND pr.to_person_id = pr2.person_id)
         OR (pr.from_person_id = pr2.person_id AND pr.to_person_id = p_person_id)
    )
  )
  SELECT DISTINCT ON (orr.other_person_id)
    orr.other_person_id,
    d.name_en,
    d.name_ar,
    p.photo_url,
    p.title_en,
    'shared_role_period'::TEXT,
    -- Confidence based on whether both are current
    CASE WHEN orr.both_current THEN 0.90 ELSE 0.70 END::NUMERIC(3,2),
    -- Suggest type based on seniority
    CASE
      WHEN orr.seniority = 'senior' THEN 'reports_to'
      WHEN orr.seniority = 'junior' THEN 'supervises'
      WHEN orr.my_dept = orr.their_dept THEN 'colleague'
      ELSE 'collaborates_with'
    END::TEXT,
    format('Overlapping role at organization: %s', orr.their_role)::TEXT,
    format('دور متداخل في المنظمة: %s', orr.their_role)::TEXT,
    jsonb_build_object(
      'organization_id', orr.organization_id,
      'their_role', orr.their_role,
      'their_department', orr.their_dept,
      'both_current', orr.both_current
    )
  FROM overlapping_roles orr
  JOIN persons p ON p.id = orr.other_person_id
  JOIN dossiers d ON d.id = p.id
  WHERE d.status = 'active'
  ORDER BY orr.other_person_id, orr.both_current DESC
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 5: Function to Generate Affiliation-Based Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_affiliation_suggestions(p_person_id UUID)
RETURNS TABLE (
  suggested_person_id UUID,
  suggested_person_name_en TEXT,
  suggested_person_name_ar TEXT,
  suggested_person_photo_url TEXT,
  suggested_person_title_en TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_relationship_type TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH person_affiliations_cte AS (
    -- Get all affiliations for the person
    SELECT
      pa.organization_id,
      pa.affiliation_type,
      pa.is_active
    FROM person_affiliations pa
    WHERE pa.person_id = p_person_id
  ),
  shared_affiliations AS (
    -- Find people with same affiliations
    SELECT
      pa2.person_id AS other_person_id,
      pac.organization_id,
      pac.affiliation_type,
      o.name_en AS org_name_en,
      o.name_ar AS org_name_ar
    FROM person_affiliations_cte pac
    JOIN person_affiliations pa2 ON pa2.organization_id = pac.organization_id
    JOIN organizations o ON o.id = pac.organization_id
    WHERE pa2.person_id != p_person_id
    AND pa2.is_active = TRUE
    -- Exclude existing relationships
    AND NOT EXISTS (
      SELECT 1 FROM person_relationships pr
      WHERE (pr.from_person_id = p_person_id AND pr.to_person_id = pa2.person_id)
         OR (pr.from_person_id = pa2.person_id AND pr.to_person_id = p_person_id)
    )
  )
  SELECT DISTINCT ON (sa.other_person_id)
    sa.other_person_id,
    d.name_en,
    d.name_ar,
    p.photo_url,
    p.title_en,
    'shared_affiliation'::TEXT,
    -- Board members and advisors have higher confidence
    CASE
      WHEN sa.affiliation_type IN ('board_member', 'advisor') THEN 0.85
      ELSE 0.70
    END::NUMERIC(3,2),
    'collaborates_with'::TEXT,
    format('Shared affiliation at %s (%s)', sa.org_name_en, sa.affiliation_type)::TEXT,
    format('انتساب مشترك في %s (%s)', COALESCE(sa.org_name_ar, sa.org_name_en), sa.affiliation_type)::TEXT,
    jsonb_build_object(
      'organization_id', sa.organization_id,
      'organization_name_en', sa.org_name_en,
      'organization_name_ar', sa.org_name_ar,
      'affiliation_type', sa.affiliation_type
    )
  FROM shared_affiliations sa
  JOIN persons p ON p.id = sa.other_person_id
  JOIN dossiers d ON d.id = p.id
  WHERE d.status = 'active'
  ORDER BY sa.other_person_id
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 6: Master Function to Generate All Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_all_relationship_suggestions(p_person_id UUID)
RETURNS TABLE (
  suggested_person_id UUID,
  suggested_person_name_en TEXT,
  suggested_person_name_ar TEXT,
  suggested_person_photo_url TEXT,
  suggested_person_title_en TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_relationship_type TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First check if person has any existing relationships
  -- If they do, we might want to lower priorities or skip

  RETURN QUERY
  WITH all_suggestions AS (
    -- Co-event suggestions
    SELECT * FROM generate_co_event_suggestions(p_person_id)
    UNION ALL
    -- Organization suggestions
    SELECT * FROM generate_organization_suggestions(p_person_id)
    UNION ALL
    -- Hierarchy suggestions
    SELECT * FROM generate_hierarchy_suggestions(p_person_id)
    UNION ALL
    -- Affiliation suggestions
    SELECT * FROM generate_affiliation_suggestions(p_person_id)
  ),
  ranked_suggestions AS (
    SELECT
      als.*,
      ROW_NUMBER() OVER (
        PARTITION BY als.suggested_person_id
        ORDER BY als.confidence_score DESC
      ) AS rank
    FROM all_suggestions als
  )
  SELECT
    rs.suggested_person_id,
    rs.suggested_person_name_en,
    rs.suggested_person_name_ar,
    rs.suggested_person_photo_url,
    rs.suggested_person_title_en,
    rs.suggestion_type,
    rs.confidence_score,
    rs.suggested_relationship_type,
    rs.context_notes_en,
    rs.context_notes_ar,
    rs.evidence
  FROM ranked_suggestions rs
  WHERE rs.rank = 1  -- Only keep best suggestion per person
  ORDER BY rs.confidence_score DESC
  LIMIT 20;
END;
$$;

-- ============================================================================
-- PART 7: Bulk Relationship Creation Function
-- ============================================================================

CREATE OR REPLACE FUNCTION create_bulk_relationships(
  p_from_person_id UUID,
  p_relationships JSONB,  -- Array of { to_person_id, relationship_type, strength, notes }
  p_user_id UUID
)
RETURNS TABLE (
  created_id UUID,
  to_person_id UUID,
  relationship_type TEXT,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rel JSONB;
  v_to_person_id UUID;
  v_rel_type TEXT;
  v_strength INTEGER;
  v_notes TEXT;
  v_created_id UUID;
BEGIN
  FOR v_rel IN SELECT * FROM jsonb_array_elements(p_relationships)
  LOOP
    v_to_person_id := (v_rel->>'to_person_id')::UUID;
    v_rel_type := v_rel->>'relationship_type';
    v_strength := COALESCE((v_rel->>'strength')::INTEGER, 3);
    v_notes := v_rel->>'notes';

    BEGIN
      INSERT INTO person_relationships (
        from_person_id,
        to_person_id,
        relationship_type,
        strength,
        notes,
        created_by
      ) VALUES (
        p_from_person_id,
        v_to_person_id,
        v_rel_type,
        v_strength,
        v_notes,
        p_user_id
      )
      RETURNING id INTO v_created_id;

      -- Update suggestion status to accepted
      UPDATE person_relationship_suggestions
      SET status = 'accepted', reviewed_at = NOW(), reviewed_by = p_user_id
      WHERE person_id = p_from_person_id
        AND suggested_person_id = v_to_person_id
        AND status = 'pending';

      RETURN QUERY SELECT v_created_id, v_to_person_id, v_rel_type, TRUE, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT NULL::UUID, v_to_person_id, v_rel_type, FALSE, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- PART 8: Helper Function to Get Person Relationship Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_person_relationship_count(p_person_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM person_relationships
  WHERE from_person_id = p_person_id OR to_person_id = p_person_id;

  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_co_event_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_organization_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_hierarchy_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_affiliation_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_all_relationship_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_bulk_relationships(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_person_relationship_count(UUID) TO authenticated;
