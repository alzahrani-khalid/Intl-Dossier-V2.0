-- Migration: AI Entity Link Proposals
-- Feature: 033-ai-brief-generation
-- Task: T043
-- Description: Create table for AI-suggested links for intake tickets

-- Create ai_entity_link_proposals table
CREATE TABLE IF NOT EXISTS ai_entity_link_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Source
  intake_ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
  run_id UUID REFERENCES ai_runs(id) ON DELETE SET NULL,
  
  -- Proposed link
  entity_type linkable_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  
  -- AI reasoning
  confidence_score DECIMAL(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  justification TEXT NOT NULL,
  
  -- Approval workflow
  status link_proposal_status NOT NULL DEFAULT 'pending_approval',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_link_proposals_ticket ON ai_entity_link_proposals(intake_ticket_id, status);
CREATE INDEX IF NOT EXISTS idx_link_proposals_status ON ai_entity_link_proposals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_proposals_org ON ai_entity_link_proposals(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_proposals_entity ON ai_entity_link_proposals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_link_proposals_expires ON ai_entity_link_proposals(expires_at) WHERE status = 'pending_approval';

-- Enable RLS
ALTER TABLE ai_entity_link_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view proposals for their organization
CREATE POLICY "Users can view org link proposals"
ON ai_entity_link_proposals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_entity_link_proposals.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Service role can insert proposals
CREATE POLICY "Service role can insert link proposals"
ON ai_entity_link_proposals FOR INSERT TO service_role
WITH CHECK (true);

-- Authenticated users can update proposals (for approval/rejection)
CREATE POLICY "Users can update org link proposals"
ON ai_entity_link_proposals FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_entity_link_proposals.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_entity_link_proposals.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Function to expire old proposals
CREATE OR REPLACE FUNCTION expire_old_link_proposals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE ai_entity_link_proposals
  SET status = 'expired'
  WHERE status = 'pending_approval'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Add comment
COMMENT ON TABLE ai_entity_link_proposals IS 'AI-suggested links between intake tickets and entities (dossiers, positions, etc.)';
