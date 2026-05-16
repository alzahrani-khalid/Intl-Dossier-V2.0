# Intl-Dossier

## What This Is

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

## Core Value

Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## Current State

**Shipped:** v6.2 Type-Check, Lint & Bundle Reset (2026-05-12) — Phases 47-49 complete. Frontend (1580) + backend (498) TS errors → 0 with zero `@ts-ignore` / `@ts-expect-error` added; frontend (723) + backend (4) lint problems → 0; `no-restricted-imports` aligned with CLAUDE.md primitive cascade; Aceternity references purged; Initial-route bundle ceiling 517 → 450 KB with `React.lazy()` route splits and heroui/sentry/dnd sub-vendor decomposition; `type-check`, `Lint`, and `Bundle Size Check (size-limit)` restored as PR-blocking branch-protection contexts on `main`. Audit: passed.

<details>
<summary>Shipped milestones</summary>

- v6.2 Type-Check, Lint & Bundle Reset (2026-05-12): TS errors 2078 → 0, lint problems 727 → 0, Aceternity purge + primitive cascade inversion, Initial-route ceiling 517 → 450 KB with 3 `React.lazy()` conversions, three PR-blocking gates restored on `main` — see `.planning/milestones/v6.2-ROADMAP.md` and `.planning/milestones/v6.2-MILESTONE-AUDIT.md`
- v6.1 Hardening & Reconciliation (2026-05-08): v6.0 verification backfill, archive sync, size-limit CI gate repair, WR-02..WR-06 closure, Storybook deferral ADR, intelligence digest schema/seed closure, VIP ISO projection, and visual baseline regeneration for Phases 38/40/41
- v6.0 Design System Adoption (2026-05-06): OKLCH token engine (4 directions × mode × hue × density), Tweaks drawer, self-hosted typography stack, new shell chrome, signature visual primitives, verbatim dashboard, kanban + calendar reskin, 7 list pages, 720px dossier drawer, 5 remaining pages reskinned, hard cross-phase QA gate (axe + responsive + keyboard + focus-outline) — see `.planning/milestones/v6.0-ROADMAP.md` and `.planning/milestones/v6.0-MILESTONE-AUDIT.md`
- v5.0 Dossier Creation UX (2026-04-18): 8 per-type creation wizards, unified `CreateDossierHub`, legacy wizard removed, person-native identity refactor
- v4.1 Post-Launch Fixes (2026-04-12): 87-finding audit, semantic colors, PageHeader unification, 100% Arabic parity
- v4.0 Live Operations (2026-04-09): Production deployment, notifications (in-app + email + push), seed data, E2E testing
- v3.0 Connected Workflow (2026-04-06): Hub-and-spoke architecture, engagement lifecycle, Operations Hub, DossierShell
- v2.0 Production Quality (2026-03-28): 7-phase hardening (toolchain, security, RTL, responsive, architecture, performance)

</details>

## Current Milestone: v6.3 Carryover Sweep & v7.0 Prep

**Goal:** Close v6.2 carryover debt, harden test/design gates, and lay v7.0 Intelligence Engine schema groundwork — clean runway before feature work.

**Target features:**

- HeroUI v3 Kanban migration: `TasksTab.tsx` + `EngagementKanbanDialog.tsx` migrate to HeroUI v3 Kanban + `@dnd-kit/core`; remove `@/components/kibo-ui/kanban` + dep
- Design-token compliance gate: ESLint rule banning raw hex + Tailwind color literals in `frontend/src/`; fix all violations (`WorldMapVisualization.tsx:193`, `PositionEditor.tsx`); PR-blocking CI context
- Test infrastructure hardening: Fix `frontend/tests/setup.ts:6` `vi.mock("react-i18next")` factory (add `initReactI18next`); audit other module-eval failures; vitest setup review; restore 4 wizard tests
- Bundle micro-tightening + tag provenance: React vendor ceiling 349 → ~285 KB (D-03 min rule); re-tag `phase-47/48/49-base` with `-a -s`; CLAUDE.md Node note `20.19.0+` → `22.13.0+`
- Intelligence Engine schema groundwork: `intelligence_signal` + `intelligence_digest` tables, source enum, polymorphic dossier linking, RLS, FKs, indexes — schema-only, no API, no UI

The v7.0 Intelligence Engine seed (`.planning/seeds/v7.0-intelligence-engine.md`) is unblocked but deferred until v6.3 ships its schema groundwork.

**Carryover tech debt from v6.2** (queue for next milestone or quick-tasks):

- `useStakeholderInteractionMutations` shim retained (1 of 20) — type at source when underlying implementation lands
- `TasksTab.tsx` + `EngagementKanbanDialog.tsx` still import `@/components/kibo-ui/kanban` — HeroUI v3 Kanban + @dnd-kit refactor deferred until HeroUI v3 stabilizes
- ~~React vendor ceiling 349 KB vs measured 279.91 KB — tighten to ~285 KB per D-03 min rule~~ — **closed by Phase 53** (BUNDLE-05, ceiling now 285 KB, measured 279.42 kB)
- ~~CLAUDE.md Node note `Node.js 20.19.0+` → `22.13.0+` to match `package.json` engines~~ — **closed by Phase 53** (BUNDLE-07, both L84 + L483 now `Node.js 22.13.0+`)
- Pre-existing design-rule violations: `WorldMapVisualization.tsx:193` raw hex `#3B82F6`; `PositionEditor.tsx` `text-blue-600` / `text-red-{600,800}` literals — queue for design-compliance sweep
- 4 wizard tests fail at module evaluation — `frontend/tests/setup.ts:6` `vi.mock("react-i18next")` factory omits `initReactI18next`
- ~~`phase-47/48/49-base` lightweight tags — re-tag with `-a -s` for `git tag -v` provenance~~ — **closed by Phase 53** (BUNDLE-06, all 3 now annotated + SSH-signed locally; `git push --force origin phase-NN-base` ×3 deferred to human operator per D-26)

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

### Active

(v6.3 requirements defined via `/gsd-new-milestone`. See `.planning/REQUIREMENTS.md` for REQ-ID list.)

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

| Decision                              | Rationale                                                                                                                                                                 | Outcome       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Full stack scope                      | Backend and frontend both need quality pass                                                                                                                               | ✓ Good        |
| Quality before features               | Fragile foundation makes new features risky                                                                                                                               | ✓ Good        |
| No new features in this milestone     | Keeps scope focused on hardening                                                                                                                                          | ✓ Good        |
| Supabase-first auth                   | Unified auth strategy, JWT as fallback                                                                                                                                    | ✓ Good        |
| Domain repository pattern             | Consistent data flow, zero raw fetch                                                                                                                                      | ✓ Good        |
| useDirection() over prop drilling     | Centralized RTL, no per-component dir=                                                                                                                                    | ✓ Good        |
| size-limit as hard CI gate            | Bundle budget enforced, Lighthouse advisory                                                                                                                               | ✓ Good        |
| ESLint strict rules deferred          | 4500+ violations too large for this milestone                                                                                                                             | ⚠️ Revisit    |
| rtl-friendly at warn level            | Error-level no-restricted-syntax covers it                                                                                                                                | ⚠️ Revisit    |
| Lifecycle guides, not gates           | Diplomatic work is non-linear; skip/revert OK                                                                                                                             | ✓ Good        |
| Hub-and-spoke architecture            | Matches how diplomatic staff actually work                                                                                                                                | ✓ Good        |
| DossierShell shared layout            | Consistent UX across all 8 dossier types                                                                                                                                  | ✓ Good        |
| Feature absorption over deletion      | Redirect old routes, absorb into context                                                                                                                                  | ✓ Good        |
| Elected Officials via persons         | Query persons with subtype filter, no new table                                                                                                                           | ✓ Good        |
| Kibo-UI KanbanProvider                | Better DX than raw @dnd-kit/core for kanban                                                                                                                               | ✓ Good        |
| Supabase Realtime for dashboard       | 1s debounce on tasks+transitions tables                                                                                                                                   | ✓ Good        |
| BullMQ for async notification         | Decouple dispatch from triggering action                                                                                                                                  | ✓ Good        |
| Resend for transactional email        | Simple API, bilingual HTML templates                                                                                                                                      | ✓ Good        |
| nginx + certbot over Caddy            | Existing config, lower migration risk                                                                                                                                     | ✓ Good        |
| VAPID push with soft-ask pattern      | Better UX than cold browser permission dialog                                                                                                                             | ✓ Good        |
| Playwright POM + CI sharding          | Maintainable E2E with parallelized CI runs                                                                                                                                | ✓ Good        |
| Plans 20-02–05 deferred to corp       | Corporate infra migration pending                                                                                                                                         | — Pending     |
| OKLCH token engine over HSL           | Better perceptual uniformity for accent math; clean dark/light flips per direction                                                                                        | ✓ Good (v6.0) |
| HeroUI v3 + Tailwind v4 `@theme`      | Single token bridge instead of per-component overrides; semantic mapping accent→primary                                                                                   | ✓ Good (v6.0) |
| Self-hosted fonts via @fontsource     | Zero CDN traffic + offline-friendly + bundled by Vite                                                                                                                     | ✓ Good (v6.0) |
| Replace v5 themes (no coexistence)    | Strategy (i) — clean cut over coexistence; eliminates token cascade conflicts                                                                                             | ✓ Good (v6.0) |
| FOUC bootstrap byte-mirror invariant  | Inline synchronous bootstrap.js paints first-frame tokens; literal palette must byte-match `tokens/directions.ts`                                                         | ✓ Good (v6.0) |
| Phase 43 as cross-phase QA gate       | Final phase enforces lint + axe + responsive + keyboard + focus-outline across all v6.0 routes — not per-phase                                                            | ✓ Good (v6.0) |
| Playwright globalSetup + storageState | Replaces brittle per-test login helper; eliminates Class D login-form bleed-through across qa-sweep specs                                                                 | ✓ Good (v6.0) |
| `.touch-44` utility + 7 call-sites    | Single CSS class with logical `min-inline-size`/`min-block-size`; applied to existing components without refactoring                                                      | ✓ Good (v6.0) |
| 6 phases ship without VERIFICATION.md | Phase 43 cross-phase sweep covered them indirectly; Phase 44 backfilled explicit verification                                                                             | ✓ Closed      |
| Visual baselines deferred to operator | Phase 46 regenerated and committed baselines on a seeded dev machine with human review and CI replay                                                                      | ✓ Closed      |
| Phase-base git tags as diff anchors   | `phase-47/48/49-base` lightweight tags replace unreliable `git merge-base main HEAD` for net-new-suppression audits                                                       | ✓ Good (v6.2) |
| Deletion-first TS6133/TS6196 fix      | TS6133 unused declarations resolved by deletion or real fix; never silenced with `@ts-ignore` / `@ts-expect-error`                                                        | ✓ Good (v6.2) |
| `@ts-nocheck` on Supabase codegen     | Auto-generated `database.types.ts` + `contact-directory.types.ts` allowlisted via top-of-file `@ts-nocheck` in EXCEPTIONS ledger — D-11 alternative to `tsconfig` exclude | ✓ Good (v6.2) |
| Typed-at-source over consumer cast    | Tighten underlying domain hook return types to retire 19 of 20 typed shims; cast at destructure boundary deprecated                                                       | ✓ Good (v6.2) |
| Root `eslint.config.mjs` only         | Deleted `frontend/eslint.config.js` shadow; workspace lint scripts pinned to root with `--max-warnings 0`                                                                 | ✓ Good (v6.2) |
| Invert `no-restricted-imports`        | Bans Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom); rule messages no longer recommend a banned library                                | ✓ Good (v6.2) |
| Honest Total-JS ceiling 2.45 MB       | D-02 escalation: 1.8 MB unattainable inside Phase 49 scope; lock at measured + slack with documented paper trail rather than aspirational ceiling                         | ✓ Good (v6.2) |
| manualChunks ordering                 | Scoped-package rules placed BEFORE `id.includes("react")` substring rule to prevent @heroui/@dnd-kit/@radix-ui mis-classification into react-vendor                       | ✓ Good (v6.2) |
| Sub-vendor decomposition              | heroui-vendor / sentry-vendor / dnd-vendor split with `===1` strict assertions in `assert-size-limit-matches.mjs`                                                         | ✓ Good (v6.2) |
| size-limit native exit IS the gate    | BUNDLE-03 enforcement uses `size-limit` fail-on-exceed; no custom delta calculator                                                                                        | ✓ Good (v6.2) |

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

_Last updated: 2026-05-16 — Phase 53 (bundle-tightening-tag-provenance) complete: BUNDLE-05/06/07 verified; React vendor ceiling 349 → 285 KB; phase-47/48/49-base tags signed; CLAUDE.md Node aligned. One sub-step deferred to human (D-26: force-push 3 tags to origin). Phase 54 (intelligence-engine-schema) is the last v6.3 phase._
