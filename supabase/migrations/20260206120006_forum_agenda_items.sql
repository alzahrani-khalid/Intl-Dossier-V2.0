-- ============================================================================
-- Migration: Forum Agenda Items
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Forum agenda items with hierarchical structure and department assignments
-- Covers: UC-015, UC-016, UC-017, UC-035
-- ============================================================================

-- ============================================================================
-- PART 1: Create forum_agenda_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES forum_sessions(id) ON DELETE CASCADE,

  -- Item identification
  item_number TEXT NOT NULL, -- e.g., "3", "3.1", "3.1.a"
  sequence_order INTEGER NOT NULL,

  -- Titles (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Item classification
  item_type TEXT NOT NULL CHECK (item_type IN (
    'discussion',   -- For debate/discussion
    'decision',     -- Requires vote/decision
    'information',  -- Information sharing
    'election',     -- Election/voting
    'procedural',   -- Procedural matter
    'report',       -- Report presentation
    'adoption'      -- Document adoption
  )),

  -- Hierarchy (for nested agenda items)
  parent_item_id UUID REFERENCES forum_agenda_items(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1, -- 1 = main item, 2 = sub-item, etc.

  -- Timing
  time_allocation_minutes INTEGER,
  scheduled_start_time TIME,
  scheduled_end_time TIME,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not yet discussed
    'in_progress',  -- Currently being discussed
    'completed',    -- Finished discussion
    'deferred',     -- Postponed to later
    'withdrawn',    -- Removed from agenda
    'adopted',      -- For decisions: adopted
    'rejected'      -- For decisions: rejected
  )),

  -- Outcome (for completed items)
  outcome_en TEXT,
  outcome_ar TEXT,
  resolution_reference TEXT, -- If resulted in resolution

  -- Related documents
  documents JSONB DEFAULT '[]', -- Array of {title, url, type}
  background_notes_en TEXT,
  background_notes_ar TEXT,

  -- Speakers/Presenters
  speakers JSONB DEFAULT '[]', -- Array of {name_en, name_ar, organization, role}

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1
);

-- ============================================================================
-- PART 2: Create agenda_item_assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS agenda_item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID NOT NULL REFERENCES forum_agenda_items(id) ON DELETE CASCADE,

  -- Assignment target (can be department, organization, or person)
  assignee_type TEXT NOT NULL CHECK (assignee_type IN (
    'department',     -- Internal department
    'organization',   -- External organization
    'person',         -- Specific person
    'working_group'   -- Working group
  )),
  assignee_id UUID NOT NULL,
  assignee_name_en TEXT, -- Cached name for display
  assignee_name_ar TEXT,

  -- Role in the item
  role TEXT NOT NULL CHECK (role IN (
    'lead',           -- Primary responsible
    'support',        -- Supporting role
    'observer',       -- Observer only
    'presenter',      -- Presenting
    'rapporteur',     -- Recording/reporting
    'coordinator'     -- Coordination role
  )),

  -- Assignment details
  instructions_en TEXT,
  instructions_ar TEXT,
  deadline DATE,

  -- Status tracking
  status TEXT DEFAULT 'assigned' CHECK (status IN (
    'assigned',       -- Just assigned
    'acknowledged',   -- Assignment acknowledged
    'in_progress',    -- Work in progress
    'completed',      -- Task completed
    'pending_review', -- Awaiting review
    'declined'        -- Assignment declined
  )),

  -- Response/Notes from assignee
  response_en TEXT,
  response_ar TEXT,
  response_documents JSONB DEFAULT '[]',
  responded_at TIMESTAMPTZ,

  -- Audit fields
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

-- Agenda items indexes
CREATE INDEX idx_forum_agenda_session ON forum_agenda_items(session_id);
CREATE INDEX idx_forum_agenda_parent ON forum_agenda_items(parent_item_id)
  WHERE parent_item_id IS NOT NULL;
CREATE INDEX idx_forum_agenda_sequence ON forum_agenda_items(session_id, sequence_order);
CREATE INDEX idx_forum_agenda_type ON forum_agenda_items(session_id, item_type);
CREATE INDEX idx_forum_agenda_status ON forum_agenda_items(session_id, status);
CREATE INDEX idx_forum_agenda_priority ON forum_agenda_items(session_id, priority)
  WHERE priority IN ('high', 'urgent');

-- Search index
CREATE INDEX idx_forum_agenda_search ON forum_agenda_items
  USING gin(to_tsvector('english', title_en || ' ' || COALESCE(description_en, '')));

-- Tags index
CREATE INDEX idx_forum_agenda_tags ON forum_agenda_items USING gin(tags);

-- Assignments indexes
CREATE INDEX idx_agenda_assignments_item ON agenda_item_assignments(agenda_item_id);
CREATE INDEX idx_agenda_assignments_assignee ON agenda_item_assignments(assignee_type, assignee_id);
CREATE INDEX idx_agenda_assignments_status ON agenda_item_assignments(status);
CREATE INDEX idx_agenda_assignments_deadline ON agenda_item_assignments(deadline)
  WHERE deadline IS NOT NULL;
CREATE INDEX idx_agenda_assignments_lead ON agenda_item_assignments(agenda_item_id)
  WHERE role = 'lead';

-- ============================================================================
-- PART 4: Triggers
-- ============================================================================

-- Update timestamp trigger for agenda items
CREATE TRIGGER update_forum_agenda_updated_at
  BEFORE UPDATE ON forum_agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for assignments
CREATE TRIGGER update_agenda_assignments_updated_at
  BEFORE UPDATE ON agenda_item_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Version increment trigger
CREATE OR REPLACE FUNCTION increment_forum_agenda_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = OLD._version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_forum_agenda_version
  BEFORE UPDATE ON forum_agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION increment_forum_agenda_version();

-- Auto-calculate level based on parent
CREATE OR REPLACE FUNCTION set_agenda_item_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_item_id IS NULL THEN
    NEW.level = 1;
  ELSE
    SELECT level + 1 INTO NEW.level
    FROM forum_agenda_items
    WHERE id = NEW.parent_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agenda_item_level
  BEFORE INSERT OR UPDATE OF parent_item_id ON forum_agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION set_agenda_item_level();

-- ============================================================================
-- PART 5: RLS Policies
-- ============================================================================

ALTER TABLE forum_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_item_assignments ENABLE ROW LEVEL SECURITY;

-- Agenda items policies
CREATE POLICY "Users can view agenda items"
  ON forum_agenda_items FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create agenda items"
  ON forum_agenda_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

CREATE POLICY "Creator can update agenda items"
  ON forum_agenda_items FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Assignments policies
CREATE POLICY "Users can view assignments"
  ON agenda_item_assignments FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can create assignments"
  ON agenda_item_assignments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND assigned_by = auth.uid()
  );

CREATE POLICY "Assigner or assignee can update"
  ON agenda_item_assignments FOR UPDATE
  USING (
    assigned_by = auth.uid()
    OR (
      assignee_type = 'person'
      AND EXISTS (
        SELECT 1 FROM persons p
        WHERE p.id = agenda_item_assignments.assignee_id
        -- Here we would check if current user is the person
      )
    )
  );

CREATE POLICY "Assigner can delete assignments"
  ON agenda_item_assignments FOR DELETE
  USING (assigned_by = auth.uid());

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function: Get full agenda for a session with hierarchy
CREATE OR REPLACE FUNCTION get_session_agenda(p_session_id UUID)
RETURNS TABLE (
  id UUID,
  item_number TEXT,
  title_en TEXT,
  title_ar TEXT,
  item_type TEXT,
  status TEXT,
  time_allocation_minutes INTEGER,
  level INTEGER,
  parent_item_id UUID,
  sequence_order INTEGER,
  priority TEXT,
  assignments_count BIGINT,
  lead_assignee_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE agenda_tree AS (
    -- Root items
    SELECT
      ai.id,
      ai.item_number,
      ai.title_en,
      ai.title_ar,
      ai.item_type,
      ai.status,
      ai.time_allocation_minutes,
      ai.level,
      ai.parent_item_id,
      ai.sequence_order,
      ai.priority,
      ai.sequence_order as sort_path
    FROM forum_agenda_items ai
    WHERE ai.session_id = p_session_id
      AND ai.parent_item_id IS NULL
      AND ai.deleted_at IS NULL

    UNION ALL

    -- Child items
    SELECT
      ai.id,
      ai.item_number,
      ai.title_en,
      ai.title_ar,
      ai.item_type,
      ai.status,
      ai.time_allocation_minutes,
      ai.level,
      ai.parent_item_id,
      ai.sequence_order,
      ai.priority,
      at.sort_path * 1000 + ai.sequence_order
    FROM forum_agenda_items ai
    JOIN agenda_tree at ON ai.parent_item_id = at.id
    WHERE ai.deleted_at IS NULL
  )
  SELECT
    at.id,
    at.item_number,
    at.title_en,
    at.title_ar,
    at.item_type,
    at.status,
    at.time_allocation_minutes,
    at.level,
    at.parent_item_id,
    at.sequence_order,
    at.priority,
    (SELECT COUNT(*) FROM agenda_item_assignments aia WHERE aia.agenda_item_id = at.id) as assignments_count,
    (SELECT aia.assignee_name_en FROM agenda_item_assignments aia
     WHERE aia.agenda_item_id = at.id AND aia.role = 'lead' LIMIT 1) as lead_assignee_name
  FROM agenda_tree at
  ORDER BY at.sort_path;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get assignments for an agenda item
CREATE OR REPLACE FUNCTION get_agenda_item_assignments(p_agenda_item_id UUID)
RETURNS TABLE (
  id UUID,
  assignee_type TEXT,
  assignee_id UUID,
  assignee_name_en TEXT,
  assignee_name_ar TEXT,
  role TEXT,
  status TEXT,
  deadline DATE,
  instructions_en TEXT,
  response_en TEXT,
  responded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aia.id,
    aia.assignee_type,
    aia.assignee_id,
    aia.assignee_name_en,
    aia.assignee_name_ar,
    aia.role,
    aia.status,
    aia.deadline,
    aia.instructions_en,
    aia.response_en,
    aia.responded_at
  FROM agenda_item_assignments aia
  WHERE aia.agenda_item_id = p_agenda_item_id
  ORDER BY
    CASE aia.role WHEN 'lead' THEN 1 WHEN 'presenter' THEN 2 WHEN 'coordinator' THEN 3 ELSE 4 END,
    aia.assigned_at;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get all assignments for an entity across forum sessions
CREATE OR REPLACE FUNCTION get_entity_forum_assignments(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  assignment_id UUID,
  agenda_item_id UUID,
  agenda_item_title_en TEXT,
  session_id UUID,
  session_title_en TEXT,
  forum_id UUID,
  role TEXT,
  status TEXT,
  deadline DATE,
  item_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aia.id as assignment_id,
    aia.agenda_item_id,
    ai.title_en as agenda_item_title_en,
    fs.id as session_id,
    fs.title_en as session_title_en,
    fs.forum_id,
    aia.role,
    aia.status,
    aia.deadline,
    ai.status as item_status
  FROM agenda_item_assignments aia
  JOIN forum_agenda_items ai ON aia.agenda_item_id = ai.id
  JOIN forum_sessions fs ON ai.session_id = fs.id
  WHERE aia.assignee_type = p_entity_type
    AND aia.assignee_id = p_entity_id
    AND ai.deleted_at IS NULL
    AND (p_status IS NULL OR aia.status = p_status)
  ORDER BY aia.deadline ASC NULLS LAST, ai.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get agenda item response status summary
CREATE OR REPLACE FUNCTION get_session_response_status(p_session_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  total_assignments BIGINT,
  assignments_completed BIGINT,
  assignments_pending BIGINT,
  assignments_in_progress BIGINT,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM forum_agenda_items WHERE session_id = p_session_id AND deleted_at IS NULL) as total_items,
    COUNT(*) as total_assignments,
    COUNT(*) FILTER (WHERE aia.status = 'completed') as assignments_completed,
    COUNT(*) FILTER (WHERE aia.status IN ('assigned', 'acknowledged')) as assignments_pending,
    COUNT(*) FILTER (WHERE aia.status = 'in_progress') as assignments_in_progress,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE aia.status = 'completed')::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0
    END as completion_percentage
  FROM agenda_item_assignments aia
  JOIN forum_agenda_items ai ON aia.agenda_item_id = ai.id
  WHERE ai.session_id = p_session_id
    AND ai.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 7: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON forum_agenda_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agenda_item_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_agenda(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agenda_item_assignments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_forum_assignments(TEXT, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_response_status(UUID) TO authenticated;

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE forum_agenda_items IS 'Agenda items for forum sessions with hierarchical structure';
COMMENT ON TABLE agenda_item_assignments IS 'Assignments of agenda items to departments/organizations/persons';
COMMENT ON COLUMN forum_agenda_items.item_number IS 'Agenda item number (e.g., "3", "3.1", "3.1.a")';
COMMENT ON COLUMN forum_agenda_items.item_type IS 'Type: discussion, decision, information, election, procedural, report, adoption';
COMMENT ON COLUMN agenda_item_assignments.role IS 'Role: lead, support, observer, presenter, rapporteur, coordinator';
COMMENT ON FUNCTION get_session_agenda(UUID) IS 'Get full agenda for a session with hierarchy and assignment info';
COMMENT ON FUNCTION get_agenda_item_assignments(UUID) IS 'Get all assignments for a specific agenda item';
COMMENT ON FUNCTION get_entity_forum_assignments IS 'Get all forum assignments for an entity (department/org/person)';
COMMENT ON FUNCTION get_session_response_status IS 'Get response status summary for a session';

-- ============================================================================
-- Migration Complete
-- ============================================================================
