-- Migration: Meeting Minutes Capture
-- Feature: meeting-minutes-capture
-- Date: 2026-01-14
-- Description: Structured interface for capturing meeting minutes linked to events and engagements.
--              Supports action item extraction, voice-to-text, and AI summarization.

-- ============================================================================
-- PART 1: MEETING MINUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Link to source event/engagement (one of these should be set)
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  working_group_meeting_id UUID REFERENCES working_group_meetings(id) ON DELETE SET NULL,
  dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Meeting details (denormalized for when source is deleted)
  title_en TEXT NOT NULL,
  title_ar TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_end_date TIMESTAMPTZ,
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,

  -- Minutes content
  summary_en TEXT,
  summary_ar TEXT,
  agenda_items JSONB DEFAULT '[]',
  discussion_points JSONB DEFAULT '[]',
  decisions JSONB DEFAULT '[]',

  -- AI features
  ai_summary_en TEXT,
  ai_summary_ar TEXT,
  ai_generated_at TIMESTAMPTZ,
  ai_model_version TEXT,
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'archived')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Search optimization
  search_vector tsvector,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT has_source CHECK (
    calendar_event_id IS NOT NULL OR
    engagement_id IS NOT NULL OR
    working_group_meeting_id IS NOT NULL OR
    dossier_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_org ON meeting_minutes(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_calendar_event ON meeting_minutes(calendar_event_id) WHERE calendar_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_engagement ON meeting_minutes(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_wg_meeting ON meeting_minutes(working_group_meeting_id) WHERE working_group_meeting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_dossier ON meeting_minutes(dossier_id) WHERE dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON meeting_minutes(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_status ON meeting_minutes(status);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_search ON meeting_minutes USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_by ON meeting_minutes(created_by);

-- Updated_at trigger
CREATE TRIGGER set_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Search vector trigger
CREATE OR REPLACE FUNCTION meeting_minutes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary_en, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.ai_summary_en, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.title_ar, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.summary_ar, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meeting_minutes_search_update
  BEFORE INSERT OR UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION meeting_minutes_search_vector_update();

COMMENT ON TABLE meeting_minutes IS 'Structured meeting minutes linked to calendar events, engagements, or working group meetings';

-- ============================================================================
-- PART 2: MEETING ATTENDEES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,

  -- Polymorphic attendee (user, person dossier, or external contact)
  attendee_type TEXT NOT NULL CHECK (attendee_type IN ('user', 'person_dossier', 'external_contact', 'organization')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  person_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  external_contact_id UUID,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Attendee details (for display and denormalization)
  name_en TEXT,
  name_ar TEXT,
  email TEXT,
  title_en TEXT,
  title_ar TEXT,
  organization_name_en TEXT,
  organization_name_ar TEXT,

  -- Participation details
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('chair', 'co_chair', 'secretary', 'presenter', 'attendee', 'observer', 'guest')),
  attendance_status TEXT NOT NULL DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'excused', 'late', 'left_early', 'remote')),
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_attendee CHECK (
    (attendee_type = 'user' AND user_id IS NOT NULL) OR
    (attendee_type = 'person_dossier' AND person_dossier_id IS NOT NULL) OR
    (attendee_type = 'external_contact' AND (external_contact_id IS NOT NULL OR name_en IS NOT NULL)) OR
    (attendee_type = 'organization' AND organization_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_minutes ON meeting_attendees(meeting_minutes_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user ON meeting_attendees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_person ON meeting_attendees(person_dossier_id) WHERE person_dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_role ON meeting_attendees(role);

-- Updated_at trigger
CREATE TRIGGER set_meeting_attendees_updated_at
  BEFORE UPDATE ON meeting_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE meeting_attendees IS 'Polymorphic attendee tracking for meeting minutes';

-- ============================================================================
-- PART 3: MEETING ACTION ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,

  -- Action item details
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Assignment
  assignee_type TEXT CHECK (assignee_type IN ('user', 'person_dossier', 'organization')),
  assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_person_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  assignee_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  assignee_name_en TEXT,
  assignee_name_ar TEXT,

  -- Tracking
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'deferred')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- AI extraction metadata
  ai_extracted BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  source_text TEXT,

  -- Linking to work management
  linked_commitment_id UUID,
  linked_task_id UUID,
  auto_created_work_item BOOLEAN DEFAULT false,

  -- Order within meeting
  sort_order INTEGER DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_assignee CHECK (
    assignee_type IS NULL OR
    (assignee_type = 'user' AND assignee_user_id IS NOT NULL) OR
    (assignee_type = 'person_dossier' AND assignee_person_id IS NOT NULL) OR
    (assignee_type = 'organization' AND assignee_org_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_items_minutes ON meeting_action_items(meeting_minutes_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee_user ON meeting_action_items(assignee_user_id) WHERE assignee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_items_status ON meeting_action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON meeting_action_items(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_items_linked_commitment ON meeting_action_items(linked_commitment_id) WHERE linked_commitment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_items_linked_task ON meeting_action_items(linked_task_id) WHERE linked_task_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER set_meeting_action_items_updated_at
  BEFORE UPDATE ON meeting_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE meeting_action_items IS 'Action items extracted from meeting minutes with linking to work management';

-- ============================================================================
-- PART 4: MEETING VOICE MEMOS LINKING
-- ============================================================================

-- Link voice memos to meeting minutes
ALTER TABLE voice_memos
ADD COLUMN IF NOT EXISTS meeting_minutes_id UUID REFERENCES meeting_minutes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_voice_memos_meeting ON voice_memos(meeting_minutes_id) WHERE meeting_minutes_id IS NOT NULL;

-- ============================================================================
-- PART 5: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;

-- Meeting minutes policies
CREATE POLICY meeting_minutes_select ON meeting_minutes
  FOR SELECT USING (
    deleted_at IS NULL AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY meeting_minutes_insert ON meeting_minutes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY meeting_minutes_update ON meeting_minutes
  FOR UPDATE USING (
    deleted_at IS NULL AND
    auth.uid() IS NOT NULL AND
    (created_by = auth.uid() OR status != 'approved')
  );

CREATE POLICY meeting_minutes_delete ON meeting_minutes
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND
    status = 'draft'
  );

-- Meeting attendees policies
CREATE POLICY meeting_attendees_select ON meeting_attendees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY meeting_attendees_insert ON meeting_attendees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY meeting_attendees_update ON meeting_attendees
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY meeting_attendees_delete ON meeting_attendees
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Meeting action items policies
CREATE POLICY meeting_action_items_select ON meeting_action_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY meeting_action_items_insert ON meeting_action_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY meeting_action_items_update ON meeting_action_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY meeting_action_items_delete ON meeting_action_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 6: RPC FUNCTIONS
-- ============================================================================

-- Function: Get meeting minutes with full details
CREATE OR REPLACE FUNCTION get_meeting_minutes_full(p_minutes_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'minutes', jsonb_build_object(
      'id', mm.id,
      'title_en', mm.title_en,
      'title_ar', mm.title_ar,
      'meeting_date', mm.meeting_date,
      'meeting_end_date', mm.meeting_end_date,
      'location_en', mm.location_en,
      'location_ar', mm.location_ar,
      'is_virtual', mm.is_virtual,
      'meeting_url', mm.meeting_url,
      'summary_en', mm.summary_en,
      'summary_ar', mm.summary_ar,
      'agenda_items', mm.agenda_items,
      'discussion_points', mm.discussion_points,
      'decisions', mm.decisions,
      'ai_summary_en', mm.ai_summary_en,
      'ai_summary_ar', mm.ai_summary_ar,
      'ai_generated_at', mm.ai_generated_at,
      'ai_confidence', mm.ai_confidence,
      'status', mm.status,
      'approved_by', mm.approved_by,
      'approved_at', mm.approved_at,
      'calendar_event_id', mm.calendar_event_id,
      'engagement_id', mm.engagement_id,
      'working_group_meeting_id', mm.working_group_meeting_id,
      'dossier_id', mm.dossier_id,
      'created_by', mm.created_by,
      'created_at', mm.created_at,
      'updated_at', mm.updated_at
    ),
    'attendees', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ma.id,
        'attendee_type', ma.attendee_type,
        'user_id', ma.user_id,
        'person_dossier_id', ma.person_dossier_id,
        'organization_id', ma.organization_id,
        'name_en', ma.name_en,
        'name_ar', ma.name_ar,
        'email', ma.email,
        'title_en', ma.title_en,
        'title_ar', ma.title_ar,
        'organization_name_en', ma.organization_name_en,
        'organization_name_ar', ma.organization_name_ar,
        'role', ma.role,
        'attendance_status', ma.attendance_status
      ) ORDER BY
        CASE ma.role
          WHEN 'chair' THEN 1
          WHEN 'co_chair' THEN 2
          WHEN 'secretary' THEN 3
          WHEN 'presenter' THEN 4
          ELSE 5
        END,
        ma.name_en
      )
      FROM meeting_attendees ma
      WHERE ma.meeting_minutes_id = mm.id
    ), '[]'::jsonb),
    'action_items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mai.id,
        'title_en', mai.title_en,
        'title_ar', mai.title_ar,
        'description_en', mai.description_en,
        'description_ar', mai.description_ar,
        'assignee_type', mai.assignee_type,
        'assignee_user_id', mai.assignee_user_id,
        'assignee_name_en', mai.assignee_name_en,
        'assignee_name_ar', mai.assignee_name_ar,
        'priority', mai.priority,
        'status', mai.status,
        'due_date', mai.due_date,
        'ai_extracted', mai.ai_extracted,
        'ai_confidence', mai.ai_confidence,
        'linked_commitment_id', mai.linked_commitment_id,
        'linked_task_id', mai.linked_task_id
      ) ORDER BY mai.sort_order, mai.due_date NULLS LAST)
      FROM meeting_action_items mai
      WHERE mai.meeting_minutes_id = mm.id
    ), '[]'::jsonb),
    'voice_memos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', vm.id,
        'title', vm.title,
        'duration_seconds', vm.duration_seconds,
        'status', vm.status,
        'transcription', vm.transcription,
        'recorded_at', vm.recorded_at
      ) ORDER BY vm.recorded_at)
      FROM voice_memos vm
      WHERE vm.meeting_minutes_id = mm.id AND vm.deleted_at IS NULL
    ), '[]'::jsonb),
    'stats', jsonb_build_object(
      'attendee_count', (SELECT COUNT(*) FROM meeting_attendees WHERE meeting_minutes_id = mm.id),
      'present_count', (SELECT COUNT(*) FROM meeting_attendees WHERE meeting_minutes_id = mm.id AND attendance_status = 'present'),
      'action_item_count', (SELECT COUNT(*) FROM meeting_action_items WHERE meeting_minutes_id = mm.id),
      'completed_action_items', (SELECT COUNT(*) FROM meeting_action_items WHERE meeting_minutes_id = mm.id AND status = 'completed'),
      'voice_memo_count', (SELECT COUNT(*) FROM voice_memos WHERE meeting_minutes_id = mm.id AND deleted_at IS NULL)
    )
  ) INTO result
  FROM meeting_minutes mm
  WHERE mm.id = p_minutes_id AND mm.deleted_at IS NULL;

  RETURN result;
END;
$$;

-- Function: Search meeting minutes
CREATE OR REPLACE FUNCTION search_meeting_minutes(
  p_search_term TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_dossier_id UUID DEFAULT NULL,
  p_engagement_id UUID DEFAULT NULL,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title_en TEXT,
  title_ar TEXT,
  meeting_date TIMESTAMPTZ,
  location_en TEXT,
  is_virtual BOOLEAN,
  status TEXT,
  attendee_count BIGINT,
  action_item_count BIGINT,
  ai_summary_en TEXT,
  dossier_id UUID,
  dossier_name_en TEXT,
  engagement_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mm.id,
    mm.title_en,
    mm.title_ar,
    mm.meeting_date,
    mm.location_en,
    mm.is_virtual,
    mm.status,
    (SELECT COUNT(*) FROM meeting_attendees ma WHERE ma.meeting_minutes_id = mm.id) AS attendee_count,
    (SELECT COUNT(*) FROM meeting_action_items mai WHERE mai.meeting_minutes_id = mm.id) AS action_item_count,
    mm.ai_summary_en,
    mm.dossier_id,
    d.name_en AS dossier_name_en,
    mm.engagement_id,
    mm.created_by,
    mm.created_at
  FROM meeting_minutes mm
  LEFT JOIN dossiers d ON d.id = mm.dossier_id
  WHERE mm.deleted_at IS NULL
    AND (p_search_term IS NULL OR mm.search_vector @@ plainto_tsquery('english', p_search_term))
    AND (p_status IS NULL OR mm.status = p_status)
    AND (p_dossier_id IS NULL OR mm.dossier_id = p_dossier_id)
    AND (p_engagement_id IS NULL OR mm.engagement_id = p_engagement_id)
    AND (p_from_date IS NULL OR mm.meeting_date >= p_from_date)
    AND (p_to_date IS NULL OR mm.meeting_date <= p_to_date)
    AND (p_created_by IS NULL OR mm.created_by = p_created_by)
  ORDER BY mm.meeting_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function: Create commitment from action item
CREATE OR REPLACE FUNCTION create_commitment_from_action_item(
  p_action_item_id UUID,
  p_dossier_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_item meeting_action_items;
  v_commitment_id UUID;
BEGIN
  -- Get action item
  SELECT * INTO v_action_item
  FROM meeting_action_items
  WHERE id = p_action_item_id;

  IF v_action_item IS NULL THEN
    RAISE EXCEPTION 'Action item not found';
  END IF;

  -- Check if already linked
  IF v_action_item.linked_commitment_id IS NOT NULL THEN
    RETURN v_action_item.linked_commitment_id;
  END IF;

  -- Create commitment
  INSERT INTO aa_commitments (
    dossier_id,
    title,
    description,
    due_date,
    priority,
    status,
    owner_type,
    owner_user_id,
    tracking_mode,
    created_by
  ) VALUES (
    p_dossier_id,
    v_action_item.title_en,
    v_action_item.description_en,
    COALESCE(v_action_item.due_date, NOW() + INTERVAL '7 days'),
    v_action_item.priority,
    'pending',
    CASE WHEN v_action_item.assignee_user_id IS NOT NULL THEN 'internal' ELSE 'external' END,
    v_action_item.assignee_user_id,
    'manual',
    auth.uid()
  ) RETURNING id INTO v_commitment_id;

  -- Link action item to commitment
  UPDATE meeting_action_items
  SET
    linked_commitment_id = v_commitment_id,
    auto_created_work_item = true,
    updated_by = auth.uid()
  WHERE id = p_action_item_id;

  RETURN v_commitment_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_meeting_minutes_full TO authenticated;
GRANT EXECUTE ON FUNCTION search_meeting_minutes TO authenticated;
GRANT EXECUTE ON FUNCTION create_commitment_from_action_item TO authenticated;

COMMENT ON FUNCTION get_meeting_minutes_full IS 'Returns complete meeting minutes with attendees, action items, voice memos, and stats';
COMMENT ON FUNCTION search_meeting_minutes IS 'Search meeting minutes with filters for status, dossier, date range';
COMMENT ON FUNCTION create_commitment_from_action_item IS 'Creates a commitment from a meeting action item';
