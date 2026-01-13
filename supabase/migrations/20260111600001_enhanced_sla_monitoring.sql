-- Migration: Enhanced SLA Monitoring System
-- Feature: sla-monitoring
-- Description: Configurable SLA policies with automatic tracking, breach detection, and escalation workflows
-- Dependencies: 20250129004_create_sla_tables.sql, 20251002006_create_sla_configs.sql

-- ============================================
-- ENUM TYPES
-- ============================================

-- SLA target types (what type of deadline)
CREATE TYPE sla_target_type AS ENUM (
  'acknowledgment',   -- First response SLA
  'resolution',       -- Final resolution SLA
  'first_update',     -- First status update SLA
  'escalation'        -- Time before auto-escalation
);

-- Escalation status
CREATE TYPE sla_escalation_status AS ENUM (
  'pending',          -- Escalation not yet triggered
  'triggered',        -- Escalation has been triggered
  'acknowledged',     -- Escalation acknowledged by recipient
  'resolved',         -- Issue resolved after escalation
  'dismissed'         -- Escalation dismissed as false positive
);

-- Entity types that SLA can apply to
CREATE TYPE sla_entity_type AS ENUM (
  'ticket',           -- Intake tickets
  'commitment',       -- AA Commitments
  'task'              -- Tasks
);

-- ============================================
-- ENHANCED SLA POLICIES TABLE
-- ============================================

-- Drop old constraint if exists and add new columns to sla_policies
ALTER TABLE sla_policies
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS entity_type sla_entity_type DEFAULT 'ticket',
ADD COLUMN IF NOT EXISTS warning_threshold_pct INTEGER DEFAULT 75 CHECK (warning_threshold_pct >= 0 AND warning_threshold_pct <= 100),
ADD COLUMN IF NOT EXISTS escalation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS escalation_levels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notification_channels TEXT[] DEFAULT ARRAY['in_app', 'email'],
ADD COLUMN IF NOT EXISTS applies_to_units UUID[],
ADD COLUMN IF NOT EXISTS excluded_assignees UUID[];

-- Backfill names for existing policies
UPDATE sla_policies
SET name = CONCAT('SLA Policy - ', COALESCE(request_type::text, 'All'), ' / ', COALESCE(priority::text, 'All'))
WHERE name IS NULL;

-- Add comment
COMMENT ON COLUMN sla_policies.escalation_levels IS 'JSON array of escalation levels: [{level: 1, after_minutes: 60, notify_role: "supervisor"}, ...]';
COMMENT ON COLUMN sla_policies.notification_channels IS 'Channels for breach notifications: in_app, email, sms, push';

-- ============================================
-- SLA ESCALATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sla_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the entity being escalated
  entity_type sla_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- SLA details
  policy_id UUID REFERENCES sla_policies(id),
  sla_event_id UUID REFERENCES sla_events(id),
  target_type sla_target_type NOT NULL DEFAULT 'resolution',

  -- Escalation level tracking
  escalation_level INTEGER NOT NULL DEFAULT 1,
  status sla_escalation_status NOT NULL DEFAULT 'pending',

  -- People involved
  escalated_from_id UUID,
  escalated_to_id UUID,
  escalated_to_role TEXT,

  -- Timing
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Details
  reason TEXT,
  notes TEXT,
  auto_triggered BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_active_escalation UNIQUE (entity_type, entity_id, escalation_level, status)
);

-- Indexes for escalations
CREATE INDEX idx_sla_escalations_entity ON sla_escalations(entity_type, entity_id);
CREATE INDEX idx_sla_escalations_status ON sla_escalations(status) WHERE status IN ('pending', 'triggered');
CREATE INDEX idx_sla_escalations_escalated_to ON sla_escalations(escalated_to_id) WHERE status = 'triggered';

COMMENT ON TABLE sla_escalations IS 'Tracks escalation events when SLA targets are at risk or breached';

-- ============================================
-- SLA COMPLIANCE METRICS MATERIALIZED VIEW
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS sla_compliance_metrics AS
WITH policy_metrics AS (
  SELECT
    p.id AS policy_id,
    p.name AS policy_name,
    p.entity_type,
    p.priority,
    p.request_type,
    -- Count total events
    COUNT(DISTINCT e.ticket_id) AS total_items,
    -- Acknowledgment metrics
    COUNT(DISTINCT CASE WHEN e.event_type = 'met' AND e.elapsed_minutes <= p.acknowledgment_target THEN e.ticket_id END) AS ack_met_count,
    COUNT(DISTINCT CASE WHEN e.event_type = 'breached' AND e.reason = 'acknowledgment' THEN e.ticket_id END) AS ack_breached_count,
    -- Resolution metrics
    COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') AND e.reason = 'resolution' THEN e.ticket_id END) AS resolution_total,
    COUNT(DISTINCT CASE WHEN e.event_type = 'met' AND e.reason = 'resolution' THEN e.ticket_id END) AS resolution_met_count,
    COUNT(DISTINCT CASE WHEN e.event_type = 'breached' AND e.reason = 'resolution' THEN e.ticket_id END) AS resolution_breached_count,
    -- Average resolution time
    AVG(CASE WHEN e.event_type IN ('met', 'breached') THEN e.elapsed_minutes END) AS avg_resolution_minutes,
    -- Calculate compliance rates
    ROUND(
      CASE
        WHEN COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN e.ticket_id END) > 0
        THEN COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN e.ticket_id END)::numeric /
             COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN e.ticket_id END) * 100
        ELSE 0
      END, 2
    ) AS compliance_rate_pct
  FROM sla_policies p
  LEFT JOIN sla_events e ON e.policy_id = p.id
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.entity_type, p.priority, p.request_type
),
assignee_metrics AS (
  SELECT
    t.assigned_to AS assignee_id,
    p.id AS policy_id,
    COUNT(DISTINCT t.id) AS total_assigned,
    COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END) AS met_count,
    COUNT(DISTINCT CASE WHEN e.event_type = 'breached' THEN t.id END) AS breached_count,
    AVG(e.elapsed_minutes) AS avg_resolution_minutes
  FROM intake_tickets t
  JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
  LEFT JOIN sla_events e ON e.ticket_id = t.id AND e.policy_id = p.id
  WHERE t.assigned_to IS NOT NULL
  GROUP BY t.assigned_to, p.id
)
SELECT
  pm.policy_id,
  pm.policy_name,
  pm.entity_type,
  pm.priority,
  pm.request_type,
  pm.total_items,
  pm.ack_met_count,
  pm.ack_breached_count,
  pm.resolution_met_count,
  pm.resolution_breached_count,
  pm.avg_resolution_minutes,
  pm.compliance_rate_pct,
  NOW() AS refreshed_at
FROM policy_metrics pm;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_sla_compliance_metrics_policy
ON sla_compliance_metrics(policy_id);

COMMENT ON MATERIALIZED VIEW sla_compliance_metrics IS 'Pre-calculated SLA compliance metrics by policy, refreshed periodically';

-- ============================================
-- SLA COMPLIANCE BY ASSIGNEE VIEW
-- ============================================

CREATE OR REPLACE VIEW sla_compliance_by_assignee AS
SELECT
  t.assigned_to AS assignee_id,
  sp.id AS user_id,
  sp.full_name,
  sp.full_name_ar,
  sp.unit_id,
  COUNT(DISTINCT t.id) AS total_items,
  COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END) AS met_count,
  COUNT(DISTINCT CASE WHEN e.event_type = 'breached' THEN t.id END) AS breached_count,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) > 0
      THEN COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END)::numeric /
           COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) * 100
      ELSE 100
    END, 2
  ) AS compliance_rate_pct,
  AVG(CASE WHEN e.event_type IN ('met', 'breached') THEN e.elapsed_minutes END) AS avg_resolution_minutes,
  COUNT(DISTINCT CASE WHEN NOW() > (t.submitted_at + (p.resolution_target * INTERVAL '1 minute'))
        AND t.status NOT IN ('closed', 'merged', 'converted') THEN t.id END) AS currently_at_risk
FROM intake_tickets t
LEFT JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
LEFT JOIN sla_events e ON e.ticket_id = t.id AND e.policy_id = p.id
LEFT JOIN staff_profiles sp ON sp.user_id = t.assigned_to
WHERE t.assigned_to IS NOT NULL
GROUP BY t.assigned_to, sp.id, sp.full_name, sp.full_name_ar, sp.unit_id;

COMMENT ON VIEW sla_compliance_by_assignee IS 'Real-time SLA compliance metrics per assignee';

-- ============================================
-- SLA TRENDS TABLE (for historical analysis)
-- ============================================

CREATE TABLE IF NOT EXISTS sla_compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  entity_type sla_entity_type NOT NULL DEFAULT 'ticket',

  -- Aggregate metrics
  total_items INTEGER NOT NULL DEFAULT 0,
  met_count INTEGER NOT NULL DEFAULT 0,
  breached_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,

  -- Time metrics (in minutes)
  avg_resolution_time INTEGER,
  p50_resolution_time INTEGER,
  p90_resolution_time INTEGER,
  p99_resolution_time INTEGER,

  -- Compliance rates
  overall_compliance_pct NUMERIC(5,2),
  acknowledgment_compliance_pct NUMERIC(5,2),
  resolution_compliance_pct NUMERIC(5,2),

  -- Breakdown by priority
  metrics_by_priority JSONB DEFAULT '{}'::jsonb,

  -- Breakdown by assignee (top 10)
  metrics_by_assignee JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_daily_snapshot UNIQUE (snapshot_date, entity_type)
);

CREATE INDEX idx_sla_snapshots_date ON sla_compliance_snapshots(snapshot_date DESC);

COMMENT ON TABLE sla_compliance_snapshots IS 'Daily snapshots of SLA compliance for trend analysis';

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to get SLA dashboard overview
CREATE OR REPLACE FUNCTION get_sla_dashboard_overview(
  p_entity_type sla_entity_type DEFAULT 'ticket',
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_items BIGINT,
  met_count BIGINT,
  breached_count BIGINT,
  at_risk_count BIGINT,
  compliance_rate NUMERIC,
  avg_resolution_minutes NUMERIC,
  trend_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH current_metrics AS (
    SELECT
      COUNT(DISTINCT t.id) AS total,
      COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END) AS met,
      COUNT(DISTINCT CASE WHEN e.event_type = 'breached' THEN t.id END) AS breached,
      COUNT(DISTINCT CASE
        WHEN t.status NOT IN ('closed', 'merged', 'converted')
        AND NOW() > (t.submitted_at + (p.acknowledgment_target * INTERVAL '1 minute') * 0.75)
        AND e.event_type NOT IN ('met', 'breached')
        THEN t.id
      END) AS at_risk,
      AVG(CASE WHEN e.event_type IN ('met', 'breached') THEN e.elapsed_minutes END) AS avg_resolution
    FROM intake_tickets t
    LEFT JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
    LEFT JOIN sla_events e ON e.ticket_id = t.id AND e.policy_id = p.id
    WHERE t.created_at::date BETWEEN p_start_date AND p_end_date
  ),
  trend AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', snapshot_date,
        'compliance_pct', overall_compliance_pct,
        'total', total_items,
        'met', met_count,
        'breached', breached_count
      ) ORDER BY snapshot_date
    ) AS data
    FROM sla_compliance_snapshots
    WHERE snapshot_date BETWEEN p_start_date AND p_end_date
      AND entity_type = p_entity_type
  )
  SELECT
    cm.total,
    cm.met,
    cm.breached,
    cm.at_risk,
    ROUND(CASE WHEN cm.total > 0 THEN cm.met::numeric / NULLIF(cm.met + cm.breached, 0) * 100 ELSE 0 END, 2),
    ROUND(cm.avg_resolution, 2),
    COALESCE(t.data, '[]'::jsonb)
  FROM current_metrics cm, trend t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SLA compliance by type
CREATE OR REPLACE FUNCTION get_sla_compliance_by_type(
  p_entity_type sla_entity_type DEFAULT 'ticket',
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  request_type TEXT,
  total_items BIGINT,
  met_count BIGINT,
  breached_count BIGINT,
  compliance_rate NUMERIC,
  avg_resolution_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.request_type::text,
    COUNT(DISTINCT t.id),
    COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END),
    COUNT(DISTINCT CASE WHEN e.event_type = 'breached' THEN t.id END),
    ROUND(
      CASE
        WHEN COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) > 0
        THEN COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END)::numeric /
             COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) * 100
        ELSE 100
      END, 2
    ),
    ROUND(AVG(CASE WHEN e.event_type IN ('met', 'breached') THEN e.elapsed_minutes END), 2)
  FROM intake_tickets t
  LEFT JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
  LEFT JOIN sla_events e ON e.ticket_id = t.id AND e.policy_id = p.id
  WHERE t.created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY t.request_type
  ORDER BY COUNT(DISTINCT t.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SLA compliance by assignee
CREATE OR REPLACE FUNCTION get_sla_compliance_by_assignee(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  assignee_id UUID,
  assignee_name TEXT,
  assignee_name_ar TEXT,
  total_items BIGINT,
  met_count BIGINT,
  breached_count BIGINT,
  compliance_rate NUMERIC,
  avg_resolution_minutes NUMERIC,
  currently_at_risk BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.assigned_to,
    COALESCE(sp.full_name, 'Unassigned'),
    sp.full_name_ar,
    COUNT(DISTINCT t.id),
    COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END),
    COUNT(DISTINCT CASE WHEN e.event_type = 'breached' THEN t.id END),
    ROUND(
      CASE
        WHEN COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) > 0
        THEN COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END)::numeric /
             COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) * 100
        ELSE 100
      END, 2
    ),
    ROUND(AVG(CASE WHEN e.event_type IN ('met', 'breached') THEN e.elapsed_minutes END), 2),
    COUNT(DISTINCT CASE
      WHEN t.status NOT IN ('closed', 'merged', 'converted')
      AND NOW() > (t.submitted_at + (p.resolution_target * INTERVAL '1 minute'))
      THEN t.id
    END)
  FROM intake_tickets t
  LEFT JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
  LEFT JOIN sla_events e ON e.ticket_id = t.id AND e.policy_id = p.id
  LEFT JOIN staff_profiles sp ON sp.user_id = t.assigned_to
  WHERE t.created_at::date BETWEEN p_start_date AND p_end_date
    AND t.assigned_to IS NOT NULL
  GROUP BY t.assigned_to, sp.full_name, sp.full_name_ar
  ORDER BY COUNT(DISTINCT t.id) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get at-risk items (items approaching SLA breach)
CREATE OR REPLACE FUNCTION get_sla_at_risk_items(
  p_entity_type sla_entity_type DEFAULT 'ticket',
  p_threshold_pct INTEGER DEFAULT 75,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  entity_id UUID,
  entity_type sla_entity_type,
  title TEXT,
  priority TEXT,
  status TEXT,
  assigned_to UUID,
  assignee_name TEXT,
  sla_target_minutes INTEGER,
  elapsed_minutes INTEGER,
  remaining_minutes INTEGER,
  progress_pct INTEGER,
  deadline_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    'ticket'::sla_entity_type,
    t.title,
    t.priority::text,
    t.status::text,
    t.assigned_to,
    COALESCE(sp.full_name, 'Unassigned'),
    p.resolution_target,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at)))::INTEGER / 60,
    GREATEST(0, p.resolution_target - (EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at)))::INTEGER / 60)),
    LEAST(100, (EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at)))::INTEGER / 60 * 100 / p.resolution_target)),
    (COALESCE(t.submitted_at, t.created_at) + (p.resolution_target * INTERVAL '1 minute'))::TIMESTAMPTZ
  FROM intake_tickets t
  JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
  LEFT JOIN staff_profiles sp ON sp.user_id = t.assigned_to
  WHERE t.status NOT IN ('closed', 'merged', 'converted')
    AND (EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 / p.resolution_target * 100) >= p_threshold_pct
  ORDER BY
    (EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 / p.resolution_target) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to capture daily SLA snapshot (to be called by cron)
CREATE OR REPLACE FUNCTION capture_sla_daily_snapshot()
RETURNS void AS $$
DECLARE
  v_snapshot_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  INSERT INTO sla_compliance_snapshots (
    snapshot_date,
    entity_type,
    total_items,
    met_count,
    breached_count,
    warning_count,
    avg_resolution_time,
    overall_compliance_pct,
    metrics_by_priority,
    metrics_by_assignee
  )
  SELECT
    v_snapshot_date,
    'ticket'::sla_entity_type,
    COUNT(DISTINCT t.id),
    COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END),
    COUNT(DISTINCT CASE WHEN e.event_type = 'breached' THEN t.id END),
    COUNT(DISTINCT CASE
      WHEN t.status NOT IN ('closed', 'merged', 'converted')
      AND NOW() > (t.submitted_at + (p.acknowledgment_target * INTERVAL '1 minute') * 0.75)
      THEN t.id
    END),
    ROUND(AVG(CASE WHEN e.event_type IN ('met', 'breached') THEN e.elapsed_minutes END)),
    ROUND(
      CASE
        WHEN COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) > 0
        THEN COUNT(DISTINCT CASE WHEN e.event_type = 'met' THEN t.id END)::numeric /
             COUNT(DISTINCT CASE WHEN e.event_type IN ('met', 'breached') THEN t.id END) * 100
        ELSE 100
      END, 2
    ),
    jsonb_build_object(
      'urgent', (SELECT jsonb_build_object('total', COUNT(*), 'met', COUNT(*) FILTER (WHERE e2.event_type = 'met'), 'breached', COUNT(*) FILTER (WHERE e2.event_type = 'breached')) FROM intake_tickets t2 LEFT JOIN sla_events e2 ON e2.ticket_id = t2.id WHERE t2.priority = 'urgent' AND t2.created_at::date = v_snapshot_date),
      'high', (SELECT jsonb_build_object('total', COUNT(*), 'met', COUNT(*) FILTER (WHERE e2.event_type = 'met'), 'breached', COUNT(*) FILTER (WHERE e2.event_type = 'breached')) FROM intake_tickets t2 LEFT JOIN sla_events e2 ON e2.ticket_id = t2.id WHERE t2.priority = 'high' AND t2.created_at::date = v_snapshot_date),
      'medium', (SELECT jsonb_build_object('total', COUNT(*), 'met', COUNT(*) FILTER (WHERE e2.event_type = 'met'), 'breached', COUNT(*) FILTER (WHERE e2.event_type = 'breached')) FROM intake_tickets t2 LEFT JOIN sla_events e2 ON e2.ticket_id = t2.id WHERE t2.priority = 'medium' AND t2.created_at::date = v_snapshot_date),
      'low', (SELECT jsonb_build_object('total', COUNT(*), 'met', COUNT(*) FILTER (WHERE e2.event_type = 'met'), 'breached', COUNT(*) FILTER (WHERE e2.event_type = 'breached')) FROM intake_tickets t2 LEFT JOIN sla_events e2 ON e2.ticket_id = t2.id WHERE t2.priority = 'low' AND t2.created_at::date = v_snapshot_date)
    ),
    '[]'::jsonb
  FROM intake_tickets t
  LEFT JOIN sla_policies p ON p.priority = t.priority AND p.is_active = true
  LEFT JOIN sla_events e ON e.ticket_id = t.id AND e.policy_id = p.id
  WHERE t.created_at::date = v_snapshot_date
  ON CONFLICT (snapshot_date, entity_type) DO UPDATE SET
    total_items = EXCLUDED.total_items,
    met_count = EXCLUDED.met_count,
    breached_count = EXCLUDED.breached_count,
    warning_count = EXCLUDED.warning_count,
    avg_resolution_time = EXCLUDED.avg_resolution_time,
    overall_compliance_pct = EXCLUDED.overall_compliance_pct,
    metrics_by_priority = EXCLUDED.metrics_by_priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE sla_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_compliance_snapshots ENABLE ROW LEVEL SECURITY;

-- SLA escalations: admins and supervisors can see all, users can see their own
CREATE POLICY sla_escalations_select ON sla_escalations
FOR SELECT USING (
  auth.uid() = escalated_from_id OR
  auth.uid() = escalated_to_id OR
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  )
);

CREATE POLICY sla_escalations_insert ON sla_escalations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  )
);

CREATE POLICY sla_escalations_update ON sla_escalations
FOR UPDATE USING (
  auth.uid() = escalated_to_id OR
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  )
);

-- Compliance snapshots: read-only for all authenticated users
CREATE POLICY sla_snapshots_select ON sla_compliance_snapshots
FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON sla_compliance_metrics TO authenticated;
GRANT SELECT ON sla_compliance_by_assignee TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sla_escalations TO authenticated;
GRANT SELECT ON sla_compliance_snapshots TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_dashboard_overview TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_compliance_by_type TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_compliance_by_assignee TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_at_risk_items TO authenticated;
GRANT EXECUTE ON FUNCTION capture_sla_daily_snapshot TO authenticated;

-- Enable realtime for escalations
ALTER PUBLICATION supabase_realtime ADD TABLE sla_escalations;
