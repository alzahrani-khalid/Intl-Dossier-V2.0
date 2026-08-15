---
phase: 93-failure-visibility
plan: 03
subsystem: infra
tags: [supabase, edge-functions, deno, esm.sh, dependency-pin, supabase-js]

# Dependency graph
requires:
  - phase: 92-auth-truth
    provides: 'AUTH-02 @2 migration of the 133 index.ts files, and scripts/probe-edge-auth.sh'
provides:
  - 'Zero 2.3x supabase-js pins anywhere under supabase/ (widened *.ts population, not index.ts)'
  - 'Six deployed bundles rebuilt off the deprecated specifier (version + updated_at both advanced)'
  - 'A worked example of D-18: a closing derivation that states its population and what falls outside it'
affects: [93-15, phase-close-derivations, future-dependency-pin-sweeps]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Version-tag-only edits keep the esm.sh import SOURCE style (Phase 92 AUTH-02 convention); jsr: is a separate change'
    - 'Deploy freshness is evidenced by strictly-greater updated_at AND version vs a pre-work baseline, not by same-day-ness'

key-files:
  created:
    - .planning/phases/93-failure-visibility/93-03-SUMMARY.md
  modified:
    - supabase/functions/_shared/ai-interaction-logger.ts
    - supabase/functions/dossier-stats/dashboard-aggregations.ts

key-decisions:
  - 'Version tag only (@2.39.0 -> @2); import style, identifiers and adjacent code untouched'
  - 'Deploy set DERIVED by grep before deploying, not quoted from the plan — derived set == the six named'
  - 'Deploy freshness recorded as strictly-newer vs a pre-work baseline, because "same-day" is vacuous today (all six were already same-day from the Phase 92 sweep)'

patterns-established:
  - 'Pre-work baseline snapshot of `supabase functions list --output json` before any deploy, so freshness is a delta and not an absolute'
  - 'A regression-guard gate is labelled as such and its RED direction is constructed separately (count arm + synthetic-row positive control on the assertion)'

requirements-completed: [PIN-2390-01]

# Metrics
duration: 5 min
completed: 2026-08-15
---

# Phase 93 Plan 03: PIN-2390-01 — the two helpers Phase 92's narrow grep could not see

**Both non-`index.ts` helpers moved off `esm.sh/@supabase/supabase-js@2.39.0` to `@2`, the six
functions whose deployed bundles inline them were redeployed (all six strictly newer in both
`updated_at` and `version`), and the closing derivation was widened from `--include='index.ts'` to
`--include='*.ts'` — the narrow population being the entire reason this defect survived Phase 92's
green.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-15T17:28:42Z
- **Completed:** 2026-08-15T17:33:30Z
- **Tasks:** 2
- **Files modified:** 2 (plus this SUMMARY)

## THE GATE TABLE (`ACCEPTANCE-P93-EXEC.md` condition 1)

Both plan gates, both directions, commands and actual output.

| gate                                                                                                                                                                | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                        | GREEN after (command + output)                                                                                       | notes                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`93-03_g1`** — `test -d supabase/functions && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='*.ts' \| wc -l)" -eq 0`           | Run on the undone tree at `623031b3b`: **`GATE g1 EXIT=1`**, with exactly 2 matching files —<br>`supabase/functions/dossier-stats/dashboard-aggregations.ts:1:import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";`<br>`supabase/functions/_shared/ai-interaction-logger.ts:12:import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';` | Same command after Task 1: **`GATE g1 EXIT=0`**, `count=0`. Re-run once more at plan close: **`GATE g1 EXIT=0`**.    | RED is for the gate's SUBJECT (C2): the failure is the two pinned import lines, not a missing root or tool. Root existence is asserted in the same `&&` chain (C5). Threshold is `-eq 0`, and max-reachable was proven by the orchestrator's drill and reproduced here — the count moved 2 → 0 under the intended edit (C4). |
| **`93-03_g2`** — `OUT=$(scripts/probe-edge-auth.sh <6 names>) && test "$(echo "$OUT" \| grep -c ' -> ')" -eq 6 && test "$(echo "$OUT" \| grep -c ' -> 401')" -eq 0` | **GREEN before the work — this is a REGRESSION GUARD, not a pass.** Pre-work run: `ai-interaction-logs -> 200`, `ai-summary-generate -> 405`, `dossier-field-assist -> 405`, `positions-consistency-check -> 405`, `translate-content -> 405`, `dossier-stats -> 400`, **`EXIT=0`**. Its RED direction was therefore CONSTRUCTED, twice (below).                                                     | Post-redeploy run: identical six lines (`200/405/405/405/405/400`), **`GATE g2 EXIT=0`** — nothing regressed to 401. | The plan states this in advance and so does this row: **g2's green does not evidence this plan's work.** The discriminating evidence is the deploy-freshness delta table plus g1's 2 → 0.                                                                                                                                    |

### `93-03_g2` — the two constructed RED directions (C1 clause 1, since the gate is green on the undone tree)

| arm                 | construction                                                                                                                                                           | actual output                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| count arm (`-eq 6`) | probe 5 of the 6 names                                                                                                                                                 | 5 lines printed (`ai-interaction-logs -> 200` … `translate-content -> 405`), **`GATE g2 (5 names) EXIT=1`** |
| 401 arm (`-eq 0`)   | positive-control the assertion against a synthetic row in the mandated `fn -> status` shape (the C9a technique) — six lines, one of them `dossier-field-assist -> 401` | **`GATE g2 (synthetic 401 row) EXIT=1`**                                                                    |

Both arms fire. Neither arm is vacuous.

**NOT CONSTRUCTED, stated explicitly (C1):** the _live_ 401 red — an actually-deployed function returning
401 — was not constructed. Doing so would require deploying a deliberately broken auth path to staging,
which is outside this plan's authority and would be a live-service regression. The synthetic-row control
above proves the assertion can fire on that input; it does not prove a live function can produce it.

## Task 1 — both helper specifiers bumped to `@2`

Commit `d7a648b7d`.

```
supabase/functions/_shared/ai-interaction-logger.ts:12:
  import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
supabase/functions/dossier-stats/dashboard-aggregations.ts:1:
  import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
```

Version tag only. Import style (esm.sh), quoting style, identifiers and all adjacent code untouched —
`git diff --stat phase-93-base -- supabase/functions` reports `2 files changed, 2 insertions(+), 2 deletions(-)`.

Read-first confirmed no `@2`-incompatible API rides along: `ai-interaction-logger.ts` uses only
`createClient(url, key)` at `:149`, `.rpc()`, `.from().select().eq().single()`, `.insert()` and
`.order()` — all stable across the `@2` line; `dashboard-aggregations.ts` uses `SupabaseClient`
type-only at `:32`.

### The DERIVED deploy set (derived before deploying, never quoted)

```
$ grep -rl 'ai-interaction-logger' supabase/functions --include='*.ts'
supabase/functions/dossier-field-assist/index.ts
supabase/functions/positions-consistency-check/index.ts
supabase/functions/ai-interaction-logs/index.ts
supabase/functions/translate-content/index.ts
supabase/functions/ai-summary-generate/index.ts

$ grep -rl 'dashboard-aggregations' supabase/functions --include='*.ts'
supabase/functions/dossier-stats/index.ts
```

5 + 1 = **6**, identical to the six named in the plan. No delta, so no stop. (`_shared` needed no
subtraction — the helper does not reference its own name, so it never appeared in the first list.)

### THE POPULATION DEFINITION (D-18)

- **Population:** every `*.ts` file under `supabase/functions` — **320 files**.
- **Matching rule:** `grep -rlE '@supabase/supabase-js@2\.3[0-9]'`.
- **Result:** **0**.
- **What falls OUTSIDE the population, enumerated rather than asserted:**
  - **Non-`.ts` files under `supabase/functions` — exactly 3**, all markdown
    (`ocr-extract/README.md`, `intelligence-refresh-v2/WORKSPACE_AUTO_CREATION.md`,
    `intelligence-refresh/WORKSPACE_AUTO_CREATION.md`). Checked anyway:
    `grep -rnE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='*.md'` → `exit=1`, no match.
  - **Already-deployed bundles** — not visible to any source grep. Task 2 owns them.
  - Widened once more as a belt-and-braces check: `grep -rnE '@supabase/supabase-js@2\.3[0-9]' supabase/`
    (the whole directory, no `--include`) → **`exit=1`, no match**.
- **The narrow-vs-wide contrast, measured side by side at close:**

  | population                          | matches now                                                            |
  | ----------------------------------- | ---------------------------------------------------------------------- |
  | `--include='index.ts'` (Phase 92's) | **0** — and it was 0 at Phase 92's close too. This is the false green. |
  | `--include='*.ts'` (Phase 93's)     | **0** — and it was **2** before this plan.                             |

  The narrow derivation returns the same number in both worlds. That is the whole finding: a correct
  command returning a correct number about the wrong set.

## Task 2 — the six importers redeployed

All six `supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg` **exited 0**:

```
DEPLOY_EXIT[ai-interaction-logs]=0          | Deployed Functions on project zkrcjzdemdmwhearhfgg: ai-interaction-logs
DEPLOY_EXIT[ai-summary-generate]=0          | Deployed Functions on project zkrcjzdemdmwhearhfgg: ai-summary-generate
DEPLOY_EXIT[dossier-field-assist]=0         | Deployed Functions on project zkrcjzdemdmwhearhfgg: dossier-field-assist
DEPLOY_EXIT[positions-consistency-check]=0  | Deployed Functions on project zkrcjzdemdmwhearhfgg: positions-consistency-check
DEPLOY_EXIT[translate-content]=0            | Deployed Functions on project zkrcjzdemdmwhearhfgg: translate-content
DEPLOY_EXIT[dossier-stats]=0                | Deployed Functions on project zkrcjzdemdmwhearhfgg: dossier-stats
```

### Deploy freshness — `supabase functions list`, pre-work baseline vs post

| fn                          | pre `version` / `updated_at` (UTC) | post `version` / `updated_at` (UTC) | strictly newer? |
| --------------------------- | ---------------------------------- | ----------------------------------- | --------------- |
| ai-interaction-logs         | v7 / 2026-08-15T11:09:23.664Z      | v8 / 2026-08-15T17:30:58.944Z       | YES             |
| ai-summary-generate         | v6 / 2026-08-15T10:58:56.144Z      | v7 / 2026-08-15T17:31:06.018Z       | YES             |
| dossier-field-assist        | v6 / 2026-08-15T11:11:47.641Z      | v7 / 2026-08-15T17:31:12.646Z       | YES             |
| positions-consistency-check | v12 / 2026-08-15T11:16:01.828Z     | v13 / 2026-08-15T17:31:19.632Z      | YES             |
| translate-content           | v6 / 2026-08-15T11:17:18.444Z      | v7 / 2026-08-15T17:31:28.279Z       | YES             |
| dossier-stats               | v11 / 2026-08-15T10:59:56.483Z     | v12 / 2026-08-15T17:31:35.172Z      | YES             |

`ALL SIX STRICTLY NEWER (updated_at AND version): true`. Total deployed functions unchanged at **304**
before and after — no function was created or dropped.

**Honest note on the deploy count: the six were deployed TWICE.** The first loop captured its exit
status with `${PIPESTATUS[0]}`, which is empty in **zsh** (this machine's shell — `$0=/bin/zsh`; zsh
spells it `$pipestatus` and 1-indexes it). Rather than infer exit 0 from the success banner — a typed-in
status code is a phase-level REJECT — the loop was re-run capturing `$?` directly, and those are the
zeroes recorded above. Consequence visible in the table: `updated_at` reflects the **second** round while
`version` advanced by exactly **1** across both. I am not asserting a cause for that (Supabase's version
semantics for a byte-identical re-deploy are not something this plan measured); the recorded, measured
fact is that both fields are strictly greater than the pre-work baseline for all six.

## GATE CONCERN

**Not a gate edit — nothing in any `<automated>` block was touched. Raised for the orchestrator to rule on.**

Task 2's `<acceptance_criteria>` names the discriminating evidence as _"the six **same-day** `updated_at`
rows recorded in the SUMMARY"_. **As written, that criterion is vacuous on this tree today.** The
pre-work baseline above shows all six were _already_ same-day (2026-08-15T10:58 – 11:17Z, from Phase
92's own redeploy sweep, hours before this plan started). A SUMMARY recording six same-day rows would
have satisfied the criterion **without any deploy at all** — the exact defect class this phase exists to
kill, in the evidence layer rather than the gate layer.

It was satisfied as written **and** superseded with the non-vacuous form: strictly-greater `updated_at`
**and** strictly-greater `version` against a baseline snapshot taken **before** the first deploy
(`/tmp/93-03-funcs-pre.json`). Recommendation for 93-15 and any future deploy plan: the phrasing should
be _"`updated_at` strictly greater than a pre-work baseline"_, never _"same-day"_.

## C9b — cross-phase consumer sweep (consumers are not bounded by this phase)

Run against `phase-93-base` over this plan's modified files, per `GATE-STANDARD.md` §C9b:

```
NO CONSUMER: supabase/functions/_shared/ai-interaction-logger.ts (id=ai-interaction-logger)
NO CONSUMER: supabase/functions/dossier-stats/dashboard-aggregations.ts (id=dashboard-aggregations)
```

Widened by **deployed-function identity** as C9b instructs (coupling here is by deployed function, not
by helper file) — all six deploy targets checked against the whole `tests/` tree (176 files):
`ai-interaction-logs`, `ai-summary-generate`, `dossier-field-assist`, `positions-consistency-check`,
`translate-content`, `dossier-stats` → **NO CONSUMER** for every one.

**The sweep instrument was positive-controlled before its null result was believed** (a sweep returning
nothing is indistinguishable from a broken sweep — instance 2's failure mode):

```
CONTROL OK  my-delegations         <- tests/e2e/92-delegations-error.spec.ts
CONTROL OK  DelegationManagementPage <- tests/e2e/92-delegations-error.spec.ts
```

Both are the known-coupled identifiers `GATE-STANDARD.md` §C9b names, and both were found. The
instrument works; the null result stands.

**Recorded as NAMED non-consumers with reason (C9b option b):** no shipped test in `tests/` asserts the
rendered output, DOM, or response shape of either helper or of any of the six functions. Consistent with
the change's nature — a version-tag bump alters no response shape. The residual class C9b says a grep
cannot see (a test coupled by shape alone) is not closed here; that is 93-15's shipped-suite run.

## Files Created/Modified

- `supabase/functions/_shared/ai-interaction-logger.ts` — `:12` import bumped `@2.39.0` → `@2`; builds the
  service-role client at `:149` that five functions log through
- `supabase/functions/dossier-stats/dashboard-aggregations.ts` — `:1` type-only `SupabaseClient` import
  bumped `@2.39.0` → `@2`

## Task Commits

1. **Task 1: Bump both helper specifiers to `@2`** — `d7a648b7d` (fix)
2. **Task 2: Redeploy the six importers; probe as regression guard** — no commit (deploy-only task; no
   repo files change. Per the plan's action text, **no shared deploy-ledger file was created** — per-plan
   evidence only, which is this SUMMARY's two tables above.)

All commits used explicit pathspecs (`git commit -- <path> <path>`); verified with `git show --stat HEAD`
and `git show HEAD:<file>`. Another lane's uncommitted `supabase/functions/my-delegations/index.ts` was
present in the shared tree throughout and was never staged, checked out, or restored — it has since
landed as 93-02's own commits (`1b0ff7f51`, `7387cda3f`).

## Decisions Made

- **Version tag only, esm.sh retained.** Per plan `<interfaces>` and the Phase 92 AUTH-02 convention.
  Switching to `jsr:` changes the import SOURCE, which is beyond a pin fix.
- **Deploy set derived, then compared to the plan's six.** They matched, so no stop. Had they differed,
  the delta would be recorded here instead of a deploy.
- **Freshness evidence strengthened past the plan's wording** (see GATE CONCERN). Both forms are recorded
  so the orchestrator can rule without re-running anything.
- **The live-401 red was left unconstructed and labelled**, not quietly folded into g2's pass.

## Deviations from Plan

None — plan executed exactly as written. (The second deploy round is not a deviation from the plan's
action text, which mandates deploying the six and recording each command's exit; it is how a real exit
code was obtained after zsh's `PIPESTATUS` gap, and it is disclosed above.)

## Issues Encountered

- **`${PIPESTATUS[0]}` is empty in zsh** — documented under Task 2. Resolved by re-running with a direct
  `$?` capture rather than by inferring the status. Worth carrying forward: any Bash-tool loop on this
  machine that needs a pipeline's exit status must use `$pipestatus[1]` (zsh) or avoid the pipe.

## Intended-broken register — untouched

Confirmed not touched by this plan: `/delegations` (Phase 102), `/admin/data-retention` legal-holds
(Phase 100 `RLS-AUTHUSERS-01`), `/admin/field-permissions` filters, `AUDIT-DROP-01` / `AUDIT-ZERO-01`
(Phase 94). This plan's diff is 2 lines in 2 files; none of them is reachable from any of those.
No `GRANT SELECT ON auth.users` was proposed, applied, or considered.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `PIN-2390-01` is closed in both source and deployed artifact.
- **93-15 (phase close) re-runs the widened derivation with its population statement.** The population
  definition it should restate is the one measured above: 320 `*.ts` files, 3 non-`.ts` files outside it
  (all markdown, all checked and clean), plus deployed bundles which only a redeploy can move.
- Two items for the orchestrator: the **GATE CONCERN** on Task 2's "same-day" wording, and the
  **NOT CONSTRUCTED** live-401 red on g2.

## BLOCKED

None.

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_
