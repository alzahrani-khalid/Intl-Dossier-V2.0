
# Implementation Plan: Dossiers Hub

**Branch**: `009-dossiers-hub` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-dossiers-hub/spec.md`

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
Elevate Dossier to a first-class feature with comprehensive CRUD operations, timeline aggregation of related artifacts (engagements, positions, MoUs, commitments, intelligence), and a hub view. Includes bilingual executive summaries, relationship health scoring, one-click brief generation with AI fallback, and advanced filtering capabilities. System enforces hybrid permission model (owner + admin/manager access), optimistic locking for concurrent edits, and sub-1.5-second performance targets.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, Supabase (PostgreSQL + Auth + RLS + Realtime + Storage), TanStack Router v5, TanStack Query v5, Tailwind CSS, shadcn/ui, AnythingLLM (self-hosted), pgvector
**Storage**: PostgreSQL 15 via Supabase with RLS policies, pgvector for embeddings, optimistic locking (version field)
**Testing**: Vitest (unit), Playwright (E2E), contract tests for API endpoints
**Target Platform**: Web application (responsive desktop/tablet focus, bilingual RTL/LTR)
**Project Type**: web (frontend + backend/edge-functions)
**Performance Goals**: <1.5s page loads (hub + detail), <60s AI brief generation with timeout, infinite scroll 50 items/batch
**Constraints**: Bilingual EN/AR with equal priority, WCAG 2.1 AA, MFA required, RLS enforced, data sovereignty (self-hosted), graceful AI degradation
**Scale/Scope**: Enterprise diplomatic system, 100+ dossiers initially, timeline events in thousands, multi-user concurrent editing
**User-Provided Context**: ultrathink

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Constitutional Compliance

| Principle | Status | Implementation Notes |
|-----------|--------|---------------------|
| **Bilingual Excellence** | ✅ PASS | Spec requires EN/AR from day one, RTL/LTR support, bilingual summaries and briefs |
| **Type Safety** | ✅ PASS | TypeScript 5.0+ strict mode, no `any` types, explicit return types, components <200 lines |
| **Security-First** | ✅ PASS | MFA enforced (existing auth), RLS policies required for dossiers table, hybrid permission model (owner+admin), input validation on all forms, audit logging (FR-042) |
| **Data Sovereignty** | ✅ PASS | Self-hosted AnythingLLM for AI features, all data in Supabase (Saudi infrastructure), no external cloud deps |
| **Resilient Architecture** | ✅ PASS | Error boundaries needed for components, AI fallback to manual template (clarified), 60s timeout on brief generation, optimistic locking for concurrent edits, bilingual error messages |
| **Accessibility** | ⚠️ VERIFY | WCAG 2.1 AA required - need keyboard navigation, ARIA labels, screen reader testing in both languages |
| **Container-First** | ✅ PASS | Docker Compose setup exists, health checks needed for new edge functions |

**Gate Decision**: PASS with verification note for accessibility implementation

**Action Items for Phase 1**:
1. Define RLS policies for dossiers, timeline_events, briefs tables
2. Design error boundary strategy for dossier components
3. Plan ARIA structure for timeline infinite scroll and tab navigation
4. Specify bilingual error message keys for all operations
5. Define health check endpoints for new edge functions

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

**Structure Decision**: Option 2 (Web application) - frontend/ and backend/ (edge functions via Supabase)

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

1. **Database Foundation** (Tasks 1-8):
   - Create migration for `dossiers` table with indexes, triggers, RLS
   - Create migration for `dossier_owners` table with RLS
   - Create migration for `key_contacts` table with RLS
   - Create migration for `briefs` table with RLS
   - Create helper functions (increment_version, can_edit_dossier, etc.)
   - Create materialized view `dossier_timeline` with refresh logic
   - Seed test data for validation
   - Write database unit tests (RLS policy tests, function tests)

2. **Contract Tests** (Tasks 9-15) [P]:
   - Contract test: GET /dossiers (list with filters)
   - Contract test: POST /dossiers (create)
   - Contract test: GET /dossiers/:id (detail with includes)
   - Contract test: PUT /dossiers/:id (update with version check)
   - Contract test: DELETE /dossiers/:id (archive)
   - Contract test: GET /dossiers/:id/timeline (pagination)
   - Contract test: POST /dossiers/:id/briefs (generate or fallback)

3. **Backend Implementation** (Tasks 16-23):
   - Implement Edge Function: list-dossiers (filters, search, pagination)
   - Implement Edge Function: create-dossier (validation, RLS)
   - Implement Edge Function: get-dossier (includes, stats calculation)
   - Implement Edge Function: update-dossier (version check, RLS)
   - Implement Edge Function: archive-dossier (soft delete)
   - Implement Edge Function: get-timeline (cursor pagination, materialized view)
   - Implement Edge Function: generate-brief (AI + timeout + fallback)
   - Implement brief template generator (manual fallback structure)

4. **Frontend Components** (Tasks 24-33) [P]:
   - Implement DossierCard component (bilingual, accessibility)
   - Implement DossierHeader component (language toggle, actions)
   - Implement DossierTimeline component (infinite scroll)
   - Implement DossierStats component (metrics display)
   - Implement DossierActions component (one-click actions)
   - Implement BriefGenerator component (AI + manual template)
   - Implement ConflictDialog component (optimistic lock warning)
   - Implement FilterPanel component (faceted search)
   - Implement KeyContactsPanel component (right rail)
   - Write component unit tests (Vitest)

5. **Route Implementation** (Tasks 34-36):
   - Implement route: /_protected/dossiers (hub page with filters)
   - Implement route: /_protected/dossiers/:id (detail with tabs)
   - Write routing tests (TanStack Router)

6. **API Hooks** (Tasks 37-43) [P]:
   - Implement useDossiers hook (TanStack Query, filters, pagination)
   - Implement useDossier hook (detail, includes, caching)
   - Implement useCreateDossier mutation (optimistic update)
   - Implement useUpdateDossier mutation (version check, conflict handling)
   - Implement useArchiveDossier mutation
   - Implement useTimelineEvents hook (infinite query)
   - Implement useGenerateBrief mutation (timeout, fallback)

7. **Integration Tests** (Tasks 44-50):
   - E2E test: Create and view dossier (hub → detail flow)
   - E2E test: Apply filters and search
   - E2E test: Edit dossier with concurrent edit conflict
   - E2E test: Timeline infinite scroll
   - E2E test: Generate brief (AI success path)
   - E2E test: Generate brief (fallback path)
   - E2E test: Permission model (owner, admin, analyst scenarios)

8. **Accessibility & Performance** (Tasks 51-53):
   - Accessibility audit and fixes (WCAG 2.1 AA)
   - Performance optimization (code splitting, lazy loading)
   - Performance validation (< 1.5s target)

**Ordering Strategy**:
- Database tasks → Contract tests (can run in parallel) → Backend → Frontend → Integration
- Within each group, mark [P] for parallel execution where files don't conflict
- Contract tests written first (TDD), will fail until implementation complete
- Components can be built in parallel after API hooks defined

**Estimated Task Count**: 53 tasks total

**Dependency Chain**:
```
Database (1-8) → Contract Tests (9-15) [P]
                ↓
         Backend Functions (16-23)
                ↓
         API Hooks (37-43) [P] ← Frontend Components (24-33) [P]
                ↓
         Routes (34-36)
                ↓
         Integration Tests (44-50)
                ↓
         Accessibility & Performance (51-53)
```

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**No constitutional violations** - All principles adhered to:
- ✅ Bilingual support from day one
- ✅ TypeScript strict mode
- ✅ RLS policies enforced
- ✅ Self-hosted AI (AnythingLLM)
- ✅ Resilient architecture with fallbacks
- ✅ Accessibility planned (WCAG 2.1 AA)
- ✅ Docker containerization


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅ research.md generated
- [x] Phase 1: Design complete (/plan command) ✅ data-model.md, contracts/, quickstart.md, CLAUDE.md updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅ 53 tasks planned
- [ ] Phase 3: Tasks generated (/tasks command) - Ready to execute `/tasks`
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (verified bilingual, type-safe, RLS, resilient, accessible)
- [x] Post-Design Constitution Check: PASS (re-verified after Phase 1)
- [x] All NEEDS CLARIFICATION resolved (5 clarifications from /clarify session)
- [x] Complexity deviations documented (None - no constitutional violations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
