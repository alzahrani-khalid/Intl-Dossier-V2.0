# Tasks: System Requirements Refinement and Clarification

**Input**: Design documents from `/specs/004-refine-specification-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.0+, Supabase, pgvector, React 18+, Docker
   → Structure: Web app (backend/frontend split)
2. Load optional design documents:
   → data-model.md: 6 entities + 2 nested types
   → contracts/: 3 API specs (12 endpoints total)
   → research.md: Technical decisions confirmed
   → quickstart.md: 8 test scenarios
3. Generate tasks by category:
   → Setup: Project init, Supabase config, Docker setup
   → Tests: Contract tests (12), integration tests (8)
   → Core: Models (6), services (4), endpoints (12)
   → Integration: DB, middleware, monitoring
   → Polish: Unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks T001-T045
6. Dependencies: Setup → Tests → Models → Services → Endpoints → Polish
7. Parallel groups identified for efficient execution
8. Return: SUCCESS (45 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `backend/src/`, `frontend/src/`, `supabase/`
- Contract tests in `backend/tests/contract/`
- Integration tests in `backend/tests/integration/`

## Phase 3.1: Setup
- [X] T001 Create web application structure with backend/, frontend/, supabase/ directories
- [X] T002 Initialize backend with TypeScript 5.0+, Node.js 18+, Express/Fastify
- [X] T003 [P] Initialize frontend with Vite, React 18+, TanStack Router/Query
- [X] T004 [P] Configure Supabase project with pgvector extension
- [X] T005 [P] Setup Docker Compose with PostgreSQL 15, Redis, AnythingLLM containers

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests - Intelligence Reports API
- [X] T006 [P] Contract test GET /api/intelligence-reports in backend/tests/contract/test_intelligence_reports_list.ts
- [X] T007 [P] Contract test POST /api/intelligence-reports in backend/tests/contract/test_intelligence_reports_create.ts
- [X] T008 [P] Contract test GET /api/intelligence-reports/{id} in backend/tests/contract/test_intelligence_reports_get.ts
- [X] T009 [P] Contract test POST /api/intelligence-reports/{id}/embedding in backend/tests/contract/test_intelligence_reports_embedding.ts
- [X] T010 [P] Contract test POST /api/intelligence-reports/search in backend/tests/contract/test_intelligence_reports_search.ts

### Contract Tests - Rate Limiting API
- [X] T011 [P] Contract test GET /api/rate-limits/policies in backend/tests/contract/test_rate_limits_list.ts
- [X] T012 [P] Contract test POST /api/rate-limits/policies in backend/tests/contract/test_rate_limits_create.ts
- [X] T013 [P] Contract test PUT /api/rate-limits/policies/{id} in backend/tests/contract/test_rate_limits_update.ts
- [X] T014 [P] Contract test GET /api/rate-limits/status in backend/tests/contract/test_rate_limits_status.ts

### Contract Tests - Reporting API
- [X] T015 [P] Contract test GET /api/reports/templates in backend/tests/contract/test_reports_templates_list.ts
- [X] T016 [P] Contract test POST /api/reports/generate in backend/tests/contract/test_reports_generate.ts
- [X] T017 [P] Contract test POST /api/reports/schedule in backend/tests/contract/test_reports_schedule.ts

### Integration Tests (from quickstart.md)
- [X] T018 [P] Integration test vector embedding with fallback in backend/tests/integration/test_vector_fallback.ts
- [X] T019 [P] Integration test rate limiting for auth/anon users in backend/tests/integration/test_rate_limiting.ts
- [X] T020 [P] Integration test auto-scaling behavior in backend/tests/integration/test_auto_scaling.ts
- [X] T021 [P] Integration test search with partial results in backend/tests/integration/test_partial_search.ts
- [X] T022 [P] Integration test report generation formats in backend/tests/integration/test_report_formats.ts
- [X] T023 [P] Integration test retention policy (90-day archive) in backend/tests/integration/test_retention.ts
- [X] T024 [P] Integration test browser compatibility in backend/tests/integration/test_browsers.ts
- [X] T025 [P] Integration test bilingual RTL/LTR support in backend/tests/integration/test_bilingual.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models
- [X] T026 [P] IntelligenceReport model with bilingual fields in backend/src/models/intelligence-report.model.ts
- [X] T027 [P] VectorEmbedding model with HNSW indexing in backend/src/models/vector-embedding.model.ts
- [X] T028 [P] RateLimitPolicy model with token bucket config in backend/src/models/rate-limit-policy.model.ts
- [X] T029 [P] ScalingPolicy model with threshold triggers in backend/src/models/scaling-policy.model.ts
- [X] T030 [P] SearchFilter model with timeout handling in backend/src/models/search-filter.model.ts
- [X] T031 [P] ReportTemplate model with scheduling in backend/src/models/report-template.model.ts

### Core Services
- [X] T032 VectorService for pgvector operations in backend/src/services/vector.service.ts
- [X] T033 RateLimitService with Redis token bucket in backend/src/services/rate-limit.service.ts
- [X] T034 ReportingService with multi-format export in backend/src/services/reporting.service.ts
- [X] T035 SearchService with partial result handling in backend/src/services/search.service.ts

### API Endpoints Implementation
- [X] T036 Intelligence Reports endpoints (5 routes) in backend/src/api/intelligence-reports.router.ts
- [X] T037 Rate Limiting endpoints (4 routes) in backend/src/api/rate-limits.router.ts
- [X] T038 Reporting endpoints (3 routes) in backend/src/api/reports.router.ts

## Phase 3.4: Integration
- [X] T039 Supabase migrations for all 6 entities in supabase/migrations/
- [X] T040 Rate limiting middleware with 429 responses in backend/src/middleware/rate-limit.middleware.ts
- [X] T041 AnythingLLM integration with fallback in backend/src/integrations/anythingllm.service.ts
- [X] T042 Monitoring setup with Prometheus/Grafana in monitoring/docker-compose.yml

## Phase 3.5: Polish
- [X] T043 [P] Unit tests achieving 80% coverage in backend/tests/unit/
- [X] T044 [P] Performance tests for <2s search on 100k records in backend/tests/performance/
- [X] T045 [P] API documentation with OpenAPI specs in docs/api/

## Dependencies
- Setup tasks (T001-T005) must complete first
- All tests (T006-T025) before any implementation
- Models (T026-T031) before services (T032-T035)
- Services before endpoints (T036-T038)
- Core implementation before integration (T039-T042)
- Everything before polish (T043-T045)

## Parallel Execution Examples

### Contract Tests Launch (T006-T017)
```bash
# Launch all contract tests in parallel:
Task: "Contract test GET /api/intelligence-reports"
Task: "Contract test POST /api/intelligence-reports"
Task: "Contract test GET /api/intelligence-reports/{id}"
Task: "Contract test POST /api/intelligence-reports/{id}/embedding"
Task: "Contract test POST /api/intelligence-reports/search"
Task: "Contract test GET /api/rate-limits/policies"
Task: "Contract test POST /api/rate-limits/policies"
Task: "Contract test PUT /api/rate-limits/policies/{id}"
Task: "Contract test GET /api/rate-limits/status"
Task: "Contract test GET /api/reports/templates"
Task: "Contract test POST /api/reports/generate"
Task: "Contract test POST /api/reports/schedule"
```

### Integration Tests Launch (T018-T025)
```bash
# Launch all integration tests in parallel:
Task: "Integration test vector embedding with fallback"
Task: "Integration test rate limiting for auth/anon users"
Task: "Integration test auto-scaling behavior"
Task: "Integration test search with partial results"
Task: "Integration test report generation formats"
Task: "Integration test retention policy"
Task: "Integration test browser compatibility"
Task: "Integration test bilingual RTL/LTR support"
```

### Models Creation Launch (T026-T031)
```bash
# Launch all model tasks in parallel:
Task: "IntelligenceReport model with bilingual fields"
Task: "VectorEmbedding model with HNSW indexing"
Task: "RateLimitPolicy model with token bucket config"
Task: "ScalingPolicy model with threshold triggers"
Task: "SearchFilter model with timeout handling"
Task: "ReportTemplate model with scheduling"
```

## Notes
- All contract tests must fail initially (TDD approach)
- Services T032-T035 are sequential due to shared dependencies
- Endpoints T036-T038 modify same router config (sequential)
- Integration tasks T039-T042 require core implementation complete
- Polish tasks can run in parallel as they target different areas

## Task Generation Summary
*Generated from design documents:*

1. **From Contracts** (3 files → 12 contract test tasks):
   - intelligence-reports-api.yaml: 5 endpoints → 5 tests
   - rate-limiting-api.yaml: 4 endpoints → 4 tests
   - reporting-api.yaml: 3 endpoints → 3 tests

2. **From Data Model** (6 entities → 6 model tasks):
   - IntelligenceReport, VectorEmbedding, RateLimitPolicy
   - ScalingPolicy, SearchFilter, ReportTemplate

3. **From Quickstart** (8 scenarios → 8 integration tests):
   - Vector fallback, rate limiting, auto-scaling, partial search
   - Report formats, retention, browsers, bilingual support

4. **Core Services** (4 services from requirements):
   - Vector operations, rate limiting, reporting, search

## Validation Checklist
*GATE: All items verified ✓*

- [x] All 3 contracts have corresponding test tasks
- [x] All 6 entities have model creation tasks
- [x] All tests (T006-T025) come before implementation (T026+)
- [x] Parallel tasks target different files (no conflicts)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Dependencies clearly defined and enforceable
- [x] Total of 45 specific, executable tasks generated