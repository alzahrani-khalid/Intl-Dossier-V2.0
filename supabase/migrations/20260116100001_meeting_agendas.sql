-- Migration: Meeting Agendas Builder
-- Feature: meeting-agenda-builder
-- Date: 2026-01-16
-- Description: Create dedicated tool for building meeting agendas with time-boxed topics,
--              assigned presenters, linked entities, and document attachments.
--              Supports PDF generation and actual vs planned timing tracking.

-- ============================================================================
-- PART 1: MEETING AGENDAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Link to calendar event (optional - can create agenda before event exists)
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  meeting_minutes_id UUID REFERENCES meeting_minutes(id) ON DELETE SET NULL,
  dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Agenda details
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Meeting info (can differ from linked calendar event)
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_end_date TIMESTAMPTZ,
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,

  -- Timing
  planned_start_time TIME,
  planned_end_time TIME,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Riyadh',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'finalized',
    'in_meeting',
    'completed'
  )),

  -- PDF generation
  pdf_storage_path TEXT,
  pdf_generated_at TIMESTAMPTZ,
  pdf_version INTEGER DEFAULT 0,

  -- Template support
  is_template BOOLEAN DEFAULT false,
  template_name TEXT,
  template_description TEXT,

  -- Sharing settings
  is_public BOOLEAN DEFAULT false,
  shared_with_participants BOOLEAN DEFAULT true,

  -- Search optimization
  search_vector tsvector,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_org ON meeting_agendas(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_calendar_event ON meeting_agendas(calendar_event_id) WHERE calendar_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_minutes ON meeting_agendas(meeting_minutes_id) WHERE meeting_minutes_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_dossier ON meeting_agendas(dossier_id) WHERE dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_date ON meeting_agendas(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_status ON meeting_agendas(status);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_template ON meeting_agendas(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_search ON meeting_agendas USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_created_by ON meeting_agendas(created_by);

-- Updated_at trigger
CREATE TRIGGER set_meeting_agendas_updated_at
  BEFORE UPDATE ON meeting_agendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Search vector trigger
CREATE OR REPLACE FUNCTION meeting_agendas_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.title_ar, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.description_ar, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meeting_agendas_search_update
  BEFORE INSERT OR UPDATE ON meeting_agendas
  FOR EACH ROW
  EXECUTE FUNCTION meeting_agendas_search_vector_update();

COMMENT ON TABLE meeting_agendas IS 'Meeting agendas with time-boxed topics, presenters, and timing tracking';

-- ============================================================================
-- PART 2: AGENDA ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES meeting_agendas(id) ON DELETE CASCADE,

  -- Item details
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  notes_en TEXT,
  notes_ar TEXT,

  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
  indent_level INTEGER DEFAULT 0,

  -- Time boxing
  planned_duration_minutes INTEGER NOT NULL DEFAULT 15,
  planned_start_time TIME,
  planned_end_time TIME,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  actual_duration_minutes INTEGER,

  -- Timing status (computed during meeting)
  timing_status TEXT DEFAULT 'on_time' CHECK (timing_status IN (
    'not_started',
    'on_time',
    'running_over',
    'completed_early',
    'completed_late',
    'skipped'
  )),

  -- Item type
  item_type TEXT NOT NULL DEFAULT 'discussion' CHECK (item_type IN (
    'opening',
    'approval',
    'discussion',
    'presentation',
    'decision',
    'action_review',
    'break',
    'closing',
    'other'
  )),

  -- Presenter/owner
  presenter_type TEXT CHECK (presenter_type IN ('user', 'person_dossier', 'external', 'organization')),
  presenter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  presenter_person_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  presenter_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  presenter_name_en TEXT,
  presenter_name_ar TEXT,
  presenter_title_en TEXT,
  presenter_title_ar TEXT,

  -- Linked entities (dossiers, commitments, etc.)
  linked_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  linked_commitment_id UUID,
  linked_entity_type TEXT,
  linked_entity_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'discussed',
    'deferred',
    'skipped'
  )),

  -- Outcome tracking
  outcome_en TEXT,
  outcome_ar TEXT,
  decision_made BOOLEAN DEFAULT false,
  action_items_created INTEGER DEFAULT 0,

  -- AI suggestions
  ai_suggested BOOLEAN DEFAULT false,
  ai_suggested_duration INTEGER,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agenda_items_agenda ON agenda_items(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_sort ON agenda_items(agenda_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_agenda_items_parent ON agenda_items(parent_item_id) WHERE parent_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_items_presenter_user ON agenda_items(presenter_user_id) WHERE presenter_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_items_linked_dossier ON agenda_items(linked_dossier_id) WHERE linked_dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_items_status ON agenda_items(status);
CREATE INDEX IF NOT EXISTS idx_agenda_items_type ON agenda_items(item_type);

-- Updated_at trigger
CREATE TRIGGER set_agenda_items_updated_at
  BEFORE UPDATE ON agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE agenda_items IS 'Individual agenda items with time boxing, presenters, and timing tracking';

-- ============================================================================
-- PART 3: AGENDA DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS agenda_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES meeting_agendas(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,

  -- Document info
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Storage
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,

  -- Document type
  document_type TEXT NOT NULL DEFAULT 'attachment' CHECK (document_type IN (
    'attachment',
    'presentation',
    'reference',
    'handout',
    'supporting_document',
    'agenda_pdf'
  )),

  -- Access
  is_public BOOLEAN DEFAULT false,
  shared_before_meeting BOOLEAN DEFAULT true,

  -- Version tracking (for agenda PDFs)
  version INTEGER DEFAULT 1,

  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agenda_docs_agenda ON agenda_documents(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_docs_item ON agenda_documents(agenda_item_id) WHERE agenda_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_docs_type ON agenda_documents(document_type);

-- Updated_at trigger
CREATE TRIGGER set_agenda_documents_updated_at
  BEFORE UPDATE ON agenda_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE agenda_documents IS 'Documents attached to agendas or specific agenda items';

-- ============================================================================
-- PART 4: AGENDA PARTICIPANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS agenda_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES meeting_agendas(id) ON DELETE CASCADE,

  -- Polymorphic participant
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'person_dossier', 'external_contact', 'organization')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  person_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Participant details (denormalized for display)
  name_en TEXT,
  name_ar TEXT,
  email TEXT,
  title_en TEXT,
  title_ar TEXT,
  organization_name_en TEXT,
  organization_name_ar TEXT,

  -- Role
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN (
    'chair',
    'co_chair',
    'secretary',
    'presenter',
    'required',
    'optional',
    'observer'
  )),

  -- RSVP status
  rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN (
    'pending',
    'accepted',
    'declined',
    'tentative'
  )),
  rsvp_at TIMESTAMPTZ,
  rsvp_notes TEXT,

  -- Notification preferences
  notify_on_changes BOOLEAN DEFAULT true,
  notify_before_meeting BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_participant CHECK (
    (participant_type = 'user' AND user_id IS NOT NULL) OR
    (participant_type = 'person_dossier' AND person_dossier_id IS NOT NULL) OR
    (participant_type = 'external_contact' AND (name_en IS NOT NULL OR email IS NOT NULL)) OR
    (participant_type = 'organization' AND organization_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agenda_participants_agenda ON agenda_participants(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_participants_user ON agenda_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_participants_person ON agenda_participants(person_dossier_id) WHERE person_dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_participants_role ON agenda_participants(role);
CREATE INDEX IF NOT EXISTS idx_agenda_participants_rsvp ON agenda_participants(rsvp_status);

-- Updated_at trigger
CREATE TRIGGER set_agenda_participants_updated_at
  BEFORE UPDATE ON agenda_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE agenda_participants IS 'Participants invited to agenda with RSVP tracking';

-- ============================================================================
-- PART 5: TIMING SNAPSHOTS TABLE (for historical tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agenda_timing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES meeting_agendas(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,

  -- Snapshot type
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
    'meeting_start',
    'meeting_end',
    'item_start',
    'item_end',
    'break_start',
    'break_end',
    'pause',
    'resume'
  )),

  -- Timing data
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  planned_time TIME,
  variance_minutes INTEGER,

  -- Context
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timing_snapshots_agenda ON agenda_timing_snapshots(agenda_id);
CREATE INDEX IF NOT EXISTS idx_timing_snapshots_item ON agenda_timing_snapshots(agenda_item_id) WHERE agenda_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timing_snapshots_type ON agenda_timing_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_timing_snapshots_timestamp ON agenda_timing_snapshots(timestamp DESC);

COMMENT ON TABLE agenda_timing_snapshots IS 'Historical timing data for agendas and items during meetings';

-- ============================================================================
-- PART 6: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_timing_snapshots ENABLE ROW LEVEL SECURITY;

-- Meeting agendas policies
CREATE POLICY meeting_agendas_select ON meeting_agendas
  FOR SELECT USING (
    deleted_at IS NULL AND
    (
      auth.uid() IS NOT NULL OR
      (is_public = true AND status = 'finalized')
    )
  );

CREATE POLICY meeting_agendas_insert ON meeting_agendas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY meeting_agendas_update ON meeting_agendas
  FOR UPDATE USING (
    deleted_at IS NULL AND
    auth.uid() IS NOT NULL AND
    (created_by = auth.uid() OR status != 'completed')
  );

CREATE POLICY meeting_agendas_delete ON meeting_agendas
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND
    status = 'draft'
  );

-- Agenda items policies
CREATE POLICY agenda_items_select ON agenda_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY agenda_items_insert ON agenda_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY agenda_items_update ON agenda_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY agenda_items_delete ON agenda_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Agenda documents policies
CREATE POLICY agenda_documents_select ON agenda_documents
  FOR SELECT USING (auth.uid() IS NOT NULL OR is_public = true);

CREATE POLICY agenda_documents_insert ON agenda_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY agenda_documents_update ON agenda_documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY agenda_documents_delete ON agenda_documents
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Agenda participants policies
CREATE POLICY agenda_participants_select ON agenda_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY agenda_participants_insert ON agenda_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY agenda_participants_update ON agenda_participants
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY agenda_participants_delete ON agenda_participants
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Timing snapshots policies
CREATE POLICY agenda_timing_snapshots_select ON agenda_timing_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY agenda_timing_snapshots_insert ON agenda_timing_snapshots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 7: RPC FUNCTIONS
-- ============================================================================

-- Function: Get agenda with full details
CREATE OR REPLACE FUNCTION get_agenda_full(p_agenda_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agenda', jsonb_build_object(
      'id', ma.id,
      'title_en', ma.title_en,
      'title_ar', ma.title_ar,
      'description_en', ma.description_en,
      'description_ar', ma.description_ar,
      'meeting_date', ma.meeting_date,
      'meeting_end_date', ma.meeting_end_date,
      'location_en', ma.location_en,
      'location_ar', ma.location_ar,
      'is_virtual', ma.is_virtual,
      'meeting_url', ma.meeting_url,
      'planned_start_time', ma.planned_start_time,
      'planned_end_time', ma.planned_end_time,
      'actual_start_time', ma.actual_start_time,
      'actual_end_time', ma.actual_end_time,
      'timezone', ma.timezone,
      'status', ma.status,
      'pdf_storage_path', ma.pdf_storage_path,
      'pdf_generated_at', ma.pdf_generated_at,
      'pdf_version', ma.pdf_version,
      'is_template', ma.is_template,
      'calendar_event_id', ma.calendar_event_id,
      'meeting_minutes_id', ma.meeting_minutes_id,
      'dossier_id', ma.dossier_id,
      'created_by', ma.created_by,
      'created_at', ma.created_at,
      'updated_at', ma.updated_at
    ),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ai.id,
        'title_en', ai.title_en,
        'title_ar', ai.title_ar,
        'description_en', ai.description_en,
        'description_ar', ai.description_ar,
        'notes_en', ai.notes_en,
        'notes_ar', ai.notes_ar,
        'sort_order', ai.sort_order,
        'parent_item_id', ai.parent_item_id,
        'indent_level', ai.indent_level,
        'planned_duration_minutes', ai.planned_duration_minutes,
        'planned_start_time', ai.planned_start_time,
        'planned_end_time', ai.planned_end_time,
        'actual_start_time', ai.actual_start_time,
        'actual_end_time', ai.actual_end_time,
        'actual_duration_minutes', ai.actual_duration_minutes,
        'timing_status', ai.timing_status,
        'item_type', ai.item_type,
        'presenter_type', ai.presenter_type,
        'presenter_user_id', ai.presenter_user_id,
        'presenter_person_id', ai.presenter_person_id,
        'presenter_name_en', ai.presenter_name_en,
        'presenter_name_ar', ai.presenter_name_ar,
        'presenter_title_en', ai.presenter_title_en,
        'linked_dossier_id', ai.linked_dossier_id,
        'linked_commitment_id', ai.linked_commitment_id,
        'status', ai.status,
        'outcome_en', ai.outcome_en,
        'outcome_ar', ai.outcome_ar,
        'decision_made', ai.decision_made,
        'action_items_created', ai.action_items_created
      ) ORDER BY ai.sort_order)
      FROM agenda_items ai
      WHERE ai.agenda_id = ma.id
    ), '[]'::jsonb),
    'participants', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ap.id,
        'participant_type', ap.participant_type,
        'user_id', ap.user_id,
        'person_dossier_id', ap.person_dossier_id,
        'organization_id', ap.organization_id,
        'name_en', ap.name_en,
        'name_ar', ap.name_ar,
        'email', ap.email,
        'title_en', ap.title_en,
        'title_ar', ap.title_ar,
        'organization_name_en', ap.organization_name_en,
        'organization_name_ar', ap.organization_name_ar,
        'role', ap.role,
        'rsvp_status', ap.rsvp_status
      ) ORDER BY
        CASE ap.role
          WHEN 'chair' THEN 1
          WHEN 'co_chair' THEN 2
          WHEN 'secretary' THEN 3
          WHEN 'presenter' THEN 4
          WHEN 'required' THEN 5
          WHEN 'optional' THEN 6
          ELSE 7
        END,
        ap.name_en
      )
      FROM agenda_participants ap
      WHERE ap.agenda_id = ma.id
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ad.id,
        'title_en', ad.title_en,
        'title_ar', ad.title_ar,
        'document_type', ad.document_type,
        'file_name', ad.file_name,
        'file_type', ad.file_type,
        'file_size_bytes', ad.file_size_bytes,
        'storage_path', ad.storage_path,
        'agenda_item_id', ad.agenda_item_id,
        'shared_before_meeting', ad.shared_before_meeting
      ) ORDER BY ad.document_type, ad.title_en)
      FROM agenda_documents ad
      WHERE ad.agenda_id = ma.id
    ), '[]'::jsonb),
    'stats', jsonb_build_object(
      'item_count', (SELECT COUNT(*) FROM agenda_items WHERE agenda_id = ma.id),
      'total_planned_minutes', (SELECT COALESCE(SUM(planned_duration_minutes), 0) FROM agenda_items WHERE agenda_id = ma.id),
      'participant_count', (SELECT COUNT(*) FROM agenda_participants WHERE agenda_id = ma.id),
      'accepted_count', (SELECT COUNT(*) FROM agenda_participants WHERE agenda_id = ma.id AND rsvp_status = 'accepted'),
      'document_count', (SELECT COUNT(*) FROM agenda_documents WHERE agenda_id = ma.id),
      'completed_items', (SELECT COUNT(*) FROM agenda_items WHERE agenda_id = ma.id AND status = 'discussed'),
      'presenter_count', (SELECT COUNT(DISTINCT COALESCE(presenter_user_id::text, presenter_person_id::text, presenter_name_en)) FROM agenda_items WHERE agenda_id = ma.id AND presenter_type IS NOT NULL)
    )
  ) INTO result
  FROM meeting_agendas ma
  WHERE ma.id = p_agenda_id AND ma.deleted_at IS NULL;

  RETURN result;
END;
$$;

-- Function: Calculate agenda timing
CREATE OR REPLACE FUNCTION calculate_agenda_timing(p_agenda_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agenda meeting_agendas;
  v_total_planned INTEGER;
  v_total_actual INTEGER;
  v_items_timing JSONB;
BEGIN
  -- Get agenda
  SELECT * INTO v_agenda
  FROM meeting_agendas
  WHERE id = p_agenda_id AND deleted_at IS NULL;

  IF v_agenda IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate totals
  SELECT
    COALESCE(SUM(planned_duration_minutes), 0),
    COALESCE(SUM(actual_duration_minutes), 0)
  INTO v_total_planned, v_total_actual
  FROM agenda_items
  WHERE agenda_id = p_agenda_id;

  -- Get item-by-item timing
  SELECT jsonb_agg(jsonb_build_object(
    'id', ai.id,
    'title_en', ai.title_en,
    'sort_order', ai.sort_order,
    'planned_minutes', ai.planned_duration_minutes,
    'actual_minutes', ai.actual_duration_minutes,
    'variance_minutes', COALESCE(ai.actual_duration_minutes, 0) - ai.planned_duration_minutes,
    'timing_status', ai.timing_status,
    'status', ai.status
  ) ORDER BY ai.sort_order)
  INTO v_items_timing
  FROM agenda_items ai
  WHERE ai.agenda_id = p_agenda_id;

  RETURN jsonb_build_object(
    'agenda_id', p_agenda_id,
    'total_planned_minutes', v_total_planned,
    'total_actual_minutes', v_total_actual,
    'variance_minutes', v_total_actual - v_total_planned,
    'variance_percentage', CASE
      WHEN v_total_planned > 0 THEN ROUND(((v_total_actual - v_total_planned)::numeric / v_total_planned) * 100, 1)
      ELSE 0
    END,
    'meeting_started', v_agenda.actual_start_time IS NOT NULL,
    'meeting_ended', v_agenda.actual_end_time IS NOT NULL,
    'actual_start_time', v_agenda.actual_start_time,
    'actual_end_time', v_agenda.actual_end_time,
    'items', COALESCE(v_items_timing, '[]'::jsonb)
  );
END;
$$;

-- Function: Start meeting (record actual start time)
CREATE OR REPLACE FUNCTION start_agenda_meeting(p_agenda_id UUID)
RETURNS meeting_agendas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agenda meeting_agendas;
BEGIN
  UPDATE meeting_agendas
  SET
    status = 'in_meeting',
    actual_start_time = NOW(),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_agenda_id AND deleted_at IS NULL AND status IN ('draft', 'finalized')
  RETURNING * INTO v_agenda;

  -- Record timing snapshot
  INSERT INTO agenda_timing_snapshots (agenda_id, snapshot_type, timestamp, recorded_by)
  VALUES (p_agenda_id, 'meeting_start', NOW(), auth.uid());

  RETURN v_agenda;
END;
$$;

-- Function: End meeting (record actual end time)
CREATE OR REPLACE FUNCTION end_agenda_meeting(p_agenda_id UUID)
RETURNS meeting_agendas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agenda meeting_agendas;
BEGIN
  UPDATE meeting_agendas
  SET
    status = 'completed',
    actual_end_time = NOW(),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_agenda_id AND deleted_at IS NULL AND status = 'in_meeting'
  RETURNING * INTO v_agenda;

  -- Record timing snapshot
  INSERT INTO agenda_timing_snapshots (agenda_id, snapshot_type, timestamp, recorded_by)
  VALUES (p_agenda_id, 'meeting_end', NOW(), auth.uid());

  RETURN v_agenda;
END;
$$;

-- Function: Start agenda item
CREATE OR REPLACE FUNCTION start_agenda_item(p_item_id UUID)
RETURNS agenda_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item agenda_items;
BEGIN
  UPDATE agenda_items
  SET
    status = 'in_progress',
    actual_start_time = NOW(),
    timing_status = 'on_time',
    updated_at = NOW()
  WHERE id = p_item_id AND status = 'pending'
  RETURNING * INTO v_item;

  -- Record timing snapshot
  INSERT INTO agenda_timing_snapshots (agenda_id, agenda_item_id, snapshot_type, timestamp, recorded_by)
  VALUES (v_item.agenda_id, p_item_id, 'item_start', NOW(), auth.uid());

  RETURN v_item;
END;
$$;

-- Function: Complete agenda item
CREATE OR REPLACE FUNCTION complete_agenda_item(
  p_item_id UUID,
  p_outcome_en TEXT DEFAULT NULL,
  p_outcome_ar TEXT DEFAULT NULL,
  p_decision_made BOOLEAN DEFAULT false
)
RETURNS agenda_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item agenda_items;
  v_actual_minutes INTEGER;
  v_timing_status TEXT;
BEGIN
  -- Calculate actual duration
  SELECT
    EXTRACT(EPOCH FROM (NOW() - actual_start_time)) / 60,
    planned_duration_minutes
  INTO v_actual_minutes, v_timing_status
  FROM agenda_items WHERE id = p_item_id;

  -- Determine timing status
  SELECT
    CASE
      WHEN v_actual_minutes IS NULL THEN 'skipped'
      WHEN v_actual_minutes < planned_duration_minutes * 0.8 THEN 'completed_early'
      WHEN v_actual_minutes > planned_duration_minutes * 1.2 THEN 'completed_late'
      ELSE 'on_time'
    END
  INTO v_timing_status
  FROM agenda_items WHERE id = p_item_id;

  UPDATE agenda_items
  SET
    status = 'discussed',
    actual_end_time = NOW(),
    actual_duration_minutes = COALESCE(v_actual_minutes, 0),
    timing_status = v_timing_status,
    outcome_en = COALESCE(p_outcome_en, outcome_en),
    outcome_ar = COALESCE(p_outcome_ar, outcome_ar),
    decision_made = COALESCE(p_decision_made, decision_made),
    updated_at = NOW()
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  -- Record timing snapshot
  INSERT INTO agenda_timing_snapshots (
    agenda_id, agenda_item_id, snapshot_type, timestamp,
    variance_minutes, recorded_by
  )
  VALUES (
    v_item.agenda_id, p_item_id, 'item_end', NOW(),
    v_actual_minutes - v_item.planned_duration_minutes, auth.uid()
  );

  RETURN v_item;
END;
$$;

-- Function: Skip agenda item
CREATE OR REPLACE FUNCTION skip_agenda_item(p_item_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS agenda_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item agenda_items;
BEGIN
  UPDATE agenda_items
  SET
    status = 'skipped',
    timing_status = 'skipped',
    notes_en = COALESCE(p_reason, notes_en),
    updated_at = NOW()
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

-- Function: Reorder agenda items
CREATE OR REPLACE FUNCTION reorder_agenda_items(
  p_agenda_id UUID,
  p_item_orders JSONB -- Array of {id, sort_order}
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_orders)
  LOOP
    UPDATE agenda_items
    SET
      sort_order = (v_item->>'sort_order')::integer,
      updated_at = NOW()
    WHERE id = (v_item->>'id')::uuid AND agenda_id = p_agenda_id;
  END LOOP;

  RETURN true;
END;
$$;

-- Function: Create agenda from template
CREATE OR REPLACE FUNCTION create_agenda_from_template(
  p_template_id UUID,
  p_meeting_date TIMESTAMPTZ,
  p_title_en TEXT,
  p_title_ar TEXT DEFAULT NULL,
  p_dossier_id UUID DEFAULT NULL,
  p_calendar_event_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template meeting_agendas;
  v_new_agenda_id UUID;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM meeting_agendas
  WHERE id = p_template_id AND is_template = true AND deleted_at IS NULL;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found or not a template';
  END IF;

  -- Create new agenda
  INSERT INTO meeting_agendas (
    organization_id, calendar_event_id, dossier_id,
    title_en, title_ar, description_en, description_ar,
    meeting_date, location_en, location_ar, is_virtual, meeting_url,
    planned_start_time, planned_end_time, timezone,
    status, is_template, created_by
  ) VALUES (
    v_template.organization_id, p_calendar_event_id, p_dossier_id,
    p_title_en, COALESCE(p_title_ar, v_template.title_ar), v_template.description_en, v_template.description_ar,
    p_meeting_date, v_template.location_en, v_template.location_ar, v_template.is_virtual, v_template.meeting_url,
    v_template.planned_start_time, v_template.planned_end_time, v_template.timezone,
    'draft', false, auth.uid()
  ) RETURNING id INTO v_new_agenda_id;

  -- Copy agenda items
  INSERT INTO agenda_items (
    agenda_id, title_en, title_ar, description_en, description_ar,
    sort_order, indent_level, planned_duration_minutes, item_type,
    presenter_type, presenter_name_en, presenter_name_ar
  )
  SELECT
    v_new_agenda_id, title_en, title_ar, description_en, description_ar,
    sort_order, indent_level, planned_duration_minutes, item_type,
    presenter_type, presenter_name_en, presenter_name_ar
  FROM agenda_items
  WHERE agenda_id = p_template_id
  ORDER BY sort_order;

  RETURN v_new_agenda_id;
END;
$$;

-- Function: Search agendas
CREATE OR REPLACE FUNCTION search_agendas(
  p_search_term TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_dossier_id UUID DEFAULT NULL,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL,
  p_is_template BOOLEAN DEFAULT NULL,
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
  item_count BIGINT,
  total_duration_minutes BIGINT,
  participant_count BIGINT,
  is_template BOOLEAN,
  dossier_id UUID,
  dossier_name_en TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ma.id,
    ma.title_en,
    ma.title_ar,
    ma.meeting_date,
    ma.location_en,
    ma.is_virtual,
    ma.status,
    (SELECT COUNT(*) FROM agenda_items ai WHERE ai.agenda_id = ma.id) AS item_count,
    (SELECT COALESCE(SUM(planned_duration_minutes), 0) FROM agenda_items ai WHERE ai.agenda_id = ma.id) AS total_duration_minutes,
    (SELECT COUNT(*) FROM agenda_participants ap WHERE ap.agenda_id = ma.id) AS participant_count,
    ma.is_template,
    ma.dossier_id,
    d.name_en AS dossier_name_en,
    ma.created_by,
    ma.created_at
  FROM meeting_agendas ma
  LEFT JOIN dossiers d ON d.id = ma.dossier_id
  WHERE ma.deleted_at IS NULL
    AND (p_search_term IS NULL OR ma.search_vector @@ plainto_tsquery('english', p_search_term))
    AND (p_status IS NULL OR ma.status = p_status)
    AND (p_dossier_id IS NULL OR ma.dossier_id = p_dossier_id)
    AND (p_from_date IS NULL OR ma.meeting_date >= p_from_date)
    AND (p_to_date IS NULL OR ma.meeting_date <= p_to_date)
    AND (p_is_template IS NULL OR ma.is_template = p_is_template)
    AND (p_created_by IS NULL OR ma.created_by = p_created_by)
  ORDER BY ma.meeting_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_agenda_full TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_agenda_timing TO authenticated;
GRANT EXECUTE ON FUNCTION start_agenda_meeting TO authenticated;
GRANT EXECUTE ON FUNCTION end_agenda_meeting TO authenticated;
GRANT EXECUTE ON FUNCTION start_agenda_item TO authenticated;
GRANT EXECUTE ON FUNCTION complete_agenda_item TO authenticated;
GRANT EXECUTE ON FUNCTION skip_agenda_item TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_agenda_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_agenda_from_template TO authenticated;
GRANT EXECUTE ON FUNCTION search_agendas TO authenticated;

COMMENT ON FUNCTION get_agenda_full IS 'Returns complete agenda with items, participants, documents, and stats';
COMMENT ON FUNCTION calculate_agenda_timing IS 'Calculates timing statistics for an agenda';
COMMENT ON FUNCTION start_agenda_meeting IS 'Records meeting start time and changes status to in_meeting';
COMMENT ON FUNCTION end_agenda_meeting IS 'Records meeting end time and changes status to completed';
COMMENT ON FUNCTION start_agenda_item IS 'Records item start time and changes status to in_progress';
COMMENT ON FUNCTION complete_agenda_item IS 'Records item completion with outcome and timing status';
COMMENT ON FUNCTION skip_agenda_item IS 'Marks an agenda item as skipped';
COMMENT ON FUNCTION reorder_agenda_items IS 'Reorders agenda items by updating sort_order';
COMMENT ON FUNCTION create_agenda_from_template IS 'Creates a new agenda from an existing template';
COMMENT ON FUNCTION search_agendas IS 'Search agendas with filters for status, dossier, date range, and templates';
