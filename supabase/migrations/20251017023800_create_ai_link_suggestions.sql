-- Migration: Create ai_link_suggestions table
-- Feature: 024-intake-entity-linking
-- Task: T010

CREATE TABLE IF NOT EXISTS ai_link_suggestions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,

  -- Suggested link
  suggested_entity_type TEXT NOT NULL CHECK (suggested_entity_type IN (
    'dossier', 'position', 'mou', 'engagement', 'assignment',
    'commitment', 'intelligence_signal', 'organization',
    'country', 'forum', 'working_group', 'topic'
  )),
  suggested_entity_id UUID NOT NULL,
  suggested_link_type TEXT NOT NULL CHECK (suggested_link_type IN ('primary', 'related', 'requested', 'mentioned', 'assigned_to')),

  -- AI metadata
  confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0.00 AND confidence <= 1.00),
  reasoning TEXT NOT NULL, -- LLM-generated explanation

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ, -- When user accepted/rejected
  reviewed_by UUID REFERENCES profiles(id) -- User who reviewed
);

-- Add comments
COMMENT ON TABLE ai_link_suggestions IS 'Temporary storage for AI-generated link suggestions before user acceptance/rejection (30-day retention for accepted/rejected)';
COMMENT ON COLUMN ai_link_suggestions.reasoning IS 'LLM-generated explanation for the suggested link';
COMMENT ON COLUMN ai_link_suggestions.status IS 'pending (not reviewed) | accepted (user accepted) | rejected (user rejected)';
