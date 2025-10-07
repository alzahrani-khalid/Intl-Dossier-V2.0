-- Migration: 010_create_policies
-- Description: Create Row Level Security policies for all tables
-- Date: 2025-01-29

-- ============================================
-- Intake Tickets Policies
-- ============================================

-- Users can view tickets in their units with appropriate sensitivity clearance
CREATE POLICY ticket_select ON intake_tickets
    FOR SELECT
    USING (
        -- Service role bypass
        system_operation('any') OR
        -- User can see tickets in their units
        (
            (assigned_unit = ANY(get_user_units(auth.uid())) OR 
             assigned_unit IS NULL OR
             created_by = auth.uid() OR
             assigned_to = auth.uid())
            AND 
            sensitivity <= get_user_max_sensitivity(auth.uid())
        )
    );

-- Users can create tickets
CREATE POLICY ticket_insert ON intake_tickets
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        created_by = auth.uid()
    );

-- Users can update tickets they created or are assigned to
CREATE POLICY ticket_update ON intake_tickets
    FOR UPDATE
    USING (
        system_operation('any') OR
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        (assigned_unit = ANY(get_user_units(auth.uid())) AND is_supervisor(auth.uid()))
    )
    WITH CHECK (
        system_operation('any') OR
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        (assigned_unit = ANY(get_user_units(auth.uid())) AND is_supervisor(auth.uid()))
    );

-- Only admins can delete tickets
CREATE POLICY ticket_delete ON intake_tickets
    FOR DELETE
    USING (
        system_operation('any') OR
        is_admin(auth.uid())
    );

-- ============================================
-- Intake Attachments Policies
-- ============================================

-- Users can view attachments for tickets they can see
CREATE POLICY attachment_select ON intake_attachments
    FOR SELECT
    USING (
        system_operation('any') OR
        EXISTS (
            SELECT 1 FROM intake_tickets t
            WHERE t.id = intake_attachments.ticket_id
            AND (
                t.created_by = auth.uid() OR
                t.assigned_to = auth.uid() OR
                t.assigned_unit = ANY(get_user_units(auth.uid()))
            )
            AND t.sensitivity <= get_user_max_sensitivity(auth.uid())
        )
    );

-- Users can upload attachments to tickets they can edit
CREATE POLICY attachment_insert ON intake_attachments
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        (
            uploaded_by = auth.uid() AND
            EXISTS (
                SELECT 1 FROM intake_tickets t
                WHERE t.id = intake_attachments.ticket_id
                AND (
                    t.created_by = auth.uid() OR
                    t.assigned_to = auth.uid() OR
                    (t.assigned_unit = ANY(get_user_units(auth.uid())) AND is_supervisor(auth.uid()))
                )
            )
        )
    );

-- Users can soft-delete their own attachments
CREATE POLICY attachment_update ON intake_attachments
    FOR UPDATE
    USING (
        system_operation('any') OR
        uploaded_by = auth.uid()
    )
    WITH CHECK (
        system_operation('any') OR
        uploaded_by = auth.uid()
    );

-- Only admins can hard delete attachments
CREATE POLICY attachment_delete ON intake_attachments
    FOR DELETE
    USING (
        system_operation('any') OR
        is_admin(auth.uid())
    );

-- ============================================
-- Triage Decisions Policies
-- ============================================

-- Users can view triage decisions for tickets they can see
CREATE POLICY triage_select ON triage_decisions
    FOR SELECT
    USING (
        system_operation('any') OR
        EXISTS (
            SELECT 1 FROM intake_tickets t
            WHERE t.id = triage_decisions.ticket_id
            AND (
                t.created_by = auth.uid() OR
                t.assigned_to = auth.uid() OR
                t.assigned_unit = ANY(get_user_units(auth.uid()))
            )
            AND t.sensitivity <= get_user_max_sensitivity(auth.uid())
        )
    );

-- Supervisors can create triage decisions
CREATE POLICY triage_insert ON triage_decisions
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        (created_by = auth.uid() AND is_supervisor(auth.uid()))
    );

-- Supervisors can update triage decisions
CREATE POLICY triage_update ON triage_decisions
    FOR UPDATE
    USING (
        system_operation('any') OR
        (created_by = auth.uid() AND is_supervisor(auth.uid()))
    )
    WITH CHECK (
        system_operation('any') OR
        (created_by = auth.uid() AND is_supervisor(auth.uid()))
    );

-- ============================================
-- SLA Policies Policies
-- ============================================

-- All authenticated users can view active SLA policies
CREATE POLICY sla_policy_select ON sla_policies
    FOR SELECT
    USING (
        system_operation('any') OR
        is_active = true
    );

-- Only admins can manage SLA policies
CREATE POLICY sla_policy_insert ON sla_policies
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        is_admin(auth.uid())
    );

CREATE POLICY sla_policy_update ON sla_policies
    FOR UPDATE
    USING (
        system_operation('any') OR
        is_admin(auth.uid())
    )
    WITH CHECK (
        system_operation('any') OR
        is_admin(auth.uid())
    );

CREATE POLICY sla_policy_delete ON sla_policies
    FOR DELETE
    USING (
        system_operation('any') OR
        is_admin(auth.uid())
    );

-- ============================================
-- SLA Events Policies
-- ============================================

-- Users can view SLA events for tickets they can see
CREATE POLICY sla_event_select ON sla_events
    FOR SELECT
    USING (
        system_operation('any') OR
        EXISTS (
            SELECT 1 FROM intake_tickets t
            WHERE t.id = sla_events.ticket_id
            AND (
                t.created_by = auth.uid() OR
                t.assigned_to = auth.uid() OR
                t.assigned_unit = ANY(get_user_units(auth.uid()))
            )
            AND t.sensitivity <= get_user_max_sensitivity(auth.uid())
        )
    );

-- System creates SLA events automatically
CREATE POLICY sla_event_insert ON sla_events
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        created_by = auth.uid()
    );

-- ============================================
-- Duplicate Candidates Policies
-- ============================================

-- Users can view duplicates for tickets they can see
CREATE POLICY duplicate_select ON duplicate_candidates
    FOR SELECT
    USING (
        system_operation('any') OR
        EXISTS (
            SELECT 1 FROM intake_tickets t
            WHERE (t.id = duplicate_candidates.source_ticket_id OR 
                   t.id = duplicate_candidates.target_ticket_id)
            AND (
                t.created_by = auth.uid() OR
                t.assigned_to = auth.uid() OR
                t.assigned_unit = ANY(get_user_units(auth.uid()))
            )
            AND t.sensitivity <= get_user_max_sensitivity(auth.uid())
        )
    );

-- System and supervisors can create duplicate candidates
CREATE POLICY duplicate_insert ON duplicate_candidates
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        (detected_by = auth.uid()::TEXT AND is_supervisor(auth.uid()))
    );

-- Supervisors can update duplicate decisions
CREATE POLICY duplicate_update ON duplicate_candidates
    FOR UPDATE
    USING (
        system_operation('any') OR
        is_supervisor(auth.uid())
    )
    WITH CHECK (
        system_operation('any') OR
        (resolved_by = auth.uid() AND is_supervisor(auth.uid()))
    );

-- ============================================
-- AI Embeddings Policies
-- ============================================

-- Users can view embeddings for tickets they can see
CREATE POLICY embedding_select ON ai_embeddings
    FOR SELECT
    USING (
        system_operation('any') OR
        (
            owner_type = 'ticket' AND
            EXISTS (
                SELECT 1 FROM intake_tickets t
                WHERE t.id = ai_embeddings.owner_id
                AND (
                    t.created_by = auth.uid() OR
                    t.assigned_to = auth.uid() OR
                    t.assigned_unit = ANY(get_user_units(auth.uid()))
                )
                AND t.sensitivity <= get_user_max_sensitivity(auth.uid())
            )
        )
    );

-- System creates embeddings
CREATE POLICY embedding_insert ON ai_embeddings
    FOR INSERT
    WITH CHECK (
        system_operation('any')
    );

-- System updates embeddings
CREATE POLICY embedding_update ON ai_embeddings
    FOR UPDATE
    USING (system_operation('any'))
    WITH CHECK (system_operation('any'));

-- ============================================
-- Analysis Metadata Policies
-- ============================================

-- Users can view analysis for their operations
CREATE POLICY analysis_select ON analysis_metadata
    FOR SELECT
    USING (
        system_operation('any') OR
        created_by = auth.uid() OR
        is_auditor(auth.uid())
    );

-- System and users create analysis records
CREATE POLICY analysis_insert ON analysis_metadata
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        created_by = auth.uid()
    );

-- ============================================
-- Audit Logs Policies
-- ============================================

-- Write-only for all authenticated users
CREATE POLICY audit_insert ON audit_logs
    FOR INSERT
    WITH CHECK (
        system_operation('any') OR
        user_id = auth.uid()
    );

-- Only auditors and admins can read audit logs
CREATE POLICY audit_select ON audit_logs
    FOR SELECT
    USING (
        system_operation('any') OR
        is_auditor(auth.uid()) OR
        is_admin(auth.uid()) OR
        (user_id = auth.uid() AND action IN ('view', 'export')) -- Users can see their own access logs
    );

-- Nobody can update audit logs (immutable)
-- No UPDATE policy created

-- Nobody can delete audit logs (immutable)
-- No DELETE policy created

-- ============================================
-- Verification queries
-- ============================================

-- Function to verify RLS is properly configured
CREATE OR REPLACE FUNCTION verify_rls_configuration()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT as table_name,
        c.relrowsecurity as rls_enabled,
        COUNT(p.polname)::INTEGER as policy_count
    FROM pg_class c
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
    AND c.relname IN (
        'intake_tickets', 'intake_attachments', 'triage_decisions',
        'sla_policies', 'sla_events', 'duplicate_candidates',
        'ai_embeddings', 'analysis_metadata', 'audit_logs'
    )
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION verify_rls_configuration IS 'Verify that RLS is enabled and policies exist for all tables';