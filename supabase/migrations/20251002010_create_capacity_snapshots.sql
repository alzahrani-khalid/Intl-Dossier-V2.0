-- Migration: T010 - Create capacity_snapshots table
-- Description: Daily analytics snapshots of unit capacity utilization
-- Dependencies: T002 (organizational_units)

-- Create capacity_snapshots table
CREATE TABLE IF NOT EXISTS capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
  total_staff INTEGER NOT NULL,
  total_capacity INTEGER NOT NULL,
  active_assignments INTEGER NOT NULL,
  utilization_pct NUMERIC(5,2) NOT NULL CHECK (utilization_pct >= 0 AND utilization_pct <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One snapshot per unit per day
  CONSTRAINT unique_daily_snapshot UNIQUE (snapshot_date, unit_id)
);

-- Index for time-series queries
CREATE INDEX idx_capacity_date_unit ON capacity_snapshots(snapshot_date DESC, unit_id);

-- Comments
COMMENT ON TABLE capacity_snapshots IS 'Daily capacity utilization snapshots for reporting and capacity planning';
COMMENT ON COLUMN capacity_snapshots.utilization_pct IS '(active_assignments / total_capacity) * 100 (allows >100% for over-capacity)';
COMMENT ON COLUMN capacity_snapshots.total_staff IS 'Count of staff with availability_status = available';
