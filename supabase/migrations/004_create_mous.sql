-- Migration: Create mous table
-- Description: Memorandum of Understanding with versioning and workflow states
-- Date: 2025-01-27

-- Create MoU status enum
CREATE TYPE mou_status AS ENUM (
    'draft', 
    'internal_review', 
    'external_review', 
    'negotiation', 
    'signed', 
    'active', 
    'renewed', 
    'expired'
);

-- Create mous table
CREATE TABLE IF NOT EXISTS mous (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status mou_status NOT NULL DEFAULT 'draft',
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    document_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    effective_date DATE,
    expiry_date DATE,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_mous_title ON mous(title) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_status ON mous(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_organization_id ON mous(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_country_id ON mous(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_created_by ON mous(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_effective_date ON mous(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_expiry_date ON mous(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_mous_status_created ON mous(status, created_at DESC) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE mous 
ADD CONSTRAINT check_file_size_limit 
CHECK (file_size IS NULL OR file_size <= 52428800); -- 50MB in bytes

ALTER TABLE mous 
ADD CONSTRAINT check_dates_valid 
CHECK (effective_date IS NULL OR expiry_date IS NULL OR effective_date < expiry_date);

ALTER TABLE mous 
ADD CONSTRAINT check_version_positive 
CHECK (version > 0);

ALTER TABLE mous 
ADD CONSTRAINT check_mime_type_allowed 
CHECK (mime_type IS NULL OR mime_type IN (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
));

-- Create trigger for updated_at
CREATE TRIGGER update_mous_updated_at BEFORE UPDATE
    ON mous FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE mous IS 'Memorandum of Understanding documents with versioning and workflow states';
COMMENT ON COLUMN mous.id IS 'Unique MoU identifier';
COMMENT ON COLUMN mous.title IS 'MoU title';
COMMENT ON COLUMN mous.version IS 'Document version number';
COMMENT ON COLUMN mous.status IS 'Workflow state';
COMMENT ON COLUMN mous.organization_id IS 'Associated organization';
COMMENT ON COLUMN mous.country_id IS 'Associated country';
COMMENT ON COLUMN mous.document_path IS 'File storage path';
COMMENT ON COLUMN mous.file_size IS 'File size in bytes (max 50MB)';
COMMENT ON COLUMN mous.mime_type IS 'Document MIME type';
COMMENT ON COLUMN mous.effective_date IS 'Agreement effective date';
COMMENT ON COLUMN mous.expiry_date IS 'Agreement expiry date';
COMMENT ON COLUMN mous.description IS 'MoU description';
COMMENT ON COLUMN mous.created_by IS 'User who created the MoU';
COMMENT ON COLUMN mous.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN mous.deleted_by IS 'User who performed soft delete';