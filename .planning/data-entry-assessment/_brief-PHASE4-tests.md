# Phase 4 — Test verification (single worker)

The data-entry quality sweep landed ~71 commits on `fix/prod-quality-sweep-260627` (baseline =
pre-sweep commit `e72b928d`). `tsc` (FE+BE), ESLint `--max-warnings 0`, and `pnpm build` are all
GREEN. Your job: make sure the **Vitest** test suite reflects the new (correct) behavior — without
chasing pre-existing noise.

## Scope (IMPORTANT — stay tight)

1. Compute the sweep's changed source files: `git diff e72b928d..HEAD --name-only -- 'frontend/src'
'backend/src' 'supabase/functions' | grep -v '\.test\.'`.
2. For each changed source file, find its colocated/related test (`*.test.ts(x)` next to it, or under
   `tests/` / `__tests__/` matching the name). Build the list of **relevant** test files.
3. Run ONLY those relevant tests (e.g. `cd frontend && pnpm exec vitest run <paths>`; backend
   similarly). Do NOT run the entire suite or any Playwright/E2E (they need a deployed app).
   If a test needs infra you don't have (live DB, Redis), skip it and note it — do not hang.

## Triage each FAILING relevant test

- **(a) Test asserted OLD, now-fixed buggy behavior** (e.g. expected the pre-sweep wrong column,
  the missing `title`, the swallowed error, the un-validated owner, the 1-day-early date) → **UPDATE
  the test** to assert the new correct behavior. Reference the fix (finding ID / commit). Keep the
  test meaningful — do NOT weaken it to `expect(true)` or delete assertions to force green.
- **(b) Real regression the sweep introduced** → **FIX the source** (minimal, in the sweep's spirit).
  Then the test should pass unchanged.
- **(c) Pre-existing / unrelated failure** (fails for reasons unrelated to a sweep-changed file, or
  would also fail at baseline `e72b928d`) → **do NOT touch.** List it in your report as pre-existing.

## Rules

- Commit fixes with **`HUSKY=0 git commit`** (skips the slow build hook), staging only the files you
  changed by explicit path (never `-A`). One atomic commit per logical fix, conventional-commit msgs.
- Do NOT push, do NOT open a PR, do NOT touch `main`. Do NOT edit files outside what a failing test
  requires.
- Do NOT regress `tsc`/lint — keep types and lint clean.
- Work fully autonomously; never ask a question.

## Report (print, then stop)

`LANE PHASE4 DONE` followed by: test command(s) used, # relevant test files run, pass/fail totals,

# stale-tests updated (with which), # real regressions fixed (with which + the source file),

pre-existing failures skipped (list), and final status (all-relevant-green? yes/no).
