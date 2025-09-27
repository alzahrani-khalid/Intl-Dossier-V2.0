-- 023_mous_rls.sql: RLS policies for mous table
-- Row-Level Security policies for MoU document management

-- ============================================
-- ENABLE RLS ON MOUS TABLE
-- ============================================

ALTER TABLE public.mous ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MOUS TABLE RLS POLICIES
-- ============================================

-- Policy: Read based on workflow state and user role
CREATE POLICY mous_select ON public.mous
    FOR SELECT
    USING (
        -- Public states visible to all authenticated users
        status IN ('active', 'renewed', 'expired')
        -- Owner can see their own MoUs in any state
        OR created_by = auth.uid()
        -- Editors and admins can see all MoUs
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        -- Organizations involved can see the MoU
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = mous.organization_id
            AND EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                -- Add organization membership check here when implemented
            )
        )
    );

-- Policy: Insert - editors and admins, or users creating their own
CREATE POLICY mous_insert ON public.mous
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- Policy: Update - owner, editors, and admins
CREATE POLICY mous_update ON public.mous
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
    WITH CHECK (
        -- Cannot change owner unless admin
        (created_by = OLD.created_by OR public.auth_has_role('admin'))
        AND (
            created_by = auth.uid()
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - only admins
CREATE POLICY mous_delete ON public.mous
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- ============================================
-- MOUS WORKFLOW HISTORY RLS POLICIES
-- ============================================

-- Enable RLS on workflow history table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mou_workflow_history' AND table_schema = 'public') THEN
        ALTER TABLE public.mou_workflow_history ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Read workflow history
        CREATE POLICY mou_workflow_history_select ON public.mou_workflow_history
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = mou_workflow_history.mou_id
                    AND (
                        m.created_by = auth.uid()
                        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
                    )
                )
            );

        -- Policy: Insert workflow history
        CREATE POLICY mou_workflow_history_insert ON public.mou_workflow_history
            FOR INSERT
            WITH CHECK (
                transitioned_by = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM public.mous m
                    WHERE m.id = mou_workflow_history.mou_id
                    AND (
                        m.created_by = auth.uid()
                        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
                    )
                )
            );
    END IF;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY mous_select ON public.mous IS 'MoUs visible based on workflow state and user role';
COMMENT ON POLICY mous_insert ON public.mous IS 'Editors and admins can create MoUs';
COMMENT ON POLICY mous_update ON public.mous IS 'Owner, editors, and admins can update MoUs';
COMMENT ON POLICY mous_delete ON public.mous IS 'Only admins can delete MoUs';
