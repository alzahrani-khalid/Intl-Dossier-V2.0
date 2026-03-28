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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change                                                                        |
| --------- | ------ | ----- | --------------------------------------------------------------------------------- |
| v2.0      | 7      | 29    | First milestone — established GSD workflow, verification reports, milestone audit |

### Cumulative Quality

| Milestone | Quality Gates                                      | Tech Debt Items | Requirements Met |
| --------- | -------------------------------------------------- | --------------- | ---------------- |
| v2.0      | 5 (ESLint, Prettier, Knip, size-limit, pre-commit) | 12              | 29/29            |

### Top Lessons (Verified Across Milestones)

1. Dependency-ordered phases prevent rework — each phase builds on clean output from the prior one
2. Verification reports are non-negotiable — they catch real issues that "done" status masks
