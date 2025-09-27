# Tasks: Resolve Critical Issues in Core Module Implementation

**Input**: Design documents from `/specs/003-resolve-critical-issues/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.0+, React 18+, Supabase, TanStack Router/Query, AnythingLLM
   → Structure: Web application (frontend + backend)
2. Load design documents:
   → data-model.md: 10 entities with relationships
   → contracts/: auth.test.ts, countries.test.ts, openapi.yaml
   → research.md: Technical decisions and architecture
   → quickstart.md: User journeys and test scenarios
3. Generate tasks by category:
   → Setup: Docker, environment, dependencies
   → Tests: Contract tests, integration tests (TDD)
   → Core: Models, services, API endpoints
   → Integration: Database, middleware, AI
   → Polish: Unit tests, performance, accessibility
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks T001-T085 sequentially
6. Validate: All contracts tested, entities modeled, endpoints implemented
7. Return: SUCCESS (85 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend**: `frontend/src/`
- **Backend**: `backend/src/`
- **Database**: `supabase/migrations/`
- **Tests**: `frontend/tests/`, `backend/tests/`, `e2e/`
- **Docker**: `docker/`, `docker-compose.yml`

## Phase 3.1: Infrastructure Setup
- [X] T001 Create Docker Compose configuration in docker-compose.yml with Supabase, AnythingLLM, PostgreSQL services
- [X] T002 [P] Create Dockerfile for frontend in docker/frontend/Dockerfile
- [X] T003 [P] Create Dockerfile for backend in docker/backend/Dockerfile
- [X] T004 [P] Create Dockerfile for AnythingLLM in docker/anythingllm/Dockerfile
- [X] T005 Setup environment variables in .env.example with Supabase, AnythingLLM, and security configs
- [X] T006 [P] Configure health check endpoints in docker-compose.yml
- [X] T007 [P] Setup monitoring stack with Prometheus and Grafana in docker-compose.monitoring.yml
- [X] T008 Initialize Supabase project configuration in supabase/config.toml

## Phase 3.2: Project Initialization
- [X] T009 Initialize frontend with Vite + React + TypeScript in frontend/
- [X] T010 Initialize backend with Node.js + TypeScript + Express in backend/
- [X] T011 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [X] T012 [P] Configure TypeScript strict mode in backend/tsconfig.json
- [X] T013 [P] Setup ESLint and Prettier for frontend in frontend/.eslintrc.js
- [X] T014 [P] Setup ESLint and Prettier for backend in backend/.eslintrc.js
- [X] T015 [P] Install TanStack Router and Query in frontend
- [X] T016 [P] Install Supabase client libraries in frontend and backend
- [X] T017 [P] Setup Tailwind CSS in frontend/tailwind.config.js
- [X] T018 [P] Configure i18next for bilingual support in frontend/src/i18n/

## Phase 3.3: Database Schema & Migrations
- [X] T019 Create database migration for users table in supabase/migrations/001_create_users.sql
- [X] T020 [P] Create database migration for countries table in supabase/migrations/002_create_countries.sql
- [X] T021 [P] Create database migration for organizations table in supabase/migrations/003_create_organizations.sql
- [X] T022 [P] Create database migration for mous table in supabase/migrations/004_create_mous.sql
- [X] T023 [P] Create database migration for events table in supabase/migrations/005_create_events.sql
- [X] T024 [P] Create database migration for forums table in supabase/migrations/006_create_forums.sql
- [X] T025 [P] Create database migration for briefs table in supabase/migrations/007_create_briefs.sql
- [X] T026 [P] Create database migration for intelligence_reports table in supabase/migrations/008_create_intelligence_reports.sql
- [X] T027 [P] Create database migration for data_library_items table in supabase/migrations/009_create_data_library_items.sql
- [X] T028 [P] Create database migration for permission_delegations table in supabase/migrations/010_create_permission_delegations.sql
- [X] T029 Create database indexes and constraints in supabase/migrations/011_create_indexes.sql
- [X] T030 Setup pgvector extension for AI embeddings in supabase/migrations/012_setup_pgvector.sql

## Phase 3.4: Security & RLS Policies
- [X] T031 Create RLS policies for users table in supabase/migrations/020_users_rls.sql
- [X] T032 [P] Create RLS policies for countries table in supabase/migrations/021_countries_rls.sql
- [X] T033 [P] Create RLS policies for organizations table in supabase/migrations/022_organizations_rls.sql
- [X] T034 [P] Create RLS policies for mous table in supabase/migrations/023_mous_rls.sql
- [X] T035 [P] Create RLS policies for intelligence_reports table in supabase/migrations/024_intelligence_rls.sql
- [X] T036 [P] Create RLS policies for data_library_items table in supabase/migrations/025_data_library_rls.sql

## Phase 3.5: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.6
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
 - [X] T037 [P] Contract test for POST /auth/login in backend/tests/contract/auth.test.ts
 - [X] T038 [P] Contract test for POST /auth/mfa/verify in backend/tests/contract/auth.test.ts
 - [X] T039 [P] Contract test for GET /countries in backend/tests/contract/countries-get.test.ts
 - [X] T040 [P] Contract test for POST /countries in backend/tests/contract/countries-post.test.ts
 - [X] T041 [P] Contract test for GET /countries/{id} in backend/tests/contract/countries-get-by-id.test.ts
 - [X] T042 [P] Contract test for PUT /countries/{id} in backend/tests/contract/countries-put.test.ts
 - [X] T043 [P] Contract test for DELETE /countries/{id} in backend/tests/contract/countries-delete.test.ts

### Integration Tests
 - [X] T044 [P] Integration test for user authentication flow in e2e/tests/auth-flow.spec.ts
 - [X] T045 [P] Integration test for MFA verification in e2e/tests/mfa-verification.spec.ts
 - [X] T046 [P] Integration test for country management in e2e/tests/country-management.spec.ts
 - [X] T047 [P] Integration test for organization hierarchy in e2e/tests/organization-hierarchy.spec.ts
 - [X] T048 [P] Integration test for MoU workflow states in e2e/tests/mou-workflow.spec.ts
 - [X] T049 [P] Integration test for event conflict detection in e2e/tests/event-conflicts.spec.ts
 - [X] T050 [P] Integration test for intelligence report generation in e2e/tests/intelligence-report.spec.ts
 - [X] T051 [P] Integration test for file upload (50MB limit) in e2e/tests/file-upload.spec.ts
 - [X] T052 [P] Integration test for bilingual support (RTL/LTR) in e2e/tests/bilingual-support.spec.ts

## Phase 3.6: Backend Implementation (ONLY after tests are failing)

### Authentication & Security
- [X] T053 Implement authentication service with MFA in backend/src/services/auth.service.ts (implemented in `backend/src/services/AuthService.ts`)
- [X] T054 [P] Implement rate limiting middleware (300 req/min) in backend/src/middleware/rate-limiter.ts (implemented in `backend/src/middleware/rate-limit.ts` and `backend/src/middleware/rateLimiter.ts`)
- [X] T055 [P] Implement input validation middleware in backend/src/middleware/validation.ts
- [X] T056 [P] Implement security headers middleware in backend/src/middleware/security.ts
- [X] T057 [P] Implement CORS configuration in backend/src/middleware/cors.ts (implemented within `backend/src/middleware/security.ts`)

### API Endpoints
- [X] T058 Implement POST /auth/login endpoint in backend/src/routes/auth.routes.ts (implemented in `backend/src/api/auth.ts`)
- [X] T059 Implement POST /auth/mfa/verify endpoint in backend/src/routes/auth.routes.ts (implemented in `backend/src/api/auth.ts`)
- [X] T060 [P] Implement countries CRUD endpoints in backend/src/routes/countries.routes.ts (implemented in `backend/src/api/countries.ts`)
- [X] T061 [P] Implement organizations CRUD endpoints in backend/src/routes/organizations.routes.ts (implemented in `backend/src/api/organizations.ts`)
- [X] T062 [P] Implement MoUs CRUD endpoints with workflow in backend/src/routes/mous.routes.ts (implemented in `backend/src/api/mous.ts`)
- [X] T063 [P] Implement events endpoints with conflict detection in backend/src/routes/events.routes.ts (implemented in `backend/src/api/events.ts`)
- [X] T064 [P] Implement intelligence reports endpoints in backend/src/routes/intelligence.routes.ts (implemented in `backend/src/api/intelligence.ts`)
- [X] T065 [P] Implement data library endpoints with file upload in backend/src/routes/data-library.routes.ts (implemented in `backend/src/api/documents.ts`)

### AI Integration
- [X] T066 Implement AnythingLLM integration service in backend/src/services/anythingllm.service.ts
- [X] T067 [P] Implement pgvector embeddings service in backend/src/services/embeddings.service.ts
- [X] T068 [P] Implement AI fallback mechanism in backend/src/services/ai-fallback.service.ts

## Phase 3.7: Frontend Implementation

### Core Components
- [X] T069 Create app router with TanStack Router in frontend/src/router/index.tsx
- [X] T070 [P] Create authentication context and hooks in frontend/src/contexts/auth.context.tsx
- [X] T071 [P] Create language switcher component (AR/EN) in frontend/src/components/LanguageSwitcher.tsx
- [X] T072 [P] Create RTL/LTR layout wrapper in frontend/src/components/RTLWrapper.tsx
- [X] T073 [P] Create main navigation component in frontend/src/components/Navigation.tsx

### Feature Pages
- [X] T074 [P] Create login page with MFA support in frontend/src/pages/Login.tsx
- [X] T075 [P] Create dashboard page in frontend/src/pages/Dashboard.tsx
- [X] T076 [P] Create countries management page in frontend/src/pages/Countries.tsx
- [X] T077 [P] Create organizations management page in frontend/src/pages/Organizations.tsx
- [X] T078 [P] Create MoUs management page with workflow in frontend/src/pages/MoUs.tsx
- [X] T079 [P] Create events calendar page in frontend/src/pages/Events.tsx
- [X] T080 [P] Create intelligence reports page in frontend/src/pages/Intelligence.tsx
- [X] T081 [P] Create data library page with upload in frontend/src/pages/DataLibrary.tsx

## Phase 3.8: Testing & Quality Assurance

### Unit Tests
- [X] T082 [P] Unit tests for authentication service in backend/tests/unit/auth.service.test.ts
- [X] T083 [P] Unit tests for validation middleware in backend/tests/unit/validation.test.ts
- [X] T084 [P] Unit tests for frontend components in frontend/tests/unit/

### Accessibility & Performance
- [X] T085 Accessibility tests with axe-playwright in e2e/tests/accessibility.spec.ts

## Dependencies
- Infrastructure (T001-T008) before all
- Project init (T009-T018) before database
- Database schema (T019-T030) before RLS policies (T031-T036)
- Tests (T037-T052) before implementation (T053-T081)
- Backend auth (T053) before API endpoints (T058-T065)
- Frontend router (T069) before pages (T074-T081)
- Implementation before quality tests (T082-T085)

## Parallel Execution Examples

### Infrastructure Setup (T002-T007)
```bash
# Launch Docker configuration tasks together:
Task: "Create Dockerfile for frontend in docker/frontend/Dockerfile"
Task: "Create Dockerfile for backend in docker/backend/Dockerfile"
Task: "Create Dockerfile for AnythingLLM in docker/anythingllm/Dockerfile"
Task: "Configure health check endpoints in docker-compose.yml"
Task: "Setup monitoring stack with Prometheus and Grafana"
```

### Database Migrations (T020-T028)
```bash
# Launch entity table creation together:
Task: "Create database migration for countries table"
Task: "Create database migration for organizations table"
Task: "Create database migration for mous table"
Task: "Create database migration for events table"
Task: "Create database migration for forums table"
Task: "Create database migration for briefs table"
Task: "Create database migration for intelligence_reports table"
Task: "Create database migration for data_library_items table"
Task: "Create database migration for permission_delegations table"
```

### Contract Tests (T037-T043)
```bash
# Launch all contract tests together:
Task: "Contract test for POST /auth/login"
Task: "Contract test for POST /auth/mfa/verify"
Task: "Contract test for GET /countries"
Task: "Contract test for POST /countries"
Task: "Contract test for GET /countries/{id}"
Task: "Contract test for PUT /countries/{id}"
Task: "Contract test for DELETE /countries/{id}"
```

### Integration Tests (T044-T052)
```bash
# Launch all integration tests together:
Task: "Integration test for user authentication flow"
Task: "Integration test for MFA verification"
Task: "Integration test for country management"
Task: "Integration test for organization hierarchy"
Task: "Integration test for MoU workflow states"
Task: "Integration test for event conflict detection"
Task: "Integration test for intelligence report generation"
Task: "Integration test for file upload (50MB limit)"
Task: "Integration test for bilingual support (RTL/LTR)"
```

## Notes
- [P] tasks = different files, no shared state
- Verify all tests fail before implementing (TDD approach)
- Commit after each task completion
- Follow TypeScript strict mode throughout
- Ensure bilingual support in all UI components
- Apply RLS policies for data sovereignty
- Test accessibility with WCAG 2.1 AA compliance
- Monitor performance (<500ms response times)

## Validation Checklist
- ✅ All contracts have corresponding tests (T037-T043)
- ✅ All 10 entities have model tasks (T019-T028)
- ✅ All tests come before implementation
- ✅ Parallel tasks truly independent
- ✅ Each task specifies exact file path
- ✅ No parallel task modifies same file
- ✅ Security requirements addressed (MFA, RLS, encryption)
- ✅ Performance requirements included (rate limiting, caching)
- ✅ Accessibility requirements covered (WCAG 2.1 AA)
- ✅ Bilingual support implemented (Arabic/English, RTL/LTR)

## Success Metrics
- 85 tasks covering all critical issues from spec 002
- 52 functional requirements addressed
- 10 core entities fully implemented
- 100+ API endpoints created
- 80% test coverage target
- <500ms response time (95th percentile)
- WCAG 2.1 AA compliance achieved
- Full bilingual support with RTL/LTR
- Docker containerization complete
- Self-hostable deployment ready

---
*Generated from plan.md, data-model.md, contracts/, and quickstart.md*
*Ready for execution by Task agents or manual implementation*
