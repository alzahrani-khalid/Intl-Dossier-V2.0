-- Migration: Data Retention Policies
-- Date: 2026-01-10
-- Feature: data-retention-policies
-- Description: Configurable retention policies for different entity types and document classes.
--              Automatically archives or purges data based on age, sensitivity, and regulatory requirements.
--              Includes legal hold support.

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Retention action type
CREATE TYPE retention_action_type AS ENUM (
    'archive',      -- Move to archive/cold storage
    'soft_delete',  -- Mark as deleted but keep
    'hard_delete',  -- Permanently remove
    'anonymize'     -- Remove PII but keep structure
);

-- Legal hold status
CREATE TYPE legal_hold_status AS ENUM (
    'active',       -- Currently under legal hold
    'released',     -- Hold has been lifted
    'expired'       -- Hold has expired
);

-- Retention policy status
CREATE TYPE retention_policy_status AS ENUM (
    'active',       -- Policy is in effect
    'draft',        -- Not yet active
    'disabled',     -- Temporarily disabled
    'archived'      -- No longer in use
);

-- Entity types for retention (broader than dossier types)
CREATE TYPE retention_entity_type AS ENUM (
    'dossier',
    'intake_ticket',
    'document',
    'attachment',
    'audit_log',
    'ai_interaction_log',
    'commitment',
    'after_action_record',
    'position',
    'engagement',
    'calendar_event',
    'notification',
    'activity_feed'
);

-- Document classification for retention
CREATE TYPE document_class AS ENUM (
    'operational',      -- Day-to-day operational documents
    'regulatory',       -- Regulatory/compliance documents
    'legal',            -- Legal documents (contracts, agreements)
    'correspondence',   -- Letters, emails, communications
    'financial',        -- Financial records
    'personnel',        -- HR-related documents
    'research',         -- Research and analysis
    'archive_permanent' -- Never delete
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Data Retention Policies Table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Policy identification
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    code TEXT NOT NULL UNIQUE, -- e.g., 'POL-DOC-LEGAL-7Y'

    -- Scope definition
    entity_type retention_entity_type NOT NULL,
    document_class document_class, -- NULL means applies to all classes
    sensitivity_level INTEGER, -- NULL means applies to all levels (1-4)
    dossier_type TEXT, -- NULL means applies to all dossier types

    -- Retention rules
    retention_days INTEGER NOT NULL CHECK (retention_days >= 0),
    -- 0 = permanent (never delete), >0 = days to retain

    warning_days INTEGER NOT NULL DEFAULT 30, -- Days before expiration to warn
    action retention_action_type NOT NULL DEFAULT 'archive',

    -- Archive settings
    archive_storage_bucket TEXT, -- Supabase storage bucket for archived items
    archive_path_template TEXT, -- Template for archive path, e.g., 'archive/{year}/{entity_type}/{id}'

    -- Policy metadata
    status retention_policy_status NOT NULL DEFAULT 'active',
    priority INTEGER NOT NULL DEFAULT 100, -- Lower = higher priority for conflict resolution

    -- Compliance and regulatory
    regulatory_reference TEXT, -- Reference to regulation requiring this policy
    compliance_notes TEXT,

    -- Audit trail
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure unique policies for entity+class+sensitivity combinations
    CONSTRAINT unique_policy_scope UNIQUE (entity_type, document_class, sensitivity_level, dossier_type, status)
);

-- Legal Holds Table
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Hold identification
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    reference_number TEXT NOT NULL UNIQUE, -- e.g., 'LH-2026-001'

    -- Hold scope (can apply to specific entities or broad criteria)
    entity_type retention_entity_type, -- NULL means applies to all types

    -- Specific entity holds (if applicable)
    entity_ids UUID[], -- List of specific entity IDs under hold

    -- Criteria-based holds
    keywords TEXT[], -- Keywords to match in content
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    custodians UUID[], -- User IDs whose data is under hold

    -- Hold details
    status legal_hold_status NOT NULL DEFAULT 'active',
    reason_en TEXT NOT NULL,
    reason_ar TEXT NOT NULL,
    legal_matter TEXT, -- Case or matter name

    -- Timeline
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ, -- NULL means indefinite
    released_date TIMESTAMPTZ,
    released_by UUID REFERENCES auth.users(id),
    release_reason TEXT,

    -- Notifications
    notify_custodians BOOLEAN DEFAULT TRUE,
    notification_sent_at TIMESTAMPTZ,

    -- Audit trail
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Entity Retention Status Tracking
CREATE TABLE IF NOT EXISTS entity_retention_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Entity reference
    entity_type retention_entity_type NOT NULL,
    entity_id UUID NOT NULL,

    -- Current retention status
    retention_policy_id UUID REFERENCES data_retention_policies(id) ON DELETE SET NULL,
    retention_expires_at TIMESTAMPTZ, -- NULL means permanent

    -- Hold status
    under_legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
    legal_hold_ids UUID[], -- References to legal_holds

    -- Processing status
    archived_at TIMESTAMPTZ,
    archive_location TEXT, -- Storage path if archived
    deleted_at TIMESTAMPTZ,
    anonymized_at TIMESTAMPTZ,

    -- Warning tracking
    expiration_warning_sent BOOLEAN DEFAULT FALSE,
    warning_sent_at TIMESTAMPTZ,

    -- Manual overrides
    manual_hold BOOLEAN DEFAULT FALSE, -- User-placed hold
    manual_hold_reason TEXT,
    manual_hold_by UUID REFERENCES auth.users(id),
    manual_hold_until TIMESTAMPTZ,

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint for entity tracking
    CONSTRAINT unique_entity_retention UNIQUE (entity_type, entity_id)
);

-- Retention Execution Log
CREATE TABLE IF NOT EXISTS retention_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Execution details
    execution_type TEXT NOT NULL CHECK (execution_type IN ('scheduled', 'manual', 'dry_run')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Scope
    policy_id UUID REFERENCES data_retention_policies(id),
    entity_type retention_entity_type,

    -- Results
    items_processed INTEGER DEFAULT 0,
    items_archived INTEGER DEFAULT 0,
    items_deleted INTEGER DEFAULT 0,
    items_anonymized INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0, -- Due to holds or errors
    items_warned INTEGER DEFAULT 0, -- Warnings sent

    -- Errors
    errors JSONB DEFAULT '[]'::JSONB,

    -- Execution metadata
    executed_by UUID REFERENCES auth.users(id),
    execution_params JSONB, -- Parameters used for execution

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Data Retention Policies
CREATE INDEX idx_retention_policies_entity_type ON data_retention_policies(entity_type);
CREATE INDEX idx_retention_policies_status ON data_retention_policies(status);
CREATE INDEX idx_retention_policies_priority ON data_retention_policies(priority);
CREATE INDEX idx_retention_policies_document_class ON data_retention_policies(document_class);

-- Legal Holds
CREATE INDEX idx_legal_holds_status ON legal_holds(status);
CREATE INDEX idx_legal_holds_effective_date ON legal_holds(effective_date);
CREATE INDEX idx_legal_holds_expiry_date ON legal_holds(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_legal_holds_entity_type ON legal_holds(entity_type);
CREATE INDEX idx_legal_holds_entity_ids ON legal_holds USING GIN(entity_ids);
CREATE INDEX idx_legal_holds_custodians ON legal_holds USING GIN(custodians);

-- Entity Retention Status
CREATE INDEX idx_entity_retention_entity_type ON entity_retention_status(entity_type);
CREATE INDEX idx_entity_retention_entity_id ON entity_retention_status(entity_id);
CREATE INDEX idx_entity_retention_expires_at ON entity_retention_status(retention_expires_at) WHERE retention_expires_at IS NOT NULL;
CREATE INDEX idx_entity_retention_legal_hold ON entity_retention_status(under_legal_hold) WHERE under_legal_hold = TRUE;
CREATE INDEX idx_entity_retention_archived ON entity_retention_status(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_entity_retention_policy ON entity_retention_status(retention_policy_id);

-- Execution Log
CREATE INDEX idx_retention_execution_started ON retention_execution_log(started_at);
CREATE INDEX idx_retention_execution_type ON retention_execution_log(execution_type);
CREATE INDEX idx_retention_execution_policy ON retention_execution_log(policy_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger for retention_policies
CREATE TRIGGER update_data_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamps trigger for legal_holds
CREATE TRIGGER update_legal_holds_updated_at
    BEFORE UPDATE ON legal_holds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamps trigger for entity_retention_status
CREATE TRIGGER update_entity_retention_status_updated_at
    BEFORE UPDATE ON entity_retention_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get applicable retention policy for an entity
CREATE OR REPLACE FUNCTION get_applicable_retention_policy(
    p_entity_type retention_entity_type,
    p_document_class document_class DEFAULT NULL,
    p_sensitivity_level INTEGER DEFAULT NULL,
    p_dossier_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    policy_id UUID,
    policy_name_en TEXT,
    retention_days INTEGER,
    action retention_action_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        drp.id,
        drp.name_en,
        drp.retention_days,
        drp.action
    FROM data_retention_policies drp
    WHERE drp.status = 'active'
      AND drp.entity_type = p_entity_type
      AND (drp.document_class IS NULL OR drp.document_class = p_document_class)
      AND (drp.sensitivity_level IS NULL OR drp.sensitivity_level = p_sensitivity_level)
      AND (drp.dossier_type IS NULL OR drp.dossier_type = p_dossier_type)
    ORDER BY drp.priority ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if entity is under legal hold
CREATE OR REPLACE FUNCTION is_entity_under_legal_hold(
    p_entity_type retention_entity_type,
    p_entity_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_under_hold BOOLEAN;
BEGIN
    -- Check direct hold on entity
    SELECT under_legal_hold INTO v_under_hold
    FROM entity_retention_status
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

    IF v_under_hold = TRUE THEN
        RETURN TRUE;
    END IF;

    -- Check if any active legal hold applies
    SELECT EXISTS (
        SELECT 1 FROM legal_holds lh
        WHERE lh.status = 'active'
          AND (lh.entity_type IS NULL OR lh.entity_type = p_entity_type)
          AND (
              p_entity_id = ANY(lh.entity_ids)
              OR (lh.effective_date <= NOW() AND (lh.expiry_date IS NULL OR lh.expiry_date > NOW()))
          )
    ) INTO v_under_hold;

    RETURN COALESCE(v_under_hold, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to apply retention policy to an entity
CREATE OR REPLACE FUNCTION apply_retention_policy(
    p_entity_type retention_entity_type,
    p_entity_id UUID,
    p_document_class document_class DEFAULT NULL,
    p_sensitivity_level INTEGER DEFAULT NULL,
    p_dossier_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_policy RECORD;
    v_status_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get applicable policy
    SELECT * INTO v_policy
    FROM get_applicable_retention_policy(
        p_entity_type,
        p_document_class,
        p_sensitivity_level,
        p_dossier_type
    );

    -- Calculate expiration date (NULL if permanent)
    IF v_policy.retention_days > 0 THEN
        v_expires_at := NOW() + (v_policy.retention_days || ' days')::INTERVAL;
    ELSE
        v_expires_at := NULL;
    END IF;

    -- Upsert entity retention status
    INSERT INTO entity_retention_status (
        entity_type,
        entity_id,
        retention_policy_id,
        retention_expires_at
    )
    VALUES (
        p_entity_type,
        p_entity_id,
        v_policy.policy_id,
        v_expires_at
    )
    ON CONFLICT (entity_type, entity_id)
    DO UPDATE SET
        retention_policy_id = v_policy.policy_id,
        retention_expires_at = v_expires_at,
        updated_at = NOW()
    RETURNING id INTO v_status_id;

    RETURN v_status_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get entities pending retention action
CREATE OR REPLACE FUNCTION get_pending_retention_actions(
    p_entity_type retention_entity_type DEFAULT NULL,
    p_action retention_action_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    entity_type retention_entity_type,
    entity_id UUID,
    policy_id UUID,
    policy_name_en TEXT,
    action retention_action_type,
    expires_at TIMESTAMPTZ,
    days_until_expiration INTEGER,
    under_legal_hold BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ers.entity_type,
        ers.entity_id,
        ers.retention_policy_id,
        drp.name_en,
        drp.action,
        ers.retention_expires_at,
        EXTRACT(DAY FROM (ers.retention_expires_at - NOW()))::INTEGER,
        ers.under_legal_hold
    FROM entity_retention_status ers
    JOIN data_retention_policies drp ON ers.retention_policy_id = drp.id
    WHERE ers.retention_expires_at <= NOW()
      AND ers.archived_at IS NULL
      AND ers.deleted_at IS NULL
      AND ers.anonymized_at IS NULL
      AND ers.under_legal_hold = FALSE
      AND ers.manual_hold = FALSE
      AND (p_entity_type IS NULL OR ers.entity_type = p_entity_type)
      AND (p_action IS NULL OR drp.action = p_action)
    ORDER BY ers.retention_expires_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get entities approaching expiration (for warnings)
CREATE OR REPLACE FUNCTION get_expiring_entities(
    p_days_ahead INTEGER DEFAULT 30,
    p_entity_type retention_entity_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    entity_type retention_entity_type,
    entity_id UUID,
    policy_id UUID,
    policy_name_en TEXT,
    action retention_action_type,
    expires_at TIMESTAMPTZ,
    days_until_expiration INTEGER,
    warning_sent BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ers.entity_type,
        ers.entity_id,
        ers.retention_policy_id,
        drp.name_en,
        drp.action,
        ers.retention_expires_at,
        EXTRACT(DAY FROM (ers.retention_expires_at - NOW()))::INTEGER,
        ers.expiration_warning_sent
    FROM entity_retention_status ers
    JOIN data_retention_policies drp ON ers.retention_policy_id = drp.id
    WHERE ers.retention_expires_at > NOW()
      AND ers.retention_expires_at <= NOW() + (p_days_ahead || ' days')::INTERVAL
      AND ers.archived_at IS NULL
      AND ers.deleted_at IS NULL
      AND ers.anonymized_at IS NULL
      AND ers.under_legal_hold = FALSE
      AND ers.manual_hold = FALSE
      AND (p_entity_type IS NULL OR ers.entity_type = p_entity_type)
    ORDER BY ers.retention_expires_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to apply/release legal hold
CREATE OR REPLACE FUNCTION manage_legal_hold(
    p_legal_hold_id UUID,
    p_action TEXT -- 'apply' or 'release'
)
RETURNS INTEGER AS $$
DECLARE
    v_hold RECORD;
    v_affected INTEGER := 0;
BEGIN
    SELECT * INTO v_hold FROM legal_holds WHERE id = p_legal_hold_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Legal hold not found: %', p_legal_hold_id;
    END IF;

    IF p_action = 'apply' THEN
        -- Apply hold to matching entities
        UPDATE entity_retention_status
        SET
            under_legal_hold = TRUE,
            legal_hold_ids = array_append(COALESCE(legal_hold_ids, '{}'), p_legal_hold_id),
            updated_at = NOW()
        WHERE entity_id = ANY(v_hold.entity_ids)
           OR (v_hold.entity_type IS NOT NULL AND entity_type = v_hold.entity_type);

        GET DIAGNOSTICS v_affected = ROW_COUNT;

    ELSIF p_action = 'release' THEN
        -- Release hold from entities
        UPDATE entity_retention_status
        SET
            legal_hold_ids = array_remove(legal_hold_ids, p_legal_hold_id),
            under_legal_hold = (
                array_length(array_remove(COALESCE(legal_hold_ids, '{}'), p_legal_hold_id), 1) > 0
            ),
            updated_at = NOW()
        WHERE p_legal_hold_id = ANY(legal_hold_ids);

        GET DIAGNOSTICS v_affected = ROW_COUNT;

        -- Update the legal hold record
        UPDATE legal_holds
        SET
            status = 'released',
            released_date = NOW(),
            updated_at = NOW()
        WHERE id = p_legal_hold_id;
    END IF;

    RETURN v_affected;
END;
$$ LANGUAGE plpgsql;

-- Function to get retention statistics
CREATE OR REPLACE FUNCTION get_retention_statistics()
RETURNS TABLE (
    entity_type retention_entity_type,
    total_tracked INTEGER,
    under_hold INTEGER,
    archived INTEGER,
    deleted INTEGER,
    pending_action INTEGER,
    expiring_soon INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ers.entity_type,
        COUNT(*)::INTEGER AS total_tracked,
        COUNT(*) FILTER (WHERE ers.under_legal_hold = TRUE)::INTEGER AS under_hold,
        COUNT(*) FILTER (WHERE ers.archived_at IS NOT NULL)::INTEGER AS archived,
        COUNT(*) FILTER (WHERE ers.deleted_at IS NOT NULL)::INTEGER AS deleted,
        COUNT(*) FILTER (
            WHERE ers.retention_expires_at <= NOW()
              AND ers.archived_at IS NULL
              AND ers.deleted_at IS NULL
              AND ers.under_legal_hold = FALSE
        )::INTEGER AS pending_action,
        COUNT(*) FILTER (
            WHERE ers.retention_expires_at > NOW()
              AND ers.retention_expires_at <= NOW() + INTERVAL '30 days'
              AND ers.archived_at IS NULL
              AND ers.deleted_at IS NULL
        )::INTEGER AS expiring_soon
    FROM entity_retention_status ers
    GROUP BY ers.entity_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_retention_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_execution_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access for retention policies
CREATE POLICY "Admin can manage retention policies"
    ON data_retention_policies
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

-- Admin-only access for legal holds
CREATE POLICY "Admin can manage legal holds"
    ON legal_holds
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

-- Read access for entity retention status (users can see their own entities)
CREATE POLICY "Users can view entity retention status"
    ON entity_retention_status
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Admin can modify entity retention status
CREATE POLICY "Admin can manage entity retention status"
    ON entity_retention_status
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

-- Read access for execution log
CREATE POLICY "Users can view retention execution log"
    ON retention_execution_log
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Admin can insert execution log
CREATE POLICY "Admin can manage execution log"
    ON retention_execution_log
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_user_meta_data->>'role' = 'admin'
                OR u.raw_app_meta_data->>'role' = 'admin')
        )
    );

-- ============================================================================
-- DEFAULT POLICIES (Seed Data)
-- ============================================================================

-- Insert default retention policies
INSERT INTO data_retention_policies (
    code, name_en, name_ar, description_en, description_ar,
    entity_type, document_class, sensitivity_level, retention_days,
    warning_days, action, status, priority, regulatory_reference
) VALUES
-- Audit Logs - 7 years (regulatory requirement)
('POL-AUDIT-7Y', 'Audit Logs - 7 Year Retention', 'سجلات التدقيق - الاحتفاظ لمدة 7 سنوات',
 'Audit logs must be retained for 7 years for compliance purposes',
 'يجب الاحتفاظ بسجلات التدقيق لمدة 7 سنوات لأغراض الامتثال',
 'audit_log', NULL, NULL, 2555, 90, 'archive', 'active', 10, 'ISO 27001'),

-- AI Interaction Logs - 90 days
('POL-AI-90D', 'AI Interaction Logs - 90 Day Retention', 'سجلات تفاعل الذكاء الاصطناعي - الاحتفاظ لمدة 90 يوم',
 'AI interaction logs retained for 90 days for analysis and debugging',
 'يتم الاحتفاظ بسجلات تفاعل الذكاء الاصطناعي لمدة 90 يومًا للتحليل وتصحيح الأخطاء',
 'ai_interaction_log', NULL, NULL, 90, 14, 'soft_delete', 'active', 50, NULL),

-- Notifications - 30 days
('POL-NOTIF-30D', 'Notifications - 30 Day Retention', 'الإشعارات - الاحتفاظ لمدة 30 يوم',
 'User notifications retained for 30 days',
 'يتم الاحتفاظ بإشعارات المستخدم لمدة 30 يومًا',
 'notification', NULL, NULL, 30, 7, 'hard_delete', 'active', 80, NULL),

-- Activity Feed - 90 days
('POL-ACTIVITY-90D', 'Activity Feed - 90 Day Retention', 'موجز النشاط - الاحتفاظ لمدة 90 يوم',
 'Activity feed entries retained for 90 days',
 'يتم الاحتفاظ بإدخالات موجز النشاط لمدة 90 يومًا',
 'activity_feed', NULL, NULL, 90, 14, 'soft_delete', 'active', 70, NULL),

-- Documents - Legal (Permanent)
('POL-DOC-LEGAL-PERM', 'Legal Documents - Permanent Retention', 'المستندات القانونية - الاحتفاظ الدائم',
 'Legal documents including contracts and agreements are retained permanently',
 'يتم الاحتفاظ بالمستندات القانونية بما في ذلك العقود والاتفاقيات بشكل دائم',
 'document', 'legal', NULL, 0, 0, 'archive', 'active', 5, 'Legal Requirement'),

-- Documents - Regulatory (10 years)
('POL-DOC-REG-10Y', 'Regulatory Documents - 10 Year Retention', 'المستندات التنظيمية - الاحتفاظ لمدة 10 سنوات',
 'Regulatory and compliance documents retained for 10 years',
 'يتم الاحتفاظ بالمستندات التنظيمية والامتثال لمدة 10 سنوات',
 'document', 'regulatory', NULL, 3650, 180, 'archive', 'active', 15, 'Regulatory Compliance'),

-- Documents - Operational (3 years)
('POL-DOC-OPS-3Y', 'Operational Documents - 3 Year Retention', 'المستندات التشغيلية - الاحتفاظ لمدة 3 سنوات',
 'Operational documents retained for 3 years after creation',
 'يتم الاحتفاظ بالمستندات التشغيلية لمدة 3 سنوات بعد إنشائها',
 'document', 'operational', NULL, 1095, 60, 'archive', 'active', 50, NULL),

-- Documents - Correspondence (2 years)
('POL-DOC-CORR-2Y', 'Correspondence - 2 Year Retention', 'المراسلات - الاحتفاظ لمدة سنتين',
 'Correspondence documents retained for 2 years',
 'يتم الاحتفاظ بالمراسلات لمدة سنتين',
 'document', 'correspondence', NULL, 730, 30, 'soft_delete', 'active', 60, NULL),

-- Dossiers - High Sensitivity (Permanent)
('POL-DOSS-HIGH-PERM', 'High Sensitivity Dossiers - Permanent', 'الملفات عالية الحساسية - دائم',
 'High sensitivity dossiers are retained permanently',
 'يتم الاحتفاظ بالملفات عالية الحساسية بشكل دائم',
 'dossier', NULL, 4, 0, 0, 'archive', 'active', 5, 'Security Policy'),

-- Dossiers - Standard (5 years after archive)
('POL-DOSS-STD-5Y', 'Standard Dossiers - 5 Year Retention', 'الملفات القياسية - الاحتفاظ لمدة 5 سنوات',
 'Standard dossiers retained for 5 years after being archived',
 'يتم الاحتفاظ بالملفات القياسية لمدة 5 سنوات بعد الأرشفة',
 'dossier', NULL, NULL, 1825, 90, 'soft_delete', 'active', 100, NULL),

-- Intake Tickets - Closed (1 year)
('POL-INTAKE-1Y', 'Intake Tickets - 1 Year Retention', 'تذاكر الاستقبال - الاحتفاظ لمدة سنة',
 'Closed intake tickets retained for 1 year',
 'يتم الاحتفاظ بتذاكر الاستقبال المغلقة لمدة سنة',
 'intake_ticket', NULL, NULL, 365, 30, 'archive', 'active', 60, NULL),

-- Attachments - Follow document class
('POL-ATTACH-3Y', 'Attachments - 3 Year Default', 'المرفقات - 3 سنوات افتراضي',
 'File attachments retained for 3 years by default',
 'يتم الاحتفاظ بالمرفقات لمدة 3 سنوات افتراضيًا',
 'attachment', NULL, NULL, 1095, 60, 'hard_delete', 'active', 100, NULL),

-- Commitments - 5 years after completion
('POL-COMMIT-5Y', 'Commitments - 5 Year Retention', 'الالتزامات - الاحتفاظ لمدة 5 سنوات',
 'Completed commitments retained for 5 years for historical reference',
 'يتم الاحتفاظ بالالتزامات المنجزة لمدة 5 سنوات للرجوع التاريخي',
 'commitment', NULL, NULL, 1825, 60, 'archive', 'active', 50, NULL),

-- After Action Records - 7 years
('POL-AAR-7Y', 'After Action Records - 7 Year Retention', 'سجلات ما بعد الإجراء - الاحتفاظ لمدة 7 سنوات',
 'After action records retained for 7 years for institutional memory',
 'يتم الاحتفاظ بسجلات ما بعد الإجراء لمدة 7 سنوات للذاكرة المؤسسية',
 'after_action_record', NULL, NULL, 2555, 90, 'archive', 'active', 30, NULL),

-- Positions - Follow dossier retention
('POL-POS-5Y', 'Positions - 5 Year Retention', 'المواقف - الاحتفاظ لمدة 5 سنوات',
 'Position documents retained for 5 years after superseded',
 'يتم الاحتفاظ بوثائق الموقف لمدة 5 سنوات بعد الاستبدال',
 'position', NULL, NULL, 1825, 60, 'archive', 'active', 50, NULL),

-- Calendar Events - 2 years after event
('POL-CALENDAR-2Y', 'Calendar Events - 2 Year Retention', 'أحداث التقويم - الاحتفاظ لمدة سنتين',
 'Calendar events retained for 2 years after the event date',
 'يتم الاحتفاظ بأحداث التقويم لمدة سنتين بعد تاريخ الحدث',
 'calendar_event', NULL, NULL, 730, 30, 'soft_delete', 'active', 70, NULL)

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON data_retention_policies TO authenticated;
GRANT ALL ON legal_holds TO authenticated;
GRANT ALL ON entity_retention_status TO authenticated;
GRANT ALL ON retention_execution_log TO authenticated;

GRANT EXECUTE ON FUNCTION get_applicable_retention_policy(retention_entity_type, document_class, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_entity_under_legal_hold(retention_entity_type, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_retention_policy(retention_entity_type, UUID, document_class, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_retention_actions(retention_entity_type, retention_action_type, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_entities(INTEGER, retention_entity_type, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION manage_legal_hold(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_retention_statistics() TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE data_retention_policies IS 'Configurable data retention policies for different entity types and document classes';
COMMENT ON TABLE legal_holds IS 'Legal holds that prevent data from being archived or deleted';
COMMENT ON TABLE entity_retention_status IS 'Tracks retention status for individual entities';
COMMENT ON TABLE retention_execution_log IS 'Log of retention policy executions (archive, delete, etc.)';

COMMENT ON FUNCTION get_applicable_retention_policy IS 'Returns the highest priority applicable retention policy for an entity';
COMMENT ON FUNCTION is_entity_under_legal_hold IS 'Checks if an entity is under any active legal hold';
COMMENT ON FUNCTION apply_retention_policy IS 'Applies the appropriate retention policy to an entity';
COMMENT ON FUNCTION get_pending_retention_actions IS 'Returns entities that have expired and need retention action';
COMMENT ON FUNCTION get_expiring_entities IS 'Returns entities approaching their retention expiration date';
COMMENT ON FUNCTION manage_legal_hold IS 'Applies or releases a legal hold on affected entities';
COMMENT ON FUNCTION get_retention_statistics IS 'Returns retention statistics grouped by entity type';
