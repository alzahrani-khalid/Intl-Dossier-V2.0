---
phase: 92-session-integrity-edge-function-auth
plan: 09
kind: probe-final
captured: 2026-08-15
base_tag: phase-92-base
compares_against: 92-PROBE-BASELINE.md
---

# Phase 92 — Post-deploy probe (criterion 2, live half)

The "after" half of the AUTH-02 evidence. Its "before" half is `92-PROBE-BASELINE.md` §1, captured at
`phase-92-base` (`e766040`) **before any Phase 92 production edit**. Neither half alone is the
evidence (D-21); the pair is.

Two sides are recorded here, because a green grep over an undeployed function is a false pass and a
redeploy without an edit can silently flip behaviour (D-08 + D-21).

---

## (a) Source side — the D-08 derivation, run repo-wide

Never re-quoted from an earlier plan; re-run here.

```
$ grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l
       0
```

Exit `0`. **0 repo-wide.** The `--include='index.ts'` flag is load-bearing, not cosmetic — see the
`dashboard-aggregations.ts` carry-forward below.

---

## (b) Live side — probe of DEPLOYED staging artifacts

### Run record

| Property   | Value                                                                           |
| ---------- | ------------------------------------------------------------------------------- |
| Date (UTC) | 2026-08-15T11:26:37Z → 11:26:46Z                                                |
| Command    | `bash scripts/probe-edge-auth.sh <11 names>`                                    |
| Target     | `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/<fn>` (deployed staging) |
| Auth       | real user JWT minted from `.env.test` `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`  |
| Host       | macOS 26.6.1, curl 8.7.1                                                        |
| Repeats    | run twice, ~7 min apart — **identical codes both times**                        |

No credential value appears in this file or in the script's output — only env-var **names**.

### Actual output (verbatim)

```
audit-logs-viewer -> 500
data-retention -> 500
field-permissions -> 200
my-delegations -> 200
dossiers-update -> 405
tasks-get -> 200
access-review-detail -> 404
dossier-activity-timeline -> 400
intake-audit-logs -> 200
push-notification-send -> 500
data-export -> 200
```

**11 representatives, 0 × 401.** Per the D-16 verdict rule fixed in `92-PROBE-BASELINE.md` _above_
the data: **401 = auth rejected; any other status = the request passed the `getUser` gate.**

---

## The discriminating four (D-39)

The gate accepts any 6 non-401 lines. That is weaker than the evidence actually available, and
weaker than what this phase should claim. Only representatives that were **401 at baseline** can
distinguish a successful migration from no migration at all:

| Representative      | Baseline | Post-deploy | Flip      | Discriminating?                                        |
| ------------------- | -------- | ----------- | --------- | ------------------------------------------------------ |
| `audit-logs-viewer` | **401**  | **500**     | 401 → 500 | **YES**                                                |
| `data-retention`    | **401**  | **500**     | 401 → 500 | **YES**                                                |
| `field-permissions` | **401**  | **200**     | 401 → 200 | **YES**                                                |
| `my-delegations`    | **401**  | **200**     | 401 → 200 | **YES**                                                |
| `dossiers-update`   | 405      | 405         | none      | **no** — already non-401 (gate-satisfying) at baseline |
| `tasks-get`         | 200      | 200         | none      | **no** — already non-401 AND outside the population    |

`dossiers-update` and `tasks-get` passing proves **nothing** about the migration. `tasks-get` never
carried a `2.3x` pin at all — it is the B\A control, not a subject. Both are retained because the
plan names them and because they are the D-16 set controls, not because they are evidence.

The two `500`s are **past the auth gate** and are pre-existing data-layer defects the 401 was
previously masking — `AUDIT-42703` and `DR-42501`, both already filed on the tracked planning
surface (`.planning/REQUIREMENTS.md:50-51`) and routed to Phase 93. A 500 is non-401 and therefore
gate-satisfying; it is recorded as the honest result it is, **not** as "closed".

### A fifth flip, from a different instrument

| Representative | Baseline source                                | Baseline | Post-deploy |
| -------------- | ---------------------------------------------- | -------- | ----------- |
| `data-export`  | audit `dossiers.md` F3 (`:122`), not the probe | **401**  | **200**     |

Recorded separately and labelled, because its "before" reading comes from the live audit rather than
from `92-PROBE-BASELINE.md`, and was taken by a different instrument at a different time. It is
corroborating, not co-equal.

---

## (c) D-16 branch verdict for the B\A set

`tasks-get` (`@2` + bare `getUser()`) returns **200**, unchanged from baseline. Branch 2 — "B\A
returns 401, so bare `getUser()` fails independently of the pin" — is **excluded by measurement**,
exactly as at baseline. **No Phase 93 filing is triggered by branch 2.** No `@2` bare-`getUser()`
function probed 401, so this phase is not widened.

---

## (d) Audited-route cross-check

Criterion 2's second clause is "no audited route renders empty because of a 401". Every function
behind an audited 401 finding, across **all** audit lanes (not only adminops F2):

| Function            | Audit finding                         | In ledger | Ledger OK rows | Probed now |
| ------------------- | ------------------------------------- | --------- | -------------- | ---------- |
| `audit-logs-viewer` | adminops F2 (`/audit-logs`)           | yes       | 1              | **500**    |
| `data-retention`    | adminops F2 (`/admin/data-retention`) | yes       | 1              | **500**    |
| `field-permissions` | adminops F1 + F2                      | yes       | 1              | **200**    |
| `my-delegations`    | engagements F4 (`/delegations`)       | yes       | 1              | **200**    |
| `data-export`       | dossiers F3 (`:122`)                  | yes       | 1              | **200**    |

All five are in `92-DEPLOY-LEDGER.md` with exactly one `OK` row each, and none returns 401.
`data-export` was **not** among the plan's named representatives — it was found by sweeping every
audit lane for 401 findings rather than only the adminops F2 mapping the plan cites, and was probed
because of that.

### Slice representatives (one per sweep slice)

| Function                    | Slice   | Probed now | Pre-migration baseline              |
| --------------------------- | ------- | ---------- | ----------------------------------- |
| `access-review-detail`      | `92-05` | 404        | **none — never probed at baseline** |
| `dossier-activity-timeline` | `92-06` | 400        | **none — never probed at baseline** |
| `intake-audit-logs`         | `92-07` | 200        | **none — never probed at baseline** |
| `push-notification-send`    | `92-08` | 500        | **none — never probed at baseline** |

These establish "non-401 now, on a deployed artifact, one per slice". They are **not** flips: no
pre-migration code exists for any of them, so they cannot discriminate migration from
no-migration. `push-notification-send`'s 500 is past the auth gate; its cause is **not diagnosed
here** and no claim is made that the function is healthy.

---

## (e) Carry-forwards — derived and recorded, not acted on

**1. Header-less bare-`getUser()` functions — derivation RUN, result EMPTY.**

```
$ for f in $(grep -rlE 'auth\.getUser\(\s*\)' supabase/functions --include='*.ts'); do
    grep -qi authorization "$f" || echo "$f"
  done
(no output)
```

**No header-less functions found — this is the expected outcome**, recorded explicitly as a run
result so it is distinguishable from a mis-run command. The "2 of 163" figure this criterion once
named was a single-line-regex measurement error, struck in `90471cee`; per `92-CONTEXT.md:488` any
criterion naming "the two" is naming an **empty set**. No count is carried forward.

**2. `supabase/functions/_shared/ai-interaction-logger.ts:12` still pins esm.sh 2.39.0.**

```
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
```

Outside D-06 (which names only `_shared/auth.ts`) and outside the D-08 `index.ts` population. Named
here so the omission is a recorded decision, not a silent gap.

**3. `supabase/functions/dossier-stats/dashboard-aggregations.ts:1` also still pins esm.sh 2.39.0 —
and unlike the logger it is imported by a migrated function.**

```
dashboard-aggregations.ts:1  import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
dossier-stats/index.ts:4     import { handleDashboardAggregations } from "./dashboard-aggregations.ts";
```

So the deployed `dossier-stats` artifact **re-bundles a 2.3x specifier after the sweep**. It is
outside the D-07 population (`index.ts` files, operator-decided) and is NOT swept here. It is the
only such file, and it is the reason the slice derivations in `92-05`..`92-08` carry
`--include='index.ts'`: without that flag the `92-06` slice gate cannot reach 0 even with all 33 of
its files migrated (measured).

**4. D-17 corrected wording — confirmed read-only, nothing edited.**

`ROADMAP.md:285` and `REQUIREMENTS.md` AUTH-02 (`:26`, with the correction note at `:27`) both carry
the corrected form — "the 133 `index.ts` files pinning `supabase-js@2.3x`", with the false `with bare
getUser()` conjunction removed and the re-derivation command inline. This verification closes against
that corrected form. **This plan edited no governing doc.**

---

## Header-injected clients — the criterion no gate checks

RLS scoping survives only if each migrated function keeps its caller-token client
(`createClient(url, key, { global: { headers: { Authorization: authHeader } } })`). A function that
lost it would return `200` with `[]` — success-shaped failure, the exact class this milestone exists
to kill.

```
$ git grep -c "global:" phase-92-base -- 'supabase/functions/*/index.ts' | wc -l   # 247
$ git grep -c "global:" HEAD            -- 'supabase/functions/*/index.ts' | wc -l   # 247
```

**247 → 247, no decrease.** This plan modified **0** files under `supabase/`
(`git diff --name-only feb3b42c^..HEAD -- supabase/` → 0), so the count is unchanged by construction
as well as by measurement.

---

## What this probe does NOT establish

- **11 representatives, not a census.** 139 functions were deployed; 11 were probed. A per-function
  claim needs a per-function probe. This establishes the mechanism and the audited surfaces, not
  every function.
- **Only 4 of the 11 are flips.** The 4 slice representatives have no pre-migration baseline;
  `dossiers-update` and `tasks-get` were already non-401 before any migration. Six of eleven
  non-401 lines are consistent with the migration but do not evidence it.
- **Non-401 ≠ correct.** `200`/`400`/`404`/`405`/`500` prove only that the request passed the
  `getUser` gate. They say nothing about whether RLS scoping is right — `my-delegations` returns a
  confident `200` with empty arrays (`DELEG-01`), which is precisely the failure this milestone
  targets, and it is a gate-satisfying line here.
- **The two `500`s and `push-notification-send`'s `500` are not diagnosed as healthy.** Two are
  filed defects; the third is undiagnosed.
- **Staging only.** Nothing here speaks to the production droplet.
