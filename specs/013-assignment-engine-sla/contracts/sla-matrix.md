# SLA Deadline Matrix

**Feature**: Assignment Engine & SLA
**Date**: 2025-10-02
**Source**: FR-013 from spec.md

## Overview

This matrix defines Service Level Agreement (SLA) deadlines for work items based on type and priority. The assignment system calculates `sla_deadline = assigned_at + deadline_hours` on assignment creation.

**Warning Threshold**: 75% of SLA elapsed (sends notification)
**Escalation Threshold**: 100% of SLA elapsed (automatic escalation)

---

## SLA Deadline Matrix

| Work Item Type | Priority | Deadline (Hours) | Deadline (Days) | Warning At | Escalation At |
|----------------|----------|------------------|-----------------|------------|---------------|
| **Dossiers** | Urgent | 8.0 | 0.33 | 6h | 8h |
| **Dossiers** | High | 24.0 | 1.0 | 18h | 24h |
| **Dossiers** | Normal | 48.0 | 2.0 | 36h | 48h |
| **Dossiers** | Low | 120.0 | 5.0 | 90h (3.75d) | 120h (5d) |
| **Tickets** | Urgent | 2.0 | 0.08 | 1.5h | 2h |
| **Tickets** | High | 24.0 | 1.0 | 18h | 24h |
| **Tickets** | Normal | 48.0 | 2.0 | 36h | 48h |
| **Tickets** | Low | 120.0 | 5.0 | 90h (3.75d) | 120h (5d) |
| **Positions** | Urgent | 4.0 | 0.17 | 3h | 4h |
| **Positions** | High | 24.0 | 1.0 | 18h | 24h |
| **Positions** | Normal | 48.0 | 2.0 | 36h | 48h |
| **Positions** | Low | 120.0 | 5.0 | 90h (3.75d) | 120h (5d) |
| **Tasks** | Urgent | 4.0 | 0.17 | 3h | 4h |
| **Tasks** | High | 24.0 | 1.0 | 18h | 24h |
| **Tasks** | Normal | 48.0 | 2.0 | 36h | 48h |
| **Tasks** | Low | 120.0 | 5.0 | 90h (3.75d) | 120h (5d) |

---

## Database Seed Data

Insert this into `sla_configs` table during migration:

```sql
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
  ('task', 'low', 120.0, 75);
```

---

## Calculation Examples

### Example 1: Urgent Ticket
- **Assigned at**: 2025-10-02 10:00:00 UTC
- **Deadline hours**: 2.0
- **SLA deadline**: 2025-10-02 12:00:00 UTC (10:00 + 2h)
- **Warning sent**: 2025-10-02 11:30:00 UTC (75% = 1.5h elapsed)
- **Escalation triggered**: 2025-10-02 12:00:00 UTC (100% = 2h elapsed)

### Example 2: Normal Dossier
- **Assigned at**: 2025-10-02 10:00:00 UTC
- **Deadline hours**: 48.0
- **SLA deadline**: 2025-10-04 10:00:00 UTC (10:00 + 48h)
- **Warning sent**: 2025-10-03 22:00:00 UTC (75% = 36h elapsed)
- **Escalation triggered**: 2025-10-04 10:00:00 UTC (100% = 48h elapsed)

### Example 3: Low Priority Position
- **Assigned at**: 2025-10-02 10:00:00 UTC
- **Deadline hours**: 120.0
- **SLA deadline**: 2025-10-07 10:00:00 UTC (10:00 + 120h = 5 days)
- **Warning sent**: 2025-10-06 04:00:00 UTC (75% = 90h elapsed = 3.75 days)
- **Escalation triggered**: 2025-10-07 10:00:00 UTC (100% = 120h = 5 days)

---

## PostgreSQL Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
  p_work_item_type work_item_type,
  p_priority priority_level,
  p_assigned_at TIMESTAMPTZ
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_deadline_hours DECIMAL;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Lookup deadline hours from config
  SELECT deadline_hours INTO v_deadline_hours
  FROM sla_configs
  WHERE work_item_type = p_work_item_type
    AND priority = p_priority;

  -- Handle missing config (should never happen if seed data exists)
  IF v_deadline_hours IS NULL THEN
    RAISE EXCEPTION 'No SLA config found for type=% priority=%', p_work_item_type, p_priority;
  END IF;

  -- Calculate deadline
  v_deadline := p_assigned_at + (v_deadline_hours || ' hours')::INTERVAL;

  RETURN v_deadline;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Usage**:
```sql
SELECT calculate_sla_deadline('ticket', 'urgent', now());
-- Returns: 2025-10-02 12:00:00+00 (if current time is 10:00)
```

---

## TypeScript Calculation Helper

```typescript
import { addHours } from 'date-fns';

const SLA_MATRIX: Record<WorkItemType, Record<PriorityLevel, number>> = {
  dossier: { urgent: 8, high: 24, normal: 48, low: 120 },
  ticket: { urgent: 2, high: 24, normal: 48, low: 120 },
  position: { urgent: 4, high: 24, normal: 48, low: 120 },
  task: { urgent: 4, high: 24, normal: 48, low: 120 },
};

export function calculateSLADeadline(
  workItemType: WorkItemType,
  priority: PriorityLevel,
  assignedAt: Date
): Date {
  const deadlineHours = SLA_MATRIX[workItemType][priority];
  if (!deadlineHours) {
    throw new Error(`No SLA config for ${workItemType}/${priority}`);
  }
  return addHours(assignedAt, deadlineHours);
}

export function getSLAStatus(
  assignedAt: Date,
  slaDeadline: Date,
  now: Date = new Date()
): 'ok' | 'warning' | 'breached' {
  const totalDuration = slaDeadline.getTime() - assignedAt.getTime();
  const elapsed = now.getTime() - assignedAt.getTime();
  const elapsedPct = elapsed / totalDuration;

  if (now >= slaDeadline) return 'breached';
  if (elapsedPct >= 0.75) return 'warning';
  return 'ok';
}

export function getTimeRemaining(slaDeadline: Date, now: Date = new Date()): number {
  return Math.max(0, slaDeadline.getTime() - now.getTime());
}
```

---

## UI Display Recommendations

### Color Coding (WCAG AA compliant)
- **Green (OK)**: 0-74% of SLA elapsed
  - Background: `#10b981` (green-500)
  - Text: `#ffffff` (white)
  - Icon: Checkmark circle

- **Amber/Yellow (Warning)**: 75-99% of SLA elapsed
  - Background: `#f59e0b` (amber-500)
  - Text: `#000000` (black for contrast)
  - Icon: Exclamation triangle

- **Red (Breached)**: 100%+ of SLA elapsed
  - Background: `#ef4444` (red-500)
  - Text: `#ffffff` (white)
  - Icon: X circle

### Accessibility
- **Screen Reader**: Announce status as "SLA OK", "SLA at risk", "SLA breached"
- **ARIA Live Region**: `aria-live="polite"` for countdown updates
- **Keyboard**: Focus indicator on countdown component
- **RTL Support**: Countdown numbers use locale-specific numerals (Arabic numerals for ar-SA)

---

## Monitoring Query

Track SLA compliance rates:

```sql
SELECT
  work_item_type,
  priority,
  COUNT(*) as total_assignments,
  SUM(CASE WHEN escalated_at IS NULL THEN 1 ELSE 0 END) as completed_on_time,
  SUM(CASE WHEN escalated_at IS NOT NULL THEN 1 ELSE 0 END) as breached,
  ROUND(100.0 * SUM(CASE WHEN escalated_at IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as compliance_pct
FROM assignments
WHERE status = 'completed'
  AND completed_at >= now() - interval '30 days'
GROUP BY work_item_type, priority
ORDER BY work_item_type, priority;
```

**Target Compliance**: >95% for all urgent items, >90% for high, >85% for normal/low

---

## Related Documentation

- **Data Model**: See `data-model.md` for `sla_configs` table definition
- **API Spec**: See `contracts/api-spec.yaml` for SLA-related endpoints
- **Quickstart**: See `quickstart.md` Scenario 3 for SLA escalation testing
