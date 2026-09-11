---
phase: 101-ci-gates-green
plan: 08
status: complete
requirements: [CARRY-02, CARRY-09]
run_id: 31848669722
job_id: 94920109119
base: 24f5d7cd2
red_tests: 12
quarantined: 11
fixed: 1
---

# 101-08 SUMMARY: shard-1 group B - 12 red tests, 11 quarantined in-spec, 1 fixed for spec drift

## Result

- **12 red tests** in the 5 files of this unit, derived from job `94920109119` (E2E shard 1/2) of run
  `31848669722`: `08-export-import` 1, `10-operations-hub` 4, `elected-official-create` 3,
  `engagement-create` 3, `forum-create` 1. The shard's CI notice is `27 failed` (log line 2228); the
  per-file derivation below reproduces 27 for the whole shard and 12 for these files.
- **11 carry an in-spec marker** as the first statement of the test body:
  `test.fixme(true, 'P101-QUAR 31848669722: <cause>; log line <n> of job 94920109119; owner Phase 102')`,
  each preceded by `// prettier-ignore` so a formatter cannot split the one-line marker.
- **1 is fixed**: `ENGM-02` in `engagement-create.spec.ts` (anchored regex against a label that carries a
  required marker). The same regex was corrected at the two other sites in that file (lines 50 and 130),
  both inside tests that stay quarantined for other reasons.
- The root E2E population still lists `Total: 220 tests in 65 files`. The plan's oracle prints `PASS`
  (output under `## Oracle`).
- **None of this has been observed in a run.** The root shards cannot run locally (see `## Bound`), so
  neither the fix passing nor the markers skipping has been measured. The run proof is the `main` run
  P101-07 observes.

## Derivation of the failing tests (command, ANSI strip, count beside the CI notice)

The `gh run view --log-failed` output stores each ANSI escape as the two characters `^[` followed by
`[...m`, not as a real ESC byte. `sed -E 's/\x1b\[[0-9;]*m//g'` does not strip it on BSD sed; the strip
used is `sed -E 's/\^\[\[[0-9;]*m//g'` (RESEARCH §10.2). Control for the strip: the raw log has **17**
lines containing `^[[`, the stripped log **0**; a real ESC byte (`grep -c $'\x1b'`) appears on **0** raw
lines, which is why the `\x1b` form strips nothing.

```bash
R=alzahrani-khalid/Intl-Dossier-V2.0; j=94920109119
gh run view -R $R --job $j --log-failed > job-$j.raw                      # exit 0, 2437 lines
sed -E 's/\^\[\[[0-9;]*m//g' job-$j.raw > job-$j.clean
grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' job-$j.clean \
  | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u \
  | sed -E 's/^\[[a-z0-9-]+\] › //; s/:[0-9]+:[0-9]+ › .*//' | sort | uniq -c
grep -oE '[0-9]+ failed' job-$j.clean | tail -1
```

Output, verbatim (whole shard):

```
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
```

The distinct-row count before the per-file fold is **28**. One row is a strict prefix of another (the log
truncates one line); the prefix check printed exactly one, outside this unit:
`PREFIX: [chromium-en] › tests/e2e/phase-36-shell.spec.ts:124:7 › Phase 36 shell › drawer panel width — m`.
28 - 1 = **27**, equal to the CI notice `##[notice]  27 failed` (stripped log line 2228).

Filtered to this unit (the same pipeline with
`grep -E 'tests/e2e/(08-export-import|10-operations-hub|elected-official-create|engagement-create|forum-create)\.spec\.ts'`
before the fold), verbatim:

```
   1 tests/e2e/08-export-import.spec.ts
   4 tests/e2e/10-operations-hub.spec.ts
   3 tests/e2e/elected-official-create.spec.ts
   3 tests/e2e/engagement-create.spec.ts
   1 tests/e2e/forum-create.spec.ts
```

**Total 12**, equal to the plan's split (`08 1, 10 4, elected-official 3, engagement 3, forum 1`). No
prefix row falls inside these files. The 12 rows, verbatim:

```
[chromium-en] › tests/e2e/08-export-import.spec.ts:11:7 › TEST-08 dossier export/import › exports dossier list to CSV and re-imports a modified copy
[chromium-en] › tests/e2e/10-operations-hub.spec.ts:17:7 › TEST-10 Operations Hub › renders all 5 zones for leadership role
[chromium-en] › tests/e2e/10-operations-hub.spec.ts:26:7 › TEST-10 Operations Hub › leadership role sees zones in correct order
[chromium-en] › tests/e2e/10-operations-hub.spec.ts:37:7 › TEST-10 Operations Hub › analyst role sees all zones in analyst order
[chromium-en] › tests/e2e/10-operations-hub.spec.ts:54:7 › TEST-10 Operations Hub › clicking a zone item navigates to its detail view
[chromium-en] › tests/e2e/elected-official-create.spec.ts:131:7 › Elected Official Wizard — happy path › ELOF-03: created elected official appears in both Persons and Elected Officials lists
[chromium-en] › tests/e2e/elected-official-create.spec.ts:13:7 › Elected Official Wizard — happy path › ELOF-01/02/04: creates elected official with English-only office_name
[chromium-en] › tests/e2e/elected-official-create.spec.ts:80:7 › Elected Official Wizard — happy path › D-08/D-19: creates elected official with Arabic-only office_name
[chromium-en] › tests/e2e/engagement-create.spec.ts:113:7 › Engagement wizard — create flow › ENGM-04: multi-select participants chip UX — add + remove
[chromium-en] › tests/e2e/engagement-create.spec.ts:12:7 › Engagement wizard — create flow › creates an engagement via the 4-step wizard and lands on the detail page
[chromium-en] › tests/e2e/engagement-create.spec.ts:76:7 › Engagement wizard — create flow › ENGM-02: blocks submission when end_date is before start_date
[chromium-en] › tests/e2e/forum-create.spec.ts:5:7 › Forum wizard — create flow › creates a forum via the 3-step wizard and lands on the detail page
```

## Classification, from each error in the log

Every one of the 12 failed all three attempts (`retries: 2` under CI, `playwright.config.ts:13`; six
`##[error]` headers per test in the log). Every error has the same shape: `Test timeout of 30000ms
exceeded` followed by `Target page, context or browser has been closed` while waiting on one call. The
call, its stripped-log line, and what HEAD `24f5d7cd2` shows for that locator:

| log # | spec:line | first failing call (log lines) | HEAD evidence for the locator | action |
| ----- | --------- | ------------------------------ | ----------------------------- | ------ |
| 10 | `08-export-import:11` | `page.waitForEvent('download')` in `DossierListPage.exportCsv()` (1201-1203) | the hub export control is a button labelled `list.exportDossiers` = "Export Dossiers" that opens a dialog (`frontend/src/pages/dossiers/DossierListPage.tsx:548-556`); the import step's testid `dossier-import-csv-input` has 0 emitters | quarantine |
| 11 | `10-operations-hub:17` | `getByTestId('ops-zone-attention')` (1266-1268) | `ops-zone-` has 0 emitters; pickaxe: added in `5ac8c8f58` (22-01), last touched in `c42f722c8` (38-09, removes the page that emitted them) | quarantine |
| 12 | `10-operations-hub:26` | `getByTestId('role-switcher')` (1331-1333) | emitted only by `RoleSwitcher.tsx:38`, rendered only by `ActionBar.tsx:99`; `<ActionBar ` mount sites: 0 | quarantine |
| 13 | `10-operations-hub:37` | `getByTestId('role-switcher')` (1396-1398) | as log # 12 | quarantine |
| 14 | `10-operations-hub:54` | `getByTestId('ops-zone-engagements')` (1461-1463) | as log # 11 | quarantine |
| 15 | `elected-official-create:13` | `getByPlaceholder(/Enter name in English/)` (1526-1528), after the create-link click and the `/create$` URL assertion passed | step 1 is `PersonBasicInfoStep` since `bb84eaa24` (32-02, the spec's last edit is `0dcdba7a0`); `STEP_VALIDATION_FIELDS.basic` adds `last_name_en`, `last_name_ar`, `nationality_id` | quarantine |
| 16 | `elected-official-create:80` | `getByPlaceholder(/Enter name in English/)` (1582-1584) | as log # 15 | quarantine |
| 17 | `elected-official-create:131` | `getByPlaceholder(/Enter name in English/)` (1638-1640) | as log # 15 | quarantine |
| 18 | `engagement-create:12` | `getByRole('link', { name: /create engagement/ })` (1694-1696) | before `daa205461` (97-08, 2026-08-17, three days after the run) the list page passed `onCreate` only to its empty state; the header link it added reads "Log engagement"; the later URL assertion `/dossiers/<uuid>$` differs from `getDossierDetailPath` = `/dossiers/engagements/<id>` | quarantine; category regex at line 50 corrected |
| 19 | `engagement-create:76` | `getByLabel(/^category$/)` (1750-1752) | the label renders `Category *` (`EngagementDetailsStep.tsx:86`, present since `4c2ed73d6`, 29-05) | **fixed** |
| 20 | `engagement-create:113` | `getByLabel(/^category$/)` (1806-1808) | as log # 19; the steps after it drive `DossierPicker` with `.fill()` and a live country search | quarantine; category regex at line 130 corrected |
| 22 | `forum-create:5` | `getByRole('link', { name: /create forum/ })` (1908-1910) | as log # 18, header link "Add forum", redirect `/dossiers/forums/<id>` | quarantine |

(Log # 21 in the shard is `fouc-bootstrap`, P101-09's unit.) The regexes above omit the Arabic
alternation the specs carry; the EN project is the one that ran.

**Cause classes.** None of the 12 shows an application defect. All 12 are the spec expecting a UI
contract that differs from HEAD. Under D-09's letter that is drift, and drift is fixed. One of the 12
(ENGM-02) is fixed. The other 11 are quarantined, which departs from the letter of D-09, for one of two
reasons the register names:

1. **The fix is outside this unit's file scope** (5 tests). The failing call sits in a page object,
   `tests/e2e/support/pages/DossierListPage.ts` or `OperationsHubPage.ts`, and neither is in
   `files_modified`.
2. **The fix is a rewrite with two or more drifts, and its later steps cannot be verified without the
   `E2E_*` credentials** (6 tests). A rewrite that is still red at its second drift would redden the
   P101-07 `main` run that closes criterion 1. The marker keeps the test listed, names the evidence, and
   hands the rewrite to Phase 102.

**What this does not claim.** It does not claim that the role-ordered dashboard zones, dossier CSV
export/import, the elected-official, engagement or forum create wizards, or the participants chips are
absent or broken. It claims only that these 11 tests are red against the deployed app in run
`31848669722`, and that the locator each one waits on has no match at HEAD per the `git grep` counts
below.

## Quarantine register

| spec | test title | cause class | owner phase | cells |
| ---- | ---------- | ----------- | ----------- | ----- |
| tests/e2e/08-export-import.spec.ts | exports dossier list to CSV and re-imports a modified copy | spec drift in page object outside unit scope (`DossierListPage.exportCsv` / `importCsv`) | Phase 102 | 1 |
| tests/e2e/10-operations-hub.spec.ts | renders all 5 zones for leadership role | spec drift in page object outside unit scope (`ops-zone-*` testids, 0 emitters) | Phase 102 | 1 |
| tests/e2e/10-operations-hub.spec.ts | leadership role sees zones in correct order | spec drift in page object outside unit scope (`role-switcher`, 0 mount sites) | Phase 102 | 1 |
| tests/e2e/10-operations-hub.spec.ts | analyst role sees all zones in analyst order | spec drift in page object outside unit scope (`role-switcher`, 0 mount sites) | Phase 102 | 1 |
| tests/e2e/10-operations-hub.spec.ts | clicking a zone item navigates to its detail view | spec drift in page object outside unit scope (`ops-zone-*` testids, 0 emitters) | Phase 102 | 1 |
| tests/e2e/elected-official-create.spec.ts | ELOF-01/02/04: creates elected official with English-only office_name | spec drift, multi-step rewrite unverifiable without credentials (step 1 is `PersonBasicInfoStep`) | Phase 102 | 1 |
| tests/e2e/elected-official-create.spec.ts | D-08/D-19: creates elected official with Arabic-only office_name | spec drift, multi-step rewrite unverifiable without credentials (step 1 is `PersonBasicInfoStep`) | Phase 102 | 1 |
| tests/e2e/elected-official-create.spec.ts | ELOF-03: created elected official appears in both Persons and Elected Officials lists | spec drift, multi-step rewrite unverifiable without credentials (step 1 is `PersonBasicInfoStep`) | Phase 102 | 1 |
| tests/e2e/engagement-create.spec.ts | creates an engagement via the 4-step wizard and lands on the detail page | spec drift, multi-step rewrite unverifiable without credentials (list link, redirect regex) | Phase 102 | 1 |
| tests/e2e/engagement-create.spec.ts | ENGM-04: multi-select participants chip UX — add + remove | spec drift, later steps unverifiable without credentials (`DossierPicker` fill, chips) | Phase 102 | 1 |
| tests/e2e/forum-create.spec.ts | creates a forum via the 3-step wizard and lands on the detail page | spec drift, multi-step rewrite unverifiable without credentials (list link, redirect regex) | Phase 102 | 1 |

`cells` = reporter cells one marker skips. All 12 tests are listed only under `chromium-en` (unit `--list`
below: `Total: 12 tests in 5 files`, every row `[chromium-en]`), so each marker skips one cell. Sum of
cells = 11 = rows = markers.

## Fixed tests

| kind  | spec | test | drift named |
| ----- | ---- | ---- | ----------- |
| FIXED | tests/e2e/engagement-create.spec.ts | ENGM-02: blocks submission when end_date is before start_date | `getByLabel(/^category$/)` against the label text `Category *` (the required marker appended in `EngagementDetailsStep.tsx:86` since `4c2ed73d6`); the anchored `$` could never match, so the regex is now `/^category\b/` |

**The remaining path of ENGM-02, checked against HEAD source rather than a run.**
- `STEP_VALIDATION_FIELDS['engagement-details']` = `engagement_type`, `engagement_category`,
  `start_date`, `end_date`, so "Next" triggers exactly these fields.
- The schema's other required fields are filled by the spec (`name_en`, `name_ar`, min 2) or defaulted
  (`status`, `sensitivity_level`). The `.refine` therefore runs and puts
  `form-wizard:validation.end_after_start` on path `end_date`.
- `FormMessage` translates that key. The EN value is exactly "End date must be on or after start date",
  which the spec's text regex matches.
- `CreateWizardShell` contains no error summary or toast that would duplicate the text.
- `components/ui/form-wizard.tsx` has no router navigation, so the URL stays on `/create$`.
- The lines before the fix (`engagement type` label, the `bilateral meeting` option) passed in CI, per the
  log.

The deployed app at `E2E_BASE_URL` is not proven to be HEAD. This fix is verified against HEAD source only.

## Bound: the root shards cannot run locally

The root config's `setup` project (`tests/e2e/support/auth.setup.ts`) requires all six `E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}` keys and throws on any missing pair. The worktree's
`.env.test` key names (names only, values never read):

```
SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_URL TEST_USER_EMAIL TEST_USER_PASSWORD PHASE_52_FIXTURE_ENGAGEMENT_ID SUPABASE_DB_URL E2E_ADMIN_EMAIL E2E_ADMIN_PASSWORD
E2E_* names: E2E_ADMIN_EMAIL E2E_ADMIN_PASSWORD
```

The six `E2E_*` keys are absent locally; the worktree hook maps only the admin pair (RESEARCH §3). No
Playwright suite ran in this unit (D-13): only `--list`, which is discovery. The run proof for the one fix
and the 11 markers is therefore the `main` run P101-07 observes. There, ENGM-02 should read passed and
the 11 skipped. That observation belongs to P101-07; this SUMMARY does not predict its outcome.

## Commands run, with verbatim output

1. `command -v gh && gh auth status` → `/opt/homebrew/bin/gh`, `✓ Logged in to github.com account
   alzahrani-khalid (keyring)`, scopes include `repo`, `workflow`.
2. The derivation above: `gh run view ... --log-failed` exit 0, 2437 lines; outputs as quoted.
3. Root population (before and after the edits, same output both times):
   `pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke --no-deps --list 2>&1 | grep -oE "Total: [0-9]+ tests in [0-9]+ files"`
   → `Total: 220 tests in 65 files`.
4. Unit population:
   `pnpm exec playwright test tests/e2e/08-export-import.spec.ts tests/e2e/10-operations-hub.spec.ts tests/e2e/elected-official-create.spec.ts tests/e2e/engagement-create.spec.ts tests/e2e/forum-create.spec.ts --project=chromium-en --project=chromium-ar-smoke --no-deps --list`
   → 12 rows, all `[chromium-en]`, `Total: 12 tests in 5 files`.
5. Zeros, each beside a control from the same instrument (`git grep -F <p> -- frontend/src | grep -v __tests__ | wc -l`, tracked files, so `.gitignore` cannot hide a hit):

   ```
   ops-zone-                    0
   data-testid="role-switcher"  1
   dossier-import-csv-input     0
   list.exportDossiers          1
   <ActionBar                   0
   RoleSwitcher role=           1
   ```

   The ANSI-strip zero (0 lines with `^[[` after the strip) sits beside the 17 before it. The marker zero
   before this unit's edits (oracle drill of 2026-09-10: `markers 0`) sits beside the
   `positions-keyboard-nav` fixme control of 13.
6. History reads: `git log -S'ops-zone-' -- frontend/src` → `c42f722c8 2026-04-25 feat(38-09-TASK-5):
   remove legacy OperationsHub page + refresh stale comment`, `5ac8c8f58 2026-04-09 feat(22-01): add
   ops-zone testids and fix Operations Hub spec/POM`. `git log -S'empty-states:list.forum.cta'` and
   `-S'empty-states:list.engagement.cta'` → `daa205461 2026-08-17 feat(97-08): NAV-03 ...`.
   `git show daa205461^:` of both list pages shows `onCreate` passed only to the empty state.
7. The plan's oracle, extracted byte-identically from `101-08-PLAN.md` front-matter with js-yaml (17
   lines, md5 `bd22e662d3bfdfa7b4a24ca8703d9cf0`), run with `bash` from the worktree root (output under
   `## Oracle`).

## Oracle

Run after the spec edits and after this file's register and FIXED table existed. The command is
`bash o08.sh` from the worktree root; `o08.sh` is the plan's `must_haves.truths[0].command`, extracted
byte-identically. Output verbatim, exit **0**:

```
P101-08-BOUND files=5 markers with a run id=11 (any P101-QUAR=11, any fixme incl. pre-existing=11; control positions-keyboard-nav fixme=13) register rows=11 cells total=11 non-numeric=0 fixed rows=1 root list=[Total: 220 tests in 65 files] want the 12 (shard 1: 08 1, 10 4, elected-official 3, engagement 3, forum 1) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
PASS
```

Reading it: 11 markers + 1 FIXED = the 12 derived. `any fixme incl. pre-existing=11` means these 5 files
had no `test.fixme(` before this unit, so every fixme here is a P101-QUAR marker. The control reads 13, so
the grep can see a non-zero.

### Re-run at attempt 2, after the merge withdrawal

Attempt 0 passed all 7 gates. The engine then withdrew the merge with `Uncommitted at round end: ?? blob-report/`.
`blob-report/` is untracked and not gitignored, and the root config adds the blob reporter only when `CI`
is set (`playwright.config.ts:15-16`). Neither `.gitignore` nor the oracle is in this unit's file scope,
so attempt 2 changes no spec. The overseer's ruling (run 0082) prefixes the compiled oracle with
`R0="$PWD"; trap 'rm -rf "$R0/blob-report" "$R0/frontend/blob-report"' EXIT`. Attempt 2 extracted that
compiled oracle from `.tickmarkr/graph.json` (19 lines, md5 `5e23f2acddefba47b5bb8af6c36d39ed`) and ran
it with `bash` from the worktree root, once with `CI` unset and once with `CI=1`. After each run it read
`git status --porcelain=v1 -uall` and checked for `blob-report/`. Output verbatim:

```
===== run with CI unset
P101-08-BOUND files=5 markers with a run id=11 (any P101-QUAR=11, any fixme incl. pre-existing=11; control positions-keyboard-nav fixme=13) register rows=11 cells total=11 non-numeric=0 fixed rows=1 root list=[Total: 220 tests in 65 files] want the 12 (shard 1: 08 1, 10 4, elected-official 3, engagement 3, forum 1) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
PASS
EXIT=0
porcelain -uall after:
(end)
blob-report present: no
===== run with CI CI=1
P101-08-BOUND files=5 markers with a run id=11 (any P101-QUAR=11, any fixme incl. pre-existing=11; control positions-keyboard-nav fixme=13) register rows=11 cells total=11 non-numeric=0 fixed rows=1 root list=[] want the 12 (shard 1: 08 1, 10 4, elected-official 3, engagement 3, forum 1) red tests each fixed or marked: markers+fixed>=1, markers==any-P101-QUAR, rows==markers, cells>=rows, non-numeric=0, list='Total: 220 tests in 65 files'
INSTRUMENT-CANNOT-RUN: playwright --list printed no Total line
EXIT=3
porcelain -uall after:
(end)
blob-report present: no
```

Both runs left the porcelain empty and no `blob-report/`. The `CI=1` exit 3 is the property of the shared
instrument that the attempt-0 review already deferred: the `Total:` line comes only from the non-CI `list`
reporter. It is recorded here and left unchanged. The only other file either run wrote is the gitignored
`playwright-report/`, which was removed afterwards.

## Left for later

- **Phase 102:** rewrite the 11 quarantined tests and lift their markers. `08` and the four `10` tests
  need their page objects rewritten (`DossierListPage` export/import through the dialogs,
  `OperationsHubPage` against the Phase 38 Dashboard). The five create-wizard tests need the flows
  rewritten against `PersonBasicInfoStep`, the "Log engagement" / "Add forum" header links, the
  type-segmented detail redirect, and `DossierPicker`.
- **P101-07:** read ENGM-02 and the 11 markers in the first `main` E2E run after the phase PR merges. If
  ENGM-02 is still red there, it returns to this register with the new log line.
