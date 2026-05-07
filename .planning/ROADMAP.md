# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Post-Launch Fixes** — Phases 24-25 (shipped 2026-04-12) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Dossier Creation UX** — Phases 26-32 (shipped 2026-04-18) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Design System Adoption** — Phases 33-43 (shipped 2026-05-06) — [archive](milestones/v6.0-ROADMAP.md)
- 🚧 **v6.1 Hardening & Reconciliation** — Phases 44-46 (in planning, opened 2026-05-07)

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

### 🚧 v6.1 Hardening & Reconciliation (Phases 44-46) — IN PLANNING

- [ ] **Phase 44: Documentation, Toolchain & Anti-patterns** — Backfill VERIFICATION.md for 6 v6.0 phases, sync REQUIREMENTS/ROADMAP checkboxes, repair size-limit chunk-glob gate, close 5 Phase 43 anti-patterns (WR-02..WR-06), resolve Plan 33-08 storybook deferral
- [ ] **Phase 45: Schema & Seed Closure** — Create `intelligence_digest` table + read hook, add VIP person ISO join in dashboard RPC, apply `060-dashboard-demo.sql` seed to staging, unblock 4 BLOCKED-BY-SEED Playwright specs
- [ ] **Phase 46: Visual Baseline Regeneration** — Regenerate Phase 38 (8 widgets), Phase 40 (14 list-page) and Phase 41 (2 drawer) Playwright visual baselines against the seeded staging DB; document human-eyeball pass

## Phase Details

### Phase 44: Documentation, Toolchain & Anti-patterns

**Goal**: A reviewer auditing v6.0 finds explicit per-phase verification, accurate REQUIREMENTS/ROADMAP checkboxes, an enforced bundle-budget CI gate, zero open Phase 43 anti-patterns, and a resolved storybook deferral — without consulting any new schema or visual baseline.
**Depends on**: Nothing (independent of DATA + VIS work; pure code/doc/config edits to v6.0 artifacts)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DOC-08, TOOL-01, TOOL-02, TOOL-03, LINT-01, LINT-02, LINT-03, LINT-04, LINT-05, STORY-01
**Success Criteria** (what must be TRUE):

1. All six backfilled VERIFICATION.md files exist at `.planning/phases/{33,34,36,37,39,40}-*/VERIFICATION.md`, each listing every owned REQ-ID with a PASS/FAIL verdict and a verification artifact reference; a re-run of `gsd-audit-milestone v6.0` reports `phases_missing_verification: []` and `requirements_partial_verification_gap: 0`
2. `pnpm --filter frontend size-limit` exits 0 in CI against the current Vite output, and a verification PR that adds ≥1 KB to a measured chunk is rejected by the CI gate (proves the chunk-glob now matches real filenames and the budget is enforced again, not bypassed)
3. `pnpm --filter frontend lint` reports zero `WR-02..WR-06` occurrences across `OverdueCommitments.tsx`, `DrawerCtaRow.tsx`, `VipVisits.tsx`, `MyTasks.tsx`, `sidebar.tsx`, and `CalendarEntryForm.tsx`; an axe-core run on dashboard + drawer + my-work routes in EN and AR reports zero "label not redundant with text" violations
4. The v6.0 archive at `.planning/milestones/v6.0-REQUIREMENTS.md` shows `[x]` for all 52 REQ-IDs (matching the SUMMARY frontmatter), and the v6.0 ROADMAP archive progress table reads 121/121 plans complete with no "Not started" cells
5. Either Storybook stories for the 8 v6.0 visual primitives render at `frontend/src/stories/` across the direction × mode × density matrix, OR `.planning/decisions/ADR-006-storybook-deferral.md` exists and names the replacement coverage strategy with a concrete revisit trigger

**Plans**: TBD

### Phase 45: Schema & Seed Closure

**Goal**: A user opening the dashboard sees the Digest widget pulling real publication names (not internal usernames), the VIP Visits widget showing country flags resolved from ISO codes, and the four Phase 41 BLOCKED-BY-SEED Playwright specs executing successfully against seeded staging data.
**Depends on**: Phase 44 (clean docs/CI baseline before introducing schema changes; not technically required, but sequencing avoids regressing the freshly-fixed budget gate with a new migration's bundle delta and keeps each phase's verification surface narrow)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):

1. The `intelligence_digest` table exists in staging Supabase with the columns specified in DATA-01 (id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, dossier_id nullable FK, created_at), org-scoped RLS policies match the existing `dossiers` pattern, and the migration is applied via the Supabase MCP (visible in `supabase/migrations/`)
2. The dashboard Digest widget at `/` reads from `intelligence_digest` via a typed `useIntelligenceDigest` hook; the rendered `source` field shows publication names in both EN and AR, and a search of the widget render path returns zero references to `actor_name` (closes DIGEST-SOURCE-COMPROMISE)
3. The dashboard RPC powering `VipVisits` returns each row with an ISO-3166 alpha-2 code joined from `country_iso_codes`, and `<DossierGlyph>` consumes that code so the rendered widget shows correct flag glyphs instead of name-initials fallbacks
4. `frontend/seeds/060-dashboard-demo.sql` is applied to staging via Supabase MCP, and the four previously BLOCKED-BY-SEED Playwright specs (Phase 41 dashboard widget specs G1/G2/G7) execute and pass against the seeded data on a developer machine with `doppler run -- pnpm --filter frontend exec playwright test`

**Plans**: TBD

### Phase 46: Visual Baseline Regeneration

**Goal**: A reviewer running the Playwright visual-regression suite on a clean checkout against the seeded staging DB sees Phase 38, 40, and 41 visual specs all exit 0, with new baselines committed and a documented human-eyeball confirmation that each baseline matches the IntelDossier handoff reference.
**Depends on**: Phase 45 (DATA-04 seed must be applied before VIS-01 regenerates dashboard widget baselines that consume seeded data; DATA-02 + DATA-03 affect Digest source text and VIP flag rendering, both of which appear in regenerated PNGs)
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04
**Success Criteria** (what must be TRUE):

1. Eight Phase 38 widget visual baselines (KpiStrip, WeekAhead, OverdueCommitments, Digest, SlaHealth, VipVisits, MyTasks, RecentDossiers) are committed under `frontend/tests/e2e/__snapshots__/dashboard-widgets/` and the `dashboard-widgets` Playwright job exits 0 on a fresh run (no `--update-snapshots`); DASH-VISUAL-BLOCKED + DASH-VISUAL-REVIEW are closed in the deferred-items table
2. Fourteen Phase 40 list-page visual baselines (7 pages × EN + AR) are committed and the `list-pages-*` Playwright visual jobs exit 0 across both locales
3. Two Phase 41 dossier-drawer visual baselines are regenerated post-token-darkening (`--accent-fg` 4.38 → 5.28; `inkFaint` 3.14 → 5.07) and the dossier-drawer visual spec exits 0 in both EN and AR
4. `.planning/phases/46-*/VALIDATION.md` (or equivalent) documents a human-eyeball confirmation for each new baseline file, naming the file path and noting concordance with the handoff reference at `frontend/design-system/inteldossier_handoff_design/`

**Plans**: TBD
**UI hint**: yes

## Progress

<!-- gsd:progress:start -->

| Phase                                        | Milestone | Plans Complete | Status      | Completed  |
| -------------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1-7                                          | v2.0      | —              | Shipped     | 2026-03-28 |
| 8-13                                         | v3.0      | —              | Shipped     | 2026-04-06 |
| 14-23                                        | v4.0      | —              | Shipped     | 2026-04-09 |
| 24-25                                        | v4.1      | —              | Shipped     | 2026-04-12 |
| 26-32                                        | v5.0      | —              | Shipped     | 2026-04-18 |
| 33-43                                        | v6.0      | —              | Shipped     | 2026-05-06 |
| 44. Documentation, Toolchain & Anti-patterns | v6.1      | 3/6            | In Progress |            |
| 45. Schema & Seed Closure                    | v6.1      | 0/0            | Not started | —          |
| 46. Visual Baseline Regeneration             | v6.1      | 0/0            | Not started | —          |

<!-- gsd:progress:end -->

---

_Roadmap last updated: 2026-05-07 — v6.1 Hardening & Reconciliation roadmap drafted (Phases 44-46)_
