-- 005_events.sql: Events table with conflict detection
-- Represents scheduled activities with comprehensive conflict detection capabilities

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title_en TEXT NOT NULL CHECK (LENGTH(title_en) > 0),
    title_ar TEXT NOT NULL CHECK (LENGTH(title_ar) > 0),
    description_en TEXT,
    description_ar TEXT,
    type TEXT NOT NULL CHECK (type IN ('meeting', 'conference', 'workshop', 'training', 'ceremony', 'other')),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    location_en TEXT,
    location_ar TEXT,
    venue_en TEXT,
    venue_ar TEXT,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT CHECK (virtual_link IS NULL OR virtual_link ~ '^https?://'),
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    organizer_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    max_participants INTEGER CHECK (max_participants > 0),
    registration_required BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure end is after start
    CONSTRAINT valid_event_times CHECK (end_datetime > start_datetime),
    -- Ensure registration deadline is before event start
    CONSTRAINT valid_registration_deadline CHECK (
        registration_deadline IS NULL OR
        registration_deadline < start_datetime
    ),
    -- Ensure virtual events have virtual link
    CONSTRAINT virtual_event_has_link CHECK (
        (is_virtual = false) OR
        (is_virtual = true AND virtual_link IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX idx_events_datetime ON public.events(start_datetime, end_datetime);
CREATE INDEX idx_events_venue ON public.events(venue_en, venue_ar);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_country ON public.events(country_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_created_by ON public.events(created_by);

-- Index for conflict detection queries
CREATE INDEX idx_events_conflict_detection ON public.events(venue_en, venue_ar, start_datetime, end_datetime)
    WHERE status IN ('scheduled', 'ongoing');

-- Full-text search indexes
CREATE INDEX idx_events_search_en ON public.events USING gin(to_tsvector('english',
    title_en || ' ' || COALESCE(description_en, '') || ' ' || COALESCE(venue_en, '')));
CREATE INDEX idx_events_search_ar ON public.events USING gin(to_tsvector('arabic',
    title_ar || ' ' || COALESCE(description_ar, '') || ' ' || COALESCE(venue_ar, '')));

-- Create updated_at trigger
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Event Participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    participant_name TEXT,
    participant_email TEXT,
    registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'confirmed', 'attended', 'cancelled')),
    registration_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    attendance_confirmed BOOLEAN DEFAULT false,
    -- Either user_id or external participant info must be provided
    CONSTRAINT participant_info_required CHECK (
        user_id IS NOT NULL OR
        (participant_name IS NOT NULL AND participant_email IS NOT NULL)
    )
);

CREATE INDEX idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user ON public.event_participants(user_id);
CREATE INDEX idx_event_participants_org ON public.event_participants(organization_id);

-- Event Documents table
CREATE TABLE IF NOT EXISTS public.event_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('agenda', 'minutes', 'presentation', 'report', 'other')),
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_event_documents_event ON public.event_documents(event_id);

-- Function to detect event conflicts
CREATE OR REPLACE FUNCTION public.detect_event_conflicts(
    p_venue_en TEXT,
    p_venue_ar TEXT,
    p_start_datetime TIMESTAMPTZ,
    p_end_datetime TIMESTAMPTZ,
    p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE(
    conflicting_event_id UUID,
    title_en TEXT,
    title_ar TEXT,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    conflict_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as conflicting_event_id,
        e.title_en,
        e.title_ar,
        e.start_datetime,
        e.end_datetime,
        CASE
            WHEN (e.venue_en = p_venue_en OR e.venue_ar = p_venue_ar) THEN 'venue_conflict'
            ELSE 'time_overlap'
        END as conflict_type
    FROM public.events e
    WHERE
        e.status IN ('scheduled', 'ongoing') AND
        (e.id IS DISTINCT FROM p_exclude_event_id) AND
        (
            -- Venue conflict: same venue, overlapping times
            ((e.venue_en = p_venue_en OR e.venue_ar = p_venue_ar) AND
             e.venue_en IS NOT NULL AND
             (e.start_datetime, e.end_datetime) OVERLAPS (p_start_datetime, p_end_datetime))
        );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check participant availability
CREATE OR REPLACE FUNCTION public.check_participant_availability(
    p_user_id UUID,
    p_start_datetime TIMESTAMPTZ,
    p_end_datetime TIMESTAMPTZ,
    p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE(
    conflicting_event_id UUID,
    title_en TEXT,
    title_ar TEXT,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as conflicting_event_id,
        e.title_en,
        e.title_ar,
        e.start_datetime,
        e.end_datetime
    FROM public.events e
    INNER JOIN public.event_participants ep ON e.id = ep.event_id
    WHERE
        ep.user_id = p_user_id AND
        ep.registration_status IN ('registered', 'confirmed') AND
        e.status IN ('scheduled', 'ongoing') AND
        (e.id IS DISTINCT FROM p_exclude_event_id) AND
        (e.start_datetime, e.end_datetime) OVERLAPS (p_start_datetime, p_end_datetime);
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to validate event conflicts before insert/update
CREATE OR REPLACE FUNCTION public.validate_event_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for venue conflicts
    SELECT COUNT(*)
    INTO conflict_count
    FROM public.detect_event_conflicts(
        NEW.venue_en,
        NEW.venue_ar,
        NEW.start_datetime,
        NEW.end_datetime,
        NEW.id
    );

    IF conflict_count > 0 THEN
        RAISE WARNING 'Event has % venue conflicts', conflict_count;
    END IF;

    -- Update status to ongoing if event is currently happening
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime > NOW() AND NEW.status = 'scheduled' THEN
        NEW.status := 'ongoing';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_event_conflicts
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    WHEN (NEW.status IN ('scheduled', 'ongoing'))
    EXECUTE FUNCTION public.validate_event_conflicts();

-- Grant permissions
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.event_participants TO authenticated;
GRANT ALL ON public.event_documents TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.events IS 'Scheduled activities with conflict detection capabilities';
COMMENT ON COLUMN public.events.is_virtual IS 'Whether the event is virtual (online)';
COMMENT ON FUNCTION public.detect_event_conflicts IS 'Detects scheduling conflicts for venues and times';