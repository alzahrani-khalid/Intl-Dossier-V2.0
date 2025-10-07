-- Migration: Create assignment-related enums
-- Feature: Assignment Engine & SLA
-- Task: T001
-- Description: Create availability_status, work_item_type, priority_level, assignment_status, escalation_reason enums

-- Availability status for staff members
CREATE TYPE availability_status AS ENUM (
  'available',      -- Staff member can receive assignments
  'on_leave',       -- Temporarily unavailable (triggers reassignment)
  'unavailable'     -- Indefinitely unavailable (manual review required)
);

-- Work item types (polymorphic reference)
CREATE TYPE work_item_type AS ENUM (
  'dossier',   -- International dossier
  'ticket',    -- Front-door intake ticket
  'position',  -- Talking points/position paper
  'task'       -- Generic task
);

-- Priority levels (affects SLA deadlines)
CREATE TYPE priority_level AS ENUM (
  'urgent',  -- Highest priority, shortest SLA
  'high',
  'normal',  -- Default priority
  'low'      -- Lowest priority, longest SLA
);

-- Assignment status lifecycle
CREATE TYPE assignment_status AS ENUM (
  'pending',      -- Created but not yet assigned
  'assigned',     -- Assigned to staff, not started
  'in_progress',  -- Staff is actively working on it
  'completed',    -- Work finished successfully
  'cancelled'     -- Cancelled before completion
);

-- Escalation reasons for audit trail
CREATE TYPE escalation_reason AS ENUM (
  'sla_breach',          -- SLA deadline reached (100%)
  'manual',              -- Manual escalation by user
  'capacity_exhaustion'  -- No capacity available, needs management attention
);

-- Add comments for documentation
COMMENT ON TYPE availability_status IS 'Staff member availability status affecting assignment eligibility';
COMMENT ON TYPE work_item_type IS 'Type of work item being assigned (polymorphic reference)';
COMMENT ON TYPE priority_level IS 'Priority level affecting SLA deadline calculation';
COMMENT ON TYPE assignment_status IS 'Current status of an assignment in its lifecycle';
COMMENT ON TYPE escalation_reason IS 'Reason for escalation event (audit trail)';
