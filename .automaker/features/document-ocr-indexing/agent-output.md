I'll review the previous context and continue implementing the document OCR indexing feature. Let me first explore what has been done and what remains.

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "in_progress",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "pending",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "pending",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "pending",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Verify feature with Playwright test",
"status": "pending",
"activeForm": "Verifying feature with Playwright test"
}
]
}

🔧 Tool: Glob
Input: {
"pattern": "\**/*ocr\*"
}

🔧 Tool: Glob
Input: {
"pattern": "\**/document*search\*"
}

🔧 Tool: Glob
Input: {
"pattern": "supabase/functions/document-ocr*/\*\*/*"
}

🔧 Tool: Glob
Input: {
"pattern": "supabase/functions/document-content*/\*\*/*"
}

🔧 Tool: Glob
Input: {
"pattern": "frontend/src/hooks/useDocument\*"
}
There's existing implementation. Let me review the key files to understand what's been done:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/migrations/20260110600001_document_ocr_indexing.sql"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/document-ocr-process/index.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/document-content-search/index.ts"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "in_progress",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Verify feature with Playwright test",
"status": "pending",
"activeForm": "Verifying feature with Playwright test"
}
]
}
Now let me review the frontend hooks and i18n files:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/hooks/useDocumentOCR.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/hooks/useDocumentContentSearch.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/i18n/en/document-ocr.json"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/i18n/ar/document-ocr.json"
}
Let me also check if there's a UI component for document search and if the migration has been applied:

🔧 Tool: Glob
Input: {
"pattern": "frontend/src/components/\**/*document*search*"
}

🔧 Tool: Glob
Input: {
"pattern": "frontend/src/pages/\**/*document\*"
}

🔧 Tool: mcp**supabase**list_migrations
Input: {
"project_id": "zkrcjzdemdmwhearthfgg"
}

🔧 Tool: mcp**supabase**list_migrations
Input: {
"project_id": "zkrcjzdemdmwhearhfgg"
}
The migration for document OCR (`20260110600001_document_ocr_indexing.sql`) hasn't been applied yet. Let me check if there's a debounce hook needed and then apply the migration:

🔧 Tool: Grep
Input: {
"pattern": "useDebouncedValue",
"glob": "frontend/src/hooks/\*.ts",
"output_mode": "files_with_matches"
}
Good, the `useDebouncedValue` hook exists. Now let me update the todos and apply the migration:

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "completed",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Apply OCR migration to database",
"status": "in_progress",
"activeForm": "Applying OCR migration to database"
},
{
"content": "Register i18n namespaces for document-ocr",
"status": "pending",
"activeForm": "Registering i18n namespaces for document-ocr"
},
{
"content": "Deploy Edge Functions",
"status": "pending",
"activeForm": "Deploying Edge Functions"
},
{
"content": "Verify feature with Playwright test",
"status": "pending",
"activeForm": "Verifying feature with Playwright test"
}
]
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/migrations/20260110600001_document_ocr_indexing.sql"
}
Now let me apply the migration. First, let me verify if the tables already exist:

🔧 Tool: mcp**supabase**list_tables
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"schemas": [
"public"
]
}

🔧 Tool: Grep
Input: {
"pattern": "document_text_content",
"path": "/Users/khalidalzahrani/.claude/projects/-Users-khalidalzahrani-Library-CloudStorage-OneDrive-Personal-coding-Intl-DossierV2-0/5336ccdb-f299-40aa-b265-cbae4f26d489/tool-results/mcp-supabase-list_tables-1768131558856.txt",
"output_mode": "content"
}
The `document_text_content` table doesn't exist yet, so I need to apply the migration. Let me apply it:

🔧 Tool: mcp**supabase**apply_migration
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "document_ocr_indexing",
"query": "-- Migration: Document OCR Indexing\n-- Feature: document-ocr-indexing\n-- Description: Adds OCR text extraction storage and full-text search for scanned PDFs and images\n-- Supports Arabic and English text recognition\n\n-- Enable required extensions\nCREATE EXTENSION IF NOT EXISTS pg_trgm;\n\n-- Create enum for OCR processing status\nDO $$ BEGIN\n CREATE TYPE ocr_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');\nEXCEPTION\n WHEN duplicate_object THEN NULL;\nEND $$;\n\n-- Create enum for OCR method used\nDO $$ BEGIN\n  CREATE TYPE ocr_method AS ENUM ('tesseract', 'google_vision', 'pdf_extract', 'native_text');\nEXCEPTION\n  WHEN duplicate_object THEN NULL;\nEND $$;\n\n-- Create document_text_content table for storing extracted text\nCREATE TABLE IF NOT EXISTS document_text_content (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n\n  -- Reference to the document (polymorphic - can be attachment or documents table)\n  document_id UUID NOT NULL,\n  document_table TEXT NOT NULL CHECK (document_table IN ('attachments', 'documents')),\n\n  -- Extracted content\n  extracted_text_en TEXT, -- Extracted English text\n  extracted_text_ar TEXT, -- Extracted Arabic text\n  raw_text TEXT, -- Original unprocessed text\n\n  -- Processing metadata\n  ocr_status ocr_processing_status NOT NULL DEFAULT 'pending',\n  ocr_method ocr_method,\n  ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100),\n  language_detected TEXT[], -- Array of detected languages (e.g., ['en', 'ar'])\n\n  -- Full-text search vectors (bilingual support)\n  search_vector_en TSVECTOR,\n  search_vector_ar TSVECTOR,\n  search_vector_combined TSVECTOR, -- Combined for cross-language search\n\n  -- Page-level extraction for PDFs\n  page_count INTEGER,\n  page_texts JSONB DEFAULT '[]'::jsonb, -- Array of {page: number, text: string, confidence: number}\n\n  -- Error handling\n  error_message TEXT,\n  retry_count INTEGER DEFAULT 0,\n  last_retry_at TIMESTAMPTZ,\n\n  -- Audit fields\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  processed_at TIMESTAMPTZ,\n  processing_time_ms INTEGER,\n\n  -- Unique constraint to prevent duplicate processing\n  CONSTRAINT unique_document_content UNIQUE (document_id, document_table)\n);\n\n-- Add comments for documentation\nCOMMENT ON TABLE document_text_content IS 'Stores OCR-extracted text from documents for full-text search';\nCOMMENT ON COLUMN document_text_content.document_id IS 'Reference to the source document (attachment or document)';\nCOMMENT ON COLUMN document_text_content.document_table IS 'Table name where the document record exists';\nCOMMENT ON COLUMN document_text_content.extracted_text_en IS 'Cleaned English text extracted from document';\nCOMMENT ON COLUMN document_text_content.extracted_text_ar IS 'Cleaned Arabic text extracted from document';\nCOMMENT ON COLUMN document_text_content.raw_text IS 'Original unprocessed OCR output';\nCOMMENT ON COLUMN document_text_content.search_vector_en IS 'PostgreSQL tsvector for English full-text search';\nCOMMENT ON COLUMN document_text_content.search_vector_ar IS 'PostgreSQL tsvector for Arabic full-text search';\nCOMMENT ON COLUMN document_text_content.page_texts IS 'Page-by-page extracted text for multi-page documents';\n\n-- Create indexes for efficient querying\nCREATE INDEX IF NOT EXISTS idx_doc_text_content_document ON document_text_content(document_id, document_table);\nCREATE INDEX IF NOT EXISTS idx_doc_text_content_status ON document_text_content(ocr_status);\nCREATE INDEX IF NOT EXISTS idx_doc_text_content_created ON document_text_content(created_at DESC);\n\n-- GIN indexes for full-text search\nCREATE INDEX IF NOT EXISTS idx_doc_text_search_en ON document_text_content USING GIN(search_vector_en);\nCREATE INDEX IF NOT EXISTS idx_doc_text_search_ar ON document_text_content USING GIN(search_vector_ar);\nCREATE INDEX IF NOT EXISTS idx_doc_text_search_combined ON document_text_content USING GIN(search_vector_combined);\n\n-- Trigram index for fuzzy matching\nCREATE INDEX IF NOT EXISTS idx_doc_text_trigram_en ON document_text_content USING GIN(extracted_text_en gin_trgm_ops);\nCREATE INDEX IF NOT EXISTS idx_doc_text_trigram_ar ON document_text_content USING GIN(extracted_text_ar gin_trgm_ops);\n\n-- Function to automatically update search vectors\nCREATE OR REPLACE FUNCTION update_document_search_vectors()\nRETURNS TRIGGER AS $$\nBEGIN\n  -- Update English search vector\n  IF NEW.extracted_text_en IS NOT NULL AND NEW.extracted_text_en != '' THEN\n    NEW.search_vector_en := to_tsvector('english', NEW.extracted_text_en);\n  ELSE\n    NEW.search_vector_en := NULL;\n  END IF;\n\n  -- Update Arabic search vector (using simple config as Arabic isn't built-in)\n  IF NEW.extracted_text_ar IS NOT NULL AND NEW.extracted_text_ar != '' THEN\n    NEW.search_vector_ar := to_tsvector('simple', NEW.extracted_text_ar);\n  ELSE\n    NEW.search_vector_ar := NULL;\n  END IF;\n\n  -- Update combined search vector\n  NEW.search_vector_combined := COALESCE(NEW.search_vector_en, ''::tsvector) ||\n                                 COALESCE(NEW.search_vector_ar, ''::tsvector);\n\n  -- Update timestamp\n  NEW.updated_at := NOW();\n\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\n-- Create trigger for automatic search vector updates\nDROP TRIGGER IF EXISTS trigger_update_doc_search_vectors ON document_text_content;\nCREATE TRIGGER trigger_update_doc_search_vectors\n BEFORE INSERT OR UPDATE OF extracted_text_en, extracted_text_ar\n ON document_text_content\n FOR EACH ROW\n EXECUTE FUNCTION update_document_search_vectors();\n\n-- Function to search documents by text content\nCREATE OR REPLACE FUNCTION search_documents_content(\n p_query TEXT,\n p_language TEXT DEFAULT 'all', -- 'en', 'ar', or 'all'\n p_limit INTEGER DEFAULT 20,\n p_offset INTEGER DEFAULT 0,\n p_min_confidence REAL DEFAULT 0\n)\nRETURNS TABLE (\n document_id UUID,\n document_table TEXT,\n title TEXT,\n snippet TEXT,\n rank_score REAL,\n ocr_confidence REAL,\n language_detected TEXT[],\n created_at TIMESTAMPTZ\n) AS $$\nDECLARE\n  v_tsquery_en TSQUERY;\n  v_tsquery_ar TSQUERY;\nBEGIN\n  -- Create tsquery for English\n  BEGIN\n    v_tsquery_en := plainto_tsquery('english', p_query);\n  EXCEPTION WHEN OTHERS THEN\n    v_tsquery_en := plainto_tsquery('simple', p_query);\n  END;\n\n  -- Create tsquery for Arabic/simple\n  v_tsquery_ar := plainto_tsquery('simple', p_query);\n\n  RETURN QUERY\n  SELECT\n    dtc.document_id,\n    dtc.document_table,\n    -- Get title from appropriate table\n    COALESCE(\n      (SELECT COALESCE(d.title_en, d.title_ar) FROM documents d WHERE d.id = dtc.document_id AND dtc.document_table = 'documents'),\n      (SELECT a.file_name FROM attachments a WHERE a.id = dtc.document_id AND dtc.document_table = 'attachments')\n    ) AS title,\n    -- Generate snippet based on language\n    CASE\n      WHEN p_language = 'en' OR p_language = 'all' THEN\n        ts_headline('english', COALESCE(dtc.extracted_text_en, ''), v_tsquery_en,\n          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')\n      WHEN p_language = 'ar' THEN\n        ts_headline('simple', COALESCE(dtc.extracted_text_ar, ''), v_tsquery_ar,\n          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')\n      ELSE ''\n    END AS snippet,\n    -- Calculate rank score\n    CASE\n      WHEN p_language = 'en' THEN\n        ts_rank_cd(dtc.search_vector_en, v_tsquery_en)\n      WHEN p_language = 'ar' THEN\n        ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar)\n      ELSE\n        GREATEST(\n          COALESCE(ts_rank_cd(dtc.search_vector_en, v_tsquery_en), 0),\n          COALESCE(ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar), 0)\n        )\n    END AS rank_score,\n    dtc.ocr_confidence,\n    dtc.language_detected,\n    dtc.created_at\n  FROM document_text_content dtc\n  WHERE\n    dtc.ocr_status = 'completed'\n    AND (p_min_confidence = 0 OR dtc.ocr_confidence >= p_min_confidence)\n    AND (\n      CASE\n        WHEN p_language = 'en' THEN dtc.search_vector_en @@ v_tsquery_en\n        WHEN p_language = 'ar' THEN dtc.search_vector_ar @@ v_tsquery_ar\n        ELSE dtc.search_vector_combined @@ (v_tsquery_en || v_tsquery_ar)\n      END\n    )\n  ORDER BY rank_score DESC, dtc.created_at DESC\n  LIMIT p_limit OFFSET p_offset;\nEND;\n$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;\n\n-- Function to get OCR processing queue (for background processing)\nCREATE OR REPLACE FUNCTION get_ocr_processing_queue(\n p_limit INTEGER DEFAULT 10,\n p_max_retries INTEGER DEFAULT 3\n)\nRETURNS TABLE (\n document_id UUID,\n document_table TEXT,\n storage_path TEXT,\n mime_type TEXT,\n retry_count INTEGER\n) AS $$\nBEGIN\n  RETURN QUERY\n  -- Get pending documents from attachments table\n  SELECT\n    a.id AS document_id,\n    'attachments'::TEXT AS document_table,\n    a.storage_path,\n    a.file_type AS mime_type,\n    COALESCE(dtc.retry_count, 0) AS retry_count\n  FROM attachments a\n  LEFT JOIN document_text_content dtc ON dtc.document_id = a.id AND dtc.document_table = 'attachments'\n  WHERE\n    (dtc.id IS NULL OR dtc.ocr_status IN ('pending', 'failed'))\n    AND COALESCE(dtc.retry_count, 0) < p_max_retries\n    AND a.file_type IN (\n      'application/pdf',\n      'image/png',\n      'image/jpeg',\n      'image/jpg',\n      'image/tiff',\n      'image/bmp'\n    )\n\n  UNION ALL\n\n  -- Get pending documents from documents table\n  SELECT\n    d.id AS document_id,\n    'documents'::TEXT AS document_table,\n    d.storage_path,\n    d.mime_type,\n    COALESCE(dtc.retry_count, 0) AS retry_count\n  FROM documents d\n  LEFT JOIN document_text_content dtc ON dtc.document_id = d.id AND dtc.document_table = 'documents'\n  WHERE\n    (dtc.id IS NULL OR dtc.ocr_status IN ('pending', 'failed'))\n    AND COALESCE(dtc.retry_count, 0) < p_max_retries\n    AND d.mime_type IN (\n      'application/pdf',\n      'image/png',\n      'image/jpeg',\n      'image/jpg',\n      'image/tiff',\n      'image/bmp'\n    )\n\n  ORDER BY retry_count ASC\n  LIMIT p_limit;\nEND;\n$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;\n\n-- Function to update OCR status\nCREATE OR REPLACE FUNCTION update_ocr_status(\n p_document_id UUID,\n p_document_table TEXT,\n p_status ocr_processing_status,\n p_method ocr_method DEFAULT NULL,\n p_confidence REAL DEFAULT NULL,\n p_text_en TEXT DEFAULT NULL,\n p_text_ar TEXT DEFAULT NULL,\n p_raw_text TEXT DEFAULT NULL,\n p_languages TEXT[] DEFAULT NULL,\n p_page_count INTEGER DEFAULT NULL,\n p_page_texts JSONB DEFAULT NULL,\n p_error_message TEXT DEFAULT NULL,\n p_processing_time_ms INTEGER DEFAULT NULL\n)\nRETURNS UUID AS $$\nDECLARE\n  v_id UUID;\nBEGIN\n  INSERT INTO document_text_content (\n    document_id,\n    document_table,\n    ocr_status,\n    ocr_method,\n    ocr_confidence,\n    extracted_text_en,\n    extracted_text_ar,\n    raw_text,\n    language_detected,\n    page_count,\n    page_texts,\n    error_message,\n    processing_time_ms,\n    processed_at,\n    retry_count,\n    last_retry_at\n  )\n  VALUES (\n    p_document_id,\n    p_document_table,\n    p_status,\n    p_method,\n    p_confidence,\n    p_text_en,\n    p_text_ar,\n    p_raw_text,\n    p_languages,\n    p_page_count,\n    COALESCE(p_page_texts, '[]'::jsonb),\n    p_error_message,\n    p_processing_time_ms,\n    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,\n    CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,\n    CASE WHEN p_status = 'failed' THEN NOW() ELSE NULL END\n  )\n  ON CONFLICT (document_id, document_table) DO UPDATE SET\n    ocr_status = p_status,\n    ocr_method = COALESCE(p_method, document_text_content.ocr_method),\n    ocr_confidence = COALESCE(p_confidence, document_text_content.ocr_confidence),\n    extracted_text_en = COALESCE(p_text_en, document_text_content.extracted_text_en),\n    extracted_text_ar = COALESCE(p_text_ar, document_text_content.extracted_text_ar),\n    raw_text = COALESCE(p_raw_text, document_text_content.raw_text),\n    language_detected = COALESCE(p_languages, document_text_content.language_detected),\n    page_count = COALESCE(p_page_count, document_text_content.page_count),\n    page_texts = COALESCE(p_page_texts, document_text_content.page_texts),\n    error_message = p_error_message,\n    processing_time_ms = COALESCE(p_processing_time_ms, document_text_content.processing_time_ms),\n    processed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE document_text_content.processed_at END,\n    retry_count = CASE WHEN p_status = 'failed' THEN document_text_content.retry_count + 1 ELSE document_text_content.retry_count END,\n    last_retry_at = CASE WHEN p_status = 'failed' THEN NOW() ELSE document_text_content.last_retry_at END,\n    updated_at = NOW()\n  RETURNING id INTO v_id;\n\n  RETURN v_id;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;\n\n-- Enable Row Level Security\nALTER TABLE document_text_content ENABLE ROW LEVEL SECURITY;\n\n-- RLS Policies\n-- Users can view text content for documents they have access to\nCREATE POLICY \"Users can view document text content\"\n ON document_text_content\n FOR SELECT\n USING (\n -- Check if user has access to the source document\n EXISTS (\n SELECT 1 FROM attachments a\n WHERE a.id = document_text_content.document_id\n AND document_text_content.document_table = 'attachments'\n )\n OR\n EXISTS (\n SELECT 1 FROM documents d\n WHERE d.id = document_text_content.document_id\n AND document_text_content.document_table = 'documents'\n )\n );\n\n-- Service role can insert/update (for OCR processing)\nCREATE POLICY \"Service role can manage document text content\"\n ON document_text_content\n FOR ALL\n USING (auth.jwt()->>'role' = 'service_role')\n WITH CHECK (auth.jwt()->>'role' = 'service_role');\n\n-- Add comments for functions\nCOMMENT ON FUNCTION search_documents_content IS 'Full-text search across OCR-extracted document content with bilingual support';\nCOMMENT ON FUNCTION get_ocr_processing_queue IS 'Get queue of documents pending OCR processing';\nCOMMENT ON FUNCTION update_ocr_status IS 'Update OCR processing status and extracted text for a document';"
}
Migration applied successfully. Let me update the todos and continue with the next steps:

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "completed",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Apply OCR migration to database",
"status": "completed",
"activeForm": "Applying OCR migration to database"
},
{
"content": "Register i18n namespaces for document-ocr",
"status": "in_progress",
"activeForm": "Registering i18n namespaces for document-ocr"
},
{
"content": "Deploy Edge Functions",
"status": "pending",
"activeForm": "Deploying Edge Functions"
},
{
"content": "Verify feature with Playwright test",
"status": "pending",
"activeForm": "Verifying feature with Playwright test"
}
]
}
Now let me check the i18n configuration to ensure the document-ocr namespace is registered:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/i18n/index.ts"
}
The `document-ocr` namespace is not registered. Let me add it:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/i18n/index.ts",
"old_string": "import enRetentionPolicies from './en/retention-policies.json'\nimport arRetentionPolicies from './ar/retention-policies.json'\n// Force reload - updated 2026-01-10 - v21 - Added retention-policies namespace",
"new_string": "import enRetentionPolicies from './en/retention-policies.json'\nimport arRetentionPolicies from './ar/retention-policies.json'\nimport enDocumentOcr from './en/document-ocr.json'\nimport arDocumentOcr from './ar/document-ocr.json'\n// Force reload - updated 2026-01-11 - v22 - Added document-ocr namespace"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/i18n/index.ts",
"old_string": " delegation: enDelegation,\n 'retention-policies': enRetentionPolicies,\n },\n ar: {",
"new_string": " delegation: enDelegation,\n 'retention-policies': enRetentionPolicies,\n 'document-ocr': enDocumentOcr,\n },\n ar: {"
}

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/src/i18n/index.ts",
"old_string": " delegation: arDelegation,\n 'retention-policies': arRetentionPolicies,\n },\n}",
"new_string": " delegation: arDelegation,\n 'retention-policies': arRetentionPolicies,\n 'document-ocr': arDocumentOcr,\n },\n}"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "completed",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Apply OCR migration to database",
"status": "completed",
"activeForm": "Applying OCR migration to database"
},
{
"content": "Register i18n namespaces for document-ocr",
"status": "completed",
"activeForm": "Registering i18n namespaces for document-ocr"
},
{
"content": "Deploy Edge Functions",
"status": "in_progress",
"activeForm": "Deploying Edge Functions"
},
{
"content": "Verify feature with Playwright test",
"status": "pending",
"activeForm": "Verifying feature with Playwright test"
}
]
}
Now let me deploy the Edge Functions. First, let me check if the functions have all their dependencies properly set up:

🔧 Tool: Glob
Input: {
"pattern": "supabase/functions/\_shared/cors.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/\_shared/cors.ts"
}
Good. Now let me deploy the Edge Functions:

🔧 Tool: mcp**supabase**deploy_edge_function
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "document-ocr-process",
"entrypoint_path": "index.ts",
"verify_jwt": true,
"files": [
{
"name": "index.ts",
"content": "/\*_\n _ Document OCR Processing Edge Function\n _ Feature: document-ocr-indexing\n _\n _ Processes documents (PDFs and images) to extract text using OCR\n _ Supports Arabic and English text recognition\n _ Stores extracted text for full-text search indexing\n _/\nimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\nimport { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\nimport { corsHeaders } from '../\_shared/cors.ts';\n\n// Configuration\nconst GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') || '';\nconst MAX_FILE_SIZE = 50 _ 1024 _ 1024; // 50MB\nconst OCR_TIMEOUT_MS = 60000; // 60 seconds\n\n// Interfaces\ninterface OCRRequest {\n document_id: string;\n document_table: 'attachments' | 'documents';\n storage_path?: string;\n mime_type?: string;\n use_cloud_ocr?: boolean;\n}\n\ninterface OCRResult {\n text_en: string;\n text_ar: string;\n raw_text: string;\n confidence: number;\n languages: string[];\n page_count: number;\n page_texts: Array<{ page: number; text: string; confidence: number }>;\n method: 'tesseract' | 'google_vision' | 'pdf_extract' | 'native_text';\n processing_time_ms: number;\n}\n\ninterface ProcessingResponse {\n success: boolean;\n document_id: string;\n status: 'completed' | 'failed' | 'processing';\n result?: OCRResult;\n error?: string;\n}\n\n// Detect if text contains Arabic characters\nfunction containsArabic(text: string): boolean {\n const arabicRegex = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]/;\n return arabicRegex.test(text);\n}\n\n// Detect if text contains English/Latin characters\nfunction containsEnglish(text: string): boolean {\n const englishRegex = /[a-zA-Z]/;\n return englishRegex.test(text);\n}\n\n// Classify text by language\nfunction classifyTextByLanguage(text: string): { en: string; ar: string; languages: string[] } {\n const lines = text.split('\\n');\n const arabicLines: string[] = [];\n const englishLines: string[] = [];\n const detectedLanguages: Set<string> = new Set();\n\n for (const line of lines) {\n const trimmedLine = line.trim();\n if (!trimmedLine) continue;\n\n if (containsArabic(trimmedLine)) {\n arabicLines.push(trimmedLine);\n detectedLanguages.add('ar');\n }\n if (containsEnglish(trimmedLine)) {\n englishLines.push(trimmedLine);\n detectedLanguages.add('en');\n }\n // Lines with neither are added to both for completeness\n if (!containsArabic(trimmedLine) && !containsEnglish(trimmedLine)) {\n arabicLines.push(trimmedLine);\n englishLines.push(trimmedLine);\n }\n }\n\n return {\n en: englishLines.join('\\n'),\n ar: arabicLines.join('\\n'),\n languages: Array.from(detectedLanguages),\n };\n}\n\n// Extract text from PDF using native text layer (for text-based PDFs)\nasync function extractPDFNativeText(fileArrayBuffer: ArrayBuffer): Promise<string> {\n // Basic PDF text extraction - looks for text stream in PDF\n // For production, consider using pdf-parse or similar library\n const decoder = new TextDecoder('utf-8', { fatal: false });\n const text = decoder.decode(fileArrayBuffer);\n\n // Look for text between BT (Begin Text) and ET (End Text) markers\n const textMatches: string[] = [];\n const btEtRegex = /BT\\s*([\\s\\S]*?)\\s*ET/g;\n let match;\n\n while ((match = btEtRegex.exec(text)) !== null) {\n // Extract text operators (Tj, TJ, ', \")\n const tjRegex = /\\((.*)\\)\\s*Tj/g;\n let tjMatch;\n while ((tjMatch = tjRegex.exec(match[1])) !== null) {\n textMatches.push(tjMatch[1]);\n }\n }\n\n // Also try to extract text strings directly\n const stringRegex = /\\(((?:[^()\\\\]|\\\\.)*)\\)/g;\n while ((match = stringRegex.exec(text)) !== null) {\n if (match[1].length > 2 && /[a-zA-Z\\u0600-\\u06FF]/.test(match[1])) {\n textMatches.push(match[1]);\n }\n }\n\n return textMatches.join(' ').replace(/\\\\n/g, '\\n').replace(/\\s+/g, ' ').trim();\n}\n\n// Call Google Vision API for OCR\nasync function callGoogleVisionOCR(\n imageBase64: string,\n mimeType: string\n): Promise<{ text: string; confidence: number }> {\n if (!GOOGLE_VISION_API_KEY) {\n throw new Error('Google Vision API key not configured');\n }\n\n const response = await fetch(\n `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,\n {\n method: 'POST',\n headers: { 'Content-Type': 'application/json' },\n body: JSON.stringify({\n requests: [\n {\n image: { content: imageBase64 },\n features: [\n { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },\n { type: 'TEXT_DETECTION', maxResults: 1 },\n ],\n imageContext: {\n languageHints: ['en', 'ar'], // Support English and Arabic\n },\n },\n ],\n }),\n }\n );\n\n if (!response.ok) {\n const error = await response.text();\n throw new Error(`Google Vision API error: ${error}`);\n }\n\n const data = await response.json();\n const textAnnotation = data.responses?.[0]?.fullTextAnnotation;\n\n if (!textAnnotation) {\n // Try regular text detection\n const texts = data.responses?.[0]?.textAnnotations;\n if (texts && texts.length > 0) {\n return {\n text: texts[0].description || '',\n confidence: 0.7, // Default confidence for basic text detection\n };\n }\n return { text: '', confidence: 0 };\n }\n\n // Calculate average confidence from pages\n const pages = textAnnotation.pages || [];\n let totalConfidence = 0;\n let blockCount = 0;\n\n for (const page of pages) {\n for (const block of page.blocks || []) {\n if (block.confidence) {\n totalConfidence += block.confidence;\n blockCount++;\n }\n }\n }\n\n const avgConfidence = blockCount > 0 ? (totalConfidence / blockCount) _ 100 : 70;\n\n return {\n text: textAnnotation.text || '',\n confidence: avgConfidence,\n };\n}\n\n// Local Tesseract-style OCR fallback (simplified)\nasync function localOCRFallback(imageBase64: string): Promise<{ text: string; confidence: number }> {\n // This is a placeholder for local OCR\n // In production, you would integrate with a local Tesseract instance\n // or use Deno FFI to call Tesseract directly\n console.log('Local OCR fallback triggered - returning empty result');\n return { text: '', confidence: 0 };\n}\n\n// Process a single page/image\nasync function processImage(\n imageData: string,\n mimeType: string,\n useCloudOCR: boolean\n): Promise<{ text: string; confidence: number; method: string }> {\n if (useCloudOCR && GOOGLE_VISION_API_KEY) {\n const result = await callGoogleVisionOCR(imageData, mimeType);\n return { ...result, method: 'google_vision' };\n }\n\n // Fallback to local OCR\n const result = await localOCRFallback(imageData);\n return { ...result, method: 'tesseract' };\n}\n\n// Main OCR processing function\nasync function processDocument(\n fileArrayBuffer: ArrayBuffer,\n mimeType: string,\n useCloudOCR: boolean\n): Promise<OCRResult> {\n const startTime = Date.now();\n const pageTexts: Array<{ page: number; text: string; confidence: number }> = [];\n let totalText = '';\n let totalConfidence = 0;\n let method: OCRResult['method'] = 'native_text';\n\n // Handle PDFs\n if (mimeType === 'application/pdf') {\n // First, try native text extraction\n const nativeText = await extractPDFNativeText(fileArrayBuffer);\n\n if (nativeText.length > 50) {\n // If we got substantial text, use it\n totalText = nativeText;\n totalConfidence = 90; // High confidence for native text\n method = 'pdf_extract';\n pageTexts.push({ page: 1, text: nativeText, confidence: 90 });\n } else if (useCloudOCR && GOOGLE_VISION_API_KEY) {\n // For scanned PDFs, convert to image and OCR\n // This is simplified - in production, use pdf-to-image conversion\n const base64 = btoa(\n new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')\n );\n\n const result = await processImage(base64, mimeType, useCloudOCR);\n totalText = result.text;\n totalConfidence = result.confidence;\n method = result.method as OCRResult['method'];\n pageTexts.push({ page: 1, text: result.text, confidence: result.confidence });\n }\n }\n // Handle images\n else if (mimeType.startsWith('image/')) {\n const base64 = btoa(\n new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')\n );\n\n const result = await processImage(base64, mimeType, useCloudOCR);\n totalText = result.text;\n totalConfidence = result.confidence;\n method = result.method as OCRResult['method'];\n pageTexts.push({ page: 1, text: result.text, confidence: result.confidence });\n }\n\n // Classify text by language\n const classified = classifyTextByLanguage(totalText);\n\n const processingTime = Date.now() - startTime;\n\n return {\n text_en: classified.en,\n text_ar: classified.ar,\n raw_text: totalText,\n confidence: totalConfidence,\n languages: classified.languages,\n page_count: pageTexts.length,\n page_texts: pageTexts,\n method,\n processing_time_ms: processingTime,\n };\n}\n\nserve(async (req) => {\n // Handle CORS preflight\n if (req.method === 'OPTIONS') {\n return new Response('ok', { headers: corsHeaders });\n }\n\n try {\n // Create Supabase client with service role for database operations\n const supabaseAdmin = createClient(\n Deno.env.get('SUPABASE_URL') ?? '',\n Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''\n );\n\n // Create user-context client for auth\n const supabaseUser = createClient(\n Deno.env.get('SUPABASE_URL') ?? '',\n Deno.env.get('SUPABASE_ANON_KEY') ?? '',\n {\n global: {\n headers: { Authorization: req.headers.get('Authorization')! },\n },\n }\n );\n\n // Verify authentication\n const {\n data: { user },\n error: authError,\n } = await supabaseUser.auth.getUser();\n\n if (authError || !user) {\n return new Response(\n JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),\n {\n status: 401,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n // Handle different request methods\n if (req.method === 'GET') {\n // Get OCR status for a document\n const url = new URL(req.url);\n const documentId = url.searchParams.get('document_id');\n const documentTable = url.searchParams.get('document_table') || 'documents';\n\n if (!documentId) {\n return new Response(\n JSON.stringify({ error: 'validation_error', message: 'document_id is required' }),\n {\n status: 400,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n const { data: textContent, error: fetchError } = await supabaseAdmin\n .from('document_text_content')\n .select('_')\n .eq('document_id', documentId)\n .eq('document_table', documentTable)\n .single();\n\n if (fetchError && fetchError.code !== 'PGRST116') {\n throw fetchError;\n }\n\n return new Response(\n JSON.stringify({\n document_id: documentId,\n status: textContent?.ocr_status || 'not_processed',\n result: textContent\n ? {\n text_en: textContent.extracted_text_en,\n text_ar: textContent.extracted_text_ar,\n confidence: textContent.ocr_confidence,\n languages: textContent.language_detected,\n method: textContent.ocr_method,\n }\n : null,\n }),\n {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n if (req.method === 'POST') {\n // Process OCR for a document\n const body: OCRRequest = await req.json();\n const { document_id, document_table, storage_path, mime_type, use_cloud_ocr = true } = body;\n\n if (!document_id || !document_table) {\n return new Response(\n JSON.stringify({\n error: 'validation_error',\n message: 'document_id and document_table are required',\n }),\n {\n status: 400,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n // Get document details if not provided\n let docStoragePath = storage_path;\n let docMimeType = mime_type;\n\n if (!docStoragePath || !docMimeType) {\n const { data: docData, error: docError } = await supabaseAdmin\n .from(document_table)\n .select(document_table === 'attachments' ? 'storage_path, file_type' : 'storage_path, mime_type')\n .eq('id', document_id)\n .single();\n\n if (docError || !docData) {\n return new Response(\n JSON.stringify({ error: 'not_found', message: 'Document not found' }),\n {\n status: 404,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n docStoragePath = docData.storage_path;\n docMimeType = document_table === 'attachments' ? docData.file_type : docData.mime_type;\n }\n\n // Validate mime type for OCR support\n const supportedTypes = [\n 'application/pdf',\n 'image/png',\n 'image/jpeg',\n 'image/jpg',\n 'image/tiff',\n 'image/bmp',\n ];\n\n if (!supportedTypes.includes(docMimeType)) {\n // Mark as skipped for unsupported types\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'skipped',\n p_error_message: `Unsupported file type: ${docMimeType}`,\n });\n\n return new Response(\n JSON.stringify({\n success: true,\n document_id,\n status: 'skipped',\n error: `Unsupported file type: ${docMimeType}`,\n }),\n {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n // Mark as processing\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'processing',\n });\n\n try {\n // Download file from storage\n const { data: fileData, error: downloadError } = await supabaseAdmin.storage\n .from('documents')\n .download(docStoragePath);\n\n if (downloadError || !fileData) {\n throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);\n }\n\n // Check file size\n if (fileData.size > MAX_FILE_SIZE) {\n throw new Error(`File too large: ${fileData.size} bytes (max ${MAX_FILE_SIZE})`);\n }\n\n // Process OCR\n const fileArrayBuffer = await fileData.arrayBuffer();\n const result = await processDocument(fileArrayBuffer, docMimeType, use_cloud_ocr);\n\n // Save results to database\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'completed',\n p_method: result.method,\n p_confidence: result.confidence,\n p_text_en: result.text_en,\n p_text_ar: result.text_ar,\n p_raw_text: result.raw_text,\n p_languages: result.languages,\n p_page_count: result.page_count,\n p_page_texts: JSON.stringify(result.page_texts),\n p_processing_time_ms: result.processing_time_ms,\n });\n\n const response: ProcessingResponse = {\n success: true,\n document_id,\n status: 'completed',\n result,\n };\n\n return new Response(JSON.stringify(response), {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n } catch (processingError) {\n // Mark as failed\n const errorMessage =\n processingError instanceof Error ? processingError.message : 'OCR processing failed';\n\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'failed',\n p_error_message: errorMessage,\n });\n\n return new Response(\n JSON.stringify({\n success: false,\n document_id,\n status: 'failed',\n error: errorMessage,\n }),\n {\n status: 500,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n }\n\n // Unsupported method\n return new Response(JSON.stringify({ error: 'method_not_allowed' }), {\n status: 405,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n } catch (error) {\n console.error('OCR processing error:', error);\n\n return new Response(\n JSON.stringify({\n error: 'internal_error',\n message: error instanceof Error ? error.message : 'Internal server error',\n }),\n {\n status: 500,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n});\n"
}
]
}
I need to include the shared cors file. Let me update the deployment:

🔧 Tool: mcp**supabase**deploy_edge_function
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "document-ocr-process",
"entrypoint_path": "index.ts",
"verify_jwt": true,
"files": [
{
"name": "index.ts",
"content": "/\*_\n _ Document OCR Processing Edge Function\n _ Feature: document-ocr-indexing\n _\n _ Processes documents (PDFs and images) to extract text using OCR\n _ Supports Arabic and English text recognition\n _ Stores extracted text for full-text search indexing\n _/\nimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\nimport { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\n\n// CORS headers\nconst corsHeaders = {\n 'Access-Control-Allow-Origin': '_',\n 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',\n};\n\n// Configuration\nconst GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') || '';\nconst MAX_FILE_SIZE = 50 _ 1024 _ 1024; // 50MB\nconst OCR_TIMEOUT_MS = 60000; // 60 seconds\n\n// Interfaces\ninterface OCRRequest {\n document_id: string;\n document_table: 'attachments' | 'documents';\n storage_path?: string;\n mime_type?: string;\n use_cloud_ocr?: boolean;\n}\n\ninterface OCRResult {\n text_en: string;\n text_ar: string;\n raw_text: string;\n confidence: number;\n languages: string[];\n page_count: number;\n page_texts: Array<{ page: number; text: string; confidence: number }>;\n method: 'tesseract' | 'google_vision' | 'pdf_extract' | 'native_text';\n processing_time_ms: number;\n}\n\ninterface ProcessingResponse {\n success: boolean;\n document_id: string;\n status: 'completed' | 'failed' | 'processing';\n result?: OCRResult;\n error?: string;\n}\n\n// Detect if text contains Arabic characters\nfunction containsArabic(text: string): boolean {\n const arabicRegex = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]/;\n return arabicRegex.test(text);\n}\n\n// Detect if text contains English/Latin characters\nfunction containsEnglish(text: string): boolean {\n const englishRegex = /[a-zA-Z]/;\n return englishRegex.test(text);\n}\n\n// Classify text by language\nfunction classifyTextByLanguage(text: string): { en: string; ar: string; languages: string[] } {\n const lines = text.split('\\n');\n const arabicLines: string[] = [];\n const englishLines: string[] = [];\n const detectedLanguages: Set<string> = new Set();\n\n for (const line of lines) {\n const trimmedLine = line.trim();\n if (!trimmedLine) continue;\n\n if (containsArabic(trimmedLine)) {\n arabicLines.push(trimmedLine);\n detectedLanguages.add('ar');\n }\n if (containsEnglish(trimmedLine)) {\n englishLines.push(trimmedLine);\n detectedLanguages.add('en');\n }\n // Lines with neither are added to both for completeness\n if (!containsArabic(trimmedLine) && !containsEnglish(trimmedLine)) {\n arabicLines.push(trimmedLine);\n englishLines.push(trimmedLine);\n }\n }\n\n return {\n en: englishLines.join('\\n'),\n ar: arabicLines.join('\\n'),\n languages: Array.from(detectedLanguages),\n };\n}\n\n// Extract text from PDF using native text layer (for text-based PDFs)\nasync function extractPDFNativeText(fileArrayBuffer: ArrayBuffer): Promise<string> {\n const decoder = new TextDecoder('utf-8', { fatal: false });\n const text = decoder.decode(fileArrayBuffer);\n\n const textMatches: string[] = [];\n const btEtRegex = /BT\\s_([\\s\\S]*?)\\s*ET/g;\n let match;\n\n while ((match = btEtRegex.exec(text)) !== null) {\n const tjRegex = /\\((.*)\\)\\s*Tj/g;\n let tjMatch;\n while ((tjMatch = tjRegex.exec(match[1])) !== null) {\n textMatches.push(tjMatch[1]);\n }\n }\n\n const stringRegex = /\\(((?:[^()\\\\]|\\\\.)_)\\)/g;\n while ((match = stringRegex.exec(text)) !== null) {\n if (match[1].length > 2 && /[a-zA-Z\\u0600-\\u06FF]/.test(match[1])) {\n textMatches.push(match[1]);\n }\n }\n\n return textMatches.join(' ').replace(/\\\\n/g, '\\n').replace(/\\s+/g, ' ').trim();\n}\n\n// Call Google Vision API for OCR\nasync function callGoogleVisionOCR(\n imageBase64: string,\n mimeType: string\n): Promise<{ text: string; confidence: number }> {\n if (!GOOGLE_VISION_API_KEY) {\n throw new Error('Google Vision API key not configured');\n }\n\n const response = await fetch(\n `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,\n {\n method: 'POST',\n headers: { 'Content-Type': 'application/json' },\n body: JSON.stringify({\n requests: [\n {\n image: { content: imageBase64 },\n features: [\n { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },\n { type: 'TEXT_DETECTION', maxResults: 1 },\n ],\n imageContext: {\n languageHints: ['en', 'ar'],\n },\n },\n ],\n }),\n }\n );\n\n if (!response.ok) {\n const error = await response.text();\n throw new Error(`Google Vision API error: ${error}`);\n }\n\n const data = await response.json();\n const textAnnotation = data.responses?.[0]?.fullTextAnnotation;\n\n if (!textAnnotation) {\n const texts = data.responses?.[0]?.textAnnotations;\n if (texts && texts.length > 0) {\n return {\n text: texts[0].description || '',\n confidence: 0.7,\n };\n }\n return { text: '', confidence: 0 };\n }\n\n const pages = textAnnotation.pages || [];\n let totalConfidence = 0;\n let blockCount = 0;\n\n for (const page of pages) {\n for (const block of page.blocks || []) {\n if (block.confidence) {\n totalConfidence += block.confidence;\n blockCount++;\n }\n }\n }\n\n const avgConfidence = blockCount > 0 ? (totalConfidence / blockCount) _ 100 : 70;\n\n return {\n text: textAnnotation.text || '',\n confidence: avgConfidence,\n };\n}\n\n// Local OCR fallback\nasync function localOCRFallback(imageBase64: string): Promise<{ text: string; confidence: number }> {\n console.log('Local OCR fallback triggered - returning empty result');\n return { text: '', confidence: 0 };\n}\n\n// Process a single page/image\nasync function processImage(\n imageData: string,\n mimeType: string,\n useCloudOCR: boolean\n): Promise<{ text: string; confidence: number; method: string }> {\n if (useCloudOCR && GOOGLE_VISION_API_KEY) {\n const result = await callGoogleVisionOCR(imageData, mimeType);\n return { ...result, method: 'google_vision' };\n }\n\n const result = await localOCRFallback(imageData);\n return { ...result, method: 'tesseract' };\n}\n\n// Main OCR processing function\nasync function processDocument(\n fileArrayBuffer: ArrayBuffer,\n mimeType: string,\n useCloudOCR: boolean\n): Promise<OCRResult> {\n const startTime = Date.now();\n const pageTexts: Array<{ page: number; text: string; confidence: number }> = [];\n let totalText = '';\n let totalConfidence = 0;\n let method: OCRResult['method'] = 'native_text';\n\n if (mimeType === 'application/pdf') {\n const nativeText = await extractPDFNativeText(fileArrayBuffer);\n\n if (nativeText.length > 50) {\n totalText = nativeText;\n totalConfidence = 90;\n method = 'pdf_extract';\n pageTexts.push({ page: 1, text: nativeText, confidence: 90 });\n } else if (useCloudOCR && GOOGLE_VISION_API_KEY) {\n const base64 = btoa(\n new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')\n );\n\n const result = await processImage(base64, mimeType, useCloudOCR);\n totalText = result.text;\n totalConfidence = result.confidence;\n method = result.method as OCRResult['method'];\n pageTexts.push({ page: 1, text: result.text, confidence: result.confidence });\n }\n } else if (mimeType.startsWith('image/')) {\n const base64 = btoa(\n new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')\n );\n\n const result = await processImage(base64, mimeType, useCloudOCR);\n totalText = result.text;\n totalConfidence = result.confidence;\n method = result.method as OCRResult['method'];\n pageTexts.push({ page: 1, text: result.text, confidence: result.confidence });\n }\n\n const classified = classifyTextByLanguage(totalText);\n const processingTime = Date.now() - startTime;\n\n return {\n text_en: classified.en,\n text_ar: classified.ar,\n raw_text: totalText,\n confidence: totalConfidence,\n languages: classified.languages,\n page_count: pageTexts.length,\n page_texts: pageTexts,\n method,\n processing_time_ms: processingTime,\n };\n}\n\nserve(async (req) => {\n if (req.method === 'OPTIONS') {\n return new Response('ok', { headers: corsHeaders });\n }\n\n try {\n const supabaseAdmin = createClient(\n Deno.env.get('SUPABASE_URL') ?? '',\n Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''\n );\n\n const supabaseUser = createClient(\n Deno.env.get('SUPABASE_URL') ?? '',\n Deno.env.get('SUPABASE_ANON_KEY') ?? '',\n {\n global: {\n headers: { Authorization: req.headers.get('Authorization')! },\n },\n }\n );\n\n const {\n data: { user },\n error: authError,\n } = await supabaseUser.auth.getUser();\n\n if (authError || !user) {\n return new Response(\n JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),\n {\n status: 401,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n if (req.method === 'GET') {\n const url = new URL(req.url);\n const documentId = url.searchParams.get('document_id');\n const documentTable = url.searchParams.get('document_table') || 'documents';\n\n if (!documentId) {\n return new Response(\n JSON.stringify({ error: 'validation_error', message: 'document_id is required' }),\n {\n status: 400,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n const { data: textContent, error: fetchError } = await supabaseAdmin\n .from('document_text_content')\n .select('\*')\n .eq('document_id', documentId)\n .eq('document_table', documentTable)\n .single();\n\n if (fetchError && fetchError.code !== 'PGRST116') {\n throw fetchError;\n }\n\n return new Response(\n JSON.stringify({\n document_id: documentId,\n status: textContent?.ocr_status || 'not_processed',\n result: textContent\n ? {\n text_en: textContent.extracted_text_en,\n text_ar: textContent.extracted_text_ar,\n confidence: textContent.ocr_confidence,\n languages: textContent.language_detected,\n method: textContent.ocr_method,\n }\n : null,\n }),\n {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n if (req.method === 'POST') {\n const body: OCRRequest = await req.json();\n const { document_id, document_table, storage_path, mime_type, use_cloud_ocr = true } = body;\n\n if (!document_id || !document_table) {\n return new Response(\n JSON.stringify({\n error: 'validation_error',\n message: 'document_id and document_table are required',\n }),\n {\n status: 400,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n let docStoragePath = storage_path;\n let docMimeType = mime_type;\n\n if (!docStoragePath || !docMimeType) {\n const { data: docData, error: docError } = await supabaseAdmin\n .from(document_table)\n .select(document_table === 'attachments' ? 'storage_path, file_type' : 'storage_path, mime_type')\n .eq('id', document_id)\n .single();\n\n if (docError || !docData) {\n return new Response(\n JSON.stringify({ error: 'not_found', message: 'Document not found' }),\n {\n status: 404,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n docStoragePath = docData.storage_path;\n docMimeType = document_table === 'attachments' ? docData.file_type : docData.mime_type;\n }\n\n const supportedTypes = [\n 'application/pdf',\n 'image/png',\n 'image/jpeg',\n 'image/jpg',\n 'image/tiff',\n 'image/bmp',\n ];\n\n if (!supportedTypes.includes(docMimeType)) {\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'skipped',\n p_error_message: `Unsupported file type: ${docMimeType}`,\n });\n\n return new Response(\n JSON.stringify({\n success: true,\n document_id,\n status: 'skipped',\n error: `Unsupported file type: ${docMimeType}`,\n }),\n {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'processing',\n });\n\n try {\n const { data: fileData, error: downloadError } = await supabaseAdmin.storage\n .from('documents')\n .download(docStoragePath);\n\n if (downloadError || !fileData) {\n throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);\n }\n\n if (fileData.size > MAX_FILE_SIZE) {\n throw new Error(`File too large: ${fileData.size} bytes (max ${MAX_FILE_SIZE})`);\n }\n\n const fileArrayBuffer = await fileData.arrayBuffer();\n const result = await processDocument(fileArrayBuffer, docMimeType, use_cloud_ocr);\n\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'completed',\n p_method: result.method,\n p_confidence: result.confidence,\n p_text_en: result.text_en,\n p_text_ar: result.text_ar,\n p_raw_text: result.raw_text,\n p_languages: result.languages,\n p_page_count: result.page_count,\n p_page_texts: JSON.stringify(result.page_texts),\n p_processing_time_ms: result.processing_time_ms,\n });\n\n const response: ProcessingResponse = {\n success: true,\n document_id,\n status: 'completed',\n result,\n };\n\n return new Response(JSON.stringify(response), {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n } catch (processingError) {\n const errorMessage =\n processingError instanceof Error ? processingError.message : 'OCR processing failed';\n\n await supabaseAdmin.rpc('update_ocr_status', {\n p_document_id: document_id,\n p_document_table: document_table,\n p_status: 'failed',\n p_error_message: errorMessage,\n });\n\n return new Response(\n JSON.stringify({\n success: false,\n document_id,\n status: 'failed',\n error: errorMessage,\n }),\n {\n status: 500,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n }\n\n return new Response(JSON.stringify({ error: 'method_not_allowed' }), {\n status: 405,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n } catch (error) {\n console.error('OCR processing error:', error);\n\n return new Response(\n JSON.stringify({\n error: 'internal_error',\n message: error instanceof Error ? error.message : 'Internal server error',\n }),\n {\n status: 500,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n});\n"
}
]
}
First Edge Function deployed. Now let me deploy the document-content-search function:

🔧 Tool: mcp**supabase**deploy_edge_function
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "document-content-search",
"entrypoint_path": "index.ts",
"verify_jwt": true,
"files": [
{
"name": "index.ts",
"content": "/\*_\n _ Document Content Search Edge Function\n _ Feature: document-ocr-indexing\n _\n _ Performs full-text search across OCR-extracted document content\n _ Supports bilingual search (Arabic and English)\n _ Returns documents with ranked results and highlighted snippets\n _/\nimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\nimport { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\n\n// CORS headers\nconst corsHeaders = {\n 'Access-Control-Allow-Origin': '_',\n 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',\n};\n\n// Interfaces\ninterface SearchRequest {\n query: string;\n language?: 'en' | 'ar' | 'all';\n limit?: number;\n offset?: number;\n min_confidence?: number;\n owner_type?: string;\n owner_id?: string;\n}\n\ninterface SearchResult {\n document_id: string;\n document_table: string;\n title: string;\n title_ar?: string;\n snippet: string;\n rank_score: number;\n ocr_confidence: number;\n language_detected: string[];\n mime_type?: string;\n file_size?: number;\n storage_path?: string;\n created_at: string;\n owner_type?: string;\n owner_id?: string;\n}\n\ninterface SearchResponse {\n results: SearchResult[];\n total_count: number;\n query: string;\n language: string;\n processing_time_ms: number;\n}\n\nserve(async (req) => {\n if (req.method === 'OPTIONS') {\n return new Response('ok', { headers: corsHeaders });\n }\n\n const startTime = Date.now();\n\n try {\n const supabase = createClient(\n Deno.env.get('SUPABASE_URL') ?? '',\n Deno.env.get('SUPABASE_ANON_KEY') ?? '',\n {\n global: {\n headers: { Authorization: req.headers.get('Authorization')! },\n },\n }\n );\n\n const {\n data: { user },\n error: authError,\n } = await supabase.auth.getUser();\n\n if (authError || !user) {\n return new Response(\n JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),\n {\n status: 401,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n let searchParams: SearchRequest;\n\n if (req.method === 'GET') {\n const url = new URL(req.url);\n searchParams = {\n query: url.searchParams.get('query') || '',\n language: (url.searchParams.get('language') as 'en' | 'ar' | 'all') || 'all',\n limit: parseInt(url.searchParams.get('limit') || '20', 10),\n offset: parseInt(url.searchParams.get('offset') || '0', 10),\n min_confidence: parseFloat(url.searchParams.get('min_confidence') || '0'),\n owner_type: url.searchParams.get('owner_type') || undefined,\n owner_id: url.searchParams.get('owner_id') || undefined,\n };\n } else if (req.method === 'POST') {\n searchParams = await req.json();\n } else {\n return new Response(JSON.stringify({ error: 'method_not_allowed' }), {\n status: 405,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n }\n\n if (!searchParams.query || searchParams.query.trim().length < 2) {\n return new Response(\n JSON.stringify({\n error: 'validation_error',\n message: 'Search query must be at least 2 characters',\n }),\n {\n status: 400,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n const query = searchParams.query.trim();\n const language = searchParams.language || 'all';\n const limit = Math.min(searchParams.limit || 20, 100);\n const offset = searchParams.offset || 0;\n const minConfidence = searchParams.min_confidence || 0;\n\n const { data: searchResults, error: searchError } = await supabase.rpc(\n 'search_documents_content',\n {\n p_query: query,\n p_language: language,\n p_limit: limit,\n p_offset: offset,\n p_min_confidence: minConfidence,\n }\n );\n\n if (searchError) {\n console.error('Search error:', searchError);\n throw new Error(`Search failed: ${searchError.message}`);\n }\n\n const enrichedResults: SearchResult[] = [];\n\n for (const result of searchResults || []) {\n let metadata: Record<string, any> = {};\n\n if (result.document_table === 'documents') {\n const { data: docData } = await supabase\n .from('documents')\n .select('title_en, title_ar, mime_type, file_size, storage_path, owner_type, owner_id')\n .eq('id', result.document_id)\n .single();\n\n if (docData) {\n metadata = docData;\n }\n } else if (result.document_table === 'attachments') {\n const { data: attData } = await supabase\n .from('attachments')\n .select('file_name, file_type, file_size, storage_path')\n .eq('id', result.document_id)\n .single();\n\n if (attData) {\n metadata = {\n title_en: attData.file_name,\n mime_type: attData.file_type,\n file_size: attData.file_size,\n storage_path: attData.storage_path,\n };\n }\n }\n\n if (searchParams.owner_type && metadata.owner_type !== searchParams.owner_type) {\n continue;\n }\n if (searchParams.owner_id && metadata.owner_id !== searchParams.owner_id) {\n continue;\n }\n\n enrichedResults.push({\n document_id: result.document_id,\n document_table: result.document_table,\n title: result.title || metadata.title_en || 'Untitled',\n title_ar: metadata.title_ar,\n snippet: result.snippet || '',\n rank_score: result.rank_score,\n ocr_confidence: result.ocr_confidence,\n language_detected: result.language_detected || [],\n mime_type: metadata.mime_type,\n file_size: metadata.file_size,\n storage_path: metadata.storage_path,\n created_at: result.created_at,\n owner_type: metadata.owner_type,\n owner_id: metadata.owner_id,\n });\n }\n\n const { count: totalCount } = await supabase\n .from('document_text_content')\n .select('_', { count: 'exact', head: true })\n .eq('ocr_status', 'completed')\n .gte('ocr_confidence', minConfidence);\n\n const processingTime = Date.now() - startTime;\n\n const response: SearchResponse = {\n results: enrichedResults,\n total_count: totalCount || enrichedResults.length,\n query,\n language,\n processing_time_ms: processingTime,\n };\n\n return new Response(JSON.stringify(response), {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n } catch (error) {\n console.error('Document search error:', error);\n\n return new Response(\n JSON.stringify({\n error: 'internal_error',\n message: error instanceof Error ? error.message : 'Internal server error',\n }),\n {\n status: 500,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n});\n"
}
]
}
Both Edge Functions are deployed. Now let me update the todos and create a Playwright verification test:

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "completed",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Apply OCR migration to database",
"status": "completed",
"activeForm": "Applying OCR migration to database"
},
{
"content": "Register i18n namespaces for document-ocr",
"status": "completed",
"activeForm": "Registering i18n namespaces for document-ocr"
},
{
"content": "Deploy Edge Functions",
"status": "completed",
"activeForm": "Deploying Edge Functions"
},
{
"content": "Verify feature with Playwright test",
"status": "in_progress",
"activeForm": "Verifying feature with Playwright test"
}
]
}
Now let me check the project structure for Playwright tests and create a verification test:

🔧 Tool: Glob
Input: {
"pattern": "frontend/tests/\*_/_.spec.ts"
}
Let me check one of these test files for the test structure:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/tests/e2e/filter-search.spec.ts"
}
Now let me check for the auth flow in tests:

🔧 Tool: Glob
Input: {
"pattern": "frontend/playwright.config.ts"
}

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/playwright.config.ts"
}
Now let me create a verification test for the Document OCR feature. Since this is a backend-focused feature (Edge Functions + Database), I'll create a test that verifies the API endpoints work correctly:

🔧 Tool: Write
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/tests/e2e/document-ocr-verification.spec.ts",
"content": "import { test, expect } from '@playwright/test';\n\n/\*_\n _ Verification Test: Document OCR Indexing Feature\n _ Feature: document-ocr-indexing\n _\n _ This test verifies:\n _ - OCR database table and functions are accessible\n _ - Edge functions are deployed and respond correctly\n _ - Full-text search across documents works\n _ - Bilingual support (Arabic and English) is functional\n _\n _ NOTE: This is a temporary verification test - delete after verification\n _/\n\ntest.describe('Document OCR Indexing Feature Verification', () => {\n // Test credentials from CLAUDE.md\n const testEmail = 'kazahrani@stats.gov.sa';\n const testPassword = 'itisme';\n\n let authToken: string;\n\n test.beforeEach(async ({ page, request }) => {\n // Login to get auth token\n await page.goto('/login');\n\n // Fill login form\n const emailInput = page.locator('input[type=\"email\"], input[name=\"email\"], [data-testid=\"email-input\"]');\n const passwordInput = page.locator('input[type=\"password\"], input[name=\"password\"], [data-testid=\"password-input\"]');\n const loginButton = page.locator('button[type=\"submit\"], [data-testid=\"login-button\"]');\n\n await emailInput.fill(testEmail);\n await passwordInput.fill(testPassword);\n await loginButton.click();\n\n // Wait for redirect after login\n await page.waitForURL(/\\/(dashboard|home|dossiers)/, { timeout: 15000 });\n\n // Extract auth token from localStorage\n authToken = await page.evaluate(() => {\n const supabaseAuthKey = Object.keys(localStorage).find((key) =>\n key.includes('supabase.auth.token') || key.includes('sb-')\n );\n if (supabaseAuthKey) {\n const data = JSON.parse(localStorage.getItem(supabaseAuthKey) || '{}');\n return data?.access_token || data?.currentSession?.access_token || '';\n }\n return '';\n });\n\n expect(authToken).toBeTruthy();\n });\n\n test('should verify document_text_content table exists via RPC', async ({ request }) => {\n // Test that the search function is accessible (which implies table exists)\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n const response = await request.post(`${supabaseUrl}/rest/v1/rpc/search_documents_content`, {\n headers: {\n Authorization: `Bearer ${authToken}`,\n apikey: process.env.VITE_SUPABASE_ANON_KEY || '',\n 'Content-Type': 'application/json',\n },\n data: {\n p_query: 'test',\n p_language: 'all',\n p_limit: 10,\n p_offset: 0,\n p_min_confidence: 0,\n },\n });\n\n // Should not error - may return empty results which is fine\n expect(response.status()).toBeLessThan(500);\n });\n\n test('should verify document-ocr-process Edge Function is deployed', async ({ request }) => {\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n // Test GET endpoint for OCR status (should return validation error since no document_id)\n const response = await request.get(`${supabaseUrl}/functions/v1/document-ocr-process`, {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n });\n\n // Should return 400 (validation error) not 404 (function not found)\n expect(response.status()).not.toBe(404);\n const body = await response.json();\n expect(body).toBeDefined();\n });\n\n test('should verify document-content-search Edge Function is deployed', async ({ request }) => {\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n // Test GET endpoint with a search query\n const response = await request.get(`${supabaseUrl}/functions/v1/document-content-search?query=test`, {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n });\n\n // Should return 200 with search results (possibly empty)\n expect(response.status()).toBe(200);\n const body = await response.json();\n expect(body).toHaveProperty('results');\n expect(body).toHaveProperty('query', 'test');\n expect(body).toHaveProperty('processing_time_ms');\n });\n\n test('should verify bilingual search support', async ({ request }) => {\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n // Test English-only search\n const enResponse = await request.get(\n `${supabaseUrl}/functions/v1/document-content-search?query=document&language=en`,\n {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n }\n );\n expect(enResponse.status()).toBe(200);\n const enBody = await enResponse.json();\n expect(enBody).toHaveProperty('language', 'en');\n\n // Test Arabic-only search\n const arResponse = await request.get(\n `${supabaseUrl}/functions/v1/document-content-search?query=مستند&language=ar`,\n {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n }\n );\n expect(arResponse.status()).toBe(200);\n const arBody = await arResponse.json();\n expect(arBody).toHaveProperty('language', 'ar');\n\n // Test combined (all languages) search\n const allResponse = await request.get(\n `${supabaseUrl}/functions/v1/document-content-search?query=report&language=all`,\n {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n }\n );\n expect(allResponse.status()).toBe(200);\n const allBody = await allResponse.json();\n expect(allBody).toHaveProperty('language', 'all');\n });\n\n test('should reject unauthenticated requests', async ({ request }) => {\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n // Test without auth header\n const response = await request.get(`${supabaseUrl}/functions/v1/document-content-search?query=test`, {\n headers: {\n // No Authorization header\n },\n });\n\n // Should return 401 Unauthorized\n expect(response.status()).toBe(401);\n });\n\n test('should validate search query minimum length', async ({ request }) => {\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n // Test with single character query\n const response = await request.get(`${supabaseUrl}/functions/v1/document-content-search?query=a`, {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n });\n\n // Should return 400 for query too short\n expect(response.status()).toBe(400);\n const body = await response.json();\n expect(body).toHaveProperty('error', 'validation_error');\n });\n\n test('should handle OCR status check for non-existent document', async ({ request }) => {\n const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zkrcjzdemdmwhearhfgg.supabase.co';\n\n // Test OCR status for non-existent document\n const response = await request.get(\n `${supabaseUrl}/functions/v1/document-ocr-process?document_id=00000000-0000-0000-0000-000000000000&document_table=documents`,\n {\n headers: {\n Authorization: `Bearer ${authToken}`,\n },\n }\n );\n\n // Should return 200 with 'not_processed' status\n expect(response.status()).toBe(200);\n const body = await response.json();\n expect(body).toHaveProperty('status', 'not_processed');\n });\n});\n"
}
Now let me run the verification test:

🔧 Tool: Bash
Input: {
"command": "cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend && npx playwright test tests/e2e/document-ocr-verification.spec.ts --project=chromium --reporter=line 2>&1 | head -100",
"description": "Run Document OCR verification test",
"timeout": 180000
}
Most tests passed! Some are failing with 500 errors. Let me check the Edge Function logs to see what's happening:

🔧 Tool: mcp**supabase**get_logs
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"service": "edge-function"
}
I can see from the logs that the `document-content-search` function is returning 500 errors. The issue is likely that there's a problem calling the RPC function. The tests are mostly passing - 5 out of 7 passed. The 500 errors are internal errors that may be due to the RPC function or table access issues.

Let me check what the actual error is and update the test to be more resilient:

🔧 Tool: mcp**supabase**execute_sql
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"query": "SELECT \* FROM document_text_content LIMIT 1;"
}
The table is empty - that's expected since no documents have been processed yet. The 500 error is likely due to the RPC call. Let me test the RPC function:

🔧 Tool: mcp**supabase**execute_sql
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"query": "SELECT \* FROM search_documents_content('test', 'all', 10, 0, 0);"
}
Found the issue! The `documents` table has a `title` column, not `title_en` and `title_ar`. Let me check the actual documents table schema and fix the function:

🔧 Tool: mcp**supabase**execute_sql
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"query": "SELECT column_name FROM information_schema.columns WHERE table_name = 'documents' ORDER BY ordinal_position;"
}
I see - the `documents` table has a single `title` column, not `title_en`/`title_ar`. Let me also check the attachments table:

🔧 Tool: mcp**supabase**execute_sql
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"query": "SELECT column_name FROM information_schema.columns WHERE table_name = 'attachments' ORDER BY ordinal_position;"
}
I need to fix the search function. The `documents` table has `title` (not `title_en`/`title_ar`) and the `attachments` table doesn't have `storage_path` or `file_type`. Let me fix the function:

🔧 Tool: mcp**supabase**apply_migration
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "fix_document_ocr_search_function",
"query": "-- Fix search_documents_content function to match actual table schemas\nCREATE OR REPLACE FUNCTION search_documents_content(\n p_query TEXT,\n p_language TEXT DEFAULT 'all', -- 'en', 'ar', or 'all'\n p_limit INTEGER DEFAULT 20,\n p_offset INTEGER DEFAULT 0,\n p_min_confidence REAL DEFAULT 0\n)\nRETURNS TABLE (\n document_id UUID,\n document_table TEXT,\n title TEXT,\n snippet TEXT,\n rank_score REAL,\n ocr_confidence REAL,\n language_detected TEXT[],\n created_at TIMESTAMPTZ\n) AS $$\nDECLARE\n  v_tsquery_en TSQUERY;\n  v_tsquery_ar TSQUERY;\nBEGIN\n  -- Create tsquery for English\n  BEGIN\n    v_tsquery_en := plainto_tsquery('english', p_query);\n  EXCEPTION WHEN OTHERS THEN\n    v_tsquery_en := plainto_tsquery('simple', p_query);\n  END;\n\n  -- Create tsquery for Arabic/simple\n  v_tsquery_ar := plainto_tsquery('simple', p_query);\n\n  RETURN QUERY\n  SELECT\n    dtc.document_id,\n    dtc.document_table,\n    -- Get title from appropriate table (using actual column names)\n    COALESCE(\n      (SELECT d.title FROM documents d WHERE d.id = dtc.document_id AND dtc.document_table = 'documents'),\n      (SELECT a.file_name FROM attachments a WHERE a.id = dtc.document_id AND dtc.document_table = 'attachments')\n    ) AS title,\n    -- Generate snippet based on language\n    CASE\n      WHEN p_language = 'en' OR p_language = 'all' THEN\n        ts_headline('english', COALESCE(dtc.extracted_text_en, ''), v_tsquery_en,\n          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')\n      WHEN p_language = 'ar' THEN\n        ts_headline('simple', COALESCE(dtc.extracted_text_ar, ''), v_tsquery_ar,\n          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')\n      ELSE ''\n    END AS snippet,\n    -- Calculate rank score\n    CASE\n      WHEN p_language = 'en' THEN\n        ts_rank_cd(dtc.search_vector_en, v_tsquery_en)\n      WHEN p_language = 'ar' THEN\n        ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar)\n      ELSE\n        GREATEST(\n          COALESCE(ts_rank_cd(dtc.search_vector_en, v_tsquery_en), 0),\n          COALESCE(ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar), 0)\n        )\n    END AS rank_score,\n    dtc.ocr_confidence,\n    dtc.language_detected,\n    dtc.created_at\n  FROM document_text_content dtc\n  WHERE\n    dtc.ocr_status = 'completed'\n    AND (p_min_confidence = 0 OR dtc.ocr_confidence >= p_min_confidence)\n    AND (\n      CASE\n        WHEN p_language = 'en' THEN dtc.search_vector_en @@ v_tsquery_en\n        WHEN p_language = 'ar' THEN dtc.search_vector_ar @@ v_tsquery_ar\n        ELSE dtc.search_vector_combined @@ (v_tsquery_en || v_tsquery_ar)\n      END\n    )\n  ORDER BY rank_score DESC, dtc.created_at DESC\n  LIMIT p_limit OFFSET p_offset;\nEND;\n$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;\n\n-- Also fix get_ocr_processing_queue to match actual schema\nCREATE OR REPLACE FUNCTION get_ocr_processing_queue(\n p_limit INTEGER DEFAULT 10,\n p_max_retries INTEGER DEFAULT 3\n)\nRETURNS TABLE (\n document_id UUID,\n document_table TEXT,\n storage_path TEXT,\n mime_type TEXT,\n retry_count INTEGER\n) AS $$\nBEGIN\n  RETURN QUERY\n  -- Get pending documents from attachments table (using file_key as storage_path, mime_type column)\n  SELECT\n    a.id AS document_id,\n    'attachments'::TEXT AS document_table,\n    a.file_key AS storage_path,\n    a.mime_type AS mime_type,\n    COALESCE(dtc.retry_count, 0) AS retry_count\n  FROM attachments a\n  LEFT JOIN document_text_content dtc ON dtc.document_id = a.id AND dtc.document_table = 'attachments'\n  WHERE\n    (dtc.id IS NULL OR dtc.ocr_status IN ('pending', 'failed'))\n    AND COALESCE(dtc.retry_count, 0) < p_max_retries\n    AND a.mime_type IN (\n      'application/pdf',\n      'image/png',\n      'image/jpeg',\n      'image/jpg',\n      'image/tiff',\n      'image/bmp'\n    )\n\n  UNION ALL\n\n  -- Get pending documents from documents table (using file_info jsonb for storage info)\n  SELECT\n    d.id AS document_id,\n    'documents'::TEXT AS document_table,\n    d.file_info->>'storage_path' AS storage_path,\n    d.file_info->>'mime_type' AS mime_type,\n    COALESCE(dtc.retry_count, 0) AS retry_count\n  FROM documents d\n  LEFT JOIN document_text_content dtc ON dtc.document_id = d.id AND dtc.document_table = 'documents'\n  WHERE\n    (dtc.id IS NULL OR dtc.ocr_status IN ('pending', 'failed'))\n    AND COALESCE(dtc.retry_count, 0) < p_max_retries\n    AND d.file_info->>'mime_type' IN (\n      'application/pdf',\n      'image/png',\n      'image/jpeg',\n      'image/jpg',\n      'image/tiff',\n      'image/bmp'\n    )\n\n  ORDER BY retry_count ASC\n  LIMIT p_limit;\nEND;\n$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;\n\nCOMMENT ON FUNCTION search_documents_content IS 'Full-text search across OCR-extracted document content with bilingual support';\nCOMMENT ON FUNCTION get_ocr_processing_queue IS 'Get queue of documents pending OCR processing';"
}

🔧 Tool: Bash
Input: {
"command": "npx playwright test tests/e2e/document-ocr-verification.spec.ts --project=chromium 2>&1",
"description": "Run Playwright OCR verification tests",
"timeout": 180000
}

🔧 Tool: Read
Input: {
"file_path": "/tmp/claude/-Users-khalidalzahrani-Library-CloudStorage-OneDrive-Personal-coding-Intl-DossierV2-0/tasks/bb442cf.output"
}

🔧 Tool: Bash
Input: {
"command": "pkill -f \"playwright.\*html-reporter\" 2>/dev/null; echo \"stopped\"",
"description": "Stop Playwright HTML reporter"
}
The tests still show 2 failures with 500 errors. Let me check the Edge Function logs to understand what's happening:

🔧 Tool: mcp**supabase**get_logs
Input: {
"project_id": "zkrcjzdemdmwhearthfgg",
"service": "edge-function"
}

🔧 Tool: mcp**supabase**get_logs
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"service": "edge-function"
}
I can see the issue - the `document-content-search` function is still returning 500 errors. Let me read the Edge Function code to understand the issue:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/document-content-search/index.ts"
}
I can see two issues:

1. The Edge Function is still importing from `../_shared/cors.ts` (line 11) which causes the module not found error
2. The function queries `documents` table with columns like `title_en`, `title_ar` which don't exist (the table only has `title`)

Let me fix the Edge Function:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/document-content-search/index.ts",
"old_string": "import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\nimport { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\nimport { corsHeaders } from '../\_shared/cors.ts';",
"new_string": "import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\nimport { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\n\n// Inline CORS headers to avoid import issues\nconst corsHeaders = {\n 'Access-Control-Allow-Origin': '\*',\n 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',\n};"
}
Now let me fix the document metadata query that uses incorrect column names:

🔧 Tool: Edit
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/document-content-search/index.ts",
"old_string": " // Get document metadata based on table\n if (result.document_table === 'documents') {\n const { data: docData } = await supabase\n .from('documents')\n .select('title_en, title_ar, mime_type, file_size, storage_path, owner_type, owner_id')\n .eq('id', result.document_id)\n .single();\n\n if (docData) {\n metadata = docData;\n }\n } else if (result.document_table === 'attachments') {\n const { data: attData } = await supabase\n .from('attachments')\n .select('file_name, file_type, file_size, storage_path')\n .eq('id', result.document_id)\n .single();\n\n if (attData) {\n metadata = {\n title_en: attData.file_name,\n mime_type: attData.file_type,\n file_size: attData.file_size,\n storage_path: attData.storage_path,\n };\n }\n }",
"new_string": " // Get document metadata based on table\n if (result.document_table === 'documents') {\n const { data: docData } = await supabase\n .from('documents')\n .select('title, file_info, owner_type, owner_id')\n .eq('id', result.document_id)\n .single();\n\n if (docData) {\n const fileInfo = docData.file_info || {};\n metadata = {\n title_en: docData.title,\n mime_type: fileInfo.mime_type,\n file_size: fileInfo.size,\n storage_path: fileInfo.storage_path,\n owner_type: docData.owner_type,\n owner_id: docData.owner_id,\n };\n }\n } else if (result.document_table === 'attachments') {\n const { data: attData } = await supabase\n .from('attachments')\n .select('file_name, mime_type, file_size, file_key')\n .eq('id', result.document_id)\n .single();\n\n if (attData) {\n metadata = {\n title_en: attData.file_name,\n mime_type: attData.mime_type,\n file_size: attData.file_size,\n storage_path: attData.file_key,\n };\n }\n }"
}
Now let me redeploy the fixed Edge Function:

🔧 Tool: Read
Input: {
"file_path": "/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/document-content-search/index.ts"
}

🔧 Tool: mcp**supabase**deploy_edge_function
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "document-content-search",
"entrypoint_path": "index.ts",
"verify_jwt": true,
"files": [
{
"name": "index.ts",
"content": "/\*_\n _ Document Content Search Edge Function\n _ Feature: document-ocr-indexing\n _\n _ Performs full-text search across OCR-extracted document content\n _ Supports bilingual search (Arabic and English)\n _ Returns documents with ranked results and highlighted snippets\n _/\nimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\nimport { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\n\n// Inline CORS headers to avoid import issues\nconst corsHeaders = {\n 'Access-Control-Allow-Origin': '_',\n 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',\n};\n\n// Interfaces\ninterface SearchRequest {\n query: string;\n language?: 'en' | 'ar' | 'all';\n limit?: number;\n offset?: number;\n min_confidence?: number;\n owner_type?: string;\n owner_id?: string;\n}\n\ninterface SearchResult {\n document_id: string;\n document_table: string;\n title: string;\n title_ar?: string;\n snippet: string;\n rank_score: number;\n ocr_confidence: number;\n language_detected: string[];\n mime_type?: string;\n file_size?: number;\n storage_path?: string;\n created_at: string;\n owner_type?: string;\n owner_id?: string;\n}\n\ninterface SearchResponse {\n results: SearchResult[];\n total_count: number;\n query: string;\n language: string;\n processing_time_ms: number;\n}\n\nserve(async (req) => {\n // Handle CORS preflight\n if (req.method === 'OPTIONS') {\n return new Response('ok', { headers: corsHeaders });\n }\n\n const startTime = Date.now();\n\n try {\n // Create Supabase client\n const supabase = createClient(\n Deno.env.get('SUPABASE_URL') ?? '',\n Deno.env.get('SUPABASE_ANON_KEY') ?? '',\n {\n global: {\n headers: { Authorization: req.headers.get('Authorization')! },\n },\n }\n );\n\n // Verify authentication\n const {\n data: { user },\n error: authError,\n } = await supabase.auth.getUser();\n\n if (authError || !user) {\n return new Response(\n JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),\n {\n status: 401,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n // Parse request based on method\n let searchParams: SearchRequest;\n\n if (req.method === 'GET') {\n const url = new URL(req.url);\n searchParams = {\n query: url.searchParams.get('query') || '',\n language: (url.searchParams.get('language') as 'en' | 'ar' | 'all') || 'all',\n limit: parseInt(url.searchParams.get('limit') || '20', 10),\n offset: parseInt(url.searchParams.get('offset') || '0', 10),\n min_confidence: parseFloat(url.searchParams.get('min_confidence') || '0'),\n owner_type: url.searchParams.get('owner_type') || undefined,\n owner_id: url.searchParams.get('owner_id') || undefined,\n };\n } else if (req.method === 'POST') {\n searchParams = await req.json();\n } else {\n return new Response(JSON.stringify({ error: 'method_not_allowed' }), {\n status: 405,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n }\n\n // Validate query\n if (!searchParams.query || searchParams.query.trim().length < 2) {\n return new Response(\n JSON.stringify({\n error: 'validation_error',\n message: 'Search query must be at least 2 characters',\n }),\n {\n status: 400,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n\n // Set defaults\n const query = searchParams.query.trim();\n const language = searchParams.language || 'all';\n const limit = Math.min(searchParams.limit || 20, 100);\n const offset = searchParams.offset || 0;\n const minConfidence = searchParams.min_confidence || 0;\n\n // Call the search function\n const { data: searchResults, error: searchError } = await supabase.rpc(\n 'search_documents_content',\n {\n p_query: query,\n p_language: language,\n p_limit: limit,\n p_offset: offset,\n p_min_confidence: minConfidence,\n }\n );\n\n if (searchError) {\n console.error('Search error:', searchError);\n throw new Error(`Search failed: ${searchError.message}`);\n }\n\n // Enrich results with document metadata\n const enrichedResults: SearchResult[] = [];\n\n for (const result of searchResults || []) {\n let metadata: Record<string, any> = {};\n\n // Get document metadata based on table\n if (result.document_table === 'documents') {\n const { data: docData } = await supabase\n .from('documents')\n .select('title, file_info, owner_type, owner_id')\n .eq('id', result.document_id)\n .single();\n\n if (docData) {\n const fileInfo = docData.file_info || {};\n metadata = {\n title_en: docData.title,\n mime_type: fileInfo.mime_type,\n file_size: fileInfo.size,\n storage_path: fileInfo.storage_path,\n owner_type: docData.owner_type,\n owner_id: docData.owner_id,\n };\n }\n } else if (result.document_table === 'attachments') {\n const { data: attData } = await supabase\n .from('attachments')\n .select('file_name, mime_type, file_size, file_key')\n .eq('id', result.document_id)\n .single();\n\n if (attData) {\n metadata = {\n title_en: attData.file_name,\n mime_type: attData.mime_type,\n file_size: attData.file_size,\n storage_path: attData.file_key,\n };\n }\n }\n\n // Apply owner filters if specified\n if (searchParams.owner_type && metadata.owner_type !== searchParams.owner_type) {\n continue;\n }\n if (searchParams.owner_id && metadata.owner_id !== searchParams.owner_id) {\n continue;\n }\n\n enrichedResults.push({\n document_id: result.document_id,\n document_table: result.document_table,\n title: result.title || metadata.title_en || 'Untitled',\n title_ar: metadata.title_ar,\n snippet: result.snippet || '',\n rank_score: result.rank_score,\n ocr_confidence: result.ocr_confidence,\n language_detected: result.language_detected || [],\n mime_type: metadata.mime_type,\n file_size: metadata.file_size,\n storage_path: metadata.storage_path,\n created_at: result.created_at,\n owner_type: metadata.owner_type,\n owner_id: metadata.owner_id,\n });\n }\n\n // Get total count for pagination\n const { count: totalCount } = await supabase\n .from('document_text_content')\n .select('_', { count: 'exact', head: true })\n .eq('ocr_status', 'completed')\n .gte('ocr_confidence', minConfidence);\n\n const processingTime = Date.now() - startTime;\n\n const response: SearchResponse = {\n results: enrichedResults,\n total_count: totalCount || enrichedResults.length,\n query,\n language,\n processing_time_ms: processingTime,\n };\n\n return new Response(JSON.stringify(response), {\n status: 200,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n });\n } catch (error) {\n console.error('Document search error:', error);\n\n return new Response(\n JSON.stringify({\n error: 'internal_error',\n message: error instanceof Error ? error.message : 'Internal server error',\n }),\n {\n status: 500,\n headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n }\n );\n }\n});\n"
}
]
}
Edge Function deployed. Now let me run the tests again:

🔧 Tool: Bash
Input: {
"command": "npx playwright test tests/e2e/document-ocr-verification.spec.ts --project=chromium 2>&1 | head -80",
"description": "Run Playwright OCR verification tests",
"timeout": 180000
}

🔧 Tool: TaskOutput
Input: {
"task_id": "be796d2",
"block": true,
"timeout": 120000
}

🔧 Tool: Read
Input: {
"file_path": "/tmp/claude/-Users-khalidalzahrani-Library-CloudStorage-OneDrive-Personal-coding-Intl-DossierV2-0/tasks/be796d2.output"
}

🔧 Tool: Bash
Input: {
"command": "pkill -f playwright 2>/dev/null; sleep 2; npx playwright test tests/e2e/document-ocr-verification.spec.ts --project=chromium --reporter=list 2>&1 | tail -80",
"description": "Run Playwright tests with list reporter",
"timeout": 180000
}
The tests are still failing. Let me check the latest Edge Function logs to see the actual error:

🔧 Tool: mcp**supabase**get_logs
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"service": "edge-function"
}
The logs show that the `document-content-search` Edge Function is now at version 2 but still returning 500 errors. The error message must be coming from the RPC call. Let me check the `search_documents_content` function directly:

🔧 Tool: mcp**supabase**execute_sql
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"query": "SELECT search_documents_content('test', 'all', 5, 0, 0);"
}
The error shows that the function has a type mismatch - the `title` column in the `documents` table is `character varying` but the function expects `text`. Let me fix this:

🔧 Tool: mcp**supabase**apply_migration
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"name": "fix_search_documents_content_type_cast",
"query": "-- Fix search_documents_content function with proper type casting\n-- The documents.title is varchar but the function expects text\n\nCREATE OR REPLACE FUNCTION search_documents_content(\n p_query TEXT,\n p_language TEXT DEFAULT 'all',\n p_limit INTEGER DEFAULT 20,\n p_offset INTEGER DEFAULT 0,\n p_min_confidence REAL DEFAULT 0\n)\nRETURNS TABLE (\n document_id UUID,\n document_table TEXT,\n title TEXT,\n snippet TEXT,\n rank_score REAL,\n ocr_confidence REAL,\n language_detected TEXT[],\n created_at TIMESTAMPTZ\n)\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n  v_tsquery_en TSQUERY;\n  v_tsquery_ar TSQUERY;\nBEGIN\n  -- Create search queries for both languages\n  v_tsquery_en := plainto_tsquery('english', p_query);\n  v_tsquery_ar := plainto_tsquery('simple', p_query);\n  \n  RETURN QUERY\n  SELECT\n    dtc.document_id,\n    dtc.document_table,\n    -- Get title with explicit TEXT cast\n    COALESCE(\n      (SELECT d.title::TEXT FROM documents d WHERE d.id = dtc.document_id AND dtc.document_table = 'documents'),\n      (SELECT a.file_name::TEXT FROM attachments a WHERE a.id = dtc.document_id AND dtc.document_table = 'attachments')\n    ) AS title,\n    -- Generate snippet based on language\n    CASE\n      WHEN p_language = 'en' OR p_language = 'all' THEN\n        ts_headline('english', COALESCE(dtc.extracted_text_en, ''), v_tsquery_en,\n          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')\n      WHEN p_language = 'ar' THEN\n        ts_headline('simple', COALESCE(dtc.extracted_text_ar, ''), v_tsquery_ar,\n          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')\n      ELSE ''\n    END AS snippet,\n    -- Calculate rank score\n    CASE\n      WHEN p_language = 'en' THEN\n        ts_rank_cd(dtc.search_vector_en, v_tsquery_en)\n      WHEN p_language = 'ar' THEN\n        ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar)\n      ELSE\n        GREATEST(\n          COALESCE(ts_rank_cd(dtc.search_vector_en, v_tsquery_en), 0),\n          COALESCE(ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar), 0)\n        )\n    END AS rank_score,\n    dtc.ocr_confidence,\n    dtc.language_detected,\n    dtc.created_at\n  FROM document_text_content dtc\n  WHERE\n    dtc.ocr_status = 'completed'\n    AND (p_min_confidence = 0 OR dtc.ocr_confidence >= p_min_confidence)\n    AND (\n      CASE\n        WHEN p_language = 'en' THEN dtc.search_vector_en @@ v_tsquery_en\n        WHEN p_language = 'ar' THEN dtc.search_vector_ar @@ v_tsquery_ar\n        ELSE dtc.search_vector_combined @@ (v_tsquery_en || v_tsquery_ar)\n      END\n    )\n  ORDER BY rank_score DESC, dtc.created_at DESC\n  LIMIT p_limit OFFSET p_offset;\nEND;\n$$;"
}
Migration applied. Now let me verify the function works:

🔧 Tool: mcp**supabase**execute_sql
Input: {
"project_id": "zkrcjzdemdmwhearhfgg",
"query": "SELECT \* FROM search_documents_content('test', 'all', 5, 0, 0);"
}
The function now works (returns empty array as expected since there's no OCR-processed data yet). Let me run the tests again:

🔧 Tool: Bash
Input: {
"command": "npx playwright test tests/e2e/document-ocr-verification.spec.ts --project=chromium --reporter=list 2>&1",
"description": "Run Playwright OCR verification tests",
"timeout": 180000
}
All 7 tests passed. Now let me update the todo list and delete the temporary verification test file as instructed:

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "completed",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Apply OCR migration to database",
"status": "completed",
"activeForm": "Applying OCR migration to database"
},
{
"content": "Register i18n namespaces for document-ocr",
"status": "completed",
"activeForm": "Registering i18n namespaces for document-ocr"
},
{
"content": "Deploy Edge Functions",
"status": "completed",
"activeForm": "Deploying Edge Functions"
},
{
"content": "Verify feature with Playwright test",
"status": "completed",
"activeForm": "Verifying feature with Playwright test"
},
{
"content": "Delete temporary verification test file",
"status": "in_progress",
"activeForm": "Deleting temporary verification test file"
}
]
}

🔧 Tool: Bash
Input: {
"command": "rm /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/tests/e2e/document-ocr-verification.spec.ts && echo \"Deleted verification test file\"",
"description": "Delete temporary verification test file"
}

🔧 Tool: TodoWrite
Input: {
"todos": [
{
"content": "Review existing OCR implementation progress",
"status": "completed",
"activeForm": "Reviewing existing OCR implementation progress"
},
{
"content": "Check database migrations for OCR tables",
"status": "completed",
"activeForm": "Checking database migrations for OCR tables"
},
{
"content": "Review Edge Function implementation",
"status": "completed",
"activeForm": "Reviewing Edge Function implementation"
},
{
"content": "Review frontend OCR components and hooks",
"status": "completed",
"activeForm": "Reviewing frontend OCR components and hooks"
},
{
"content": "Apply OCR migration to database",
"status": "completed",
"activeForm": "Applying OCR migration to database"
},
{
"content": "Register i18n namespaces for document-ocr",
"status": "completed",
"activeForm": "Registering i18n namespaces for document-ocr"
},
{
"content": "Deploy Edge Functions",
"status": "completed",
"activeForm": "Deploying Edge Functions"
},
{
"content": "Verify feature with Playwright test",
"status": "completed",
"activeForm": "Verifying feature with Playwright test"
},
{
"content": "Delete temporary verification test file",
"status": "completed",
"activeForm": "Deleting temporary verification test file"
}
]
}

<summary>
## Document OCR Indexing Feature - Implementation Complete

### Feature: `document-ocr-indexing`

The Document OCR Indexing feature has been successfully implemented and verified. This feature integrates OCR (Optical Character Recognition) for scanned PDFs and images, enabling full-text search within uploaded documents with bilingual support (Arabic and English).

### What Was Implemented

#### Database (PostgreSQL)

- **Table**: `document_text_content` - Stores extracted text with separate columns for English (`extracted_text_en`) and Arabic (`extracted_text_ar`) content
- **Full-text search vectors**: `search_vector_en`, `search_vector_ar`, and `search_vector_combined` for efficient text search
- **Enum**: `ocr_status_enum` for tracking processing status (`pending`, `processing`, `completed`, `failed`, `skipped`)
- **RPC Functions**:
  - `search_documents_content()` - Performs bilingual full-text search with ranked results
  - `get_ocr_processing_queue()` - Returns documents pending OCR processing
  - `update_ocr_status()` - Updates OCR processing status
- **RLS Policies**: Read/write access restricted to authenticated users

#### Edge Functions (Deployed)

1. **`document-ocr-process`** (v1) - Handles OCR processing requests:
   - GET: Check OCR status for a document
   - POST: Trigger OCR processing for a document
   - Supports Google Vision API for cloud OCR

2. **`document-content-search`** (v2) - Performs document content search:
   - Full-text search across all OCR-extracted content
   - Bilingual support (English, Arabic, or both)
   - Configurable minimum confidence filtering
   - Returns ranked results with highlighted snippets

#### Frontend

- **Hooks**: `useDocumentOCR.ts`, `useDocumentContentSearch.ts` - React Query hooks for OCR and search operations
- **i18n**: Bilingual translations registered in `document-ocr.json` (EN/AR)

### Migrations Applied

1. `20260110600001_document_ocr_indexing.sql` - Initial OCR schema
2. `fix_document_ocr_search_function` - Fixed column reference mismatches
3. `fix_search_documents_content_type_cast` - Fixed varchar to text type casting

### Verification Results

All 7 Playwright E2E tests passed:

- ✅ Database table and RPC functions accessible
- ✅ document-ocr-process Edge Function deployed
- ✅ document-content-search Edge Function deployed
- ✅ Bilingual search support (English/Arabic/All)
- ✅ Authentication enforcement (401 for unauthenticated)
- ✅ Query validation (minimum 2 characters)
- ✅ OCR status check for non-existent documents

### Files Modified

- `frontend/src/i18n/index.ts` - Added document-ocr namespace
- `supabase/functions/document-content-search/index.ts` - Fixed CORS headers and column references

The temporary verification test file has been deleted as requested.

</summary>
