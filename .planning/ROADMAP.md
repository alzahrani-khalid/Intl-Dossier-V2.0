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
- 🚧 **v8.1 Linear Design Refinement** — Phases 81-84 (in progress, started 2026-07-04)

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

### 🚧 v8.1 Linear Design Refinement (Phases 81-84) — IN PROGRESS

**Milestone Goal:** Land the signed-off corrective design-refinement workstream (visible bugs + Linear spec-compliance) with zero regressions across dark-canonical + light and EN/LTR + AR/RTL. Source of truth: `DESIGN-REFINEMENT-PLAN-260704.md` (findings F1–F15 + F22; user sign-off §7). Corrective only — F16–F21 taste calls (separate previews-only lane, none pre-approved) and F23–F26 affordance enhancements (later milestone) are explicitly OUT.

- [x] **Phase 81: Visible Bugs** - Fix the 5 visible design bugs from the 6-route Linear audit (kanban 4-column clipping, duplicate settings header, duplicate calendar create button, raw enum status pills, KPI label wrap) (completed 2026-07-04)
- [x] **Phase 82: Date/Number Formatting** - Centralize date/time on the spec's day-first no-comma + GST rule, migrate the ~66 ad-hoc `toLocaleDateString` sites, add a regression guard, fix the mixed-script Arabic overdue unit (completed 2026-07-04)
- [x] **Phase 83: Token-Debt Consolidation** - Consolidate systemic token debt in charts/graphs/aceternity-kit onto design-system tokens (verified carve-outs untouched) (completed 2026-07-05)
- [x] **Phase 84: Copy / Marketing Voice** - Copy-edit `i18n/en` off marketing voice; `en` drives `ar` (completed 2026-07-05)

### Phase 81: Visible Bugs

**Goal**: Fix the visible design bugs from the 6-route Linear audit with zero regressions, dark+light, EN/LTR + AR/RTL
**Depends on**: Nothing (first phase of v8.1)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05
**Success Criteria** (what must be TRUE):

1. All four kanban columns (incl. "Done"/"مكتمل") are fully reachable and unclipped at 1400px and 1024px, in EN/LTR and AR/RTL; empty columns still show header + `0`
2. The settings page shows exactly one "Profile Settings" title + description
3. The calendar view exposes exactly one primary create-event action
4. No raw DB enum strings render as user-visible labels — the dashboard "Week Ahead" status pills (`preparation`, `follow_up`) read as human, sentence-case labels in both languages
5. KPI labels render on a single line at 1024px (e.g. "ACTIVE ENGAGEMENTS" no longer wraps)
   **Plans**: 3 plans

Plans:

- [x] 81-01-PLAN.md — BUG-01 kanban 4-column overflow: flexible column basis + visible logical inline-scroll affordance
- [x] 81-02-PLAN.md — BUG-02 settings duplicate header + BUG-03 calendar duplicate create button (removals, keepers: page-level title / PageHeader action)
- [x] 81-03-PLAN.md — BUG-04 Week Ahead lifecycle status i18n keys (EN+AR, coverage test) + BUG-05 KPI single-line labels at 1024
      **UI hint**: yes

### Phase 82: Date/Number Formatting

**Goal**: Centralize date/time on the spec's day-first no-comma + GST rule, migrate the ~66 ad-hoc `toLocaleDateString` sites, add a regression guard, and fix the mixed-script Arabic overdue unit under the LOCKED Latin-digit policy (unit localized `يوم`, via `lib/format-locale`)
**Depends on**: Nothing (independent bucket; milestone order only)
**Requirements**: FMT-01, FMT-02, FMT-03, FMT-04
**Success Criteria** (what must be TRUE):

1. The dashboard greeting and Intelligence Digest read day-first no-comma dates (e.g. "Sat 4 Jul") with `14:30 GST` times, emitted by `lib/format-date.ts` as the single formatter
2. Grep finds no ad-hoc `toLocaleDateString` outside the central formatter (incl. the two direct format-string offenders in `meeting-minutes/MeetingMinutesCard.tsx` and `Briefs/BriefsPage.tsx`) — the app is internally consistent with list rows
3. A lint/grep guard is active and fails on new raw `toLocaleDateString` usage outside the central formatter
4. Arabic kanban cards show a localized unit (`يوم`/`ي`) after Latin digits — no bare Latin `d`; digits stay Latin per the locked policy (§7.4)
   **Plans**: 7 plans
   - [x] 82-01-PLAN.md — lib foundations: format-date correction + formatDayFirstYear/formatDateTime, toFormatLocale → 'ar-u-nu-latn', relativeTime Latin digits (Wave 1)
   - [x] 82-02-PLAN.md — date-site migration, components slice 1: analytics/sla-monitoring/audit/tasks/stakeholder + chart and SLA 'ar-SA' numbers (Wave 2)
   - [x] 82-03-PLAN.md — date-site migration, components slice 2: calendar/dashboard-widgets/dossier/commitments + AfterActionsTable overlap (Wave 2)
   - [x] 82-04-PLAN.md — date-site migration, pages/routes: dashboard greeting + Digest, WeekAhead, my-work numbers, BriefsPage/MyTasks overlaps (Wave 2)
   - [x] 82-05-PLAN.md — digit policy sweep: KCard card.overdueBy key, toArDigits deletion, 12 Indic test flips (Wave 3)
   - [x] 82-06-PLAN.md — regression guard scripts/check-date-formatting.mjs + lint wiring + AR render verification (Wave 4)
   - [x] 82-07-PLAN.md — date-site migration, components slice 2 of 4: legislation/timeline/compliance/meeting-minutes + ClassificationBar + MeetingMinutesCard + month-first stragglers (Wave 2)
         **UI hint**: yes

### Phase 83: Token-Debt Consolidation

**Goal**: Consolidate systemic token debt in charts, relationship graphs, and the aceternity `components/ui/` kit onto design-system tokens
**Depends on**: Nothing (independent bucket; milestone order only)
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04, DEBT-05, DEBT-06, DEBT-07, DEBT-08
**Success Criteria** (what must be TRUE):

1. A spec-audit re-run shows the systemic classes — raw hex, Tailwind color literals, banned card shadows, hardcoded radii, gradients, bespoke token ladders, `!important` row heights, user-visible emoji — drop to clean/minor
2. Chart and graph series colors resolve through a shared `--chart-1…n` semantic token module (recharts fills + graph node palettes; no raw hex)
3. The bespoke parallel token ladders in `styles/modern-nav-tokens.css` and `components/copilot/copilot-theme.css` are deleted as ladders — those files consume design-system tokens; row heights obey `var(--row-h)` (no `!important` px overrides)
4. The verified carve-outs are byte-untouched and the three-copy CI parity guard stays green (see carve-outs below)
5. Zero visual regressions across dark+light × EN/AR
   **Plans**: 7 plans
   - [x] 83-01-PLAN.md — dead-code deletion: 9 zero-importer ui files + timeline dir + vertical-timeline.css + App.css + dep removal (closes DEBT-07 !important half) (Wave 1)
   - [x] 83-02-PLAN.md — chart-palette token module: --chart-1..8 across all three holders + parity-guard extension + contrast tests (Wave 1)
   - [x] 83-03-PLAN.md — analytics + widgets slice: recharts hex→tokens, tile literals→@theme, shadows, BenchmarkPreview flattens (Wave 2)
   - [x] 83-04-PLAN.md — graphs + dossier slice: React Flow palettes→tokens, graph shadows/gradient, emoji→lucide (DEBT-08) (Wave 2)
   - [x] 83-05-PLAN.md — shadow/radius/gradient long-tail + expandable-card literals (surgical list-pages.css :294 only) (Wave 2)
   - [x] 83-06-PLAN.md — modern-nav + copilot: bespoke ladder deletion, consumers→DS tokens, demo flatten (DEBT-06) (Wave 2)
   - [x] 83-07-PLAN.md — eslint carve-out tightening + all re-audit gates + Playwright/re-baseline + render-parity checkpoint (Wave 3)
         **UI hint**: yes

**Carve-outs (DO NOT TOUCH — verified, Plan §6):**

- `styles/list-pages.css` `[class~=…]` compat shim (251 Tailwind-literal matches) — deliberate compat infra; "normalizing" it breaks working infra
- `types/*` migration comments (`// was #…` / `gradient →`) — provenance comments, not live style
- `design-system/tokens/` + `index.css` `:root` fallback + `public/bootstrap.js` literal palette holders — legitimately hold the Linear palette; parity-checked in CI (three-copy byte-match)

### Phase 84: Copy / Marketing Voice

**Goal**: Copy-edit `i18n/en` off marketing voice; `en` drives `ar`
**Depends on**: Nothing (independent bucket; milestone order only)
**Requirements**: COPY-01
**Success Criteria** (what must be TRUE):

1. Grep of `i18n/en` JSON for `Discover|Easily|Unleash|!` returns only false positives (e.g. destructive "cannot be easily undone" warnings)
2. `empty-states.json` + `guided-tours.json` read as sentence-case, no-exclamation prose ("Let us show you around" and marketing phrasing removed)
3. The `ar` strings follow the corrected `en` source
   **Plans**: 1 plan

Plans:

- [x] 84-01-PLAN.md — Copy-edit 4 en namespaces off marketing voice + mirror calm register into ar (values only, D-84-09 carve-out)

---

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
| 81 | v8.1 | 3/3 | Complete | 2026-07-04 |
| 82 | v8.1 | 7/7 | Complete | 2026-07-04 |
| 83 | v8.1 | 7/7 | Complete | 2026-07-05 |
| 84 | v8.1 | 1/1 | Complete   | 2026-07-05 |

<!-- gsd:progress:end -->

### Phase 85: Linear taste refinements (F16-F21)

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 84
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 85 to break down)

---

_Roadmap last updated: 2026-07-04 — v8.1 Linear Design Refinement roadmap created (Phases 81-84; 18/18 v1 requirements mapped 1:1 per `DESIGN-REFINEMENT-PLAN-260704.md` sign-off §7). Next: `/gsd:plan-phase 81`._
