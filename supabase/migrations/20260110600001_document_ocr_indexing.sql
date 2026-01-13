-- Migration: Document OCR Indexing
-- Feature: document-ocr-indexing
-- Description: Adds OCR text extraction storage and full-text search for scanned PDFs and images
-- Supports Arabic and English text recognition

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum for OCR processing status
DO $$ BEGIN
  CREATE TYPE ocr_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for OCR method used
DO $$ BEGIN
  CREATE TYPE ocr_method AS ENUM ('tesseract', 'google_vision', 'pdf_extract', 'native_text');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create document_text_content table for storing extracted text
CREATE TABLE IF NOT EXISTS document_text_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the document (polymorphic - can be attachment or documents table)
  document_id UUID NOT NULL,
  document_table TEXT NOT NULL CHECK (document_table IN ('attachments', 'documents')),

  -- Extracted content
  extracted_text_en TEXT, -- Extracted English text
  extracted_text_ar TEXT, -- Extracted Arabic text
  raw_text TEXT, -- Original unprocessed text

  -- Processing metadata
  ocr_status ocr_processing_status NOT NULL DEFAULT 'pending',
  ocr_method ocr_method,
  ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100),
  language_detected TEXT[], -- Array of detected languages (e.g., ['en', 'ar'])

  -- Full-text search vectors (bilingual support)
  search_vector_en TSVECTOR,
  search_vector_ar TSVECTOR,
  search_vector_combined TSVECTOR, -- Combined for cross-language search

  -- Page-level extraction for PDFs
  page_count INTEGER,
  page_texts JSONB DEFAULT '[]'::jsonb, -- Array of {page: number, text: string, confidence: number}

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,

  -- Unique constraint to prevent duplicate processing
  CONSTRAINT unique_document_content UNIQUE (document_id, document_table)
);

-- Add comments for documentation
COMMENT ON TABLE document_text_content IS 'Stores OCR-extracted text from documents for full-text search';
COMMENT ON COLUMN document_text_content.document_id IS 'Reference to the source document (attachment or document)';
COMMENT ON COLUMN document_text_content.document_table IS 'Table name where the document record exists';
COMMENT ON COLUMN document_text_content.extracted_text_en IS 'Cleaned English text extracted from document';
COMMENT ON COLUMN document_text_content.extracted_text_ar IS 'Cleaned Arabic text extracted from document';
COMMENT ON COLUMN document_text_content.raw_text IS 'Original unprocessed OCR output';
COMMENT ON COLUMN document_text_content.search_vector_en IS 'PostgreSQL tsvector for English full-text search';
COMMENT ON COLUMN document_text_content.search_vector_ar IS 'PostgreSQL tsvector for Arabic full-text search';
COMMENT ON COLUMN document_text_content.page_texts IS 'Page-by-page extracted text for multi-page documents';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_doc_text_content_document ON document_text_content(document_id, document_table);
CREATE INDEX IF NOT EXISTS idx_doc_text_content_status ON document_text_content(ocr_status);
CREATE INDEX IF NOT EXISTS idx_doc_text_content_created ON document_text_content(created_at DESC);

-- GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_doc_text_search_en ON document_text_content USING GIN(search_vector_en);
CREATE INDEX IF NOT EXISTS idx_doc_text_search_ar ON document_text_content USING GIN(search_vector_ar);
CREATE INDEX IF NOT EXISTS idx_doc_text_search_combined ON document_text_content USING GIN(search_vector_combined);

-- Trigram index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_doc_text_trigram_en ON document_text_content USING GIN(extracted_text_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_doc_text_trigram_ar ON document_text_content USING GIN(extracted_text_ar gin_trgm_ops);

-- Function to automatically update search vectors
CREATE OR REPLACE FUNCTION update_document_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
  -- Update English search vector
  IF NEW.extracted_text_en IS NOT NULL AND NEW.extracted_text_en != '' THEN
    NEW.search_vector_en := to_tsvector('english', NEW.extracted_text_en);
  ELSE
    NEW.search_vector_en := NULL;
  END IF;

  -- Update Arabic search vector (using simple config as Arabic isn't built-in)
  IF NEW.extracted_text_ar IS NOT NULL AND NEW.extracted_text_ar != '' THEN
    NEW.search_vector_ar := to_tsvector('simple', NEW.extracted_text_ar);
  ELSE
    NEW.search_vector_ar := NULL;
  END IF;

  -- Update combined search vector
  NEW.search_vector_combined := COALESCE(NEW.search_vector_en, ''::tsvector) ||
                                 COALESCE(NEW.search_vector_ar, ''::tsvector);

  -- Update timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS trigger_update_doc_search_vectors ON document_text_content;
CREATE TRIGGER trigger_update_doc_search_vectors
  BEFORE INSERT OR UPDATE OF extracted_text_en, extracted_text_ar
  ON document_text_content
  FOR EACH ROW
  EXECUTE FUNCTION update_document_search_vectors();

-- Function to search documents by text content
CREATE OR REPLACE FUNCTION search_documents_content(
  p_query TEXT,
  p_language TEXT DEFAULT 'all', -- 'en', 'ar', or 'all'
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_min_confidence REAL DEFAULT 0
)
RETURNS TABLE (
  document_id UUID,
  document_table TEXT,
  title TEXT,
  snippet TEXT,
  rank_score REAL,
  ocr_confidence REAL,
  language_detected TEXT[],
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_tsquery_en TSQUERY;
  v_tsquery_ar TSQUERY;
BEGIN
  -- Create tsquery for English
  BEGIN
    v_tsquery_en := plainto_tsquery('english', p_query);
  EXCEPTION WHEN OTHERS THEN
    v_tsquery_en := plainto_tsquery('simple', p_query);
  END;

  -- Create tsquery for Arabic/simple
  v_tsquery_ar := plainto_tsquery('simple', p_query);

  RETURN QUERY
  SELECT
    dtc.document_id,
    dtc.document_table,
    -- Get title from appropriate table
    COALESCE(
      (SELECT COALESCE(d.title_en, d.title_ar) FROM documents d WHERE d.id = dtc.document_id AND dtc.document_table = 'documents'),
      (SELECT a.file_name FROM attachments a WHERE a.id = dtc.document_id AND dtc.document_table = 'attachments')
    ) AS title,
    -- Generate snippet based on language
    CASE
      WHEN p_language = 'en' OR p_language = 'all' THEN
        ts_headline('english', COALESCE(dtc.extracted_text_en, ''), v_tsquery_en,
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')
      WHEN p_language = 'ar' THEN
        ts_headline('simple', COALESCE(dtc.extracted_text_ar, ''), v_tsquery_ar,
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15')
      ELSE ''
    END AS snippet,
    -- Calculate rank score
    CASE
      WHEN p_language = 'en' THEN
        ts_rank_cd(dtc.search_vector_en, v_tsquery_en)
      WHEN p_language = 'ar' THEN
        ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar)
      ELSE
        GREATEST(
          COALESCE(ts_rank_cd(dtc.search_vector_en, v_tsquery_en), 0),
          COALESCE(ts_rank_cd(dtc.search_vector_ar, v_tsquery_ar), 0)
        )
    END AS rank_score,
    dtc.ocr_confidence,
    dtc.language_detected,
    dtc.created_at
  FROM document_text_content dtc
  WHERE
    dtc.ocr_status = 'completed'
    AND (p_min_confidence = 0 OR dtc.ocr_confidence >= p_min_confidence)
    AND (
      CASE
        WHEN p_language = 'en' THEN dtc.search_vector_en @@ v_tsquery_en
        WHEN p_language = 'ar' THEN dtc.search_vector_ar @@ v_tsquery_ar
        ELSE dtc.search_vector_combined @@ (v_tsquery_en || v_tsquery_ar)
      END
    )
  ORDER BY rank_score DESC, dtc.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get OCR processing queue (for background processing)
CREATE OR REPLACE FUNCTION get_ocr_processing_queue(
  p_limit INTEGER DEFAULT 10,
  p_max_retries INTEGER DEFAULT 3
)
RETURNS TABLE (
  document_id UUID,
  document_table TEXT,
  storage_path TEXT,
  mime_type TEXT,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  -- Get pending documents from attachments table
  SELECT
    a.id AS document_id,
    'attachments'::TEXT AS document_table,
    a.storage_path,
    a.file_type AS mime_type,
    COALESCE(dtc.retry_count, 0) AS retry_count
  FROM attachments a
  LEFT JOIN document_text_content dtc ON dtc.document_id = a.id AND dtc.document_table = 'attachments'
  WHERE
    (dtc.id IS NULL OR dtc.ocr_status IN ('pending', 'failed'))
    AND COALESCE(dtc.retry_count, 0) < p_max_retries
    AND a.file_type IN (
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/bmp'
    )

  UNION ALL

  -- Get pending documents from documents table
  SELECT
    d.id AS document_id,
    'documents'::TEXT AS document_table,
    d.storage_path,
    d.mime_type,
    COALESCE(dtc.retry_count, 0) AS retry_count
  FROM documents d
  LEFT JOIN document_text_content dtc ON dtc.document_id = d.id AND dtc.document_table = 'documents'
  WHERE
    (dtc.id IS NULL OR dtc.ocr_status IN ('pending', 'failed'))
    AND COALESCE(dtc.retry_count, 0) < p_max_retries
    AND d.mime_type IN (
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/bmp'
    )

  ORDER BY retry_count ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to update OCR status
CREATE OR REPLACE FUNCTION update_ocr_status(
  p_document_id UUID,
  p_document_table TEXT,
  p_status ocr_processing_status,
  p_method ocr_method DEFAULT NULL,
  p_confidence REAL DEFAULT NULL,
  p_text_en TEXT DEFAULT NULL,
  p_text_ar TEXT DEFAULT NULL,
  p_raw_text TEXT DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_page_count INTEGER DEFAULT NULL,
  p_page_texts JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_processing_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO document_text_content (
    document_id,
    document_table,
    ocr_status,
    ocr_method,
    ocr_confidence,
    extracted_text_en,
    extracted_text_ar,
    raw_text,
    language_detected,
    page_count,
    page_texts,
    error_message,
    processing_time_ms,
    processed_at,
    retry_count,
    last_retry_at
  )
  VALUES (
    p_document_id,
    p_document_table,
    p_status,
    p_method,
    p_confidence,
    p_text_en,
    p_text_ar,
    p_raw_text,
    p_languages,
    p_page_count,
    COALESCE(p_page_texts, '[]'::jsonb),
    p_error_message,
    p_processing_time_ms,
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'failed' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (document_id, document_table) DO UPDATE SET
    ocr_status = p_status,
    ocr_method = COALESCE(p_method, document_text_content.ocr_method),
    ocr_confidence = COALESCE(p_confidence, document_text_content.ocr_confidence),
    extracted_text_en = COALESCE(p_text_en, document_text_content.extracted_text_en),
    extracted_text_ar = COALESCE(p_text_ar, document_text_content.extracted_text_ar),
    raw_text = COALESCE(p_raw_text, document_text_content.raw_text),
    language_detected = COALESCE(p_languages, document_text_content.language_detected),
    page_count = COALESCE(p_page_count, document_text_content.page_count),
    page_texts = COALESCE(p_page_texts, document_text_content.page_texts),
    error_message = p_error_message,
    processing_time_ms = COALESCE(p_processing_time_ms, document_text_content.processing_time_ms),
    processed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE document_text_content.processed_at END,
    retry_count = CASE WHEN p_status = 'failed' THEN document_text_content.retry_count + 1 ELSE document_text_content.retry_count END,
    last_retry_at = CASE WHEN p_status = 'failed' THEN NOW() ELSE document_text_content.last_retry_at END,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE document_text_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view text content for documents they have access to
CREATE POLICY "Users can view document text content"
  ON document_text_content
  FOR SELECT
  USING (
    -- Check if user has access to the source document
    EXISTS (
      SELECT 1 FROM attachments a
      WHERE a.id = document_text_content.document_id
        AND document_text_content.document_table = 'attachments'
    )
    OR
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_text_content.document_id
        AND document_text_content.document_table = 'documents'
    )
  );

-- Service role can insert/update (for OCR processing)
CREATE POLICY "Service role can manage document text content"
  ON document_text_content
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Add comments for functions
COMMENT ON FUNCTION search_documents_content IS 'Full-text search across OCR-extracted document content with bilingual support';
COMMENT ON FUNCTION get_ocr_processing_queue IS 'Get queue of documents pending OCR processing';
COMMENT ON FUNCTION update_ocr_status IS 'Update OCR processing status and extracted text for a document';
