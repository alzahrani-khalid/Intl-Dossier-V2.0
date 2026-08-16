# Phase 93 — CLOSING VERIFICATION

**Author:** `93-15` executor, single seat, one pass (GATE-STANDARD §The pass procedure).
**Date:** 2026-08-16.
**Base tag:** `phase-93-base` = `e185f1757b3026a485fdf3fae05d5b64ae4b5785` (signed, verified).
**Tree at derivation time:** `402ae9927`; **tree at close:** `15e9f6804`.

> **Concurrency disclosure — the brief said this seat was the only lane in flight; it was not.**
> `15e9f6804` ("docs(93): DR-SUBPATH-01 — quantify the blast radius") landed on
> `milestone/v10.0-trust` from another seat while these derivations were running. Verified
> non-invalidating before trusting any number above:
> `git diff --name-only 402ae9927..HEAD -- frontend/src supabase backend/src tests scripts` → **0
> files**. The commit touches `.planning/REQUIREMENTS.md` only. Every source derivation below
> therefore stands at both shas. Recorded rather than assumed, because "HEAD moved between the
> report and the check" is how a correct claim goes stale on a tree under repair.

**Working-tree integrity across every construction in this document:**
`git status --porcelain` = **empty (0 lines)** before the first construction and **empty (0 lines)**
after the last. Two scratch worktrees (`/tmp/p93-scratch` at the base tag, `/tmp/p93-scratch-head`
at HEAD) were created, used, and removed; `git worktree list` at close shows no Phase-93 scratch
entries.

---

## 1. The five closing derivations — each with its POPULATION and what falls outside it

Every derivation below was run in **both directions** on the **same instrument**: once against
`phase-93-base` and once against the executed tree. A number without its opposite is not evidence.

### D1 — TRUST-01: the widened catch-and-return scan

**Command** (`/tmp/p93-catch-scan.mjs`, a re-implementation of `93-RESEARCH.md` §TRUST-01's scanner):

```
node p93-catch-scan.mjs frontend/src/domains/analytics/repositories/analytics.repository.ts \
                        frontend/src/domains/dossiers/hooks/useDossier.ts \
                        frontend/src/hooks/useWidgetDashboard.ts
```

| tree            | files | catch blocks | catch-and-return (no `throw`)                                 |
| --------------- | ----- | ------------ | ------------------------------------------------------------- |
| `phase-93-base` | 3     | 10           | **6** — the six D-02 sites, each printed with its faked value |
| HEAD            | 3     | 4            | **0**                                                         |

**POPULATION DEFINITION.** Search root: the three files carrying D-02's six named defect sites
(`analytics.repository.ts` ×3, `useDossier.ts` ×2, `useWidgetDashboard.ts` ×1). Glob: the named
paths themselves. Matching rule: `catch\s*(\([^)]*\))?\s*\{` located, then **brace-depth matched**
to read multiline bodies whole; a site counts when the body contains `return` and does **not**
contain `throw`.

**WHICH NUMBER THIS IS — D-02's closing rule.** `6` is the count of **the DEFECT**. `45` is the
count of **the SHAPE** over the seven-root population. This derivation measured the defect.

**Whole-shape control, same instrument, seven roots**
(`frontend/src/{domains,hooks,services,lib,components,routes,pages}`, `*.ts`/`*.tsx`, excluding
`__tests__` and `*.test.*`): **1,412 files, 268 catch blocks, 39 catch-and-return sites at HEAD.**
Research recorded 45 of the shape at base; 45 − 6 = 39. The shape shrank by exactly the defect, and
by nothing else — no collateral deletion.

**WHAT FALLS OUTSIDE IT.** `.catch(…)` expression bodies (4 sites, triaged out by research);
catch-and-assign (7 sites); TanStack Query `select` / `placeholderData` absorption (0 / 2 sites);
supabase-js results whose `.error` is never destructured — **structurally invisible to any
catch-scan**, and the reason site 6's repair was a rethrow rather than a deletion. Also outside: the
`data: x = []` masks, treated separately in §5.

### D2 — Criterion 5: the bucket-(a) render population

**Command** (93-14's filter chain verbatim, widened from its 22 files to the full 25-site
population — the 23 that plan owned plus the two owned by `93-06` / `93-07`):

```
grep -v '^[[:space:]]*//' <25 files> | grep -vE 'console\.|throw |new Error|toast' \
  | grep -cE 'error\?\.message|error\.message|err\.message'
```

| tree            | files present | matching lines                                                                                                                    |
| --------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `phase-93-base` | 25/25         | **26** (Countries.tsx contributes 2 — the operand at `:90` and the fallback **key name** `t('countries.error.message')` at `:91`) |
| HEAD            | 25/25         | **0**                                                                                                                             |

Per-file listing at base captured: every one of the 25 files carried its cited site. No file was
counted that did not exist — the existence loop precedes the count in the same chain (C5).

**POPULATION DEFINITION.** Search root: the 25 enumerated bucket-(a) files under
`frontend/src/{routes,pages,components}`. Glob: the named paths. Matching rule: non-comment lines
(`//`-prefixed stripped), minus `console.*` / `throw` / `new Error` / `toast` lines, matching
`error?.message` / `error.message` / `err.message`.

**WHAT FALLS OUTSIDE IT.** Bucket (b) — the 7 exception-boundary renders — named and **not swept**
(D-22). Bucket (c) — React-Hook-Form field errors — correct by design, never in scope.
`BotIntegrationsSettings.tsx:155`'s toast — still `toast.error(error.message || …)`, outside by
D-22. `lib/query-client.ts`'s `onSuccess` toast — WRITE-04 / Phase 94. **Multiline and
template-string renders the single-line grep cannot see** — so 39 (the partitioned total) is a
FLOOR, not a total. And a deliberately-loose superset grep with the JSX filter removed returned
**71 lines across 44 files** at 93-14's close: an upper bound on remaining _reads_, emphatically not
a residual bucket-(a) count.

### D3 — PIN-2390-01: the pinned-version sweep, and the narrow population that missed it

```
grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='*.ts'
```

| tree            | `--include='*.ts'` (the widened population, D-16)                                     | `--include='index.ts'` (Phase 92's population) |
| --------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `phase-93-base` | **2** — `dossier-stats/dashboard-aggregations.ts`, `_shared/ai-interaction-logger.ts` | **0**                                          |
| HEAD            | **0**                                                                                 | **0**                                          |

**This table is the phase's thesis in four cells.** The narrow command was _correct_. It returned
`0` — a true statement about `index.ts` files — while two live pins sat in the tree. It returns the
same `0` today, and would keep returning it forever. **A correct command returning a correct number
about the wrong set is indistinguishable from success until someone widens the set.**

**POPULATION DEFINITION.** Search root: `supabase/functions` (**320 `.ts` files** at HEAD). Glob:
`*.ts`. Matching rule: files containing an `esm.sh/@supabase/supabase-js@2.3<digit>` import
specifier, value **or** type-only.

**WHAT FALLS OUTSIDE IT.** Non-`.ts` files (none carry imports here, unverified). **Bundles already
deployed** — the source pin and the running pin are different facts; the deployed half is covered by
`93-03`'s redeploy evidence and by the live probe in §4, not by this grep. Import maps and
`deno.json` pins were not searched.

### D4 — The anti-grant guard (`93-04_g3`) and its live half

**Repo half** — `test -d supabase/migrations && test -d backend/migrations && test "$(grep -rniE
'grant[[:space:]]+select[^;]*auth\.users' … | grep -vE '^[^:]+:[0-9]+:[[:space:]]*--' | wc -l)" -eq 0`

- Roots proven to exist in the same `&&` chain (C5): `supabase/migrations` = **484** files,
  `backend/migrations` = **10**.
- Raw matches including comments: **3**. Uncommented matches: **0**. **Gate exit 0.**
- The 3-vs-0 gap **is** the C8 control: the migration's own `-- REFUSED, PERMANENTLY: GRANT SELECT
ON auth.users TO authenticated;` refusal header does not trip the guard it documents.

**Live half** (D-23 label: point-in-time MCP evidence, `CANNOT CONSTRUCT` as a standing gate — no
Postgres DSN exists on this machine). Re-run at close against staging `zkrcjzdemdmwhearhfgg`:

```sql
SELECT grantee, privilege_type FROM information_schema.table_privileges
WHERE table_schema='auth' AND table_name='users';
```

→ **`postgres` only**, seven privilege rows (`SELECT` among them). **No role beyond `postgres`
holds `SELECT` on `auth.users`.** The refusal holds. The eight metadata-role policies remain
fail-closed.

**POPULATION DEFINITION.** Repo half — search roots `supabase/migrations` + `backend/migrations`,
all files, case-insensitive `GRANT SELECT … auth.users` on non-`--` lines. Live half — every
grantee/privilege row on `auth.users` in the staging catalog at 2026-08-16.

**WHAT FALLS OUTSIDE IT.** A grant applied **by hand** outside the migrations directories is
invisible to the repo half. The live half is a **snapshot, not a standing assertion** — it says
nothing about tomorrow. Neither half covers production (untouched, unmeasured).

### D5 — i18n: `errors.*` key-set equality plus the seven named keys

`93-01_g3`'s node derivation, verbatim, plus a decomposition run:

| tree            | `en.errors` leaves | `ar.errors` leaves | symmetric difference  | the 7 named keys                                         |
| --------------- | ------------------ | ------------------ | --------------------- | -------------------------------------------------------- |
| `phase-93-base` | 6                  | 6                  | **0** (already equal) | all 7 `undefined` in **both** locales                    |
| HEAD            | **13**             | **13**             | **0**                 | all 7 present as `string` in both; **all 7 `en !== ar`** |

**Gate exit 0.** The `en !== ar` conjunct is the negative control that makes this a translation
check and not a copy check: a copy-paste of the English value into `ar/common.json` would satisfy
key-set equality and **fail** here.

**POPULATION DEFINITION.** `frontend/src/i18n/{en,ar}/common.json`, the `errors` subtree only,
flattened to dotted leaf paths, compared as sets.

**WHAT FALLS OUTSIDE IT.** Every other namespace in both locales. **Arabic was verified as JSON,
not as pixels** — no RTL render of the new error copy was captured; that limitation is inherited
verbatim from Phase 92 and is not discharged here. Whether each Arabic string is a _good_
translation is not measurable by any gate in this phase.

---

## 2. C9b cross-phase consumers — the register of record, carried in and re-checked

Source: `.tickmarkr/overseer/C9B-REGISTER-P93.md` (the mock-vs-real register, overseer order
`D-71`). **A mocked consumer is a NON-ORACLE and counts for nothing.** Verdicts below re-checked at
close.

<!-- prettier-ignore -->
| # | consumer spec | subject(s) | verdict | re-check at close |
| --- | --- | --- | --- | --- |
| 1 | `frontend/tests/unit/routes.test.tsx` | `DossierShell`, `DossierListPage`, `error-boundary/`, `router/index.tsx` | **MOCK — NON-ORACLE** | HOLDS. `vi.mock` at `:209` / `:127` / `:123`. Its 14/14 green would survive deleting all four subjects' bodies. **Counts for nothing.** |
| 2 | `frontend/tests/e2e/pull-to-refresh.spec.ts` | `DossierListPage`, `CommitmentsList`, `WorkItemList` | **REAL** | HOLDS. 5 failed / 8 passed, identical at base and HEAD → `E2ESTALE-01` (loose `locator('h1')`, 44 matches). |
| 3 | `frontend/tests/e2e/direction-portals.spec.ts` | `DossierShell` | **REAL** | HOLDS. `5 passed` before and after (`93-11`). |
| 4 | `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` | `DossierShell` | **REAL** | HOLDS. `20 failed / 2 passed` before **and** after — pre-existing, unchanged. |
| 5 | `frontend/tests/e2e/analytics-dashboard.spec.ts` | `AnalyticsDashboardPage`, `QueryErrorState`, `query-client` | **REAL** | HOLDS. Inverted by `93-06` under `RULING-P93-04` D1; final `8 passed / 1 failed`, the 1 = `:153` → `E2ESTALE-01`. **Two of its tests were VACUOUSLY GREEN before** (`title OR skeleton` inside `.toPass`) — real, but a race, not an oracle. |
| 6 | `frontend/tests/component/AfterActionForm.test.tsx` | `positions/AttachmentUploader` | **NON-CONSUMER — NAME COLLISION** | HOLDS. Imports `@/components/attachment-uploader/AttachmentUploader` — a **different file** — and `vi.mock`s it at `:63`. Its `28 passed` establishes nothing. **Counts for nothing.** |
| 7 | `tests/unit/components/ErrorBoundary.test.tsx` | `error-boundary/ErrorBoundary` | **UNRUNNABLE — NON-ORACLE** | HOLDS. The only **non-mocking** vitest consumer in the set, and it cannot execute: root `vitest.config.ts:37` aliases `@` → a nonexistent dir → `ROOTALIAS-01`. Verdict **unavailable, not green.** |
| 8 | `tests/unit/components/MainLayout.test.tsx` | `error-boundary/` | **MOCK — NON-ORACLE** | HOLDS. `vi.mock('…/error-boundary')` at `:22`. **Counts for nothing.** |
| 9 | `tests/e2e/92-delegations-error.spec.ts` | `my-delegations/index.ts`, `DelegationManagementPage` | **REAL** | HOLDS — **CONFIRMED and closed**. Updated inside `93-02` with its `DELEG-02` breadcrumb; **`2 passed` in this seat's own close-out run** (§4). The instance C9b was written for. |
| 10 | `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts` | `WorkspaceShell` (coupled by **DATA**) | **REAL** | HOLDS. `1 passed / 1 failed` → `1 failed` after `93-12`, measured both directions. Correct behaviour over a broken seed → `P52FIXTURE-01`. **No grep could find this row** — the coupling is a fixture uuid. |
| 11 | `03-dossier-navigation` · `04-command-palette` · `08-export-import` · `ar-smoke/dossier-navigation.ar` + POM `support/pages/DossierListPage.ts` | `DossierListPage` | **REAL but UNRUN** | HOLDS. Would be real oracles; unrunnable under `E2ECRED-01`. `93-07` verified the happy path via a runnable inline-auth substitute. Verdict **unavailable, not green.** |

**Tally, restated so no reader totals eleven defences: 6 REAL** (one of which — `_phase52` — no
sweep could find), **1 REAL-but-UNRUN group, and 4 that count for nothing** (2 mocked, 1 name
collision, 1 unrunnable). **Four of the eleven couplings are not defences.**

**The sweep re-run at close, with the instrument deviation recorded.** `GATE-STANDARD.md` §C9b's
escape step (`sed -E 's/[][.*+?^${}()|\\]/\\&/g'`) is **rejected outright by BSD/macOS sed**
(`unbalanced brackets ([])`); sed errors to stderr while the loop continues with an **empty `id`**,
the pattern degenerates to `\b\b`, and every changed file reports as coupled to every spec (1.8 MB).
**The standard was NOT edited** — it is the overseer's text and a ruling is pending (`GATESTD-01`).
This seat substituted a **reject-unsafe-id** check
(`case "$id" in *[^A-Za-z0-9_-]*) echo UNSAFE; continue;; esac`), which fails **closed and loud**.

Result at close: **4 derived test roots** (`./frontend/tests` 221 · `./tests` 130 ·
`./backend/tests` 235 · `./e2e/tests` 16 spec files), **51 changed source files** vs
`phase-93-base`, and the same 4 ids the broken escape silently mangled surfaced as `UNSAFE`
(`QueryErrorState.test`, `analytics.repository`, `common.json` ×2).

**POPULATION DEFINITION (C9b sweep).** Search roots derived, never named:
`find . -maxdepth 3 -type d -name tests -not -path '*/node_modules/*'`. Subjects: every file in
`git diff --name-only phase-93-base -- frontend/src supabase/functions backend/src`. Matching rule:
word-boundary ERE on the derived identifier (parent directory when the basename is `index`; leading
`$` router marker stripped); generic ids stoplisted; unsafe ids rejected.

**WHAT THE DERIVATION CANNOT SEE, stated as part of the rule.** (a) Tests coupled by **shape
alone** — `getByRole('alert')` plus visible text, naming no identifier — match no grep. (b) Tests
coupled by **data**, as row 10 is. The residual defence for both is running the shipped suite, which
is what rows 2/4/5/10 record. (c) **The raw sweep is a CANDIDATE list, not a defect list**: at close
it returns **410 distinct candidate spec files** across the 51 changed files, because common domain
nouns (`dossiers`, `positions`, `Countries`) match hundreds of backend contract tests that merely
mention the noun. Triage to "does this test assert the output I am changing?" narrows 410 → **11**.
Anyone re-running the sweep and reading 410 as coverage has read the wrong number.

---

## 3. The gate drill table — 36 gates, C1 both directions

**Mechanical half** (`node scripts/gate-drill.mjs .planning/phases/93-failure-visibility --timeout
900`, run at close): **36 gates · 36 parsed · 0 parse-fail · 35 exited 0.** The single non-zero is
`93-15_g1` — this document's own gate, red because this file did not yet exist when the drill ran.
Raw log: `/tmp/p93-gatedrill-close.log`.

**The script's own disclaimer governs how this table reads it:** a green from `gate-drill.mjs` is
**not** evidence a gate is sound. The C1-clause-2 half is authored per gate below.

**Sourcing rule for this table.** 34 of the 36 gates had their red→green pair **observed and
recorded during execution**, in the owning plan's SUMMARY, at the moment the work landed — not
reconstructed here. Those rows **cite** that evidence rather than re-running it; re-running a green
today would establish less than the original observation did, because today's tree already contains
the work. The two `93-15` gates are this seat's own and were constructed here.

| plan.gate  | C1 red (observed)                                                                                                                                                                                                                                                                                                                                                                              | C1 green construction                                                                                                                                                                    | C2–C10 exceptions                                                                                                                                                                                                                                                 | verdict                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `93-01_g1` | **not red — green on arrival**; subject (signed tag) pre-existed                                                                                                                                                                                                                                                                                                                               | same cmd, `EXIT=0`, `Good "git" signature`, object `e185f175`                                                                                                                            | green-on-arrival, non-vacuous: gate reaches its subject                                                                                                                                                                                                           | **SOUND**                          |
| `93-01_g2` | `EXIT=1`, `No test files found`; `error-states/` absent                                                                                                                                                                                                                                                                                                                                        | full chain `EXIT=0`; `9 passed`; `type-check` clean                                                                                                                                      | subject-absent red = the C1-cl.2 case, resolved by construction. C3 pre-checked: `type-check` exists in `frontend/package.json`                                                                                                                                   | **SOUND**                          |
| `93-01_g3` | `EXIT=1`, no output; diagnostic: key-sets already equal 6/6, 7 named keys `undefined`                                                                                                                                                                                                                                                                                                          | `EXIT=0`                                                                                                                                                                                 | **C2 exemplary** — red attributable to the 7 keys, _not_ to parity, proven by decomposition                                                                                                                                                                       | **SOUND**                          |
| `93-02_g1` | `exit=1`; `message_ar` = 0 (need ≥2)                                                                                                                                                                                                                                                                                                                                                           | `exit=0`; `message_ar` = 2                                                                                                                                                               | one conjunct is a green-at-baseline **regression guard**, labelled not counted                                                                                                                                                                                    | **SOUND**                          |
| `93-02_g2` | `exit=1`; `details:error` = **15** live passthroughs                                                                                                                                                                                                                                                                                                                                           | `exit=0`; count 0                                                                                                                                                                        | `message_ar ≥1` is a regression guard (31 at baseline)                                                                                                                                                                                                            | **SOUND**                          |
| `93-02_g3` | `exit=1`; probe `my-delegations -> 200` — the confident lie                                                                                                                                                                                                                                                                                                                                    | `exit=0`; probe `-> 500`, playwright `2 passed`                                                                                                                                          | composite; half B green at baseline — **measured, not assumed**                                                                                                                                                                                                   | **SOUND**                          |
| `93-03_g1` | `EXIT=1`, exactly 2 matching files, both printed                                                                                                                                                                                                                                                                                                                                               | `EXIT=0`, count 0                                                                                                                                                                        | red on the subject                                                                                                                                                                                                                                                | **SOUND**                          |
| `93-03_g2` | **green before the work** — a regression guard; RED **constructed twice**                                                                                                                                                                                                                                                                                                                      | post-redeploy identical six lines, `EXIT=0`                                                                                                                                              | labelled a guard, not a pass                                                                                                                                                                                                                                      | **SOUND**                          |
| `93-04_g1` | `exit=1`; migration file absent (`ls` → No such file)                                                                                                                                                                                                                                                                                                                                          | `exit=0`; `is_platform_admin` 7 ≥ 4, `DROP POLICY` = 4, `auth.users` 0, `raw_*_meta_data` 0                                                                                              | C4 max-reachable shown (7 ≥ 4)                                                                                                                                                                                                                                    | **SOUND**                          |
| `93-04_g2` | `exit=1`; probe `data-retention -> 500`                                                                                                                                                                                                                                                                                                                                                        | `exit=0`; probe `-> 200`                                                                                                                                                                 | live behavioural oracle                                                                                                                                                                                                                                           | **SOUND**                          |
| `93-04_g3` | **RED constructed** 3-step: (A) clean copy → 0 GREEN; (B) **commented** grant → 0 GREEN (**C8 control**); (C) uncommented grant → 1 **RED**                                                                                                                                                                                                                                                    | clean tree `exit=0`; re-verified by this seat (§D4): roots 484 + 10, raw 3 / uncommented 0                                                                                               | drill built in a `/tmp` file copy, not a worktree — declared deviation; the gate is a grep over two roots, so a directory copy reproduces its population exactly                                                                                                  | **SOUND**                          |
| `93-05_g1` | `GATE1 EXIT=1`; `entity_type` 0, quoted `table_name` 5                                                                                                                                                                                                                                                                                                                                         | `exit=0` after the **`RULING-P93-03`-authorized** retarget                                                                                                                               | **gate text AMENDED under ruling** — precision, not weakening: the two survivors were a CSV header label (`:249`) and a wire query-param name (`:588`), neither a DB-column claim. Candidate 3 (rename the param) REFUSED — that is the anti-grant HINT's shape   | **REPAIRED (RULING-P93-03)**       |
| `93-05_g2` | recorded red; deployment-level RED→GREEN corroborated in the Supabase gateway log (`version: 7` → `8`)                                                                                                                                                                                                                                                                                         | `GATE2 EXIT=0`                                                                                                                                                                           | live deploy evidence, version-pinned                                                                                                                                                                                                                              | **SOUND**                          |
| `93-06_g1` | recorded red on the swallow                                                                                                                                                                                                                                                                                                                                                                    | `exit=0`                                                                                                                                                                                 | —                                                                                                                                                                                                                                                                 | **SOUND**                          |
| `93-06_g2` | `1 failed` at the assertion of record                                                                                                                                                                                                                                                                                                                                                          | `1 passed`                                                                                                                                                                               | **material instrument finding:** the Vite dev server served a **stale module** and the spec passed with the swallow restored; discriminated by `curl http://localhost:5173/src/…`                                                                                 | **SOUND (with instrument caveat)** |
| `93-07_g1` | `EXIT=1`; decomposed: `emptyCounts` 3, `countUnavailable` 0, `error.message` renders 1 (`:817`)                                                                                                                                                                                                                                                                                                | `EXIT=0`; instrument agrees                                                                                                                                                              | **C8 exposure** in clause 4 (negative grep strips `//` only) — reported, not edited; `type-check` clause is **repo-wide**                                                                                                                                         | **SOUND (C8 noted)**               |
| `93-07_g2` | two reds; the meaningful one shows the D-21 lie live — seven `0` cards **while** `Showing 1 to 12 of 43`                                                                                                                                                                                                                                                                                       | `1 passed`                                                                                                                                                                               | red at the assertion of record                                                                                                                                                                                                                                    | **SOUND**                          |
| `93-08_g1` | `EXIT=1`; catch-string 1, `throw` count 0                                                                                                                                                                                                                                                                                                                                                      | `EXIT=0`; catch-string 0, `throw` 1                                                                                                                                                      | `pnpm type-check` is **whole-repo**; fired mid-plan from another lane's `TS6133`                                                                                                                                                                                  | **SOUND (C2 relevance noted)**     |
| `93-08_g2` | subject-absent red; spec file missing                                                                                                                                                                                                                                                                                                                                                          | `EXIT=0`, `1 passed`                                                                                                                                                                     | —                                                                                                                                                                                                                                                                 | **SOUND**                          |
| `93-09_g1` | `exit 1`; `isError` 0, `QueryErrorState` 0 — died at its own subject                                                                                                                                                                                                                                                                                                                           | `exit 0`; `type-check` clean                                                                                                                                                             | **C10:** the criterion says "isError **consumed**"; the gate greps **presence**. A comment mentioning `isError` would satisfy it                                                                                                                                  | **SOUND (C10 gap noted)**          |
| `93-09_g2` | `exit 1`; `isError` 0 vs threshold 6                                                                                                                                                                                                                                                                                                                                                           | `exit 0`; count **10** ≥ 6                                                                                                                                                               | C4 max-reachable shown (10 ≥ 6); same C10 presence-vs-consumption gap                                                                                                                                                                                             | **SOUND (C10 gap noted)**          |
| `93-09_g3` | `exit 1`, `Error: No tests found.` (single missing path ⇒ **fails closed**)                                                                                                                                                                                                                                                                                                                    | `exit 0`, `4 passed`; live numbers echoed (`field-permissions rows=19`, `data-retention policy rows=16`)                                                                                 | behavioural oracle over both routes                                                                                                                                                                                                                               | **SOUND**                          |
| `93-10_g1` | `g1 EXIT=1`; stub-literal 1, `tag-hierarchy/analytics` absent, `error \|\| !stats` 1                                                                                                                                                                                                                                                                                                           | `g1 EXIT=0`                                                                                                                                                                              | **C8 confirmed live**: the negative grep strips `//` but not `/* */`, and the author's own JSDoc tripped it; `type-check` repo-wide (observed red from a foreign lane's 7× `TS6133`)                                                                              | **SOUND (C8 + C2 noted)**          |
| `93-10_g2` | `g2 EXIT=1`; `isError` 0, `QueryErrorState` 0, spec absent                                                                                                                                                                                                                                                                                                                                     | `g2 EXIT=0`, `2 passed`                                                                                                                                                                  | conflates "playwright non-zero" with "not 2 passed" (informational)                                                                                                                                                                                               | **SOUND**                          |
| `93-11_g1` | `GATE EXIT=1`; `grep -c notFound` → **0**; `test -f` passed, so red is at the subject                                                                                                                                                                                                                                                                                                          | `EXIT=0`                                                                                                                                                                                 | —                                                                                                                                                                                                                                                                 | **SOUND**                          |
| `93-11_g2` | `EXIT=1`, `2 failed`; both died at their assertion of record (`404` not found; `query-error-state` not found), server curl-verified as serving the base module                                                                                                                                                                                                                                 | `EXIT=0`, `2 passed`, server curl-verified (`rootRouteId` = 2)                                                                                                                           | env hazards, not gate defects; both directions re-measured on a freshly started `:5173`                                                                                                                                                                           | **SOUND**                          |
| `93-12_g1` | gate as a whole red and green on `engagement: null`                                                                                                                                                                                                                                                                                                                                            | `exit=0`                                                                                                                                                                                 | **conjunct that cannot go red:** `grep -qE "type.{0,20}engagement"` matched **12** times on the pre-work tree and would survive reverting Task 1. The gate as a whole is still C1-valid                                                                           | **SOUND (one vacuous conjunct)**   |
| `93-12_g2` | `exit=1`; all four greps → 1                                                                                                                                                                                                                                                                                                                                                                   | `exit=0`, `type-check` clean                                                                                                                                                             | —                                                                                                                                                                                                                                                                 | **SOUND**                          |
| `93-12_g3` | `exit=1`, `Error: No tests found.`                                                                                                                                                                                                                                                                                                                                                             | `exit=0`, `3 passed`                                                                                                                                                                     | —                                                                                                                                                                                                                                                                 | **SOUND**                          |
| `93-13_g1` | `GATE1_EXIT=1`; per-token: `loader`/`notFound`/`errorComponent`/`QueryErrorState`/`42P17` **all five ABSENT** → short-circuits at its subject, never reaches `type-check`                                                                                                                                                                                                                      | `EXIT=0`                                                                                                                                                                                 | `type-check` repo-wide; went red **twice** from two different lanes' WIP                                                                                                                                                                                          | **SOUND (C2 relevance noted)**     |
| `93-13_g2` | **two reds, the second load-bearing**: (i) subject-absent `No tests found.`; (ii) **true negative control** — the finished spec, byte-unchanged, against a server serving the pre-loader module → `1 failed` at the assertion of record                                                                                                                                                        | `EXIT=0`, `1 passed`                                                                                                                                                                     | stale-dev-server hazard discriminated by curl                                                                                                                                                                                                                     | **SOUND**                          |
| `93-14_g1` | `g1 EXIT=1`; per-clause A=0 (need ≥1), B=1, C=2, D=2 — **all four clauses red on their own subject**                                                                                                                                                                                                                                                                                           | `g1 EXIT=0`, `tsc` clean; re-run post-commit `EXIT=0`                                                                                                                                    | **GC-2 (C10):** the criterion names the `onSuccess` toast being byte-unchanged; the gate never checks it                                                                                                                                                          | **SOUND (C10 gap noted)**          |
| `93-14_g2` | `g2 EXIT=1`; **23** matching lines over the 22 files, per-file listing captured                                                                                                                                                                                                                                                                                                                | `g2 EXIT=0`                                                                                                                                                                              | **honest intermediate red on the record**: after the operands dropped, the grep clause passed but `type-check` failed with 6× `TS6133` — the orphaned bindings                                                                                                    | **SOUND**                          |
| `93-14_g3` | **constructed undone state**, verified LIVE by `curl` of the served module → `g3 EXIT=1` at the assertion of record; snapshot shows `alert: Failed to send a request to the Edge Function`                                                                                                                                                                                                     | `g3 EXIT=0`, `1 passed`                                                                                                                                                                  | **GC-1 (material):** the gate can return a FALSE result from a stale Vite dev server; measured twice on two independent Vite processes                                                                                                                            | **SOUND (with instrument caveat)** |
| `93-15_g1` | **`exit=1` at close-out drill** — `93-VERIFICATION.md` did not exist (`test -f` fails first, before any count)                                                                                                                                                                                                                                                                                 | **`exit=0`** against this document — see §7                                                                                                                                              | thresholds are `-ge 5` over structured `POPULATION` lines; C5 satisfied (`test -f` precedes every count in the same chain)                                                                                                                                        | **SOUND**                          |
| `93-15_g2` | **RED-1 constructed** (scratch worktree at HEAD, one named spec deleted): existence loop `EXIT=1` in **2 ms**, zero output — short-circuits **before Playwright runs at all**. **RED-2 (real output, not fabricated):** the gate's `18 passed` and zero-`failed` clauses applied to a genuine captured run that came up short (`1 failed / 1 did not run / 16 passed`) → both clauses `EXIT=1` | **`EXIT=0`** on the real tree: `18 passed (26.3s)`, zero failed lines, probe `my-delegations -> 500` / `data-retention -> 200` / `audit-logs-viewer -> 200` / `field-permissions -> 200` | **gate text AMENDED under `RULING-P93-05`** (existence-first + hardcoded 18). The `18` is deliberately not `--list`-derived: that form is **circular** and fails OPEN against a spec that exists but registers zero tests. See §4 for the flake this gate exposed | **SOUND**                          |

**Constructions requiring edits were done in scratch worktrees.** `git status --porcelain` on the
plans' own tree: **empty before, empty after** (recorded in the header).

**No gate whose done state was not constructed is recorded as `SOUND` without saying how it was
constructed.** Two rows carry `REPAIRED` / instrument caveats; none is folded into a bare pass.

---

## 4. The behavioural oracle set — specs and live probe

### 4a. `--list --no-deps` FIRST (C6 — never reasoned from "listing executes nothing")

```
pnpm exec playwright test <ten specs> --project=chromium-en --no-deps --list
→ Total: 18 tests in 10 files
```

Per-spec, from the pasted listing, in the gate's own argument order:
`93-analytics-error` **1** · `93-dossier-list-counts-error` **1** · `93-custom-dashboard-error` **1**
· `93-admin-surfaces-error` **4** · `93-tags-attachments-error` **2** · `93-dossier-notfound` **2** ·
`93-degraded-engagement` **3** · `93-report-notfound` **1** · `93-tasks-queue-error` **1** ·
`92-delegations-error` **2** = **18**. This matches the plan's stated `1/1/1/4/2/2/3/1/1/2` exactly
— the frozen `18` is confirmed by an independent count, not tuned toward.

### 4b. The run

```
pnpm exec playwright test <ten specs> --project=chromium-en --no-deps
→ 18 passed (26.5s)          [run 1]
→ 18 passed (26.3s)          [run 3, the gate's own green]
```

`--no-deps` is passed, so the `setup` project's six missing `E2E_*` keys (`E2ECRED-01`) are not in
play (D-20). Every spec authenticates inline from `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; no
credential is echoed anywhere in this document.

### 4c. **The red this seat found, and it is NOT the subject** — `UNABLE TO MEASURE` per C2

Run 2, issued **immediately** after run 1, returned `1 failed · 1 did not run · 16 passed`. The
failure was `93-degraded-engagement.spec.ts:159`. Its captured page snapshot reads, verbatim:

```
- paragraph: Request rate limit reached
```

The test died at `expect(page).not.toHaveURL(/\/login/)` — **the auth wall, 60 polls of
`http://localhost:5173/login`** — and never reached `notFoundNumeral`, its assertion of record.
`1 did not run` is `test.describe.configure({ mode: 'serial' })` skipping the third test after the
second failed. The very next full run (inside the gate drill, ~a minute later) exited **0**.

**Per C2 this is not a valid red: the gate died at an environment step, not at its subject.** It is
recorded here rather than suppressed, because it is a real and reproducible property of the oracle
set: **`E2ECRED-01` forces every one of the 18 tests to sign in individually, so one full run costs
18 auth round-trips and two back-to-back runs exceed the provider's rate limit.** That is an oracle
**capacity** limit, filed as OPEN FINDING **F-2** (§6). It is a direct, previously-unquantified cost
of the outstanding credential rotation — not flakiness in any Phase 93 subject.

### 4d. Live probe — all eleven functions

```
scripts/probe-edge-auth.sh my-delegations data-retention audit-logs-viewer field-permissions \
  engagement-dossiers ai-interaction-logs ai-summary-generate dossier-field-assist \
  positions-consistency-check translate-content dossier-stats
```

| function                      | status  | intended end-state                             | verdict               |
| ----------------------------- | ------- | ---------------------------------------------- | --------------------- |
| `my-delegations`              | **500** | 5xx **BY DESIGN** (`DELEG-01` visibility-only) | ✅ as intended-broken |
| `data-retention`              | **200** | 200                                            | ✅                    |
| `audit-logs-viewer`           | **200** | 200                                            | ✅                    |
| `field-permissions`           | **200** | 200                                            | ✅                    |
| `engagement-dossiers`         | 200     | non-401                                        | ✅                    |
| `ai-interaction-logs`         | 200     | non-401                                        | ✅                    |
| `ai-summary-generate`         | 405     | non-401 (method-gated)                         | ✅                    |
| `dossier-field-assist`        | 405     | non-401                                        | ✅                    |
| `positions-consistency-check` | 405     | non-401                                        | ✅                    |
| `translate-content`           | 405     | non-401                                        | ✅                    |
| `dossier-stats`               | 400     | non-401 (arg-gated)                            | ✅                    |

**Zero 401s.** The six `PIN-2390-01` importers all answer, so the redeploy took at the deployed
bundle, not merely in source.

**POPULATION DEFINITION (probe).** The eleven functions named by this phase's criteria, called on
deployed **staging** `zkrcjzdemdmwhearhfgg` with a real user JWT, at 2026-08-16.
**WHAT FALLS OUTSIDE IT.** The other ~128 deployed functions were not probed. **Production was
never touched and is entirely unmeasured.** A `405`/`400` proves the function is reachable and
authenticating, not that its happy path is correct.

---

## 5. The intended-broken register — re-verified LIVE at close

**Each row below is deliberate. Reporting one as a regression is as wrong as reporting it as
fixed.** No row was opportunistically repaired.

| surface / item                             | expected end state                                  | re-verified at close                                                                                                                                                                                                       | owner                                                                    |
| ------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/delegations`                             | visibly ERRORS — `my-delegations` 5xx **BY DESIGN** | **`my-delegations -> 500`** (§4d); `92-delegations-error.spec.ts` **2 passed**, incl. "the 42P01 is honest until Phase 102"                                                                                                | **Phase 102** — `DELEG-02` + `SEED-DELEG-01`                             |
| `/admin/data-retention` legal-holds region | still ERRORS after the 4-policy migration           | `93-admin-surfaces-error.spec.ts` "natural visit is honest **PER REGION** — policies load, legal-holds errors **by design**" → **passed**. Live catalog: **11 residual policies over 9 tables** still read `auth.users`    | **Phase 100** — `RLS-AUTHUSERS-01` (inner) **+ `DR-SUBPATH-01` (outer)** |
| `/admin/data-retention` sub-path routing   | 5 of 6 regions mis-route                            | `index.ts:120-123` reads the second-to-last path segment; `legal-holds` is parsed as a POLICY ID → `404 "Policy not found"`. **This fires BEFORE the RLS** — fixing `RLS-AUTHUSERS-01` alone will **not** close the region | **Phase 100** — `DR-SUBPATH-01`                                          |
| `/admin/field-permissions` filters         | silently never sent — found, **NOT fixed**          | HOLDS. `field-permissions.tsx:114-115,137-138` still pass `filterEntityType`/`filterScopeType` into a hook that ignores them; the file carries its own `:127-128` comment saying the two Selects are dead                  | filed (found-not-fixed)                                                  |
| audit drop / audit zero                    | filed forward, not fixed                            | `AUDIT-DROP-01` (backend `logSecurityEvent` inserts 2 nonexistent columns, swallowed) · `AUDIT-ZERO-01` (20 edge functions write a shape `audit_logs` never had; 0 rows)                                                   | **Phase 94**                                                             |
| the `data: x = []` mask sites              | a **FLOOR**, not a total                            | **26 at `phase-93-base` → 22 at HEAD.** Four criterion-named instances fixed; **22 remain and are NOT claimed as covered.** `= {}` / `= 0` defaults and `?? []` use-site masks were **never searched**                     | — (floor stands)                                                         |
| `/tasks/queue`                             | errors honestly until Phase 95                      | `93-tasks-queue-error.spec.ts` passed against the shared `QueryErrorState` behind a CDP forced error; the natural state is deliberately **not** asserted                                                                   | **Phase 95** (`DEAD-02`)                                                 |
| `/analytics`                               | errors until Phase 96                               | `93-analytics-error.spec.ts` passed (leak-free shared error state)                                                                                                                                                         | **Phase 96** (`DEAD-05`)                                                 |

---

## 6. Requirements filed during this phase — **re-derived, not copied**

**POPULATION DEFINITION.** `.planning/REQUIREMENTS.md` at `15e9f6804`, entries whose body attributes
them to Phase 93 planning or execution, cross-checked against the traceability table's owner column.

**Instrument note, and it is the phase's own class in miniature.** The obvious derivation —
`grep 'from Phase 93'` — returns **8**, missing `RETENTION-CAST-01` and `DR-SUBPATH-01`, whose
attribution lives in a **blockquote above the pair** rather than in either entry's own text. Reading
by section heading returns **10**. The narrower command was correct and returned a correct number
about the wrong set. The brief's stated count of ten was verified, not trusted.

| #   | requirement         | one-line                                                                                                                                                           | owner         |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| 1   | `RLS-AUTHUSERS-01`  | 11 residual RLS policies subquery `auth.users` and raise 42501 instead of deciding                                                                                 | **Phase 100** |
| 2   | `DR-SUBPATH-01`     | `data-retention` sub-path parse: 5 of 6 regions 404; the **outer** of two stacked causes                                                                           | **Phase 100** |
| 3   | `DELEG-02`          | decide which relation `my-delegations` reads, and repoint it                                                                                                       | **Phase 102** |
| 4   | `P52FIXTURE-01`     | seed the missing `engagement_dossiers` row for `…0052…0001`; the fix is **DATA, never weakening the degraded state**                                               | **Phase 102** |
| 5   | `GATESTD-01`        | the C9b escape step has **never executed** on this machine; it fails **open**                                                                                      | **Phase 102** |
| 6   | `AUDIT-DROP-01`     | backend security-audit inserts name 2 nonexistent columns, error swallowed                                                                                         | **Phase 94**  |
| 7   | `AUDIT-ZERO-01`     | 20 edge functions write a shape `audit_logs` never had; 0 rows                                                                                                     | **Phase 94**  |
| 8   | `E2ESTALE-01`       | 6 shipped e2e assertions red **before** Phase 93, measured in both directions                                                                                      | **Phase 101** |
| 9   | `ROOTALIAS-01`      | root `vitest.config.ts:37` aliases `@` to a nonexistent dir                                                                                                        | **Phase 101** |
| 10  | `RETENTION-CAST-01` | 6 false `{data:[...]}` casts remain in `useRetentionPolicies.ts`. **Never "fix" with `Array.isArray` fallback** — that renders empty over rows the server did send | **Phase 95**  |

### OPEN FINDINGS — recorded, not absorbed

**F-1 · `NOTFOUND-COMPONENT-01` was raised by `93-12` and never filed.** It appears in exactly one
place in the repo — `93-12-SUMMARY.md:299` — and in **no** section of `REQUIREMENTS.md`, and holds
no owner. Its sibling in the same list, `P52FIXTURE-01`, was filed. Re-derived at close:
`\bnotFound\s*\(` over `frontend/src` (`*.ts`/`*.tsx`, tests excluded) → **0 throw sites at
`phase-93-base`, 3 at HEAD** (D-06's correction was right: this phase _established_ the pattern).
Two carry `{ routeId: rootRouteId }` (`DossierShell.tsx:144`, `WorkspaceShell.tsx:136`) and are
behaviourally proven green. The third, `reports/$reportId.tsx:54`, is a **bare `notFound()`** — but
it is thrown from a **route loader**, not a component, so the `NOTFOUND-COMPONENT-01` mechanism does
not apply to it. **Status: the systemic finding is real and unowned; no live instance remains.**
Needs an owner or an explicit retirement — silence is the one disposition the phase's own rules
forbid.

**F-2 · The oracle set has an unquantified capacity limit.** Documented in §4c. 18 tests × 1 inline
sign-in each; two full runs inside the provider's rate-limit window red the suite at the auth wall
with `Request rate limit reached`. **Not** flakiness in any subject; a direct cost of `E2ECRED-01`
(no shared `storageState`). Suggested owner: **Phase 101**, beside `E2ECRED-01` / `E2ESTALE-01`.
Consequence for anyone re-running this phase's evidence: **space full runs, or the first re-run
will look like a Phase 93 regression.**

**F-3 · `RLS-AUTHUSERS-01`'s header count is one table over.** It states "15 policies across 13
tables". Live re-derivation: **11 residual policies over 9 distinct tables**; D-10's fixed set is
**4 policies over 3 tables**. Policies reconcile exactly (11 + 4 = 15 ✓). Tables do not: 9 + 3 =
**12**, not 13. The source enumeration in `PARK-P93.md:74-88` renders **13 markdown rows** over
**12 distinct tables** — `tag_categories` appears twice. The header counted **rows in a table**, not
**tables in a database**. Documentation-only; no code or security consequence; the fixed set and the
residual set are both exactly right. **Not edited** — `REQUIREMENTS.md` is outside this plan's
`files_modified`. Owner: **Phase 100**, with the requirement itself.

---

## 7. This document's own gate

`93-15_g1` requires: file exists, **≥5 lines containing `POPULATION`**, and the literals `DELEG-02`,
`RLS-AUTHUSERS-01`, `AUDIT-DROP-01`, `C9b`. All four literals appear above with their owners.
`POPULATION DEFINITION` headings: D1, D2, D3, D4, D5, the C9b sweep, the probe, and §6 — **eight**,
against a threshold of five. C4 max-reachable is therefore shown: 8 ≥ 5.

---

## 8. NOT-CHECKED — stated, never omitted

`NOT-CHECKED` beats silence. Everything below was **not** re-derived by this seat.

- **Production.** Untouched, unprobed, unmeasured. Every live claim in this document is **staging
  `zkrcjzdemdmwhearhfgg`** only.
- **RLS row-scoping, behaviourally.** Inherited unverified from Phase 92 and **still unverified**.
  The 4 rewritten policies are proven to stop raising 42501 (`data-retention -> 200`); that they
  admit the _right rows to the right users_ has never been tested by anyone.
- **Arabic as pixels.** Verified as JSON key-sets and as `en !== ar` string inequality. **No RTL
  render of the new error copy was captured.** Inherited from Phase 92, not discharged.
- **The 22 residual `data: x = []` masks**, and the `= {}` / `= 0` / `?? []` shapes that were never
  searched at all.
- **Bucket (b) and bucket (c)** `error.message` sites, and the `BotIntegrationsSettings` toast.
- **Multiline / template-string error renders** — invisible to every single-line grep in §1.
- **The 4 `DossierListPage` C9b consumers + POM** — `REAL but UNRUN`; verdict **unavailable, not
  green** (`E2ECRED-01`).
- **`tests/unit/components/ErrorBoundary.test.tsx`** — the only non-mocking vitest consumer in the
  whole register, and it **cannot execute** (`ROOTALIAS-01`).
- **~128 other deployed edge functions** — not probed.
- **The other 399 candidate consumer specs** from the raw C9b sweep — triaged out by inspection, not
  by running them.
- **The 34 prior-plan gate greens were cited from their SUMMARYs, not re-run here.** Their reds were
  observed at the moment the work landed, which today's tree can no longer reproduce.
- **Whether any gate guards the _right_ thing.** GATE-STANDARD says this plainly: the standard makes
  oracles honest, not correct. C10 is the only clause pointed at it and is weak by design.

---

## 9. THE PHASE'S WEAKEST POINT

A uniform pass with nothing named weak is a DOWNGRADE by the acceptance's own terms. There is at
least one. This is it.

> **`TRUST-03`'s report-builder not-found path is CODE-PRESENT and BEHAVIOURALLY UNPROVEN, and the
> oracle that covers it is a disjunction whose 404 arm has never once been observed.**

`93-report-notfound.spec.ts` asserts `404 OR query-error-state`, then unconditionally asserts the
builder heading is absent. The unconditional conjunct is what makes it an honest test rather than a
vacuous one — this is **not** the `title OR loading-skeleton` defect `93-06` found, and the spec
prints the arm it took on every run, which is exactly right.

But read what it printed. **Every observed run, including all three of this seat's:**

```
[93-13] observed arm -> B: query-error-state (read rejected — 42P17/WRITE-06, Phase 94)
```

**Arm A has never fired.** `custom_reports` and `report_shares` carry mutually recursive SELECT
policies, so the by-id read rejects for _every_ id. The `throw notFound()` at
`reports/$reportId.tsx:54` — the actual TRUST-03 mechanism for this route — is **never executed by
any test in this phase.** What the green proves is that an absent id does not render a fresh
builder; what it does **not** prove is that the route can produce a 404 at all. That line is
untested code sitting behind a permanently-taken sibling branch.

**Why this is the weakest point and not merely a caveat:** it is the phase's own defect class,
one level up. The suite is green. The criterion reads closed. And the specific behaviour the
criterion names — _this route distinguishes absent from failed_ — is unmeasured, because the
failure arm masks the absent arm and will keep masking it until `WRITE-06` lands in Phase 94. The
spec's header says so and instructs Phase 94 to delete arm (b); **that instruction is the only thing
standing between this and a permanent false green**, and it lives in a comment, not in a gate.
Nothing fails if Phase 94 ignores it.

**Runner-up, named because it is close:** four of the eleven C9b couplings are non-oracles (§2). The
sweep's raw output invites reading eleven defences where six exist. That was caught by the overseer's
`D-71` order — by adding a column, not by any gate — and no instrument in this repo would have
caught it otherwise.

VERIFICATION-END
