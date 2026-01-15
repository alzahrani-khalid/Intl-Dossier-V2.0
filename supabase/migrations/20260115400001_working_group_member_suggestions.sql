-- ============================================================================
-- Migration: AI-Powered Working Group Member Suggestions
-- Date: 2026-01-15
-- Feature: working-group-member-suggestions
-- Description: Database schema and functions for suggesting members to working groups
--              based on related engagements, forums, and past collaboration patterns
-- ============================================================================

-- ============================================================================
-- PART 1: Working Group Member Suggestions Cache Table
-- ============================================================================

-- Store generated member suggestions with confidence scores and context
CREATE TABLE IF NOT EXISTS working_group_member_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,

  -- Can suggest organizations or persons
  suggested_entity_type TEXT NOT NULL CHECK (suggested_entity_type IN ('organization', 'person')),
  suggested_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  suggested_person_id UUID REFERENCES persons(id) ON DELETE CASCADE,

  -- Suggestion metadata
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'parent_forum_member',      -- Member of parent forum
    'related_engagement',       -- Participated in related engagement
    'past_collaboration',       -- Previously collaborated in other WGs
    'lead_org_affiliate',       -- Affiliated with lead organization
    'topic_expertise',          -- Has expertise matching WG objectives
    'country_representation',   -- Represents relevant country
    'organizational_mandate',   -- Org's mandate aligns with WG
    'role_seniority'           -- Senior person at related org
  )),

  -- Confidence and reasoning
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  suggested_role TEXT NOT NULL DEFAULT 'member' CHECK (suggested_role IN (
    'chair', 'co_chair', 'vice_chair', 'secretary', 'member', 'observer', 'advisor', 'liaison'
  )),

  -- Context notes (why this suggestion was made)
  context_notes_en TEXT,
  context_notes_ar TEXT,

  -- Supporting evidence (JSON with details)
  evidence JSONB DEFAULT '{}',
  -- Example: { "shared_forums": [...], "past_wgs": [...], "engagements": [...] }

  -- Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_suggested_entity CHECK (
    (suggested_entity_type = 'organization' AND suggested_organization_id IS NOT NULL AND suggested_person_id IS NULL) OR
    (suggested_entity_type = 'person' AND suggested_person_id IS NOT NULL AND suggested_organization_id IS NULL)
  ),
  CONSTRAINT unique_pending_org_suggestion UNIQUE (working_group_id, suggested_organization_id, suggestion_type)
    WHERE status = 'pending' AND suggested_organization_id IS NOT NULL,
  CONSTRAINT unique_pending_person_suggestion UNIQUE (working_group_id, suggested_person_id, suggestion_type)
    WHERE status = 'pending' AND suggested_person_id IS NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_wg_suggestions_wg ON working_group_member_suggestions(working_group_id);
CREATE INDEX idx_wg_suggestions_org ON working_group_member_suggestions(suggested_organization_id)
  WHERE suggested_organization_id IS NOT NULL;
CREATE INDEX idx_wg_suggestions_person ON working_group_member_suggestions(suggested_person_id)
  WHERE suggested_person_id IS NOT NULL;
CREATE INDEX idx_wg_suggestions_status ON working_group_member_suggestions(status);
CREATE INDEX idx_wg_suggestions_type ON working_group_member_suggestions(suggestion_type);
CREATE INDEX idx_wg_suggestions_confidence ON working_group_member_suggestions(confidence_score DESC);
CREATE INDEX idx_wg_suggestions_expires ON working_group_member_suggestions(expires_at)
  WHERE status = 'pending';

-- RLS Policies
ALTER TABLE working_group_member_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for accessible working groups"
  ON working_group_member_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM working_groups wg
      JOIN dossiers d ON d.id = wg.id
      WHERE wg.id = working_group_member_suggestions.working_group_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can update suggestion status"
  ON working_group_member_suggestions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert suggestions"
  ON working_group_member_suggestions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 2: Function to Generate Parent Forum Member Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_forum_member_suggestions(p_working_group_id UUID)
RETURNS TABLE (
  suggested_entity_type TEXT,
  suggested_organization_id UUID,
  suggested_person_id UUID,
  suggested_name_en TEXT,
  suggested_name_ar TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_role TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_forum_id UUID;
  v_forum_name_en TEXT;
  v_forum_name_ar TEXT;
BEGIN
  -- Get the working group's parent forum
  SELECT wg.parent_forum_id INTO v_parent_forum_id
  FROM working_groups wg
  WHERE wg.id = p_working_group_id;

  IF v_parent_forum_id IS NULL THEN
    RETURN;
  END IF;

  -- Get forum name for context
  SELECT d.name_en, d.name_ar INTO v_forum_name_en, v_forum_name_ar
  FROM dossiers d
  WHERE d.id = v_parent_forum_id;

  -- Find forum member organizations that are not already members of this WG
  RETURN QUERY
  WITH forum_members AS (
    -- Get organizations from forum's member list (assuming forum_members table or similar)
    -- For now, we'll use engagement participants from forum-related engagements
    SELECT DISTINCT
      pe.organization_id,
      org_d.name_en,
      org_d.name_ar,
      COUNT(DISTINCT pe.engagement_id) AS engagement_count
    FROM person_engagements pe
    JOIN persons p ON p.id = pe.person_id
    JOIN organizations org ON org.id = p.organization_id
    JOIN dossiers org_d ON org_d.id = org.id
    JOIN engagements e ON e.id = pe.engagement_id
    WHERE e.format = 'forum'
    AND p.organization_id IS NOT NULL
    AND org_d.status = 'active'
    -- Exclude already members
    AND NOT EXISTS (
      SELECT 1 FROM working_group_members wgm
      WHERE wgm.working_group_id = p_working_group_id
      AND wgm.organization_id = p.organization_id
      AND wgm.status = 'active'
    )
    -- Exclude rejected suggestions
    AND NOT EXISTS (
      SELECT 1 FROM working_group_member_suggestions wgs
      WHERE wgs.working_group_id = p_working_group_id
      AND wgs.suggested_organization_id = p.organization_id
      AND wgs.status = 'rejected'
    )
    GROUP BY pe.organization_id, org_d.name_en, org_d.name_ar
  )
  SELECT
    'organization'::TEXT,
    fm.organization_id,
    NULL::UUID,
    fm.name_en,
    fm.name_ar,
    'parent_forum_member'::TEXT,
    -- Higher confidence for more engagements
    CASE
      WHEN fm.engagement_count >= 5 THEN 0.95
      WHEN fm.engagement_count >= 3 THEN 0.85
      WHEN fm.engagement_count >= 1 THEN 0.75
      ELSE 0.65
    END::NUMERIC(3,2),
    'member'::TEXT,
    format('Active participant in parent forum %s', v_forum_name_en)::TEXT,
    format('مشارك نشط في المنتدى الأم %s', COALESCE(v_forum_name_ar, v_forum_name_en))::TEXT,
    jsonb_build_object(
      'parent_forum_id', v_parent_forum_id,
      'parent_forum_name_en', v_forum_name_en,
      'parent_forum_name_ar', v_forum_name_ar,
      'engagement_count', fm.engagement_count
    )
  FROM forum_members fm
  ORDER BY fm.engagement_count DESC
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 3: Function to Generate Related Engagement Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_engagement_member_suggestions(p_working_group_id UUID)
RETURNS TABLE (
  suggested_entity_type TEXT,
  suggested_organization_id UUID,
  suggested_person_id UUID,
  suggested_name_en TEXT,
  suggested_name_ar TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_role TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wg_name_en TEXT;
  v_wg_objectives JSONB;
BEGIN
  -- Get WG info for context
  SELECT d.name_en, wg.objectives INTO v_wg_name_en, v_wg_objectives
  FROM working_groups wg
  JOIN dossiers d ON d.id = wg.id
  WHERE wg.id = p_working_group_id;

  -- Find persons from working_group type engagements
  RETURN QUERY
  WITH engagement_participants AS (
    SELECT DISTINCT
      pe.person_id,
      p.organization_id,
      person_d.name_en AS person_name_en,
      person_d.name_ar AS person_name_ar,
      org_d.name_en AS org_name_en,
      org_d.name_ar AS org_name_ar,
      p.title_en,
      p.photo_url,
      pe.role AS engagement_role,
      COUNT(DISTINCT pe.engagement_id) AS engagement_count,
      json_agg(DISTINCT jsonb_build_object(
        'engagement_id', e.id,
        'engagement_name', e.name_en,
        'role', pe.role
      )) AS engagement_list
    FROM person_engagements pe
    JOIN persons p ON p.id = pe.person_id
    JOIN dossiers person_d ON person_d.id = p.id
    LEFT JOIN organizations org ON org.id = p.organization_id
    LEFT JOIN dossiers org_d ON org_d.id = org.id
    JOIN engagements e ON e.id = pe.engagement_id
    WHERE e.format IN ('working_group', 'roundtable', 'consultation')
    AND pe.attended = TRUE
    AND person_d.status = 'active'
    -- Exclude already members (as persons)
    AND NOT EXISTS (
      SELECT 1 FROM working_group_members wgm
      WHERE wgm.working_group_id = p_working_group_id
      AND wgm.person_id = pe.person_id
      AND wgm.status = 'active'
    )
    -- Exclude rejected suggestions
    AND NOT EXISTS (
      SELECT 1 FROM working_group_member_suggestions wgs
      WHERE wgs.working_group_id = p_working_group_id
      AND wgs.suggested_person_id = pe.person_id
      AND wgs.status = 'rejected'
    )
    GROUP BY pe.person_id, p.organization_id, person_d.name_en, person_d.name_ar,
             org_d.name_en, org_d.name_ar, p.title_en, p.photo_url, pe.role
  )
  SELECT
    'person'::TEXT,
    NULL::UUID,
    ep.person_id,
    ep.person_name_en,
    ep.person_name_ar,
    'related_engagement'::TEXT,
    CASE
      WHEN ep.engagement_count >= 3 THEN 0.90
      WHEN ep.engagement_count >= 2 THEN 0.80
      ELSE 0.70
    END::NUMERIC(3,2),
    CASE
      WHEN ep.engagement_role IN ('chair', 'co-chair', 'moderator') THEN 'advisor'
      WHEN ep.engagement_role IN ('speaker', 'panelist') THEN 'member'
      ELSE 'member'
    END::TEXT,
    format('Participated in %s related working group engagements', ep.engagement_count)::TEXT,
    format('شارك في %s مشاركات مجموعات عمل ذات صلة', ep.engagement_count)::TEXT,
    jsonb_build_object(
      'engagement_count', ep.engagement_count,
      'engagements', ep.engagement_list,
      'organization_name_en', ep.org_name_en,
      'organization_name_ar', ep.org_name_ar,
      'title', ep.title_en
    )
  FROM engagement_participants ep
  ORDER BY ep.engagement_count DESC
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 4: Function to Generate Past Collaboration Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_past_collaboration_suggestions(p_working_group_id UUID)
RETURNS TABLE (
  suggested_entity_type TEXT,
  suggested_organization_id UUID,
  suggested_person_id UUID,
  suggested_name_en TEXT,
  suggested_name_ar TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_role TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_org_id UUID;
BEGIN
  -- Get lead organization
  SELECT wg.lead_org_id INTO v_lead_org_id
  FROM working_groups wg
  WHERE wg.id = p_working_group_id;

  -- Find organizations that have collaborated in other working groups
  RETURN QUERY
  WITH past_collaborators AS (
    SELECT DISTINCT
      wgm.organization_id,
      org_d.name_en,
      org_d.name_ar,
      COUNT(DISTINCT wgm.working_group_id) AS wg_count,
      array_agg(DISTINCT wg_d.name_en) AS past_wg_names
    FROM working_group_members wgm
    JOIN organizations org ON org.id = wgm.organization_id
    JOIN dossiers org_d ON org_d.id = org.id
    JOIN working_groups past_wg ON past_wg.id = wgm.working_group_id
    JOIN dossiers wg_d ON wg_d.id = past_wg.id
    WHERE wgm.working_group_id != p_working_group_id
    AND wgm.status = 'active'
    AND org_d.status = 'active'
    AND wgm.organization_id IS NOT NULL
    -- Exclude already members
    AND NOT EXISTS (
      SELECT 1 FROM working_group_members wgm2
      WHERE wgm2.working_group_id = p_working_group_id
      AND wgm2.organization_id = wgm.organization_id
      AND wgm2.status = 'active'
    )
    -- Exclude rejected
    AND NOT EXISTS (
      SELECT 1 FROM working_group_member_suggestions wgs
      WHERE wgs.working_group_id = p_working_group_id
      AND wgs.suggested_organization_id = wgm.organization_id
      AND wgs.status = 'rejected'
    )
    GROUP BY wgm.organization_id, org_d.name_en, org_d.name_ar
  )
  SELECT
    'organization'::TEXT,
    pc.organization_id,
    NULL::UUID,
    pc.name_en,
    pc.name_ar,
    'past_collaboration'::TEXT,
    CASE
      WHEN pc.wg_count >= 3 THEN 0.90
      WHEN pc.wg_count >= 2 THEN 0.80
      ELSE 0.70
    END::NUMERIC(3,2),
    'member'::TEXT,
    format('Member of %s other working groups', pc.wg_count)::TEXT,
    format('عضو في %s مجموعات عمل أخرى', pc.wg_count)::TEXT,
    jsonb_build_object(
      'past_wg_count', pc.wg_count,
      'past_wg_names', pc.past_wg_names
    )
  FROM past_collaborators pc
  ORDER BY pc.wg_count DESC
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 5: Function to Generate Lead Org Affiliate Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_lead_org_suggestions(p_working_group_id UUID)
RETURNS TABLE (
  suggested_entity_type TEXT,
  suggested_organization_id UUID,
  suggested_person_id UUID,
  suggested_name_en TEXT,
  suggested_name_ar TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_role TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_org_id UUID;
  v_lead_org_name_en TEXT;
  v_lead_org_name_ar TEXT;
BEGIN
  -- Get lead organization
  SELECT wg.lead_org_id, org_d.name_en, org_d.name_ar
  INTO v_lead_org_id, v_lead_org_name_en, v_lead_org_name_ar
  FROM working_groups wg
  LEFT JOIN dossiers org_d ON org_d.id = wg.lead_org_id
  WHERE wg.id = p_working_group_id;

  IF v_lead_org_id IS NULL THEN
    RETURN;
  END IF;

  -- Find senior persons at the lead organization
  RETURN QUERY
  WITH lead_org_persons AS (
    SELECT DISTINCT
      p.id AS person_id,
      person_d.name_en,
      person_d.name_ar,
      p.title_en,
      p.photo_url,
      p.importance_level,
      pr.role_title_en
    FROM persons p
    JOIN dossiers person_d ON person_d.id = p.id
    LEFT JOIN person_roles pr ON pr.person_id = p.id AND pr.is_current = TRUE
    WHERE p.organization_id = v_lead_org_id
    AND person_d.status = 'active'
    -- Exclude already members
    AND NOT EXISTS (
      SELECT 1 FROM working_group_members wgm
      WHERE wgm.working_group_id = p_working_group_id
      AND wgm.person_id = p.id
      AND wgm.status = 'active'
    )
    -- Exclude rejected
    AND NOT EXISTS (
      SELECT 1 FROM working_group_member_suggestions wgs
      WHERE wgs.working_group_id = p_working_group_id
      AND wgs.suggested_person_id = p.id
      AND wgs.status = 'rejected'
    )
  )
  SELECT
    'person'::TEXT,
    NULL::UUID,
    lop.person_id,
    lop.name_en,
    lop.name_ar,
    'lead_org_affiliate'::TEXT,
    CASE
      WHEN lop.importance_level >= 8 THEN 0.95
      WHEN lop.importance_level >= 6 THEN 0.85
      WHEN lop.importance_level >= 4 THEN 0.75
      ELSE 0.65
    END::NUMERIC(3,2),
    CASE
      WHEN lop.role_title_en ILIKE '%director%' OR lop.role_title_en ILIKE '%head%' OR lop.role_title_en ILIKE '%chief%' THEN 'chair'
      WHEN lop.role_title_en ILIKE '%manager%' OR lop.role_title_en ILIKE '%coordinator%' THEN 'secretary'
      ELSE 'member'
    END::TEXT,
    format('Works at lead organization %s', v_lead_org_name_en)::TEXT,
    format('يعمل في المنظمة الرائدة %s', COALESCE(v_lead_org_name_ar, v_lead_org_name_en))::TEXT,
    jsonb_build_object(
      'lead_org_id', v_lead_org_id,
      'lead_org_name_en', v_lead_org_name_en,
      'lead_org_name_ar', v_lead_org_name_ar,
      'role_title', lop.role_title_en,
      'importance_level', lop.importance_level
    )
  FROM lead_org_persons lop
  ORDER BY lop.importance_level DESC NULLS LAST
  LIMIT 10;
END;
$$;

-- ============================================================================
-- PART 6: Master Function to Generate All Member Suggestions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_all_wg_member_suggestions(p_working_group_id UUID)
RETURNS TABLE (
  suggested_entity_type TEXT,
  suggested_organization_id UUID,
  suggested_person_id UUID,
  suggested_name_en TEXT,
  suggested_name_ar TEXT,
  suggestion_type TEXT,
  confidence_score NUMERIC(3,2),
  suggested_role TEXT,
  context_notes_en TEXT,
  context_notes_ar TEXT,
  evidence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH all_suggestions AS (
    -- Forum member suggestions
    SELECT * FROM generate_forum_member_suggestions(p_working_group_id)
    UNION ALL
    -- Engagement participant suggestions
    SELECT * FROM generate_engagement_member_suggestions(p_working_group_id)
    UNION ALL
    -- Past collaboration suggestions
    SELECT * FROM generate_past_collaboration_suggestions(p_working_group_id)
    UNION ALL
    -- Lead organization suggestions
    SELECT * FROM generate_lead_org_suggestions(p_working_group_id)
  ),
  ranked_suggestions AS (
    SELECT
      als.*,
      ROW_NUMBER() OVER (
        PARTITION BY
          CASE
            WHEN als.suggested_entity_type = 'organization' THEN als.suggested_organization_id::TEXT
            ELSE als.suggested_person_id::TEXT
          END
        ORDER BY als.confidence_score DESC
      ) AS rank
    FROM all_suggestions als
  )
  SELECT
    rs.suggested_entity_type,
    rs.suggested_organization_id,
    rs.suggested_person_id,
    rs.suggested_name_en,
    rs.suggested_name_ar,
    rs.suggestion_type,
    rs.confidence_score,
    rs.suggested_role,
    rs.context_notes_en,
    rs.context_notes_ar,
    rs.evidence
  FROM ranked_suggestions rs
  WHERE rs.rank = 1  -- Only keep best suggestion per entity
  ORDER BY rs.confidence_score DESC
  LIMIT 20;
END;
$$;

-- ============================================================================
-- PART 7: Function to Get Working Group Member Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_wg_member_count(p_working_group_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM working_group_members
  WHERE working_group_id = p_working_group_id
  AND status = 'active';

  RETURN v_count;
END;
$$;

-- ============================================================================
-- PART 8: Bulk Member Addition Function
-- ============================================================================

CREATE OR REPLACE FUNCTION add_bulk_wg_members(
  p_working_group_id UUID,
  p_members JSONB,  -- Array of { entity_type, organization_id, person_id, role, notes }
  p_user_id UUID
)
RETURNS TABLE (
  member_id UUID,
  entity_type TEXT,
  organization_id UUID,
  person_id UUID,
  role TEXT,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member JSONB;
  v_entity_type TEXT;
  v_org_id UUID;
  v_person_id UUID;
  v_role TEXT;
  v_notes TEXT;
  v_created_id UUID;
BEGIN
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    v_entity_type := v_member->>'entity_type';
    v_org_id := (v_member->>'organization_id')::UUID;
    v_person_id := (v_member->>'person_id')::UUID;
    v_role := COALESCE(v_member->>'role', 'member');
    v_notes := v_member->>'notes';

    BEGIN
      INSERT INTO working_group_members (
        working_group_id,
        member_type,
        organization_id,
        person_id,
        role,
        status,
        joined_date,
        notes,
        created_by
      ) VALUES (
        p_working_group_id,
        v_entity_type,
        v_org_id,
        v_person_id,
        v_role,
        'active',
        CURRENT_DATE,
        v_notes,
        p_user_id
      )
      RETURNING id INTO v_created_id;

      -- Update suggestion status to accepted
      UPDATE working_group_member_suggestions
      SET status = 'accepted', reviewed_at = NOW(), reviewed_by = p_user_id
      WHERE working_group_id = p_working_group_id
        AND (
          (suggested_organization_id = v_org_id AND v_org_id IS NOT NULL) OR
          (suggested_person_id = v_person_id AND v_person_id IS NOT NULL)
        )
        AND status = 'pending';

      RETURN QUERY SELECT v_created_id, v_entity_type, v_org_id, v_person_id, v_role, TRUE, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT NULL::UUID, v_entity_type, v_org_id, v_person_id, v_role, FALSE, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- PART 9: Reject Suggestion Function
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_wg_member_suggestion(
  p_working_group_id UUID,
  p_entity_type TEXT,
  p_organization_id UUID,
  p_person_id UUID,
  p_suggestion_type TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  -- Check if suggestion exists
  SELECT id INTO v_existing_id
  FROM working_group_member_suggestions
  WHERE working_group_id = p_working_group_id
    AND suggestion_type = p_suggestion_type
    AND (
      (suggested_organization_id = p_organization_id AND p_organization_id IS NOT NULL) OR
      (suggested_person_id = p_person_id AND p_person_id IS NOT NULL)
    );

  IF v_existing_id IS NOT NULL THEN
    -- Update existing
    UPDATE working_group_member_suggestions
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = p_user_id
    WHERE id = v_existing_id;
  ELSE
    -- Create rejected record
    INSERT INTO working_group_member_suggestions (
      working_group_id,
      suggested_entity_type,
      suggested_organization_id,
      suggested_person_id,
      suggestion_type,
      confidence_score,
      suggested_role,
      status,
      reviewed_at,
      reviewed_by
    ) VALUES (
      p_working_group_id,
      p_entity_type,
      p_organization_id,
      p_person_id,
      p_suggestion_type,
      0,
      'member',
      'rejected',
      NOW(),
      p_user_id
    );
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_forum_member_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_engagement_member_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_past_collaboration_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_lead_org_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_all_wg_member_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_wg_member_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_bulk_wg_members(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_wg_member_suggestion(UUID, TEXT, UUID, UUID, TEXT, UUID) TO authenticated;

COMMENT ON TABLE working_group_member_suggestions IS 'AI-generated suggestions for working group membership based on collaboration patterns';
COMMENT ON FUNCTION generate_all_wg_member_suggestions IS 'Generates member suggestions from forums, engagements, past collaborations, and lead organization';
