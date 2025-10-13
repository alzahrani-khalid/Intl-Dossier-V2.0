-- Migration: Create delegations table with circular delegation prevention
-- Feature: 019-user-management-access
-- Task: T007
-- Date: 2025-10-11

CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegated_permissions TEXT[] NOT NULL,  -- Array of permission names
  source delegation_source DEFAULT 'manual',
  reason TEXT,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_delegation_different_users CHECK (grantor_id != grantee_id),
  CONSTRAINT chk_delegation_expiry CHECK (expires_at > starts_at),
  CONSTRAINT chk_delegation_not_empty CHECK (array_length(delegated_permissions, 1) > 0)
);

-- Create indexes
CREATE INDEX idx_delegations_grantor ON delegations(grantor_id);
CREATE INDEX idx_delegations_grantee ON delegations(grantee_id);
CREATE INDEX idx_delegations_expires_at ON delegations(expires_at);
CREATE INDEX idx_delegations_active ON delegations(grantor_id, grantee_id)
  WHERE revoked_at IS NULL AND expires_at > now();

-- Create unique index to prevent duplicate active delegations
CREATE UNIQUE INDEX idx_delegations_unique_active
  ON delegations(grantor_id, grantee_id)
  WHERE revoked_at IS NULL AND expires_at > now();

-- Function to check for circular delegation
CREATE OR REPLACE FUNCTION check_circular_delegation()
RETURNS TRIGGER AS $$
DECLARE
  delegation_chain UUID[];
  current_user UUID;
  max_depth INTEGER := 10;
  depth INTEGER := 0;
BEGIN
  -- Start with the grantee
  current_user := NEW.grantee_id;
  delegation_chain := ARRAY[NEW.grantor_id];

  -- Traverse delegation chain
  WHILE depth < max_depth LOOP
    depth := depth + 1;

    -- Check if current user has delegated to anyone in the chain
    IF EXISTS (
      SELECT 1 FROM delegations
      WHERE grantor_id = current_user
        AND grantee_id = ANY(delegation_chain)
        AND revoked_at IS NULL
        AND expires_at > now()
    ) THEN
      RAISE EXCEPTION 'Circular delegation detected: User % would create a delegation cycle', current_user;
    END IF;

    -- Check if there's a next delegation in the chain
    SELECT grantee_id INTO current_user
    FROM delegations
    WHERE grantor_id = current_user
      AND revoked_at IS NULL
      AND expires_at > now()
    LIMIT 1;

    -- If no more delegations, exit
    EXIT WHEN current_user IS NULL;

    -- Add to chain
    delegation_chain := array_append(delegation_chain, current_user);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for circular delegation prevention
CREATE TRIGGER trigger_check_circular_delegation
  BEFORE INSERT ON delegations
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_delegation();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_delegations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delegations_updated_at
  BEFORE UPDATE ON delegations
  FOR EACH ROW
  EXECUTE FUNCTION update_delegations_updated_at();

-- Add comments
COMMENT ON TABLE delegations IS 'Permission delegations between users with expiration and circular prevention';
COMMENT ON COLUMN delegations.grantor_id IS 'User who grants the delegation';
COMMENT ON COLUMN delegations.grantee_id IS 'User who receives the delegation';
COMMENT ON COLUMN delegations.delegated_permissions IS 'Array of permission names being delegated';
COMMENT ON COLUMN delegations.source IS 'Source of delegation (manual or automatic)';
COMMENT ON COLUMN delegations.reason IS 'Reason for delegation';
COMMENT ON COLUMN delegations.starts_at IS 'Delegation start timestamp';
COMMENT ON COLUMN delegations.expires_at IS 'Delegation expiration timestamp';
COMMENT ON COLUMN delegations.revoked_at IS 'Timestamp when delegation was revoked';
COMMENT ON COLUMN delegations.revoked_by IS 'User who revoked the delegation';
COMMENT ON COLUMN delegations.revocation_reason IS 'Reason for revocation';
