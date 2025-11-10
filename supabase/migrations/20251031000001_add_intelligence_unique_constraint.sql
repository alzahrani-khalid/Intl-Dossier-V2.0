-- Migration: Add unique constraint for intelligence_reports
-- Purpose: Enable proper UPSERT behavior for intelligence refresh operations
-- Feature: 029-dynamic-country-intelligence
-- Date: 2025-10-31
-- Issue: Intelligence refresh fails because onConflict clause requires unique constraint

-- Add unique constraint on entity_id and intelligence_type
-- This ensures only one intelligence report per entity per type
-- and enables UPSERT operations to work correctly
ALTER TABLE intelligence_reports
ADD CONSTRAINT unique_intelligence_entity_type 
  UNIQUE (entity_id, intelligence_type)
  WHERE entity_id IS NOT NULL AND archived_at IS NULL;

COMMENT ON CONSTRAINT unique_intelligence_entity_type ON intelligence_reports IS 
  'Ensures uniqueness of active intelligence reports per entity and type, enabling proper UPSERT operations';













