-- Migration: 005_create_duplicate_tables
-- Description: Create tables for duplicate detection and management
-- Date: 2025-01-29

-- Create enum for duplicate status
CREATE TYPE duplicate_status AS ENUM ('pending', 'confirmed_duplicate', 'not_duplicate', 'merged');

-- Create the duplicate_candidates table
CREATE TABLE IF NOT EXISTS duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    target_ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    
    -- Similarity Scores
    overall_score NUMERIC(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    title_similarity NUMERIC(3,2) CHECK (title_similarity >= 0 AND title_similarity <= 1),
    content_similarity NUMERIC(3,2) CHECK (content_similarity >= 0 AND content_similarity <= 1),
    metadata_similarity NUMERIC(3,2) CHECK (metadata_similarity >= 0 AND metadata_similarity <= 1),
    
    -- Decision
    status duplicate_status NOT NULL DEFAULT 'pending',
    decision_reason TEXT,
    
    -- Metadata
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_by TEXT NOT NULL, -- 'ai' or user UUID
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    
    -- Prevent duplicate entries for the same pair
    CONSTRAINT unique_ticket_pair UNIQUE (source_ticket_id, target_ticket_id),
    -- Prevent self-reference
    CONSTRAINT different_tickets CHECK (source_ticket_id != target_ticket_id)
);

-- Function to calculate text similarity using trigrams
CREATE OR REPLACE FUNCTION calculate_text_similarity(
    text1 TEXT,
    text2 TEXT
) RETURNS NUMERIC AS $$
DECLARE
    similarity NUMERIC;
BEGIN
    -- Handle null or empty strings
    IF text1 IS NULL OR text2 IS NULL OR 
       LENGTH(TRIM(text1)) = 0 OR LENGTH(TRIM(text2)) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Use trigram similarity (requires pg_trgm extension)
    -- This will be enhanced with vector similarity when pgvector is set up
    SELECT similarity(LOWER(text1), LOWER(text2))::NUMERIC(3,2) INTO similarity;
    
    RETURN similarity;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate metadata similarity
CREATE OR REPLACE FUNCTION calculate_metadata_similarity(
    ticket1_id UUID,
    ticket2_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    t1 RECORD;
    t2 RECORD;
    similarity_score NUMERIC := 0;
    weight_count INTEGER := 0;
BEGIN
    -- Get ticket metadata
    SELECT request_type, sensitivity, urgency, priority, dossier_id
    INTO t1
    FROM intake_tickets
    WHERE id = ticket1_id;
    
    SELECT request_type, sensitivity, urgency, priority, dossier_id
    INTO t2
    FROM intake_tickets
    WHERE id = ticket2_id;
    
    -- Calculate weighted similarity
    IF t1.request_type = t2.request_type THEN
        similarity_score := similarity_score + 0.3;
    END IF;
    
    IF t1.sensitivity = t2.sensitivity THEN
        similarity_score := similarity_score + 0.2;
    END IF;
    
    IF t1.urgency = t2.urgency THEN
        similarity_score := similarity_score + 0.2;
    END IF;
    
    IF t1.priority = t2.priority THEN
        similarity_score := similarity_score + 0.1;
    END IF;
    
    IF t1.dossier_id IS NOT NULL AND t1.dossier_id = t2.dossier_id THEN
        similarity_score := similarity_score + 0.2;
    END IF;
    
    RETURN LEAST(similarity_score, 1.0)::NUMERIC(3,2);
END;
$$ LANGUAGE plpgsql;

-- Function to detect duplicates for a ticket
CREATE OR REPLACE FUNCTION detect_duplicate_tickets(
    p_ticket_id UUID,
    p_threshold NUMERIC DEFAULT 0.65
) RETURNS TABLE (
    candidate_id UUID,
    overall_score NUMERIC,
    title_score NUMERIC,
    content_score NUMERIC,
    metadata_score NUMERIC
) AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Get the source ticket
    SELECT id, title, title_ar, description, description_ar
    INTO v_ticket
    FROM intake_tickets
    WHERE id = p_ticket_id;
    
    -- Find similar tickets
    RETURN QUERY
    SELECT 
        t.id as candidate_id,
        (
            COALESCE(calculate_text_similarity(v_ticket.title, t.title) * 0.3, 0) +
            COALESCE(calculate_text_similarity(v_ticket.description, t.description) * 0.4, 0) +
            calculate_metadata_similarity(v_ticket.id, t.id) * 0.3
        )::NUMERIC(3,2) as overall_score,
        calculate_text_similarity(v_ticket.title, t.title) as title_score,
        calculate_text_similarity(v_ticket.description, t.description) as content_score,
        calculate_metadata_similarity(v_ticket.id, t.id) as metadata_score
    FROM intake_tickets t
    WHERE t.id != p_ticket_id
    AND t.status NOT IN ('merged', 'closed')
    AND t.created_at > NOW() - INTERVAL '30 days' -- Only check recent tickets
    AND (
        calculate_text_similarity(v_ticket.title, t.title) >= p_threshold OR
        calculate_text_similarity(v_ticket.description, t.description) >= p_threshold
    )
    ORDER BY overall_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to merge duplicate tickets
CREATE OR REPLACE FUNCTION merge_duplicate_tickets(
    p_primary_ticket_id UUID,
    p_duplicate_ticket_id UUID,
    p_user_id UUID,
    p_reason TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update the duplicate ticket
    UPDATE intake_tickets
    SET 
        status = 'merged'::ticket_status,
        parent_ticket_id = p_primary_ticket_id,
        resolution = p_reason,
        closed_at = NOW(),
        updated_by = p_user_id
    WHERE id = p_duplicate_ticket_id
    AND status NOT IN ('merged', 'closed');
    
    -- Move attachments to primary ticket
    UPDATE intake_attachments
    SET ticket_id = p_primary_ticket_id
    WHERE ticket_id = p_duplicate_ticket_id;
    
    -- Update duplicate candidate record
    UPDATE duplicate_candidates
    SET 
        status = 'merged'::duplicate_status,
        decision_reason = p_reason,
        resolved_at = NOW(),
        resolved_by = p_user_id
    WHERE (source_ticket_id = p_duplicate_ticket_id AND target_ticket_id = p_primary_ticket_id)
       OR (source_ticket_id = p_primary_ticket_id AND target_ticket_id = p_duplicate_ticket_id);
    
    -- Create audit log entry (will be created when audit table exists)
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX idx_duplicates_source ON duplicate_candidates(source_ticket_id, overall_score DESC);
CREATE INDEX idx_duplicates_target ON duplicate_candidates(target_ticket_id);
CREATE INDEX idx_duplicates_pending ON duplicate_candidates(status) WHERE status = 'pending';
CREATE INDEX idx_duplicates_score ON duplicate_candidates(overall_score DESC) WHERE status = 'pending';

-- Add comments
COMMENT ON TABLE duplicate_candidates IS 'Potential duplicate relationships between tickets';
COMMENT ON COLUMN duplicate_candidates.overall_score IS 'Composite similarity score (0-1)';
COMMENT ON COLUMN duplicate_candidates.detected_by IS 'ai for automatic detection or user UUID';
COMMENT ON FUNCTION detect_duplicate_tickets IS 'Find potential duplicate tickets using text and metadata similarity';
COMMENT ON FUNCTION merge_duplicate_tickets IS 'Merge a duplicate ticket into a primary ticket';