---
phase: 101-ci-gates-green
plan: 02
status: blocked
requirements: [CARRY-04]
criterion_3: not-closed
d11: closed
run_at: ad6231fbe
deletion_commit: ad6231fbe
blocked_on: 'dossiers-a11y.spec.ts [T042] fails deterministically on spec locator drift; the fix is in a file no Phase 101 plan owns'
---

# 101-02 SUMMARY: dossiers-a11y is NOT shown green (15/16, [T042] red, diagnosed); focus-indicators deleted (D-11 closed)

## Result

- **Criterion 3 is NOT closed.** The criterion-3 oracle ran byte-identical at `ad6231fbe`, through the wrapper
  in its legacy positional form. It read `expected=15 unexpected=1 skipped=0 flaky=0`, the wrapper exited **1**
  and the oracle exited **1**. The failing test is `[T042] Collapsible sections respond to keyboard
  interaction`, which timed out at `tests/a11y/dossiers-a11y.spec.ts:141:47`. The same test failed the same way
  in **4 of 4** runs on this machine at load averages from 1.08 to ~9.
- **The cause is spec drift, not an application defect** (§3, read from the Playwright trace).
  `button[aria-expanded]`.first() on the country dossier page resolves to the **sidebar user-menu trigger**
  (`data-testid="user-menu"`, `aria-haspopup="menu"`), not a collapsible section. The first Enter opens the
  menu and Radix moves focus to its first item. The second Enter activates that item, and the page navigates
  to `/settings?section=profile`, which has no `button[aria-expanded]`, so the next `getAttribute` waits out
  the 30 s test timeout. The trigger has been the first match since `e012f4c66` (2026-08-15, "mount NavUser
  as the sidebar user card"), two days after ORCH-2 recorded this spec 16/16.
- **Not fixed here, deliberately.** The fix is in `frontend/tests/a11y/dossiers-a11y.spec.ts`. That file is
  outside this plan's `files_modified`, and D-05 forbids substituting another spec or annotating the test
  away. §5 records that **no Phase 101 plan owns this file**.
- **D-11 is closed.** `frontend/tests/a11y/focus-indicators.spec.ts` was deleted as a git-tracked removal in
  `ad6231fbe`. The D-11 oracle exits **0**: `untracked absent`, control `tracked`, and the a11y project still
  lists `Total: 182 tests in 13 files`.
- **Why `status: blocked` and not `complete`.** The PLAN asks for `status: complete`, and completion is
  derived from that marker. This plan's done condition (16/16, wrapper exit 0) is false. Writing `complete`
  would make the next compile record an unmet criterion as met, so this plan reads as not done until §5 is
  resolved.

## 1. Criterion-3 oracle (the PLAN's first `oracle: command`), verbatim

The command was extracted from the PLAN front-matter with js-yaml and run as `bash -c "$(cat o1.sh)"` from the
worktree root. The extracted text is 2415 bytes, sha256 `21df3e4621b5c50ebb86ee66cedc103900b77a31f75edf12ad9714752924b2b4`.
Beforehand, a process census found no running `playwright`, `vitest` or `pw-run-reaped` process, 5173 had 0
listeners, and `E2E_BASE_URL` was unset.

```
HEAD=ad6231fbe start=2026-09-11 07:47:38 +0300 load=[2.00 3.01 2.88]
o1 exit=1 end=07:48:15 load=[2.51 3.07 2.91]
P101-02 wrapper_rc=1 (0 = clean verdict AND playwright green; 90 = session unclean, report withheld)
P101-02-C3 expected=15 unexpected=1 skipped=0 flaky=0 want expected=16 unexpected=0 skipped=0 flaky=0
FAIL: dossiers-a11y.spec.ts did not pass 16/16 with zero skips
```

The oracle got past all of its exit-3 prechecks. Those prechecks were: routing grep (D-13), `.env.test`
materialised, `E2E_BASE_URL` unset, 5173 free, and `--list` = `Total: 16 tests`. The run itself executed.

**Wrapper exit code: 1.** Under the wrapper's contract (`scripts/pw-run-reaped.mjs:47-48`), a clean verdict
exits with Playwright's own code and a non-clean one exits 90 with the report withheld. So exit 1 plus a
published report means the session verdict was clean and Playwright itself was red.

**Published report path:** `<worktree>/frontend/test-results/p101-02-a11y.json`. The wrapper archives every
published report outside the worktree, so the durable copy is
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T04-48-15-389Z-p101-02-a11y.json`.

### 1.1 The JSON reporter `stats` block, verbatim (`JSON.stringify(r.stats, null, 2)` of the published report)

```json
{
  "startTime": "2026-09-11T04:47:39.309Z",
  "duration": 35866.877,
  "expected": 15,
  "skipped": 0,
  "unexpected": 1,
  "flaky": 0
}
```

Controls for the zeros. The same reader printed `unexpected=1`, so it can see a non-zero field. `skipped=0`
also agrees with the spec's annotation count: `grep -cE 'fixme|\.skip\(' tests/a11y/dossiers-a11y.spec.ts` →
`0`, beside the control `grep -c fixme tests/a11y/positions-keyboard-nav.spec.ts` → `13`.

### 1.2 Per-test results from the same report

| status | duration | test |
| ------ | -------: | ---- |
| passed | 6784 ms | Dossier Accessibility Scans > [T036] country dossier passes axe-core WCAG AA scan |
| passed | 6903 ms | Dossier Accessibility Scans > [T037] organization dossier passes axe-core WCAG AA scan |
| passed | 7108 ms | Dossier Accessibility Scans > [T038] person dossier passes axe-core WCAG AA scan |
| passed | 5824 ms | Dossier Accessibility Scans > [T039] engagement dossier passes axe-core WCAG AA scan |
| passed | 6901 ms | Dossier Accessibility Scans > [T0310] forum dossier passes axe-core WCAG AA scan |
| passed | 7018 ms | Dossier Accessibility Scans > [T0311] working_group dossier passes axe-core WCAG AA scan |
| passed | 5559 ms | Dossier Accessibility Scans > Dossiers hub page passes axe-core scan |
| **timedOut** | **30333 ms** | **Keyboard Navigation Tests > [T042] Collapsible sections respond to keyboard interaction** |
| passed | 5487 ms | Keyboard Navigation Tests > Tab navigation moves through interactive elements in order |
| passed | 4061 ms | Keyboard Navigation Tests > Escape key closes open dialogs/modals |
| passed | 4467 ms | Focus Indicator Visibility Tests > [T043] Interactive elements have visible focus indicators |
| passed | 3360 ms | Focus Indicator Visibility Tests > Links have visible focus indicators |
| passed | 4636 ms | ARIA Attribute Tests > Collapsible sections have proper ARIA attributes |
| passed | 4773 ms | ARIA Attribute Tests > Images have alt text |
| passed | 4865 ms | ARIA Attribute Tests > Tables have proper ARIA roles |
| passed | 4828 ms | RTL Accessibility Tests > RTL mode passes accessibility scan |

The failing test's `errors[]`, verbatim with ANSI stripped and the worktree path shortened to `<worktree>`:

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.getAttribute: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[aria-expanded]').first()


  139 |       await page.waitForTimeout(350)
  140 |
> 141 |       const finalExpanded = await firstButton.getAttribute('aria-expanded')
      |                                               ^
  142 |       expect(finalExpanded).toBe(initialExpanded)
  143 |     }
  144 |   })
    at <worktree>/frontend/tests/a11y/dossiers-a11y.spec.ts:141:47
```

### 1.3 The wrapper log: why the oracle's own log does not exist, and the verdict line from a run that kept it

After the oracle run, `frontend/test-results/` held `.last-run.json`, the T042 attachment directory and
`p101-02-a11y.json`. It held **no** `p101-02-a11y.wrapper.log` and **no** `p101-02-a11y.json.log`. The previous
attempt's reviewer found the same absence.

**Cause.** The oracle's shell opens `test-results/p101-02-a11y.wrapper.log` and the wrapper opens
`<jsonOut>.log` before Playwright starts. Playwright then deletes each project's `outputDir` during setup
(`test-results/` by default; the config sets none). The call site is
`node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/lib/runner/index.js:5919-5927`,
`createRemoveOutputDirsTask()`, title `"clear output"`, which returns early only on `preserveOutputDir`. Both
logs are unlinked while their writers still hold the file descriptors. The final report survives because
Playwright's JSON reporter writes the pending file at the end of the run, after the clear.

**Measured, with a control.** Before a second run I planted `test-results/p101-02-outputdir-probe.txt`
(inode `1194320881`, listed present). After the run it read `GONE`.

That second run was a **diagnostic run**, not the oracle. It used the identical positional invocation, but the
JSON and the log went to the session scratchpad (`$S`) instead of `test-results/`, so the log survived. Its
output, verbatim, with only the scratchpad directory shortened to `$S`:

```
diag start=07:52:03 HEAD=ad6231fbe load=[1.08 2.07 2.50]
diag wrapper_rc=1 end=07:52:40
sentinel after run: GONE
5173 listeners after: 0
leftover suite procs: [0]
diag stats {"startTime":"2026-09-11T04:52:03.977Z","duration":35924.86,"expected":15,"skipped":0,"unexpected":1,"flaky":0}
```

Wrapper log (83 lines), the `pw-run-reaped` lines and the tail, verbatim:

```
1:pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T04-52-40-114Z-p101-02-a11y-diag.json
80:    [a11y] › tests/a11y/dossiers-a11y.spec.ts:108:3 › Keyboard Navigation Tests › [T042] Collapsible sections respond to keyboard interaction
81:  15 passed (35.9s)
83:pw-run-reaped: playwright exited code=1 signal=null; group 11921 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output $S/p101-02-a11y-diag.json.log
```

**The verdict line reads `verdict clean; report published`, with `playwright exited code=1`.** The wrapper
leased and reaped the dev stack cleanly (D-13 satisfied). The red is Playwright's, meaning the spec's. The
`5173 listeners after: 0` and `leftover suite procs: [0]` lines are healthy-at-rest readings and carry no
weight alone. The reading that matters is the verdict line's `finalZero:true` / `session already-empty`. The
diagnostic run's report again has exactly one non-passed test: `timedOut 30390ms [T042] Collapsible sections
respond to keyboard interaction @141`.

**Side effect, disclosed.** The diagnostic run's "clear output" also deleted the worktree copy of the oracle's
published report and the T042 attachments. The attachments were copied to the session scratchpad first. The
durable copy of the oracle report is the `.pw-reports/2026-09-11T04-48-15-389Z-p101-02-a11y.json` archive
named in §1. The acceptance gate re-runs the oracle, which republishes it.

### 1.4 The same failure in every run on this machine

`.pw-reports/` holds the three archived reports this task's runs published. The first two came from the
previous attempt, before this session started. The fourth row is the diagnostic run.

```
2026-09-11T04-30-52-228Z-p101-02-a11y.json start=2026-09-11T04:30:14.647Z expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] Collapsible sections respond to keyboard interaction @141
2026-09-11T04-43-41-775Z-p101-02-a11y.json start=2026-09-11T04:43:04.880Z expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] Collapsible sections respond to keyboard interaction @141
2026-09-11T04-48-15-389Z-p101-02-a11y.json start=2026-09-11T04:47:39.309Z expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] Collapsible sections respond to keyboard interaction @141
diag (scratchpad)                           start=2026-09-11T04:52:03.977Z expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] @141
```

The reroute note that dispatched this attempt recorded load1 ~9-10 for the earlier failure. This session's
two runs were at load1 2.00 and 1.08. The count of 4 is not what rules out flake, because these are not
independent draws of a random failure. The trace in §3 is the evidence: it shows a deterministic mechanism
(DOM order plus menu focus) that fails the same way at any load.

## 2. `--list` prechecks, verbatim (discovery only, no suite)

`cd frontend && pnpm exec playwright test tests/a11y/dossiers-a11y.spec.ts --project=a11y --list`, exit 0:

```
(node:9850) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
◇ injected env (9) from ../.env.test // tip: ◈ encrypted .env [www.dotenvx.com]
Listing tests:
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T036] country dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T037] organization dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T038] person dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T039] engagement dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T0310] forum dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T0311] working_group dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:88:3 › Dossier Accessibility Scans › Dossiers hub page passes axe-core scan
  [a11y] › a11y/dossiers-a11y.spec.ts:108:3 › Keyboard Navigation Tests › [T042] Collapsible sections respond to keyboard interaction
  [a11y] › a11y/dossiers-a11y.spec.ts:146:3 › Keyboard Navigation Tests › Tab navigation moves through interactive elements in order
  [a11y] › a11y/dossiers-a11y.spec.ts:179:3 › Keyboard Navigation Tests › Escape key closes open dialogs/modals
  [a11y] › a11y/dossiers-a11y.spec.ts:211:3 › Focus Indicator Visibility Tests › [T043] Interactive elements have visible focus indicators
  [a11y] › a11y/dossiers-a11y.spec.ts:248:3 › Focus Indicator Visibility Tests › Links have visible focus indicators
  [a11y] › a11y/dossiers-a11y.spec.ts:282:3 › ARIA Attribute Tests › Collapsible sections have proper ARIA attributes
  [a11y] › a11y/dossiers-a11y.spec.ts:307:3 › ARIA Attribute Tests › Images have alt text
  [a11y] › a11y/dossiers-a11y.spec.ts:324:3 › ARIA Attribute Tests › Tables have proper ARIA roles
  [a11y] › a11y/dossiers-a11y.spec.ts:359:3 › RTL Accessibility Tests › RTL mode passes accessibility scan
Total: 16 tests in 1 file
exit=0
```

`cd frontend && pnpm exec playwright test --project=a11y --list | tail -1`, exit 0:

```
Total: 182 tests in 13 files
```

## 3. Diagnosis of [T042], from the failing run's trace (`trace.zip` → `0-trace.trace`)

The spec (`dossiers-a11y.spec.ts:108-144`) goes to the country dossier and takes
`page.locator('button[aria-expanded]').first()`. It focuses the button, presses Enter and expects
`aria-expanded` to flip. It then presses Enter again and expects the value to flip back.

Trace records, verbatim (the extractor cut each line at 400 characters):

```
BEFORE call@8 goto {"url":"/dossiers/countries/9b9a04af-50b0-408c-878d-9d07f77a74ab","timeout":0,"waitUntil":"load"}
BEFORE call@14 queryCount {"selector":"button[aria-expanded]"}
  LOG call@16   locator resolved to <button type="button" id="radix-_r_2_" data-state="closed" aria-haspopup="menu" aria-expanded="false" data-testid="user-menu" data-slot="dropdown-menu-trigger" class="sb-user flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--sidebar-ink)_6%,transparent)] p-2 text-start transition-colors hover:bg-[color-mix(in_srgb,var(--sidebar-ink)_10%,t
BEFORE call@22 keyboardPress {"key":"Enter"}
  LOG call@26   locator resolved to <button type="button" id="radix-_r_2_" data-state="open" aria-haspopup="menu" aria-expanded="true" data-testid="user-menu" aria-controls="radix-_r_3_" data-slot="dropdown-menu-trigger" class="sb-user flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--sidebar-ink)_6%,transparent)] p-2 text-start transition-colors hover:bg-[color-mix(in_srgb
BEFORE call@28 keyboardPress {"key":"Enter"}
BEFORE call@32 getAttribute {"selector":"button[aria-expanded] >> nth=0","strict":true,"name":"aria-expanded","timeout":0}
  LOG call@32 waiting for locator('button[aria-expanded]').first()
```

`call@14 result {"value":4}`: the page had 4 `button[aria-expanded]`, and the first is the user menu.
`call@26 result {"value":"true"}`: the first Enter opened the menu, so line 135's `not.toBe` passed.

What the second Enter did:

- `frontend/src/components/layout/nav-user.tsx:53-102` shows the trigger is a Radix `DropdownMenuTrigger`
  whose first `DropdownMenuItem` is `<Link to="/settings">` (Profile).
- The failure screenshot and `error-context.md` page snapshot show the Settings page with its section nav
  (`/settings?section=profile`) and no sidebar user card. So no `button[aria-expanded]` remains to resolve.

This is the WAI-ARIA menu-button pattern working as specified: Enter opens the menu and moves focus to its
first item. The test never reaches a collapsible section, so it shows no defect in collapsible-section keyboard
handling, and it shows no correct behaviour either.

`git log -S'data-testid="user-menu"' -- frontend/src` → `e012f4c66 2026-08-15 feat(92-02): mount NavUser as
the sidebar user card (D-01/D-23/D-24/D-27)`. ORCH-2's 16/16 was 2026-08-13.

**Remedy (not applied, and not verified; outside this plan's write scope):** change T042 in
`dossiers-a11y.spec.ts` so its locator cannot match a menu trigger. Examples: exclude `[aria-haspopup]`, or
scope the locator to the page's main content. The `if (count > 0)` guard must also become an assertion,
because a narrowed locator that matches nothing would otherwise pass vacuously. This run did not measure
which of the other three `button[aria-expanded]` sit in the main content. Under D-09 this is spec drift, which
gets FIXED, not quarantined.

## 4. D-11: `focus-indicators.spec.ts` deleted

**Reason (one sentence):** deleted; it was in no gate and hard-coded a login with literal credentials (RESEARCH §9 F10).
No content of the file is reproduced here.

`git show --stat --format="%h %s" ad6231fbe`:

```
ad6231fbe chore(a11y): remove ungated credential-bearing spec

 frontend/tests/a11y/focus-indicators.spec.ts | 59 ----------------------------
 1 file changed, 59 deletions(-)
```

`git log --diff-filter=D --format="%h %ad %s" --date=iso -- frontend/tests/a11y/focus-indicators.spec.ts`:

```
ad6231fbe 2026-09-11 07:18:20 +0300 chore(a11y): remove ungated credential-bearing spec
```

`ad6231fbe` re-applies the previous attempt's `2c07dbb9b`. The two are siblings on parent `32e5eee6c`, and
`git diff --stat 2c07dbb9b ad6231fbe` is empty, so the trees are identical. This attempt did not redo the
deletion.

**D-11 oracle** (the PLAN's second `oracle: command`, extracted the same way: 1356 bytes, sha256
`4e601d935291e3a306caaad8ed842593998cac620f24f57bb157c1cc682a44e0`), run first, at `ad6231fbe`, **exit 0**:

```
HEAD=ad6231fbe start=07:47:26
o2 exit=0 end=07:47:27
P101-02-D11 focus-indicators: index=untracked disk=absent | control dossiers-a11y index=tracked | a11y project lists [Total: 182 tests in 13 files] (want untracked absent tracked 'Total: 182 tests in 13 files')
PASS
```

Two controls back the `untracked` reading. The control spec reads `tracked`, which shows `git ls-files` is
answering. The a11y population is unchanged at 182 in 13, which shows the deletion touched nothing the gate
admits.

## 5. Left for named later tasks

1. **The [T042] fix has no owner in Phase 101 (operator ruling needed).**
   - `101-05-PLAN.md:102` and `101-12-PLAN.md:111` both put `dossiers-a11y.spec.ts` outside their
     population ("`dossiers-a11y.spec.ts` - P101-02").
   - This plan's `files_modified` does not include it either. A scan of every `101-*-PLAN.md`
     `files_modified` block for `dossiers-a11y` returns no owner.
   - Criterion 3 cannot close until one of two things happens: this plan's scope is widened to
     `frontend/tests/a11y/dossiers-a11y.spec.ts` for the §3 D-09 fix, or another plan is given that file.
   - D-05 hard-codes this spec, so substituting a different one is not an option.
2. **Oracle defect: the criterion-3 oracle can never leave its own wrapper log on disk (§1.3).** Its log
   path, and the wrapper's `<jsonOut>.log` beside it, sit inside Playwright's `outputDir`, which "clear
   output" empties at run setup. The fix is in the PLAN's oracle text: move the log path outside
   `frontend/test-results/`. That is planner-owned and not editable here. The exit code and the published
   report are unaffected, since the oracle prints the former and the reporter writes the latter after the
   clear.
3. **Stale comment:** `frontend/playwright.config.ts:126-129` still describes `focus-indicators` as kept out
   of the gate for concurrency reasons. The file no longer exists. The config is outside this plan's scope
   (it is P101-01's file), and a reviewer accepted this as deferred. Whichever plan next edits that file
   should drop the parenthetical.

## 6. The one-spec bound

Even had this spec read 16/16, one spec green locally under the frontend config on this machine would say
nothing about the other 166 tests of the a11y project (182 − 16), which P101-05 quarantines or fixes. It would
also say nothing about the CI runner until the `main` run P101-07 observes. Here even the one spec is not
green: 15 of 16 pass, and nothing in this SUMMARY claims the a11y suite, or this spec, is green.

## 7. Scope

This attempt's commit adds only this file. The only other path this plan touches is the deletion in
`ad6231fbe`. No spec, config, script or source file was edited. The run artifacts, the scratchpad oracle
extracts and the diagnostic run's JSON and log are all outside the repository or gitignored.
