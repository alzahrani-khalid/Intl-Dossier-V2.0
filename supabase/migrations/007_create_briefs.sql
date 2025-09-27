-- Migration: Create briefs table
-- Description: Summary document with structured content and attachments
-- Date: 2025-01-27

-- Create brief status enum
CREATE TYPE brief_status AS ENUM ('draft', 'review', 'approved', 'published');

-- Create briefs table
CREATE TABLE IF NOT EXISTS briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    attachments JSONB,
    intelligence_report_id UUID,
    country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    status brief_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_briefs_title ON briefs(title) WHERE deleted_at IS NULL;
CREATE INDEX idx_briefs_status ON briefs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_briefs_country_id ON briefs(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_briefs_organization_id ON briefs(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_briefs_created_by ON briefs(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_briefs_intelligence_report_id ON briefs(intelligence_report_id) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE briefs 
ADD CONSTRAINT check_content_not_empty 
CHECK (length(trim(content)) > 0);

ALTER TABLE briefs 
ADD CONSTRAINT check_attachments_format 
CHECK (attachments IS NULL OR jsonb_typeof(attachments) = 'array');

-- Create trigger for updated_at
CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE
    ON briefs FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE briefs IS 'Summary documents with structured content and attachments';
COMMENT ON COLUMN briefs.id IS 'Unique brief identifier';
COMMENT ON COLUMN briefs.title IS 'Brief title';
COMMENT ON COLUMN briefs.content IS 'Brief content (required)';
COMMENT ON COLUMN briefs.summary IS 'Executive summary';
COMMENT ON COLUMN briefs.attachments IS 'Attachment metadata in JSON array';
COMMENT ON COLUMN briefs.intelligence_report_id IS 'Related intelligence report';
COMMENT ON COLUMN briefs.country_id IS 'Related country';
COMMENT ON COLUMN briefs.organization_id IS 'Related organization';
COMMENT ON COLUMN briefs.status IS 'Brief workflow status';
COMMENT ON COLUMN briefs.created_by IS 'User who created the brief';
COMMENT ON COLUMN briefs.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN briefs.deleted_by IS 'User who performed soft delete';