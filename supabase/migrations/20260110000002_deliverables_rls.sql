-- Migration: RLS Policies for MoU Deliverables
-- Purpose: Row Level Security for deliverables, milestones, history, and documents
-- Feature: commitment-deliverables
-- Date: 2026-01-10

-- Helper function to check if user has access to MoU
CREATE OR REPLACE FUNCTION public.user_has_mou_access(p_mou_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mous m
        WHERE m.id = p_mou_id
        AND (
            -- Owner always has access
            m.owner_id = auth.uid()
            -- Public states visible to all authenticated
            OR m.workflow_state IN ('active', 'renewed', 'expired')
            -- Admin/editor role check via user metadata
            OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'editor')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================
-- MoU Deliverables Policies
-- =================================

-- SELECT: Users can view deliverables for MoUs they have access to
CREATE POLICY "deliverables_select_policy" ON public.mou_deliverables
    FOR SELECT
    USING (
        user_has_mou_access(mou_id)
        OR responsible_user_id = auth.uid()
    );

-- INSERT: Users can create deliverables for MoUs they own or are admin/editor
CREATE POLICY "deliverables_insert_policy" ON public.mou_deliverables
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_id
            AND (
                m.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'editor')
                )
            )
        )
        AND created_by = auth.uid()
    );

-- UPDATE: Users can update deliverables they're responsible for, created, or if admin/editor
CREATE POLICY "deliverables_update_policy" ON public.mou_deliverables
    FOR UPDATE
    USING (
        responsible_user_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_id AND m.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'editor')
        )
    )
    WITH CHECK (
        responsible_user_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_id AND m.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'editor')
        )
    );

-- DELETE: Only MoU owner or admin can delete deliverables
CREATE POLICY "deliverables_delete_policy" ON public.mou_deliverables
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_id AND m.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- =================================
-- Deliverable Milestones Policies
-- =================================

-- SELECT: Users can view milestones for deliverables they can view
CREATE POLICY "milestones_select_policy" ON public.deliverable_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                user_has_mou_access(d.mou_id)
                OR d.responsible_user_id = auth.uid()
            )
        )
    );

-- INSERT: Users can create milestones for deliverables they can update
CREATE POLICY "milestones_insert_policy" ON public.deliverable_milestones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                d.responsible_user_id = auth.uid()
                OR d.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = d.mou_id AND m.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'editor')
                )
            )
        )
    );

-- UPDATE: Users can update milestones for deliverables they can update
CREATE POLICY "milestones_update_policy" ON public.deliverable_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                d.responsible_user_id = auth.uid()
                OR d.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = d.mou_id AND m.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'editor')
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                d.responsible_user_id = auth.uid()
                OR d.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = d.mou_id AND m.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'editor')
                )
            )
        )
    );

-- DELETE: Users can delete milestones for deliverables they can update
CREATE POLICY "milestones_delete_policy" ON public.deliverable_milestones
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                d.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = d.mou_id AND m.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role = 'admin'
                )
            )
        )
    );

-- =================================
-- Deliverable Status History Policies
-- =================================

-- SELECT: Users can view history for deliverables they can view
CREATE POLICY "status_history_select_policy" ON public.deliverable_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                user_has_mou_access(d.mou_id)
                OR d.responsible_user_id = auth.uid()
            )
        )
    );

-- INSERT: System only (via triggers), but allow authenticated users for manual inserts
CREATE POLICY "status_history_insert_policy" ON public.deliverable_status_history
    FOR INSERT
    WITH CHECK (
        changed_by = auth.uid()
    );

-- No UPDATE or DELETE policies - history is immutable

-- =================================
-- Deliverable Documents Policies
-- =================================

-- SELECT: Users can view documents for deliverables they can view
CREATE POLICY "documents_select_policy" ON public.deliverable_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                user_has_mou_access(d.mou_id)
                OR d.responsible_user_id = auth.uid()
            )
        )
    );

-- INSERT: Users can upload documents for deliverables they can update
CREATE POLICY "documents_insert_policy" ON public.deliverable_documents
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                d.responsible_user_id = auth.uid()
                OR d.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = d.mou_id AND m.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'editor')
                )
            )
        )
    );

-- UPDATE: Only uploader or admin can update document metadata
CREATE POLICY "documents_update_policy" ON public.deliverable_documents
    FOR UPDATE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- DELETE: Only uploader, deliverable owner, or admin can delete documents
CREATE POLICY "documents_delete_policy" ON public.deliverable_documents
    FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.mou_deliverables d
            WHERE d.id = deliverable_id
            AND (
                d.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = d.mou_id AND m.owner_id = auth.uid()
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );
