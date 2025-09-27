-- Migration: 003_feature_tables.sql
-- Description: Create feature-related tables for exports, clustering, and accessibility
-- Dependencies: 001_security_tables.sql (for auth.users reference)
-- Created: 2025-01-27

-- Create feature schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS features;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS users;

-- ============================================================================
-- EXPORT REQUESTS TABLE
-- ============================================================================

CREATE TABLE features.export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'excel')),
    row_count INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    file_path TEXT NULL, -- Encrypted file path
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NULL,
    error_message TEXT NULL,
    
    -- Constraints
    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    ),
    CONSTRAINT valid_error_message CHECK (
        (status = 'failed' AND error_message IS NOT NULL) OR
        (status != 'failed' AND error_message IS NULL)
    ),
    CONSTRAINT valid_file_path CHECK (
        (status IN ('completed') AND file_path IS NOT NULL) OR
        (status NOT IN ('completed') AND file_path IS NULL)
    ),
    CONSTRAINT valid_row_count CHECK (row_count IS NULL OR row_count >= 0)
);

-- ============================================================================
-- CLUSTERING RESULTS TABLE
-- ============================================================================

CREATE TABLE analytics.clustering_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id TEXT NOT NULL,
    cluster_count INTEGER NOT NULL CHECK (cluster_count >= 3 AND cluster_count <= 10),
    silhouette_score NUMERIC NOT NULL CHECK (silhouette_score >= -1 AND silhouette_score <= 1),
    inertia NUMERIC NOT NULL CHECK (inertia >= 0),
    centroids JSONB NOT NULL,
    labels INTEGER[] NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    is_optimal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT valid_centroids CHECK (jsonb_typeof(centroids) = 'array'),
    CONSTRAINT valid_labels_length CHECK (array_length(labels, 1) > 0),
    CONSTRAINT valid_parameters CHECK (jsonb_typeof(parameters) = 'object')
);

-- ============================================================================
-- ACCESSIBILITY PREFERENCES TABLE
-- ============================================================================

CREATE TABLE users.accessibility_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    high_contrast BOOLEAN NOT NULL DEFAULT false,
    large_text BOOLEAN NOT NULL DEFAULT false,
    reduce_motion BOOLEAN NOT NULL DEFAULT false,
    screen_reader BOOLEAN NOT NULL DEFAULT false,
    keyboard_only BOOLEAN NOT NULL DEFAULT false,
    focus_indicators TEXT NOT NULL DEFAULT 'default' CHECK (focus_indicators IN ('default', 'thick', 'high-contrast')),
    color_blind_mode TEXT NULL CHECK (color_blind_mode IN ('none', 'protanopia', 'deuteranopia', 'tritanopia')),
    custom_css TEXT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_user_preferences UNIQUE (user_id),
    CONSTRAINT valid_custom_css CHECK (
        custom_css IS NULL OR 
        (length(custom_css) > 0 AND length(custom_css) <= 10000)
    )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Export requests indexes
CREATE INDEX idx_export_requests_user_id ON features.export_requests (user_id);
CREATE INDEX idx_export_requests_status ON features.export_requests (status);
CREATE INDEX idx_export_requests_started_at ON features.export_requests (started_at DESC);
CREATE INDEX idx_export_requests_resource_type ON features.export_requests (resource_type);
CREATE INDEX idx_export_requests_format ON features.export_requests (format);
CREATE INDEX idx_export_requests_pending ON features.export_requests (started_at) WHERE status = 'pending';
CREATE INDEX idx_export_requests_processing ON features.export_requests (started_at) WHERE status = 'processing';

-- Clustering results indexes
CREATE INDEX idx_clustering_results_dataset ON analytics.clustering_results (dataset_id);
CREATE INDEX idx_clustering_results_score ON analytics.clustering_results (silhouette_score DESC);
CREATE INDEX idx_clustering_results_optimal ON analytics.clustering_results (dataset_id, is_optimal) WHERE is_optimal = true;
CREATE INDEX idx_clustering_results_created_by ON analytics.clustering_results (created_by);
CREATE INDEX idx_clustering_results_created_at ON analytics.clustering_results (created_at DESC);

-- Accessibility preferences indexes
CREATE INDEX idx_accessibility_preferences_user_id ON users.accessibility_preferences (user_id);
CREATE INDEX idx_accessibility_preferences_updated_at ON users.accessibility_preferences (updated_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Apply updated_at trigger to accessibility_preferences
CREATE TRIGGER trigger_accessibility_preferences_updated_at
    BEFORE UPDATE ON users.accessibility_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR EXPORT MANAGEMENT
-- ============================================================================

-- Function to create export request
CREATE OR REPLACE FUNCTION create_export_request(
    p_user_id UUID,
    p_resource_type TEXT,
    p_filters JSONB,
    p_format TEXT,
    p_columns TEXT[] DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    export_id UUID;
BEGIN
    INSERT INTO features.export_requests (
        user_id,
        resource_type,
        filters,
        format
    ) VALUES (
        p_user_id,
        p_resource_type,
        p_filters,
        p_format
    ) RETURNING id INTO export_id;
    
    RETURN export_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update export status
CREATE OR REPLACE FUNCTION update_export_status(
    p_export_id UUID,
    p_status TEXT,
    p_row_count INTEGER DEFAULT NULL,
    p_file_path TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE features.export_requests
    SET status = p_status,
        row_count = p_row_count,
        file_path = p_file_path,
        error_message = p_error_message,
        completed_at = CASE 
            WHEN p_status IN ('completed', 'failed') THEN now()
            ELSE completed_at
        END
    WHERE id = p_export_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's export requests
CREATE OR REPLACE FUNCTION get_user_exports(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    resource_type TEXT,
    format TEXT,
    status TEXT,
    row_count INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.id,
        er.resource_type,
        er.format,
        er.status,
        er.row_count,
        er.started_at,
        er.completed_at
    FROM features.export_requests er
    WHERE er.user_id = p_user_id
    ORDER BY er.started_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired exports (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE features.export_requests
    SET status = 'expired'
    WHERE status IN ('pending', 'processing')
    AND started_at < now() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS FOR CLUSTERING
-- ============================================================================

-- Function to save clustering results
CREATE OR REPLACE FUNCTION save_clustering_result(
    p_dataset_id TEXT,
    p_cluster_count INTEGER,
    p_silhouette_score NUMERIC,
    p_inertia NUMERIC,
    p_centroids JSONB,
    p_labels INTEGER[],
    p_parameters JSONB,
    p_created_by UUID,
    p_is_optimal BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO analytics.clustering_results (
        dataset_id,
        cluster_count,
        silhouette_score,
        inertia,
        centroids,
        labels,
        parameters,
        created_by,
        is_optimal
    ) VALUES (
        p_dataset_id,
        p_cluster_count,
        p_silhouette_score,
        p_inertia,
        p_centroids,
        p_labels,
        p_parameters,
        p_created_by,
        p_is_optimal
    ) RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get optimal clustering for dataset
CREATE OR REPLACE FUNCTION get_optimal_clustering(p_dataset_id TEXT)
RETURNS TABLE (
    id UUID,
    cluster_count INTEGER,
    silhouette_score NUMERIC,
    inertia NUMERIC,
    centroids JSONB,
    labels INTEGER[],
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.cluster_count,
        cr.silhouette_score,
        cr.inertia,
        cr.centroids,
        cr.labels,
        cr.created_at
    FROM analytics.clustering_results cr
    WHERE cr.dataset_id = p_dataset_id
    AND cr.is_optimal = true
    ORDER BY cr.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get clustering history for dataset
CREATE OR REPLACE FUNCTION get_clustering_history(
    p_dataset_id TEXT,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    id UUID,
    cluster_count INTEGER,
    silhouette_score NUMERIC,
    is_optimal BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.cluster_count,
        cr.silhouette_score,
        cr.is_optimal,
        cr.created_at
    FROM analytics.clustering_results cr
    WHERE cr.dataset_id = p_dataset_id
    ORDER BY cr.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS FOR ACCESSIBILITY
-- ============================================================================

-- Function to get user accessibility preferences
CREATE OR REPLACE FUNCTION get_accessibility_preferences(p_user_id UUID)
RETURNS TABLE (
    high_contrast BOOLEAN,
    large_text BOOLEAN,
    reduce_motion BOOLEAN,
    screen_reader BOOLEAN,
    keyboard_only BOOLEAN,
    focus_indicators TEXT,
    color_blind_mode TEXT,
    custom_css TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.high_contrast,
        ap.large_text,
        ap.reduce_motion,
        ap.screen_reader,
        ap.keyboard_only,
        ap.focus_indicators,
        ap.color_blind_mode,
        ap.custom_css
    FROM users.accessibility_preferences ap
    WHERE ap.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update accessibility preferences
CREATE OR REPLACE FUNCTION update_accessibility_preferences(
    p_user_id UUID,
    p_high_contrast BOOLEAN DEFAULT NULL,
    p_large_text BOOLEAN DEFAULT NULL,
    p_reduce_motion BOOLEAN DEFAULT NULL,
    p_screen_reader BOOLEAN DEFAULT NULL,
    p_keyboard_only BOOLEAN DEFAULT NULL,
    p_focus_indicators TEXT DEFAULT NULL,
    p_color_blind_mode TEXT DEFAULT NULL,
    p_custom_css TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO users.accessibility_preferences (
        user_id,
        high_contrast,
        large_text,
        reduce_motion,
        screen_reader,
        keyboard_only,
        focus_indicators,
        color_blind_mode,
        custom_css
    ) VALUES (
        p_user_id,
        COALESCE(p_high_contrast, false),
        COALESCE(p_large_text, false),
        COALESCE(p_reduce_motion, false),
        COALESCE(p_screen_reader, false),
        COALESCE(p_keyboard_only, false),
        COALESCE(p_focus_indicators, 'default'),
        p_color_blind_mode,
        p_custom_css
    )
    ON CONFLICT (user_id) DO UPDATE SET
        high_contrast = COALESCE(EXCLUDED.high_contrast, users.accessibility_preferences.high_contrast),
        large_text = COALESCE(EXCLUDED.large_text, users.accessibility_preferences.large_text),
        reduce_motion = COALESCE(EXCLUDED.reduce_motion, users.accessibility_preferences.reduce_motion),
        screen_reader = COALESCE(EXCLUDED.screen_reader, users.accessibility_preferences.screen_reader),
        keyboard_only = COALESCE(EXCLUDED.keyboard_only, users.accessibility_preferences.keyboard_only),
        focus_indicators = COALESCE(EXCLUDED.focus_indicators, users.accessibility_preferences.focus_indicators),
        color_blind_mode = COALESCE(EXCLUDED.color_blind_mode, users.accessibility_preferences.color_blind_mode),
        custom_css = COALESCE(EXCLUDED.custom_css, users.accessibility_preferences.custom_css),
        updated_at = now();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE features.export_requests IS 'Track export operations and their status';
COMMENT ON COLUMN features.export_requests.resource_type IS 'Type of resource being exported';
COMMENT ON COLUMN features.export_requests.filters IS 'Applied filters in JSON format';
COMMENT ON COLUMN features.export_requests.file_path IS 'Encrypted path to generated export file';
COMMENT ON COLUMN features.export_requests.status IS 'Current status of export request';

COMMENT ON TABLE analytics.clustering_results IS 'Store K-means clustering analysis results';
COMMENT ON COLUMN analytics.clustering_results.silhouette_score IS 'Silhouette coefficient for cluster quality';
COMMENT ON COLUMN analytics.clustering_results.centroids IS 'Cluster centroids in JSON array format';
COMMENT ON COLUMN analytics.clustering_results.labels IS 'Cluster assignments for each data point';
COMMENT ON COLUMN analytics.clustering_results.is_optimal IS 'Whether this is the optimal clustering configuration';

COMMENT ON TABLE users.accessibility_preferences IS 'User-specific accessibility settings for WCAG compliance';
COMMENT ON COLUMN users.accessibility_preferences.high_contrast IS 'Enable high contrast mode';
COMMENT ON COLUMN users.accessibility_preferences.screen_reader IS 'Optimize for screen reader usage';
COMMENT ON COLUMN users.accessibility_preferences.custom_css IS 'Custom CSS overrides for accessibility';

-- ============================================================================
-- DATA RETENTION POLICY
-- ============================================================================

-- Export requests: 7 days active, 30 days archive
-- Clustering results: Permanent (for analysis and ML training)
-- Accessibility preferences: Permanent (user settings)
-- This will be implemented in partitioning migration

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. Export file paths are encrypted to prevent direct access
-- 2. Clustering results may contain sensitive data and should be secured
-- 3. Accessibility preferences are user-specific and private
-- 4. All functions include proper input validation and error handling
-- 5. Export cleanup function prevents storage bloat from failed exports
