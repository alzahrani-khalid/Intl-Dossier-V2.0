-- Migration: Slack and Teams Bot Integrations
-- Description: Tables for managing Slack and Teams bot integrations including
--              workspace connections, channel mappings, user links, and notification delivery

-- =====================================================
-- ENUMS
-- =====================================================

-- Bot platform types
CREATE TYPE bot_platform AS ENUM ('slack', 'teams');

-- Bot connection status
CREATE TYPE bot_connection_status AS ENUM ('pending', 'active', 'revoked', 'expired');

-- Bot command types
CREATE TYPE bot_command_type AS ENUM (
    'search',           -- Search entities
    'create',           -- Create entity
    'briefing',         -- Daily briefing
    'status',           -- Check status
    'subscribe',        -- Subscribe to notifications
    'unsubscribe',      -- Unsubscribe from notifications
    'help'              -- Help/commands list
);

-- =====================================================
-- TABLES
-- =====================================================

-- Workspace/Team connections (Slack workspaces or Teams tenants)
CREATE TABLE bot_workspace_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform bot_platform NOT NULL,

    -- Slack workspace info
    slack_team_id TEXT,
    slack_team_name TEXT,
    slack_access_token TEXT,  -- Encrypted bot token
    slack_bot_user_id TEXT,
    slack_app_id TEXT,

    -- Teams tenant info
    teams_tenant_id TEXT,
    teams_team_id TEXT,
    teams_team_name TEXT,
    teams_service_url TEXT,
    teams_bot_id TEXT,

    -- Connection metadata
    status bot_connection_status DEFAULT 'pending',
    connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    connected_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    scopes TEXT[],  -- OAuth scopes granted

    -- Settings
    default_language TEXT DEFAULT 'en',
    notification_enabled BOOLEAN DEFAULT true,
    daily_briefing_enabled BOOLEAN DEFAULT false,
    daily_briefing_time TEXT DEFAULT '08:00',  -- HH:MM format
    daily_briefing_timezone TEXT DEFAULT 'UTC',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraints
    CONSTRAINT unique_slack_workspace UNIQUE (slack_team_id),
    CONSTRAINT unique_teams_tenant UNIQUE (teams_tenant_id, teams_team_id),
    CONSTRAINT platform_specific_fields CHECK (
        (platform = 'slack' AND slack_team_id IS NOT NULL) OR
        (platform = 'teams' AND teams_tenant_id IS NOT NULL)
    )
);

-- User-bot account links (connects app users to Slack/Teams users)
CREATE TABLE bot_user_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES bot_workspace_connections(id) ON DELETE CASCADE,
    platform bot_platform NOT NULL,

    -- Slack user info
    slack_user_id TEXT,
    slack_user_name TEXT,
    slack_display_name TEXT,

    -- Teams user info
    teams_user_id TEXT,
    teams_user_principal_name TEXT,
    teams_display_name TEXT,
    teams_aad_object_id TEXT,  -- Azure AD object ID

    -- Link status
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verification_code TEXT,
    verification_expires_at TIMESTAMPTZ,

    -- Preferences
    dm_notifications_enabled BOOLEAN DEFAULT true,
    mention_notifications_enabled BOOLEAN DEFAULT true,
    daily_briefing_dm BOOLEAN DEFAULT true,
    language_preference TEXT,  -- Override workspace default

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraints
    CONSTRAINT unique_user_workspace UNIQUE (user_id, workspace_id),
    CONSTRAINT unique_slack_user UNIQUE (workspace_id, slack_user_id),
    CONSTRAINT unique_teams_user UNIQUE (workspace_id, teams_user_id)
);

-- Channel subscriptions (which channels receive notifications)
CREATE TABLE bot_channel_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES bot_workspace_connections(id) ON DELETE CASCADE,
    platform bot_platform NOT NULL,

    -- Channel info
    channel_id TEXT NOT NULL,
    channel_name TEXT,
    channel_type TEXT DEFAULT 'channel',  -- 'channel', 'dm', 'group'

    -- Subscription settings
    is_active BOOLEAN DEFAULT true,

    -- What notifications to receive
    notify_assignments BOOLEAN DEFAULT true,
    notify_deadlines BOOLEAN DEFAULT true,
    notify_calendar BOOLEAN DEFAULT true,
    notify_signals BOOLEAN DEFAULT true,
    notify_intake BOOLEAN DEFAULT true,
    notify_workflow BOOLEAN DEFAULT true,
    notify_mentions BOOLEAN DEFAULT false,  -- Typically user-specific
    notify_system BOOLEAN DEFAULT false,

    -- Filters
    filter_dossier_ids UUID[],  -- Only notify for specific dossiers
    filter_entity_types TEXT[],  -- Only notify for specific entity types
    filter_priorities TEXT[],   -- Only notify for specific priorities

    -- Created by
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint
    CONSTRAINT unique_channel_subscription UNIQUE (workspace_id, channel_id)
);

-- Bot command logs (audit trail for slash commands)
CREATE TABLE bot_command_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES bot_workspace_connections(id) ON DELETE SET NULL,
    user_link_id UUID REFERENCES bot_user_links(id) ON DELETE SET NULL,
    platform bot_platform NOT NULL,

    -- Command details
    command_type bot_command_type NOT NULL,
    command_text TEXT,  -- Full command text
    command_args JSONB DEFAULT '{}'::jsonb,  -- Parsed arguments

    -- Execution context
    channel_id TEXT,
    channel_name TEXT,

    -- Platform-specific user IDs (for unlinked users)
    slack_user_id TEXT,
    teams_user_id TEXT,

    -- Response
    response_type TEXT,  -- 'success', 'error', 'partial'
    response_message TEXT,
    response_data JSONB,

    -- Timing
    executed_at TIMESTAMPTZ DEFAULT now(),
    response_time_ms INTEGER,

    -- Error tracking
    error_code TEXT,
    error_details TEXT
);

-- Bot notification delivery logs
CREATE TABLE bot_notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES bot_workspace_connections(id) ON DELETE SET NULL,
    user_link_id UUID REFERENCES bot_user_links(id) ON DELETE SET NULL,
    channel_subscription_id UUID REFERENCES bot_channel_subscriptions(id) ON DELETE SET NULL,
    platform bot_platform NOT NULL,

    -- Delivery target
    target_type TEXT NOT NULL,  -- 'dm', 'channel'
    target_id TEXT NOT NULL,    -- Channel or user ID
    target_name TEXT,

    -- Message content
    message_type TEXT,  -- 'notification', 'briefing', 'alert'
    message_text TEXT,
    message_blocks JSONB,  -- Slack blocks or Teams adaptive card

    -- Delivery status
    status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'failed', 'rate_limited'
    sent_at TIMESTAMPTZ,

    -- Platform response
    platform_message_id TEXT,  -- Message ID from Slack/Teams
    platform_response JSONB,

    -- Error handling
    error_code TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily briefing schedules and logs
CREATE TABLE bot_briefing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES bot_workspace_connections(id) ON DELETE CASCADE,
    user_link_id UUID REFERENCES bot_user_links(id) ON DELETE CASCADE,
    channel_subscription_id UUID REFERENCES bot_channel_subscriptions(id) ON DELETE CASCADE,
    platform bot_platform NOT NULL,

    -- Schedule settings
    is_active BOOLEAN DEFAULT true,
    schedule_time TEXT NOT NULL DEFAULT '08:00',  -- HH:MM format
    timezone TEXT NOT NULL DEFAULT 'UTC',
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5],  -- 0=Sun, 1=Mon, etc.

    -- Content settings
    include_assignments BOOLEAN DEFAULT true,
    include_deadlines BOOLEAN DEFAULT true,
    include_calendar BOOLEAN DEFAULT true,
    include_watchlist BOOLEAN DEFAULT true,
    include_unresolved_tickets BOOLEAN DEFAULT false,
    include_commitments BOOLEAN DEFAULT true,
    max_items_per_section INTEGER DEFAULT 5,
    deadline_lookahead_days INTEGER DEFAULT 7,

    -- Delivery target
    target_type TEXT NOT NULL,  -- 'dm', 'channel'
    target_id TEXT NOT NULL,

    -- Last execution
    last_sent_at TIMESTAMPTZ,
    last_status TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Only one schedule per target
    CONSTRAINT unique_briefing_schedule UNIQUE (workspace_id, target_type, target_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Workspace connections
CREATE INDEX idx_bot_workspace_platform ON bot_workspace_connections(platform);
CREATE INDEX idx_bot_workspace_status ON bot_workspace_connections(status);
CREATE INDEX idx_bot_workspace_slack_team ON bot_workspace_connections(slack_team_id) WHERE slack_team_id IS NOT NULL;
CREATE INDEX idx_bot_workspace_teams_tenant ON bot_workspace_connections(teams_tenant_id) WHERE teams_tenant_id IS NOT NULL;

-- User links
CREATE INDEX idx_bot_user_links_user ON bot_user_links(user_id);
CREATE INDEX idx_bot_user_links_workspace ON bot_user_links(workspace_id);
CREATE INDEX idx_bot_user_links_slack_user ON bot_user_links(slack_user_id) WHERE slack_user_id IS NOT NULL;
CREATE INDEX idx_bot_user_links_teams_user ON bot_user_links(teams_user_id) WHERE teams_user_id IS NOT NULL;

-- Channel subscriptions
CREATE INDEX idx_bot_channel_subs_workspace ON bot_channel_subscriptions(workspace_id);
CREATE INDEX idx_bot_channel_subs_active ON bot_channel_subscriptions(is_active) WHERE is_active = true;

-- Command logs
CREATE INDEX idx_bot_command_logs_workspace ON bot_command_logs(workspace_id);
CREATE INDEX idx_bot_command_logs_user ON bot_command_logs(user_link_id);
CREATE INDEX idx_bot_command_logs_type ON bot_command_logs(command_type);
CREATE INDEX idx_bot_command_logs_executed ON bot_command_logs(executed_at);

-- Notification deliveries
CREATE INDEX idx_bot_notif_deliveries_notification ON bot_notification_deliveries(notification_id);
CREATE INDEX idx_bot_notif_deliveries_workspace ON bot_notification_deliveries(workspace_id);
CREATE INDEX idx_bot_notif_deliveries_status ON bot_notification_deliveries(status);
CREATE INDEX idx_bot_notif_deliveries_pending ON bot_notification_deliveries(next_retry_at)
    WHERE status IN ('pending', 'rate_limited');

-- Briefing schedules
CREATE INDEX idx_bot_briefing_workspace ON bot_briefing_schedules(workspace_id);
CREATE INDEX idx_bot_briefing_active ON bot_briefing_schedules(is_active, schedule_time) WHERE is_active = true;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE bot_workspace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_briefing_schedules ENABLE ROW LEVEL SECURITY;

-- Workspace connections: Only admins can manage, users can view if linked
CREATE POLICY "Admins can manage workspace connections"
    ON bot_workspace_connections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

CREATE POLICY "Users can view linked workspaces"
    ON bot_workspace_connections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bot_user_links bul
            WHERE bul.workspace_id = bot_workspace_connections.id
            AND bul.user_id = auth.uid()
        )
    );

-- User links: Users can manage their own links
CREATE POLICY "Users can manage own bot links"
    ON bot_user_links FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Channel subscriptions: Linked users can view, admins can manage
CREATE POLICY "Users can view channel subscriptions"
    ON bot_channel_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bot_user_links bul
            WHERE bul.workspace_id = bot_channel_subscriptions.workspace_id
            AND bul.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage channel subscriptions"
    ON bot_channel_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- Command logs: Users can view their own commands
CREATE POLICY "Users can view own command logs"
    ON bot_command_logs FOR SELECT
    USING (
        user_link_id IN (
            SELECT id FROM bot_user_links WHERE user_id = auth.uid()
        )
    );

-- Notification deliveries: Users can view their own deliveries
CREATE POLICY "Users can view own notification deliveries"
    ON bot_notification_deliveries FOR SELECT
    USING (
        user_link_id IN (
            SELECT id FROM bot_user_links WHERE user_id = auth.uid()
        )
    );

-- Briefing schedules: Users can manage schedules for their links
CREATE POLICY "Users can manage own briefing schedules"
    ON bot_briefing_schedules FOR ALL
    USING (
        user_link_id IN (
            SELECT id FROM bot_user_links WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_link_id IN (
            SELECT id FROM bot_user_links WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_bot_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bot_workspace_updated_at
    BEFORE UPDATE ON bot_workspace_connections
    FOR EACH ROW EXECUTE FUNCTION update_bot_tables_updated_at();

CREATE TRIGGER trigger_bot_user_links_updated_at
    BEFORE UPDATE ON bot_user_links
    FOR EACH ROW EXECUTE FUNCTION update_bot_tables_updated_at();

CREATE TRIGGER trigger_bot_channel_subs_updated_at
    BEFORE UPDATE ON bot_channel_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_bot_tables_updated_at();

CREATE TRIGGER trigger_bot_briefing_updated_at
    BEFORE UPDATE ON bot_briefing_schedules
    FOR EACH ROW EXECUTE FUNCTION update_bot_tables_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get user's bot links with workspace info
CREATE OR REPLACE FUNCTION get_user_bot_links(p_user_id UUID)
RETURNS TABLE (
    link_id UUID,
    platform bot_platform,
    workspace_name TEXT,
    platform_username TEXT,
    is_verified BOOLEAN,
    dm_notifications_enabled BOOLEAN,
    daily_briefing_dm BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bul.id,
        bul.platform,
        COALESCE(bwc.slack_team_name, bwc.teams_team_name) AS workspace_name,
        COALESCE(bul.slack_display_name, bul.teams_display_name) AS platform_username,
        bul.is_verified,
        bul.dm_notifications_enabled,
        bul.daily_briefing_dm,
        bul.created_at
    FROM bot_user_links bul
    JOIN bot_workspace_connections bwc ON bul.workspace_id = bwc.id
    WHERE bul.user_id = p_user_id
    AND bwc.status = 'active'
    ORDER BY bul.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find user by Slack ID
CREATE OR REPLACE FUNCTION find_user_by_slack_id(
    p_slack_team_id TEXT,
    p_slack_user_id TEXT
)
RETURNS TABLE (
    user_id UUID,
    link_id UUID,
    workspace_id UUID,
    is_verified BOOLEAN,
    language_preference TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bul.user_id,
        bul.id AS link_id,
        bul.workspace_id,
        bul.is_verified,
        COALESCE(bul.language_preference, bwc.default_language) AS language_preference
    FROM bot_user_links bul
    JOIN bot_workspace_connections bwc ON bul.workspace_id = bwc.id
    WHERE bwc.slack_team_id = p_slack_team_id
    AND bul.slack_user_id = p_slack_user_id
    AND bwc.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find user by Teams ID
CREATE OR REPLACE FUNCTION find_user_by_teams_id(
    p_teams_tenant_id TEXT,
    p_teams_user_id TEXT
)
RETURNS TABLE (
    user_id UUID,
    link_id UUID,
    workspace_id UUID,
    is_verified BOOLEAN,
    language_preference TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bul.user_id,
        bul.id AS link_id,
        bul.workspace_id,
        bul.is_verified,
        COALESCE(bul.language_preference, bwc.default_language) AS language_preference
    FROM bot_user_links bul
    JOIN bot_workspace_connections bwc ON bul.workspace_id = bwc.id
    WHERE bwc.teams_tenant_id = p_teams_tenant_id
    AND bul.teams_user_id = p_teams_user_id
    AND bwc.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get channels to notify for a notification
CREATE OR REPLACE FUNCTION get_notification_channels(
    p_notification_id UUID,
    p_category TEXT,
    p_source_type TEXT,
    p_source_id UUID
)
RETURNS TABLE (
    workspace_id UUID,
    platform bot_platform,
    channel_id TEXT,
    channel_name TEXT
) AS $$
DECLARE
    v_category_column TEXT;
BEGIN
    -- Map category to column name
    v_category_column := CASE p_category
        WHEN 'assignments' THEN 'notify_assignments'
        WHEN 'deadlines' THEN 'notify_deadlines'
        WHEN 'calendar' THEN 'notify_calendar'
        WHEN 'signals' THEN 'notify_signals'
        WHEN 'intake' THEN 'notify_intake'
        WHEN 'workflow' THEN 'notify_workflow'
        WHEN 'mentions' THEN 'notify_mentions'
        WHEN 'system' THEN 'notify_system'
        ELSE 'notify_system'
    END;

    RETURN QUERY EXECUTE format('
        SELECT
            bcs.workspace_id,
            bcs.platform,
            bcs.channel_id,
            bcs.channel_name
        FROM bot_channel_subscriptions bcs
        JOIN bot_workspace_connections bwc ON bcs.workspace_id = bwc.id
        WHERE bcs.is_active = true
        AND bwc.status = ''active''
        AND bwc.notification_enabled = true
        AND bcs.%I = true
        AND (
            bcs.filter_dossier_ids IS NULL
            OR bcs.filter_dossier_ids = ''{}''
            OR $1 = ANY(bcs.filter_dossier_ids)
        )
        AND (
            bcs.filter_priorities IS NULL
            OR bcs.filter_priorities = ''{}''
        )', v_category_column)
    USING p_source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log a bot command
CREATE OR REPLACE FUNCTION log_bot_command(
    p_workspace_id UUID,
    p_user_link_id UUID,
    p_platform bot_platform,
    p_command_type bot_command_type,
    p_command_text TEXT,
    p_command_args JSONB,
    p_channel_id TEXT,
    p_channel_name TEXT,
    p_slack_user_id TEXT DEFAULT NULL,
    p_teams_user_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO bot_command_logs (
        workspace_id, user_link_id, platform, command_type,
        command_text, command_args, channel_id, channel_name,
        slack_user_id, teams_user_id
    ) VALUES (
        p_workspace_id, p_user_link_id, p_platform, p_command_type,
        p_command_text, p_command_args, p_channel_id, p_channel_name,
        p_slack_user_id, p_teams_user_id
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update command log with response
CREATE OR REPLACE FUNCTION update_bot_command_response(
    p_log_id UUID,
    p_response_type TEXT,
    p_response_message TEXT,
    p_response_data JSONB,
    p_response_time_ms INTEGER,
    p_error_code TEXT DEFAULT NULL,
    p_error_details TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE bot_command_logs
    SET
        response_type = p_response_type,
        response_message = p_response_message,
        response_data = p_response_data,
        response_time_ms = p_response_time_ms,
        error_code = p_error_code,
        error_details = p_error_details
    WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Queue notification delivery to bots
CREATE OR REPLACE FUNCTION queue_bot_notification_delivery(
    p_notification_id UUID,
    p_workspace_id UUID,
    p_user_link_id UUID,
    p_channel_subscription_id UUID,
    p_platform bot_platform,
    p_target_type TEXT,
    p_target_id TEXT,
    p_target_name TEXT,
    p_message_type TEXT,
    p_message_text TEXT,
    p_message_blocks JSONB
)
RETURNS UUID AS $$
DECLARE
    v_delivery_id UUID;
BEGIN
    INSERT INTO bot_notification_deliveries (
        notification_id, workspace_id, user_link_id, channel_subscription_id,
        platform, target_type, target_id, target_name,
        message_type, message_text, message_blocks
    ) VALUES (
        p_notification_id, p_workspace_id, p_user_link_id, p_channel_subscription_id,
        p_platform, p_target_type, p_target_id, p_target_name,
        p_message_type, p_message_text, p_message_blocks
    )
    RETURNING id INTO v_delivery_id;

    RETURN v_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending notification deliveries
CREATE OR REPLACE FUNCTION get_pending_bot_deliveries(
    p_platform bot_platform DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    delivery_id UUID,
    notification_id UUID,
    workspace_id UUID,
    platform bot_platform,
    target_type TEXT,
    target_id TEXT,
    message_text TEXT,
    message_blocks JSONB,
    retry_count INTEGER,
    slack_access_token TEXT,
    teams_service_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bnd.id AS delivery_id,
        bnd.notification_id,
        bnd.workspace_id,
        bnd.platform,
        bnd.target_type,
        bnd.target_id,
        bnd.message_text,
        bnd.message_blocks,
        bnd.retry_count,
        bwc.slack_access_token,
        bwc.teams_service_url
    FROM bot_notification_deliveries bnd
    JOIN bot_workspace_connections bwc ON bnd.workspace_id = bwc.id
    WHERE bnd.status IN ('pending', 'rate_limited')
    AND (bnd.next_retry_at IS NULL OR bnd.next_retry_at <= now())
    AND (p_platform IS NULL OR bnd.platform = p_platform)
    AND bwc.status = 'active'
    ORDER BY bnd.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get briefings due for sending
CREATE OR REPLACE FUNCTION get_due_bot_briefings()
RETURNS TABLE (
    schedule_id UUID,
    workspace_id UUID,
    user_link_id UUID,
    user_id UUID,
    platform bot_platform,
    target_type TEXT,
    target_id TEXT,
    include_assignments BOOLEAN,
    include_deadlines BOOLEAN,
    include_calendar BOOLEAN,
    include_watchlist BOOLEAN,
    include_commitments BOOLEAN,
    max_items INTEGER,
    deadline_days INTEGER,
    language_preference TEXT,
    slack_access_token TEXT,
    teams_service_url TEXT
) AS $$
DECLARE
    v_current_time TEXT;
    v_current_day INTEGER;
BEGIN
    -- Get current time in HH:MM format and day of week
    v_current_time := to_char(now(), 'HH24:MI');
    v_current_day := EXTRACT(DOW FROM now())::INTEGER;

    RETURN QUERY
    SELECT
        bbs.id AS schedule_id,
        bbs.workspace_id,
        bbs.user_link_id,
        bul.user_id,
        bbs.platform,
        bbs.target_type,
        bbs.target_id,
        bbs.include_assignments,
        bbs.include_deadlines,
        bbs.include_calendar,
        bbs.include_watchlist,
        bbs.include_commitments,
        bbs.max_items_per_section AS max_items,
        bbs.deadline_lookahead_days AS deadline_days,
        COALESCE(bul.language_preference, bwc.default_language) AS language_preference,
        bwc.slack_access_token,
        bwc.teams_service_url
    FROM bot_briefing_schedules bbs
    JOIN bot_workspace_connections bwc ON bbs.workspace_id = bwc.id
    LEFT JOIN bot_user_links bul ON bbs.user_link_id = bul.id
    WHERE bbs.is_active = true
    AND bwc.status = 'active'
    AND bbs.schedule_time = v_current_time
    AND v_current_day = ANY(bbs.days_of_week)
    AND (bbs.last_sent_at IS NULL OR bbs.last_sent_at < now() - interval '23 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE bot_workspace_connections IS 'Stores Slack workspace and Teams tenant connections with OAuth tokens';
COMMENT ON TABLE bot_user_links IS 'Links app users to their Slack/Teams user accounts';
COMMENT ON TABLE bot_channel_subscriptions IS 'Tracks which channels should receive notifications and their preferences';
COMMENT ON TABLE bot_command_logs IS 'Audit log for all slash commands executed through bots';
COMMENT ON TABLE bot_notification_deliveries IS 'Queue and delivery tracking for bot notifications';
COMMENT ON TABLE bot_briefing_schedules IS 'Configures daily briefing delivery schedules';

COMMENT ON FUNCTION get_user_bot_links IS 'Returns all bot platform links for a user with workspace info';
COMMENT ON FUNCTION find_user_by_slack_id IS 'Finds the app user linked to a Slack user in a workspace';
COMMENT ON FUNCTION find_user_by_teams_id IS 'Finds the app user linked to a Teams user in a tenant';
COMMENT ON FUNCTION get_notification_channels IS 'Returns channels that should receive a notification based on category and filters';
COMMENT ON FUNCTION log_bot_command IS 'Creates an audit log entry for a bot command';
COMMENT ON FUNCTION queue_bot_notification_delivery IS 'Queues a notification for delivery to a bot channel or DM';
COMMENT ON FUNCTION get_pending_bot_deliveries IS 'Returns pending notification deliveries for processing';
COMMENT ON FUNCTION get_due_bot_briefings IS 'Returns briefing schedules that are due for sending now';
