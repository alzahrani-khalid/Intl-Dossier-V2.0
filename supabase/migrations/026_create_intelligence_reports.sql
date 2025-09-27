-- Migration: Create Intelligence Reports table
-- Purpose: Core document with analysis metadata and embeddings
-- Feature: 004-refine-specification-to Phase 3.4

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create intelligence_reports table
CREATE TABLE intelligence_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Bilingual content
    title TEXT NOT NULL,
    title_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    
    -- Metadata (FR-041)
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    data_sources TEXT[] NOT NULL DEFAULT '{}',
    analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analyst_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'pending', 'approved', 'archived')),
    
    -- Threat indicators (FR-042) - stored as JSONB
    threat_indicators JSONB DEFAULT '[]',
    
    -- Location data (FR-043) - stored as JSONB
    geospatial_tags JSONB DEFAULT '[]',
    
    -- Embedding status
    embedding_status TEXT NOT NULL DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
    embedding_error TEXT,
    
    -- Retention (FR-046)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 years'),
    
    -- Relationships
    vector_embedding_id UUID,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
    
    -- Audit fields
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_intelligence_reports_status_date ON intelligence_reports(review_status, created_at DESC);
CREATE INDEX idx_intelligence_reports_archived ON intelligence_reports(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_intelligence_reports_organization ON intelligence_reports(organization_id);
CREATE INDEX idx_intelligence_reports_analyst ON intelligence_reports(analyst_id);
CREATE INDEX idx_intelligence_reports_embedding_status ON intelligence_reports(embedding_status);

-- Full-text search indexes for bilingual content
CREATE INDEX idx_intelligence_reports_fulltext_en ON intelligence_reports 
USING gin(to_tsvector('english', title || ' ' || content));

CREATE INDEX idx_intelligence_reports_fulltext_ar ON intelligence_reports 
USING gin(to_tsvector('arabic', coalesce(title_ar, '') || ' ' || coalesce(content_ar, '')));

-- Trigram indexes for partial matching
CREATE INDEX idx_intelligence_reports_title_trgm ON intelligence_reports USING gin(title gin_trgm_ops);
CREATE INDEX idx_intelligence_reports_title_ar_trgm ON intelligence_reports USING gin(title_ar gin_trgm_ops);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intelligence_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_intelligence_reports_updated_at
    BEFORE UPDATE ON intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_intelligence_reports_updated_at();

-- Create function to set retention_until
CREATE OR REPLACE FUNCTION set_intelligence_reports_retention()
RETURNS TRIGGER AS $$
BEGIN
    NEW.retention_until = NEW.created_at + INTERVAL '7 years';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for retention_until
CREATE TRIGGER trigger_set_intelligence_reports_retention
    BEFORE INSERT ON intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION set_intelligence_reports_retention();

-- Add comments
COMMENT ON TABLE intelligence_reports IS 'Core intelligence reports with analysis metadata and embeddings';
COMMENT ON COLUMN intelligence_reports.confidence_score IS 'Confidence rating from 0-100';
COMMENT ON COLUMN intelligence_reports.data_sources IS 'Array of source identifiers';
COMMENT ON COLUMN intelligence_reports.threat_indicators IS 'JSONB array of threat assessment data';
COMMENT ON COLUMN intelligence_reports.geospatial_tags IS 'JSONB array of geographic location data';
COMMENT ON COLUMN intelligence_reports.embedding_status IS 'Status of vector embedding generation';
COMMENT ON COLUMN intelligence_reports.retention_until IS '7-year retention period from creation';
