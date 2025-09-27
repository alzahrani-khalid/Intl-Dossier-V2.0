# Tasks: Core Module Implementation

**Input**: Design documents from `/specs/002-core-module-implementation/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/api-spec.yaml

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.0+, React 18+, Supabase 2.0+, TanStack Router/Query v5
   → Structure: Web application (frontend/ and backend/ directories)
2. Load design documents:
   → data-model.md: 10 entities with RLS policies
   → contracts/api-spec.yaml: 45+ endpoints across 8 modules
   → research.md: Technical decisions and patterns
3. Generate tasks by category:
   → Setup: Project structure, dependencies, Docker config
   → Database: Migrations for 10 entities, RLS policies, indexes
   → Tests: Contract tests for all endpoints, integration scenarios
   → Backend API: CRUD endpoints, middleware, validation
   → Frontend Routes: 9 pages with components and translations
   → Business Logic: Advanced features per module
   → Polish: Unit tests, accessibility, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T050)
6. Return: SUCCESS (50 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend**: `frontend/src/`
- **Backend**: `backend/src/` (Supabase Edge Functions)
- **Database**: `supabase/migrations/`
- **Tests**: `tests/` at repository root

## Phase 3.1: Infrastructure Setup (T001-T005)

- [X] T001 Create project structure with frontend/, backend/, tests/, and supabase/ directories
- [X] T002 Initialize frontend with Vite + React + TypeScript configuration in frontend/package.json
- [X] T003 [P] Configure Docker Compose with services for Supabase, AnythingLLM, and Traefik in docker-compose.yml
- [X] T004 [P] Setup environment variables and .env.example with all required configs
- [X] T005 [P] Configure ESLint, Prettier, and TypeScript strict mode in .eslintrc.js and tsconfig.json

## Phase 3.2: Database Setup (T006-T015)

- [X] T006 [P] Create Users table migration with auth integration in supabase/migrations/001_users.sql
- [X] T007 [P] Create Countries table migration with indexes in supabase/migrations/002_countries.sql
- [X] T008 [P] Create Organizations table migration with hierarchy in supabase/migrations/003_organizations.sql
- [X] T009 [P] Create MoUs table migration with workflow states in supabase/migrations/004_mous.sql
- [X] T010 [P] Create Events table migration with conflict detection in supabase/migrations/005_events.sql
- [X] T011 [P] Create Forums table migration extending Events in supabase/migrations/006_forums.sql
- [X] T012 [P] Create Briefs table migration in supabase/migrations/007_briefs.sql
- [X] T013 [P] Create IntelligenceReports table with vector column in supabase/migrations/008_intelligence.sql
- [X] T014 [P] Create DataLibraryItems table migration in supabase/migrations/009_data_library.sql
- [X] T015 [P] Create audit_log table and trigger function in supabase/migrations/010_audit.sql

## Phase 3.3: RLS Policies & Indexes (T016-T020)

- [X] T016 Implement RLS policies for Users, Countries, Organizations tables in supabase/migrations/011_rls_policies.sql
- [X] T017 Implement RLS policies for MoUs, Events, Forums tables in supabase/migrations/012_rls_policies_events.sql
- [X] T018 Implement RLS policies for Briefs, Intelligence, DataLibrary tables in supabase/migrations/013_rls_policies_content.sql
- [X] T019 Create performance indexes for all search and filter operations in supabase/migrations/014_indexes.sql
- [X] T020 Create pgvector index for intelligence similarity search in supabase/migrations/015_vector_index.sql

## Phase 3.4: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.5

- [X] T021 [P] Contract tests for Countries API endpoints in tests/contract/countries.test.ts
- [X] T022 [P] Contract tests for Organizations API endpoints in tests/contract/organizations.test.ts
- [X] T023 [P] Contract tests for MoUs API with workflow transitions in tests/contract/mous.test.ts
- [X] T024 [P] Contract tests for Events API with conflict detection in tests/contract/events.test.ts
- [X] T025 [P] Contract tests for Intelligence API with search in tests/contract/intelligence.test.ts
- [X] T026 [P] Contract tests for Reports generation API in tests/contract/reports.test.ts
- [X] T027 [P] Contract tests for DataLibrary upload API in tests/contract/data-library.test.ts
- [X] T028 [P] Contract tests for WordAssistant AI API in tests/contract/word-assistant.test.ts

## Phase 3.5: Backend API Implementation (T029-T036)

- [X] T029 Implement Countries CRUD endpoints in supabase/functions/countries/index.ts
- [X] T030 Implement Organizations CRUD with hierarchy in supabase/functions/organizations/index.ts
- [X] T031 Implement MoUs CRUD with workflow transitions in supabase/functions/mous/index.ts
- [X] T032 Implement Events CRUD with conflict detection in supabase/functions/events/index.ts
- [X] T033 Implement Intelligence endpoints with vector search in supabase/functions/intelligence/index.ts
- [X] T034 Implement Reports generation with PDF/Excel export in supabase/functions/reports/index.ts
- [X] T035 Implement DataLibrary upload with file validation in supabase/functions/data-library/index.ts
- [X] T036 Implement WordAssistant with AnythingLLM integration in supabase/functions/word-assistant/index.ts

## Phase 3.6: Frontend Routes Implementation (T037-T045)

- [X] T037 [P] Create Forums page component with translations in frontend/src/pages/forums/
- [X] T038 [P] Create MoUs page with workflow UI in frontend/src/pages/mous/
- [X] T039 [P] Create Events page with calendar view in frontend/src/pages/events/
- [X] T040 [P] Create Briefs listing page in frontend/src/pages/briefs/
- [X] T041 [P] Create Intelligence reports page in frontend/src/pages/intelligence/
- [X] T042 [P] Create Reports generation page in frontend/src/pages/reports/
- [X] T043 [P] Create DataLibrary page with upload in frontend/src/pages/data-library/
- [X] T044 [P] Create WordAssistant AI page in frontend/src/pages/word-assistant/
- [X] T045 [P] Create Settings page with preferences in frontend/src/pages/settings/

## Phase 3.7: Core Features & Middleware (T046-T053)

- [x] T046 Implement bilingual support with react-i18next in frontend/src/i18n/
- [x] T047 Setup TanStack Router with type-safe routing in frontend/src/router/
- [x] T048 Implement rate limiting middleware (300 req/min) in backend/src/middleware/rate-limit.ts
- [x] T049 Setup offline queue with IndexedDB in frontend/src/services/offline-queue.ts
- [x] T050 Implement error boundaries with fallback UI in frontend/src/components/error-boundary/
- [x] T051 Setup Supabase Realtime subscriptions in frontend/src/services/realtime.ts
- [x] T052 Implement file upload with resumable support in frontend/src/services/upload.ts
- [x] T053 Configure authentication with MFA support in frontend/src/services/auth.ts

## Phase 3.8: Business Logic Implementation (T054-T060)

- [X] T054 Implement country search with filters in backend/src/services/countries-search.ts
- [X] T055 Implement organization hierarchy navigation in backend/src/services/org-hierarchy.ts
- [X] T056 Implement MoU state machine validation in backend/src/services/mou-workflow.ts
- [X] T057 Implement event conflict detection algorithm in backend/src/services/event-conflicts.ts
- [X] T058 Implement intelligence vector embeddings in backend/src/services/intelligence-embeddings.ts
- [X] T059 Implement report generation queue in backend/src/services/report-generator.ts
- [X] T060 Setup AnythingLLM fallback handlers in backend/src/services/ai-fallback.ts

## Phase 3.9: Testing & Quality (T061-T070)

- [X] T061 [P] Write unit tests for all React components in tests/unit/components/
- [X] T062 [P] Write unit tests for backend services in tests/unit/services/
- [x] T063 [P] Create E2E test suite for critical user journeys in tests/e2e/user-journeys.spec.ts
- [x] T064 [P] Create E2E tests for bilingual flows in tests/e2e/bilingual.spec.ts
- [x] T065 [P] Setup accessibility testing with axe-core in tests/a11y/
- [x] T066 [P] Create performance tests for API endpoints in tests/performance/api.test.ts
- [x] T067 [P] Write integration tests for offline queue in tests/integration/offline.test.ts
- [x] T068 [P] Create security tests for file uploads in tests/security/uploads.test.ts
- [X] T069 Implement visual regression tests for RTL/LTR in tests/visual/
- [X] T070 Setup test coverage reporting with 80% threshold in vitest.config.ts

## Phase 3.10: Polish & Documentation (T071-T075)

- [x] T071 [P] Generate TypeScript types from Supabase schema in frontend/src/types/database.ts
- [x] T072 [P] Create API documentation from OpenAPI spec in docs/api/
- [X] T073 [P] Write component documentation with Storybook in frontend/src/stories/
- [X] T074 Setup monitoring with Prometheus and Grafana in docker-compose.monitoring.yml
- [X] T075 Create production deployment guide in docs/deployment.md

## Dependencies

### Critical Dependencies
- Database setup (T006-T015) blocks all API implementation
- RLS policies (T016-T020) must complete before API testing
- Contract tests (T021-T028) must fail before API implementation (T029-T036)
- Frontend routes (T037-T045) require API endpoints
- Business logic (T054-T060) requires core API implementation

### Parallel Execution Groups

**Group 1: Database Setup (can run simultaneously)**
```bash
# Launch T006-T014 together (different migration files):
Task: "Create Users table migration"
Task: "Create Countries table migration"
Task: "Create Organizations table migration"
Task: "Create MoUs table migration"
Task: "Create Events table migration"
Task: "Create Forums table migration"
Task: "Create Briefs table migration"
Task: "Create IntelligenceReports table"
Task: "Create DataLibraryItems table"
```

**Group 2: Contract Tests (after database, before implementation)**
```bash
# Launch T021-T028 together (different test files):
Task: "Contract tests for Countries API"
Task: "Contract tests for Organizations API"
Task: "Contract tests for MoUs API"
Task: "Contract tests for Events API"
Task: "Contract tests for Intelligence API"
Task: "Contract tests for Reports API"
Task: "Contract tests for DataLibrary API"
Task: "Contract tests for WordAssistant API"
```

**Group 3: Frontend Routes (after API implementation)**
```bash
# Launch T037-T045 together (different page components):
Task: "Create Forums page component"
Task: "Create MoUs page"
Task: "Create Events page"
Task: "Create Briefs page"
Task: "Create Intelligence page"
Task: "Create Reports page"
Task: "Create DataLibrary page"
Task: "Create WordAssistant page"
Task: "Create Settings page"
```

**Group 4: Unit Tests (after implementation)**
```bash
# Launch T061-T068 together (different test suites):
Task: "Unit tests for React components"
Task: "Unit tests for backend services"
Task: "E2E test suite"
Task: "E2E bilingual tests"
Task: "Accessibility testing"
Task: "Performance tests"
Task: "Integration tests for offline"
Task: "Security tests for uploads"
```

## Validation Checklist
*Verified during task generation*

- [x] All 45+ API endpoints have contract tests
- [x] All 10 entities have database migrations
- [x] All 9 frontend routes have implementation tasks
- [x] Contract tests (T021-T028) come before implementation (T029-T036)
- [x] Parallel tasks use different files (no conflicts)
- [x] Each task specifies exact file paths
- [x] Dependencies properly ordered
- [x] Testing coverage includes unit, integration, E2E, and accessibility

## Execution Notes

### For Developers
1. **Always run contract tests first** - they must fail before implementation
2. **Use parallel execution** where marked [P] to speed up development
3. **Commit after each task** to maintain clean history
4. **Run linting** after each implementation task
5. **Verify RLS policies** are active before testing APIs

### Task Estimation
- Setup tasks (T001-T005): 2 hours
- Database tasks (T006-T020): 4 hours
- Contract tests (T021-T028): 3 hours
- API implementation (T029-T036): 8 hours
- Frontend routes (T037-T045): 9 hours
- Core features (T046-T053): 6 hours
- Business logic (T054-T060): 7 hours
- Testing (T061-T070): 8 hours
- Polish (T071-T075): 3 hours

**Total Estimated Time**: 50 hours (6-7 days with parallel execution)

---
*Tasks generated from design documents on 2025-09-26*
*Ready for execution with /implement command or manual development*