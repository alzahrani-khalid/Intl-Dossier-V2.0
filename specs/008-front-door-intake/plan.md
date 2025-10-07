
# Implementation Plan: Front Door Intake

**Branch**: `008-front-door-intake` | **Date**: 2025-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-front-door-intake/spec.md`

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
Implement a unified entry point for support requests (engagements, positions, MoU actions, foresight) with AI-powered triage, duplicate detection, SLA management, and conversion to working artifacts. The system features bilingual (EN/AR) forms, role-based access control, and graceful AI degradation capabilities.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS  
**Primary Dependencies**: React 18+, Supabase (PostgreSQL + RLS + Auth + Realtime + Storage), TanStack Router/Query v5, Tailwind CSS, AnythingLLM (self-hosted)  
**Storage**: PostgreSQL 15 via Supabase with pgvector extension (embeddings), Supabase Storage (attachments)  
**Testing**: Vitest with @vitest/coverage-v8, Playwright (E2E), axe (accessibility)  
**Target Platform**: Web application (latest 2 versions Chrome/Edge/Firefox/Safari), Mobile web (iOS 16+, Android Chrome 110+)
**Project Type**: web - frontend + backend architecture  
**Performance Goals**: API p95 latency ≤ 400ms @ 10,000 rpm, Front Door page TTI ≤ 3.5s on 3G Fast, AI triage render ≤ 2s  
**Constraints**: High-priority SLA 30min/8hr, 25MB/file limit, 100MB/ticket total, 90-day active + 3-year archive retention  
**Scale/Scope**: 1,000 concurrent users, 15,000 rpm global ceiling, horizontal scaling to 8× replicas

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Bilingual Excellence**: EN/AR support from day one, RTL/LTR handling specified
- [x] **Type Safety**: TypeScript strict mode, explicit types for all entities
- [x] **Security-First**: MFA for confidential operations, RLS enforcement, rate limiting defined
- [x] **Data Sovereignty**: AnythingLLM self-hosted, offline fallback with cached results
- [x] **Resilient Architecture**: AI graceful degradation, error boundaries, timeout controls
- [x] **Accessibility**: WCAG 2.2 AA compliance, keyboard navigation, ARIA support
- [x] **Container-First**: Docker containerization implied for services

**Status**: PASS - All constitutional requirements met

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

**Structure Decision**: Option 2 (Web application) - Frontend + Backend architecture based on React/Supabase stack

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
- Each API endpoint (11 main endpoints) → contract test task [P]
- Each entity (9 entities) → model creation task [P]
- Each user workflow (5 primary) → integration test task
- Implementation tasks to make tests pass
- Infrastructure tasks (Docker, migrations, seeding)

**Task Categories**:
1. **Database Setup** (5-6 tasks)
   - Create migration files for each entity
   - Setup RLS policies
   - Create indexes
   - Seed SLA policies

2. **Backend API** (15-18 tasks)
   - Implement each endpoint from contract
   - Add validation and error handling
   - Integrate AI services
   - Setup rate limiting

3. **Frontend Components** (12-15 tasks)
   - Front Door form (bilingual)
   - Queue view with filters
   - Ticket detail page
   - Triage interface
   - SLA countdown components

4. **Testing** (8-10 tasks)
   - Contract tests for all endpoints
   - E2E tests for primary workflows
   - Accessibility tests
   - Performance validation

5. **Infrastructure** (3-4 tasks)
   - Docker Compose setup
   - Health check endpoints
   - Monitoring setup

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Database → Backend → Frontend
- Mark [P] for parallel execution (independent files)
- Critical path: Database setup → Core API → UI

**Estimated Output**: 43-53 numbered, ordered tasks in tasks.md

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
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (none required)

**Generated Artifacts**:
- [x] research.md - Technology decisions and best practices
- [x] data-model.md - 9 entities with relationships and indexes
- [x] contracts/api-spec.yaml - OpenAPI specification with 11 endpoints
- [x] quickstart.md - User workflows and testing checklist

**Next Step**: Ready for `/tasks` command execution

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
