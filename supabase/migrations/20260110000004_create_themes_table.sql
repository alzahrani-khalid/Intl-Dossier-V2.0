-- Migration: Create Themes Extension Table
-- Date: 2026-01-10
-- Feature: themes-entity-management
-- Description: Themes entity for topical areas and issue domains (e.g., SDGs, Climate Statistics, Digital Economy)
--              Supports taxonomy/hierarchical structure with bilingual labels and cross-cutting relationships

-- Create themes extension table (extends dossiers)
CREATE TABLE IF NOT EXISTS public.themes (
    -- Primary key references dossiers table
    id UUID PRIMARY KEY REFERENCES public.dossiers(id) ON DELETE CASCADE,

    -- Hierarchy support for taxonomy
    parent_theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,

    -- Category code for identification (e.g., SDG-01, ENV-CLIMATE, DIGITAL-ECON)
    category_code TEXT NOT NULL,

    -- Hierarchy level (1 = root, 2 = child, etc.)
    hierarchy_level INTEGER NOT NULL DEFAULT 1 CHECK (hierarchy_level >= 1 AND hierarchy_level <= 10),

    -- Icon identifier for UI display
    icon TEXT,

    -- Color hex code for UI display
    color TEXT CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),

    -- Flexible attributes for additional metadata
    attributes JSONB DEFAULT '{}'::JSONB,

    -- Ordering within taxonomy level
    sort_order INTEGER DEFAULT 0,

    -- Is this a standard taxonomy category (SDGs, etc.)?
    is_standard BOOLEAN DEFAULT FALSE,

    -- External reference URL (e.g., link to SDG official page)
    external_url TEXT CHECK (external_url IS NULL OR external_url ~ '^https?://'),

    -- Audit timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure category codes are unique at the same hierarchy level
    CONSTRAINT unique_category_code_per_parent UNIQUE (parent_theme_id, category_code)
);

-- Create unique index on category_code for root-level themes
CREATE UNIQUE INDEX idx_themes_root_category_code
ON public.themes (category_code)
WHERE parent_theme_id IS NULL;

-- Create index for parent lookups
CREATE INDEX idx_themes_parent ON public.themes(parent_theme_id);

-- Create index for hierarchy level queries
CREATE INDEX idx_themes_hierarchy_level ON public.themes(hierarchy_level);

-- Create index for sorting
CREATE INDEX idx_themes_sort_order ON public.themes(sort_order);

-- Create index for standard themes lookup
CREATE INDEX idx_themes_is_standard ON public.themes(is_standard) WHERE is_standard = TRUE;

-- Create GIN index for JSONB attributes
CREATE INDEX idx_themes_attributes ON public.themes USING GIN(attributes);

-- Create updated_at trigger
CREATE TRIGGER update_themes_updated_at
    BEFORE UPDATE ON public.themes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate theme hierarchy (prevent circular references)
CREATE OR REPLACE FUNCTION public.validate_theme_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    ancestor_id UUID;
    level_count INTEGER := 0;
    max_levels INTEGER := 10;
BEGIN
    -- If no parent, just set hierarchy_level to 1
    IF NEW.parent_theme_id IS NULL THEN
        NEW.hierarchy_level := 1;
        RETURN NEW;
    END IF;

    -- Check that parent exists and get its level
    SELECT hierarchy_level INTO level_count
    FROM public.themes
    WHERE id = NEW.parent_theme_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parent theme does not exist';
    END IF;

    -- Set hierarchy level based on parent
    NEW.hierarchy_level := level_count + 1;

    -- Prevent creating too deep hierarchies
    IF NEW.hierarchy_level > max_levels THEN
        RAISE EXCEPTION 'Maximum hierarchy depth (%) exceeded', max_levels;
    END IF;

    -- Check for circular references by walking up the tree
    ancestor_id := NEW.parent_theme_id;
    WHILE ancestor_id IS NOT NULL LOOP
        IF ancestor_id = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected in theme hierarchy';
        END IF;

        SELECT parent_theme_id INTO ancestor_id
        FROM public.themes
        WHERE id = ancestor_id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hierarchy validation
CREATE TRIGGER validate_theme_hierarchy_trigger
    BEFORE INSERT OR UPDATE OF parent_theme_id ON public.themes
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_theme_hierarchy();

-- Function to get theme hierarchy (ancestors)
CREATE OR REPLACE FUNCTION public.get_theme_ancestors(theme_id UUID)
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    category_code TEXT,
    hierarchy_level INTEGER,
    depth INTEGER
) AS $$
WITH RECURSIVE theme_ancestors AS (
    -- Base case: the theme itself
    SELECT
        t.id,
        d.name_en,
        d.name_ar,
        t.category_code,
        t.hierarchy_level,
        0 AS depth,
        t.parent_theme_id
    FROM public.themes t
    JOIN public.dossiers d ON t.id = d.id
    WHERE t.id = theme_id

    UNION ALL

    -- Recursive case: get parent
    SELECT
        t.id,
        d.name_en,
        d.name_ar,
        t.category_code,
        t.hierarchy_level,
        ta.depth + 1 AS depth,
        t.parent_theme_id
    FROM public.themes t
    JOIN public.dossiers d ON t.id = d.id
    JOIN theme_ancestors ta ON t.id = ta.parent_theme_id
)
SELECT id, name_en, name_ar, category_code, hierarchy_level, depth
FROM theme_ancestors
ORDER BY depth DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get theme descendants (children recursively)
CREATE OR REPLACE FUNCTION public.get_theme_descendants(theme_id UUID)
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    category_code TEXT,
    hierarchy_level INTEGER,
    parent_theme_id UUID,
    depth INTEGER
) AS $$
WITH RECURSIVE theme_descendants AS (
    -- Base case: direct children of the theme
    SELECT
        t.id,
        d.name_en,
        d.name_ar,
        t.category_code,
        t.hierarchy_level,
        t.parent_theme_id,
        1 AS depth
    FROM public.themes t
    JOIN public.dossiers d ON t.id = d.id
    WHERE t.parent_theme_id = theme_id

    UNION ALL

    -- Recursive case: get children's children
    SELECT
        t.id,
        d.name_en,
        d.name_ar,
        t.category_code,
        t.hierarchy_level,
        t.parent_theme_id,
        td.depth + 1 AS depth
    FROM public.themes t
    JOIN public.dossiers d ON t.id = d.id
    JOIN theme_descendants td ON t.parent_theme_id = td.id
)
SELECT id, name_en, name_ar, category_code, hierarchy_level, parent_theme_id, depth
FROM theme_descendants
ORDER BY depth, name_en;
$$ LANGUAGE SQL STABLE;

-- Function to get full theme tree starting from roots
CREATE OR REPLACE FUNCTION public.get_theme_tree()
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    category_code TEXT,
    hierarchy_level INTEGER,
    parent_theme_id UUID,
    icon TEXT,
    color TEXT,
    is_standard BOOLEAN,
    sort_order INTEGER,
    path TEXT[],
    path_names_en TEXT[],
    path_names_ar TEXT[]
) AS $$
WITH RECURSIVE theme_tree AS (
    -- Base case: root themes (no parent)
    SELECT
        t.id,
        d.name_en,
        d.name_ar,
        t.category_code,
        t.hierarchy_level,
        t.parent_theme_id,
        t.icon,
        t.color,
        t.is_standard,
        t.sort_order,
        ARRAY[t.id::TEXT] AS path,
        ARRAY[d.name_en] AS path_names_en,
        ARRAY[d.name_ar] AS path_names_ar
    FROM public.themes t
    JOIN public.dossiers d ON t.id = d.id
    WHERE t.parent_theme_id IS NULL
    AND d.status != 'archived'

    UNION ALL

    -- Recursive case: child themes
    SELECT
        t.id,
        d.name_en,
        d.name_ar,
        t.category_code,
        t.hierarchy_level,
        t.parent_theme_id,
        t.icon,
        t.color,
        t.is_standard,
        t.sort_order,
        tt.path || t.id::TEXT,
        tt.path_names_en || d.name_en,
        tt.path_names_ar || d.name_ar
    FROM public.themes t
    JOIN public.dossiers d ON t.id = d.id
    JOIN theme_tree tt ON t.parent_theme_id = tt.id
    WHERE d.status != 'archived'
)
SELECT * FROM theme_tree
ORDER BY path, sort_order, name_en;
$$ LANGUAGE SQL STABLE;

-- View to get theme details with dossier information
CREATE OR REPLACE VIEW public.theme_details AS
SELECT
    t.id,
    d.name_en,
    d.name_ar,
    d.summary_en,
    d.summary_ar,
    d.status,
    d.sensitivity_level,
    d.tags,
    d.created_at AS dossier_created_at,
    d.updated_at AS dossier_updated_at,
    d.version,
    t.parent_theme_id,
    t.category_code,
    t.hierarchy_level,
    t.icon,
    t.color,
    t.attributes,
    t.sort_order,
    t.is_standard,
    t.external_url,
    t.created_at AS theme_created_at,
    t.updated_at AS theme_updated_at,
    -- Parent theme info
    pd.name_en AS parent_name_en,
    pd.name_ar AS parent_name_ar,
    pt.category_code AS parent_category_code,
    -- Children count
    (SELECT COUNT(*) FROM public.themes ct WHERE ct.parent_theme_id = t.id) AS children_count
FROM public.themes t
INNER JOIN public.dossiers d ON t.id = d.id AND d.type = 'theme'
LEFT JOIN public.themes pt ON t.parent_theme_id = pt.id
LEFT JOIN public.dossiers pd ON pt.id = pd.id;

-- Grant permissions
GRANT ALL ON public.themes TO authenticated;
GRANT SELECT ON public.theme_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_theme_ancestors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_theme_descendants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_theme_tree() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.themes IS 'Extension table for theme dossiers - supports taxonomy/hierarchical structure for topical areas and issue domains';
COMMENT ON COLUMN public.themes.parent_theme_id IS 'Parent theme for hierarchical structure - NULL for root themes';
COMMENT ON COLUMN public.themes.category_code IS 'Unique code identifier for the theme (e.g., SDG-01, ENV-CLIMATE)';
COMMENT ON COLUMN public.themes.hierarchy_level IS 'Depth in the taxonomy tree (1 = root, 2+ = children)';
COMMENT ON COLUMN public.themes.is_standard IS 'Whether this is a standard taxonomy category (SDGs, etc.)';
COMMENT ON COLUMN public.themes.attributes IS 'Flexible JSONB for additional theme-specific metadata';
COMMENT ON FUNCTION public.get_theme_ancestors(UUID) IS 'Get all ancestors of a theme up to the root';
COMMENT ON FUNCTION public.get_theme_descendants(UUID) IS 'Get all descendants of a theme';
COMMENT ON FUNCTION public.get_theme_tree() IS 'Get the complete theme hierarchy as a tree';
