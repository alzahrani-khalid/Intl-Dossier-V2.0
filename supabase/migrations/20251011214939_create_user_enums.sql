-- Migration: Create ENUM types for User Management & Access Control
-- Feature: 019-user-management-access
-- Task: T004
-- Date: 2025-10-11

-- User Role ENUM
CREATE TYPE user_role AS ENUM (
  'super_admin',      -- Full system access, can manage all users and settings
  'admin',            -- Can manage users, roles, and delegations
  'manager',          -- Can manage team members and approve requests
  'analyst',          -- Can view and analyze dossier data
  'viewer'            -- Read-only access to assigned resources
);

-- User Type ENUM
CREATE TYPE user_type AS ENUM (
  'employee',         -- Internal government employee
  'guest'             -- External user with restricted access
);

-- User Status ENUM
CREATE TYPE user_status AS ENUM (
  'active',           -- User account is active and can log in
  'inactive',         -- User account is temporarily inactive
  'deactivated',      -- User account has been deactivated (offboarding)
  'pending'           -- User account created but not yet activated
);

-- Delegation Source ENUM
CREATE TYPE delegation_source AS ENUM (
  'manual',           -- Created manually by user
  'automatic'         -- Created automatically by system rules
);

-- Approval Status ENUM
CREATE TYPE approval_status AS ENUM (
  'pending',          -- Waiting for approval
  'approved',         -- Approved by authorized user
  'rejected',         -- Rejected by authorized user
  'expired'           -- Approval request expired
);

-- Review Status ENUM
CREATE TYPE review_status AS ENUM (
  'pending',          -- Review not started
  'in_progress',      -- Review in progress
  'completed',        -- Review completed
  'cancelled'         -- Review cancelled
);

-- Add comments for documentation
COMMENT ON TYPE user_role IS 'User role for role-based access control (RBAC)';
COMMENT ON TYPE user_type IS 'User type: employee (internal) or guest (external)';
COMMENT ON TYPE user_status IS 'User account status for lifecycle management';
COMMENT ON TYPE delegation_source IS 'Source of permission delegation (manual or automatic)';
COMMENT ON TYPE approval_status IS 'Status of role change approval requests';
COMMENT ON TYPE review_status IS 'Status of access review process';
