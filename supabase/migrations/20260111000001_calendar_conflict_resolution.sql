-- Migration: Calendar Conflict Resolution System
-- Feature: event-conflict-resolution
-- Date: 2026-01-11
-- Description: Enhanced calendar conflict detection with AI-assisted rescheduling suggestions

-- Create enum for conflict types
DO $$ BEGIN
    CREATE TYPE calendar_conflict_type AS ENUM (
        'venue',
        'participant',
        'organizer',
        'holiday',
        'resource',
        'travel_time'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for conflict severity
DO $$ BEGIN
    CREATE TYPE conflict_severity AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for resolution status
DO $$ BEGIN
    CREATE TYPE conflict_resolution_status AS ENUM (
        'pending',
        'auto_resolved',
        'manually_resolved',
        'ignored',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for scenario status
DO $$ BEGIN
    CREATE TYPE scenario_status AS ENUM (
        'draft',
        'analyzing',
        'ready',
        'applied',
        'discarded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: calendar_conflicts
-- Stores detected conflicts between calendar events
CREATE TABLE IF NOT EXISTS calendar_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    conflicting_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    conflict_type calendar_conflict_type NOT NULL,
    severity conflict_severity NOT NULL DEFAULT 'medium',
    resolution_status conflict_resolution_status NOT NULL DEFAULT 'pending',

    -- Conflict details
    overlap_start TIMESTAMPTZ,
    overlap_end TIMESTAMPTZ,
    overlap_minutes INTEGER,
    message_en TEXT NOT NULL,
    message_ar TEXT,

    -- Affected resources/participants
    affected_participant_ids UUID[] DEFAULT '{}',
    affected_resources TEXT[] DEFAULT '{}',

    -- Resolution tracking
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- AI suggestions
    ai_suggestion JSONB DEFAULT '{}',
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: rescheduling_suggestions
-- Stores AI-generated rescheduling suggestions for events with conflicts
CREATE TABLE IF NOT EXISTS rescheduling_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_id UUID NOT NULL REFERENCES calendar_conflicts(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,

    -- Suggested new time
    suggested_start TIMESTAMPTZ NOT NULL,
    suggested_end TIMESTAMPTZ NOT NULL,

    -- Scoring
    availability_score DECIMAL(3,2) DEFAULT 0 CHECK (availability_score >= 0 AND availability_score <= 1),
    priority_score DECIMAL(3,2) DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 1),
    travel_feasibility_score DECIMAL(3,2) DEFAULT 0 CHECK (travel_feasibility_score >= 0 AND travel_feasibility_score <= 1),
    overall_score DECIMAL(3,2) GENERATED ALWAYS AS (
        (COALESCE(availability_score, 0) + COALESCE(priority_score, 0) + COALESCE(travel_feasibility_score, 0)) / 3
    ) STORED,

    -- Context
    reason_en TEXT,
    reason_ar TEXT,
    participant_availability JSONB DEFAULT '{}',

    -- Alternative venue if applicable
    alternative_venue_en TEXT,
    alternative_venue_ar TEXT,

    -- Status
    is_accepted BOOLEAN DEFAULT false,
    accepted_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: what_if_scenarios
-- Stores what-if scenario simulations for bulk rescheduling
CREATE TABLE IF NOT EXISTS what_if_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    name_en TEXT NOT NULL,
    name_ar TEXT,
    description_en TEXT,
    description_ar TEXT,

    -- Scenario configuration
    affected_event_ids UUID[] NOT NULL DEFAULT '{}',
    proposed_changes JSONB NOT NULL DEFAULT '[]',

    -- Analysis results
    status scenario_status NOT NULL DEFAULT 'draft',
    conflicts_before INTEGER DEFAULT 0,
    conflicts_after INTEGER DEFAULT 0,
    impact_summary JSONB DEFAULT '{}',

    -- AI analysis
    ai_analysis JSONB DEFAULT '{}',
    ai_recommendation_en TEXT,
    ai_recommendation_ar TEXT,

    -- Timestamps
    analyzed_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: participant_availability
-- Caches participant availability for faster conflict detection
CREATE TABLE IF NOT EXISTS participant_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'person_dossier', 'external_contact')),

    -- Availability window
    available_from TIMESTAMPTZ NOT NULL,
    available_to TIMESTAMPTZ NOT NULL,

    -- Status
    availability_status TEXT NOT NULL CHECK (availability_status IN ('available', 'busy', 'tentative', 'out_of_office')),

    -- Travel considerations
    location_en TEXT,
    location_ar TEXT,
    timezone TEXT DEFAULT 'Asia/Riyadh',

    -- Metadata
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'calendar_sync', 'ai_inferred')),
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_availability_range CHECK (available_to > available_from),
    CONSTRAINT unique_participant_window UNIQUE (participant_id, available_from, available_to)
);

-- Table: venue_resources
-- Stores venue and resource information for conflict checking
CREATE TABLE IF NOT EXISTS venue_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('room', 'equipment', 'service', 'venue')),

    -- Capacity and features
    capacity INTEGER,
    features JSONB DEFAULT '{}',

    -- Location
    building_en TEXT,
    building_ar TEXT,
    floor TEXT,

    -- Availability
    is_active BOOLEAN DEFAULT true,
    booking_lead_time_hours INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: travel_logistics
-- Stores travel time estimates between locations
CREATE TABLE IF NOT EXISTS travel_logistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,

    -- Travel estimates
    estimated_travel_minutes INTEGER NOT NULL,
    travel_mode TEXT DEFAULT 'driving' CHECK (travel_mode IN ('walking', 'driving', 'public_transit', 'flight')),

    -- Buffer time
    recommended_buffer_minutes INTEGER DEFAULT 15,

    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT now(),
    data_source TEXT DEFAULT 'manual'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_event_id ON calendar_conflicts(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_conflicting_event ON calendar_conflicts(conflicting_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_status ON calendar_conflicts(resolution_status);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_severity ON calendar_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_created ON calendar_conflicts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rescheduling_suggestions_conflict ON rescheduling_suggestions(conflict_id);
CREATE INDEX IF NOT EXISTS idx_rescheduling_suggestions_event ON rescheduling_suggestions(event_id);
CREATE INDEX IF NOT EXISTS idx_rescheduling_suggestions_score ON rescheduling_suggestions(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_user ON what_if_scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_status ON what_if_scenarios(status);

CREATE INDEX IF NOT EXISTS idx_participant_availability_participant ON participant_availability(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_availability_window ON participant_availability(available_from, available_to);

CREATE INDEX IF NOT EXISTS idx_travel_logistics_locations ON travel_logistics(from_location, to_location);

-- Function to check event conflicts
CREATE OR REPLACE FUNCTION check_event_conflicts(
    p_event_id UUID,
    p_start_datetime TIMESTAMPTZ,
    p_end_datetime TIMESTAMPTZ,
    p_venue_en TEXT DEFAULT NULL,
    p_participant_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
    conflict_type calendar_conflict_type,
    severity conflict_severity,
    conflicting_event_id UUID,
    overlap_start TIMESTAMPTZ,
    overlap_end TIMESTAMPTZ,
    overlap_minutes INTEGER,
    message_en TEXT,
    affected_participants UUID[]
) AS $$
BEGIN
    -- Check venue conflicts
    RETURN QUERY
    SELECT
        'venue'::calendar_conflict_type,
        'high'::conflict_severity,
        ce.id,
        GREATEST(p_start_datetime, ce.start_datetime),
        LEAST(p_end_datetime, ce.end_datetime),
        EXTRACT(EPOCH FROM (LEAST(p_end_datetime, ce.end_datetime) - GREATEST(p_start_datetime, ce.start_datetime)))::INTEGER / 60,
        'Venue "' || COALESCE(ce.location_en, ce.room_en, 'Unknown') || '" is already booked',
        '{}'::UUID[]
    FROM calendar_events ce
    WHERE ce.id != COALESCE(p_event_id, '00000000-0000-0000-0000-000000000000')
        AND ce.status NOT IN ('cancelled', 'postponed')
        AND p_venue_en IS NOT NULL
        AND (ce.location_en = p_venue_en OR ce.room_en = p_venue_en)
        AND ce.start_datetime < p_end_datetime
        AND ce.end_datetime > p_start_datetime;

    -- Check participant conflicts
    RETURN QUERY
    SELECT
        'participant'::calendar_conflict_type,
        'medium'::conflict_severity,
        ce.id,
        GREATEST(p_start_datetime, ce.start_datetime),
        LEAST(p_end_datetime, ce.end_datetime),
        EXTRACT(EPOCH FROM (LEAST(p_end_datetime, ce.end_datetime) - GREATEST(p_start_datetime, ce.start_datetime)))::INTEGER / 60,
        'Participant has another event: ' || COALESCE(ce.title_en, ce.title_ar, 'Untitled'),
        ARRAY(
            SELECT ep.participant_id
            FROM event_participants ep
            WHERE ep.event_id = ce.id
                AND ep.participant_id = ANY(p_participant_ids)
        )
    FROM calendar_events ce
    INNER JOIN event_participants ep ON ep.event_id = ce.id
    WHERE ce.id != COALESCE(p_event_id, '00000000-0000-0000-0000-000000000000')
        AND ce.status NOT IN ('cancelled', 'postponed')
        AND ep.participant_id = ANY(p_participant_ids)
        AND ce.start_datetime < p_end_datetime
        AND ce.end_datetime > p_start_datetime
    GROUP BY ce.id;
END;
$$ LANGUAGE plpgsql;

-- Function to find available time slots
CREATE OR REPLACE FUNCTION find_available_slots(
    p_duration_minutes INTEGER,
    p_earliest_date TIMESTAMPTZ,
    p_latest_date TIMESTAMPTZ,
    p_participant_ids UUID[] DEFAULT '{}',
    p_venue_en TEXT DEFAULT NULL,
    p_preferred_hours INT[] DEFAULT ARRAY[9, 14]
)
RETURNS TABLE (
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    availability_score DECIMAL(3,2),
    has_conflicts BOOLEAN
) AS $$
DECLARE
    v_current_date DATE;
    v_check_time TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    v_current_date := p_earliest_date::DATE;

    WHILE v_current_date <= p_latest_date::DATE LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);

        -- Skip Friday and Saturday (Saudi weekend)
        IF v_day_of_week NOT IN (5, 6) THEN
            -- Check preferred hours
            FOREACH v_check_time IN ARRAY (
                SELECT ARRAY_AGG(v_current_date + (h || ' hours')::INTERVAL)
                FROM UNNEST(p_preferred_hours) AS h
            ) LOOP
                v_slot_end := v_check_time + (p_duration_minutes || ' minutes')::INTERVAL;

                -- Check if this slot has conflicts
                RETURN QUERY
                SELECT
                    v_check_time,
                    v_slot_end,
                    CASE
                        WHEN EXISTS (
                            SELECT 1 FROM check_event_conflicts(
                                NULL, v_check_time, v_slot_end, p_venue_en, p_participant_ids
                            )
                        ) THEN 0.3::DECIMAL(3,2)
                        ELSE 1.0::DECIMAL(3,2)
                    END,
                    EXISTS (
                        SELECT 1 FROM check_event_conflicts(
                            NULL, v_check_time, v_slot_end, p_venue_en, p_participant_ids
                        )
                    );
            END LOOP;
        END IF;

        v_current_date := v_current_date + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate event priority score
CREATE OR REPLACE FUNCTION calculate_event_priority(p_event_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2) := 0.5;
    v_event RECORD;
    v_participant_count INTEGER;
    v_vip_count INTEGER;
BEGIN
    SELECT * INTO v_event FROM calendar_events WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN 0.5;
    END IF;

    -- Higher priority for certain event types
    CASE v_event.event_type
        WHEN 'ceremony' THEN v_score := v_score + 0.3;
        WHEN 'plenary' THEN v_score := v_score + 0.25;
        WHEN 'main_event' THEN v_score := v_score + 0.2;
        ELSE v_score := v_score;
    END CASE;

    -- Factor in participant count and VIPs
    SELECT COUNT(*), COUNT(*) FILTER (WHERE role = 'vip')
    INTO v_participant_count, v_vip_count
    FROM event_participants
    WHERE event_id = p_event_id;

    IF v_participant_count > 20 THEN
        v_score := v_score + 0.15;
    ELSIF v_participant_count > 10 THEN
        v_score := v_score + 0.1;
    END IF;

    IF v_vip_count > 0 THEN
        v_score := v_score + (0.05 * LEAST(v_vip_count, 5));
    END IF;

    RETURN LEAST(v_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-detect conflicts on event creation/update
CREATE OR REPLACE FUNCTION detect_conflicts_on_event_change()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict RECORD;
    v_participant_ids UUID[];
BEGIN
    -- Get participant IDs for this event
    SELECT ARRAY_AGG(participant_id) INTO v_participant_ids
    FROM event_participants
    WHERE event_id = NEW.id;

    -- Delete old conflicts for this event
    DELETE FROM calendar_conflicts WHERE event_id = NEW.id;

    -- Insert new conflicts
    FOR v_conflict IN
        SELECT * FROM check_event_conflicts(
            NEW.id,
            NEW.start_datetime,
            NEW.end_datetime,
            COALESCE(NEW.location_en, NEW.room_en),
            COALESCE(v_participant_ids, '{}')
        )
    LOOP
        INSERT INTO calendar_conflicts (
            event_id,
            conflicting_event_id,
            conflict_type,
            severity,
            overlap_start,
            overlap_end,
            overlap_minutes,
            message_en,
            affected_participant_ids
        ) VALUES (
            NEW.id,
            v_conflict.conflicting_event_id,
            v_conflict.conflict_type,
            v_conflict.severity,
            v_conflict.overlap_start,
            v_conflict.overlap_end,
            v_conflict.overlap_minutes,
            v_conflict.message_en,
            v_conflict.affected_participants
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conflict detection
DROP TRIGGER IF EXISTS tr_detect_conflicts_on_event ON calendar_events;
CREATE TRIGGER tr_detect_conflicts_on_event
    AFTER INSERT OR UPDATE OF start_datetime, end_datetime, location_en, room_en, status
    ON calendar_events
    FOR EACH ROW
    WHEN (NEW.status NOT IN ('cancelled', 'postponed'))
    EXECUTE FUNCTION detect_conflicts_on_event_change();

-- Trigger to update updated_at timestamps
CREATE TRIGGER update_calendar_conflicts_updated_at
    BEFORE UPDATE ON calendar_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_what_if_scenarios_updated_at
    BEFORE UPDATE ON what_if_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participant_availability_updated_at
    BEFORE UPDATE ON participant_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_resources_updated_at
    BEFORE UPDATE ON venue_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE calendar_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescheduling_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_logistics ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Authenticated users can view conflicts"
    ON calendar_conflicts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view suggestions"
    ON rescheduling_suggestions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view their scenarios"
    ON what_if_scenarios FOR SELECT
    TO authenticated
    USING (created_by = auth.uid() OR true);

CREATE POLICY "Authenticated users can view availability"
    ON participant_availability FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view venues"
    ON venue_resources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view travel logistics"
    ON travel_logistics FOR SELECT
    TO authenticated
    USING (true);

-- Write policies
CREATE POLICY "Authenticated users can create scenarios"
    ON what_if_scenarios FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their scenarios"
    ON what_if_scenarios FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their scenarios"
    ON what_if_scenarios FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can manage conflicts"
    ON calendar_conflicts FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage suggestions"
    ON rescheduling_suggestions FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage availability"
    ON participant_availability FOR ALL
    TO authenticated
    USING (true);

-- Comments
COMMENT ON TABLE calendar_conflicts IS 'Stores detected scheduling conflicts between calendar events';
COMMENT ON TABLE rescheduling_suggestions IS 'AI-generated rescheduling suggestions for resolving conflicts';
COMMENT ON TABLE what_if_scenarios IS 'What-if scenario simulations for bulk rescheduling analysis';
COMMENT ON TABLE participant_availability IS 'Cached participant availability for conflict detection';
COMMENT ON TABLE venue_resources IS 'Venue and resource catalog for booking management';
COMMENT ON TABLE travel_logistics IS 'Travel time estimates between locations';

COMMENT ON FUNCTION check_event_conflicts IS 'Checks for scheduling conflicts for a given event time slot';
COMMENT ON FUNCTION find_available_slots IS 'Finds available time slots within a date range';
COMMENT ON FUNCTION calculate_event_priority IS 'Calculates priority score for an event based on type and participants';
