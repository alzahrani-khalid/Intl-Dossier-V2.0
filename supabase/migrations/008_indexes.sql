-- Migration: 008_indexes.sql
-- Description: Create additional indexes for performance optimization
-- Dependencies: All previous migrations (001-007)
-- Created: 2025-01-27

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- MFA enrollments composite indexes
CREATE INDEX IF NOT EXISTS idx_mfa_enrollments_user_verified 
ON auth.mfa_enrollments (user_id, verified_at) 
WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mfa_enrollments_factor_verified 
ON auth.mfa_enrollments (factor_type, verified_at) 
WHERE verified_at IS NOT NULL;

-- MFA backup codes composite indexes
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user_unused 
ON auth.mfa_backup_codes (user_id, created_at) 
WHERE used_at IS NULL;

-- ============================================================================
-- AUDIT LOGS PERFORMANCE INDEXES
-- ============================================================================

-- Composite indexes for common audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_event 
ON security.audit_logs (user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_created 
ON security.audit_logs (severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_result 
ON security.audit_logs (event_type, result, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_created 
ON security.audit_logs (ip_address, created_at DESC) 
WHERE ip_address IS NOT NULL;

-- Partial indexes for specific audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_auth 
ON security.audit_logs (user_id, created_at DESC) 
WHERE event_type LIKE 'auth%' AND result = 'failure';

CREATE INDEX IF NOT EXISTS idx_audit_logs_critical_events 
ON security.audit_logs (created_at DESC) 
WHERE severity = 'critical';

CREATE INDEX IF NOT EXISTS idx_audit_logs_mfa_events 
ON security.audit_logs (user_id, created_at DESC) 
WHERE event_type LIKE 'auth.mfa%';

-- ============================================================================
-- MONITORING PERFORMANCE INDEXES
-- ============================================================================

-- Alert configurations performance indexes
CREATE INDEX IF NOT EXISTS idx_alert_configs_active_severity 
ON monitoring.alert_configs (is_active, severity) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_alert_configs_created_updated 
ON monitoring.alert_configs (created_at, updated_at);

-- Alert history performance indexes
CREATE INDEX IF NOT EXISTS idx_alert_history_config_triggered 
ON monitoring.alert_history (config_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_history_unresolved_triggered 
ON monitoring.alert_history (triggered_at DESC) 
WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alert_history_acknowledged_triggered 
ON monitoring.alert_history (acknowledged_at DESC) 
WHERE acknowledged_at IS NOT NULL;

-- Anomaly patterns performance indexes
CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_entity_score 
ON monitoring.anomaly_patterns (entity_type, entity_id, anomaly_score DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_unreviewed_score 
ON monitoring.anomaly_patterns (anomaly_score DESC, detected_at DESC) 
WHERE reviewed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_sensitivity_score 
ON monitoring.anomaly_patterns (sensitivity_level, anomaly_score DESC, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_false_positive 
ON monitoring.anomaly_patterns (false_positive, detected_at DESC) 
WHERE false_positive = true;

-- Health metrics performance indexes
CREATE INDEX IF NOT EXISTS idx_health_metrics_service_type_time 
ON monitoring.health_metrics (service_name, metric_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_metrics_exceeded_time 
ON monitoring.health_metrics (threshold_exceeded, recorded_at DESC) 
WHERE threshold_exceeded = true;

CREATE INDEX IF NOT EXISTS idx_health_metrics_instance_time 
ON monitoring.health_metrics (instance_id, recorded_at DESC);

-- ============================================================================
-- FEATURE TABLES PERFORMANCE INDEXES
-- ============================================================================

-- Export requests performance indexes
CREATE INDEX IF NOT EXISTS idx_export_requests_user_status 
ON features.export_requests (user_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_requests_status_started 
ON features.export_requests (status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_requests_resource_format 
ON features.export_requests (resource_type, format, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_requests_pending_processing 
ON features.export_requests (started_at) 
WHERE status IN ('pending', 'processing');

-- Clustering results performance indexes
CREATE INDEX IF NOT EXISTS idx_clustering_results_dataset_optimal 
ON analytics.clustering_results (dataset_id, is_optimal, created_at DESC) 
WHERE is_optimal = true;

CREATE INDEX IF NOT EXISTS idx_clustering_results_score_created 
ON analytics.clustering_results (silhouette_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clustering_results_created_by_dataset 
ON analytics.clustering_results (created_by, dataset_id, created_at DESC);

-- Accessibility preferences performance indexes
CREATE INDEX IF NOT EXISTS idx_accessibility_preferences_updated 
ON users.accessibility_preferences (updated_at DESC);

-- ============================================================================
-- JSONB INDEXES FOR METADATA QUERIES
-- ============================================================================

-- Audit logs metadata indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin 
ON security.audit_logs USING GIN (metadata);

-- Alert configurations metadata indexes
CREATE INDEX IF NOT EXISTS idx_alert_configs_metadata_gin 
ON monitoring.alert_configs USING GIN (metadata);

-- Anomaly patterns features indexes
CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_features_gin 
ON monitoring.anomaly_patterns USING GIN (features);

-- Clustering results parameters indexes
CREATE INDEX IF NOT EXISTS idx_clustering_results_parameters_gin 
ON analytics.clustering_results USING GIN (parameters);

-- Clustering results centroids indexes
CREATE INDEX IF NOT EXISTS idx_clustering_results_centroids_gin 
ON analytics.clustering_results USING GIN (centroids);

-- ============================================================================
-- BRIN INDEXES FOR TIME-SERIES DATA
-- ============================================================================

-- BRIN indexes for large time-series tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin 
ON security.audit_logs USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_health_metrics_recorded_at_brin 
ON monitoring.health_metrics USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at_brin 
ON monitoring.alert_history USING BRIN (triggered_at);

CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_detected_at_brin 
ON monitoring.anomaly_patterns USING BRIN (detected_at);

CREATE INDEX IF NOT EXISTS idx_export_requests_started_at_brin 
ON features.export_requests USING BRIN (started_at);

-- ============================================================================
-- FUNCTIONAL INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_trunc_created 
ON security.audit_logs (date_trunc('day', created_at), event_type);

CREATE INDEX IF NOT EXISTS idx_health_metrics_date_trunc_recorded 
ON monitoring.health_metrics (date_trunc('hour', recorded_at), service_name);

-- Indexes for text search
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_text 
ON security.audit_logs USING GIN (to_tsvector('english', action));

CREATE INDEX IF NOT EXISTS idx_alert_configs_name_text 
ON monitoring.alert_configs USING GIN (to_tsvector('english', name));

-- ============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Covering index for MFA enrollment status queries
CREATE INDEX IF NOT EXISTS idx_mfa_enrollments_covering 
ON auth.mfa_enrollments (user_id) 
INCLUDE (factor_type, verified_at, last_used_at);

-- Covering index for export request status queries
CREATE INDEX IF NOT EXISTS idx_export_requests_covering 
ON features.export_requests (user_id, status) 
INCLUDE (resource_type, format, started_at, completed_at);

-- Covering index for clustering result queries
CREATE INDEX IF NOT EXISTS idx_clustering_results_covering 
ON analytics.clustering_results (dataset_id, is_optimal) 
INCLUDE (cluster_count, silhouette_score, created_at);

-- ============================================================================
-- INDEX MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to analyze all indexes
CREATE OR REPLACE FUNCTION analyze_all_indexes()
RETURNS VOID AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
    LOOP
        EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    index_size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.tablename,
        s.indexrelname as indexname,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        pg_relation_size(s.indexrelid) as index_size
    FROM pg_stat_user_indexes s
    WHERE s.schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    index_size BIGINT,
    idx_scan BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.tablename,
        s.indexrelname as indexname,
        pg_relation_size(s.indexrelid) as index_size,
        s.idx_scan
    FROM pg_stat_user_indexes s
    WHERE s.schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
    AND s.idx_scan = 0
    AND s.indexrelname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEX OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function to rebuild indexes for better performance
CREATE OR REPLACE FUNCTION rebuild_indexes()
RETURNS VOID AS $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN
        SELECT schemaname, indexname
        FROM pg_indexes
        WHERE schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
        AND indexname NOT LIKE '%_pkey'
    LOOP
        EXECUTE format('REINDEX INDEX %I.%I', index_record.schemaname, index_record.indexname);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
    LOOP
        EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for index performance monitoring
CREATE OR REPLACE VIEW index_performance AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
ORDER BY idx_scan DESC;

-- View for table performance monitoring
CREATE OR REPLACE VIEW table_performance AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname IN ('auth', 'security', 'monitoring', 'features', 'analytics', 'users')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_mfa_enrollments_user_verified IS 
'Composite index for user MFA verification status queries';

COMMENT ON INDEX idx_audit_logs_user_event IS 
'Composite index for user-specific audit log queries by event type';

COMMENT ON INDEX idx_health_metrics_service_type_time IS 
'Composite index for service health metrics by type and time';

COMMENT ON INDEX idx_export_requests_user_status IS 
'Composite index for user export request status queries';

COMMENT ON INDEX idx_anomaly_patterns_entity_score IS 
'Composite index for anomaly patterns by entity and score';

COMMENT ON FUNCTION analyze_all_indexes() IS 
'Analyzes all indexes in the security and monitoring schemas';

COMMENT ON FUNCTION get_index_usage_stats() IS 
'Returns usage statistics for all indexes';

COMMENT ON FUNCTION get_unused_indexes() IS 
'Identifies unused indexes that may be candidates for removal';

COMMENT ON VIEW index_performance IS 
'Performance monitoring view for index usage and efficiency';

COMMENT ON VIEW table_performance IS 
'Performance monitoring view for table statistics and maintenance';

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- 1. Composite indexes optimize multi-column queries
-- 2. Partial indexes reduce index size for filtered queries
-- 3. GIN indexes optimize JSONB metadata queries
-- 4. BRIN indexes are efficient for large time-series data
-- 5. Covering indexes avoid table lookups for common queries
-- 6. Functional indexes support complex query patterns
-- 7. Regular index maintenance ensures optimal performance
