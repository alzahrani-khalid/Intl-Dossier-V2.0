-- Migration: Additional performance indexes for after-action tables
-- Purpose: Optimize query performance for common access patterns
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Note: Most indexes are already created in individual table migrations
-- This migration adds composite and specialized indexes for performance

-- ========================================
-- Composite indexes for common query patterns
-- ========================================

-- Query: List after-actions for dossier filtered by status and sorted by published_at
CREATE INDEX idx_after_action_dossier_status_published
    ON public.after_action_records (dossier_id, status, published_at DESC NULLS LAST);

-- Query: List commitments for dossier filtered by status and sorted by due_date
CREATE INDEX idx_commitments_dossier_status_due_date
    ON public.commitments (dossier_id, status, due_date);

-- Query: Find overdue commitments for a user
CREATE INDEX idx_commitments_internal_owner_overdue
    ON public.commitments (owner_internal_id, due_date)
    WHERE owner_type = 'internal' AND status = 'overdue';

-- Query: Find pending virus scans
CREATE INDEX idx_attachments_pending_scan_uploaded_at
    ON public.attachments (scan_status, uploaded_at)
    WHERE scan_status = 'pending';

-- Query: Search external contacts by email prefix
CREATE INDEX idx_external_contacts_email_prefix
    ON public.external_contacts (LOWER(email) text_pattern_ops);

-- ========================================
-- Partial indexes for filtered queries
-- ========================================

-- Published after-actions only
CREATE INDEX idx_after_action_published_only
    ON public.after_action_records (published_at DESC)
    WHERE status = 'published';

-- Edit pending after-actions only
CREATE INDEX idx_after_action_edit_pending_only
    ON public.after_action_records (edit_requested_at DESC)
    WHERE status = 'edit_pending';

-- Active commitments (not completed or cancelled)
CREATE INDEX idx_commitments_active
    ON public.commitments (due_date)
    WHERE status IN ('pending', 'in_progress', 'overdue');

-- AI-extracted entities with low confidence (<0.7)
CREATE INDEX idx_decisions_low_confidence
    ON public.decisions (confidence_score)
    WHERE ai_extracted = true AND confidence_score < 0.7;

CREATE INDEX idx_commitments_low_confidence
    ON public.commitments (confidence_score)
    WHERE ai_extracted = true AND confidence_score < 0.7;

CREATE INDEX idx_risks_low_confidence
    ON public.risks (confidence_score)
    WHERE ai_extracted = true AND confidence_score < 0.7;

-- ========================================
-- Full-text search indexes
-- ========================================

-- Enable pg_tsvector extension for full-text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search on after_action title and description
CREATE INDEX idx_after_action_title_trgm
    ON public.after_action_records USING gin (title gin_trgm_ops);

CREATE INDEX idx_after_action_description_trgm
    ON public.after_action_records USING gin (description gin_trgm_ops)
    WHERE description IS NOT NULL;

-- Full-text search on commitment descriptions
CREATE INDEX idx_commitments_description_trgm
    ON public.commitments USING gin (description gin_trgm_ops);

-- ========================================
-- Covering indexes for performance
-- ========================================

-- Cover common JOIN queries
CREATE INDEX idx_after_action_dossier_status_dates
    ON public.after_action_records (dossier_id, status, published_at, created_at)
    INCLUDE (title, confidentiality_level, created_by);

-- Cover commitment list queries
CREATE INDEX idx_commitments_after_action_status
    ON public.commitments (after_action_id, status, due_date)
    INCLUDE (description, priority, owner_type);

COMMENT ON INDEX idx_after_action_dossier_status_published IS 'Optimizes dossier after-action list queries with status filter and date sorting';
COMMENT ON INDEX idx_commitments_internal_owner_overdue IS 'Optimizes overdue commitment notifications for internal users';
COMMENT ON INDEX idx_attachments_pending_scan_uploaded_at IS 'Optimizes virus scanning queue processing (FIFO)';
