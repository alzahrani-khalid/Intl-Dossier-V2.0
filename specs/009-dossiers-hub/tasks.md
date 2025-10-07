# Tasks: Dossiers Hub

**Input**: Design documents from `/specs/009-dossiers-hub/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/api-spec.yaml ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Extract: TypeScript 5.0+, React 18+, Supabase, TanStack Router/Query v5, Tailwind, shadcn/ui
   → Structure: Web app (backend/ for edge functions, frontend/ for React)
2. Load optional design documents ✅
   → data-model.md: 4 tables + 1 materialized view + 5 functions
   → contracts/: api-spec.yaml with 7 endpoints
   → research.md: Optimistic locking, infinite scroll, AI briefs, RLS patterns
3. Generate tasks by category:
   → Setup: Database migrations, helper functions
   → Tests: Contract tests for 7 endpoints (TDD)
   → Core: Edge functions, frontend components
   → Integration: Routes, API hooks, E2E tests
   → Polish: Accessibility, performance validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T053)
6. Validation: All contracts tested ✅, All entities modeled ✅, All endpoints implemented ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to repository root

## Path Conventions
- **Backend**: `supabase/functions/` for edge functions
- **Frontend**: `frontend/src/` for React components
- **Migrations**: `supabase/migrations/`
- **Tests**: `backend/tests/contract/`, `frontend/tests/e2e/`

---

## Phase 3.1: Database Foundation
*All migrations must complete before any implementation*

- [X] T001 Create helper function: increment_version() in `supabase/migrations/20250930001_helper_functions.sql`
- [X] T002 Create helper function: update_updated_at_column() in same migration file
- [X] T003 Create helper function: can_edit_dossier(UUID) in same migration file
- [X] T004 Create helper function: get_user_clearance_level(UUID) in same migration file
- [X] T005 Create helper function: is_admin_or_manager(UUID) in same migration file
- [X] T005a Create helper function: calculate_relationship_health(dossier_id UUID) in same migration file
  - Algorithm: engagement_frequency * 0.30 + commitment_rate * 0.40 + recency_score * 0.30
  - Returns NULL if < 3 engagements OR 0 commitments
  - Returns INTEGER 0-100

- [X] T006 Create dossiers table with indexes, triggers, RLS in `supabase/migrations/20250930002_create_dossiers_table.sql`
  - Schema: id, name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar, tags, review_cadence, last_review_date, version, created_at, updated_at, archived, search_vector
  - Indexes: type, status, sensitivity, search (GIN), tags (GIN), composite (type, status)
  - Triggers: set_dossiers_updated_at, dossiers_version_trigger
  - RLS policies: view_dossiers_by_clearance, insert_dossiers_authenticated, update_dossiers_hybrid_permissions, archive_dossiers_hybrid_permissions

- [X] T007 Create dossier_owners table with indexes, RLS in `supabase/migrations/20250930003_create_dossier_owners_table.sql`
  - Schema: dossier_id (FK), user_id (FK), assigned_at, role_type
  - Indexes: user_id, dossier_id
  - RLS policies: view_dossier_owners, manage_dossier_owners_admins_only

- [X] T008 Create key_contacts table with indexes, RLS in `supabase/migrations/20250930004_create_key_contacts_table.sql`
  - Schema: id, dossier_id (FK), name, role, organization, email, phone, last_interaction_date, notes, created_at, updated_at
  - Indexes: dossier_id, last_interaction_date
  - RLS policy: manage_key_contacts_via_dossier

- [X] T009 Create briefs table with indexes, RLS in `supabase/migrations/20250930005_create_briefs_table.sql`
  - Schema: id, dossier_id (FK), content_en (JSONB), content_ar (JSONB), date_range_start, date_range_end, generated_by, generated_at, generated_by_user_id, is_template
  - Indexes: dossier_id, generated_at
  - RLS policies: view_briefs_via_dossier, create_briefs_via_dossier_edit

- [X] T010 Create materialized view dossier_timeline with indexes in `supabase/migrations/20250930006_create_timeline_view.sql`
  - Aggregates: engagements, positions, mous, commitments, documents, intelligence_signals
  - Indexes: timeline_cursor (unique, dossier_id + event_date + event_type + source_id), timeline_dossier, timeline_type

- [X] T011 Seed test data for validation in `supabase/migrations/20250930007_seed_test_data.sql`
  - 3 dossiers (country, organization, theme) with different sensitivity levels
  - 2 owners per dossier
  - 5 key contacts across dossiers
  - 10 timeline events (engagements, positions, commitments)

- [X] T012 Write database unit tests in `backend/tests/unit/database.test.ts`
  - Test RLS policies: clearance levels, hybrid permissions, optimistic locking
  - Test functions: increment_version, can_edit_dossier, get_user_clearance_level
  - Test materialized view: timeline aggregation correctness

---

## Phase 3.2: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [X] T013 [P] Contract test: GET /dossiers (list with filters) in `backend/tests/contract/list-dossiers.test.ts`
  - Test query params: type, status, sensitivity, owner_id, tags, search, cursor, limit
  - Assert response schema: data array, pagination object
  - Assert 200 OK, 400 Bad Request, 401 Unauthorized

- [X] T014 [P] Contract test: POST /dossiers (create) in `backend/tests/contract/create-dossier.test.ts`
  - Test request body: name_en, name_ar, type, sensitivity_level, summary_en, summary_ar, tags
  - Assert response: 201 Created with id, version=1, created_at, updated_at
  - Assert 400 validation errors, 401 Unauthorized, 403 Forbidden

- [X] T015 [P] Contract test: GET /dossiers/:id (detail) in `backend/tests/contract/get-dossier.test.ts`
  - Test include params: stats, owners, contacts, recent_briefs
  - Assert response includes bilingual fields, version, stats object
  - Assert 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

- [X] T016 [P] Contract test: PUT /dossiers/:id (update with version check) in `backend/tests/contract/update-dossier.test.ts`
  - Test request body: version, name_en, name_ar, status, summary_en, summary_ar, tags
  - Assert response: 200 OK with version+1
  - Assert 409 Conflict on version mismatch, 400/401/403/404 errors

- [X] T017 [P] Contract test: DELETE /dossiers/:id (archive) in `backend/tests/contract/archive-dossier.test.ts`
  - Assert 204 No Content on success
  - Assert 401 Unauthorized, 403 Forbidden, 404 Not Found

- [X] T018 [P] Contract test: GET /dossiers/:id/timeline (paginated events) in `backend/tests/contract/get-timeline.test.ts`
  - Test query params: event_type, start_date, end_date, cursor, limit
  - Assert response: data array with bilingual event fields, pagination cursor
  - Assert 200 OK, 401/403/404 errors

- [X] T019 [P] Contract test: POST /dossiers/:id/briefs (generate or fallback) in `backend/tests/contract/generate-brief.test.ts`
  - Test request body: date_range_start, date_range_end, sections
  - Assert response: 201 Created with content_en/content_ar, 202 Processing, 503 with fallback template
  - Assert 400/401/403/404 errors

---

## Phase 3.3: Backend Implementation (Edge Functions)
*ONLY after contract tests are failing*

- [X] T020 Implement Edge Function: list-dossiers in `supabase/functions/dossiers-list/index.ts`
  - Parse query params: type, status, sensitivity, owner_id, tags, search, cursor, limit
  - Build dynamic SQL with filters and full-text search
  - Apply RLS via Supabase client
  - Implement cursor-based pagination
  - Return: { data: Dossier[], pagination: CursorPagination }

- [X] T021 Implement Edge Function: create-dossier in `supabase/functions/dossiers-create/index.ts`
  - Validate request body: required fields, max lengths, enum values
  - Insert dossier with default version=1
  - Auto-assign creator as owner in dossier_owners
  - Return: Dossier with 201 Created

- [X] T022 Implement Edge Function: get-dossier in `supabase/functions/dossiers-get/index.ts`
  - Parse include params: stats, owners, contacts, recent_briefs
  - Fetch dossier with selected includes
  - Calculate stats: counts from timeline, relationship health score
  - Return: Dossier with optional includes

- [X] T023 Implement Edge Function: update-dossier in `supabase/functions/dossiers-update/index.ts`
  - Validate request body: version required, optional fields
  - Check version match (optimistic lock) in RLS policy
  - Update dossier, trigger auto-increments version
  - Return: Dossier with version+1 or 409 Conflict

- [X] T024 Implement Edge Function: archive-dossier in `supabase/functions/dossiers-archive/index.ts`
  - Set archived=true via soft delete
  - Check can_edit_dossier permission via RLS
  - Return: 204 No Content

- [X] T025 Implement Edge Function: get-timeline in `supabase/functions/dossiers-timeline/index.ts`
  - Parse query params: event_type, start_date, end_date, cursor, limit
  - Query materialized view dossier_timeline with filters
  - Implement cursor-based pagination: (event_date, event_type, source_id)
  - Return: { data: TimelineEvent[], pagination: CursorPagination }

- [X] T026 Implement Edge Function: generate-brief in `supabase/functions/dossiers-briefs-generate/index.ts`
  - Fetch dossier data and timeline events in date range
  - Call AnythingLLM API with structured prompt for bilingual brief
  - Set 60s timeout on AI call
  - On success: Insert brief with generated_by='ai', return 201 Created
  - On timeout/error: Return 503 with fallback template and pre-populated data

- [X] T027 Implement brief template generator in `supabase/functions/_shared/brief-template.ts`
  - Define manual brief structure with sections
  - Pre-populate with dossier name, type, recent events
  - Return BriefTemplate with placeholders for user input

---

## Phase 3.4: Frontend Components
*Components can be built in parallel after API contracts defined*

- [X] T028 [P] Implement DossierCard component in `frontend/src/components/DossierCard.tsx`
  - Props: dossier (Dossier type)
  - Display: bilingual name, type badge, sensitivity badge, summary preview (first 100 chars)
  - Actions: Click to navigate to detail
  - Accessibility: ARIA labels, keyboard navigation
  - i18n: Use i18next for labels

- [X] T029 [P] Implement DossierHeader component in `frontend/src/components/DossierHeader.tsx`
  - Props: dossier (Dossier type), onEdit, onArchive, onGenerateBrief
  - Display: bilingual name, type, status, sensitivity, language toggle
  - Actions: Edit, Archive, Generate Brief buttons
  - Accessibility: Button focus indicators, ARIA labels

- [X] T030 [P] Implement DossierTimeline component in `frontend/src/components/DossierTimeline.tsx`
  - Props: dossierId (string)
  - Use useTimelineEvents hook (infinite query)
  - Display: Timeline events sorted by date desc, bilingual titles/descriptions
  - Infinite scroll: useInView hook triggers fetchNextPage
  - Accessibility: Keyboard navigation, ARIA live region for new items

- [X] T031 [P] Implement DossierStats component in `frontend/src/components/DossierStats.tsx`
  - Props: stats (DossierStats type)
  - Display: Engagement count, positions, MoUs, commitments, health score
  - Visual: Progress bars, metric cards
  - i18n: Bilingual labels

- [X] T032 [P] Implement DossierActions component in `frontend/src/components/DossierActions.tsx`
  - Props: dossierId (string)
  - Actions: Add Engagement, Add Position, Log Intelligence, Generate Brief
  - Modals: Open respective forms with dossier pre-selected
  - Accessibility: Focus management, Escape to close

- [X] T033 [P] Implement BriefGenerator component in `frontend/src/components/BriefGenerator.tsx`
  - Props: dossierId (string)
  - State: loading, success, error, fallback mode
  - UI: Loading spinner, progress indicator, 60s countdown
  - On success: Display brief content in both languages
  - On fallback: Show manual template form with pre-populated fields
  - Submit: Save as generated_by='manual'

- [X] T034 [P] Implement ConflictDialog component in `frontend/src/components/ConflictDialog.tsx`
  - Props: currentData, remoteData, onResolve (callback)
  - Display: Side-by-side diff of conflicting fields
  - Actions: "Keep My Changes" (overwrite), "Use Their Changes" (discard), "Cancel" (refresh)
  - Accessibility: Focus trap, Escape to close, ARIA dialog role

- [X] T035 [P] Implement FilterPanel component in `frontend/src/components/FilterPanel.tsx`
  - Props: filters (state), onFilterChange (callback)
  - Facets: Type (multi-select), Status (multi-select), Sensitivity (multi-select), Owner (dropdown), Tags (multi-select)
  - Search: Full-text search input with debounce
  - Reset: Clear all filters button
  - Accessibility: Checkbox groups, ARIA labels

- [X] T036 [P] Implement KeyContactsPanel component in `frontend/src/components/KeyContactsPanel.tsx`
  - Props: dossierId (string)
  - Fetch: key_contacts from dossier detail include
  - Display: List of contacts with name, role, organization, last interaction
  - Actions: Add Contact, Edit Contact, Delete Contact
  - Accessibility: List navigation, ARIA labels

- [X] T037 [P] Write component unit tests in `frontend/tests/unit/components.test.tsx`
  - Test DossierCard: renders bilingual fields, handles click
  - Test DossierTimeline: infinite scroll triggers fetchNextPage
  - Test ConflictDialog: displays diff, resolves correctly
  - Test FilterPanel: applies filters, resets state

---

## Phase 3.5: Route Implementation

- [X] T038 Implement route: /_protected/dossiers (hub page) in `frontend/src/routes/_protected/dossiers/index.tsx`
  - Components: FilterPanel, DossierCard list, infinite scroll
  - Use useDossiers hook with filter state
  - URL state: Sync filters to query params
  - Loading: Skeleton cards while fetching
  - Empty state: "No dossiers found" message
  - Accessibility: Skip to content link, keyboard navigation

- [X] T039 Implement route: /_protected/dossiers/:id (detail page) in `frontend/src/routes/_protected/dossiers/$id.tsx`
  - Components: DossierHeader, DossierStats, DossierTimeline, KeyContactsPanel, DossierActions
  - Tabs: Timeline (default), Positions, MoUs, Commitments, Files, Intelligence
  - Use useDossier hook with includes: stats, owners, contacts
  - Loading: Skeleton layout
  - Error: 404 page if dossier not found
  - Accessibility: Tab navigation, focus management

- [X] T040 Write routing tests in `frontend/tests/unit/routes.test.tsx`
  - Test hub route: filters update URL params
  - Test detail route: loads dossier data, tabs switch correctly
  - Test navigation: hub → detail → back maintains filter state

---

## Phase 3.6: API Hooks (TanStack Query)
*Hooks can be built in parallel*

- [X] T041 [P] Implement useDossiers hook in `frontend/src/hooks/useDossiers.ts`
  - Use useInfiniteQuery with cursor pagination (same pattern as useTimelineEvents)
  - Query key: ['dossiers', filters]
  - Query function: Call GET /dossiers with filters + cursor
  - getNextPageParam: Return next_cursor from pagination response
  - Return: { data, fetchNextPage, hasNextPage, isFetchingNextPage }
  - Cache: staleTime 30s, cacheTime 5min

- [X] T042 [P] Implement useDossier hook in `frontend/src/hooks/useDossier.ts`
  - Query key: ['dossier', id, includes]
  - Query function: Call GET /dossiers/:id with includes
  - Return: { data, isLoading, error }
  - Cache: staleTime 30s

- [X] T043 [P] Implement useCreateDossier mutation in `frontend/src/hooks/useCreateDossier.ts`
  - Mutation function: Call POST /dossiers
  - Optimistic update: Add to cache immediately
  - On success: Invalidate ['dossiers'] query, navigate to detail
  - On error: Rollback, show error toast

- [X] T044 [P] Implement useUpdateDossier mutation in `frontend/src/hooks/useUpdateDossier.ts`
  - Mutation function: Call PUT /dossiers/:id with version
  - Optimistic update: Update cache
  - On 409 Conflict: Show ConflictDialog with remote data
  - On success: Invalidate ['dossier', id], show success toast

- [X] T045 [P] Implement useArchiveDossier mutation in `frontend/src/hooks/useArchiveDossier.ts`
  - Mutation function: Call DELETE /dossiers/:id
  - On success: Invalidate ['dossiers'], navigate to hub, show toast

- [X] T046 [P] Implement useTimelineEvents hook in `frontend/src/hooks/useTimelineEvents.ts`
  - Use useInfiniteQuery with cursor pagination
  - Query key: ['timeline', dossierId, filters]
  - Query function: Call GET /dossiers/:id/timeline
  - getNextPageParam: Return next_cursor from pagination
  - Return: { data, fetchNextPage, hasNextPage, isFetchingNextPage }

- [X] T047 [P] Implement useGenerateBrief mutation in `frontend/src/hooks/useGenerateBrief.ts`
  - Mutation function: Call POST /dossiers/:id/briefs
  - Set timeout: 60s
  - On 201: Return brief, show success
  - On 503: Return fallback template, switch to manual mode
  - On timeout: Show fallback

---

## Phase 3.7: Integration Tests (E2E with Playwright)

- [X] T048 [P] E2E test: Create and view dossier (hub → detail flow) in `frontend/tests/e2e/create-view-dossier.spec.ts`
  - Navigate to /dossiers
  - Click "Create Dossier" button
  - Fill form: name_en, name_ar, type, sensitivity, summary
  - Submit → Assert redirected to detail page
  - Assert: Header shows name, stats loaded, timeline displays

- [X] T049 [P] E2E test: Apply filters and search in `frontend/tests/e2e/filter-search.spec.ts`
  - Navigate to /dossiers
  - Select filter: type=country
  - Assert: List updates, only countries shown
  - Enter search: "Saudi"
  - Assert: Results filtered by search term

- [X] T050 [P] E2E test: Edit dossier with concurrent edit conflict in `frontend/tests/e2e/concurrent-edit.spec.ts`
  - Open dossier in two tabs (different users or same user)
  - Tab 1: Edit summary, save
  - Tab 2: Edit tags (without refreshing), try to save
  - Assert: ConflictDialog appears with diff
  - Click "Use Their Changes" → Assert: Local changes discarded, remote data loaded

- [X] T051 [P] E2E test: Timeline infinite scroll in `frontend/tests/e2e/timeline-scroll.spec.ts`
  - Navigate to dossier detail with 100+ timeline events
  - Assert: First 50 events loaded
  - Scroll to bottom
  - Assert: Next 50 events loaded, no duplicates

- [X] T052 [P] E2E test: Generate brief (AI success path) in `frontend/tests/e2e/generate-brief-success.spec.ts`
  - Navigate to dossier detail
  - Click "Generate Brief" button
  - Assert: Loading indicator appears
  - Wait up to 60s
  - Assert: Brief displayed with content_en and content_ar

- [X] T053 [P] E2E test: Generate brief (fallback path) in `frontend/tests/e2e/generate-brief-fallback.spec.ts`
  - Mock: AnythingLLM service unavailable (503)
  - Navigate to dossier detail
  - Click "Generate Brief"
  - Assert: Fallback template form appears with pre-populated dossier data
  - Fill sections manually
  - Submit → Assert: Brief saved as generated_by='manual'

- [X] T054 [P] E2E test: Permission model (owner, admin, analyst scenarios) in `frontend/tests/e2e/permissions.spec.ts`
  - Test as owner: Can edit own dossier
  - Test as admin: Can edit any dossier
  - Test as analyst: Cannot edit, can only view (if clearance sufficient)
  - Test as analyst (low clearance): Cannot view high sensitivity dossier

---

## Phase 3.8: Accessibility & Performance

- [X] T055 Accessibility audit and fixes (WCAG 2.1 AA) in `frontend/tests/a11y/dossiers-a11y.spec.ts`
  - Run axe DevTools on hub and detail pages
  - Fix violations: color contrast, ARIA labels, keyboard navigation
  - Test screen reader: VoiceOver/NVDA announcements
  - Validate: Focus indicators, tab order, escape key behavior
  - RTL mode: Ensure Arabic layout correct

- [X] T056 Performance optimization (code splitting, lazy loading) in `frontend/src/routes/_protected/dossiers.lazy.tsx`
  - Code split: Lazy load detail page route
  - Lazy load: BriefGenerator component (only when clicked)
  - Lazy load: ConflictDialog (only on conflict)
  - Optimize: Timeline virtual scrolling if >500 events (not required for MVP)
  - Cache: TanStack Query stale-while-revalidate strategy

- [X] T057 Performance validation (< 1.5s target) in `frontend/tests/performance/load-test.ts`
  - Measure: Hub page load time (TTFB, FCP, LCP)
  - Assert: LCP < 1.5s
  - Measure: Detail page with timeline load time
  - Assert: LCP < 1.5s
  - Measure: Database query performance (timeline query < 200ms)
  - Lighthouse: Run audit, score > 90 for Performance, Accessibility

---

## Dependencies

```
Database (T001-T012) → Contract Tests (T013-T019) [P]
                          ↓
                   Backend Functions (T020-T027)
                          ↓
Frontend Components (T028-T037) [P] ← API Hooks (T041-T047) [P]
                          ↓
                   Routes (T038-T040)
                          ↓
                   Integration Tests (T048-T054) [P]
                          ↓
                   Accessibility & Performance (T055-T057)
```

**Blocking Dependencies**:
- T001-T005 must complete before T006-T010 (functions before tables)
- T013-T019 must FAIL before T020-T027 (TDD)
- T020-T027 must complete before T041-T047 (backend before hooks)
- T028-T037 and T041-T047 can run in parallel (components + hooks)
- T038-T040 requires both components and hooks
- T048-T054 requires all implementation complete
- T055-T057 final polish

---

## Parallel Execution Examples

### Database Setup (Sequential - Functions First)
```bash
# T001-T005: Helper functions (can be in same migration)
Task: "Create helper functions in supabase/migrations/20250930001_helper_functions.sql"

# Then tables (can run in parallel after functions exist)
Task: "Create dossiers table in supabase/migrations/20250930002_create_dossiers_table.sql"
Task: "Create dossier_owners table in supabase/migrations/20250930003_create_dossier_owners_table.sql"
Task: "Create key_contacts table in supabase/migrations/20250930004_create_key_contacts_table.sql"
Task: "Create briefs table in supabase/migrations/20250930005_create_briefs_table.sql"
```

### Contract Tests (All Parallel - TDD)
```bash
Task: "Contract test GET /dossiers in backend/tests/contract/list-dossiers.test.ts"
Task: "Contract test POST /dossiers in backend/tests/contract/create-dossier.test.ts"
Task: "Contract test GET /dossiers/:id in backend/tests/contract/get-dossier.test.ts"
Task: "Contract test PUT /dossiers/:id in backend/tests/contract/update-dossier.test.ts"
Task: "Contract test DELETE /dossiers/:id in backend/tests/contract/archive-dossier.test.ts"
Task: "Contract test GET /dossiers/:id/timeline in backend/tests/contract/get-timeline.test.ts"
Task: "Contract test POST /dossiers/:id/briefs in backend/tests/contract/generate-brief.test.ts"
```

### Frontend Components (All Parallel)
```bash
Task: "Implement DossierCard component in frontend/src/components/DossierCard.tsx"
Task: "Implement DossierHeader component in frontend/src/components/DossierHeader.tsx"
Task: "Implement DossierTimeline component in frontend/src/components/DossierTimeline.tsx"
Task: "Implement DossierStats component in frontend/src/components/DossierStats.tsx"
Task: "Implement DossierActions component in frontend/src/components/DossierActions.tsx"
Task: "Implement BriefGenerator component in frontend/src/components/BriefGenerator.tsx"
Task: "Implement ConflictDialog component in frontend/src/components/ConflictDialog.tsx"
Task: "Implement FilterPanel component in frontend/src/components/FilterPanel.tsx"
Task: "Implement KeyContactsPanel component in frontend/src/components/KeyContactsPanel.tsx"
```

### API Hooks (All Parallel)
```bash
Task: "Implement useDossiers hook in frontend/src/hooks/useDossiers.ts"
Task: "Implement useDossier hook in frontend/src/hooks/useDossier.ts"
Task: "Implement useCreateDossier mutation in frontend/src/hooks/useCreateDossier.ts"
Task: "Implement useUpdateDossier mutation in frontend/src/hooks/useUpdateDossier.ts"
Task: "Implement useArchiveDossier mutation in frontend/src/hooks/useArchiveDossier.ts"
Task: "Implement useTimelineEvents hook in frontend/src/hooks/useTimelineEvents.ts"
Task: "Implement useGenerateBrief mutation in frontend/src/hooks/useGenerateBrief.ts"
```

### E2E Tests (All Parallel)
```bash
Task: "E2E test create and view dossier in frontend/tests/e2e/create-view-dossier.spec.ts"
Task: "E2E test filter and search in frontend/tests/e2e/filter-search.spec.ts"
Task: "E2E test concurrent edit conflict in frontend/tests/e2e/concurrent-edit.spec.ts"
Task: "E2E test timeline infinite scroll in frontend/tests/e2e/timeline-scroll.spec.ts"
Task: "E2E test generate brief success in frontend/tests/e2e/generate-brief-success.spec.ts"
Task: "E2E test generate brief fallback in frontend/tests/e2e/generate-brief-fallback.spec.ts"
Task: "E2E test permission model in frontend/tests/e2e/permissions.spec.ts"
```

---

## Notes

- **[P] tasks** = different files, no dependencies, safe to parallelize
- **Verify tests fail** before implementing (TDD principle)
- **Commit after each task** for clear history
- **Avoid**: vague tasks, same file conflicts in parallel tasks
- **Performance target**: Hub and detail pages must load in < 1.5s
- **AI timeout**: Brief generation must timeout at 60s with graceful fallback
- **Bilingual**: All user-facing text in both EN and AR
- **Accessibility**: WCAG 2.1 AA compliance required

---

## Validation Checklist
*GATE: Must validate before marking feature complete*

- [x] All contracts have corresponding tests (T013-T019)
- [x] All entities have migrations (T006-T009)
- [x] All endpoints implemented (T020-T026)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Constitutional compliance: Bilingual ✅, Type-safe ✅, RLS ✅, Accessible ✅, Resilient ✅

---

## Summary

**Total Tasks**: 57 tasks
**Estimated Duration**: 8-10 working days (assuming parallelization)
**Critical Path**: Database → Contract Tests → Backend → Frontend → Integration
**Parallelization Potential**: ~35 tasks can run in parallel across 5 phases
**Performance Requirement**: < 1.5s page loads (validated in T057)
**Constitutional Compliance**: All principles adhered to (bilingual, type-safe, RLS, accessible, resilient, data sovereignty)

**Next Step**: Execute tasks sequentially or in parallel following dependency chain. Use `/tasks` validation command to verify progress.