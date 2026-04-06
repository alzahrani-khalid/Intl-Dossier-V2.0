# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v2.0 — Production Quality

**Shipped:** 2026-03-28
**Phases:** 7 | **Plans:** 29 | **Tasks:** 53
**Timeline:** 185 days (2025-09-25 → 2026-03-28)

### What Was Built

- Unified toolchain: ESLint 9 flat config, Prettier, Knip dead-code scanner, pre-commit hooks with 4 quality gates
- Consistent naming conventions enforced via eslint-plugin-check-file across frontend and backend
- Security hardening: Supabase-first auth with RBAC hierarchy, Zod validation on all routes, dynamic RLS with org isolation, hardened CSP
- RTL/LTR perfection: useDirection() hook, LtrIsolate wrapper for third-party libs, 536 files bulk-migrated to logical CSS properties, eslint-plugin-rtl-friendly enforcement
- Mobile-first responsive: card-view fallbacks on all data tables, 44px touch targets, AdaptiveDialog for mobile bottom sheets, NavigationShell
- Domain repository architecture: 13 domains migrated, shared apiClient, backward-compat re-exports, 6 backend service pairs deduplicated
- Performance optimization: 200KB bundle budget via size-limit, deferred Sentry, query staleTime tiers (STATIC/NORMAL/LIVE), targeted memoization

### What Worked

- **Dependency-ordered phases:** Dead code first → naming → security → RTL → responsive → architecture → performance. Each phase built on clean output from the prior one
- **Bulk migration tooling:** Phase 4 migrated 536 files in a single plan using systematic grep-and-replace patterns — high throughput with zero regressions
- **Domain repository pattern:** Creating dossiers domain as reference implementation (Phase 6 Plan 1) then replicating across 12 more domains was efficient
- **Verification reports:** VERIFICATION.md per phase caught real gaps (Phase 4 false-positive, Phase 6 useSLAMonitoring) before milestone completion
- **Milestone audit before completion:** The audit surfaced the Phase 6 gaps and 12 tech debt items that would have been forgotten

### What Was Inefficient

- **Phase 4 required 6 plans instead of 3:** Original 3-plan scope missed ESLint wiring, remaining Recharts files, and a false-positive verification gap — 3 gap-closure plans added
- **Phase 5 ROADMAP metadata went stale:** Progress table showed "0/5 Planning" while all 5 plans were executed — metadata was never updated during execution
- **Phase 6 broke imports:** Architecture consolidation left broken imports in `data-retention.tsx` and `TagHierarchyManager.tsx` requiring emergency fixes
- **No automated tests for responsive/RTL:** Phases 4-5 relied on manual verification — no CI gates enforce breakpoints or touch target sizes
- **ESLint strict rules deferred indefinitely:** 4500+ violations from TypeChecked rules were excluded in Phase 1 and never revisited — this debt compounds

### Patterns Established

- **Domain repository pattern:** `domains/{feature}/repository.ts` + `domains/{feature}/hooks/` + `domains/{feature}/types.ts` + barrel export
- **RTL dual-layer enforcement:** `no-restricted-syntax` (error, no auto-fix) + `rtl-friendly/no-physical-properties` (warn, auto-fixable)
- **HeroUI v3 re-export pattern:** `components/ui/heroui-*.tsx` wrappers → `components/ui/*.tsx` re-exports for shadcn API compat
- **Query staleTime tiers:** `STALE_TIME.STATIC` (30min), `STALE_TIME.NORMAL` (5min), `STALE_TIME.LIVE` (30sec)
- **Pre-commit quality gates:** ESLint → Prettier → build → Knip (non-blocking)

### Key Lessons

1. **Verification before completion catches real issues.** Phase 4 and 6 both had gaps that VERIFICATION.md surfaced — without it, broken code would have been marked "done"
2. **Bulk migrations are faster than incremental.** Phase 4's 536-file migration in one plan was more efficient than doing it file-by-file across multiple plans
3. **Reference implementation first, replicate second.** Phase 6's dossiers-first approach made the remaining 12 domains predictable
4. **Gap-closure plans are normal, not failures.** Phases 4 and 7 both needed extra plans — budget for ~20% gap closure in future milestones
5. **Stale metadata erodes trust.** Phase 5 ROADMAP progress table was wrong — automate progress tracking or verify at each plan completion

### Cost Observations

- Model mix: Primarily opus for planning/execution, sonnet for verification agents
- Sessions: ~20+ sessions across 7 phases
- Notable: Bulk migrations (Phase 4 Plan 2: 536 files) were the highest-throughput operations — one plan doing more than entire phases

---

## Milestone: v3.0 — Connected Workflow

**Shipped:** 2026-04-06
**Phases:** 6 | **Plans:** 28 | **Tasks:** 49
**Timeline:** 9 days (2026-03-28 → 2026-04-06)

### What Was Built

- Hub-based 3-group sidebar with mobile bottom tab bar, Cmd+K quick switcher, and 14 demo pages gated behind dev mode
- Engagement lifecycle engine: 6-stage progression, flexible transitions (skip/revert), audit logging, intake promotion, forum sessions
- Role-adaptive Operations Hub with 5 attention zones, Supabase Realtime subscriptions, and 3,743 lines dead code removed
- Persistent engagement workspace: lifecycle stepper, inline kanban (Kibo-UI), calendar, document management, AI briefing generation
- DossierShell architecture: shared layout across all 8 types, RelationshipSidebar with tier grouping and mobile BottomSheet, 52 nested tab routes
- Elected Officials as full domain: Express API querying persons table, list page, detail with committees tab
- Feature absorption: analytics, AI briefings, network graph, polling, export absorbed into contextual locations; Cmd+K replaces standalone search

### What Worked

- **Extreme velocity:** 28 plans in 9 days (v2.0 took 185 days for 29 plans) — a 20x throughput increase. Established patterns from v2.0 made execution predictable
- **Worktree-based parallel execution:** Agents ran in isolated git worktrees, enabling parallel plan execution without merge conflicts
- **Dependency-ordered phases (again):** Lifecycle Engine before Ops Hub/Workspace — both depended on `lifecycle_stage` column. Zero rework from ordering
- **DossierShell reference implementation:** Building the shared shell first (12-01), then converting all 7 types (12-02), then adding enrichments (12-04/05) — same "reference then replicate" pattern from v2.0
- **Feature absorption as final phase:** Absorbing standalone pages last meant all destination components existed before absorption began

### What Was Inefficient

- **ROADMAP metadata drift (again):** Phase 9 showed "0/5 Planned" and Phase 8/13 checkboxes were unchecked despite being complete — same issue as v2.0 Phase 5
- **REQUIREMENTS traceability staleness:** WORK-02/03/06/07/08/09 still showed "Pending" in traceability table despite being complete — caught only at milestone audit
- **Missing VERIFICATION.md for phases 12-13:** Two phases shipped without formal verification files — required manual generation at milestone completion time
- **advanced-search.tsx missed in absorption:** One standalone route was not redirected during Phase 13-05 — caught during ABSORB-03 verification

### Patterns Established

- **DossierShell/WorkspaceShell pattern:** Shared layout shells with tab navigation, URL-driven nested routes, and type-specific enrichment via extraTabs
- **RelationshipSidebar tier classification:** Strategic / Operational / Informational grouping with collapsible sections
- **Feature absorption pattern:** Absorb functionality into contextual location → replace standalone route with `throw redirect()` in `beforeLoad`
- **Cmd+K command registration:** Commands registered with usage tracking in localStorage for "most used" sorting
- **Role-adaptive dashboard:** RoleSwitcher component + per-role zone layouts (leadership: strategic, officer: workload, analyst: research)

### Key Lessons

1. **Velocity compounds on established patterns.** v2.0's domain repository, HeroUI wrappers, and RTL infrastructure made v3.0 execution ~20x faster
2. **ROADMAP metadata must be automated.** Two milestones in a row had stale progress tables — manual updates don't work at scale
3. **Verification should be part of execution, not afterthought.** Phases 12-13 shipped without VERIFICATION.md — force generation as part of plan completion
4. **Absorption requires exhaustive route inventory.** The missed `advanced-search.tsx` redirect shows that route-level changes need a complete file listing, not memory-based checks
5. **Traceability tables should auto-update.** Manual "Pending → Complete" flipping is error-prone across 45 requirements

### Cost Observations

- Model mix: Opus for planning/execution, sonnet for verification/exploration agents
- Sessions: ~8 sessions across 6 phases
- Notable: Worktree agents enabled 2-3 plans to execute in parallel per phase, dramatically reducing wall-clock time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Timeline | Key Change                                                                        |
| --------- | ------ | ----- | -------- | --------------------------------------------------------------------------------- |
| v2.0      | 7      | 29    | 185 days | First milestone — established GSD workflow, verification reports, milestone audit |
| v3.0      | 6      | 28    | 9 days   | Worktree parallelism, 20x velocity boost, established shell/absorption patterns  |

### Cumulative Quality

| Milestone | Quality Gates                                      | Tech Debt Items | Requirements Met |
| --------- | -------------------------------------------------- | --------------- | ---------------- |
| v2.0      | 5 (ESLint, Prettier, Knip, size-limit, pre-commit) | 12              | 29/29            |
| v3.0      | Same 5 + VERIFICATION.md per phase                 | +5 (v3.0)       | 45/45            |

### Top Lessons (Verified Across Milestones)

1. Dependency-ordered phases prevent rework — each phase builds on clean output from the prior one (v2.0, v3.0)
2. Verification reports are non-negotiable — they catch real issues that "done" status masks (v2.0, v3.0)
3. Reference-then-replicate is the fastest pattern — build one exemplar, copy across remaining targets (v2.0 domains, v3.0 dossier shells)
4. ROADMAP metadata drifts without automation — both milestones had stale progress tables (v2.0, v3.0)
5. Velocity compounds on established patterns — v3.0 was 20x faster than v2.0 because infrastructure was already in place
