
# Implementation Plan: Full Assignment Detail Page

**Branch**: `014-full-assignment-detail` | **Date**: 2025-10-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-full-assignment-detail/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a comprehensive assignment detail page that displays assignment metadata, SLA tracking, work item preview, and supports rich interactions including comments, checklist-based progress tracking, emoji reactions, @mentions, and real-time collaboration. The page enables staff to escalate assignments (creating supervisor observers), mark work complete, and view a complete timeline of events. Real-time updates must achieve <1 second latency for all interactions. Implementation approach: "ultrathink" - deep analysis of real-time state synchronization patterns, optimistic UI updates, and bilingual accessibility requirements before implementation.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, TanStack Router v5, TanStack Query v5, Supabase Client (Realtime + Auth + RLS), Tailwind CSS, shadcn/ui, i18next
**Storage**: PostgreSQL 15 via Supabase with RLS policies, Supabase Realtime for real-time subscriptions
**Testing**: Playwright for E2E tests, Vitest for unit tests, contract tests for API endpoints
**Target Platform**: Web (modern browsers with ES2020+ support, Chrome/Firefox/Safari/Edge)
**Project Type**: web (frontend + backend via Supabase Edge Functions)
**Performance Goals**: <1 second real-time update latency, 60fps UI interactions, <2 second real-time reconnection
**Constraints**: Real-time updates required, bilingual (Arabic RTL + English LTR), WCAG 2.1 AA accessibility, RLS enforced, optimistic UI updates
**Scale/Scope**: Single assignment detail page supporting concurrent viewing by assignee + multiple observers, ~10 entity types, ~30 API operations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**§1 Bilingual Excellence**: ✅ PASS
- i18next configured for Arabic (RTL) + English (LTR)
- All UI text externalized to translation files
- Assignment detail page supports both directions

**§2 Type Safety**: ✅ PASS
- TypeScript 5.0+ strict mode enforced
- No `any` types (database types from Supabase)
- Explicit return types on all functions
- Components under 200 lines

**§3 Security-First**: ✅ PASS
- RLS policies enforce assignment view permissions (assignee + observers)
- Rate limiting on Edge Functions
- Input validation on comments/@mentions/checklists
- MFA via existing Supabase Auth

**§4 Data Sovereignty**: ✅ PASS
- Supabase self-hosted (no external cloud)
- Data remains in Saudi infrastructure
- No third-party analytics or tracking

**§5 Resilient Architecture**: ✅ PASS
- Error boundaries on assignment detail component
- Real-time reconnection on network failure (<2s)
- Optimistic UI updates with rollback on error
- Bilingual error messages for all failure states

**§6 Accessibility**: ✅ PASS
- WCAG 2.1 AA compliance required
- Keyboard navigation for all actions (escalate, comment, checklist)
- Screen reader support for timeline, comments, reactions
- ARIA labels in both Arabic and English
- Focus management for real-time updates

**§7 Container-First**: ✅ PASS
- Supabase Edge Functions containerized
- Frontend served via Docker
- Health checks on all services

**Initial Gate Status**: ✅ ALL CHECKS PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - frontend/ + backend/ with Supabase Edge Functions

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

The /tasks command will generate implementation tasks following this structure:

**1. Database Setup (Sequential)**
- T001: Create migration for engagement context (engagement_id, workflow_stage) ← NEW
- T002: Create migration files for 7 new tables (comments, reactions, mentions, checklist_items, checklist_templates, observers, events)
- T003: Create RLS policies migration
- T004: Create database functions migration (get_assignment_progress, get_comment_reactions, get_engagement_progress) ← UPDATED
- T005: Create seed data migration (checklist templates)
- T006: Create backfill migration (populate engagement_id from existing data) ← NEW
- T007: Apply all migrations to Supabase (zkrcjzdemdmwhearhfgg)
- T008: Generate TypeScript types from database schema

**2. Backend API - Contract Tests [P] (Parallel)**
- T009: Contract test - GET /assignments-get/{id}
- T010: Contract test - POST /assignments-comments-create
- T011: Contract test - POST /assignments-comments-reactions-toggle
- T012: Contract test - POST /assignments-checklist-create-item
- T013: Contract test - POST /assignments-checklist-import-template
- T014: Contract test - POST /assignments-checklist-toggle-item
- T015: Contract test - POST /assignments-escalate
- T016: Contract test - POST /assignments-complete
- T017: Contract test - POST /assignments-observer-action
- T018: Contract test - GET /assignments-related/{id} ← NEW
- T019: Contract test - GET /engagements/{id}/kanban ← NEW
- T020: Contract test - PATCH /assignments/{id}/workflow-stage ← NEW

**3. Backend API - Edge Functions (Sequential after T008)**
- T021: Implement assignments-get Edge Function (include engagement context) ← UPDATED
- T022: Implement assignments-comments-create Edge Function (with @mention parsing & validation)
- T023: Implement assignments-comments-reactions-toggle Edge Function
- T024: Implement assignments-checklist-create-item Edge Function
- T025: Implement assignments-checklist-import-template Edge Function
- T026: Implement assignments-checklist-toggle-item Edge Function
- T027: Implement assignments-escalate Edge Function (add observer, send notification)
- T028: Implement assignments-complete Edge Function (with optimistic locking)
- T029: Implement assignments-observer-action Edge Function
- T030: Implement assignments-related-get Edge Function (sibling tasks, context) ← NEW
- T031: Implement engagements-kanban-get Edge Function (kanban board data) ← NEW
- T032: Implement assignments-workflow-stage-update Edge Function (drag-and-drop) ← NEW

**4. Frontend - TanStack Query Hooks [P] (Parallel after T008)**
- T033: Create useAssignmentDetail hook (real-time subscription + engagement context) ← UPDATED
- T034: Create useAddComment mutation hook (optimistic update)
- T035: Create useToggleReaction mutation hook
- T036: Create useAddChecklistItem mutation hook
- T037: Create useImportChecklistTemplate mutation hook
- T038: Create useToggleChecklistItem mutation hook (optimistic update)
- T039: Create useEscalateAssignment mutation hook
- T040: Create useCompleteAssignment mutation hook (optimistic locking check)
- T041: Create useObserverAction mutation hook
- T042: Create useRelatedAssignments hook (sibling tasks with real-time) ← NEW
- T043: Create useEngagementKanban hook (kanban board with real-time) ← NEW
- T044: Create useUpdateWorkflowStage mutation hook (kanban drag-and-drop) ← NEW

**5. Frontend - UI Components [P] (Parallel after T008)**
- T045: Create AssignmentMetadataCard component (bilingual)
- T046: Create SLACountdown component (real-time timer)
- T047: Create WorkItemPreview component
- T048: Create CommentList component (with @mention rendering)
- T049: Create CommentForm component (with @mention autocomplete)
- T050: Create ReactionPicker component
- T051: Create ChecklistSection component (with drag-drop reordering)
- T052: Create ChecklistItemRow component
- T053: Create ChecklistTemplateSelector component
- T054: Create Timeline component (ARIA feed role)
- T055: Create ObserversList component
- T056: Create EscalateDialog component
- T057: Create CompleteDialog component
- T058: Create EngagementContextBanner component (title, progress, links) ← NEW
- T059: Create RelatedTasksList component (sibling assignments) ← NEW
- T060: Create EngagementKanbanDialog component (modal with 4 columns) ← NEW
- T061: Create KanbanColumn component (workflow stage column) ← NEW
- T062: Create KanbanTaskCard component (draggable card with dnd-kit) ← NEW

**6. Frontend - Main Route (Sequential after T033-T044, T045-T062)**
- T063: Create /assignments/{id} route with TanStack Router
- T064: Implement AssignmentDetailPage component (compose all sub-components + engagement context) ← UPDATED
- T065: Setup Supabase Realtime subscriptions (comments, checklist, reactions, events, workflow_stage) ← UPDATED
- T066: Add keyboard shortcuts (E = escalate, C = comment focus, K = kanban) ← UPDATED
- T067: Add error boundaries with bilingual error messages

**7. i18n Translations [P] (Parallel)**
- T068: Add English translations (frontend/src/i18n/en/assignments.json + engagement keys) ← UPDATED
- T069: Add Arabic translations (frontend/src/i18n/ar/assignments.json + engagement keys) ← UPDATED

**8. E2E Tests (Sequential after T063-T067)**
- T070: E2E test - View assignment detail
- T071: E2E test - Add comment with @mention
- T072: E2E test - React to comment
- T073: E2E test - Add & complete checklist items
- T074: E2E test - Import checklist template
- T075: E2E test - Escalate assignment (add observer)
- T076: E2E test - Observer accepts assignment
- T077: E2E test - Mark assignment complete
- T078: E2E test - Real-time updates (2 windows)
- T079: E2E test - Bilingual support (switch locale)
- T080: E2E test - Keyboard navigation (accessibility)
- T081: E2E test - Screen reader announcements
- T082: E2E test - View engagement-linked assignment (context banner) ← NEW
- T083: E2E test - View standalone assignment (no engagement features) ← NEW
- T084: E2E test - Navigate between related tasks ← NEW
- T085: E2E test - Open kanban board ← NEW
- T086: E2E test - Drag task between kanban columns ← NEW
- T087: E2E test - Real-time kanban updates (2 windows) ← NEW
- T088: E2E test - Keyboard navigation in kanban ← NEW
- T089: E2E test - Workflow stage auto-sync with status ← NEW

**9. Performance & Security (Sequential after E2E)**
- T090: Performance test - Real-time latency < 1 second
- T091: Performance test - Kanban drag-and-drop < 100ms optimistic ← NEW
- T092: Performance test - Bundle size < 300KB initial
- T093: Security test - RLS policies enforce permissions
- T094: Security test - Rate limiting (10 comments/min, 1 escalation/hour)
- T095: Security test - @mention validation (unauthorized users blocked)
- T096: Security test - Engagement access control (RLS on related assignments) ← NEW

**10. Documentation (Parallel)**
- T097: Update API documentation in /docs/api/ (include engagement endpoints) ← UPDATED
- T098: Add component usage examples to Storybook (if exists)

**Ordering Strategy**:
1. Database first (migrations must run before anything else, including engagement context)
2. Contract tests parallel with Edge Functions implementation (TDD)
3. Frontend hooks parallel (independent of each other)
4. UI components parallel (independent of each other)
5. Route integration sequential (needs hooks + components)
6. E2E tests sequential (needs working feature)
7. Performance/security tests sequential (needs E2E passing)

**Parallelization Markers**:
- [P] on tasks that can run simultaneously (different files, no dependencies)
- Sequential tasks numbered in strict order

**Estimated Output**: ~98 tasks across 10 phases (26 new tasks for engagement/kanban features)

**Critical Path** (longest sequential chain):
T001-T008 (DB) → T021-T032 (Backend) → T033-T062 (Frontend parallel) → T063-T067 (Route) → T070-T089 (E2E) → T090-T096 (Validation)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Post-Design Constitution Re-Check

After completing Phase 1 design (data model, API contracts, quickstart), re-evaluating constitutional compliance:

**§1 Bilingual Excellence**: ✅ PASS
- Checklist templates have bilingual fields (name_en, name_ar, items with text_en/text_ar)
- All API responses support locale parameter
- Quickstart validates both Arabic RTL and English LTR

**§2 Type Safety**: ✅ PASS
- All database tables strictly typed
- TypeScript interfaces generated from database schema
- No `any` types in API contracts

**§3 Security-First**: ✅ PASS
- RLS policies on all 7 new tables (comments, reactions, mentions, checklist, templates, observers, events)
- @mention validation prevents unauthorized notifications
- Rate limiting on all mutation endpoints
- Input validation: text length limits, emoji whitelist

**§4 Data Sovereignty**: ✅ PASS
- All data in Supabase PostgreSQL (self-hosted)
- No external API calls
- No third-party embeds

**§5 Resilient Architecture**: ✅ PASS
- Optimistic updates with onError rollback (comments, checklist, reactions)
- Real-time reconnection logic in research.md
- Network interruption handling in quickstart test

**§6 Accessibility**: ✅ PASS
- ARIA live regions for timeline updates
- Keyboard shortcuts documented (E for escalate, C for comment)
- Screen reader testing in quickstart
- WCAG 2.1 AA color contrast validated

**§7 Container-First**: ✅ PASS
- Edge Functions deployed via Docker
- Frontend build containerized
- No native dependencies

**Post-Design Gate Status**: ✅ ALL CHECKS PASS - No violations introduced

## Complexity Tracking

**No constitutional violations** - All principles maintained through design phase.


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning approach described (/plan command) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: N/A (no violations) ✅

**Artifacts Generated**:
- [x] research.md (Phase 0)
- [x] data-model.md (Phase 1)
- [x] contracts/api-spec.yaml (Phase 1)
- [x] quickstart.md (Phase 1)
- [x] CLAUDE.md updated (Phase 1)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
