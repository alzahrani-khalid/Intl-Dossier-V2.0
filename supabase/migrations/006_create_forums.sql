-- Migration: Create forums table
-- Description: Specialized event type with sessions and speakers
-- Date: 2025-01-27

-- Create forum type enum
CREATE TYPE forum_type AS ENUM ('conference', 'seminar', 'workshop', 'summit');

-- Create forums table
CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    forum_type forum_type NOT NULL,
    agenda JSONB,
    speakers JSONB,
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_forums_event_id ON forums(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_forums_forum_type ON forums(forum_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_forums_registration_deadline ON forums(registration_deadline) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE forums 
ADD CONSTRAINT check_capacity_positive 
CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE forums 
ADD CONSTRAINT check_registration_deadline_valid 
CHECK (registration_deadline IS NULL OR registration_required = true);

ALTER TABLE forums 
ADD CONSTRAINT check_agenda_format 
CHECK (agenda IS NULL OR jsonb_typeof(agenda) = 'object');

ALTER TABLE forums 
ADD CONSTRAINT check_speakers_format 
CHECK (speakers IS NULL OR jsonb_typeof(speakers) = 'array');

-- Create trigger for updated_at
CREATE TRIGGER update_forums_updated_at BEFORE UPDATE
    ON forums FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE forums IS 'Specialized event types with sessions and speakers';
COMMENT ON COLUMN forums.id IS 'Unique forum identifier';
COMMENT ON COLUMN forums.event_id IS 'Associated event';
COMMENT ON COLUMN forums.forum_type IS 'Type of forum';
COMMENT ON COLUMN forums.agenda IS 'Event agenda structure in JSON';
COMMENT ON COLUMN forums.speakers IS 'Speaker information in JSON array';
COMMENT ON COLUMN forums.capacity IS 'Maximum number of attendees';
COMMENT ON COLUMN forums.registration_required IS 'Whether registration is required';
COMMENT ON COLUMN forums.registration_deadline IS 'Deadline for registration';
COMMENT ON COLUMN forums.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN forums.deleted_by IS 'User who performed soft delete';