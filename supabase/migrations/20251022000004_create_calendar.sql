-- Migration: Create Calendar Events and Participants Tables
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Separate temporal events from entity identity

DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;

-- Calendar Events Table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('main_event', 'session', 'plenary', 'working_session', 'ceremony', 'reception')),
  title_en TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN NOT NULL DEFAULT false,
  virtual_link TEXT,
  room_en TEXT,
  room_ar TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled', 'postponed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Event Participants Table
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'external_contact', 'person_dossier')),
  participant_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'speaker', 'moderator', 'panelist', 'attendee', 'observer', 'vip', 'support_staff')),
  attendance_status TEXT NOT NULL DEFAULT 'invited' CHECK (attendance_status IN ('invited', 'confirmed', 'declined', 'tentative', 'attended', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE calendar_events IS 'Temporal instances representing when dossiers occur in time';
COMMENT ON TABLE event_participants IS 'Polymorphic participant linking for calendar events';

-- Apply updated_at trigger to calendar_events
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
