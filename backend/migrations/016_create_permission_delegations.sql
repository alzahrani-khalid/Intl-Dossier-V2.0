-- Create permission_delegations table
CREATE TABLE IF NOT EXISTS permission_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_id UUID NOT NULL REFERENCES users(id),
  grantee_id UUID NOT NULL REFERENCES users(id),
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('dossier', 'mou', 'all')),
  resource_id UUID,
  permissions TEXT[] NOT NULL CHECK (array_length(permissions, 1) > 0),
  reason TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure grantor != grantee
  CONSTRAINT different_users CHECK (grantor_id != grantee_id),
  -- Ensure valid_from < valid_until
  CONSTRAINT valid_date_range CHECK (valid_from < valid_until),
  -- Ensure revoked_at is set when revoked
  CONSTRAINT revoked_consistency CHECK (
    (revoked = FALSE AND revoked_at IS NULL AND revoked_by IS NULL) OR
    (revoked = TRUE AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_permission_delegations_grantor ON permission_delegations(grantor_id);
CREATE INDEX idx_permission_delegations_grantee ON permission_delegations(grantee_id);
CREATE INDEX idx_permission_delegations_resource ON permission_delegations(resource_type, resource_id);
CREATE INDEX idx_permission_delegations_validity ON permission_delegations(valid_from, valid_until) WHERE revoked = FALSE;
CREATE INDEX idx_permission_delegations_active ON permission_delegations(grantee_id, resource_type) 
  WHERE revoked = FALSE AND valid_from <= NOW() AND valid_until >= NOW();

-- Enable RLS
ALTER TABLE permission_delegations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY permission_delegations_select ON permission_delegations
  FOR SELECT
  USING (
    auth.uid() = grantor_id OR 
    auth.uid() = grantee_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'security_admin')
    )
  );

CREATE POLICY permission_delegations_insert ON permission_delegations
  FOR INSERT
  WITH CHECK (
    auth.uid() = grantor_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'security_admin')
    )
  );

CREATE POLICY permission_delegations_update ON permission_delegations
  FOR UPDATE
  USING (
    auth.uid() = grantor_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'security_admin')
    )
  )
  WITH CHECK (
    auth.uid() = grantor_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'security_admin')
    )
  );

-- Function to check delegated permissions
CREATE OR REPLACE FUNCTION check_delegated_permission(
  p_user_id UUID,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM permission_delegations
    WHERE grantee_id = p_user_id
    AND revoked = FALSE
    AND NOW() BETWEEN valid_from AND valid_until
    AND p_permission = ANY(permissions)
    AND (
      resource_type = 'all' OR
      (resource_type = p_resource_type AND (resource_id IS NULL OR resource_id = p_resource_id))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate permission delegation
CREATE OR REPLACE FUNCTION validate_permission_delegation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if grantor has the permissions they're delegating
  -- This would need to be implemented based on your permission system
  
  -- Check for circular delegations
  IF EXISTS (
    SELECT 1 FROM permission_delegations
    WHERE grantor_id = NEW.grantee_id
    AND grantee_id = NEW.grantor_id
    AND resource_type = NEW.resource_type
    AND (resource_id IS NULL OR resource_id = NEW.resource_id)
    AND revoked = FALSE
    AND NOW() BETWEEN valid_from AND valid_until
  ) THEN
    RAISE EXCEPTION 'Circular delegation detected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_permission_delegation_trigger
  BEFORE INSERT OR UPDATE ON permission_delegations
  FOR EACH ROW
  EXECUTE FUNCTION validate_permission_delegation();