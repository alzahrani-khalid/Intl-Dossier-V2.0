-- 022_organizations_rls.sql: RLS policies for organizations table
-- Row-Level Security policies for organization management

-- ============================================
-- ENABLE RLS ON ORGANIZATIONS TABLE
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS TABLE RLS POLICIES
-- ============================================

-- Policy: Everyone can read active organizations
CREATE POLICY organizations_select_active ON public.organizations
    FOR SELECT
    USING (status = 'active');

-- Policy: Authenticated users can read all organizations
CREATE POLICY organizations_select_authenticated ON public.organizations
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Editors and admins can insert organizations
CREATE POLICY organizations_insert_editor ON public.organizations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Policy: Editors and admins can update organizations
CREATE POLICY organizations_update_editor ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Policy: Only admins can delete organizations
CREATE POLICY organizations_delete_admin ON public.organizations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY organizations_select_active ON public.organizations IS 'Everyone can view active organizations';
COMMENT ON POLICY organizations_select_authenticated ON public.organizations IS 'Authenticated users can view all organizations';
COMMENT ON POLICY organizations_insert_editor ON public.organizations IS 'Editors and admins can add new organizations';
COMMENT ON POLICY organizations_update_editor ON public.organizations IS 'Editors and admins can update organizations';
COMMENT ON POLICY organizations_delete_admin ON public.organizations IS 'Only admins can delete organizations';
