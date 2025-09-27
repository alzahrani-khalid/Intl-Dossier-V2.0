-- 006_forums.sql: Forums table extending Events
-- Specialized event type for forums and conferences

CREATE TABLE IF NOT EXISTS public.forums (
    id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
    agenda_url TEXT,
    number_of_sessions INTEGER DEFAULT 1 CHECK (number_of_sessions > 0),
    keynote_speakers JSONB DEFAULT '[]'::JSONB,
    sponsors JSONB DEFAULT '[]'::JSONB,
    registration_fee DECIMAL(10,2) CHECK (registration_fee >= 0),
    currency CHAR(3) CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
    live_stream_url TEXT CHECK (live_stream_url IS NULL OR live_stream_url ~ '^https?://'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_forums_currency ON public.forums(currency);
CREATE INDEX idx_forums_fee ON public.forums(registration_fee);

-- JSON indexes for keynote speakers and sponsors
CREATE INDEX idx_forums_speakers ON public.forums USING gin(keynote_speakers);
CREATE INDEX idx_forums_sponsors ON public.forums USING gin(sponsors);

-- Create updated_at trigger
CREATE TRIGGER update_forums_updated_at
    BEFORE UPDATE ON public.forums
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Forum Sessions table
CREATE TABLE IF NOT EXISTS public.forum_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL CHECK (session_number > 0),
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    room_en TEXT,
    room_ar TEXT,
    moderator_name TEXT,
    speakers JSONB DEFAULT '[]'::JSONB,
    max_capacity INTEGER CHECK (max_capacity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure end is after start
    CONSTRAINT valid_session_times CHECK (end_time > start_time),
    -- Unique session number per forum
    UNIQUE(forum_id, session_number)
);

CREATE INDEX idx_forum_sessions_forum ON public.forum_sessions(forum_id);
CREATE INDEX idx_forum_sessions_times ON public.forum_sessions(start_time, end_time);

-- Create updated_at trigger for sessions
CREATE TRIGGER update_forum_sessions_updated_at
    BEFORE UPDATE ON public.forum_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate forum data consistency
CREATE OR REPLACE FUNCTION public.validate_forum_data()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    session_count INTEGER;
BEGIN
    -- Ensure the parent event is of type 'conference' or 'workshop'
    SELECT type INTO event_type
    FROM public.events
    WHERE id = NEW.id;

    IF event_type NOT IN ('conference', 'workshop') THEN
        RAISE EXCEPTION 'Forums can only be created for conference or workshop events';
    END IF;

    -- If registration fee is set, currency must also be set
    IF NEW.registration_fee IS NOT NULL AND NEW.registration_fee > 0 AND NEW.currency IS NULL THEN
        RAISE EXCEPTION 'Currency must be specified when registration fee is set';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_forum_trigger
    BEFORE INSERT OR UPDATE ON public.forums
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_forum_data();

-- Function to validate keynote speakers structure
CREATE OR REPLACE FUNCTION public.validate_keynote_speakers()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate keynote_speakers JSON structure
    IF NEW.keynote_speakers IS NOT NULL AND NEW.keynote_speakers != '[]'::JSONB THEN
        -- Each speaker should have name_en, name_ar, title_en, title_ar, and optionally bio_en, bio_ar
        IF NOT (NEW.keynote_speakers @> '[]'::JSONB) THEN
            RAISE EXCEPTION 'keynote_speakers must be an array';
        END IF;
    END IF;

    -- Validate sponsors JSON structure
    IF NEW.sponsors IS NOT NULL AND NEW.sponsors != '[]'::JSONB THEN
        -- Each sponsor should have name_en, name_ar, logo_url, and tier
        IF NOT (NEW.sponsors @> '[]'::JSONB) THEN
            RAISE EXCEPTION 'sponsors must be an array';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_forum_json_trigger
    BEFORE INSERT OR UPDATE OF keynote_speakers, sponsors ON public.forums
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_keynote_speakers();

-- View to get forum details with event information
CREATE OR REPLACE VIEW public.forum_details AS
SELECT
    f.*,
    e.title_en as event_title_en,
    e.title_ar as event_title_ar,
    e.start_datetime,
    e.end_datetime,
    e.venue_en,
    e.venue_ar,
    e.is_virtual,
    e.virtual_link,
    e.status,
    e.organizer_id,
    o.name_en as organizer_name_en,
    o.name_ar as organizer_name_ar,
    (SELECT COUNT(*) FROM public.forum_sessions fs WHERE fs.forum_id = f.id) as actual_sessions_count
FROM public.forums f
INNER JOIN public.events e ON f.id = e.id
INNER JOIN public.organizations o ON e.organizer_id = o.id;

-- Grant permissions
GRANT ALL ON public.forums TO authenticated;
GRANT ALL ON public.forum_sessions TO authenticated;
GRANT SELECT ON public.forum_details TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_sessions ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.forums IS 'Specialized event type for forums and conferences extending events table';
COMMENT ON COLUMN public.forums.keynote_speakers IS 'JSON array of keynote speaker objects with name, title, and bio';
COMMENT ON COLUMN public.forums.sponsors IS 'JSON array of sponsor organization objects with name, logo, and tier';
COMMENT ON COLUMN public.forums.registration_fee IS 'Registration fee amount in the specified currency';