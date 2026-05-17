# Phase 48: Lint & Config Alignment - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Drive frontend (`pnpm --filter intake-frontend lint`) and backend (`pnpm --filter intake-backend lint`) to **zero** errors and **zero** warnings on a clean clone of `main` against the ROADMAP baseline of 52 errors + 671 warnings (frontend) and 3 errors + 1 warning (backend). Purge all Aceternity references from the ESLint configuration, align `no-restricted-imports` with the CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom), consolidate to a single root flat config, and restore `lint` as a PR-blocking CI gate on `main` via branch protection. Resolution is by call-site fix or surgical deletion only — no rule disabling to mask violations and no `eslint-disable` additions to mask errors (Phase 47 D-01 carries forward). Scope is the existing rule set on the root `eslint.config.mjs`; re-enabling `TODO(Phase 2+)` rules is explicitly out of scope and deferred.

</domain>

<decisions>
## Implementation Decisions

### Config consolidation

- **D-01:** Root `eslint.config.mjs` is the single canonical ESLint configuration for the monorepo. `frontend/eslint.config.js` is **deleted** in Phase 48 — it currently shadows the root config when per-workspace `lint` scripts run from the workspace directory, which is why local lint counts (~92 problems) diverge from the ROADMAP baseline (~723 problems). Aligns with single-source-of-truth philosophy and removes the surface where Aceternity references currently live.
- **D-02:** Workspace `lint` scripts are updated to point at the root config **explicitly**: `frontend/package.json` and `backend/package.json` use `eslint -c ../eslint.config.mjs src/...`. Explicit over implicit lookup — prevents a future `frontend/eslint.config.*` from silently re-forking. Symmetric across both workspaces.
- **D-03:** Add the following globs to the root `ignores:` block (in addition to whatever is already there):
  - `frontend/design-system/inteldossier_handoff_design/**` — the IntelDossier prototype handoff (the visual source of truth per `CLAUDE.md §"Visual Design Source of Truth"`). 2.5k lines of reference JSX that lives outside `src/` and is not production code; linting it against the app's RTL/naming rules produces only false positives.
  - `**/routeTree.gen.ts` — TanStack Router auto-generated (already in ignores; keep).
  - `**/database.types.ts` — Supabase-generated (already in ignores; keep). Also resolves the `@ts-nocheck` `ban-ts-comment` error at the type-generation boundary.
- **D-04:** Existing per-scope rule carve-outs for `frontend/src/components/ui/**` (`no-restricted-syntax: off`, `@typescript-eslint/no-explicit-any: off`, `rtl-friendly/no-physical-properties: off`) **stay as-is**. `CLAUDE.md` explicitly frames these primitives as "implementation detail" maintained for API compatibility with upstream sources, not as code that should pass the app's strict rule set. Tightening here is out of scope and would expand the fix list without a CLAUDE.md mandate.

### `no-restricted-imports` policy

- **D-05:** The current `no-restricted-imports` block in `frontend/eslint.config.js` **recommends** Aceternity components (`💡 UI Library: Consider using 3d-card or bento-grid from Aceternity...`) — directly contradicting `CLAUDE.md §"Component Library Strategy"` which bans Aceternity, Kibo UI, and shadcn/ui defaults without explicit user request. Phase 48 **inverts** this: ban what CLAUDE.md bans, not recommend it.
- **D-06:** New `no-restricted-imports` rule (severity `error`, defined in root `eslint.config.mjs` under the frontend override):
  - Banned packages: `aceternity-ui`, `@aceternity/*`, `kibo-ui`, `@kibo-ui/*`.
  - Banned paths: `@/components/ui/3d-card`, `@/components/ui/bento-grid`, `@/components/ui/floating-navbar`, `@/components/ui/link-preview`.
  - Shared message: `"Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing."` No emoji per `CLAUDE.md §"No emoji in user-visible copy"` voice rules. Single shared message — per-path bespoke text would drift and require maintenance.
- **D-07:** Orphan Aceternity wrapper files are **deleted** as part of Phase 48 — banning the import paths while leaving the files on disk is half a fix. Files to delete (all currently orphan, confirmed via grep — zero imports anywhere in `frontend/src`):
  - `frontend/src/components/ui/3d-card.tsx`
  - `frontend/src/components/ui/bento-grid.tsx`
  - `frontend/src/components/ui/floating-navbar.tsx`
    Other `floating-*` files (`floating-action-button.tsx`, `floating-dock.tsx`) are **NOT** in the Aceternity ban list per `CLAUDE.md` and `floating-action-button.tsx` has a real import in `frontend/src/pages/forums/ForumsPage.tsx` — those stay.
- **D-08:** `link-preview` is in the banned-paths list per ROADMAP success criterion #3 even if no wrapper file currently exists on disk — the rule is forward-looking, preventing reintroduction.

### Rule posture and warning policy

- **D-09:** **All `TODO(Phase 2+)` disabled rules in the root config stay disabled in Phase 48.** This includes (frontend): `@typescript-eslint/no-explicit-any`, `no-floating-promises`, `explicit-function-return-type`, `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `unused-imports/no-unused-vars`, `react-refresh/only-export-components`. (Backend): `no-explicit-any`, `no-floating-promises`, `explicit-function-return-type`, `unused-imports/no-unused-vars`, `no-namespace`. (Both): all `no-unsafe-*`, `require-await`, `strict-boolean-expressions`. **Rationale:** Phase 48 is "drive the current rule set to zero," not "expand the rule set." Phase 47 D-03 / D-05 (surgical-fix posture) carries forward. Re-enabling rules belongs in a future hardening phase, captured in `<deferred>` below.
- **D-10:** **Fix-at-call-site is the default warning resolution.** Per `REQUIREMENTS.md` LINT-06 ("Warnings either fixed at the call site or the rule downgraded with a written rationale recorded in `eslint.config.js`"). Downgrading a rule is only acceptable when (a) the warning is structural noise on a path the team does not control and (b) the rationale is recorded **inline in `eslint.config.mjs`** with file glob, suppressed-violation count, and the reason — not in a separate doc.
- **D-11:** **`--max-warnings 0` enforced in CI.** Per-workspace `lint` scripts include `--max-warnings 0` so a single warning fails the workspace lint, which fails the `lint` job, which (per D-15) blocks the PR. Without this, warnings drift back up unchecked. This is what makes LINT-06's "or downgraded with rationale" a real choice and not a slow leak.
- **D-12:** Top-signal rules (the ones driving the bulk of the 671 frontend warnings) are fixed at the call site:
  - `unused-imports/no-unused-vars` — apply Phase 47 D-03 deletion-as-default. Prefix with `_` only when the binding shape is mandated by an external contract (e.g., Express handler signatures `(req, res, _next)`).
  - `rtl-friendly/no-physical-properties` — convert to logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`, `rounded-s-*`, `rounded-e-*`). `CLAUDE.md §"Arabic RTL Support Guidelines"` mandates this conversion; failing to do it would be a CLAUDE.md violation, not just a lint warning.
- **D-13:** Backend's 3 errors are fixed at the source — no masking, per Phase 47 D-01:
  - `backend/src/services/event.service.ts:48` empty interface → replace with type alias (`type X = Y`) or remove.
  - `backend/src/services/signature.service.ts:353` raw `console.log` → swap for `logger.info` (Winston is the backend logger per `CLAUDE.md §"Logging"`).
  - `backend/src/types/contact-directory.types.ts:1` `@ts-nocheck` → planner first verifies whether the file is hand-authored or script-generated. If generated: add the path to root `ignores` instead of removing the directive. If hand-authored: remove the directive and resolve underlying type errors.

### CI gate structure

- **D-14:** Single `lint` job covering both workspaces — **Claude's discretion**, lean toward keeping the current single-job structure. Rationale: `pnpm run lint` already fans out to both workspaces via `turbo run lint` (parallel by default); splitting into `lint-frontend` + `lint-backend` jobs would add a second checkout + install pair (CI minutes) without saving wall-clock. Failure attribution stays clear because each workspace's lint output is labeled. **Differs from Phase 47 D-08** because type-check was originally **hidden inside** the `lint` job; here, lint is already its own job, so the parallelism problem D-08 solved doesn't apply. Planner may revisit if the histogram shows asymmetric runtime between workspaces.
- **D-15:** Branch protection on `main` is updated once both workspaces hit zero to **require the `lint` check** alongside the existing required contexts (`type-check` + `Security Scan`). `enforce_admins: true` stays — Phase 47 D-09 posture carries forward; weakening it would send a mixed signal across the milestone. The protection update is a settings change (GitHub API), not a code change; the plan must call it out explicitly as a step.
- **D-16:** **Two smoke PRs prove the gate BLOCKS** — one per workspace (frontend: inject a deliberate `text-left` class violating `no-restricted-syntax`; backend: inject a raw `console.log` violating `no-console`). Each PR must show the `lint` check status as **failed** and merge blocked by branch protection. This closes the Phase 47 D-13 pattern (`"protection API response alone doesn't prove the gate BLOCKS"`) and resolves STATE.md outstanding follow-up #1 by analogy.

### Suppression policy (carried from Phase 47 D-01)

- **D-17:** **Zero net-new `eslint-disable` / `eslint-disable-next-line` / `eslint-disable-line` / `eslint-disable-next` introduced during Phase 48.** Executor greps the diff for new disable strings before commit; failure if the count increases. Mirrors the Phase 47 `@ts-ignore` count rule. Any genuinely required suppression must be escalated to a named exception in `EXCEPTIONS.md` with file path, rule name, and reason.

### Claude's Discretion

- D-14: single vs split lint job posture — Claude defaults to single, planner may revisit based on per-workspace runtime histogram. Either choice satisfies the success criteria.
- Number of sub-plans under Phase 48 (one plan, two plans, or split-by-rule-category) is the planner's call. D-01..D-08 (config) and D-15..D-16 (CI) cluster naturally; D-09..D-13 (rule violations) is the bulk of execution time and is the natural splitting axis. Mirror Phase 47's parallel-by-workspace posture (D-06 there) if useful.
- Order between deleting orphan Aceternity wrappers (D-07) and adding the path bans (D-06) — executor's call. Either order is safe because no source code imports them today.
- Whether to add a one-off `pnpm lint:summary` script that prints a rule-count histogram (analogue of Phase 47's discretionary `pnpm type-check:summary` proposal) — at the planner's discretion; useful for warning burn-down, not required.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §"Phase 48: Lint & Config Alignment" (lines 155–170) — Goal, depends-on, requirements, success criteria.
- `.planning/REQUIREMENTS.md` §"Lint (LINT)" — LINT-06..09 verbatim with the "fix or downgrade-with-rationale" rule for warnings.
- `.planning/STATE.md` — Phase 47 outstanding follow-up #1 (smoke PRs) and the note that lint was excluded from required contexts on the v6.2 merge because it was red.

### Prior phase context (carried forward — read for posture)

- `.planning/phases/47-type-check-zero/47-CONTEXT.md` — Phase 47 decisions: D-01 (zero net-new suppression), D-03 (deletion-as-default), D-06 (parallel workspace plans), D-08 (CI job split rationale), D-09 (branch-protection with `enforce_admins: true`), D-13 (smoke-test PR pattern).

### Project conventions (non-negotiable)

- `CLAUDE.md` §"Visual Design Source of Truth" — the IntelDossier prototype handoff at `frontend/design-system/inteldossier_handoff_design/` is the visual reference, not production code (justifies the D-03 ignore).
- `CLAUDE.md` §"Component Library Strategy" — primitive cascade (HeroUI v3 → Radix → custom); Aceternity / Kibo UI / shadcn defaults banned without explicit user request (the source of truth for D-05..D-08).
- `CLAUDE.md` §"Arabic RTL Support Guidelines (MANDATORY)" — RTL-safe Tailwind class table (the source of truth for D-12 logical-properties conversion).
- `CLAUDE.md` §"Logging" — Winston for backend, `console.warn/error` only on frontend (drives D-13 `console.log` → `logger.info` fix in `signature.service.ts`).
- `CLAUDE.md` §"Karpathy Coding Principles" §3 "Surgical Changes" — bounds the fix-at-call-site posture in D-10/D-12/D-13; no opportunistic refactors during lint cleanup.

### ESLint / CI wiring (read before changing)

- `eslint.config.mjs` (repo root, 354 lines) — the canonical config per D-01; workspace overrides for `frontend/**` and `backend/**`; existing `ignores`, primitive carve-outs, naming-convention rules, and the `TODO(Phase 2+)` disabled-rule block that D-09 freezes.
- `frontend/eslint.config.js` (193 lines) — **the file deleted in Phase 48 per D-01**. Source of the misleading `no-restricted-imports` block that D-05 inverts.
- `frontend/package.json` + `backend/package.json` — `lint` script signatures that D-02 / D-11 update (explicit `-c ../eslint.config.mjs` + `--max-warnings 0`).
- `package.json` (root) — `"lint": "turbo run lint"` and `turbo.json` `lint` task (parallel fan-out that justifies D-14 single-job posture).
- `.github/workflows/ci.yml` lines 43–65 (single `lint` job) and 172 (`needs: [lint, type-check]` downstream chain) — the job D-14 keeps and D-15 adds to required contexts.

### Rule plugins (read before changing severity / scope)

- `eslint-plugin-rtl-friendly` — current `no-physical-properties` rule (D-12 drives this to zero by call-site fixes).
- `eslint-plugin-unused-imports` — current `no-unused-imports: error` + `no-unused-vars: off` posture (D-12 keeps the off side, drives the on side to zero).
- `eslint-plugin-check-file` — naming-convention rules (PASCAL_CASE for components, KEBAB_CASE for ui/hooks/lib/services, CAMEL_CASE for hooks). Stays enabled; any violations are real (file-rename fixes, not rule changes).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 47 CI workflow pattern** — `.github/workflows/ci.yml` already has a `lint` job with the canonical shape (checkout / setup pnpm / setup node / install --frozen-lockfile / run script). The `type-check` job split in Phase 47 is the symmetric reference; no new job needed in Phase 48, only a script update + branch-protection change.
- **Phase 47 branch-protection update mechanism** — STATE.md confirms `enforce_admins: true` + required-contexts list is already in place. Adding `lint` to the required-contexts list is a single GitHub API call; the plan should reference the exact step used in Phase 47.
- **Root flat config infrastructure** — `eslint.config.mjs` already has workspace overrides for `frontend/**` and `backend/**`, ignores block, primitive carve-outs, naming-convention rules. Phase 48 modifies this file rather than creating anything new.
- **Existing `lint:fix` / `format` scripts** — both workspaces have `prettier --write` scripts; useful as a pre-cleanup pass on call-site fixes that involve only whitespace.

### Established Patterns

- **Workspace lint scripts run from the workspace directory** — `eslint src/**/*.{ts,tsx}` resolves the closest config first. This is _why_ `frontend/eslint.config.js` shadows the root config today, and why D-02 makes the path explicit.
- **Per-scope rule carve-outs are how this project handles "intentionally less strict" surfaces** — see existing `frontend/src/components/ui/**` block. D-04 preserves the pattern; future surfaces follow the same shape (file glob → rules: { ... }).
- **No emoji in copy** — `CLAUDE.md` voice rules apply to ESLint rule messages too; D-06 message has no emoji, unlike the existing 💡-prefixed messages in `frontend/eslint.config.js`.
- **TODO(Phase X+) comments inline** — root `eslint.config.mjs` already documents deferred rule re-enables with `TODO(Phase 2+)` markers. D-09 preserves these as roadmap input for a future hardening phase.

### Integration Points

- **`eslint.config.mjs`** — the only file structurally modified for D-01..D-09 (deletes / adds rules; updates ignores; inverts `no-restricted-imports`).
- **`frontend/package.json` + `backend/package.json`** — `lint` script line updated per D-02 + D-11 (`-c ../eslint.config.mjs` + `--max-warnings 0`).
- **`.github/workflows/ci.yml`** — minimal touch per D-14 (no new job; `lint` job stays). The branch-protection update per D-15 happens via GitHub API, not in YAML.
- **GitHub branch-protection settings on `main`** — required-contexts list update is a settings change, not a code change. The smoke PRs per D-16 are the verification.
- **`frontend/src/components/ui/`** — three file deletions per D-07 (3d-card, bento-grid, floating-navbar). Surgical; no source-code import changes needed because nothing imports them today.
- **Call sites across `frontend/src/**`\*\* — the bulk of D-12 work. The planner produces a per-rule histogram (analogue of Phase 47's per-error-code histogram) so the executor sizes the deletion-vs-conversion split per file.

</code_context>

<specifics>
## Specific Ideas

- **The 671 frontend warnings are a measurement of drift against an already-strict rule set, not a decision about whether to be strict.** This mirrors Phase 47's framing for the 1580 TS errors: the rule set already encodes the project's standards; the work is closing the gap, not rethinking the standard.
- **The `no-restricted-imports` block currently _recommends_ Aceternity** — the rule message literally tells engineers to install banned libraries. This is the single highest-priority correctness fix in Phase 48 because it's actively misleading code review.
- **The `frontend/eslint.config.js` shadow config is why the local lint count (~92) and the ROADMAP baseline (~723) disagree.** Deleting that file is what closes the gap; the planner should re-baseline against the root config before committing to any fix-list sizing.
- **Phase 47's "lint excluded from required contexts because red" is the unblock condition for D-15.** The branch-protection update is the symbolic completion of Phase 48 — until `lint` is in the required-contexts list, the gate isn't restored, regardless of whether the workspaces pass locally.
- **Smoke PRs are belt-and-suspenders for D-15 + D-16.** Phase 47's STATE.md follow-up #1 notes the protection-API response "already confirms gate configuration" — the smoke PR is what proves the configuration BLOCKS, not just that it exists. Same logic applies here.

</specifics>

<deferred>
## Deferred Ideas

- **Re-enabling the `TODO(Phase 2+)` disabled rules** (`no-explicit-any`, `no-floating-promises`, `explicit-function-return-type`, `react-hooks/rules-of-hooks`, all `no-unsafe-*`, `strict-boolean-expressions`, `require-await`, etc.) — explicitly out of scope per D-09. Belongs in a future hardening phase (provisional name: "Strict Rule Re-enablement"). The TODO comments in `eslint.config.mjs` are the input list for that phase.
- **Tightening primitive carve-outs in `frontend/src/components/ui/**`** (e.g., re-enabling `rtl-friendly` on primitives) — out of scope per D-04. Revisit when CLAUDE.md adds a stronger mandate or when prototype tokens fully replace the primitives.
- **Deleting `floating-dock.tsx` / `floating-action-button.tsx` / other non-Aceternity `floating-*` files** — not in the success-criteria-named list. Out of Phase 48 scope unless found to be orphans by a future dead-code pass.
- **Stylelint / a11y CI gates** — `REQUIREMENTS.md` "Future (deferred)".
- **Knip enforcement** (currently non-blocking in `.husky/pre-commit` via `|| true`) — orthogonal to lint; a separate cleanup decision.
- **Pre-commit `eslint` hook** — current `.husky/pre-commit` runs `lint-staged`. Adding a full-project lint on every commit was rejected for type-check in Phase 47 D-10; same logic applies — CI is the gate. Revisit only if a regression slips past CI more than once.
- **Bundle budget reset (BUNDLE-01..04)** — Phase 49 owns this; explicitly out of scope.

### Reviewed Todos (not folded)

- `v6.2-kickoff.md` (todo, score 0.6) — "Kick off v6.2 — Type-Check, Lint & Bundle Reset". Milestone-level todo, not phase-level; covered by ROADMAP / REQUIREMENTS and being executed through this phase + Phases 47/49. Not folded — it's the umbrella, not an action.
- `v6.1-kickoff.md` (todo, score 0.2) — prior milestone kickoff; matched on the word "rationale." Not relevant to Phase 48. Not folded.

</deferred>

---

_Phase: 48-lint-config-alignment_
_Context gathered: 2026-05-11_
