-- =====================================================================================
-- Migration: Enhance Scheduled Reports
-- Description: Extends existing report_schedules with recipient management,
--              conditional delivery, and delivery channels
-- Author: Claude Code
-- Date: 2026-01-16
-- Feature: scheduled-recurring-reports
-- =====================================================================================

-- ===========================================
-- NEW ENUM TYPES
-- ===========================================

-- Drop if partially created
DROP TYPE IF EXISTS report_delivery_channel CASCADE;
DROP TYPE IF EXISTS condition_operator CASCADE;

CREATE TYPE report_delivery_channel AS ENUM ('email', 'in_app', 'slack', 'teams');
CREATE TYPE condition_operator AS ENUM ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains', 'is_empty', 'is_not_empty');

-- ===========================================
-- EXTEND REPORT_SCHEDULES TABLE
-- ===========================================

-- Add frequency column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'frequency') THEN
        ALTER TABLE public.report_schedules ADD COLUMN frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly'));
    END IF;
END $$;

-- Add description columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'description') THEN
        ALTER TABLE public.report_schedules ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'description_ar') THEN
        ALTER TABLE public.report_schedules ADD COLUMN description_ar TEXT;
    END IF;
END $$;

-- Add consecutive failures tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'consecutive_failures') THEN
        ALTER TABLE public.report_schedules ADD COLUMN consecutive_failures INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'max_consecutive_failures') THEN
        ALTER TABLE public.report_schedules ADD COLUMN max_consecutive_failures INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'paused_at') THEN
        ALTER TABLE public.report_schedules ADD COLUMN paused_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'pause_reason') THEN
        ALTER TABLE public.report_schedules ADD COLUMN pause_reason TEXT;
    END IF;
END $$;

-- Add language preference
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'language') THEN
        ALTER TABLE public.report_schedules ADD COLUMN language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar', 'both'));
    END IF;
END $$;

-- Add sharing options
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'is_shared') THEN
        ALTER TABLE public.report_schedules ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ===========================================
-- REPORT RECIPIENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.report_schedule_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES public.report_schedules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    external_email TEXT,
    external_name TEXT,
    delivery_channels report_delivery_channel[] NOT NULL DEFAULT '{email}'::report_delivery_channel[],
    preferred_format TEXT DEFAULT 'pdf' CHECK (preferred_format IN ('pdf', 'excel', 'csv', 'json')),
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    unsubscribed_at TIMESTAMPTZ,
    unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT report_recipients_user_or_email CHECK (user_id IS NOT NULL OR external_email IS NOT NULL),
    CONSTRAINT report_recipients_external_email_valid CHECK (
        external_email IS NULL OR external_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Add unique constraints separately to handle partial uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_recipients_unique_user ON public.report_schedule_recipients(schedule_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_recipients_unique_email ON public.report_schedule_recipients(schedule_id, external_email) WHERE external_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_schedule_recipients_schedule ON public.report_schedule_recipients(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_schedule_recipients_user ON public.report_schedule_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedule_recipients_active ON public.report_schedule_recipients(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_schedule_recipients_token ON public.report_schedule_recipients(unsubscribe_token);

-- ===========================================
-- CONDITIONAL DELIVERY RULES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.report_delivery_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES public.report_schedules(id) ON DELETE CASCADE,
    field_path TEXT NOT NULL,
    operator condition_operator NOT NULL,
    value TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    fail_message TEXT,
    fail_message_ar TEXT,
    evaluation_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_conditions_schedule ON public.report_delivery_conditions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_conditions_active ON public.report_delivery_conditions(is_active) WHERE is_active = TRUE;

-- ===========================================
-- EXTEND REPORT_EXECUTIONS TABLE
-- ===========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'total_recipients') THEN
        ALTER TABLE public.report_executions ADD COLUMN total_recipients INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'successful_deliveries') THEN
        ALTER TABLE public.report_executions ADD COLUMN successful_deliveries INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'failed_deliveries') THEN
        ALTER TABLE public.report_executions ADD COLUMN failed_deliveries INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'skipped_deliveries') THEN
        ALTER TABLE public.report_executions ADD COLUMN skipped_deliveries INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'conditions_met') THEN
        ALTER TABLE public.report_executions ADD COLUMN conditions_met BOOLEAN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'conditions_result') THEN
        ALTER TABLE public.report_executions ADD COLUMN conditions_result JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'trigger_type') THEN
        ALTER TABLE public.report_executions ADD COLUMN trigger_type TEXT DEFAULT 'scheduled' CHECK (trigger_type IN ('scheduled', 'manual', 'api'));
    END IF;
END $$;

-- ===========================================
-- REPORT DELIVERY LOG TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.report_delivery_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID NOT NULL REFERENCES public.report_executions(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.report_schedule_recipients(id) ON DELETE CASCADE,
    channel report_delivery_channel NOT NULL,
    format TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    file_path TEXT,
    file_size_bytes INTEGER,
    external_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_delivery_log_execution ON public.report_delivery_log(execution_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_recipient ON public.report_delivery_log(recipient_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON public.report_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_delivery_log_sent ON public.report_delivery_log(sent_at DESC);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_report_next_run(
    p_frequency TEXT,
    p_time TIME,
    p_timezone TEXT,
    p_day_of_week INTEGER,
    p_day_of_month INTEGER,
    p_from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_local_time TIMESTAMPTZ;
    v_target_time TIMESTAMPTZ;
    v_current_day INTEGER;
    v_days_to_add INTEGER;
BEGIN
    v_local_time := p_from_time AT TIME ZONE p_timezone;

    CASE p_frequency
        WHEN 'daily' THEN
            v_target_time := (v_local_time::date + p_time) AT TIME ZONE p_timezone;
            IF v_target_time <= p_from_time THEN
                v_target_time := v_target_time + INTERVAL '1 day';
            END IF;

        WHEN 'weekly' THEN
            v_current_day := EXTRACT(DOW FROM v_local_time);
            v_days_to_add := COALESCE(p_day_of_week, 1) - v_current_day;
            IF v_days_to_add < 0 OR (v_days_to_add = 0 AND (v_local_time::date + p_time) <= v_local_time::time) THEN
                v_days_to_add := v_days_to_add + 7;
            END IF;
            v_target_time := ((v_local_time::date + v_days_to_add * INTERVAL '1 day') + p_time) AT TIME ZONE p_timezone;

        WHEN 'monthly' THEN
            v_target_time := (DATE_TRUNC('month', v_local_time) + (COALESCE(p_day_of_month, 1) - 1) * INTERVAL '1 day' + p_time) AT TIME ZONE p_timezone;
            IF v_target_time <= p_from_time THEN
                v_target_time := (DATE_TRUNC('month', v_local_time) + INTERVAL '1 month' + (COALESCE(p_day_of_month, 1) - 1) * INTERVAL '1 day' + p_time) AT TIME ZONE p_timezone;
            END IF;
    END CASE;

    RETURN v_target_time;
END;
$$ LANGUAGE plpgsql;

-- Function to get schedules due for execution
CREATE OR REPLACE FUNCTION get_due_report_schedules(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    report_id UUID,
    name TEXT,
    frequency TEXT,
    export_format TEXT,
    recipients TEXT[],
    next_run_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rs.id,
        rs.report_id,
        rs.name,
        rs.frequency,
        rs.export_format::TEXT,
        rs.recipients,
        rs.next_run_at
    FROM report_schedules rs
    WHERE rs.is_active = TRUE
      AND rs.next_run_at <= NOW()
      AND COALESCE(rs.consecutive_failures, 0) < COALESCE(rs.max_consecutive_failures, 3)
    ORDER BY rs.next_run_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to process unsubscribe
CREATE OR REPLACE FUNCTION process_report_unsubscribe(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_recipient_id UUID;
BEGIN
    SELECT id INTO v_recipient_id
    FROM report_schedule_recipients
    WHERE unsubscribe_token = p_token AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE report_schedule_recipients SET
        is_active = FALSE,
        unsubscribed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_recipient_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGERS
-- ===========================================

DROP TRIGGER IF EXISTS update_report_schedule_recipients_timestamp ON public.report_schedule_recipients;
CREATE TRIGGER update_report_schedule_recipients_timestamp
    BEFORE UPDATE ON public.report_schedule_recipients
    FOR EACH ROW EXECUTE FUNCTION update_report_tables_updated_at();

DROP TRIGGER IF EXISTS update_report_delivery_conditions_timestamp ON public.report_delivery_conditions;
CREATE TRIGGER update_report_delivery_conditions_timestamp
    BEFORE UPDATE ON public.report_delivery_conditions
    FOR EACH ROW EXECUTE FUNCTION update_report_tables_updated_at();

DROP TRIGGER IF EXISTS update_report_delivery_log_timestamp ON public.report_delivery_log;
CREATE TRIGGER update_report_delivery_log_timestamp
    BEFORE UPDATE ON public.report_delivery_log
    FOR EACH ROW EXECUTE FUNCTION update_report_tables_updated_at();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.report_schedule_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_delivery_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_delivery_log ENABLE ROW LEVEL SECURITY;

-- Recipients: Access via parent schedule
CREATE POLICY "Users can view recipients of own schedules"
    ON public.report_schedule_recipients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.report_schedules rs
            WHERE rs.id = report_schedule_recipients.schedule_id
            AND rs.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can manage recipients of own schedules"
    ON public.report_schedule_recipients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.report_schedules rs
            WHERE rs.id = report_schedule_recipients.schedule_id
            AND rs.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Delivery conditions: Access via parent schedule
CREATE POLICY "Users can view conditions of own schedules"
    ON public.report_delivery_conditions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.report_schedules rs
            WHERE rs.id = report_delivery_conditions.schedule_id
            AND rs.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can manage conditions of own schedules"
    ON public.report_delivery_conditions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.report_schedules rs
            WHERE rs.id = report_delivery_conditions.schedule_id
            AND rs.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Delivery log: Access via execution
CREATE POLICY "Users can view delivery logs of own reports"
    ON public.report_delivery_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.report_executions re
            JOIN public.report_schedules rs ON rs.report_id = re.report_id
            WHERE re.id = report_delivery_log.execution_id
            AND rs.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_schedule_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_delivery_conditions TO authenticated;
GRANT SELECT ON public.report_delivery_log TO authenticated;

GRANT ALL ON public.report_schedule_recipients TO service_role;
GRANT ALL ON public.report_delivery_conditions TO service_role;
GRANT ALL ON public.report_delivery_log TO service_role;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.report_schedule_recipients IS 'Recipients (users or external emails) for scheduled reports';
COMMENT ON TABLE public.report_delivery_conditions IS 'Conditional rules for report delivery';
COMMENT ON TABLE public.report_delivery_log IS 'Delivery log for each recipient of each execution';
COMMENT ON FUNCTION calculate_report_next_run IS 'Calculates next run time based on frequency';
COMMENT ON FUNCTION get_due_report_schedules IS 'Returns schedules due for execution';
COMMENT ON FUNCTION process_report_unsubscribe IS 'Processes unsubscribe action via token';
