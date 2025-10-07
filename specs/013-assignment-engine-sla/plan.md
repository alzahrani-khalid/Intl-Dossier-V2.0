# Implementation Plan: Assignment Engine & SLA

**Branch**: `013-assignment-engine-sla` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-assignment-engine-sla/spec.md`
**User Context**: ultrathink - comprehensive deep analysis with detailed technical decisions

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path → ✅ DONE
2. Fill Technical Context → ✅ DONE
   → Project Type: web (frontend + backend)
   → Structure Decision: Option 2 (backend/ + frontend/)
3. Fill Constitution Check → ✅ DONE
4. Evaluate Constitution Check → ✅ PASS (1 consideration documented)
5. Execute Phase 0 → research.md → ✅ DONE
6. Execute Phase 1 → contracts, data-model.md, quickstart.md → ✅ DONE
7. Re-evaluate Constitution Check → ✅ PASS (no new violations)
8. Plan Phase 2 → Describe task generation approach → ✅ DONE
9. STOP - Ready for /tasks command → ✅ READY
```

## Summary

The Assignment Engine & SLA feature automates work distribution across organizational units based on staff skills, capacity, and availability. It enforces Work-In-Progress (WIP) limits at both individual and unit levels, tracks Service Level Agreements (SLAs) with multiple deadline thresholds (8h-5d based on type/priority), and automatically escalates overdue items. The system queues work when capacity is exhausted, reassigns items when staff go on leave (urgent/high auto-reassign, normal/low flag for review), and prioritizes assignments by urgency while respecting SLA deadlines.

**Technical Approach**: Build on existing Supabase backend with PostgreSQL for assignment rules, staff profiles, and queues. Implement real-time SLA tracking using Supabase Realtime subscriptions. Create TanStack Query hooks for auto-assignment triggers, capacity checks, and escalation workflows. Add bilingual UI components for WIP dashboards, SLA countdowns, and escalation management using shadcn/ui components.

## Technical Context

**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**:
- Backend: Supabase SDK, Supabase Edge Functions runtime, Deno 1.x
- Frontend: React 18+, TanStack Router v5, TanStack Query v5, Tailwind CSS, shadcn/ui, i18next
- Shared: Zod for schema validation, date-fns for SLA calculations

**Storage**: PostgreSQL 15 via Supabase with:
- RLS policies for role-based access to assignments
- Triggers for auto-assignment on insert
- Cron jobs (pg_cron) for SLA monitoring and escalation
- Indexes on assignee_id, sla_deadline, priority, status

**Testing**:
- Contract tests: Deno test for Edge Functions
- Integration tests: Playwright for frontend E2E
- Unit tests: Vitest for business logic
- Performance tests: k6 for assignment engine throughput

**Target Platform**:
- Backend: Supabase Edge Functions (Deno runtime)
- Frontend: Modern browsers (ES2020+), RTL support for Arabic
- Deployment: Docker containers via Supabase CLI

**Project Type**: web - determines source structure (backend/ + frontend/)

**Performance Goals**:
- Assignment engine: <500ms p95 for auto-assignment decision
- SLA check: Process 10,000 active assignments in <5 seconds
- Escalation: Send notifications within 1 minute of deadline breach
- Queue processing: Assign queued items within 30 seconds of capacity change

**Constraints**:
- Real-time SLA updates: <2 second staleness for UI countdown
- Concurrent assignment: Prevent double-assignment race conditions via DB constraints
- Offline tolerance: Queue work items when assignment service temporarily unavailable
- Bilingual support: All notifications, error messages, and UI text in Arabic + English

**Scale/Scope**:
- 500 concurrent staff members across 20 organizational units
- 5,000 active assignments at peak load
- 200 skills tracked across all units
- 1,000 work items created per day
- 90-day retention for assignment history, indefinite for escalation audit trail

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. Bilingual Excellence
- ✅ **PASS**: All UI components will use i18next for ar/en translations
- ✅ **PASS**: Database fields for assignment rules, skills, escalation messages stored in JSON with ar/en keys
- ✅ **PASS**: RTL layout for assignment dashboards, SLA countdowns, queue views
- ✅ **PASS**: Date/time formatting respects locale (Hijri calendar for Arabic if configured)

### 2. Type Safety
- ✅ **PASS**: TypeScript strict mode enabled in both frontend and backend
- ✅ **PASS**: Zod schemas for:
  - Assignment rule validation
  - Staff profile structure
  - Work item metadata
  - SLA configuration
  - Escalation events
- ✅ **PASS**: No `any` types - use `unknown` with type guards for external data
- ✅ **PASS**: Components <200 lines (split AssignmentQueue, SLADashboard, EscalationPanel)

### 3. Security-First
- ✅ **PASS**: RLS policies on all assignment-related tables:
  - Staff can view only their own assignments
  - Supervisors can view their unit's assignments
  - Admins can configure assignment rules
- ✅ **PASS**: Rate limiting on auto-assignment endpoint (100 req/min per user)
- ✅ **PASS**: Input validation both client and server for manual assignment override
- ✅ **PASS**: MFA enforcement already implemented in existing auth system
- ✅ **PASS**: Audit logging for escalation events and manual overrides

### 4. Data Sovereignty
- ✅ **PASS**: All assignment data in local Supabase instance
- ✅ **PASS**: No external dependencies (SLA calculations done in pg_cron, not third-party service)
- ✅ **PASS**: Email notifications via self-hosted SMTP (Supabase Auth triggers)

### 5. Resilient Architecture
- ✅ **PASS**: Error boundaries on assignment UI components
- ✅ **PASS**: Fallback for auto-assignment failure: queue item for manual review
- ✅ **PASS**: Graceful degradation if real-time SLA updates fail: poll every 30 seconds
- ✅ **PASS**: Timeout on assignment decision logic (5 second max, fallback to manual)
- ✅ **PASS**: Bilingual error messages for capacity exhaustion, SLA breach, escalation failures

### 6. Accessibility
- ✅ **PASS**: WCAG 2.1 AA compliance:
  - SLA countdown with ARIA live regions for screen readers
  - Keyboard navigation for assignment queue management
  - Color-blind safe indicators (red/amber/green SLA status also uses icons)
  - Focus indicators on all interactive elements
- ✅ **PASS**: Tested in both Arabic (RTL) and English (LTR) modes

### 7. Container-First
- ✅ **PASS**: Edge Functions deployed via Supabase CLI (containerized runtime)
- ✅ **PASS**: Frontend built in Docker multi-stage (Vite build → nginx serve)
- ⚠️ **CONSIDERATION**: pg_cron for SLA monitoring runs in Supabase managed PostgreSQL
  - **Justification**: pg_cron is PostgreSQL extension, managed by Supabase, no additional container needed
  - **Alternative rejected**: External cron container would require database access credentials, increasing attack surface

**Initial Gate**: PASS (1 minor consideration documented, not a blocker)

## Project Structure

### Documentation (this feature)
```
specs/013-assignment-engine-sla/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── api-spec.yaml    # OpenAPI specification
│   └── sla-matrix.md    # SLA timeframe reference
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── src/
│   ├── models/
│   │   ├── assignment-rule.ts        # Assignment logic configuration
│   │   ├── staff-profile.ts          # Staff skills, capacity, availability
│   │   ├── work-item.ts              # Generic work item interface
│   │   └── sla-config.ts             # SLA deadline matrix
│   ├── services/
│   │   ├── assignment-engine.ts      # Core auto-assignment logic
│   │   ├── capacity-tracker.ts       # WIP limit enforcement
│   │   ├── sla-tracker.ts            # Deadline calculation & monitoring
│   │   ├── escalation.service.ts     # Escalation workflow
│   │   └── queue-manager.ts          # Assignment queue processing
│   └── api/
│       ├── assignments.ts            # Assignment CRUD endpoints
│       └── sla-monitoring.ts         # SLA status endpoints
└── tests/
    ├── contract/
    │   ├── auto-assign.test.ts
    │   ├── capacity-check.test.ts
    │   ├── sla-tracking.test.ts
    │   └── escalation.test.ts
    ├── integration/
    │   ├── leave-reassignment.test.ts
    │   ├── queue-processing.test.ts
    │   └── sla-breach-flow.test.ts
    └── unit/
        ├── assignment-engine.test.ts
        └── sla-calculator.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── AssignmentQueue.tsx       # Queued items display
│   │   ├── SLACountdown.tsx          # Real-time deadline countdown
│   │   ├── WIPDashboard.tsx          # Capacity utilization view
│   │   ├── EscalationPanel.tsx       # Escalation history & actions
│   │   └── ManualAssign.tsx          # Override auto-assignment
│   ├── hooks/
│   │   ├── useAutoAssign.ts          # Trigger auto-assignment
│   │   ├── useCapacityCheck.ts       # Check staff availability
│   │   ├── useSLAStatus.ts           # Subscribe to SLA updates
│   │   └── useEscalate.ts            # Escalate overdue items
│   └── pages/
│       ├── AssignmentsDashboard.tsx  # Main assignment overview
│       └── MyAssignments.tsx         # Individual staff view
└── tests/
    ├── e2e/
    │   ├── auto-assign-flow.spec.ts
    │   ├── sla-breach-escalation.spec.ts
    │   └── leave-reassignment.spec.ts
    └── a11y/
        ├── assignment-keyboard-nav.spec.ts
        └── sla-countdown-aria.spec.ts

supabase/
├── migrations/
│   ├── 20251002001_create_assignment_rules.sql
│   ├── 20251002002_create_staff_profiles.sql
│   ├── 20251002003_create_assignment_queue.sql
│   ├── 20251002004_create_sla_config.sql
│   ├── 20251002005_create_escalation_events.sql
│   ├── 20251002006_create_auto_assign_trigger.sql
│   ├── 20251002007_setup_sla_monitoring_cron.sql
│   └── 20251002008_create_rls_policies.sql
└── functions/
    ├── assignments-auto-assign/
    ├── assignments-manual-override/
    ├── sla-check-and-escalate/
    ├── queue-process/
    └── capacity-snapshot/
```

**Structure Decision**: Option 2 (web application with backend/ + frontend/)

## Phase 0: Outline & Research

### Unknowns from Technical Context (5 remaining from spec)
1. **Override Permissions**: Which user roles can manually override auto-assignments?
2. **Availability Integration**: Is availability status set manually by users or integrated with an HR/leave management system?
3. **Escalation Chain Definition**: How is the escalation chain configured?
4. **Escalation History Retention**: How long should escalation event history be retained?
5. **Capacity Analytics**: Does the system need to track historical capacity utilization?

### Research Tasks
1. **Research: Assignment Algorithm Patterns**
   - **Question**: What algorithms are used for work assignment in task management systems?
   - **Focus**: Round-robin, load balancing, skill-based routing, priority queues
   - **Deliverable**: Recommended algorithm with O(n) complexity for 500 staff members

2. **Research: SLA Monitoring Best Practices**
   - **Question**: How should SLA monitoring be implemented in PostgreSQL?
   - **Focus**: pg_cron vs external schedulers, performance impact of frequent checks
   - **Deliverable**: Architecture decision for 5,000 concurrent SLA timers

3. **Research: Race Condition Prevention**
   - **Question**: How to prevent double-assignment when multiple items arrive simultaneously?
   - **Focus**: Database locking strategies, optimistic vs pessimistic locking
   - **Deliverable**: Transaction isolation level and locking approach

4. **Research: Real-time SLA Updates**
   - **Question**: How to efficiently push SLA countdown updates to connected clients?
   - **Focus**: Supabase Realtime channel strategies, client-side polling alternatives
   - **Deliverable**: Scalability analysis for 500 concurrent users watching SLA countdowns

5. **Research: Queue Processing Triggers**
   - **Question**: How to automatically process assignment queue when capacity changes?
   - **Focus**: Database triggers vs application-level listeners, debouncing strategies
   - **Deliverable**: Event-driven architecture for queue processing

6. **Research: Leave Management Integration**
   - **Question**: Should system integrate with external HR system or manage availability internally?
   - **Focus**: API integration patterns, data synchronization, fallback mechanisms
   - **Deliverable**: Integration decision with justification

**Output**: research.md with all decisions documented and unknowns resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

### 1. Data Model Extraction

**Entities from Feature Spec**:

1. **assignment_rules**
   - Fields: id, unit_id, required_skills[], priority_weight, capacity_check_enabled, created_at
   - Validation: At least one skill required, priority_weight 1-10
   - Relationships: Belongs to organizational_units

2. **staff_profiles**
   - Fields: id, user_id, unit_id, skills[], individual_wip_limit, availability_status, escalation_chain_id, current_assignment_count, updated_at
   - Validation: WIP limit 1-20, availability enum (available/on_leave/unavailable)
   - Relationships: Belongs to users, organizational_units
   - State transitions: available ↔ on_leave ↔ unavailable

3. **organizational_units**
   - Fields: id, name_ar, name_en, unit_wip_limit, parent_unit_id, created_at
   - Validation: WIP limit 1-100
   - Relationships: Self-referencing hierarchy

4. **skills**
   - Fields: id, name_ar, name_en, category, created_at
   - Validation: Unique name per language
   - Relationships: Many-to-many with staff_profiles, work_items

5. **assignments**
   - Fields: id, work_item_id, work_item_type, assignee_id, assigned_at, sla_deadline, priority, status, escalated_at, escalation_recipient_id
   - Validation: work_item_type enum (dossier/ticket/position/task)
   - State transitions: pending → assigned → in_progress → completed/escalated
   - Relationships: Belongs to staff_profiles (assignee), references work items

6. **assignment_queue**
   - Fields: id, work_item_id, work_item_type, required_skills[], priority, created_at, attempts, last_attempt_at
   - Validation: Priority enum (urgent/high/normal/low), attempts < 10
   - Relationships: References work items
   - Processing: FIFO within priority level

7. **sla_configs**
   - Fields: id, work_item_type, priority, deadline_hours (NUMERIC(5,2)), warning_threshold_pct, created_at
   - Validation: deadline_hours > 0, warning_threshold 0-100
   - Relationships: None (lookup table)
   - Data: Matrix from FR-013

8. **escalation_events**
   - Fields: id, assignment_id, escalated_from_id, escalated_to_id, reason, escalated_at, acknowledged_at, resolved_at
   - Validation: Reason enum (sla_breach/manual/capacity_exhaustion)
   - Audit: Immutable records, indexed by escalated_at
   - Relationships: Belongs to assignments, staff_profiles

**Output**: data-model.md with full entity definitions

### 2. API Contract Generation

**Endpoints from Functional Requirements**:

1. **POST /assignments/auto-assign** (FR-001 to FR-006)
   - Request: `{ work_item_id: string, work_item_type: string, required_skills: string[], priority: string }`
   - Response: `{ assignment_id: string, assignee_id: string, sla_deadline: timestamp }` or `{ queued: true, queue_position: number }`
   - Error: 429 if rate limit exceeded, 400 if invalid skills

2. **POST /assignments/manual-override** (FR-007)
   - Request: `{ work_item_id: string, assignee_id: string, override_reason: string }`
   - Response: `{ assignment_id: string }`
   - Auth: Requires supervisor or admin role
   - Error: 403 if insufficient permissions

3. **GET /assignments/queue** (FR-010)
   - Response: `{ items: [{ work_item_id, type, priority, skills, queued_at, position }] }`
   - Pagination: 50 items per page
   - Filtering: By priority, work item type

4. **GET /assignments/my-assignments** (FR-014)
   - Response: `{ assignments: [{ id, work_item, sla_deadline, time_remaining, status }] }`
   - Real-time: Subscribes to Supabase Realtime for SLA updates

5. **POST /assignments/escalate** (FR-016 to FR-018)
   - Request: `{ assignment_id: string, reason: string }`
   - Response: `{ escalation_id: string, escalated_to_id: string }`
   - Side effects: Creates escalation_event, sends notifications

6. **GET /capacity/check** (FR-008, FR-009)
   - Request: `{ staff_id?: string, unit_id?: string }`
   - Response: `{ available_capacity: number, wip_current: number, wip_limit: number, status: string }`

7. **PUT /staff/availability** (FR-011a, FR-011b)
   - Request: `{ status: 'available' | 'on_leave' | 'unavailable' }`
   - Response: `{ updated: true, reassigned_items: string[] }`
   - Side effects: Triggers reassignment workflow for urgent/high items

**Output**: `/contracts/api-spec.yaml` (OpenAPI 3.1)

### 3. Contract Test Generation

**Test Files** (one per endpoint):

- `backend/tests/contract/auto-assign.test.ts`: Assert request/response schemas, verify assignment logic honors WIP limits
- `backend/tests/contract/manual-override.test.ts`: Assert auth requirements, verify override creates assignment
- `backend/tests/contract/queue-processing.test.ts`: Assert queue ordering, verify FIFO within priority
- `backend/tests/contract/sla-status.test.ts`: Assert SLA calculation accuracy, verify real-time updates
- `backend/tests/contract/escalation.test.ts`: Assert escalation triggers, verify notification dispatch

**Test Status**: All tests will fail initially (no implementation yet) - this is expected TDD behavior

**Output**: Contract tests in `backend/tests/contract/`

### 4. Integration Test Scenarios

**From User Stories** (Acceptance Scenarios in spec):

1. **Scenario: Skill-based auto-assignment** (AS-1)
   - Test: Create ticket requiring Arabic translation → Assert assigned to staff with Arabic skill
   - Files: `frontend/tests/e2e/auto-assign-flow.spec.ts`

2. **Scenario: WIP limit enforcement** (AS-2, AS-2a)
   - Test: Assign items until staff WIP limit reached → Assert next item queued
   - Test: Assign items until unit WIP limit reached → Assert next item queued even if individual has capacity
   - Files: `backend/tests/integration/wip-enforcement.test.ts`

3. **Scenario: SLA escalation** (AS-3)
   - Test: Create assignment with 48h SLA → Fast-forward 36 hours → Assert escalation triggered
   - Files: `frontend/tests/e2e/sla-breach-escalation.spec.ts`

4. **Scenario: Priority-based assignment** (AS-4)
   - Test: Create normal and urgent items → Assert urgent assigned first
   - Files: `backend/tests/integration/priority-assignment.test.ts`

5. **Scenario: Queue processing on capacity change** (AS-5)
   - Test: Queue 5 items → Mark assignment complete → Assert queued item auto-assigned within 30s
   - Files: `backend/tests/integration/queue-processing.test.ts`

6. **Scenario: Leave-based reassignment** (AS-6)
   - Test: Staff with 5 assignments goes on leave → Assert urgent/high reassigned, normal/low flagged
   - Files: `frontend/tests/e2e/leave-reassignment.spec.ts`

**Output**: Integration test scenarios in quickstart.md

### 5. Agent Context Update

**Execution**:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

**New Technologies to Add**:
- Assignment engine algorithms (from Phase 0 research)
- pg_cron for SLA monitoring
- Supabase Realtime for SLA countdown subscriptions
- Queue processing event-driven architecture

**Preserve**: Manual additions between `<!-- MANUAL ADDITIONS START -->` and `<!-- MANUAL ADDITIONS END -->`

**Output**: Updated `/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/CLAUDE.md`

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

**From Phase 1 Design Docs**:

1. **Load** `.specify/templates/tasks-template.md` as base structure
2. **Generate tasks from contracts** (api-spec.yaml):
   - Each endpoint → 1 contract test task [P]
   - Each endpoint → 1 implementation task
3. **Generate tasks from data model** (data-model.md):
   - Each entity → 1 migration task [P]
   - Each entity → 1 Zod schema task [P]
4. **Generate tasks from integration scenarios** (quickstart.md):
   - Each scenario → 1 E2E test task
5. **Infrastructure tasks**:
   - Setup pg_cron for SLA monitoring
   - Create Supabase Realtime channel for SLA updates
   - Configure RLS policies from constitution check

**Estimated Tasks**: 35-40 tasks

### Task Ordering Strategy

**TDD Order**:
1. Migrations first (setup database schema)
2. Contract tests (define API expectations)
3. Integration tests (define user flows)
4. Implementation (make tests pass)

**Dependency Order**:
- Database migrations → Zod schemas → Services → API endpoints → UI components
- Core entities (staff, units, skills) → Assignment logic → SLA tracking → Escalation → Queue processing

**Parallel Execution** (mark [P]):
- All migration files independent [P]
- All contract test files independent [P]
- UI components independent after hooks implemented [P]

**Sample Task Structure**:
```
T001 [P]: Create assignment_rules migration
T002 [P]: Create staff_profiles migration
T003 [P]: Create organizational_units migration
...
T010 [P]: Write contract test for auto-assign endpoint
T011 [P]: Write contract test for manual-override endpoint
...
T020: Implement assignment-engine.ts service (depends on T001-T009)
T021: Implement capacity-tracker.ts service (depends on T002-T003)
...
T030: Create AssignmentQueue.tsx component (depends on T025 hook)
```

**Estimated Output**: 35-40 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation per Technical Context goals)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| pg_cron in managed PostgreSQL | SLA monitoring requires scheduled checks every 30 seconds for 5,000 assignments | External cron container would need DB credentials, increasing attack surface; application-level timers wouldn't survive restarts |

**Justification**: Using pg_cron keeps security perimeter small (no additional credentials) and ensures monitoring continues even if application containers restart. This is the simplest solution that meets reliability requirements.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅ 2025-10-02
- [x] Phase 1: Design complete (/plan command) ✅ 2025-10-02
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅ 2025-10-02
- [ ] Phase 3: Tasks generated (/tasks command) - **NEXT STEP**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (1 consideration documented) ✅
- [x] Post-Design Constitution Check: PASS (no new violations) ✅
- [x] All NEEDS CLARIFICATION resolved: 5 resolved with defaults (documented in research.md) ✅
- [x] Complexity deviations documented: 1 (pg_cron usage) ✅

**Artifacts Generated**:
- [x] research.md (6 research areas + 5 clarifications resolved)
- [x] data-model.md (9 entities with relationships, constraints, triggers)
- [x] contracts/api-spec.yaml (OpenAPI 3.1 with 6 endpoints)
- [x] quickstart.md (6 acceptance scenarios with step-by-step validation)
- [x] CLAUDE.md updated with assignment engine technologies

---
*Based on Constitution v2.1.1 - See `.specify/memory/constitution.md`*
