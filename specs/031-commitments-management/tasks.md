# Tasks: Commitments Management v1.1

**Input**: Design documents from `/specs/031-commitments-management/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/commitments.openapi.yaml, research.md, quickstart.md

**Tests**: Not explicitly requested in specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- **Supabase**: `supabase/migrations/`, `supabase/functions/`
- **Translations**: `frontend/public/locales/{en,ar}/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema evolution and UI component installation

- [x] T001 Apply migration to add new columns to commitments table in supabase/migrations/YYYYMMDDHHMMSS_add_commitment_v11_columns.sql
- [x] T002 Apply migration to create commitment_status_history table in supabase/migrations/YYYYMMDDHHMMSS_create_commitment_status_history.sql
- [x] T003 Apply migration to create commitment-evidence storage bucket in supabase/migrations/YYYYMMDDHHMMSS_create_commitment_evidence_bucket.sql
- [x] T004 [P] Install Aceternity Timeline component via `npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes`
- [x] T005 [P] Regenerate TypeScript types with `npx supabase gen types typescript --project-id zkrcjzdemdmwhearhfgg > frontend/src/types/database.types.ts`
- [x] T006 [P] Add commitment v1.1 translations to frontend/public/locales/en/commitments.json
- [x] T007 [P] Add commitment v1.1 translations to frontend/public/locales/ar/commitments.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Update Commitment TypeScript interface in frontend/src/types/commitment.types.ts with new fields (title, proof_url, proof_required, evidence_submitted_at, status_changed_at, created_by, updated_by)
- [x] T009 [P] Add CommitmentStatusHistory TypeScript interface in frontend/src/types/commitment.types.ts
- [x] T010 [P] Add CommitmentFilters TypeScript interface in frontend/src/types/commitment.types.ts
- [x] T011 [P] Add CreateCommitmentInput and UpdateCommitmentInput types in frontend/src/types/commitment.types.ts
- [x] T012 Update commitments.service.ts to include getCommitments with cursor-based pagination in frontend/src/services/commitments.service.ts
- [x] T013 [P] Add createCommitment function to frontend/src/services/commitments.service.ts
- [x] T014 [P] Add updateCommitment function to frontend/src/services/commitments.service.ts
- [x] T015 [P] Add updateCommitmentStatus function to frontend/src/services/commitments.service.ts
- [x] T016 [P] Add cancelCommitment function to frontend/src/services/commitments.service.ts
- [x] T017 [P] Add getCommitmentStatusHistory function to frontend/src/services/commitments.service.ts
- [x] T018 Update useCommitments hook with query key factory pattern in frontend/src/hooks/useCommitments.ts
- [x] T019 Add useCreateCommitment mutation hook in frontend/src/hooks/useCommitments.ts
- [x] T020 Add useUpdateCommitment mutation hook in frontend/src/hooks/useCommitments.ts
- [x] T021 Add useUpdateCommitmentStatus mutation hook with optimistic updates in frontend/src/hooks/useCommitments.ts
- [x] T022 Add useCancelCommitment mutation hook in frontend/src/hooks/useCommitments.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Manage Commitments (Priority: P1)

**Goal**: Enable users to create, edit, and track commitments for assigned dossiers with full CRUD operations.

**Independent Test**: Create a commitment from the dossier page, edit its details, verify changes persist.

### Implementation for User Story 1

- [x] T023 [P] [US1] Create CommitmentCard component with status badge, priority indicator, and overdue styling in frontend/src/components/commitments/CommitmentCard.tsx
- [x] T024 [P] [US1] Create CommitmentForm component with mobile-first RTL-compatible layout in frontend/src/components/commitments/CommitmentForm.tsx
- [x] T025 [US1] Update CommitmentsList component to render CommitmentCard components in frontend/src/components/commitments/CommitmentsList.tsx
- [x] T026 [US1] Integrate create commitment flow with CommitmentForm in CommitmentsList in frontend/src/components/commitments/CommitmentsList.tsx
- [x] T027 [US1] Add edit mode to CommitmentForm with pre-populated values in frontend/src/components/commitments/CommitmentForm.tsx
- [x] T028 [US1] Add cancel/delete functionality with confirmation dialog in frontend/src/components/commitments/CommitmentCard.tsx
- [x] T029 [US1] Add validation schemas using zod in frontend/src/components/commitments/CommitmentForm.tsx
- [x] T030 [US1] Update commitments route to handle dossier context in frontend/src/routes/_protected/commitments.tsx

**Checkpoint**: User Story 1 complete - users can create, edit, and cancel commitments

---

## Phase 4: User Story 2 - Quick Status Updates (Priority: P1)

**Goal**: Enable commitment owners to quickly update status from list view with 2 taps or fewer.

**Independent Test**: View commitments list, tap status badge, select new status, verify optimistic update.

### Implementation for User Story 2

- [x] T031 [P] [US2] Create StatusDropdown component with mobile-first dropdown menu in frontend/src/components/commitments/StatusDropdown.tsx
- [x] T032 [US2] Integrate StatusDropdown into CommitmentCard with inline update in frontend/src/components/commitments/CommitmentCard.tsx
- [x] T033 [US2] Implement optimistic update logic in useUpdateCommitmentStatus hook in frontend/src/hooks/useCommitments.ts
- [x] T034 [US2] Add status transition validation (block completed->pending for non-admin; hide 'overdue' from dropdown as it's auto-applied) in frontend/src/components/commitments/StatusDropdown.tsx
- [x] T035 [US2] Add success/error toast notifications for status updates in frontend/src/components/commitments/StatusDropdown.tsx
- [x] T036 [US2] Ensure RTL layout for Arabic language in StatusDropdown in frontend/src/components/commitments/StatusDropdown.tsx

**Checkpoint**: User Story 2 complete - users can update status with 2 taps from list view

---

## Phase 5: User Story 3 - Filter and Search Commitments (Priority: P2)

**Goal**: Enable filtering by status, priority, owner type, and overdue status with URL synchronization.

**Independent Test**: Open filter panel, select filters, verify URL updates and filters persist on refresh.

### Implementation for User Story 3

- [x] T037 [P] [US3] Create CommitmentFilterDrawer component with bottom sheet on mobile, side panel on desktop in frontend/src/components/commitments/CommitmentFilterDrawer.tsx
- [x] T038 [P] [US3] Create FilterChips component for displaying active filters above list in frontend/src/components/commitments/FilterChips.tsx
- [x] T039 [US3] Define TanStack Router search params schema for filters in frontend/src/routes/_protected/commitments.tsx
- [x] T040 [US3] Integrate filter state with URL query parameters in frontend/src/routes/_protected/commitments.tsx
- [x] T041 [US3] Update useCommitments hook to accept filter parameters in frontend/src/hooks/useCommitments.ts
- [x] T042 [US3] Add overdue filter toggle in CommitmentFilterDrawer in frontend/src/components/commitments/CommitmentFilterDrawer.tsx
- [x] T042a [US3] Add date range picker (from/to) for due date filtering in frontend/src/components/commitments/CommitmentFilterDrawer.tsx
- [x] T043 [US3] Integrate FilterChips into CommitmentsList with remove individual filter capability in frontend/src/components/commitments/CommitmentsList.tsx
- [x] T044 [US3] Add empty state when no results match filters in frontend/src/components/commitments/CommitmentsList.tsx

**Checkpoint**: User Story 3 complete - users can filter commitments with URL sync

---

## Phase 6: User Story 4 - Evidence Upload for Proof (Priority: P2)

**Goal**: Enable evidence file uploads (PDF, JPG, PNG, DOCX) up to 10MB for commitments requiring proof.

**Independent Test**: Open commitment with proof_required=true, upload file, verify file accessible in detail view.

### Implementation for User Story 4

- [x] T045 [P] [US4] Create commitment-upload-evidence Edge Function in supabase/functions/commitment-upload-evidence/index.ts
- [x] T046 [P] [US4] Create commitment-get-evidence-url Edge Function in supabase/functions/commitment-get-evidence-url/index.ts
- [x] T047 [P] [US4] Add uploadEvidence service function in frontend/src/services/commitments.service.ts
- [x] T048 [P] [US4] Add getEvidenceUrl service function in frontend/src/services/commitments.service.ts
- [x] T049 [US4] Create EvidenceUpload component using Aceternity file-upload in frontend/src/components/commitments/EvidenceUpload.tsx
- [x] T050 [US4] Add file type and size validation (10MB max, PDF/JPG/PNG/DOCX) in frontend/src/components/commitments/EvidenceUpload.tsx
- [x] T051 [US4] Add upload progress indicator in EvidenceUpload in frontend/src/components/commitments/EvidenceUpload.tsx
- [x] T052 [US4] Add camera capture option for mobile devices in EvidenceUpload in frontend/src/components/commitments/EvidenceUpload.tsx
- [x] T053 [US4] Display evidence download link and submission timestamp in CommitmentCard in frontend/src/components/commitments/CommitmentCard.tsx
- [x] T054 [US4] Add useUploadEvidence mutation hook in frontend/src/hooks/useCommitments.ts

**Checkpoint**: User Story 4 complete - users can upload and download evidence files

---

## Phase 7: User Story 5 - View Commitment Details (Priority: P3)

**Goal**: Enable viewing full commitment details including status history timeline in a detail drawer.

**Independent Test**: Tap commitment card, verify drawer shows full details with status change history.

### Implementation for User Story 5

- [x] T055 [P] [US5] Create CommitmentDetailDrawer component using shadcn Sheet in frontend/src/components/commitments/CommitmentDetailDrawer.tsx
- [x] T056 [P] [US5] Create StatusTimeline component using Aceternity Timeline in frontend/src/components/commitments/StatusTimeline.tsx
- [x] T057 [US5] Add useCommitmentStatusHistory query hook in frontend/src/hooks/useCommitments.ts
- [x] T058 [US5] Integrate StatusTimeline into CommitmentDetailDrawer in frontend/src/components/commitments/CommitmentDetailDrawer.tsx
- [x] T059 [US5] Add dossier link navigation in CommitmentDetailDrawer in frontend/src/components/commitments/CommitmentDetailDrawer.tsx
- [x] T060 [US5] Add edit mode toggle in CommitmentDetailDrawer that switches to CommitmentForm in frontend/src/components/commitments/CommitmentDetailDrawer.tsx
- [x] T061 [US5] Integrate CommitmentDetailDrawer into CommitmentsList on card tap in frontend/src/components/commitments/CommitmentsList.tsx

**Checkpoint**: User Story 5 complete - users can view full commitment details with history

---

## Phase 8: User Story 6 - Infinite Scroll Pagination (Priority: P3)

**Goal**: Implement cursor-based infinite scroll loading 20 items at a time.

**Independent Test**: Have 25+ commitments, scroll to bottom, verify more items load automatically.

### Implementation for User Story 6

- [x] T062 [US6] Update getCommitments service to support cursor-based pagination in frontend/src/services/commitments.service.ts
- [x] T063 [US6] Update useCommitments hook to use TanStack Query useInfiniteQuery in frontend/src/hooks/useCommitments.ts
- [x] T064 [US6] Add scroll detection and fetchNextPage trigger in CommitmentsList in frontend/src/components/commitments/CommitmentsList.tsx
- [x] T065 [US6] Add loading indicator at bottom of list during fetch in frontend/src/components/commitments/CommitmentsList.tsx
- [x] T066 [US6] Add "End of list" indicator when all items loaded in frontend/src/components/commitments/CommitmentsList.tsx

**Checkpoint**: User Story 6 complete - infinite scroll pagination works for large lists

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T067 [P] Ensure all components meet 44x44px minimum touch targets for mobile
- [x] T068 [P] Verify RTL layout for all components with Arabic language
- [x] T069 [P] Add overdue visual indicators (red border, badge with days count) to CommitmentCard in frontend/src/components/commitments/CommitmentCard.tsx
- [x] T070 Fix PersonalCommitmentsDashboard to use correct `commitments` table (previously using wrong table) in frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx
- [x] T071 Verify health score calculations still work after schema changes (FR-023)
- [x] T072 Run quickstart.md validation to verify all setup steps work
- [x] T073 Validate performance with 1,000 commitments: list rendering <500ms, infinite scroll <500ms per page (SC-005, SC-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Can Start After | Dependencies on Other Stories |
|-------|-----------------|-------------------------------|
| US1 (P1) | Phase 2 complete | None - core CRUD |
| US2 (P1) | Phase 2 complete | Uses CommitmentCard from US1 |
| US3 (P2) | Phase 2 complete | Uses CommitmentsList from US1 |
| US4 (P2) | Phase 2 complete | Uses CommitmentCard from US1 |
| US5 (P3) | Phase 2 complete | Uses CommitmentForm from US1 |
| US6 (P3) | Phase 2 complete | Uses CommitmentsList from US1 |

**Note**: US1 should be completed first as other stories build on its components.

### Within Each User Story

- Components before integration
- Service functions before hooks
- Hooks before UI integration
- Core implementation before edge cases

### Parallel Opportunities

**Phase 1 (Setup)**:
- T004-T007 can run in parallel after migrations complete

**Phase 2 (Foundational)**:
- T009-T011 types can run in parallel
- T013-T017 service functions can run in parallel
- T019-T022 mutation hooks can run in parallel

**User Stories**:
- Components marked [P] within each story can run in parallel
- Different user stories can be worked on by different team members after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch these components in parallel:
Task T023: "Create CommitmentCard component"
Task T024: "Create CommitmentForm component"

# Then sequentially:
Task T025: "Update CommitmentsList to render CommitmentCard"
Task T026: "Integrate create commitment flow"
Task T027: "Add edit mode to CommitmentForm"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (migrations, types, translations)
2. Complete Phase 2: Foundational (services, hooks)
3. Complete Phase 3: User Story 1 (CRUD operations)
4. Complete Phase 4: User Story 2 (Quick status updates)
5. **STOP and VALIDATE**: Test creating/editing/status updates
6. Deploy/demo if ready

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US2 | Core CRUD + status updates |
| +Filtering | US3 | Filter and search |
| +Evidence | US4 | Proof uploads |
| +Details | US5 | Full detail view |
| +Pagination | US6 | Scale for large lists |

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 74 |
| Phase 1 (Setup) | 7 |
| Phase 2 (Foundational) | 15 |
| Phase 3 (US1 - CRUD) | 8 |
| Phase 4 (US2 - Status) | 6 |
| Phase 5 (US3 - Filters) | 9 |
| Phase 6 (US4 - Evidence) | 10 |
| Phase 7 (US5 - Details) | 7 |
| Phase 8 (US6 - Pagination) | 5 |
| Phase 9 (Polish) | 7 |
| Parallel Tasks [P] | 31 |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Mobile-first and RTL support required for all UI components
- Optimistic updates required for status changes (FR-008)
- All touch targets must be 44x44px minimum (FR-018)
- Commit after each task or logical group
