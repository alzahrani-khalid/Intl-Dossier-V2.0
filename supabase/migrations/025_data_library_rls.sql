-- 025_data_library_rls.sql: RLS policies for data_library_items table
-- Row-Level Security policies for data library management

-- ============================================
-- ENABLE RLS ON DATA LIBRARY ITEMS TABLE
-- ============================================

ALTER TABLE public.data_library_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DATA LIBRARY ITEMS TABLE RLS POLICIES
-- ============================================

-- Policy: Select - public items visible to all, private to uploader and editors
CREATE POLICY data_library_select ON public.data_library_items
    FOR SELECT
    USING (
        -- Public items visible to everyone
        access_level = 'public'
        -- Internal items visible to authenticated users
        OR (access_level = 'internal' AND auth.uid() IS NOT NULL)
        -- Confidential and secret items require editor or admin role
        OR (access_level IN ('confidential', 'secret')
            AND public.auth_has_any_role(ARRAY['admin', 'editor']))
        -- Private items visible to uploader
        OR uploaded_by = auth.uid()
    );

-- Policy: Insert - authenticated users can upload
CREATE POLICY data_library_insert ON public.data_library_items
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND auth.uid() IS NOT NULL
    );

-- Policy: Update - uploader, editors, and admins
CREATE POLICY data_library_update ON public.data_library_items
    FOR UPDATE
    USING (
        uploaded_by = auth.uid()
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
    WITH CHECK (
        -- Cannot change uploader unless admin
        (uploaded_by = OLD.uploaded_by OR public.auth_has_role('admin'))
        AND (
            uploaded_by = auth.uid()
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - uploader, editors, and admins
CREATE POLICY data_library_delete ON public.data_library_items
    FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- ============================================
-- ALLOWED MIME TYPES RLS POLICIES
-- ============================================

-- Enable RLS on allowed mime types table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_mime_types' AND table_schema = 'public') THEN
        ALTER TABLE public.allowed_mime_types ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Select allowed mime types
        CREATE POLICY allowed_mime_types_select ON public.allowed_mime_types
            FOR SELECT
            USING (auth.uid() IS NOT NULL);

        -- Policy: Insert allowed mime types (admin only)
        CREATE POLICY allowed_mime_types_insert ON public.allowed_mime_types
            FOR INSERT
            WITH CHECK (public.auth_has_role('admin'));

        -- Policy: Update allowed mime types (admin only)
        CREATE POLICY allowed_mime_types_update ON public.allowed_mime_types
            FOR UPDATE
            USING (public.auth_has_role('admin'))
            WITH CHECK (public.auth_has_role('admin'));

        -- Policy: Delete allowed mime types (admin only)
        CREATE POLICY allowed_mime_types_delete ON public.allowed_mime_types
            FOR DELETE
            USING (public.auth_has_role('admin'));
    END IF;
END $$;

-- ============================================
-- DATA LIBRARY DOWNLOADS RLS POLICIES
-- ============================================

-- Enable RLS on data library downloads table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_library_downloads' AND table_schema = 'public') THEN
        ALTER TABLE public.data_library_downloads ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Select downloads
        CREATE POLICY data_library_downloads_select ON public.data_library_downloads
            FOR SELECT
            USING (
                -- Users can see their own downloads
                downloaded_by = auth.uid()
                -- Item uploaders can see download history
                OR EXISTS (
                    SELECT 1 FROM public.data_library_items dli
                    WHERE dli.id = data_library_downloads.item_id
                    AND dli.uploaded_by = auth.uid()
                )
                -- Editors and admins can see all downloads
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            );

        -- Policy: Insert downloads
        CREATE POLICY data_library_downloads_insert ON public.data_library_downloads
            FOR INSERT
            WITH CHECK (
                downloaded_by = auth.uid()
                AND auth.uid() IS NOT NULL
            );
    END IF;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY data_library_select ON public.data_library_items IS 'Public items visible to all, private items to uploader and editors';
COMMENT ON POLICY data_library_insert ON public.data_library_items IS 'Authenticated users can upload to data library';
COMMENT ON POLICY data_library_update ON public.data_library_items IS 'Uploader, editors, and admins can update data library items';
COMMENT ON POLICY data_library_delete ON public.data_library_items IS 'Uploader, editors, and admins can delete data library items';
