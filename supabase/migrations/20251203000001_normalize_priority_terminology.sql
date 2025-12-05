-- Migration: Normalize Priority Terminology
-- Feature: 034-unified-kanban
-- Description: Standardize priority values across all work item tables
--              Replace 'critical' with 'urgent' for consistency
--
-- Affected tables:
--   - aa_commitments (text column)
--   - commitments (priority_level enum)
--   - intake_tickets (priority_level enum)
--
-- Standard priority values: low, medium, high, urgent
-- Deprecated: critical, normal (mapped to medium)

BEGIN;

-- ============================================
-- 1. Update aa_commitments (text column)
-- ============================================

-- Update any 'critical' values to 'urgent'
UPDATE aa_commitments
SET priority = 'urgent', updated_at = now()
WHERE priority = 'critical';

-- Update any 'normal' values to 'medium' for consistency
UPDATE aa_commitments
SET priority = 'medium', updated_at = now()
WHERE priority = 'normal';

-- Add CHECK constraint to enforce valid priority values
ALTER TABLE aa_commitments
DROP CONSTRAINT IF EXISTS aa_commitments_priority_check;

ALTER TABLE aa_commitments
ADD CONSTRAINT aa_commitments_priority_check
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add comment documenting the standard
COMMENT ON COLUMN aa_commitments.priority IS
'Priority level: low, medium, high, urgent. Note: "critical" is deprecated, use "urgent" instead.';

-- ============================================
-- 2. Update commitments table (enum column)
-- ============================================

-- Update any 'critical' values to 'urgent'
UPDATE commitments
SET priority = 'urgent', updated_at = now()
WHERE priority = 'critical';

-- Update any 'normal' values to 'medium'
UPDATE commitments
SET priority = 'medium', updated_at = now()
WHERE priority = 'normal';

-- ============================================
-- 3. Update intake_tickets table (enum column)
-- ============================================

-- Update any 'critical' values to 'urgent'
UPDATE intake_tickets
SET priority = 'urgent', updated_at = now()
WHERE priority = 'critical';

-- Update any 'normal' values to 'medium'
UPDATE intake_tickets
SET priority = 'medium', updated_at = now()
WHERE priority = 'normal';

-- ============================================
-- 4. Add documentation comments
-- ============================================

COMMENT ON COLUMN commitments.priority IS
'Priority level using priority_level enum. Standard values: low, medium, high, urgent. Deprecated: critical (use urgent), normal (use medium).';

COMMENT ON COLUMN intake_tickets.priority IS
'Priority level using priority_level enum. Standard values: low, medium, high, urgent. Deprecated: critical (use urgent), normal (use medium).';

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS (manual)
-- ============================================
-- To rollback this migration:
--
-- BEGIN;
-- -- Remove CHECK constraint from aa_commitments
-- ALTER TABLE aa_commitments DROP CONSTRAINT IF EXISTS aa_commitments_priority_check;
--
-- -- Note: Cannot rollback enum changes or data updates
-- -- Original 'critical' values cannot be restored automatically
-- COMMIT;
