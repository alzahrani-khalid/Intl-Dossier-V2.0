---
phase: 92-session-integrity-edge-function-auth
plan: 06
subsystem: auth
tags: [supabase, edge-functions, deno, jsr, gotrue, rls, supabase-js]

# Dependency graph
requires:
  - phase: 92-01
    provides: 'AUTH-02 derivation command + Class 1/2/3 edit specs (92-PATTERNS.md)'
provides:
  - '33 edge functions (alphabetical slice dossier-activity-timeline → inactive-users) migrated off the 2.3x pin onto jsr:@supabase/supabase-js@2'
  - '12 Class-1 functions converted from bare getUser() to token-passing getUser(token) with their header-injected clients preserved verbatim'
  - 'Slice-B input set for the 92-09 batch deploy'
affects: [92-09, 92-04, edge-function-deploy, AUTH-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'jsr:@supabase/supabase-js@2 as the canonical edge-function specifier'
    - 'Class-1 edit = specifier bump + const token + getUser(token), injected client untouched'

key-files:
  created:
    - .planning/phases/92-session-integrity-edge-function-auth/92-06-SUMMARY.md
  modified:
    - supabase/functions/dossier-activity-timeline/index.ts
    - supabase/functions/dossier-export-pack/index.ts
    - supabase/functions/dossier-field-assist/index.ts
    - supabase/functions/dossier-recommendations/index.ts
    - supabase/functions/dossier-relationships/index.ts
    - supabase/functions/dossier-stats/index.ts
    - supabase/functions/dossiers/index.ts
    - supabase/functions/dossiers-archive/index.ts
    - supabase/functions/dossiers-briefs-generate/index.ts
    - supabase/functions/dossiers-create/index.ts
    - supabase/functions/dossiers-get/index.ts
    - supabase/functions/dossiers-list/index.ts
    - supabase/functions/dossiers-timeline/index.ts
    - supabase/functions/dossiers-timeline-test/index.ts
    - supabase/functions/dossiers-update/index.ts
    - supabase/functions/email-inbound/index.ts
    - supabase/functions/email-send/index.ts
    - supabase/functions/engagement-dossiers/index.ts
    - supabase/functions/engagement-recommendations/index.ts
    - supabase/functions/engagements-positions-attach/index.ts
    - supabase/functions/engagements-positions-detach/index.ts
    - supabase/functions/engagements-positions-list/index.ts
    - supabase/functions/entity-comments/index.ts
    - supabase/functions/entity-duplicates/index.ts
    - supabase/functions/entity-templates/index.ts
    - supabase/functions/escalations-report/index.ts
    - supabase/functions/event-store/index.ts
    - supabase/functions/events/index.ts
    - supabase/functions/field-history/index.ts
    - supabase/functions/forums/index.ts
    - supabase/functions/generate-access-review/index.ts
    - supabase/functions/graph-export/index.ts
    - supabase/functions/inactive-users/index.ts

key-decisions:
  - 'Class decided per file by reading its auth call, not from a list: 12 Class-1 / 21 Class-2'
  - 'forums/index.ts has no authHeader variable — token derived inline from req.headers.get(Authorization) so the injected client stays byte-identical to phase-92-base'
  - 'Files with no getUser call at all (6) received the specifier bump only; adding auth to them is outside AUTH-02 scope'

patterns-established:
  - 'Class-1 edit: insert const token immediately above the getUser destructure, keep the file quote style, never touch createClient'

requirements-completed: [AUTH-02]

# Metrics
duration: ~35 min
completed: 2026-08-15
---

# Phase 92 Plan 06: AUTH-02 Sweep Slice B Summary

**33 edge functions (dossier-activity-timeline → inactive-users) moved off the `@2.3x` esm.sh pin to `jsr:@supabase/supabase-js@2`, with 12 Class-1 functions converted from the 401-producing bare `getUser()` to `getUser(token)` while every header-injected client survives byte-identical to `phase-92-base`.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-08-15T10:43:00Z
- **Tasks:** 2 / 2
- **Files modified:** 33 source files + this SUMMARY

## Accomplishments

- Slice-B derivation grep reaches **0** for both `@supabase/supabase-js@2\.3[0-9]` and bare `auth.getUser()`.
- All 33 files now carry `jsr:@supabase/supabase-js@2`; **0** old specifiers survive anywhere, including comments.
- **Zero drift** in header-injected client count vs `phase-92-base`, per-file, across all 33 — the criterion no gate checks.
- `dossiers-update` (the named Class-2 specimen) diff is **exactly one line**, as the plan required.

## Per-file class tally

**Class 1 — specifier bump + `const token` + `getUser(token)` (12):**

| Function                       | Injected client kept       | Token line                                                        |
| ------------------------------ | -------------------------- | ----------------------------------------------------------------- |
| `dossier-field-assist`         | yes (`:213`)               | `authHeader.replace('Bearer ', '')`                               |
| `dossiers-archive`             | yes (`:54`)                | `authHeader.replace("Bearer ", "")`                               |
| `dossiers-briefs-generate`     | yes (`:69`)                | `authHeader.replace('Bearer ', '')`                               |
| `dossiers-timeline-test`       | yes (`:38`)                | `authHeader.replace("Bearer ", "")`                               |
| `engagements-positions-attach` | yes (`:58`)                | `authHeader.replace('Bearer ', '')`                               |
| `engagements-positions-detach` | yes (`:48`)                | `authHeader.replace('Bearer ', '')`                               |
| `entity-templates`             | yes (`:117`)               | `authHeader.replace('Bearer ', '')`                               |
| `field-history`                | yes (`:371`)               | `authHeader.replace('Bearer ', '')`                               |
| `forums`                       | yes (`:56`, inline header) | `(req.headers.get('Authorization') ?? '').replace('Bearer ', '')` |
| `generate-access-review`       | yes (`:144`)               | `authHeader.replace('Bearer ', '')`                               |
| `graph-export`                 | yes (`:923`)               | `authHeader.replace('Bearer ', '')`                               |
| `inactive-users`               | yes (`:88`)                | `authHeader.replace('Bearer ', '')`                               |

**Class 2 — specifier bump ONLY (21):**

Already passing a token (15): `dossier-export-pack`, `dossier-recommendations`, `dossier-relationships`, `dossier-stats`, `dossiers-create`, `dossiers-get`, `dossiers-list`, `dossiers-timeline`, `dossiers-update`, `engagement-dossiers`, `engagement-recommendations`, `entity-comments`, `entity-duplicates`, `escalations-report`, `event-store`.

No `getUser` call anywhere in the file (6): `dossier-activity-timeline`, `dossiers`, `email-inbound`, `email-send`, `engagements-positions-list`, `events`. These got the specifier bump and nothing else — see WHAT THIS DOES NOT ESTABLISH.

`escalations-report` passes the token via the inline two-line form `getUser(\n  authHeader.replace('Bearer ', '')\n)` rather than a `const token`; that was already correct at base and was not reshaped.

## Task Commits

1. **Task 1: slice B first half (17 files)** — `fc91b271` (feat)
2. **Task 2: slice B second half (16 files)** — `7ccbbbd0` (feat)

`git show --stat` on each confirms 17 and 16 files respectively, **all within `files_modified`** — no foreign file appeared in either commit.

## Gates — verbatim

### Task 1 gate

<!-- prettier-ignore -->
```bash
for d in supabase/functions/dossier-activity-timeline supabase/functions/dossier-export-pack supabase/functions/dossier-field-assist supabase/functions/dossier-recommendations supabase/functions/dossier-relationships supabase/functions/dossier-stats supabase/functions/dossiers supabase/functions/dossiers-archive supabase/functions/dossiers-briefs-generate supabase/functions/dossiers-create supabase/functions/dossiers-get supabase/functions/dossiers-list supabase/functions/dossiers-timeline supabase/functions/dossiers-timeline-test supabase/functions/dossiers-update supabase/functions/email-inbound supabase/functions/email-send; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <17 dirs> | wc -l)" -eq 0 && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <17 dirs> | wc -l)" -eq 0
```

(run with the 17 directory paths spelled out in full exactly as the plan writes them)

**Output:** _(no stdout — the command is a chain of `test` assertions)_

**Exit code:** `0`

**Verdict: PASS**

### Task 2 gate

<!-- prettier-ignore -->
```bash
for d in supabase/functions/engagement-dossiers ... supabase/functions/inactive-users; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <16 dirs> | wc -l)" -eq 0 && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <16 dirs> | wc -l)" -eq 0 && git rev-parse -q --verify refs/tags/phase-92-base >/dev/null && test "$(git diff --name-only phase-92-base -- supabase/functions/_shared ':(exclude)supabase/functions/_shared/auth.ts' supabase/config.toml | wc -l)" -eq 0
```

(run with the 16 directory paths spelled out in full exactly as the plan writes them)

**Output:** _(no stdout — the command is a chain of `test` assertions)_

**Exit code:** `0`

**Verdict: PASS** — including the `_shared` scope guard: 0 changed files under `supabase/functions/_shared` (excluding `auth.ts`, which is 92-04's) and 0 changes to `supabase/config.toml`.

### Plan-level verification — slice-scoped derivation

<!-- prettier-ignore -->
```bash
SLICE=(dossier-activity-timeline ... inactive-users)   # 33 names
FILES=(); for d in "${SLICE[@]}"; do FILES+=("supabase/functions/$d/index.ts"); done
echo "slice file count: ${#FILES[@]}"
echo "2.3x pins remaining:  $(grep -lE '@supabase/supabase-js@2\.3[0-9]' "${FILES[@]}" | wc -l)"
echo "bare auth.getUser():  $(grep -lE 'auth\.getUser\(\)' "${FILES[@]}" | wc -l)"
echo "on jsr:@2:            $(grep -lF 'jsr:@supabase/supabase-js@2' "${FILES[@]}" | wc -l) / 33"
echo "old specifier in a comment: $(grep -nE '//.*esm\.sh/@supabase/supabase-js' "${FILES[@]}" | wc -l)"
echo "getUser(token) call sites:  $(grep -c 'getUser(token)' "${FILES[@]}" | awk -F: '{s+=$2} END{print s}')"
```

**Output:**

```
slice file count: 33
2.3x pins remaining:  0
bare auth.getUser():  0
on jsr:@2:            33 / 33
old specifier in a comment: 0
getUser(token) call sites:  27
```

**Exit code:** `0` — **Verdict: PASS**

(27 = 26 literal `getUser(token)` calls + 1 pre-existing occurrence inside a `dossier-export-pack` comment. The 27th token-passing file, `escalations-report`, uses the inline `getUser(authHeader.replace(...))` form and so is not counted by this literal grep.)

### Injected-client non-regression (the criterion no gate checks)

Per-file count of `headers: { Authorization` at `phase-92-base` vs now, all 33 files:

**Output:** every file `OK`, zero `!!DRIFT!!`. Counts by file — 1 site: `dossier-export-pack`, `dossier-field-assist`, `dossier-recommendations`, `dossier-relationships`, `dossier-stats`, `dossiers`, `dossiers-archive`, `dossiers-briefs-generate`, `dossiers-create`, `dossiers-get`, `dossiers-list`, `dossiers-timeline-test`, `dossiers-update`, `engagement-dossiers`, `engagement-recommendations`, `engagements-positions-attach`, `engagements-positions-detach`, `engagements-positions-list`, `entity-comments`, `entity-duplicates`, `entity-templates`, `event-store`, `events`, `field-history`, `forums`, `generate-access-review`, `graph-export`, `inactive-users`. 0 sites (none at base either): `dossier-activity-timeline`, `dossiers-timeline`, `email-inbound`, `email-send`, `escalations-report`.

**Verdict: PASS — no decrease anywhere.**

## Decisions Made

- **`forums/index.ts` token derivation.** It is the only Class-1 file with no `authHeader` variable — its client reads `req.headers.get('Authorization')!` inline. Rather than introduce a variable and rewrite the `createClient` call, the token line reads the header independently: `const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')`. The client construction is therefore byte-identical to `phase-92-base`. This is a deliberate variance from the recipe's literal `authHeader.replace(...)` text, taken to satisfy the stronger injected-client constraint.
- **Six files with no `getUser` at all** got the specifier bump only. Adding an auth gate where none existed is not AUTH-02's scope and would be an unreviewed behavior change.
- **`escalations-report`'s inline two-line `getUser(authHeader.replace(...))`** was left as-is — it already passes a token; reshaping it to a `const token` would be a cosmetic diff with no gate or behavioral value.

## Deviations from Plan

None — plan executed as written. One self-caught implementation slip, corrected before any commit:

**[Rule 1 - Bug] `dossiers-briefs-generate` left with a declared-but-unused `token` and a still-bare `getUser()`**

- **Found during:** Task 1, immediately after the edit landed
- **Issue:** The first edit added `const token = ...` but did not change the call to `getUser(token)` — the exact defect the plan warns no gate outside the bare-`getUser` grep would catch
- **Fix:** Second edit changed the call to `getUser(token)`
- **Files modified:** `supabase/functions/dossiers-briefs-generate/index.ts`
- **Verification:** Task 1 gate's bare-`getUser()` assertion; confirmed in the reviewed diff before commit
- **Committed in:** `fc91b271` (never reached a commit in the broken state)

**Total deviations:** 0 plan deviations; 1 in-flight self-correction.
**Impact on plan:** None. Scope unchanged.

## Issues Encountered

**One invalidated verification, re-run.** A first attempt at the slice-wide summary check passed the 33 directory names as a single quoted `"$SLICE"` string. `grep` treated it as one path and errored `File name too long`, returning `0` for every count — including an obviously-wrong `on jsr:@2: 0 / 33`. Those zeros were **not** evidence and are not reported above. The check was re-run with a proper bash array; the numbers in the plan-level verification section are from that valid run. The two `<automated>` plan gates were unaffected — they spell every path out literally and both genuinely exited 0.

## GATE CONCERN

None. Both `<automated>` gates ran verbatim, unmodified, and passed.

## Anomalies for the orchestrator

**None of the "bare `getUser()` with no Authorization header anywhere" kind.** Every Class-1 file in this slice reads an Authorization header. `forums` is the near-miss — it reads the header inline instead of into a variable — and is documented under Decisions Made rather than left silent.

## User Setup Required

None.

## Next Phase Readiness

Slice B is source-clean and is input to the **92-09** batch deploy. Nothing in this slice has been deployed.

---

## WHAT THIS DOES NOT ESTABLISH

Named honestly, because every gate in this plan is a static grep over repo source:

1. **Nothing here was type-checked, bundled, linted, or run.** No gate in this phase typechecks or bundles an edge function, and I did not run `deno check` or any Deno tooling — none is wired for these files. The only defense against a syntactically-broken or undeclared-identifier file was my own reading plus a token-declaration-position script. A `deno check` failure would surface at **92-09 deploy**, not here.
2. **Nothing was deployed.** Zero of the 33 functions were pushed to staging. `jsr:@supabase/supabase-js@2` has never been resolved by the Supabase edge runtime for any of these files. That the specifier resolves at all is unverified by this plan.
3. **No runtime auth behavior was observed.** I did not issue a single HTTP request. That `getUser(token)` returns 200 where bare `getUser()` returned 401 is inherited from the phase's premise and from 92-05/92-04 — it is not measured here.
4. **RLS scoping is argued structurally, not observed.** I verified the _count_ of `headers: { Authorization` sites is unchanged per file vs `phase-92-base`, and read each Class-1 client construction. I did **not** execute a query as a scoped user and confirm rows come back. The 200-with-`[]` failure this criterion exists to prevent would still be invisible to everything I ran.
5. **The six no-`getUser` files are unverified as to whether they _should_ have an auth gate.** `dossier-activity-timeline`, `dossiers`, `email-inbound`, `email-send`, `engagements-positions-list`, `events` pass this plan's gates trivially because they have no `getUser` to be bare. Whether each is correctly relying on the gateway's `verify_jwt`, a service-role path, or is genuinely missing a check was **not** assessed — that question is outside AUTH-02's specifier/`getUser`-shape scope and is not answered by any evidence in this document.
6. **`forums`'s `?? ''` fallback is untested.** If the Authorization header is absent, `getUser('')` is now called where `getUser()` was called before. Both paths were expected to fail auth, but the equivalence of their failure modes is reasoned, not exercised.
7. **Slice-scoped only.** Every count above covers my 33 files. The phase-wide population (133) reaching zero depends on 92-05, 92-07, 92-08, and 92-04, none of which I verified.
8. **Pre-commit hook output was not inspected for warnings.** The hook ran to completion on both commits (both succeeded); its knip/lint chatter was not read line by line.

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
