# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Post-Launch Fixes** — Phases 24-25 (shipped 2026-04-12) — [archive](milestones/v4.1-ROADMAP.md)
- 🚧 **v5.0 Dossier Creation UX** — Phases 26-31 (in progress)

## Phases

<details>
<summary>✅ v2.0 Production Quality (Phases 1-7) — SHIPPED 2026-03-28</summary>

- [x] Phase 1: Dead Code & Toolchain (3/3 plans) — ESLint 9, Prettier, Knip, pre-commit hooks
- [x] Phase 2: Naming & File Structure (3/3 plans) — consistent naming enforced via ESLint
- [x] Phase 3: Security Hardening (3/3 plans) — auth, RBAC, CSP, Zod, RLS
- [x] Phase 4: RTL/LTR Consistency (6/6 plans) — useDirection, LtrIsolate, logical properties
- [x] Phase 5: Responsive Design (5/5 plans) — mobile-first, touch targets, card views
- [x] Phase 6: Architecture Consolidation (5/5 plans) — domain repos, apiClient, service dedup
- [x] Phase 7: Performance Optimization (4/4 plans) — bundle budget, query tiers, memoization

Full details: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>✅ v3.0 Connected Workflow (Phases 8-13) — SHIPPED 2026-04-06</summary>

- [x] Phase 8: Navigation & Route Consolidation (4/4 plans) — hub sidebar, route dedup, mobile tabs, Cmd+K
- [x] Phase 9: Lifecycle Engine (5/5 plans) — 6-stage lifecycle, transitions, forum sessions
- [x] Phase 10: Operations Hub (4/4 plans) — role-adaptive dashboard, 5 zones, Realtime
- [x] Phase 11: Engagement Workspace (5/5 plans) — tabbed workspace, lifecycle stepper, kanban, calendar
- [x] Phase 12: Enriched Dossier Pages (5/5 plans) — DossierShell, RelationshipSidebar, Elected Officials
- [x] Phase 13: Feature Absorption (5/5 plans) — analytics, AI, graph, polling, export absorbed; Cmd+K search

Full details: [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.0 Live Operations (Phases 14-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 14: Production Deployment (3/3 plans) — HTTPS, CI/CD, monitoring, backups, rollback
- [x] Phase 15: Notification Backend & In-App (3/3 plans) — BullMQ, triggers, bell icon, preferences
- [x] Phase 16: Email & Push Channels (4/4 plans) — Resend email, digest, browser push, soft-ask
- [x] Phase 17: Seed Data & First Run (5/5 plans) — 40+ entities, first-run modal, bilingual
- [x] Phase 18: E2E Test Suite (4/4 plans) — Playwright POM, CI sharding, auth hardening, failure artifacts
- [x] Phase 19: Tech Debt Cleanup (2/2 plans) — typed router params, roadmap auto-sync
- [x] Phase 20: Live Operations Bring-Up (1/1 plan) — seed accounts provisioned
- [x] Phase 21: Digest Scheduler Wiring Fix (1/1 plan) — registerDigestScheduler() wired
- [x] Phase 22: E2E Test Fixes (1/1 plan) — notification spec + ops-hub testids fixed
- [x] Phase 23: Missing Verifications (2/2 plans) — SEED/DEBT requirements formally verified

Full details: [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.1 Post-Launch Fixes (Phases 24-25) — SHIPPED 2026-04-12</summary>

- [x] Phase 24: Browser Inspection Fixes (2/2 plans) — calendar i18n, settings 406, analytics DNS
- [x] Phase 25: Deferred Audit Fixes (5 plans + 6 quick tasks) — 87/87 audit findings resolved

Full details: [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)

</details>

### 🚧 v5.0 Dossier Creation UX (In Progress)

**Milestone Goal:** Replace the generic 5-step wizard with type-specific creation flows that give each dossier type exactly the steps, fields, guidance, and relationships it needs.

- [ ] **Phase 26: Shared Wizard Infrastructure** - Extract reusable hook, shell, schemas, and defaults powering all 8 type-specific wizards
- [ ] **Phase 27: Country Wizard** - First type-specific wizard validating the compositional pattern end-to-end
- [ ] **Phase 28: Simple Type Wizards** - Organization, Topic, and Person wizards following the proven Country pattern
- [ ] **Phase 29: Complex Type Wizards** - Forum, Working Group, and Engagement wizards with relationship linking steps
- [ ] **Phase 30: Elected Official Wizard** - Person wizard variant adding office, term, and constituency steps
- [ ] **Phase 31: Creation Hub and Cleanup** - CreateDossierHub entry point, old wizard removal, and reference updates

## Phase Details

### Phase 26: Shared Wizard Infrastructure

**Goal**: All building blocks exist so any type-specific wizard can be composed from shared parts without duplicating logic
**Depends on**: Nothing (first phase of v5.0)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):

1. A `useCreateDossierWizard<T>` hook exists that handles draft persistence, form submission, AI assist, and duplicate detection for any dossier type
2. A `CreateWizardShell` component renders progress indicator, step navigation, and bilingual labels given a step configuration array
3. Per-type Zod schemas can extend a shared base schema and validate only their own fields
4. Calling `getDefaultsForType('country')` (or any type) returns sensible defaults including status, sensitivity, and type-specific fields
5. Existing localStorage drafts using the old format are migrated to per-type keys on first load without data loss
   **Plans**: 3 plans
   - [ ] 26-01-PLAN.md -- Type contracts, Zod schemas, defaults factory
   - [ ] 26-02-PLAN.md -- useCreateDossierWizard hook and draft migration
   - [ ] 26-03-PLAN.md -- CreateWizardShell and SharedBasicInfoStep components
         **UI hint**: yes

### Phase 27: Country Wizard

**Goal**: Users can create a country dossier through a dedicated 3-step wizard directly from the Countries list page
**Depends on**: Phase 26
**Requirements**: CTRY-01, CTRY-02, CTRY-03
**Success Criteria** (what must be TRUE):

1. User navigates to Countries list page and clicks "Create Country" to open the country wizard (no type selection step)
2. User fills Basic Info (name_en, name_ar, abbreviation, description) and Country Details (ISO codes, region, capital) across two focused steps
3. User reviews all entered data on the Review step and submits to create the country dossier
4. Created country appears in the Countries list and navigates to the new dossier detail page
   **Plans**: TBD
   **UI hint**: yes

### Phase 28: Simple Type Wizards

**Goal**: Users can create Organization, Topic, and Person dossiers through type-specific wizards from their respective list pages
**Depends on**: Phase 27
**Requirements**: ORG-01, ORG-02, ORG-03, TOPC-01, TOPC-02, TOPC-03, PRSN-01, PRSN-02, PRSN-03
**Success Criteria** (what must be TRUE):

1. User can create an organization dossier via 3-step wizard (Basic Info, Org Details with type/code/website, Review) from the Organizations list page
2. User can create a topic dossier via 2-step wizard (Basic Info with theme category inline, Review) from the Topics list page
3. User can create a person dossier via 3-step wizard (Basic Info, Person Details with title/photo/biography, Review) from the Persons list page
4. All three wizards use the shared infrastructure (hook, shell, schemas) without duplicating creation logic
   **Plans**: TBD
   **UI hint**: yes

### Phase 29: Complex Type Wizards

**Goal**: Users can create Forum, Working Group, and Engagement dossiers with relationship linking during creation
**Depends on**: Phase 28
**Requirements**: FORUM-01, FORUM-02, FORUM-03, WG-01, WG-02, WG-03, ENGM-01, ENGM-02, ENGM-03, ENGM-04, ENGM-05
**Success Criteria** (what must be TRUE):

1. User can create a forum dossier via 3-step wizard and link an organizing body (organization) using a DossierPicker in the Forum Details step
2. User can create a working group dossier via 3-step wizard and link a parent body using a DossierPicker, plus set established date and mandate
3. User can create an engagement dossier via 4-step wizard with type, category, location, and a Participants step for multi-selecting countries, organizations, and persons
4. The multi-select DossierPicker variant supports filtering by dossier type and displays selected items clearly
5. All three wizards are accessible directly from their respective list pages (Forums, Working Groups, Engagements)
   **Plans**: TBD
   **UI hint**: yes

### Phase 30: Elected Official Wizard

**Goal**: Users can create an elected official as a Person variant with additional office and term information
**Depends on**: Phase 28
**Requirements**: ELOF-01, ELOF-02, ELOF-03, ELOF-04
**Success Criteria** (what must be TRUE):

1. User can create an elected official via 4-step wizard (Basic Info, Person Details, Office/Term, Review) from the Elected Officials list page
2. Office/Term step captures office title, term start/end dates, constituency, and political party
3. Created dossier uses `person_subtype: 'elected_official'` and appears in both Elected Officials and Persons lists
   **Plans**: TBD
   **UI hint**: yes

### Phase 31: Creation Hub and Cleanup

**Goal**: All creation flows are unified under a hub entry point and the old monolithic wizard is removed
**Depends on**: Phase 29, Phase 30
**Requirements**: UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):

1. A CreateDossierHub page at `/dossiers/create` displays a type grid allowing users to pick any of the 8 dossier types to start the appropriate wizard
2. Each wizard displays type-specific contextual guidance and hints within its steps
3. The old monolithic DossierCreateWizard component and its route are removed from the codebase
4. All references (Command Palette, FAB, empty states, navigation links) point to the new type-specific wizards or the hub
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 26 -> 27 -> 28 -> 29 / 30 (parallel after 28) -> 31

<!-- gsd:progress:start -->

| Phase                             | Milestone | Plans Complete | Status      | Completed  |
| --------------------------------- | --------- | -------------- | ----------- | ---------- |
| 14. Production Deployment         | v4.0      | 3/3            | Complete    | 2026-04-06 |
| 15. Notification Backend & In-App | v4.0      | 3/3            | Complete    | 2026-04-06 |
| 16. Email & Push Channels         | v4.0      | 4/4            | Complete    | 2026-04-06 |
| 17. Seed Data & First Run         | v4.0      | 5/5            | Complete    | 2026-04-06 |
| 18. E2E Test Suite                | v4.0      | 4/4            | Complete    | 2026-04-07 |
| 19. Tech Debt Cleanup             | v4.0      | 2/2            | Complete    | 2026-04-08 |
| 20. Live Operations Bring Up      | v4.0      | 1/1            | Complete    | 2026-04-09 |
| 21. Digest Scheduler Wiring Fix   | v4.0      | 1/1            | Complete    | 2026-04-09 |
| 22. E2E Test Fixes                | v4.0      | 1/1            | Complete    | 2026-04-09 |
| 23. Missing Verifications         | v4.0      | 2/2            | Complete    | 2026-04-09 |
| 24. Browser Inspection Fixes      | v4.1      | 2/2            | Complete    | 2026-04-12 |
| 25. Deferred Audit Fixes          | v4.1      | 5/5            | Complete    | 2026-04-12 |
| 26. Shared Wizard Infrastructure  | v5.0      | 0/TBD          | Not started | -          |
| 27. Country Wizard                | v5.0      | 0/TBD          | Not started | -          |
| 28. Simple Type Wizards           | v5.0      | 0/TBD          | Not started | -          |
| 29. Complex Type Wizards          | v5.0      | 0/TBD          | Not started | -          |
| 30. Elected Official Wizard       | v5.0      | 0/TBD          | Not started | -          |
| 31. Creation Hub and Cleanup      | v5.0      | 0/TBD          | Not started | -          |

<!-- gsd:progress:end -->
