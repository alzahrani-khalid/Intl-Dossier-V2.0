-- ============================================================================
-- Migration: Correspondence Participants
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Track multi-party correspondence chains with roles
-- Covers: UC-001, UC-002, UC-007, UC-014, UC-029
-- ============================================================================

-- ============================================================================
-- PART 1: Add direction and action_category to intake_tickets
-- ============================================================================

-- Add correspondence direction field
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS direction TEXT
  CHECK (direction IN ('inbound', 'outbound', 'internal'));

-- Add action category field for classifying correspondence purpose
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS action_category TEXT
  CHECK (action_category IN (
    'information',        -- FYI only, no action required
    'action_required',    -- General action needed
    'response_required',  -- Reply expected
    'approval_required',  -- Needs formal approval
    'deadline_response',  -- Response by specific deadline
    'nomination',         -- Nomination request
    'event_booking',      -- Event/venue booking
    'internal_coordination' -- Internal team coordination
  ));

-- Add external deadline tracking
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS external_deadline TIMESTAMPTZ;
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS external_deadline_source TEXT;
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS deadline_type TEXT DEFAULT 'internal'
  CHECK (deadline_type IN ('internal', 'external', 'both'));

-- Add external references for document threading
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS external_references JSONB DEFAULT '[]';
-- Example: [
--   {"type": "telegram", "number": "160006", "date_hijri": "1447-06-06", "date_gregorian": "2025-12-03"},
--   {"type": "memo", "source": "UN-DESA", "reference": "DESA/2025/123"}
-- ]

COMMENT ON COLUMN intake_tickets.direction IS 'Correspondence direction: inbound (received), outbound (sent), internal (within organization)';
COMMENT ON COLUMN intake_tickets.action_category IS 'Type of action expected from this correspondence';
COMMENT ON COLUMN intake_tickets.external_deadline IS 'Deadline imposed by external party (different from internal SLA)';
COMMENT ON COLUMN intake_tickets.external_deadline_source IS 'Source document/entity that set the external deadline';
COMMENT ON COLUMN intake_tickets.deadline_type IS 'Whether deadline is internal SLA, external, or both';
COMMENT ON COLUMN intake_tickets.external_references IS 'JSON array of external document references (telegrams, memos, etc.)';

-- ============================================================================
-- PART 2: Create correspondence_participants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS correspondence_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correspondence_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN (
    'sender',     -- Original sender
    'recipient',  -- Primary recipient
    'cc',         -- Carbon copy
    'bcc',        -- Blind carbon copy
    'relay',      -- Forwarding entity
    'router',     -- Routing/distribution entity
    'action_owner', -- Entity responsible for action
    'stakeholder', -- Interested party
    'originator'  -- Original source (may be different from sender)
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'organization',
    'person',
    'department',
    'country'
  )),
  entity_id UUID NOT NULL,
  -- Role within the chain (for display)
  role_en TEXT,
  role_ar TEXT,
  -- Sequence in the correspondence chain (1 = first, 2 = second, etc.)
  sequence_order INTEGER DEFAULT 1,
  -- Optional metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure unique participant per correspondence
  CONSTRAINT unique_participant UNIQUE (correspondence_id, entity_type, entity_id, participant_type)
);

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

CREATE INDEX idx_correspondence_participants_correspondence
  ON correspondence_participants(correspondence_id);
CREATE INDEX idx_correspondence_participants_entity
  ON correspondence_participants(entity_type, entity_id);
CREATE INDEX idx_correspondence_participants_type
  ON correspondence_participants(participant_type);
CREATE INDEX idx_correspondence_participants_action_owner
  ON correspondence_participants(correspondence_id)
  WHERE participant_type = 'action_owner';

-- Indexes on intake_tickets new columns
CREATE INDEX idx_intake_tickets_direction
  ON intake_tickets(direction) WHERE direction IS NOT NULL;
CREATE INDEX idx_intake_tickets_action_category
  ON intake_tickets(action_category) WHERE action_category IS NOT NULL;
CREATE INDEX idx_intake_tickets_external_deadline
  ON intake_tickets(external_deadline) WHERE external_deadline IS NOT NULL;
CREATE INDEX idx_intake_tickets_external_refs
  ON intake_tickets USING GIN(external_references);

-- ============================================================================
-- PART 4: RLS Policies
-- ============================================================================

ALTER TABLE correspondence_participants ENABLE ROW LEVEL SECURITY;

-- View policy: Users can view participants of correspondences they can access
CREATE POLICY "Users can view correspondence participants"
  ON correspondence_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM intake_tickets t
      WHERE t.id = correspondence_participants.correspondence_id
    )
  );

-- Insert policy: Authenticated users can add participants
CREATE POLICY "Authenticated users can add participants"
  ON correspondence_participants FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update policy: Creator can update
CREATE POLICY "Creator can update participants"
  ON correspondence_participants FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Delete policy: Creator can delete
CREATE POLICY "Creator can delete participants"
  ON correspondence_participants FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 5: Helper Functions
-- ============================================================================

-- Function: Get correspondence chain for a ticket
CREATE OR REPLACE FUNCTION get_correspondence_chain(p_correspondence_id UUID)
RETURNS TABLE (
  participant_id UUID,
  participant_type TEXT,
  entity_type TEXT,
  entity_id UUID,
  entity_name_en TEXT,
  entity_name_ar TEXT,
  role_en TEXT,
  role_ar TEXT,
  sequence_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id as participant_id,
    cp.participant_type,
    cp.entity_type,
    cp.entity_id,
    CASE
      WHEN cp.entity_type = 'organization' THEN o.name_en
      WHEN cp.entity_type = 'person' THEN d.name_en
      WHEN cp.entity_type = 'country' THEN c.name_en
      ELSE NULL
    END as entity_name_en,
    CASE
      WHEN cp.entity_type = 'organization' THEN o.name_ar
      WHEN cp.entity_type = 'person' THEN d.name_ar
      WHEN cp.entity_type = 'country' THEN c.name_ar
      ELSE NULL
    END as entity_name_ar,
    cp.role_en,
    cp.role_ar,
    cp.sequence_order
  FROM correspondence_participants cp
  LEFT JOIN organizations o ON cp.entity_type = 'organization' AND cp.entity_id = o.id
  LEFT JOIN dossiers d ON cp.entity_type = 'person' AND cp.entity_id = d.id
  LEFT JOIN countries c ON cp.entity_type = 'country' AND cp.entity_id = c.id
  WHERE cp.correspondence_id = p_correspondence_id
  ORDER BY cp.sequence_order, cp.created_at;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Find all correspondences where an entity participated
CREATE OR REPLACE FUNCTION find_correspondences_by_participant(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_participant_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  correspondence_id UUID,
  ticket_number TEXT,
  title TEXT,
  participant_type TEXT,
  direction TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as correspondence_id,
    t.ticket_number,
    t.title,
    cp.participant_type,
    t.direction,
    t.created_at
  FROM correspondence_participants cp
  JOIN intake_tickets t ON t.id = cp.correspondence_id
  WHERE cp.entity_type = p_entity_type
    AND cp.entity_id = p_entity_id
    AND (p_participant_type IS NULL OR cp.participant_type = p_participant_type)
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 6: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON correspondence_participants TO authenticated;
GRANT EXECUTE ON FUNCTION get_correspondence_chain(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_correspondences_by_participant(TEXT, UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 7: Comments
-- ============================================================================

COMMENT ON TABLE correspondence_participants IS 'Tracks multi-party correspondence chains with roles (originator, relay, router, action_owner, etc.)';
COMMENT ON FUNCTION get_correspondence_chain(UUID) IS 'Get all participants in a correspondence chain ordered by sequence';
COMMENT ON FUNCTION find_correspondences_by_participant IS 'Find all correspondences where an entity participated with optional role filter';

-- ============================================================================
-- Migration Complete
-- ============================================================================
