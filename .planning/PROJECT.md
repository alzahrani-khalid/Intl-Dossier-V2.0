# Intl-Dossier

## What This Is

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

## Core Value

Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## Current State

**Shipped:** v6.3 Carryover Sweep & v7.0 Prep (2026-05-17) — Phases 50-54 complete (28 plans, 20/20 requirements satisfied). Test infrastructure repaired (`vi.mock("react-i18next")` factory + 4 wizard tests green + setup docs); design-token compliance gate live at `error` severity workspace-wide (50 Tier-A swaps, 271 Tier-C suppressed, smoke PR #12 BLOCKED via D-09 fold); HeroUI v3 Kanban migration shipped (shared `@dnd-kit/core` primitive, kibo-ui + tunnel-rat purged, KANBAN-02 satisfied-by-deletion); React vendor ceiling 349 → 285 KB gz; `phase-47/48/49-base` re-issued annotated + SSH-signed (origin SHAs match local); CLAUDE.md Node note `22.13.0+`; Intelligence Engine schema groundwork applied to staging via Supabase MCP (`intelligence_event` + `intelligence_digest` + polymorphic junction + `signal_source_type` enum + regenerated TS types byte-identical across workspaces). Audit: passed.

<details>
<summary>Shipped milestones</summary>

- v6.3 Carryover Sweep & v7.0 Prep (2026-05-17): Test infra repaired, design-token compliance gate live (D-05 selectors at `error`, 50 Tier-A swaps + 271 Tier-C suppressed), HeroUI v3 Kanban migration (shared `@dnd-kit/core` primitive, kibo-ui + tunnel-rat purged), React vendor 349 → 285 KB, phase-base tags annotated + SSH-signed, Intelligence Engine schema groundwork (`intelligence_event` + `intelligence_digest` + polymorphic junction + `signal_source_type` enum) — see `.planning/milestones/v6.3-ROADMAP.md` and `.planning/milestones/v6.3-MILESTONE-AUDIT.md`
- v6.2 Type-Check, Lint & Bundle Reset (2026-05-12): TS errors 2078 → 0, lint problems 727 → 0, Aceternity purge + primitive cascade inversion, Initial-route ceiling 517 → 450 KB with 3 `React.lazy()` conversions, three PR-blocking gates restored on `main` — see `.planning/milestones/v6.2-ROADMAP.md` and `.planning/milestones/v6.2-MILESTONE-AUDIT.md`
- v6.1 Hardening & Reconciliation (2026-05-08): v6.0 verification backfill, archive sync, size-limit CI gate repair, WR-02..WR-06 closure, Storybook deferral ADR, intelligence digest schema/seed closure, VIP ISO projection, and visual baseline regeneration for Phases 38/40/41
- v6.0 Design System Adoption (2026-05-06): OKLCH token engine (4 directions × mode × hue × density), Tweaks drawer, self-hosted typography stack, new shell chrome, signature visual primitives, verbatim dashboard, kanban + calendar reskin, 7 list pages, 720px dossier drawer, 5 remaining pages reskinned, hard cross-phase QA gate (axe + responsive + keyboard + focus-outline) — see `.planning/milestones/v6.0-ROADMAP.md` and `.planning/milestones/v6.0-MILESTONE-AUDIT.md`
- v5.0 Dossier Creation UX (2026-04-18): 8 per-type creation wizards, unified `CreateDossierHub`, legacy wizard removed, person-native identity refactor
- v4.1 Post-Launch Fixes (2026-04-12): 87-finding audit, semantic colors, PageHeader unification, 100% Arabic parity
- v4.0 Live Operations (2026-04-09): Production deployment, notifications (in-app + email + push), seed data, E2E testing
- v3.0 Connected Workflow (2026-04-06): Hub-and-spoke architecture, engagement lifecycle, Operations Hub, DossierShell
- v2.0 Production Quality (2026-03-28): 7-phase hardening (toolchain, security, RTL, responsive, architecture, performance)

</details>

## Next Milestone Goals

The v7.0 Intelligence Engine seed (`.planning/seeds/v7.0-intelligence-engine.md`) is unblocked. v6.3 shipped the schema groundwork (INTEL-01..05): `intelligence_event` + new `intelligence_digest` + polymorphic `intelligence_event_dossiers` junction + `signal_source_type` enum + regenerated TS types byte-identical across workspaces. v7.0 builds the API + UI + ingestion + alerting on top.

**Carryover tech debt from v6.3** (queue for v6.4 quick-tasks or fold into v7.0 scope):

- DesignV2 → main merge sequence (then push triggers v6.3 enforcement on main contexts)
- 271 Tier-C design-token suppressions / 2336 AST nodes — cleanup waves staged as TBD-design-token-tier-c-cleanup-wave-N
- 5 Phase 52 PASS-WITH-DEVIATION deviations (D-19..D-23): mobile touch DnD scope-out, Phase 39 `kanban-*.spec.ts` regression follow-up, LTR/RTL visual baseline byte-distinction, live tasks-tab Playwright run with host operator
- Phase 53 SUMMARY/VERIFICATION cosmetic wording refresh (`PASS-WITH-DEFERRAL` → `PASS`, `verified-local-only` → `verified` — origin SHAs already match local)
- `TweaksDrawer.test.tsx:6-8` stale comment about TEST-01 mock factory (documentation drift)
- `51-VALIDATION.md` frontmatter `status: draft` → `passed` polish
- bad-design-token.tsx + bad-vi-mock.ts positive-failure CI assertion gap
- D-54-04-RLS-AUDIT-PRE-EXISTING-FAIL: pre-existing `countries` row in `sensitiveTables` (Phase 03/04 vintage)
- `useStakeholderInteractionMutations` shim (1 of 20 retained from v6.2) — type at source when underlying implementation lands

## Requirements

### Validated

- ✓ 8 dossier types with CRUD — existing
- ✓ Dossier-to-dossier relationships and polymorphic documents — existing
- ✓ Unified work items (tasks, commitments, intake) with Kanban workflow — existing
- ✓ Dashboard with charts, widgets, and export — existing
- ✓ AI briefing generation (Anthropic + OpenAI + local embeddings) — existing
- ✓ Bilingual i18n (Arabic/English) with i18next — existing
- ✓ Authentication via Supabase Auth with JWT middleware — existing
- ✓ Realtime subscriptions via Supabase Realtime — existing
- ✓ Network graph visualization (React Flow) — existing
- ✓ Unified calendar with 4 event types — existing
- ✓ Document management (upload, OCR, PDF generation) — existing
- ✓ HeroUI v3 drop-in replacement with shadcn re-export pattern — existing
- ✓ Code splitting with React.lazy() on all heavy routes — existing
- ✓ Rate limiting consolidated to single middleware — existing
- ✓ Error tracking via Sentry (frontend + backend) — existing
- ✓ Dead code removal and unified toolchain — v2.0 Phase 1
- ✓ Consistent naming conventions with ESLint enforcement — v2.0 Phase 2
- ✓ Security hardening (auth, RBAC, CSP, Zod, RLS) — v2.0 Phase 3
- ✓ RTL/LTR theming consistency — v2.0 Phase 4
- ✓ Mobile/tablet responsiveness — v2.0 Phase 5
- ✓ Domain repository architecture consolidation — v2.0 Phase 6
- ✓ Performance optimization (bundle, query, render) — v2.0 Phase 7

- ✓ Navigation & route consolidation (3-group sidebar, mobile tab bar, Cmd+K, route dedup) — v3.0 Phase 8
- ✓ Engagement lifecycle engine (6 stages, flexible transitions, audit logging, forum sessions) — v3.0 Phase 9
- ✓ Operations Hub dashboard (5 attention zones, role-adaptive, Supabase Realtime) — v3.0 Phase 10
- ✓ Engagement workspace (lifecycle stepper, kanban, calendar, docs, audit tabs) — v3.0 Phase 11
- ✓ Enriched dossier pages (DossierShell, RelationshipSidebar, 8 types with tabs, Elected Officials domain) — v3.0 Phase 12
- ✓ Feature absorption (analytics, AI, graph, polling, export absorbed; Cmd+K replaces search) — v3.0 Phase 13

- ✓ Production deployment (HTTPS, CI/CD, monitoring, backups, rollback) — v4.0 Phase 14
- ✓ In-app notification system (bell, center, triggers, preferences, BullMQ) — v4.0 Phases 15-16
- ✓ Email notifications (Resend alerts, digest scheduling) — v4.0 Phase 16
- ✓ Browser push notifications (VAPID, soft-ask opt-in) — v4.0 Phase 16
- ✓ Realistic seed data and first-run experience — v4.0 Phase 17
- ✓ Playwright E2E test suite with CI integration — v4.0 Phase 18
- ✓ Tech debt cleanup (typed router params, roadmap auto-sync) — v4.0 Phase 19

- ✓ Shared compositional wizard infrastructure (`useCreateDossierWizard`, `CreateWizardShell`, per-type Zod schemas) — v5.0 Phase 26
- ✓ Type-specific creation wizards for all 8 dossier types — v5.0 Phases 27–30
- ✓ Direct creation entry from each type's list page (context-aware FAB) — v5.0 Phase 31
- ✓ Relationship linking during creation (participants, organizing bodies, parent bodies) — v5.0 Phase 29
- ✓ Type-specific guidance and contextual hints (bilingual) — v5.0 Phase 31
- ✓ Smart defaults per type (status, sensitivity, optional fields) — v5.0 Phase 26
- ✓ Elected official creation path (Person variant with office/term/constituency) — v5.0 Phase 30
- ✓ Unified `CreateDossierHub` at `/dossiers/create` + legacy wizard removal — v5.0 Phase 31
- ✓ Person-native identity fields (honorific, split names, nationality, DOB, gender) — v5.0 Phase 32

- ✓ OKLCH token engine: 4 directions × light/dark × accent hue × density, Tailwind v4 `@theme` + HeroUI v3 semantic bridge — v6.0 Phase 33 (TOKEN-01..06)
- ✓ Tweaks drawer with `localStorage` persistence + `/themes` route removal — v6.0 Phase 34 (THEME-01..04)
- ✓ Per-direction self-hosted typography stack with Tajawal RTL cascade, zero Google Fonts CDN — v6.0 Phase 35 (TYPO-01..04)
- ✓ 256px sidebar + 56px topbar + direction-specific classification element + responsive overlay-drawer + GASTAT brand mark — v6.0 Phase 36 (SHELL-01..05)
- ✓ Signature visual primitives: GlobeLoader / GlobeSpinner / FullscreenLoader / DossierGlyph (24 flags) / Sparkline / Donut — v6.0 Phase 37 (VIZ-01..05)
- ✓ Dashboard rebuilt pixel-exact to reference, 8 widgets wired to real domain hooks, zero mock data — v6.0 Phase 38 (DASH-01..09)
- ✓ Kanban kcards (overdue inline-start border, done opacity) + 7×5 calendar grid with token-driven event pills — v6.0 Phase 39 (BOARD-01..03)
- ✓ Seven list pages on shared `ListPageShell` + `GenericListPage` with RTL chevron, filter pills, GlobeSpinner load-more — v6.0 Phase 40 (LIST-01..04)
- ✓ 720px dossier drawer with focus trap + ESC + RTL slide flip + ≤640px full-screen — v6.0 Phase 41 (DRAWER-01..03)
- ✓ Briefs / After-actions / Tasks / Activity / Settings pages reskinned to handoff anatomy with WCAG AA bidirectional — v6.0 Phase 42 (PAGE-01..05)
- ✓ Hard cross-phase QA gate: zero `eslint-plugin-rtl-friendly` violations, axe-core 30/30, responsive 60/60, keyboard 26 + 4 acknowledged-skip, focus-outline 8/8, `docs/rtl-icons.md` — v6.0 Phase 43 (QA-01..04)
- ✓ v6.1 documentation/toolchain reconciliation: v6.0 verification backfill, archive sync, size-limit CI gate repair, WR-02..WR-06 closure, Storybook deferral ADR — v6.1 Phase 44 (DOC-01..08, TOOL-01..03, LINT-01..05, STORY-01)
- ✓ v6.1 schema and seed closure: intelligence_digest, dashboard digest hook, VIP ISO join, staging MCP apply, and seed-dependent drawer specs — v6.1 Phase 45 (DATA-01..04)
- ✓ v6.1 visual baseline regeneration: Phase 38 widget baselines, Phase 40 EN/AR list-page baselines, Phase 41 drawer baselines, human review, and focused CI replay — v6.1 Phase 46 (VIS-01..04)

- ✓ Frontend `pnpm type-check` exits 0 (1580 errors → 0) with zero `@ts-ignore` / `@ts-expect-error` added — v6.2 Phase 47 (TYPE-01, TYPE-04 frontend half)
- ✓ Backend `pnpm type-check` exits 0 (498 errors → 0) with zero suppression escape hatches added — v6.2 Phase 47 (TYPE-02, TYPE-04 backend half)
- ✓ `type-check` restored as PR-blocking branch-protection context on `main` — v6.2 Phase 47 (TYPE-03)
- ✓ Frontend `pnpm lint` exits 0 (52 errors + 671 warnings → 0); 0 net-new `eslint-disable` directives phase-wide — v6.2 Phase 48 (LINT-06)
- ✓ Backend `pnpm lint` exits 0 (3 errors + 1 warning → 0) — v6.2 Phase 48 (LINT-07)
- ✓ `frontend/eslint.config.js` shadow deleted; Aceternity references purged; `no-restricted-imports` inverted to ban Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom) — v6.2 Phase 48 (LINT-08)
- ✓ `Lint` restored as PR-blocking branch-protection context on `main` — v6.2 Phase 48 (LINT-09)
- ✓ `frontend/.size-limit.json` Initial-route ceiling 517 → 450 KB; static-prim 64 → 12 KB; documented `frontend/docs/bundle-budget.md` — v6.2 Phase 49 (BUNDLE-01)
- ✓ 3 audit-driven `React.lazy()` / dynamic-import conversions (`PositionEditor`, `WorldMapVisualization`, `useExportData/exceljs`) with D-13 Suspense fallbacks — v6.2 Phase 49 (BUNDLE-02)
- ✓ `Bundle Size Check (size-limit)` restored as PR-blocking branch-protection context (verbatim casing); 2 smoke PRs verified `BLOCKED` — v6.2 Phase 49 (BUNDLE-03)
- ✓ Vendor super-chunk audited; heroui/sentry/dnd sub-vendor decomposition with documented ceilings — v6.2 Phase 49 (BUNDLE-04)

- ✓ `vi.mock("react-i18next")` factory uses `vi.importActual` + spread so module-eval succeeds for all consumers; 4 wizard tests green; setup contracts documented in frontend + backend test-setup docs — v6.3 Phase 50 (TEST-01..04)
- ✓ ESLint D-05 selectors at `error` severity workspace-wide ban raw hex + Tailwind palette literals in `frontend/src/`; 50 Tier-A files swapped to tokens; 271 Tier-C suppressed per-Literal; PR-blocking via D-09 fold into Phase 48 `Lint` context — v6.3 Phase 51 (DESIGN-01..04)
- ✓ HeroUI v3 Kanban migration: shared `frontend/src/components/kanban/*` primitive on `@dnd-kit/core`; TasksTab migrated; `EngagementKanbanDialog` + `EngagementDossierPage` deleted (KANBAN-02 satisfied-by-deletion); `kibo-ui` + `tunnel-rat` purged; EN+AR baselines committed — v6.3 Phase 52 (KANBAN-01..04)
- ✓ React vendor ceiling 349 → 285 KB gz (measured 279.42 kB) per D-03 min rule — v6.3 Phase 53 (BUNDLE-05)
- ✓ `phase-47/48/49-base` re-issued annotated + SSH-signed; `git tag -v` exits 0 with `Good "git" signature`; origin SHAs match local — v6.3 Phase 53 (BUNDLE-06)
- ✓ CLAUDE.md Node engine note aligned to `Node.js 22.13.0+` at L84 + L483 to match `package.json` engines — v6.3 Phase 53 (BUNDLE-07)
- ✓ `intelligence_event` table + indexes + tenant-scoped RLS on staging via Supabase MCP — v6.3 Phase 54 (INTEL-01)
- ✓ New `intelligence_digest` table on staging (prior Phase-45 dashboard table renamed to `dashboard_digest` to free the canonical name) + indexes + RLS — v6.3 Phase 54 (INTEL-02)
- ✓ `intelligence_event_dossiers` polymorphic junction with 7-value `dossier_type` CHECK + EXISTS-via-parent RLS + CASCADE — v6.3 Phase 54 (INTEL-03)
- ✓ `signal_source_type` enum (`publication`, `feed`, `human_entered`, `ai_generated`) applied to `intelligence_event.source_type` — v6.3 Phase 54 (INTEL-04)
- ✓ `database.types.ts` regenerated; byte-identical across backend + frontend workspaces; dual `pnpm type-check` exit 0; `rls-audit.test.ts` sensitiveTables extended — v6.3 Phase 54 (INTEL-05)

### Active

(v7.0 requirements to be defined via `/gsd:new-milestone` — Intelligence Engine API + UI + ingestion + alerting on top of v6.3 schema groundwork.)

### Out of Scope

- Mobile native app — cancelled (code preserved in git history)
- OAuth/social login — email/password sufficient; revisit if user base grows
- Real-time chat — high complexity, not core to dossier management
- Video content support — storage/bandwidth costs disproportionate to value

## Context

- **Codebase:** ~580 commits, ~60+ backend API endpoints, ~150+ frontend route files, Supabase migrations, TypeScript monorepo
- **Tech stack:** React 19, TypeScript 5.9, TanStack Router/Query v5, Express, Supabase (PostgreSQL 17), HeroUI v3, Tailwind v4, Vite
- **Architecture:** Hub-and-spoke with DossierShell/WorkspaceShell patterns, domain repository across 13 domains, shared apiClient
- **Quality gates:** ESLint 9 flat config, Prettier, Knip, pre-commit hooks, size-limit (200KB budget)
- **Security:** Supabase-first auth with RBAC hierarchy, Zod validation on all routes, RLS on all tables, CSP hardened
- **RTL:** useDirection() hook, LtrIsolate wrapper, eslint-plugin-rtl-friendly, zero physical CSS properties
- **Responsive:** Mobile-first across all pages, 44px touch targets, card view fallbacks, RelationshipSidebar → BottomSheet on mobile
- **Known tech debt:** See milestone audit files in `.planning/milestones/` and acknowledged open artifacts in `.planning/STATE.md` Deferred Items

## Constraints

- **Tech stack**: React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4 — no framework migrations
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP
- **Deployment**: DigitalOcean droplet with Docker Compose
- **Quality**: All v2.0 quality gates must remain green (ESLint, Prettier, Knip, size-limit, pre-commit hooks)

## Key Decisions

| Decision                                                   | Rationale                                                                                                                                                                  | Outcome       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Full stack scope                                           | Backend and frontend both need quality pass                                                                                                                                | ✓ Good        |
| Quality before features                                    | Fragile foundation makes new features risky                                                                                                                                | ✓ Good        |
| No new features in this milestone                          | Keeps scope focused on hardening                                                                                                                                           | ✓ Good        |
| Supabase-first auth                                        | Unified auth strategy, JWT as fallback                                                                                                                                     | ✓ Good        |
| Domain repository pattern                                  | Consistent data flow, zero raw fetch                                                                                                                                       | ✓ Good        |
| useDirection() over prop drilling                          | Centralized RTL, no per-component dir=                                                                                                                                     | ✓ Good        |
| size-limit as hard CI gate                                 | Bundle budget enforced, Lighthouse advisory                                                                                                                                | ✓ Good        |
| ESLint strict rules deferred                               | 4500+ violations too large for this milestone                                                                                                                              | ⚠️ Revisit    |
| rtl-friendly at warn level                                 | Error-level no-restricted-syntax covers it                                                                                                                                 | ⚠️ Revisit    |
| Lifecycle guides, not gates                                | Diplomatic work is non-linear; skip/revert OK                                                                                                                              | ✓ Good        |
| Hub-and-spoke architecture                                 | Matches how diplomatic staff actually work                                                                                                                                 | ✓ Good        |
| DossierShell shared layout                                 | Consistent UX across all 8 dossier types                                                                                                                                   | ✓ Good        |
| Feature absorption over deletion                           | Redirect old routes, absorb into context                                                                                                                                   | ✓ Good        |
| Elected Officials via persons                              | Query persons with subtype filter, no new table                                                                                                                            | ✓ Good        |
| Kibo-UI KanbanProvider                                     | Better DX than raw @dnd-kit/core for kanban                                                                                                                                | ✓ Good        |
| Supabase Realtime for dashboard                            | 1s debounce on tasks+transitions tables                                                                                                                                    | ✓ Good        |
| BullMQ for async notification                              | Decouple dispatch from triggering action                                                                                                                                   | ✓ Good        |
| Resend for transactional email                             | Simple API, bilingual HTML templates                                                                                                                                       | ✓ Good        |
| nginx + certbot over Caddy                                 | Existing config, lower migration risk                                                                                                                                      | ✓ Good        |
| VAPID push with soft-ask pattern                           | Better UX than cold browser permission dialog                                                                                                                              | ✓ Good        |
| Playwright POM + CI sharding                               | Maintainable E2E with parallelized CI runs                                                                                                                                 | ✓ Good        |
| Plans 20-02–05 deferred to corp                            | Corporate infra migration pending                                                                                                                                          | — Pending     |
| OKLCH token engine over HSL                                | Better perceptual uniformity for accent math; clean dark/light flips per direction                                                                                         | ✓ Good (v6.0) |
| HeroUI v3 + Tailwind v4 `@theme`                           | Single token bridge instead of per-component overrides; semantic mapping accent→primary                                                                                    | ✓ Good (v6.0) |
| Self-hosted fonts via @fontsource                          | Zero CDN traffic + offline-friendly + bundled by Vite                                                                                                                      | ✓ Good (v6.0) |
| Replace v5 themes (no coexistence)                         | Strategy (i) — clean cut over coexistence; eliminates token cascade conflicts                                                                                              | ✓ Good (v6.0) |
| FOUC bootstrap byte-mirror invariant                       | Inline synchronous bootstrap.js paints first-frame tokens; literal palette must byte-match `tokens/directions.ts`                                                          | ✓ Good (v6.0) |
| Phase 43 as cross-phase QA gate                            | Final phase enforces lint + axe + responsive + keyboard + focus-outline across all v6.0 routes — not per-phase                                                             | ✓ Good (v6.0) |
| Playwright globalSetup + storageState                      | Replaces brittle per-test login helper; eliminates Class D login-form bleed-through across qa-sweep specs                                                                  | ✓ Good (v6.0) |
| `.touch-44` utility + 7 call-sites                         | Single CSS class with logical `min-inline-size`/`min-block-size`; applied to existing components without refactoring                                                       | ✓ Good (v6.0) |
| 6 phases ship without VERIFICATION.md                      | Phase 43 cross-phase sweep covered them indirectly; Phase 44 backfilled explicit verification                                                                              | ✓ Closed      |
| Visual baselines deferred to operator                      | Phase 46 regenerated and committed baselines on a seeded dev machine with human review and CI replay                                                                       | ✓ Closed      |
| Phase-base git tags as diff anchors                        | `phase-47/48/49-base` lightweight tags replace unreliable `git merge-base main HEAD` for net-new-suppression audits                                                        | ✓ Good (v6.2) |
| Deletion-first TS6133/TS6196 fix                           | TS6133 unused declarations resolved by deletion or real fix; never silenced with `@ts-ignore` / `@ts-expect-error`                                                         | ✓ Good (v6.2) |
| `@ts-nocheck` on Supabase codegen                          | Auto-generated `database.types.ts` + `contact-directory.types.ts` allowlisted via top-of-file `@ts-nocheck` in EXCEPTIONS ledger — D-11 alternative to `tsconfig` exclude  | ✓ Good (v6.2) |
| Typed-at-source over consumer cast                         | Tighten underlying domain hook return types to retire 19 of 20 typed shims; cast at destructure boundary deprecated                                                        | ✓ Good (v6.2) |
| Root `eslint.config.mjs` only                              | Deleted `frontend/eslint.config.js` shadow; workspace lint scripts pinned to root with `--max-warnings 0`                                                                  | ✓ Good (v6.2) |
| Invert `no-restricted-imports`                             | Bans Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom); rule messages no longer recommend a banned library                                 | ✓ Good (v6.2) |
| Honest Total-JS ceiling 2.45 MB                            | D-02 escalation: 1.8 MB unattainable inside Phase 49 scope; lock at measured + slack with documented paper trail rather than aspirational ceiling                          | ✓ Good (v6.2) |
| manualChunks ordering                                      | Scoped-package rules placed BEFORE `id.includes("react")` substring rule to prevent @heroui/@dnd-kit/@radix-ui mis-classification into react-vendor                        | ✓ Good (v6.2) |
| Sub-vendor decomposition                                   | heroui-vendor / sentry-vendor / dnd-vendor split with `===1` strict assertions in `assert-size-limit-matches.mjs`                                                          | ✓ Good (v6.2) |
| size-limit native exit IS the gate                         | BUNDLE-03 enforcement uses `size-limit` fail-on-exceed; no custom delta calculator                                                                                         | ✓ Good (v6.2) |
| `vi.importActual` + spread for react-i18next               | TEST-01: factory preserves `initReactI18next` + all real exports so module-eval succeeds for every consumer; eliminates the `vi.mock` factory-omits-real-export trap       | ✓ Good (v6.3) |
| Tier-A swap + Tier-C suppress for DESIGN-03                | 50 named-anchor files swapped to tokens; 271 Tier-C suppressed per-Literal with traceable `eslint-disable-next-line` annotations — cleanup waves staged for v6.4           | ✓ Good (v6.3) |
| D-09 fold into existing `Lint` context                     | DESIGN-04: no new branch-protection PUT; smoke PR #12 captured `Lint=FAILURE` + `mergeStateStatus=BLOCKED` against `main`                                                  | ✓ Good (v6.3) |
| KANBAN-02 satisfied-by-deletion                            | D-20: `EngagementKanbanDialog` + `EngagementDossierPage` deleted as dead code; route now redirect-only to workspace TasksTab; shared `@dnd-kit/core` primitive covers both | ✓ Good (v6.3) |
| Rename Phase-45 `intelligence_digest` → `dashboard_digest` | Frees the canonical name for the v7.0 Intelligence Engine surface; lockstep frontend hook/test/widget rename in 54-01                                                      | ✓ Good (v6.3) |
| `intelligence_event` (not `intelligence_signal`)           | Avoids collision with existing curated `intelligence_signals` plural table; renamed from spec                                                                              | ✓ Good (v6.3) |
| Polymorphic junction over per-type FKs                     | `intelligence_event_dossiers` with 7-value `dossier_type` CHECK + EXISTS-via-parent RLS scales without N table-pair joins for AI correlation                               | ✓ Good (v6.3) |
| Annotated + SSH-signed phase-base tags                     | BUNDLE-06: `git tag -v` provenance via `~/.ssh/allowed_signers`; origin SHAs match local objects post-audit verification                                                   | ✓ Good (v6.3) |
| Migrations via Supabase MCP, not local CLI                 | D-15: applied to staging (`zkrcjzdemdmwhearhfgg`) via `apply_migration` — keeps environments authoritative and reproducible                                                | ✓ Good (v6.3) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-17 — v6.3 milestone complete (Phases 50-54, 28 plans, 20/20 requirements satisfied)._
