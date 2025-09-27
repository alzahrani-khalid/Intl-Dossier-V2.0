-- Migration: Create events table
-- Description: Scheduled activity with conflict detection and calendar integration
-- Date: 2025-01-27

-- Create event type enum
CREATE TYPE event_type AS ENUM ('meeting', 'conference', 'workshop', 'other');

-- Create event status enum
CREATE TYPE event_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    event_type event_type NOT NULL,
    status event_status NOT NULL DEFAULT 'scheduled',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_events_title ON events(title) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_start_time ON events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_end_time ON events(end_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_event_type ON events(event_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_created_by ON events(created_by) WHERE deleted_at IS NULL;
-- Composite index for conflict detection
CREATE INDEX idx_events_time_range ON events(start_time, end_time) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE events 
ADD CONSTRAINT check_time_valid 
CHECK (end_time > start_time);

ALTER TABLE events 
ADD CONSTRAINT check_recurrence_pattern_required 
CHECK (
    (is_recurring = false) OR 
    (is_recurring = true AND recurrence_pattern IS NOT NULL)
);

-- Create function for conflict detection
CREATE OR REPLACE FUNCTION check_event_conflicts(
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflicting_event_id UUID,
    conflicting_event_title VARCHAR(255),
    conflicting_start_time TIMESTAMP WITH TIME ZONE,
    conflicting_end_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        title,
        start_time,
        end_time
    FROM events
    WHERE 
        deleted_at IS NULL
        AND status NOT IN ('cancelled', 'completed')
        AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id)
        AND (
            (start_time <= p_start_time AND end_time > p_start_time) OR
            (start_time < p_end_time AND end_time >= p_end_time) OR
            (start_time >= p_start_time AND end_time <= p_end_time)
        );
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE
    ON events FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE events IS 'Scheduled activities with conflict detection and calendar integration';
COMMENT ON COLUMN events.id IS 'Unique event identifier';
COMMENT ON COLUMN events.title IS 'Event title';
COMMENT ON COLUMN events.description IS 'Event description';
COMMENT ON COLUMN events.start_time IS 'Event start time';
COMMENT ON COLUMN events.end_time IS 'Event end time';
COMMENT ON COLUMN events.location IS 'Event location';
COMMENT ON COLUMN events.event_type IS 'Type of event';
COMMENT ON COLUMN events.status IS 'Event status';
COMMENT ON COLUMN events.is_recurring IS 'Whether event recurs';
COMMENT ON COLUMN events.recurrence_pattern IS 'Pattern for recurring events';
COMMENT ON COLUMN events.created_by IS 'User who created the event';
COMMENT ON COLUMN events.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN events.deleted_by IS 'User who performed soft delete';