-- Migration: Schema Alignment (countries + events)
-- Created: 2025-09-26

BEGIN;

-- =============================
-- Country enhancements
-- =============================

-- Relationship status enum (aligned with CountryService)
DO $$ BEGIN
  CREATE TYPE relationship_status AS ENUM ('excellent','good','developing','challenging','none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE countries
  ADD COLUMN IF NOT EXISTS is_gcc BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_arab_league BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_islamic_org BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS strategic_importance INTEGER DEFAULT 0 CHECK (strategic_importance >= 0 AND strategic_importance <= 100),
  ADD COLUMN IF NOT EXISTS relationship_status relationship_status DEFAULT 'developing';

CREATE INDEX IF NOT EXISTS idx_countries_relationship_status ON countries(relationship_status);
CREATE INDEX IF NOT EXISTS idx_countries_strategic_importance ON countries(strategic_importance);

-- =============================
-- Events + attendees
-- =============================

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('meeting','conference','workshop','ceremony','visit','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE visibility_level AS ENUM ('public','internal','restricted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendee_type AS ENUM ('country','organization','contact');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendee_role AS ENUM ('host','participant','observer','speaker');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(300) NOT NULL,
  description text,
  type event_type NOT NULL DEFAULT 'meeting',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  location varchar(300) NOT NULL,
  virtual_link text,
  tags text[] DEFAULT ARRAY[]::text[],
  documents uuid[] DEFAULT ARRAY[]::uuid[],
  visibility visibility_level NOT NULL DEFAULT 'internal',
  -- Optional denormalized attendee ids for quick filtering in API conflicts route
  attendees uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

CREATE TABLE IF NOT EXISTS attendees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type attendee_type NOT NULL,
  entity_id uuid NOT NULL,
  role attendee_role NOT NULL DEFAULT 'participant',
  confirmed boolean NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_entity ON attendees(entity_id);

COMMIT;

