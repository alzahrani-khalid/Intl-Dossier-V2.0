-- Migration: Saved Searches with Team Sharing and Alerts
-- Feature: saved-searches-feature
-- Description: Allow users to save complex search queries, share across teams, and set up automatic alerts
-- Created: 2026-01-13

-- ============================================================================
-- PART 1: ENHANCED SAVED SEARCHES TABLE
-- ============================================================================

-- Create saved_searches table for user-saved search queries
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner information
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Search metadata
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    icon TEXT DEFAULT 'search',
    color TEXT DEFAULT 'blue' CHECK (color IN (
        'blue', 'green', 'red', 'purple', 'orange',
        'yellow', 'gray', 'pink', 'indigo', 'teal'
    )),

    -- Full search definition (JSON representation of search criteria)
    search_definition JSONB NOT NULL,
    -- search_definition schema:
    -- {
    --   "query": string,                    -- Full-text search query
    --   "entity_types": string[],           -- Types to search: dossier, engagement, etc.
    --   "conditions": FilterCondition[],    -- Individual filter conditions
    --   "condition_groups": FilterGroup[],  -- Grouped conditions with AND/OR
    --   "relationships": RelationshipQuery[], -- Cross-entity relationship queries
    --   "date_range": { from, to, preset }, -- Date filtering
    --   "status": string[],                 -- Status filters
    --   "tags": string[],                   -- Tag filters
    --   "filter_logic": "AND" | "OR",       -- Top-level logic
    --   "include_archived": boolean,        -- Include archived items
    --   "sort_by": "relevance" | "date" | "title",
    --   "sort_order": "asc" | "desc"
    -- }

    -- Organization & categorization
    category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN (
        'personal', 'team', 'organization', 'smart', 'recent'
    )),
    tags TEXT[] DEFAULT '{}',

    -- Pinned for quick access
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    pin_order INTEGER DEFAULT 0,

    -- Usage tracking
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    last_result_count INTEGER,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 2: TEAM SHARING
-- ============================================================================

-- Create table for team sharing of saved searches
CREATE TABLE IF NOT EXISTS saved_search_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,

    -- Share target (can be user, team, or organization-wide)
    share_type TEXT NOT NULL CHECK (share_type IN ('user', 'team', 'organization', 'public')),
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_team_id UUID,  -- Reference to teams table if exists

    -- Permissions
    permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),

    -- Share metadata
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    message TEXT,  -- Optional message when sharing

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Optional expiration for temporary shares

    -- Constraints
    CONSTRAINT unique_user_share UNIQUE (saved_search_id, shared_with_user_id),
    CONSTRAINT share_target_check CHECK (
        (share_type = 'user' AND shared_with_user_id IS NOT NULL) OR
        (share_type = 'team' AND shared_with_team_id IS NOT NULL) OR
        (share_type IN ('organization', 'public') AND shared_with_user_id IS NULL AND shared_with_team_id IS NULL)
    )
);

-- ============================================================================
-- PART 3: AUTOMATIC ALERTS
-- ============================================================================

-- Create table for search alerts
CREATE TABLE IF NOT EXISTS saved_search_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Alert configuration
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN (
        'realtime', 'hourly', 'daily', 'weekly', 'monthly'
    )),

    -- Notification channels
    notify_in_app BOOLEAN NOT NULL DEFAULT true,
    notify_email BOOLEAN NOT NULL DEFAULT false,
    notify_push BOOLEAN NOT NULL DEFAULT false,

    -- Alert conditions
    trigger_on TEXT NOT NULL DEFAULT 'new_results' CHECK (trigger_on IN (
        'new_results',      -- Alert when new items match
        'result_changes',   -- Alert when result count changes
        'threshold_reached' -- Alert when result count exceeds threshold
    )),
    threshold_count INTEGER,  -- For threshold_reached trigger

    -- Tracking
    last_check_at TIMESTAMPTZ,
    last_alert_at TIMESTAMPTZ,
    last_result_count INTEGER,
    last_result_ids UUID[],  -- Track which items we've already seen

    -- Alert delivery tracking
    alert_count INTEGER NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One alert config per user per saved search
    CONSTRAINT unique_user_search_alert UNIQUE (saved_search_id, user_id)
);

-- Create table for alert history/log
CREATE TABLE IF NOT EXISTS saved_search_alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES saved_search_alerts(id) ON DELETE CASCADE,

    -- Alert details
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trigger_reason TEXT NOT NULL,
    new_result_count INTEGER NOT NULL,
    previous_result_count INTEGER,
    new_item_ids UUID[],

    -- Delivery status
    delivered_in_app BOOLEAN DEFAULT false,
    delivered_email BOOLEAN DEFAULT false,
    delivered_push BOOLEAN DEFAULT false,

    -- Read status
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

-- ============================================================================
-- PART 4: SMART FILTERS (PREDEFINED)
-- ============================================================================

-- Add smart filter presets to search_templates
INSERT INTO search_templates (name_en, name_ar, description_en, description_ar, icon, color, category, template_definition, is_system, is_public)
VALUES
-- Workflow-based smart filters
(
    'My Active Tasks',
    'مهامي النشطة',
    'Work items assigned to you that are in progress',
    'عناصر العمل المخصصة لك والتي قيد التنفيذ',
    'user',
    'blue',
    'system',
    '{"entity_types": ["dossier", "engagement"], "conditions": [{"field_name": "assigned_to", "operator": "equals", "value": "current_user"}], "status": ["active", "in_progress"], "sort_by": "date", "sort_order": "desc"}'::jsonb,
    true,
    true
),
(
    'Pending Approvals',
    'في انتظار الموافقة',
    'Items waiting for your approval',
    'العناصر التي تنتظر موافقتك',
    'clock',
    'orange',
    'system',
    '{"entity_types": ["dossier", "position"], "conditions": [{"field_name": "status", "operator": "equals", "value": "pending_approval"}, {"field_name": "approver", "operator": "equals", "value": "current_user"}], "sort_by": "date", "sort_order": "asc"}'::jsonb,
    true,
    true
),
(
    'Recently Modified',
    'المعدلة مؤخراً',
    'Items modified in the last 24 hours',
    'العناصر المعدلة في آخر 24 ساعة',
    'history',
    'teal',
    'system',
    '{"entity_types": ["dossier", "document", "engagement"], "date_range": {"preset": "today"}, "sort_by": "date", "sort_order": "desc"}'::jsonb,
    true,
    true
),
-- Content-based smart filters
(
    'Upcoming Deadlines',
    'المواعيد النهائية القادمة',
    'Items with deadlines in the next 7 days',
    'العناصر ذات المواعيد النهائية في الأيام السبعة القادمة',
    'calendar',
    'red',
    'system',
    '{"entity_types": ["engagement", "dossier"], "date_range": {"preset": "next_7_days"}, "conditions": [{"field_name": "deadline", "operator": "is_not_null", "value": true}], "sort_by": "date", "sort_order": "asc"}'::jsonb,
    true,
    true
),
(
    'Unread Documents',
    'المستندات غير المقروءة',
    'Documents you haven''t viewed yet',
    'المستندات التي لم تطلع عليها بعد',
    'file',
    'indigo',
    'system',
    '{"entity_types": ["document"], "conditions": [{"field_name": "viewed_by_current_user", "operator": "equals", "value": false}], "sort_by": "date", "sort_order": "desc"}'::jsonb,
    true,
    true
),
-- Geographic smart filters
(
    'Middle East Region',
    'منطقة الشرق الأوسط',
    'Items related to Middle East countries',
    'العناصر المتعلقة بدول الشرق الأوسط',
    'globe',
    'green',
    'system',
    '{"entity_types": ["dossier", "engagement"], "conditions": [{"field_name": "region", "operator": "in", "value": ["middle_east", "gcc"]}], "sort_by": "title", "sort_order": "asc"}'::jsonb,
    true,
    true
),
-- Organization-based smart filters
(
    'UN Agencies',
    'وكالات الأمم المتحدة',
    'Items related to United Nations organizations',
    'العناصر المتعلقة بمنظمات الأمم المتحدة',
    'building',
    'blue',
    'system',
    '{"entity_types": ["dossier", "engagement"], "conditions": [{"field_name": "organization_type", "operator": "equals", "value": "un_agency"}], "sort_by": "title", "sort_order": "asc"}'::jsonb,
    true,
    true
),
(
    'Bilateral Relations',
    'العلاقات الثنائية',
    'Bilateral engagement dossiers',
    'ملفات المشاركة الثنائية',
    'users',
    'purple',
    'system',
    '{"entity_types": ["dossier"], "conditions": [{"field_name": "type", "operator": "equals", "value": "bilateral"}], "sort_by": "date", "sort_order": "desc"}'::jsonb,
    true,
    true
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: INDEXES
-- ============================================================================

-- Indexes for saved_searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_category ON saved_searches(category);
CREATE INDEX IF NOT EXISTS idx_saved_searches_pinned ON saved_searches(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_use_count ON saved_searches(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_last_used ON saved_searches(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_saved_searches_tags ON saved_searches USING gin(tags);

-- Indexes for saved_search_shares
CREATE INDEX IF NOT EXISTS idx_saved_search_shares_search_id ON saved_search_shares(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_shares_user ON saved_search_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_shares_team ON saved_search_shares(shared_with_team_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_shares_type ON saved_search_shares(share_type);
CREATE INDEX IF NOT EXISTS idx_saved_search_shares_expires ON saved_search_shares(expires_at) WHERE expires_at IS NOT NULL;

-- Indexes for saved_search_alerts
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_search_id ON saved_search_alerts(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_user_id ON saved_search_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_enabled ON saved_search_alerts(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_frequency ON saved_search_alerts(frequency);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_last_check ON saved_search_alerts(last_check_at);

-- Indexes for alert history
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON saved_search_alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON saved_search_alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unread ON saved_search_alert_history(alert_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- PART 6: TRIGGERS
-- ============================================================================

-- Trigger for updated_at on saved_searches
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at();

-- Trigger for updated_at on saved_search_alerts
CREATE TRIGGER trigger_update_saved_search_alerts_updated_at
    BEFORE UPDATE ON saved_search_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at();

-- ============================================================================
-- PART 7: RPC FUNCTIONS
-- ============================================================================

-- Function: Increment saved search use count
CREATE OR REPLACE FUNCTION increment_saved_search_use_count(p_search_id UUID, p_result_count INTEGER DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE saved_searches
    SET
        use_count = use_count + 1,
        last_used_at = NOW(),
        last_result_count = COALESCE(p_result_count, last_result_count)
    WHERE id = p_search_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's accessible saved searches (owned + shared with them)
CREATE OR REPLACE FUNCTION get_accessible_saved_searches(
    p_user_id UUID,
    p_category TEXT DEFAULT NULL,
    p_include_shared BOOLEAN DEFAULT true,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name_en TEXT,
    name_ar TEXT,
    description_en TEXT,
    description_ar TEXT,
    icon TEXT,
    color TEXT,
    search_definition JSONB,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN,
    pin_order INTEGER,
    use_count INTEGER,
    last_used_at TIMESTAMPTZ,
    last_result_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_shared BOOLEAN,
    shared_permission TEXT,
    shared_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ss.id,
        ss.user_id,
        ss.name_en,
        ss.name_ar,
        ss.description_en,
        ss.description_ar,
        ss.icon,
        ss.color,
        ss.search_definition,
        ss.category,
        ss.tags,
        ss.is_pinned,
        ss.pin_order,
        ss.use_count,
        ss.last_used_at,
        ss.last_result_count,
        ss.created_at,
        ss.updated_at,
        (ss.user_id != p_user_id)::boolean as is_shared,
        sss.permission as shared_permission,
        u.name as shared_by_name
    FROM saved_searches ss
    LEFT JOIN saved_search_shares sss ON sss.saved_search_id = ss.id
        AND (sss.shared_with_user_id = p_user_id OR sss.share_type IN ('organization', 'public'))
        AND (sss.expires_at IS NULL OR sss.expires_at > NOW())
    LEFT JOIN users u ON u.id = sss.shared_by
    WHERE
        -- User owns the search
        ss.user_id = p_user_id
        -- Or search is shared with user
        OR (p_include_shared AND sss.id IS NOT NULL)
    -- Category filter
    AND (p_category IS NULL OR ss.category = p_category)
    ORDER BY
        ss.is_pinned DESC,
        ss.pin_order ASC,
        ss.last_used_at DESC NULLS LAST,
        ss.use_count DESC,
        ss.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Check if user can access a saved search
CREATE OR REPLACE FUNCTION can_access_saved_search(p_user_id UUID, p_search_id UUID)
RETURNS TABLE (
    can_access BOOLEAN,
    permission TEXT
) AS $$
DECLARE
    v_owner_id UUID;
    v_share_permission TEXT;
BEGIN
    -- Check if user owns the search
    SELECT user_id INTO v_owner_id
    FROM saved_searches
    WHERE id = p_search_id;

    IF v_owner_id = p_user_id THEN
        RETURN QUERY SELECT true, 'admin'::text;
        RETURN;
    END IF;

    -- Check if search is shared with user
    SELECT permission INTO v_share_permission
    FROM saved_search_shares
    WHERE saved_search_id = p_search_id
        AND (
            shared_with_user_id = p_user_id
            OR share_type IN ('organization', 'public')
        )
        AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY
        CASE permission
            WHEN 'admin' THEN 1
            WHEN 'edit' THEN 2
            WHEN 'view' THEN 3
        END
    LIMIT 1;

    IF v_share_permission IS NOT NULL THEN
        RETURN QUERY SELECT true, v_share_permission;
        RETURN;
    END IF;

    RETURN QUERY SELECT false, NULL::text;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get pending alerts for processing
CREATE OR REPLACE FUNCTION get_pending_alerts(p_frequency TEXT DEFAULT NULL)
RETURNS TABLE (
    alert_id UUID,
    saved_search_id UUID,
    user_id UUID,
    search_definition JSONB,
    last_check_at TIMESTAMPTZ,
    last_result_ids UUID[],
    notify_in_app BOOLEAN,
    notify_email BOOLEAN,
    notify_push BOOLEAN,
    trigger_on TEXT,
    threshold_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id as alert_id,
        a.saved_search_id,
        a.user_id,
        ss.search_definition,
        a.last_check_at,
        a.last_result_ids,
        a.notify_in_app,
        a.notify_email,
        a.notify_push,
        a.trigger_on,
        a.threshold_count
    FROM saved_search_alerts a
    JOIN saved_searches ss ON ss.id = a.saved_search_id
    WHERE
        a.is_enabled = true
        AND (p_frequency IS NULL OR a.frequency = p_frequency)
        AND (
            a.last_check_at IS NULL
            OR (a.frequency = 'realtime')
            OR (a.frequency = 'hourly' AND a.last_check_at < NOW() - INTERVAL '1 hour')
            OR (a.frequency = 'daily' AND a.last_check_at < NOW() - INTERVAL '1 day')
            OR (a.frequency = 'weekly' AND a.last_check_at < NOW() - INTERVAL '1 week')
            OR (a.frequency = 'monthly' AND a.last_check_at < NOW() - INTERVAL '1 month')
        )
    ORDER BY a.last_check_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Record alert trigger
CREATE OR REPLACE FUNCTION record_alert_trigger(
    p_alert_id UUID,
    p_trigger_reason TEXT,
    p_new_result_count INTEGER,
    p_new_item_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
    v_previous_count INTEGER;
BEGIN
    -- Get previous count
    SELECT last_result_count INTO v_previous_count
    FROM saved_search_alerts
    WHERE id = p_alert_id;

    -- Insert history record
    INSERT INTO saved_search_alert_history (
        alert_id,
        trigger_reason,
        new_result_count,
        previous_result_count,
        new_item_ids
    )
    VALUES (
        p_alert_id,
        p_trigger_reason,
        p_new_result_count,
        v_previous_count,
        p_new_item_ids
    )
    RETURNING id INTO v_history_id;

    -- Update alert
    UPDATE saved_search_alerts
    SET
        last_check_at = NOW(),
        last_alert_at = NOW(),
        last_result_count = p_new_result_count,
        last_result_ids = COALESCE(last_result_ids, '{}') || p_new_item_ids,
        alert_count = alert_count + 1
    WHERE id = p_alert_id;

    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_alert_history ENABLE ROW LEVEL SECURITY;

-- Policies for saved_searches
CREATE POLICY "Users can view their own saved searches"
    ON saved_searches FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view searches shared with them"
    ON saved_searches FOR SELECT
    USING (
        id IN (
            SELECT saved_search_id FROM saved_search_shares
            WHERE (shared_with_user_id = auth.uid() OR share_type IN ('organization', 'public'))
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Users can insert their own saved searches"
    ON saved_searches FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved searches"
    ON saved_searches FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved searches"
    ON saved_searches FOR DELETE
    USING (user_id = auth.uid());

-- Policies for saved_search_shares
CREATE POLICY "Users can view shares of their searches"
    ON saved_search_shares FOR SELECT
    USING (
        saved_search_id IN (SELECT id FROM saved_searches WHERE user_id = auth.uid())
        OR shared_with_user_id = auth.uid()
        OR share_type IN ('organization', 'public')
    );

CREATE POLICY "Users can share their own searches"
    ON saved_search_shares FOR INSERT
    WITH CHECK (
        saved_search_id IN (SELECT id FROM saved_searches WHERE user_id = auth.uid())
        AND shared_by = auth.uid()
    );

CREATE POLICY "Users can update shares of their searches"
    ON saved_search_shares FOR UPDATE
    USING (
        saved_search_id IN (SELECT id FROM saved_searches WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete shares of their searches"
    ON saved_search_shares FOR DELETE
    USING (
        saved_search_id IN (SELECT id FROM saved_searches WHERE user_id = auth.uid())
    );

-- Policies for saved_search_alerts
CREATE POLICY "Users can view their own alerts"
    ON saved_search_alerts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create alerts for accessible searches"
    ON saved_search_alerts FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM can_access_saved_search(auth.uid(), saved_search_id)
            WHERE can_access = true
        )
    );

CREATE POLICY "Users can update their own alerts"
    ON saved_search_alerts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own alerts"
    ON saved_search_alerts FOR DELETE
    USING (user_id = auth.uid());

-- Policies for alert history
CREATE POLICY "Users can view history of their alerts"
    ON saved_search_alert_history FOR SELECT
    USING (
        alert_id IN (SELECT id FROM saved_search_alerts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their alert history (mark as read)"
    ON saved_search_alert_history FOR UPDATE
    USING (
        alert_id IN (SELECT id FROM saved_search_alerts WHERE user_id = auth.uid())
    );

-- ============================================================================
-- PART 9: COMMENTS
-- ============================================================================

COMMENT ON TABLE saved_searches IS 'User-saved search queries with complex filters that can be shared and have alerts';
COMMENT ON TABLE saved_search_shares IS 'Team sharing of saved searches with permission levels';
COMMENT ON TABLE saved_search_alerts IS 'Automatic alerts configuration for saved searches';
COMMENT ON TABLE saved_search_alert_history IS 'History of triggered alerts for tracking and notification';

COMMENT ON FUNCTION increment_saved_search_use_count IS 'Increment usage counter when a saved search is executed';
COMMENT ON FUNCTION get_accessible_saved_searches IS 'Get all saved searches accessible to a user (owned + shared)';
COMMENT ON FUNCTION can_access_saved_search IS 'Check if a user can access a specific saved search and with what permission';
COMMENT ON FUNCTION get_pending_alerts IS 'Get alerts that need to be checked based on their frequency';
COMMENT ON FUNCTION record_alert_trigger IS 'Record an alert trigger and update alert state';
