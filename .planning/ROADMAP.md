# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Post-Launch Fixes** — Phases 24-25 (shipped 2026-04-12) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Dossier Creation UX** — Phases 26-32 (shipped 2026-04-18) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Design System Adoption** — Phases 33-43 (shipped 2026-05-06) — [archive](milestones/v6.0-ROADMAP.md)
- ✅ **v6.1 Hardening & Reconciliation** — Phases 44-46 (shipped 2026-05-08) — [archive](milestones/v6.1-ROADMAP.md)
- ⏳ **v6.2 Type-Check, Lint & Bundle Reset** — Phases 47-49 (planning, opened 2026-05-08)

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

## v6.2 Type-Check, Lint & Bundle Reset

**Goal:** Restore code-quality gates and bundle budget on `main` before v7.0 Intelligence Engine work begins.

**Source measurements (2026-05-08, `main`):** frontend 1580 TS errors / backend 498 TS errors / frontend 723 lint problems (52 errors + 671 warnings) / backend 4 lint problems (3 errors + 1 warning) / frontend Total JS 2.42 MB gzip vs 2.43 MB symbolic ceiling. Detail: `.planning/notes/v6.2-rationale.md`.

**Coverage:** 12/12 v6.2 requirements mapped (TYPE-01..04, LINT-06..09, BUNDLE-01..04).

### Phases (summary)

- [x] **Phase 47: Type-Check Zero** — Drive frontend + backend `pnpm type-check` to zero and restore type-check as a PR-blocking CI gate (completed 2026-05-09)
- [x] **Phase 48: Lint & Config Alignment** — Drive frontend + backend `pnpm lint` to zero, purge Aceternity references from `frontend/eslint.config.js`, align `no-restricted-imports` with the CLAUDE.md primitive cascade, restore lint as a PR-blocking CI gate (completed 2026-05-12)
- [ ] **Phase 49: Bundle Budget Reset** — Lower `frontend/.size-limit.json` Total JS ceiling to a real budget (≤500 KB initial-route gzip proposal), route-split heavy chunks via `React.lazy()`, audit the vendor super-chunk, restore `size-limit` as a PR-blocking CI gate

### Phase Details

#### Phase 47: Type-Check Zero

**Goal:** Frontend and backend `pnpm type-check` exit 0 on a clean clone, with type-check restored as a PR-blocking CI gate so a single regression cannot reach `main`.

**Depends on:** Nothing inside v6.2 (first phase). Operates directly on the v6.1 baseline.

**Entry condition (must be answered before plan-phase):**

- Open research question Q1 (`.planning/research/questions.md`) must be resolved: confirm whether `pnpm type-check` runs on PRs and `main` builds today, and if so why it does not block. The answer determines whether Phase 47 must wire a new CI job (TYPE-03) or only repair an existing one. Inspect `.github/workflows/*.yml`, `turbo.json`, root `package.json` scripts, `.husky/`, and the last green CI run on `main` for the type-check exit code. Capture the answer in `.planning/research/Q1-ci-gate-status.md` (or equivalent) and reference it from the Phase 47 plan-phase output.

**Requirements:** TYPE-01, TYPE-02, TYPE-03, TYPE-04

**Success Criteria** (what must be TRUE):

1. `pnpm --filter frontend type-check` exits 0 on a clean clone of `main` (1580 TS errors → 0). Resolution is by deletion of unused declarations / real type fixes, never by adding `// @ts-ignore` or `// @ts-expect-error` to mask errors.
2. `pnpm --filter backend type-check` exits 0 on a clean clone of `main` (498 TS errors → 0), under the same suppression-free rule.
3. The type-check job runs as a PR-blocking CI gate on both frontend and backend; a PR introducing a single TS error in either workspace fails the merge check on `main`.
4. Net new `@ts-ignore` / `@ts-expect-error` suppressions added during v6.2 are zero outside documented exceptions; any retained suppression carries an inline reason and an issue/follow-up reference.

**Plans:** 11/11 plans complete

- [x] 47-01-frontend-type-fix-PLAN.md — Drive frontend type-check from 1580 to 0 errors (TYPE-01, TYPE-04 frontend half)
- [x] 47-02-backend-type-fix-PLAN.md — Drive backend type-check from 498 to 0 errors (TYPE-02, TYPE-04 backend half)
- [x] 47-03-ci-gate-and-branch-protection-PLAN.md — Split type-check into dedicated CI job, set branch protection on main, smoke-test (TYPE-03, TYPE-04 phase reconciliation)

#### Phase 48: Lint & Config Alignment

**Goal:** Frontend and backend `pnpm lint` exit 0, the ESLint config matches the CLAUDE.md primitive cascade with zero Aceternity references, and lint is restored as a PR-blocking CI gate.

**Depends on:** Phase 47 (type-check zero). Sequencing rationale: lint fixes touch many of the same files as type-check fixes; running on a typed baseline avoids re-doing the same edits twice and prevents lint changes from masking type errors.

**Requirements:** LINT-06, LINT-07, LINT-08, LINT-09

**Success Criteria** (what must be TRUE):

1. `pnpm --filter frontend lint` exits 0 on a clean clone of `main` (52 errors + 671 warnings → 0). Warnings are either fixed at the call site or the rule is downgraded with a written rationale recorded in `frontend/eslint.config.js`.
2. `pnpm --filter backend lint` exits 0 on a clean clone of `main` (3 errors + 1 warning → 0).
3. `frontend/eslint.config.js` contains zero references to Aceternity (`3d-card`, `bento-grid`, `floating-navbar`, `link-preview`); `no-restricted-imports` is aligned with the CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom) and rule messages no longer recommend a banned library.
4. The lint job runs as a PR-blocking CI gate on both frontend and backend; a PR introducing a single lint error in either workspace fails the merge check on `main`.

**Plans:** 3/3 plans complete

- [x] 48-01-config-consolidation-PLAN.md — Delete `frontend/eslint.config.js` shadow config, invert `no-restricted-imports` to ban Aceternity/Kibo UI per CLAUDE.md cascade, delete 3 orphan Aceternity wrappers, add prototype handoff + supabase-generated `contact-directory.types.ts` to root ignores, wire `eslint.config.mjs` into `turbo.json` globalDependencies, create `phase-48-base` git tag (LINT-08)
- [x] 48-02-violation-fixes-PLAN.md — Drive remaining ~30 frontend call-site lint violations + 2 backend errors to zero: `require()` → `vi.importActual` (12 errors / 7 test files), physical Tailwind → logical classes (12 violations / 3 files), 9 stale `eslint-disable` directives deleted, 1 unused import, backend empty-interface → type alias, backend `console.log` → Winston `logInfo` (LINT-06, LINT-07)
- [x] 48-03-ci-gate-and-branch-protection-PLAN.md — Add `Lint` to branch protection `required_status_checks.contexts` via gh api PUT (read-then-merge-then-write per 47-03 §6); open two D-16 smoke PRs (frontend `text-left` + backend `console.log`) and verify `mergeStateStatus=BLOCKED`; run phase-wide D-17 net-new `eslint-disable` audit; resolve STATE.md Phase 47 outstanding follow-up #1 by analogy (LINT-09)

#### Phase 49: Bundle Budget Reset

**Goal:** The `frontend/.size-limit.json` ceiling reflects a real, defensible budget; the initial route loads under it; and `size-limit` is restored as a PR-blocking CI gate.

**Depends on:** Phase 48 (lint zero, primitive cascade aligned). Sequencing rationale: bundle work introduces `React.lazy()` route splits and vendor-chunk changes; doing it on a typed and linted baseline ensures every code-mod is enforced by the same gates that will catch regressions on PRs.

**Requirements:** BUNDLE-01, BUNDLE-02, BUNDLE-03, BUNDLE-04

**Success Criteria** (what must be TRUE):

1. `frontend/.size-limit.json` Total JS ceiling is lowered from 2.43 MB to a real budget (≤500 KB initial-route gzip proposal); the chosen value is documented as the enforced budget, not aspirational.
2. The initial route loads under the new ceiling on a clean `pnpm --filter frontend size-limit` run; heavy chunks are route-split via `React.lazy()` based on the Phase 49 audit, and the existing E2E suite still passes against the new lazy boundaries.
3. The vendor super-chunk is audited; every chunk > 100 KB has a documented rationale recorded in `.size-limit.json` comments or a sibling note (e.g. `frontend/docs/bundle-budget.md`).
4. `size-limit` runs as a PR-blocking CI gate; a PR that adds ≥1 KB to any measured chunk is rejected on `main`.

**Plans:** TBD

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
| 47 | v6.2 | 11/11 | Complete | 2026-05-09 |
| 48 | v6.2 | 3/3 | Complete    | 2026-05-12 |
| 49 | v6.2 | 0/0 | Not started | - |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-05-12 — Phase 48 complete; lint gate restored as PR-blocking branch protection context_
