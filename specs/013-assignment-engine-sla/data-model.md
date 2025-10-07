# Data Model: Assignment Engine & SLA

**Feature**: Assignment Engine & SLA
**Date**: 2025-10-02
**Status**: Phase 1 Complete

## Overview

This data model supports auto-routing of work items to staff members based on skills, capacity, and organizational units. It enforces Work-In-Progress (WIP) limits, tracks Service Level Agreements (SLAs) with escalation, and manages a priority queue for work items awaiting capacity.

**Key Design Principles**:
- Optimistic locking for race condition prevention (version fields)
- Bilingual support (ar/en fields for names)
- Audit trail preservation (immutable escalation_events)
- Event-driven architecture (triggers for queue processing)

---

## Entity Relationship Diagram

```
organizational_units
    ├── staff_profiles (many)
    │   ├── assignments (many, as assignee)
    │   ├── escalation_events (many, as escalated_from/escalated_to)
    │   └── skills (many-to-many)
    │
    └── assignment_rules (many)

skills
    ├── staff_profiles (many-to-many)
    └── assignment_queue (many-to-many via required_skills)

assignments
    ├── escalation_events (one-to-many)
    ├── work_items (polymorphic: dossiers, tickets, positions, tasks)
    └── sla_configs (lookup for deadline calculation)

assignment_queue
    └── work_items (polymorphic: dossiers, tickets, positions, tasks)

sla_configs (lookup table)

capacity_snapshots (analytics, no foreign keys)
```

---

## Entities

### 1. organizational_units

Represents departments or teams within GASTAT. Hierarchical structure with self-referencing parent relationship.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name_ar` | VARCHAR(255) | NOT NULL | Arabic name of the unit |
| `name_en` | VARCHAR(255) | NOT NULL | English name of the unit |
| `unit_wip_limit` | INTEGER | NOT NULL, CHECK >= 1 AND <= 100 | Maximum concurrent assignments for the entire unit |
| `parent_unit_id` | UUID | NULLABLE, FK → organizational_units(id) | Parent unit for hierarchy (NULL if top-level) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_org_units_parent` on `parent_unit_id` (for hierarchy queries)

**Validation Rules**:
- `unit_wip_limit` must be >= sum of child units' WIP limits (business rule, not enforced by constraint)
- `name_ar` and `name_en` must be unique within same parent unit

**Sample Data**:
```sql
INSERT INTO organizational_units (id, name_ar, name_en, unit_wip_limit, parent_unit_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'إدارة الشؤون الدولية', 'International Affairs Division', 50, NULL),
  ('00000000-0000-0000-0000-000000000002', 'قسم الترجمة', 'Translation Department', 20, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'قسم التحليل', 'Analysis Department', 30, '00000000-0000-0000-0000-000000000001');
```

---

### 2. skills

Represents competencies or capabilities that staff possess and work items require. Bilingual names for UI display.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name_ar` | VARCHAR(255) | NOT NULL, UNIQUE | Arabic name of the skill |
| `name_en` | VARCHAR(255) | NOT NULL, UNIQUE | English name of the skill |
| `category` | VARCHAR(100) | NULLABLE | Skill grouping (e.g., 'languages', 'technical', 'domain') |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes**:
- `idx_skills_category` on `category` (for filtering by category)

**Validation Rules**:
- `name_ar` must not be empty or whitespace-only
- `name_en` must not be empty or whitespace-only

**Sample Data**:
```sql
INSERT INTO skills (id, name_ar, name_en, category) VALUES
  ('skill-0001', 'ترجمة عربي-إنجليزي', 'Arabic-English Translation', 'languages'),
  ('skill-0002', 'مراجعة قانونية', 'Legal Review', 'domain'),
  ('skill-0003', 'كتابة تقنية', 'Technical Writing', 'technical'),
  ('skill-0004', 'تحليل إحصائي', 'Statistical Analysis', 'technical');
```

---

### 3. staff_profiles

Extends the existing `users` table with assignment-specific attributes: skills, capacity, availability, and escalation chain.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users(id) | Reference to auth user |
| `unit_id` | UUID | NOT NULL, FK → organizational_units(id) | Organizational unit membership |
| `skills` | UUID[] | NOT NULL, DEFAULT '{}' | Array of skill IDs (FK → skills.id) |
| `individual_wip_limit` | INTEGER | NOT NULL, CHECK >= 1 AND <= 20 | Max concurrent assignments for this staff member |
| `current_assignment_count` | INTEGER | NOT NULL, DEFAULT 0 | Current number of active assignments (cached count) |
| `availability_status` | ENUM | NOT NULL, DEFAULT 'available' | 'available', 'on_leave', 'unavailable' |
| `unavailable_until` | TIMESTAMPTZ | NULLABLE | When availability returns (NULL if available or indefinite) |
| `unavailable_reason` | TEXT | NULLABLE | Reason for unavailability (for audit) |
| `availability_source` | VARCHAR(20) | NOT NULL, DEFAULT 'manual' | 'manual', 'hr_system', 'supervisor_override' |
| `escalation_chain_id` | UUID | NULLABLE, FK → staff_profiles(id) | Explicit escalation recipient (NULL = use default) |
| `hr_employee_id` | VARCHAR(50) | NULLABLE, UNIQUE | External HR system employee ID (for future integration) |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'staff' | 'staff', 'supervisor', 'admin' (for permissions) |
| `version` | INTEGER | NOT NULL, DEFAULT 0 | Optimistic locking version (incremented on update) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_staff_unit` on `unit_id` (for unit-based queries)
- `idx_staff_availability` on `availability_status` (for capacity checks)
- `idx_staff_skills` on `skills` using GIN (for skill matching queries)
- `idx_staff_hr_id` on `hr_employee_id` (for HR integration lookups)

**Validation Rules**:
- `current_assignment_count` <= `individual_wip_limit` (enforced by application)
- If `availability_status` = 'available', `unavailable_until` should be NULL
- `escalation_chain_id` cannot reference self (prevent circular escalation)

**Triggers**:
```sql
-- Auto-increment version on update (optimistic locking)
CREATE TRIGGER increment_staff_version
BEFORE UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION increment_version_column();

-- Update updated_at timestamp
CREATE TRIGGER update_staff_timestamp
BEFORE UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Sample Data**:
```sql
INSERT INTO staff_profiles (id, user_id, unit_id, skills, individual_wip_limit, role) VALUES
  ('staff-0001', 'user-123', '00000000-0000-0000-0000-000000000002', ARRAY['skill-0001', 'skill-0003'], 5, 'staff'),
  ('staff-0002', 'user-456', '00000000-0000-0000-0000-000000000002', ARRAY['skill-0001'], 5, 'supervisor'),
  ('staff-0003', 'user-789', '00000000-0000-0000-0000-000000000003', ARRAY['skill-0002', 'skill-0004'], 5, 'staff');
```

---

### 4. assignment_rules

Configurable rules defining how work items are matched to organizational units and required skills. Future extensibility for complex routing logic.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name_ar` | VARCHAR(255) | NOT NULL | Arabic name of the rule |
| `name_en` | VARCHAR(255) | NOT NULL | English name of the rule |
| `unit_id` | UUID | NOT NULL, FK → organizational_units(id) | Target unit for assignments matching this rule |
| `required_skills` | UUID[] | NOT NULL, CHECK array_length(required_skills, 1) >= 1 | Skills required to match this rule (FK → skills.id) |
| `priority_weight` | INTEGER | NOT NULL, DEFAULT 5, CHECK >= 1 AND <= 10 | Weight for scoring (higher = prioritize this rule) |
| `capacity_check_enabled` | BOOLEAN | NOT NULL, DEFAULT true | Whether to enforce WIP limits for this rule |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Whether rule is currently active |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_assignment_rules_unit` on `unit_id` (for unit-based lookups)
- `idx_assignment_rules_active` on `is_active` (filter inactive rules)
- `idx_assignment_rules_skills` on `required_skills` using GIN (for skill matching)

**Validation Rules**:
- `required_skills` array must not be empty
- `priority_weight` range 1-10 (higher = higher priority)

**Sample Data**:
```sql
INSERT INTO assignment_rules (id, name_ar, name_en, unit_id, required_skills, priority_weight) VALUES
  ('rule-0001', 'ترجمة وثائق دولية', 'International Document Translation', '00000000-0000-0000-0000-000000000002', ARRAY['skill-0001'], 8),
  ('rule-0002', 'مراجعة قانونية لوثائق دولية', 'Legal Review for International Docs', '00000000-0000-0000-0000-000000000003', ARRAY['skill-0002', 'skill-0001'], 7);
```

---

### 5. sla_configs

Lookup table defining SLA deadline calculation rules. Based on work item type and priority, returns deadline in hours.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `work_item_type` | ENUM | NOT NULL | 'dossier', 'ticket', 'position', 'task' |
| `priority` | ENUM | NOT NULL | 'urgent', 'high', 'normal', 'low' |
| `deadline_hours` | DECIMAL(10,2) | NOT NULL, CHECK > 0 | SLA deadline in hours (fractional for <1 hour) |
| `warning_threshold_pct` | INTEGER | NOT NULL, DEFAULT 75, CHECK >= 0 AND <= 100 | % of SLA elapsed before warning (typically 75%) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints**:
- `UNIQUE (work_item_type, priority)` (only one config per type+priority combo)

**Indexes**:
- `idx_sla_configs_lookup` on `(work_item_type, priority)` (for fast deadline lookups)

**Validation Rules**:
- Each combination of work_item_type + priority must have exactly one config

**Seed Data** (from FR-013):
```sql
INSERT INTO sla_configs (work_item_type, priority, deadline_hours) VALUES
  -- Dossiers
  ('dossier', 'urgent', 8.0),
  ('dossier', 'high', 24.0),
  ('dossier', 'normal', 48.0),
  ('dossier', 'low', 120.0), -- 5 days

  -- Tickets
  ('ticket', 'urgent', 2.0),
  ('ticket', 'high', 24.0),
  ('ticket', 'normal', 48.0),
  ('ticket', 'low', 120.0),

  -- Positions
  ('position', 'urgent', 4.0),
  ('position', 'high', 24.0),
  ('position', 'normal', 48.0),
  ('position', 'low', 120.0),

  -- Tasks
  ('task', 'urgent', 4.0),
  ('task', 'high', 24.0),
  ('task', 'normal', 48.0),
  ('task', 'low', 120.0);
```

---

### 6. assignments

Core assignment records linking work items to assignees with SLA tracking and escalation status.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `work_item_id` | UUID | NOT NULL | Foreign key to work item (polymorphic) |
| `work_item_type` | ENUM | NOT NULL | 'dossier', 'ticket', 'position', 'task' |
| `assignee_id` | UUID | NOT NULL, FK → staff_profiles(user_id) | Assigned staff member |
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When assignment was created |
| `assigned_by` | UUID | NULLABLE, FK → users(id) | Who assigned it (NULL if auto-assigned) |
| `sla_deadline` | TIMESTAMPTZ | NOT NULL | Calculated deadline (assigned_at + deadline_hours) |
| `priority` | ENUM | NOT NULL | 'urgent', 'high', 'normal', 'low' (denormalized for sorting) |
| `status` | ENUM | NOT NULL, DEFAULT 'assigned' | 'pending', 'assigned', 'in_progress', 'completed', 'cancelled' |
| `warning_sent_at` | TIMESTAMPTZ | NULLABLE | When 75% SLA warning was sent (NULL if not sent) |
| `escalated_at` | TIMESTAMPTZ | NULLABLE | When escalation occurred (NULL if not escalated) |
| `escalation_recipient_id` | UUID | NULLABLE, FK → staff_profiles(user_id) | Who was escalated to (NULL if not escalated) |
| `completed_at` | TIMESTAMPTZ | NULLABLE | When work was completed (NULL if not completed) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Constraints**:
- `UNIQUE (work_item_id, work_item_type) WHERE status IN ('assigned', 'in_progress')` (prevent duplicate active assignments)
- `CHECK (escalated_at IS NULL OR escalated_at >= assigned_at)` (escalation can't be before assignment)
- `CHECK (completed_at IS NULL OR completed_at >= assigned_at)` (completion can't be before assignment)

**Indexes**:
- `idx_assignments_assignee` on `assignee_id` (for "my assignments" queries)
- `idx_assignments_sla` on `sla_deadline` WHERE `status IN ('assigned', 'in_progress')` (for SLA monitoring)
- `idx_assignments_status` on `status` (for status filtering)
- `idx_assignments_work_item` on `(work_item_id, work_item_type)` (for lookups by work item)
- `idx_assignments_priority` on `priority` (for priority sorting)

**Triggers**:
```sql
-- Calculate SLA deadline on insert
CREATE TRIGGER calculate_sla_deadline
BEFORE INSERT ON assignments
FOR EACH ROW
EXECUTE FUNCTION calculate_sla_deadline_fn();

-- Process queue when assignment completes
CREATE TRIGGER assignment_completion_trigger
AFTER UPDATE ON assignments
FOR EACH ROW
WHEN (OLD.status IN ('assigned', 'in_progress') AND NEW.status IN ('completed', 'cancelled'))
EXECUTE FUNCTION process_queue_on_capacity_change();

-- Update assignee's assignment count
CREATE TRIGGER update_assignment_count
AFTER INSERT OR UPDATE OR DELETE ON assignments
FOR EACH ROW
EXECUTE FUNCTION update_staff_assignment_count();
```

**State Transitions**:
```
pending → assigned (auto or manual)
assigned → in_progress (staff starts work)
in_progress → completed (work done)
in_progress → cancelled (work cancelled)
assigned → cancelled (before starting)
```

**Sample Data**:
```sql
INSERT INTO assignments (id, work_item_id, work_item_type, assignee_id, sla_deadline, priority, status) VALUES
  ('assign-0001', 'dossier-123', 'dossier', 'staff-0001', now() + interval '48 hours', 'normal', 'assigned'),
  ('assign-0002', 'ticket-456', 'ticket', 'staff-0002', now() + interval '2 hours', 'urgent', 'in_progress');
```

---

### 7. assignment_queue

Priority queue for work items awaiting staff capacity. Processed FIFO within priority level when capacity becomes available.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `work_item_id` | UUID | NOT NULL | Foreign key to work item (polymorphic) |
| `work_item_type` | ENUM | NOT NULL | 'dossier', 'ticket', 'position', 'task' |
| `required_skills` | UUID[] | NOT NULL | Skills needed to process this item (FK → skills.id) |
| `target_unit_id` | UUID | NULLABLE, FK → organizational_units(id) | Preferred unit (NULL = any eligible unit) |
| `priority` | ENUM | NOT NULL | 'urgent', 'high', 'normal', 'low' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When item was queued |
| `attempts` | INTEGER | NOT NULL, DEFAULT 0 | Number of failed assignment attempts |
| `last_attempt_at` | TIMESTAMPTZ | NULLABLE | When last assignment was attempted (NULL if never attempted) |
| `notes` | TEXT | NULLABLE | Reason for queueing (e.g., "All staff at WIP limit") |

**Constraints**:
- `UNIQUE (work_item_id, work_item_type)` (prevent duplicate queue entries)
- `CHECK (attempts >= 0 AND attempts < 10)` (max 10 attempts before manual review)

**Indexes**:
- `idx_queue_priority_created` on `(priority DESC, created_at ASC)` (FIFO within priority)
- `idx_queue_skills` on `required_skills` using GIN (for skill matching)
- `idx_queue_attempts` on `attempts` (find stuck items)

**Processing Logic**:
- ORDER BY priority DESC, created_at ASC (urgent first, then oldest first)
- Increment `attempts` on each failed assignment
- Delete row on successful assignment
- Flag for manual review if attempts >= 10

**Sample Data**:
```sql
INSERT INTO assignment_queue (id, work_item_id, work_item_type, required_skills, priority, notes) VALUES
  ('queue-0001', 'ticket-789', 'ticket', ARRAY['skill-0001'], 'high', 'All translation staff at WIP limit'),
  ('queue-0002', 'dossier-456', 'dossier', ARRAY['skill-0002'], 'normal', 'Awaiting legal reviewer capacity');
```

---

### 8. escalation_events

Immutable audit trail of SLA breaches and escalations. Never deleted for compliance.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `assignment_id` | UUID | NOT NULL, FK → assignments(id) | Assignment that was escalated |
| `escalated_from_id` | UUID | NOT NULL, FK → staff_profiles(user_id) | Original assignee |
| `escalated_to_id` | UUID | NOT NULL, FK → staff_profiles(user_id) | Escalation recipient |
| `reason` | ENUM | NOT NULL | 'sla_breach', 'manual', 'capacity_exhaustion' |
| `escalated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When escalation occurred |
| `acknowledged_at` | TIMESTAMPTZ | NULLABLE | When recipient acknowledged escalation |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | When escalated issue was resolved |
| `notes` | TEXT | NULLABLE | Additional context for escalation |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp (same as escalated_at) |

**Constraints**:
- `CHECK (acknowledged_at IS NULL OR acknowledged_at >= escalated_at)` (acknowledgment can't be before escalation)
- `CHECK (resolved_at IS NULL OR resolved_at >= escalated_at)` (resolution can't be before escalation)

**Indexes**:
- `idx_escalation_assignment` on `assignment_id` (for assignment history)
- `idx_escalation_recipient` on `escalated_to_id` (for recipient's escalated items)
- `idx_escalation_date` on `escalated_at` (for reporting by time period)
- `idx_escalation_reason` on `reason` (for reporting by reason)

**Immutability**:
- No DELETE operations allowed (enforced by RLS policy)
- UPDATE allowed only for acknowledged_at, resolved_at, notes (audit fields protected)

**Sample Data**:
```sql
INSERT INTO escalation_events (id, assignment_id, escalated_from_id, escalated_to_id, reason, escalated_at) VALUES
  ('esc-0001', 'assign-0001', 'staff-0001', 'staff-0002', 'sla_breach', now() - interval '1 hour');
```

---

### 9. capacity_snapshots

Daily analytics snapshots of unit capacity utilization. Used for reporting and capacity planning.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `snapshot_date` | DATE | NOT NULL | Date of snapshot (midnight UTC) |
| `unit_id` | UUID | NOT NULL, FK → organizational_units(id) | Organizational unit |
| `total_staff` | INTEGER | NOT NULL | Number of staff members in unit (available status only) |
| `total_capacity` | INTEGER | NOT NULL | Sum of individual WIP limits |
| `active_assignments` | INTEGER | NOT NULL | Sum of current assignment counts |
| `utilization_pct` | DECIMAL(5,2) | NOT NULL | (active_assignments / total_capacity) * 100 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints**:
- `UNIQUE (snapshot_date, unit_id)` (one snapshot per unit per day)
- `CHECK (utilization_pct >= 0 AND utilization_pct <= 200)` (allow >100% for over-capacity situations)

**Indexes**:
- `idx_capacity_date_unit` on `(snapshot_date DESC, unit_id)` (for time-series queries)

**Retention Policy**:
- 90 days (aligned with assignment history retention)
- Partitioned by month for performance (optional optimization)

**Refresh Strategy**:
- pg_cron job runs daily at midnight UTC
- ON CONFLICT DO UPDATE for idempotency

**Sample Data**:
```sql
INSERT INTO capacity_snapshots (snapshot_date, unit_id, total_staff, total_capacity, active_assignments, utilization_pct) VALUES
  ('2025-10-02', '00000000-0000-0000-0000-000000000002', 10, 50, 32, 64.00),
  ('2025-10-02', '00000000-0000-0000-0000-000000000003', 15, 75, 68, 90.67);
```

---

## Enumerations

### availability_status
```sql
CREATE TYPE availability_status AS ENUM (
  'available',      -- Staff member can receive assignments
  'on_leave',       -- Temporarily unavailable (triggers reassignment)
  'unavailable'     -- Indefinitely unavailable (manual review required)
);
```

### work_item_type
```sql
CREATE TYPE work_item_type AS ENUM (
  'dossier',   -- International dossier
  'ticket',    -- Front-door intake ticket
  'position',  -- Talking points/position paper
  'task'       -- Generic task
);
```

### priority_level
```sql
CREATE TYPE priority_level AS ENUM (
  'urgent',  -- Highest priority, shortest SLA
  'high',
  'normal',  -- Default priority
  'low'      -- Lowest priority, longest SLA
);
```

### assignment_status
```sql
CREATE TYPE assignment_status AS ENUM (
  'pending',      -- Created but not yet assigned
  'assigned',     -- Assigned to staff, not started
  'in_progress',  -- Staff is actively working on it
  'completed',    -- Work finished successfully
  'cancelled'     -- Cancelled before completion
);
```

### escalation_reason
```sql
CREATE TYPE escalation_reason AS ENUM (
  'sla_breach',          -- SLA deadline reached (100%)
  'manual',              -- Manual escalation by user
  'capacity_exhaustion'  -- No capacity available, needs management attention
);
```

---

## Indexes Summary

**Performance-Critical Indexes** (created in migration):
```sql
-- Staff lookups
CREATE INDEX idx_staff_unit ON staff_profiles(unit_id);
CREATE INDEX idx_staff_availability ON staff_profiles(availability_status) WHERE availability_status = 'available';
CREATE INDEX idx_staff_skills ON staff_profiles USING GIN(skills);

-- Assignment queries
CREATE INDEX idx_assignments_assignee ON assignments(assignee_id);
CREATE INDEX idx_assignments_sla ON assignments(sla_deadline) WHERE status IN ('assigned', 'in_progress');
CREATE INDEX idx_assignments_priority ON assignments(priority DESC);

-- Queue processing
CREATE INDEX idx_queue_priority_created ON assignment_queue(priority DESC, created_at ASC);
CREATE INDEX idx_queue_skills ON assignment_queue USING GIN(required_skills);

-- SLA monitoring
CREATE INDEX idx_sla_configs_lookup ON sla_configs(work_item_type, priority);

-- Escalation reporting
CREATE INDEX idx_escalation_date ON escalation_events(escalated_at DESC);
CREATE INDEX idx_escalation_recipient ON escalation_events(escalated_to_id);
```

---

## Triggers & Functions

### Automatic Version Increment (Optimistic Locking)
```sql
CREATE OR REPLACE FUNCTION increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### SLA Deadline Calculation
```sql
CREATE OR REPLACE FUNCTION calculate_sla_deadline_fn()
RETURNS TRIGGER AS $$
DECLARE
  deadline_hours DECIMAL;
BEGIN
  -- Lookup deadline from sla_configs
  SELECT sc.deadline_hours INTO deadline_hours
  FROM sla_configs sc
  WHERE sc.work_item_type = NEW.work_item_type
    AND sc.priority = NEW.priority;

  -- Calculate deadline
  NEW.sla_deadline = NEW.assigned_at + (deadline_hours || ' hours')::INTERVAL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Assignment Count Maintenance
```sql
CREATE OR REPLACE FUNCTION update_staff_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE staff_profiles
    SET current_assignment_count = current_assignment_count + 1
    WHERE user_id = NEW.assignee_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE staff_profiles
    SET current_assignment_count = current_assignment_count - 1
    WHERE user_id = OLD.assignee_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IN ('assigned', 'in_progress') AND NEW.status IN ('completed', 'cancelled')) THEN
    UPDATE staff_profiles
    SET current_assignment_count = current_assignment_count - 1
    WHERE user_id = NEW.assignee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Data Retention

| Table | Retention Policy | Rationale |
|-------|------------------|-----------|
| `assignments` | 90 days active, 7 years archived | Operational data + compliance |
| `assignment_queue` | Deleted on successful assignment | Transient queue |
| `escalation_events` | Indefinite (never delete) | Audit trail for compliance |
| `capacity_snapshots` | 90 days | Analytics, aligned with assignments |
| `staff_profiles` | Indefinite (soft delete via availability) | Employee records |
| `organizational_units` | Indefinite (soft delete via is_active flag) | Org structure |
| `skills` | Indefinite | Reference data |
| `sla_configs` | Indefinite | Configuration data |

---

## Migration Strategy

**Order of Migrations**:
1. Create enums (availability_status, work_item_type, priority_level, assignment_status, escalation_reason)
2. Create organizational_units table
3. Create skills table
4. Create staff_profiles table with foreign keys
5. Create assignment_rules table
6. Create sla_configs table with seed data
7. Create assignments table with triggers
8. Create assignment_queue table
9. Create escalation_events table
10. Create capacity_snapshots table
11. Create indexes (parallel creation where possible)
12. Setup pg_cron jobs (SLA monitoring, capacity snapshots, queue fallback)
13. Create RLS policies

**Rollback Strategy**:
- Each migration has corresponding down migration
- Foreign keys prevent orphaned records
- Triggers disabled before table drops

---

## Next Steps

✅ **Data Model Complete**: All 9 entities defined with relationships, constraints, and indexes
➡️ **API Contracts**: Generate OpenAPI spec from this data model
➡️ **Quickstart Tests**: Create integration test scenarios based on state transitions
