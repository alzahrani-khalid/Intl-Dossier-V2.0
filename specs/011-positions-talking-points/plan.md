
# Implementation Plan: Positions & Talking Points Lifecycle

**Branch**: `011-positions-talking-points` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-positions-talking-points/spec.md`

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
Provide end-to-end bilingual (EN/AR) position drafting, approval workflows (1-10 configurable stages with step-up authentication), versioning with 7-year retention, publication with audience group access control, and AI-powered consistency checking (automatic on submit + manual trigger). Positions support attachments, side-by-side bilingual editing, version comparison, and delegation/reassignment mechanisms for unavailable approvers.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, Supabase (PostgreSQL + Auth + RLS + Realtime + Storage), TanStack Router v5, TanStack Query v5, Tailwind CSS, shadcn/ui, AnythingLLM (self-hosted), pgvector
**Storage**: PostgreSQL 15 via Supabase with RLS policies, Supabase Storage for attachments, pgvector for AI embeddings (consistency analysis)
**Testing**: Vitest (unit/integration), Playwright (E2E), Contract tests for all API endpoints
**Target Platform**: Web (Chrome/Firefox/Safari), Docker containers for self-hosted deployment
**Project Type**: web (frontend + backend via Supabase Edge Functions)
**Performance Goals**: <200ms API response time (p95), <3s time-to-interactive for position editor, support 100+ concurrent users
**Constraints**: 7-year data retention for compliance, bilingual UI (EN/AR) with RTL support, offline-capable AI fallback, step-up MFA required for approvals, 1-10 configurable approval stages
**Scale/Scope**: ~500 active users (policy officers + management), ~1000 positions/year, 10-50 versions per position, 6 main UI routes, 15+ Edge Functions
**Special Context (ultrathink)**: Deep integration with existing consistency analysis endpoints, complex approval chain state management, version comparison diffing, audience group-based access control

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Implementation Notes |
|-----------|-----------|---------------------|
| **1. Bilingual Excellence** | ✅ PASS | EN/AR side-by-side editing, RTL/LTR support, equal language priority, bilingual error messages |
| **2. Type Safety** | ✅ PASS | TypeScript 5.0+ strict mode, explicit return types, components <200 lines, no `any` types |
| **3. Security-First** | ✅ PASS | Step-up MFA for approvals, RLS at database level, input validation client+server, rate limiting on Edge Functions, encryption at rest/transit |
| **4. Data Sovereignty** | ✅ PASS | Self-hostable Supabase, AnythingLLM containerized locally, no external cloud dependencies, data stays within infrastructure |
| **5. Resilient Architecture** | ✅ PASS | Error boundaries on all components, graceful AI service fallback (FR-048), timeout controls on async operations, bilingual error messages |
| **6. Accessibility** | ✅ PASS | WCAG 2.1 Level AA compliance, keyboard navigation for all workflows, screen reader compatibility, proper ARIA labels, tested in both languages |
| **7. Container-First** | ✅ PASS | Docker containerization for deployment, Docker Compose orchestration, health checks on services, resource limits defined |

**Initial Assessment**: All constitutional principles satisfied. No deviations required.

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

**Structure Decision**: Option 2 (Web application) - Frontend React app + Backend via Supabase Edge Functions

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
1. **Database & Infrastructure Tasks** (P1 - Foundation):
   - Create PostgreSQL migrations for all 10 tables (from data-model.md)
   - Apply RLS policies for access control
   - Set up pgvector extension for embeddings
   - Configure Supabase Storage bucket for attachments
   - Create database indexes for performance

2. **Contract Test Tasks** (P2 - Test-First):
   - One contract test per Edge Function (18 endpoints from api-spec.yaml)
   - Tests validate request/response schemas
   - Tests initially fail (no implementation)
   - Mark [P] for parallel execution (independent test files)

3. **Backend Implementation Tasks** (P3 - Core Logic):
   - Edge Function: positions CRUD (create, get, list, update)
   - Edge Function: approval workflow (submit, approve, request-revisions, delegate, reassign)
   - Edge Function: versioning (get-versions, compare-versions)
   - Edge Function: publication (publish, unpublish)
   - Edge Function: consistency checking (trigger, reconcile)
   - Edge Function: attachments (upload, list, delete)
   - Edge Function: step-up authentication (initiate, complete)

4. **Frontend Component Tasks** (P4 - UI):
   - Position Editor component (bilingual side-by-side, TipTap)
   - Position List component (with filters, pagination)
   - Approval Chain component (workflow visualization)
   - Version Comparison component (diff rendering)
   - Consistency Panel component (conflict display)
   - Attachment Uploader component
   - Step-Up MFA component

5. **Frontend Route Tasks** (P5 - Pages):
   - `/positions` - List view with faceted search
   - `/positions/:id` - Detail view with editor
   - `/positions/:id/versions` - Version history
   - `/positions/:id/approvals` - Approval tracking
   - `/approvals` - My Approvals dashboard
   - `/admin/approvals` - Admin reassignment panel

6. **Integration Test Tasks** (P6 - End-to-End Workflows):
   - Complete approval workflow test (draft → approved → published)
   - Delegation and reassignment test
   - Version comparison and retention test
   - Consistency checking test (with AI fallback)
   - Audience group access control test
   - Step-up authentication flow test

7. **E2E Test Tasks** (P7 - Browser Automation):
   - Playwright test: Approval flow with multiple users
   - Playwright test: Bilingual content editing (EN/AR, RTL)
   - Playwright test: Version comparison and diff rendering
   - Playwright test: Step-up MFA challenge
   - Playwright test: Consistency conflict resolution

8. **Accessibility & Performance Tasks** (P8 - Quality):
   - WCAG 2.1 Level AA audit (English)
   - WCAG 2.1 Level AA audit (Arabic with RTL)
   - Performance optimization (API response <200ms p95)
   - Load testing (100+ concurrent users)

**Dependency Ordering**:
```
P1 (Database) → P2 (Contract Tests) → P3 (Backend) → P4 (Frontend Components) → P5 (Frontend Routes) → P6 (Integration Tests) → P7 (E2E Tests) → P8 (Quality)
```

**Parallelization Opportunities**:
- All contract tests can run in parallel [P]
- All Edge Function implementations can be parallelized after contracts pass
- Frontend components can be built in parallel
- E2E tests can run in parallel

**Estimated Output**: ~55-65 numbered, ordered tasks in tasks.md

**Task Breakdown by Phase**:
- P1: 8 tasks (migrations, RLS, indexes)
- P2: 18 tasks (one per endpoint)
- P3: 18 tasks (Edge Function implementations)
- P4: 6 tasks (UI components)
- P5: 6 tasks (UI routes)
- P6: 6 tasks (integration tests)
- P7: 5 tasks (E2E tests)
- P8: 4 tasks (quality assurance)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no deviations required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
