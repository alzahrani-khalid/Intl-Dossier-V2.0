-- 20260518000001_countries_rls_reconcile.sql: reconcile public.countries RLS policies
-- Phase 56 / RLS-01 (D-56-02, D-56-04). Restores the role-gated write-side policies
-- defined in 021_countries_rls.sql that drifted on staging (project zkrcjzdemdmwhearhfgg).
-- Idempotent: each policy DROP IF EXISTS then CREATE. Repo migrations remain source of truth.

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS countries_authenticated_read ON public.countries;
DROP POLICY IF EXISTS countries_select_active ON public.countries;
DROP POLICY IF EXISTS countries_select_authenticated ON public.countries;
DROP POLICY IF EXISTS countries_insert_editor ON public.countries;
DROP POLICY IF EXISTS countries_update_editor ON public.countries;
DROP POLICY IF EXISTS countries_delete_admin ON public.countries;

CREATE POLICY countries_select_active ON public.countries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dossiers
            WHERE dossiers.id = countries.id
            AND dossiers.status = 'active'
        )
    );

CREATE POLICY countries_select_authenticated ON public.countries
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY countries_insert_editor ON public.countries
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

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

CREATE POLICY countries_delete_admin ON public.countries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

COMMENT ON POLICY countries_select_active ON public.countries IS 'Everyone can view active countries';
COMMENT ON POLICY countries_select_authenticated ON public.countries IS 'Authenticated users can view all countries';
COMMENT ON POLICY countries_insert_editor ON public.countries IS 'Editors and admins can add new countries';
COMMENT ON POLICY countries_update_editor ON public.countries IS 'Editors and admins can update countries';
COMMENT ON POLICY countries_delete_admin ON public.countries IS 'Only admins can delete countries';
