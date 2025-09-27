-- 013_rls_policies_content.sql: RLS policies for Briefs, Intelligence, DataLibrary tables
-- Row-Level Security policies for content-related entities

-- ============================================
-- BRIEFS TABLE RLS POLICIES
-- ============================================

-- Policy: Select - published briefs visible to all, drafts to author and editors
CREATE POLICY briefs_select ON public.briefs
    FOR SELECT
    USING (
        -- Published briefs visible to all authenticated users
        (is_published = true AND auth.uid() IS NOT NULL)
        -- Author can see their own briefs
        OR author_id = auth.uid()
        -- Editors and admins can see all briefs
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- Policy: Insert - authenticated users can create briefs
CREATE POLICY briefs_insert ON public.briefs
    FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND auth.uid() IS NOT NULL
    );

-- Policy: Update - author, editors, and admins
CREATE POLICY briefs_update ON public.briefs
    FOR UPDATE
    USING (
        author_id = auth.uid()
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
    WITH CHECK (
        -- Cannot change author unless admin
        (author_id = OLD.author_id OR public.auth_has_role('admin'))
        AND (
            author_id = auth.uid()
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - author (if not published), editors, and admins
CREATE POLICY briefs_delete ON public.briefs
    FOR DELETE
    USING (
        (author_id = auth.uid() AND is_published = false)
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- Brief Attachments policies
CREATE POLICY brief_attachments_select ON public.brief_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.briefs b
            WHERE b.id = brief_attachments.brief_id
            AND (
                (b.is_published = true AND auth.uid() IS NOT NULL)
                OR b.author_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY brief_attachments_insert ON public.brief_attachments
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.briefs b
            WHERE b.id = brief_attachments.brief_id
            AND (
                b.author_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY brief_attachments_delete ON public.brief_attachments
    FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.briefs b
            WHERE b.id = brief_attachments.brief_id
            AND (
                b.author_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

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
        -- Confidential and restricted require editor or admin role
        OR (classification IN ('confidential', 'restricted')
            AND public.auth_has_any_role(ARRAY['admin', 'editor']))
        -- Author can always see their own reports
        OR author_id = auth.uid()
        -- Reviewer can see reports they reviewed
        OR reviewed_by = auth.uid()
        -- Approver can see reports they approved
        OR approved_by = auth.uid()
    );

-- Policy: Insert - editors and admins only
CREATE POLICY intelligence_insert ON public.intelligence_reports
    FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- Policy: Update - author (draft only), reviewer, approver, editors, and admins
CREATE POLICY intelligence_update ON public.intelligence_reports
    FOR UPDATE
    USING (
        -- Author can update drafts
        (author_id = auth.uid() AND status = 'draft')
        -- Reviewer can update when in review
        OR (reviewed_by = auth.uid() AND status = 'review')
        -- Approver can update when approving
        OR (approved_by = auth.uid() AND status IN ('review', 'approved'))
        -- Editors and admins can always update
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
    WITH CHECK (
        -- Cannot change author
        author_id = OLD.author_id
        AND (
            (author_id = auth.uid() AND status = 'draft')
            OR (reviewed_by = auth.uid() AND status = 'review')
            OR (approved_by = auth.uid() AND status IN ('review', 'approved'))
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - only admins (sensitive content)
CREATE POLICY intelligence_delete ON public.intelligence_reports
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- Intelligence Attachments policies
CREATE POLICY intelligence_attachments_select ON public.intelligence_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.intelligence_reports ir
            WHERE ir.id = intelligence_attachments.report_id
            AND (
                (ir.classification = 'public' AND auth.uid() IS NOT NULL)
                OR (ir.classification = 'internal' AND auth.uid() IS NOT NULL)
                OR (ir.classification IN ('confidential', 'restricted')
                    AND public.auth_has_any_role(ARRAY['admin', 'editor']))
                OR ir.author_id = auth.uid()
                OR ir.reviewed_by = auth.uid()
                OR ir.approved_by = auth.uid()
            )
        )
    );

CREATE POLICY intelligence_attachments_insert ON public.intelligence_attachments
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.intelligence_reports ir
            WHERE ir.id = intelligence_attachments.report_id
            AND (
                ir.author_id = auth.uid()
                OR ir.reviewed_by = auth.uid()
                OR ir.approved_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- ============================================
-- DATA LIBRARY ITEMS TABLE RLS POLICIES
-- ============================================

-- Policy: Select - public items visible to all, private to uploader and editors
CREATE POLICY data_library_select ON public.data_library_items
    FOR SELECT
    USING (
        -- Public items visible to everyone
        is_public = true
        -- Private items visible to uploader
        OR uploaded_by = auth.uid()
        -- Editors and admins can see all items
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
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

-- Allowed MIME Types policies (admin only)
CREATE POLICY allowed_mime_types_select ON public.allowed_mime_types
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY allowed_mime_types_insert ON public.allowed_mime_types
    FOR INSERT
    WITH CHECK (public.auth_has_role('admin'));

CREATE POLICY allowed_mime_types_update ON public.allowed_mime_types
    FOR UPDATE
    USING (public.auth_has_role('admin'))
    WITH CHECK (public.auth_has_role('admin'));

CREATE POLICY allowed_mime_types_delete ON public.allowed_mime_types
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- Data Library Downloads policies
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

CREATE POLICY data_library_downloads_insert ON public.data_library_downloads
    FOR INSERT
    WITH CHECK (
        downloaded_by = auth.uid()
        AND auth.uid() IS NOT NULL
    );

-- ============================================
-- AUDIT LOG TABLE RLS POLICIES
-- ============================================

-- Policy: Select - admins and editors only for compliance
CREATE POLICY audit_log_select ON public.audit_log
    FOR SELECT
    USING (
        public.auth_has_any_role(ARRAY['admin', 'editor'])
        -- Users can see audit logs for their own actions
        OR user_id = auth.uid()
    );

-- Policy: Insert - system only (via triggers)
CREATE POLICY audit_log_insert ON public.audit_log
    FOR INSERT
    WITH CHECK (false); -- Only triggers can insert

-- Policy: Update - no one can update audit logs
CREATE POLICY audit_log_update ON public.audit_log
    FOR UPDATE
    USING (false)
    WITH CHECK (false);

-- Policy: Delete - no one can delete audit logs directly
CREATE POLICY audit_log_delete ON public.audit_log
    FOR DELETE
    USING (false); -- Cleanup only via retention function

-- Audit Retention Policies (admin only)
CREATE POLICY audit_retention_select ON public.audit_retention_policies
    FOR SELECT
    USING (public.auth_has_role('admin'));

CREATE POLICY audit_retention_insert ON public.audit_retention_policies
    FOR INSERT
    WITH CHECK (public.auth_has_role('admin'));

CREATE POLICY audit_retention_update ON public.audit_retention_policies
    FOR UPDATE
    USING (public.auth_has_role('admin'))
    WITH CHECK (public.auth_has_role('admin'));

CREATE POLICY audit_retention_delete ON public.audit_retention_policies
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY briefs_select ON public.briefs IS 'Published briefs visible to all, drafts to author and editors';
COMMENT ON POLICY briefs_insert ON public.briefs IS 'Authenticated users can create briefs';
COMMENT ON POLICY briefs_update ON public.briefs IS 'Author, editors, and admins can update briefs';

COMMENT ON POLICY intelligence_select ON public.intelligence_reports IS 'Classification-based access control for intelligence reports';
COMMENT ON POLICY intelligence_insert ON public.intelligence_reports IS 'Only editors and admins can create intelligence reports';

COMMENT ON POLICY data_library_select ON public.data_library_items IS 'Public items visible to all, private items to uploader and editors';
COMMENT ON POLICY data_library_insert ON public.data_library_items IS 'Authenticated users can upload to data library';

COMMENT ON POLICY audit_log_select ON public.audit_log IS 'Audit logs visible to admins, editors, and users for their own actions';
COMMENT ON POLICY audit_log_insert ON public.audit_log IS 'Audit logs can only be inserted by system triggers';