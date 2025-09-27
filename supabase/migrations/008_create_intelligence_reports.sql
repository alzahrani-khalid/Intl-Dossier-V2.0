-- Migration: Create intelligence_reports table
-- Description: Analytical output with data sources and confidence levels
-- Date: 2025-01-27

-- Create confidence level enum
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Create classification enum
CREATE TYPE classification_level AS ENUM ('public', 'internal', 'confidential', 'secret');

-- Create analysis type enum
CREATE TYPE analysis_type AS ENUM ('trend', 'pattern', 'prediction', 'assessment');

-- Create intelligence report status enum
CREATE TYPE intelligence_status AS ENUM ('draft', 'review', 'approved', 'published');

-- Create intelligence_reports table
CREATE TABLE IF NOT EXISTS intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data_sources JSONB NOT NULL,
    confidence_level confidence_level NOT NULL,
    classification classification_level NOT NULL DEFAULT 'internal',
    analysis_type analysis_type NOT NULL,
    vector_embedding VECTOR(1536),
    status intelligence_status NOT NULL DEFAULT 'draft',
    country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Add foreign key for briefs table
ALTER TABLE briefs 
ADD CONSTRAINT fk_briefs_intelligence_report 
FOREIGN KEY (intelligence_report_id) 
REFERENCES intelligence_reports(id) 
ON DELETE RESTRICT;

-- Create indexes for performance
CREATE INDEX idx_intelligence_reports_title ON intelligence_reports(title) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_status ON intelligence_reports(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_confidence ON intelligence_reports(confidence_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_classification ON intelligence_reports(classification) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_analysis_type ON intelligence_reports(analysis_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_country_id ON intelligence_reports(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_organization_id ON intelligence_reports(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_created_by ON intelligence_reports(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_intelligence_reports_classification_status ON intelligence_reports(classification, status) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE intelligence_reports 
ADD CONSTRAINT check_data_sources_array 
CHECK (jsonb_typeof(data_sources) = 'array' AND jsonb_array_length(data_sources) > 0);

ALTER TABLE intelligence_reports 
ADD CONSTRAINT check_confidence_classification_match 
CHECK (
    (classification = 'public' AND confidence_level IN ('low', 'medium')) OR
    (classification = 'internal' AND confidence_level IN ('low', 'medium', 'high')) OR
    (classification IN ('confidential', 'secret'))
);

-- Create trigger for updated_at
CREATE TRIGGER update_intelligence_reports_updated_at BEFORE UPDATE
    ON intelligence_reports FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE intelligence_reports IS 'Analytical outputs with data sources and confidence levels';
COMMENT ON COLUMN intelligence_reports.id IS 'Unique report identifier';
COMMENT ON COLUMN intelligence_reports.title IS 'Report title';
COMMENT ON COLUMN intelligence_reports.content IS 'Report content';
COMMENT ON COLUMN intelligence_reports.data_sources IS 'Source information in JSON array';
COMMENT ON COLUMN intelligence_reports.confidence_level IS 'Confidence level of the analysis';
COMMENT ON COLUMN intelligence_reports.classification IS 'Security classification level';
COMMENT ON COLUMN intelligence_reports.analysis_type IS 'Type of analysis performed';
COMMENT ON COLUMN intelligence_reports.vector_embedding IS 'pgvector embedding for similarity search';
COMMENT ON COLUMN intelligence_reports.status IS 'Report workflow status';
COMMENT ON COLUMN intelligence_reports.country_id IS 'Related country';
COMMENT ON COLUMN intelligence_reports.organization_id IS 'Related organization';
COMMENT ON COLUMN intelligence_reports.created_by IS 'User who created the report';
COMMENT ON COLUMN intelligence_reports.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN intelligence_reports.deleted_by IS 'User who performed soft delete';