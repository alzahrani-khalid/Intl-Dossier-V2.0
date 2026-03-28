# Milestones

## v3.0 Connected Workflow (In Progress)

**Started:** 2026-03-28
**Phases:** 8-13 (6 phases, 45 requirements)
**Goal:** Transform disconnected pages into a connected hub-and-spoke architecture reflecting how diplomatic staff actually work — multiple entry points, engagement lifecycle, and operational overview.

**Phases:**

1. Phase 8: Navigation & Route Consolidation (NAV-01–06)
2. Phase 9: Lifecycle Engine (LIFE-01–06)
3. Phase 10: Operations Hub (OPS-01–07)
4. Phase 11: Engagement Workspace (WORK-01–10)
5. Phase 12: Enriched Dossier Pages (DOSS-01–10)
6. Phase 13: Feature Absorption (ABSORB-01–06)

**Key decisions:**

- Lifecycle Engine ordered before Ops Hub/Workspace (both depend on `lifecycle_stage`)
- 1 new dependency: `react-resizable-panels` (~5KB) for RelationshipSidebar
- 200KB bundle budget maintained via lazy-loaded tabs and route-based code splitting

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
