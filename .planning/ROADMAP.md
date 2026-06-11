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
- 🔄 **v6.5 Escalated Backlog Hardening** — Phases 60-61 (in progress) — source: `reports/escalated-backlog-master-2026-06-10.md`

## Phases

### Phase 60: Schema & Type Truth Restoration ✅ COMPLETE 2026-06-10

**Goal:** The repo's generated types, committed migrations, and edge-function SQL all agree with the live staging database — every RPC/table an edge function references exists in generated types, and the missing canonical SQL is committed as forward migrations.
**Depends on:** Nothing (foundation phase; unblocks P2-P8 backlog phases)
**Plans:** 6/6 complete (VERIFICATION passed 14/14)
**Requirements:** Backlog P1 (reports/escalated-backlog-master-2026-06-10.md)

Plans:

**Wave 1**

- [x] 60-01-PLAN.md (Wave 1) — Capture unified work stack (view + RPCs) from live into a forward migration [my-work #3]
- [x] 60-02-PLAN.md (Wave 1) — Corrected SLA monitoring migration (users.full_name, not staff_profiles) + 4 dashboard RPCs + fix/redeploy escalations-report absent columns [sla #2/#4, tq #5]
- [x] 60-03-PLAN.md (Wave 1) — event_details view (035 shape + organizer/country via dossiers) + supersede dead 009_data_library [events #4, data-library #1]
- [x] 60-04-PLAN.md (Wave 1) — pending_role_approvals + position_delegations + word_assistant_logs tables (owner-scoped RLS, no auth.users trigger) [approvals #6, wa #4]

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 60-05-PLAN.md (Wave 2) — Regenerate database.types byte-identical (frontend+backend) + remove dead doubled-path copy + type-check both workspaces [P1 type regen]

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 60-06-PLAN.md (Wave 3) — CI smoke test: every edge-fn .from/.rpc reference must exist in generated types (wired into existing lint job)

Scope:

- Regenerate `frontend/src/types/database.types.ts` from staging (project `zkrcjzdemdmwhearhfgg`) via Supabase MCP `generate_typescript_types`
- Commit missing canonical SQL as forward migrations: unified work view/RPCs (`unified_work_items`, `get_unified_work_items`, `get_user_work_summary`, `get_user_productivity_metrics`) [my-work #3], 4 SLA dashboard RPCs (`get_sla_dashboard_overview` etc.) [sla #2], `event_details` view [events #4]
- Reconcile dual `009_create_data_library_items.sql` vs `009_data_library.sql` (query staging FIRST to decide which schema is live) [data-library #1]
- Generate-or-migrate ungenerated tables: `pending_role_approvals`, `position_delegations`, `word_assistant_logs` [approvals #6, wa #4]
- Fix RPC SQL referencing absent columns: `staff_profiles.full_name` (SLA assignee/at-risk) [sla #4], escalations-report columns (`assignments.organizational_unit_id`, `organizational_units.name`) [tq #5]
- Add CI smoke test: every RPC/table an edge fn references must exist in generated types

### Phase 61: Security Pass

**Goal:** The four known security holes are closed: activity_stream inserts are bound to the authenticated actor with visibility scope enforced, briefing-books HTML output is sanitized, the test-token ExportDialog is gone, and admin-surface role gating reads one canonical role source.
**Depends on:** Phase 60 (regenerated types)
**Plans:** TBD
**Requirements:** Backlog P2 (reports/escalated-backlog-master-2026-06-10.md)

Scope:

- `activity_stream` RLS: bind `actor_id = auth.uid()` WITH CHECK; enforce `visibility_scope` [activity #1]
- Sanitize `supabase/functions/briefing-books/index.ts` HTML generation [bb #9]
- Delete or rewire `frontend/src/components/export/ExportDialog.tsx` (hard-codes `Bearer test-auth-token`) [exp #6]
- Unify role source (users.role vs auth metadata) for /admin/\*, Sidebar, /users, /audit-logs + decide/enforce gating [settings #4/#5, audit #4]

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

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-06-10 — Phase 60 (Schema & Type Truth Restoration) COMPLETE: 6/6 plans, verification passed 14/14, 5 forward migrations applied to staging, types regenerated, CI smoke test live. Next: Phase 61 (Security Pass)._
