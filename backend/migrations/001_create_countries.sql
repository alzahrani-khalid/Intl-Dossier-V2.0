-- Migration: Create Countries Table
-- Description: Foundation table for country entities with statistical system tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE relationship_status AS ENUM ('active', 'developing', 'dormant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statistical_system_type AS ENUM ('centralized', 'decentralized', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) NOT NULL UNIQUE,              -- ISO 3166-1 alpha-2
    code3 VARCHAR(3) NOT NULL UNIQUE,             -- ISO 3166-1 alpha-3
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,

    -- Statistical system as JSONB for flexibility
    statistical_system JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Arrays for multi-value fields
    cooperation_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    expertise_domains TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Relationship tracking
    relationship_status relationship_status DEFAULT 'developing',

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
    CONSTRAINT valid_statistical_system CHECK (
        statistical_system ? 'type' AND
        statistical_system ? 'nso_name' AND
        statistical_system ? 'website' AND
        statistical_system ? 'established_year'
    ),
    CONSTRAINT valid_codes CHECK (
        length(code) = 2 AND
        length(code3) = 3 AND
        code ~ '^[A-Z]{2}$' AND
        code3 ~ '^[A-Z]{3}$'
    ),
    CONSTRAINT valid_deletion CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX idx_countries_region ON countries(region);
CREATE INDEX idx_countries_status ON countries(relationship_status);
CREATE INDEX idx_countries_tenant ON countries(tenant_id);
CREATE INDEX idx_countries_cooperation_areas ON countries USING GIN (cooperation_areas);
CREATE INDEX idx_countries_expertise_domains ON countries USING GIN (expertise_domains);

-- Full text search indexes for bilingual support
CREATE INDEX idx_countries_name_en ON countries USING gin(to_tsvector('english', name_en));
CREATE INDEX idx_countries_name_ar ON countries USING gin(to_tsvector('arabic', name_ar));

-- JSONB index for statistical system queries
CREATE INDEX idx_countries_statistical_system ON countries USING gin(statistical_system);

-- Enable Row Level Security
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_select ON countries
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_insert ON countries
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_update ON countries
    FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_delete ON countries
    FOR DELETE
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            tenant_id, entity_type, entity_id, action,
            user_id, new_values
        ) VALUES (
            NEW.tenant_id, 'country', NEW.id, 'INSERT',
            NEW.created_by, to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            tenant_id, entity_type, entity_id, action,
            user_id, old_values, new_values
        ) VALUES (
            NEW.tenant_id, 'country', NEW.id, 'UPDATE',
            NEW.last_modified_by, to_jsonb(OLD), to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            tenant_id, entity_type, entity_id, action,
            user_id, old_values
        ) VALUES (
            OLD.tenant_id, 'country', OLD.id, 'DELETE',
            OLD.last_modified_by, to_jsonb(OLD)
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: Audit log table will be created in a separate migration
-- CREATE TRIGGER audit_countries
--     AFTER INSERT OR UPDATE OR DELETE ON countries
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add comments for documentation
COMMENT ON TABLE countries IS 'Nation-states with statistical systems and bilateral relationships';
COMMENT ON COLUMN countries.code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN countries.code3 IS 'ISO 3166-1 alpha-3 country code';
COMMENT ON COLUMN countries.statistical_system IS 'JSON object containing statistical system details';
COMMENT ON COLUMN countries.cooperation_areas IS 'Array of cooperation domains';
COMMENT ON COLUMN countries.expertise_domains IS 'Array of expertise areas';
COMMENT ON COLUMN countries.relationship_status IS 'Current status of bilateral relationship';