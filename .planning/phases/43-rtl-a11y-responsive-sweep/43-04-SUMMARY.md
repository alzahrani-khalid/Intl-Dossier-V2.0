---
phase: 43-rtl-a11y-responsive-sweep
plan: 04
subsystem: qa-focus-outline
tags: [qa, focus-outline, visual, a11y, playwright, design-tokens]
requires:
  - .planning/phases/43-rtl-a11y-responsive-sweep/43-00-SUMMARY.md
  - frontend/tests/e2e/helpers/qa-sweep.ts (assertFocusOutlineVisible, settlePage)
  - frontend/tests/e2e/support/list-pages-auth.ts (loginForListPages)
  - frontend/src/design-system/DesignProvider.tsx (window.__design hatch)
provides:
  - frontend/tests/e2e/qa-sweep-focus-outline.spec.ts (8 tests — Settings × 4 dirs × 2 modes)
affects:
  - Plan 43-07 (Wave 2 gate) — generates + commits the 8 baseline PNGs after human review
tech-stack:
  added: []
  patterns:
    - 'window.__design hatch for direction/mode flips (no UI clicks; deterministic per RESEARCH §5)'
    - 'afterEach reset to v6.0 defaults (bureau/light/32/comfortable) to prevent test poisoning'
    - 'Programmatic 3:1 contrast probe via assertFocusOutlineVisible paired with visual baseline'
key-files:
  created:
    - frontend/tests/e2e/qa-sweep-focus-outline.spec.ts
  modified: []
decisions:
  - 'Locale NOT part of the matrix per D-08 — focus-ring tokens are language-agnostic; locale=en for all 8'
  - 'Generic PRIMITIVE_SELECTOR (main button|a|input :visible) — fails fast if a direction/mode renders no interactive (real bug for Plan 43-07 to surface)'
  - 'Baselines NOT committed in this plan — Plan 43-07 runs --update-snapshots, then human reviews + commits the 8 PNGs (per parallel_execution constraint)'
  - 'console.warn (not console.log) for diagnostics — repo eslint config allows warn/error only'
metrics:
  duration_minutes: ~6
  completed_date: 2026-05-03
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  commits: 2
---

# Phase 43 Plan 04: qa-sweep-focus-outline (D-08)

Wave 1 cross-cutting sweep spec implementing D-08: Settings page × 4
directions × 2 modes = 8 focus-outline visual baselines, each paired
with a programmatic ≥3:1 contrast assertion. Direction and mode are
flipped via the `window.__design` test hatch (env-gated to DEV/test);
no UI clicks against a direction switcher are involved. `test.afterEach`
resets the hatch to v6.0 defaults so subsequent specs aren't poisoned.

Per the parallel_execution note in the prompt: this plan authors the
spec only — the actual baseline PNGs are generated and committed in
Plan 43-07 after human approval.

## What Shipped

### `frontend/tests/e2e/qa-sweep-focus-outline.spec.ts` (~113 lines, new)

A single `test.describe` block enumerating 4 directions × 2 modes via
nested loops, yielding **exactly 8 tests**:

```
chancery/light  chancery/dark
situation/light situation/dark
ministerial/light ministerial/dark
bureau/light   bureau/dark
```

Per-test flow:

1. `loginForListPages(page, 'en')` — locale held at `en` per D-08
2. `page.goto('/settings')`
3. `settlePage(page)` — RESEARCH §10 paint-settle pattern
4. `page.waitForFunction` polls `window.__design.setDirection` to ensure
   the test hatch is mounted (T-43-10 mitigation: hatch tree-shakes from
   prod, must exist under DEV)
5. `page.evaluate` invokes `__design.setDirection(direction)` +
   `__design.setMode(mode)` — token swap is synchronous in
   DesignProvider; 150 ms paint settle absorbs the React commit
6. `target.focus()` on the first visible interactive in `<main>`
   (`main button:visible, main a[href]:visible, main input:visible`),
   then 50 ms settle
7. `assertFocusOutlineVisible(page, PRIMITIVE_SELECTOR)` — programmatic
   ≥3:1 contrast probe (returns `{outlineColor, bgColor, ratio}`)
8. `expect(page).toHaveScreenshot('${direction}-${mode}-focused-primitive.png')`
   — visual baseline named per D-08 convention
9. `console.warn` diagnostic line: outline color, bg color, ratio (CI logs)

`test.afterEach` resets the hatch to **v6.0 defaults** — bureau / light /
hue 32 / comfortable density — guarded by `if (hatch)` and `.catch(() => {})`
so a teardown failure on a navigated page doesn't mask the test result.
This addresses RESEARCH §5 pitfall and is the T-43-11 mitigation.

### Why locale is excluded from the matrix

Focus-ring tokens (`--focus-ring`, outline color/width) are
language-agnostic. Adding `en/ar` would double the baseline count to
16 with zero new failure modes — the focus-ring outline value is the
same regardless of the writing direction of the page.

### Why baselines are NOT committed here

Per the prompt's `parallel_execution` block:

> Plan 43-04 generates focus-outline screenshot baselines. The actual
> baseline PNG generation/commit happens in Plan 43-07 (gate). Your job
> is to author the spec; do NOT generate baselines or commit any
> \*.png files in this plan.

The first run will fail with `snapshot not found` for all 8 baselines.
Plan 43-07 runs `--update-snapshots`, a human reviews the 8 PNGs, and
they're committed there.

## Verification

| Check                                                                  | Result                               |
| ---------------------------------------------------------------------- | ------------------------------------ |
| `frontend/tests/e2e/qa-sweep-focus-outline.spec.ts` exists             | PASS                                 |
| `DIRECTIONS = ['chancery', 'situation', 'ministerial', 'bureau']`      | PASS                                 |
| `MODES = ['light', 'dark']`                                            | PASS                                 |
| Imports `settlePage, assertFocusOutlineVisible` from helpers           | PASS                                 |
| Uses `window.__design` hatch (no UI clicks)                            | PASS                                 |
| `test.afterEach` present, resets to bureau/light/32/comfortable        | PASS                                 |
| `playwright test ... --list` reports `Total: 8 tests in 1 file`        | PASS (verified via main-repo runner) |
| Baseline filename pattern `${direction}-${mode}-focused-primitive.png` | PASS                                 |
| Locale NOT varied (single `loginForListPages(page, 'en')`)             | PASS                                 |
| No PNG files created or committed                                      | PASS (`git status` clean)            |
| No deletions in commits                                                | PASS                                 |

`playwright --list` was executed against the main checkout because the
worktree has no `node_modules` (Plan 43-00 sentinel — Wave 0 documented
that `pnpm test:qa-sweep` from a fresh worktree exits with `No tests found`
because dependencies live in the main checkout). The spec file was copied
into the main repo for the `--list` check, then deleted; the canonical
copy in the worktree is unchanged. List output confirmed all 8 test names
in the expected `[chromium]` project.

## Commits

| Hash       | Type | Subject                                                          |
| ---------- | ---- | ---------------------------------------------------------------- |
| `a3f26ac3` | test | add qa-sweep-focus-outline.spec.ts (Settings × 4 dirs × 2 modes) |
| `cd0a99cf` | fix  | swap console.log → console.warn for lint compliance              |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `console.log` violates `no-console` lint rule**

- **Found during:** Task 1 commit (pre-commit `eslint --fix` hook reported
  `error  Unexpected console statement. Only these console methods are
allowed: warn, error, table, info  no-console`)
- **Issue:** The plan's task body specified `console.log(...)` for
  CI-log diagnostics, but the repo's ESLint config (and CLAUDE.md
  "Console Usage: Warn, but allow `console.warn()` and `console.error()`")
  forbids `console.log`.
- **Fix:** Changed to `console.warn(...)`. The diagnostic output
  (outline color / bg color / contrast ratio) is preserved; only the
  log level changed. The first commit (`a3f26ac3`) had already landed
  with `console.log` because the hook reported the error but the
  commit itself succeeded; the follow-up fix commit (`cd0a99cf`)
  brings the file into lint compliance without amending history.
- **Files modified:** `frontend/tests/e2e/qa-sweep-focus-outline.spec.ts`
- **Commit:** `cd0a99cf`

No other deviations. Plan executed exactly as written.

## Threat Model Compliance

| Threat ID | Disposition | Mitigation Applied                                                                                                                                                       |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-43-10   | mitigate    | `page.waitForFunction(() => typeof window.__design?.setDirection === 'function', { timeout: 5000 })` fails fast if hatch missing (e.g. accidentally NODE_ENV=production) |
| T-43-11   | mitigate    | `test.afterEach` resets hatch to bureau / light / hue 32 / comfortable density before next test runs                                                                     |

## Wave 2 Handoff Notes (for Plan 43-07)

1. **Generate baselines:** `pnpm -C frontend exec playwright test qa-sweep-focus-outline.spec.ts --update-snapshots --reporter=list`
2. **Expected output:** 8 PNGs at
   `frontend/tests/e2e/qa-sweep-focus-outline.spec.ts-snapshots/`
   (one per direction/mode combo). Filenames follow
   `${direction}-${mode}-focused-primitive.png` exactly.
3. **Human review:** Each PNG should show a focused interactive in the
   Settings page rendered at the named direction/mode — focus ring
   visible, sufficient contrast against the parent background. The
   programmatic ≥3:1 probe runs in the same test, so any baseline that
   was _generated_ already passed contrast.
4. **Commit:** Stage the 8 PNGs only (not the spec file — already
   committed here); commit subject `test(43-07): add 8 focus-outline
baselines for Settings (D-08)`.
5. **Note on dev-server requirement:** The hatch only exists when the
   app is built/served under DEV. Plan 43-07 must spin up `pnpm dev`
   (or equivalent) before running Playwright; CI uses the existing
   `qa-sweep` job in `.github/workflows/e2e.yml` which handles this.

## Self-Check: PASSED

- `[x]` `frontend/tests/e2e/qa-sweep-focus-outline.spec.ts` exists in worktree
- `[x]` Commit `a3f26ac3` present in `git log`
- `[x]` Commit `cd0a99cf` present in `git log`
- `[x]` `playwright --list` reports 8 tests
- `[x]` No `*.png` files staged or committed
- `[x]` No modifications to `STATE.md` or `ROADMAP.md` (orchestrator-owned)
