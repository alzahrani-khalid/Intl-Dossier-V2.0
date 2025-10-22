-- Migration: Add RLS policies for intake entity linking system
-- Feature: 024-intake-entity-linking
-- Task: T014

-- Enable RLS on all tables
ALTER TABLE intake_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_link_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_embeddings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies for intake_entity_links
-- ========================================

-- Users can only see links for intakes in their organization
CREATE POLICY intake_entity_links_select ON intake_entity_links
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can create links if they have access to the intake
CREATE POLICY intake_entity_links_insert ON intake_entity_links
FOR INSERT WITH CHECK (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can update/delete links they created or if they have steward+ role
CREATE POLICY intake_entity_links_update ON intake_entity_links
FOR UPDATE USING (
  linked_by = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND global_role IN ('steward', 'admin')
  )
);

-- ========================================
-- RLS Policies for link_audit_logs
-- ========================================

-- Users can only view audit logs for intakes in their organization
CREATE POLICY link_audit_logs_select ON link_audit_logs
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- No UPDATE or DELETE policies (immutable table)
-- INSERT is handled by trigger (SECURITY DEFINER)

-- ========================================
-- RLS Policies for ai_link_suggestions
-- ========================================

-- Users can only view suggestions for intakes in their organization
CREATE POLICY ai_link_suggestions_select ON ai_link_suggestions
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can create suggestions if they have access to the intake
CREATE POLICY ai_link_suggestions_insert ON ai_link_suggestions
FOR INSERT WITH CHECK (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can update suggestions they created or reviewed
CREATE POLICY ai_link_suggestions_update ON ai_link_suggestions
FOR UPDATE USING (
  reviewed_by = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM intake_tickets it
    WHERE it.id = ai_link_suggestions.intake_id
    AND it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ========================================
-- RLS Policies for intake_embeddings
-- ========================================

-- Users can only view embeddings for intakes in their organization
CREATE POLICY intake_embeddings_select ON intake_embeddings
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Service role can insert/update embeddings
CREATE POLICY intake_embeddings_service ON intake_embeddings
FOR ALL USING (
  auth.role() = 'service_role'
);

-- ========================================
-- RLS Policies for entity_embeddings
-- ========================================

-- Users can view embeddings for entities in their organization
CREATE POLICY entity_embeddings_select ON entity_embeddings
FOR SELECT USING (
  (metadata->>'org_id')::UUID IN (
    SELECT org_id
    FROM org_members
    WHERE user_id = auth.uid()
  )
);

-- Service role can insert/update embeddings
CREATE POLICY entity_embeddings_service ON entity_embeddings
FOR ALL USING (
  auth.role() = 'service_role'
);

-- Add comments
COMMENT ON POLICY intake_entity_links_select ON intake_entity_links IS 'Users can only see links for intakes in their organization';
COMMENT ON POLICY link_audit_logs_select ON link_audit_logs IS 'Users can only view audit logs for intakes in their organization';
COMMENT ON POLICY ai_link_suggestions_select ON ai_link_suggestions IS 'Users can only view suggestions for intakes in their organization';
