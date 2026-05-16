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
- 🟡 **v6.3 Carryover Sweep & v7.0 Prep** — Phases 50-54 (planning 2026-05-13)

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

<details open>
<summary>🟡 v6.3 Carryover Sweep & v7.0 Prep (Phases 50-54) — PLANNING 2026-05-13</summary>

- [ ] **Phase 50: Test Infrastructure Repair** (TEST-01..04) — Fix `vi.mock("react-i18next")` factory, restore 4 wizard tests, audit module-eval failures, document setup
- [x] **Phase 51: Design-Token Compliance Gate** (DESIGN-01..04) — ESLint rules ban raw hex + Tailwind color literals, fix all violations, register PR-blocking CI context — SEALED 2026-05-16 (smoke PR #12 closed: Lint=FAILURE, mergeStateStatus=BLOCKED; 271 Tier-C files annotated; D-09 no-PUT honored)
- [ ] **Phase 52: HeroUI v3 Kanban Migration** (KANBAN-01..04) — Plans 01-04 complete: shared `@/components/kanban` primitive live, `TasksTab.tsx` + `EngagementKanbanDialog.tsx` migrated off kibo-ui, `tunnel-rat` removed, local kibo-ui imports banned; Plan 05 visual/a11y baselines pending
- [ ] **Phase 53: Bundle Tightening + Tag Provenance** (BUNDLE-05..07) — React vendor 349 → ~285 KB, re-tag `phase-47/48/49-base` annotated/signed, update CLAUDE.md Node note
- [ ] **Phase 54: Intelligence Engine Schema Groundwork** (INTEL-01..05) — `intelligence_event` + `intelligence_digest` + polymorphic junction + source enum + regenerated TS types (schema only — no API, no UI)

</details>

## Phase Details

### Phase 50: Test Infrastructure Repair

**Goal:** Module-evaluation succeeds for all frontend test consumers; 4 wizard tests pass green; vitest setup gaps documented so subsequent phases can rely on green test infra.
**Depends on:** Nothing (entry phase — unblocks downstream verification)
**Requirements:** TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):

1. `frontend/tests/setup.ts` `vi.mock("react-i18next")` factory exports `initReactI18next` so dependent modules evaluate without `TypeError`.
2. The 4 previously-failing wizard tests pass green when running `pnpm --filter frontend test`.
3. A repo-wide module-eval audit produces a logged inventory of any remaining setup-time failures across frontend + backend test suites (fixed in-phase or queued with rationale).
4. `frontend/docs/test-setup.md` documents the vitest setup contract, common mock-factory pitfalls, and the `react-i18next` precedent so new contributors don't regress it.

**Plans:** 10 plans across 4 waves

Plans:

- [x] 50-01-PLAN.md — FE cascade unblock + i18n factory + 11 dead-import deletions (Wave 1)
- [x] 50-03-PLAN.md — BE global mocks + integration runner split + per-file triage (Wave 1)
- [x] 50-04-PLAN.md — 50-TEST-AUDIT.md + frontend/docs/test-setup.md + backend/docs/test-setup.md (Wave 5)
- [x] 50-05-PLAN.md — CI jobs + D-13 branch protection + D-15 ESLint rule (Wave 6; PR #11 CLOSED, branch protection re-verified)
- [x] 50-09-PLAN.md — Cross-cutting polyfills + provider migration (Wave 2)
- [x] 50-10-PLAN.md — i18n-text drift batched fix (Wave 3)
- [x] 50-11-PLAN.md — a11y/perf outliers (Wave 3)
- [x] 50-12-PLAN.md — design-system + route harness (Wave 3)
- [x] 50-13a-PLAN.md — phase-exit-0 original 6-file scope; useCountryAutoFill + 5 residual files (Wave 4)
- [x] 50-13b-PLAN.md — 7-file tests/component/ i18n cluster + downstream 50-04/05 depends_on rewire (Wave 4)

### Phase 51: Design-Token Compliance Gate

**Goal:** Raw hex colors and Tailwind color literals can no longer enter `frontend/src/`; all existing violations cleared; PR-blocking CI gate registered on `main`.
**Depends on:** Phase 50 (green test infra so lint-driven fixes don't mask test regressions)
**Requirements:** DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04
**Success Criteria** (what must be TRUE):

1. ESLint flat config bans raw hex (`#[0-9a-fA-F]{3,8}`) in `frontend/src/**/*.{ts,tsx,css}` outside allowlisted token-definition files.
2. ESLint flat config bans Tailwind color literals (`text-blue-*`, `bg-red-*`, `border-green-*`, etc.) in `frontend/src/**/*.{ts,tsx}` while permitting token-mapped utilities (`text-bg`, `text-ink`, `text-accent`).
3. `WorldMapVisualization.tsx:193` raw hex `#3B82F6`, `PositionEditor.tsx` color literals, and any other violations surfaced by the sweep are replaced with token references; `pnpm lint` exits 0 workspace-wide with the new rules active.
4. A new PR-blocking branch-protection context for design-token compliance is registered on `main` and verified to mark a smoke PR `mergeStateStatus=BLOCKED`.

**Plans:** 1/4 plans executed

Plans:

**Wave 1**

- [x] 51-01-rule-activation-tier-b-PLAN.md — ESLint D-05 selectors (hex + palette + TemplateElement) + D-03 Tier-B carve-out + phase-51-base tag + regression fixture (Wave 1; severity ships at `warn`)

**Wave 2** _(blocked on Wave 1 completion)_

- [ ] 51-02-tier-a-named-anchors-PLAN.md — Tier-A swap WorldMapVisualization.tsx + PositionEditor.tsx with visual-parity verification (Wave 2; parallel with 51-03)
- [ ] 51-03-tier-a-mechanical-sweep-PLAN.md — Tier-A mechanical sweep ~80-120 files + 51-DESIGN-AUDIT.md scaffold (Wave 2; parallel with 51-03)

**Wave 3** _(blocked on Wave 2 completion)_

- [ ] 51-04-tier-c-severity-flip-smoke-pr-PLAN.md — Tier-C disables + audit population + severity flip `warn`→`error` + smoke PR (mergeStateStatus=BLOCKED) + 51-SUMMARY.md (Wave 3; one human-verify checkpoint)

**UI hint:** yes

### Phase 52: HeroUI v3 Kanban Migration

**Goal:** Both Kanban surfaces (TasksTab + EngagementKanbanDialog) run on HeroUI v3 + `@dnd-kit/core` with full behavior parity; `kibo-ui/kanban` is gone from the codebase and banned from re-introduction; visual baselines regenerated and Playwright specs green.
**Depends on:** Phase 50 (test infra), Phase 51 (so the migrated kanban code is born design-token-compliant)
**Requirements:** KANBAN-01, KANBAN-02, KANBAN-03, KANBAN-04
**Success Criteria** (what must be TRUE):

1. A user can open the Tasks tab on any dossier and drag cards across columns with mouse, touch, and keyboard — column transitions and drop persistence behave identically to the kibo-ui version.
2. A user can open `EngagementKanbanDialog` and perform the same drag/drop/column transitions/keyboard parity as the Tasks tab.
3. `@/components/kibo-ui/kanban` directory and the kibo-ui npm dependency are deleted from the repo; `no-restricted-imports` bans both `kibo-ui` and the deleted local path; `pnpm lint` and `pnpm type-check` exit 0.
4. EN + AR Playwright visual baselines for both Kanban surfaces are regenerated, human-reviewed, and committed; Kanban Playwright specs pass green in CI.

**Plans:** 3/5 plans executed

Plans:

**Wave 1**

- [x] 52-01-PLAN.md — Wave-0 test scaffolds (vitest stubs + 8 Playwright spec skeletons + ESLint regression fixture) (Wave 1)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 52-02-PLAN.md — Build new shared `frontend/src/components/kanban/*` primitive (5 components + barrel; native DragOverlay; WorkBoard sensor stack) (Wave 2)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 52-03-PLAN.md — Consumer migration (TasksTab + EngagementKanbanDialog import swap; STAGE_COLORS deletion; KanbanTaskCard Tier-C absorption) (Wave 3)

**Wave 4** _(blocked on Wave 3 completion)_

- [ ] 52-04-PLAN.md — kibo-ui directory deletion + tunnel-rat removal + ESLint widen + check-deleted-components update + Phase 51 audit row closeout (Wave 4)

**Wave 5** _(blocked on Wave 4 completion)_

- [ ] 52-05-PLAN.md — 8 visual baselines (EN+AR × 1280+768) + axe-core a11y + 12-spec regression anchor + human-verify checkpoint + 52-SUMMARY.md (Wave 5; one human-verify checkpoint)

**UI hint:** yes

### Phase 53: Bundle Tightening + Tag Provenance

**Goal:** React vendor budget tightened to D-03 min rule; v6.2 phase-base tags upgraded to annotated + signed for `git tag -v` provenance; CLAUDE.md Node note matches `package.json` engines.
**Depends on:** Phase 50 (test infra), Phase 52 (Kanban migration may shift vendor chunk composition; tighten after migration is locked)
**Requirements:** BUNDLE-05, BUNDLE-06, BUNDLE-07
**Success Criteria** (what must be TRUE):

1. `frontend/.size-limit.json` React vendor ceiling lowered from 349 KB → ~285 KB gz with the measured baseline + slack documented in `frontend/docs/bundle-budget.md`; `Bundle Size Check (size-limit)` exits 0 on `main`.
2. `phase-47-base`, `phase-48-base`, and `phase-49-base` are re-issued as annotated + signed tags; `git tag -v phase-47-base` (and 48, 49) succeeds locally.
3. `CLAUDE.md` Node engine note reads `Node.js 22.13.0+` and matches the `engines.node` field in `package.json`.

**Plans:** 3/3 plans complete

- [x] 53-01-PLAN.md — BUNDLE-05: fresh react-vendor measurement, lower `.size-limit.json` ceiling to D-03 value (~285 KB), replace React vendor row in `bundle-budget.md`
- [x] 53-02-PLAN.md — BUNDLE-07: align both CLAUDE.md Node references to `Node.js 22.13.0+` to match `package.json` engines
- [x] 53-03-PLAN.md — BUNDLE-06: configure global SSH signing, re-issue `phase-47/48/49-base` as annotated + signed, force-push to origin, add `Tag signing setup` appendix to CLAUDE.md

### Phase 54: Intelligence Engine Schema Groundwork

**Goal:** v7.0 Intelligence Engine has its data layer ready — `intelligence_event` + `intelligence_digest` + polymorphic dossier linking + source enum + regenerated TS types — applied to staging via Supabase MCP. Schema only; no API, no UI.
**Depends on:** Nothing (groundwork for v7.0; can run in parallel with Phases 51–53. Soft-depends on Phase 50 only for green test infra during type regen.)
**Requirements:** INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05
**Success Criteria** (what must be TRUE):

1. `intelligence_event` table exists on staging with full column set (id, source_type, source_ref, content, occurred_at, ingested_at, severity, organization_id, created_by), required indexes, and tenant-scoped RLS policies (renamed from spec `intelligence_signal` to avoid collision with existing curated `intelligence_signals` plural table).
2. `intelligence_digest` table exists on staging with full column set (id, dossier_type, dossier_id, period_start, period_end, summary, generated_by, organization_id, generated_at), required indexes, and tenant-scoped RLS policies (the prior Phase-45 `intelligence_digest` was renamed to `dashboard_digest` in plan 54-01 to free this canonical name).
3. `intelligence_event_dossiers` polymorphic junction table enforces a `dossier_type` CHECK constraint matching the 7 canonical dossier types (`country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, `person`) and supports many-to-many event ↔ dossier linking.
4. `signal_source_type` enum (`publication`, `feed`, `human_entered`, `ai_generated`) is created and applied to `intelligence_event.source_type`.
5. `database.types.ts` regenerated from staging includes all new tables/enum; `pnpm type-check` exits 0 on both backend and frontend workspaces.

**Plans:** 4/4 plans complete

Plans:

**Wave 1**

- [x] 54-01-PLAN.md — Phase-54-base signed tag + rename `intelligence_digest` → `dashboard_digest` + lockstep frontend hook/test/widget rename (Wave 1; one human-action checkpoint for SSH tag signing)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 54-02-PLAN.md — `signal_source_type` enum + `intelligence_event` table + new `intelligence_digest` table + 4-policy RLS + Wave-0 RLS integration test (Wave 2)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 54-03-PLAN.md — `intelligence_event_dossiers` polymorphic junction with EXISTS-via-parent RLS + CASCADE + 7-value `dossier_type` CHECK + Wave-0 junction integration test (Wave 3)

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 54-04-PLAN.md — REQUIREMENTS.md + ROADMAP.md text patches (post-Phase-54 wording) + TS regen via MCP to both workspaces + dual `pnpm type-check` + `rls-audit.test.ts` sensitiveTables extension (Wave 4)

**Cross-cutting constraints:**

- D-15: Migration applied to staging (`zkrcjzdemdmwhearhfgg`) via Supabase MCP `apply_migration` — NOT local CLI.

## v6.3 Coverage Validation

**Total v6.3 requirements:** 20 unique REQ-IDs across 5 categories
**Mapped:** 20/20 ✓
**Orphans:** 0
**Duplicates:** 0

| Category | REQ-IDs                                          | Phase    |
| -------- | ------------------------------------------------ | -------- |
| TEST     | TEST-01, TEST-02, TEST-03, TEST-04               | Phase 50 |
| DESIGN   | DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04       | Phase 51 |
| KANBAN   | KANBAN-01, KANBAN-02, KANBAN-03, KANBAN-04       | Phase 52 |
| BUNDLE   | BUNDLE-05, BUNDLE-06, BUNDLE-07                  | Phase 53 |
| INTEL    | INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05 | Phase 54 |

## v6.3 Dependency Graph

```
Phase 50 (TEST infra) — entry, no deps
   ├──> Phase 51 (DESIGN gate)
   │       └──> Phase 52 (KANBAN migration — born compliant)
   │               └──> Phase 53 (BUNDLE tighten — after Kanban shifts)
   └──> Phase 54 (INTEL schema — parallel-safe; soft-dep on green tests for type regen)
```

Phase 54 is independent of Phases 51–53 and may execute in parallel with any of them once Phase 50 is green.

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
| 50 | v6.3 | 0/0 | Not started | — |
| 51 | v6.3 | 1/4 | In Progress|  |
| 52 | v6.3 | 3/5 | In Progress|  |
| 53 | v6.3 | 3/3 | Complete    | 2026-05-16 |
| 54 | v6.3 | 4/4 | Complete    | 2026-05-16 |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-05-16 — Phase 52 planned (5 plans across 5 waves)._
