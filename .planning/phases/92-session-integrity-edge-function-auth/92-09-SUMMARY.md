---
phase: 92-session-integrity-edge-function-auth
plan: 09
subsystem: infra
tags: [supabase, edge-functions, deploy, staging, auth, jwt, probe]

requires:
  - phase: 92-04
    provides: migrated core + `_shared/auth.ts` bump + the deploy ledger artifact
  - phase: 92-05
    provides: AUTH-02 slice A (33 index.ts files migrated)
  - phase: 92-06
    provides: AUTH-02 slice B (33 index.ts files migrated)
  - phase: 92-07
    provides: AUTH-02 slice C (33 index.ts files migrated)
  - phase: 92-08
    provides: AUTH-02 slice D (30 index.ts files migrated)
provides:
  - 139/139 named-function deploys to staging with a per-function ledger record
  - Two-sided AUTH-02 verification — D-08 derivation at 0 repo-wide AND 11 deployed-artifact probes at 0x401
  - The four discriminating 401 flips, quoted against the pre-migration baseline (D-39)
  - Carry-forward register for Phase 93 with derivations run, not assumed
affects: [93-failure-visibility, verify-phase]

tech-stack:
  added: []
  patterns:
    - 'Two-sided verification: source grep alone is a documented false-pass mode (D-21)'
    - 'Discriminating-representative reporting: a probe already non-401 at baseline is not evidence'

key-files:
  created:
    - .planning/phases/92-session-integrity-edge-function-auth/92-PROBE-FINAL.md
  modified:
    - .planning/phases/92-session-integrity-edge-function-auth/92-DEPLOY-LEDGER.md

key-decisions:
  - 'The audited-401 cross-check was widened past the adminops F2 mapping the plan cites; sweeping all audit lanes found a fifth function (data-export, dossiers F3) which was probed'
  - 'The 229-vs-139 deploy-attempt discrepancy is reported as UNEXPLAINED BY THE RECORD, because it is'

patterns-established:
  - 'Non-401 is a gate threshold, not a health claim: 200-with-empty-arrays satisfies it (DELEG-01)'

requirements-completed: [AUTH-02]

duration: 24 min (Task 2 + close-out; Task 1 by a prior executor)
completed: 2026-08-15
---

# Phase 92 Plan 09: Staging Deploy + Two-Sided Verification Summary

**AUTH-02's live half closed: 139/139 named-function deploys on staging, the D-08 derivation re-run to 0 repo-wide, and 11 deployed-artifact probes returning zero 401s — including the four baseline-401 representatives that actually discriminate a migration from no migration.**

## Performance

- **Duration:** 24 min for this executor (Task 2, gates, artifacts, close-out)
- **Started:** 2026-08-15T11:04Z (resumed; Task 1 completed earlier by a prior executor)
- **Completed:** 2026-08-15T11:28Z
- **Tasks:** 2 (Task 1 pre-completed and verified on disk; Task 2 executed here)
- **Files modified:** 2 planning artifacts. **Zero files under `supabase/`.**

## Resumption note — what was already done

This plan was resumed mid-flight. **Task 1 was executed to completion by a prior executor whose pane
was lost before Task 2 and before the SUMMARY.** The deploys were NOT re-run. Task 1's state was
verified on disk, not assumed:

- Commit `feb3b42c` — `docs(92-09): deploy the full derived population to staging — 139/139 OK`
- `92-DEPLOY-LEDGER.md` is complete and already normalised to the plan-mandated
  `name | timestamp | OK/FAIL` shape (verdict last), per `RULING-P92-47` / `D-42`
- Gate `92-09_g1` re-run by this executor — exits 0 (below)
- 139 unique OK names == the derived expected set (133 population + 6 `_shared/auth.ts` importers)
- All 139 backed by real CLI stdout in `.tickmarkr/overseer/92-09-deploy-raw.log`

---

## THE 229-vs-139 QUESTION: **the record does not explain it**

The raw logs record **139 unique functions but 229 total deploy attempts**. Asked to state the
reason from the record, the honest answer is that **there is none** — no ruling, no decision entry,
no ledger line, and no log preamble gives a reason. Rather than reconstruct a plausible one, here is
what the record _does_ establish, each item measured:

| Fact                                                    | Evidence                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Two runs: 139 + 90 = 229                                | `92-09-deploy-raw.log` 139 `=====` blocks; `92-09-redeploy-raw.log` 90 |
| All 229 succeeded                                       | `attempt-exit=0` on 139/139 and 90/90                                  |
| Run 1: 10:58:51Z → 11:02:16Z, 4-concurrent              | first/last block timestamps; ledger prose                              |
| Run 2: 11:09:11Z → 11:17:40Z, **serial** (~5.6 s apart) | first/last block timestamps                                            |
| The 90 are a **strict subset** of the 139               | `comm -13` → **0** names in run 2 absent from run 1                    |
| Bundles were **byte-identical** between runs            | 0 script-size differences across all 80 comparable entries             |
| Run 2 started **after** the ledger was committed        | ledger commit `feb3b42c` 11:04:11Z < 11:09:11Z                         |

I tested and **refuted** every structural explanation for which of the 139 got redeployed:

- **Not a truncated run.** The 49 skipped names are scattered across the whole alphabet
  (`access-review-detail` in, `ai-summary-generate` out, … `word-assistant` in, `working-groups`
  out). A killed sweep leaves a contiguous tail, not uniform gaps.
- **Not a slice.** All four slices were redeployed proportionally (~2/3 each: 21/33, 22/33, 21/33,
  16/30) — no slice was singled out.
- **Not the Class-1/Class-2 split.** Tempting, because the 49 skipped exactly equals the slice
  summaries' Class-1 total (15+12+10+12). But deriving Class-1 from the real diff gives **53**, not
  49, and the overlap between "skipped" and Class-1 is **19 of 49** — indistinguishable from chance
  (expected 18.7). The totals matching is a coincidence, and the per-slice numbers never matched.
- **Not the `<files>`-block derivation** that `0b9c8755` landed at 11:14:22Z (during run 2): that
  yields **134** names, not 90. C9a concerns ledger _format_, not the deploy population.

**Consequence:** the second run changed nothing observable — identical bundles, no new names, all
exit 0 — so the deployed state after run 2 equals the deployed state after run 1, and the ledger's
139 OK rows remain accurate. The discrepancy is a **record-keeping gap, not a deployment defect**.

**RECORD-INTEGRITY FLAG for the orchestrator** (not a gate concern — the gate counts rows, and the
rows are right): the ledger asserts _"139 / 139 OK on the first pass. The retry pass found nothing
to retry; no deploy failed."_ A second 90-function pass demonstrably ran **five minutes after that
sentence was committed**, and the ledger does not record it. The sentence is not false about run 1,
but the artifact is silent about a run that happened. I did not edit the ledger to add it: I did not
execute those deploys and cannot attest to their intent, and inventing a ledger line for a command I
did not run is exactly what the ledger exists to prevent.

---

## Task Commits

1. **Task 1: Batch deploy the sweep with a resumable ledger (D-09)** — `feb3b42c` (docs)
   _— executed by the prior executor; verified on disk here, not re-run._
2. **Task 2: Two-sided phase verification + carry-forward notes (D-08, D-21, D-17)** — `9ce5d4a4` (docs)
3. **Plan metadata (this SUMMARY)** — see final commit below

---

## Gates — run verbatim by this executor

### Gate `92-09_g1` (Task 1) — **PASS**

Command (verbatim from the plan):

```
L=.planning/phases/92-session-integrity-edge-function-auth/92-DEPLOY-LEDGER.md; D=$(grep -hE '^ *- supabase/functions/[a-z0-9-]+/index\.ts' .planning/phases/92-session-integrity-edge-function-auth/92-0[45678]-PLAN.md | sort -u | wc -l); N() { grep -E "\| *$1 *\|?[[:space:]]*$" "$L" | sed 's/^[[:space:]]*|//' | cut -d'|' -f1 | tr -d ' ' | sort -u; }; U=$(N OK | wc -l); F=$(comm -23 <(N FAIL) <(N OK) | wc -l); test "$D" -gt 0 && test "$U" -ge $((D+6)) && test "$F" -eq 0
```

Output (instrumented echo of the gate's own variables, added alongside — the test expression itself
is unmodified):

```
D=     133 U=     139 F=       0 required_U=139
```

**Exit code: `0`. Verdict: PASS.** 133 derived population + 6 helper importers = 139 required; 139
unique OK names present; 0 unresolved FAIL names.

### Gate `92-09_g2` (Task 2) — **PASS**

Command (verbatim from the plan):

```
[ -d supabase/functions ] && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l)" -eq 0 && OUT=$(bash scripts/probe-edge-auth.sh audit-logs-viewer data-retention field-permissions my-delegations dossiers-update tasks-get); [ "$(echo "$OUT" | grep -c ' -> ')" -eq 6 ] && ! echo "$OUT" | grep -q ' -> 401'
```

Output: the gate emits no stdout (`OUT` is captured, not printed).

```
GATE 92-09_g2 EXIT=0
```

**Exit code: `0`. Verdict: PASS.**

### Plan-level `<verification>` — all three, run

```
$ grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l
       0
```

- Ledger unique-OK count 139 ≥ derived 139, 0 FAIL without a later OK — **PASS** (gate g1)
- Derivation → 0 repo-wide — **PASS**
- `92-PROBE-FINAL.md` holds actual codes for ≥10 representatives, all non-401 — **PASS** (11 recorded)

---

## The probe: actual codes (D-39)

Run 2026-08-15T11:26:37Z → 11:26:46Z against deployed staging. **Run twice, ~7 min apart, identical
codes both times.**

```
audit-logs-viewer -> 500        access-review-detail -> 404
data-retention -> 500           dossier-activity-timeline -> 400
field-permissions -> 200        intake-audit-logs -> 200
my-delegations -> 200           push-notification-send -> 500
dossiers-update -> 405          data-export -> 200
tasks-get -> 200
```

**11 representatives, 0 × 401.**

### The four that actually discriminate (D-39 — required reporting)

The gate accepts any 6 non-401 lines; only four representatives can tell a successful migration from
no migration at all, because only four were **401 at baseline**:

| Representative      | Baseline | Post-deploy | Flip          |
| ------------------- | -------- | ----------- | ------------- |
| `audit-logs-viewer` | **401**  | **500**     | **401 → 500** |
| `data-retention`    | **401**  | **500**     | **401 → 500** |
| `field-permissions` | **401**  | **200**     | **401 → 200** |
| `my-delegations`    | **401**  | **200**     | **401 → 200** |

The two `500`s are the honest result, not a failure to hide: both are **past the auth gate**, hitting
pre-existing data-layer defects the 401 previously masked — `AUDIT-42703` and `DR-42501`, already
filed at `.planning/REQUIREMENTS.md:50-51` and routed to Phase 93. `my-delegations`' `200` carries
**empty arrays** because it queries `public.delegations`, which does not exist — `DELEG-01`, likewise
already filed. Cited, not re-filed.

A **fifth** flip exists but is labelled separately in `92-PROBE-FINAL.md` because its "before" reading
comes from the live audit rather than the probe baseline: `data-export`, audit `dossiers.md` F3
**401 → 200**.

### D-16 branch verdict

`tasks-get` (`@2` + bare `getUser()`) returns **200**, unchanged. Branch 2 is **excluded by
measurement** again. **No `@2` bare-`getUser()` function probed 401, so nothing is filed to Phase 93
under branch 2 and this phase is not widened.**

### Audited-route cross-check (criterion 2's second clause)

I swept **all** audit lanes for 401 findings rather than only the adminops F2 mapping the plan cites.
That surfaced a fifth function the plan does not name — `data-export` (dossiers F3). All five are in
the ledger with exactly one `OK` row, and all five probe non-401:

| Function            | Audit finding    | Ledger OK rows | Probed |
| ------------------- | ---------------- | -------------- | ------ |
| `audit-logs-viewer` | adminops F2      | 1              | 500    |
| `data-retention`    | adminops F2      | 1              | 500    |
| `field-permissions` | adminops F1 + F2 | 1              | 200    |
| `my-delegations`    | engagements F4   | 1              | 200    |
| `data-export`       | dossiers F3      | 1              | 200    |

---

## Carry-forwards for Phase 93 — derivations RUN, never carried counts

**1. Header-less bare-`getUser()` functions: derivation run, result EMPTY.**

```
$ for f in $(grep -rlE 'auth\.getUser\(\s*\)' supabase/functions --include='*.ts'); do grep -qi authorization "$f" || echo "$f"; done
(no output)
```

**None found — the expected outcome**, recorded explicitly as a run result so it is distinguishable
from a mis-run command. The old "2 of 163" figure was a single-line-regex measurement error struck in
`90471cee`; per `92-CONTEXT.md:488` any criterion naming "the two" names an **empty set**.

**2. `_shared/ai-interaction-logger.ts:12` still pins esm.sh 2.39.0** — outside D-06 and outside the
D-08 `index.ts` population. Recorded, not swept.

**3. `dossier-stats/dashboard-aggregations.ts:1` also still pins esm.sh 2.39.0 — and unlike the
logger it IS imported by a migrated function** (`dossier-stats/index.ts:4`), so the deployed
`dossier-stats` artifact re-bundles a 2.3x specifier after the sweep. It is the reason the slice
derivations carry `--include='index.ts'`. Recorded, not swept — outside the operator-decided D-07
population.

**4. D-17 corrected wording — confirmed read-only.** `ROADMAP.md:285` and `REQUIREMENTS.md` AUTH-02
(`:26`, correction note `:27`) both carry the corrected form. **No governing doc was edited.**

---

## The criterion no gate checks — header-injected clients

RLS scoping survives only if each migrated function keeps its caller-token client. Measured:

```
$ git grep -c "global:" phase-92-base -- 'supabase/functions/*/index.ts' | wc -l   # 247
$ git grep -c "global:" HEAD            -- 'supabase/functions/*/index.ts' | wc -l   # 247
```

**247 → 247, no decrease.** This plan modified **0** files under `supabase/`
(`git diff --name-only feb3b42c^..HEAD -- supabase/` → `0`), so the count is unchanged by
construction as well as by measurement.

## GATE CONCERN

**None raised.** No `<automated>` gate text was edited, in this plan or any other. Two known
gate-weakness facts were already adjudicated before execution and are handled by reporting rather
than by editing: `92-09_g2` accepting any 6 non-401 lines (D-39 — discharged by quoting the four
discriminating flips above), and the header-injected-client criterion being uncounted (discharged by
the measurement above). The ledger-narrative gap is filed under the record-integrity flag, not here,
because the gate's row count is correct.

## Deviations from Plan

**1. [Rule 2 — Missing Critical] Audited-401 cross-check widened beyond the cited mapping**

- **Found during:** Task 2(d)
- **Issue:** The plan scopes check (d) to `adminops.md` F2, which names three functions. Criterion 2
  says "no audited route renders empty because of a 401" — unqualified by lane. Sweeping only F2
  would leave any other lane's 401 unchecked.
- **Fix:** Swept all audit lanes for 401 findings. Found `data-export` (dossiers F3), confirmed its
  ledger OK row, and probed it — **200**.
- **Verification:** `grep -rn "401"` across `.planning/audits/live-audit-2026-08-15/*.md`; probe run.
- **Committed in:** `9ce5d4a4`

**2. [Rule 3 — Blocking] `git commit -- <path> -m "..."` argument order**

- **Found during:** Task 2 commit
- **Issue:** Everything after `--` is a pathspec, so `-m` and the message were parsed as filenames;
  the commit aborted (exit 1, nothing staged, HEAD unchanged).
- **Fix:** Reordered to `git commit -m "..." -- <path>` — still an explicit-pathspec commit.
- **Verification:** `git show --stat HEAD` → exactly the one intended file.
- **Committed in:** `9ce5d4a4`

---

**Total deviations:** 2 auto-fixed (1 missing-critical, 1 blocking)
**Impact on plan:** No scope creep. Deviation 1 strengthened check (d) with one extra probe;
deviation 2 was mechanical.

## Issues Encountered

- **The 229-vs-139 discrepancy** — investigated against the full record and every structural
  hypothesis tested; **unexplained by the record**. Reported as such above rather than reconstructed.
  Deployment impact: none (byte-identical bundles, strict subset, all exit 0).

## Commit hygiene

Both commits used explicit pathspecs; no `git add -A`, no `-a`, no bare commit. `git show --stat`
confirmed each landed exactly its intended file and nothing from a sibling lane. `HUSKY=0` was used
only for `.planning/`-only commits, as permitted. No `git checkout` / `restore` / `clean` / `stash`
was run at any point. Prettier reformatted the tables in `92-PROBE-FINAL.md` at commit time
(content unchanged).

## Next Phase Readiness

- **Criterion 2 is closeable by verify-phase re-derivation**: source clean (0 repo-wide), artifacts
  live (139/139 deployed), evidence on file (`92-PROBE-FINAL.md`), audited surfaces cross-checked.
- **Phase 93 inherits, already filed:** `AUDIT-42703`, `DR-42501`, `DELEG-01`. Nothing new filed by
  this plan under D-16 branch 2 — no `@2` bare-`getUser()` function probed 401.
- **Phase 93 must not inherit "these surfaces work."** Auth is open; the surfaces behind three of
  them are not.
- Carry-forwards 2 and 3 (the two esm.sh 2.39.0 pins) are recorded, unswept, and outside this
  phase's operator-granted population.

## WHAT THIS DOES NOT ESTABLISH

- **I did not run the deploys.** Task 1 was executed by a prior executor. I verified its artifacts,
  its commit, and its gate on disk. I did not re-execute 139 deploys and cannot attest to them
  first-hand — only that the ledger, the raw logs, and the gate agree.
- **11 probes is not a census.** 139 functions are deployed; 11 were probed. No per-function claim is
  made for the other 128.
- **Only 4 of the 11 probe lines are evidence of the migration.** `dossiers-update` (405 at baseline)
  and `tasks-get` (200 at baseline, and **outside the swept population** — it never carried a `2.3x`
  pin) were **already non-401 before any migration**. Their passing proves **nothing** about the
  migration. The four slice representatives were never probed at baseline, so they show "non-401
  now", not a flip.
- **Non-401 is not health.** It proves only that the request passed the `getUser` gate. `my-delegations`
  returns a confident `200` with empty arrays — the exact success-shaped failure this milestone
  exists to kill — and that line _satisfies_ the gate. Two more representatives return 500s that are
  filed defects; `push-notification-send`'s 500 is **undiagnosed** and no health claim is made for it.
- **RLS scoping was not behaviourally tested.** The header-injected-client count is a static
  measurement (247 → 247). No probe verified that any function returns correctly _scoped_ rows.
- **Staging only.** Nothing here speaks to the production droplet.
- **The 229-vs-139 second deploy round is unexplained**, and my "changed nothing" conclusion rests on
  script-size equality and exit codes — not on a byte-level artifact diff, which the CLI output does
  not provide.
- **No E2E ran.** `E2ECRED-01` remains an external blocker; no Playwright suite was invoked here.

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
