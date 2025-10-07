# Quick Start: Assignment Engine & SLA

**Feature**: Assignment Engine & SLA
**Date**: 2025-10-02
**Purpose**: Integration test scenarios that validate the entire auto-assignment, SLA tracking, and escalation workflow end-to-end.

## Overview

This document provides step-by-step test scenarios that can be executed manually (QA) or automated (Playwright/Vitest). Each scenario validates a specific user story from the feature spec acceptance criteria.

**Prerequisites**:
- Supabase project running locally or in staging environment
- Test data seeded (organizational units, skills, staff profiles)
- Frontend application running on localhost
- Backend Edge Functions deployed

---

## Test Data Setup

Run before executing any scenarios:

```sql
-- Create organizational units
INSERT INTO organizational_units (id, name_ar, name_en, unit_wip_limit) VALUES
  ('unit-translation', 'قسم الترجمة', 'Translation Department', 20),
  ('unit-analysis', 'قسم التحليل', 'Analysis Department', 30),
  ('unit-legal', 'القسم القانوني', 'Legal Department', 15);

-- Create skills
INSERT INTO skills (id, name_ar, name_en, category) VALUES
  ('skill-arabic', 'ترجمة عربي-إنجليزي', 'Arabic-English Translation', 'languages'),
  ('skill-legal', 'مراجعة قانونية', 'Legal Review', 'domain'),
  ('skill-analysis', 'تحليل إحصائي', 'Statistical Analysis', 'technical'),
  ('skill-writing', 'كتابة تقنية', 'Technical Writing', 'technical');

-- Create staff profiles (users must exist in auth.users first)
INSERT INTO staff_profiles (id, user_id, unit_id, skills, individual_wip_limit, role) VALUES
  ('staff-translator-1', (SELECT id FROM auth.users WHERE email = 'translator1@gastat.gov.sa'), 'unit-translation', ARRAY['skill-arabic', 'skill-writing'], 5, 'staff'),
  ('staff-translator-2', (SELECT id FROM auth.users WHERE email = 'translator2@gastat.gov.sa'), 'unit-translation', ARRAY['skill-arabic'], 5, 'staff'),
  ('staff-supervisor', (SELECT id FROM auth.users WHERE email = 'supervisor@gastat.gov.sa'), 'unit-translation', ARRAY['skill-arabic'], 8, 'supervisor'),
  ('staff-analyst', (SELECT id FROM auth.users WHERE email = 'analyst@gastat.gov.sa'), 'unit-analysis', ARRAY['skill-analysis'], 5, 'staff'),
  ('staff-lawyer', (SELECT id FROM auth.users WHERE email = 'lawyer@gastat.gov.sa'), 'unit-legal', ARRAY['skill-legal'], 5, 'staff');

-- Seed SLA configs (from data-model.md)
INSERT INTO sla_configs (work_item_type, priority, deadline_hours) VALUES
  ('ticket', 'urgent', 2.0),
  ('ticket', 'high', 24.0),
  ('ticket', 'normal', 48.0),
  ('dossier', 'urgent', 8.0),
  ('dossier', 'high', 24.0),
  ('dossier', 'normal', 48.0);
```

---

## Scenario 1: Skill-Based Auto-Assignment

**User Story**: AS-1 from spec
**Validates**: FR-001, FR-002, FR-003 (Auto-assignment with skill matching)

### Setup
- Staff profile: translator1@gastat.gov.sa with `skill-arabic` and `skill-writing`
- Staff profile: translator2@gastat.gov.sa with `skill-arabic` only
- Both staff have 0 active assignments (under WIP limit)

### Test Steps

1. **Create intake ticket requiring Arabic translation**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/assignments/auto-assign \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "work_item_id": "ticket-001",
       "work_item_type": "ticket",
       "required_skills": ["skill-arabic"],
       "priority": "normal"
     }'
   ```

2. **Expected Response**
   ```json
   {
     "assignment_id": "assign-001",
     "assignee_id": "staff-translator-1",
     "assigned_at": "2025-10-02T10:00:00Z",
     "sla_deadline": "2025-10-04T10:00:00Z",
     "time_remaining_seconds": 172800,
     "priority": "normal",
     "status": "assigned"
   }
   ```

3. **Verify in Database**
   ```sql
   SELECT assignee_id, work_item_id, sla_deadline, status
   FROM assignments
   WHERE work_item_id = 'ticket-001';
   ```
   - Should return: assignee is `staff-translator-1` (has more skills, higher score)
   - SLA deadline is 48 hours from assigned_at

4. **Verify in Frontend**
   - Login as translator1@gastat.gov.sa
   - Navigate to "My Assignments" page
   - Should see ticket-001 listed with SLA countdown
   - SLA status indicator should be "green" (not at risk)

### Success Criteria
- ✅ Ticket assigned to translator with matching skills
- ✅ Translator with more skills (higher score) is preferred
- ✅ SLA deadline calculated correctly (48 hours for normal ticket)
- ✅ Assignment appears in "My Assignments" page

---

## Scenario 2: WIP Limit Enforcement

**User Story**: AS-2, AS-2a from spec
**Validates**: FR-005, FR-008, FR-010 (WIP limits and queueing)

### Setup
- Staff: translator1@gastat.gov.sa has individual WIP limit of 5
- Translation unit has unit WIP limit of 20
- Pre-assign 5 tickets to translator1 (at individual limit)
- Pre-assign 15 tickets to other translators (unit at 20 total)

### Test Steps (Individual Limit)

1. **Attempt to assign 6th ticket to translator at WIP limit**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/assignments/auto-assign \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "work_item_id": "ticket-006",
       "work_item_type": "ticket",
       "required_skills": ["skill-arabic"],
       "priority": "normal"
     }'
   ```

2. **Expected Response (Queued)**
   ```json
   {
     "queued": true,
     "queue_id": "queue-001",
     "queue_position": 1,
     "queued_at": "2025-10-02T10:30:00Z",
     "reason": "All staff at WIP limit"
   }
   ```

3. **Verify Queue Entry**
   ```sql
   SELECT work_item_id, priority, created_at, attempts
   FROM assignment_queue
   WHERE work_item_id = 'ticket-006';
   ```

4. **Complete one assignment to free capacity**
   ```sql
   UPDATE assignments
   SET status = 'completed', completed_at = now()
   WHERE assignee_id = 'staff-translator-1'
     AND status = 'assigned'
   LIMIT 1;
   ```

5. **Wait 30 seconds for queue processor trigger**

6. **Verify automatic assignment from queue**
   ```sql
   SELECT assignee_id, status FROM assignments WHERE work_item_id = 'ticket-006';
   -- Should now be assigned to translator1

   SELECT * FROM assignment_queue WHERE work_item_id = 'ticket-006';
   -- Should be deleted (assigned from queue)
   ```

### Test Steps (Unit Limit)

1. **Scenario: Unit at 20 assignments, individual has capacity (2/5)**
   ```sql
   -- Verify unit total
   SELECT SUM(current_assignment_count) FROM staff_profiles WHERE unit_id = 'unit-translation';
   -- Should be 20 (unit limit reached)
   ```

2. **Attempt assignment to staff with individual capacity**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/assignments/auto-assign \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -d '{
       "work_item_id": "ticket-unit-overflow",
       "work_item_type": "ticket",
       "required_skills": ["skill-arabic"],
       "priority": "normal"
     }'
   ```

3. **Expected: Queued despite individual capacity**
   ```json
   {
     "queued": true,
     "reason": "Unit WIP limit reached (20/20)"
   }
   ```

### Success Criteria
- ✅ Assignment rejected when individual WIP limit reached
- ✅ Assignment rejected when unit WIP limit reached (even if individual has capacity)
- ✅ Item queued with correct priority
- ✅ Automatic assignment when capacity freed (within 30 seconds)
- ✅ Queue entry deleted after successful assignment

---

## Scenario 3: SLA Escalation

**User Story**: AS-3 from spec
**Validates**: FR-012, FR-013, FR-015, FR-016 (SLA tracking and escalation)

### Setup
- Staff: translator1@gastat.gov.sa
- Supervisor: supervisor@gastat.gov.sa (escalation_chain_id set on translator1)
- Assignment with 48-hour SLA (normal priority dossier)

### Test Steps

1. **Create assignment with known SLA deadline**
   ```sql
   INSERT INTO assignments (id, work_item_id, work_item_type, assignee_id, assigned_at, sla_deadline, priority, status)
   VALUES (
     'assign-sla-test',
     'dossier-sla-001',
     'dossier',
     'staff-translator-1',
     now() - interval '36 hours', -- 36 hours ago
     now() + interval '12 hours', -- 12 hours from now (75% elapsed)
     'normal',
     'assigned'
   );
   ```

2. **Wait for pg_cron SLA monitoring job (runs every 30 seconds)**
   - Or manually trigger: `SELECT sla_check_and_escalate();`

3. **Verify 75% warning sent**
   ```sql
   SELECT warning_sent_at FROM assignments WHERE id = 'assign-sla-test';
   -- Should have timestamp (75% threshold reached)
   ```

4. **Verify warning notification sent**
   ```sql
   SELECT * FROM notifications
   WHERE user_id = 'staff-translator-1'
     AND type = 'sla_warning'
     AND reference_id = 'assign-sla-test';
   ```

5. **Fast-forward to 100% SLA breach (for testing)**
   ```sql
   UPDATE assignments
   SET assigned_at = now() - interval '49 hours', -- More than 48 hours
       sla_deadline = now() - interval '1 hour'   -- Deadline passed
   WHERE id = 'assign-sla-test';
   ```

6. **Trigger SLA monitoring again**
   ```sql
   SELECT sla_check_and_escalate();
   ```

7. **Verify escalation event created**
   ```sql
   SELECT escalated_from_id, escalated_to_id, reason, escalated_at
   FROM escalation_events
   WHERE assignment_id = 'assign-sla-test';

   -- Expected:
   -- escalated_from_id = staff-translator-1
   -- escalated_to_id = staff-supervisor
   -- reason = 'sla_breach'
   ```

8. **Verify assignment marked as escalated**
   ```sql
   SELECT escalated_at, escalation_recipient_id
   FROM assignments
   WHERE id = 'assign-sla-test';
   -- Should have escalated_at timestamp and recipient_id
   ```

9. **Verify notifications sent to both parties**
   ```sql
   SELECT user_id, type, message_ar, message_en
   FROM notifications
   WHERE reference_id = 'assign-sla-test'
     AND type = 'sla_escalation';
   -- Should have 2 rows: one for assignee, one for supervisor
   ```

### Frontend Validation

1. **Login as translator1@gastat.gov.sa**
   - Navigate to "My Assignments"
   - Assignment should show "Escalated" badge
   - SLA status should be "red" (breached)

2. **Login as supervisor@gastat.gov.sa**
   - Navigate to "Escalations" panel
   - Should see dossier-sla-001 in escalated items list
   - Should have "Acknowledge" button

### Success Criteria
- ✅ Warning notification sent at 75% SLA elapsed
- ✅ Automatic escalation triggered at 100% (deadline breach)
- ✅ Escalation event created with correct recipient
- ✅ Notifications sent to both assignee and supervisor
- ✅ Frontend displays escalation status correctly

---

## Scenario 4: Priority-Based Assignment

**User Story**: AS-4 from spec
**Validates**: FR-006 (Priority handling)

### Setup
- Staff: translator1@gastat.gov.sa with 1 available capacity slot (4/5)
- Multiple tickets in queue: 2 normal, 1 urgent, 1 high

### Test Steps

1. **Queue multiple items with different priorities**
   ```sql
   INSERT INTO assignment_queue (work_item_id, work_item_type, required_skills, priority, created_at) VALUES
     ('ticket-normal-1', 'ticket', ARRAY['skill-arabic'], 'normal', now() - interval '5 minutes'),
     ('ticket-normal-2', 'ticket', ARRAY['skill-arabic'], 'normal', now() - interval '10 minutes'),
     ('ticket-urgent-1', 'ticket', ARRAY['skill-arabic'], 'urgent', now() - interval '2 minutes'),
     ('ticket-high-1', 'ticket', ARRAY['skill-arabic'], 'high', now() - interval '8 minutes');
   ```

2. **Trigger queue processing**
   ```sql
   -- Simulate capacity change (complete one assignment)
   UPDATE assignments
   SET status = 'completed'
   WHERE assignee_id = 'staff-translator-1' AND status = 'assigned'
   LIMIT 1;
   ```

3. **Wait for trigger or manually call queue processor**
   ```sql
   SELECT process_queue_for_unit('unit-translation');
   ```

4. **Verify assignment order: urgent first**
   ```sql
   SELECT work_item_id, assignee_id
   FROM assignments
   WHERE work_item_id IN ('ticket-urgent-1', 'ticket-high-1', 'ticket-normal-1', 'ticket-normal-2')
   ORDER BY assigned_at ASC;
   ```
   - First assignment should be `ticket-urgent-1` (highest priority)

5. **Complete assignment, free capacity again**
   ```sql
   UPDATE assignments SET status = 'completed' WHERE work_item_id = 'ticket-urgent-1';
   ```

6. **Verify next assignment: high priority**
   ```sql
   -- After processing, ticket-high-1 should be assigned before normal items
   ```

7. **Verify FIFO within same priority**
   - When both normal tickets are eligible, `ticket-normal-2` (older) should be assigned before `ticket-normal-1`

### Success Criteria
- ✅ Urgent items assigned before high items
- ✅ High items assigned before normal items
- ✅ Within same priority, oldest item assigned first (FIFO)
- ✅ Queue processing respects priority order consistently

---

## Scenario 5: Queue Processing on Capacity Change

**User Story**: AS-5 from spec
**Validates**: FR-010 (Automatic queue processing)

### Setup
- 5 items queued (all normal priority)
- All staff at WIP limit
- Queue processor should trigger when capacity freed

### Test Steps

1. **Seed queue with 5 items**
   ```sql
   INSERT INTO assignment_queue (work_item_id, work_item_type, required_skills, priority) VALUES
     ('queued-001', 'ticket', ARRAY['skill-arabic'], 'normal'),
     ('queued-002', 'ticket', ARRAY['skill-arabic'], 'normal'),
     ('queued-003', 'ticket', ARRAY['skill-arabic'], 'normal'),
     ('queued-004', 'ticket', ARRAY['skill-arabic'], 'normal'),
     ('queued-005', 'ticket', ARRAY['skill-arabic'], 'normal');
   ```

2. **Verify queue status via API**
   ```bash
   curl http://localhost:54321/functions/v1/assignments/queue \
     -H "Authorization: Bearer $SUPERVISOR_JWT"
   ```
   - Should show 5 items with positions 1-5

3. **Complete one assignment to free capacity**
   ```sql
   UPDATE assignments
   SET status = 'completed', completed_at = now()
   WHERE assignee_id = 'staff-translator-1' AND status = 'assigned'
   LIMIT 1;
   ```

4. **Monitor queue processing (should occur within 30 seconds)**
   ```sql
   -- Check assignment created
   SELECT * FROM assignments WHERE work_item_id = 'queued-001';

   -- Check queue entry deleted
   SELECT * FROM assignment_queue WHERE work_item_id = 'queued-001';
   -- Should be empty
   ```

5. **Verify subsequent processing**
   - Complete another assignment
   - Next queued item (queued-002) should be assigned
   - Process should continue until all items assigned or capacity exhausted

### Frontend Validation

1. **Login as supervisor@gastat.gov.sa**
2. **Navigate to "Assignment Queue" page**
3. **Should see real-time updates**:
   - Queue count decreases as items assigned
   - Queue positions update (item at position 2 moves to position 1)
   - Assigned items disappear from queue view

### Success Criteria
- ✅ Queue processed automatically when capacity freed
- ✅ Assignment occurs within 30 seconds of capacity change
- ✅ Queued item deleted after successful assignment
- ✅ Frontend queue view updates in real-time
- ✅ Oldest item (within priority) assigned first

---

## Scenario 6: Leave-Based Reassignment

**User Story**: AS-6 from spec
**Validates**: FR-011a, FR-011b (Leave handling with priority-based reassignment)

### Setup
- Staff: translator1@gastat.gov.sa with 5 assignments:
  - 2 urgent tickets
  - 1 high priority dossier
  - 2 normal tickets
- Other staff in same unit with available capacity

### Test Steps

1. **Pre-create assignments**
   ```sql
   INSERT INTO assignments (work_item_id, work_item_type, assignee_id, priority, status) VALUES
     ('urgent-001', 'ticket', 'staff-translator-1', 'urgent', 'assigned'),
     ('urgent-002', 'ticket', 'staff-translator-1', 'urgent', 'assigned'),
     ('high-001', 'dossier', 'staff-translator-1', 'high', 'assigned'),
     ('normal-001', 'ticket', 'staff-translator-1', 'normal', 'assigned'),
     ('normal-002', 'ticket', 'staff-translator-1', 'normal', 'assigned');
   ```

2. **Update staff availability to "on_leave"**
   ```bash
   curl -X PUT http://localhost:54321/functions/v1/staff/availability \
     -H "Authorization: Bearer $TRANSLATOR1_JWT" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "on_leave",
       "unavailable_until": "2025-10-15T00:00:00Z",
       "reason": "Annual leave"
     }'
   ```

3. **Expected Response**
   ```json
   {
     "updated": true,
     "status": "on_leave",
     "reassigned_items": [
       {
         "assignment_id": "assign-urgent-001",
         "work_item_id": "urgent-001",
         "new_assignee_id": "staff-translator-2",
         "new_assignee_name": "Translator 2"
       },
       {
         "assignment_id": "assign-urgent-002",
         "work_item_id": "urgent-002",
         "new_assignee_id": "staff-translator-2"
       },
       {
         "assignment_id": "assign-high-001",
         "work_item_id": "high-001",
         "new_assignee_id": "staff-translator-2"
       }
     ],
     "flagged_for_review": [
       {
         "assignment_id": "assign-normal-001",
         "work_item_id": "normal-001",
         "priority": "normal"
       },
       {
         "assignment_id": "assign-normal-002",
         "work_item_id": "normal-002",
         "priority": "normal"
       }
     ]
   }
   ```

4. **Verify database state**
   ```sql
   -- Urgent and high items reassigned
   SELECT assignee_id, status FROM assignments
   WHERE work_item_id IN ('urgent-001', 'urgent-002', 'high-001');
   -- Should have new assignee_id (not translator-1)

   -- Normal items still assigned to translator-1 but flagged
   SELECT assignee_id, needs_review FROM assignments
   WHERE work_item_id IN ('normal-001', 'normal-002');
   -- Should still be assigned to translator-1, needs_review = true
   ```

5. **Verify supervisor notification**
   ```sql
   SELECT * FROM notifications
   WHERE user_id = 'staff-supervisor'
     AND type = 'staff_leave_items_for_review';
   -- Should contain list of flagged items needing manual review
   ```

### Frontend Validation (Supervisor View)

1. **Login as supervisor@gastat.gov.sa**
2. **Navigate to "Team Assignments" dashboard**
3. **Should see notification**: "2 items need review due to Translator 1's leave"
4. **Click notification → "Flagged for Review" panel**
5. **Should see list of normal-001 and normal-002**
6. **Should have "Reassign" button for each item**

### Success Criteria
- ✅ Urgent items automatically reassigned to available staff with matching skills
- ✅ High priority items automatically reassigned
- ✅ Normal and low priority items flagged for manual review (not auto-reassigned)
- ✅ Supervisor notified of items needing review
- ✅ Staff availability status updated in database
- ✅ API response includes both reassigned and flagged items

---

## Performance Validation

### SLA Monitoring Performance

**Goal**: Process 10,000 active assignments in <5 seconds

```sql
-- Create 10,000 test assignments
INSERT INTO assignments (work_item_id, work_item_type, assignee_id, sla_deadline, priority, status)
SELECT
  'perf-test-' || generate_series,
  'ticket',
  (SELECT user_id FROM staff_profiles ORDER BY random() LIMIT 1),
  now() + interval '24 hours',
  'normal',
  'assigned'
FROM generate_series(1, 10000);

-- Time the SLA check
\timing on
SELECT sla_check_and_escalate();
\timing off
-- Should complete in < 5 seconds
```

### Assignment Engine Performance

**Goal**: Auto-assignment decision in <500ms p95

```bash
# Load test with k6
k6 run --vus 50 --duration 60s - <<EOF
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const payload = JSON.stringify({
    work_item_id: \`load-test-\${__VU}-\${__ITER}\`,
    work_item_type: 'ticket',
    required_skills: ['skill-arabic'],
    priority: 'normal'
  });

  const res = http.post(
    'http://localhost:54321/functions/v1/assignments/auto-assign',
    payload,
    { headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF
```

---

## Accessibility Testing

### Keyboard Navigation (SLA Countdown Component)

1. **Navigate to "My Assignments" page**
2. **Tab through assignments list**
3. **Verify**:
   - SLA countdown receives focus (focus indicator visible)
   - Screen reader announces time remaining
   - Arrow keys navigate between assignments
   - Enter key opens assignment detail

### ARIA Live Regions (Real-time SLA Updates)

1. **Open "My Assignments" with screen reader active (NVDA/JAWS)**
2. **Let SLA countdown update (every second)**
3. **Verify**:
   - Screen reader announces "Time remaining: 2 hours 15 minutes" without interrupting other content
   - Warning threshold crossing (75%) announces "Assignment at risk - 25% of SLA remaining"
   - Breach announces "SLA deadline exceeded"

### RTL Support (Arabic Interface)

1. **Switch language to Arabic**
2. **Navigate to Assignment Queue page**
3. **Verify**:
   - Queue table columns display right-to-left
   - Priority badges aligned to right
   - SLA countdown direction correct (countdown flows RTL)
   - Date/time formatting uses Arabic numerals if configured

---

## Clean Up

After testing, clean up test data:

```sql
-- Delete test assignments
DELETE FROM assignments WHERE work_item_id LIKE 'ticket-%' OR work_item_id LIKE 'dossier-%';

-- Delete queue entries
DELETE FROM assignment_queue;

-- Delete escalation events
DELETE FROM escalation_events WHERE assignment_id IN (SELECT id FROM assignments WHERE work_item_id LIKE '%test%');

-- Reset staff availability
UPDATE staff_profiles SET availability_status = 'available', current_assignment_count = 0;

-- Delete test notifications
DELETE FROM notifications WHERE reference_id LIKE '%test%';
```

---

## Next Steps

✅ **Quickstart Complete**: All 6 acceptance scenarios documented with step-by-step validation
➡️ **Agent Context Update**: Run update-agent-context.sh to add new technologies
➡️ **Phase 2 (via /tasks command)**: Generate tasks.md from this quickstart
