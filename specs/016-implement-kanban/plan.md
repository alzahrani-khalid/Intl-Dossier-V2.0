
# Implementation Plan: Full Engagement Kanban Board

**Branch**: `016-implement-kanban` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-implement-kanban/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web (frontend+backend) ✓
   → Structure Decision: Option 2 (Web application) ✓
3. Fill the Constitution Check section ✓
4. Evaluate Constitution Check section
   → No violations detected ✓
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
   → All clarifications resolved (Session 2025-10-07) ✓
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
7. Re-evaluate Constitution Check section
   → No new violations ✓
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Describe task generation approach ✓
9. STOP - Ready for /tasks command ✓
```

## Summary
Implement a full-featured Kanban board for engagement assignments with drag-and-drop functionality, real-time collaboration via Supabase Realtime subscriptions, role-based stage transition validation, dual SLA tracking (overall + per-stage), user-customizable notifications and sorting, and full mobile-first RTL/LTR support. The board displays assignments grouped by workflow stage (To Do, In Progress, Review, Done, Cancelled) with touch-friendly interactions and accessibility compliance.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, Supabase Client SDK, TanStack Router v5, TanStack Query v5, @dnd-kit/core (drag-and-drop), shadcn/ui (Kanban components from kibo-ui), Tailwind CSS, i18next
**Storage**: PostgreSQL 15 via Supabase with existing assignments table, RLS policies for access control
**Testing**: Vitest (unit), Playwright (E2E), @testing-library/react (component tests)
**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge), iOS Safari, Android Chrome
**Project Type**: web - frontend + backend (Supabase Edge Functions)
**Performance Goals**: <100ms drag feedback, <200ms stage transition update, real-time updates <500ms latency
**Constraints**: Mobile-first design (320px min width), RTL support for Arabic, 44x44px minimum touch targets, WCAG 2.1 Level AA compliance
**Scale/Scope**: 5-50 assignments per engagement (typical), 100+ engagements, 50-100 concurrent users

**User Input Context**: ultrathink - This is a high-complexity feature requiring careful planning for real-time collaboration, role-based permissions, dual SLA tracking, and extensive accessibility requirements.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Research)
- [x] **§1 Bilingual Excellence**: Arabic/English RTL/LTR support from day one (FR-007)
- [x] **§2 Type Safety**: TypeScript strict mode, explicit types, components <200 lines
- [x] **§3 Security-First**: RLS enforced, role-based validation (FR-010), input validation
- [x] **§4 Data Sovereignty**: Self-hosted Supabase, no external dependencies
- [x] **§5 Resilient Architecture**: Error boundaries, graceful failure handling (FR-009), real-time fallback
- [x] **§6 Accessibility**: WCAG 2.1 AA, keyboard navigation, ARIA labels, mobile touch targets (FR-006)
- [x] **§7 Container-First**: Docker containerization (Supabase managed services)

**Violations**: None detected

### Post-Design Check (After Phase 1)
- [x] **§1 Bilingual Excellence**: i18n keys for all UI text, RTL logical properties used
- [x] **§2 Type Safety**: TypeScript interfaces for assignment data, strict null checks
- [x] **§3 Security-First**: RLS policies validated, role checks in Edge Functions
- [x] **§4 Data Sovereignty**: All data in self-hosted Supabase PostgreSQL
- [x] **§5 Resilient Architecture**: Error boundaries around Kanban component, network error retry logic
- [x] **§6 Accessibility**: ARIA live regions for real-time updates, keyboard shortcuts, focus management
- [x] **§7 Container-First**: No additional containers required (Supabase managed)

**New Violations**: None

## Project Structure

### Documentation (this feature)
```
specs/016-implement-kanban/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── api-spec.yaml    # OpenAPI spec for new endpoints
│   └── realtime-spec.md # Supabase Realtime channel spec
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (frontend + backend detected)
backend/
├── src/
│   ├── services/
│   │   ├── kanban.service.ts         # Kanban board data fetching
│   │   └── stage-transition.service.ts # Stage transition validation
│   └── utils/
│       └── role-permissions.ts        # Role-based permission checks
└── tests/
    ├── contract/
    │   ├── engagements-kanban-get.test.ts
    │   └── assignments-workflow-stage-update.test.ts
    ├── integration/
    │   ├── kanban-real-time-updates.test.ts
    │   ├── role-based-stage-transitions.test.ts
    │   └── dual-sla-tracking.test.ts
    └── unit/
        └── role-permissions.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── assignments/
│   │   │   ├── EngagementKanbanDialog.tsx       # Main dialog (uncomment)
│   │   │   ├── KanbanBoard.tsx                  # Board container
│   │   │   ├── KanbanColumn.tsx                 # Stage column
│   │   │   ├── KanbanTaskCard.tsx               # Assignment card
│   │   │   └── KanbanSortDropdown.tsx           # Sort options
│   │   └── ui/
│   │       └── kanban.tsx                        # shadcn Kanban component
│   ├── hooks/
│   │   ├── useEngagementKanban.ts               # Fetch assignments by engagement
│   │   ├── useKanbanRealtime.ts                 # Supabase Realtime subscription
│   │   ├── useStageTransition.ts                # Mutation for stage updates
│   │   └── useRolePermissions.ts                # Check user role permissions
│   ├── services/
│   │   └── realtime-kanban.service.ts           # Realtime subscription logic
│   └── types/
│       └── kanban.ts                             # Kanban-specific types
└── tests/
    ├── e2e/
    │   ├── kanban-drag-drop-basic.spec.ts
    │   ├── kanban-real-time-collaboration.spec.ts
    │   ├── kanban-role-based-validation.spec.ts
    │   ├── kanban-rtl-support.spec.ts
    │   └── kanban-mobile-touch.spec.ts
    ├── unit/
    │   ├── useEngagementKanban.test.ts
    │   └── useRolePermissions.test.ts
    └── component/
        ├── KanbanColumn.test.tsx
        └── KanbanTaskCard.test.tsx
```

**Structure Decision**: Option 2 (Web application) - frontend + backend structure detected

## Phase 0: Outline & Research

### Research Tasks Completed

1. **Real-time Collaboration Architecture**:
   - **Decision**: Use Supabase Realtime subscriptions on `assignments` table
   - **Rationale**: Native Supabase feature, low latency (<500ms), scales to 100+ concurrent users
   - **Alternatives considered**: WebSocket custom implementation (rejected: reinvents wheel), polling (rejected: high latency)

2. **Drag-and-Drop Library Selection**:
   - **Decision**: @dnd-kit/core + kibo-ui Kanban component
   - **Rationale**: Excellent mobile touch support, accessibility built-in, RTL-aware, tree-shakeable
   - **Alternatives considered**: react-beautiful-dnd (rejected: no longer maintained), react-dnd (rejected: complex API, poor mobile support)

3. **Role-Based Permission Strategy**:
   - **Decision**: Server-side role validation in Edge Function + client-side optimistic UI
   - **Rationale**: Security via RLS policies, fast UX with optimistic updates, graceful rollback on failure
   - **Alternatives considered**: Client-only checks (rejected: insecure), sync validation (rejected: slow UX)

4. **Dual SLA Tracking Implementation**:
   - **Decision**: Separate `assignment_sla_overall` and `assignment_stage_history` tables
   - **Rationale**: Clean separation of concerns, enables historical analysis, efficient queries
   - **Alternatives considered**: Single denormalized table (rejected: complex queries), JSON columns (rejected: poor query performance)

5. **Large Dataset Optimization (Deferred)**:
   - **Decision**: Implement simple virtual scrolling with react-window initially
   - **Rationale**: Handles 50+ assignments without performance degradation, can optimize later based on usage
   - **Alternatives considered**: Pagination (rejected: breaks drag-and-drop UX), load-more buttons (rejected: awkward interaction)

6. **Notification Preferences Storage**:
   - **Decision**: Store in `staff_profiles.notification_preferences` JSONB column
   - **Rationale**: Flexible schema, no additional tables, fast lookups
   - **Alternatives considered**: Separate `notification_settings` table (rejected: over-engineered for this scope)

**Output**: research.md created with all decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

### 1. Data Model Extraction

Entities from feature spec mapped to database schema:

**Engagement** (existing table):
- `id` (uuid, PK)
- `title` (text)
- `created_at` (timestamptz)

**Assignment** (existing table, extended):
- `id` (uuid, PK)
- `engagement_id` (uuid, FK → engagements.id)
- `workflow_stage` (enum: 'todo', 'in_progress', 'review', 'done', 'cancelled')
- `assignee_id` (uuid, FK → staff_profiles.id)
- `priority` (enum: 'high', 'medium', 'low')
- `title` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `overall_sla_deadline` (timestamptz)
- `current_stage_sla_deadline` (timestamptz)

**AssignmentStageHistory** (new table):
- `id` (uuid, PK)
- `assignment_id` (uuid, FK → assignments.id)
- `from_stage` (workflow_stage_enum)
- `to_stage` (workflow_stage_enum)
- `transitioned_by` (uuid, FK → staff_profiles.id)
- `transitioned_at` (timestamptz)
- `stage_duration_seconds` (int)
- `stage_sla_met` (boolean)

**StaffProfile** (existing, extended):
- `id` (uuid, PK)
- `role` (enum: 'staff', 'manager', 'admin')
- `notification_preferences` (jsonb):
  ```json
  {
    "stage_transitions": {
      "enabled": true,
      "stages": ["review", "done"] // or "all"
    }
  }
  ```

**State Transitions**:
- **Staff**: todo → in_progress → review → done (sequential only)
- **Manager/Admin**: any stage → any stage (skip allowed)
- **All roles**: any stage → cancelled (emergency exit)

**Output**: data-model.md created

### 2. API Contracts Generated

**New Endpoints**:

1. `GET /engagements-kanban-get/:engagementId`
   - Returns: Assignments grouped by workflow_stage
   - Query params: `sort` (created_at|sla_deadline|priority)
   - Response: `{ columns: { todo: Assignment[], in_progress: Assignment[], ... } }`

2. `PATCH /assignments-workflow-stage-update/:assignmentId`
   - Body: `{ workflow_stage: string, triggered_by_user_id: string }`
   - Validates role-based permissions server-side
   - Updates stage + SLA tracking
   - Triggers Supabase Realtime broadcast
   - Response: `{ success: boolean, assignment: Assignment, validation_error?: string }`

**Supabase Realtime Channels**:
- Channel: `engagement:{engagementId}:kanban`
- Events:
  - `assignment:moved` - Broadcast when assignment stage changes
  - Payload: `{ assignment_id, from_stage, to_stage, moved_by_user_id }`

**Output**: contracts/api-spec.yaml, contracts/realtime-spec.md created

### 3. Contract Tests Generated

Created failing contract tests:
- `backend/tests/contract/engagements-kanban-get.test.ts` - GET endpoint contract
- `backend/tests/contract/assignments-workflow-stage-update.test.ts` - PATCH endpoint contract

Tests assert request/response schemas match OpenAPI spec. Currently fail (no implementation).

**Output**: Contract tests created in backend/tests/contract/

### 4. Integration Test Scenarios Extracted

From user stories → integration test scenarios:

1. **Real-time Collaboration** (Scenario 3):
   - Open Kanban board in 2 browser sessions
   - Move assignment in session 1
   - Assert session 2 sees update in <500ms

2. **Role-Based Validation** (Scenarios 5, 5a):
   - Staff user attempts stage skip → assert blocked with error
   - Manager user attempts stage skip → assert allowed

3. **Dual SLA Tracking** (Scenario 4):
   - Move assignment through stages
   - Assert both overall SLA and stage SLA recorded correctly

4. **RTL Support** (Scenario 7):
   - Set language to Arabic
   - Assert columns render right-to-left
   - Assert drag-and-drop works in RTL

5. **Mobile Touch** (Scenario 8):
   - Simulate touch events on mobile viewport
   - Assert drag-and-drop works with touch

**Output**: Integration test scenarios documented in quickstart.md

### 5. Update CLAUDE.md Incrementally

Running update script to add new technologies and recent changes:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

**Output**: CLAUDE.md updated with Kanban feature details

**Phase 1 Complete**: data-model.md, contracts/, failing tests, quickstart.md, CLAUDE.md generated

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. Load `.specify/templates/tasks-template.md` as base structure
2. Generate tasks from Phase 1 artifacts in this order:
   - **Phase 1: Schema & Contracts** (Backend Foundation)
     - Create migration for `assignment_stage_history` table [P]
     - Add notification_preferences JSONB column to staff_profiles [P]
     - Create contract test: engagements-kanban-get [P]
     - Create contract test: assignments-workflow-stage-update [P]

   - **Phase 2: Backend Services** (Business Logic)
     - Implement role-permissions utility (role validation logic)
     - Implement kanban.service.ts (fetch assignments grouped by stage)
     - Implement stage-transition.service.ts (validate + update stage)
     - Create Edge Function: engagements-kanban-get
     - Create Edge Function: assignments-workflow-stage-update

   - **Phase 3: Frontend Hooks** (Data Layer)
     - Create useEngagementKanban hook (TanStack Query)
     - Create useKanbanRealtime hook (Supabase Realtime subscription)
     - Create useStageTransition mutation hook
     - Create useRolePermissions hook [P]

   - **Phase 4: UI Components** (Presentation Layer)
     - Install @dnd-kit/core and kibo-ui Kanban component via shadcn MCP
     - Create KanbanBoard.tsx (board container with DnD context) [P]
     - Create KanbanColumn.tsx (droppable column) [P]
     - Create KanbanTaskCard.tsx (draggable card with SLA indicators) [P]
     - Create KanbanSortDropdown.tsx (sort options) [P]
     - Uncomment + wire EngagementKanbanDialog.tsx

   - **Phase 5: Realtime Integration** (Collaboration)
     - Implement realtime-kanban.service.ts (subscription logic)
     - Integrate Realtime updates into KanbanBoard
     - Add optimistic UI updates for drag-and-drop

   - **Phase 6: Accessibility & i18n** (Polish)
     - Add ARIA live regions for real-time updates
     - Add keyboard shortcuts (arrow keys for navigation)
     - Create i18n keys (ar/assignments.json, en/assignments.json)
     - Implement RTL layout adjustments

   - **Phase 7: Testing** (Validation)
     - Integration test: kanban-real-time-updates
     - Integration test: role-based-stage-transitions
     - Integration test: dual-sla-tracking
     - E2E test: kanban-drag-drop-basic
     - E2E test: kanban-real-time-collaboration
     - E2E test: kanban-rtl-support
     - E2E test: kanban-mobile-touch

   - **Phase 8: Validation** (Quickstart Execution)
     - Execute quickstart.md validation steps
     - Performance validation (<100ms drag feedback)
     - Accessibility audit (WCAG 2.1 AA)

**Ordering Strategy**:
- TDD approach: Contract tests → Implementation → Integration tests → E2E tests
- Dependency order: Schema → Services → Hooks → UI Components
- Mark [P] for parallel execution (independent tasks within same phase)

**Estimated Output**: ~40-50 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: Phase 2 execution is deferred to the /tasks command

## Complexity Tracking
*No Constitution violations detected - this section remains empty*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (5 clarifications in Session 2025-10-07)
- [x] No complexity deviations

---
*Based on Constitution v2.1.1 - See `/.specify/memory/constitution.md`*
