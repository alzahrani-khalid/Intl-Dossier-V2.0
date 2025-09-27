-- 003_organizations.sql: Organizations table with hierarchy support
-- Represents entities that interact with the system, with parent-child relationships

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9]{3,20}$'),
    name_en TEXT NOT NULL CHECK (LENGTH(name_en) > 0),
    name_ar TEXT NOT NULL CHECK (LENGTH(name_ar) > 0),
    type TEXT NOT NULL CHECK (type IN ('government', 'ngo', 'private', 'international', 'academic')),
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE RESTRICT,
    parent_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    website TEXT CHECK (website IS NULL OR website ~ '^https?://'),
    email TEXT CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT,
    address_en TEXT,
    address_ar TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
    established_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Prevent self-referencing
    CONSTRAINT no_self_reference CHECK (id != parent_organization_id)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_country ON public.organizations(country_id);
CREATE INDEX idx_organizations_type ON public.organizations(type);
CREATE INDEX idx_organizations_parent ON public.organizations(parent_organization_id);
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_code ON public.organizations(code);

-- Full-text search indexes
CREATE INDEX idx_organizations_search_en ON public.organizations USING gin(to_tsvector('english', name_en || ' ' || code));
CREATE INDEX idx_organizations_search_ar ON public.organizations USING gin(to_tsvector('arabic', name_ar));

-- Create updated_at trigger
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get organization hierarchy (recursive)
CREATE OR REPLACE FUNCTION public.get_organization_hierarchy(org_id UUID)
RETURNS TABLE(
    id UUID,
    code TEXT,
    name_en TEXT,
    name_ar TEXT,
    level INTEGER,
    path UUID[]
) AS $$
WITH RECURSIVE org_tree AS (
    -- Base case: the organization itself
    SELECT
        o.id,
        o.code,
        o.name_en,
        o.name_ar,
        0 as level,
        ARRAY[o.id] as path
    FROM public.organizations o
    WHERE o.id = org_id

    UNION ALL

    -- Recursive case: child organizations
    SELECT
        o.id,
        o.code,
        o.name_en,
        o.name_ar,
        ot.level + 1,
        ot.path || o.id
    FROM public.organizations o
    INNER JOIN org_tree ot ON o.parent_organization_id = ot.id
    WHERE NOT o.id = ANY(ot.path) -- Prevent cycles
)
SELECT * FROM org_tree ORDER BY level, name_en;
$$ LANGUAGE SQL STABLE;

-- Function to validate organization hierarchy (prevent cycles)
CREATE OR REPLACE FUNCTION public.validate_organization_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_path UUID[];
BEGIN
    IF NEW.parent_organization_id IS NOT NULL THEN
        -- Check if the new parent is a descendant of the current organization
        WITH RECURSIVE descendants AS (
            SELECT id FROM public.organizations WHERE parent_organization_id = NEW.id
            UNION ALL
            SELECT o.id FROM public.organizations o
            INNER JOIN descendants d ON o.parent_organization_id = d.id
        )
        SELECT ARRAY_AGG(id) INTO parent_path FROM descendants;

        IF NEW.parent_organization_id = ANY(parent_path) THEN
            RAISE EXCEPTION 'Circular reference detected in organization hierarchy';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_org_hierarchy
    BEFORE INSERT OR UPDATE OF parent_organization_id ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_organization_hierarchy();

-- Grant permissions
GRANT ALL ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Entities that interact with the system, with hierarchical support';
COMMENT ON COLUMN public.organizations.code IS 'Unique organization code (3-20 uppercase alphanumeric characters)';
COMMENT ON COLUMN public.organizations.type IS 'Organization type classification';
COMMENT ON COLUMN public.organizations.parent_organization_id IS 'Reference to parent organization for hierarchical structure';