-- Migration: Create performance indexes
-- Feature: 011-positions-talking-points
-- Task: T010

-- Positions table indexes (for filtering, sorting, searching)
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_author_id ON positions(author_id);
CREATE INDEX IF NOT EXISTS idx_positions_thematic_category ON positions(thematic_category);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_updated_at ON positions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_current_stage ON positions(current_stage);
CREATE INDEX IF NOT EXISTS idx_positions_consistency_score ON positions(consistency_score);
CREATE INDEX IF NOT EXISTS idx_positions_position_type_id ON positions(position_type_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_positions_status_created ON positions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_author_status ON positions(author_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_category_status ON positions(thematic_category, status);

-- Full-text search indexes for bilingual content
CREATE INDEX IF NOT EXISTS idx_positions_title_en_trgm ON positions USING gin (title_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_positions_title_ar_trgm ON positions USING gin (title_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_positions_content_en_trgm ON positions USING gin (content_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_positions_content_ar_trgm ON positions USING gin (content_ar gin_trgm_ops);

-- Enable pg_trgm extension for trigram text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Comments on indexes
COMMENT ON INDEX idx_positions_status IS 'Fast filtering by status (draft, under_review, approved, published)';
COMMENT ON INDEX idx_positions_author_id IS 'Fast retrieval of positions by author';
COMMENT ON INDEX idx_positions_thematic_category IS 'Faceted search by thematic category';
COMMENT ON INDEX idx_positions_created_at IS 'Chronological sorting';
COMMENT ON INDEX idx_positions_status_created IS 'Composite index for status-filtered lists sorted by date';
