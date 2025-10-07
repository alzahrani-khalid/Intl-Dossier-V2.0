-- Extend assignments table with dual SLA tracking columns
-- overall_sla_deadline: Deadline from creation to completion (fixed)
-- current_stage_sla_deadline: Deadline for current workflow stage (dynamic)

ALTER TABLE assignments
ADD COLUMN overall_sla_deadline timestamptz,
ADD COLUMN current_stage_sla_deadline timestamptz;

-- Create indexes for SLA queries and sorting
CREATE INDEX idx_assignments_overall_sla ON assignments(overall_sla_deadline);
CREATE INDEX idx_assignments_stage_sla ON assignments(current_stage_sla_deadline);
