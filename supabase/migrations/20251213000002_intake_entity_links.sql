-- Migration: Intake Entity Links
-- Feature: 033-ai-brief-generation
-- Task: T044
-- Description: Create table for approved links between intake tickets and entities

-- Create intake_entity_links table
CREATE TABLE IF NOT EXISTS intake_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  intake_ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
  entity_type linkable_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Provenance
  proposal_id UUID REFERENCES ai_entity_link_proposals(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique links per ticket
  UNIQUE (intake_ticket_id, entity_type, entity_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_intake_links_ticket ON intake_entity_links(intake_ticket_id);
CREATE INDEX IF NOT EXISTS idx_intake_links_entity ON intake_entity_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_intake_links_created_by ON intake_entity_links(created_by);
CREATE INDEX IF NOT EXISTS idx_intake_links_ai_suggested ON intake_entity_links(is_ai_suggested) WHERE is_ai_suggested = true;

-- Enable RLS
ALTER TABLE intake_entity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view links for tickets in their organization
CREATE POLICY "Users can view org intake links"
ON intake_entity_links FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM intake_tickets it
    JOIN organization_members om ON om.organization_id = it.organization_id
    WHERE it.id = intake_entity_links.intake_ticket_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Users can create links for tickets in their organization
CREATE POLICY "Users can create org intake links"
ON intake_entity_links FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM intake_tickets it
    JOIN organization_members om ON om.organization_id = it.organization_id
    WHERE it.id = intake_entity_links.intake_ticket_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Users can delete links they created or if they're admin
CREATE POLICY "Users can delete own intake links"
ON intake_entity_links FOR DELETE TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM intake_tickets it
    JOIN organization_members om ON om.organization_id = it.organization_id
    WHERE it.id = intake_entity_links.intake_ticket_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);

-- Function to get linked entities for a ticket
CREATE OR REPLACE FUNCTION get_intake_ticket_links(p_ticket_id UUID)
RETURNS TABLE (
  id UUID,
  entity_type linkable_entity_type,
  entity_id UUID,
  entity_name TEXT,
  is_ai_suggested BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    iel.id,
    iel.entity_type,
    iel.entity_id,
    CASE 
      WHEN iel.entity_type = 'dossier' THEN (SELECT COALESCE(d.name_en, d.name_ar) FROM dossiers d WHERE d.id = iel.entity_id)
      WHEN iel.entity_type = 'position' THEN (SELECT COALESCE(p.title_en, p.title_ar) FROM dossier_positions p WHERE p.id = iel.entity_id)
      WHEN iel.entity_type = 'person' THEN (SELECT COALESCE(pe.name_en, pe.name_ar) FROM persons pe WHERE pe.id = iel.entity_id)
      WHEN iel.entity_type = 'engagement' THEN (SELECT COALESCE(e.name_en, e.name_ar) FROM engagements e WHERE e.id = iel.entity_id)
      WHEN iel.entity_type = 'commitment' THEN (SELECT COALESCE(c.description_en, c.description_ar) FROM commitments c WHERE c.id = iel.entity_id)
      ELSE 'Unknown'
    END AS entity_name,
    iel.is_ai_suggested,
    iel.created_at
  FROM intake_entity_links iel
  WHERE iel.intake_ticket_id = p_ticket_id
  ORDER BY iel.created_at DESC;
END;
$$;

-- Add comment
COMMENT ON TABLE intake_entity_links IS 'Approved links between intake tickets and entities (manually created or from approved AI proposals)';
