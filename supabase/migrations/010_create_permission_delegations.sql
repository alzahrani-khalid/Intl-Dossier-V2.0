-- Migration: Create permission_delegations table
-- Description: Access control entity managing user permissions and role assignments
-- Date: 2025-01-27

-- Create entity type enum
CREATE TYPE entity_type AS ENUM (
    'country', 
    'organization', 
    'mou', 
    'event', 
    'forum', 
    'brief', 
    'intelligence_report', 
    'data_library_item'
);

-- Create permission_delegations table
CREATE TABLE IF NOT EXISTS permission_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    delegated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    entity_type entity_type NOT NULL,
    entity_id UUID,
    permissions JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_permission_delegations_user_id ON permission_delegations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_delegations_delegated_by ON permission_delegations(delegated_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_delegations_entity_type ON permission_delegations(entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_delegations_entity_id ON permission_delegations(entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_delegations_is_active ON permission_delegations(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_delegations_expires_at ON permission_delegations(expires_at) WHERE deleted_at IS NULL;
-- Composite index for permission lookups
CREATE INDEX idx_permission_delegations_user_entity ON permission_delegations(user_id, entity_type, entity_id) WHERE deleted_at IS NULL AND is_active = true;

-- Add check constraints
ALTER TABLE permission_delegations 
ADD CONSTRAINT check_user_not_self 
CHECK (user_id != delegated_by);

ALTER TABLE permission_delegations 
ADD CONSTRAINT check_permissions_format 
CHECK (jsonb_typeof(permissions) = 'object' AND permissions::text != '{}');

ALTER TABLE permission_delegations 
ADD CONSTRAINT check_expires_future 
CHECK (expires_at IS NULL OR expires_at > created_at);

-- Create function to check if permission is expired
CREATE OR REPLACE FUNCTION is_permission_expired(p_permission_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_is_active BOOLEAN;
BEGIN
    SELECT expires_at, is_active
    INTO v_expires_at, v_is_active
    FROM permission_delegations
    WHERE id = p_permission_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN true; -- Permission doesn't exist, treat as expired
    END IF;
    
    IF NOT v_is_active THEN
        RETURN true; -- Permission is inactive
    END IF;
    
    IF v_expires_at IS NULL THEN
        RETURN false; -- No expiry, permission is valid
    END IF;
    
    RETURN v_expires_at <= NOW(); -- Check if expired
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-deactivate expired permissions
CREATE OR REPLACE FUNCTION deactivate_expired_permissions()
RETURNS void AS $$
BEGIN
    UPDATE permission_delegations
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
        AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_permission_delegations_updated_at BEFORE UPDATE
    ON permission_delegations FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE permission_delegations IS 'Access control entity managing user permissions and role assignments';
COMMENT ON COLUMN permission_delegations.id IS 'Unique delegation identifier';
COMMENT ON COLUMN permission_delegations.user_id IS 'User receiving permissions';
COMMENT ON COLUMN permission_delegations.delegated_by IS 'User delegating permissions';
COMMENT ON COLUMN permission_delegations.entity_type IS 'Type of entity for permissions';
COMMENT ON COLUMN permission_delegations.entity_id IS 'Specific entity ID (if applicable)';
COMMENT ON COLUMN permission_delegations.permissions IS 'Permission details in JSON format';
COMMENT ON COLUMN permission_delegations.expires_at IS 'When delegation expires';
COMMENT ON COLUMN permission_delegations.is_active IS 'Whether delegation is currently active';
COMMENT ON COLUMN permission_delegations.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN permission_delegations.deleted_by IS 'User who performed soft delete';