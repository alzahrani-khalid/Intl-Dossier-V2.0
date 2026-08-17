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
- ⚠️ **v9.0 Platform Completion & Live Verification** — Phases 86-91 (partial: 3/6 phases, closed 2026-08-15) — [archive](milestones/v9.0-ROADMAP.md)
- 🚧 **v10.0 Trust & Correctness** — Phases 92-104 (in progress, started 2026-08-15)

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

<details>
<summary>⚠️ v9.0 Platform Completion & Live Verification (Phases 86-91) — PARTIAL 2026-08-15</summary>

- [x] Phase 86: Feature Completion (5/5 plans) — MoU create, user-management routes, ConsistencyPanel retired (ADR-008)
- [x] Phase 87: Linear Affordances (10/10 plans) — peek panel + paging, Filter/Display popovers, ⌘K audit, empty states (F23–F26)
- [ ] Phase 88: Security & Hygiene Tail (2/3 plans) — SEC-01 closed; **P88-02 credential rotation carried to v10.0**
- [ ] Phase 89: CI & Test-Debt Burn-Down (6 tickmarkr tasks) — **CI-01/02/04/05 + ORCH-2 a11y proof carried to v10.0**
- [x] Phase 90: CORS Edge-Function Migration (36/36 plans) — all edge functions off wildcard CORS, verdict signed
- [ ] Phase 91: v7.0 Live Verification (0/TBD) — **HARDWARE-GATED, carried to v10.0**

Closed partial: delivered work merged via PR #98 (`e990ed84`); open items carried into v10.0.
Full detail: [milestones/v9.0-ROADMAP.md](milestones/v9.0-ROADMAP.md)

</details>

## Current Milestone: v10.0 Trust & Correctness

**Goal:** Close the gap between what the app appears to do and what it actually does — every failure admits it failed, every advertised write path works, and every surface tells the truth about its data.

**Scope input:** `.planning/audits/live-audit-2026-08-15/INDEX.md` — a six-lane live-app audit (190 route/tab URLs, EN + AR, 370 screenshots, 144 findings, 19 ship-blockers), plus the v9.0 carry-forward table.

**Coverage:** every v1 requirement is mapped to exactly one phase — AUTH, TRUST, WRITE, DEAD, COUNT, NAV, COPY, AR, DATA, DBSEC, CLIENTSEC, CARRY, LIVE. **The count is not restated here**; derive it from the traceability table at the foot of `.planning/REQUIREMENTS.md`, which carries the command (`RULING-P92-19`).

**Sequencing rationale:** Phase 92 first because edge-function JWT rejection (AUTH-02) is the root cause behind several surfaces that look empty, and because you cannot verify anything as a second user without a working logout. Phase 93 next because TRUST-01 — repositories no longer swallowing rejections — is the seam every later error state renders through. The operator-only credential rotation (CARRY-01) is pulled forward into Phase 92 rather than sitting in the CI phase it gates, so it has eleven phases of slack instead of blocking the milestone tail the way it blocked v9.0. Copy and Arabic follow the surface work because you cannot fix the wording of a page that does not render. Database security lands after the frontend is correct so a query regression is attributable to the view change. Test suites go green only once the app under test is correct.

## Phases

- [x] **Phase 92: Session Integrity & Edge-Function Auth** - A user can sign out, a valid session is accepted by every edge function, and a dead session bounces the tab
- [x] **Phase 93: Failure Visibility** - No surface renders a confident empty state over a request that failed
- [ ] **Phase 94: Write Paths** - Every advertised write path — after-actions, intake, kanban, settings, reports — actually writes
- [x] **Phase 95: Routes That Don't Render** - Every route either renders its page or says why it can't; the route tree has one file per slot
- [x] **Phase 96: Real Numbers** - Every count, chart and trend comes from real data and agrees with every other surface (completed 2026-08-17)
- [ ] **Phase 97: Reachability** - Nothing built is unreachable and nothing in the route tree is unowned
- [ ] **Phase 98: Copy Truth** - No database values, no i18n keys, no seed instructions, one date format, project voice rules obeyed
- [ ] **Phase 99: Arabic Coverage** - An Arabic session reads as Arabic: one glossary, localized dates, no English leakage
- [ ] **Phase 100: Security Posture — Database & Client** - RLS is a real boundary for the 207 frontend files that depend on it, and signing out leaves nothing behind on the machine
- [ ] **Phase 101: CI Gates Green** - The suites tell the truth about `main`, and the ones that matter block merges
- [ ] **Phase 102: Staging Data & Debt Tail** - Staging looks like a diplomatic system; the last v9.0 debts are closed
- [ ] **Phase 103: Audit Re-Sweep** - The 2026-08-15 findings are proven closed by re-running the audit that found them
- [ ] **Phase 104: v7.0 Live Verification (HARDWARE-GATED)** - The intelligence stack verified against real GPU inference — does not start until an operator names the host

## Phase Details

### Phase 92: Session Integrity & Edge-Function Auth

**Goal**: A user can sign out, a valid session is accepted by every edge function, and an invalidated session visibly ends.
**Depends on**: Nothing (first phase of v10.0)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CARRY-01
**Success Criteria** (what must be TRUE):

1. A signed-in user can sign out — from the sidebar user card and from `/settings` — and lands on `/login` with the session cleared.
2. A valid session is accepted by every edge function: the 133 `index.ts` files pinning `supabase-js@2.3x` are on `@supabase/supabase-js@2` and pass the caller's token explicitly via `getUser(token)`, and no audited route renders empty because of a 401. Closed by re-deriving the population, never by re-quoting the count — `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l` → `0`.
3. Invalidating the session bounces the open tab to `/login` instead of decaying into a "Member/Member" ghost shell with the admin nav silently removed.
4. `/delegations` renders an error state when its `my-delegations` calls are rejected, and renders real delegations when they are not.
5. The P88-02 credentials are rotated by the operator, with the GitHub Actions secret and `.env.test` updated and a login smoke passing — the gate CARRY-02 and CARRY-05 wait on in Phase 101.

**Plans**: 10 plans
**UI hint**: yes

Plans:

- [x] 92-01-PLAN.md — Wave 0: probe script + baseline (D-16), AUTH-01 RED measurement (D-26), sign-out + delegations forced-error specs
- [x] 92-02-PLAN.md — Mount NavUser, SIGNED_OUT seam (cache clear + lazy nav), /settings add + relabel (AUTH-01/03/05, D-25/28/29)
- [x] 92-03-PLAN.md — /delegations error state distinct from empty (AUTH-04 UI half)
- [x] 92-04-PLAN.md — AUTH-02 core: 3 confirmed-broken + my-delegations + \_shared/auth.ts, deployed + probe flip
- [x] 92-05-PLAN.md — AUTH-02 sweep slice A (access-review-detail → document-versions, 33 files, code-only)
- [x] 92-06-PLAN.md — AUTH-02 sweep slice B (dossier-activity-timeline → inactive-users, 33 files, code-only)
- [x] 92-07-PLAN.md — AUTH-02 sweep slice C (intake-audit-logs → push-device-register, 33 files, code-only)
- [x] 92-08-PLAN.md — AUTH-02 sweep slice D (push-notification-send → working-groups, 30 files, code-only)
- [x] 92-09-PLAN.md — Batch deploy + ledger + two-sided verification (grep → 0 AND live probe)
- [ ] 92-10-PLAN.md — CARRY-01 operator credential rotation + login smoke (blocks nothing)

> Criterion 5 is an operator act, not code. It is scheduled here — ten phases ahead of the work it gates — precisely because it held v9.0's Phase 88 open. The other four criteria do not depend on it and must not wait for it.

**EXECUTED 2026-08-15 — accepted by `RULING-P92-49`.** 9 of 10 plans executed; `92-10` remains open
on the operator. Report: `.tickmarkr/overseer/P92-EXEC-REPORT.md`. Gate drill on the real tree:
21 gates · 21 parsed · **20 exit 0**, the single red being `92-10_g1` (the park).

Read the checkbox as narrowly as the evidence supports:

- **Criteria 1, 2, 3 CLOSED with behavioural evidence** — Playwright specs executed against a running
  app with a real session (`92-signout.spec.ts` 3/3), and 139 real staging deploys probed live
  (0×401 across 11 representatives).

- **Criterion 2 carries a named bound: `PIN-2390-01`.** Its closing derivation greps `--include='index.ts'`
  and truthfully returns 0, but two non-`index.ts` helpers still pin `2.39.0` and are imported by six
  deployed functions. Not an auth regression (service-role client; all six probe non-401).

- **Criterion 4 is HALF-CLOSED.** Its error half is proven live; its data half is parked — `DELEG-01`
  (`my-delegations` reads a relation that does not exist) and `SEED-DELEG-01` (both real delegation
  tables hold 0 rows).

- **Criterion 5 is PARKED**, blocker `E2ECRED-01`. `PARK-EXEC-01` stays open until the operator rotates.
- **RLS row-scoping was never verified behaviourally.** The injected-client guard proves the migration
  did not _remove_ scoping; nothing here proves scoping _works_. 128 of the 139 deployed functions have
  static evidence only. Nothing was verified against production.

- **Unmasked by fixing the 401s, filed rather than fixed:** `DELEG-01`, `DR-42501`, `AUDIT-42703`,
  `PIN-2390-01` (Phase 93); `SEED-DELEG-01` (Phase 102).

### Phase 93: Failure Visibility

**Goal**: No surface renders a confident empty state over a request that failed.
**Depends on**: Phase 92 (many "empty" surfaces are 401s; they must stop being auth failures before their error states can be judged)
**Requirements**: TRUST-01, TRUST-02, TRUST-03, TRUST-04, DELEG-01, DR-42501, AUDIT-42703, PIN-2390-01
**Success Criteria** (what must be TRUE):

1. A rejected query reaches the caller as a rejection: repositories (e.g. `analytics.repository.ts`) no longer catch-and-return `{ data: null }`, so the `isError` branches already written in the pages stop being dead code.
2. `/admin/field-permissions` shows the 19 rules the database holds, and shows an error — never "0 Permissions" — when its query fails; the same holds for `/admin/data-retention`, Tag Analytics, and position attachments.
3. A well-formed but nonexistent record ID renders a page-level not-found state on dossier detail, engagement detail and report builder — not "Check your connection and try again" after 24 skeletons.
4. An engagement dossier whose extension row is missing renders a named, degraded state rather than a titleless chrome shell.
5. No user-facing error contains an internal string — `/tasks/queue` no longer prints the raw supabase-js message.

**Plans**: 15 plans
**UI hint**: yes

Plans:

- [x] 93-01-PLAN.md — Wave 1: phase-93-base tag + shared QueryErrorState + 7 bilingual keys (D-03/D-04; producer for every surface plan)
- [x] 93-02-PLAN.md — Wave 1: my-delegations bilingual error envelope (DELEG-01 visibility-only, D-13) + data-retention `details` strip + 92-spec natural-visit update
- [x] 93-03-PLAN.md — Wave 1: PIN-2390-01 — both 2.39.0 helpers bumped, six importers redeployed, derivation widened to `*.ts` (D-16)
- [x] 93-04-PLAN.md — Wave 2: DR-42501 4-policy migration onto is_platform_admin (D-09/D-10/D-24) + anti-grant gate (D-12/D-23) + probe 200
- [x] 93-05-PLAN.md — Wave 1: AUDIT-42703 — audit-logs-viewer remapped to real audit_log columns, aggregate promoted (D-26), leak fixed (D-15)
- [x] 93-06-PLAN.md — Wave 2: TRUST-01 sites 1-3 (analytics repository) + AnalyticsDashboardPage error.message fix, paired per D-21 + spec
- [x] 93-07-PLAN.md — Wave 2: TRUST-01 sites 4-5 (useDossier counts) + DossierListPage em-dash/error branch, paired per D-21 + spec
- [x] 93-08-PLAN.md — Wave 2: TRUST-01 site 6 (supabase-js .error throws first) + widgetData aggregation isError + CustomDashboardPage + spec
- [x] 93-09-PLAN.md — Wave 3: /admin/field-permissions + /admin/data-retention isError wiring; legal-holds residual ASSERTED by design (D-25) + 4-test spec
- [x] 93-10-PLAN.md — Wave 2: Tag Analytics stub repointed at tag-hierarchy/analytics (D-25) + AttachmentUploader inline error + spec
- [x] 93-11-PLAN.md — Wave 2: DossierShell — first notFound() thrower (D-06) + error state; one edit covers 7 dossier layouts + spec
- [x] 93-12-PLAN.md — Wave 2: engagement-dossiers degraded-200 contract (producer) → WorkspaceShell 3-state render (D-06a/D-07) + fixture spec
- [x] 93-13-PLAN.md — Wave 2: report builder loader + by-id fetch + notFound + route errorComponent (no analog; WRITE-06 42P17 hazard stated) + spec
- [x] 93-14-PLAN.md — Wave 2: criterion-5 three seams (D-22) — bucket-(a) sweep, router defaultErrorComponent, global mutation onError + /tasks/queue spec
- [x] 93-15-PLAN.md — Wave 4: closing derivations with populations (D-18), full spec+probe run, gate drill, intended-broken register

### Phase 94: Write Paths

**Goal**: Every advertised write path actually writes, and a failed write says so.
**Depends on**: Phase 92 (JWT), Phase 93 (a failed write must surface as a failure)
**Requirements**: WRITE-01, WRITE-02, WRITE-03, WRITE-04, WRITE-05, WRITE-06, AUDIT-DROP-01, AUDIT-ZERO-01, ARMA-01

> The three trailing ids were filed during Phase 93 and assigned to this phase in `REQUIREMENTS.md`
> (§AUDIT-DROP-01 / §AUDIT-ZERO-01 under WRITE; `ARMA-01` "Owner: Phase 94 — Write Paths, alongside
> `WRITE-06`"). They were never carried onto this line; added 2026-08-16 during Phase 94 planning so
> the roadmap and the requirement register agree. `ARMA-01` rides with `WRITE-06` — its arm-(b)
> deletion belongs in the same plan, ordered after the `42P17` fix.

**Success Criteria** (what must be TRUE):

1. An after-action record can be created, saved and published from the engagement UI — `AfterActionForm.tsx:131`'s `if (!initialData) return` no longer pins `isDirty` false in create mode, and the route passes `canPublish` + `onPublish`.
2. `/after-actions` lists records and a detail page renders translated copy instead of the raw `afterActions.loadError` key.
3. `/intake/new` submits: the dossier picker writes to the field the schema reads, so "Linked to: OECD" and "At least one dossier is required" cannot appear together.
4. A commitment drag persists exactly when the DB's own state machine permits it; a drag the trigger would coerce is refused before the write with the real bilingual reason; the stored value always equals either what was written or what the user was told; never a success signal followed by a snap-back — and never "Operation completed successfully" on a no-op. (Reworded from "persists against the four-value lifecycle" per `RULING-P94-03` order 2 — the live lifecycle is FIVE values incl. `overdue`, and "no error shown" is insufficient to pass; the oracle includes the coercion case.)
5. Every `/settings` tab saves (population stated: the nine SettingsPage sections through the shared Save; child routes are a named exclusion) and the value survives a reload; report reads, custom-report CRUD and scheduled-report creation work without a `42P17`. (Second half scoped to the REAL surfaces per `RULING-P94-04` §PARK-94-06 — the `reports` POST is a mock, filed as `DEAD-09`; the field rename ships only paired with an honest terminal state.)

**Plans**: 11 plans in 5 waves
**UI hint**: yes

Plans:

- [x] 94-01-PLAN.md — W1: WRITE-01 after-action create-mode Save + canPublish/onPublish wiring
- [x] 94-02-PLAN.md — W1: WRITE-03 intake zod relaxation + shouldValidate + register correction
- [x] 94-03-PLAN.md — W1: WRITE-04 core — commitment-stage guard, mutation reject (2 bilingual keys), no-op fix
- [x] 94-04-PLAN.md — W1: WRITE-05 settings .update() fix + reload-persistence spec (population stated)
- [x] 94-05-PLAN.md — W1: WRITE-06 42P17 migration + D-22 two-sided probe + ARMA-01 arm-(b) deletion
- [x] 94-06-PLAN.md — W1: AUDIT helpers (edge \_shared/audit.ts + backend audit_log/mou repairs + backend test)
- [x] 94-07-PLAN.md — W2: WRITE-02 list two-query rewrite + deploy + i18n colon-form + degraded row + corrections
- [x] 94-08-PLAN.md — W2: WRITE-04 droppable predicate (own-column carve-out) + read-back probe + parity oracle
- [x] 94-09-PLAN.md — W3: WRITE-06 generate surface — template→type paired with terminal state + DEAD-09 filing
- [x] 94-10-PLAN.md — W4: AUDIT-ZERO fleet — 27 edge writers repaired + redeployed + ledger + register corrections
- [x] 94-11-PLAN.md — W5: closing derivations with populations, full oracle run, gate drill, intended-broken register

### Phase 95: Routes That Don't Render

**Goal**: Every route either renders its page or says why it can't, and the route tree has one owner per slot.
**Depends on**: Phase 92, Phase 93
**Requirements**: DEAD-01, DEAD-02, DEAD-03, DEAD-04, DEAD-08, DEAD-09, NOTFOUND-COMPONENT-01, RETENTION-CAST-01
**Success Criteria** (what must be TRUE):

1. `/search` returns results for a typed query and for each of its own suggestion chips, with no `Cannot read properties of undefined (reading 'forEach')`.
2. `/tasks/queue` renders its queue against a deployed `assignments-queue` function.
3. `/scenario-sandbox` either loads or shows an error — a backend 500 is never pixel-identical to "still loading".
4. `/monitoring` resolves to the SPA route rather than raw proxy JSON, or the route is removed from the tree with the decision recorded.
5. `/positions/:id` and the legislation detail page are reachable: one route file per slot (`$id.tsx` vs `$positionId.tsx` resolved), `legislation.tsx` renders an `<Outlet/>`, and the positions `approvals`/`versions` children drive tab state.

**Plans**: 9 plans (planned 2026-08-16; wave 1 = 01-08 file-disjoint, wave 2 = 09 closing)

Plans:
**Wave 1**

- [x] 95-01-PLAN.md — W1: DEAD-01 search envelope adapter + real related-work + page error branch + e2e (criterion 1)
- [x] 95-02-PLAN.md — W1: DEAD-02 queue transport fix + assignments-queue deploy with probe evidence + e2e (criterion 2)
- [x] 95-03-PLAN.md — W1: DEAD-03 sandbox QueryErrorState retrofit + bounded retry + CDP e2e (criterion 3)
- [x] 95-04-PLAN.md — W1: DEAD-04 keep+narrow per RULING-P95-01 — /api/monitoring move, proxy delete, nginx check, e2e (criterion 4)
- [x] 95-05-PLAN.md — W1: DEAD-08 slot consolidation ($id survives) + legislation Outlet + URL-driven tabs + e2e (criterion 5)
- [x] 95-06-PLAN.md — W1: DEAD-09 real report generation (storage + signed url) + truthful states + deploy probe (filed-finding close)
- [x] 95-07-PLAN.md — W1: NOTFOUND-COMPONENT-01 custom ESLint rule + positive/negative controls (filed-finding close)
- [x] 95-08-PLAN.md — W1: RETENTION-CAST-01 six validate-or-throw unwraps + asRows reconcile + unit oracle (filed-finding close)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 95-09-PLAN.md — W2: closing derivations with populations, gate drill, DEAD-04 record for P97, register close-outs

**UI hint**: yes

### Phase 96: Real Numbers

**Goal**: Every count, chart and trend on screen comes from real data and agrees with every other surface.
**Depends on**: Phase 93, Phase 94 (the kanban mutation seam is where `status`/`workflow_stage` diverge), Phase 95
**Requirements**: DEAD-05, DEAD-06, DEAD-07, COUNT-01, COUNT-02, COUNT-03, COUNT-04, TRIGSWEEP-01, SANDBOX-500-01
**Success Criteria** (what must be TRUE):

1. `/analytics` shows real data or is honestly disabled — no fabricated sparklines, donuts or "Insights you'll gain" over a backend endpoint that does not exist.
2. `/custom-dashboard` queries columns that exist (`calendar_entries.event_date`), renders its chart, and shows trend deltas computed from completed requests rather than "0.0%" from aborted ones.
3. `/calendar` renders a grid, `/calendar/new` mounts the create form, `/events` pads the month by the real weekday offset with working month navigation, and `/word-assistant`'s status badge reflects a live probe.
4. The dashboard KPI, the `/my-work` badge, footer and rendered rows, the `/commitments` tabs and the kanban board report the same number for the same work.
5. A dossier without an extension row appears in both its type list and the hub count (persons 16/16, engagements 5/5), and a completed task leaves the dashboard's Overdue widget and lands in kanban Done.

**Plans**: 11 plans (3 waves)

Plans:

**Wave 1**

- [x] 96-01-PLAN.md — SANDBOX-500-01: break the 42P17 RLS recursion (P94 definer precedent), two-sided proof, working sandbox
- [x] 96-02-PLAN.md — COUNT-04 DB half: INSERT-gap trigger re-timing + RPC count truth (fulfillment bucket, Done semantics, stored-overdue arm)
- [x] 96-03-PLAN.md — DEAD-06: calendar_entries.event_date fix + truthful trend deltas + CDP oracle
- [x] 96-04-PLAN.md — DEAD-07 (calendar): calendar layout Outlet, grid-always, /events offset + month nav
- [x] 96-10-PLAN.md — COUNT-02: type-list path classification + SC5 no-extension-row fixture oracle
- [x] 96-11-PLAN.md — TRIGSWEEP-01: behaviour classifier + both-direction control drill artifact

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 96-05-PLAN.md — DEAD-07 (completes): word-assistant three-state live-probe pill + the 4-test family spec
- [x] 96-06-PLAN.md — DEAD-05 Branch A: analytics repoint to the deployed edge fn, fabrication removal, branch-invariant oracle
- [x] 96-07-PLAN.md — COUNT-01: dashboard-stats truth migration, /commitments + /my-work reconciliation, same-clock agreement spec
- [x] 96-08-PLAN.md — COUNT-03 verify-not-build: three-way parity, writer sweep (STATUS_TO_STAGE), divergent-row repair

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 96-09-PLAN.md — COUNT-04 render half: one-signal badge, chip==badges same-clock, phase-close c9b sweep

**UI hint**: yes

### Phase 97: Reachability

**Goal**: Nothing built is unreachable, and nothing in the route tree is unowned.
**Depends on**: Phase 92 (settings nav), Phase 95 (`/monitoring` keep-or-delete decision)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):

1. All 8 declared dossier types — Elected Officials included — appear in the sidebar, the dossier hub type cards, `/dossiers/create` and `/compare`.
2. Every `/settings/*` page renders navigation: the prefix check that hides the global sidebar and the exact-match check that renders the settings nav agree.
3. The engagement Digests tab appears in the tab bar, and every list page exposes a create affordance (currently 7 of 8 have none).
4. Every route with no inbound link is resolved — the 9 admin routes and `/monitoring` each get a nav entry or are deleted, with the decision recorded per route.

**Plans**: TBD
**UI hint**: yes

### Phase 98: Copy Truth

**Goal**: The UI speaks to users, not to developers — one vocabulary, one date format, the project's own voice.
**Depends on**: Phase 95, Phase 96, Phase 97 (copy is judged on surfaces that render)
**Requirements**: COPY-01, COPY-02, COPY-03, COPY-04, COPY-05
**Success Criteria** (what must be TRUE):

1. No database value renders as user copy — `in_progress`, `action_item`, `follow_up`, `email`, `human_entered`, `WEEK OF 2026-W27` all resolve through display labels.
2. No raw i18n key reaches the screen in either locale — `regions.Europe`, `afterActions.loadError`, `CALENDAR.RECURRENCE.TITLE`, `common.loading` and the five `entityLinks.*` keys included.
3. No seed or test instruction ships as user copy: the 4 `dashboard-widgets.json` strings are rewritten in both locales.
4. Copy obeys the project's voice rules — sentence case, zero exclamation marks (46 today), zero first-person plural (8 today), no retired terminology such as the `"Deadline / Due Date"` chip.
5. Every date renders `Tue 28 Apr` and every time `14:30 GST` from the one shared formatter — the seven competing formats are gone — and dev affordances like "Fill with Mock Data" are absent from a production build.

**Plans**: TBD
**UI hint**: yes

### Phase 99: Arabic Coverage

**Goal**: An Arabic session reads as Arabic — one glossary, localized dates, no English leakage. (RTL layout infrastructure is already verified sound and is out of scope.)
**Depends on**: Phase 98 (the EN namespaces settle first; `ar` mirrors them)
**Requirements**: AR-01, AR-02, AR-03, AR-04
**Success Criteria** (what must be TRUE):

1. Each core object has exactly one Arabic term across every namespace — dossier is one word, not دوسيه / ملف / دوسييه — and a nav label matches the title of the page it opens.
2. Dates and times render in Arabic with no English weekday or month names inside Arabic sentences (Latin digits remain deliberate policy).
3. No English string renders under `dir="rtl"` on an otherwise-Arabic screen — the 404 page, intake queue header and primary button, position read-only banner and search suggestion chips included.
4. No `t()` call resolves through a dot-form key with an English default, so a missing Arabic key shows as missing rather than silently rendering English in both languages.

**Plans**: TBD
**UI hint**: yes

### Phase 100: Security Posture — Database & Client

**Goal**: RLS is a real authorization boundary for the 207 frontend files that rely on it as the only one — **and the browser stops retaining the previous user's data after sign-out.** Two boundaries, one phase: the server-side boundary that decides what a caller may read, and the client-side residue that survives the caller leaving.
**Depends on**: Phase 94 (the `custom_reports` ↔ `report_shares` recursion is fixed there); otherwise independent — sequenced late so a query regression is attributable to the view change, not the frontend.
**Requirements**: DBSEC-01, DBSEC-02, DBSEC-03, DBSEC-04, DBSEC-05, CLIENTSEC-01
**Success Criteria** (what must be TRUE):

1. Every client-reachable `SECURITY DEFINER` view is converted to `security_invoker`, restricted, or justified in writing — including `unified_work_items`, whose 10 frontend consumers still return the caller's correct rows afterwards.
2. No view exposes `auth.users` to `anon` or `authenticated` — `upcoming_milestones` and the frontend-queried `entity_comments_with_details` included.
3. No materialized view is selectable by `anon` or `authenticated`; the 12 are revoked or moved behind a gated RPC.
4. `intelligence_email_queue` and `events.idempotency_keys` have policies matching intent instead of RLS-enabled-with-no-policies denying everything.
5. Leaked-password protection is enabled and the 548 mutable-`search_path` functions are pinned; Supabase advisors report clean on these classes.
6. **Signing out clears client-side residue.** `localStorage` no longer retains the previous user's state — the six persisted zustand stores (`auth-storage`, `entity-history-storage`, `ui-storage`, `pinned-entities-storage`, `dossier-store`, and the duplicate in the dead `services/auth.ts`) and the raw writers (`advanced-search-history`, `quickswitcher_recent_items`) are cleared, so the next user on a shared analyst workstation cannot see which dossiers the previous analyst opened or what they searched for. Phase 92 closed the in-memory query-cache half at the sign-out seam; this is the persisted half it deliberately did not sweep.

**Plans**: TBD

### Phase 101: CI Gates Green

**Goal**: The test suites tell the truth about `main`, and the ones that matter block merges.
**Depends on**: Phase 92 (CARRY-01 rotation gates CARRY-02 and CARRY-05), Phase 100 (the app under test is correct before the suites are made green)
**Requirements**: CARRY-02, CARRY-03, CARRY-04, CARRY-05, CARRY-09
**Success Criteria** (what must be TRUE):

1. The E2E suite runs green against the deployed app, or each failing spec carries an in-spec quarantine with a tracked reason.
2. The integration suite runs green, with decision D-3 (the missing local Supabase DB at `localhost:54321`) resolved and recorded.
3. At least one a11y spec is demonstrated PASSING with its run evidence — not skipped, not annotated. No a11y spec has ever been shown green.
4. `test-rtl-smokes` is a required branch-protection context on `main`, proven by a smoke PR observed `BLOCKED`.
5. Every currently-red non-required suite on `main` — E2E, integration, Accessibility (RTL + WCAG AA), RTL Portal + Component Smokes, RTL + Responsive, Docker Build — is green or honestly quarantined with a reason.

**Plans**: TBD

### Phase 102: Staging Data & Debt Tail

**Goal**: Staging reads as a diplomatic system rather than test residue, and the last v9.0 debts are closed.
**Depends on**: Phase 101 (purge the fixtures after the suites are green, then re-run them — purging first would fight the stabilization)
**Requirements**: DATA-01, DATA-02, SEED-DELEG-01, CARRY-06, CARRY-07, CARRY-08
**Success Criteria** (what must be TRUE):

1. `/users` lists real staff: the ~415 `*@example.com` / `*@gastat.test` fixture accounts are gone and the E2E suite deletes the accounts it creates.
2. No record visible in the UI names an internal artifact — "Phase 70 staging verification digest", "Phase 52 Kanban Fixture Engagement", "E2E MoU 1783364705954", "UAT round-11 commitment".
3. Dashboard visual snapshots survive a date change: the frozen-clock vs server-`NOW()` divergence is removed. Regenerating baselines is explicitly not a fix.
4. The entry chunk is back under the 476 KB budget and the budget is lowered to match (raised to 500 KB at v9.0 close; actual 493.71 kB gzipped).
5. The three data-entry quick tasks `260530-w2/w3/w4` are completed or formally retired, each with a SUMMARY.

**Plans**: TBD

### Phase 103: Audit Re-Sweep

**Goal**: The 2026-08-15 findings are proven closed by re-running the audit that found them, rather than assumed closed by the phases that touched them.
**Depends on**: Phase 102 (every other v10.0 phase is complete)
**Requirements**: none new — this phase re-verifies all 55 non-LIVE v10.0 requirements against live observation
**Success Criteria** (what must be TRUE):

1. `.planning/audits/live-audit-2026-08-15/probe.mjs` has been re-run over the audited route set in EN and AR under `00-BRIEF.md`'s method, and its output sits beside the original audit.
2. Each of the 19 ship-blockers is re-checked at its cited route and recorded closed, still-open, or deliberately deferred with a named reason.
3. The re-sweep produces no new P0 finding; any new P0 is filed as a phase or quick task before the milestone closes.
4. Every v10.0 requirement outside LIVE is marked verified against a named observation from the re-sweep, or carried with a reason — no requirement closes on assertion alone.

**Plans**: TBD

### Phase 104: v7.0 Live Verification (HARDWARE-GATED)

**Goal**: The v7.0 intelligence stack is verified against real GPU inference under the caller's own clearance.
**Depends on**: an operator-confirmed on-prem GPU host. Depends on no v10.0 phase, and no v10.0 phase depends on it.
**Requirements**: LIVE-01, LIVE-02, LIVE-03
**Success Criteria** (what must be TRUE):

1. vLLM (Gemma-4-12B) and TEI (BGE-M3) serve with passing health checks and the agent-runtime on `:4100` reaches both.
2. The v7.0 eval harness runs against live inference and meets its CI thresholds (EVAL-01/02/03).
3. The copilot reads and HITL-writes under the caller's JWT against the live stack, with an L1 caller's results demonstrably a strict subset of an L3 caller's.

**Plans**: TBD

> **GATE — read before planning this phase.** These three requirements have no code blocker; they are blocked on hardware that does not exist yet. They blocked v9.0's Phase 91 for 40 days without a single plan being written. `/gsd:plan-phase 104` must not run until an operator has named a target GPU host with a date.
>
> **Recommendation: do not hold v10.0 for this.** If the host is still undecided when Phase 103 closes, ship v10.0 with LIVE-01/02/03 carried to v11.0 — every v1 requirement except those three. Nothing else in this milestone depends on them, and every prior milestone that waited on this hardware paid for the wait with a partial close.

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
| 86-91 | v9.0 | 54/57 | Partial (3/6 phases) | 2026-08-15 |
| 92-104 | v10.0 | 0/TBD | In progress | - |
| 92. Session Integrity & Edge-Function Auth | v10.0 | 0/TBD | Not started | — |
| 93. Failure Visibility | v10.0 | 0/TBD | Not started | — |
| 94. Write Paths | v10.0 | 0/TBD | Not started | — |
| 95. Routes That Don't Render | v10.0 | 0/TBD | Not started | — |
| 96. Real Numbers | v10.0 | 11/11 | Complete   | 2026-08-17 |
| 97. Reachability | v10.0 | 0/TBD | Not started | — |
| 98. Copy Truth | v10.0 | 0/TBD | Not started | — |
| 99. Arabic Coverage | v10.0 | 0/TBD | Not started | — |
| 100. Security Posture — Database & Client | v10.0 | 0/TBD | Not started | — |
| 101. CI Gates Green | v10.0 | 0/TBD | Not started | — |
| 102. Staging Data & Debt Tail | v10.0 | 0/TBD | Not started | — |
| 103. Audit Re-Sweep | v10.0 | 0/TBD | Not started | — |
| 104. v7.0 Live Verification (HARDWARE-GATED) | v10.0 | 0/TBD | Not started | — |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-08-15 — v10.0 Trust & Correctness roadmapped: 13 phases (92-104), all v1 requirements mapped (count derived in `REQUIREMENTS.md`), scoped from the 2026-08-15 live-app audit (144 findings, 19 ship-blockers) plus the v9.0 carry-forward table._
