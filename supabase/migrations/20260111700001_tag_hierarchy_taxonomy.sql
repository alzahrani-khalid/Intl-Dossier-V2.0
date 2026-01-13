-- Migration: Tag Hierarchy Taxonomy System
-- Feature: Hierarchical tag system for organizing entities with parent-child relationships,
--          synonyms, and auto-suggestions. Supports tag merging, renaming, and usage analytics.

-- ============================================================================
-- 1. TAG CATEGORIES TABLE (Main hierarchy structure)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tag_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES tag_categories(id) ON DELETE SET NULL,

    -- Bilingual names (required)
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,

    -- Visual properties
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'tag', -- icon name from Lucide

    -- Descriptions (optional)
    description_en TEXT,
    description_ar TEXT,

    -- Hierarchy metadata
    hierarchy_level INTEGER DEFAULT 0, -- computed: 0=root, 1=child, 2=grandchild, etc.
    hierarchy_path TEXT[], -- array of ancestor IDs for efficient traversal

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Ordering
    sort_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE, -- true for system-defined tags that cannot be deleted

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT tag_name_en_not_empty CHECK (length(trim(name_en)) > 0),
    CONSTRAINT tag_name_ar_not_empty CHECK (length(trim(name_ar)) > 0),
    CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT valid_hierarchy_level CHECK (hierarchy_level >= 0 AND hierarchy_level <= 10)
);

-- ============================================================================
-- 2. TAG SYNONYMS TABLE (Alternative names for tags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tag_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tag_categories(id) ON DELETE CASCADE,

    -- Synonym in both languages
    synonym_en TEXT,
    synonym_ar TEXT,

    -- At least one synonym must be provided
    CONSTRAINT at_least_one_synonym CHECK (
        (synonym_en IS NOT NULL AND length(trim(synonym_en)) > 0) OR
        (synonym_ar IS NOT NULL AND length(trim(synonym_ar)) > 0)
    ),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Unique synonym per tag
    UNIQUE(tag_id, synonym_en),
    UNIQUE(tag_id, synonym_ar)
);

-- ============================================================================
-- 3. ENTITY TAG ASSIGNMENTS TABLE (Many-to-many with metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entity_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Polymorphic reference to any entity type
    entity_type TEXT NOT NULL, -- 'dossier', 'document', 'brief', 'engagement', etc.
    entity_id UUID NOT NULL,

    -- Tag reference
    tag_id UUID NOT NULL REFERENCES tag_categories(id) ON DELETE CASCADE,

    -- Assignment metadata
    confidence_score NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_auto_assigned BOOLEAN DEFAULT FALSE,
    auto_assignment_source TEXT, -- 'ai', 'rule', 'import', etc.

    -- Audit
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),

    -- Prevent duplicate assignments
    UNIQUE(entity_type, entity_id, tag_id)
);

-- ============================================================================
-- 4. TAG MERGE HISTORY TABLE (Track tag consolidations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tag_merge_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The surviving tag after merge
    target_tag_id UUID NOT NULL REFERENCES tag_categories(id) ON DELETE CASCADE,

    -- Merged tag details (stored since original will be deleted)
    source_tag_name_en TEXT NOT NULL,
    source_tag_name_ar TEXT NOT NULL,
    source_tag_id UUID, -- original ID before deletion

    -- Statistics at time of merge
    assignments_transferred INTEGER DEFAULT 0,

    -- Audit
    merged_at TIMESTAMPTZ DEFAULT NOW(),
    merged_by UUID REFERENCES auth.users(id),
    merge_reason TEXT
);

-- ============================================================================
-- 5. TAG RENAME HISTORY TABLE (Track name changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tag_rename_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tag_categories(id) ON DELETE CASCADE,

    -- Old names
    old_name_en TEXT NOT NULL,
    old_name_ar TEXT NOT NULL,

    -- New names
    new_name_en TEXT NOT NULL,
    new_name_ar TEXT NOT NULL,

    -- Audit
    renamed_at TIMESTAMPTZ DEFAULT NOW(),
    renamed_by UUID REFERENCES auth.users(id),
    rename_reason TEXT
);

-- ============================================================================
-- 6. TAG USAGE ANALYTICS VIEW (Materialized for performance)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tag_usage_analytics AS
SELECT
    tc.id AS tag_id,
    tc.name_en,
    tc.name_ar,
    tc.parent_id,
    tc.hierarchy_level,
    tc.color,
    tc.is_active,
    COUNT(DISTINCT eta.entity_id) AS total_assignments,
    COUNT(DISTINCT CASE WHEN eta.entity_type = 'dossier' THEN eta.entity_id END) AS dossier_count,
    COUNT(DISTINCT CASE WHEN eta.entity_type = 'document' THEN eta.entity_id END) AS document_count,
    COUNT(DISTINCT CASE WHEN eta.entity_type = 'brief' THEN eta.entity_id END) AS brief_count,
    COUNT(DISTINCT CASE WHEN eta.entity_type = 'engagement' THEN eta.entity_id END) AS engagement_count,
    COUNT(DISTINCT CASE WHEN eta.is_auto_assigned = TRUE THEN eta.entity_id END) AS auto_assigned_count,
    AVG(eta.confidence_score) AS avg_confidence,
    MAX(eta.assigned_at) AS last_assigned_at,
    -- Calculate children count
    (SELECT COUNT(*) FROM tag_categories child WHERE child.parent_id = tc.id) AS children_count
FROM tag_categories tc
LEFT JOIN entity_tag_assignments eta ON tc.id = eta.tag_id
GROUP BY tc.id, tc.name_en, tc.name_ar, tc.parent_id, tc.hierarchy_level, tc.color, tc.is_active;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tag_usage_tag_id ON mv_tag_usage_analytics(tag_id);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tag categories indexes
CREATE INDEX IF NOT EXISTS idx_tag_categories_parent ON tag_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tag_categories_hierarchy ON tag_categories USING GIN(hierarchy_path);
CREATE INDEX IF NOT EXISTS idx_tag_categories_name_en ON tag_categories(lower(name_en));
CREATE INDEX IF NOT EXISTS idx_tag_categories_name_ar ON tag_categories(name_ar);
CREATE INDEX IF NOT EXISTS idx_tag_categories_active ON tag_categories(is_active) WHERE is_active = TRUE;

-- Full-text search for tag names
CREATE INDEX IF NOT EXISTS idx_tag_categories_search_en ON tag_categories USING GIN(to_tsvector('english', name_en || ' ' || COALESCE(description_en, '')));
CREATE INDEX IF NOT EXISTS idx_tag_categories_search_ar ON tag_categories USING GIN(to_tsvector('arabic', name_ar || ' ' || COALESCE(description_ar, '')));

-- Synonym indexes
CREATE INDEX IF NOT EXISTS idx_tag_synonyms_tag ON tag_synonyms(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_synonyms_en ON tag_synonyms(lower(synonym_en)) WHERE synonym_en IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tag_synonyms_ar ON tag_synonyms(synonym_ar) WHERE synonym_ar IS NOT NULL;

-- Entity assignments indexes
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tag_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag ON entity_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_assigned_at ON entity_tag_assignments(assigned_at DESC);

-- ============================================================================
-- 8. TRIGGER: Auto-update hierarchy path and level
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tag_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT[];
    parent_level INTEGER;
BEGIN
    -- If no parent, this is a root tag
    IF NEW.parent_id IS NULL THEN
        NEW.hierarchy_level := 0;
        NEW.hierarchy_path := ARRAY[NEW.id::TEXT];
    ELSE
        -- Get parent's path and level
        SELECT hierarchy_path, hierarchy_level
        INTO parent_path, parent_level
        FROM tag_categories
        WHERE id = NEW.parent_id;

        -- Prevent circular references
        IF NEW.id::TEXT = ANY(parent_path) THEN
            RAISE EXCEPTION 'Circular reference detected in tag hierarchy';
        END IF;

        -- Set hierarchy values
        NEW.hierarchy_level := COALESCE(parent_level, 0) + 1;
        NEW.hierarchy_path := COALESCE(parent_path, ARRAY[]::TEXT[]) || NEW.id::TEXT;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tag_hierarchy
    BEFORE INSERT OR UPDATE OF parent_id ON tag_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_hierarchy();

-- ============================================================================
-- 9. TRIGGER: Update usage count on assignment changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tag_categories
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tag_categories
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tag_usage
    AFTER INSERT OR DELETE ON entity_tag_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- ============================================================================
-- 10. FUNCTION: Get full tag hierarchy tree
-- ============================================================================
CREATE OR REPLACE FUNCTION get_tag_hierarchy_tree(
    p_root_id UUID DEFAULT NULL,
    p_max_depth INTEGER DEFAULT 10,
    p_include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
    name_en TEXT,
    name_ar TEXT,
    color TEXT,
    icon TEXT,
    description_en TEXT,
    description_ar TEXT,
    hierarchy_level INTEGER,
    hierarchy_path TEXT[],
    usage_count INTEGER,
    children_count BIGINT,
    is_active BOOLEAN,
    is_system BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE tag_tree AS (
        -- Base case: root nodes or specified root
        SELECT
            tc.id, tc.parent_id, tc.name_en, tc.name_ar,
            tc.color, tc.icon, tc.description_en, tc.description_ar,
            tc.hierarchy_level, tc.hierarchy_path, tc.usage_count,
            tc.is_active, tc.is_system, tc.sort_order, 1 as depth
        FROM tag_categories tc
        WHERE
            (p_root_id IS NULL AND tc.parent_id IS NULL)
            OR tc.id = p_root_id

        UNION ALL

        -- Recursive case: children
        SELECT
            tc.id, tc.parent_id, tc.name_en, tc.name_ar,
            tc.color, tc.icon, tc.description_en, tc.description_ar,
            tc.hierarchy_level, tc.hierarchy_path, tc.usage_count,
            tc.is_active, tc.is_system, tc.sort_order, tt.depth + 1
        FROM tag_categories tc
        INNER JOIN tag_tree tt ON tc.parent_id = tt.id
        WHERE tt.depth < p_max_depth
    )
    SELECT
        tt.id, tt.parent_id, tt.name_en, tt.name_ar,
        tt.color, tt.icon, tt.description_en, tt.description_ar,
        tt.hierarchy_level, tt.hierarchy_path, tt.usage_count,
        (SELECT COUNT(*) FROM tag_categories c WHERE c.parent_id = tt.id) AS children_count,
        tt.is_active, tt.is_system
    FROM tag_tree tt
    WHERE p_include_inactive OR tt.is_active = TRUE
    ORDER BY tt.hierarchy_level, tt.sort_order, tt.name_en;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 11. FUNCTION: Search tags with synonyms and auto-suggestions
-- ============================================================================
CREATE OR REPLACE FUNCTION search_tags(
    p_query TEXT,
    p_language TEXT DEFAULT 'en',
    p_limit INTEGER DEFAULT 20,
    p_entity_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    color TEXT,
    parent_id UUID,
    hierarchy_level INTEGER,
    usage_count INTEGER,
    match_type TEXT, -- 'exact', 'prefix', 'synonym', 'fuzzy'
    match_score NUMERIC
) AS $$
DECLARE
    search_pattern TEXT;
BEGIN
    search_pattern := '%' || lower(trim(p_query)) || '%';

    RETURN QUERY
    WITH ranked_matches AS (
        -- Exact matches on name
        SELECT DISTINCT ON (tc.id)
            tc.id, tc.name_en, tc.name_ar, tc.color, tc.parent_id,
            tc.hierarchy_level, tc.usage_count,
            CASE
                WHEN lower(tc.name_en) = lower(p_query) OR tc.name_ar = p_query THEN 'exact'
                WHEN lower(tc.name_en) LIKE lower(p_query) || '%' OR tc.name_ar LIKE p_query || '%' THEN 'prefix'
                ELSE 'partial'
            END AS match_type,
            CASE
                WHEN lower(tc.name_en) = lower(p_query) OR tc.name_ar = p_query THEN 1.0
                WHEN lower(tc.name_en) LIKE lower(p_query) || '%' OR tc.name_ar LIKE p_query || '%' THEN 0.9
                ELSE 0.7
            END + (tc.usage_count::NUMERIC / GREATEST((SELECT MAX(usage_count) FROM tag_categories), 1) * 0.2) AS match_score
        FROM tag_categories tc
        WHERE tc.is_active = TRUE
        AND (
            lower(tc.name_en) LIKE search_pattern
            OR tc.name_ar LIKE search_pattern
        )

        UNION ALL

        -- Synonym matches
        SELECT DISTINCT ON (tc.id)
            tc.id, tc.name_en, tc.name_ar, tc.color, tc.parent_id,
            tc.hierarchy_level, tc.usage_count,
            'synonym'::TEXT AS match_type,
            0.8 AS match_score
        FROM tag_categories tc
        INNER JOIN tag_synonyms ts ON tc.id = ts.tag_id
        WHERE tc.is_active = TRUE
        AND (
            lower(ts.synonym_en) LIKE search_pattern
            OR ts.synonym_ar LIKE search_pattern
        )
    )
    SELECT DISTINCT ON (rm.id)
        rm.id, rm.name_en, rm.name_ar, rm.color, rm.parent_id,
        rm.hierarchy_level, rm.usage_count, rm.match_type, rm.match_score
    FROM ranked_matches rm
    ORDER BY rm.id, rm.match_score DESC, rm.usage_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 12. FUNCTION: Merge tags
-- ============================================================================
CREATE OR REPLACE FUNCTION merge_tags(
    p_source_tag_id UUID,
    p_target_tag_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_source_name_en TEXT;
    v_source_name_ar TEXT;
    v_assignments_count INTEGER;
BEGIN
    -- Validate tags exist and are different
    IF p_source_tag_id = p_target_tag_id THEN
        RAISE EXCEPTION 'Cannot merge a tag with itself';
    END IF;

    -- Get source tag info
    SELECT name_en, name_ar INTO v_source_name_en, v_source_name_ar
    FROM tag_categories WHERE id = p_source_tag_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source tag not found';
    END IF;

    -- Check target exists
    IF NOT EXISTS (SELECT 1 FROM tag_categories WHERE id = p_target_tag_id) THEN
        RAISE EXCEPTION 'Target tag not found';
    END IF;

    -- Check if source is system tag
    IF EXISTS (SELECT 1 FROM tag_categories WHERE id = p_source_tag_id AND is_system = TRUE) THEN
        RAISE EXCEPTION 'Cannot merge system tags';
    END IF;

    -- Transfer assignments (ignore duplicates)
    WITH transferred AS (
        UPDATE entity_tag_assignments
        SET tag_id = p_target_tag_id
        WHERE tag_id = p_source_tag_id
        AND NOT EXISTS (
            SELECT 1 FROM entity_tag_assignments eta2
            WHERE eta2.entity_type = entity_tag_assignments.entity_type
            AND eta2.entity_id = entity_tag_assignments.entity_id
            AND eta2.tag_id = p_target_tag_id
        )
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_assignments_count FROM transferred;

    -- Add source tag name as synonym to target
    INSERT INTO tag_synonyms (tag_id, synonym_en, synonym_ar, created_by)
    VALUES (p_target_tag_id, v_source_name_en, v_source_name_ar, p_user_id)
    ON CONFLICT DO NOTHING;

    -- Move children to target
    UPDATE tag_categories SET parent_id = p_target_tag_id WHERE parent_id = p_source_tag_id;

    -- Record merge history
    INSERT INTO tag_merge_history (
        target_tag_id, source_tag_name_en, source_tag_name_ar,
        source_tag_id, assignments_transferred, merged_by, merge_reason
    ) VALUES (
        p_target_tag_id, v_source_name_en, v_source_name_ar,
        p_source_tag_id, v_assignments_count, p_user_id, p_reason
    );

    -- Delete source tag
    DELETE FROM tag_categories WHERE id = p_source_tag_id;

    -- Update target usage count
    UPDATE tag_categories
    SET usage_count = (
        SELECT COUNT(*) FROM entity_tag_assignments WHERE tag_id = p_target_tag_id
    )
    WHERE id = p_target_tag_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. FUNCTION: Rename tag with history
-- ============================================================================
CREATE OR REPLACE FUNCTION rename_tag(
    p_tag_id UUID,
    p_new_name_en TEXT,
    p_new_name_ar TEXT,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_name_en TEXT;
    v_old_name_ar TEXT;
BEGIN
    -- Get current names
    SELECT name_en, name_ar INTO v_old_name_en, v_old_name_ar
    FROM tag_categories WHERE id = p_tag_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tag not found';
    END IF;

    -- Record rename history
    INSERT INTO tag_rename_history (
        tag_id, old_name_en, old_name_ar, new_name_en, new_name_ar, renamed_by, rename_reason
    ) VALUES (
        p_tag_id, v_old_name_en, v_old_name_ar, p_new_name_en, p_new_name_ar, p_user_id, p_reason
    );

    -- Add old names as synonyms
    INSERT INTO tag_synonyms (tag_id, synonym_en, synonym_ar, created_by)
    VALUES (p_tag_id, v_old_name_en, v_old_name_ar, p_user_id)
    ON CONFLICT DO NOTHING;

    -- Update tag
    UPDATE tag_categories
    SET name_en = p_new_name_en, name_ar = p_new_name_ar, updated_at = NOW()
    WHERE id = p_tag_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. FUNCTION: Get tags for entity
-- ============================================================================
CREATE OR REPLACE FUNCTION get_entity_tags(
    p_entity_type TEXT,
    p_entity_id UUID
)
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    color TEXT,
    icon TEXT,
    parent_id UUID,
    hierarchy_level INTEGER,
    hierarchy_path TEXT[],
    confidence_score NUMERIC,
    is_auto_assigned BOOLEAN,
    assigned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.id, tc.name_en, tc.name_ar, tc.color, tc.icon,
        tc.parent_id, tc.hierarchy_level, tc.hierarchy_path,
        eta.confidence_score, eta.is_auto_assigned, eta.assigned_at
    FROM entity_tag_assignments eta
    INNER JOIN tag_categories tc ON eta.tag_id = tc.id
    WHERE eta.entity_type = p_entity_type
    AND eta.entity_id = p_entity_id
    AND tc.is_active = TRUE
    ORDER BY tc.hierarchy_level, tc.name_en;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 15. FUNCTION: Auto-suggest tags based on entity content
-- ============================================================================
CREATE OR REPLACE FUNCTION suggest_tags_for_entity(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    tag_id UUID,
    name_en TEXT,
    name_ar TEXT,
    color TEXT,
    suggestion_reason TEXT,
    confidence NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH entity_existing_tags AS (
        -- Get tags already assigned to this entity
        SELECT tag_id FROM entity_tag_assignments
        WHERE entity_type = p_entity_type AND entity_id = p_entity_id
    ),
    sibling_tags AS (
        -- Get tags from similar entities (same type, similar tags)
        SELECT
            eta2.tag_id,
            COUNT(*)::NUMERIC / 10.0 AS similarity_score
        FROM entity_tag_assignments eta1
        INNER JOIN entity_tag_assignments eta2
            ON eta1.entity_id != eta2.entity_id
            AND eta1.entity_type = eta2.entity_type
            AND eta1.tag_id = eta2.tag_id
        WHERE eta1.entity_type = p_entity_type
        AND eta1.entity_id = p_entity_id
        AND eta2.tag_id NOT IN (SELECT tag_id FROM entity_existing_tags)
        GROUP BY eta2.tag_id
    ),
    popular_tags AS (
        -- Get popular tags for this entity type
        SELECT
            tag_id,
            COUNT(*)::NUMERIC / GREATEST((SELECT COUNT(*) FROM entity_tag_assignments WHERE entity_type = p_entity_type), 1) AS popularity
        FROM entity_tag_assignments
        WHERE entity_type = p_entity_type
        AND tag_id NOT IN (SELECT tag_id FROM entity_existing_tags)
        GROUP BY tag_id
        ORDER BY COUNT(*) DESC
        LIMIT 20
    )
    SELECT DISTINCT ON (tc.id)
        tc.id AS tag_id,
        tc.name_en,
        tc.name_ar,
        tc.color,
        CASE
            WHEN st.tag_id IS NOT NULL THEN 'similar_entities'
            ELSE 'popular_in_type'
        END AS suggestion_reason,
        COALESCE(st.similarity_score, pt.popularity, 0.5)::NUMERIC AS confidence
    FROM tag_categories tc
    LEFT JOIN sibling_tags st ON tc.id = st.tag_id
    LEFT JOIN popular_tags pt ON tc.id = pt.tag_id
    WHERE tc.is_active = TRUE
    AND (st.tag_id IS NOT NULL OR pt.tag_id IS NOT NULL)
    AND tc.id NOT IN (SELECT tag_id FROM entity_existing_tags)
    ORDER BY tc.id, COALESCE(st.similarity_score, pt.popularity, 0) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 16. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_rename_history ENABLE ROW LEVEL SECURITY;

-- Tag categories: Everyone can view active tags, only authenticated users can create
CREATE POLICY "Anyone can view active tags"
    ON tag_categories FOR SELECT
    USING (is_active = TRUE OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create tags"
    ON tag_categories FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tag creators or admins can update"
    ON tag_categories FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Only non-system tags can be deleted by creators"
    ON tag_categories FOR DELETE
    TO authenticated
    USING (
        is_system = FALSE AND (
            created_by = auth.uid() OR
            EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
        )
    );

-- Tag synonyms: Same as parent tag
CREATE POLICY "Anyone can view synonyms"
    ON tag_synonyms FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can manage synonyms"
    ON tag_synonyms FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Entity assignments: Based on entity access
CREATE POLICY "Users can view tag assignments"
    ON entity_tag_assignments FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can assign tags"
    ON entity_tag_assignments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Authenticated users can remove tag assignments"
    ON entity_tag_assignments FOR DELETE
    TO authenticated
    USING (
        assigned_by = auth.uid() OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
    );

-- History tables: Read-only for authenticated users
CREATE POLICY "Authenticated users can view merge history"
    ON tag_merge_history FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Authenticated users can view rename history"
    ON tag_rename_history FOR SELECT
    TO authenticated
    USING (TRUE);

-- ============================================================================
-- 17. SEED INITIAL SYSTEM TAGS
-- ============================================================================
INSERT INTO tag_categories (name_en, name_ar, color, icon, is_system, sort_order, created_by) VALUES
    ('Priority', 'الأولوية', '#EF4444', 'alert-circle', TRUE, 1, NULL),
    ('Region', 'المنطقة', '#3B82F6', 'globe', TRUE, 2, NULL),
    ('Topic', 'الموضوع', '#10B981', 'bookmark', TRUE, 3, NULL),
    ('Status', 'الحالة', '#F59E0B', 'check-circle', TRUE, 4, NULL),
    ('Sector', 'القطاع', '#8B5CF6', 'briefcase', TRUE, 5, NULL)
ON CONFLICT DO NOTHING;

-- Add child tags for Priority
INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'High Priority', 'أولوية عالية', '#DC2626', 'alert-triangle', TRUE, 1, NULL
FROM tag_categories WHERE name_en = 'Priority' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Medium Priority', 'أولوية متوسطة', '#F59E0B', 'alert-circle', TRUE, 2, NULL
FROM tag_categories WHERE name_en = 'Priority' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Low Priority', 'أولوية منخفضة', '#10B981', 'info', TRUE, 3, NULL
FROM tag_categories WHERE name_en = 'Priority' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Add child tags for Region
INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Middle East', 'الشرق الأوسط', '#2563EB', 'map-pin', TRUE, 1, NULL
FROM tag_categories WHERE name_en = 'Region' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Europe', 'أوروبا', '#7C3AED', 'map-pin', TRUE, 2, NULL
FROM tag_categories WHERE name_en = 'Region' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Asia Pacific', 'آسيا والمحيط الهادئ', '#059669', 'map-pin', TRUE, 3, NULL
FROM tag_categories WHERE name_en = 'Region' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Americas', 'الأمريكتين', '#DC2626', 'map-pin', TRUE, 4, NULL
FROM tag_categories WHERE name_en = 'Region' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tag_categories (parent_id, name_en, name_ar, color, icon, is_system, sort_order, created_by)
SELECT id, 'Africa', 'أفريقيا', '#CA8A04', 'map-pin', TRUE, 5, NULL
FROM tag_categories WHERE name_en = 'Region' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_tag_usage_analytics;

-- ============================================================================
-- 18. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON tag_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON tag_categories TO authenticated;
GRANT SELECT ON tag_synonyms TO authenticated;
GRANT INSERT, DELETE ON tag_synonyms TO authenticated;
GRANT SELECT ON entity_tag_assignments TO authenticated;
GRANT INSERT, DELETE ON entity_tag_assignments TO authenticated;
GRANT SELECT ON tag_merge_history TO authenticated;
GRANT SELECT ON tag_rename_history TO authenticated;
GRANT SELECT ON mv_tag_usage_analytics TO authenticated;
