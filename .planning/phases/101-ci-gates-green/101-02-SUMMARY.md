---
phase: 101-ci-gates-green
plan: 02
status: complete
requirements: [CARRY-04]
criterion_3: closed
d11: closed
run_at: 916e92041
spec_fix_commit: 916e92041
deletion_commit: c7178fb54
---

# 101-02 SUMMARY: dossiers-a11y 16/16 through the wrapper (exit 0); focus-indicators deleted (D-11 closed)

## Result

- **Criterion 3 is closed, for this one spec on this machine.** The criterion-3 oracle ran byte-identical
  at `916e92041`, through the wrapper in its legacy positional form. It read
  `expected=16 unexpected=0 skipped=0 flaky=0`, the wrapper exited **0**, and the oracle printed `PASS` and
  exited **0**.
- **Getting there took a spec fix, not a retry.** The previous attempts' four runs all failed the same test,
  `[T042] Collapsible sections respond to keyboard interaction`. The cause was spec locator drift: the
  locator matched the sidebar user-menu trigger. `916e92041` scopes T042's locator to real collapsibles in
  the page content (§3). This attempt's dispatch put `frontend/tests/a11y/dossiers-a11y.spec.ts` in the
  write scope, which is exactly what the previous SUMMARY's §5 item 1 asked for.
- **D-11 is closed.** `frontend/tests/a11y/focus-indicators.spec.ts` was deleted as a git-tracked removal in
  `c7178fb54`. The D-11 oracle exits **0**: the file reads `untracked absent`, the control reads `tracked`,
  and the a11y project still lists `Total: 182 tests in 13 files`.
- **The bound (§6):** this is one spec, green locally, under the frontend config. It is not the a11y
  suite and it is not CI.

## 1. Criterion-3 oracle (the PLAN's first `oracle: command`), verbatim

The command was extracted from the PLAN front-matter with js-yaml and run as `bash -c "$(cat o1.sh)"` from
the worktree root. The extracted text is 2415 bytes, sha256
`21df3e4621b5c50ebb86ee66cedc103900b77a31f75edf12ad9714752924b2b4`. That is the same hash the previous
attempt recorded, so the oracle is unchanged. Immediately before the run, a process census found 0 running
`playwright`/`vitest`/`pw-run-reaped` processes, 5173 had 0 listeners, and `E2E_BASE_URL` was unset.

```
HEAD=916e92041 start=2026-09-11 08:08:08 +0300 load=[1.42 2.08 2.49] 5173=0 suites=[0]
=== o1 (criterion 3) start=08:08:09 load=[1.42 2.08 2.49]
P101-02 wrapper_rc=0 (0 = clean verdict AND playwright green; 90 = session unclean, report withheld)
P101-02-C3 expected=16 unexpected=0 skipped=0 flaky=0 want expected=16 unexpected=0 skipped=0 flaky=0
PASS
o1 exit=0 end=08:08:28 load=[2.50 2.27 2.55]
```

The oracle passed every exit-3 precheck before running:

- the routing grep for `pw-run-reaped.mjs --lease-exec` in `frontend/playwright.config.ts` (D-13)
- `.env.test` materialised
- `E2E_BASE_URL` unset
- 5173 free
- `--list` = `Total: 16 tests`

**Wrapper exit code: 0.** Under the wrapper's contract, exit 0 means the session verdict was clean AND
Playwright exited 0. An unclean session would have withheld the report and exited 90.

**Published report path:**
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-033231-0000000000000082--P101-02/frontend/test-results/p101-02-a11y.json`.
This is the oracle's `J="$PWD/test-results/p101-02-a11y.json"`, run from `frontend/`. The wrapper also archives
every published report outside the worktree. The durable copy is
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T05-08-28-298Z-p101-02-a11y.json`.
It is byte-identical to the report parsed below:

```
ad26e902b179c4779b7b0942f84310e8f7ce6932be46fc13f628cb2db3b92319  $S/o1-report.json
ad26e902b179c4779b7b0942f84310e8f7ce6932be46fc13f628cb2db3b92319  <repo>/.pw-reports/2026-09-11T05-08-28-298Z-p101-02-a11y.json
cmp: identical
```

(`$S` is this session's scratchpad, and `$S/o1-report.json` was copied from the worktree path above
straight after the oracle exited.)

### 1.1 The JSON reporter `stats` block, verbatim (`JSON.stringify(r.stats, null, 2)` of the published report)

```json
{
  "startTime": "2026-09-11T05:08:10.511Z",
  "duration": 17576.735,
  "expected": 16,
  "skipped": 0,
  "unexpected": 0,
  "flaky": 0
}
```

**Controls for the zeros:**

- **`unexpected=0`:** the same reader printed `unexpected=1` on all four earlier runs of this spec (§4), so
  it can see a non-zero value.
- **`skipped=0`:** this agrees with the spec's annotation count.
  `grep -cE 'fixme|\.skip\(' tests/a11y/dossiers-a11y.spec.ts` → `0`, beside the control
  `grep -c fixme tests/a11y/positions-keyboard-nav.spec.ts` → `13`.
- **`flaky=0`:** every test in §1.2 has `results=1`, meaning no retry ran.

### 1.2 Per-test results from the same report

| status | duration | test | results |
| ------ | -------: | ---- | ------: |
| passed | 7076 ms | Dossier Accessibility Scans > [T036] country dossier passes axe-core WCAG AA scan | 1 |
| passed | 6614 ms | Dossier Accessibility Scans > [T037] organization dossier passes axe-core WCAG AA scan | 1 |
| passed | 7222 ms | Dossier Accessibility Scans > [T038] person dossier passes axe-core WCAG AA scan | 1 |
| passed | 6038 ms | Dossier Accessibility Scans > [T039] engagement dossier passes axe-core WCAG AA scan | 1 |
| passed | 6734 ms | Dossier Accessibility Scans > [T0310] forum dossier passes axe-core WCAG AA scan | 1 |
| passed | 7111 ms | Dossier Accessibility Scans > [T0311] working_group dossier passes axe-core WCAG AA scan | 1 |
| passed | 5854 ms | Dossier Accessibility Scans > Dossiers hub page passes axe-core scan | 1 |
| passed | 7859 ms | Keyboard Navigation Tests > [T042] Collapsible sections respond to keyboard interaction | 1 |
| passed | 5525 ms | Keyboard Navigation Tests > Tab navigation moves through interactive elements in order | 1 |
| passed | 3953 ms | Keyboard Navigation Tests > Escape key closes open dialogs/modals | 1 |
| passed | 4342 ms | Focus Indicator Visibility Tests > [T043] Interactive elements have visible focus indicators | 1 |
| passed | 3462 ms | Focus Indicator Visibility Tests > Links have visible focus indicators | 1 |
| passed | 4189 ms | ARIA Attribute Tests > Collapsible sections have proper ARIA attributes | 1 |
| passed | 4451 ms | ARIA Attribute Tests > Images have alt text | 1 |
| passed | 4343 ms | ARIA Attribute Tests > Tables have proper ARIA roles | 1 |
| passed | 5100 ms | RTL Accessibility Tests > RTL mode passes accessibility scan | 1 |

`rows=16 nonpassed=0`. T042 passed in 7859 ms. On every earlier run it hit the 30000 ms timeout.

### 1.3 The wrapper log: why the oracle's own log does not exist, and the verdict line from a run that kept it

After the oracle run, `frontend/test-results/` held only `.last-run.json` and `p101-02-a11y.json`. It held
no `p101-02-a11y.wrapper.log` and no `p101-02-a11y.json.log`. The previous attempt diagnosed and measured
this, and this run shows it again. The oracle's shell opens its log inside `test-results/`, and so does the
wrapper's `<jsonOut>.log`. Playwright's "clear output" setup task (`createRemoveOutputDirsTask()`) then empties
each project's `outputDir` (`test-results/` by default) while both writers still hold their descriptors. The
final report survives because the JSON reporter writes it after the clear.

To quote the verdict line anyway, I ran one **diagnostic run** straight after the oracle. It is not the
oracle. It used the identical positional invocation, but the JSON and the log went to `$S`. Its output,
verbatim, with only the scratchpad directory shortened to `$S`:

```
=== diag start=08:08:56 load=[2.27 2.23 2.52] 5173=0
diag wrapper_rc=0 end=08:09:14 load=[5.01 2.83 2.73]
5173 after=0 suites after=[0]
=== wrapper log:        2 lines
1:pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-11T05-09-14-080Z-p101-02-a11y-diag.json
2:pw-run-reaped: playwright exited code=0 signal=null; group 74272 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session already-empty; verdict clean; report published; child output $S/p101-02-a11y-diag.json.log
diag stats {"startTime":"2026-09-11T05:08:56.732Z","duration":17125.521,"expected":16,"skipped":0,"unexpected":0,"flaky":0}
```

Playwright's own tally lines from the child output (`$S/p101-02-a11y-diag.json.log`, 325 lines, ANSI
stripped):

```
19:Running 16 tests using 9 workers
325:  16 passed (17.1s)
```

The verdict line reads `playwright exited code=0` and `verdict clean; report published`, with
`finalZero:true` and `session already-empty`. The wrapper leased and reaped the dev stack cleanly (D-13).
The `5173 after=0` and `suites after=[0]` readings are healthy-at-rest values and carry no weight on their
own. The verdict line is the reading that matters.

**Side effect, disclosed:** the diagnostic run's "clear output" deleted the worktree copy of the oracle's
published report. Afterwards `frontend/test-results/` held only `.last-run.json`. The byte-identical durable
copy is the `.pw-reports/2026-09-11T05-08-28-298Z-p101-02-a11y.json` archive (§1). The acceptance gate
re-runs the oracle, which republishes it to the worktree path.

## 2. `--list` prechecks, verbatim (discovery only, no suite)

`cd frontend && pnpm exec playwright test tests/a11y/dossiers-a11y.spec.ts --project=a11y --list` at
`916e92041`, exit 0:

```
(node:74140) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
◇ injected env (9) from ../.env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
Listing tests:
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T036] country dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T037] organization dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T038] person dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T039] engagement dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T0310] forum dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:62:5 › Dossier Accessibility Scans › [T0311] working_group dossier passes axe-core WCAG AA scan
  [a11y] › a11y/dossiers-a11y.spec.ts:88:3 › Dossier Accessibility Scans › Dossiers hub page passes axe-core scan
  [a11y] › a11y/dossiers-a11y.spec.ts:108:3 › Keyboard Navigation Tests › [T042] Collapsible sections respond to keyboard interaction
  [a11y] › a11y/dossiers-a11y.spec.ts:147:3 › Keyboard Navigation Tests › Tab navigation moves through interactive elements in order
  [a11y] › a11y/dossiers-a11y.spec.ts:180:3 › Keyboard Navigation Tests › Escape key closes open dialogs/modals
  [a11y] › a11y/dossiers-a11y.spec.ts:212:3 › Focus Indicator Visibility Tests › [T043] Interactive elements have visible focus indicators
  [a11y] › a11y/dossiers-a11y.spec.ts:249:3 › Focus Indicator Visibility Tests › Links have visible focus indicators
  [a11y] › a11y/dossiers-a11y.spec.ts:283:3 › ARIA Attribute Tests › Collapsible sections have proper ARIA attributes
  [a11y] › a11y/dossiers-a11y.spec.ts:308:3 › ARIA Attribute Tests › Images have alt text
  [a11y] › a11y/dossiers-a11y.spec.ts:325:3 › ARIA Attribute Tests › Tables have proper ARIA roles
  [a11y] › a11y/dossiers-a11y.spec.ts:360:3 › RTL Accessibility Tests › RTL mode passes accessibility scan
Total: 16 tests in 1 file
exit=0
```

The test population and titles are unchanged from the previous attempt's listing. The spec fix moved
only the line numbers of the tests after T042, by +1.

`cd frontend && pnpm exec playwright test --project=a11y --list | tail -1`, exit 0:

```
Total: 182 tests in 13 files
```

## 3. The [T042] fix (`916e92041`) and the evidence it rests on

**Diagnosis.** The previous attempt read this from the red run's Playwright trace, and this attempt
re-read the same `trace.zip`.

- T042 took `page.locator('button[aria-expanded]').first()` on the country dossier page.
- Since `e012f4c66` (2026-08-15, "mount NavUser as the sidebar user card"), that locator resolves to the
  sidebar **user-menu trigger** (`data-testid="user-menu"`, `aria-haspopup="menu"`).
- The first Enter opens the menu, and Radix moves focus to its first item.
- The second Enter activates that item (`<Link to="/settings">`), so the page navigates away.
- The next `getAttribute` then waits out the 30 s timeout.

That is the WAI-ARIA menu-button pattern working as specified. The test never reached a collapsible.

**Which element the new locator selects.** The red run's DOM snapshot (`after@call@10`) had four
`button[aria-expanded]` elements. The list below gives each with its landmark ancestry, taken from this
session's parse of the trace:

```
['ASIDE', 'ASIDE#Open navigation menu'] | KAKhalid AlzahraniHead of International Partnerships | controls= None
['MAIN#Main content', 'HEADER'] | Add to Dossier | controls= None
['MAIN#Main content', 'ASIDE'] | Link Dossier | controls= radix-_r_c_
['MAIN#Main content', 'ASIDE'] | Relationships | controls= radix-_r_24_
```

- The first three carry `aria-haspopup`: `menu`, `menu` and `dialog`.
- The fourth is a plain Radix collapsible trigger (`data-state="open"`, `aria-expanded="true"`) inside
  `<main>`.
- So `main button[aria-expanded]:not([aria-haspopup])` resolves to that "Relationships" trigger.

This is inferred from the red run's snapshot. The green run's trace was not inspected. The new
`toBeVisible()` assertion does guarantee the green run toggled *some* visible, non-menu collapsible inside
`<main>`, rather than passing on zero matches.

**The change**, confined to T042:

- The locator is now `page.locator('main button[aria-expanded]:not([aria-haspopup])').first()`.
- The `if (count > 0) { … }` guard is now `await expect(firstButton).toBeVisible()`. A narrowed locator that
  matched nothing would otherwise have passed vacuously. This makes the test stricter, not weaker.
- The Enter / flip / Enter / flip-back assertions are unchanged.

No test was removed, skipped, annotated or substituted (D-05), and the `--list` population is still 16.

**The same commit** also changes the file's three `console.log` calls to `console.info`. Those calls were
already there and are not in T042. lint-staged lints the whole staged file, and `no-console` allows only
`warn`/`error`/`table`/`info`. With `console.log` in the file, the pre-commit hook rejected the commit, and
the rejection output is in this session's log. Output from both calls is unchanged.

**The reroute note on the earlier failure.** It suggested load-induced flake and said not to touch the spec.
The declared write scope for this attempt includes the spec, and the anchored review finding asked for this
fix. The trace shows a deterministic mechanism that fails at any load. The four red runs (load1 1.08 to ~9)
and the two green runs are not independent draws, so neither count is the evidence. The removed mechanism
is.

## 4. Before and after on this machine

`.pw-reports/` holds every report this plan's runs published:

```
2026-09-11T04-30-52-228Z-p101-02-a11y.json       expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] @141   (old locator)
2026-09-11T04-43-41-775Z-p101-02-a11y.json       expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] @141   (old locator)
2026-09-11T04-48-15-389Z-p101-02-a11y.json       expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] @141   (old locator)
2026-09-11T04-52-40-114Z-p101-02-a11y-diag.json  expected=15 unexpected=1 skipped=0 flaky=0 | timedOut [T042] @141   (old locator)
2026-09-11T05-08-28-298Z-p101-02-a11y.json       expected=16 unexpected=0 skipped=0 flaky=0                         (916e92041, the oracle)
2026-09-11T05-09-14-080Z-p101-02-a11y-diag.json  expected=16 unexpected=0 skipped=0 flaky=0                         (916e92041, diagnostic)
```

The first four rows are quoted from the previous SUMMARY. The last two come from this session's runs (§1, §1.3).

## 5. D-11: `focus-indicators.spec.ts` deleted

**Reason (one sentence):** deleted; it was in no gate and hard-coded a login with literal credentials (RESEARCH §9 F10).
No content of the file is reproduced here.

`git show --stat --format="%h %s" c7178fb54`:

```
c7178fb54 chore(a11y): remove ungated credential-bearing spec

 frontend/tests/a11y/focus-indicators.spec.ts | 59 ----------------------------
 1 file changed, 59 deletions(-)
```

`git log --diff-filter=D --format="%h %ad %s" --date=iso -- frontend/tests/a11y/focus-indicators.spec.ts`:

```
c7178fb54 2026-09-11 07:18:20 +0300 chore(a11y): remove ungated credential-bearing spec
```

The previous SUMMARY recorded this deletion as `ad6231fbe`. The harness has since re-applied the branch,
and at this HEAD the same one-file, 59-deletion removal is `c7178fb54`. This attempt did not redo it.

**D-11 oracle.** This is the PLAN's second `oracle: command`, extracted the same way: 1356 bytes, sha256
`4e601d935291e3a306caaad8ed842593998cac620f24f57bb157c1cc682a44e0`, again unchanged. It ran at `916e92041`,
just before the criterion-3 oracle, and exited **0**:

```
=== o2 (D-11) start=08:08:08
P101-02-D11 focus-indicators: index=untracked disk=absent | control dossiers-a11y index=tracked | a11y project lists [Total: 182 tests in 13 files] (want untracked absent tracked 'Total: 182 tests in 13 files')
PASS
o2 exit=0 end=08:08:09
```

Two controls back the `untracked` reading:

- The control spec reads `tracked`, which shows `git ls-files` is answering.
- The a11y population is unchanged at 182 in 13. The deletion touched nothing the gate admits, and the
  T042 fix changed no test count.

## 6. The one-spec bound

One spec green locally under the frontend config on this machine says nothing about the other 166 tests
of the a11y project (182 − 16). P101-05 quarantines or fixes those. It also says nothing about the CI runner
until the `main` run P101-07 observes. This SUMMARY does not claim the a11y suite is green. It shows one
spec, `dossiers-a11y.spec.ts`, at 16/16 under the `a11y` project through the reaped wrapper, twice, on this
machine, at `916e92041`.

## 7. Left for named later tasks

1. **Oracle defect: the criterion-3 oracle can never leave its own wrapper log on disk (§1.3).** This was
   carried from the previous SUMMARY and measured again this run. The log path, and the wrapper's
   `<jsonOut>.log` beside it, sit inside Playwright's `outputDir`, which "clear output" empties at run
   setup. The fix belongs in the PLAN's oracle text: move the log path outside `frontend/test-results/`.
   That text is planner-owned and not editable here. The exit code and the published report are unaffected.
2. **Stale comment (outstanding review finding, out of this plan's scope).** The comment on the a11y admit
   list in `frontend/playwright.config.ts` still treats `focus-indicators.spec.ts` as a live ungated spec.
   The reviewer cites lines 126-129. The file is P101-01's, and it is not in this dispatch's write scope.
   Whichever plan next edits that config should drop the parenthetical.
3. **Noticed, not changed:** `ARIA Attribute Tests > Collapsible sections have proper ARIA attributes`
   (`dossiers-a11y.spec.ts:283`) still uses the unscoped `button[aria-expanded]`. Its panel check,
   `toBeGreaterThanOrEqual(0)`, cannot fail. It passes and is outside this plan's goal. It should be
   strengthened in whatever plan next owns this spec's assertions.
4. **Closed from the previous SUMMARY's §5:** item 1 (the [T042] fix had no owner). This dispatch's
   write scope included the spec, and `916e92041` applied the fix.

## 8. Scope

This attempt's commits touch exactly two paths: `frontend/tests/a11y/dossiers-a11y.spec.ts` (`916e92041`)
and this file. The only other path this plan touches is the deletion in `c7178fb54`. No config, script,
workflow or application source file was edited. The run artifacts, oracle extracts, trace parse and
diagnostic JSON/log are all outside the repository or gitignored.
