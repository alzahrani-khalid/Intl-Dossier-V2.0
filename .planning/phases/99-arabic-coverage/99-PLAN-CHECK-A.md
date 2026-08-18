VERDICT: BLOCKERS 6 / OBSERVATIONS 2

Checked against HEAD `9ffa2b80cc82fb3fe29e11354818d13f537e67b9`. The context, research,
compile contract, ten plans, and index were re-hashed immediately before this report; all hashes
still matched the versions read for this check.

### [BLOCKER] A-01 — The AR-04a closing oracle is simultaneously unsatisfiable and blind to wrapped masks

WHERE: `99-09-PLAN.md` — command oracle beginning `test "$(command grep -rhoE`; `99-01-PLAN.md` — strict-instrument output contract containing `twoArgTotal`
EVIDENCE: I compared the plan's unanchored, line-bound pattern with a word-boundary version and with the committed multi-line audit:

```
/opt/homebrew/bin/rg -o --glob '*.ts' --glob '*.tsx' "t\\(\\s*'[^']+'\\s*,\\s*'[^']*'" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src | wc -l
1680
/opt/homebrew/bin/rg -o --glob '*.ts' --glob '*.tsx' "\\bt\\(\\s*'[^']+'\\s*,\\s*'[^']*'" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src | wc -l
1657
/opt/homebrew/bin/node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/scripts/i18n-mask-audit.mjs
total_two_arg_sites: 1768
```

The 23 unanchored false-positive matches occupy 15 unique files, all 15 outside compiled
`P99-09.files[]`; examples are `storage.set(...)`, `params.set(...)`, `formatDayFirst(...)`,
`dossierFacetCount(...)`, and PostgREST `.not(...)`. Conversely, the line-bound anchored grep
sees 1657 real calls while the multi-line matcher sees 1768, leaving 111 wrapped masks invisible.
A search of the plans found `twoArgTotal` only in 99-01's requested JSON schema; none of the 20
compiled command oracles asserts it.

WHY: After every actual `t()` default is removed, the command still sees 23 non-`t` calls and cannot pass without corrupting unrelated code in files outside the task scope. Adding only `\b` reverses the failure: the command can pass while 111 wrapped defaults remain. The task therefore either fails permanently or reports AR-04a closed on an incomplete population.
REMEDY: Replace the grep as the closing predicate with the strict parser's `twoArgTotal === 0` (and a fixture containing both one-line and wrapped positive controls). If the grep remains as a diagnostic, add a word boundary and never use it as the population oracle.

### [BLOCKER] A-02 — D-24's verify-before-drop step is not represented in the engine DAG

WHERE: `P99-COMPILE-CONTRACT.md` — `## 1. One GSD plan = one tickmarkr task`; `99-09-PLAN.md` — `<name>Task 1: the gatekeeper` and `<name>Task 2: drop every English-default mask`
EVIDENCE: Re-running the in-process compiler produced one task, not two gated nodes:

```
P99-09 deps=[P99-03,P99-04,P99-05,P99-06,P99-07,P99-08]
files=162 acceptance=9 status=pending
```

The compile contract states that inner `<task>` blocks remain only in `context[0]`, the worker
prompt. The engine's acceptance/evidence gates run after the one P99-09 worker has completed its
whole diff. There is no task or gate boundary between the global strict-zero measurement and the
destructive deletion.

WHY: D-24 requires `author -> verify both locales -> only then drop` to be a DAG property, not a worker-intention or SUMMARY claim. As compiled, the worker can delete defaults before (or despite) the first repo-wide strict proof and still reach the only gate battery. The predecessor lanes do not supply one repo-wide strict-zero command gate: several authoring-only consumer slices are prose obligations, while P99-09 is the first global run.
REMEDY: Split 99-09 into a verification-only engine plan whose command oracle proves repo-wide strict zero in both locales, followed by a deletion plan that depends on that passed task. Keep the post-drop zero battery in the deletion plan.

### [BLOCKER] A-03 — P99-08 makes unruled Arabic product decisions with no human gate

WHERE: `99-08-PLAN.md` — `autonomous: true`, `Unruled pairs`, and `apply the title-wins default where no rule decides`; `99-CONTEXT.md` — `D-38` and `### Claude's Discretion`
EVIDENCE: The binding context limits planner discretion to lane structure, oracle placement, settle-helper placement, and lane order. P99-08 instead identifies three product-copy choices as unruled — persons (`الأشخاص` vs `جهات الاتصال الرئيسية`), positions (`المواقف` vs `مكتبة المواقف`), and dashboard (masked label vs `لوحة الملفات`) — then orders the executor to mutate them using a planner-invented title-wins policy. The compiled task confirms `P99-08 humanGate=false`. D-38 says any plan needing human product sign-off must set `autonomous: false` and that under-gating is not recoverable.
WHY: The planner is choosing Arabic information architecture, not merely implementing D-16..D-18. The later P99-10 checkpoint occurs after all 129 Arabic bundles have been mutated and can only write `99-VERIFICATION.md`/`99-10-SUMMARY.md`; if the operator rejects a tie-break, P99-10 has no scope to repair it.
REMEDY: Obtain explicit overseer rulings for every unruled pair before execution, or make P99-08 human-gated so those choices are approved before its mutations. Retain P99-10's rendered sign-off as a separate final gate.

### [BLOCKER] A-04 — Criterion 1 has no oracle for most of the ruled glossary

WHERE: `99-08-PLAN.md` — command oracle printing `GLOSSARY-SPOT-OK`; `99-10-PLAN.md` — compiled static-battery command
EVIDENCE: The P99-08 glossary oracle checks only: (a) `دوسييه` occurs at most twice in at most one file, (b) intake contains `قائمة الاستقبال`, and (c) waiting-queue copy still contains `قائمة الانتظار`. It never tests the other binding D-17/D-18 rows. Independent current counts, with a live Arabic-term positive control, are:

```
command grep -rho 'ارتباط' /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/i18n/ar/*.json | wc -l  -> 171
command grep -rho 'موجز' /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/i18n/ar/*.json | wc -l    -> 128
command grep -rho 'تطوير المنصب' /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/i18n/ar/*.json | wc -l -> 1
command grep -rho 'مشارك' /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/i18n/ar/*.json | wc -l   -> 239
```

The nav-title checker covers 28 page-title pairs, not the 129-bundle glossary population. The
compiled P99-10 command re-runs the nav checker, strict key audit, maskfinder, resolution harness,
and date guard, but no glossary census/classification instrument.

WHY: An executor can repair the queue and leave hundreds of `ارتباط`/`موجز` values and the wrong-sense `تطوير المنصب`; both compiled glossary-related commands can still pass. Criterion 1's "exactly one Arabic term across every namespace" is therefore not independently gradeable.
REMEDY: Ship a drilled glossary instrument/manifest that enumerates every ruled row, its allowed senses and path exceptions (especially `ملف`, `إحاطة`, and `منصب`), and requires every occurrence to be classified. Add its controlled command oracle to P99-08 and the fresh P99-10 battery; do not replace sense-aware classification with a blanket substring rewrite.

### [BLOCKER] A-05 — The closing task can pass with rendered proof absent

WHERE: `99-10-PLAN.md` — acceptance text `or a leg honestly recorded UNDRIVEN-BY-DATA/NOT CONSTRUCTED`; compiled command oracle beginning `test -f "$R/.planning/.../99-VERIFICATION.md"`
EVIDENCE: I extracted typed oracles from the compiled graph rather than reading the index:

```
COMMAND_ORACLES=20
PLAYWRIGHT_COMMAND_ORACLES=0
TEST_ORACLES=0
```

P99-10's sole command oracle is static; it does not invoke either `99-ar02-dates.spec.ts` or
`99-ar03-leak.spec.ts`. The Playwright commands live only inside `<verify>` blocks retained in the
worker prompt, which the compiler does not turn into acceptance oracles. P99-10 then explicitly
allows a missing rendered leg to be recorded as `NOT CONSTRUCTED`, and its judge oracle treats
honest recording of that absence as acceptable evidence.

WHY: ROADMAP criteria 2 and 3, D-07, and UI99-C1..C11 require rendered proof. The engine can accept a verification document that says the rendered proof was not constructed; a prose record of a missing run is a bound, not success. Human review is also phrased `data permitting`, so it does not close the machine-proof gap.
REMEDY: Add exact typed command/test oracles for each single Playwright spec path, with file-existence and hardcoded expected-test-count checks. Remove `NOT CONSTRUCTED` as a passing alternative: an unconstructible run leaves the task red/blocked. Resolve the position data precondition with deterministic fixtures, or leave that contract open rather than closing the phase.

### [BLOCKER] A-06 — The authored Playwright contracts omit UI99-C3 and under-drive UI99-C7

WHERE: `99-RESEARCH.md` — `UI99-C3` and `UI99-C7`; `99-01-PLAN.md` — `99-ar02-dates.spec.ts ... for routes /calendar, /dossiers and /events` and the C7 position query
EVIDENCE: The binding UI contract requires UI99-C3 to drive `/activity?lng=ar` and match the Arabic relative-time family `منذ \d+`. P99-01 directs the date spec only over `/calendar`, `/dossiers`, and `/events`, asserting absolute date/month shapes; it gives no `/activity` or relative-time assertion. UI99-C7 requires a fixture in **each** of `under_review`, `approved`, and `published`. P99-01 instead says to find a position in any of those states, drive one `/positions/<id>`, and skip the leg entirely if none exists. P99-10 only re-runs these same specs; no later plan expands either population.
WHY: Even if the worker-run Playwright commands execute, English relative time can survive and two of three status-specific banner branches can regress while both planned specs stay green. This violates D-29's binding UI contract independently of the compiled-oracle problem in A-05.
REMEDY: Add the settled `/activity?lng=ar` relative-time assertion with Latin digits, and drive deterministic fixtures for all three banner states (or three separately counted tests). Do not convert a missing fixture into a skip that satisfies phase closure.

### [OBSERVATION] A-O1 — Compile shape, D-14 ancestry, and concurrent scope isolation re-check clean

WHERE: compiled phase directory — all ten tasks
EVIDENCE: The §10 probe independently returned 10 pending tasks, expected deps/files/acceptance counts, and only P99-10 with `humanGate=true`. A transitive-DAG probe returned `DESCENDANT_OF_P99-02=true` for P99-03 through P99-09. Enumerating every pair with neither task an ancestor of the other returned `CONCURRENT_PAIRS=9 COLLIDING_PAIRS=0`.
WHY: The common-flatten sequencing before later conversion work and the declared concurrent file boundaries are represented correctly; the blockers above are not file-collision or compile failures.
REMEDY: None.

### [OBSERVATION] A-O2 — The current red register and two major population scopes re-check as claimed

WHERE: compiled command oracles; `99-08-PLAN.md` ar bundle list; `99-09-PLAN.md` mask-drop file list
EVIDENCE: I executed all 20 compiled command oracles under `/bin/bash -lc`; all 20 exited nonzero on the unfixed tree. Independently enumerating the locale tree gave `DECLARED_AR=129 ACTUAL_AR=129` with no missing/extra P99-08 bundle. Re-running the committed multi-line mask matcher gave `SITES=1768 SITE_FILES=161`; compiled P99-09 declares exactly those 161 source files, with `MISSING_FROM_SCOPE=0` and `EXTRA_NO_SITE=0`.
WHY: The authoring/glossary lane visibly carries the full Arabic bundle inventory and the mask-drop scope is complete. This does not cure A-01: the closing command uses a different, faulty population.
REMEDY: None.

## WHAT I COULD NOT VERIFY

- The two P99 Playwright specs, shared settle helper, strict audit, and nav-title checker do not
  exist on the unfixed tree. I could re-run their absence-red compiled commands and inspect their
  required future clauses, but I could not execute the future implementations or confirm their
  claimed test counts without changing the repository.
- I did not query the live application or staging database, so the current availability of
  positions in the three UI99-C7 states remains unverified. This is exactly why a skipped leg
  cannot be treated as criterion success.
- I did not judge Arabic naturalness beyond the binding D-16..D-18 glossary rulings; that is an
  explicit operator-owned bound. I checked whether the plans can prove and gate those rulings,
  not whether a different Arabic term would be preferable.
- I could not execute any post-repair oracle state without mutating the tree. Satisfiability
  findings above use the compiled commands, their exact populations, and counterexamples already
  present at the pinned revision.
  PLAN-CHECK-END
