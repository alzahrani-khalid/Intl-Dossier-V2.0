-- Migration: Create data_library_items table
-- Description: File or document with metadata and access controls
-- Date: 2025-01-27

-- Create access level enum
CREATE TYPE access_level AS ENUM ('public', 'internal', 'confidential', 'secret');

-- Create data_library_items table
CREATE TABLE IF NOT EXISTS data_library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    version INTEGER DEFAULT 1,
    access_level access_level NOT NULL DEFAULT 'internal',
    tags JSONB,
    country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    uploaded_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_data_library_items_name ON data_library_items(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_library_items_access_level ON data_library_items(access_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_library_items_country_id ON data_library_items(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_library_items_organization_id ON data_library_items(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_library_items_uploaded_by ON data_library_items(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_library_items_file_hash ON data_library_items(file_hash) WHERE deleted_at IS NULL;
-- GIN index for tag-based search
CREATE INDEX idx_data_library_items_tags ON data_library_items USING GIN (tags) WHERE deleted_at IS NULL;

-- Add check constraints
ALTER TABLE data_library_items 
ADD CONSTRAINT check_file_size_limit 
CHECK (file_size > 0 AND file_size <= 52428800); -- 50MB in bytes

ALTER TABLE data_library_items 
ADD CONSTRAINT check_file_hash_valid 
CHECK (file_hash ~ '^[a-f0-9]{64}$'); -- SHA-256 hash format

ALTER TABLE data_library_items 
ADD CONSTRAINT check_version_positive 
CHECK (version > 0);

ALTER TABLE data_library_items 
ADD CONSTRAINT check_tags_format 
CHECK (tags IS NULL OR jsonb_typeof(tags) = 'array');

ALTER TABLE data_library_items 
ADD CONSTRAINT check_mime_type_allowed 
CHECK (mime_type IN (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'application/zip'
));

-- Create trigger for updated_at
CREATE TRIGGER update_data_library_items_updated_at BEFORE UPDATE
    ON data_library_items FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE data_library_items IS 'Files and documents with metadata and access controls';
COMMENT ON COLUMN data_library_items.id IS 'Unique item identifier';
COMMENT ON COLUMN data_library_items.name IS 'Item name';
COMMENT ON COLUMN data_library_items.description IS 'Item description';
COMMENT ON COLUMN data_library_items.file_path IS 'File storage path';
COMMENT ON COLUMN data_library_items.file_size IS 'File size in bytes (max 50MB)';
COMMENT ON COLUMN data_library_items.mime_type IS 'File MIME type';
COMMENT ON COLUMN data_library_items.file_hash IS 'SHA-256 file hash for integrity';
COMMENT ON COLUMN data_library_items.version IS 'File version number';
COMMENT ON COLUMN data_library_items.access_level IS 'Access control level';
COMMENT ON COLUMN data_library_items.tags IS 'Searchable tags in JSON array';
COMMENT ON COLUMN data_library_items.country_id IS 'Related country';
COMMENT ON COLUMN data_library_items.organization_id IS 'Related organization';
COMMENT ON COLUMN data_library_items.uploaded_by IS 'User who uploaded the file';
COMMENT ON COLUMN data_library_items.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN data_library_items.deleted_by IS 'User who performed soft delete';