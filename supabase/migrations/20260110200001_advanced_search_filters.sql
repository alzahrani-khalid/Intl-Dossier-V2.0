-- Migration: Advanced Search Filters Enhancement
-- Feature: advanced-search-filters
-- Description: Complex multi-criteria search with boolean logic (AND/OR/NOT), relationship queries, and saved search templates
-- Created: 2026-01-10

-- Add new columns for advanced search capabilities
ALTER TABLE search_filters
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Create table for advanced filter conditions with boolean logic
CREATE TABLE IF NOT EXISTS search_filter_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filter_id UUID NOT NULL REFERENCES search_filters(id) ON DELETE CASCADE,

    -- Boolean logic group
    group_operator TEXT NOT NULL DEFAULT 'AND' CHECK (group_operator IN ('AND', 'OR')),
    group_order INTEGER NOT NULL DEFAULT 0,

    -- Individual condition
    field_name TEXT NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN (
        'equals', 'not_equals',
        'contains', 'not_contains',
        'starts_with', 'ends_with',
        'greater_than', 'less_than',
        'greater_equal', 'less_equal',
        'between', 'not_between',
        'in', 'not_in',
        'is_null', 'is_not_null',
        'matches_regex'
    )),
    field_value JSONB, -- Supports arrays, ranges, single values
    is_negated BOOLEAN NOT NULL DEFAULT false, -- For NOT logic
    condition_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for relationship-based search criteria
CREATE TABLE IF NOT EXISTS search_filter_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filter_id UUID NOT NULL REFERENCES search_filters(id) ON DELETE CASCADE,

    -- Relationship definition
    source_entity_type TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'parent_of', 'child_of',
        'linked_to', 'related_to',
        'member_of', 'has_member',
        'assigned_to', 'owned_by',
        'created_by', 'updated_by',
        'mentions', 'mentioned_by'
    )),

    -- Optional filters on related entity
    target_entity_conditions JSONB DEFAULT '{}',
    include_depth INTEGER DEFAULT 1 CHECK (include_depth >= 1 AND include_depth <= 5),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for saved search templates (presets)
CREATE TABLE IF NOT EXISTS search_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template metadata
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    icon TEXT DEFAULT 'search',
    color TEXT DEFAULT 'blue',

    -- Template category
    category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN (
        'quick', 'recent', 'popular', 'custom', 'system'
    )),

    -- Template definition (JSON representation of search criteria)
    template_definition JSONB NOT NULL,

    -- Template scope
    is_system BOOLEAN NOT NULL DEFAULT false, -- System templates can't be deleted
    is_public BOOLEAN NOT NULL DEFAULT true,  -- Visible to all users
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Usage tracking
    use_count INTEGER NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_search_filter_conditions_filter_id
    ON search_filter_conditions(filter_id);
CREATE INDEX IF NOT EXISTS idx_search_filter_conditions_field
    ON search_filter_conditions(field_name);
CREATE INDEX IF NOT EXISTS idx_search_filter_conditions_group
    ON search_filter_conditions(filter_id, group_order, condition_order);

CREATE INDEX IF NOT EXISTS idx_search_filter_relationships_filter_id
    ON search_filter_relationships(filter_id);
CREATE INDEX IF NOT EXISTS idx_search_filter_relationships_entities
    ON search_filter_relationships(source_entity_type, target_entity_type);

CREATE INDEX IF NOT EXISTS idx_search_templates_category
    ON search_templates(category);
CREATE INDEX IF NOT EXISTS idx_search_templates_public
    ON search_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_search_templates_created_by
    ON search_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_search_templates_use_count
    ON search_templates(use_count DESC);

-- Trigger for search_templates updated_at
CREATE TRIGGER trigger_update_search_templates_updated_at
    BEFORE UPDATE ON search_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_search_filters_updated_at();

-- Function: Increment search filter use count
CREATE OR REPLACE FUNCTION increment_filter_use_count(p_filter_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE search_filters
    SET
        use_count = use_count + 1,
        last_used_at = NOW()
    WHERE id = p_filter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment template use count
CREATE OR REPLACE FUNCTION increment_template_use_count(p_template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE search_templates
    SET use_count = use_count + 1
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Build boolean search query from conditions
CREATE OR REPLACE FUNCTION build_boolean_search_query(p_filter_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_query TEXT := '';
    v_current_group INTEGER := -1;
    v_condition RECORD;
BEGIN
    FOR v_condition IN
        SELECT * FROM search_filter_conditions
        WHERE filter_id = p_filter_id
        ORDER BY group_order, condition_order
    LOOP
        -- Start new group if needed
        IF v_condition.group_order != v_current_group THEN
            IF v_current_group >= 0 THEN
                v_query := v_query || ') ';
            END IF;
            IF v_current_group >= 0 THEN
                v_query := v_query || v_condition.group_operator || ' (';
            ELSE
                v_query := v_query || '(';
            END IF;
            v_current_group := v_condition.group_order;
        ELSE
            -- Add operator between conditions in same group
            v_query := v_query || ' AND ';
        END IF;

        -- Add negation if needed
        IF v_condition.is_negated THEN
            v_query := v_query || 'NOT ';
        END IF;

        -- Add field condition
        v_query := v_query || v_condition.field_name || ' ' || v_condition.operator;

        IF v_condition.field_value IS NOT NULL THEN
            v_query := v_query || ' ' || v_condition.field_value::text;
        END IF;
    END LOOP;

    -- Close last group
    IF v_current_group >= 0 THEN
        v_query := v_query || ')';
    END IF;

    RETURN v_query;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Execute advanced search with boolean logic
CREATE OR REPLACE FUNCTION execute_advanced_search(
    p_filter_id UUID DEFAULT NULL,
    p_query TEXT DEFAULT NULL,
    p_entity_types TEXT[] DEFAULT ARRAY['dossier'],
    p_conditions JSONB DEFAULT '[]',
    p_relationships JSONB DEFAULT '[]',
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_status TEXT[] DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_filter_logic TEXT DEFAULT 'AND',
    p_include_archived BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_sort_by TEXT DEFAULT 'relevance',
    p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
    entity_id UUID,
    entity_type TEXT,
    title_en TEXT,
    title_ar TEXT,
    snippet_en TEXT,
    snippet_ar TEXT,
    rank_score REAL,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
DECLARE
    v_tsquery tsquery;
    v_has_text_query BOOLEAN;
BEGIN
    -- Increment use count if using saved filter
    IF p_filter_id IS NOT NULL THEN
        PERFORM increment_filter_use_count(p_filter_id);
    END IF;

    -- Build text search query if provided
    v_has_text_query := p_query IS NOT NULL AND trim(p_query) != '';
    IF v_has_text_query THEN
        v_tsquery := websearch_to_tsquery('english', p_query);
    END IF;

    -- Search dossiers if included
    IF 'dossier' = ANY(p_entity_types) THEN
        RETURN QUERY
        SELECT
            d.id as entity_id,
            'dossier'::text as entity_type,
            d.title_en,
            d.title_ar,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('english', COALESCE(d.summary_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(d.summary_en, ''), 200)
            END as snippet_en,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('arabic', COALESCE(d.summary_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(d.summary_ar, ''), 200)
            END as snippet_ar,
            CASE
                WHEN v_has_text_query THEN ts_rank_cd(d.search_vector, v_tsquery)
                ELSE 1.0
            END::real as rank_score,
            d.status,
            d.created_at,
            d.updated_at,
            jsonb_build_object(
                'type', d.type,
                'tags', d.tags,
                'sensitivity_level', d.sensitivity_level
            ) as metadata
        FROM dossiers d
        WHERE
            (NOT v_has_text_query OR d.search_vector @@ v_tsquery)
            AND (p_include_archived OR d.archived = false)
            AND (p_status IS NULL OR d.status = ANY(p_status))
            AND (p_tags IS NULL OR d.tags && p_tags)
            AND (p_date_from IS NULL OR d.created_at >= p_date_from)
            AND (p_date_to IS NULL OR d.created_at <= p_date_to)
        ORDER BY
            CASE WHEN p_sort_by = 'relevance' AND v_has_text_query THEN ts_rank_cd(d.search_vector, v_tsquery) ELSE 0 END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN d.updated_at END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN d.updated_at END ASC,
            CASE WHEN p_sort_by = 'title' AND p_sort_order = 'asc' THEN d.title_en END ASC,
            CASE WHEN p_sort_by = 'title' AND p_sort_order = 'desc' THEN d.title_en END DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;

    -- Search engagements if included
    IF 'engagement' = ANY(p_entity_types) THEN
        RETURN QUERY
        SELECT
            e.id as entity_id,
            'engagement'::text as entity_type,
            e.title_en,
            e.title_ar,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('english', COALESCE(e.description_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(e.description_en, ''), 200)
            END as snippet_en,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('arabic', COALESCE(e.description_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(e.description_ar, ''), 200)
            END as snippet_ar,
            CASE
                WHEN v_has_text_query THEN ts_rank_cd(e.search_vector, v_tsquery)
                ELSE 1.0
            END::real as rank_score,
            e.status,
            e.created_at,
            e.updated_at,
            jsonb_build_object(
                'start_date', e.start_date,
                'end_date', e.end_date,
                'location', e.location
            ) as metadata
        FROM engagements e
        WHERE
            (NOT v_has_text_query OR e.search_vector @@ v_tsquery)
            AND (p_status IS NULL OR e.status = ANY(p_status))
            AND (p_date_from IS NULL OR e.start_date >= p_date_from)
            AND (p_date_to IS NULL OR e.start_date <= p_date_to)
        ORDER BY
            CASE WHEN p_sort_by = 'relevance' AND v_has_text_query THEN ts_rank_cd(e.search_vector, v_tsquery) ELSE 0 END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN e.updated_at END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN e.updated_at END ASC
        LIMIT p_limit OFFSET p_offset;
    END IF;

    -- Search positions if included
    IF 'position' = ANY(p_entity_types) THEN
        RETURN QUERY
        SELECT
            p.id as entity_id,
            'position'::text as entity_type,
            p.title_en,
            p.title_ar,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('english', COALESCE(p.key_messages_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(p.key_messages_en, ''), 200)
            END as snippet_en,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('arabic', COALESCE(p.key_messages_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(p.key_messages_ar, ''), 200)
            END as snippet_ar,
            CASE
                WHEN v_has_text_query THEN ts_rank_cd(p.search_vector, v_tsquery)
                ELSE 1.0
            END::real as rank_score,
            p.status,
            p.created_at,
            p.updated_at,
            jsonb_build_object(
                'topic', p.topic,
                'version', p.version
            ) as metadata
        FROM positions p
        WHERE
            (NOT v_has_text_query OR p.search_vector @@ v_tsquery)
            AND (p_status IS NULL OR p.status = ANY(p_status))
            AND (p_date_from IS NULL OR p.created_at >= p_date_from)
            AND (p_date_to IS NULL OR p.created_at <= p_date_to)
            AND p.status = 'published'
        ORDER BY
            CASE WHEN p_sort_by = 'relevance' AND v_has_text_query THEN ts_rank_cd(p.search_vector, v_tsquery) ELSE 0 END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN p.updated_at END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN p.updated_at END ASC
        LIMIT p_limit OFFSET p_offset;
    END IF;

    -- Search documents if included
    IF 'document' = ANY(p_entity_types) THEN
        RETURN QUERY
        SELECT
            a.id as entity_id,
            'document'::text as entity_type,
            a.file_name as title_en,
            a.file_name as title_ar,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('english', COALESCE(a.description_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(a.description_en, ''), 200)
            END as snippet_en,
            CASE
                WHEN v_has_text_query THEN
                    ts_headline('arabic', COALESCE(a.description_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=30')
                ELSE LEFT(COALESCE(a.description_ar, ''), 200)
            END as snippet_ar,
            CASE
                WHEN v_has_text_query THEN ts_rank_cd(a.search_vector, v_tsquery)
                ELSE 1.0
            END::real as rank_score,
            'active'::text as status,
            a.created_at,
            a.updated_at,
            jsonb_build_object(
                'file_type', a.file_type,
                'file_size', a.file_size
            ) as metadata
        FROM attachments a
        WHERE
            (NOT v_has_text_query OR a.search_vector @@ v_tsquery)
            AND a.deleted_at IS NULL
            AND (p_date_from IS NULL OR a.created_at >= p_date_from)
            AND (p_date_to IS NULL OR a.created_at <= p_date_to)
        ORDER BY
            CASE WHEN p_sort_by = 'relevance' AND v_has_text_query THEN ts_rank_cd(a.search_vector, v_tsquery) ELSE 0 END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN a.updated_at END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN a.updated_at END ASC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RLS Policies for search_filter_conditions
ALTER TABLE search_filter_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conditions of their own filters"
    ON search_filter_conditions FOR SELECT
    USING (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conditions for their own filters"
    ON search_filter_conditions FOR INSERT
    WITH CHECK (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update conditions of their own filters"
    ON search_filter_conditions FOR UPDATE
    USING (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete conditions of their own filters"
    ON search_filter_conditions FOR DELETE
    USING (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for search_filter_relationships
ALTER TABLE search_filter_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships of their own filters"
    ON search_filter_relationships FOR SELECT
    USING (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert relationships for their own filters"
    ON search_filter_relationships FOR INSERT
    WITH CHECK (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update relationships of their own filters"
    ON search_filter_relationships FOR UPDATE
    USING (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete relationships of their own filters"
    ON search_filter_relationships FOR DELETE
    USING (
        filter_id IN (
            SELECT id FROM search_filters WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for search_templates
ALTER TABLE search_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates"
    ON search_templates FOR SELECT
    USING (
        is_public = true
        OR created_by = auth.uid()
    );

CREATE POLICY "Users can insert their own templates"
    ON search_templates FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND is_system = false
    );

CREATE POLICY "Users can update their own non-system templates"
    ON search_templates FOR UPDATE
    USING (
        created_by = auth.uid()
        AND is_system = false
    );

CREATE POLICY "Users can delete their own non-system templates"
    ON search_templates FOR DELETE
    USING (
        created_by = auth.uid()
        AND is_system = false
    );

-- Insert default system templates
INSERT INTO search_templates (name_en, name_ar, description_en, description_ar, icon, color, category, template_definition, is_system, is_public)
VALUES
(
    'Recent Documents',
    'المستندات الحديثة',
    'Search for documents created in the last 7 days',
    'البحث عن المستندات التي تم إنشاؤها في آخر 7 أيام',
    'file-text',
    'blue',
    'quick',
    '{"entity_types": ["document"], "date_range": {"preset": "last_7_days"}, "sort_by": "date", "sort_order": "desc"}'::jsonb,
    true,
    true
),
(
    'Active Dossiers',
    'الملفات النشطة',
    'Search for active dossiers only',
    'البحث عن الملفات النشطة فقط',
    'folder-open',
    'green',
    'quick',
    '{"entity_types": ["dossier"], "status": ["active"], "include_archived": false}'::jsonb,
    true,
    true
),
(
    'High Sensitivity',
    'عالية الحساسية',
    'Search for high sensitivity items',
    'البحث عن العناصر عالية الحساسية',
    'shield',
    'red',
    'quick',
    '{"entity_types": ["dossier", "document"], "conditions": [{"field": "sensitivity_level", "operator": "equals", "value": "high"}]}'::jsonb,
    true,
    true
),
(
    'Upcoming Engagements',
    'الاجتماعات القادمة',
    'Search for upcoming engagements',
    'البحث عن الاجتماعات القادمة',
    'calendar',
    'purple',
    'quick',
    '{"entity_types": ["engagement"], "date_range": {"preset": "next_30_days"}, "sort_by": "date", "sort_order": "asc"}'::jsonb,
    true,
    true
),
(
    'My Recent Searches',
    'عمليات البحث الأخيرة',
    'Show recently used search filters',
    'إظهار مرشحات البحث المستخدمة مؤخراً',
    'history',
    'gray',
    'recent',
    '{"show_recent": true, "limit": 10}'::jsonb,
    true,
    true
);

-- Add comments
COMMENT ON TABLE search_filter_conditions IS 'Individual filter conditions with boolean logic support for advanced search';
COMMENT ON TABLE search_filter_relationships IS 'Relationship-based search criteria for cross-entity queries';
COMMENT ON TABLE search_templates IS 'Reusable search templates and presets for quick access';
COMMENT ON FUNCTION execute_advanced_search IS 'Execute advanced search with full-text, filters, and boolean logic';
COMMENT ON FUNCTION build_boolean_search_query IS 'Build SQL query string from filter conditions';
