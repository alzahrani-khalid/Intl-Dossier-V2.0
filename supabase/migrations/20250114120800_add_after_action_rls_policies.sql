-- Migration: Add RLS policies for after-action tables
-- Purpose: Enforce security and access control
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Enable RLS on all tables
ALTER TABLE public.external_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.after_action_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_snapshots ENABLE ROW LEVEL SECURITY;

-- ========================================
-- external_contacts RLS policies
-- ========================================

-- SELECT: Any authenticated user (needed for assignment dropdown)
CREATE POLICY "external_contacts_select_authenticated"
    ON public.external_contacts FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Any authenticated user with staff/supervisor/admin role
CREATE POLICY "external_contacts_insert_staff"
    ON public.external_contacts FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND role IN ('staff', 'supervisor', 'admin')
        )
    );

-- UPDATE: Creator OR supervisor role
CREATE POLICY "external_contacts_update_creator_or_supervisor"
    ON public.external_contacts FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND role IN ('supervisor', 'admin')
        )
    );

-- DELETE: Restricted (foreign key constraints prevent deletion if referenced)
-- No DELETE policy = implicitly denied

-- ========================================
-- after_action_records RLS policies
-- ========================================

-- SELECT: User has dossier assignment
CREATE POLICY "after_action_records_select_assigned"
    ON public.after_action_records FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dossier_assignments
            WHERE dossier_id = after_action_records.dossier_id
            AND user_id = auth.uid()
        )
    );

-- INSERT: User has dossier assignment AND role IN (staff, supervisor, admin)
CREATE POLICY "after_action_records_insert_assigned_staff"
    ON public.after_action_records FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dossier_assignments
            WHERE dossier_id = after_action_records.dossier_id
            AND user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND role IN ('staff', 'supervisor', 'admin')
        )
    );

-- UPDATE: User has dossier assignment AND (creator OR supervisor) AND status allows edit
CREATE POLICY "after_action_records_update_creator_or_supervisor"
    ON public.after_action_records FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dossier_assignments
            WHERE dossier_id = after_action_records.dossier_id
            AND user_id = auth.uid()
        )
        AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE id = auth.uid()
                AND role IN ('supervisor', 'admin')
            )
        )
        AND (
            status = 'draft' OR
            status = 'edit_pending'
        )
    );

-- DELETE: User has dossier assignment AND creator AND status=draft
CREATE POLICY "after_action_records_delete_creator_draft_only"
    ON public.after_action_records FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dossier_assignments
            WHERE dossier_id = after_action_records.dossier_id
            AND user_id = auth.uid()
        )
        AND created_by = auth.uid()
        AND status = 'draft'
    );

-- ========================================
-- Child entities RLS policies (decisions, commitments, risks, follow_up_actions, attachments)
-- Inherit parent after_action_record RLS via foreign key
-- ========================================

-- decisions
CREATE POLICY "decisions_select_via_parent"
    ON public.decisions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = decisions.after_action_id
            AND da.user_id = auth.uid()
        )
    );

CREATE POLICY "decisions_insert_via_parent"
    ON public.decisions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = decisions.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "decisions_update_via_parent"
    ON public.decisions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = decisions.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "decisions_delete_via_parent"
    ON public.decisions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = decisions.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status = 'draft'
        )
    );

-- commitments (with additional policy: users can view their own commitments)
CREATE POLICY "commitments_select_via_parent_or_owner"
    ON public.commitments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = commitments.after_action_id
            AND da.user_id = auth.uid()
        )
        OR owner_internal_id = auth.uid()
    );

CREATE POLICY "commitments_insert_via_parent"
    ON public.commitments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = commitments.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "commitments_update_via_parent"
    ON public.commitments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = commitments.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "commitments_delete_via_parent"
    ON public.commitments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = commitments.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status = 'draft'
        )
    );

-- risks
CREATE POLICY "risks_select_via_parent"
    ON public.risks FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = risks.after_action_id
            AND da.user_id = auth.uid()
        )
    );

CREATE POLICY "risks_insert_via_parent"
    ON public.risks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = risks.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "risks_update_via_parent"
    ON public.risks FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = risks.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "risks_delete_via_parent"
    ON public.risks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = risks.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status = 'draft'
        )
    );

-- follow_up_actions
CREATE POLICY "follow_up_actions_select_via_parent"
    ON public.follow_up_actions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = follow_up_actions.after_action_id
            AND da.user_id = auth.uid()
        )
    );

CREATE POLICY "follow_up_actions_insert_via_parent"
    ON public.follow_up_actions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = follow_up_actions.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "follow_up_actions_update_via_parent"
    ON public.follow_up_actions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = follow_up_actions.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "follow_up_actions_delete_via_parent"
    ON public.follow_up_actions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = follow_up_actions.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status = 'draft'
        )
    );

-- attachments
CREATE POLICY "attachments_select_via_parent"
    ON public.attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = attachments.after_action_id
            AND da.user_id = auth.uid()
        )
        AND scan_status != 'infected' -- Cannot view infected files
    );

CREATE POLICY "attachments_insert_via_parent"
    ON public.attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = attachments.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status IN ('draft', 'edit_pending')
        )
    );

CREATE POLICY "attachments_update_system_only"
    ON public.attachments FOR UPDATE
    TO authenticated
    USING (false); -- Only system can update (scan status)

CREATE POLICY "attachments_delete_via_parent"
    ON public.attachments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = attachments.after_action_id
            AND da.user_id = auth.uid()
            AND aar.status = 'draft'
        )
        OR uploaded_by = auth.uid() -- Uploader can always delete their uploads
    );

-- ========================================
-- version_snapshots RLS policies
-- ========================================

-- SELECT: User has dossier assignment for parent after_action's dossier_id
CREATE POLICY "version_snapshots_select_via_parent"
    ON public.version_snapshots FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.after_action_records aar
            JOIN public.dossier_assignments da ON da.dossier_id = aar.dossier_id
            WHERE aar.id = version_snapshots.after_action_id
            AND da.user_id = auth.uid()
        )
    );

-- INSERT: System only (via Edge Function with service role key)
CREATE POLICY "version_snapshots_insert_system_only"
    ON public.version_snapshots FOR INSERT
    TO authenticated
    WITH CHECK (false); -- Denied for regular users, Edge Functions use service role

-- UPDATE/DELETE: Denied (immutable audit trail)
-- Already handled by trigger functions

COMMENT ON POLICY "after_action_records_select_assigned" ON public.after_action_records IS 'Users can view after-actions for dossiers they are assigned to';
COMMENT ON POLICY "commitments_select_via_parent_or_owner" ON public.commitments IS 'Users can view commitments if assigned to dossier OR if they own the commitment';
COMMENT ON POLICY "attachments_select_via_parent" ON public.attachments IS 'Users cannot view infected attachments';
