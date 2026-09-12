---
phase: 99-arabic-coverage
plan: 01
subsystem: e2e-oracles
tags: [playwright, arabic, dates, rendered-oracle, fixtures]
requires: []
provides:
  - 'the shared Phase 99 settle and asserted-locale law'
  - '99-ar02-dates.spec.ts: 8 exact rendered date/relative-time tests'
  - '99-ar03-leak.spec.ts: 10 exact English-leak and typography tests'
  - 'a fail-closed three-status position fixture with a pg_constraint preflight'
affects:
  - '99-08, 99-10, 99-12, 99-19, 99-20, 99-21, 99-24, and the 99-39 closing battery'
tech-stack:
  added: []
  patterns:
    - 'chromium-en + ?lng= + expectLocale for both locale legs'
    - 'main visible -> best-effort networkidle -> 3 s dwell before rendered capture'
    - 'one spec path per Playwright invocation with a hardcoded collected count'
key-files:
  created:
    - tests/e2e/helpers/settle.ts
    - tests/e2e/99-ar02-dates.spec.ts
    - tests/e2e/99-ar03-leak.spec.ts
    - tests/e2e/fixtures/99-positions-seed.mjs
    - .planning/phases/99-arabic-coverage/99-01-SUMMARY.md
  modified: []
decisions:
  - 'D-06: every rendered absence assertion has a same-test positive population/language control'
  - 'D-09: the declared test titles and the hardcoded 8/10 counts are downstream command-oracle API'
  - 'D-31/D-34: Latin digits are asserted while both languages run through ?lng= in chromium-en'
  - 'D-33: the only hoisted mechanism is the 98-copy04 settle/expectLocale pair'
  - 'D-35: C7 has three fixture-driven tests; no skip or ambient-data fallback exists'
metrics:
  completed: 2026-08-19
  tasks: 1
  files: 5
---

# Phase 99 Plan 01: Rendered Oracles Summary

The allowlisted surface now contains the shared settle law, the 8-test dates oracle, the 10-test
leak oracle, and the three-status C7 seed/teardown fixture. No application source, i18n bundle,
pre-law helper, plan, or sibling summary changed.

## Task commits

1. `c857de7f8` — `test(99): add rendered Arabic oracle specs`
2. Summary/evidence commit — this file

## Population re-derived at the run's starting HEAD

Command:

```text
git rev-parse --short HEAD
for file_target in tests/e2e/helpers/settle.ts tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.ts tests/e2e/fixtures/99-positions-seed.mjs; do
  git cat-file -e "HEAD:$file_target" 2>/dev/null && echo "HEAD_PRESENT $file_target" || echo "HEAD_ABSENT $file_target"
done
git grep -n "const settle" HEAD -- tests/e2e
```

Output:

```text
HEAD=b08327b92
HEAD_ABSENT tests/e2e/helpers/settle.ts
HEAD_ABSENT tests/e2e/99-ar02-dates.spec.ts
HEAD_ABSENT tests/e2e/99-ar03-leak.spec.ts
HEAD_ABSENT tests/e2e/fixtures/99-positions-seed.mjs
HEAD:tests/e2e/95-queue-renders.spec.ts:89:const settle = async (page: Page): Promise<QueueState> => {
HEAD:tests/e2e/95-search-renders.spec.ts:80:const settle = async (page: Page, label: string): Promise<PageState> => {
HEAD:tests/e2e/96-count-agreement.spec.ts:286:    const settlePanel = async (): Promise<void> => {
HEAD:tests/e2e/98-copy04-voice.spec.ts:248:const settle = async (page: Page): Promise<void> => {
```

Population: the five created files in `key-files.created`. Outside it: all product repairs, i18n
JSON, the 98-copy0N specs, the 95/96 pre-law helpers, ar-smoke, static instruments, and sibling
summaries.

## Collection record: dates oracle

Command:

```text
pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list
```

Output:

```text
Listing tests:
  [chromium-en] › 99-ar02-dates.spec.ts:118:5 › UI99-C1C2C4 ar /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:122:5 › UI99-C1C2C4 ar /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:126:5 › UI99-C1C2C4 ar /events
  [chromium-en] › 99-ar02-dates.spec.ts:130:5 › UI99-C1 en control /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:134:5 › UI99-C1 en control /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:138:5 › UI99-C1 en control /events
  [chromium-en] › 99-ar02-dates.spec.ts:142:5 › UI99-C3 ar /activity relative time
  [chromium-en] › 99-ar02-dates.spec.ts:164:5 › UI99-C3 en control /activity relative time
Total: 8 tests in 1 file
```

The line numbers above are the verbatim pre-format collection output; a later collection retained
the same titles, order, and total.

## Collection record: leak oracle

Command:

```text
pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list
```

Output:

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:156:5 › UI99-C5 ar 404
  [chromium-en] › 99-ar03-leak.spec.ts:170:5 › UI99-C5 en control 404
  [chromium-en] › 99-ar03-leak.spec.ts:184:5 › UI99-C6 ar intake queue
  [chromium-en] › 99-ar03-leak.spec.ts:201:5 › UI99-C6 en control intake queue
  [chromium-en] › 99-ar03-leak.spec.ts:217:5 › UI99-C7 ar banner under_review
  [chromium-en] › 99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner approved
  [chromium-en] › 99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner published
  [chromium-en] › 99-ar03-leak.spec.ts:229:5 › UI99-C8 ar search chips
  [chromium-en] › 99-ar03-leak.spec.ts:247:5 › UI99-C9 ar latin run scan
  [chromium-en] › 99-ar03-leak.spec.ts:274:5 › UI99-C10 ar tajawal
Total: 10 tests in 1 file
```

The line numbers above are the verbatim pre-format collection output; a later collection retained
the same titles, order, and total.

## Command oracle: dates

```text
PATH="/opt/homebrew/bin:$PATH"
test -f tests/e2e/99-ar02-dates.spec.ts
pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>&1 | command grep -E "Total: 8 tests in 1 file"
pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
run_exit=$?
echo "DATES_RED_RUN_EXIT=$run_exit"
test "$run_exit" -ne 0
```

```text
Total: 8 tests in 1 file
◇ injected env (0) from .env.test // tip: ⌘ suppress logs { quiet: true }
[WebServer] (node:59956) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] Token not found in system keyring
[WebServer] Doppler Error: secret not found in keyring
Error: Process from config.webServer was not able to start. Exit code: 1

To open last HTML report run:

  pnpm exec playwright show-report

DATES_RED_RUN_EXIT=1
```

## Command oracle: leak

```text
PATH="/opt/homebrew/bin:$PATH"
test -f tests/e2e/99-ar03-leak.spec.ts
pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>&1 | command grep -E "Total: 10 tests in 1 file"
pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps
run_exit=$?
echo "LEAK_RED_RUN_EXIT=$run_exit"
test "$run_exit" -ne 0
```

```text
Total: 10 tests in 1 file
◇ injected env (0) from .env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
[WebServer] (node:79477) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] Token not found in system keyring
[WebServer] Doppler Error: secret not found in keyring
Error: Process from config.webServer was not able to start. Exit code: 1

To open last HTML report run:

  pnpm exec playwright show-report

LEAK_RED_RUN_EXIT=1
```

## Fixture execution record

The fixture's source contains and executes this query before its first INSERT:

```sql
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.positions'::regclass
  AND contype = 'c'
ORDER BY conname
```

Command:

```text
node -e "import('./tests/e2e/fixtures/99-positions-seed.mjs').then(m=>m.seedPositions()).then(ids=>console.log(JSON.stringify(ids))).catch(error=>{console.error(error.message);process.exit(1)})"
fixture_exit=$?
echo "FIXTURE_PROBE_EXIT=$fixture_exit"
test "$fixture_exit" -ne 0
```

Output:

```text
◇ injected env (0) from .env.test // tip: ⌘ custom filepath { path: '/custom/path/.env' }
SUPABASE_URL missing from .env.test
FIXTURE_PROBE_EXIT=1
```

No constraint text or seeded ids were produced in this worktree; the fail-closed precondition
returned before any INSERT. `seedPositions()` has no fallback branch: with a catalog connection it
prints the verified CHECK definitions, inserts all three rows through the service-role client,
prints and returns `{under_review, approved, published}`, and `afterAll` deletes those exact ids.

## Static checks

Commands and output:

```text
$ pnpm exec eslint tests/e2e/helpers/settle.ts tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.ts
(no output; exit 0)

$ node --check tests/e2e/fixtures/99-positions-seed.mjs
(no output; exit 0)

$ pnpm exec prettier --check tests/e2e/helpers/settle.ts tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.ts tests/e2e/fixtures/99-positions-seed.mjs
Checking formatting...
All matched files use Prettier code style!

$ node -e "import('./tests/e2e/fixtures/99-positions-seed.mjs').then(m=>{if(typeof m.seedPositions!=='function'||typeof m.teardownPositions!=='function')process.exit(1);console.log(m.RULED_POSITION_STATUSES.join(','))})"
◇ injected env (0) from .env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
under_review,approved,published

$ rg -n "95-search-renders|95-queue-renders|96-count-agreement|test\.skip|\.skip\(" tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.ts
(no matches; exit 1, expected zero population)
```

## Full-suite budget

Command: `pnpm test`

Verbatim failure excerpt and terminal summary:

```text
Error: EPERM: operation not permitted, open '/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260818-213332-0000000000000015--P99-01/node_modules/.vite-temp/vitest.config.ts.timestamp-1787089625191-b3bb78f1bd8e18.mjs'

 Tasks:    3 successful, 5 total
Cached:    3 cached, 5 total
  Time:    592ms
Failed:    agent-runtime#test

ERROR run failed: command exited (1)
ELIFECYCLE Test failed. See above for more details.
```

The harness-owned `node_modules` symlink was not modified. The frontend production build replayed
green before Vitest stopped on the forbidden `.vite-temp` write.

## Named handoffs

- 99-20/99-21 own absolute and relative date repairs and the fresh 8-test green.
- 99-08/99-24 own the intake copy and its ar/en C6 legs.
- 99-10 owns the C8 chip extraction; 99-12 owns the three C7 banner branches; 99-19 owns C5.
- 99-39 owns the fresh consolidated 8+10 rendered battery and human sign-off.

## Scope

`git status --short` after the full-suite attempt listed only the four new test files/directories;
this summary is the fifth and final allowlisted path. No out-of-scope path changed.
