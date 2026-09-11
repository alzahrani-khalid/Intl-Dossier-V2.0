---
phase: 101-ci-gates-green
plan: 9
status: complete
completed: 2026-09-11
requirements: [CARRY-02, CARRY-09]
---

# 101-09 SUMMARY — quarantine pass, group C (shard 1 and shard 2 EN specs)

## Result

Run `31848669722` (E2E Tests on `main`, head `e990ed844`) reported **10** red tests across the 5
spec files of this unit. **1 is FIXED** (a spec defect that cannot pass on any build) and **9 carry
an in-spec** `test.fixme(true, 'P101-QUAR 31848669722: ...')` as the first statement of the test
body, each naming the cause, the log line, the job and the owner phase. No test was deleted, no
assertion was removed, no project-level skip was added, no baseline was touched, nothing under
`frontend/src` or `backend/src` changed. The root E2E population still lists
`Total: 220 tests in 65 files`. The plan's oracle passes (pasted under `## Oracle`).

Commits: `79954fa24` (markers + the fix), `8ce5d755b` (a comment of mine had inflated the
oracle's informational "any fixme" reading from 9 to 10 — see `## Zeros and their controls`), and the
commit carrying this SUMMARY.

## Main finding — the E2E target serves a build older than Phase 77

This decides the fix-or-quarantine call for 4 of the 10, so it comes first.

- CI's fouc cold-load test read `--bg` = `#f7f6f4` (log line 1859 of job 94920109119). At HEAD,
  `frontend/public/bootstrap.js:19-26` coerces `id.dir` to `linear` and defaults `id.theme` to
  `dark`, so an empty-storage cold load paints `#010102` (`bootstrap.js:44`). `#f7f6f4` left the
  token file in `2a084acc8` (2026-07-03, `feat(77-07): collapse token engine to Linear-only`) —
  `git log -S'#f7f6f4' -- frontend/src/design-system/tokens/directions.ts`.
- On the same run, 3 of the 4 `TYPO-01` loop cells passed with direction-specific display fonts, and
  the fouc test "persisted dark mode applied before hydration" passed while asserting
  `data-direction="chancery"`. Both need a build that still honours the retired directions.
- The run's head commit `e990ed844` is dated 2026-08-14, six weeks after `77-07`. So the build under
  test lagged `main`.
- Today (2026-09-11) a read-only GET of `http://138.197.195.242/bootstrap.js` (the droplet named in
  `CLAUDE.md`) returns HTTP 200, with `bureau` ×6, `chancery` ×3, `f7f3ec` ×1, `f7f6f4` ×1 and no
  `d !== 'linear'` coercion — a pre-Phase-77 bootstrap.
- **Bound:** the value of the `E2E_BASE_URL` secret cannot be read, so "the E2E target is that
  droplet" is an **inference**: the droplet today serves the exact `#f7f6f4` CI received. It is not a
  measurement.

Consequence: rewriting a spec to match HEAD would leave it red against this target until the
target is redeployed. Rewriting it to match the target would turn it red at the next deploy.
Every test whose fix depends on which build is served is quarantined with **deploy drift** named, and
its fix is recorded but not applied. Redeploying is an operator act outside Phase 101's scope.

## Derivation of the failing tests (from the run logs)

`command -v gh && gh auth status` → `/opt/homebrew/bin/gh`,
`✓ Logged in to github.com account alzahrani-khalid (keyring)`.

**The command** (RESEARCH §10.2, filtered to this unit's 5 files; `$SP` = the worker scratchpad):

```bash
R=alzahrani-khalid/Intl-Dossier-V2.0
for j in 94920109119 94920109185; do
  gh run view -R $R --job $j --log-failed | sed -E 's/\^\[\[[0-9;]*m//g' > "$SP/job-$j.clean"
  grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' "$SP/job-$j.clean" \
    | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u \
    | grep -E 'tests/e2e/(fouc-bootstrap|person-identity-fields|phase-36-shell|typography|working-group-create)\.spec\.ts'
  grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' "$SP/job-$j.clean" \
    | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u \
    | sed -E 's/^\[[a-z0-9-]+\] › //; s/:[0-9]+:[0-9]+ › .*//' | sort | uniq -c
  grep -oE '[0-9]+ failed' "$SP/job-$j.clean" | tail -1
done
```

Fetch: `fetch 94920109119 exit=0 lines= 2437`, `fetch 94920109185 exit=0 lines= 1413`.

**The ANSI-strip step.** The `--log-failed` output stores each ESC as the two characters `^[` followed
by `[…m`, so the strip is `sed -E 's/\^\[\[[0-9;]*m//g'`. A `\x1b` pattern strips nothing, because
the logs contain 0 real ESC bytes (`grep -c $'\x1b'` → `0`, `0`). Measured on the raw and stripped
logs:

```
job 94920109119 raw '^[' (two-char) lines=17 clean '^[' lines=0
job 94920109185 raw '^[' (two-char) lines=17 clean '^[' lines=0
```

**Output, verbatim** (this unit's rows, then the per-file count for the whole job, then the CI
notice):

```
== job 94920109119
[chromium-en] › tests/e2e/fouc-bootstrap.spec.ts:28:7 › TOKEN-02 FOUC-safe bootstrap › cold load (empty localStorage) applies Chancery-light palette at first paint
[chromium-en] › tests/e2e/person-identity-fields.spec.ts:119:7 › Phase 32 person identity fields @phase32 › PBI-06: non-elected person wizard surfaces identity label + nationality badge in persons list
[chromium-en] › tests/e2e/person-identity-fields.spec.ts:20:7 › Phase 32 person identity fields @phase32 › PBI-05 + PBI-06 + PBI-07: elected-official wizard end-to-end with identity fields
[chromium-en] › tests/e2e/phase-36-shell.spec.ts:124:7 › Phase 36 shell › drawer panel width — m
[chromium-en] › tests/e2e/phase-36-shell.spec.ts:124:7 › Phase 36 shell › drawer panel width — max-sm:w-screen applies at phone viewport (D-05 closure)
[chromium-en] › tests/e2e/phase-36-shell.spec.ts:17:7 › Phase 36 shell › shell no remount — route changes do not unmount AppShell
[chromium-en] › tests/e2e/phase-36-shell.spec.ts:79:7 › Phase 36 shell › shell tab order — tab cycles through topbar controls then sidebar nav
-- per file
   2 tests/e2e/01-login.spec.ts
   1 tests/e2e/03-dossier-navigation.spec.ts
   2 tests/e2e/04-command-palette.spec.ts
   1 tests/e2e/05-notifications.spec.ts
   1 tests/e2e/06-work-item-crud.spec.ts
   2 tests/e2e/07-calendar-events.spec.ts
   1 tests/e2e/08-export-import.spec.ts
   4 tests/e2e/10-operations-hub.spec.ts
   3 tests/e2e/elected-official-create.spec.ts
   3 tests/e2e/engagement-create.spec.ts
   1 tests/e2e/forum-create.spec.ts
   1 tests/e2e/fouc-bootstrap.spec.ts
   2 tests/e2e/person-identity-fields.spec.ts
   4 tests/e2e/phase-36-shell.spec.ts
27 failed
== job 94920109185
[chromium-en] › tests/e2e/typography.spec.ts:44:7 › Phase 35 — Typography E2E (TYPO-01..04) › TYPO-02 — zero requests to fonts.googleapis.com or fonts.gstatic.com
[chromium-en] › tests/e2e/typography.spec.ts:57:9 › Phase 35 — Typography E2E (TYPO-01..04) › TYPO-01 — situation: getComputedStyle(h1).fontFamily matches expected display font
[chromium-en] › tests/e2e/typography.spec.ts:83:7 › Phase 35 — Typography E2E (TYPO-01..04) › TYPO-04 — [dir="ltr"].mono inside RTL fixture renders JetBrains Mono
[chromium-en] › tests/e2e/working-group-create.spec.ts:5:7 › Working Group wizard — create flow › creates a working group via the 3-step wizard and lands on the detail page
-- per file
   1 tests/e2e/ar-smoke/command-palette.ar.spec.ts
   1 tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts
   1 tests/e2e/ar-smoke/login.ar.spec.ts
  24 tests/e2e/tailwind-remap-visual.spec.ts
   6 tests/e2e/token-engine-sc.spec.ts
   3 tests/e2e/typography.spec.ts
   1 tests/e2e/working-group-create.spec.ts
36 failed
```

**Dedupe and the count beside the CI notice.** The log truncates one row per job, and the truncated
row is a strict prefix of a full one:

- Shard 1: `phase-36-shell.spec.ts:124:7 › … drawer panel width — m`. The per-file sum is 28; dropping
  the prefix row gives **27**, which equals the notice `27 failed`.
- Shard 2: `token-engine-sc.spec.ts:281:7 › Phase 33 Success Criteria (SC-1..SC-` (not this unit's
  file). The per-file sum is 37; dropping the prefix row gives **36**, which equals the notice
  `36 failed`.

For this unit's files:

| job                   | CI notice | fouc-bootstrap | person-identity-fields | phase-36-shell  | typography | working-group-create | unit total |
| --------------------- | --------- | -------------- | ---------------------- | --------------- | ---------- | -------------------- | ---------- |
| 94920109119 (shard 1) | 27 failed | 1              | 2                      | 3 (4 − 1 prefix) | —          | —                    | 6          |
| 94920109185 (shard 2) | 36 failed | —              | —                      | —               | 3          | 1                    | 4          |

**Unit total: 10**, the number the plan names (shard 1: fouc 1, person-identity 2, phase-36 3;
shard 2: typography 3, working-group 1).

## Each red test — the log line, the error, the reading, the action

Log lines are line numbers in the stripped `--log-failed` output. The sed keeps every line, so they
match the raw log's numbering. The header lines came from
`grep -nE '[0-9]+\) \[chromium-en\] › tests/e2e/(…)' job-<id>.clean`.

| #   | job         | log line | error (verbatim, from the log)                                                                                          | reading at HEAD (read, not run)                                                                                                                                                                                                                                            | action                          |
| --- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | 94920109119 | 1859     | `Expected: "#f7f3ec"` / `Received: "#f7f6f4"` at `fouc-bootstrap.spec.ts:56`                                           | HEAD cold-loads Linear dark `#010102`; `#f7f6f4` was deleted in `2a084acc8`. The deployed build predates Phase 77.                                                                                                                                                        | quarantine — deploy drift       |
| 2   | 94920109119 | 1961     | `getByLabel(/honorific\|اللقب/i)` `Expected: 1` `Received: 0`                                                           | `PersonBasicInfoStep.tsx:120` renders `<FieldLabelWithHelp label=…/>` with no `htmlFor`, though the component accepts one (`ContextualHelp.tsx:344-359`); no `htmlFor`/`id=` appears anywhere in the step file                                                             | quarantine — app code (a11y)    |
| 3   | 94920109119 | 2172     | `Test timeout of 30000ms exceeded.` then `locator.click` `waiting for getByLabel(/honorific\|اللقب/i)`                   | same as #2 (`/dossiers/persons/create`)                                                                                                                                                                                                                                    | quarantine — app code (a11y)    |
| 4   | 94920109119 | 2034     | `Expected: "0.31322215132511655"` `Received: null` at `phase-36-shell.spec.ts:37`                                        | the spec sets the stamp, then calls `page.goto('/engagements')`, a full document load that discards any DOM attribute whatever AppShell does                                                                                                                              | **FIXED** — spec defect          |
| 5   | 94920109119 | 2080     | `Expected pattern: /tb-menu\|tb-search\|tb-search-input\|tb-dir-btn/` `Received string: "sb-item relative flex …"`      | `AppShell.tsx:194-211` renders the sidebar `<aside>` before the topbar, so the first Tab lands in the sidebar; the old builds (`0ba9c9044~1`, `05c05d22e`) have the same order                                                                                             | quarantine — contract           |
| 6   | 94920109119 | 2126     | `Expected: >= 386` `Received: 320` at `phase-36-shell.spec.ts:146`                                                       | `AppShell.tsx:252` gives `Drawer.Dialog` `w-[280px] max-sm:w-screen`; nobody has observed on a deploy of HEAD whether that renders ≥ 386 px at 390 px                                                                                                                      | quarantine — visual + deploy drift |
| 7   | 94920109185 | 747      | `Error: google fonts leak: https://fonts.googleapis.com/css2?family=Fraunces…` (`+ Received + 7`)                        | `frontend/index.html:24-27` preconnects to and links `fonts.googleapis.com`                                                                                                                                                                                               | quarantine — app code           |
| 8   | 94920109185 | 826      | `Expected pattern: /^"?Space Grotesk"?/` `Received string: "\"IBM Plex Mono\", ui-monospace, monospace"`                 | HEAD coerces every `id.dir` to `linear` (Phase 77), so the `situation` cell asserts a retired font; the 3 sibling cells passed on this build and stay live                                                                                                                 | quarantine — deploy drift       |
| 9   | 94920109185 | 912      | `Expected pattern: /^"?JetBrains Mono"?/` `Received string: ""`                                                          | the fixture is `frontend/tests/e2e/fixtures/typo-04-fixture.html` and links `/src/index.css`; it is not under `frontend/public`, so a production build does not ship it; `e2e.yml` targets the deployed build                                                              | quarantine — environment        |
| 10  | 94920109185 | 1189     | `Test timeout of 30000ms exceeded.` then `waiting for getByRole('link', { name: /create working group\|إنشاء فريق عمل/i }).first()` | `working_groups/index.tsx:241-245` renders the CTA as a `Link` with `empty-states:list.working_group.cta` = `"Add working group"` (last changed `d2617e0b7`, 2026-08-28, after the run); the wizard steps after it have not been observed on a deploy of HEAD | quarantine — spec + deploy drift |

## Quarantine register

One row per in-spec marker. `cells` = the reporter cells that one marker skips. The TYPO-01 marker
sits inside `if (dir === 'situation')` in the loop body, so it skips exactly 1 of that loop's 4
cells. The rule for the owner column: **Phase 102** (Staging Data & Debt Tail) when the fix is app
code or test-infra code; **Phase 103** (Audit Re-Sweep, live observation) when the truth depends on
observing a deploy of HEAD.

| spec                                     | test title                                                                                     | cause class                         | owner phase | cells |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- | ----------- | ----- |
| tests/e2e/fouc-bootstrap.spec.ts         | `cold load (empty localStorage) applies Chancery-light palette at first paint`                  | deploy drift                        | Phase 103   | 1     |
| tests/e2e/person-identity-fields.spec.ts | `PBI-05 + PBI-06 + PBI-07: elected-official wizard end-to-end with identity fields`             | application code (a11y label)       | Phase 102   | 1     |
| tests/e2e/person-identity-fields.spec.ts | `PBI-06: non-elected person wizard surfaces identity label + nationality badge in persons list` | application code (a11y label)       | Phase 102   | 1     |
| tests/e2e/phase-36-shell.spec.ts         | `shell tab order — tab cycles through topbar controls then sidebar nav`                         | contract                            | Phase 102   | 1     |
| tests/e2e/phase-36-shell.spec.ts         | `drawer panel width — max-sm:w-screen applies at phone viewport (D-05 closure)`                 | visual + deploy drift               | Phase 103   | 1     |
| tests/e2e/typography.spec.ts             | `TYPO-02 — zero requests to fonts.googleapis.com or fonts.gstatic.com`                          | application code                    | Phase 102   | 1     |
| tests/e2e/typography.spec.ts             | `TYPO-01 — situation: getComputedStyle(h1).fontFamily matches expected display font`            | deploy drift                        | Phase 103   | 1     |
| tests/e2e/typography.spec.ts             | `TYPO-04 — [dir="ltr"].mono inside RTL fixture renders JetBrains Mono`                          | environment (dev-server-only fixture) | Phase 102   | 1     |
| tests/e2e/working-group-create.spec.ts   | `creates a working group via the 3-step wizard and lands on the detail page`                    | spec drift + deploy drift           | Phase 103   | 1     |

Rows 9, cells 9. Nine markers, all carrying `31848669722` (per-file grep below). D-15's run-time
reconciliation `skipped >= sum(cells) >= rows` is 9 >= 9 >= 9 for these files; the 5 files carried 0
pre-existing fixmes (the oracle reads "any fixme" = 9 = markers).

## Fixed tests

| fixed | spec                             | test                                                         | drift named                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | -------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIXED | tests/e2e/phase-36-shell.spec.ts | `shell no remount — route changes do not unmount AppShell` | Spec defect: the "client-side nav" was `page.goto('/engagements')`, a full document load. That discards the `data-test-mount-id` stamp whatever AppShell does, so the assertion could not pass on any build (`Received: null`, log line 2034 of job 94920109119). The spec now clicks the sidebar Link `.appshell a[href="/engagements"]:visible` and waits for the URL, a real client-side route change. The Link and `.appshell` exist at HEAD (`navigation-config.ts:84`, `Sidebar.tsx:135`) and in the pre-77 builds (`0ba9c9044~1` and `05c05d22e`: `path: '/engagements'`, `'app appshell relative …'`, `<aside`, `<Link to={item.path}>`), so the fix does not depend on which build is served. **Not executed** (bound below). |

## Bound — the root shards cannot run locally; the run proof is P101-07's `main` run

- `tests/e2e/support/auth.setup.ts` needs all six `E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}` keys,
  and `chromium-en` / `chromium-ar-smoke` depend on `setup`. The six `E2E_*` keys are absent
  locally: `.env.test` carries none of them (RESEARCH §3), and in this worker's shell
  `env | grep -cE '^(E2E|TEST_USER)_'` → `0` (control `env | grep -c '^PATH='` → `1`). The worktree
  hook maps only the admin pair. Five sibling units of wave 3 also share port 5173, and D-13 forbids
  a suite beside another. So **no spec in this unit was executed.** The local evidence is limited to
  the log derivation, source reading, `--list`, and the plan's bound.
- The run proof for both the fix and the 9 quarantines is the `main` E2E run P101-07 observes after
  the phase PR merges. If that run shows the fixed test red, the fix is re-opened; it is not quietly
  reclassified.
- Nothing here claims a quarantined behaviour is absent from the app. Each register row records only
  that its test was red on run `31848669722`, and why this plan cannot turn it green (the fix needs
  app code, a contract decision, a served fixture, or a deploy of HEAD).

## Left for named later tasks

- **Operator / Phase 103:** establish which build `E2E_BASE_URL` serves and redeploy HEAD to it. Then
  rewrite fouc cold-load and the TYPO-01 `situation` cell to Linear and re-run them (rewriting the
  4-cell loop would change the listed 220), measure the drawer at 390 px, and walk the WG wizard
  against HEAD's `"Add working group"` CTA.
- **Phase 102:** pass `htmlFor` from the honorific (and sibling) `FieldLabelWithHelp` to the Select
  trigger; self-host the fonts that `frontend/index.html:24-27` loads from Google; decide whether the
  shell's tab order is topbar-first (an app change) or sidebar-first (a UI-SPEC amendment); serve the
  TYPO-04 fixture from a path the deployed build ships, or rewrite the probe.

## Commands run, with verbatim output

```
$ gh run view 31848669722 -R alzahrani-khalid/Intl-Dossier-V2.0 --json headSha,createdAt,event -q '"\(.headSha) \(.createdAt) \(.event)"'
e990ed8445766059d681733430d64de9e8bf6477 2026-08-14T22:58:38Z push

$ git log --format='%h %ad %s' --date=short -- frontend/public/bootstrap.js | head -8
d90cc910b 2026-07-04 feat(83-02): add --chart-1..8 palette to all three holders + guard + engine
925c0b3a7 2026-07-03 fix(77): dark accent.soft → accent-tinted wash for WCAG AA (review H1) + contrast-test guards (M1)
2a084acc8 2026-07-03 feat(77-07): collapse token engine to Linear-only (delete 4 retired directions + hue)
2f04f9f4d 2026-07-02 feat(77-04): activate Linear — dual-layer id.dir coercion + dark default + :root re-sync + dir-class rename
0ba9c9044 2026-07-02 feat(77-03): widen Direction to linear + land Linear token data (dark verbatim + derived light/TOKEN-03) byte-mirrored in bootstrap.js
05c05d22e 2026-05-02 fix(42-11): bump --ink-faint + --accent-fg tokens to WCAG AA
e8f3341a0 2026-05-02 chore(wip): snapshot in-progress design-system + layout work before phase 41 execution
290408663 2026-04-21 feat(34-05): extend bootstrap.js with classif + locale reads and migrator

$ git log -S'#f7f6f4' --format='%h %ad %s' --date=short -- frontend/src/design-system/tokens/directions.ts | head -5
2a084acc8 2026-07-03 feat(77-07): collapse token engine to Linear-only (delete 4 retired directions + hue)
05c05d22e 2026-05-02 fix(42-11): bump --ink-faint + --accent-fg tokens to WCAG AA
fbd4b441c 2026-04-20 feat(33-01): add token engine module with OKLCH theme builder

$ curl -sS -m 10 -o - -w '\nHTTP %{http_code}\n' http://138.197.195.242/bootstrap.js | grep -oE "HTTP [0-9]+|d !== 'linear'|f7f6f4|f7f3ec|chancery|bureau" | sort | uniq -c
   1 HTTP 200
   6 bureau
   3 chancery
   1 f7f3ec
   1 f7f6f4

$ for c in 0ba9c9044~1 05c05d22e; do git show "${c}:…navigation-config.ts" | grep -n "'/engagements'"; git show "${c}:…AppShell.tsx" | grep -nE "appshell relative|<aside"; git show "${c}:…Sidebar.tsx" | grep -nE '<Link|to=\{item.path\}' | head -3; done
== 0ba9c9044~1
80:          path: '/engagements',
171:        'app appshell relative min-h-screen w-full',
179:      <aside
158:      <Link
159:        to={item.path}
== 05c05d22e
80:          path: '/engagements',
175:        'app appshell relative min-h-screen w-full',
183:      <aside
158:      <Link
159:        to={item.path}
```

(The first attempt at the command above wrote `$c:frontend/…`. zsh parsed `:f…` as a history
modifier, so every `git show` failed with `unknown revision`, and it was re-run with `${c}`. The
failure was mine, not a finding.)

```
$ node -e '…require("./frontend/src/i18n/en/empty-states.json").list.working_group…'
{"title":"No working groups",…,"cta":"Add working group","create":"Add working group",…}

$ grep -oE '…' job-94920109185.clean | … | sort -u | grep token-engine-sc | cut -c1-170     # the shard-2 prefix row
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:281:7 › Phase 33 Success Criteria (SC-1..SC-
[chromium-en] › tests/e2e/token-engine-sc.spec.ts:281:7 › Phase 33 Success Criteria (SC-1..SC-5) › SC-5: HeroUI and Tailwind probes resolve to the same live --accent
(+ 4 other token-engine rows)

$ pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke --no-deps --list 2>&1 | grep -oE "Total: [0-9]+ tests in [0-9]+ files"   # before edits
Total: 220 tests in 65 files
$ grep -c "test.fixme(" frontend/tests/a11y/positions-keyboard-nav.spec.ts   # the grep control
13

$ pnpm exec eslint --no-warn-ignored <the 5 specs>   # before edits, and again after
eslint exit=0
$ pnpm exec prettier --check <the 5 specs>           # before edits, and again after: the same 4 files
[warn] tests/e2e/fouc-bootstrap.spec.ts
[warn] tests/e2e/person-identity-fields.spec.ts
[warn] tests/e2e/phase-36-shell.spec.ts
[warn] tests/e2e/working-group-create.spec.ts
[warn] Code style issues found in 4 files. Run Prettier with --write to fix.
```

These 4 prettier warnings predate this plan and are left alone (surgical diff).
`typography.spec.ts` was clean before and is clean after. Every marker sits under a
`// prettier-ignore`, so a later format pass cannot split `test.fixme(true, '…` across lines and
blind the phase grep.

```
$ for f in <the 5 specs>; do echo "$f runid=$(grep -c "test.fixme(true, 'P101-QUAR 3184866" $f) anyQUAR=$(grep -c "test.fixme(true, 'P101-QUAR" $f)"; done   # after edits
tests/e2e/fouc-bootstrap.spec.ts runid=1 anyQUAR=1
tests/e2e/person-identity-fields.spec.ts runid=2 anyQUAR=2
tests/e2e/phase-36-shell.spec.ts runid=2 anyQUAR=2
tests/e2e/typography.spec.ts runid=3 anyQUAR=3
tests/e2e/working-group-create.spec.ts runid=1 anyQUAR=1
Total: 220 tests in 65 files
control=13

$ git show --stat --format='%h %s' 79954fa24
79954fa24 test(e2e): P101-09 quarantine 9 red specs in-spec, fix shell no-remount nav
 tests/e2e/fouc-bootstrap.spec.ts         |  5 ++++-
 tests/e2e/person-identity-fields.spec.ts |  4 ++++
 tests/e2e/phase-36-shell.spec.ts         | 10 ++++++++--
 tests/e2e/typography.spec.ts             |  9 +++++++++
 tests/e2e/working-group-create.spec.ts   |  2 ++
 5 files changed, 27 insertions(+), 3 deletions(-)
```

The oracle was extracted byte-for-byte from this plan's front-matter with js-yaml
(`must_haves.truths[oracle=command].command`, 3263 bytes, 18 lines, sha256 prefix
`84cfccdf6e05e60b`) and run with `bash -c "$(cat o09.sh)"` from the worktree root.

**Control run, before this SUMMARY existed.** The instrument has to be able to fail in the
post-marker state:

```
P101-09-BOUND files=5 markers with a run id=9 (any P101-QUAR=9, any fixme incl. pre-existing=10; control positions-keyboard-nav fixme=13) register rows=0 cells total=0 non-numeric=0 fixed rows=0 root list=[Total: 220 tests in 65 files] want the 10 (shard 1: fouc 1, person-identity 2, phase-36 3; shard 2: typography 3, working-group 1) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
FAIL: the ## Quarantine register section has 0 rows for 9 in-spec markers (D-15: one row per marker; FIXED rows live under ## Fixed tests and begin | FIXED |)
oracle exit=1
```

## Zeros and their controls

| zero                                                   | the control that proves the instrument could see non-zero                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `^[[` lines after the strip: 0, 0                      | the same count on the raw logs: 17, 17                                                                                            |
| real ESC bytes in either log: 0, 0                     | the two-character form counts 17 per log — the escape is present, only not as a byte                                             |
| `E2E_*` / `TEST_USER_*` keys in the worker shell: 0    | `env \| grep -c '^PATH='` → 1                                                                                                       |
| eslint problems on the 5 specs: 0 (exit 0)             | a planted `const x: any = 1` probe in `tests/e2e/` drew 2 problem lines (removed; `git status` clean), so `tests/e2e` is linted rather than silently ignored |
| register rows and FIXED rows at the control run: 0, 0  | the same run read 9 markers and exited 1                                                                                          |
| pre-existing fixmes in the 5 files: 0                  | the oracle's "any fixme" reads 9 = markers after `8ce5d755b`. The control run read **10**: my own alias comment in `fouc-bootstrap.spec.ts` quoted the literal call the grep counts. The comment was reworded without the call syntax. |

## Oracle

Final run, with this SUMMARY in place (worktree root, same extracted script):

```
P101-09-BOUND files=5 markers with a run id=9 (any P101-QUAR=9, any fixme incl. pre-existing=9; control positions-keyboard-nav fixme=13) register rows=9 cells total=9 non-numeric=0 fixed rows=1 root list=[Total: 220 tests in 65 files] want the 10 (shard 1: fouc 1, person-identity 2, phase-36 3; shard 2: typography 3, working-group 1) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
PASS
oracle exit=0
```
