# Phase 47: Type-Check Zero - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** `--auto` (Claude selected recommended option for each gray area; review before plan-phase)

<domain>
## Phase Boundary

Drive frontend and backend `pnpm type-check` to **zero** TypeScript errors on a clean clone of `main` (1580 frontend + 498 backend → 0), and restore type-check as a **PR-blocking** CI gate so a single TS error in either workspace cannot reach `main`. Resolution is by deletion of unused declarations or real type fixes only — never by adding `// @ts-ignore` / `// @ts-expect-error` to mask errors. Scope is the existing `strict` + `noUnusedLocals` + `noUnusedParameters` baseline; no tsconfig tightening (e.g. `noUncheckedIndexedAccess`) in this phase — that lives in REQUIREMENTS.md "Future (deferred)".

</domain>

<decisions>
## Implementation Decisions

### Suppression policy

- **D-01:** Absolute zero net-new `@ts-ignore` / `@ts-expect-error` introduced during Phase 47. TYPE-04 governs any retained legacy suppression: inline reason + issue/follow-up reference is mandatory, and the count is tracked. Recommended in `--auto` because TYPE-01/TYPE-02 explicitly forbid masking, and the visible count is the simplest gate.
- **D-02:** If a third-party-typing edge case genuinely cannot be fixed by code changes (e.g. upstream `.d.ts` bug), it is escalated as a named exception in the plan, not silently suppressed. Each exception lands in `.planning/phases/47-type-check-zero/EXCEPTIONS.md` (created by the planner if needed) with: file path, error code, upstream issue link, follow-up issue link.

### Error category strategy

- **D-03:** Errors are dominated by **TS6133** (unused locals/imports) and **TS6196** (unused exported types). Default fix is **deletion** (true cleanup, aligns with v6.1 dead-code removal stance), not `_`-prefix renaming and not disabling `noUnusedLocals` / `noUnusedParameters`. Disabling the rules is explicitly rejected — they are part of the strict baseline that produced this signal in the first place.
- **D-04:** When a deletion would remove a public-looking export (e.g. an exported type with no in-repo consumer), the planner verifies it is not consumed by an unscanned surface (Edge Functions, Supabase generated types, runtime-only consumers) before deleting. Anything ambiguous is flagged in the plan, not deleted by reflex.
- **D-05:** Real type fixes (not deletions) are reserved for the residual non-TS6133/TS6196 tail. The planner produces a category histogram (errors by TS code) so the residual tail is sized before work starts.

### Workspace order

- **D-06:** Frontend (1580) and backend (498) are tackled as **two parallel plans** under Phase 47 — they share no source files and can be committed independently. Sequencing risk is low because the CI gate (D-08) only flips on once both workspaces hit zero. Recommended over serial because total wall-clock is dominated by the larger workspace either way.

### CI gate placement

- **D-07:** Type-check today already runs inside the existing `lint` job in `.github/workflows/ci.yml` (line 67–68: `pnpm run typecheck` after `pnpm run lint`). It is not currently PR-blocking in practice despite `needs: [lint]` on downstream jobs — that is the open Q1 question. Phase 47 must answer Q1 before changing CI structure.
- **D-08:** **Split type-check into its own CI job** named `type-check`, parallel to `lint`, both depending only on `repo-policy`. Recommended because: (a) failure attribution is unambiguous (a TS error fails the right job, not a job called "Lint"); (b) parallel execution shortens PR signal latency; (c) downstream `needs:` chains can be re-pointed at `[lint, type-check]` so a TS regression blocks the same surfaces a lint regression does today. The split happens **after** TYPE-01 and TYPE-02 land — not before — so the new job is green on first run.
- **D-09:** Branch protection on `main` must require both `lint` and `type-check` checks before merge. The plan must explicitly call out the GitHub branch-protection update step (settings change, not a code change) and verify it via a deliberate "single TS error PR" smoke test.

### Pre-commit hook

- **D-10:** Do **not** add `tsc --noEmit` to `.husky/pre-commit` in Phase 47. The current hook runs `lint-staged` + `pnpm build` + non-blocking `knip`. Adding a full-project tsc on every commit would add seconds-to-minutes for marginal benefit when CI already gates merges. Revisit only if a regression slips past CI more than once.

### tsconfig posture

- **D-11:** No tsconfig changes in Phase 47. `strict: true` + `noUnusedLocals: true` + `noUnusedParameters: true` stay as-is in both `frontend/tsconfig.json` and `backend/tsconfig.json`. Tightening (e.g. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) is REQUIREMENTS.md "Future (deferred)" and is out of scope.

### Plan/build interaction

- **D-12:** `frontend/package.json` already has `build:check` (`tsc -p tsconfig.build.json && vite build`) and `build:strict` (`tsc && vite build`). Phase 47 does **not** add tsc to the default `build` script — Vite/esbuild build path stays fast. The CI gate uses the dedicated `type-check` script (`tsc --noEmit`), not `build:strict`.

### Verification posture

- **D-13:** "Done" means: `pnpm --filter frontend type-check` exits 0 AND `pnpm --filter backend type-check` exits 0 on a fresh clone with `pnpm install --frozen-lockfile`, AND a deliberately broken PR (one TS error injected into each workspace, in two separate test PRs) is rejected by the new gate, AND branch protection requires the new check. The plan must include the smoke-test PR step.

### Claude's Discretion

- The exact deletion-vs-fix split per file is the executor's call, guided by D-03 and D-04. The planner produces the file/category histogram; the executor applies the policy.
- Sub-plan count under Phase 47 (one plan, two plans, or split-by-error-category) is the planner's call. D-06 only locks the parallel posture, not the file boundary.
- Whether to add a one-off `pnpm type-check:summary` script that prints the error histogram is at the planner's discretion — useful for tracking burn-down, not required by REQUIREMENTS.md.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §"Phase 47: Type-Check Zero" (lines 134–153) — Goal, depends-on, entry condition, success criteria.
- `.planning/REQUIREMENTS.md` §"Type-check (TYPE)" — TYPE-01..04 verbatim with suppression rule.
- `.planning/notes/v6.2-rationale.md` — Source measurement methodology and rationale for v6.2 milestone shape.

### Open research that gates planning

- `.planning/research/questions.md` §Q1 — "Are TS / lint failures auto-suppressed in CI today?" Must be answered and captured in `.planning/research/Q1-ci-gate-status.md` before plan-phase. The answer determines whether D-08 (split job) is additive or replaces an existing broken gate.

### CI / build wiring (read before changing)

- `.github/workflows/ci.yml` lines 43–68 — current `lint` job that runs both `pnpm run lint` (line 65) and `pnpm run typecheck` (line 68). Lines 156, 192, 228, 263 — downstream `needs: [lint]` chains that any new `type-check` job must be added to.
- `turbo.json` — `type-check` task definition (`dependsOn: ["build"]`); evaluate whether the `build` dependency is required for `tsc --noEmit` or is dead weight.
- `package.json` (root) — `typecheck` script wires to `turbo run type-check`.
- `frontend/package.json` / `backend/package.json` — `type-check` script (`tsc --noEmit`) per workspace; frontend also has `build:check` and `build:strict` for reference.
- `frontend/tsconfig.json` / `backend/tsconfig.json` — strict baseline (do not modify per D-11).
- `.husky/pre-commit` — current hook contents; do not extend per D-10.

### Project conventions

- `CLAUDE.md` §"Karpathy Coding Principles" — surgical changes rule. Deletion-as-fix per D-03 must remove only the lines whose removal directly resolves the TS error; no opportunistic refactors.
- `.planning/codebase/CONVENTIONS.md` — naming, exports, import organization.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Existing `type-check` scripts**: both `frontend/package.json` and `backend/package.json` already expose `type-check: tsc --noEmit`. No new scripts needed for the gate.
- **Existing `lint` job** in `.github/workflows/ci.yml` is the template for the new `type-check` job (same checkout/pnpm/node/install steps).
- **`turbo run type-check`** already wired at the root via `pnpm typecheck`. CI can call either the per-workspace script or the turbo task.
- **`build:strict`** in frontend exists as a reference for "tsc + build" if ever needed; not used by this phase.

### Established Patterns

- **Strict baseline already enabled** — `strict: true` + `noUnusedLocals` + `noUnusedParameters` in both workspaces. The 1580 + 498 errors are a measurement of drift against an already-strict config, not a decision about whether to be strict. This is why D-03 favors deletion over rule-disabling.
- **CI job dependency chain** — `needs: [lint]` is the existing pattern for gating downstream jobs. Adding `type-check` to that array is consistent with how the repo already gates work.
- **Suppression-free history** — the codebase has very few `@ts-ignore` / `@ts-expect-error` instances today; preserving that posture (D-01) costs little.

### Integration Points

- **CI workflow** — `.github/workflows/ci.yml` is the only file that wires the gate. New job + updated `needs:` arrays.
- **Branch protection** — GitHub repo settings, not a code change. The plan must call this out as a manual step with a verification PR.
- **Edge Functions / Supabase generated types** — verify before deleting "unused" exported types (D-04). Generated Supabase types live under `supabase/` or similar; the planner confirms the path during research.

</code_context>

<specifics>
## Specific Ideas

- **TS6133 + TS6196 dominate.** `v6.2-rationale.md` already characterized the error shape ("unused declarations + unused exported types"). This means most fixes are mechanical and high-throughput; the real risk is over-deletion of items that look unused but are consumed off the type-check graph (Supabase generated, Edge Functions, runtime-only).
- **No new ts-ignore.** Operationalize D-01 by having the executor grep for new `@ts-ignore` / `@ts-expect-error` strings in the diff before commit, and fail the local check if count increases.
- **Smoke test the gate.** D-13's deliberately-broken PR is the only proof the gate actually blocks. Without it, "passing CI" only proves the current state is green, not that a regression would fail.

</specifics>

<deferred>
## Deferred Ideas

- **Strict-er TypeScript options** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) — REQUIREMENTS.md "Future (deferred)". Revisit after TYPE-01..04 land and ergonomics observed for one milestone.
- **Pre-push tsc hook** — revisit only if a TS regression slips past the new CI gate (D-10).
- **Stylelint and a11y CI gates** — REQUIREMENTS.md "Future (deferred)".
- **Knip enforcement** (currently non-blocking in `.husky/pre-commit` via `|| true`) — orthogonal to type-check; a separate cleanup decision, not Phase 47.
- **Lint zero (LINT-06..09)** — Phase 48 owns this; lint errors are not addressed in Phase 47 even though they live in the same files.
- **Bundle budget reset (BUNDLE-01..04)** — Phase 49.
- **Intelligence Engine (v7.0)** — explicitly out of scope, gated on v6.2 ship.

</deferred>

---

_Phase: 47-type-check-zero_
_Context gathered: 2026-05-08_
