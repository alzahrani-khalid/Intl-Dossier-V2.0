-- Migration: RLS Policies for Themes Table
-- Date: 2026-01-10
-- Feature: themes-entity-management
-- Description: Row Level Security policies for themes extension table

-- Enable Row Level Security
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can view theme extensions if they can view the parent dossier
-- This aligns with the dossiers table RLS which checks clearance level
CREATE POLICY "view_themes_by_clearance"
ON public.themes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.dossiers d
        WHERE d.id = themes.id
        AND d.type = 'theme'
        AND get_user_clearance_level(auth.uid()) >=
            CASE d.sensitivity_level
                WHEN 'low' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'high' THEN 3
            END
    )
);

-- INSERT Policy: Authenticated users can create theme extensions
-- The dossier must already exist and be of type 'theme'
CREATE POLICY "insert_themes_authenticated"
ON public.themes FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.dossiers d
        WHERE d.id = themes.id
        AND d.type = 'theme'
    )
);

-- UPDATE Policy: Users who can edit the parent dossier can update the theme extension
CREATE POLICY "update_themes_by_permission"
ON public.themes FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.dossiers d
        WHERE d.id = themes.id
        AND d.type = 'theme'
        AND can_edit_dossier(d.id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.dossiers d
        WHERE d.id = themes.id
        AND d.type = 'theme'
        AND can_edit_dossier(d.id)
    )
);

-- DELETE Policy: Users who can edit the parent dossier can delete the theme extension
-- Note: CASCADE will typically handle this, but explicit policy for direct deletes
CREATE POLICY "delete_themes_by_permission"
ON public.themes FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.dossiers d
        WHERE d.id = themes.id
        AND d.type = 'theme'
        AND can_edit_dossier(d.id)
    )
);

-- Grant access to the theme_details view
-- The view inherits RLS from the underlying tables
GRANT SELECT ON public.theme_details TO authenticated;
GRANT SELECT ON public.theme_details TO anon;

-- Comments for documentation
COMMENT ON POLICY "view_themes_by_clearance" ON public.themes IS 'Users can view themes based on their clearance level matching dossier sensitivity';
COMMENT ON POLICY "insert_themes_authenticated" ON public.themes IS 'Authenticated users can create theme extensions for existing theme dossiers';
COMMENT ON POLICY "update_themes_by_permission" ON public.themes IS 'Users with edit permission on dossier can update theme extension';
COMMENT ON POLICY "delete_themes_by_permission" ON public.themes IS 'Users with edit permission on dossier can delete theme extension';
