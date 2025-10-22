# Tasks: Intake Entity Linking System

**Input**: Design documents from `/specs/024-intake-entity-linking/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Feature Summary**: Polymorphic entity linking system allowing triage officers to associate intake tickets with 11 entity types using 5 link types. Includes AI-powered suggestions via AnythingLLM with pgvector semantic search, soft-delete for audit trails, and automatic link migration when intake tickets convert to formal positions.

**Tests**: This feature follows Test-First Development (Principle III). Contract and integration tests are written before implementation to ensure quality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify project structure matches plan.md (backend/src/, frontend/src/, supabase/)
- [X] T002 [P] Verify TypeScript 5.8+ strict mode enabled in backend/tsconfig.json and frontend/tsconfig.json
- [X] T003 [P] Verify TanStack Query v5 and TanStack Router v5 in frontend/package.json
- [X] T004 [P] Verify @dnd-kit/core in frontend/package.json for drag-and-drop
- [X] T005 [P] Verify Redis 7.x and ioredis in backend/package.json
- [X] T006 [P] Verify pgvector extension enabled in Supabase (SELECT * FROM pg_extension WHERE extname='vector')
- [X] T007 [P] Configure environment variables in backend/.env and frontend/.env per quickstart.md Step 1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T008 Create migration supabase/migrations/YYYYMMDDHHMMSS_create_intake_entity_links.sql with intake_entity_links table
- [X] T009 Create migration supabase/migrations/YYYYMMDDHHMMSS_create_link_audit_logs.sql with link_audit_logs table (immutable)
- [X] T010 Create migration supabase/migrations/YYYYMMDDHHMMSS_create_ai_link_suggestions.sql with ai_link_suggestions table
- [X] T011 Create migration supabase/migrations/YYYYMMDDHHMMSS_create_intake_embeddings.sql with intake_embeddings table
- [X] T012 Create migration supabase/migrations/YYYYMMDDHHMMSS_create_entity_embeddings.sql with entity_embeddings table
- [X] T013 Create migration supabase/migrations/YYYYMMDDHHMMSS_add_intake_links_indexes.sql with 8 indexes (B-tree, partial unique, HNSW, GIN)
- [X] T014 Create migration supabase/migrations/YYYYMMDDHHMMSS_add_intake_links_rls.sql with RLS policies for all tables
- [X] T015 Create migration supabase/migrations/YYYYMMDDHHMMSS_add_intake_links_triggers.sql with audit logging triggers
- [X] T016 Create migration supabase/migrations/YYYYMMDDHHMMSS_add_clearance_check_function.sql with check_clearance_level() function
- [X] T016a Create migration supabase/migrations/YYYYMMDDHHMMSS_add_audit_retention_policy.sql with PostgreSQL policy enforcing 7-year minimum retention (REVOKE DELETE on link_audit_logs, add CHECK constraint on created_at)
- [X] T016b [P] Add audit log retention monitoring script in backend/src/scripts/check-audit-retention.ts (alerts if logs older than 7 years exist without archival)
- [X] T016c [P] Document audit retention procedures in docs/compliance/audit-log-retention.md (7-year retention requirement, archival process, compliance verification)
- [X] T017 Apply all migrations via Supabase MCP (npx supabase db push)
- [X] T018 Verify migrations applied successfully and indexes created (npx supabase db diff)

### Backend Core Infrastructure

- [X] T019 [P] Create backend/src/types/intake-entity-links.types.ts with TypeScript interfaces for EntityLink, CreateLinkRequest, LinkAuditLog
- [X] T020 [P] Create backend/src/types/ai-suggestions.types.ts with TypeScript interfaces for AILinkSuggestion, AIConfig
- [X] T021 [P] Create backend/src/middleware/clearance-check.ts for clearance level validation middleware
- [X] T022 [P] Create backend/src/middleware/organization-check.ts for multi-tenancy enforcement middleware
- [X] T023 [P] Create backend/src/config/redis.ts for Redis connection and caching configuration
- [X] T024 [P] Create backend/src/config/anythingllm.ts for AnythingLLM API configuration

### Frontend Core Infrastructure

- [X] T025 [P] Create frontend/src/types/database.types.ts with TypeScript types from Supabase schema (npx supabase gen types typescript)
- [X] T026 [P] Create frontend/src/services/entity-links-api.ts with API client functions for all endpoints
- [X] T027 [P] Create frontend/src/components/ui/ shadcn components (dialog, button, badge, card) via npx shadcn@latest add

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Triage Officer Links Intake to Primary Entity (Priority: P1) 🎯 MVP

**Goal**: Enable triage officers to manually link intake tickets to entities with search, validation, and instant UI feedback

**Independent Test**: Create an intake ticket, search for "Saudi Arabia" dossier, link as primary, verify link appears in intake detail view and dossier's related intakes list

**Performance Target**: <30 seconds end-to-end manual linking workflow (SC-001)

### Contract Tests for US1 (Test-First Development)

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T028 [P] [US1] Contract test for POST /api/intake/{intake_id}/links in backend/tests/contract/intake-links-api.test.ts
- [X] T029 [P] [US1] Contract test for GET /api/intake/{intake_id}/links in backend/tests/contract/intake-links-api.test.ts
- [X] T030 [P] [US1] Contract test for GET /api/entities/search in backend/tests/contract/intake-links-api.test.ts
- [X] T031 [P] [US1] Integration test for clearance enforcement in backend/tests/integration/clearance-enforcement.test.ts
- [X] T032 [P] [US1] Integration test for entity search ranking (AI confidence + recency + alphabetical) in backend/tests/integration/entity-search-ranking.test.ts

### Backend Implementation for US1

- [X] T033 [P] [US1] Implement link.service.ts with createEntityLink() function in supabase/functions/intake-links-create/index.ts (includes link_order auto-assignment logic: link_order=MAX(link_order)+1 within link_type scope, defaults to 1 if no existing links of that type)
- [X] T034 [P] [US1] Implement link.service.ts with getEntityLinks() function in supabase/functions/intake-links-get/index.ts
- [X] T035 [P] [US1] Implement entity-search.service.ts with searchEntities() function (FR-001a ranking) in supabase/functions/entities-search/index.ts
- [X] T036 [US1] Implement link-audit.service.ts with createAuditLog() function (embedded in intake-links-create)
- [X] T037 [US1] Implement POST /api/intake/:intake_id/links route handler (Edge Function: intake-links-create)
- [X] T038 [US1] Implement GET /api/intake/:intake_id/links route handler (Edge Function: intake-links-get)
- [X] T039 [US1] Implement GET /api/entities/search route handler (Edge Function: entities-search)
- [X] T040 [US1] Add validation for link type constraints (primary only to anchor entities) in intake-links-create
- [X] T041 [US1] Add validation for entity existence and archived status in intake-links-create
- [X] T041a [P] [US1] Add `_version` INTEGER DEFAULT 1 column to intake_entity_links table (already in migration)
- [X] T041b [US1] Implement optimistic locking in createEntityLink() (uses _version = 1)
- [X] T041c [US1] Add conflict detection integration test in backend/tests/integration/clearance-enforcement.test.ts (simulate concurrent updates, verify 409 Conflict response with retry guidance)
- [X] T042 [US1] Add Redis caching for entity metadata (5-minute TTL) (implemented in entities-search Edge Function)

### Frontend Implementation for US1

- [X] T043 [P] [US1] Create use-entity-links.ts hook with TanStack Query for CRUD operations in frontend/src/hooks/use-entity-links.ts
- [X] T044 [P] [US1] Create use-entity-search.ts hook with TanStack Query for entity search in frontend/src/hooks/use-entity-search.ts
- [X] T045 [P] [US1] Create LinkTypeBadge.tsx component (mobile-first, RTL-compatible) in frontend/src/components/entity-links/LinkTypeBadge.tsx
- [X] T046 [P] [US1] Create LinkCard.tsx component (mobile-first, RTL-compatible, 44x44px touch targets) in frontend/src/components/entity-links/LinkCard.tsx
- [X] T047 [US1] Create EntitySearchDialog.tsx component with search input and results ranking in frontend/src/components/entity-links/EntitySearchDialog.tsx (depends on T044)
- [X] T048 [US1] Create LinkList.tsx component with vertical stacking on mobile in frontend/src/components/entity-links/LinkList.tsx (depends on T046)
- [X] T049 [US1] Create EntityLinkManager.tsx main container component (lazy loaded) in frontend/src/components/entity-links/EntityLinkManager.tsx (depends on T043, T047, T048)
- [X] T050 [US1] Integrate EntityLinkManager into IntakeDetailPage.tsx in frontend/src/pages/TicketDetail.tsx (depends on T049)
- [X] T051 [US1] Add optimistic updates to use-entity-links.ts for <50ms perceived latency
- [X] T052 [US1] Add i18n translations for entity linking UI in frontend/public/locales/en/translation.json and frontend/public/locales/ar/translation.json

### E2E Tests for US1

- [X] T053 [US1] E2E test for manual linking workflow (<30s target) in frontend/tests/e2e/manual-linking.spec.ts (depends on T050)
- [X] T054 [US1] Accessibility test for entity search keyboard navigation in frontend/tests/accessibility/entity-search.a11y.test.ts (depends on T047)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. MVP is complete! Note: Basic link ordering (auto-assigned link_order during creation) is implemented in US1; advanced drag-and-drop reordering UI is deferred to User Story 5 (Priority P3) per FR-013.

---

## Phase 4: User Story 2 - AI Suggests Multiple Related Entities (Priority: P1)

**Goal**: Enable AI-powered link suggestions with confidence scores to reduce manual search time by 40%

**Independent Test**: Create intake with text "bilateral meeting with Saudi Arabia and USA regarding trade policy", trigger AI suggestions, verify 3-5 suggestions with confidence scores 0.70-0.99

**Performance Target**: <3 seconds for AI suggestions (SC-002)

### Contract Tests for US2 (Test-First Development)

- [X] T055 [P] [US2] Contract test for POST /api/intake/{intake_id}/links/suggestions in backend/tests/contract/ai-suggestions-api.test.ts
- [X] T056 [P] [US2] Contract test for POST /api/intake/{intake_id}/links/suggestions/accept in backend/tests/contract/ai-suggestions-api.test.ts
- [X] T057 [P] [US2] Integration test for AnythingLLM integration with graceful degradation in backend/tests/contract/ai-suggestions-api.test.ts
- [X] T058 [P] [US2] Integration test for vector similarity search performance (<3s) in backend/tests/contract/ai-suggestions-api.test.ts

### Backend Implementation for US2

- [X] T059 [P] [US2] Implement ai-link-suggestion.service.ts with generateEmbedding() function in backend/src/services/ai-link-suggestion.service.ts
- [X] T060 [P] [US2] Implement ai-link-suggestion.service.ts with vectorSimilaritySearch() function (pgvector HNSW) in backend/src/services/ai-link-suggestion.service.ts
- [X] T061 [US2] Implement ai-link-suggestion.service.ts with generateSuggestions() orchestration function (depends on T059, T060)
- [X] T062 [US2] Implement ai-link-suggestion.service.ts with rankSuggestions() using FR-001a formula (AI 50% + recency 30% + alphabetical 20%) in backend/src/services/ai-link-suggestion.service.ts (depends on T060)
- [X] T063 [US2] Implement ai-link-suggestion.service.ts with generateReasoning() via AnythingLLM API in backend/src/services/ai-link-suggestion.service.ts
- [X] T064 [US2] Implement POST /api/intake/:intake_id/links/suggestions route handler with graceful degradation in backend/src/api/ai-link-suggestions.ts (depends on T061, T062, T063)
- [X] T065 [US2] Implement POST /api/intake/:intake_id/links/suggestions/accept route handler in backend/src/api/ai-link-suggestions.ts (depends on T033)
- [X] T066 [US2] Add rate limiting (3 requests/minute per user) to AI suggestions endpoint in backend/src/api/ai-link-suggestions.ts
- [X] T067 [US2] Add clearance level filtering to AI suggestions in backend/src/services/ai-link-suggestion.service.ts
- [X] T068 [US2] Add archived entity filtering to AI suggestions in backend/src/services/ai-link-suggestion.service.ts
- [X] T069 [US2] Add Redis caching for recent AI suggestions (1-minute TTL) in backend/src/services/ai-link-suggestion.service.ts
- [X] T069a [US2] Add AI timeout configuration (3000ms) and loading states to AISuggestionPanel.tsx

### Frontend Implementation for US2

- [X] T070 [P] [US2] Create use-ai-suggestions.ts hook with TanStack Query for AI operations in frontend/src/hooks/use-ai-suggestions.ts
- [X] T071 [US2] Create AISuggestionPanel.tsx component (mobile-first, scrollable on small screens) in frontend/src/components/entity-links/AISuggestionPanel.tsx (depends on T070)
- [X] T072 [US2] Integrate AISuggestionPanel into EntityLinkManager.tsx in frontend/src/components/entity-links/EntityLinkManager.tsx (depends on T071)
- [X] T073 [US2] Add "Get AI Suggestions" button with loading state (2-3s) in EntityLinkManager.tsx
- [X] T074 [US2] Add error handling for AI service unavailability with fallback banner in AISuggestionPanel.tsx
- [X] T075 [US2] Add i18n translations for AI suggestions UI in frontend/public/locales/en/translation.json and frontend/public/locales/ar/translation.json

### E2E Tests for US2

- [X] T076 [US2] E2E test for AI suggestions workflow (<3s target) in frontend/tests/e2e/ai-suggestions.spec.ts (depends on T072)
- [X] T077 [US2] E2E test for AI service unavailability graceful degradation in frontend/tests/e2e/ai-suggestions.spec.ts (depends on T074)

**Checkpoint**: User Stories 1 AND 2 are both independently functional

---

## Phase 5: User Story 3 - Bulk Link Creation During Intake Conversion (Priority: P2)

**Goal**: Automatically migrate entity links when intake tickets convert to formal positions with 100% success rate

**Independent Test**: Create intake with 3+ links (primary, related, requested), convert to position, verify all links migrate with appropriate type mappings and audit logs

**Performance Target**: <500ms for batch operations (SC-003)

### Contract Tests for US3 (Test-First Development)

- [X] T078 [P] [US3] Contract test for POST /api/intake/{intake_id}/links/batch in backend/tests/contract/batch-links-api.test.ts
- [X] T079 [P] [US3] Integration test for intake-to-position link migration in backend/tests/integration/link-migration.test.ts
- [X] T080 [P] [US3] Integration test for transaction rollback on migration failure in backend/tests/integration/link-migration.test.ts
- [X] T081 [P] [US3] Performance test for batch create 50 links (<500ms target) in backend/tests/performance/batch-operations.k6.js

### Backend Implementation for US3

- [X] T082 [P] [US3] Implement link.service.ts with createBatchLinks() function in backend/src/services/link.service.ts
- [X] T083 [US3] Implement link-migration.service.ts with migrateIntakeLinksToPosition() function in backend/src/services/link-migration.service.ts (depends on T082)
- [X] T084 [US3] Implement link-migration.service.ts with mapLinkTypes() for link type transformation in backend/src/services/link-migration.service.ts
- [X] T085 [US3] Implement POST /api/intake/:intake_id/links/batch route handler in backend/src/api/intake-entity-links.ts (depends on T082)
- [X] T086 [US3] Add transaction boundaries for atomicity in link-migration.service.ts
- [X] T087 [US3] Add audit logging for migration events in link-migration.service.ts (depends on T036)
- [X] T088 [US3] Add error handling for partial batch failures with detailed error messages in backend/src/api/intake-entity-links.ts

### Notes Field Implementation (FR-016)

- [X] T088a [P] [US3] Add `notes` TEXT field to intake_entity_links table in supabase/migrations/YYYYMMDDHHMMSS_create_intake_entity_links.sql
- [X] T088b [P] [US3] Contract test for notes field validation (max length 1000 chars) in backend/tests/contract/batch-links-api.test.ts
- [X] T088c [US3] Add notes display and inline edit UI to LinkCard.tsx in frontend/src/components/entity-links/LinkCard.tsx (depends on T088a)
- [X] T088d [US3] Add notes to use-entity-links.ts createEntityLink() and updateEntityLink() mutations

### E2E Tests for US3

- [X] T089 [US3] E2E test for link migration workflow (100% success target) in frontend/tests/e2e/link-migration.spec.ts (depends on T083)

**Checkpoint**: User Stories 1, 2, AND 3 are all independently functional

---

## Phase 6: User Story 4 - Analyst Discovers All Intakes Related to a Dossier (Priority: P2)

**Goal**: Enable reverse lookup to find all intake tickets linked to an entity with filtering and pagination

**Independent Test**: Link 10+ intake tickets to a dossier with different link types, view dossier's "Related Intakes" tab, verify filtering by link type works

**Performance Target**: <2 seconds for reverse lookup with 1000+ intakes (SC-004)

### Contract Tests for US4 (Test-First Development)

- [X] T090 [P] [US4] Contract test for GET /api/entities/{entity_type}/{entity_id}/intakes in backend/tests/contract/intake-links-api.test.ts
- [X] T091 [P] [US4] Performance test for reverse lookup 1000+ intakes (<2s target) in backend/tests/performance/reverse-lookup.k6.js

### Backend Implementation for US4

- [X] T092 [P] [US4] Implement link.service.ts with getEntityIntakes() function with pagination in backend/src/services/link.service.ts
- [X] T093 [US4] Implement GET /api/entities/:entity_type/:entity_id/intakes route handler in backend/src/api/intake-entity-links.ts (depends on T092)
- [X] T094 [US4] Add link type filtering to getEntityIntakes() in backend/src/services/link.service.ts
- [X] T095 [US4] Add clearance level filtering to reverse lookup results in backend/src/services/link.service.ts
- [X] T096 [US4] Optimize reverse lookup query with composite indexes (entity_type, entity_id, deleted_at) in backend/src/services/link.service.ts

### Frontend Implementation for US4

- [X] T097 [P] [US4] Create "Related Intakes" tab component (mobile-first) in frontend/src/components/dossier/RelatedIntakesTab.tsx
- [X] T098 [US4] Add filtering UI for link type (primary/related/mentioned) in RelatedIntakesTab.tsx (depends on T097)
- [X] T099 [US4] Add pagination controls (50 per page) in RelatedIntakesTab.tsx (depends on T097)
- [X] T100 [US4] Add i18n translations for related intakes UI in frontend/public/locales/en/translation.json and frontend/public/locales/ar/translation.json

### E2E Tests for US4

- [X] T101 [US4] E2E test for reverse lookup workflow (<2s target) in frontend/tests/e2e/reverse-lookup.spec.ts (depends on T097)

**Checkpoint**: User Stories 1-4 are all independently functional

---

## Phase 7: User Story 5 - Link Management and Soft Delete (Priority: P3)

**Goal**: Enable correction of linking mistakes with soft-delete and restoration for audit compliance

**Independent Test**: Create link, soft-delete it, verify it disappears from active views but remains in audit log, restore it, verify it reappears

### Contract Tests for US5 (Test-First Development)

- [X] T102 [P] [US5] Contract test for DELETE /api/intake/{intake_id}/links/{link_id} in backend/tests/contract/link-management-api.test.ts
- [X] T103 [P] [US5] Contract test for POST /api/intake/{intake_id}/links/{link_id}/restore in backend/tests/contract/link-management-api.test.ts
- [X] T104 [P] [US5] Contract test for PUT /api/intake/{intake_id}/links/{link_id} in backend/tests/contract/link-management-api.test.ts
- [X] T105 [P] [US5] Contract test for PUT /api/intake/{intake_id}/links/reorder in backend/tests/contract/link-management-api.test.ts

### Backend Implementation for US5

- [X] T106 [P] [US5] Implement link.service.ts with deleteEntityLink() (soft delete) function in backend/src/services/link.service.ts
- [X] T107 [P] [US5] Implement link.service.ts with restoreEntityLink() function in backend/src/services/link.service.ts
- [X] T108 [P] [US5] Implement link.service.ts with updateEntityLink() (notes, link_order) function in backend/src/services/link.service.ts
- [X] T109 [P] [US5] Implement link.service.ts with reorderEntityLinks() function in backend/src/services/link.service.ts
- [X] T110 [US5] Implement DELETE /api/intake/:intake_id/links/:link_id route handler in backend/src/api/intake-entity-links.ts (depends on T106)
- [X] T111 [US5] Implement POST /api/intake/:intake_id/links/:link_id/restore route handler (steward+ role) in backend/src/api/intake-entity-links.ts (depends on T107)
- [X] T112 [US5] Implement PUT /api/intake/:intake_id/links/:link_id route handler in backend/src/api/intake-entity-links.ts (depends on T108)
- [X] T113 [US5] Implement PUT /api/intake/:intake_id/links/reorder route handler in backend/src/api/intake-entity-links.ts (depends on T109)
- [X] T114 [US5] Add audit logging for delete/restore/update operations in backend/src/services/link-audit.service.ts

### Frontend Implementation for US5

- [X] T115 [P] [US5] Create use-link-reorder.ts hook for drag-and-drop state management in frontend/src/hooks/use-link-reorder.ts
- [X] T116 [US5] Add @dnd-kit/core drag-and-drop to LinkList.tsx with touch support in frontend/src/components/entity-links/LinkList.tsx (depends on T115)
- [X] T117 [US5] Add debounced API call (500ms) for reorder operations in use-link-reorder.ts
- [X] T118 [US5] Add delete button to LinkCard.tsx with confirmation dialog in frontend/src/components/entity-links/LinkCard.tsx
- [X] T119 [US5] Add restore button to deleted links view (steward+ role) in EntityLinkManager.tsx
- [X] T120 [US5] Add edit notes functionality to LinkCard.tsx in frontend/src/components/entity-links/LinkCard.tsx
- [X] T121 [US5] Add keyboard navigation (Space, Arrow keys) for drag-and-drop accessibility in LinkList.tsx
- [X] T122 [US5] Add i18n translations for link management UI in frontend/public/locales/en/translation.json and frontend/public/locales/ar/translation.json

### E2E Tests for US5

- [X] T123 [US5] E2E test for soft delete and restore workflow in frontend/tests/e2e/link-management.spec.ts (depends on T118, T119)
- [X] T124 [US5] E2E test for drag-and-drop reordering in frontend/tests/e2e/link-management.spec.ts (depends on T116)
- [X] T125 [US5] Accessibility test for drag-and-drop keyboard navigation in frontend/tests/accessibility/link-cards.a11y.test.ts (depends on T121)

**Checkpoint**: All user stories (1-5) are now independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance Optimization

- [X] T126 [P] Run performance benchmarks and verify targets met (batch <500ms, reverse lookup <2s, AI <3s) per quickstart.md Step 7
- [X] T127 [P] Optimize database queries with EXPLAIN ANALYZE for slow queries
- [X] T128 [P] Verify Redis cache hit rate >80% for entity metadata

### Security Hardening

- [X] T129 [P] Verify RLS policies enforced on all tables (quickstart.md Step 9.3)
- [X] T130 [P] Test clearance enforcement across all endpoints (quickstart.md Step 9.1)
- [X] T131 [P] Test organization boundary enforcement (quickstart.md Step 9.2)
- [X] T132 [P] Verify audit logs are immutable (REVOKE UPDATE/DELETE)
- [X] T133 [P] Security scan with npm audit and dependency vulnerability checks

### Mobile & Accessibility

- [X] T134 [P] Verify mobile-first responsive design on 320px, 768px, 1280px viewports (quickstart.md Step 8.1)
- [X] T135 [P] Verify RTL Arabic support with logical properties and icon rotation (quickstart.md Step 8.2)
- [X] T136 [P] Verify touch targets minimum 44x44px across all components
- [X] T137 [P] Run axe-playwright accessibility tests and fix violations
- [X] T138 [P] Verify WCAG AA color contrast (4.5:1 text, 3:1 UI components)
- [X] T139 [P] Test keyboard navigation across all interactive elements

### Documentation & Testing

- [X] T140 [P] Update API documentation (OpenAPI spec) with all implemented endpoints
- [X] T141 [P] Verify test coverage >80% for backend services (npm run test:coverage)
- [X] T142 [P] Verify test coverage >80% for frontend components (npm run test:coverage)
- [X] T143 [P] Run all E2E tests and verify all user stories pass (npm run test:e2e)
- [X] T144 [P] Create architecture decision records for key decisions in docs/adr/
- [X] T145 [P] Validate quickstart.md by following all steps end-to-end

### Code Quality

- [X] T146 [P] Run ESLint and fix all errors and warnings
- [X] T147 [P] Run TypeScript compiler and fix all type errors (zero `any` usage)
- [X] T148 [P] Run Prettier and format all code consistently
- [X] T149 [P] Code review for adherence to constitution principles (mobile-first, RTL, security, performance)

### Production Readiness

- [X] T150 Complete production readiness checklist from quickstart.md Step 10
- [X] T151 [P] Configure error monitoring (Sentry or equivalent)
- [X] T152 [P] Configure performance monitoring (Lighthouse CI)
- [X] T153 [P] Setup staging deployment pipeline
- [X] T154 [P] Create rollback plan and disaster recovery procedures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (Phase 7)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

All user stories are designed to be independently implementable after Phase 2 completion:

- **User Story 1 (P1) 🎯 MVP**: Manual linking - Foundation for all linking operations
- **User Story 2 (P1)**: AI suggestions - Extends US1 with AI, but US1 works without it
- **User Story 3 (P2)**: Migration - Uses link creation from US1, but US1 works without migration
- **User Story 4 (P2)**: Reverse lookup - Independent query capability
- **User Story 5 (P3)**: Link management - Extends US1 with CRUD, but US1 works with create-only

### Within Each User Story

- **Tests FIRST**: Contract and integration tests must be written before implementation
- **Tests must FAIL**: Verify tests fail before writing implementation (red-green-refactor)
- **Backend before Frontend**: Backend services and APIs before frontend components
- **Hooks before Components**: TanStack Query hooks before React components
- **Core before Integration**: Complete core functionality before integration points

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T004, T005, T006, T007 can run in parallel

**Phase 2 (Foundational Backend)**: T019, T020, T021, T022, T023, T024 can run in parallel

**Phase 2 (Foundational Frontend)**: T025, T026, T027 can run in parallel

**User Story 1 Contract Tests**: T028, T029, T030, T031, T032 can run in parallel

**User Story 1 Backend Services**: T033, T034, T035 can run in parallel

**User Story 1 Frontend Hooks**: T043, T044 can run in parallel

**User Story 1 Frontend Components**: T045, T046 can run in parallel

**User Story 2 Contract Tests**: T055, T056, T057, T058 can run in parallel

**User Story 2 Backend AI Services**: T059, T060 can run in parallel

**User Story 3 Contract Tests**: T078, T079, T080, T081 can run in parallel

**User Story 3 Backend Services**: T082 can run in parallel with other US3 tasks (no dependencies)

**User Story 4 Contract Tests**: T090, T091 can run in parallel

**User Story 4 Backend Services**: T092 can run in parallel with frontend tasks

**User Story 4 Frontend Components**: T097 can start while backend is being developed

**User Story 5 Contract Tests**: T102, T103, T104, T105 can run in parallel

**User Story 5 Backend Services**: T106, T107, T108, T109 can run in parallel

**User Story 5 Frontend Hooks**: T115 can run in parallel with backend development

**Phase 8 (Polish)**: Most tasks marked [P] can run in parallel

**Multiple User Stories**: After Phase 2 is complete, different team members can work on different user stories in parallel (US1, US2, US3, US4, US5 all independent)

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch all contract tests in parallel (must FAIL before implementation)
Task T028: Contract test for POST /api/intake/{intake_id}/links
Task T029: Contract test for GET /api/intake/{intake_id}/links
Task T030: Contract test for GET /api/entities/search
Task T031: Integration test for clearance enforcement
Task T032: Integration test for entity search ranking

# Step 2: Verify tests fail, then launch backend services in parallel
Task T033: Implement createEntityLink() in link.service.ts
Task T034: Implement getEntityLinks() in link.service.ts
Task T035: Implement searchEntities() in entity-search.service.ts

# Step 3: Launch frontend hooks in parallel
Task T043: Create use-entity-links.ts hook
Task T044: Create use-entity-search.ts hook

# Step 4: Launch frontend components in parallel
Task T045: Create LinkTypeBadge.tsx
Task T046: Create LinkCard.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) 🎯

1. ✅ Complete Phase 1: Setup (T001-T007)
2. ✅ Complete Phase 2: Foundational (T008-T027) - CRITICAL BLOCKER
3. ✅ Complete Phase 3: User Story 1 (T028-T054)
4. **STOP and VALIDATE**: Test User Story 1 independently per quickstart.md
5. Deploy to staging for QA validation
6. **MVP Complete!** - Triage officers can manually link intake tickets to entities

### Incremental Delivery

1. **Foundation** (Phases 1-2): Setup + Foundational → Database and infrastructure ready
2. **MVP Release** (Phase 3): User Story 1 → Manual linking functional → Deploy/Demo 🎯
3. **AI Release** (Phase 4): User Story 2 → AI suggestions added → Deploy/Demo
4. **Migration Release** (Phase 5): User Story 3 → Intake conversion supported → Deploy/Demo
5. **Discovery Release** (Phase 6): User Story 4 → Reverse lookup added → Deploy/Demo
6. **Management Release** (Phase 7): User Story 5 → Full CRUD lifecycle → Deploy/Demo
7. **Production Release** (Phase 8): Polish → Production-ready deployment

Each release adds value without breaking previous functionality!

### Parallel Team Strategy (3+ Developers)

**Week 1**: Entire team completes Setup (Phase 1) + Foundational (Phase 2) together

**Week 2-3** (After Foundational is done):
- **Developer A**: User Story 1 (T028-T054) - MVP priority
- **Developer B**: User Story 2 (T055-T077) - AI suggestions
- **Developer C**: User Story 3 (T078-T089) - Migration

**Week 4** (Continue parallel development):
- **Developer A**: User Story 4 (T090-T101) - Reverse lookup
- **Developer B**: User Story 5 (T102-T125) - Link management
- **Developer C**: Start Phase 8 polish tasks

**Week 5**: Entire team completes Phase 8 (Polish) together for production release

---

## Task Summary

**Total Tasks**: 154
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 19 tasks (CRITICAL - blocks all user stories)
- Phase 3 (User Story 1 - Manual Linking): 27 tasks 🎯 MVP
- Phase 4 (User Story 2 - AI Suggestions): 23 tasks
- Phase 5 (User Story 3 - Bulk Migration): 12 tasks
- Phase 6 (User Story 4 - Reverse Lookup): 12 tasks
- Phase 7 (User Story 5 - Link Management): 21 tasks
- Phase 8 (Polish): 33 tasks

**Parallelizable Tasks**: 78 tasks marked with [P] (51% parallelizable)

**Test Tasks**: 29 tasks (19% of total - comprehensive test coverage)
- Contract tests: 14 tasks
- Integration tests: 9 tasks
- E2E tests: 4 tasks
- Accessibility tests: 2 tasks

**MVP Scope** (Phases 1-3): 53 tasks - Delivers core manual linking functionality

**Estimated Timeline**:
- **Solo Developer**: 8-10 weeks for full implementation
- **Team of 3**: 4-5 weeks with parallel user story development
- **MVP Only**: 2-3 weeks (Phases 1-3)

---

## Success Criteria Validation

After implementation, verify all success criteria from spec.md are met:

- **SC-001**: Manual linking <30s end-to-end ✅ (E2E test in T053)
- **SC-002**: AI suggestions <3s for 3-5 recommendations ✅ (Performance test in T058, E2E in T076)
- **SC-003**: Batch create 50 links <500ms ✅ (Performance test in T081)
- **SC-004**: Reverse lookup <2s for 1000+ intakes ✅ (Performance test in T091, E2E in T101)
- **SC-005**: 90% AI suggestion acceptance rate ✅ (Track via analytics after deployment)
- **SC-006**: Zero unauthorized data access ✅ (Security tests in T130, T131)
- **SC-007**: 100% audit log accuracy ✅ (Verified via immutability in T132)
- **SC-008**: 100% link migration success rate ✅ (Integration test in T079, E2E in T089)
- **SC-009**: 50 concurrent users without degradation ✅ (Load testing after T126)
- **SC-010**: 40% triage time reduction ✅ (Measure via analytics after deployment)

---

## Notes

- **[P] marker**: Tasks can run in parallel because they work on different files with no dependencies
- **[Story] label**: Maps task to specific user story (US1-US5) for traceability and independent testing
- **Test-First Development**: All tests (T028-T032, T055-T058, T078-T081, T090-T091, T102-T105) must be written BEFORE implementation and verified to FAIL
- **Independent User Stories**: Each story should be fully functional and testable on its own after Phase 2
- **Mobile-First Required**: All frontend components must start with base styles (320px) and scale up with breakpoints
- **RTL Arabic Required**: All frontend components must use logical properties (ms-*, me-*, ps-*, pe-*) and detect RTL direction
- **Commit Strategy**: Commit after each task or logical group for easy rollback
- **Checkpoint Validation**: Stop at each checkpoint to test the user story independently before proceeding
- **Performance Targets**: Verify targets met at T126 before production deployment

---

**Generated**: 2025-01-18
**Feature**: 024-intake-entity-linking
**Total Tasks**: 154
**MVP Tasks**: 53 (Phases 1-3)
**Parallelizable**: 78 tasks (51%)
**Estimated Timeline**: 8-10 weeks solo, 4-5 weeks with team of 3, 2-3 weeks for MVP only
