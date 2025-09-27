-- Migration: Create organizations table
-- Description: Entity with hierarchical structure and country associations
-- Date: 2025-01-27

-- Create organization type enum
CREATE TYPE organization_type AS ENUM ('government', 'ngo', 'international', 'private');

-- Create organization status enum
CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'suspended');

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    parent_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    status organization_status NOT NULL DEFAULT 'active',
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_name ON organizations(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_type ON organizations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_country_id ON organizations(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_parent_id ON organizations(parent_organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE organizations 
ADD CONSTRAINT check_parent_not_self 
CHECK (parent_organization_id != id);

ALTER TABLE organizations 
ADD CONSTRAINT check_website_format 
CHECK (website IS NULL OR website ~ '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}');

-- Add unique constraint for name within same parent
ALTER TABLE organizations 
ADD CONSTRAINT unique_name_per_parent 
UNIQUE (name, parent_organization_id) 
WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE
    ON organizations FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE organizations IS 'Organizations with hierarchical structure and country associations';
COMMENT ON COLUMN organizations.id IS 'Unique organization identifier';
COMMENT ON COLUMN organizations.name IS 'Organization name';
COMMENT ON COLUMN organizations.type IS 'Organization type (government, ngo, international, private)';
COMMENT ON COLUMN organizations.country_id IS 'Associated country';
COMMENT ON COLUMN organizations.parent_organization_id IS 'Parent organization for hierarchy';
COMMENT ON COLUMN organizations.status IS 'Organization status';
COMMENT ON COLUMN organizations.description IS 'Organization description';
COMMENT ON COLUMN organizations.website IS 'Organization website URL';
COMMENT ON COLUMN organizations.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN organizations.deleted_by IS 'User who performed soft delete';