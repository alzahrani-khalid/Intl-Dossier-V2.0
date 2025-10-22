-- Fix RLS policies to include WITH CHECK for INSERT operations
-- Feature: 024-intake-entity-linking
-- Issue: RLS USING clause doesn't apply to INSERT, need WITH CHECK

-- Drop existing service role policies
DROP POLICY IF EXISTS intake_entity_links_service ON intake_entity_links;
DROP POLICY IF EXISTS link_audit_logs_service ON link_audit_logs;

-- Recreate with both USING and WITH CHECK
CREATE POLICY intake_entity_links_service_all ON intake_entity_links
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY link_audit_logs_service_all ON link_audit_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

COMMENT ON POLICY intake_entity_links_service_all ON intake_entity_links IS 'Allow service role full access (SELECT/INSERT/UPDATE/DELETE) for Edge Functions';
COMMENT ON POLICY link_audit_logs_service_all ON link_audit_logs IS 'Allow service role full access (SELECT/INSERT/UPDATE/DELETE) for Edge Functions';
