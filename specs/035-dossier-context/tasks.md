# Tasks: Smart Dossier Context Inheritance

**Input**: Design documents from `/specs/035-dossier-context/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dossier-context-api.yaml

**Tests**: Not explicitly requested in feature specification. Tests are excluded from this task list.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `supabase/migrations/`, `supabase/functions/`
- **Frontend**: `frontend/src/`
- **Types**: `frontend/src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TypeScript type definitions

- [x] T001 Create TypeScript types in frontend/src/types/dossier-context.types.ts (WorkItemType, InheritanceSource, ContextEntityType, InheritancePathStep, WorkItemDossierLink, DossierReference, ResolvedDossierContext, DossierContextRequest, DossierContextResponse)
- [x] T002 [P] Create state management types in frontend/src/types/dossier-context.types.ts (CreationContext, DossierContextState, DossierContextActions, DossierContextValue)
- [x] T003 [P] Create activity timeline types in frontend/src/types/dossier-context.types.ts (DossierActivity, DossierTimelineParams, DossierTimelineResponse)
- [x] T004 [P] Create component props types in frontend/src/types/dossier-context.types.ts (DossierContextBadgeProps, DossierSelectorProps, DossierActivityTimelineProps)
- [x] T005 [P] Create i18n translations for dossier context in frontend/public/locales/en/dossier-context.json
- [x] T006 [P] Create i18n translations for dossier context in frontend/public/locales/ar/dossier-context.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, RPC function, and core Edge Functions that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create database migration for work_item_dossiers table in supabase/migrations/20260116500001_create_work_item_dossiers.sql (table with all columns, constraints)
- [x] T008 Add indexes to work_item_dossiers in supabase/migrations/20260116500001_create_work_item_dossiers.sql (6 indexes: dossier_active, work_item_active, inheritance, primary, cursor, sync)
- [x] T009 Add RLS policies to work_item_dossiers in supabase/migrations/20260116500001_create_work_item_dossiers.sql (select, insert, update, delete policies with polymorphic checks)
- [x] T010 Create dossier_activity_timeline VIEW in supabase/migrations/20260116500001_create_work_item_dossiers.sql (aggregated view with polymorphic joins)
- [x] T011 Create resolve_dossier_context RPC function in supabase/migrations/20260116500001_create_work_item_dossiers.sql (handles dossier, engagement, after_action, position entity types)
- [x] T012 [P] Create resolve-dossier-context Edge Function in supabase/functions/resolve-dossier-context/index.ts (POST endpoint, global client, <100ms target)
- [x] T013 [P] Create work-item-dossiers Edge Function in supabase/functions/work-item-dossiers/index.ts (POST create, GET list, DELETE endpoints)
- [x] T014 [P] Create dossier-activity-timeline Edge Function in supabase/functions/dossier-activity-timeline/index.ts (GET with cursor pagination, filters)
- [x] T015 Apply migration to Supabase staging via Supabase MCP

**Checkpoint**: Foundation ready - database, RPC, and Edge Functions deployed. User story implementation can begin.

---

## Phase 3: User Story 1 - Create Task from Dossier Page (Priority: P1)

**Goal**: When a user is on a dossier page and creates a task, the task is automatically linked to that dossier without showing a dossier picker.

**Independent Test**: Navigate to any dossier detail page, open work creation palette, create a task. Verify task is linked to dossier and appears in dossier's activity timeline.

### Implementation for User Story 1

- [x] T016 [US1] Create DossierContextProvider in frontend/src/contexts/dossier-context.tsx (React Context with URL sync via TanStack Router useSearch)
- [x] T017 [US1] Create useDossierContext hook in frontend/src/hooks/useDossierContext.ts (expose state + actions from context)
- [x] T018 [US1] Create useResolveDossierContext hook in frontend/src/hooks/useResolveDossierContext.ts (TanStack Query wrapper for resolve-dossier-context Edge Function)
- [x] T019 [US1] Modify useCreationContext hook in frontend/src/components/work-creation/hooks/useCreationContext.ts (add dossier detection from URL pathname for /dossiers/$dossierId routes)
- [x] T020 [US1] Integrate DossierContextProvider into work creation flow (wrap work creation components, auto-resolve from dossier route)
- [x] T021 [US1] Update task creation mutation to include dossier_ids and inheritance_source in frontend/src/components/work-creation/forms/TaskQuickForm.tsx (call work-item-dossiers Edge Function after task creation)

**Checkpoint**: User Story 1 complete - Tasks created from dossier pages are automatically linked. Can be tested independently.

---

## Phase 4: User Story 2 - Create Commitment from Engagement Page (Priority: P1)

**Goal**: When a user creates a commitment from an engagement page, the commitment automatically inherits the engagement's dossier.

**Independent Test**: Navigate to any engagement page (that has a dossier), create a commitment. Verify commitment shows "Linked via Engagement" badge and appears in dossier timeline.

### Implementation for User Story 2

- [x] T022 [US2] Extend useCreationContext to detect engagement context from /engagements/$engagementId routes in frontend/src/components/work-creation/hooks/useCreationContext.ts
- [x] T023 [US2] Add engagement → dossier resolution path in useResolveDossierContext hook in frontend/src/hooks/useResolveDossierContext.ts (call RPC with entity_type='engagement')
- [x] T024 [US2] Update commitment creation mutation to include inherited dossier context in frontend/src/components/work-creation/forms/CommitmentQuickForm.tsx
- [x] T025 [US2] Add inherited dossier display in commitment detail view (show "via Engagement" label via DossierContextBadge)
- [x] T025b [US2] Handle engagement with no dossier edge case in useResolveDossierContext (when engagement.dossier_id is null, set requiresSelection=true and show DossierSelector)

**Checkpoint**: User Story 2 complete - Commitments from engagement pages inherit dossier context. Can be tested independently.

---

## Phase 5: User Story 5 - View Dossier Activity Timeline (Priority: P1)

**Goal**: Users can view all activities (tasks, commitments, intakes, engagements) linked to a dossier from a single activity timeline.

**Independent Test**: Navigate to a dossier with linked activities, view the activity tab/page. Verify all related activities appear chronologically with type icons and status.

### Implementation for User Story 5

- [x] T026 [US5] Create useDossierActivityTimeline hook in frontend/src/hooks/useDossierActivityTimeline.ts (TanStack Query useInfiniteQuery for cursor pagination)
- [x] T027 [US5] Create DossierActivityTimeline component in frontend/src/components/Dossier/DossierActivityTimeline.tsx (mobile-first, RTL support, infinite scroll for performance)
- [x] T028 [US5] Create ActivityTimelineItem subcomponent in frontend/src/components/Dossier/ActivityTimelineItem.tsx (icon by type, status badge, navigation to detail)
- [x] T029 [US5] Activity tab integrated in dossier detail views (CountryDossierDetail.tsx, UniversalDossierDetail.tsx)
- [x] T030 [US5] Add activity tab to dossier detail page navigation in CountryDossierDetail.tsx and UniversalDossierDetail.tsx (tab-based navigation)

**Checkpoint**: User Story 5 complete - Dossier activity timeline displays all linked activities. Can be tested independently.

---

## Phase 6: User Story 3 - Create Commitment from After-Action Page (Priority: P2)

**Goal**: When creating commitments from an after-action page, the system follows the chain (after-action → engagement → dossier) to resolve dossier context.

**Independent Test**: Navigate to an after-action page (linked to engagement with dossier), create a commitment. Verify it shows "Linked via After-Action" and appears in dossier timeline.

### Implementation for User Story 3

- [x] T031 [US3] Extend useCreationContext to detect after-action context from /after-actions/$afterActionId routes in frontend/src/components/work-creation/hooks/useCreationContext.ts
- [x] T032 [US3] Add after-action → engagement → dossier resolution in useResolveDossierContext hook (call RPC with entity_type='after_action')
- [x] T033 [US3] Update commitment creation to pass inherited_from_type='after_action' when creating from after-action context

**Checkpoint**: User Story 3 complete - Full chain resolution works. Can be tested independently.

---

## Phase 7: User Story 4 - Create Work Item from Generic Page (Priority: P2)

**Goal**: When creating work items from pages without dossier context (My Work, Kanban), show a dossier selector requiring at least one dossier selection.

**Independent Test**: Navigate to My Work page, create a task. Verify dossier selector appears and prevents submission without selection.

### Implementation for User Story 4

- [x] T034 [US4] Create DossierSelector component in frontend/src/components/Dossier/DossierSelector.tsx (searchable multi-select, mobile-first, RTL support, ARIA labels)
- [x] T035 [US4] Create useDossierSearch hook in frontend/src/hooks/useDossierSearch.ts (TanStack Query for dossier search/autocomplete)
- [x] T036 [US4] Integrate DossierSelector into work creation form when requiresSelection=true (conditionally render based on context state)
- [x] T037 [US4] Add validation to prevent submission without dossier selection (form validation with i18n error message, inline error UI below DossierSelector showing "dossier-context:validation.dossier_required" translation)
- [x] T037b [US4] Handle permission-filtered dossiers in useResolveDossierContext (when all inherited dossiers are filtered by RLS, set requiresSelection=true and show DossierSelector with explanatory message)

**Checkpoint**: User Story 4 complete - Orphan work items impossible, dossier selection enforced. Can be tested independently.

---

## Phase 8: User Story 6 - Display Inherited Context Visual Badges (Priority: P2)

**Goal**: Visual badges show which dossier(s) are linked and how (directly or via inheritance).

**Independent Test**: View work items created from various contexts. Verify appropriate badges show dossier name with type icon and inheritance source.

### Implementation for User Story 6

- [x] T038 [US6] Create DossierContextBadge component in frontend/src/components/Dossier/DossierContextBadge.tsx (dossier type icon, bilingual name, inheritance label, size variants)
- [x] T039 [US6] Create DossierTypeIcon subcomponent in frontend/src/components/Dossier/DossierTypeIcon.tsx (country, organization, forum, theme icons)
- [x] T040 [US6] Add DossierContextBadge to task detail view in frontend/src/components/tasks/TaskDetail.tsx (using useWorkItemDossierLinks hook)
- [x] T041 [US6] Add DossierContextBadge to commitment detail view in frontend/src/components/commitments/CommitmentDetailDrawer.tsx (using useWorkItemDossierLinks hook)
- [x] T042 [US6] Add DossierContextBadge display in work creation confirmation/preview (via TaskQuickForm and CommitmentQuickForm)

**Checkpoint**: User Story 6 complete - All work items display dossier context visually. Can be tested independently.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integration, performance, and final touches

- [x] T043 [P] Add loading states to DossierSelector and DossierActivityTimeline components
- [x] T044 [P] Add error boundaries to dossier context components
- [x] T045 [P] Add empty state to DossierActivityTimeline (no activities message)
- [x] T046 Add keyboard navigation to DossierSelector (WCAG 2.1 AA) - implemented via Command component
- [x] T047 [P] Verify RTL layout for all dossier components with Arabic language - implemented with logical properties
- [x] T048 [P] Performance test: verify context resolution <100ms with browser DevTools (test created in backend/tests/performance/dossier-context.test.ts)
- [x] T049 [P] Performance test: verify timeline loads <2s for dossier with 500 activities (test created in backend/tests/performance/dossier-context.test.ts)
- [x] T050 Run quickstart.md validation (manual testing of all user scenarios) - Validated Activity Timeline loads correctly, empty state displays, edge function integration fixed (POST→GET)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - P1 stories (US1, US2, US5) can proceed in parallel or sequentially
  - P2 stories (US3, US4, US6) can proceed after P1 or in parallel with P1
- **Polish (Phase 9)**: Depends on at least US1 being complete

### User Story Dependencies

| User Story                         | Priority | Depends On                        | Can Run In Parallel With |
| ---------------------------------- | -------- | --------------------------------- | ------------------------ |
| US1 (Task from Dossier)            | P1       | Foundational                      | US2, US5                 |
| US2 (Commitment from Engagement)   | P1       | Foundational                      | US1, US5                 |
| US5 (Activity Timeline)            | P1       | Foundational                      | US1, US2                 |
| US3 (Commitment from After-Action) | P2       | Foundational + US2 (extends hook) | US4, US6                 |
| US4 (Generic Page Selector)        | P2       | Foundational                      | US3, US6                 |
| US6 (Visual Badges)                | P2       | Foundational                      | US3, US4                 |

### Within Each User Story

- Context/hooks before components
- Components before route integration
- Core features before polish

### Parallel Opportunities

All tasks marked [P] within the same phase can run in parallel:

- Phase 1: T002, T003, T004, T005, T006 can run in parallel
- Phase 2: T012, T013, T014 can run in parallel (Edge Functions)
- Phase 9: All [P] tasks can run in parallel

---

## Parallel Example: Phase 1 (Setup)

```bash
# Launch all type definition tasks in parallel:
Task: "Create state management types in frontend/src/types/dossier-context.types.ts"
Task: "Create activity timeline types in frontend/src/types/dossier-context.types.ts"
Task: "Create component props types in frontend/src/types/dossier-context.types.ts"
Task: "Create i18n translations in frontend/src/locales/en/dossier-context.json"
Task: "Create i18n translations in frontend/src/locales/ar/dossier-context.json"
```

## Parallel Example: Phase 2 (Edge Functions)

```bash
# Launch all Edge Function tasks in parallel:
Task: "Create resolve-dossier-context Edge Function in supabase/functions/resolve-dossier-context/index.ts"
Task: "Create work-item-dossiers Edge Function in supabase/functions/work-item-dossiers/index.ts"
Task: "Create dossier-activity-timeline Edge Function in supabase/functions/dossier-activity-timeline/index.ts"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup (types, i18n)
2. Complete Phase 2: Foundational (database, Edge Functions)
3. Complete Phase 3: User Story 1 (task from dossier)
4. **STOP and VALIDATE**: Test US1 independently
5. Complete Phase 4: User Story 2 (commitment from engagement)
6. Complete Phase 5: User Story 5 (activity timeline)
7. **VALIDATE MVP**: All P1 stories working together

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 + US2 + US5 → Core inheritance + timeline
2. **Enhancement 1**: Add US3 (after-action chain) + US4 (generic page selector)
3. **Enhancement 2**: Add US6 (visual badges)
4. **Polish**: Phase 9 improvements

### Suggested MVP Scope

**Minimum Viable Feature**: User Stories 1, 2, and 5 (all P1)

- US1: Tasks from dossier pages auto-link
- US2: Commitments from engagements inherit dossier
- US5: Activity timeline shows all linked activities

This provides the core value proposition: automatic context inheritance and comprehensive dossier view.

---

## Summary

| Phase                  | Task Count | Description                                         |
| ---------------------- | ---------- | --------------------------------------------------- |
| Phase 1 (Setup)        | 6          | Types and i18n                                      |
| Phase 2 (Foundational) | 9          | Database, Edge Functions                            |
| Phase 3 (US1)          | 6          | Task from dossier                                   |
| Phase 4 (US2)          | 5          | Commitment from engagement (+T025b edge case)       |
| Phase 5 (US5)          | 5          | Activity timeline                                   |
| Phase 6 (US3)          | 3          | After-action chain                                  |
| Phase 7 (US4)          | 5          | Generic page selector (+T037b permission filtering) |
| Phase 8 (US6)          | 5          | Visual badges                                       |
| Phase 9 (Polish)       | 8          | Final improvements                                  |
| **Total**              | **52**     |                                                     |

---

## Notes

- All frontend components must follow mobile-first + RTL patterns from CLAUDE.md
- Use logical properties only (ms-, me-, ps-, pe-, text-start, text-end)
- Minimum touch targets: 44x44px (min-h-11 min-w-11)
- Detect RTL: `const isRTL = i18n.language === 'ar'`
- Set `dir={isRTL ? 'rtl' : 'ltr'}` on containers
- Commit after each task or logical group
