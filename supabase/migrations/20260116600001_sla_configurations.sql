-- Migration: SLA Configurations for Intake Tickets
-- Purpose: Create database-driven SLA configuration instead of hardcoded values
-- Fixes: SL-001 from intake audit

-- Create SLA configurations table
CREATE TABLE IF NOT EXISTS sla_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,

    -- Context matching
    request_type VARCHAR(50), -- NULL means applies to all types
    urgency VARCHAR(20), -- NULL means applies to all urgency levels
    sensitivity VARCHAR(20), -- NULL means applies to all sensitivity levels

    -- SLA timing (in minutes)
    acknowledgment_target_minutes INTEGER NOT NULL DEFAULT 30,
    triage_target_minutes INTEGER NOT NULL DEFAULT 60,
    assignment_target_minutes INTEGER NOT NULL DEFAULT 120,
    resolution_target_minutes INTEGER NOT NULL DEFAULT 1440, -- 24 hours default

    -- Business hours configuration
    business_hours_only BOOLEAN NOT NULL DEFAULT true,
    business_hours_start TIME NOT NULL DEFAULT '08:00:00',
    business_hours_end TIME NOT NULL DEFAULT '17:00:00',
    business_days INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5], -- Mon-Fri (0=Sun, 6=Sat)

    -- Escalation thresholds (percentage of SLA time)
    warning_threshold_percent INTEGER NOT NULL DEFAULT 75,
    critical_threshold_percent INTEGER NOT NULL DEFAULT 90,

    -- Escalation contacts
    escalation_level1_role VARCHAR(50) DEFAULT 'steward',
    escalation_level2_role VARCHAR(50) DEFAULT 'admin',

    -- Pause configuration
    allow_pause BOOLEAN NOT NULL DEFAULT true,
    max_pause_count INTEGER DEFAULT 3,
    max_total_pause_minutes INTEGER DEFAULT 480, -- 8 hours

    -- Priority and status
    priority INTEGER NOT NULL DEFAULT 100, -- Lower = higher priority for matching
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Ensure uniqueness for specific combinations
    CONSTRAINT unique_sla_config UNIQUE (request_type, urgency, sensitivity)
);

-- Create SLA pause history table
CREATE TABLE IF NOT EXISTS sla_pause_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    sla_type VARCHAR(30) NOT NULL, -- 'acknowledgment', 'triage', 'assignment', 'resolution'

    paused_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resumed_at TIMESTAMPTZ,
    pause_reason TEXT,
    paused_by UUID REFERENCES auth.users(id),
    resumed_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_sla_configurations_lookup ON sla_configurations (
    request_type, urgency, sensitivity, is_active, priority
);

CREATE INDEX idx_sla_pause_history_ticket ON sla_pause_history (ticket_id);
CREATE INDEX idx_sla_pause_history_active ON sla_pause_history (ticket_id, sla_type) WHERE resumed_at IS NULL;

-- Add SLA tracking fields to intake_tickets if not exists
DO $$
BEGIN
    -- Add SLA paused state tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'intake_tickets' AND column_name = 'sla_paused'
    ) THEN
        ALTER TABLE intake_tickets ADD COLUMN sla_paused BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add accumulated pause time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'intake_tickets' AND column_name = 'sla_pause_accumulated_minutes'
    ) THEN
        ALTER TABLE intake_tickets ADD COLUMN sla_pause_accumulated_minutes INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Add SLA configuration reference
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'intake_tickets' AND column_name = 'sla_configuration_id'
    ) THEN
        ALTER TABLE intake_tickets ADD COLUMN sla_configuration_id UUID REFERENCES sla_configurations(id);
    END IF;
END $$;

-- Function to find the best matching SLA configuration
CREATE OR REPLACE FUNCTION find_sla_configuration(
    p_request_type VARCHAR(50),
    p_urgency VARCHAR(20),
    p_sensitivity VARCHAR(20) DEFAULT NULL
)
RETURNS sla_configurations AS $$
DECLARE
    v_config sla_configurations;
BEGIN
    -- Find the most specific matching configuration
    -- Order: exact match > partial match > default (all NULL)
    SELECT * INTO v_config
    FROM sla_configurations
    WHERE is_active = true
      AND (request_type IS NULL OR request_type = p_request_type)
      AND (urgency IS NULL OR urgency = p_urgency)
      AND (sensitivity IS NULL OR sensitivity = p_sensitivity)
    ORDER BY
        -- Prefer more specific matches
        CASE WHEN request_type IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN urgency IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN sensitivity IS NOT NULL THEN 0 ELSE 1 END,
        priority ASC
    LIMIT 1;

    RETURN v_config;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate effective SLA deadline considering business hours and pauses
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
    p_start_time TIMESTAMPTZ,
    p_target_minutes INTEGER,
    p_business_hours_only BOOLEAN,
    p_business_start TIME,
    p_business_end TIME,
    p_business_days INTEGER[],
    p_pause_accumulated_minutes INTEGER DEFAULT 0
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
    v_remaining_minutes INTEGER;
    v_current_time TIMESTAMPTZ;
    v_day_of_week INTEGER;
    v_current_date DATE;
    v_business_start_dt TIMESTAMPTZ;
    v_business_end_dt TIMESTAMPTZ;
    v_minutes_until_end INTEGER;
BEGIN
    -- Adjust target by pause time
    v_remaining_minutes := p_target_minutes + p_pause_accumulated_minutes;
    v_current_time := p_start_time;

    -- If not business hours only, simple calculation
    IF NOT p_business_hours_only THEN
        RETURN v_current_time + (v_remaining_minutes || ' minutes')::INTERVAL;
    END IF;

    -- Business hours calculation
    WHILE v_remaining_minutes > 0 LOOP
        v_current_date := v_current_time::DATE;
        v_day_of_week := EXTRACT(DOW FROM v_current_time)::INTEGER;

        -- Check if current day is a business day
        IF v_day_of_week = ANY(p_business_days) THEN
            v_business_start_dt := v_current_date + p_business_start;
            v_business_end_dt := v_current_date + p_business_end;

            -- If before business hours, move to business start
            IF v_current_time < v_business_start_dt THEN
                v_current_time := v_business_start_dt;
            END IF;

            -- If within business hours, calculate
            IF v_current_time >= v_business_start_dt AND v_current_time < v_business_end_dt THEN
                v_minutes_until_end := EXTRACT(EPOCH FROM (v_business_end_dt - v_current_time))::INTEGER / 60;

                IF v_remaining_minutes <= v_minutes_until_end THEN
                    RETURN v_current_time + (v_remaining_minutes || ' minutes')::INTERVAL;
                ELSE
                    v_remaining_minutes := v_remaining_minutes - v_minutes_until_end;
                    v_current_time := v_business_end_dt;
                END IF;
            END IF;
        END IF;

        -- Move to next day
        v_current_time := (v_current_time::DATE + 1) + p_business_start;

        -- Safety check to prevent infinite loop
        IF v_current_time > p_start_time + INTERVAL '365 days' THEN
            RETURN p_start_time + (p_target_minutes || ' minutes')::INTERVAL;
        END IF;
    END LOOP;

    RETURN v_current_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to pause SLA
CREATE OR REPLACE FUNCTION pause_ticket_sla(
    p_ticket_id UUID,
    p_sla_type VARCHAR(30),
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_ticket intake_tickets;
    v_config sla_configurations;
    v_active_pause_count INTEGER;
BEGIN
    -- Get ticket
    SELECT * INTO v_ticket FROM intake_tickets WHERE id = p_ticket_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found';
    END IF;

    -- Get SLA config
    SELECT * INTO v_config FROM sla_configurations WHERE id = v_ticket.sla_configuration_id;
    IF NOT FOUND OR NOT v_config.allow_pause THEN
        RAISE EXCEPTION 'SLA pausing not allowed';
    END IF;

    -- Check max pause count
    SELECT COUNT(*) INTO v_active_pause_count
    FROM sla_pause_history
    WHERE ticket_id = p_ticket_id AND sla_type = p_sla_type;

    IF v_active_pause_count >= v_config.max_pause_count THEN
        RAISE EXCEPTION 'Maximum pause count reached';
    END IF;

    -- Check if already paused
    IF EXISTS (
        SELECT 1 FROM sla_pause_history
        WHERE ticket_id = p_ticket_id AND sla_type = p_sla_type AND resumed_at IS NULL
    ) THEN
        RAISE EXCEPTION 'SLA already paused';
    END IF;

    -- Create pause record
    INSERT INTO sla_pause_history (ticket_id, sla_type, pause_reason, paused_by)
    VALUES (p_ticket_id, p_sla_type, p_reason, auth.uid());

    -- Update ticket
    UPDATE intake_tickets SET sla_paused = true, updated_at = NOW() WHERE id = p_ticket_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resume SLA
CREATE OR REPLACE FUNCTION resume_ticket_sla(
    p_ticket_id UUID,
    p_sla_type VARCHAR(30)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pause_record sla_pause_history;
    v_pause_minutes INTEGER;
    v_config sla_configurations;
    v_ticket intake_tickets;
BEGIN
    -- Get active pause record
    SELECT * INTO v_pause_record
    FROM sla_pause_history
    WHERE ticket_id = p_ticket_id AND sla_type = p_sla_type AND resumed_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active pause found';
    END IF;

    -- Calculate pause duration
    v_pause_minutes := EXTRACT(EPOCH FROM (NOW() - v_pause_record.paused_at))::INTEGER / 60;

    -- Get config and check max pause time
    SELECT * INTO v_ticket FROM intake_tickets WHERE id = p_ticket_id;
    SELECT * INTO v_config FROM sla_configurations WHERE id = v_ticket.sla_configuration_id;

    IF v_config.max_total_pause_minutes IS NOT NULL AND
       (v_ticket.sla_pause_accumulated_minutes + v_pause_minutes) > v_config.max_total_pause_minutes THEN
        v_pause_minutes := v_config.max_total_pause_minutes - v_ticket.sla_pause_accumulated_minutes;
    END IF;

    -- Update pause record
    UPDATE sla_pause_history
    SET resumed_at = NOW(), resumed_by = auth.uid()
    WHERE id = v_pause_record.id;

    -- Update ticket
    UPDATE intake_tickets
    SET
        sla_paused = false,
        sla_pause_accumulated_minutes = sla_pause_accumulated_minutes + v_pause_minutes,
        updated_at = NOW()
    WHERE id = p_ticket_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_pause_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for sla_configurations (read-only for most users)
CREATE POLICY sla_configurations_select ON sla_configurations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY sla_configurations_admin ON sla_configurations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'system')
        )
    );

-- RLS policies for sla_pause_history
CREATE POLICY sla_pause_history_select ON sla_pause_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY sla_pause_history_insert ON sla_pause_history
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'steward', 'coordinator')
        )
    );

-- Insert default SLA configurations
INSERT INTO sla_configurations (
    name, name_ar, description, description_ar,
    request_type, urgency,
    acknowledgment_target_minutes, triage_target_minutes,
    assignment_target_minutes, resolution_target_minutes,
    business_hours_only, priority
) VALUES
    -- Default (catch-all) configuration
    ('Default SLA', 'اتفاقية الخدمة الافتراضية',
     'Default SLA for all tickets', 'اتفاقية الخدمة الافتراضية لجميع التذاكر',
     NULL, NULL,
     30, 120, 240, 1440, -- 30min/2hr/4hr/24hr
     true, 1000),

    -- Critical urgency - fastest response
    ('Critical Response', 'استجابة حرجة',
     'Urgent SLA for critical tickets', 'اتفاقية خدمة عاجلة للتذاكر الحرجة',
     NULL, 'critical',
     15, 30, 60, 240, -- 15min/30min/1hr/4hr
     false, 100), -- 24/7, highest priority

    -- High urgency
    ('High Priority', 'أولوية عالية',
     'SLA for high urgency tickets', 'اتفاقية خدمة للتذاكر ذات الأولوية العالية',
     NULL, 'high',
     30, 60, 120, 480, -- 30min/1hr/2hr/8hr
     true, 200),

    -- Medium urgency
    ('Standard', 'قياسي',
     'SLA for standard tickets', 'اتفاقية خدمة للتذاكر القياسية',
     NULL, 'medium',
     60, 120, 240, 1440, -- 1hr/2hr/4hr/24hr
     true, 300),

    -- Low urgency
    ('Low Priority', 'أولوية منخفضة',
     'SLA for low urgency tickets', 'اتفاقية خدمة للتذاكر ذات الأولوية المنخفضة',
     NULL, 'low',
     120, 240, 480, 2880, -- 2hr/4hr/8hr/48hr
     true, 400),

    -- Engagement type specific
    ('Engagement SLA', 'اتفاقية خدمة المشاركة',
     'SLA specific for engagement requests', 'اتفاقية خدمة خاصة بطلبات المشاركة',
     'engagement', NULL,
     30, 60, 180, 1440,
     true, 500),

    -- Position type specific
    ('Position SLA', 'اتفاقية خدمة الموقف',
     'SLA specific for position requests', 'اتفاقية خدمة خاصة بطلبات الموقف',
     'position', NULL,
     30, 90, 240, 2160, -- 36 hours for research
     true, 500),

    -- MOU Action - typically more urgent
    ('MOU Action SLA', 'اتفاقية خدمة مذكرة التفاهم',
     'SLA for MOU-related actions', 'اتفاقية خدمة للإجراءات المتعلقة بمذكرات التفاهم',
     'mou_action', NULL,
     15, 30, 120, 720, -- 12 hours
     true, 450)
ON CONFLICT (request_type, urgency, sensitivity) DO NOTHING;

-- Add comment
COMMENT ON TABLE sla_configurations IS 'Configurable SLA rules for intake tickets - matches based on request type, urgency, and sensitivity';
COMMENT ON TABLE sla_pause_history IS 'History of SLA pauses for intake tickets';
