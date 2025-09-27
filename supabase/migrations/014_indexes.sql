-- 014_indexes.sql: Performance indexes for all search and filter operations
-- Comprehensive indexing strategy for optimal query performance

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

-- Users: Common lookup patterns
CREATE INDEX IF NOT EXISTS idx_users_role_active ON public.users(role, is_active)
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language_preference);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC NULLS LAST);

-- Countries: Regional and status filtering
CREATE INDEX IF NOT EXISTS idx_countries_region_status ON public.countries(region, status)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_countries_subregion ON public.countries(sub_region)
    WHERE sub_region IS NOT NULL;

-- Organizations: Hierarchical queries and filtering
CREATE INDEX IF NOT EXISTS idx_organizations_type_status ON public.organizations(type, status);
CREATE INDEX IF NOT EXISTS idx_organizations_country_type ON public.organizations(country_id, type);
CREATE INDEX IF NOT EXISTS idx_organizations_hierarchy ON public.organizations(parent_organization_id, id)
    WHERE parent_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_established ON public.organizations(established_date DESC NULLS LAST);

-- MoUs: Workflow and date-based queries
CREATE INDEX IF NOT EXISTS idx_mous_workflow_dates ON public.mous(workflow_state, effective_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_mous_owner_state ON public.mous(owner_id, workflow_state);
CREATE INDEX IF NOT EXISTS idx_mous_expiring_soon ON public.mous(expiry_date)
    WHERE workflow_state IN ('active', 'renewed')
    AND expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mous_auto_renewal ON public.mous(auto_renewal, expiry_date)
    WHERE auto_renewal = true;
CREATE INDEX IF NOT EXISTS idx_mous_version ON public.mous(reference_number, document_version);

-- Events: Scheduling and filtering
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON public.events(start_datetime)
    WHERE status IN ('scheduled', 'ongoing')
    AND start_datetime > NOW();
CREATE INDEX IF NOT EXISTS idx_events_type_status ON public.events(type, status);
CREATE INDEX IF NOT EXISTS idx_events_virtual ON public.events(is_virtual, start_datetime)
    WHERE is_virtual = true;
CREATE INDEX IF NOT EXISTS idx_events_registration ON public.events(registration_required, registration_deadline)
    WHERE registration_required = true;
CREATE INDEX IF NOT EXISTS idx_events_created_by_status ON public.events(created_by, status);

-- Forums: Session and fee queries
CREATE INDEX IF NOT EXISTS idx_forums_has_fee ON public.forums(registration_fee)
    WHERE registration_fee > 0;
CREATE INDEX IF NOT EXISTS idx_forums_live_stream ON public.forums(id)
    WHERE live_stream_url IS NOT NULL;

-- Forum Sessions: Scheduling
CREATE INDEX IF NOT EXISTS idx_forum_sessions_schedule ON public.forum_sessions(forum_id, start_time);
CREATE INDEX IF NOT EXISTS idx_forum_sessions_room ON public.forum_sessions(room_en, room_ar)
    WHERE room_en IS NOT NULL;

-- Briefs: Category and publication filtering
CREATE INDEX IF NOT EXISTS idx_briefs_category_published ON public.briefs(category, is_published, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_author_published ON public.briefs(author_id, is_published);
CREATE INDEX IF NOT EXISTS idx_briefs_related_entities ON public.briefs(related_country_id, related_organization_id, related_event_id)
    WHERE related_country_id IS NOT NULL
    OR related_organization_id IS NOT NULL
    OR related_event_id IS NOT NULL;

-- Intelligence Reports: Classification and status
CREATE INDEX IF NOT EXISTS idx_intelligence_classification_status ON public.intelligence_reports(classification, status);
CREATE INDEX IF NOT EXISTS idx_intelligence_confidence_status ON public.intelligence_reports(confidence_level, status);
CREATE INDEX IF NOT EXISTS idx_intelligence_author_status ON public.intelligence_reports(author_id, status);
CREATE INDEX IF NOT EXISTS idx_intelligence_review_chain ON public.intelligence_reports(reviewed_by, approved_by)
    WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_published_recent ON public.intelligence_reports(published_at DESC)
    WHERE status = 'published';

-- Data Library: Category and access filtering
CREATE INDEX IF NOT EXISTS idx_data_library_category_public ON public.data_library_items(category, is_public);
CREATE INDEX IF NOT EXISTS idx_data_library_file_type_category ON public.data_library_items(file_type, category);
CREATE INDEX IF NOT EXISTS idx_data_library_uploaded_recent ON public.data_library_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_library_popular ON public.data_library_items(download_count DESC, created_at DESC)
    WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_data_library_size ON public.data_library_items(file_size_bytes);

-- Event Participants: Registration and attendance
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON public.event_participants(registration_status);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_status ON public.event_participants(event_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_events ON public.event_participants(user_id, registration_date DESC)
    WHERE user_id IS NOT NULL;

-- ============================================
-- COVERING INDEXES FOR SPECIFIC QUERIES
-- ============================================

-- MoU listing with organization names (covering index)
CREATE INDEX IF NOT EXISTS idx_mous_listing ON public.mous(workflow_state, created_at DESC)
    INCLUDE (title_en, title_ar, primary_party_id, secondary_party_id);

-- Event listing with organizer (covering index)
CREATE INDEX IF NOT EXISTS idx_events_listing ON public.events(status, start_datetime DESC)
    INCLUDE (title_en, title_ar, type, organizer_id, venue_en);

-- Brief listing (covering index)
CREATE INDEX IF NOT EXISTS idx_briefs_listing ON public.briefs(is_published, published_date DESC)
    INCLUDE (title_en, title_ar, category, author_id)
    WHERE is_published = true;

-- Intelligence report listing (covering index)
CREATE INDEX IF NOT EXISTS idx_intelligence_listing ON public.intelligence_reports(status, created_at DESC)
    INCLUDE (title_en, title_ar, confidence_level, classification);

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- ============================================

-- Active MoUs requiring renewal
CREATE INDEX IF NOT EXISTS idx_mous_renewal_needed ON public.mous(expiry_date)
    WHERE workflow_state = 'active'
    AND auto_renewal = false
    AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days';

-- Draft events older than 30 days (for cleanup)
CREATE INDEX IF NOT EXISTS idx_events_old_drafts ON public.events(created_at)
    WHERE status = 'draft'
    AND created_at < NOW() - INTERVAL '30 days';

-- Unpublished briefs by author
CREATE INDEX IF NOT EXISTS idx_briefs_author_drafts ON public.briefs(author_id, created_at DESC)
    WHERE is_published = false;

-- Intelligence reports pending review
CREATE INDEX IF NOT EXISTS idx_intelligence_pending_review ON public.intelligence_reports(created_at)
    WHERE status = 'review'
    AND reviewed_by IS NULL;

-- ============================================
-- EXPRESSION INDEXES FOR COMPUTED VALUES
-- ============================================

-- MoUs: Days until expiry
CREATE INDEX IF NOT EXISTS idx_mous_days_to_expiry ON public.mous((expiry_date - CURRENT_DATE))
    WHERE workflow_state IN ('active', 'renewed')
    AND expiry_date IS NOT NULL;

-- Events: Duration in hours
CREATE INDEX IF NOT EXISTS idx_events_duration ON public.events((EXTRACT(EPOCH FROM (end_datetime - start_datetime)) / 3600));

-- Data Library: File size in MB
CREATE INDEX IF NOT EXISTS idx_data_library_size_mb ON public.data_library_items((file_size_bytes / 1048576));

-- ============================================
-- UNIQUE INDEXES FOR DATA INTEGRITY
-- ============================================

-- Ensure unique reference numbers even if constraints are disabled
CREATE UNIQUE INDEX IF NOT EXISTS idx_mous_reference_unique ON public.mous(reference_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_briefs_reference_unique ON public.briefs(reference_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_report_unique ON public.intelligence_reports(report_number);

-- Prevent duplicate event participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_unique ON public.event_participants(event_id, user_id)
    WHERE user_id IS NOT NULL;

-- ============================================
-- STATISTICS AND MAINTENANCE
-- ============================================

-- Update statistics for query planner
ANALYZE public.users;
ANALYZE public.countries;
ANALYZE public.organizations;
ANALYZE public.mous;
ANALYZE public.events;
ANALYZE public.forums;
ANALYZE public.briefs;
ANALYZE public.intelligence_reports;
ANALYZE public.data_library_items;

-- Create index usage monitoring function
CREATE OR REPLACE FUNCTION public.get_index_usage_stats()
RETURNS TABLE(
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    index_size TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    is_unique BOOLEAN,
    is_primary BOOLEAN
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
        s.idx_tup_fetch,
        i.indisunique as is_unique,
        i.indisprimary as is_primary
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create unused index detection function
CREATE OR REPLACE FUNCTION public.find_unused_indexes()
RETURNS TABLE(
    tablename TEXT,
    indexname TEXT,
    index_size TEXT,
    index_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.tablename::TEXT,
        s.indexname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT as index_size,
        s.idx_scan as index_scans
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    AND s.idx_scan = 0
    AND i.indisprimary = false
    AND i.indisunique = false
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_index_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_unused_indexes TO authenticated;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.get_index_usage_stats IS 'Returns usage statistics for all indexes in the public schema';
COMMENT ON FUNCTION public.find_unused_indexes IS 'Identifies indexes that have never been used and could be dropped';

COMMENT ON INDEX idx_mous_expiring_soon IS 'Optimizes queries for MoUs expiring within the next period';
COMMENT ON INDEX idx_events_upcoming IS 'Optimizes queries for upcoming scheduled events';
COMMENT ON INDEX idx_intelligence_pending_review IS 'Optimizes queries for intelligence reports awaiting review';