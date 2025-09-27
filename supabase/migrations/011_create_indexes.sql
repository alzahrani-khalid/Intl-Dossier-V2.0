-- Migration: Create database indexes and constraints
-- Description: Additional indexes, constraints, and relationships for optimal performance
-- Date: 2025-01-27

-- ========================================
-- Many-to-Many Relationship Tables
-- ========================================

-- Users <-> Events (participants)
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'participant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_user ON event_participants(user_id);

-- Users <-> Organizations (memberships)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_active ON organization_members(organization_id, user_id) WHERE left_at IS NULL;

-- Intelligence Reports <-> Data Library Items (sources)
CREATE TABLE IF NOT EXISTS intelligence_report_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intelligence_report_id UUID REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    data_library_item_id UUID REFERENCES data_library_items(id) ON DELETE RESTRICT,
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(intelligence_report_id, data_library_item_id)
);

CREATE INDEX idx_intelligence_sources_report ON intelligence_report_sources(intelligence_report_id);
CREATE INDEX idx_intelligence_sources_item ON intelligence_report_sources(data_library_item_id);

-- ========================================
-- Additional Performance Indexes
-- ========================================

-- Full-text search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_countries_search ON countries 
USING GIN ((name_en || ' ' || name_ar) gin_trgm_ops) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_organizations_search ON organizations 
USING GIN (name gin_trgm_ops) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_events_search ON events 
USING GIN ((title || ' ' || COALESCE(description, '')) gin_trgm_ops) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_briefs_search ON briefs 
USING GIN ((title || ' ' || content) gin_trgm_ops) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_intelligence_reports_search ON intelligence_reports 
USING GIN ((title || ' ' || content) gin_trgm_ops) 
WHERE deleted_at IS NULL;

-- Date range indexes for time-based queries
CREATE INDEX idx_mous_date_range ON mous(effective_date, expiry_date) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_events_date_range ON events(start_time, end_time) 
WHERE deleted_at IS NULL AND status != 'cancelled';

-- Composite indexes for common query patterns
CREATE INDEX idx_mous_workflow_lookup ON mous(organization_id, country_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_events_upcoming ON events(start_time) 
WHERE deleted_at IS NULL AND status = 'scheduled' AND start_time > NOW();

CREATE INDEX idx_intelligence_reports_recent ON intelligence_reports(created_at DESC) 
WHERE deleted_at IS NULL AND status = 'published';

-- ========================================
-- Additional Constraints
-- ========================================

-- Ensure unique active MFA secret per user
CREATE UNIQUE INDEX unique_active_mfa_secret ON users(mfa_secret) 
WHERE mfa_enabled = true AND deleted_at IS NULL;

-- Ensure unique active email (case-insensitive)
CREATE UNIQUE INDEX unique_active_email ON users(lower(email)) 
WHERE deleted_at IS NULL;

-- ========================================
-- Audit Functions
-- ========================================

-- Function to track entity changes
CREATE OR REPLACE FUNCTION track_entity_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log important changes (can be extended to audit table)
    IF TG_OP = 'UPDATE' THEN
        -- Check if soft delete is happening
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            RAISE NOTICE 'Soft delete on % table, ID: %', TG_TABLE_NAME, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to all main tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'users', 'countries', 'organizations', 'mous', 
            'events', 'forums', 'briefs', 'intelligence_reports', 
            'data_library_items', 'permission_delegations'
        ])
    LOOP
        EXECUTE format('
            CREATE TRIGGER audit_%I 
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION track_entity_changes()',
            t, t);
    END LOOP;
END $$;

-- ========================================
-- Helper Functions
-- ========================================

-- Function to get user's active permissions for an entity
CREATE OR REPLACE FUNCTION get_user_permissions(
    p_user_id UUID,
    p_entity_type entity_type,
    p_entity_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_permissions JSONB := '{}';
    r RECORD;
BEGIN
    FOR r IN 
        SELECT permissions
        FROM permission_delegations
        WHERE user_id = p_user_id
            AND entity_type = p_entity_type
            AND (p_entity_id IS NULL OR entity_id = p_entity_id OR entity_id IS NULL)
            AND is_active = true
            AND deleted_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
    LOOP
        v_permissions := v_permissions || r.permissions;
    END LOOP;
    
    RETURN v_permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_entity_type entity_type,
    p_entity_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_permissions JSONB;
BEGIN
    v_permissions := get_user_permissions(p_user_id, p_entity_type, p_entity_id);
    RETURN v_permissions ? p_permission AND (v_permissions->p_permission)::boolean = true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Statistics Update Functions
-- ========================================

-- Function to update statistics (can be called periodically)
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE users;
    ANALYZE countries;
    ANALYZE organizations;
    ANALYZE mous;
    ANALYZE events;
    ANALYZE forums;
    ANALYZE briefs;
    ANALYZE intelligence_reports;
    ANALYZE data_library_items;
    ANALYZE permission_delegations;
END;
$$ LANGUAGE plpgsql;

-- Add comments for new tables
COMMENT ON TABLE event_participants IS 'Many-to-many relationship between users and events';
COMMENT ON TABLE organization_members IS 'Many-to-many relationship between users and organizations';
COMMENT ON TABLE intelligence_report_sources IS 'Many-to-many relationship between intelligence reports and data library items';