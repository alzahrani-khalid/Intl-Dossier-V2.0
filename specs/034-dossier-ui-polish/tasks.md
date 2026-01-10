# Tasks: Dossier UI Polish - Mobile, RTL & Accessibility

**Input**: Design documents from `/specs/034-dossier-ui-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/test-scenarios.yaml
**Branch**: `034-dossier-ui-polish`

**Tests**: This feature focuses on creating automated tests for CI/CD. Test tasks are included per the specification requirements.

**Organization**: Tasks are grouped by user story (US1-US5) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` for source, `frontend/tests/` for tests
- **Components**: `frontend/src/components/Dossier/`
- **Hooks**: `frontend/src/hooks/`
- **Tests**: `frontend/tests/e2e/`, `frontend/tests/a11y/`, `frontend/tests/performance/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test infrastructure and verification of existing patterns

- [x] T001 Verify Playwright configuration supports mobile viewports in `frontend/playwright.config.ts`
- [x] T002 [P] Verify @axe-core/playwright is properly configured in `frontend/package.json`
- [x] T003 [P] Create test fixture file for dossier test data in `frontend/tests/fixtures/dossier-fixtures.ts`
- [x] T004 [P] Verify i18next Arabic translations exist in `frontend/src/locales/ar/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core RTL fixes that MUST be complete before user story testing

**⚠️ CRITICAL**: These 3 RTL fixes identified in research.md must be completed first

- [x] T005 Fix `right-2` to `end-2` in `frontend/src/components/Dossier/CountryMapImage.tsx:119`
- [x] T006 [P] Simplify conditional RTL positioning in `frontend/src/components/Dossier/CountryDossierDetail.tsx:109`
- [x] T007 [P] Replace conditional margin with `me-2` in `frontend/src/components/Dossier/sections/IntelligenceSection.tsx:48`
- [x] T008 Audit and fix any remaining physical properties (left/right/ml/mr/pl/pr) across all 48 dossier components

**Checkpoint**: Foundation ready - RTL CSS issues resolved, user story testing can begin

---

## Phase 3: User Story 1 - Arabic RTL Support (Priority: P1) 🎯 MVP

**Goal**: Ensure entire UI renders correctly in RTL when Arabic is selected

**Independent Test**: Switch language to Arabic and verify all 6 dossier pages render correctly with proper text alignment, icon flipping, and layout mirroring

### Tests for User Story 1

- [x] T009 [P] [US1] Create RTL layout test for Country dossier in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`
- [x] T010 [P] [US1] Create RTL layout test for Organization dossier in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`
- [x] T011 [P] [US1] Create RTL layout test for Person dossier in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`
- [x] T012 [P] [US1] Create RTL layout test for Engagement dossier in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`
- [x] T013 [P] [US1] Create RTL layout test for Forum dossier in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`
- [x] T014 [P] [US1] Create RTL layout test for Working Group dossier in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`
- [x] T015 [US1] Create bidirectional text test (mixed Arabic/English) in `frontend/tests/e2e/dossier-rtl-complete.spec.ts`

### Implementation for User Story 1

- [x] T016 [P] [US1] Add icon flipping for directional icons in `frontend/src/components/Dossier/DossierDetailLayout.tsx`
- [x] T017 [P] [US1] Fix breadcrumb RTL rendering in `frontend/src/components/ui/breadcrumb.tsx` (already RTL-safe in DossierDetailLayout)
- [x] T018 [P] [US1] Fix sidebar RTL positioning in `frontend/src/components/Layout/Sidebar.tsx` (already RTL-safe)
- [x] T019 [US1] Fix modal/drawer RTL animations in `frontend/src/components/ui/dialog.tsx`
- [x] T020 [US1] Fix modal/drawer RTL animations in `frontend/src/components/ui/sheet.tsx` (already RTL-safe)
- [x] T021 [P] [US1] Audit form input RTL alignment in `frontend/src/components/ui/input.tsx` (symmetric padding, RTL-safe)
- [x] T022 [P] [US1] Audit table RTL alignment in `frontend/src/components/ui/table.tsx` (basic table, RTL handled by container)
- [x] T023 [US1] Run all RTL tests and verify zero layout breaks

**Checkpoint**: User Story 1 complete - All 6 dossier pages render correctly in RTL mode

---

## Phase 4: User Story 2 - Mobile Responsiveness (Priority: P1)

**Goal**: All dossier pages work correctly at 320px, 375px, and 414px viewports

**Independent Test**: Open each dossier page at iPhone SE (320px), iPhone 12 (375px), iPhone 14 Pro Max (414px) viewports and verify no horizontal overflow, readable content, and proper touch targets

### Tests for User Story 2

- [x] T024 [P] [US2] Create viewport 320px test for all 6 dossier types in `frontend/tests/e2e/dossier-mobile-complete.spec.ts`
- [x] T025 [P] [US2] Create viewport 375px test for all 6 dossier types in `frontend/tests/e2e/dossier-mobile-complete.spec.ts`
- [x] T026 [P] [US2] Create viewport 414px test for all 6 dossier types in `frontend/tests/e2e/dossier-mobile-complete.spec.ts`
- [x] T027 [US2] Create touch target size verification test (44x44px minimum) in `frontend/tests/e2e/dossier-mobile-complete.spec.ts`
- [x] T028 [US2] Create horizontal overflow detection test in `frontend/tests/e2e/dossier-mobile-complete.spec.ts`

### Implementation for User Story 2

- [x] T029 [P] [US2] Fix touch target sizes for buttons in `frontend/src/components/ui/button.tsx` (add `min-h-11 min-w-11`)
- [x] T030 [P] [US2] Fix touch target sizes for icon buttons in `frontend/src/components/Dossier/sections/*.tsx` (verified: all use Button size="sm" with 44px)
- [x] T031 [P] [US2] Add horizontal scroll container for wide tables in `frontend/src/components/ui/table.tsx` (added TableContainer)
- [x] T032 [US2] Fix content stacking on mobile in `frontend/src/components/Dossier/DossierDetailLayout.tsx` (verified: already mobile-first)
- [x] T033 [US2] Fix collapsible section mobile spacing in `frontend/src/components/Dossier/CollapsibleSection.tsx` (verified: has min-h-11)
- [x] T034 [P] [US2] Audit card components for mobile overflow in `frontend/src/components/Dossier/sections/*.tsx` (verified: all mobile-first)
- [ ] T035 [US2] Run all mobile tests and verify zero horizontal overflow

**Checkpoint**: User Story 2 complete - All 6 dossier pages display correctly at all mobile viewports

---

## Phase 5: User Story 3 - Accessibility/WCAG AA (Priority: P2)

**Goal**: All dossier pages pass axe-core accessibility tests with zero critical/serious violations

**Independent Test**: Run axe-playwright on all 6 dossier pages and verify zero critical/serious violations, full keyboard navigation

### Tests for User Story 3

- [x] T036 [P] [US3] Create axe-core scan test for Country dossier in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T037 [P] [US3] Create axe-core scan test for Organization dossier in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T038 [P] [US3] Create axe-core scan test for Person dossier in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T039 [P] [US3] Create axe-core scan test for Engagement dossier in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T040 [P] [US3] Create axe-core scan test for Forum dossier in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T041 [P] [US3] Create axe-core scan test for Working Group dossier in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T042 [US3] Create keyboard navigation test in `frontend/tests/a11y/dossiers-a11y.spec.ts`
- [x] T043 [US3] Create focus indicator visibility test in `frontend/tests/a11y/dossiers-a11y.spec.ts`

### Implementation for User Story 3

- [x] T044 [P] [US3] Add ARIA expanded/collapsed attributes to `frontend/src/components/Dossier/CollapsibleSection.tsx` (verified: already has aria-expanded, aria-controls)
- [x] T045 [P] [US3] Add ARIA controls attribute to collapsible section triggers (verified: already has aria-controls={panelId})
- [x] T046 [P] [US3] Add visible focus indicators to all interactive elements in `frontend/src/index.css` (added global focus-visible ring styles)
- [x] T047 [P] [US3] Add alt text audit for images in `frontend/src/components/Dossier/sections/*.tsx` (verified: all images have alt text)
- [x] T048 [US3] Add aria-live regions for dynamic content updates in section components (added to CollapsibleSection)
- [x] T049 [US3] Fix heading hierarchy (h1 → h2 → h3) in all 6 dossier detail components (fixed h3→h2 in CollapsibleSection)
- [x] T050 [US3] Add keyboard trap handling for modals in `frontend/src/components/ui/dialog.tsx` (verified: Radix Dialog handles this natively)
- [ ] T051 [US3] Run all a11y tests and verify zero critical/serious violations

**Checkpoint**: User Story 3 complete - All 6 dossier pages pass WCAG AA accessibility testing

---

## Phase 6: User Story 4 - Performance Optimization (Priority: P2)

**Goal**: Optimize section components with useMemo to prevent unnecessary re-renders

**Independent Test**: Use React DevTools Profiler to verify no unnecessary re-renders during typical interactions

### Tests for User Story 4

- [ ] T052 [US4] Create render performance test measuring initial load time in `frontend/tests/performance/dossier-performance.spec.ts`
- [ ] T053 [US4] Create section expand/collapse timing test (<300ms) in `frontend/tests/performance/dossier-performance.spec.ts`

### Implementation for User Story 4

- [ ] T054 [P] [US4] Add useMemo for sorted items in `frontend/src/components/Dossier/sections/EventTimeline.tsx`
- [ ] T055 [P] [US4] Add useMemo for filtered roles in `frontend/src/components/Dossier/sections/KeyOfficials.tsx`
- [ ] T056 [P] [US4] Add useMemo for document filtering in `frontend/src/components/Dossier/sections/Documents.tsx`
- [ ] T057 [P] [US4] Add useMemo for relationship graph computation in `frontend/src/components/Dossier/sections/Relationships.tsx`
- [ ] T058 [P] [US4] Add useMemo for MoU status filtering in `frontend/src/components/Dossier/sections/ActiveMoUs.tsx`
- [ ] T059 [P] [US4] Audit remaining section components for expensive calculations
- [ ] T060 [US4] Verify <1s initial render time on all 6 dossier pages

**Checkpoint**: User Story 4 complete - No unnecessary re-renders, <1s initial render

---

## Phase 7: User Story 5 - Documentation (Priority: P3)

**Goal**: Add JSDoc comments to type guards, hooks, and page components

**Independent Test**: Review all exported functions and verify JSDoc describes parameters, return values, and usage examples

### Implementation for User Story 5

- [ ] T061 [P] [US5] Add JSDoc to all type guards in `frontend/src/lib/dossier-type-guards.ts`
- [ ] T062 [P] [US5] Add JSDoc to useDossier hook in `frontend/src/hooks/useDossier.ts`
- [ ] T063 [P] [US5] Add JSDoc to useDossiers hook in `frontend/src/hooks/useDossiers.ts`
- [ ] T064 [P] [US5] Add JSDoc to useDossierStats hook in `frontend/src/hooks/useDossierStats.ts`
- [ ] T065 [P] [US5] Add JSDoc to useDossierPositionLinks hook in `frontend/src/hooks/useDossierPositionLinks.ts`
- [ ] T066 [P] [US5] Add JSDoc to CountryDossierDetail component in `frontend/src/components/Dossier/CountryDossierDetail.tsx`
- [ ] T067 [P] [US5] Add JSDoc to OrganizationDossierDetail in `frontend/src/components/Dossier/OrganizationDossierDetail.tsx`
- [ ] T068 [P] [US5] Add JSDoc to PersonDossierDetail in `frontend/src/components/Dossier/PersonDossierDetail.tsx`
- [ ] T069 [P] [US5] Add JSDoc to EngagementDossierDetail in `frontend/src/components/Dossier/EngagementDossierDetail.tsx`
- [ ] T070 [P] [US5] Add JSDoc to ForumDossierDetail in `frontend/src/components/Dossier/ForumDossierDetail.tsx`
- [ ] T071 [P] [US5] Add JSDoc to WorkingGroupDossierDetail in `frontend/src/components/Dossier/WorkingGroupDossierDetail.tsx`
- [ ] T072 [US5] Verify 100% JSDoc coverage on all exported functions

**Checkpoint**: User Story 5 complete - All exports have JSDoc documentation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and CI/CD integration

- [x] T073 Create combined RTL + Mobile test in `frontend/tests/e2e/dossier-rtl-mobile.spec.ts`
- [x] T074 [P] Create combined RTL + A11y test in `frontend/tests/a11y/dossiers-rtl-a11y.spec.ts`
- [x] T075 Update GitHub Actions workflow for new tests in `.github/workflows/ci.yml`
- [ ] T076 Run full test suite and verify all tests pass
- [x] T077 Update quickstart.md with final test commands and results
- [ ] T078 Create PR with test results and screenshots

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US1 (RTL) and US2 (Mobile) can proceed in parallel (P1 priority)
  - US3 (A11y) and US4 (Performance) can proceed in parallel (P2 priority)
  - US5 (Documentation) can proceed independently (P3 priority)
- **Polish (Phase 8)**: Depends on US1-US4 completion (US5 optional)

### User Story Dependencies

| Story               | Priority | Dependencies                            | Can Parallel With |
| ------------------- | -------- | --------------------------------------- | ----------------- |
| US1 (RTL)           | P1       | Foundational only                       | US2, US5          |
| US2 (Mobile)        | P1       | Foundational only                       | US1, US5          |
| US3 (A11y)          | P2       | US1, US2 (layout must be correct first) | US4, US5          |
| US4 (Performance)   | P2       | Foundational only                       | US3, US5          |
| US5 (Documentation) | P3       | None                                    | All stories       |

### Within Each User Story

1. Tests MUST be written first and SHOULD fail before implementation
2. Implementation tasks can proceed in parallel where marked [P]
3. Final verification task runs all tests for that story
4. Story complete when checkpoint passes

### Parallel Opportunities

**Phase 1 (Setup)**: T001 → T002, T003, T004 in parallel

**Phase 2 (Foundational)**: T005 → T006, T007 in parallel → T008

**Phase 3 (US1 RTL)**:

- Tests T009-T014 all parallel
- Implementation T016-T018, T021-T022 all parallel

**Phase 4 (US2 Mobile)**:

- Tests T024-T026 all parallel
- Implementation T029-T031, T034 all parallel

**Phase 5 (US3 A11y)**:

- Tests T036-T041 all parallel
- Implementation T044-T047 all parallel

**Phase 6 (US4 Performance)**:

- Implementation T054-T059 all parallel

**Phase 7 (US5 Documentation)**:

- All tasks T061-T071 parallel (different files)

---

## Parallel Example: User Story 1 (RTL)

```bash
# Launch all RTL tests together:
Task T009: RTL test Country dossier
Task T010: RTL test Organization dossier
Task T011: RTL test Person dossier
Task T012: RTL test Engagement dossier
Task T013: RTL test Forum dossier
Task T014: RTL test Working Group dossier

# Launch parallel implementation tasks:
Task T016: Icon flipping in DossierDetailLayout
Task T017: Breadcrumb RTL in breadcrumb.tsx
Task T018: Sidebar RTL in Sidebar.tsx
Task T021: Form input RTL in input.tsx
Task T022: Table RTL in table.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational RTL fixes (T005-T008)
3. Complete Phase 3: US1 RTL Support (T009-T023)
4. Complete Phase 4: US2 Mobile (T024-T035)
5. **STOP and VALIDATE**: Run all RTL and mobile tests
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → RTL CSS fixed
2. Add US1 RTL → Test → 6 pages work in Arabic
3. Add US2 Mobile → Test → All viewports work
4. Add US3 A11y → Test → WCAG AA compliant
5. Add US4 Performance → Test → Optimized rendering
6. Add US5 Docs → Review → Complete documentation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (RTL) + US3 (A11y)
   - Developer B: US2 (Mobile) + US4 (Performance)
   - Developer C: US5 (Documentation)
3. Polish phase done together after US1-US4 complete

---

## Summary

| Phase             | Tasks  | Parallelizable |
| ----------------- | ------ | -------------- |
| Setup             | 4      | 3              |
| Foundational      | 4      | 2              |
| US1 RTL           | 15     | 11             |
| US2 Mobile        | 12     | 8              |
| US3 A11y          | 16     | 11             |
| US4 Performance   | 9      | 6              |
| US5 Documentation | 12     | 11             |
| Polish            | 6      | 1              |
| **TOTAL**         | **78** | **53**         |

**Parallel execution opportunity**: 68% of tasks can run in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests are included as this feature explicitly requires automated tests for CI/CD
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Focus on T005-T007 first (the only 3 RTL CSS fixes needed per research.md)
