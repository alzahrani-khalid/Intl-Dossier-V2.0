-- Migration: Extend auth.users table with user management fields
-- Feature: 019-user-management-access
-- Task: T005
-- Date: 2025-10-11

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Extend auth.users table with additional fields for user management
-- Note: We add columns to the existing auth.users table
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "language": "en",
    "timezone": "UTC",
    "notifications_enabled": true,
    "email_notifications": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
  ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_login_ip INET,
  ADD COLUMN IF NOT EXISTS allowed_resources TEXT[] DEFAULT '{}',  -- For guest users: specific resource IDs they can access
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,  -- For guest users: account expiration date
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_username ON auth.users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON auth.users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON auth.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_expires_at ON auth.users(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON auth.users(last_login_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Add constraints
ALTER TABLE auth.users
  ADD CONSTRAINT chk_guest_expiration
    CHECK (
      (user_type = 'guest' AND expires_at IS NOT NULL) OR
      (user_type = 'employee' AND expires_at IS NULL)
    );

ALTER TABLE auth.users
  ADD CONSTRAINT chk_guest_allowed_resources
    CHECK (
      (user_type = 'guest' AND allowed_resources IS NOT NULL) OR
      (user_type = 'employee')
    );

-- Add comments for documentation
COMMENT ON COLUMN auth.users.username IS 'Unique username for the user';
COMMENT ON COLUMN auth.users.full_name IS 'Full name of the user';
COMMENT ON COLUMN auth.users.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN auth.users.role IS 'User role for RBAC (super_admin, admin, manager, analyst, viewer)';
COMMENT ON COLUMN auth.users.user_type IS 'User type (employee or guest)';
COMMENT ON COLUMN auth.users.status IS 'User account status (active, inactive, deactivated, pending)';
COMMENT ON COLUMN auth.users.preferences IS 'User preferences (language, timezone, notifications)';
COMMENT ON COLUMN auth.users.mfa_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN auth.users.mfa_secret IS 'MFA TOTP secret (encrypted)';
COMMENT ON COLUMN auth.users.backup_codes IS 'Array of hashed backup codes for MFA recovery';
COMMENT ON COLUMN auth.users.last_login_at IS 'Timestamp of last login';
COMMENT ON COLUMN auth.users.last_login_ip IS 'IP address of last login';
COMMENT ON COLUMN auth.users.allowed_resources IS 'Array of resource IDs guest user can access';
COMMENT ON COLUMN auth.users.expires_at IS 'Expiration date for guest accounts';
COMMENT ON COLUMN auth.users.deactivated_at IS 'Timestamp when user was deactivated';
COMMENT ON COLUMN auth.users.deactivated_by IS 'User ID who deactivated this account';
COMMENT ON COLUMN auth.users.deactivation_reason IS 'Reason for deactivation';
COMMENT ON COLUMN auth.users.created_by IS 'User ID who created this account';
COMMENT ON COLUMN auth.users.updated_at IS 'Timestamp of last update';
