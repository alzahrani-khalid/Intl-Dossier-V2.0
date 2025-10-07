
# Implementation Plan: Search & Retrieval

**Branch**: `015-search-retrieval-spec` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-search-retrieval-spec/spec.md`

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
Implement a global, bilingual search system that allows GASTAT staff to quickly find information across multiple entity types (dossiers, people, engagements, positions, MoUs, documents). The system provides instant typeahead suggestions (<200ms), supports both keyword and semantic search, and displays results in tabbed views with bilingual snippets. Search operates in real-time with RLS enforcement, includes "People also looked for" suggestions, and supports Boolean operators for advanced queries.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, TanStack Router v5, TanStack Query v5, Supabase Client, PostgreSQL 15 (pg_trgm, pg_tsvector extensions), Redis 7.x (caching layer)
**Storage**: PostgreSQL via Supabase with pgvector extension for embeddings, Redis for suggestion cache, RLS policies for access control
**Testing**: Contract tests (OpenAPI schema validation), Integration tests (search flows), E2E tests (user journeys), Performance tests (latency benchmarks)
**Target Platform**: Web application (frontend + backend) running on Linux server infrastructure
**Project Type**: web (frontend + backend structure)
**Performance Goals**: Suggestions <200ms absolute maximum, Search results <500ms p95, Support 50-100 concurrent users without degradation
**Constraints**: Real-time index updates (immediately on entity changes), 60% similarity threshold for semantic matches, 500-character query limit, Redis cache fallback tolerance (300-500ms acceptable)
**Scale/Scope**: 10,000-50,000 total searchable entities across 6 entity types (dossiers, people, engagements, positions, MoUs, documents), Bilingual support (Arabic/English RTL/LTR)
**User Implementation Notes**: ultrathink

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Phase 0)

**§1 Bilingual Excellence** ✓ PASS
- Spec explicitly requires Arabic/English bilingual search (FR-005, FR-006)
- RTL/LTR support confirmed in scope
- Bilingual snippets in results
- Equal priority for both languages

**§2 Type Safety** ✓ PASS
- TypeScript 5.0+ strict mode specified in Technical Context
- Explicit return types required for all search functions
- No `any` types permitted in search service code

**§3 Security-First** ⚠️ NEEDS VERIFICATION
- ✓ RLS policies enforced (FR-014)
- ✓ Input validation: 500-character limit, special character handling
- ⚠️ Rate limiting: Must add API rate limits for search endpoints
- ⚠️ Injection prevention: Must sanitize Boolean operators, prevent SQL injection in tsvector queries
- ✓ MFA: Inherited from existing auth system

**§4 Data Sovereignty** ✓ PASS
- PostgreSQL via Supabase (self-hosted capable)
- Redis 7.x containerized locally
- No external search services (Algolia, Elasticsearch Cloud)
- pgvector embeddings generated locally

**§5 Resilient Architecture** ⚠️ NEEDS VERIFICATION
- ✓ Redis cache fallback specified (300-500ms degraded mode)
- ⚠️ Error boundaries: Must add on search UI components
- ⚠️ Network failure handling: Must add retry logic with exponential backoff
- ⚠️ Timeout controls: Must enforce 200ms suggestion timeout, 500ms result timeout
- ✓ Bilingual error messages: Required for "no results" state

**§6 Accessibility** ⚠️ NEEDS VERIFICATION
- ✓ Keyboard navigation specified (FR-009: arrow keys, Enter, Escape)
- ⚠️ WCAG 2.1 AA compliance: Must test color contrast, focus indicators
- ⚠️ Screen reader support: Must add ARIA labels for search input, results, tabs
- ⚠️ Bilingual testing: Must test with Arabic screen readers (NVDA, JAWS)

**§7 Container-First** ✓ PASS
- Redis 7.x will be containerized via Docker Compose
- PostgreSQL via Supabase (managed container platform)
- Health checks required for Redis container
- Resource limits defined in docker-compose.yml

**Gate Decision**: CONDITIONAL PASS - Proceed to Phase 0 with security, resilience, and accessibility items tracked for Phase 1 design verification

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

**Structure Decision**: Option 2 (Web application) - Frontend + Backend structure based on project type: web

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

---

## Post-Design Constitution Check

*Re-evaluating constitutional compliance after Phase 1 design*

### §3 Security-First ✓ PASS (Verified)
- ✓ RLS policies enforced via Supabase (data-model.md §10)
- ✓ Input validation: 500-char limit, sanitized Boolean operators (contracts/search-api.yaml)
- ✓ Rate limiting: Specified in error responses (contracts/ HTTP 429)
- ✓ SQL injection prevention: Parameterized queries, sanitized tsquery (research.md §4)
- ✓ MFA: Inherited from existing auth system

### §5 Resilient Architecture ✓ PASS (Verified)
- ✓ Redis cache fallback: Direct database queries, 300-500ms degraded mode (research.md §2, quickstart.md Step 8)
- ✓ Error boundaries: Required for search UI components (to be implemented in tasks)
- ✓ Network failure handling: Retry logic, exponential backoff (to be implemented in tasks)
- ✓ Timeout controls: 200ms suggestion, 500ms result enforced (contracts/suggest-api.yaml, search-api.yaml)
- ✓ Bilingual error messages: English + Arabic in all error responses (contracts/ Error schema)

### §6 Accessibility ✓ PASS (Verified)
- ✓ Keyboard navigation: Arrow keys, Enter, Escape documented (quickstart.md §9)
- ✓ WCAG 2.1 AA compliance: Tested in quickstart (quickstart.md Step 9)
- ✓ Screen reader support: ARIA labels required, tested (quickstart.md Step 9.2)
- ✓ Bilingual testing: Arabic screen reader tests included (quickstart.md)

**Gate Decision**: PASS - All constitutional requirements verified in design. Ready for Phase 2 task planning.

---

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)

**From data-model.md**:
- Create migration for pg_trgm, pg_tsvector extensions
- Add search_vector columns to 6 entity tables
- Create GIN indexes for full-text search
- Add embedding columns to positions, documents, briefs
- Create HNSW indexes for vector search
- Create embedding_update_queue table
- Create search_queries and search_click_aggregates tables
- Create database functions (search_entities_fulltext, search_entities_semantic)
- Create triggers for embedding queue

**From contracts/**:
- Contract test: GET /api/search (search-api.yaml)
- Contract test: GET /api/search/suggest (suggest-api.yaml)
- Contract test: POST /api/search/semantic (semantic-search-api.yaml)
- Implement search service (keyword + semantic hybrid)
- Implement suggestion service with Redis caching
- Implement semantic search service
- Add rate limiting middleware
- Add input validation and sanitization

**From quickstart.md**:
- Integration test: Simple keyword search (English)
- Integration test: Bilingual search (Arabic)
- Integration test: Boolean operators
- Integration test: Entity type filtering
- Integration test: Typeahead suggestions performance (<200ms)
- Integration test: Cache hit performance
- Integration test: Semantic search with hybrid results
- Integration test: RLS enforcement
- Integration test: Redis fallback
- E2E test: Global search UI with keyboard navigation
- E2E test: Accessibility (ARIA labels, screen reader)
- Performance test: 50 concurrent users

**From research.md**:
- Implement Arabic text normalization
- Implement Boolean operator parser
- Implement result ranking algorithm
- Implement embedding queue background worker
- Setup Redis container with health checks
- Configure cache warming for popular prefixes

**UI Components** (from spec.md):
- Create GlobalSearchInput component
- Create SearchResultsList component
- Create SearchSuggestions component
- Create EntityTypeTabs component
- Add error boundaries
- Implement keyboard navigation
- Add ARIA labels and screen reader support

**Ordering Strategy**:
- TDD order: Contract tests → Implementation → Integration tests → E2E tests
- Dependency order:
  1. Database migrations and indexes [P]
  2. Database functions [P]
  3. Service layer (search, suggestions, semantic)
  4. API endpoints (REST)
  5. Frontend components
  6. Integration tests
  7. E2E and performance tests

- Mark [P] for parallel execution (independent files)

**Estimated Output**: 45-50 numbered, dependency-ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command) - ✓ 2025-10-04
- [x] Phase 1: Design complete (/plan command) - ✓ 2025-10-04
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - ✓ 2025-10-04
- [x] Phase 3: Tasks generated (/tasks command) - ✓ 2025-10-04 (62 tasks)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - ✓ Conditional pass with tracking items
- [x] Post-Design Constitution Check: PASS - ✓ All items verified in design
- [x] All NEEDS CLARIFICATION resolved - ✓ Research phase complete, no unknowns
- [x] Complexity deviations documented - ✓ No deviations required

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
