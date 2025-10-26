-- Migration: Create Dossier Relationships Table
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Universal relationship table for graph traversal

DROP TABLE IF EXISTS dossier_relationships CASCADE;
CREATE TABLE dossier_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  target_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  relationship_metadata JSONB DEFAULT '{}',
  notes_en TEXT,
  notes_ar TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'historical', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT no_self_reference CHECK (source_dossier_id != target_dossier_id),
  CONSTRAINT valid_temporal_range CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE dossier_relationships IS 'Universal relationship table enabling graph queries between any dossier types';
COMMENT ON COLUMN dossier_relationships.relationship_type IS 'Examples: bilateral_relation, membership, partnership, parent_of, subsidiary_of, discusses, involves, participant_in, hosted_by, sponsored_by, related_to, represents, member_of';
