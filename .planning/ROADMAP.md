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
- 🚧 **v6.4 Stabilization & Carryover Sweep** — Phases 55-59 (in progress)

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

<details>
<summary>✅ v6.3 Carryover Sweep & v7.0 Prep (Phases 50-54) — SHIPPED 2026-05-17</summary>

- [x] Phase 50: Test Infrastructure Repair (10/10 plans) — `vi.mock("react-i18next")` factory uses `vi.importActual` + spread; 4 wizard tests green; `50-TEST-AUDIT.md` + test-setup docs published
- [x] Phase 51: Design-Token Compliance Gate (4/4 plans) — ESLint D-05 bans raw hex + Tailwind palette literals at `error` workspace-wide; 50 Tier-A files swapped to tokens; 271 Tier-C suppressed per-Literal; smoke PR #12 BLOCKED via D-09 fold into Phase 48 `Lint` context
- [x] Phase 52: HeroUI v3 Kanban Migration (5/5 plans) — shared `@dnd-kit/core` primitive; TasksTab migrated; `EngagementKanbanDialog` + `EngagementDossierPage` deleted (KANBAN-02 satisfied-by-deletion D-20); kibo-ui + tunnel-rat purged; 4 EN+AR baselines committed (PASS-WITH-DEVIATION — D-19..D-23 documented)
- [x] Phase 53: Bundle Tightening + Tag Provenance (3/3 plans) — React vendor ceiling 349 → 285 KB gz (measured 279.42 kB); `phase-47/48/49-base` annotated + SSH-signed (`git tag -v` Good); CLAUDE.md Node note `22.13.0+`
- [x] Phase 54: Intelligence Engine Schema Groundwork (4/4 plans) — `intelligence_event` + new `intelligence_digest` (prior renamed `dashboard_digest`) + polymorphic junction + `signal_source_type` enum + regenerated TS types byte-identical across workspaces; schema-only — no API, no UI

Full details: [v6.3-ROADMAP.md](milestones/v6.3-ROADMAP.md)

</details>

<details open>
<summary>🚧 v6.4 Stabilization & Carryover Sweep (Phases 55-59) — IN PROGRESS</summary>

- [ ] **Phase 55: DesignV2 → Main Merge & Gate Enforcement** — Land DesignV2 onto `main` with all v6.3 quality gates intact and verify enforcement on post-merge `main` PR contexts (MERGE-01, MERGE-02)
- [ ] **Phase 56: RLS Closure & Last Typed-Shim Retirement** — Clear the pre-existing `countries` row from `sensitiveTables` (D-54-04) and type `useStakeholderInteractionMutations` at source (RLS-01, TYPE-05)
- [ ] **Phase 57: Phase 52 Deviation Closure (D-19..D-23)** — Resolve mobile touch DnD scope, kanban regression follow-up, LTR/RTL visual baseline byte-distinction, and live tasks-tab Playwright run (DEVIATE-01..04)
- [ ] **Phase 58: Tier-C Design-Token Suppression Full Clear** — Eliminate all 271 `gsd-design-token-tier-c-allow` suppressions (2336 AST nodes) via wave-staged token swaps and remove the waiver from `eslint.config.mjs` (TOKEN-01, TOKEN-02)
- [ ] **Phase 59: Cosmetic + CI Gap Closure** — Refresh Phase 53 SUMMARY/VERIFICATION wording, fix `TweaksDrawer.test.tsx` comment drift, polish `51-VALIDATION.md` frontmatter, and wire `bad-design-token.tsx` + `bad-vi-mock.ts` positive-failure CI assertions (POLISH-01..04)

</details>

## Phase Details

### Phase 55: DesignV2 → Main Merge & Gate Enforcement

**Goal**: DesignV2 lands on `main` and all v6.3 quality gates (type-check, Lint, Bundle Size Check, design-token D-05, react-i18next factory) enforce on every `main` PR context
**Depends on**: Nothing (first phase of v6.4; blocker for 56-59)
**Requirements**: MERGE-01, MERGE-02
**Success Criteria** (what must be TRUE):

1. `git log main --oneline` shows DesignV2 history merged into `main` with no manual cherry-picks
2. `pnpm type-check`, `pnpm lint`, and `Bundle Size Check (size-limit)` all exit 0 on the post-merge `main` HEAD
3. A smoke PR opened against `main` introducing an intentional violation (raw hex, palette literal, or vi.mock factory regression) returns `mergeStateStatus=BLOCKED` from `gh pr view --json`
4. The four v6.3-introduced gate contexts (`type-check`, `Lint`, `Bundle Size Check (size-limit)`, plus the D-09 folded design-token rule inside `Lint`) appear as required contexts on `main` branch protection — UPGRADED per Phase 55 D-13: 8 explicit required contexts (the original 6 + `Design Token Check` + `react-i18next Factory Check`), reversing the v6.3 D-09 fold-into-Lint for failure-attribution clarity

**Plans:** 4 plans (sequential waves 1→4 per D-15 clean causality chain)

Plans:

**Wave 1**

- [x] 55-01-PLAN.md — Pre-merge verification, merge PR creation + green, --no-ff merge, signed phase-55-base tag (Wave 1) — **SHIPPED 2026-05-17**: merge commit `3f763ddc`, phase-55-base SSH-signed, remote DesignV2 deleted

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 55-02-PLAN.md — Add 2 new CI jobs (Design Token Check + react-i18next Factory Check) to ci.yml via separate PR onto main (Wave 2) — **SHIPPED 2026-05-17**: PR #15 merged as `9e4471e3`; both new jobs verified green on post-merge main HEAD CI run 25990939105; MERGE-02 partial (preparation half)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 55-03-PLAN.md — Update main branch protection to require 8 contexts (round-trip JSON; preserve enforce_admins / no-force-push / no-deletions) (Wave 3) — **SHIPPED 2026-05-17**: `gh api -X PUT` round-trip applied; live state confirmed 8 required contexts (6 original + `Design Token Check` + `react-i18next Factory Check`); all security invariants preserved (enforce_admins=true, allow_force_pushes=false, allow_deletions=false, block_creations=false, strict=true); protection-before.json + protection-after.json committed per D-16 audit trail; MERGE-02 still partial (smoke proof = Plan 04)

**Wave 4** _(blocked on Wave 3 completion)_

- [ ] 55-04-PLAN.md — Smoke PR with 4 planted violations, evidence capture (JSON + PNG), cleanup via `gh pr close --delete-branch` (Wave 4)

### Phase 56: RLS Closure & Last Typed-Shim Retirement

**Goal**: `rls-audit.test.ts` passes for `countries` without an acknowledged-fail entry, and the final v6.2-era typed shim is removed in favour of source-typed return shapes
**Depends on**: Phase 55
**Requirements**: RLS-01, TYPE-05
**Success Criteria** (what must be TRUE):

1. `rls-audit.test.ts` exits 0 with `countries` present in the projection but absent from any acknowledged-pre-existing-fail list
2. `grep -r "useStakeholderInteractionMutations" frontend/src` shows zero `as` casts or typed-shim wrappers at consumer sites
3. The underlying `useStakeholderInteractionMutations` hook declares an explicit, non-`any`, non-`Promise.resolve({ success: true })` return type that consumers consume directly
4. `pnpm type-check` exits 0 across both workspaces with the shim removed

**Plans**: TBD

### Phase 57: Phase 52 Deviation Closure (D-19..D-23)

**Goal**: All five Phase 52 PASS-WITH-DEVIATION carryovers (D-19..D-23, excluding the already-closed D-20) reach a verified resolution recorded against the original deviation rows
**Depends on**: Phase 55
**Requirements**: DEVIATE-01, DEVIATE-02, DEVIATE-03, DEVIATE-04
**Success Criteria** (what must be TRUE):

1. Mobile touch DnD on the shared `@dnd-kit/core` kanban primitive either works on a 768×1024 device (touch sensor wired) or has an explicit ADR scoping it out with a mobile read-only fallback in place (D-19)
2. The Phase 39 `kanban-*.spec.ts` Playwright specs run green against the shared `@dnd-kit/core` primitive in CI (D-21)
3. Re-running the kanban EN+AR visual baseline diff produces byte-distinct snapshots between LTR and RTL (no false byte-identity) (D-22)
4. The live tasks-tab Playwright run executes on seeded staging data with a host operator and the artifact (run log, screenshots, summary) lands in the phase folder (D-23)

**Plans**: TBD
**UI hint**: yes

### Phase 58: Tier-C Design-Token Suppression Full Clear

**Goal**: Every `// gsd-design-token-tier-c-allow` suppression in `frontend/src/` is replaced with a real token reference, and the waiver token is removed from `eslint.config.mjs` so `pnpm lint` stays at 0 without it
**Depends on**: Phase 55
**Requirements**: TOKEN-01, TOKEN-02
**Success Criteria** (what must be TRUE):

1. `grep -r "gsd-design-token-tier-c-allow" frontend/src` returns zero matches across all 271 originally-suppressed files / 2336 AST nodes
2. `eslint.config.mjs` no longer references the Tier-C waiver token in any rule config, allowlist, or comment-marker exception
3. `pnpm lint` exits 0 workspace-wide with the waiver removed and the D-05 selectors at `error` severity
4. Wave PRs are organized by surface (forms, tables, charts, drawers, dossier rail) so each wave is independently reviewable and revertable

**Plans**: TBD
**UI hint**: yes

### Phase 59: Cosmetic + CI Gap Closure

**Goal**: Stale v6.3 paperwork is refreshed, documentation drift is corrected, and the bad-design-token + bad-vi-mock fixtures fail CI loudly when their expected lint/test errors stop firing
**Depends on**: Phase 55
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04
**Success Criteria** (what must be TRUE):

1. `53-03-SUMMARY.md` reads `PASS` (not `PASS-WITH-DEFERRAL`) and `53-VERIFICATION.md` records BUNDLE-06 as `verified` (not `verified-local-only`)
2. `TweaksDrawer.test.tsx:6-8` no longer references the (false) claim that the global setup omits `initReactI18next`
3. `51-VALIDATION.md` frontmatter reads `status: passed` with `nyquist_compliant: true` preserved
4. The CI pipeline contains an explicit step that asserts `bad-design-token.tsx` produces an ESLint error and `bad-vi-mock.ts` produces a test failure; CI breaks if either fixture stops failing as expected

**Plans**: TBD

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
| 55 | v6.4 | 3/4 | In Progress | — |
| 56 | v6.4 | 0/0 | Not started | — |
| 57 | v6.4 | 0/0 | Not started | — |
| 58 | v6.4 | 0/0 | Not started | — |
| 59 | v6.4 | 0/0 | Not started | — |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-05-17 — Phase 55 Plan 03 complete (main branch protection now requires 8 contexts via `gh api -X PUT` round-trip; all security-critical fields preserved; protection-before.json + protection-after.json committed as D-16 audit trail; MERGE-02 still partial). Plan 04 (smoke PR) remains._
