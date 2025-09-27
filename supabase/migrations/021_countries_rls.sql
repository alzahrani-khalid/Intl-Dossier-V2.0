-- 021_countries_rls.sql: RLS policies for countries table
-- Row-Level Security policies for country management

-- ============================================
-- ENABLE RLS ON COUNTRIES TABLE
-- ============================================

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COUNTRIES TABLE RLS POLICIES
-- ============================================

-- Policy: Everyone can read active countries
CREATE POLICY countries_select_active ON public.countries
    FOR SELECT
    USING (status = 'active');

-- Policy: Authenticated users can read all countries
CREATE POLICY countries_select_authenticated ON public.countries
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Only editors and admins can insert countries
CREATE POLICY countries_insert_editor ON public.countries
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Policy: Only editors and admins can update countries
CREATE POLICY countries_update_editor ON public.countries
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

-- Policy: Only admins can delete countries
CREATE POLICY countries_delete_admin ON public.countries
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

COMMENT ON POLICY countries_select_active ON public.countries IS 'Everyone can view active countries';
COMMENT ON POLICY countries_select_authenticated ON public.countries IS 'Authenticated users can view all countries';
COMMENT ON POLICY countries_insert_editor ON public.countries IS 'Editors and admins can add new countries';
COMMENT ON POLICY countries_update_editor ON public.countries IS 'Editors and admins can update countries';
COMMENT ON POLICY countries_delete_admin ON public.countries IS 'Only admins can delete countries';
