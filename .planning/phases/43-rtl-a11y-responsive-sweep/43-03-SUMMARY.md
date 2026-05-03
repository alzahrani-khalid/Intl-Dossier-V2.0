---
phase: 43-rtl-a11y-responsive-sweep
plan: 03
subsystem: qa-sweep-keyboard
tags: [qa, keyboard, a11y, playwright, e2e]
dependency_graph:
  requires:
    - 43-00 (helpers/v6-routes.ts, helpers/qa-sweep.ts: tabWalkAllInteractives + settlePage)
    - support/list-pages-auth.ts (loginForListPages)
  provides:
    - 'Per-route Tab-walk membership assertion × 15 routes × 2 locales (30 tests)'
  affects:
    - 'Phase 43 Wave 2 gate (43-07): keyboard-reachability evidence for v6.0 surface'
tech-stack:
  added: []
  patterns:
    - 'Membership-only assertion (set equality) — order intentionally NOT asserted (D-09)'
    - 'Resting-state sweep — no modal/drawer triggers (RESEARCH §8 portal handling)'
    - 'Failure label format: [route][locale] (RESEARCH "CI failure messages")'
key-files:
  created:
    - frontend/tests/e2e/qa-sweep-keyboard.spec.ts
  modified: []
decisions:
  - 'Imported tabWalkAllInteractives + settlePage verbatim from Wave 0 helper (no per-route customization)'
  - 'Pre-sweep body click + 50ms settle to anchor focus at document root before first Tab'
  - 'Strict equality reached.size === count (no tolerance band) per D-09'
metrics:
  duration: ~6 min
  completed: 2026-05-03
  tasks_completed: 1
  files_created: 1
  files_modified: 0
---

# Phase 43 Plan 03: qa-sweep-keyboard Summary

One Playwright spec asserting that every visible interactive on every v6.0 route × locale is reachable via Tab — membership equality between counted and reached sets, not order.

## What Was Built

A single test file, `frontend/tests/e2e/qa-sweep-keyboard.spec.ts`, that iterates `V6_ROUTES × locales` (15 × 2 = 30 tests). For each combination it:

1. Logs in via `loginForListPages(page, locale)`
2. Navigates to `route.path` and calls `settlePage`
3. Clicks `body` at `(1, 1)` then waits 50 ms to anchor focus at the document root
4. Calls `tabWalkAllInteractives(page)` (presses Tab N+1 times, capturing focused-element identity keys)
5. Asserts `reached.size === count` with a `[route][locale]` failure label

Per D-09 the assertion is strict membership equality — the spec does not test focus order, and it does not click anything to open modals or drawers (resting-state surface only, per RESEARCH §8).

## Verification Evidence

```
test -f frontend/tests/e2e/qa-sweep-keyboard.spec.ts                                              [PASS]
grep -q "import { V6_ROUTES }" …                                                                  [PASS]
grep -q "import { tabWalkAllInteractives, settlePage }" …                                         [PASS]
grep -q "expect(" … && grep -q "reached.size" … && grep -q "\.toBe(count)" …                      [PASS]
playwright test qa-sweep-keyboard.spec.ts --list                                                  [PASS]
  → "Total: 30 tests in 1 file"
```

The `--list` enumeration output confirmed the expected 30 tests across all 15 routes (dashboard, kanban, calendar, countries, organizations, persons, forums, topics, working_groups, engagements, briefs, after_actions, tasks, activity, settings) × 2 locales (en, ar). The spec was not actually executed against the dev server (that runs in plan 43-07, the Wave 2 gate); only static enumeration was required by the plan's verify block.

## Tasks Completed

| Task | Name                                        | Commit   | Files                                        |
| ---- | ------------------------------------------- | -------- | -------------------------------------------- |
| 1    | Create qa-sweep-keyboard.spec.ts (30 tests) | 5ed8a847 | frontend/tests/e2e/qa-sweep-keyboard.spec.ts |

## Deviations from Plan

None. The plan executed exactly as written. The spec body matches the snippet in the plan verbatim (with the addition of a file-header docstring summarising D-09 intent and the resting-state contract).

### Out-of-scope observations (logged, NOT fixed)

While running `playwright --list` for verification I observed that the worktree was missing `node_modules` (worktrees inherit only tracked files, not installed dependencies) and that `frontend/node_modules` in the main repo was missing the `culori` package declared in `frontend/package.json`. I worked around both by symlinking `node_modules` into the worktree and running `pnpm install` against the main repo's frontend. After the verification run I removed the symlinks. The missing-package situation is Wave 0 / phase-43 infrastructure (touched in plan 43-00 when adding `helpers/contrast.ts`, which imports `culori`) — out of scope for this plan, no action taken.

## Decisions Made

1. **Imported helpers verbatim** — no per-route customization of `tabWalkAllInteractives` or `settlePage`. Any selector misses or settle-timing issues belong in the helper, not the spec (matches CLAUDE.md "Surgical Changes").
2. **Body-click anchor** — the plan's snippet anchors focus at the document root with `body.click({ position: { x: 1, y: 1 } })` followed by a 50 ms wait. Kept verbatim; without this anchor the first Tab press could resume from a previously-focused element left over from `loginForListPages`.
3. **No tolerance band on the equality check** — D-09 requires strict equality. If a HeroUI portal legitimately hoists a target out of tab order, the helper or the route source must change, not the assertion. Documented in the spec's body comment.

## Threat Mitigations Applied

| Threat ID | Mitigation                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-43-08   | Deferred to plan 43-07 (Wave 2 gate). Helper updates would land there, not in this spec.                                                          |
| T-43-09   | Identity key uses `outerHTML.slice(0, 200)` — focus jumping to the address bar would not match any DOM element key, so chance pass is impossible. |

## Self-Check: PASSED

- File exists: `frontend/tests/e2e/qa-sweep-keyboard.spec.ts` — FOUND
- Commit `5ed8a847` — FOUND on `worktree-agent-a6d36452c1b1f4589`
- Plan verify command (`--list` showing `Total: 30 tests`) — PASS
