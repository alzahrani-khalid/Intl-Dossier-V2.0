-- 012_rls_policies_events.sql: RLS policies for MoUs, Events, Forums tables
-- Row-Level Security policies for event-related entities

-- ============================================
-- MOUS TABLE RLS POLICIES
-- ============================================

-- Policy: Read based on workflow state and user role
CREATE POLICY mous_select ON public.mous
    FOR SELECT
    USING (
        -- Public states visible to all authenticated users
        workflow_state IN ('active', 'renewed', 'expired')
        -- Owner can see their own MoUs in any state
        OR owner_id = auth.uid()
        -- Editors and admins can see all MoUs
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        -- Organizations involved can see the MoU
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE (o.id = mous.primary_party_id OR o.id = mous.secondary_party_id)
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
        owner_id = auth.uid()
        AND public.auth_has_any_role(ARRAY['admin', 'editor'])
    );

-- Policy: Update - owner, editors, and admins
CREATE POLICY mous_update ON public.mous
    FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
    )
    WITH CHECK (
        -- Cannot change owner unless admin
        (owner_id = OLD.owner_id OR public.auth_has_role('admin'))
        AND (
            owner_id = auth.uid()
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - only admins
CREATE POLICY mous_delete ON public.mous
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- MoU Documents policies
CREATE POLICY mou_documents_select ON public.mou_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_documents.mou_id
            AND (
                m.workflow_state IN ('active', 'renewed', 'expired')
                OR m.owner_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY mou_documents_insert ON public.mou_documents
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_documents.mou_id
            AND (
                m.owner_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- MoU Workflow History policies
CREATE POLICY mou_workflow_history_select ON public.mou_workflow_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_workflow_history.mou_id
            AND (
                m.owner_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY mou_workflow_history_insert ON public.mou_workflow_history
    FOR INSERT
    WITH CHECK (
        transitioned_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_workflow_history.mou_id
            AND (
                m.owner_id = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- ============================================
-- EVENTS TABLE RLS POLICIES
-- ============================================

-- Policy: Select - different visibility based on status
CREATE POLICY events_select ON public.events
    FOR SELECT
    USING (
        -- Published events visible to all
        status IN ('scheduled', 'ongoing', 'completed')
        -- Drafts visible to creator, editors, and admins
        OR (status = 'draft' AND (
            created_by = auth.uid()
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        ))
        -- Cancelled events visible to authenticated users
        OR (status = 'cancelled' AND auth.uid() IS NOT NULL)
    );

-- Policy: Insert - authenticated users can create events
CREATE POLICY events_insert ON public.events
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND auth.uid() IS NOT NULL
    );

-- Policy: Update - creator, organizer representatives, editors, and admins
CREATE POLICY events_update ON public.events
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        -- Organizer representatives can update
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = events.organizer_id
            -- Add organization membership check here
        )
    )
    WITH CHECK (
        -- Cannot change creator
        created_by = OLD.created_by
        AND (
            created_by = auth.uid()
            OR public.auth_has_any_role(ARRAY['admin', 'editor'])
        )
    );

-- Policy: Delete - only admins (soft delete via status change preferred)
CREATE POLICY events_delete ON public.events
    FOR DELETE
    USING (public.auth_has_role('admin'));

-- Event Participants policies
CREATE POLICY event_participants_select ON public.event_participants
    FOR SELECT
    USING (
        -- Participants can see their own registrations
        user_id = auth.uid()
        -- Event creator and organizers can see all participants
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_participants.event_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY event_participants_insert ON public.event_participants
    FOR INSERT
    WITH CHECK (
        -- Self-registration
        (user_id = auth.uid() OR user_id IS NULL)
        -- Or event managers adding participants
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_participants.event_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY event_participants_update ON public.event_participants
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_participants.event_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_participants.event_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- Event Documents policies
CREATE POLICY event_documents_select ON public.event_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_documents.event_id
            AND (
                e.status IN ('scheduled', 'ongoing', 'completed')
                OR e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY event_documents_insert ON public.event_documents
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_documents.event_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- ============================================
-- FORUMS TABLE RLS POLICIES
-- ============================================

-- Forums inherit event policies through foreign key
-- Additional forum-specific policies

CREATE POLICY forums_select ON public.forums
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = forums.id
            AND (
                e.status IN ('scheduled', 'ongoing', 'completed')
                OR e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY forums_insert ON public.forums
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = forums.id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY forums_update ON public.forums
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = forums.id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = forums.id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- Forum Sessions policies
CREATE POLICY forum_sessions_select ON public.forum_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.forums f
            JOIN public.events e ON e.id = f.id
            WHERE f.id = forum_sessions.forum_id
            AND (
                e.status IN ('scheduled', 'ongoing', 'completed')
                OR e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY forum_sessions_insert ON public.forum_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.forums f
            JOIN public.events e ON e.id = f.id
            WHERE f.id = forum_sessions.forum_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

CREATE POLICY forum_sessions_update ON public.forum_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.forums f
            JOIN public.events e ON e.id = f.id
            WHERE f.id = forum_sessions.forum_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.forums f
            JOIN public.events e ON e.id = f.id
            WHERE f.id = forum_sessions.forum_id
            AND (
                e.created_by = auth.uid()
                OR public.auth_has_any_role(ARRAY['admin', 'editor'])
            )
        )
    );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY mous_select ON public.mous IS 'MoUs visible based on workflow state and user role';
COMMENT ON POLICY mous_insert ON public.mous IS 'Editors and admins can create MoUs';
COMMENT ON POLICY mous_update ON public.mous IS 'Owner, editors, and admins can update MoUs';

COMMENT ON POLICY events_select ON public.events IS 'Events visible based on status and user role';
COMMENT ON POLICY events_insert ON public.events IS 'Authenticated users can create events';
COMMENT ON POLICY events_update ON public.events IS 'Creator, organizers, editors, and admins can update events';

COMMENT ON POLICY forums_select ON public.forums IS 'Forums inherit visibility from parent event';
COMMENT ON POLICY forum_sessions_select ON public.forum_sessions IS 'Forum sessions inherit visibility from parent forum';