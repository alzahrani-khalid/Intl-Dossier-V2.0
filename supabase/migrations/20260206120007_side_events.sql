-- ============================================================================
-- Migration: Side Events
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Side events for forum sessions with logistics tracking
-- Covers: UC-018, UC-019, UC-020, UC-036
-- ============================================================================

-- ============================================================================
-- PART 1: Create side_events table
-- ============================================================================

CREATE TABLE IF NOT EXISTS side_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES forum_sessions(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'bilateral_meeting',  -- One-on-one country/org meetings
    'multilateral_meeting', -- Multiple parties
    'reception',          -- Social reception/dinner
    'exhibition',         -- Exhibition/showcase
    'workshop',           -- Working session
    'press_conference',   -- Media event
    'signing_ceremony',   -- Document signing
    'cultural_event',     -- Cultural program
    'networking',         -- Networking event
    'breakfast_meeting',  -- Working breakfast
    'lunch_meeting',      -- Working lunch
    'dinner_meeting',     -- Working dinner
    'other'               -- Other type
  )),

  -- Event details (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  all_day BOOLEAN DEFAULT false,

  -- Location
  venue_en TEXT,
  venue_ar TEXT,
  venue_address_en TEXT,
  venue_address_ar TEXT,
  room_name TEXT,
  is_offsite BOOLEAN DEFAULT false, -- Outside main forum venue

  -- Capacity and attendance
  capacity INTEGER,
  expected_attendance INTEGER,
  registration_required BOOLEAN DEFAULT false,
  invitation_only BOOLEAN DEFAULT false,

  -- Organizer/Host
  organizer_type TEXT CHECK (organizer_type IN ('organization', 'country', 'person', 'delegation')),
  organizer_id UUID,
  organizer_name_en TEXT,
  organizer_name_ar TEXT,
  host_country_id UUID REFERENCES countries(id) ON DELETE SET NULL,

  -- Participants (for bilateral/multilateral)
  participants JSONB DEFAULT '[]', -- Array of {type, id, name_en, name_ar, role}

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned',    -- Initial planning
    'confirmed',  -- Confirmed to happen
    'tentative',  -- Not yet confirmed
    'cancelled',  -- Cancelled
    'postponed',  -- Postponed
    'completed'   -- Event completed
  )),
  cancellation_reason TEXT,

  -- Documents/Materials
  agenda_url TEXT,
  materials JSONB DEFAULT '[]', -- Array of {title, url, type}

  -- Notes
  notes_en TEXT,
  notes_ar TEXT,
  internal_notes TEXT, -- Internal planning notes

  -- Priority and visibility
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'vip')),
  is_public BOOLEAN DEFAULT false, -- Can be shown in public agenda

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1
);

-- ============================================================================
-- PART 2: Create event_logistics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES side_events(id) ON DELETE CASCADE,

  -- Logistics type
  logistics_type TEXT NOT NULL CHECK (logistics_type IN (
    'catering',           -- Food and beverages
    'av_equipment',       -- Audio/visual equipment
    'interpretation',     -- Translation/interpretation
    'security',           -- Security arrangements
    'transportation',     -- Transport/shuttles
    'accommodation',      -- Lodging arrangements
    'decoration',         -- Venue decoration
    'photography',        -- Photo/video
    'printing',           -- Materials printing
    'registration',       -- Registration desk
    'signage',            -- Signs and directions
    'gifts',              -- Gifts/souvenirs
    'protocol',           -- Protocol arrangements
    'other'               -- Other logistics
  )),

  -- Provider details
  provider_name TEXT,
  provider_contact TEXT,
  provider_email TEXT,
  provider_phone TEXT,

  -- Requirements
  requirements_en TEXT,
  requirements_ar TEXT,
  quantity INTEGER,
  specifications JSONB DEFAULT '{}',

  -- Cost tracking
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  currency TEXT DEFAULT 'SAR',
  budget_code TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Not yet started
    'requested',  -- Request sent
    'quoted',     -- Quote received
    'approved',   -- Approved for booking
    'booked',     -- Booking confirmed
    'confirmed',  -- Provider confirmed
    'cancelled',  -- Cancelled
    'completed'   -- Service delivered
  )),

  -- Dates
  deadline DATE,
  booked_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: Create event_attendees table
-- ============================================================================

CREATE TABLE IF NOT EXISTS side_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES side_events(id) ON DELETE CASCADE,

  -- Attendee (person or external)
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  external_name_en TEXT,
  external_name_ar TEXT,
  external_title_en TEXT,
  external_title_ar TEXT,

  -- Organization/Country representation
  representing_type TEXT CHECK (representing_type IN ('country', 'organization', 'self')),
  representing_id UUID,
  representing_name_en TEXT,
  representing_name_ar TEXT,

  -- Role at event
  role TEXT DEFAULT 'attendee' CHECK (role IN (
    'host',         -- Hosting the event
    'co_host',      -- Co-hosting
    'speaker',      -- Speaking/presenting
    'moderator',    -- Moderating
    'panelist',     -- Panel member
    'vip_guest',    -- VIP guest
    'attendee',     -- Regular attendee
    'observer',     -- Observer
    'staff',        -- Support staff
    'interpreter'   -- Interpreter
  )),

  -- Attendance tracking
  invitation_sent BOOLEAN DEFAULT false,
  invitation_sent_at TIMESTAMPTZ,
  rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN (
    'pending',
    'accepted',
    'declined',
    'tentative',
    'no_response'
  )),
  rsvp_at TIMESTAMPTZ,
  attended BOOLEAN,
  attendance_notes TEXT,

  -- Dietary/Accessibility needs
  dietary_requirements TEXT,
  accessibility_requirements TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Unique constraint
  CONSTRAINT unique_event_attendee UNIQUE (event_id, COALESCE(person_id, gen_random_uuid()))
);

-- ============================================================================
-- PART 4: Create indexes for performance
-- ============================================================================

-- Side events indexes
CREATE INDEX idx_side_events_session ON side_events(session_id);
CREATE INDEX idx_side_events_date ON side_events(scheduled_date);
CREATE INDEX idx_side_events_type ON side_events(event_type);
CREATE INDEX idx_side_events_status ON side_events(status);
CREATE INDEX idx_side_events_organizer ON side_events(organizer_type, organizer_id)
  WHERE organizer_id IS NOT NULL;
CREATE INDEX idx_side_events_host_country ON side_events(host_country_id)
  WHERE host_country_id IS NOT NULL;
CREATE INDEX idx_side_events_public ON side_events(session_id, scheduled_date)
  WHERE is_public = true AND status IN ('confirmed', 'completed') AND deleted_at IS NULL;

-- Search index
CREATE INDEX idx_side_events_search ON side_events
  USING gin(to_tsvector('english', title_en || ' ' || COALESCE(description_en, '')));

-- Participants GIN index
CREATE INDEX idx_side_events_participants ON side_events USING gin(participants);

-- Event logistics indexes
CREATE INDEX idx_event_logistics_event ON event_logistics(event_id);
CREATE INDEX idx_event_logistics_type ON event_logistics(event_id, logistics_type);
CREATE INDEX idx_event_logistics_status ON event_logistics(status);
CREATE INDEX idx_event_logistics_deadline ON event_logistics(deadline)
  WHERE deadline IS NOT NULL AND status NOT IN ('confirmed', 'completed', 'cancelled');

-- Attendees indexes
CREATE INDEX idx_side_event_attendees_event ON side_event_attendees(event_id);
CREATE INDEX idx_side_event_attendees_person ON side_event_attendees(person_id)
  WHERE person_id IS NOT NULL;
CREATE INDEX idx_side_event_attendees_rsvp ON side_event_attendees(event_id, rsvp_status);
CREATE INDEX idx_side_event_attendees_role ON side_event_attendees(event_id, role);

-- ============================================================================
-- PART 5: Triggers
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_side_events_updated_at
  BEFORE UPDATE ON side_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_logistics_updated_at
  BEFORE UPDATE ON event_logistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Version increment trigger
CREATE OR REPLACE FUNCTION increment_side_events_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = OLD._version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_side_events_version
  BEFORE UPDATE ON side_events
  FOR EACH ROW
  EXECUTE FUNCTION increment_side_events_version();

-- Calculate duration from times
CREATE OR REPLACE FUNCTION calculate_event_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE OF start_time, end_time ON side_events
  FOR EACH ROW
  EXECUTE FUNCTION calculate_event_duration();

-- ============================================================================
-- PART 6: RLS Policies
-- ============================================================================

ALTER TABLE side_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_event_attendees ENABLE ROW LEVEL SECURITY;

-- Side events policies
CREATE POLICY "Users can view side events"
  ON side_events FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create side events"
  ON side_events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

CREATE POLICY "Creator can update side events"
  ON side_events FOR UPDATE
  USING (created_by = auth.uid());

-- Logistics policies
CREATE POLICY "Users can view logistics"
  ON event_logistics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM side_events se
      WHERE se.id = event_logistics.event_id
      AND se.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can manage logistics"
  ON event_logistics FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Attendees policies
CREATE POLICY "Users can view attendees"
  ON side_event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM side_events se
      WHERE se.id = side_event_attendees.event_id
      AND se.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can manage attendees"
  ON side_event_attendees FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 7: Helper Functions
-- ============================================================================

-- Function: Get all side events for a session
CREATE OR REPLACE FUNCTION get_session_side_events(
  p_session_id UUID,
  p_date DATE DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  title_en TEXT,
  title_ar TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  venue_en TEXT,
  organizer_name_en TEXT,
  status TEXT,
  capacity INTEGER,
  attendee_count BIGINT,
  confirmed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.event_type,
    se.title_en,
    se.title_ar,
    se.scheduled_date,
    se.start_time,
    se.end_time,
    se.venue_en,
    se.organizer_name_en,
    se.status,
    se.capacity,
    (SELECT COUNT(*) FROM side_event_attendees sea WHERE sea.event_id = se.id) as attendee_count,
    (SELECT COUNT(*) FROM side_event_attendees sea WHERE sea.event_id = se.id AND sea.rsvp_status = 'accepted') as confirmed_count
  FROM side_events se
  WHERE se.session_id = p_session_id
    AND se.deleted_at IS NULL
    AND (p_date IS NULL OR se.scheduled_date = p_date)
    AND (p_event_type IS NULL OR se.event_type = p_event_type)
    AND (p_status IS NULL OR se.status = p_status)
  ORDER BY se.scheduled_date, se.start_time NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get logistics status for an event
CREATE OR REPLACE FUNCTION get_event_logistics_summary(p_event_id UUID)
RETURNS TABLE (
  logistics_type TEXT,
  status TEXT,
  provider_name TEXT,
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  currency TEXT,
  deadline DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.logistics_type,
    el.status,
    el.provider_name,
    el.estimated_cost,
    el.actual_cost,
    el.currency,
    el.deadline
  FROM event_logistics el
  WHERE el.event_id = p_event_id
  ORDER BY
    CASE el.status
      WHEN 'pending' THEN 1
      WHEN 'requested' THEN 2
      WHEN 'quoted' THEN 3
      WHEN 'approved' THEN 4
      WHEN 'booked' THEN 5
      WHEN 'confirmed' THEN 6
      WHEN 'completed' THEN 7
      ELSE 8
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get event attendee list
CREATE OR REPLACE FUNCTION get_event_attendees(
  p_event_id UUID,
  p_role TEXT DEFAULT NULL,
  p_rsvp_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  person_id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  representing_name_en TEXT,
  role TEXT,
  rsvp_status TEXT,
  dietary_requirements TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sea.id,
    sea.person_id,
    COALESCE(d.name_en, sea.external_name_en) as name_en,
    COALESCE(d.name_ar, sea.external_name_ar) as name_ar,
    COALESCE(p.title_en, sea.external_title_en) as title_en,
    sea.representing_name_en,
    sea.role,
    sea.rsvp_status,
    sea.dietary_requirements
  FROM side_event_attendees sea
  LEFT JOIN persons p ON sea.person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE sea.event_id = p_event_id
    AND (p_role IS NULL OR sea.role = p_role)
    AND (p_rsvp_status IS NULL OR sea.rsvp_status = p_rsvp_status)
  ORDER BY
    CASE sea.role
      WHEN 'host' THEN 1
      WHEN 'co_host' THEN 2
      WHEN 'speaker' THEN 3
      WHEN 'moderator' THEN 4
      WHEN 'vip_guest' THEN 5
      ELSE 6
    END,
    COALESCE(d.name_en, sea.external_name_en);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get logistics dashboard for a session (all events)
CREATE OR REPLACE FUNCTION get_session_logistics_dashboard(p_session_id UUID)
RETURNS TABLE (
  event_id UUID,
  event_title_en TEXT,
  event_date DATE,
  total_logistics BIGINT,
  pending_logistics BIGINT,
  confirmed_logistics BIGINT,
  total_estimated_cost DECIMAL,
  total_actual_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id as event_id,
    se.title_en as event_title_en,
    se.scheduled_date as event_date,
    COUNT(el.id) as total_logistics,
    COUNT(el.id) FILTER (WHERE el.status IN ('pending', 'requested', 'quoted', 'approved')) as pending_logistics,
    COUNT(el.id) FILTER (WHERE el.status IN ('confirmed', 'completed')) as confirmed_logistics,
    SUM(COALESCE(el.estimated_cost, 0)) as total_estimated_cost,
    SUM(COALESCE(el.actual_cost, 0)) as total_actual_cost
  FROM side_events se
  LEFT JOIN event_logistics el ON el.event_id = se.id
  WHERE se.session_id = p_session_id
    AND se.deleted_at IS NULL
  GROUP BY se.id, se.title_en, se.scheduled_date
  ORDER BY se.scheduled_date, se.start_time;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 8: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON side_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_logistics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON side_event_attendees TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_side_events(UUID, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_logistics_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_attendees(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_logistics_dashboard(UUID) TO authenticated;

-- ============================================================================
-- PART 9: Comments
-- ============================================================================

COMMENT ON TABLE side_events IS 'Side events during forum sessions (bilateral meetings, receptions, workshops, etc.)';
COMMENT ON TABLE event_logistics IS 'Logistics requirements and tracking for side events';
COMMENT ON TABLE side_event_attendees IS 'Attendee list and RSVP tracking for side events';
COMMENT ON COLUMN side_events.event_type IS 'Type of side event: bilateral_meeting, reception, workshop, etc.';
COMMENT ON COLUMN side_events.participants IS 'JSON array of participating countries/organizations for bilateral/multilateral meetings';
COMMENT ON COLUMN event_logistics.logistics_type IS 'Type of logistics: catering, av_equipment, interpretation, security, etc.';
COMMENT ON FUNCTION get_session_side_events IS 'Get all side events for a session with attendance counts';
COMMENT ON FUNCTION get_event_logistics_summary IS 'Get logistics status summary for a specific event';
COMMENT ON FUNCTION get_event_attendees IS 'Get attendee list for an event with optional filters';
COMMENT ON FUNCTION get_session_logistics_dashboard IS 'Get logistics dashboard showing all events and their logistics status';

-- ============================================================================
-- Migration Complete
-- ============================================================================
