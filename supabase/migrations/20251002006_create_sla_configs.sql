-- Migration: T006 - Create sla_configs table
-- Description: Lookup table for SLA deadline calculation (work_item_type × priority → deadline_hours)
-- Dependencies: T001 (enums)

-- Create sla_configs table
CREATE TABLE IF NOT EXISTS sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_type work_item_type NOT NULL,
  priority priority_level NOT NULL,
  deadline_hours NUMERIC(5,2) NOT NULL CHECK (deadline_hours > 0),
  warning_threshold_pct INTEGER NOT NULL DEFAULT 75 CHECK (warning_threshold_pct >= 0 AND warning_threshold_pct <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only one config per type+priority combination
  CONSTRAINT unique_sla_config UNIQUE (work_item_type, priority)
);

-- Index for fast SLA lookup
CREATE INDEX idx_sla_configs_lookup ON sla_configs(work_item_type, priority);

-- Comment
COMMENT ON TABLE sla_configs IS 'SLA deadline matrix: maps work item type + priority to deadline in hours';
COMMENT ON COLUMN sla_configs.deadline_hours IS 'SLA deadline in hours (supports fractional hours like 0.5h or 2.5h)';
COMMENT ON COLUMN sla_configs.warning_threshold_pct IS 'Percentage of SLA elapsed before sending warning (typically 75%)';

-- Seed SLA matrix data (from data-model.md and FR-013)
INSERT INTO sla_configs (work_item_type, priority, deadline_hours, warning_threshold_pct) VALUES
  -- Dossiers
  ('dossier', 'urgent', 8.0, 75),
  ('dossier', 'high', 24.0, 75),
  ('dossier', 'normal', 48.0, 75),
  ('dossier', 'low', 120.0, 75),

  -- Tickets
  ('ticket', 'urgent', 2.0, 75),
  ('ticket', 'high', 24.0, 75),
  ('ticket', 'normal', 48.0, 75),
  ('ticket', 'low', 120.0, 75),

  -- Positions
  ('position', 'urgent', 4.0, 75),
  ('position', 'high', 24.0, 75),
  ('position', 'normal', 48.0, 75),
  ('position', 'low', 120.0, 75),

  -- Tasks
  ('task', 'urgent', 4.0, 75),
  ('task', 'high', 24.0, 75),
  ('task', 'normal', 48.0, 75),
  ('task', 'low', 120.0, 75)
ON CONFLICT (work_item_type, priority) DO NOTHING;
