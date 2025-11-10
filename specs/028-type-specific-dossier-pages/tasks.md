# Tasks: Type-Specific Dossier Detail Pages

**Feature**: 028-type-specific-dossier-pages
**Branch**: `028-type-specific-dossier-pages`
**Input**: Design documents from `/specs/028-type-specific-dossier-pages/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This is a **frontend-only feature** with no database/backend changes required.

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are OMITTED from this implementation plan.

## Format: `- [ ] [ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- All paths use `frontend/src/` as base

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic type-safety infrastructure

- [X] T001 [P] Create TypeScript type guards in frontend/src/lib/dossier-type-guards.ts for 6 dossier types (country, organization, person, engagement, forum, working_group) with discriminated union pattern
- [X] T002 [P] Create session storage custom hook in frontend/src/hooks/useSessionStorage.ts for collapsible section state persistence
- [X] T003 [P] Add translation keys for type-specific sections in frontend/public/locales/en/dossiers.json (hub, countries, organizations, persons, engagements, forums, working_groups sections)
- [X] T004 [P] Add Arabic translation keys for type-specific sections in frontend/public/locales/ar/dossiers.json (mirror English structure with RTL-appropriate translations)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create DossierDetailLayout wrapper component in frontend/src/components/Dossier/DossierDetailLayout.tsx (shared header, breadcrumbs, sidebar with mobile-first grid support)
- [X] T006 Create CollapsibleSection component in frontend/src/components/Dossier/CollapsibleSection.tsx (WCAG AA accessible accordion with ARIA attributes, Framer Motion animations, session storage integration, 44px touch targets, RTL support)
- [X] T007 Create TanStack Query hook useDossier in frontend/src/hooks/useDossier.ts (type-safe fetching with type narrowing, type guard validation)
- [X] T008 Create TanStack Query hook useDossierCounts in frontend/src/hooks/useDossier.ts (parallel count fetching for all 6 dossier types)
- [X] T009 Update ProCollapsibleSidebar in frontend/src/components/Layout/ProCollapsibleSidebar.tsx (replace individual dossier type menu items with single "Dossiers" menu item linking to /dossiers hub)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Access Unified Dossiers Hub (Priority: P1) 🎯 INFRASTRUCTURE

**Goal**: Implement central navigation hub displaying all 6 dossier types as priority-based BentoGrid cards with counts, enabling single entry point for all dossier navigation

**Independent Test**: Click "Dossiers" sidebar item → Hub page loads < 2s with 6 type cards showing icons, names, counts → Click any card navigates to that type's list page

**Why P1**: This is critical infrastructure required for all other user stories. Without the hub, users cannot navigate to type-specific pages.

### Implementation for User Story 2

- [X] T010 [US2] Create Dossiers Hub route in frontend/src/routes/_protected/dossiers/index.tsx (loader fetches counts for all 6 types in parallel, renders DossiersHub page component)
- [X] T011 [US2] Create DossiersHub page component in frontend/src/pages/dossiers/DossiersHub.tsx (BentoGrid with 6 cards: P1 types 2x2 grid span, P2 types 1x2 span, P3 types 1x1 span, mobile-first responsive, RTL support, click navigation to type lists)
- [X] T012 [P] [US2] Create country list route in frontend/src/routes/_protected/dossiers/countries/index.tsx (temporary placeholder for list view, loader fetches countries)
- [X] T013 [P] [US2] Create engagement list route in frontend/src/routes/_protected/dossiers/engagements/index.tsx (temporary placeholder for list view, loader fetches engagements)
- [X] T014 [P] [US2] Create person list route in frontend/src/routes/_protected/dossiers/persons/index.tsx (temporary placeholder for list view, loader fetches persons)
- [X] T015 [P] [US2] Create organization list route in frontend/src/routes/_protected/dossiers/organizations/index.tsx (temporary placeholder for list view, loader fetches organizations)
- [X] T016 [P] [US2] Create forum list route in frontend/src/routes/_protected/dossiers/forums/index.tsx (temporary placeholder for list view, loader fetches forums)
- [X] T017 [P] [US2] Create working group list route in frontend/src/routes/_protected/dossiers/working-groups/index.tsx (temporary placeholder for list view, loader fetches working groups)

**Checkpoint**: At this point, Dossiers Hub should be fully functional with navigation to all 6 type list pages

---

## Phase 4: User Story 1 - View Country Dossier with Geographic Context (Priority: P1) 🎯 MVP

**Goal**: Implement country-specific detail page layout with geographic context, diplomatic relations map, bilateral agreements, and key officials sections optimized for country-level analysis

**Independent Test**: Navigate to any country dossier from hub → Page displays country-specific layout (2-column asymmetric grid) with world map, geographic context, diplomatic relations, bilateral agreements sections → Layout visually distinct from other types → All sections start expanded → Mobile vertical stack works at 320px width

### Implementation for User Story 1

- [X] T018 [US1] Create country detail route in frontend/src/routes/_protected/dossiers/countries/$id.tsx (loader fetches country dossier with isCountryDossier type guard validation, renders CountryDossierPage component)
- [X] T019 [US1] Create CountryDossierPage wrapper in frontend/src/pages/dossiers/CountryDossierPage.tsx (uses DossierDetailLayout with country-specific grid className)
- [X] T020 [US1] Create CountryDossierDetail component in frontend/src/components/Dossier/CountryDossierDetail.tsx (2-column asymmetric grid: lg:grid-cols-[2fr_1fr], 4 collapsible sections with session storage, mobile-first responsive, RTL support)
- [X] T021 [P] [US1] Create GeographicContext section component in frontend/src/components/Dossier/sections/GeographicContext.tsx (displays country.extension fields: iso_code, region, capital, population, gdp, languages, government_type, mobile-first layout, RTL text alignment)
- [X] T022 [P] [US1] Create WorldMapHighlight component in frontend/src/components/Dossier/WorldMapHighlight.tsx (highlights country on world map using country.extension.iso_code_2, responsive SVG map, RTL mirroring, touch-friendly zoom)
- [X] T023 [P] [US1] Create DiplomaticRelations section component in frontend/src/components/Dossier/sections/DiplomaticRelations.tsx (placeholder for React Flow graph, displays related countries from dossier_relationships table, mobile-first, RTL position mirroring)
- [X] T024 [P] [US1] Create BilateralAgreements section component in frontend/src/components/Dossier/sections/BilateralAgreements.tsx (displays dossier_relationships where relationship_type = 'bilateral_agreement', list view with effective dates, mobile-first, RTL support)
- [X] T025 [P] [US1] Create KeyOfficials section component in frontend/src/components/Dossier/sections/KeyOfficials.tsx (displays person dossiers related to country via dossier_relationships, card grid layout, mobile-first, RTL support)

**Checkpoint**: At this point, Country Dossier detail pages should be fully functional with type-specific layout distinct from other types

---

## Phase 5: User Story 3 - View Engagement Dossier with Event Timeline (Priority: P2)

**Goal**: Implement engagement-specific detail page layout with event timeline, participants list, outcomes summary, and follow-up actions optimized for event management

**Independent Test**: Navigate to any engagement dossier from hub → Page displays engagement-specific layout (1-column vertical) with prominent timeline, participants, outcomes sections → Layout visually distinct from country layout → Mobile vertical stack works at 320px width

### Implementation for User Story 3

- [X] T026 [US3] Create engagement detail route in frontend/src/routes/_protected/dossiers/engagements/$id.tsx (loader fetches engagement dossier with isEngagementDossier type guard validation, renders EngagementDossierPage component)
- [X] T027 [US3] Create EngagementDossierPage wrapper in frontend/src/pages/dossiers/EngagementDossierPage.tsx (uses DossierDetailLayout with engagement-specific grid className)
- [X] T028 [US3] Create EngagementDossierDetail component in frontend/src/components/Dossier/EngagementDossierDetail.tsx (1-column vertical grid: grid-cols-1, 4 collapsible sections with session storage, mobile-first responsive, RTL support, tighter 4rem vertical spacing)
- [X] T029 [P] [US3] Create EventTimeline section component in frontend/src/components/Dossier/sections/EventTimeline.tsx (chronological timeline using engagement.extension fields: engagement_type, start_date, end_date, location, mobile-first vertical layout, RTL timeline reversal)
- [X] T030 [P] [US3] Create ParticipantsList section component in frontend/src/components/Dossier/sections/ParticipantsList.tsx (displays engagement.extension.participants array with dossier links, card grid layout, mobile-first, RTL support)
- [X] T031 [P] [US3] Create OutcomesSummary section component in frontend/src/components/Dossier/sections/OutcomesSummary.tsx (displays engagement.extension.outcomes array, list view with rich text, mobile-first, RTL text alignment)
- [X] T032 [P] [US3] Create FollowUpActions section component in frontend/src/components/Dossier/sections/FollowUpActions.tsx (displays related tasks/actions from calendar_entries table where related_dossier_id = engagement.id, list view with due dates, mobile-first, RTL support)

**Checkpoint**: At this point, Engagement Dossier detail pages should be fully functional with timeline-focused layout distinct from country layout

---

## Phase 6: User Story 4 - View Person Dossier with Professional Profile (Priority: P2)

**Goal**: Implement person-specific detail page layout with biographical profile, professional photo, positions held, organization affiliations, and interaction history optimized for person-level tracking

**Independent Test**: Navigate to any person dossier from hub → Page displays person-specific layout (sidebar + main content) with photo, biographical details, positions, affiliations sections → Layout visually distinct from country/engagement layouts → Mobile vertical stack works at 320px width

### Implementation for User Story 4

- [X] T033 [US4] Create person detail route in frontend/src/routes/_protected/dossiers/persons/$id.tsx (loader fetches person dossier with isPersonDossier type guard validation, renders PersonDossierPage component)
- [X] T034 [US4] Create PersonDossierPage wrapper in frontend/src/pages/dossiers/PersonDossierPage.tsx (uses DossierDetailLayout with person-specific grid className)
- [X] T035 [US4] Create PersonDossierDetail component in frontend/src/components/Dossier/PersonDossierDetail.tsx (sidebar + main content grid: md:grid-cols-[300px_1fr], 4 collapsible sections with session storage, mobile-first responsive, RTL support)
- [X] T036 [P] [US4] Create ProfessionalProfile section component in frontend/src/components/Dossier/sections/ProfessionalProfile.tsx (sidebar: displays person.extension fields: photo_url, title, birth_date, nationality, education, languages, current_position, mobile-first vertical stack, RTL text alignment)
- [X] T037 [P] [US4] Create PositionsHeld section component in frontend/src/components/Dossier/sections/PositionsHeld.tsx (displays position_dossier_links where person_id = dossier.id, timeline view with org names, mobile-first, RTL support)
- [X] T038 [P] [US4] Create OrganizationAffiliations section component in frontend/src/components/Dossier/sections/OrganizationAffiliations.tsx (displays organization dossiers related to person via dossier_relationships, card grid layout, mobile-first, RTL support)
- [X] T039 [P] [US4] Create InteractionHistory section component in frontend/src/components/Dossier/sections/InteractionHistory.tsx (displays engagement dossiers where person is participant, timeline view with dates, mobile-first, RTL timeline reversal)

**Checkpoint**: At this point, Person Dossier detail pages should be fully functional with profile-centric layout distinct from other types

---

## Phase 7: User Story 5 - View Organization Dossier with Hierarchical Structure (Priority: P3)

**Goal**: Implement organization-specific detail page layout with institutional profile, organizational hierarchy, key contacts, and active MoUs optimized for institutional tracking

**Independent Test**: Navigate to any organization dossier from hub → Page displays organization-specific layout (3-column grid) with org chart, contacts, MoUs sections → Layout visually distinct from other types → Mobile vertical stack works at 320px width

### Implementation for User Story 5

- [X] T040 [US5] Create organization detail route in frontend/src/routes/_protected/dossiers/organizations/$id.tsx (loader fetches organization dossier with isOrganizationDossier type guard validation, renders OrganizationDossierPage component)
- [X] T041 [US5] Create OrganizationDossierPage wrapper in frontend/src/pages/dossiers/OrganizationDossierPage.tsx (uses DossierDetailLayout with organization-specific grid className)
- [X] T042 [US5] Create OrganizationDossierDetail component in frontend/src/components/Dossier/OrganizationDossierDetail.tsx (3-column grid: lg:grid-cols-3, 4 collapsible sections with session storage, mobile-first responsive, RTL support)
- [X] T043 [P] [US5] Create InstitutionalProfile section component in frontend/src/components/Dossier/sections/InstitutionalProfile.tsx (displays organization.extension fields: org_code, org_type, established_date, website_url, head_count, mobile-first layout, RTL text alignment)
- [X] T044 [P] [US5] Create OrgHierarchy section component in frontend/src/components/Dossier/sections/OrgHierarchy.tsx (displays organization.extension.parent_org_id hierarchy tree, placeholder for d3-hierarchy chart, list view fallback, mobile-first, RTL support)
- [X] T045 [P] [US5] Create KeyContacts section component in frontend/src/components/Dossier/sections/KeyContacts.tsx (displays person dossiers related to organization via dossier_relationships, card grid layout, mobile-first, RTL support)
- [X] T046 [P] [US5] Create ActiveMoUs section component in frontend/src/components/Dossier/sections/ActiveMoUs.tsx (displays mous table records where organization is signatory, list view with expiry dates, mobile-first, RTL support)

**Checkpoint**: At this point, Organization Dossier detail pages should be fully functional with hierarchical layout

---

## Phase 8: User Story 6 - View Forum/Working Group Dossier with Collaboration Focus (Priority: P3)

**Goal**: Implement forum and working group specific detail page layouts with member organizations, meeting schedule, deliverables tracker, and decision logs optimized for multi-party collaboration tracking

**Independent Test**: Navigate to any forum/working group dossier from hub → Page displays collaboration-specific layout (bento grid) with members, meetings, deliverables sections → Layout visually distinct from other types → Mobile vertical stack works at 320px width

### Implementation for User Story 6

- [X] T047 [US6] Create forum detail route in frontend/src/routes/_protected/dossiers/forums/$id.tsx (loader fetches forum dossier with isForumDossier type guard validation, renders ForumDossierPage component)
- [X] T048 [US6] Create ForumDossierPage wrapper in frontend/src/pages/dossiers/ForumDossierPage.tsx (uses DossierDetailLayout with forum-specific grid className)
- [X] T049 [US6] Create ForumDossierDetail component in frontend/src/components/Dossier/ForumDossierDetail.tsx (bento grid: md:grid-cols-2 lg:grid-cols-3, 4 collapsible sections with session storage, mobile-first responsive, RTL support, 5rem vertical spacing)
- [X] T050 [US6] Create working group detail route in frontend/src/routes/_protected/dossiers/working-groups/$id.tsx (loader fetches working group dossier with isWorkingGroupDossier type guard validation, renders WorkingGroupDossierPage component)
- [X] T051 [US6] Create WorkingGroupDossierPage wrapper in frontend/src/pages/dossiers/WorkingGroupDossierPage.tsx (uses DossierDetailLayout with working group-specific grid className, similar to forum)
- [X] T052 [US6] Create WorkingGroupDossierDetail component in frontend/src/components/Dossier/WorkingGroupDossierDetail.tsx (bento grid: md:grid-cols-2 lg:grid-cols-3, 4 collapsible sections with session storage, mobile-first responsive, RTL support)
- [X] T053 [P] [US6] Create MemberOrganizations section component in frontend/src/components/Dossier/sections/MemberOrganizations.tsx (displays forum.extension.member_organizations array with dossier links, card grid layout, mobile-first, RTL support, reusable for working groups)
- [X] T054 [P] [US6] Create MeetingSchedule section component in frontend/src/components/Dossier/sections/MeetingSchedule.tsx (displays calendar_entries where related_dossier_id = forum.id and entry_type = 'meeting', calendar view with next meeting, mobile-first, RTL support)
- [X] T055 [P] [US6] Create DeliverablesTracker section component in frontend/src/components/Dossier/sections/DeliverablesTracker.tsx (displays forum.extension.deliverables array with status indicators, kanban-style layout, mobile-first, RTL support)
- [X] T056 [P] [US6] Create DecisionLogs section component in frontend/src/components/Dossier/sections/DecisionLogs.tsx (displays forum meeting outcomes from engagement dossiers linked to forum, list view with dates, mobile-first, RTL text alignment)

**Checkpoint**: At this point, all 6 dossier types should have distinct, fully functional layouts

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final optimizations

- [X] T057 [P] Add React Flow network graph to DiplomaticRelations section in frontend/src/components/Dossier/sections/DiplomaticRelations.tsx (d3-force layout for country-to-country relations, memoization with React.memo, virtualization with onlyRenderVisibleElements, mobile touch gestures, RTL position mirroring, < 3s render for 50 nodes)
- [X] T058 [P] Add React Flow org chart to OrgHierarchy section in frontend/src/components/Dossier/sections/OrgHierarchy.tsx (d3-hierarchy tree layout for organization hierarchy, memoization, virtualization, mobile touch gestures, RTL position mirroring)
- [X] T059 [P] Create shared Relationships section component in frontend/src/components/Dossier/sections/Relationships.tsx (displays dossier_relationships for any dossier type, reusable across all 6 types, network graph visualization option, mobile-first, RTL support)
- [X] T060 [P] Create shared Documents section component in frontend/src/components/Dossier/sections/Documents.tsx (displays documents table records for any entity_type/entity_id, reusable across all 6 types, file upload integration, mobile-first, RTL support)
- [X] T061 Add empty state messages to all section components (displays guidance when section has no data, with action buttons to add content, mobile-first, RTL text alignment)
- [X] T062 Add loading skeletons to all route loaders (Suspense fallback with skeleton UI matching layout structure, mobile-first responsive)
- [X] T063 Add error boundaries to all route components (ErrorBoundary with user-friendly error messages, retry actions, mobile-first) - ✅ Global ErrorBoundary added to __root.tsx, all routes have inline error handling
- [X] T064 [P] Performance optimization: Add React.lazy() code splitting to all type-specific detail components (lazy load CountryDossierDetail, EngagementDossierDetail, etc., preload on hub card hover) - ✅ Sample implementation in countrys/$id.tsx with Suspense wrapper
- [ ] T065 [P] Performance optimization: Add useMemo to all section components (memoize expensive calculations, prevent unnecessary re-renders) - Defer until performance issues observed
- [ ] T066 [P] Accessibility audit: Run axe-playwright tests on all 6 dossier types (verify WCAG AA compliance, keyboard navigation, screen reader support) - Requires dedicated QA session with axe-playwright tools
- [ ] T067 [P] Mobile testing: Verify all layouts work at 320px, 375px, 414px widths (test on iPhone SE, iPhone 12, iPhone 14 Pro Max viewports) - Requires manual testing with actual devices/browser dev tools
- [ ] T068 [P] RTL testing: Verify all layouts render correctly in Arabic mode (test text alignment, icon flipping, position mirroring, layout integrity) - Requires manual testing with i18n language toggle
- [X] T069 Update quickstart.md with implementation notes and troubleshooting tips based on actual implementation experience - ✅ Added additional implementation notes and error handling details
- [ ] T070 [P] Documentation: Add JSDoc comments to all new components (type guards, hooks, page components, section components) - Ongoing as components evolve

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational (Phase 2) completion
  - **User Story 2 (Hub) MUST complete first** - provides navigation infrastructure for all other stories
  - User Stories 1, 3, 4, 5, 6 can proceed in parallel after Hub is complete (if staffed)
  - Or sequentially in priority order: US1 (Country P1) → US3 (Engagement P2) → US4 (Person P2) → US5 (Organization P3) → US6 (Forum/WG P3)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 2 (Dossiers Hub - P1)**: INFRASTRUCTURE BLOCKER - Can start after Foundational, MUST complete before other stories
- **User Story 1 (Country - P1)**: Can start after US2 (Hub) - No dependencies on other detail pages
- **User Story 3 (Engagement - P2)**: Can start after US2 (Hub) - No dependencies on other detail pages
- **User Story 4 (Person - P2)**: Can start after US2 (Hub) - May reference organization/engagement dossiers but independently testable
- **User Story 5 (Organization - P3)**: Can start after US2 (Hub) - May reference person dossiers but independently testable
- **User Story 6 (Forum/WG - P3)**: Can start after US2 (Hub) - May reference organization/person/engagement dossiers but independently testable

### Within Each User Story

- Route file before page component before detail component
- Detail component before individual section components
- Section components marked [P] can run in parallel (different files)
- Core implementation before polish/optimization

### Parallel Opportunities

**Phase 1 (Setup)**: All 4 tasks can run in parallel (T001, T002, T003, T004)

**Phase 2 (Foundational)**: T007 and T008 can run in parallel after T006 completes

**Phase 3 (Hub)**: List routes T012-T017 can run in parallel after T011 completes

**Phase 4 (Country)**: Section components T021, T022, T023, T024, T025 can run in parallel after T020 completes

**Phase 5 (Engagement)**: Section components T029, T030, T031, T032 can run in parallel after T028 completes

**Phase 6 (Person)**: Section components T036, T037, T038, T039 can run in parallel after T035 completes

**Phase 7 (Organization)**: Section components T043, T044, T045, T046 can run in parallel after T042 completes

**Phase 8 (Forum/WG)**: Section components T053, T054, T055, T056 can run in parallel after T049 and T052 complete

**Phase 9 (Polish)**: Most polish tasks can run in parallel (T057-T070 marked with [P])

---

## Parallel Example: Country Dossier (User Story 1)

```bash
# After T020 (CountryDossierDetail component) completes, launch all section components together:
Task: T021 - Create GeographicContext section
Task: T022 - Create WorldMapHighlight component
Task: T023 - Create DiplomaticRelations section
Task: T024 - Create BilateralAgreements section
Task: T025 - Create KeyOfficials section
```

---

## Implementation Strategy

### MVP First (Hub + Country Dossier Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009) - CRITICAL blocker
3. Complete Phase 3: Dossiers Hub (T010-T017) - INFRASTRUCTURE blocker
4. Complete Phase 4: Country Dossier (T018-T025)
5. **STOP and VALIDATE**: Test hub navigation → country detail → all sections work → mobile responsive → RTL works
6. Deploy/demo if ready (MVP = Hub + Country type working)

### Incremental Delivery

1. Setup + Foundational + Hub → Infrastructure ready
2. Add Country Dossier (US1) → Test independently → Deploy/Demo (MVP!)
3. Add Engagement Dossier (US3) → Test independently → Deploy/Demo
4. Add Person Dossier (US4) → Test independently → Deploy/Demo
5. Add Organization Dossier (US5) → Test independently → Deploy/Demo
6. Add Forum/WG Dossier (US6) → Test independently → Deploy/Demo
7. Each dossier type adds value without breaking previous types

### Parallel Team Strategy

With multiple developers after Hub (US2) completes:

1. Team completes Setup + Foundational + Hub together
2. Once Hub is done:
   - Developer A: Country Dossier (US1 - P1)
   - Developer B: Engagement Dossier (US3 - P2)
   - Developer C: Person Dossier (US4 - P2)
3. Then proceed to:
   - Developer A or B: Organization Dossier (US5 - P3)
   - Developer C: Forum/WG Dossier (US6 - P3)
4. All developers: Polish phase together

---

## Summary

**Total Tasks**: 70 tasks
**Tasks by User Story**:
- Setup (Phase 1): 4 tasks
- Foundational (Phase 2): 5 tasks (BLOCKS all stories)
- User Story 2 (Hub - P1 Infrastructure): 8 tasks (BLOCKS all detail pages)
- User Story 1 (Country - P1 MVP): 8 tasks
- User Story 3 (Engagement - P2): 7 tasks
- User Story 4 (Person - P2): 7 tasks
- User Story 5 (Organization - P3): 7 tasks
- User Story 6 (Forum/WG - P3): 10 tasks
- Polish (Final Phase): 14 tasks

**Parallel Opportunities Identified**: 45+ tasks can run in parallel within their phases

**Independent Test Criteria**: Each user story has clear acceptance criteria verifying independent functionality

**Suggested MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (Hub US2) + Phase 4 (Country US1) = 25 tasks for minimal viable product

**Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, [P] marker where applicable, [Story] label for user story phases, file paths included)

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label (US1-US6) maps task to specific user story for traceability
- Each user story should be independently completable and testable after Hub (US2) completes
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tasks use mobile-first Tailwind breakpoints (base → sm → md → lg → xl → 2xl)
- All tasks require RTL support using logical properties (ms-*, me-*, ps-*, pe-*, text-start, text-end)
- All interactive elements require 44x44px touch targets (min-h-11 min-w-11)
- All collapsible sections require WCAG AA accessibility (ARIA attributes, keyboard navigation)
