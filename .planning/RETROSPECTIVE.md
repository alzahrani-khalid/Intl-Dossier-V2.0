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

## Milestone: v6.0 — Design System Adoption

**Shipped:** 2026-05-06
**Phases:** 11 (33-43) | **Plans:** 121 | **Wave count:** 39
**Timeline:** ~18 days (2026-04-18 → 2026-05-06)

### What Was Built

- **Token engine (Phase 33):** OKLCH-driven 4-direction (Chancery / Situation Room / Ministerial / Bureau) × light/dark × hue × density token system; Tailwind v4 `@theme` + HeroUI v3 semantic bridge; FOUC bootstrap byte-matched to `tokens/directions.ts`
- **Tweaks drawer (Phase 34):** Topbar drawer with Direction/Mode/Hue/Density/Classification/Locale + `localStorage` persistence; legacy `/themes` route removed
- **Typography stack (Phase 35):** Self-hosted per-direction font stacks (Fraunces / Space Grotesk / Public Sans / Inter / IBM Plex / JetBrains Mono / Tajawal) with RTL display-font override
- **Shell chrome (Phase 36):** 256px sidebar + 56px topbar + classification ribbon, GASTAT brand mark, responsive overlay-drawer
- **Signature visuals (Phase 37):** GlobeLoader / GlobeSpinner / FullscreenLoader / DossierGlyph (24 flags) / Sparkline / Donut primitives (94/94 tests)
- **Dashboard verbatim (Phase 38):** 8 widgets pixel-exact to handoff (75/75 tests, 9/9 DASH requirements)
- **Kanban + Calendar (Phase 39):** 8 widgets sequential on DesignV2 (77/77 tests, 4 visual+a11y E2E specs activated, 8 legacy files deleted)
- **List pages (Phase 40):** 7 dossier-type list pages (countries/orgs/persons/forums/topics/working_groups/engagements) + 11 gap-closure plans + AUTH-FIX (66/66 vitest, 6 E2E specs, ESLint logical-properties enforcement, 815 KB size-limit)
- **Dossier drawer (Phase 41):** Drawer composer + DossierShell + RelationshipSidebar
- **Remaining pages (Phase 42):** Briefs / After-actions / Tasks / Activity / Settings — 12 plans, 4 Critical + 13 Warning fixed across 3 review iterations
- **RTL/a11y/responsive sweep (Phase 43):** Full v6.0 surface gate — qa-sweep CI job (axe + responsive + keyboard + focus-outline), `.touch-44` utility, `.icon-flip` migration, sidebar contrast remediation, `<main>` scrollable-region focus, `docs/rtl-icons.md` (94/4/0 UAT)

### What Worked

- **Handoff prototype as single source of truth.** `frontend/design-system/inteldossier_handoff_design/` with `app.css` + `dashboard.jsx` + `pages.jsx` removed all "what should this look like?" questions
- **Token-first architecture (Phase 33 before everything).** Every later phase consumed `var(--*)` directly; zero per-component overrides needed for accent/mode/density swaps
- **Wave-based parallelism on independent surfaces.** Phase 38 ran 6 widgets in parallel worktrees (75/75 tests in single phase); Phase 40 executed 7 list pages in parallel
- **Gap-closure plans as a first-class loop.** Phase 40 shipped 11 gap-closure plans (40-12..40-22) to address verifier findings before declaring PASS, instead of carrying defects forward
- **CI-anchored quality gates.** Phase 43's qa-sweep job catches RTL physical-property violations, axe WCAG AA failures, touch-target undersizing, and focus-outline regressions automatically — no human gate
- **Multi-iteration review-fix loop.** Phase 42 ran 3 review iterations (15+2+0 findings) before reaching `clean` — caught partial-fix and regression-from-fix patterns that single-pass review missed
- **`.icon-flip` canonicalization.** A single CSS rule (`html[dir='rtl'] .icon-flip { transform: scaleX(-1) }`) replaced ad-hoc `isRTL && 'rotate-180'` patches; codemod-friendly migration

### What Was Inefficient

- **Subagent context exhaustion on monolithic plans.** Phase 40-02a hit whole-plan subagent context exhaustion twice; rescued by inline orchestration after splitting α/β/γ. Lesson: cap plans at ~600 lines or pre-split for parallelism
- **Plan-vs-real-shape drift.** Repeated Rule-3 deviations (Donut `value+variants[3]` not `segments[]`, `EngagementListItem` field names, `useUpdateTask` not `useUpdateTaskStatus`). Lesson: planner should grep the actual hook signature before writing the plan, not trust spec assumptions
- **Type-discriminator drift.** Phase 40-22 G11 plan named 1 site, 5 needed the same fix (3 `.eq` + 2 `.insert`). Same-bug-class scan saves a follow-up plan (now in `feedback_engagement_type_discriminator_drift.md`)
- **Local env vs CI env mismatch.** Phase 43 was blocked locally on `VITE_SUPABASE_*` for ~2 sessions; runtime gates only flipped when CI env wiring landed (commit 420631c9). Lesson: gate plans should require CI-green proof, not local proof
- **Visual-baseline gates need an operator phase.** Phase 40 baselines (14 PNGs × 7 pages) deferred to HUMAN-UAT for ~5 days because no agent had Doppler+Playwright in env. Lesson: budget an explicit "operator wave" at end of any visual-heavy phase
- **Stale STATE.md.** State file said "Phase 43 context gathered" days after Phase 43 actually verified. Lesson: the milestone-close workflow needs a STATE.md updater step (now part of `/gsd:progress` Route A)

### Key Lessons

1. **Token-first beats component-first.** Phases 33-37 ate ~5 days but unlocked 6 reskin phases at high velocity; trying to reskin first then extract tokens would have re-done every page
2. **Gap-closure plans inside the phase, not after.** Treating verifier findings as new plans (40-12..40-22) instead of "follow-ups in next phase" kept the milestone closeable
3. **The CI gate beats the human gate.** Phase 43's qa-sweep is the canonical example: 4 sweeps × 15 routes × 2 locales runs faster than any human can audit and never forgets a route
4. **Plan against real types, not spec types.** When `useFoo` returns `{ data, pagination }`, planning against `{ foos }` costs ~30 min per call site to reconcile. Run `tsc --noEmit` on the plan's imports before signing it off
5. **Audit `rotate-180` survivors after any class-rename refactor.** Gap-5 (Tailwind v4 dropped `rotate-180` utility because no transform anchor) cost a full UAT cycle. A grep-gate as part of the codemod would have caught it

### Cost Observations

- **Model mix:** Opus for planning/execution/orchestration; Sonnet for verification, code-review, gap-closure agents; CodeFixer agents for atomic-commit review fixes
- **Sessions:** ~25 sessions across 11 phases (vs v3.0's ~8 across 6); reflects the breadth of the design system surface (4 directions × 13+ routes)
- **Worktree parallelism:** Phase 38 (6 widgets), Phase 40 (7 list pages), Phase 41 (drawer + shell + relationship) ran each wave in parallel — without worktrees this milestone would have been ~45 days

---

## Milestone: v6.1 — Hardening & Reconciliation

**Shipped:** 2026-05-08
**Phases:** 3 | **Plans:** 14 | **Tasks:** 25
**Timeline:** 2 days (2026-05-07 → 2026-05-08)

### What Was Built

- v6.0 verification backfill for phases 33, 34, 36, 37, 39, and 40, with archive/requirements/roadmap sync.
- Repaired `size-limit` enforcement around real Vite chunk globs and CI parity.
- Closed Phase 43 anti-patterns WR-02..WR-06 and formalized Storybook deferral through ADR-006.
- Added `intelligence_digest` schema/RLS/seed data, dashboard digest hook, and VIP ISO projection.
- Regenerated 24 visual baselines across dashboard widgets, list pages, and dossier drawer with human review and focused replay.

### What Worked

- **Debt-focused milestone scope:** Keeping v6.1 limited to reconciliation prevented feature creep before v7.0 planning.
- **Archive-first evidence:** Phase 44 directly repaired historical truth sources, which made later schema and visual closure easier to verify.
- **Seed before visual replay:** Phase 45’s staging seed closure gave Phase 46 stable visual inputs.
- **Human-review log:** The 24-row baseline review table made visual acceptance auditable instead of implicit.

### What Was Inefficient

- **No v6.1 milestone audit artifact:** The close proceeded with the missing audit acknowledged in STATE.md; future closes should run `$gsd-audit-milestone` before completion.
- **Old open artifacts persisted:** The dashboard debug session, stale quick tasks, and kickoff todo remained visible at close and had to be explicitly deferred.
- **Summary extraction is noisy:** Some generated accomplishment candidates included code-review finding labels, requiring manual cleanup in MILESTONES.md.

### Patterns Established

- **Hardening milestone as bridge:** A short reconciliation milestone can close audit debt and unblock the next feature milestone without expanding product scope.
- **Visual operator wave:** Visual-heavy phases should reserve a final operator/replay plan with Doppler, seeded data, no-update replay, and review rows.
- **Audit-open gate:** Milestone close should surface stale artifacts as first-class deferred items rather than hiding them.

### Key Lessons

1. Run milestone audit before archive, not during archive.
2. Treat visual baselines as release artifacts: seed, capture, review, replay, and link the evidence.
3. Curate generated milestone accomplishments before committing them; raw summary extraction is useful input, not final copy.
4. Keep historical phase directories archived with their milestone to make active `.planning/phases/` reflect only current work.

### Cost Observations

- Model mix: Opus for orchestration and planning; review/fix agents used for scoped quality checks.
- Sessions: ~3 sessions across 3 phases.
- Notable: A tightly-scoped hardening milestone moved faster than feature milestones because success criteria were concrete and evidence-driven.

---

## Milestone: v6.2 — Type-Check, Lint & Bundle Reset

**Shipped:** 2026-05-12
**Phases:** 3 (47-49) | **Plans:** 17 | **Timeline:** 5 days (2026-05-08 → 2026-05-13)
**Audit:** passed (re-audit confirmed 2026-05-13 after paperwork closure)

### What Was Built

- Frontend `pnpm type-check` 1580 → 0 errors via deletion-first (60 type files, 102 dead exports across 39 service/lib files) and typed-at-source (19 of 20 shims retired by tightening underlying domain hook return types)
- Backend `pnpm type-check` 498 → 0 errors via systemic patterns: ParsedQs argument narrowing (`String(req.query.foo ?? '')`), TS7030 return-path discipline (`return res.status(...).json(...)` on every branch), and allowlisted Supabase codegen (`@ts-nocheck` ledgered in EXCEPTIONS.md, not `tsconfig` exclude)
- Frontend lint 723 problems → 0; backend lint 4 → 0; 0 net-new `eslint-disable` directives phase-wide
- Deleted `frontend/eslint.config.js` shadow config; inverted `no-restricted-imports` to ban Aceternity + Kibo UI per CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom); 3 orphan Aceternity wrappers removed; workspace lint scripts pinned to root with `--max-warnings 0`
- Bundle Initial-route ceiling 517 → 450 KB; static-prim 64 → 12 KB; manualChunks ordering fix (scoped-package rules before `id.includes("react")` substring rule); heroui/sentry/dnd sub-vendor decomposition with `===1` strict assertions in `assert-size-limit-matches.mjs`; 3 audit-identified ≥30 KB gz components converted to `React.lazy()` / dynamic-import
- `type-check`, `Lint`, and `Bundle Size Check (size-limit)` restored as PR-blocking branch-protection contexts on `main` with `enforce_admins=true` preserved; 6 smoke PRs proved `mergeStateStatus=BLOCKED`

### What Worked

- **Phase-base git tags as suppression-diff anchors** (`phase-47-base`, `phase-48-base`, `phase-49-base`) replaced unreliable `git merge-base main HEAD` for D-01 net-new-suppression audits — stable reference point across long-running phases
- **Mechanical AST-aware deletion via reusable Python scripts** drove TS6133/TS6196 cluster fixes in single atomic commits per cluster (types → components → hooks → domains → pages → services), with D-04 four-globbed-grep verification on every cross-file deletion
- **Cascade strategy** — clearing one cluster (`src/types/*` 1580 → 1191) unblocked downstream clusters because consumer-side errors went away when source-level unused declarations were deleted; total frontend dropped 1580 → 15 by Plan 47-10 with only one residual cluster left for 47-11
- **Branch-protection PUT mechanics** (read-then-merge-then-write via `gh api`) established in Phase 47 reused verbatim in Phases 48 + 49 — three CI gates added consistently with `enforce_admins=true` preserved
- **D-02 honest ceiling escalation** — Plan 49-01 surfaced that the 1.8 MB Total JS proposal was unattainable inside Phase 49 scope; locked at measured 2.45 MB with documented paper trail instead of shipping an aspirational ceiling
- **Smoke PR-as-evidence** — 2 smoke PRs per CI gate (frontend + backend lint, initial-JS + sub-vendor for bundle) proved BLOCKING behavior on real branch protection, closed `--delete-branch` after evidence captured

### What Was Inefficient

- **Plan 47-01 + 47-02 only delivered the baseline** — the actual 1580 → 0 + 498 → 0 work spread across 9 more plans (47-04..47-11). Pre-execution scoping under-estimated the cluster decomposition needed; future type-check phases should plan cluster-by-cluster from the start
- **`manualChunks` substring rule mis-classification** was only surfaced in Plan 49-01 audit, not in Phase 49 plan-phase research. The `id.includes("react")` rule swept @heroui/@dnd-kit/@radix-ui into react-vendor; ordering fix forced a TanStack vendor ceiling re-baseline 51 → 63 KB. Pre-execution audit pass on `vite.config.ts` chunk rules would have caught this
- **D-02 1.8 MB Total JS target was aspirational** — landed too early in Phase 49 plan-phase before measurement; escalation cost Plan 01 cycles; future bundle phases should measure-first then propose-ceiling, not the reverse
- **Smoke PR trip-wire substitution required twice** — Plan 49-03 PR-A (umbrella `d3` package not installed; sub-packages only) and PR-B (dnd-vendor headroom too narrow); both required ad-hoc substitution. Pre-flight measurement of trip-wire mass against ceiling slack would have caught the mismatch
- **Wave-3 executor commit `4fd65d60` edited orchestrator-owned STATE/ROADMAP/REQUIREMENTS fields** — values were correct, but process boundary violation required Deviation #4 documentation in 48-03-SUMMARY.md

### Patterns Established

- **Phase-base git tag as diff anchor** for net-new-suppression / net-new-eslint-disable audits — reusable across any phase that needs a stable diff window
- **D-01 net-new-suppression audit** (`git diff <phase-base>..HEAD -- <workspace>/src | grep -E "^\\+.*@ts-(ignore|expect-error)" | wc -l → 0`) — applied consistently in 47/48/49 with phase-wide reconciliation in the final CI-gate plan
- **EXCEPTIONS.md ledger pattern** — retained suppressions documented inline with reason + issue/follow-up reference; per-phase ledger seeded in baseline plan, sealed in final-confirm plan
- **Typed-at-source migration** — tighten underlying domain hook return types so consumer sees real type without cast; deprecates "stub then narrow with `as unknown as ShimType` at the destructure boundary" pattern from 47-06/47-08
- **Root flat-config as single source of truth** with workspace scripts pinned via CWD fix (`cd .. && eslint -c eslint.config.mjs`) so flat-config basePath resolves correctly; turbo.json globalDependencies includes the root config
- **`size-limit` native fail-on-exceed IS the enforcement** — no custom delta calculator; per-chunk ceilings are binding; slack between measured and ceiling is documented absorption budget
- **Branch-protection context casing must be verbatim** — `Bundle Size Check (size-limit)` matches `ci.yml:271` `name:` field exactly; case mismatch silently fails the required-context check

### Key Lessons

1. **Cluster-decompose pre-execution, not mid-phase** — Phase 47's 11 plans emerged from execution discovery; future high-error-count type-check phases should ship a cluster-decomposition audit alongside RESEARCH.md
2. **Audit chunk-routing rules before writing budget proposals** — substring-matching rules (`id.includes("react")`) silently mis-classify scoped packages; the order of `if` branches in `manualChunks` is load-bearing
3. **Measure-then-propose for bundle ceilings** — aspirational ceilings (1.8 MB Total JS, 200 KB Initial) burn plan cycles when measured reality is 2.45 MB and 450 KB; honest baselines with documented slack ship faster
4. **Pre-flight trip-wire mass against ceiling slack** — smoke PRs need mass > slack to BLOCK; check before opening the PR or substitute mid-flight (Phase 49 hit this twice)
5. **Branch-protection PUT mechanics are reusable** — the read-then-merge-then-write `gh api` pattern from Phase 47 transferred verbatim to Phases 48 and 49; codify this as a CI-gate-restoration sub-recipe
6. **Process-boundary respect** — executor commits should not edit orchestrator-owned planning fields even when values are correct; surface for orchestrator merge instead

### Cost Observations

- Plans: 17 (47: 11 + 48: 3 + 49: 3) — Phase 47 cluster-decomposition drove most of the count
- Commits: 146 across 5 days
- Files changed: 840 (+26,094 / -105,035); large delete reflects type-check unused-export purge across `src/types/*`, `src/services/*`, `src/lib/*`
- Notable: Mechanical deletion via reusable Python scripts handled the long tail of unused declarations at near-zero per-deletion cost; D-04 four-globbed-grep verification kept the deletion rate safe
- Re-audit needed after paperwork closure: prior 2026-05-13T06:34:55Z audit returned `gaps_found` (paperwork-only); closed by commits c54c2291 / 148d9a68 / c7df4b56 / c37c1901; final audit at 2026-05-13T11:00:00Z returned `passed`

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Timeline | Key Change                                                                                                       |
| --------- | ------ | ----- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| v2.0      | 7      | 29    | 185 days | First milestone — established GSD workflow, verification reports, milestone audit                                |
| v3.0      | 6      | 28    | 9 days   | Worktree parallelism, 20x velocity boost, established shell/absorption patterns                                  |
| v6.0      | 11     | 121   | 18 days  | Token-first architecture, gap-closure-as-plan, CI-anchored qa-sweep gate                                         |
| v6.1      | 3      | 14    | 2 days   | Hardening bridge milestone, audit-open close gate, visual operator replay                                        |
| v6.2      | 3      | 17    | 5 days   | Quality-gate reset, phase-base git-tag diff anchors, typed-at-source over shims, 3 PR-blocking CI gates restored |

### Cumulative Quality

| Milestone | Quality Gates                                                                                                        | Tech Debt Items                                                                                                                                                                                                                                                                                          | Requirements Met |
| --------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| v2.0      | 5 (ESLint, Prettier, Knip, size-limit, pre-commit)                                                                   | 12                                                                                                                                                                                                                                                                                                       | 29/29            |
| v3.0      | Same 5 + VERIFICATION.md per phase                                                                                   | +5 (v3.0)                                                                                                                                                                                                                                                                                                | 45/45            |
| v6.0      | Same + qa-sweep CI (axe, responsive, kbd, focus) + eslint-plugin-rtl-friendly + size-limit signature-visuals budgets | +9 deferred (DIGEST-SOURCE-COMPROMISE, VIP-PERSON-ISO-JOIN, SLA-BAD-RESERVED, DASH-VISUAL-BLOCKED/REVIEW, DASH-COMPONENTS-DEAD, JSON-key-uniqueness, WR-03 SR shadowing)                                                                                                                                 | 52/52            |
| v6.1      | Same + focused visual replay for deferred dashboard/list/drawer baselines                                            | 10 acknowledged open artifacts at close (historical/stale items plus missing v6.1 audit)                                                                                                                                                                                                                 | 25/25            |
| v6.2      | Same + type-check + Lint + Bundle Size Check (size-limit) restored as PR-blocking branch-protection contexts on main | Tech debt at close: 1 retained shim (`useStakeholderInteractionMutations`), 2 kibo-ui kanban imports (HeroUI v3 deferred), React vendor ceiling loose, Node version note drift, pre-existing design-rule violations queued for sweep, 4 wizard-test setup bug (pre-existing), lightweight tag provenance | 12/12            |

### Top Lessons (Verified Across Milestones)

1. Dependency-ordered phases prevent rework — each phase builds on clean output from the prior one (v2.0, v3.0, v6.0 token-first)
2. Verification reports are non-negotiable — they catch real issues that "done" status masks (v2.0, v3.0, v6.0)
3. Reference-then-replicate is the fastest pattern — build one exemplar, copy across remaining targets (v2.0 domains, v3.0 dossier shells, v6.0 list pages)
4. ROADMAP / STATE metadata drifts without automation — three milestones in a row had stale progress tables (v2.0, v3.0, v6.0)
5. Velocity compounds on established patterns — v3.0 was 20x faster than v2.0; v6.0 sustained that rate across 4x the plan count by leaning on prior infrastructure
6. **CI-anchored gates beat human gates** (new in v6.0) — automated sweeps catch what human review forgets and run on every PR
7. **Phase-base git tags as suppression-diff anchors** (new in v6.2) — replace unreliable `git merge-base main HEAD`; stable across long-running phases; reusable for net-new-suppression / net-new-eslint-disable audits
8. **Measure-then-propose for bundle ceilings** (new in v6.2) — aspirational ceilings burn plan cycles; honest baselines with documented slack ship faster
9. **Branch-protection PUT mechanics are a reusable sub-recipe** (new in v6.2) — read-then-merge-then-write `gh api` pattern transferred verbatim across 3 CI gates in 5 days
