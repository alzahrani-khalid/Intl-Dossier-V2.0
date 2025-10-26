-- Add extracted_contacts JSONB field to cd_document_sources table
-- This stores the array of contacts extracted from the document

ALTER TABLE cd_document_sources
ADD COLUMN IF NOT EXISTS extracted_contacts JSONB DEFAULT '[]'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN cd_document_sources.extracted_contacts IS 'Array of contacts extracted from document with structure: {full_name, organization, position, email_addresses[], phone_numbers[], confidence, source_page}';

-- Create an index on extracted_contacts for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_cd_document_sources_extracted_contacts ON cd_document_sources USING gin (extracted_contacts);

-- Create index on processing_status for polling queries
CREATE INDEX IF NOT EXISTS idx_cd_document_sources_processing_status ON cd_document_sources (processing_status) WHERE processing_status IN ('processing', 'pending');