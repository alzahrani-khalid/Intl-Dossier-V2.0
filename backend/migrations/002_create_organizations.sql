-- Migration: Create Organizations Table
-- Description: International bodies with membership and obligations tracking

-- Create enum types for organizations
CREATE TYPE organization_type AS ENUM ('un_agency', 'regional', 'development_bank', 'research', 'other');
CREATE TYPE membership_status AS ENUM ('member', 'observer', 'partner', 'none');
CREATE TYPE participation_level AS ENUM ('active', 'occasional', 'observer');
CREATE TYPE reporting_frequency AS ENUM ('annual', 'quarterly', 'monthly', 'ad_hoc');

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,           -- Unique identifier (e.g., 'UN', 'WB')
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    type organization_type NOT NULL,
    parent_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    headquarters_country VARCHAR(100) NOT NULL,
    website VARCHAR(500),

    -- Membership information as JSONB
    membership JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Committees as JSONB array
    committees JSONB DEFAULT '[]'::jsonb,

    -- Reporting requirements as JSONB array
    reporting_requirements JSONB DEFAULT '[]'::jsonb,

    -- Standard metadata fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_membership CHECK (
        membership ? 'status'
    ),
    CONSTRAINT valid_deletion CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_parent ON organizations(parent_org_id);
CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX idx_organizations_code ON organizations(code);

-- Full text search indexes
CREATE INDEX idx_organizations_name_en ON organizations USING gin(to_tsvector('english', name_en));
CREATE INDEX idx_organizations_name_ar ON organizations USING gin(to_tsvector('arabic', name_ar));

-- JSONB indexes
CREATE INDEX idx_organizations_membership ON organizations USING gin(membership);
CREATE INDEX idx_organizations_committees ON organizations USING gin(committees);
CREATE INDEX idx_organizations_reporting ON organizations USING gin(reporting_requirements);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_select ON organizations
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_insert ON organizations
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_update ON organizations
    FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_delete ON organizations
    FOR DELETE
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Create trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE organizations IS 'International bodies with membership and obligations';
COMMENT ON COLUMN organizations.code IS 'Unique organization identifier (e.g., UN, WB)';
COMMENT ON COLUMN organizations.parent_org_id IS 'Reference to parent organization for hierarchical structure';
COMMENT ON COLUMN organizations.membership IS 'JSONB object containing membership details';
COMMENT ON COLUMN organizations.committees IS 'JSONB array of committee participations';
COMMENT ON COLUMN organizations.reporting_requirements IS 'JSONB array of reporting obligations';