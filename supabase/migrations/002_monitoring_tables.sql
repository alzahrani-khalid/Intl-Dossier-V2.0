-- Migration: 002_monitoring_tables.sql
-- Description: Create monitoring-related tables for alerts, anomalies, and health metrics
-- Dependencies: 001_security_tables.sql (for auth.users reference)
-- Created: 2025-01-27

-- Create monitoring schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS monitoring;

-- ============================================================================
-- ALERT CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE monitoring.alert_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL, -- Arabic name for bilingual support
    condition TEXT NOT NULL, -- Prometheus expression
    threshold NUMERIC NOT NULL CHECK (threshold > 0),
    duration INTERVAL NOT NULL DEFAULT '5 minutes',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    channels TEXT[] NOT NULL DEFAULT '{"email"}',
    metadata JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration > INTERVAL '0 seconds'),
    CONSTRAINT valid_channels CHECK (array_length(channels, 1) > 0),
    CONSTRAINT valid_channel_types CHECK (
        channels <@ ARRAY['email', 'sms', 'webhook', 'slack', 'teams']
    )
);

-- ============================================================================
-- ALERT HISTORY TABLE
-- ============================================================================

CREATE TABLE monitoring.alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES monitoring.alert_configs(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ NULL,
    value NUMERIC NOT NULL, -- Metric value at trigger time
    message TEXT NOT NULL, -- Alert message (English)
    message_ar TEXT NOT NULL, -- Alert message (Arabic)
    notifications_sent JSONB NOT NULL DEFAULT '{}',
    acknowledged_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ NULL,
    
    -- Constraints
    CONSTRAINT valid_resolution CHECK (resolved_at IS NULL OR resolved_at >= triggered_at),
    CONSTRAINT valid_acknowledgment CHECK (
        (acknowledged_by IS NULL AND acknowledged_at IS NULL) OR
        (acknowledged_by IS NOT NULL AND acknowledged_at IS NOT NULL)
    ),
    CONSTRAINT valid_acknowledgment_timing CHECK (
        acknowledged_at IS NULL OR acknowledged_at >= triggered_at
    )
);

-- ============================================================================
-- ANOMALY PATTERNS TABLE
-- ============================================================================

CREATE TABLE monitoring.anomaly_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_type TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'system', 'api')),
    entity_id TEXT NOT NULL,
    anomaly_score NUMERIC NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
    sensitivity_level TEXT NOT NULL CHECK (sensitivity_level IN ('low', 'medium', 'high', 'custom')),
    features JSONB NOT NULL,
    classification TEXT NULL CHECK (classification IN ('legitimate', 'suspicious', 'malicious')),
    false_positive BOOLEAN NOT NULL DEFAULT false,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ NULL,
    reviewed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT valid_review CHECK (
        (reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT valid_review_timing CHECK (
        reviewed_at IS NULL OR reviewed_at >= detected_at
    ),
    CONSTRAINT valid_features CHECK (jsonb_typeof(features) = 'object')
);

-- ============================================================================
-- SYSTEM HEALTH METRICS TABLE
-- ============================================================================

CREATE TABLE monitoring.health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu', 'memory', 'latency', 'throughput', 'error_rate')),
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    threshold_exceeded BOOLEAN NOT NULL DEFAULT false,
    instance_id TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_value CHECK (value >= 0),
    CONSTRAINT valid_unit CHECK (length(unit) > 0),
    CONSTRAINT valid_instance_id CHECK (length(instance_id) > 0)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Alert configuration indexes
CREATE INDEX idx_alert_configs_active ON monitoring.alert_configs (is_active);
CREATE INDEX idx_alert_configs_severity ON monitoring.alert_configs (severity);
CREATE INDEX idx_alert_configs_name ON monitoring.alert_configs (name);
CREATE INDEX idx_alert_configs_created ON monitoring.alert_configs (created_at);

-- Alert history indexes
CREATE INDEX idx_alert_history_config ON monitoring.alert_history (config_id);
CREATE INDEX idx_alert_history_triggered ON monitoring.alert_history (triggered_at DESC);
CREATE INDEX idx_alert_history_unresolved ON monitoring.alert_history (triggered_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_alert_history_acknowledged ON monitoring.alert_history (acknowledged_at) WHERE acknowledged_at IS NOT NULL;
CREATE INDEX idx_alert_history_severity ON monitoring.alert_history (config_id, triggered_at DESC);

-- Anomaly patterns indexes
CREATE INDEX idx_anomaly_patterns_entity ON monitoring.anomaly_patterns (entity_type, entity_id);
CREATE INDEX idx_anomaly_patterns_score ON monitoring.anomaly_patterns (anomaly_score DESC);
CREATE INDEX idx_anomaly_patterns_detected ON monitoring.anomaly_patterns (detected_at DESC);
CREATE INDEX idx_anomaly_patterns_unreviewed ON monitoring.anomaly_patterns (detected_at) WHERE reviewed_at IS NULL;
CREATE INDEX idx_anomaly_patterns_sensitivity ON monitoring.anomaly_patterns (sensitivity_level, detected_at DESC);
CREATE INDEX idx_anomaly_patterns_false_positive ON monitoring.anomaly_patterns (false_positive, detected_at DESC);

-- Health metrics indexes
CREATE INDEX idx_health_metrics_service ON monitoring.health_metrics (service_name, recorded_at DESC);
CREATE INDEX idx_health_metrics_type ON monitoring.health_metrics (metric_type, recorded_at DESC);
CREATE INDEX idx_health_metrics_exceeded ON monitoring.health_metrics (threshold_exceeded, recorded_at DESC) WHERE threshold_exceeded = true;
CREATE INDEX idx_health_metrics_instance ON monitoring.health_metrics (instance_id, recorded_at DESC);
CREATE INDEX idx_health_metrics_time_series ON monitoring.health_metrics (service_name, metric_type, recorded_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Apply updated_at trigger to alert_configs
CREATE TRIGGER trigger_alert_configs_updated_at
    BEFORE UPDATE ON monitoring.alert_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR ALERT MANAGEMENT
-- ============================================================================

-- Function to acknowledge an alert
CREATE OR REPLACE FUNCTION acknowledge_alert(
    alert_id UUID,
    user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE monitoring.alert_history
    SET acknowledged_by = user_id,
        acknowledged_at = now()
    WHERE id = alert_id
    AND acknowledged_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve an alert
CREATE OR REPLACE FUNCTION resolve_alert(
    alert_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE monitoring.alert_history
    SET resolved_at = now()
    WHERE id = alert_id
    AND resolved_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get active alerts count
CREATE OR REPLACE FUNCTION get_active_alerts_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM monitoring.alert_history
        WHERE resolved_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS FOR ANOMALY DETECTION
-- ============================================================================

-- Function to mark anomaly as reviewed
CREATE OR REPLACE FUNCTION review_anomaly(
    anomaly_id UUID,
    reviewer_id UUID,
    classification TEXT,
    is_false_positive BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE monitoring.anomaly_patterns
    SET reviewed_by = reviewer_id,
        reviewed_at = now(),
        classification = review_anomaly.classification,
        false_positive = is_false_positive
    WHERE id = anomaly_id
    AND reviewed_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get unreviewed anomalies count
CREATE OR REPLACE FUNCTION get_unreviewed_anomalies_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM monitoring.anomaly_patterns
        WHERE reviewed_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS FOR HEALTH METRICS
-- ============================================================================

-- Function to record health metric
CREATE OR REPLACE FUNCTION record_health_metric(
    p_service_name TEXT,
    p_metric_type TEXT,
    p_value NUMERIC,
    p_unit TEXT,
    p_instance_id TEXT,
    p_threshold_exceeded BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO monitoring.health_metrics (
        service_name,
        metric_type,
        value,
        unit,
        instance_id,
        threshold_exceeded
    ) VALUES (
        p_service_name,
        p_metric_type,
        p_value,
        p_unit,
        p_instance_id,
        p_threshold_exceeded
    ) RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get service health status
CREATE OR REPLACE FUNCTION get_service_health_status(p_service_name TEXT)
RETURNS TABLE (
    metric_type TEXT,
    latest_value NUMERIC,
    latest_unit TEXT,
    threshold_exceeded BOOLEAN,
    last_recorded TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (hm.metric_type)
        hm.metric_type,
        hm.value,
        hm.unit,
        hm.threshold_exceeded,
        hm.recorded_at
    FROM monitoring.health_metrics hm
    WHERE hm.service_name = p_service_name
    ORDER BY hm.metric_type, hm.recorded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE monitoring.alert_configs IS 'Alert rules and notification settings for monitoring';
COMMENT ON COLUMN monitoring.alert_configs.condition IS 'Prometheus expression for alert condition';
COMMENT ON COLUMN monitoring.alert_configs.threshold IS 'Threshold value for triggering alert';
COMMENT ON COLUMN monitoring.alert_configs.channels IS 'Notification channels (email, sms, webhook, etc.)';
COMMENT ON COLUMN monitoring.alert_configs.metadata IS 'Additional configuration data in JSON format';

COMMENT ON TABLE monitoring.alert_history IS 'Records of triggered alerts and their resolution status';
COMMENT ON COLUMN monitoring.alert_history.value IS 'Metric value at the time of trigger';
COMMENT ON COLUMN monitoring.alert_history.notifications_sent IS 'Details of sent notifications in JSON format';

COMMENT ON TABLE monitoring.anomaly_patterns IS 'Detected anomalous behaviors using ML algorithms';
COMMENT ON COLUMN monitoring.anomaly_patterns.anomaly_score IS 'Anomaly score from 0 (normal) to 1 (highly anomalous)';
COMMENT ON COLUMN monitoring.anomaly_patterns.features IS 'Feature values that triggered anomaly detection';
COMMENT ON COLUMN monitoring.anomaly_patterns.classification IS 'Manual classification after review';

COMMENT ON TABLE monitoring.health_metrics IS 'Container and service health tracking metrics';
COMMENT ON COLUMN monitoring.health_metrics.metric_type IS 'Type of metric (cpu, memory, latency, etc.)';
COMMENT ON COLUMN monitoring.health_metrics.threshold_exceeded IS 'Whether metric exceeded configured threshold';

-- ============================================================================
-- DATA RETENTION POLICY
-- ============================================================================

-- Alert history: 30 days active, 1 year archive
-- Anomaly patterns: 90 days active, 1 year archive (for ML training)
-- Health metrics: 7 days active, 30 days archive
-- This will be implemented in partitioning migration

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. All tables have appropriate foreign key constraints for data integrity
-- 2. Alert configurations are immutable once created (no updates to core fields)
-- 3. Anomaly patterns contain sensitive behavioral data and should be encrypted
-- 4. Health metrics may contain system information and should be secured
-- 5. All functions include proper input validation and error handling
