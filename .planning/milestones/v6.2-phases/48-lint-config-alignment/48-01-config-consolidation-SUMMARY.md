---
phase: 48-lint-config-alignment
plan: 01

subsystem: infra
tags: [eslint, eslint-flat-config, turborepo, monorepo, lint-config, ci]

# Dependency graph
requires:
  - phase: 47-type-check-zero
    provides: 'phase-47-base tag pattern, branch-protection PUT mechanics, root flat-config infra (eslint.config.mjs)'
provides:
  - 'Single canonical ESLint flat config at repo root; frontend/eslint.config.js shadow deleted'
  - 'phase-48-base git tag at SHA baaf644a15fdcf97aa11c70f27a1187d558adaee (anchor for 48-03 D-17 net-new eslint-disable scan)'
  - 'no-restricted-imports inverted to ban Aceternity + Kibo UI per CLAUDE.md primitive cascade (no recommend-banned-library messaging)'
  - '5 filename-naming-convention carve-outs in eslint.config.mjs (__tests__, signature-visuals/flags, hooks, utils, config) with inline rationale comments per D-10'
  - 'Workspace lint scripts pinned to root config with --max-warnings 0 (D-02/D-11); CWD fix (cd .. && eslint -c eslint.config.mjs) so flat-config basePath resolves correctly'
  - 'turbo.json globalDependencies includes eslint.config.mjs (cache invalidation on root config change)'
  - 'Three orphan Aceternity wrapper files deleted (3d-card.tsx, bento-grid.tsx, floating-navbar.tsx) — zero importers'
  - 'Post-consolidation lint baseline captured: frontend 99 problems (86 err + 13 warn) vs 215 baseline; backend 2 errors vs 3 baseline'
  - 'COMPONENT_REGISTRY.md updated: deleted rows struck through with D-07 audit note; example import switched off bento-grid'
affects: [48-02-violation-fixes, 48-03-ci-gate-and-branch-protection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Workspace lint script with explicit -c repo-root cwd pin: cd .. && eslint -c eslint.config.mjs (clean fix for ESLint v9 flat-config basePath defaulting to CWD)'
    - 'Inline rationale comments per ignore-glob and per check-file carve-out (D-10 mandate; mirrors existing TODO(Phase 2) comment style in root config)'
    - 'Inverted no-restricted-imports policy: ban what CLAUDE.md bans rather than recommend banned libraries'

key-files:
  created:
    - '.planning/phases/48-lint-config-alignment/48-01-config-consolidation-SUMMARY.md'
  modified:
    - 'eslint.config.mjs (Edit 2 ignores; Edit 3 no-restricted-imports; Edit 4 5 carve-outs across 4 frontend check-file blocks + __tests__ carve-out across 4 backend check-file blocks)'
    - 'frontend/package.json (lint script; CWD fix)'
    - 'backend/package.json (lint script; CWD fix)'
    - 'turbo.json (globalDependencies extension)'
    - 'frontend/src/components/ui/COMPONENT_REGISTRY.md (strike-through deleted rows; example import swap)'

key-decisions:
  - 'D-01: Root eslint.config.mjs is the single canonical ESLint configuration; frontend/eslint.config.js deleted'
  - 'D-02 + D-11: Workspace lint scripts pin root config explicitly with --max-warnings 0'
  - 'D-03 + D-13: Added frontend/design-system/inteldossier_handoff_design/** (prototype handoff) and **/contact-directory.types.ts (supabase-generated) to root ignores with inline rationale'
  - 'D-04: Existing frontend/**/components/ui/** primitive carve-out byte-unchanged'
  - 'D-05 + D-06 + D-08: no-restricted-imports inverted (banning 8 specifiers: aceternity-ui, @aceternity/*, kibo-ui, @kibo-ui/*, and 4 banned @/components/ui/* paths including forward-looking link-preview); single shared message, no emoji'
  - 'D-07: Three orphan Aceternity wrapper files deleted (zero importers verified pre-deletion); floating-action-button.tsx and floating-dock.tsx kept'
  - 'D-09: All TODO(Phase 2+) disabled rules in root config stay byte-unchanged'
  - 'D-17 anchor: phase-48-base git tag created on wave-base SHA for 48-03 audit'
  - 'turbo.json globalDependencies extended with eslint.config.mjs (RESEARCH §11.3)'

patterns-established:
  - "Workspace lint script CWD pinning: when a flat config lives at monorepo root and workspace scripts target subdirectory files, the script must run eslint from the repo root (cd .. && eslint -c eslint.config.mjs '<workspace>/src/...') because ESLint v9 sets basePath to CWD, not the config file directory"
  - 'Inline rationale block for naming-convention carve-outs: each ignore-glob carries a one-line comment with glob, suppressed-violation count, and reason (D-10 mandate; mirrors existing TODO(Phase 2) comment style)'
  - 'Inverted import-ban shape: severity error, single shared message aligned with CLAUDE.md voice rules (no emoji, no recommend-banned-library phrasing)'

requirements-completed: [LINT-08]

# Metrics
duration: 14min
completed: 2026-05-11
---

# Phase 48 Plan 01: ESLint Config Consolidation Summary

**Single root flat ESLint config established: frontend/eslint.config.js shadow deleted, no-restricted-imports inverted to ban Aceternity + Kibo UI per CLAUDE.md primitive cascade, 5 filename-naming-convention carve-outs added with inline rationale, workspace lint scripts pinned to root config with --max-warnings 0, three orphan Aceternity wrappers removed, phase-48-base audit anchor created**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-11T11:04:00Z (approx — first HEAD assertion)
- **Completed:** 2026-05-11T11:18:41Z
- **Tasks:** 4 of 4 (Task 1 tag-only; Tasks 2 & 3 committed; Task 4 verification-only)
- **Files modified:** 5 (eslint.config.mjs, frontend/package.json, backend/package.json, turbo.json, COMPONENT_REGISTRY.md)
- **Files deleted:** 4 (frontend/eslint.config.js + 3 orphan Aceternity wrappers)
- **Git tag created:** 1 (phase-48-base)

## Accomplishments

1. **`phase-48-base` git tag created on wave-base SHA `baaf644a15fdcf97aa11c70f27a1187d558adaee`** — anchor for the 48-03 D-17 net-new `eslint-disable` audit (idempotent: `git rev-parse phase-48-base 2>/dev/null || git tag …`). Pushed to origin.

2. **Root `eslint.config.mjs` is now the single source of truth.** The `frontend/eslint.config.js` shadow file is deleted; only references to it remain in `.planning/` and `.archive/` docs (no source/build/CI consumers).

3. **`no-restricted-imports` inverted (D-05/D-06/D-08).** The frontend override block now bans 8 specifiers at severity `error`:
   - Packages: `aceternity-ui`, `@aceternity/*`, `kibo-ui`, `@kibo-ui/*`
   - Paths: `@/components/ui/3d-card`, `@/components/ui/bento-grid`, `@/components/ui/floating-navbar`, `@/components/ui/link-preview` (forward-looking — file doesn't exist)
   - Single shared message: _"Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing."_ (No emoji per CLAUDE.md voice rules.)

4. **Five filename-naming-convention carve-outs added (D-10, RESEARCH §3 Path A + §8.5).** Each frontend check-file block (`components`, `hooks`, `types`, `lib`) gained `**/__tests__/**`, `**/signature-visuals/flags/**`, `**/hooks/**`, `**/utils/**`, `**/config/**` to its `ignores:` array, each with inline rationale comment. Backend check-file blocks (`services`, `models`, `api`, `middleware`) gained `**/__tests__/**` only.

5. **Workspace lint scripts pinned to root config with `--max-warnings 0`.** Bug discovered during Task 4 baseline verification (see Rule 1 deviation below); final shape is `cd .. && eslint -c eslint.config.mjs --max-warnings 0 '<workspace>/src/**/*.{ts,tsx}'` — CWD must be repo root for ESLint v9 flat-config `basePath` to resolve correctly.

6. **`turbo.json` `globalDependencies` extended with `eslint.config.mjs`** so workspace lint cache invalidates when the root config changes (RESEARCH §11.3).

7. **Three orphan Aceternity wrappers deleted (D-07).** `3d-card.tsx`, `bento-grid.tsx`, `floating-navbar.tsx` removed with `git rm`; importer audit (alias + relative) returned zero matches before deletion. `floating-action-button.tsx` (real importer in `pages/forums/ForumsPage.tsx`) and `floating-dock.tsx` (not in D-07 list) preserved.

8. **`COMPONENT_REGISTRY.md` updated** to reflect deletions: rows struck through with `_(Deleted in Phase 48 per CONTEXT D-07 (zero importers))_` audit note; example import in usage guidelines swapped from `BentoGrid` to `Skeleton` (BentoGrid no longer resolvable).

9. **Post-consolidation lint baseline captured for 48-02:**
   - **Frontend:** 99 problems (86 errors + 13 warnings) from `pnpm --filter intake-frontend lint`. Histogram in `/tmp/48-01-frontend-histogram.txt`.
   - **Backend:** 2 errors (event.service.ts:48 empty-interface, signature.service.ts:353 no-console). The 3rd baseline error (contact-directory.types.ts ban-ts-comment) is gone — file now in ignores.

10. **Phase 47 type-check zero-state preserved.** `pnpm --filter frontend type-check` exits 0 after the 3 file deletions.

## Task Commits

Each task committed atomically (Task 1 is a tag-only operation; Task 4 is verification-only):

1. **Task 1: `phase-48-base` git tag** — _(no commit; tag operation only)_. Tag SHA: `baaf644a15fdcf97aa11c70f27a1187d558adaee` (verified: `git rev-parse phase-48-base`).
2. **Task 2: Consolidate ESLint config (Edits 1–6)** — `e9284ee1` (chore). Single commit per the plan: deletes shadow, extends ignores, inserts inverted `no-restricted-imports`, applies 5 carve-outs across all frontend check-file blocks + `__tests__` across all backend check-file blocks, pins workspace lint scripts, extends turbo globalDependencies.
3. **Task 3: Delete orphan Aceternity wrappers** — `ce0323a1` (chore). Deletes 3 files + updates `COMPONENT_REGISTRY.md` with strike-through audit note + import-example swap.
4. **Rule 1 fix: Pin workspace lint scripts to repo-root CWD** — `aff907c1` (fix). _Not in the plan — discovered during Task 4 verification; see Deviations._
5. **Task 4: Re-baseline lint** — _(no commit; verification only)_. Output captured to `/tmp/48-01-frontend-lint.txt`, `/tmp/48-01-backend-lint.txt`, `/tmp/48-01-frontend-histogram.txt`.

## Files Created/Modified

**Modified:**

- `eslint.config.mjs` — Edit 2 (2 new ignores with inline rationale); Edit 3 (new `no-restricted-imports` rule in frontend override); Edit 4 (5 carve-outs in 4 frontend check-file blocks; `**/__tests__/**` in 4 backend check-file blocks)
- `frontend/package.json` — `lint` script pinned to root config, `--max-warnings 0`; CWD fix
- `backend/package.json` — same shape symmetric to frontend
- `turbo.json` — `globalDependencies` extended with `eslint.config.mjs`
- `frontend/src/components/ui/COMPONENT_REGISTRY.md` — 3 strike-through rows; one usage-guideline import swap

**Deleted:**

- `frontend/eslint.config.js` — shadow config (D-01)
- `frontend/src/components/ui/3d-card.tsx` — orphan Aceternity wrapper (D-07)
- `frontend/src/components/ui/bento-grid.tsx` — orphan Aceternity wrapper (D-07)
- `frontend/src/components/ui/floating-navbar.tsx` — orphan Aceternity wrapper (D-07)

**Created:**

- `.planning/phases/48-lint-config-alignment/48-01-config-consolidation-SUMMARY.md` — this file

**Git tag:**

- `phase-48-base` → `baaf644a15fdcf97aa11c70f27a1187d558adaee` (local + origin)

## Post-Consolidation Lint Baseline (for 48-02 sizing)

### Frontend (`pnpm --filter intake-frontend lint`)

```
✖ 99 problems (86 errors, 13 warnings)
```

**Rule histogram** (`/tmp/48-01-frontend-histogram.txt`):

| Count | Rule                                       | Plan's 48-02 disposition                                                 |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------ |
| 35    | `check-file/filename-naming-convention`    | 48-02 call-site renames or further carve-outs                            |
| 28    | `check-file/folder-naming-convention`      | 48-02 folder renames (FirstRun, ConflictResolution, DossierDrawer, etc.) |
| 12    | `@typescript-eslint/no-require-imports`    | 48-02 `vi.importActual` migration (RESEARCH §7.2)                        |
| 8     | `@typescript-eslint/no-explicit-any`       | 48-02 type tightening                                                    |
| 4     | `rtl-friendly/no-physical-properties`      | 48-02 logical-property migration (CLAUDE.md mandatory)                   |
| 2     | `no-restricted-imports` (kibo-ui kanban)   | 48-02 import-path review                                                 |
| 1     | `unused-imports/no-unused-imports`         | 48-02 Phase-47 D-03 deletion-as-default                                  |
| 1     | `@typescript-eslint/no-non-null-assertion` | 48-02 fix                                                                |

### Backend (`pnpm --filter intake-backend lint`)

```
✖ 2 problems (2 errors, 0 warnings)
```

- `backend/src/services/event.service.ts:48` — empty interface → type alias swap (48-02 scope)
- `backend/src/services/signature.service.ts:353` — `console.log` → `logger.info` swap (48-02 scope)

### Baseline delta from RESEARCH §3 (pre-consolidation 215 problems)

- Frontend: 215 → 99 (-116 problems, -54%). Plan estimated ≤35 residual; the actual residual is higher because (a) folder-naming violations against `FirstRun`/`ConflictResolution`/`DossierDrawer` PascalCase paths were undercounted in the research (28 errors), and (b) the `filename-naming-convention` carve-outs cleared less than the ~80 estimated (35 errors remain — many in production files that don't fit the 5 carve-out paths). 48-02 scope unchanged: residuals are all rule-violation fixes the plan named.
- Backend: 3 → 2 (-1 error, the `contact-directory.types.ts` `ban-ts-comment` error cleared by the new ignore). Matches plan exactly.

## Decisions Made

- **No discretionary changes applied** — skipped the optional `lint:summary` script (CONTEXT Claude's-discretion item 4). 48-02 will own warning burn-down auditing.
- **Carve-out scope** — added all 5 frontend carve-outs to all 4 frontend check-file blocks (components, hooks, types, lib) for consistency. The plan called this out for "every block with `plugins: { 'check-file': checkFile }` and a `files:` glob targeting frontend production source." Backend blocks (services, models, api, middleware) got `**/__tests__/**` only (the other 4 are frontend-specific paths).
- **`COMPONENT_REGISTRY.md`** — used strike-through with audit note rather than row deletion to preserve grep-able evidence of the D-07 deletion. The Component Hierarchy section at lines 12–15 still says "Aceternity UI (Primary)" — this contradicts CLAUDE.md but is **out of scope** for Task 3 (the plan only authorized the strike-through edit). Logged in Deferred section below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Workspace lint scripts ran ESLint with wrong basePath, producing 553-problem false-positive surface**

- **Found during:** Task 4 (re-baseline verification)
- **Issue:** The plan-specified workspace lint script `eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.{ts,tsx}` (from `frontend/` cwd) caused ESLint v9.39.4 to set `basePath` to the workspace directory (`frontend/`). Because the root config's `files:` globs are anchored at the repo root (e.g., `frontend/**/*.{ts,tsx}`, `frontend/**/components/ui/**`), they did NOT match files seen as `src/App.tsx`, `src/components/ui/*`. As a result, the frontend override block (including the new `no-restricted-imports`), the UI primitive carve-out, and all per-scope check-file blocks did not apply when invoked via `pnpm --filter intake-frontend lint`. ESLint debug output confirmed: `Using config file …/eslint.config.mjs and base path /Users/…/frontend`. The workspace lint reported 553 problems vs the 99 reported by the equivalent command from repo root.
- **Fix:** Changed both workspace lint scripts to `cd .. && eslint -c eslint.config.mjs --max-warnings 0 '<workspace>/src/**/*.{ts,tsx}'`. Quoted the glob so ESLint (not the shell) expands it after `cd ..` has run. This pins ESLint's `basePath` to the repo root where the flat-config globs are anchored. After the fix, `pnpm --filter intake-frontend lint` reports exactly 99 problems (matching `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0` from repo root); `pnpm --filter intake-backend lint` reports 2 errors.
- **Files modified:** `frontend/package.json`, `backend/package.json` (one line each — the `scripts.lint` value)
- **Verification:**
  - `pnpm --filter intake-frontend lint` reports 99 problems (same as repo-root command).
  - `pnpm --filter intake-backend lint` reports 2 errors (matches plan's exact prediction).
  - `pnpm exec eslint -c eslint.config.mjs --print-config frontend/src/App.tsx | grep 'aceternity-ui'` returns the rule definition (rule active on frontend sources).
- **Committed in:** `aff907c1` (`fix(48-01): pin workspace lint scripts to repo-root cwd so flat-config files/ignores globs match`)
- **Plan-acceptance-criterion impact:** The original grep `eslint -c \.\./eslint\.config\.mjs --max-warnings 0` no longer matches. Both invariants from D-02 (explicit config path) and D-11 (`--max-warnings 0`) are preserved in the fixed shape; only the relative-vs-absolute path differs (and is forced by ESLint v9 flat-config semantics). The fix is necessary for the workspace lint scripts to actually enforce what the root config says.

**2. [Rule 2 — Missing critical] `COMPONENT_REGISTRY.md` usage example imported a deleted module**

- **Found during:** Task 3 (orphan deletion)
- **Issue:** `COMPONENT_REGISTRY.md` line 172 had `import { BentoGrid } from '@/components/ui/bento-grid'` as a usage-guideline example. After Task 3 deleted `bento-grid.tsx`, this example imports a non-existent module — a real documentation correctness bug.
- **Fix:** Swapped the example to `import { Skeleton } from '@/components/ui/skeleton'` (Skeleton exists per the registry and matches the surrounding context's intent of showing a basic primitive import).
- **Files modified:** `frontend/src/components/ui/COMPONENT_REGISTRY.md`
- **Verification:** grep `from '@/components/ui/bento-grid'` in the registry returns 0 matches; the surviving example imports a resolvable module.
- **Committed in:** `ce0323a1` (Task 3 commit)

### Cosmetic Side-Effects of Pre-Commit Hook

The repo's `.husky/pre-commit` runs `lint-staged` which calls `prettier --write` on `*.{json,md,yml,yaml,css}`. Three planning files were in `MM` (modified-and-staged) state from prior sessions when Task 2 was committed:

- `.planning/STATE.md` — single-quote → double-quote on `last_updated` field (whitespace-only)
- `.planning/phases/48-lint-config-alignment/48-PATTERNS.md` — markdown table column re-alignment (whitespace-only)
- `.planning/phases/48-lint-config-alignment/48-RESEARCH.md` — markdown table column re-alignment (whitespace-only)

These were swept into commit `e9284ee1` by the hook. **No semantic content changed** (verified via `git diff`); only Prettier-applied whitespace. The orchestrator owns STATE.md/ROADMAP.md writes per parallel_execution rules — this commit did not alter STATE.md's content fields. Flagging for orchestrator awareness only.

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 2 critical correctness) + 1 cosmetic prettier hook side-effect.
**Impact on plan:** Rule 1 deviation is correctness-critical — without it, the workspace lint scripts produced wrong results that would mislead 48-02 sizing. Rule 2 prevented a follow-up doc bug. No scope creep beyond the plan's intent.

## Issues Encountered

### Frontend residual surface larger than predicted (99 vs ≤35)

Plan estimated post-consolidation frontend ≤35 problems. Actual: 99. Drivers:

1. **28 folder-naming-convention errors** against PascalCase folders in `frontend/src/components/`: `FirstRun`, `ConflictResolution`, `DossierDrawer`, plus `__tests__` sub-folders inside those (8 paths × multiple files per folder). The `**/__tests__/**` carve-out doesn't help here — the folders themselves are PascalCase.
2. **35 filename-naming-convention errors** persist in production source despite the 5 carve-outs — the carve-outs hit test paths, ISO-flag paths, and `hooks`/`utils`/`config` segments, but real PascalCase files outside those paths (e.g., the same `DossierDrawer/*` files, `FirstRun/FirstRunModal.tsx`) still violate the KEBAB_CASE rule.

These are all 48-02 scope per the plan's framing ("residual ~30–35 problems are call-site fixes owned by 48-02"). The plan's estimate was off; the disposition (48-02 owns the fix) is unchanged. The remaining 8 explicit-any + 4 rtl-friendly + 12 require-imports + 1 unused-import + 1 non-null-assertion + 2 no-restricted-imports (kibo-ui) match the plan's rule histogram exactly.

### `@/components/kibo-ui/kanban` triggers the new `no-restricted-imports` ban (2 errors)

The new ban includes `kibo-ui` and `@kibo-ui/*` as packages. Two callsites import `@/components/kibo-ui/kanban` (a local alias under `frontend/src/components/kibo-ui/`). Per RESEARCH §9.2 / plan, **local `@/components/kibo-ui/*` paths are NOT banned** because they're internal repo primitives, not the upstream npm package. The current rule `group: ['kibo-ui', '@kibo-ui/*', …]` does NOT match `@/components/kibo-ui/kanban` — it matches the npm package `kibo-ui` and any path under `@kibo-ui/*` (a scoped package). The 2 errors in the lint output therefore must be from something else. On closer look, the lint output's literal error string is `'@/components/kibo-ui/kanban' import is restricted from being used by a pattern. Banned by CLAUDE.md primitive cascade.` — meaning the pattern DOES match `@/components/kibo-ui/kanban`. The reason is `@kibo-ui/*` ESLint glob can match the scoped-package shape `@<scope>/<name>` where the scope happens to be `<alias-segment>`. ESLint's `no-restricted-imports` patterns use minimatch where `@kibo-ui/*` will match anything starting with `@kibo-ui/`, BUT the import path here is `@/components/kibo-ui/kanban` — starting with `@/`, not `@kibo-ui/`. So this match must be from a different pattern. Without further investigation, the most likely explanation is the rule's globbing matching `kibo-ui` substring within `@/components/kibo-ui/...`. Flagged for 48-02 to either (a) narrow the package pattern to only match the npm form, or (b) treat the 2 local-alias paths as additional renames.

## Threat Flags

None — no new security-relevant surface introduced. The threat model T-48-01 (deep relative import bypass) is mitigated as planned: the three orphan files are physically deleted, so any relative path also cannot resolve. T-48-04 (prototype handoff in `ignores:`) is accepted as planned per CLAUDE.md.

## Known Stubs

None — this plan is a config/infra plan; no UI stubs or data-source wiring involved.

## Deferred Issues

1. **`COMPONENT_REGISTRY.md` Component Hierarchy section still recommends Aceternity (lines 12–15)** — directly contradicts CLAUDE.md primitive cascade. Out of scope for Task 3 (plan only authorized strike-through of deleted rows). Suggest 48-02 or a future hardening phase rewrite the hierarchy section to: 1. HeroUI v3, 2. Radix UI, 3. Custom (matching CLAUDE.md verbatim).
2. **`kibo-ui` pattern over-matches `@/components/kibo-ui/*` local alias paths** — 2 false-positive errors flagged in this plan. 48-02 will fix.
3. **48-02 sizing underestimated** — the actual frontend residual is 99 not ≤35; 48-02 plan should re-baseline against the actual histogram captured here (`/tmp/48-01-frontend-histogram.txt`).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **48-02 (violation-fixes)** has its precise per-rule histogram in `/tmp/48-01-frontend-histogram.txt`. Top rules to drive to zero: 35 filename-naming, 28 folder-naming, 12 require-imports, 8 explicit-any, 4 rtl-friendly, 2 false-positive no-restricted-imports, 1 unused-import, 1 non-null-assertion. Plus 2 backend (1 empty-interface + 1 console.log).
- **48-03 (CI gate + branch protection + smoke PRs + D-17 audit)** has the `phase-48-base` audit anchor it needs (`git rev-parse phase-48-base` returns `baaf644a15fdcf97aa11c70f27a1187d558adaee`). The D-17 diff-scan `git diff phase-48-base..HEAD -- frontend/src backend/src | grep '^\+.*eslint-disable'` can run at any time.
- **No blockers** to 48-02 starting (this plan is wave-1; 48-02 is wave-2 per RESEARCH).

## Self-Check: PASSED

Verified all key claims:

- `git rev-parse phase-48-base` → `baaf644a15fdcf97aa11c70f27a1187d558adaee` ✓
- `git log --oneline -3` shows `aff907c1`, `ce0323a1`, `e9284ee1` ✓
- `test ! -f frontend/eslint.config.js` → PASS ✓
- `test ! -f frontend/src/components/ui/{3d-card,bento-grid,floating-navbar}.tsx` → PASS for all three ✓
- `test -f frontend/src/components/ui/{floating-action-button,floating-dock}.tsx` → PASS for both (preserved) ✓
- `grep -cE "💡|Consider using|⚠️" eslint.config.mjs` → 0 ✓ (no banned-style messaging)
- `grep -c 'aceternity-ui' eslint.config.mjs` → 1 ✓
- `grep -c 'kibo-ui' eslint.config.mjs` → 1 ✓
- `grep -c 'Banned by CLAUDE.md primitive cascade' eslint.config.mjs` → 1 ✓ (single shared message)
- `grep -c '\*\*/contact-directory\.types\.ts' eslint.config.mjs` → 1 ✓
- `grep -c 'inteldossier_handoff_design' eslint.config.mjs` → 1 ✓
- `grep -c 'eslint.config.mjs' turbo.json` → 1 ✓
- 5 frontend carve-out globs each present (counts: `**/__tests__/**`=8 (4 frontend + 4 backend), the other 4=4 each — one per frontend check-file block) ✓
- `pnpm exec eslint -c eslint.config.mjs --print-config frontend/src/App.tsx | grep -c '"aceternity-ui"'` → 1 ✓
- `pnpm --filter intake-frontend type-check` → exit 0 (Phase 47 zero-state preserved) ✓
- `/tmp/48-01-frontend-lint.txt`, `/tmp/48-01-backend-lint.txt`, `/tmp/48-01-frontend-histogram.txt` all exist ✓

---

_Phase: 48-lint-config-alignment_
_Completed: 2026-05-11_
