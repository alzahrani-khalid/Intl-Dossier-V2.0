-- 024_intelligence_rls.sql: RLS policies for intelligence_reports table
-- Row-Level Security policies for intelligence report management

-- ============================================
-- ENABLE RLS ON INTELLIGENCE REPORTS TABLE
-- ============================================

ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INTELLIGENCE REPORTS TABLE RLS POLICIES
-- ============================================

-- Policy: Select - classification-based access control
CREATE POLICY intelligence_select ON public.intelligence_reports
    FOR SELECT
    USING (
        -- Public reports visible to all authenticated users
        (classification = 'public' AND auth.uid() IS NOT NULL)
        -- Internal reports visible to all authenticated users
        OR (classification = 'internal' AND auth.uid() IS NOT NULL)
        -- Confidential and secret require editor or admin role
        OR (classification IN ('confidential', 'secret')
            AND public.auth_has_any_role(ARRAY['admin', 'editor']))
        -- Author can always see their own reports
        OR created_by = auth.uid()
    );

-- Policy: Insert - editors and admins only
CREATE POLICY intelligence_insert ON public.intelligence_reports
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- Policy: Update - author (draft only), editors, and admins
CREATE POLICY intelligence_update ON public.intelligence_reports
    FOR UPDATE
    USING (
        -- Author can update drafts
        (created_by = auth.uid() AND status = 'draft')
        -- Editors and admins can always update
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
    WITH CHECK (
        -- Cannot change author
        created_by = OLD.created_by
        AND (
            (created_by = auth.uid() AND status = 'draft')
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - only admins (sensitive content)
CREATE POLICY intelligence_delete ON public.intelligence_reports
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- ============================================
-- INTELLIGENCE ATTACHMENTS RLS POLICIES
-- ============================================

-- Enable RLS on intelligence attachments table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_attachments' AND table_schema = 'public') THEN
        ALTER TABLE public.intelligence_attachments ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Select intelligence attachments
        CREATE POLICY intelligence_attachments_select ON public.intelligence_attachments
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.intelligence_reports ir
                    WHERE ir.id = intelligence_attachments.report_id
                    AND (
                        (ir.classification = 'public' AND auth.uid() IS NOT NULL)
                        OR (ir.classification = 'internal' AND auth.uid() IS NOT NULL)
                        OR (ir.classification IN ('confidential', 'secret')
                            AND public.auth_has_any_role(ARRAY['admin', 'editor']))
                        OR ir.created_by = auth.uid()
                    )
                )
            );

        -- Policy: Insert intelligence attachments
        CREATE POLICY intelligence_attachments_insert ON public.intelligence_attachments
            FOR INSERT
            WITH CHECK (
                uploaded_by = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM public.intelligence_reports ir
                    WHERE ir.id = intelligence_attachments.report_id
                    AND (
                        ir.created_by = auth.uid()
                        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
                    )
                )
            );
    END IF;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY intelligence_select ON public.intelligence_reports IS 'Classification-based access control for intelligence reports';
COMMENT ON POLICY intelligence_insert ON public.intelligence_reports IS 'Only editors and admins can create intelligence reports';
COMMENT ON POLICY intelligence_update ON public.intelligence_reports IS 'Author (draft only), editors, and admins can update intelligence reports';
COMMENT ON POLICY intelligence_delete ON public.intelligence_reports IS 'Only admins can delete intelligence reports';
