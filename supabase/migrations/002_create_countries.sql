-- Migration: Create countries table
-- Description: Nation entity with multilingual support and ISO codes
-- Date: 2025-01-27

-- Create country status enum
CREATE TYPE country_status AS ENUM ('active', 'inactive', 'suspended');

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    iso_alpha2 CHAR(2) UNIQUE NOT NULL,
    iso_alpha3 CHAR(3) UNIQUE NOT NULL,
    region VARCHAR(100) NOT NULL,
    status country_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_countries_iso_alpha2 ON countries(iso_alpha2) WHERE deleted_at IS NULL;
CREATE INDEX idx_countries_iso_alpha3 ON countries(iso_alpha3) WHERE deleted_at IS NULL;
CREATE INDEX idx_countries_status ON countries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_countries_region ON countries(region) WHERE deleted_at IS NULL;
CREATE INDEX idx_countries_name_en ON countries(name_en) WHERE deleted_at IS NULL;
CREATE INDEX idx_countries_name_ar ON countries(name_ar) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE countries 
ADD CONSTRAINT check_iso_alpha2_format 
CHECK (iso_alpha2 ~ '^[A-Z]{2}$');

ALTER TABLE countries 
ADD CONSTRAINT check_iso_alpha3_format 
CHECK (iso_alpha3 ~ '^[A-Z]{3}$');

ALTER TABLE countries 
ADD CONSTRAINT check_region_valid 
CHECK (region IN ('asia', 'africa', 'europe', 'americas', 'oceania'));

-- Create trigger for updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE
    ON countries FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE countries IS 'Nation entities with multilingual support and ISO codes';
COMMENT ON COLUMN countries.id IS 'Unique country identifier';
COMMENT ON COLUMN countries.name_en IS 'Country name in English';
COMMENT ON COLUMN countries.name_ar IS 'Country name in Arabic';
COMMENT ON COLUMN countries.iso_alpha2 IS 'ISO 3166-1 alpha-2 code';
COMMENT ON COLUMN countries.iso_alpha3 IS 'ISO 3166-1 alpha-3 code';
COMMENT ON COLUMN countries.region IS 'Geographic region';
COMMENT ON COLUMN countries.status IS 'Country status (active, inactive, suspended)';
COMMENT ON COLUMN countries.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN countries.deleted_by IS 'User who performed soft delete';