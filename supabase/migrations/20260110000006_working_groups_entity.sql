-- Migration: Working Groups Entity Enhancement
-- Feature: working-groups-entity-management
-- Date: 2026-01-10
-- Description: Enhance working_groups table with membership tracking,
--              parent forum links, and deliverable coordination

-- ============================================================================
-- PART 1: ENHANCE WORKING_GROUPS TABLE
-- ============================================================================

-- Add missing columns to working_groups extension table
ALTER TABLE working_groups
ADD COLUMN IF NOT EXISTS parent_forum_id UUID REFERENCES forums(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS wg_type TEXT DEFAULT 'committee' CHECK (wg_type IN ('committee', 'task_force', 'advisory_board', 'technical_group', 'steering_committee')),
ADD COLUMN IF NOT EXISTS meeting_frequency TEXT CHECK (meeting_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'biannually', 'annually', 'as_needed')),
ADD COLUMN IF NOT EXISTS next_meeting_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS chair_person_id UUID,
ADD COLUMN IF NOT EXISTS secretary_person_id UUID,
ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add comments
COMMENT ON COLUMN working_groups.parent_forum_id IS 'Reference to parent forum dossier if working group belongs to a forum';
COMMENT ON COLUMN working_groups.wg_type IS 'Type of working group: committee, task_force, advisory_board, technical_group, steering_committee';
COMMENT ON COLUMN working_groups.meeting_frequency IS 'Standard meeting frequency for the group';
COMMENT ON COLUMN working_groups.chair_person_id IS 'Person dossier ID of the current chair';
COMMENT ON COLUMN working_groups.secretary_person_id IS 'Person dossier ID of the secretary/coordinator';
COMMENT ON COLUMN working_groups.objectives IS 'JSON array of key objectives for the working group';

-- ============================================================================
-- PART 2: WORKING GROUP MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  -- Can be organization or person
  member_type TEXT NOT NULL CHECK (member_type IN ('organization', 'person')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  person_id UUID,
  -- Membership details
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('chair', 'co_chair', 'vice_chair', 'secretary', 'member', 'observer', 'advisor', 'liaison')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  joined_date DATE DEFAULT CURRENT_DATE,
  left_date DATE,
  -- Representation details
  representing_country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  representing_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  -- Permissions
  can_vote BOOLEAN DEFAULT true,
  can_propose BOOLEAN DEFAULT true,
  -- Notes
  notes TEXT,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  -- Constraints
  CONSTRAINT valid_member CHECK (
    (member_type = 'organization' AND organization_id IS NOT NULL) OR
    (member_type = 'person' AND person_id IS NOT NULL)
  ),
  CONSTRAINT valid_dates CHECK (left_date IS NULL OR left_date >= joined_date),
  CONSTRAINT unique_org_member UNIQUE (working_group_id, organization_id) WHERE organization_id IS NOT NULL,
  CONSTRAINT unique_person_member UNIQUE (working_group_id, person_id) WHERE person_id IS NOT NULL
);

-- Indexes for working_group_members
CREATE INDEX IF NOT EXISTS idx_wg_members_group ON working_group_members(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_members_org ON working_group_members(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wg_members_person ON working_group_members(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wg_members_status ON working_group_members(status);
CREATE INDEX IF NOT EXISTS idx_wg_members_role ON working_group_members(role);

-- Trigger for updated_at
CREATE TRIGGER set_working_group_members_updated_at
  BEFORE UPDATE ON working_group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE working_group_members IS 'Tracks membership of organizations and persons in working groups';

-- ============================================================================
-- PART 3: WORKING GROUP DELIVERABLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_group_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  -- Deliverable details
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  -- Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled', 'deferred')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  -- Dates
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  due_date DATE,
  -- Assignment
  assigned_to_member_id UUID REFERENCES working_group_members(id) ON DELETE SET NULL,
  assigned_to_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestones JSONB DEFAULT '[]',
  -- Categorization
  deliverable_type TEXT NOT NULL DEFAULT 'document' CHECK (deliverable_type IN ('document', 'report', 'recommendation', 'standard', 'guideline', 'framework', 'action_plan', 'other')),
  -- Links
  document_url TEXT,
  related_commitment_id UUID,
  -- Notes
  notes TEXT,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for deliverables
CREATE INDEX IF NOT EXISTS idx_wg_deliverables_group ON working_group_deliverables(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_deliverables_status ON working_group_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_wg_deliverables_due_date ON working_group_deliverables(due_date);
CREATE INDEX IF NOT EXISTS idx_wg_deliverables_priority ON working_group_deliverables(priority);
CREATE INDEX IF NOT EXISTS idx_wg_deliverables_assigned_member ON working_group_deliverables(assigned_to_member_id);

-- Trigger for updated_at
CREATE TRIGGER set_working_group_deliverables_updated_at
  BEFORE UPDATE ON working_group_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE working_group_deliverables IS 'Tracks deliverables and outputs from working groups';

-- ============================================================================
-- PART 4: WORKING GROUP MEETINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_group_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  -- Meeting details
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  -- Date and location
  meeting_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
  -- Documents
  agenda_url TEXT,
  minutes_url TEXT,
  -- Attendance tracking
  expected_attendees INTEGER,
  actual_attendees INTEGER,
  attendance_record JSONB DEFAULT '[]',
  -- Decisions and actions
  decisions JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  -- Notes
  notes TEXT,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for meetings
CREATE INDEX IF NOT EXISTS idx_wg_meetings_group ON working_group_meetings(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_meetings_date ON working_group_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_wg_meetings_status ON working_group_meetings(status);

-- Trigger for updated_at
CREATE TRIGGER set_working_group_meetings_updated_at
  BEFORE UPDATE ON working_group_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE working_group_meetings IS 'Tracks meetings and sessions of working groups';

-- ============================================================================
-- PART 5: WORKING GROUP DECISIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_group_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES working_group_meetings(id) ON DELETE SET NULL,
  -- Decision details
  decision_number TEXT,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  -- Categorization
  decision_type TEXT NOT NULL DEFAULT 'resolution' CHECK (decision_type IN ('resolution', 'recommendation', 'action', 'policy', 'procedural', 'other')),
  status TEXT NOT NULL DEFAULT 'adopted' CHECK (status IN ('proposed', 'under_review', 'adopted', 'implemented', 'superseded', 'withdrawn')),
  -- Voting
  voting_result JSONB,
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_deadline DATE,
  -- Related entities
  related_deliverable_id UUID REFERENCES working_group_deliverables(id) ON DELETE SET NULL,
  -- Notes
  notes TEXT,
  -- Audit
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for decisions
CREATE INDEX IF NOT EXISTS idx_wg_decisions_group ON working_group_decisions(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_decisions_meeting ON working_group_decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_wg_decisions_date ON working_group_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_wg_decisions_status ON working_group_decisions(status);

-- Trigger for updated_at
CREATE TRIGGER set_working_group_decisions_updated_at
  BEFORE UPDATE ON working_group_decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE working_group_decisions IS 'Tracks formal decisions made by working groups';

-- ============================================================================
-- PART 6: VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Working Group with stats
CREATE OR REPLACE VIEW working_group_stats AS
SELECT
  wg.id,
  d.name_en,
  d.name_ar,
  d.status AS dossier_status,
  wg.wg_status,
  wg.wg_type,
  wg.established_date,
  wg.parent_forum_id,
  -- Member counts
  (SELECT COUNT(*) FROM working_group_members m WHERE m.working_group_id = wg.id AND m.status = 'active') AS active_member_count,
  (SELECT COUNT(*) FROM working_group_members m WHERE m.working_group_id = wg.id AND m.member_type = 'organization' AND m.status = 'active') AS org_member_count,
  (SELECT COUNT(*) FROM working_group_members m WHERE m.working_group_id = wg.id AND m.member_type = 'person' AND m.status = 'active') AS person_member_count,
  -- Deliverable stats
  (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = wg.id) AS total_deliverables,
  (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = wg.id AND del.status = 'completed') AS completed_deliverables,
  (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = wg.id AND del.status = 'in_progress') AS in_progress_deliverables,
  -- Meeting stats
  (SELECT COUNT(*) FROM working_group_meetings m WHERE m.working_group_id = wg.id) AS total_meetings,
  (SELECT COUNT(*) FROM working_group_meetings m WHERE m.working_group_id = wg.id AND m.status = 'completed') AS completed_meetings,
  (SELECT MIN(meeting_date) FROM working_group_meetings m WHERE m.working_group_id = wg.id AND m.meeting_date > NOW() AND m.status = 'scheduled') AS next_meeting_date,
  -- Decision stats
  (SELECT COUNT(*) FROM working_group_decisions dec WHERE dec.working_group_id = wg.id) AS total_decisions,
  -- Timestamps
  d.created_at,
  d.updated_at
FROM working_groups wg
JOIN dossiers d ON d.id = wg.id
WHERE d.type = 'working_group' AND d.status NOT IN ('archived', 'deleted');

COMMENT ON VIEW working_group_stats IS 'Aggregated statistics for working groups including member, deliverable, and meeting counts';

-- ============================================================================
-- PART 7: RPC FUNCTIONS
-- ============================================================================

-- Function: Get working group with full details
CREATE OR REPLACE FUNCTION get_working_group_full(p_working_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'working_group', jsonb_build_object(
      'id', wg.id,
      'name_en', d.name_en,
      'name_ar', d.name_ar,
      'summary_en', d.summary_en,
      'summary_ar', d.summary_ar,
      'description_en', wg.description_en,
      'description_ar', wg.description_ar,
      'status', d.status,
      'wg_status', wg.wg_status,
      'wg_type', wg.wg_type,
      'mandate_en', wg.mandate_en,
      'mandate_ar', wg.mandate_ar,
      'meeting_frequency', wg.meeting_frequency,
      'established_date', wg.established_date,
      'disbandment_date', wg.disbandment_date,
      'parent_forum_id', wg.parent_forum_id,
      'lead_org_id', wg.lead_org_id,
      'chair_person_id', wg.chair_person_id,
      'secretary_person_id', wg.secretary_person_id,
      'objectives', wg.objectives,
      'created_at', d.created_at,
      'updated_at', d.updated_at
    ),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'member_type', m.member_type,
        'role', m.role,
        'status', m.status,
        'joined_date', m.joined_date,
        'can_vote', m.can_vote,
        'organization_id', m.organization_id,
        'organization_name_en', org_d.name_en,
        'organization_name_ar', org_d.name_ar,
        'person_id', m.person_id,
        'representing_country_id', m.representing_country_id,
        'country_name_en', country_d.name_en,
        'country_name_ar', country_d.name_ar
      ) ORDER BY m.role, m.joined_date)
      FROM working_group_members m
      LEFT JOIN organizations org ON org.id = m.organization_id
      LEFT JOIN dossiers org_d ON org_d.id = org.id
      LEFT JOIN countries country ON country.id = m.representing_country_id
      LEFT JOIN dossiers country_d ON country_d.id = country.id
      WHERE m.working_group_id = wg.id AND m.status = 'active'
    ), '[]'::jsonb),
    'deliverables', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', del.id,
        'title_en', del.title_en,
        'title_ar', del.title_ar,
        'status', del.status,
        'priority', del.priority,
        'due_date', del.due_date,
        'progress_percentage', del.progress_percentage,
        'deliverable_type', del.deliverable_type
      ) ORDER BY del.due_date NULLS LAST, del.priority DESC)
      FROM working_group_deliverables del
      WHERE del.working_group_id = wg.id
    ), '[]'::jsonb),
    'upcoming_meetings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mtg.id,
        'title_en', mtg.title_en,
        'title_ar', mtg.title_ar,
        'meeting_date', mtg.meeting_date,
        'location_en', mtg.location_en,
        'is_virtual', mtg.is_virtual,
        'status', mtg.status
      ) ORDER BY mtg.meeting_date)
      FROM working_group_meetings mtg
      WHERE mtg.working_group_id = wg.id
        AND mtg.meeting_date >= NOW()
        AND mtg.status IN ('scheduled', 'in_progress')
      LIMIT 5
    ), '[]'::jsonb),
    'recent_decisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', dec.id,
        'decision_number', dec.decision_number,
        'title_en', dec.title_en,
        'title_ar', dec.title_ar,
        'decision_type', dec.decision_type,
        'status', dec.status,
        'decision_date', dec.decision_date
      ) ORDER BY dec.decision_date DESC)
      FROM working_group_decisions dec
      WHERE dec.working_group_id = wg.id
      LIMIT 10
    ), '[]'::jsonb),
    'stats', jsonb_build_object(
      'active_members', (SELECT COUNT(*) FROM working_group_members m WHERE m.working_group_id = wg.id AND m.status = 'active'),
      'total_deliverables', (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = wg.id),
      'completed_deliverables', (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = wg.id AND del.status = 'completed'),
      'total_meetings', (SELECT COUNT(*) FROM working_group_meetings mtg WHERE mtg.working_group_id = wg.id),
      'total_decisions', (SELECT COUNT(*) FROM working_group_decisions dec WHERE dec.working_group_id = wg.id)
    )
  ) INTO result
  FROM working_groups wg
  JOIN dossiers d ON d.id = wg.id
  WHERE wg.id = p_working_group_id;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_working_group_full IS 'Returns complete working group details including members, deliverables, meetings, and decisions';

-- Function: Search working groups
CREATE OR REPLACE FUNCTION search_working_groups(
  p_search_term TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_wg_type TEXT DEFAULT NULL,
  p_parent_forum_id UUID DEFAULT NULL,
  p_lead_org_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  status TEXT,
  wg_status TEXT,
  wg_type TEXT,
  parent_forum_id UUID,
  lead_org_id UUID,
  lead_org_name_en TEXT,
  lead_org_name_ar TEXT,
  established_date DATE,
  meeting_frequency TEXT,
  active_member_count BIGINT,
  total_deliverables BIGINT,
  next_meeting_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wg.id,
    d.name_en,
    d.name_ar,
    d.summary_en,
    d.summary_ar,
    d.status,
    wg.wg_status,
    wg.wg_type,
    wg.parent_forum_id,
    wg.lead_org_id,
    lead_org_d.name_en AS lead_org_name_en,
    lead_org_d.name_ar AS lead_org_name_ar,
    wg.established_date,
    wg.meeting_frequency,
    (SELECT COUNT(*) FROM working_group_members m WHERE m.working_group_id = wg.id AND m.status = 'active') AS active_member_count,
    (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = wg.id) AS total_deliverables,
    (SELECT MIN(meeting_date) FROM working_group_meetings mtg WHERE mtg.working_group_id = wg.id AND mtg.meeting_date > NOW() AND mtg.status = 'scheduled') AS next_meeting_date,
    d.created_at,
    d.updated_at
  FROM working_groups wg
  JOIN dossiers d ON d.id = wg.id
  LEFT JOIN organizations lead_org ON lead_org.id = wg.lead_org_id
  LEFT JOIN dossiers lead_org_d ON lead_org_d.id = lead_org.id
  WHERE d.type = 'working_group'
    AND d.status NOT IN ('archived', 'deleted')
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%' OR
      d.name_ar ILIKE '%' || p_search_term || '%' OR
      d.summary_en ILIKE '%' || p_search_term || '%' OR
      wg.mandate_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_status IS NULL OR d.status = p_status)
    AND (p_wg_type IS NULL OR wg.wg_type = p_wg_type)
    AND (p_parent_forum_id IS NULL OR wg.parent_forum_id = p_parent_forum_id)
    AND (p_lead_org_id IS NULL OR wg.lead_org_id = p_lead_org_id)
  ORDER BY d.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION search_working_groups IS 'Search working groups with filters for status, type, parent forum, and lead organization';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_working_group_full TO authenticated;
GRANT EXECUTE ON FUNCTION search_working_groups TO authenticated;
