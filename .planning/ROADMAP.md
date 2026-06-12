# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Post-Launch Fixes** — Phases 24-25 (shipped 2026-04-12) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Dossier Creation UX** — Phases 26-32 (shipped 2026-04-18) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Design System Adoption** — Phases 33-43 (shipped 2026-05-06) — [archive](milestones/v6.0-ROADMAP.md)
- ✅ **v6.1 Hardening & Reconciliation** — Phases 44-46 (shipped 2026-05-08) — [archive](milestones/v6.1-ROADMAP.md)
- ✅ **v6.2 Type-Check, Lint & Bundle Reset** — Phases 47-49 (shipped 2026-05-12) — [archive](milestones/v6.2-ROADMAP.md)
- ✅ **v6.3 Carryover Sweep & v7.0 Prep** — Phases 50-54 (shipped 2026-05-17) — [archive](milestones/v6.3-ROADMAP.md)
- ✅ **v6.4 Stabilization & Carryover Sweep** — Phases 55-59 (shipped 2026-05-27) — [archive](milestones/v6.4-ROADMAP.md)
- ✅ **v6.5 Escalated Backlog Hardening** — Phases 60-61 (shipped 2026-06-11) — [archive](milestones/v6.5-ROADMAP.md)
- 🔄 **v6.6 Dossier Workflow Completion** — Phases 62-67 (in progress)

## Phases

### 🔄 v6.6 Dossier Workflow Completion (Phases 62-67) — IN PROGRESS

**Goal:** Every advertised dossier workflow works end-to-end — no advertised-but-broken paths, no silent failures rendered as empty states, no dead routes.
**Source:** `.planning/dossier-workflow-backlog-phases-2026-06-11.md` (bucket-B escalations from the 17-round inspection loop, rounds 1-17)

- [x] **Phase 62: Export Pack Contract & Deploy** - Exporting a dossier returns the advertised file format from a deployed, schema-correct edge (HIGH — most visible broken path)
- [x] **Phase 63: Relationship Graph Route & Bidirectional Traversal** - Graph page reachable with incoming + outgoing edges and per-type node navigation, or formally retired
- [ ] **Phase 64: New Position from Dossier** - Creating a position from a dossier persists a valid position and its dossier link
- [ ] **Phase 65: Engagement Positions Tab & Legacy Reconciliation** - Working engagement Positions surface on canonical tables; no inert workspace CTAs
- [ ] **Phase 66: Overview Error Contract & Timeline Cross-Links** - Overview sections distinguish empty from failed; timeline links never hit unmounted routes
- [ ] **Phase 67: Per-Type Engagement Contracts & Legacy Detail Cleanup** - Org/person/EO Engagements tabs honor per-type contracts; legacy `*DossierDetail` routed or deleted

### Phase 62: Export Pack Contract & Deploy

**Goal**: Exporting a dossier produces the advertised file format from a deployed, schema-correct `dossier-export-pack` edge function
**Depends on**: Nothing (independent — sequenced first by severity: the most visible advertised-but-broken path)
**Requirements**: EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):

1. The Export dialog advertises only formats the system actually produces — PDF/DOCX rendering implemented, or the dialog honestly states HTML output (decision recorded)
2. Exporting a dossier of each of the 7 types on staging returns the advertised file — no 404 (edge deployed) and no 500
3. Export content resolves against live schema: positions, MoUs, documents, and commitments sections read current columns (`aa_commitments`, not legacy `commitments`; no stale `positions.classification`/`dossier_ids`, `mous.title_en`/`status`, `documents.entity_type` reads)
   **Plans**: 3 plans (2 waves)
   **UI hint**: yes

Plans:

**Wave 1**

- [x] 62-01-PLAN.md — Edge function surgery: stale-read reconciliation, D-08 error notes, print CSS, direct HTML response (wave 1)
- [x] 62-02-PLAN.md — Frontend export contract rework: dialog, types, service, hook, EN/AR i18n + EXPORT-01 component test (wave 1)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 62-03-PLAN.md — Staging deploy, ALLOWED_ORIGINS check, 7-type smoke verification (wave 2)

### Phase 63: Relationship Graph Route & Bidirectional Traversal

**Goal**: Users reach a relationship graph that shows relationships from both directions with correct per-type navigation — or the page is formally retired in favor of the documented mini-graph contract
**Depends on**: Nothing (independent)
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03
**Success Criteria** (what must be TRUE):

1. Navigating to the relationship graph from a dossier renders the graph page (no redirect to `/dossiers`) — or the route is formally retired with the mini-graph + a list view documented as the contract
2. A dossier referenced by another dossier shows that incoming edge in its graph (traversal RPC returns incoming + outgoing relationships)
3. Clicking either endpoint node navigates to the correct per-type dossier route, matching the already-correct MiniRelationshipGraph helper
   **Plans**: 5 plans (3 waves)
   **UI hint**: yes

Plans:

**Wave 1**

- [x] 63-01-PLAN.md — Bidirectional RPC migration (DROP+CREATE+GRANT) + [BLOCKING] apply via Supabase MCP + live probes (wave 1)
- [x] 63-02-PLAN.md — Route mount with validateSearch + page repair (graph namespace, canonical filter, D-02 link) + Wave 0 page test (wave 1)
- [x] 63-03-PLAN.md — Edge-orientation contract helper + per-type path test (Wave 0) + Basic-mode arrows + graph.json sentence-case sweep (wave 1)

**Wave 2** _(blocked on 63-01 + 63-03)_

- [x] 63-04-PLAN.md — Direction-aware edge building in graph-traversal edge fn + staging redeploy + e2e probes (wave 2)

**Wave 3** _(blocked on all prior)_

- [x] 63-05-PLAN.md — Staging relationship seed (all 7 types) + live all-types click-through, AR/RTL + width verification, suite/size gates (wave 3)

### Phase 64: New Position from Dossier

**Goal**: Creating a position from any dossier persists a valid position and its dossier link
**Depends on**: Nothing within v6.6 (builds on the positions-attach chain fixed in inspection rounds 12-13, already on main)
**Requirements**: POSNEW-01, POSNEW-02
**Success Criteria** (what must be TRUE):

1. The New Position dialog offers a real position-type picker, bilingual title fields, and audience-group selection whose submission satisfies `positions-create` validation (no `position_type_id = dossier_id`, no blank `title_ar`, no empty `audience_groups`)
2. After create, the `position_dossier_links` row exists for the originating dossier (DB-verified on staging)
3. The new position appears on the dossier's Positions tab without a manual refresh (live-verified)
   **Plans**: 6 plans (4 waves)
   **UI hint**: yes

Plans:

**Wave 1**

- [x] 64-01-PLAN.md — Restore the positions INSERT RLS policy on staging (P0 blocker; diagnostic + idempotent migration via Supabase MCP + live probes)
- [x] 64-02-PLAN.md — Foundation: position-type/audience-group lookup hooks, translateContent repository wrapper, bilingual i18n key set

**Wave 2**

- [x] 64-03-PLAN.md — NewPositionDialog form layer, test-first (type picker, bilingual titles + translate assists, audience checkboxes, Zod validation, name-match defaults)

**Wave 3**

- [x] 64-04-PLAN.md — Two-step submit (create → applies_to link), dossier-scoped invalidation, honest failure states; gut the broken PositionDialog wrapper
- [x] 64-05-PLAN.md — D-13 tab rewire: Create position opens the new dialog; attach-existing demoted to a secondary button

**Wave 4**

- [x] 64-06-PLAN.md — Live staging verification: both entry points, DB-verified applies_to link, tab refresh without reload, AR/RTL + gates + cleanup

### Phase 65: Engagement Positions Tab & Legacy Reconciliation

**Goal**: The engagement workspace has a working Positions surface on canonical tables, with no inert CTAs left behind
**Depends on**: Phase 64 (soft — the position-creation contract decision informs the canonical `position_dossier_links` vs legacy `engagement_positions` choice); otherwise independent
**Requirements**: ENGPOS-01, ENGPOS-02, ENGPOS-03
**Success Criteria** (what must be TRUE):

1. The engagement workspace shows a routed Positions tab reading the decided canonical source (`position_dossier_links` vs legacy `engagement_positions` — decision recorded and implemented)
2. Attaching a position to an engagement persists, renders in the tab, and invalidates queries — live-verified on staging
3. No inert buttons remain in the engagement workspace: every round-15-disabled CTA is re-enabled and functional, or removed
   **Plans**: 6 plans (3 waves)
   **UI hint**: yes

Plans:

**Wave 1**

- [x] 65-01-PLAN.md — Routed Positions tab on position_dossier_links (route + nav entry + phase i18n keys + ENGPOS-01 decision recorded; ENGPOS-02 unit pins)
- [x] 65-02-PLAN.md — Remove unwireable CTAs: WorkspaceShell Transition Stage, ContextTab Link Dossier ×2, DocsTab Upload
- [x] 65-03-PLAN.md — Delete the orphaned engagement_positions frontend stack + deprecate the engagements-positions-\* edges (staging emptiness gate)
- [x] 65-04-PLAN.md — Create Task wiring (Overview + Tasks) via exported TaskDialog; workspace invalidations; kanban caveat recorded

**Wave 2**

- [x] 65-05-PLAN.md — CalendarTab Scheduled-events reader + live Add Event CTAs via exported EventDialog

**Wave 3**

- [x] 65-06-PLAN.md — Live staging verification (orchestrator-run): attach/create DB-verified, nine-CTA pass, AR/RTL + gates + cleanup

### Phase 66: Overview Error Contract & Timeline Cross-Links

**Goal**: Overview sections distinguish "empty" from "failed", and timeline cross-links never dead-end on unmounted routes
**Depends on**: Nothing (independent)
**Requirements**: OVRERR-01, OVRERR-02
**Success Criteria** (what must be TRUE):

1. A single section error contract is decided (fail-the-query vs section-level error metadata vs explicit unknown state) and applied across overview section fetchers and cards
2. A forced section fetch error renders an explicit error state on that card — never a trustworthy-looking zero/empty state
3. No timeline "View details" navigates to an unmounted route (`/calendar/$id`, `/mous/$id`): each affordance routes to a real destination (detail route or filtered list page) or is suppressed
   **Plans**: TBD
   **UI hint**: yes

### Phase 67: Per-Type Engagement Contracts & Legacy Detail Cleanup

**Goal**: Org/person/EO Engagements tabs honor their per-type contracts, and no dead legacy `*DossierDetail` surfaces remain
**Depends on**: Nothing (independent)
**Requirements**: PERENG-01, PERENG-02, PERENG-03
**Success Criteria** (what must be TRUE):

1. An organization dossier with a `host_organization_id` engagement shows it on its Engagements tab — or the tab is documented as generic history-only (decision implemented either way)
2. A person/EO dossier with `person_engagements` rows shows them on its Engagements tab per the chosen contract, including `get_person_full.recent_engagements` wiring
3. Every legacy unrouted `*DossierDetail` component is routed or deleted, and whatever survives renders localized strings in both EN and AR (no raw i18n keys)
   **Plans**: TBD
   **UI hint**: yes

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

<details>
<summary>✅ v5.0 Dossier Creation UX (Phases 26-32) — SHIPPED 2026-04-18</summary>

- [x] Phase 26: Shared Wizard Infrastructure (4/4 plans) — `useCreateDossierWizard` hook, `CreateWizardShell`, per-type Zod schemas, defaults factory
- [x] Phase 27: Country Wizard (2/2 plans) — 3-step wizard, ISO/region/capital, list-page CTA
- [x] Phase 28: Simple Type Wizards (4/4 plans) — Organization, Topic, Person wizards
- [x] Phase 29: Complex Type Wizards (6/6 plans) — Forum, Working Group, Engagement wizards with relationship linking
- [x] Phase 30: Elected Official Wizard (4/4 plans) — Person variant with office/term/constituency
- [x] Phase 31: Creation Hub and Cleanup (4/4 plans) — `CreateDossierHub`, context-aware FAB, legacy wizard removal
- [x] Phase 32: Person-Native Basic Info (4/4 plans) — `PersonBasicInfoStep` with honorific, split names, nationality, DOB, gender

Full details: [v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md)

</details>

<details>
<summary>✅ v6.0 Design System Adoption (Phases 33-43) — SHIPPED 2026-05-06</summary>

- [x] Phase 33: Token Engine (8/9 plans, 33-08 storybook deferred) — OKLCH-driven token engine across 4 directions × mode × hue × density via Tailwind v4 `@theme` + HeroUI v3 semantic bridge
- [x] Phase 34: Tweaks Drawer (8/8 plans) — Topbar Tweaks drawer (Direction/Mode/Hue/Density/Classification/Locale) with `localStorage` persistence; `/themes` route removed
- [x] Phase 35: Typography Stack (5/5 plans) — Self-hosted font stacks per direction + Tajawal RTL cascade; zero Google Fonts CDN calls
- [x] Phase 36: Shell Chrome (5/5 plans) — 256px sidebar + 56px topbar + direction-specific classification element + GASTAT brand mark + responsive overlay-drawer
- [x] Phase 37: Signature Visuals (9/9 plans) — GlobeLoader / GlobeSpinner / FullscreenLoader / DossierGlyph (24 flags + symbol fallbacks) / Sparkline / Donut
- [x] Phase 38: Dashboard Verbatim (10/10 plans) — 8 widgets rebuilt pixel-exact to reference, wired to real domain hooks (75/75 vitest, PASS-WITH-DEVIATION)
- [x] Phase 39: Kanban + Calendar (10/10 plans) — Horizontal-scroll Kanban (kcards, overdue border, done opacity) + 7×5 calendar grid with event pills (PASS-WITH-DEVIATION)
- [x] Phase 40: List Pages (23/23 plans) — Countries / Organizations / Persons / Forums / Topics / Working Groups / Engagements lists with shared `GenericListPage` (PASS-WITH-DEFERRAL)
- [x] Phase 41: Dossier Drawer (11/11 plans) — 720px drawer with mini-KPI strip + serif summary + Upcoming/Activity/Commitments + RTL flip + mobile full-screen (PASS-WITH-DEVIATION)
- [x] Phase 42: Remaining Pages (12/12 plans) — Briefs / After-actions / Tasks / Activity / Settings reskinned to handoff anatomy (PASS-WITH-DEFERRAL)
- [x] Phase 43: RTL / A11y / Responsive Sweep (19/19 plans) — UAT 94/4/0 across 15 v6.0 routes × 2 locales (axe + responsive + keyboard + focus-outline) + `docs/rtl-icons.md`

Full details: [v6.0-ROADMAP.md](milestones/v6.0-ROADMAP.md)

</details>

<details>
<summary>✅ v6.1 Hardening & Reconciliation (Phases 44-46) — SHIPPED 2026-05-08</summary>

- [x] Phase 44: Documentation, Toolchain & Anti-patterns (6/6 plans) — verification backfill, archive sync, size-limit gate repair, WR-02..WR-06 closure, ADR-006
- [x] Phase 45: Schema & Seed Closure (4/4 plans) — `intelligence_digest`, dashboard digest hook, VIP ISO projection, staging seed closure
- [x] Phase 46: Visual Baseline Regeneration (4/4 plans) — 24 regenerated baselines for dashboard widgets, list pages, and dossier drawer with human review

Full details: [v6.1-ROADMAP.md](milestones/v6.1-ROADMAP.md)

</details>

<details>
<summary>✅ v6.2 Type-Check, Lint & Bundle Reset (Phases 47-49) — SHIPPED 2026-05-12</summary>

- [x] Phase 47: Type-Check Zero (11/11 plans) — frontend 1580 + backend 498 TS errors → 0 via deletion-first + typed-at-source; `type-check` restored as PR-blocking CI gate; 19 of 20 shims retired
- [x] Phase 48: Lint & Config Alignment (3/3 plans) — frontend 723 + backend 4 lint problems → 0; root `eslint.config.mjs` single source of truth; Aceternity references purged; `no-restricted-imports` inverted per CLAUDE.md primitive cascade; `Lint` restored as PR-blocking CI gate
- [x] Phase 49: Bundle Budget Reset (3/3 plans) — Initial-route ceiling 517 → 450 KB; static-prim 64 → 12 KB; manualChunks ordering fix; heroui/sentry/dnd sub-vendor decomposition; 3 audit-driven `React.lazy()` conversions; `Bundle Size Check (size-limit)` restored as PR-blocking CI gate

Full details: [v6.2-ROADMAP.md](milestones/v6.2-ROADMAP.md)

</details>

<details>
<summary>✅ v6.3 Carryover Sweep & v7.0 Prep (Phases 50-54) — SHIPPED 2026-05-17</summary>

- [x] Phase 50: Test Infrastructure Repair (10/10 plans) — `vi.mock("react-i18next")` factory uses `vi.importActual` + spread; 4 wizard tests green; `50-TEST-AUDIT.md` + test-setup docs published
- [x] Phase 51: Design-Token Compliance Gate (4/4 plans) — ESLint D-05 bans raw hex + Tailwind palette literals at `error` workspace-wide; 50 Tier-A files swapped to tokens; 271 Tier-C suppressed per-Literal; smoke PR #12 BLOCKED via D-09 fold into Phase 48 `Lint` context
- [x] Phase 52: HeroUI v3 Kanban Migration (5/5 plans) — shared `@dnd-kit/core` primitive; TasksTab migrated; `EngagementKanbanDialog` + `EngagementDossierPage` deleted (KANBAN-02 satisfied-by-deletion D-20); kibo-ui + tunnel-rat purged; 4 EN+AR baselines committed (PASS-WITH-DEVIATION — D-19..D-23 documented)
- [x] Phase 53: Bundle Tightening + Tag Provenance (3/3 plans) — React vendor ceiling 349 → 285 KB gz (measured 279.42 kB); `phase-47/48/49-base` annotated + SSH-signed (`git tag -v` Good); CLAUDE.md Node note `22.13.0+`
- [x] Phase 54: Intelligence Engine Schema Groundwork (4/4 plans) — `intelligence_event` + new `intelligence_digest` (prior renamed `dashboard_digest`) + polymorphic junction + `signal_source_type` enum + regenerated TS types byte-identical across workspaces; schema-only — no API, no UI

Full details: [v6.3-ROADMAP.md](milestones/v6.3-ROADMAP.md)

</details>

<details>
<summary>✅ v6.4 Stabilization & Carryover Sweep (Phases 55-59) — SHIPPED 2026-05-27</summary>

- [x] Phase 55: DesignV2 → Main Merge & Gate Enforcement (4/4 plans) — DesignV2 landed on `main` (`3f763ddc`); branch protection 6 → 8 required CI contexts; smoke PR #18 `BLOCKED` proof
- [x] Phase 56: RLS Closure & Last Typed-Shim Retirement (2/2 plans) — `countries` → `globalReferenceTables` tier; `useStakeholderInteractionMutations` typed at source
- [x] Phase 57: Phase 52 Deviation Closure D-19..D-23 (4/4 plans) — mobile-DnD scope-out ADR + `<select>` fallback; `@dnd-kit/core` ban + regression test; LTR/RTL baselines md5-distinct; live tasks-tab run
- [x] Phase 58: Tier-C Design-Token Suppression Full Clear (7/7 plans) — 271 suppressions / 2336 AST nodes → 0; waiver removed from `eslint.config.mjs` (merge `aed43b97`)
- [x] Phase 59: Cosmetic + CI Gap Closure (3/3 plans) — Phase 53 wording, doc drift, bad-fixture positive-failure CI jobs (PR #27 `d3e7f8e`)

Full details: [v6.4-ROADMAP.md](milestones/v6.4-ROADMAP.md)

</details>

<details>
<summary>✅ v6.5 Escalated Backlog Hardening (Phases 60-61) — SHIPPED 2026-06-11</summary>

- [x] Phase 60: Schema & Type Truth Restoration (6/6 plans) — completed 2026-06-10
- [x] Phase 61: Security Pass (delivered by quick task 260610-fkn; verified 2026-06-11)

Full details: [v6.5-ROADMAP.md](milestones/v6.5-ROADMAP.md)

</details>

## Progress

<!-- gsd:progress:start -->

<!-- prettier-ignore -->
| Phase | Milestone | Plans Complete | Status | Completed |
| ----- | --------- | -------------- | ------ | --------- |
| 1-7 | v2.0 | — | Shipped | 2026-03-28 |
| 8-13 | v3.0 | — | Shipped | 2026-04-06 |
| 14-23 | v4.0 | — | Shipped | 2026-04-09 |
| 24-25 | v4.1 | — | Shipped | 2026-04-12 |
| 26-32 | v5.0 | — | Shipped | 2026-04-18 |
| 33-43 | v6.0 | — | Shipped | 2026-05-06 |
| 44-46 | v6.1 | 14/14 | Shipped | 2026-05-08 |
| 47-49 | v6.2 | 17/17 | Shipped | 2026-05-12 |
| 50-54 | v6.3 | 28/28 | Shipped | 2026-05-17 |
| 55-59 | v6.4 | 20/20 | Shipped | 2026-05-27 |
| 60-61 | v6.5 | 7/7 | Shipped | 2026-06-11 |
| 62. Export Pack Contract & Deploy | v6.6 | 3/3 | Complete    | 2026-06-11 |
| 63. Relationship Graph Route & Bidirectional Traversal | v6.6 | 4/5 | In Progress|  |
| 64. New Position from Dossier | v6.6 | 6/6 | Complete    | 2026-06-12 |
| 65. Engagement Positions Tab & Legacy Reconciliation | v6.6 | 6/6 | Complete    | 2026-06-12 |
| 66. Overview Error Contract & Timeline Cross-Links | v6.6 | 0/TBD | Not started | - |
| 67. Per-Type Engagement Contracts & Legacy Detail Cleanup | v6.6 | 0/TBD | Not started | - |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-06-11 — v6.6 roadmap created (Phases 62-67, 15/15 requirements mapped). Source: `.planning/dossier-workflow-backlog-phases-2026-06-11.md`._
