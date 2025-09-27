-- Migration: Initial Schema
-- Created: 2025-09-26

-- Up migration
BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');
CREATE TYPE classification_level AS ENUM ('public', 'internal', 'confidential', 'secret');
CREATE TYPE mou_status AS ENUM ('draft', 'negotiation', 'approved', 'active', 'expired', 'terminated');

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, new_data, user_id, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_setting('app.current_user', true)::uuid, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user', true)::uuid, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, user_id, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_setting('app.current_user', true)::uuid, NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    role user_role DEFAULT 'viewer',
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name varchar(50) NOT NULL,
    operation varchar(10) NOT NULL,
    old_data jsonb,
    new_data jsonb,
    user_id uuid REFERENCES users(id),
    timestamp timestamp with time zone DEFAULT NOW()
);

-- Countries table
CREATE TABLE countries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3
    name_en varchar(100) NOT NULL,
    name_ar varchar(100) NOT NULL,
    region varchar(50),
    sub_region varchar(50),
    capital_en varchar(100),
    capital_ar varchar(100),
    population bigint,
    gdp_usd bigint,
    currency_code varchar(3),
    timezone varchar(50),
    coordinates point,
    flag_url varchar(255),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en varchar(200) NOT NULL,
    name_ar varchar(200) NOT NULL,
    type varchar(50), -- 'government', 'ngo', 'private', 'international'
    description_en text,
    description_ar text,
    website varchar(255),
    headquarters_country uuid REFERENCES countries(id),
    parent_organization_id uuid REFERENCES organizations(id),
    establishment_date date,
    contact_info jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- MoUs table
CREATE TABLE mous (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en varchar(300) NOT NULL,
    title_ar varchar(300) NOT NULL,
    description_en text,
    description_ar text,
    status mou_status DEFAULT 'draft',
    signed_date date,
    effective_date date,
    expiry_date date,
    auto_renew boolean DEFAULT false,
    renewal_period interval,
    classification classification_level DEFAULT 'internal',
    deliverables jsonb DEFAULT '[]',
    performance_metrics jsonb DEFAULT '{}',
    alert_settings jsonb DEFAULT '{}',
    created_by uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_countries_code ON countries(code);
CREATE INDEX idx_countries_name_en ON countries USING gin(name_en gin_trgm_ops);
CREATE INDEX idx_countries_name_ar ON countries USING gin(name_ar gin_trgm_ops);
CREATE INDEX idx_organizations_name_en ON organizations USING gin(name_en gin_trgm_ops);
CREATE INDEX idx_organizations_name_ar ON organizations USING gin(name_ar gin_trgm_ops);
CREATE INDEX idx_mous_status ON mous(status);
CREATE INDEX idx_mous_effective_date ON mous(effective_date);
CREATE INDEX idx_mous_expiry_date ON mous(expiry_date);
CREATE INDEX idx_audit_log_table_timestamp ON audit_log(table_name, timestamp);

-- Add audit triggers
CREATE TRIGGER countries_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON countries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER organizations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER mous_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON mous
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Insert sample data for development
INSERT INTO countries (code, name_en, name_ar, region, capital_en, capital_ar) VALUES
('SAU', 'Saudi Arabia', 'المملكة العربية السعودية', 'Western Asia', 'Riyadh', 'الرياض'),
('ARE', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'Western Asia', 'Abu Dhabi', 'أبو ظبي'),
('USA', 'United States', 'الولايات المتحدة', 'North America', 'Washington D.C.', 'واشنطن العاصمة'),
('CHN', 'China', 'الصين', 'East Asia', 'Beijing', 'بكين'),
('GBR', 'United Kingdom', 'المملكة المتحدة', 'Northern Europe', 'London', 'لندن');

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@gastat.gov.sa', crypt('admin123', gen_salt('bf')), 'System', 'Administrator', 'admin');

COMMIT;