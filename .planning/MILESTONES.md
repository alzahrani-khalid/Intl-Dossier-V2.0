# Milestones

## v6.2 Type-Check, Lint & Bundle Reset (Shipped: 2026-05-12)

**Delivered:** Restored code-quality gates and bundle budget on `main` before v7.0 Intelligence Engine work. Drove frontend (1580) + backend (498) TS errors to zero with no `@ts-ignore` / `@ts-expect-error` escape hatches; cleared frontend (52 err + 671 warn) + backend (3 err + 1 warn) lint to zero; aligned `no-restricted-imports` with the CLAUDE.md primitive cascade and purged Aceternity references; lowered Initial-route ceiling 517 → 450 KB with `React.lazy()` route splits and split heroui/sentry/dnd sub-vendor chunks; restored `type-check`, `Lint`, and `Bundle Size Check (size-limit)` as PR-blocking branch-protection contexts on `main`.

**Phases completed:** 3 phases (47-49), 17 plans
**Commits:** 146 | **Files changed:** 840 | **Lines:** +26,094 / -105,035 (large delete reflects type-check unused-export purge)
**Timeline:** 5 days (2026-05-08 → 2026-05-13)
**Audit:** `.planning/milestones/v6.2-MILESTONE-AUDIT.md` (status: passed; re-audit confirmed 2026-05-13 after paperwork closure)
**Requirements:** 12/12 satisfied (TYPE-01..04, LINT-06..09, BUNDLE-01..04)

**Key accomplishments:**

- Frontend `pnpm type-check` 1580 → 0 errors via deletion-first + typed-at-source (60 type files cleaned; 102 dead exports across 39 service/lib files; 19 of 20 shims retired by typing underlying domain hooks)
- Backend `pnpm type-check` 498 → 0 errors via ParsedQs narrowing, TS7030 return-path discipline, and allowlisted Supabase codegen (`@ts-nocheck` ledgered, not `tsconfig` exclude)
- Frontend lint 723 problems → 0 and backend lint 4 → 0 with `--max-warnings 0`; 0 net-new `eslint-disable` directives phase-wide
- Deleted `frontend/eslint.config.js` shadow; inverted `no-restricted-imports` to ban Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom); 3 orphan Aceternity wrappers removed
- Bundle budget reset: Initial 517 → 450 KB, static-prim 64 → 12 KB; manualChunks ordering fix prevents @heroui/@dnd-kit/@radix-ui mis-classification; sub-vendor decomposition (heroui-vendor / sentry-vendor / dnd-vendor); 3 audit-identified ≥30 KB gz components converted to `React.lazy()` / dynamic-import
- `type-check`, `Lint`, and `Bundle Size Check (size-limit)` restored as PR-blocking branch-protection contexts on `main` with `enforce_admins=true` preserved and 6 smoke PRs verifying `mergeStateStatus=BLOCKED`

**Tech debt (see audit for details):**

- 1 of 20 typed shims retained: `useStakeholderInteractionMutations` (underlying hook still returns `Promise.resolve({ success: true })` until real implementation lands)
- `TasksTab.tsx` + `EngagementKanbanDialog.tsx` still import `@/components/kibo-ui/kanban`; HeroUI v3 Kanban + @dnd-kit refactor deferred
- React vendor ceiling 349 KB vs measured 279.91 KB — tighten to ~285 KB per D-03 min rule as micro-task
- CLAUDE.md Node note still reads `Node.js 20.19.0+` while `package.json` engines pin moved to `22.13.0+` — chore commit
- Pre-existing design-rule violations preserved out of Phase 49 scope: `WorldMapVisualization.tsx:193` raw hex `#3B82F6`; `PositionEditor.tsx` Tailwind color literals — queue for design-compliance sweep
- 4 wizard tests fail at module-evaluation time — pre-existing `vi.mock("react-i18next")` factory in `frontend/tests/setup.ts:6` omits `initReactI18next`; not introduced by Phase 48
- `phase-47-base` / `phase-48-base` / `phase-49-base` lightweight tags; recommend re-tagging with `-a -s` in next milestone for `git tag -v` provenance

**Archive:** `.planning/milestones/v6.2-ROADMAP.md` · `.planning/milestones/v6.2-REQUIREMENTS.md` · `.planning/milestones/v6.2-MILESTONE-AUDIT.md`

---

## v6.1 Hardening & Reconciliation (Shipped: 2026-05-08)

**Delivered:** v6.0 debt closure: verification/archive reconciliation, repaired bundle-budget enforcement, schema and staging seed closure, and regenerated visual baselines for the deferred dashboard/list/drawer surfaces.

**Phases completed:** 3 phases (44-46), 14 plans, 25 tasks

**Key accomplishments:**

- Backfilled explicit v6.0 verification evidence for TOKEN, THEME, SHELL, VIZ, BOARD, and LIST requirements.
- Reconciled active and archived v6.0 planning truth: REQUIREMENTS, ROADMAP, final audit caveats, and Storybook deferral via ADR-006.
- Restored truthful `size-limit` enforcement with stable Vite chunk globs, zero-match detection, and CI parity.
- Closed WR-02..WR-06 source/accessibility anti-patterns with focused lint and axe evidence in English and Arabic.
- Shipped tenant-scoped `intelligence_digest` schema, deterministic dashboard seed rows, digest hook, and VIP country ISO projection.
- Regenerated 24 visual baselines across dashboard widgets, list pages, and dossier drawer, with PASS review rows and no-update replay.

**Known deferred items at close:** 10 acknowledged items (see `.planning/STATE.md` Deferred Items), including the historical dashboard max-depth debug session, seven stale quick-task artifacts, the v6.1 kickoff todo, and the missing v6.1 milestone audit file.

**Archive:** `.planning/milestones/v6.1-ROADMAP.md` · `.planning/milestones/v6.1-REQUIREMENTS.md` · `.planning/milestones/v6.1-phases/`

---

## v6.0 Design System Adoption (Shipped: 2026-05-06)

**Phases completed:** 11 phases (33-43), 121/121 executable plans complete (33-08 superseded by ADR-006), 66 tasks
**Timeline:** 17 days (2026-04-19 → 2026-05-06)
**Audit:** `.planning/milestones/v6.0-MILESTONE-AUDIT.md` (status: tech_debt — no critical blockers); Phase 44 reconciliation evidence is recorded in `.planning/phases/44-documentation-toolchain-anti-patterns/44-final-audit.md`

**Key accomplishments:**

- OKLCH-driven token engine across 4 design directions (Chancery / Situation Room / Ministerial / Bureau) × light/dark × accent hue × density, bridged to Tailwind v4 `@theme` and HeroUI v3 semantics with zero per-component overrides
- Self-hosted typography stack (Fraunces / Space Grotesk / Public Sans / Inter / IBM Plex Sans / IBM Plex Mono / JetBrains Mono / Tajawal) via `@fontsource/*` — zero `fonts.googleapis.com` requests; verbatim Tajawal RTL cascade
- New shell chrome: 256px sidebar with 2px accent bar (`inset-inline-start:0`), 56px topbar with `⌘K` search + direction switcher + Tweaks button, direction-specific classification element, and ≤1024px overlay-drawer with RTL flip
- Tweaks drawer with Direction/Mode/Hue/Density/Classification/Locale controls and `localStorage` persistence; legacy `/themes` route + `pages/Themes.tsx` + `components/theme-selector/` removed
- Signature visual primitives: `<GlobeLoader>` (d3-geo orthographic + 3 whirl rings), `<GlobeSpinner>`, `<FullscreenLoader>`, `<DossierGlyph>` (24 hand-drawn flag SVGs + symbol fallbacks), `<Sparkline>` (RTL-flipped polyline), `<Donut>` (stacked dasharray segments)
- Dashboard rebuilt verbatim to `reference/dashboard.png`: 8 widgets (KpiStrip / WeekAhead / OverdueCommitments / Digest / SlaHealth / VipVisits / MyTasks / RecentDossiers / ForumsStrip) wired to real domain hooks with zero placeholder data; legacy `OperationsHub.tsx` deleted (75/75 vitest)
- Kanban (`kcards` with overdue inline-start border + done opacity) + 7×5 calendar grid (event pills, today accent, RTL nav)
- Seven list pages (Countries / Organizations / Persons / Forums / Topics / Working Groups / Engagements) on shared `ListPageShell` + `GenericListPage` with filter pills + `<GlobeSpinner>` load-more; `EngagementsListPage` swap from 266 LOC → 16 LOC
- 720px dossier drawer (DOSSIER + CONFIDENTIAL chips, mini-KPI strip, italic-serif summary, Upcoming/Activity/Commitments) with focus trap + ESC + RTL slide flip + ≤640px full-screen
- Five remaining pages reskinned: Briefs (auto-fill card grid), After-actions (`.tbl` 6-column), Tasks (`.tasks-list` with checkbox + glyph + priority chip), Activity (`time · icon · "who action what in where"` timeline), Settings (240+1fr nav grid + 9-section vertical nav)
- Hard cross-phase QA gate (Phase 43): `pnpm lint` zero `eslint-plugin-rtl-friendly` violations across 13+ routes; axe-core 30/30 across EN/AR; responsive 60/60 across 6 breakpoints; keyboard 26 + 4 acknowledged-skip; focus-outline 8/8; `docs/rtl-icons.md` enumerates 11 mirrored-icon entries; CI `qa-sweep` gate live in `.github/workflows/e2e.yml`
- Two design tokens raised to clear WCAG AA (`inkFaint` 3.14 → 5.07; `--accent-fg` 4.38 → 5.28); `--sla-bad` darkened to `oklch(46% 0.18 25)`; FOUC bootstrap byte-mirror invariant preserved
- Playwright `globalSetup` + `storageState` + `chromium-no-auth` project replace brittle `loginForListPages` helper across 9 dossier-drawer specs

**Known deferred items at close:** 9 historical items, with documentation/toolchain reconciliation handled by Phase 44 (see `.planning/phases/44-documentation-toolchain-anti-patterns/44-final-audit.md`)

**Tech debt (see audit for details):**

- Backfilled VERIFICATION.md files now exist for phases 33, 34, 36, 37, 39, and 40; Phase 44 final audit reports `phases_missing_verification: []` and `requirements_partial_verification_gap: 0`
- Visual-regression baselines for Phases 38, 40, and 41 were regenerated and human-reviewed in Phase 46 (`.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md`)
- Schema/seed work deferred: `intelligence_digest` table (DIGEST-SOURCE-COMPROMISE), VIP person ISO join in RPC, `060-dashboard-demo.sql` seed for 4 BLOCKED-BY-SEED specs
- size-limit budget gate repaired with current measured Vite output budgets in `frontend/.size-limit.json`; the historical 815 KB ceiling remains aspirational, not the enforced gate
- Phase 43 WR-02..WR-06 source/lint/browser closure is recorded in Phase 44 summaries and final audit
- Plan 33-08 Storybook deferral is formalized by ADR-006, which names the replacement coverage and revisit trigger

**Archive:** `.planning/milestones/v6.0-ROADMAP.md` · `.planning/milestones/v6.0-REQUIREMENTS.md` · `.planning/milestones/v6.0-MILESTONE-AUDIT.md`

---

## v4.1 Post-Launch Fixes (Shipped: 2026-04-12)

**Phases completed:** 2 phases (24-25), 7 plans, 6 quick tasks
**Commits:** 89 | **Files changed:** 206 | **Lines:** +13,953 / -3,910
**Timeline:** 4 days (2026-04-09 to 2026-04-12)

**Key accomplishments:**

- Fixed runtime issues from v4.0 deployment (calendar i18n, settings 406, analytics DNS routing)
- Completed full 87-finding audit across 8 user journeys with 6 specialized auditor agents
- Resolved all theme token hardcoding with centralized semantic-colors system
- Moved auth listener to React lifecycle (memory leak + lock contention fix)
- Achieved 100% Arabic translation parity (1464 EN / 1473 AR keys)
- Hardened notification endpoints with type-safe count coercion

**Tech debt:** None — all 87 findings resolved
**Archive:** `.planning/milestones/v4.1-ROADMAP.md`

---

## v4.0 Live Operations (Shipped: 2026-04-09)

**Phases completed:** 10 phases, 30 plans, 30 tasks

**Key accomplishments:**

- Fixed nginx proxy_pass trailing-slash bug and certbot cert path mounting for production HTTPS with auto-renewing TLS
- deploy/backup-redis.sh
- 1. [Rule 3 - Blocking] Copied Plan 01 prerequisite files into worktree
- Category-aware Sonner toast on Realtime arrivals with full bilingual i18n strings for notification center
- 1. [Rule 3 - Blocking] Test directory mismatch
- 1. [Rule 3 - Blocking] Test directory mismatch
- Added is_seed_data tagging infrastructure across all seeded tables, unblocking idempotent populate RPC and tag-based cleanup.
- Installed the GASTAT diplomatic seed RPC on staging — deterministic, idempotent, admin-gated, bilingual across all native columns, covering every task enum value and five inheritance_source variants. Function is available but intentionally uninvoked on staging to avoid colliding with existing real data.
- Lightweight first-run detection RPC and regenerated database types — frontend can now type-safely query whether the database is empty and whether the caller is allowed to seed it.
- Built the bilingual, RTL-safe, mobile-first first-run modal with admin/non-admin variants. All four populate_diplomatic_seed response paths covered by passing Vitest tests.
- Closed the SEED-03 loop end-to-end. The dashboard now mounts FirstRunModal automatically when check_first_run reports an empty DB and the user has not previously dismissed it. All automated tests green; manual UAT (Task 3) is still pending and must run against a fresh empty database.
- One-liner:
- Commit:
- 1. [Rule 1 - Bug] Fixed POM NotificationCategory mismatch
- 1. [Rule 3 - Blocking] No unit tests exist for FirstRunModal/useFirstRunCheck
- 1. [Rule 1 - Bug] Fixed traceability phase mapping for SEED-01/02/03

---

## v3.0 Connected Workflow (Shipped: 2026-04-06)

**Phases completed:** 6 phases, 28 plans, 45 requirements
**Timeline:** 9 days (2026-03-28 → 2026-04-06)
**Commits:** 160 | **Files changed:** 525 | **Lines:** +43,480 / -7,323

**Key accomplishments:**

1. Hub-based 3-group sidebar (Operations, Dossiers, Administration) with mobile bottom tab bar and Cmd+K quick switcher
2. Engagement lifecycle engine with 6-stage progression, flexible transitions, audit logging, intake promotion, and forum sessions
3. Role-adaptive Operations Hub dashboard with 5 attention zones, Supabase Realtime subscriptions, and 3,743 lines dead code removed
4. Persistent engagement workspace with lifecycle stepper, inline kanban, calendar, document management, and AI briefing generation
5. DossierShell architecture with RelationshipSidebar (tier grouping, mobile sheet), 52 nested tab routes across all 8 dossier types
6. Elected Officials as full domain with Express API, list page, detail page with committees tab
7. Feature absorption: analytics, AI briefings, network graph, polling, export absorbed into contextual locations; all standalone routes redirect

**Tech debt:** See `.planning/milestones/v3.0-MILESTONE-AUDIT.md`
**Archive:** `.planning/milestones/v3.0-ROADMAP.md`, `.planning/milestones/v3.0-REQUIREMENTS.md`

---

## v2.0 Production Quality (Shipped: 2026-03-28)

**Phases completed:** 7 phases, 29 plans, 53 tasks
**Timeline:** 185 days (2025-09-25 → 2026-03-28)
**Commits:** 294 | **Files changed:** 8,732

**Key accomplishments:**

1. Unified ESLint 9 flat config, Prettier, and Knip dead-code scanner with pre-commit quality gates
2. Consistent naming conventions enforced via eslint-plugin-check-file across all monorepo layers
3. Supabase-first auth with RBAC hierarchy, Zod validation on all routes, dynamic RLS with org isolation
4. useDirection() hook, LtrIsolate wrapper, and 536 files bulk-migrated to logical CSS properties
5. Mobile-first responsive layouts with card-view fallbacks, 44px touch targets, and AdaptiveDialog
6. Domain repository pattern for 13 domains eliminating all raw fetch() calls in hooks
7. 200KB bundle budget via size-limit, deferred Sentry, query staleTime tiers, targeted memoization

**Tech debt:** 12 items across 5 phases (see `.planning/milestones/v2.0-MILESTONE-AUDIT.md`)
**Archive:** `.planning/milestones/v2.0-ROADMAP.md`, `.planning/milestones/v2.0-REQUIREMENTS.md`

---
