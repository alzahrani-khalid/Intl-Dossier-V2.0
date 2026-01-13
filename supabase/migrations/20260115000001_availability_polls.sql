-- Migration: Create Availability Polls Tables
-- Feature: participant-availability-polling
-- Date: 2026-01-15
-- Description: Doodle-style availability polling for finding optimal meeting times

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Poll status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poll_status') THEN
    CREATE TYPE poll_status AS ENUM ('draft', 'active', 'closed', 'scheduled', 'cancelled');
  END IF;
END $$;

-- Voting rule enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voting_rule') THEN
    CREATE TYPE voting_rule AS ENUM ('simple_majority', 'consensus', 'unanimous', 'organizer_decides');
  END IF;
END $$;

-- Poll response enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poll_response_type') THEN
    CREATE TYPE poll_response_type AS ENUM ('available', 'unavailable', 'maybe');
  END IF;
END $$;

-- =============================================================================
-- MAIN TABLES
-- =============================================================================

-- Availability Polls Table
CREATE TABLE IF NOT EXISTS availability_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Meeting info (bilingual)
  meeting_title_en TEXT NOT NULL,
  meeting_title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Poll settings
  deadline TIMESTAMPTZ NOT NULL,
  status poll_status NOT NULL DEFAULT 'draft',
  min_participants_required INTEGER DEFAULT 1 CHECK (min_participants_required >= 1),
  voting_rule voting_rule NOT NULL DEFAULT 'simple_majority',

  -- Duration settings
  meeting_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (meeting_duration_minutes > 0),

  -- Location options (bilingual)
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,

  -- Result tracking
  selected_slot_id UUID,
  scheduled_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  -- Organizer notes (internal)
  organizer_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE availability_polls IS 'Doodle-style availability polls for finding optimal meeting times';

-- Poll Time Slots Table
CREATE TABLE IF NOT EXISTS poll_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,

  -- Time range
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',

  -- Venue suggestion (optional, bilingual)
  venue_suggestion_en TEXT,
  venue_suggestion_ar TEXT,

  -- Organizer preference (0-1 scale, higher = more preferred)
  organizer_preference_score DECIMAL(3,2) DEFAULT 0.5 CHECK (organizer_preference_score >= 0 AND organizer_preference_score <= 1),

  -- Display order
  position INTEGER NOT NULL DEFAULT 0,

  -- Computed fields (will be updated by trigger/function)
  available_count INTEGER DEFAULT 0,
  unavailable_count INTEGER DEFAULT 0,
  maybe_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_slot_range CHECK (slot_end > slot_start)
);

COMMENT ON TABLE poll_slots IS 'Proposed time slots for availability polls';

-- Poll Participants Table (who should vote)
CREATE TABLE IF NOT EXISTS poll_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,

  -- Polymorphic participant reference (like event_participants)
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'external_contact', 'person_dossier')),
  participant_id UUID NOT NULL,

  -- Participant display name (for external contacts)
  display_name_en TEXT,
  display_name_ar TEXT,
  email TEXT,

  -- Invitation tracking
  is_required BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT now(),
  reminder_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_participant_per_poll UNIQUE (poll_id, participant_type, participant_id)
);

COMMENT ON TABLE poll_participants IS 'Invited participants for availability polls';

-- Poll Responses Table (votes)
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES poll_slots(id) ON DELETE CASCADE,

  -- Voter info
  participant_id UUID REFERENCES poll_participants(id) ON DELETE CASCADE,
  respondent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Response
  response poll_response_type NOT NULL,
  notes TEXT,

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE poll_responses IS 'Participant votes for poll time slots';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Polls indexes
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON availability_polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_status ON availability_polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_deadline ON availability_polls(deadline);
CREATE INDEX IF NOT EXISTS idx_polls_dossier_id ON availability_polls(dossier_id);

-- Slots indexes
CREATE INDEX IF NOT EXISTS idx_slots_poll_id ON poll_slots(poll_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_time ON poll_slots(slot_start);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_poll_participants_poll_id ON poll_participants(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_participants_user ON poll_participants(participant_type, participant_id);

-- Responses indexes
CREATE INDEX IF NOT EXISTS idx_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_responses_slot_id ON poll_responses(slot_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant ON poll_responses(participant_id);

-- Unique index for one response per slot per respondent (using COALESCE in expression)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_response_per_slot
  ON poll_responses(slot_id, COALESCE(participant_id, respondent_user_id));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for polls
CREATE TRIGGER update_availability_polls_updated_at
  BEFORE UPDATE ON availability_polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for responses
CREATE TRIGGER update_poll_responses_updated_at
  BEFORE UPDATE ON poll_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update slot response counts
CREATE OR REPLACE FUNCTION update_slot_response_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for the affected slot
  IF TG_OP = 'DELETE' THEN
    UPDATE poll_slots SET
      available_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = OLD.slot_id AND response = 'available'),
      unavailable_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = OLD.slot_id AND response = 'unavailable'),
      maybe_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = OLD.slot_id AND response = 'maybe')
    WHERE id = OLD.slot_id;
    RETURN OLD;
  ELSE
    UPDATE poll_slots SET
      available_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = NEW.slot_id AND response = 'available'),
      unavailable_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = NEW.slot_id AND response = 'unavailable'),
      maybe_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = NEW.slot_id AND response = 'maybe')
    WHERE id = NEW.slot_id;

    -- Also update old slot if this is an update with slot change
    IF TG_OP = 'UPDATE' AND OLD.slot_id IS DISTINCT FROM NEW.slot_id THEN
      UPDATE poll_slots SET
        available_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = OLD.slot_id AND response = 'available'),
        unavailable_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = OLD.slot_id AND response = 'unavailable'),
        maybe_count = (SELECT COUNT(*) FROM poll_responses WHERE slot_id = OLD.slot_id AND response = 'maybe')
      WHERE id = OLD.slot_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update counts on response changes
CREATE TRIGGER trigger_update_slot_counts
  AFTER INSERT OR UPDATE OR DELETE ON poll_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_response_counts();

-- Function to get optimal slot(s) for a poll
CREATE OR REPLACE FUNCTION get_optimal_poll_slots(
  p_poll_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  slot_id UUID,
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  venue_suggestion_en TEXT,
  venue_suggestion_ar TEXT,
  available_count INTEGER,
  unavailable_count INTEGER,
  maybe_count INTEGER,
  organizer_preference_score DECIMAL(3,2),
  total_score DECIMAL(5,2),
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH poll_info AS (
    SELECT
      ap.voting_rule,
      (SELECT COUNT(*)::INTEGER FROM poll_participants WHERE poll_id = p_poll_id) as total_participants
    FROM availability_polls ap
    WHERE ap.id = p_poll_id
  ),
  scored_slots AS (
    SELECT
      ps.id as slot_id,
      ps.slot_start,
      ps.slot_end,
      ps.venue_suggestion_en,
      ps.venue_suggestion_ar,
      ps.available_count,
      ps.unavailable_count,
      ps.maybe_count,
      ps.organizer_preference_score,
      -- Calculate score: available = 1, maybe = 0.5, unavailable = 0
      -- Plus organizer preference weight (20%)
      (
        (ps.available_count::DECIMAL + (ps.maybe_count::DECIMAL * 0.5)) /
        GREATEST(NULLIF(pi.total_participants, 0)::DECIMAL, 1) * 0.8
      ) + (ps.organizer_preference_score * 0.2) as total_score
    FROM poll_slots ps
    CROSS JOIN poll_info pi
    WHERE ps.poll_id = p_poll_id
  )
  SELECT
    ss.slot_id,
    ss.slot_start,
    ss.slot_end,
    ss.venue_suggestion_en,
    ss.venue_suggestion_ar,
    ss.available_count,
    ss.unavailable_count,
    ss.maybe_count,
    ss.organizer_preference_score,
    ss.total_score,
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC, ss.available_count DESC, ss.slot_start ASC)::INTEGER as rank
  FROM scored_slots ss
  ORDER BY total_score DESC, available_count DESC, slot_start ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if poll can be closed (enough responses)
CREATE OR REPLACE FUNCTION check_poll_completion(p_poll_id UUID)
RETURNS TABLE (
  can_close BOOLEAN,
  total_participants INTEGER,
  responded_participants INTEGER,
  required_participants INTEGER,
  response_rate DECIMAL(5,2)
) AS $$
DECLARE
  v_total INTEGER;
  v_responded INTEGER;
  v_required INTEGER;
BEGIN
  -- Get participant counts
  SELECT COUNT(*) INTO v_total FROM poll_participants WHERE poll_id = p_poll_id;

  -- Get unique respondents
  SELECT COUNT(DISTINCT COALESCE(participant_id::TEXT, respondent_user_id::TEXT)) INTO v_responded
  FROM poll_responses WHERE poll_id = p_poll_id;

  -- Get required count
  SELECT COALESCE(min_participants_required, 1) INTO v_required
  FROM availability_polls WHERE id = p_poll_id;

  RETURN QUERY SELECT
    v_responded >= v_required as can_close,
    v_total as total_participants,
    v_responded as responded_participants,
    v_required as required_participants,
    CASE WHEN v_total > 0 THEN (v_responded::DECIMAL / v_total * 100) ELSE 0 END as response_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE availability_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can view polls they created or are invited to" ON availability_polls
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM poll_participants
      WHERE poll_id = id AND participant_type = 'user' AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can create polls" ON availability_polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their polls" ON availability_polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their polls" ON availability_polls
  FOR DELETE USING (auth.uid() = created_by);

-- Slots policies
CREATE POLICY "Users can view slots for polls they can see" ON poll_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM availability_polls ap
      WHERE ap.id = poll_id AND (
        ap.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM poll_participants pp
          WHERE pp.poll_id = ap.id AND pp.participant_type = 'user' AND pp.participant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Poll creators can manage slots" ON poll_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM availability_polls WHERE id = poll_id AND created_by = auth.uid()
    )
  );

-- Participants policies
CREATE POLICY "Users can view participants for polls they can see" ON poll_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM availability_polls ap
      WHERE ap.id = poll_id AND (
        ap.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM poll_participants pp
          WHERE pp.poll_id = ap.id AND pp.participant_type = 'user' AND pp.participant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Poll creators can manage participants" ON poll_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM availability_polls WHERE id = poll_id AND created_by = auth.uid()
    )
  );

-- Responses policies
CREATE POLICY "Users can view responses for polls they can see" ON poll_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM availability_polls ap
      WHERE ap.id = poll_id AND (
        ap.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM poll_participants pp
          WHERE pp.poll_id = ap.id AND pp.participant_type = 'user' AND pp.participant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can submit their own responses" ON poll_responses
  FOR INSERT WITH CHECK (
    -- Poll must be active
    EXISTS (
      SELECT 1 FROM availability_polls WHERE id = poll_id AND status = 'active'
    ) AND (
      -- User must be the respondent
      respondent_user_id = auth.uid() OR
      -- Or linked to a participant entry
      EXISTS (
        SELECT 1 FROM poll_participants pp
        WHERE pp.id = participant_id AND pp.participant_type = 'user' AND pp.participant_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own responses" ON poll_responses
  FOR UPDATE USING (
    respondent_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM poll_participants pp
      WHERE pp.id = participant_id AND pp.participant_type = 'user' AND pp.participant_id = auth.uid()
    )
  );

-- =============================================================================
-- FOREIGN KEY FOR SELECTED SLOT
-- =============================================================================

-- Add foreign key constraint for selected_slot_id after tables exist
ALTER TABLE availability_polls
  ADD CONSTRAINT fk_selected_slot
  FOREIGN KEY (selected_slot_id)
  REFERENCES poll_slots(id)
  ON DELETE SET NULL;
