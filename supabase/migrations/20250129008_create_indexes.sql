-- Migration: 008_create_indexes
-- Description: Create all performance indexes for the intake system
-- Date: 2025-01-29

-- Enable pg_trgm extension for text similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- Intake Tickets Indexes
-- ============================================

-- Primary indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status 
    ON intake_tickets(status) 
    WHERE status NOT IN ('closed', 'merged');

CREATE INDEX IF NOT EXISTS idx_tickets_assigned 
    ON intake_tickets(assigned_to, assigned_unit) 
    WHERE status IN ('assigned', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_tickets_priority 
    ON intake_tickets(priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_sla 
    ON intake_tickets(status, priority) 
    WHERE status IN ('submitted', 'triaged', 'assigned');

-- Composite indexes for queue filtering
CREATE INDEX IF NOT EXISTS idx_queue_filter 
    ON intake_tickets(status, request_type, sensitivity, assigned_unit)
    WHERE status NOT IN ('closed', 'merged');

CREATE INDEX IF NOT EXISTS idx_tickets_date_range 
    ON intake_tickets(created_at DESC, status);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_tickets_dossier 
    ON intake_tickets(dossier_id) 
    WHERE dossier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_parent 
    ON intake_tickets(parent_ticket_id) 
    WHERE parent_ticket_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_converted 
    ON intake_tickets(converted_to_id) 
    WHERE converted_to_id IS NOT NULL;

-- Text search indexes using trigrams
CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm 
    ON intake_tickets USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tickets_title_ar_trgm 
    ON intake_tickets USING gin (title_ar gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tickets_description_trgm 
    ON intake_tickets USING gin (description gin_trgm_ops);

-- Ticket number lookup
CREATE INDEX IF NOT EXISTS idx_tickets_number 
    ON intake_tickets(ticket_number);

-- ============================================
-- Intake Attachments Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attachments_ticket 
    ON intake_attachments(ticket_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_scan_pending 
    ON intake_attachments(scan_status) 
    WHERE scan_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_attachments_not_deleted 
    ON intake_attachments(ticket_id) 
    WHERE deleted_at IS NULL;

-- ============================================
-- Triage Decisions Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_triage_ticket 
    ON triage_decisions(ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_triage_pending 
    ON triage_decisions(accepted_at) 
    WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_triage_ai_confidence 
    ON triage_decisions(confidence_score DESC) 
    WHERE decision_type = 'ai_suggestion';

-- ============================================
-- SLA Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sla_policies_matching 
    ON sla_policies(request_type, sensitivity, urgency, priority) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sla_events_ticket 
    ON sla_events(ticket_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sla_events_active 
    ON sla_events(ticket_id, event_type) 
    WHERE event_type IN ('started', 'resumed');

CREATE INDEX IF NOT EXISTS idx_sla_events_breached 
    ON sla_events(is_breached, event_timestamp DESC) 
    WHERE is_breached = true;

-- ============================================
-- Duplicate Candidates Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_duplicates_source 
    ON duplicate_candidates(source_ticket_id, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_duplicates_target 
    ON duplicate_candidates(target_ticket_id, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_duplicates_pending 
    ON duplicate_candidates(status) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_duplicates_high_score 
    ON duplicate_candidates(overall_score DESC) 
    WHERE status = 'pending' AND overall_score >= 0.8;

-- ============================================
-- AI Embeddings Indexes
-- ============================================

-- Vector similarity search (already created in migration 006)
-- CREATE INDEX idx_embeddings_vector ON ai_embeddings 
--     USING ivfflat (embedding vector_cosine_ops) 
--     WITH (lists = 200);

CREATE INDEX IF NOT EXISTS idx_embeddings_owner 
    ON ai_embeddings(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_embeddings_expires 
    ON ai_embeddings(expires_at) 
    WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_embeddings_model 
    ON ai_embeddings(model, model_version);

-- ============================================
-- Analysis Metadata Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_analysis_correlation 
    ON analysis_metadata(analysis_id);

CREATE INDEX IF NOT EXISTS idx_analysis_created 
    ON analysis_metadata(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_model 
    ON analysis_metadata(model_name, model_version);

CREATE INDEX IF NOT EXISTS idx_analysis_confidence 
    ON analysis_metadata(confidence_score DESC) 
    WHERE confidence_score IS NOT NULL;

-- ============================================
-- Audit Logs Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_entity 
    ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_user 
    ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_action 
    ON audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_correlation 
    ON audit_logs(correlation_id) 
    WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_session 
    ON audit_logs(session_id) 
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_mfa 
    ON audit_logs(required_mfa, mfa_verified) 
    WHERE required_mfa = true;

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_audit_date_range 
    ON audit_logs(created_at DESC);

-- ============================================
-- Performance Statistics
-- ============================================

-- Create function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    index_size TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT as index_size,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION analyze_index_usage IS 'Monitor index usage statistics for performance tuning';