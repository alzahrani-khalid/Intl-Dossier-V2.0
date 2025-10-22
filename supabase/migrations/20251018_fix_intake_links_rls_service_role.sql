-- Fix RLS policies to allow service_role to bypass for Edge Functions
-- Feature: 024-intake-entity-linking
-- Issue: Edge Functions using SERVICE_ROLE_KEY cannot insert into intake_entity_links

-- Add service role policy for intake_entity_links
CREATE POLICY intake_entity_links_service ON intake_entity_links
FOR ALL USING (
  auth.role() = 'service_role'
);

-- Add service role policy for link_audit_logs (for audit trail)
CREATE POLICY link_audit_logs_service ON link_audit_logs
FOR ALL USING (
  auth.role() = 'service_role'
);

COMMENT ON POLICY intake_entity_links_service ON intake_entity_links IS 'Allow service role full access for Edge Functions';
COMMENT ON POLICY link_audit_logs_service ON link_audit_logs IS 'Allow service role to create audit logs for Edge Functions';
