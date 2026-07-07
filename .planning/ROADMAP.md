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
- ✅ **v6.6 Dossier Workflow Completion** — Phases 62-67 (shipped 2026-06-13) — [archive](milestones/v6.6-ROADMAP.md)
- ✅ **v7.0 Intelligence Engine** — Phases 68-74 (shipped 2026-06-24) — [archive](milestones/v7.0-ROADMAP.md)
- ✅ **v8.0 Linear Design System Migration** — Phases 75-80 (shipped 2026-07-04) — [archive](milestones/v8.0-ROADMAP.md)
- ✅ **v8.1 Linear Design Refinement** — Phases 81-85 (shipped 2026-07-05) — [archive](milestones/v8.1-ROADMAP.md)
- 🚧 **v9.0 Platform Completion & Live Verification** — Phases 86-91 (in progress)

## Current Milestone: v9.0 Platform Completion & Live Verification

**Goal:** Close every carried-forward gap between what the platform advertises and what is built, verified, and enforced — the last honest-disabled features become real, the red test suites become green gates, all 272 edge functions leave the deprecated CORS wildcard, and the v7.0 intelligence stack is finally live-verified on real GPU inference.

**Coverage:** 21/21 v1 requirements mapped (FEAT-01..04, AFF-01..04, SEC-01..02, CI-01..05, CORS-01..03, LIVE-01..03).

## Phases

- [ ] **Phase 86: Feature Completion** - The three honest-disabled data-entry features become real or are formally retired: MoU create, user-management routes, ConsistencyPanel
- [ ] **Phase 87: Linear Affordances** - Right-peek panel with paging, filter/display split popovers with live counts, ⌘K command-menu audit, rich empty states (F23–F26)
- [ ] **Phase 88: Security & Hygiene Tail** - UserPicker PostgREST filter-interpolation fix (IN-04) + credential-hygiene sweep (TEST_USER_PASSWORD-class values externalized)
- [ ] **Phase 89: CI & Test-Debt Burn-Down** - E2E / integration / a11y / visual-regression suites green or honestly quarantined; test-rtl-smokes promoted to a required branch-protection context
- [ ] **Phase 90: CORS Edge-Function Migration** - All 272 edge functions migrated off the deprecated wildcard corsHeaders in staged A/B/C batches, each deployed and smoke-checked
- [ ] **Phase 91: v7.0 Live Verification** - GPU/TEI stack stood up and the deploy-gated EVAL-01/02/03 + AGENT/INFRA verification closed (hardware-gated)

## Phase Details

### Phase 86: Feature Completion

**Goal**: No permanently-dead UI remains — the three honest-disabled data-entry features (MoU create, user management, ConsistencyPanel) are either fully working or formally retired
**Depends on**: Nothing (first phase of milestone; independent frontend/edge track following existing creation-wizard, list-page, and DossierShell patterns)
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04
**Success Criteria** (what must be TRUE):

1. User can create a MoU from the MoUs page — the "Add MoU" button opens a working form (type, mou_category, dates, parties, lifecycle_state) that writes `mous`, and the new MoU appears in the list (closes C-3)
2. Admin can create a user at `/users/create` against the L1-hardened user-management edge functions and sees the new user in the users list (closes D-10 create half)
3. Admin can open `/users/:id` from the users list and view/manage role, status, and profile (closes D-10 detail half)
4. ConsistencyPanel either runs a real consistency-check query with working modify/accept/escalate/view actions, or is fully deleted (component + i18n keys) with the decision recorded (closes E-8)
5. All new/changed surfaces work correctly in both EN/LTR and AR/RTL
   **Plans**: 5 plans
   **UI hint**: yes

Plans:

**Wave 1**

- [x] 86-01-PLAN.md — MoU create dialog + domains/mous wiring (FEAT-01, wave 1)
- [x] 86-02-PLAN.md — Users foundation: assign-role verify, invoke methods, layout routes, /users/create (FEAT-02, wave 1)
- [x] 86-03-PLAN.md — ConsistencyPanel formal retirement + ADR-008 decision record (FEAT-04, wave 1)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 86-04-PLAN.md — /users/:id detail (role/status/profile) + combined user-management E2E (FEAT-03, wave 2)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 86-05-PLAN.md — Phase gate battery + consolidated EN/AR render sign-off (wave 3)

### Phase 87: Linear Affordances

**Goal**: List pages and navigation gain the four Linear-grade affordances from DESIGN-REFINEMENT-PLAN-260704 §Phase 6 (F23–F26)
**Depends on**: Phase 86 (same list-page surfaces — sequenced to avoid churn; no hard dependency)
**Requirements**: AFF-01, AFF-02, AFF-03, AFF-04
**Success Criteria** (what must be TRUE):

1. User can open a list row in a right-peek panel and page prev/next through rows without leaving the list (F23)
2. User can filter and adjust display via split Filter and Display popovers that show live result counts on list pages (F24)
3. Every command advertised in the ⌘K menu works, high-value missing commands are added, and the menu is correct in both EN and AR (F25)
4. Empty states across list pages and dossier tabs explain the surface and offer a primary action — no bare "no data" text remains (F26)
   **Plans**: 10 plans
   **UI hint**: yes

Plans:

**Wave 1** _(foundations + URL normalization, parallel)_

- [x] 87-01-PLAN.md — F23 peek foundation: peekStore + usePeekPaging + DrawerHead counter/chevrons (AFF-01)
- [ ] 87-02-PLAN.md — F24 foundation: Filter/Display popovers, useListControls, list-controls i18n ns (AFF-02)
- [ ] 87-03-PLAN.md — F25 ⌘K audit: fix/remove 9 findings, 5 new commands, sentence-case pass, MousPage ?action=create (AFF-03)
- [ ] 87-04-PLAN.md — F26 infra: EmptyState reskin, ListEmptyState extension, copy matrix, Pattern-B tab audit (AFF-04)
- [ ] 87-05-PLAN.md — URL-state normalization: persons + engagements + elected-officials (AFF-01, AFF-02 enabler)

**Wave 2** _(per-surface wiring, parallel — blocked on Wave 1)_

- [ ] 87-06-PLAN.md — Countries + organizations wiring + DossierTable column visibility (AFF-01/02/04)
- [ ] 87-07-PLAN.md — Forums + topics + working-groups wiring + GenericListPage property toggles (AFF-01/02/04)
- [ ] 87-08-PLAN.md — Persons + engagements + elected-officials wiring + exact engagements total (AFF-01/02/04)
- [ ] 87-09-PLAN.md — Kanban: URL normalization, popover fold-in, commitment peek, board empties (AFF-01/02/04)

**Wave 3** _(gate)_

- [ ] 87-10-PLAN.md — Phase gate battery + consolidated EN/AR human render sign-off (all AFF)

### Phase 88: Security & Hygiene Tail

**Goal**: The two carried-forward security items from v8.0 close are shut — no PostgREST filter injection surface in UserPicker and no real secrets in tracked files
**Depends on**: Nothing (small, independent; sequenced before Phase 89 so the E2E burn-down runs against the final credential pattern)
**Requirements**: SEC-01, SEC-02
**Success Criteria** (what must be TRUE):

1. `UserPicker.handleSearch` no longer interpolates user input into PostgREST filter strings — search input containing `,().` characters cannot alter the query, via `.ilike()` builder or sanitization (closes IN-04 / T-79-S2)
2. No real secrets remain in tracked files — `TEST_USER_PASSWORD`-class values are rotated or externalized and the `.env.test.example` pattern is enforced
3. Test suites and browser-automation flows still authenticate and pass after credential externalization (no silently broken login paths)
   **Plans**: TBD

### Phase 89: CI & Test-Debt Burn-Down

**Goal**: The red non-required suites become trustworthy green gates (or honestly quarantined with tracked reasons), and test-rtl-smokes graduates to a required branch-protection context
**Depends on**: Phase 88 (credential externalization lands first so E2E/global-setup fixes target the final pattern). CI-05 promotion is sequenced last within the phase, after CI-01..04, so promotion never blocks on red suites.
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05
**Success Criteria** (what must be TRUE):

1. E2E suite is green against the deployed app — stale-login/global-setup debt fixed and genuinely-broken specs repaired, or each remaining spec explicitly quarantined with a tracked reason
2. Integration test suite is green, including the 2 pre-existing interaction-note backend failures
3. a11y suites are green — the intake-form `fixme` debt (button-name / aria-prohibited-attr / target-size) fixed and the 8 quarantined a11y specs restored
4. Visual-regression baselines are regenerated post-flatten on the reference machine and the suite is green
5. `test-rtl-smokes` is a required branch-protection context on `main`, proven by a smoke PR showing `BLOCKED`
   **Plans**: TBD

### Phase 90: CORS Edge-Function Migration

**Goal**: All 272 edge functions leave the deprecated wildcard `corsHeaders` — origin allow-listing enforced everywhere, with zero functional regression from allowed origins
**Depends on**: Nothing (independent track; CORS-01 secret verification gates CORS-02/03 within the phase — no batch ships before it). Batches are mechanical but wide; each batch needs deploy + smoke.
**Requirements**: CORS-01, CORS-02, CORS-03
**Success Criteria** (what must be TRUE):

1. `ALLOWED_ORIGINS` secret is verified present and correct in both staging and prod before any batch ships
2. All ~171 handler-scope edge functions (batch A) are migrated off the deprecated wildcard, deployed, and smoke-checked — requests from allowed origins succeed unchanged
3. All ~101 module-scope edge functions, including the 83 local `const corsHeaders = '*'` copies (batches B/C), are migrated, deployed, and smoke-checked
4. A repo-wide grep for the deprecated wildcard pattern returns 0 matches
   **Plans**: TBD

### Phase 91: v7.0 Live Verification

**Goal**: The v7.0 Intelligence Engine's deploy-gated closeout is done — real GPU inference serving, eval thresholds met, and the copilot's clearance ceiling verified end-to-end live
**Depends on**: Nothing in-repo — **HARDWARE-GATED**: the on-prem GPU hardware decision is pending. The DigitalOcean droplet (4GB, no GPU) cannot host vLLM/TEI. The Mac-local stack (proven in v7.0 Phase 72 bring-up) is the fallback verification target if dedicated hardware does not land. Plan-phase must surface this dependency before committing to a target environment.
**Requirements**: LIVE-01, LIVE-02, LIVE-03
**Success Criteria** (what must be TRUE):

1. vLLM (Gemma-4-12B) + TEI (BGE-M3) are serving with passing health checks and are reachable by the agent-runtime (:4100)
2. The v7.0 eval harness (briefing / correlation / Arabic-quality rubrics) runs against live inference and meets its CI thresholds — EVAL-01/02/03 closed
3. The copilot reads and HITL-writes under the caller's JWT against the live stack, and the clearance ceiling is verified end-to-end (an L1 caller's results are a strict subset of an L3 caller's, zero above-clearance rows)
   **Plans**: TBD

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

<details>
<summary>✅ v6.6 Dossier Workflow Completion (Phases 62-67) — SHIPPED 2026-06-13</summary>

- [x] Phase 62: Export Pack Contract & Deploy (3/3 plans) — completed 2026-06-12
- [x] Phase 63: Relationship Graph Route & Bidirectional Traversal (5/5 plans) — completed 2026-06-12
- [x] Phase 64: New Position from Dossier (6/6 plans) — completed 2026-06-12
- [x] Phase 65: Engagement Positions Tab & Legacy Reconciliation (6/6 plans) — completed 2026-06-13
- [x] Phase 66: Overview Error Contract & Timeline Cross-Links (8/8 plans) — completed 2026-06-13
- [x] Phase 67: Per-Type Engagement Contracts & Legacy Detail Cleanup (6/6 plans) — completed 2026-06-13

Full details: [v6.6-ROADMAP.md](milestones/v6.6-ROADMAP.md)

</details>

<details>
<summary>✅ v7.0 Intelligence Engine (Phases 68-74) — SHIPPED 2026-06-24</summary>

**Goal:** Turn dossiers from passive records into a fully on-prem, Arabic-first intelligence layer — conventional analyst surfaces (signals triage, digests/alerts, analytic graph) AND an agentic copilot incapable by construction of reading above the caller's clearance.

- [x] Phase 68: AI Foundations Remediation (8/8 plans) — completed 2026-06-14
- [x] Phase 69: Signals (4/4 plans) — completed 2026-06-14
- [x] Phase 70: Digests + Alerts (7/7 plans) — completed 2026-06-16
- [x] Phase 71: Analytic Graph (5/5 plans) — completed 2026-06-17
- [x] Phase 72: Agent Platform — Runtime, Retrieval, Reads (9/9 plans) — completed 2026-06-19
- [x] Phase 73: Agent Platform — Writes + Generative UI (5/5 plans) — completed 2026-06-21
- [x] Phase 74: Eval Gate + AnythingLLM Retirement (11/11 plans) — completed 2026-06-21

Full detail: [milestones/v7.0-ROADMAP.md](milestones/v7.0-ROADMAP.md). Audit: [milestones/v7.0-MILESTONE-AUDIT.md](milestones/v7.0-MILESTONE-AUDIT.md) — `gaps_found`, 0 code blockers; EVAL-01/02/03 + AGENT/INFRA live verification deploy-gated on the on-prem GPU/TEI stack.

</details>

<details>
<summary>✅ v8.0 Linear Design System Migration (Phases 75-80) — SHIPPED 2026-07-04</summary>

**Goal:** Replace the multi-direction IntelDossier/Bureau design language with a single Linear-derived visual direction — a re-skin of the existing OKLCH token engine on consolidated shadcn RTL infrastructure + HeroUI v3 (3.0.5 → 3.2.1), with Aceternity's form components rebuilt on HeroUI v3/Radix — preserving Arabic RTL on all four axes (dark/light × LTR/RTL).

- [x] Phase 75: UI Component & Migration Audit (4/4 plans) — completed 2026-07-02
- [x] Phase 76: RTL Infrastructure Bridge & shadcn Logical Properties (5/5 plans) — completed 2026-07-02
- [x] Phase 77: Linear Token System (9/8 plans, incl. GAPFIX) — completed 2026-07-02
- [x] Phase 78: HeroUI v3 API Audit & Bump (4/4 plans) — completed 2026-07-03
- [x] Phase 79: Aceternity Removal (4/4 plans) — completed 2026-07-03
- [x] Phase 80: Full-Route Visual + A11y Verification & Smoke Suite (6/6 plans) — completed 2026-07-04

Full detail: [milestones/v8.0-ROADMAP.md](milestones/v8.0-ROADMAP.md). Audit: [milestones/v8.0-MILESTONE-AUDIT.md](milestones/v8.0-MILESTONE-AUDIT.md) — status passed, 24/24 requirements, 6/6 phases.

</details>

<details>
<summary>✅ v8.1 Linear Design Refinement (Phases 81-85) — SHIPPED 2026-07-05</summary>

**Goal:** Correct and refine the freshly-migrated Linear design system — visible bugs, systematized date/number formatting, token-debt consolidation, de-marketed copy, and six user-signed-off Linear taste calls (F16–F21) — with zero regressions across dark-canonical + light and EN/LTR + AR/RTL.

- [x] Phase 81: Visible Bugs (3/3 plans) — completed 2026-07-04
- [x] Phase 82: Date/Number Formatting (7/7 plans) — completed 2026-07-04
- [x] Phase 83: Token-Debt Consolidation (7/7 plans) — completed 2026-07-05
- [x] Phase 84: Copy / Marketing Voice (1/1 plan) — completed 2026-07-05
- [x] Phase 85: Linear Taste Refinements F16-F21 (4/4 plans) — completed 2026-07-05

Full detail: [milestones/v8.1-ROADMAP.md](milestones/v8.1-ROADMAP.md).

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
| 62-67 | v6.6 | 34/34 | Shipped | 2026-06-13 |
| 68-74 | v7.0 | 49/49 | Shipped | 2026-06-24 |
| 75-80 | v8.0 | 32/32 | Shipped | 2026-07-04 |
| 81-85 | v8.1 | 22/22 | Shipped | 2026-07-05 |
| 86. Feature Completion | v9.0 | 5/5 | Complete    | 2026-07-07 |
| 87. Linear Affordances | v9.0 | 1/10 | In Progress|  |
| 88. Security & Hygiene Tail | v9.0 | 0/TBD | Not started | — |
| 89. CI & Test-Debt Burn-Down | v9.0 | 0/TBD | Not started | — |
| 90. CORS Edge-Function Migration | v9.0 | 0/TBD | Not started | — |
| 91. v7.0 Live Verification | v9.0 | 0/TBD | Not started | — |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-07-06 — v9.0 Platform Completion & Live Verification roadmap created (Phases 86-91; 21/21 v1 requirements mapped)._
