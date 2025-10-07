-- Migration: T018 - Setup capacity snapshot cron job
-- Description: Schedule daily capacity snapshot at midnight UTC
-- Dependencies: T010 (capacity_snapshots table)

-- Unschedule existing job if it exists
SELECT cron.unschedule('capacity-snapshot-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'capacity-snapshot-daily');

-- Schedule daily capacity snapshot at midnight UTC
SELECT cron.schedule(
  'capacity-snapshot-daily',
  '0 0 * * *', -- Midnight daily
  $$
  INSERT INTO capacity_snapshots (snapshot_date, unit_id, total_staff, total_capacity, active_assignments, utilization_pct)
  SELECT
    CURRENT_DATE AS snapshot_date,
    unit_id,
    COUNT(DISTINCT user_id) AS total_staff,
    SUM(individual_wip_limit) AS total_capacity,
    SUM(current_assignment_count) AS active_assignments,
    (SUM(current_assignment_count)::numeric / NULLIF(SUM(individual_wip_limit), 0)) * 100 AS utilization_pct
  FROM staff_profiles
  WHERE availability_status = 'available'
  GROUP BY unit_id
  ON CONFLICT (snapshot_date, unit_id) DO UPDATE
    SET total_staff = EXCLUDED.total_staff,
        total_capacity = EXCLUDED.total_capacity,
        active_assignments = EXCLUDED.active_assignments,
        utilization_pct = EXCLUDED.utilization_pct;
  $$
);

-- Log the schedule
DO $$
BEGIN
  RAISE NOTICE 'Capacity snapshot cron job scheduled: runs daily at midnight UTC';
END $$;
