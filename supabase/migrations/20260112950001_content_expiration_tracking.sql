-- Migration: Content Expiration Tracking
-- Feature: content-expiration-dates
-- Description: Set expiration dates on policy briefs and dossiers with automated review reminders.
--              Flag outdated content and trigger workflows for content refresh or archival.
-- Author: Claude Code
-- Date: 2026-01-12

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Content freshness status
CREATE TYPE content_freshness_status AS ENUM (
    'current',          -- Content is up-to-date
    'review_pending',   -- Content is approaching expiration, review needed
    'outdated',         -- Content has expired, needs refresh
    'refreshing',       -- Content refresh in progress
    'archived'          -- Content has been archived
);

-- Expiration action type
CREATE TYPE content_expiration_action AS ENUM (
    'notify_owners',        -- Send notification to dossier owners
    'notify_reviewers',     -- Send notification to reviewers
    'mark_outdated',        -- Mark content as outdated
    'archive_content',      -- Archive the content
    'require_review',       -- Require review before continued use
    'trigger_brief_refresh' -- Trigger AI brief regeneration
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Content Expiration Rules Table
-- Configurable rules for when content expires based on entity type
CREATE TABLE IF NOT EXISTS content_expiration_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Rule identification
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    code VARCHAR(100) NOT NULL UNIQUE,

    -- Scope
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('dossier', 'brief', 'ai_brief', 'position')),
    dossier_type VARCHAR(50), -- NULL means applies to all dossier types
    sensitivity_level VARCHAR(20), -- NULL means applies to all sensitivity levels

    -- Expiration timing (in days)
    default_expiration_days INTEGER NOT NULL DEFAULT 365,
    warning_days_before INTEGER NOT NULL DEFAULT 30, -- Days before expiration to start warnings
    critical_days_before INTEGER NOT NULL DEFAULT 7, -- Days before expiration for urgent warnings

    -- Actions on expiration
    on_warning_action content_expiration_action DEFAULT 'notify_owners',
    on_critical_action content_expiration_action DEFAULT 'require_review',
    on_expiration_action content_expiration_action DEFAULT 'mark_outdated',

    -- Auto-actions
    auto_archive_after_days INTEGER, -- NULL = don't auto-archive, >0 = archive N days after expiration
    auto_refresh_briefs BOOLEAN DEFAULT FALSE, -- Auto-trigger brief regeneration on expiration

    -- Rule status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100, -- Lower = higher priority

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Content Expiration Status Table
-- Tracks expiration status for individual content items
CREATE TABLE IF NOT EXISTS content_expiration_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content reference (polymorphic)
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('dossier', 'brief', 'ai_brief', 'position')),
    entity_id UUID NOT NULL,

    -- Expiration rule applied
    rule_id UUID REFERENCES content_expiration_rules(id) ON DELETE SET NULL,

    -- Expiration dates
    expires_at TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    next_review_due TIMESTAMPTZ,

    -- Current status
    freshness_status content_freshness_status DEFAULT 'current' NOT NULL,
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Warning tracking
    warning_sent_at TIMESTAMPTZ,
    critical_warning_sent_at TIMESTAMPTZ,
    expiration_notification_sent_at TIMESTAMPTZ,

    -- Review tracking
    review_requested_by UUID REFERENCES auth.users(id),
    review_requested_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,

    -- Extension tracking
    extension_count INTEGER DEFAULT 0,
    last_extended_by UUID REFERENCES auth.users(id),
    last_extended_at TIMESTAMPTZ,
    extension_reason TEXT,

    -- Refresh tracking (for briefs)
    last_refresh_triggered_at TIMESTAMPTZ,
    refresh_in_progress BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint
    CONSTRAINT unique_entity_expiration UNIQUE (entity_type, entity_id)
);

-- Expiration History Log
-- Tracks all expiration-related events for audit purposes
CREATE TABLE IF NOT EXISTS content_expiration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Entity reference
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    expiration_status_id UUID REFERENCES content_expiration_status(id) ON DELETE SET NULL,

    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created', 'warning_sent', 'critical_warning_sent',
        'expired', 'reviewed', 'extended', 'refreshed',
        'archived', 'restored', 'rule_changed'
    )),

    -- Event details
    old_status content_freshness_status,
    new_status content_freshness_status,
    old_expires_at TIMESTAMPTZ,
    new_expires_at TIMESTAMPTZ,

    -- Actor
    performed_by UUID REFERENCES auth.users(id),
    performed_by_system BOOLEAN DEFAULT FALSE,

    -- Details
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- ADD EXPIRATION FIELDS TO EXISTING TABLES
-- =============================================================================

-- Add expiration fields to dossiers table
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS freshness_status content_freshness_status DEFAULT 'current',
ADD COLUMN IF NOT EXISTS last_content_review_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_content_review_due TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_refresh_enabled BOOLEAN DEFAULT TRUE;

-- Add expiration fields to briefs table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'briefs') THEN
        ALTER TABLE briefs
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS freshness_status content_freshness_status DEFAULT 'current',
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add expiration fields to ai_briefs table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_briefs') THEN
        ALTER TABLE ai_briefs
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS freshness_status content_freshness_status DEFAULT 'current';
    END IF;
END $$;

-- Add expiration fields to positions table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions') THEN
        ALTER TABLE positions
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS freshness_status content_freshness_status DEFAULT 'current',
        ADD COLUMN IF NOT EXISTS last_validity_check_at TIMESTAMPTZ;
    END IF;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Content Expiration Rules
CREATE INDEX idx_expiration_rules_entity_type ON content_expiration_rules(entity_type);
CREATE INDEX idx_expiration_rules_active ON content_expiration_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_expiration_rules_priority ON content_expiration_rules(priority);

-- Content Expiration Status
CREATE INDEX idx_expiration_status_entity ON content_expiration_status(entity_type, entity_id);
CREATE INDEX idx_expiration_status_expires_at ON content_expiration_status(expires_at);
CREATE INDEX idx_expiration_status_freshness ON content_expiration_status(freshness_status);
CREATE INDEX idx_expiration_status_review_due ON content_expiration_status(next_review_due)
    WHERE freshness_status NOT IN ('archived');
CREATE INDEX idx_expiration_status_pending_warnings ON content_expiration_status(expires_at)
    WHERE warning_sent_at IS NULL AND freshness_status = 'current';

-- Dossiers expiration
CREATE INDEX IF NOT EXISTS idx_dossiers_expires_at ON dossiers(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dossiers_freshness ON dossiers(freshness_status);
CREATE INDEX IF NOT EXISTS idx_dossiers_review_due ON dossiers(next_content_review_due)
    WHERE next_content_review_due IS NOT NULL;

-- Expiration History
CREATE INDEX idx_expiration_history_entity ON content_expiration_history(entity_type, entity_id);
CREATE INDEX idx_expiration_history_created_at ON content_expiration_history(created_at DESC);
CREATE INDEX idx_expiration_history_event_type ON content_expiration_history(event_type);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps trigger
CREATE TRIGGER update_content_expiration_rules_updated_at
    BEFORE UPDATE ON content_expiration_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_expiration_status_updated_at
    BEFORE UPDATE ON content_expiration_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get applicable expiration rule for an entity
CREATE OR REPLACE FUNCTION get_content_expiration_rule(
    p_entity_type VARCHAR,
    p_dossier_type VARCHAR DEFAULT NULL,
    p_sensitivity_level VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    rule_id UUID,
    rule_name_en VARCHAR,
    default_expiration_days INTEGER,
    warning_days_before INTEGER,
    critical_days_before INTEGER,
    on_warning_action content_expiration_action,
    on_critical_action content_expiration_action,
    on_expiration_action content_expiration_action,
    auto_archive_after_days INTEGER,
    auto_refresh_briefs BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name_en,
        r.default_expiration_days,
        r.warning_days_before,
        r.critical_days_before,
        r.on_warning_action,
        r.on_critical_action,
        r.on_expiration_action,
        r.auto_archive_after_days,
        r.auto_refresh_briefs
    FROM content_expiration_rules r
    WHERE r.is_active = TRUE
      AND r.entity_type = p_entity_type
      AND (r.dossier_type IS NULL OR r.dossier_type = p_dossier_type)
      AND (r.sensitivity_level IS NULL OR r.sensitivity_level = p_sensitivity_level)
    ORDER BY r.priority ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to set expiration for content
CREATE OR REPLACE FUNCTION set_content_expiration(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_rule_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_rule RECORD;
    v_status_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_next_review TIMESTAMPTZ;
BEGIN
    -- Get rule if not specified
    IF p_rule_id IS NULL THEN
        SELECT * INTO v_rule
        FROM get_content_expiration_rule(p_entity_type);

        IF v_rule IS NULL THEN
            -- Use default 1 year expiration
            v_expires_at := COALESCE(p_expires_at, NOW() + INTERVAL '1 year');
            v_next_review := v_expires_at - INTERVAL '30 days';
        ELSE
            v_expires_at := COALESCE(p_expires_at, NOW() + (v_rule.default_expiration_days || ' days')::INTERVAL);
            v_next_review := v_expires_at - (v_rule.warning_days_before || ' days')::INTERVAL;
        END IF;
    ELSE
        SELECT * INTO v_rule
        FROM content_expiration_rules WHERE id = p_rule_id;

        v_expires_at := COALESCE(p_expires_at, NOW() + (v_rule.default_expiration_days || ' days')::INTERVAL);
        v_next_review := v_expires_at - (v_rule.warning_days_before || ' days')::INTERVAL;
    END IF;

    -- Upsert expiration status
    INSERT INTO content_expiration_status (
        entity_type,
        entity_id,
        rule_id,
        expires_at,
        next_review_due,
        freshness_status,
        last_reviewed_at
    )
    VALUES (
        p_entity_type,
        p_entity_id,
        v_rule.rule_id,
        v_expires_at,
        v_next_review,
        'current',
        NOW()
    )
    ON CONFLICT (entity_type, entity_id)
    DO UPDATE SET
        rule_id = COALESCE(v_rule.rule_id, content_expiration_status.rule_id),
        expires_at = v_expires_at,
        next_review_due = v_next_review,
        updated_at = NOW()
    RETURNING id INTO v_status_id;

    -- Update entity table directly
    IF p_entity_type = 'dossier' THEN
        UPDATE dossiers
        SET expires_at = v_expires_at,
            next_content_review_due = v_next_review,
            freshness_status = 'current',
            last_content_review_at = NOW()
        WHERE id = p_entity_id;
    ELSIF p_entity_type = 'brief' THEN
        UPDATE briefs SET expires_at = v_expires_at WHERE id = p_entity_id;
    ELSIF p_entity_type = 'ai_brief' THEN
        UPDATE ai_briefs SET expires_at = v_expires_at WHERE id = p_entity_id;
    ELSIF p_entity_type = 'position' THEN
        UPDATE positions
        SET expires_at = v_expires_at,
            last_validity_check_at = NOW()
        WHERE id = p_entity_id;
    END IF;

    -- Log history
    INSERT INTO content_expiration_history (
        entity_type, entity_id, expiration_status_id,
        event_type, new_expires_at, new_status,
        performed_by, metadata
    )
    VALUES (
        p_entity_type, p_entity_id, v_status_id,
        'created', v_expires_at, 'current',
        COALESCE(p_user_id, auth.uid()),
        jsonb_build_object('rule_id', v_rule.rule_id, 'rule_name', v_rule.rule_name_en)
    );

    RETURN v_status_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend expiration
CREATE OR REPLACE FUNCTION extend_content_expiration(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_extension_days INTEGER,
    p_reason TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status RECORD;
    v_new_expires_at TIMESTAMPTZ;
    v_performer UUID;
BEGIN
    v_performer := COALESCE(p_user_id, auth.uid());

    -- Get current status
    SELECT * INTO v_status
    FROM content_expiration_status
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Calculate new expiration
    v_new_expires_at := GREATEST(v_status.expires_at, NOW()) + (p_extension_days || ' days')::INTERVAL;

    -- Update status
    UPDATE content_expiration_status
    SET
        expires_at = v_new_expires_at,
        next_review_due = v_new_expires_at - INTERVAL '30 days',
        freshness_status = 'current',
        status_changed_at = NOW(),
        warning_sent_at = NULL,
        critical_warning_sent_at = NULL,
        expiration_notification_sent_at = NULL,
        extension_count = extension_count + 1,
        last_extended_by = v_performer,
        last_extended_at = NOW(),
        extension_reason = p_reason,
        updated_at = NOW()
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    -- Update entity table
    IF p_entity_type = 'dossier' THEN
        UPDATE dossiers
        SET expires_at = v_new_expires_at,
            next_content_review_due = v_new_expires_at - INTERVAL '30 days',
            freshness_status = 'current'
        WHERE id = p_entity_id;
    ELSIF p_entity_type = 'brief' THEN
        UPDATE briefs SET expires_at = v_new_expires_at WHERE id = p_entity_id;
    ELSIF p_entity_type = 'ai_brief' THEN
        UPDATE ai_briefs SET expires_at = v_new_expires_at WHERE id = p_entity_id;
    ELSIF p_entity_type = 'position' THEN
        UPDATE positions SET expires_at = v_new_expires_at WHERE id = p_entity_id;
    END IF;

    -- Log history
    INSERT INTO content_expiration_history (
        entity_type, entity_id, expiration_status_id,
        event_type, old_expires_at, new_expires_at,
        old_status, new_status, performed_by, notes
    )
    VALUES (
        p_entity_type, p_entity_id, v_status.id,
        'extended', v_status.expires_at, v_new_expires_at,
        v_status.freshness_status, 'current', v_performer, p_reason
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark content as reviewed (resets expiration)
CREATE OR REPLACE FUNCTION mark_content_reviewed(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status RECORD;
    v_rule RECORD;
    v_new_expires_at TIMESTAMPTZ;
    v_performer UUID;
BEGIN
    v_performer := COALESCE(p_user_id, auth.uid());

    -- Get current status
    SELECT * INTO v_status
    FROM content_expiration_status
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get rule for new expiration calculation
    IF v_status.rule_id IS NOT NULL THEN
        SELECT * INTO v_rule FROM content_expiration_rules WHERE id = v_status.rule_id;
        v_new_expires_at := NOW() + (v_rule.default_expiration_days || ' days')::INTERVAL;
    ELSE
        v_new_expires_at := NOW() + INTERVAL '1 year';
    END IF;

    -- Update status
    UPDATE content_expiration_status
    SET
        expires_at = v_new_expires_at,
        next_review_due = v_new_expires_at - INTERVAL '30 days',
        freshness_status = 'current',
        status_changed_at = NOW(),
        last_reviewed_at = NOW(),
        reviewed_by = v_performer,
        review_notes = p_notes,
        warning_sent_at = NULL,
        critical_warning_sent_at = NULL,
        expiration_notification_sent_at = NULL,
        review_requested_by = NULL,
        review_requested_at = NULL,
        updated_at = NOW()
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    -- Update entity table
    IF p_entity_type = 'dossier' THEN
        UPDATE dossiers
        SET expires_at = v_new_expires_at,
            next_content_review_due = v_new_expires_at - INTERVAL '30 days',
            freshness_status = 'current',
            last_content_review_at = NOW(),
            last_review_date = NOW()
        WHERE id = p_entity_id;
    ELSIF p_entity_type = 'brief' THEN
        UPDATE briefs SET expires_at = v_new_expires_at, freshness_status = 'current' WHERE id = p_entity_id;
    ELSIF p_entity_type = 'ai_brief' THEN
        UPDATE ai_briefs SET expires_at = v_new_expires_at, freshness_status = 'current' WHERE id = p_entity_id;
    ELSIF p_entity_type = 'position' THEN
        UPDATE positions
        SET expires_at = v_new_expires_at,
            freshness_status = 'current',
            last_validity_check_at = NOW()
        WHERE id = p_entity_id;
    END IF;

    -- Log history
    INSERT INTO content_expiration_history (
        entity_type, entity_id, expiration_status_id,
        event_type, old_expires_at, new_expires_at,
        old_status, new_status, performed_by, notes
    )
    VALUES (
        p_entity_type, p_entity_id, v_status.id,
        'reviewed', v_status.expires_at, v_new_expires_at,
        v_status.freshness_status, 'current', v_performer, p_notes
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content approaching expiration
CREATE OR REPLACE FUNCTION get_expiring_content(
    p_entity_type VARCHAR DEFAULT NULL,
    p_days_ahead INTEGER DEFAULT 30,
    p_include_expired BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    entity_type VARCHAR,
    entity_id UUID,
    entity_name_en TEXT,
    entity_name_ar TEXT,
    expires_at TIMESTAMPTZ,
    days_until_expiration INTEGER,
    freshness_status content_freshness_status,
    warning_sent BOOLEAN,
    critical_warning_sent BOOLEAN,
    rule_name_en VARCHAR,
    owner_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ces.entity_type::VARCHAR,
        ces.entity_id,
        CASE
            WHEN ces.entity_type = 'dossier' THEN d.name_en
            WHEN ces.entity_type = 'brief' THEN b.content_en->>'summary'
            WHEN ces.entity_type = 'ai_brief' THEN ab.title
            WHEN ces.entity_type = 'position' THEN p.title_en
            ELSE 'Unknown'
        END AS entity_name_en,
        CASE
            WHEN ces.entity_type = 'dossier' THEN d.name_ar
            WHEN ces.entity_type = 'brief' THEN b.content_ar->>'summary'
            WHEN ces.entity_type = 'ai_brief' THEN ab.title
            WHEN ces.entity_type = 'position' THEN p.title_ar
            ELSE 'Unknown'
        END AS entity_name_ar,
        ces.expires_at,
        EXTRACT(DAY FROM (ces.expires_at - NOW()))::INTEGER AS days_until_expiration,
        ces.freshness_status,
        ces.warning_sent_at IS NOT NULL AS warning_sent,
        ces.critical_warning_sent_at IS NOT NULL AS critical_warning_sent,
        cer.name_en AS rule_name_en,
        ARRAY(
            SELECT ddo.user_id FROM dossier_owners ddo
            WHERE ddo.dossier_id = CASE WHEN ces.entity_type = 'dossier' THEN ces.entity_id
                                        WHEN ces.entity_type = 'brief' THEN b.dossier_id
                                        ELSE NULL END
        ) AS owner_ids
    FROM content_expiration_status ces
    LEFT JOIN content_expiration_rules cer ON ces.rule_id = cer.id
    LEFT JOIN dossiers d ON ces.entity_type = 'dossier' AND ces.entity_id = d.id
    LEFT JOIN briefs b ON ces.entity_type = 'brief' AND ces.entity_id = b.id
    LEFT JOIN ai_briefs ab ON ces.entity_type = 'ai_brief' AND ces.entity_id = ab.id
    LEFT JOIN positions p ON ces.entity_type = 'position' AND ces.entity_id = p.id
    WHERE (p_entity_type IS NULL OR ces.entity_type = p_entity_type)
      AND ces.freshness_status NOT IN ('archived')
      AND (
          (p_include_expired AND ces.expires_at <= NOW())
          OR (ces.expires_at > NOW() AND ces.expires_at <= NOW() + (p_days_ahead || ' days')::INTERVAL)
      )
    ORDER BY ces.expires_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to update freshness status based on expiration dates (called by scheduled job)
CREATE OR REPLACE FUNCTION update_content_freshness_statuses()
RETURNS TABLE (
    updated_count INTEGER,
    warning_sent_count INTEGER,
    critical_sent_count INTEGER,
    expired_count INTEGER
) AS $$
DECLARE
    v_updated INTEGER := 0;
    v_warnings INTEGER := 0;
    v_critical INTEGER := 0;
    v_expired INTEGER := 0;
    v_record RECORD;
    v_rule RECORD;
BEGIN
    -- Process all content with active expiration tracking
    FOR v_record IN
        SELECT ces.*, cer.warning_days_before, cer.critical_days_before,
               cer.on_warning_action, cer.on_critical_action, cer.on_expiration_action
        FROM content_expiration_status ces
        LEFT JOIN content_expiration_rules cer ON ces.rule_id = cer.id
        WHERE ces.freshness_status NOT IN ('archived', 'refreshing')
    LOOP
        -- Check if expired
        IF v_record.expires_at <= NOW() AND v_record.freshness_status != 'outdated' THEN
            UPDATE content_expiration_status
            SET freshness_status = 'outdated',
                status_changed_at = NOW(),
                expiration_notification_sent_at = NOW(),
                updated_at = NOW()
            WHERE id = v_record.id;

            -- Update entity table
            PERFORM update_entity_freshness_status(v_record.entity_type, v_record.entity_id, 'outdated');

            v_expired := v_expired + 1;
            v_updated := v_updated + 1;

        -- Check if in critical period
        ELSIF v_record.expires_at <= NOW() + (COALESCE(v_record.critical_days_before, 7) || ' days')::INTERVAL
              AND v_record.critical_warning_sent_at IS NULL
              AND v_record.freshness_status = 'current' THEN

            UPDATE content_expiration_status
            SET freshness_status = 'review_pending',
                status_changed_at = NOW(),
                critical_warning_sent_at = NOW(),
                updated_at = NOW()
            WHERE id = v_record.id;

            PERFORM update_entity_freshness_status(v_record.entity_type, v_record.entity_id, 'review_pending');

            v_critical := v_critical + 1;
            v_updated := v_updated + 1;

        -- Check if in warning period
        ELSIF v_record.expires_at <= NOW() + (COALESCE(v_record.warning_days_before, 30) || ' days')::INTERVAL
              AND v_record.warning_sent_at IS NULL
              AND v_record.freshness_status = 'current' THEN

            UPDATE content_expiration_status
            SET warning_sent_at = NOW(),
                updated_at = NOW()
            WHERE id = v_record.id;

            v_warnings := v_warnings + 1;
            v_updated := v_updated + 1;
        END IF;
    END LOOP;

    updated_count := v_updated;
    warning_sent_count := v_warnings;
    critical_sent_count := v_critical;
    expired_count := v_expired;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update entity freshness status
CREATE OR REPLACE FUNCTION update_entity_freshness_status(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_status content_freshness_status
)
RETURNS VOID AS $$
BEGIN
    IF p_entity_type = 'dossier' THEN
        UPDATE dossiers SET freshness_status = p_status WHERE id = p_entity_id;
    ELSIF p_entity_type = 'brief' THEN
        UPDATE briefs SET freshness_status = p_status WHERE id = p_entity_id;
    ELSIF p_entity_type = 'ai_brief' THEN
        UPDATE ai_briefs SET freshness_status = p_status WHERE id = p_entity_id;
    ELSIF p_entity_type = 'position' THEN
        UPDATE positions SET freshness_status = p_status WHERE id = p_entity_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expiration statistics
CREATE OR REPLACE FUNCTION get_content_expiration_stats(
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    entity_type VARCHAR,
    total_tracked BIGINT,
    current_count BIGINT,
    review_pending_count BIGINT,
    outdated_count BIGINT,
    expiring_7_days BIGINT,
    expiring_30_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ces.entity_type::VARCHAR,
        COUNT(*)::BIGINT AS total_tracked,
        COUNT(*) FILTER (WHERE ces.freshness_status = 'current')::BIGINT,
        COUNT(*) FILTER (WHERE ces.freshness_status = 'review_pending')::BIGINT,
        COUNT(*) FILTER (WHERE ces.freshness_status = 'outdated')::BIGINT,
        COUNT(*) FILTER (WHERE ces.expires_at > NOW() AND ces.expires_at <= NOW() + INTERVAL '7 days')::BIGINT,
        COUNT(*) FILTER (WHERE ces.expires_at > NOW() AND ces.expires_at <= NOW() + INTERVAL '30 days')::BIGINT
    FROM content_expiration_status ces
    LEFT JOIN dossiers d ON ces.entity_type = 'dossier' AND ces.entity_id = d.id
    LEFT JOIN dossier_owners ddo ON d.id = ddo.dossier_id
    WHERE ces.freshness_status != 'archived'
      AND (p_user_id IS NULL OR ddo.user_id = p_user_id)
    GROUP BY ces.entity_type;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE content_expiration_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_expiration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_expiration_history ENABLE ROW LEVEL SECURITY;

-- Expiration rules: admin can manage, all can view active rules
CREATE POLICY "Anyone can view active expiration rules"
    ON content_expiration_rules
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Admin can manage expiration rules"
    ON content_expiration_rules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_user_meta_data->>'role' = 'admin'
                OR u.raw_app_meta_data->>'role' = 'admin')
        )
    );

-- Expiration status: users can view status for entities they have access to
CREATE POLICY "Users can view content expiration status"
    ON content_expiration_status
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Users can update content expiration status"
    ON content_expiration_status
    FOR UPDATE
    TO authenticated
    USING (TRUE);

CREATE POLICY "Service role can manage expiration status"
    ON content_expiration_status
    FOR ALL
    TO service_role
    USING (TRUE);

-- Expiration history: read-only for users
CREATE POLICY "Users can view expiration history"
    ON content_expiration_history
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Service role can insert expiration history"
    ON content_expiration_history
    FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- =============================================================================
-- DEFAULT EXPIRATION RULES (Seed Data)
-- =============================================================================

INSERT INTO content_expiration_rules (
    code, name_en, name_ar, description_en, description_ar,
    entity_type, dossier_type, sensitivity_level,
    default_expiration_days, warning_days_before, critical_days_before,
    on_warning_action, on_critical_action, on_expiration_action,
    auto_archive_after_days, auto_refresh_briefs, priority
) VALUES
-- Dossier rules by type
('EXP-DOSS-COUNTRY', 'Country Dossier Expiration', 'انتهاء ملف الدولة',
 'Country dossiers expire after 1 year and require annual review',
 'تنتهي صلاحية ملفات الدول بعد سنة واحدة وتتطلب مراجعة سنوية',
 'dossier', 'country', NULL, 365, 30, 7,
 'notify_owners', 'require_review', 'mark_outdated',
 NULL, TRUE, 10),

('EXP-DOSS-ORG', 'Organization Dossier Expiration', 'انتهاء ملف المنظمة',
 'Organization dossiers expire after 1 year',
 'تنتهي صلاحية ملفات المنظمات بعد سنة واحدة',
 'dossier', 'organization', NULL, 365, 30, 7,
 'notify_owners', 'require_review', 'mark_outdated',
 NULL, TRUE, 10),

('EXP-DOSS-FORUM', 'Forum Dossier Expiration', 'انتهاء ملف المنتدى',
 'Forum dossiers expire after 6 months due to more frequent changes',
 'تنتهي صلاحية ملفات المنتديات بعد 6 أشهر نظرا للتغييرات الأكثر تكرارا',
 'dossier', 'forum', NULL, 180, 21, 7,
 'notify_owners', 'require_review', 'mark_outdated',
 NULL, TRUE, 15),

('EXP-DOSS-THEME', 'Theme Dossier Expiration', 'انتهاء ملف الموضوع',
 'Theme/topic dossiers expire after 6 months',
 'تنتهي صلاحية ملفات المواضيع بعد 6 أشهر',
 'dossier', 'theme', NULL, 180, 21, 7,
 'notify_owners', 'require_review', 'mark_outdated',
 NULL, TRUE, 15),

-- Dossier rules by sensitivity
('EXP-DOSS-HIGH-SENS', 'High Sensitivity Dossier Review', 'مراجعة الملفات عالية الحساسية',
 'High sensitivity dossiers require more frequent review (6 months)',
 'تتطلب الملفات عالية الحساسية مراجعة أكثر تكرارا (6 أشهر)',
 'dossier', NULL, 'high', 180, 30, 14,
 'notify_owners', 'require_review', 'mark_outdated',
 NULL, FALSE, 5),

-- Brief rules
('EXP-BRIEF-DEFAULT', 'Policy Brief Expiration', 'انتهاء صلاحية الملخص',
 'Policy briefs expire after 90 days and should be refreshed',
 'تنتهي صلاحية الملخصات السياسية بعد 90 يوما ويجب تحديثها',
 'brief', NULL, NULL, 90, 14, 7,
 'notify_owners', 'notify_reviewers', 'trigger_brief_refresh',
 180, FALSE, 50),

('EXP-AI-BRIEF-DEFAULT', 'AI Brief Expiration', 'انتهاء صلاحية ملخص الذكاء الاصطناعي',
 'AI-generated briefs expire after 60 days for relevance',
 'تنتهي صلاحية الملخصات المولدة بالذكاء الاصطناعي بعد 60 يوما',
 'ai_brief', NULL, NULL, 60, 10, 5,
 'notify_owners', 'notify_owners', 'trigger_brief_refresh',
 120, TRUE, 50),

-- Position rules
('EXP-POSITION-DEFAULT', 'Position Validity Check', 'فحص صلاحية الموقف',
 'Positions should be reviewed every 6 months to ensure accuracy',
 'يجب مراجعة المواقف كل 6 أشهر لضمان الدقة',
 'position', NULL, NULL, 180, 30, 14,
 'notify_owners', 'require_review', 'mark_outdated',
 NULL, FALSE, 50)

ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- ADD WORKFLOW TRIGGER FOR CONTENT EXPIRATION
-- =============================================================================

-- Add 'content_expiring' trigger type to workflow_trigger_type if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_trigger_type') THEN
        -- Check if value already exists
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'workflow_trigger_type'::regtype AND enumlabel = 'content_expiring') THEN
            ALTER TYPE workflow_trigger_type ADD VALUE IF NOT EXISTS 'content_expiring';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'workflow_trigger_type'::regtype AND enumlabel = 'content_expired') THEN
            ALTER TYPE workflow_trigger_type ADD VALUE IF NOT EXISTS 'content_expired';
        END IF;
    END IF;
END $$;

-- Add notification templates for content expiration
INSERT INTO workflow_notification_templates (
    code, name_en, name_ar, subject_en, subject_ar, body_en, body_ar,
    is_system, available_variables, channel
) VALUES
('content_expiring_warning', 'Content Expiring Warning', 'تحذير انتهاء صلاحية المحتوى',
 'Content Review Required: {{entity.title}}', 'مراجعة المحتوى مطلوبة: {{entity.title}}',
 'The {{entity.type}} "{{entity.title}}" will expire in {{days_remaining}} days. Please review and update if necessary.',
 '{{entity.type}} "{{entity.title}}" ستنتهي صلاحيته خلال {{days_remaining}} أيام. يرجى المراجعة والتحديث إذا لزم الأمر.',
 true, '["entity.title", "entity.type", "days_remaining", "expires_at", "url"]'::jsonb, 'all'),

('content_expired', 'Content Expired', 'انتهت صلاحية المحتوى',
 'Content Outdated: {{entity.title}}', 'محتوى قديم: {{entity.title}}',
 'The {{entity.type}} "{{entity.title}}" has expired and is now marked as outdated. Immediate review is required.',
 '{{entity.type}} "{{entity.title}}" انتهت صلاحيته ويعتبر الآن قديما. المراجعة الفورية مطلوبة.',
 true, '["entity.title", "entity.type", "expired_at", "url"]'::jsonb, 'all'),

('content_review_request', 'Content Review Request', 'طلب مراجعة المحتوى',
 'Review Requested: {{entity.title}}', 'طلب مراجعة: {{entity.title}}',
 '{{requester.name}} has requested a review of "{{entity.title}}". Please review the content for accuracy.',
 'طلب {{requester.name}} مراجعة "{{entity.title}}". يرجى مراجعة المحتوى للتأكد من دقته.',
 true, '["entity.title", "entity.type", "requester.name", "url"]'::jsonb, 'in_app'),

('content_refreshed', 'Content Refreshed', 'تم تحديث المحتوى',
 'Content Updated: {{entity.title}}', 'تم تحديث المحتوى: {{entity.title}}',
 'The {{entity.type}} "{{entity.title}}" has been reviewed and refreshed. New expiration date: {{new_expires_at}}.',
 'تمت مراجعة وتحديث {{entity.type}} "{{entity.title}}". تاريخ الانتهاء الجديد: {{new_expires_at}}.',
 true, '["entity.title", "entity.type", "reviewed_by", "new_expires_at", "url"]'::jsonb, 'in_app')

ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT ALL ON content_expiration_rules TO authenticated;
GRANT ALL ON content_expiration_status TO authenticated;
GRANT ALL ON content_expiration_history TO authenticated;

GRANT EXECUTE ON FUNCTION get_content_expiration_rule(VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION set_content_expiration(VARCHAR, UUID, TIMESTAMPTZ, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_content_expiration(VARCHAR, UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_content_reviewed(VARCHAR, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_content(VARCHAR, INTEGER, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_content_freshness_statuses() TO authenticated;
GRANT EXECUTE ON FUNCTION update_entity_freshness_status(VARCHAR, UUID, content_freshness_status) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_expiration_stats(UUID) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE content_expiration_rules IS 'Configurable rules for content expiration timing and actions by entity type';
COMMENT ON TABLE content_expiration_status IS 'Tracks expiration status for individual content items (dossiers, briefs, positions)';
COMMENT ON TABLE content_expiration_history IS 'Audit log of all expiration-related events';

COMMENT ON FUNCTION set_content_expiration IS 'Sets or updates expiration tracking for a content item';
COMMENT ON FUNCTION extend_content_expiration IS 'Extends the expiration date for a content item';
COMMENT ON FUNCTION mark_content_reviewed IS 'Marks content as reviewed and resets expiration';
COMMENT ON FUNCTION get_expiring_content IS 'Returns content approaching or past expiration';
COMMENT ON FUNCTION update_content_freshness_statuses IS 'Batch updates freshness statuses based on expiration dates';
COMMENT ON FUNCTION get_content_expiration_stats IS 'Returns statistics on content expiration by entity type';
