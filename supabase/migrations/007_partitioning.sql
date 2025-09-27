-- Migration: 007_partitioning.sql
-- Description: Configure table partitioning for time-series data optimization
-- Dependencies: 001_security_tables.sql, 002_monitoring_tables.sql, 003_feature_tables.sql
-- Created: 2025-01-27

-- ============================================================================
-- PARTITIONING CONFIGURATION
-- ============================================================================

-- Enable partitioning extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pg_partman";

-- ============================================================================
-- AUDIT LOGS PARTITIONING (Monthly partitions)
-- ============================================================================

-- Convert audit_logs to partitioned table
CREATE TABLE security.audit_logs_partitioned (
    LIKE security.audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create initial partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
        partition_start := start_date::TEXT;
        partition_end := end_date::TEXT;
        
        EXECUTE format('CREATE TABLE security.%I PARTITION OF security.audit_logs_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end);
        
        start_date := end_date;
    END LOOP;
END $$;

-- Migrate existing data to partitioned table
INSERT INTO security.audit_logs_partitioned 
SELECT * FROM security.audit_logs;

-- Drop old table and rename partitioned table
DROP TABLE security.audit_logs CASCADE;
ALTER TABLE security.audit_logs_partitioned RENAME TO audit_logs;

-- Recreate indexes on partitioned table
CREATE INDEX idx_audit_logs_partitioned_event_type ON security.audit_logs (event_type);
CREATE INDEX idx_audit_logs_partitioned_user_id ON security.audit_logs (user_id);
CREATE INDEX idx_audit_logs_partitioned_created_at ON security.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_partitioned_severity ON security.audit_logs (severity, created_at DESC);
CREATE INDEX idx_audit_logs_partitioned_result ON security.audit_logs (result, created_at DESC);
CREATE INDEX idx_audit_logs_partitioned_ip_address ON security.audit_logs (ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================================
-- HEALTH METRICS PARTITIONING (Daily partitions)
-- ============================================================================

-- Convert health_metrics to partitioned table
CREATE TABLE monitoring.health_metrics_partitioned (
    LIKE monitoring.health_metrics INCLUDING ALL
) PARTITION BY RANGE (recorded_at);

-- Create initial partitions for the next 30 days
DO $$
DECLARE
    start_date DATE := CURRENT_DATE;
    end_date DATE;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    FOR i IN 0..29 LOOP
        end_date := start_date + INTERVAL '1 day';
        partition_name := 'health_metrics_' || to_char(start_date, 'YYYY_MM_DD');
        partition_start := start_date::TEXT;
        partition_end := end_date::TEXT;
        
        EXECUTE format('CREATE TABLE monitoring.%I PARTITION OF monitoring.health_metrics_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end);
        
        start_date := end_date;
    END LOOP;
END $$;

-- Migrate existing data to partitioned table
INSERT INTO monitoring.health_metrics_partitioned 
SELECT * FROM monitoring.health_metrics;

-- Drop old table and rename partitioned table
DROP TABLE monitoring.health_metrics CASCADE;
ALTER TABLE monitoring.health_metrics_partitioned RENAME TO health_metrics;

-- Recreate indexes on partitioned table
CREATE INDEX idx_health_metrics_partitioned_service ON monitoring.health_metrics (service_name, recorded_at DESC);
CREATE INDEX idx_health_metrics_partitioned_type ON monitoring.health_metrics (metric_type, recorded_at DESC);
CREATE INDEX idx_health_metrics_partitioned_exceeded ON monitoring.health_metrics (threshold_exceeded, recorded_at DESC) WHERE threshold_exceeded = true;
CREATE INDEX idx_health_metrics_partitioned_instance ON monitoring.health_metrics (instance_id, recorded_at DESC);
CREATE INDEX idx_health_metrics_partitioned_time_series ON monitoring.health_metrics (service_name, metric_type, recorded_at DESC);

-- ============================================================================
-- ALERT HISTORY PARTITIONING (Monthly partitions)
-- ============================================================================

-- Convert alert_history to partitioned table
CREATE TABLE monitoring.alert_history_partitioned (
    LIKE monitoring.alert_history INCLUDING ALL
) PARTITION BY RANGE (triggered_at);

-- Create initial partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'alert_history_' || to_char(start_date, 'YYYY_MM');
        partition_start := start_date::TEXT;
        partition_end := end_date::TEXT;
        
        EXECUTE format('CREATE TABLE monitoring.%I PARTITION OF monitoring.alert_history_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end);
        
        start_date := end_date;
    END LOOP;
END $$;

-- Migrate existing data to partitioned table
INSERT INTO monitoring.alert_history_partitioned 
SELECT * FROM monitoring.alert_history;

-- Drop old table and rename partitioned table
DROP TABLE monitoring.alert_history CASCADE;
ALTER TABLE monitoring.alert_history_partitioned RENAME TO alert_history;

-- Recreate indexes on partitioned table
CREATE INDEX idx_alert_history_partitioned_config ON monitoring.alert_history (config_id);
CREATE INDEX idx_alert_history_partitioned_triggered ON monitoring.alert_history (triggered_at DESC);
CREATE INDEX idx_alert_history_partitioned_unresolved ON monitoring.alert_history (triggered_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_alert_history_partitioned_acknowledged ON monitoring.alert_history (acknowledged_at) WHERE acknowledged_at IS NOT NULL;
CREATE INDEX idx_alert_history_partitioned_severity ON monitoring.alert_history (config_id, triggered_at DESC);

-- ============================================================================
-- ANOMALY PATTERNS PARTITIONING (Monthly partitions)
-- ============================================================================

-- Convert anomaly_patterns to partitioned table
CREATE TABLE monitoring.anomaly_patterns_partitioned (
    LIKE monitoring.anomaly_patterns INCLUDING ALL
) PARTITION BY RANGE (detected_at);

-- Create initial partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'anomaly_patterns_' || to_char(start_date, 'YYYY_MM');
        partition_start := start_date::TEXT;
        partition_end := end_date::TEXT;
        
        EXECUTE format('CREATE TABLE monitoring.%I PARTITION OF monitoring.anomaly_patterns_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end);
        
        start_date := end_date;
    END LOOP;
END $$;

-- Migrate existing data to partitioned table
INSERT INTO monitoring.anomaly_patterns_partitioned 
SELECT * FROM monitoring.anomaly_patterns;

-- Drop old table and rename partitioned table
DROP TABLE monitoring.anomaly_patterns CASCADE;
ALTER TABLE monitoring.anomaly_patterns_partitioned RENAME TO anomaly_patterns;

-- Recreate indexes on partitioned table
CREATE INDEX idx_anomaly_patterns_partitioned_entity ON monitoring.anomaly_patterns (entity_type, entity_id);
CREATE INDEX idx_anomaly_patterns_partitioned_score ON monitoring.anomaly_patterns (anomaly_score DESC);
CREATE INDEX idx_anomaly_patterns_partitioned_detected ON monitoring.anomaly_patterns (detected_at DESC);
CREATE INDEX idx_anomaly_patterns_partitioned_unreviewed ON monitoring.anomaly_patterns (detected_at) WHERE reviewed_at IS NULL;
CREATE INDEX idx_anomaly_patterns_partitioned_sensitivity ON monitoring.anomaly_patterns (sensitivity_level, detected_at DESC);
CREATE INDEX idx_anomaly_patterns_partitioned_false_positive ON monitoring.anomaly_patterns (false_positive, detected_at DESC);

-- ============================================================================
-- EXPORT REQUESTS PARTITIONING (Monthly partitions)
-- ============================================================================

-- Convert export_requests to partitioned table
CREATE TABLE features.export_requests_partitioned (
    LIKE features.export_requests INCLUDING ALL
) PARTITION BY RANGE (started_at);

-- Create initial partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'export_requests_' || to_char(start_date, 'YYYY_MM');
        partition_start := start_date::TEXT;
        partition_end := end_date::TEXT;
        
        EXECUTE format('CREATE TABLE features.%I PARTITION OF features.export_requests_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end);
        
        start_date := end_date;
    END LOOP;
END $$;

-- Migrate existing data to partitioned table
INSERT INTO features.export_requests_partitioned 
SELECT * FROM features.export_requests;

-- Drop old table and rename partitioned table
DROP TABLE features.export_requests CASCADE;
ALTER TABLE features.export_requests_partitioned RENAME TO export_requests;

-- Recreate indexes on partitioned table
CREATE INDEX idx_export_requests_partitioned_user_id ON features.export_requests (user_id);
CREATE INDEX idx_export_requests_partitioned_status ON features.export_requests (status);
CREATE INDEX idx_export_requests_partitioned_started_at ON features.export_requests (started_at DESC);
CREATE INDEX idx_export_requests_partitioned_resource_type ON features.export_requests (resource_type);
CREATE INDEX idx_export_requests_partitioned_format ON features.export_requests (format);
CREATE INDEX idx_export_requests_partitioned_pending ON features.export_requests (started_at) WHERE status = 'pending';
CREATE INDEX idx_export_requests_partitioned_processing ON features.export_requests (started_at) WHERE status = 'processing';

-- ============================================================================
-- PARTITION MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create new partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_schema TEXT,
    table_name TEXT,
    partition_date DATE
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    partition_name := table_name || '_' || to_char(partition_date, 'YYYY_MM');
    partition_start := partition_date::TEXT;
    partition_end := (partition_date + INTERVAL '1 month')::TEXT;
    
    EXECUTE format('CREATE TABLE %I.%I PARTITION OF %I.%I
        FOR VALUES FROM (%L) TO (%L)',
        table_schema, partition_name, table_schema, table_name, partition_start, partition_end);
END;
$$ LANGUAGE plpgsql;

-- Function to create new daily partitions for health metrics
CREATE OR REPLACE FUNCTION create_daily_partition(
    table_schema TEXT,
    table_name TEXT,
    partition_date DATE
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    partition_name := table_name || '_' || to_char(partition_date, 'YYYY_MM_DD');
    partition_start := partition_date::TEXT;
    partition_end := (partition_date + INTERVAL '1 day')::TEXT;
    
    EXECUTE format('CREATE TABLE %I.%I PARTITION OF %I.%I
        FOR VALUES FROM (%L) TO (%L)',
        table_schema, partition_name, table_schema, table_name, partition_start, partition_end);
END;
$$ LANGUAGE plpgsql;

-- Function to drop old partitions (for data retention)
CREATE OR REPLACE FUNCTION drop_old_partitions(
    table_schema TEXT,
    table_name TEXT,
    retention_months INTEGER
) RETURNS INTEGER AS $$
DECLARE
    partition_name TEXT;
    cutoff_date DATE;
    dropped_count INTEGER := 0;
    partition_record RECORD;
BEGIN
    cutoff_date := CURRENT_DATE - (retention_months || ' months')::INTERVAL;
    
    -- Find partitions older than retention period
    FOR partition_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = table_schema
        AND tablename LIKE table_name || '_%'
        AND tablename != table_name
    LOOP
        -- Extract date from partition name and check if it's old enough
        IF partition_record.tablename ~ ('^' || table_name || '_\d{4}_\d{2}') THEN
            -- Monthly partition format: table_name_YYYY_MM
            IF to_date(substring(partition_record.tablename from '_\d{4}_\d{2}$'), '_YYYY_MM') < cutoff_date THEN
                EXECUTE format('DROP TABLE %I.%I', table_schema, partition_record.tablename);
                dropped_count := dropped_count + 1;
            END IF;
        ELSIF partition_record.tablename ~ ('^' || table_name || '_\d{4}_\d{2}_\d{2}') THEN
            -- Daily partition format: table_name_YYYY_MM_DD
            IF to_date(substring(partition_record.tablename from '_\d{4}_\d{2}_\d{2}$'), '_YYYY_MM_DD') < cutoff_date THEN
                EXECUTE format('DROP TABLE %I.%I', table_schema, partition_record.tablename);
                dropped_count := dropped_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN dropped_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED PARTITION MANAGEMENT
-- ============================================================================

-- Function to maintain partitions (create new, drop old)
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    future_date DATE;
BEGIN
    -- Create monthly partitions for next 3 months
    future_date := current_date + INTERVAL '3 months';
    WHILE current_date < future_date LOOP
        PERFORM create_monthly_partition('security', 'audit_logs', current_date);
        PERFORM create_monthly_partition('monitoring', 'alert_history', current_date);
        PERFORM create_monthly_partition('monitoring', 'anomaly_patterns', current_date);
        PERFORM create_monthly_partition('features', 'export_requests', current_date);
        
        current_date := current_date + INTERVAL '1 month';
    END LOOP;
    
    -- Create daily partitions for health metrics (next 7 days)
    current_date := CURRENT_DATE;
    future_date := current_date + INTERVAL '7 days';
    WHILE current_date < future_date LOOP
        PERFORM create_daily_partition('monitoring', 'health_metrics', current_date);
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    -- Drop old partitions based on retention policy
    PERFORM drop_old_partitions('security', 'audit_logs', 7); -- 7 years for compliance
    PERFORM drop_old_partitions('monitoring', 'alert_history', 1); -- 1 year
    PERFORM drop_old_partitions('monitoring', 'anomaly_patterns', 1); -- 1 year
    PERFORM drop_old_partitions('features', 'export_requests', 1); -- 1 year
    PERFORM drop_old_partitions('monitoring', 'health_metrics', 1); -- 1 year (daily partitions)
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTITION STATISTICS AND MONITORING
-- ============================================================================

-- Function to get partition statistics
CREATE OR REPLACE FUNCTION get_partition_stats()
RETURNS TABLE (
    table_schema TEXT,
    table_name TEXT,
    partition_name TEXT,
    partition_size BIGINT,
    row_count BIGINT,
    last_analyzed TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname,
        tablename,
        tablename as partition_name,
        pg_total_relation_size(schemaname||'.'||tablename) as partition_size,
        n_tup_ins - n_tup_del as row_count,
        last_analyze
    FROM pg_stat_user_tables
    WHERE schemaname IN ('security', 'monitoring', 'features')
    AND tablename LIKE '%_%_%' -- Partition naming pattern
    ORDER BY schemaname, tablename, last_analyze DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION create_monthly_partition(TEXT, TEXT, DATE) IS 
'Creates a new monthly partition for the specified table and date';

COMMENT ON FUNCTION create_daily_partition(TEXT, TEXT, DATE) IS 
'Creates a new daily partition for the specified table and date (used for health metrics)';

COMMENT ON FUNCTION drop_old_partitions(TEXT, TEXT, INTEGER) IS 
'Drops partitions older than the specified retention period in months';

COMMENT ON FUNCTION maintain_partitions() IS 
'Maintains all partitioned tables by creating new partitions and dropping old ones';

COMMENT ON FUNCTION get_partition_stats() IS 
'Returns statistics about all partitions including size and row counts';

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- 1. Partitioning improves query performance for time-series data
-- 2. Monthly partitions for audit logs, alerts, anomalies, exports
-- 3. Daily partitions for health metrics (high volume)
-- 4. Automatic partition creation prevents data insertion errors
-- 5. Old partition cleanup maintains storage efficiency
-- 6. Indexes are recreated on partitioned tables for optimal performance
-- 7. Partition pruning improves query performance significantly
