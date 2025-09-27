-- Migration: Create users table
-- Description: System user with authentication, permissions, and preferences
-- Date: 2025-01-27

-- Create user role enum
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');

-- Create language preference enum
CREATE TYPE language_preference AS ENUM ('en', 'ar');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    language_preference language_preference NOT NULL DEFAULT 'en',
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Add check constraints
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users 
ADD CONSTRAINT check_mfa_secret_required 
CHECK (
    (mfa_enabled = false) OR 
    (mfa_enabled = true AND mfa_secret IS NOT NULL)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Add table comments
COMMENT ON TABLE users IS 'System users with authentication, permissions, and preferences';
COMMENT ON COLUMN users.id IS 'Unique user identifier';
COMMENT ON COLUMN users.email IS 'User email address for authentication';
COMMENT ON COLUMN users.password_hash IS 'Encrypted password hash';
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.language_preference IS 'Preferred language (en or ar)';
COMMENT ON COLUMN users.mfa_enabled IS 'Multi-factor authentication status';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret for MFA when enabled';
COMMENT ON COLUMN users.role IS 'User role for authorization';
COMMENT ON COLUMN users.is_active IS 'Account active status';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN users.deleted_by IS 'User who performed soft delete';