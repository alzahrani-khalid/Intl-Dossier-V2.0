-- Migration: Create Search Filters table
-- Purpose: Saved search configurations (FR-020 to FR-025)
-- Feature: 004-refine-specification-to Phase 3.4

-- Create search_filters table
CREATE TABLE search_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Search criteria (FR-020, FR-021)
    search_entities TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(search_entities, 1) > 0),
    full_text_query TEXT,
    
    -- Filters (FR-021, FR-022)
    date_range JSONB, -- {from: timestamp, to: timestamp}
    status_filter TEXT[] DEFAULT '{}',
    priority_filter TEXT[] DEFAULT '{}',
    custom_tags TEXT[] DEFAULT '{}',
    filter_logic TEXT NOT NULL DEFAULT 'AND' CHECK (filter_logic IN ('AND', 'OR')),
    
    -- Pagination (FR-025)
    page_size INTEGER NOT NULL DEFAULT 25 CHECK (page_size IN (10, 25, 50, 100)),
    
    -- Timeout handling (FR-025a)
    timeout_behavior TEXT NOT NULL DEFAULT 'partial' CHECK (timeout_behavior IN ('partial', 'fail', 'cached')),
    max_timeout_ms INTEGER NOT NULL DEFAULT 2000 CHECK (max_timeout_ms > 0 AND max_timeout_ms <= 30000),
    
    -- Status
    is_default BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_search_filters_user_id ON search_filters(user_id);
CREATE INDEX idx_search_filters_default ON search_filters(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_search_filters_entities ON search_filters USING gin(search_entities);
CREATE INDEX idx_search_filters_tags ON search_filters USING gin(custom_tags);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_search_filters_updated_at
    BEFORE UPDATE ON search_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_search_filters_updated_at();

-- Create function to validate search entities
CREATE OR REPLACE FUNCTION validate_search_entities()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if search_entities contains valid values
    IF NOT (NEW.search_entities <@ ARRAY['dossier', 'organization', 'country', 'project']) THEN
        RAISE EXCEPTION 'search_entities must contain only: dossier, organization, country, project';
    END IF;
    
    -- Check if at least one entity is selected
    IF array_length(NEW.search_entities, 1) = 0 THEN
        RAISE EXCEPTION 'At least one search entity must be selected';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search entities validation
CREATE TRIGGER trigger_validate_search_entities
    BEFORE INSERT OR UPDATE ON search_filters
    FOR EACH ROW
    EXECUTE FUNCTION validate_search_entities();

-- Create function to validate date range
CREATE OR REPLACE FUNCTION validate_date_range()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_range IS NOT NULL THEN
        -- Check if date_range has required fields
        IF NOT (NEW.date_range ? 'from' AND NEW.date_range ? 'to') THEN
            RAISE EXCEPTION 'date_range must contain both ''from'' and ''to'' fields';
        END IF;
        
        -- Check if from is before to
        IF (NEW.date_range->>'from')::timestamptz >= (NEW.date_range->>'to')::timestamptz THEN
            RAISE EXCEPTION 'date_range.from must be before date_range.to';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for date range validation
CREATE TRIGGER trigger_validate_date_range
    BEFORE INSERT OR UPDATE ON search_filters
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_range();

-- Create function to ensure only one default filter per user
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Remove default flag from other filters for this user
        UPDATE search_filters 
        SET is_default = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single default filter
CREATE TRIGGER trigger_ensure_single_default_filter
    BEFORE INSERT OR UPDATE ON search_filters
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_filter();

-- Add comments
COMMENT ON TABLE search_filters IS 'Saved search configurations with filters and pagination settings';
COMMENT ON COLUMN search_filters.search_entities IS 'Array of entity types to search: dossier, organization, country, project';
COMMENT ON COLUMN search_filters.date_range IS 'JSONB object with from/to timestamps for date filtering';
COMMENT ON COLUMN search_filters.filter_logic IS 'Logic operator for combining filters: AND or OR';
COMMENT ON COLUMN search_filters.page_size IS 'Number of results per page: 10, 25, 50, or 100';
COMMENT ON COLUMN search_filters.timeout_behavior IS 'Behavior when search times out: partial, fail, or cached';
COMMENT ON COLUMN search_filters.max_timeout_ms IS 'Maximum timeout in milliseconds (≤30000)';
COMMENT ON COLUMN search_filters.is_default IS 'Whether this is the default filter for the user';
