
# Implementation Plan: Core Module Implementation

**Branch**: `002-core-module-implementation` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-core-module-implementation/spec.md`

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
Implementation of core system modules across four priority areas: Frontend Routes (9 new pages with bilingual support), Backend API Completion (CRUD operations with validation and rate limiting), Core Business Logic (Countries, Organizations, MoUs, Events, Intelligence modules), and Testing Infrastructure (80% unit coverage, WCAG 2.1 AA compliance). The system will be built using React/TypeScript frontend with Supabase backend, featuring comprehensive error handling, offline capabilities, and self-hosted AI integration.

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 20 LTS  
**Primary Dependencies**: React 18+, Supabase 2.0+, TanStack Router/Query v5, AnythingLLM (self-hosted)  
**Storage**: Supabase (PostgreSQL 15 with pgvector), Supabase Storage  
**Testing**: Vitest, Playwright, React Testing Library  
**Target Platform**: Web (Desktop/Mobile browsers), Docker containers
**Project Type**: web - frontend + backend structure  
**Performance Goals**: 300 req/min per user rate limit, <500ms page loads  
**Constraints**: WCAG 2.1 AA compliance, 50MB file upload limit, offline-capable with queuing  
**Scale/Scope**: 9 new frontend routes, 8 core modules, 33 functional requirements

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance
- ✅ **Bilingual Parity**: All 9 routes include English/Arabic support (FR-010)
- ✅ **Type Safety**: TypeScript strict mode across frontend/backend
- ✅ **Security-First**: RLS policies, MFA support, rate limiting (300 req/min)
- ✅ **Data Sovereignty**: Self-hosted AnythingLLM, Supabase deployable on-premise
- ✅ **Resilient Architecture**: Offline queuing, error boundaries, fallback states
- ✅ **Accessibility**: WCAG 2.1 AA compliance requirement (FR-029)
- ✅ **Container-First**: Docker-based deployment specified

### Technology Stack Alignment
- ✅ Frontend: Vite + React 18 + TypeScript ✓
- ✅ Routing: TanStack Router ✓
- ✅ State: TanStack Query ✓
- ✅ Backend: Supabase (PostgreSQL) with RLS ✓
- ✅ AI: AnythingLLM self-hosted ✓
- ✅ Infrastructure: Docker containers ✓

### Development Standards
- ✅ Component size limit: Will enforce <200 lines
- ✅ Unit test coverage: 80% minimum (FR-030)
- ✅ Both language testing required
- ✅ Security checklist in PRs
- ✅ Reversible migrations required

**Gate Status**: PASS - No constitutional violations detected

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

**Structure Decision**: Option 2 (Web application) - Based on frontend + backend requirements

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
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database setup: Migration files for all 10 entities with RLS policies
- API implementation: 45+ endpoints across 8 modules
- Frontend routes: 9 new pages with bilingual support
- Testing infrastructure: Unit, integration, E2E, and accessibility tests

**Task Breakdown by Priority**:
1. **Priority 1 - Frontend Routes (9 tasks)**
   - One task per route with component, translation, and routing
   
2. **Priority 2 - Backend API (15 tasks)**
   - Database migrations and RLS policies
   - CRUD endpoints for each module
   - Rate limiting and caching middleware
   
3. **Priority 3 - Core Business Logic (12 tasks)**
   - Countries module with search
   - Organizations with hierarchy
   - MoUs with workflow states
   - Events with conflict detection
   - Intelligence with vector search
   
4. **Priority 4 - Testing (10 tasks)**
   - Unit test setup and coverage
   - Integration test suites
   - E2E test scenarios
   - Accessibility audit setup

**Ordering Strategy**:
- Infrastructure first (database, auth)
- Backend APIs before frontend
- Core logic before advanced features
- Testing throughout (TDD approach)
- Mark [P] for parallel execution

**Estimated Output**: 46 numbered, ordered tasks in tasks.md

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
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (via research.md)
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
