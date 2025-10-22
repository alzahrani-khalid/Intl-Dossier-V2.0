-- Migration: Create intake_entity_links table
-- Feature: 024-intake-entity-linking
-- Task: T008

CREATE TABLE IF NOT EXISTS intake_entity_links (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,

  -- Polymorphic relationship
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'dossier', 'position', 'mou', 'engagement', 'assignment',
    'commitment', 'intelligence_signal', 'organization',
    'country', 'forum', 'working_group', 'topic'
  )),
  entity_id UUID NOT NULL,

  -- Link metadata
  link_type TEXT NOT NULL CHECK (link_type IN ('primary', 'related', 'requested', 'mentioned', 'assigned_to')),
  source TEXT NOT NULL DEFAULT 'human' CHECK (source IN ('human', 'ai', 'import')),
  confidence NUMERIC(3, 2) CHECK (confidence >= 0.00 AND confidence <= 1.00), -- Nullable, only for AI suggestions
  notes TEXT, -- Optional user-provided context (max 1000 chars validated at app layer)

  -- Ordering
  link_order INTEGER NOT NULL DEFAULT 0, -- For user-defined prioritization

  -- Provenance
  suggested_by UUID REFERENCES profiles(id), -- User who created AI suggestion (nullable)
  linked_by UUID NOT NULL REFERENCES profiles(id), -- User who created/accepted the link

  -- Optimistic locking (T041a)
  _version INTEGER NOT NULL DEFAULT 1,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete timestamp

  -- Validation: link type rules (enforced at application layer for flexibility)
  CONSTRAINT valid_primary_link_entity CHECK (
    link_type != 'primary' OR entity_type IN ('dossier', 'country', 'organization', 'forum', 'topic')
  ),
  CONSTRAINT valid_assigned_to_link_entity CHECK (
    link_type != 'assigned_to' OR entity_type = 'assignment'
  ),
  CONSTRAINT valid_requested_link_entity CHECK (
    link_type != 'requested' OR entity_type IN ('position', 'mou', 'engagement')
  )
);

-- Add comment to table
COMMENT ON TABLE intake_entity_links IS 'Polymorphic junction table linking intake tickets to 11 different entity types with typed relationships';
COMMENT ON COLUMN intake_entity_links.notes IS 'Optional user-provided context (max 1000 chars validated at application layer)';
COMMENT ON COLUMN intake_entity_links._version IS 'Optimistic locking version number - incremented on each update';
