-- Migration: 001_security_tables.sql
-- Description: Create security-related tables for MFA, backup codes, and audit logging
-- Dependencies: None (base tables)
-- Created: 2025-01-27

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS security;

-- ============================================================================
-- MFA ENROLLMENT TABLE
-- ============================================================================

CREATE TABLE auth.mfa_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    factor_type TEXT NOT NULL CHECK (factor_type IN ('totp')),
    factor_id TEXT NOT NULL,
    secret TEXT NOT NULL, -- Will be encrypted at application level
    qr_code TEXT NULL,
    verified_at TIMESTAMPTZ NULL,
    last_used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_user_factor UNIQUE (user_id, factor_type),
    CONSTRAINT valid_verification CHECK (verified_at IS NULL OR verified_at >= created_at),
    CONSTRAINT valid_last_used CHECK (last_used_at IS NULL OR last_used_at >= created_at)
);

-- ============================================================================
-- MFA BACKUP CODES TABLE
-- ============================================================================

CREATE TABLE auth.mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, -- bcrypt hashed backup code
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_usage CHECK (used_at IS NULL OR used_at >= created_at)
);

-- ============================================================================
-- SECURITY AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE security.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    resource TEXT NULL,
    action TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'blocked')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (length(event_type) > 0),
    CONSTRAINT valid_action CHECK (length(action) > 0)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- MFA enrollments indexes
CREATE INDEX idx_mfa_enrollments_user_id ON auth.mfa_enrollments (user_id);
CREATE INDEX idx_mfa_enrollments_factor_type ON auth.mfa_enrollments (factor_type);
CREATE INDEX idx_mfa_enrollments_verified ON auth.mfa_enrollments (verified_at) WHERE verified_at IS NOT NULL;
CREATE INDEX idx_mfa_enrollments_last_used ON auth.mfa_enrollments (last_used_at) WHERE last_used_at IS NOT NULL;

-- MFA backup codes indexes
CREATE INDEX idx_mfa_backup_codes_user_id ON auth.mfa_backup_codes (user_id);
CREATE INDEX idx_mfa_backup_codes_unused ON auth.mfa_backup_codes (user_id) WHERE used_at IS NULL;
CREATE INDEX idx_mfa_backup_codes_created ON auth.mfa_backup_codes (created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_event_type ON security.audit_logs (event_type);
CREATE INDEX idx_audit_logs_user_id ON security.audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at ON security.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_severity ON security.audit_logs (severity, created_at DESC);
CREATE INDEX idx_audit_logs_result ON security.audit_logs (result, created_at DESC);
CREATE INDEX idx_audit_logs_ip_address ON security.audit_logs (ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to mfa_enrollments
CREATE TRIGGER trigger_mfa_enrollments_updated_at
    BEFORE UPDATE ON auth.mfa_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE auth.mfa_enrollments IS 'Stores user MFA settings and enrollment status';
COMMENT ON COLUMN auth.mfa_enrollments.secret IS 'TOTP secret (encrypted at application level)';
COMMENT ON COLUMN auth.mfa_enrollments.qr_code IS 'QR code data URL for authenticator app setup';
COMMENT ON COLUMN auth.mfa_enrollments.verified_at IS 'Timestamp when MFA was successfully verified';
COMMENT ON COLUMN auth.mfa_enrollments.last_used_at IS 'Timestamp of last successful MFA verification';

COMMENT ON TABLE auth.mfa_backup_codes IS 'Stores recovery codes for MFA account recovery';
COMMENT ON COLUMN auth.mfa_backup_codes.code_hash IS 'bcrypt hashed backup code (cost factor 12)';
COMMENT ON COLUMN auth.mfa_backup_codes.used_at IS 'Timestamp when backup code was used';

COMMENT ON TABLE security.audit_logs IS 'Comprehensive security event logging for compliance and monitoring';
COMMENT ON COLUMN security.audit_logs.event_type IS 'Type of security event (login, mfa, access_denied, etc.)';
COMMENT ON COLUMN security.audit_logs.severity IS 'Event severity level for alerting';
COMMENT ON COLUMN security.audit_logs.metadata IS 'Additional event data in JSON format';
COMMENT ON COLUMN security.audit_logs.result IS 'Action result (success, failure, blocked)';

-- ============================================================================
-- DATA RETENTION POLICY
-- ============================================================================

-- Set up automatic cleanup for old audit logs (90 days active, 7 years archive)
-- This will be implemented in a separate migration for partitioning

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. MFA secrets are encrypted at the application level using AES-256-GCM
-- 2. Backup codes are hashed using bcrypt with cost factor 12
-- 3. Audit logs contain sensitive information and should be encrypted in transit
-- 4. All tables have appropriate foreign key constraints for data integrity
-- 5. Indexes are optimized for common query patterns while maintaining performance
