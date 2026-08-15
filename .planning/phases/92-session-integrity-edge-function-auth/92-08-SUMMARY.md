---
phase: 92-session-integrity-edge-function-auth
plan: 08
subsystem: auth
tags: [supabase, edge-functions, deno, jsr, getUser, rls, supabase-js]

# Dependency graph
requires:
  - phase: 92-01
    provides: phase-92-base tag + the AUTH-02 population derivation command (D-07/D-08)
provides:
  - 30 edge functions (alphabetical slice push-notification-send → working-groups) off the
    2.3x esm.sh pin and onto jsr:@supabase/supabase-js@2
  - 12 Class-1 auth gates converted from bare getUser() to token-passing getUser(token)
  - RLS-scoping header-injected clients preserved verbatim in all 30 files
affects: [92-09 batch deploy, AUTH-02 acceptance derivation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'jsr:@supabase/supabase-js@2 specifier replaces every https://esm.sh/...@2.3x pin'
    - 'Class-1 edit = specifier + token extraction + getUser(token), injected client untouched'

key-files:
  created:
    - .planning/phases/92-session-integrity-edge-function-auth/92-08-SUMMARY.md
  modified:
    - supabase/functions/{30 index.ts — see Files Modified}

key-decisions:
  - 'themes and word-assistant had no named authHeader variable; token derived from the same req.headers.get(Authorization) their injected client already reads, rather than inventing a new header read or restructuring the file'
  - 'Class decided per file by reading the actual auth call, never from a list — produced 12 Class-1 / 18 Class-2, and 7 of the Class-2 files have no getUser call at all'

patterns-established:
  - 'Per-file injected-client site count is diffable against phase-92-base as a static guard on the criterion no gate checks'

requirements-completed: [AUTH-02]

# Metrics
duration: see Performance (start not stamped at spawn)
completed: 2026-08-15
---

# Phase 92 Plan 08: AUTH-02 Sweep Slice D Summary

**30 edge functions (push-notification-send → working-groups) moved off the 2.3x esm.sh pin to `jsr:@supabase/supabase-js@2`, with 12 bare `getUser()` gates converted to `getUser(token)` and every RLS-scoping header-injected client preserved byte-for-byte.**

## Performance

- **Duration:** commit window 13:50:09 → 13:51:43 +0300 (94 s between the two task commits).
  Spawn time was not stamped, so total elapsed including survey and reads is not recorded — I am
  not going to invent one.
- **Task 1 commit:** 2026-08-15T13:50:09+03:00
- **Task 2 commit:** 2026-08-15T13:51:43+03:00
- **Tasks:** 2 / 2
- **Files modified:** 30 (+ this SUMMARY)

## Accomplishments

- All 30 slice-D `index.ts` files carry exactly one supabase-js specifier, now `jsr:@supabase/supabase-js@2`. No old specifier survives anywhere in these files — including comments (grep for `esm.sh/@supabase/supabase-js` across the 30 exits 1).
- 12 Class-1 files gained a token extraction and `getUser(token)`. Zero bare `auth.getUser()` remain in the slice.
- Injected-client sites (`headers: { Authorization ...`) counted per file against `phase-92-base`: **0 drift across all 30**. The criterion no gate in this phase checks is held, and it is checkable — see the command in Gates below.

## Class Tally (decided per file by reading its auth call)

**Class 1 — 12 files** (pinned + bare `getUser()` + injected client → specifier + `const token` + `getUser(token)`, client untouched):

relationships-manage, retention-processor, revoke-delegation, schedule-access-review,
tags-manage, team-collaboration, themes, translate-content, user-permissions,
validate-delegation, webhooks, word-assistant

**Class 2 — 18 files** (specifier bump only). Splits two ways:

- _already token-passing_ (11): push-notification-send, relationship-health, sample-data,
  smart-import-suggestions, stakeholder-influence, sync-incremental, sync-pull, topics,
  waiting-queue-escalation, waiting-queue-filters, working-groups
- _no `getUser` call anywhere in the file_ (7): refresh-commitment-stats, reports,
  resolve-dossier-context, slack-bot, teams-bot, trigger-health-recalculation, webhook-delivery

12 + 18 = 30.

**Anomalies (bare `getUser()` with no Authorization header anywhere): none.** Every Class-1 file
had a real Authorization header in scope. Two of them (themes, word-assistant) read it inline
rather than through a named `authHeader` variable — that is a naming difference, not the anomaly
the plan told me to stop on. See Deviations.

## Task Commits

1. **Task 1: slice D first half (push-notification-send → sync-pull, 15 files)** — `5d1bc7b6` (fix)
   — 4 Class-1 / 11 Class-2. `git show --stat` = exactly the 15 planned files, 23 insertions / 19 deletions.
2. **Task 2: slice D second half (tags-manage → working-groups, 15 files)** — `6a7d7388` (fix)
   — 8 Class-1 / 7 Class-2. `git show --stat` = exactly the 15 planned files, 31 insertions / 23 deletions.

Neither commit's stat contained a file that is not in this plan's `files_modified`. Both commits
used explicit `--` pathspecs; no `git add -A`, no `git add .`, no bare commit.

## Files Created/Modified

All 30 are `supabase/functions/<name>/index.ts`:

push-notification-send, refresh-commitment-stats, relationship-health, relationships-manage,
reports, resolve-dossier-context, retention-processor, revoke-delegation, sample-data,
schedule-access-review, slack-bot, smart-import-suggestions, stakeholder-influence,
sync-incremental, sync-pull, tags-manage, team-collaboration, teams-bot, themes, topics,
translate-content, trigger-health-recalculation, user-permissions, validate-delegation,
waiting-queue-escalation, waiting-queue-filters, webhook-delivery, webhooks, word-assistant,
working-groups.

Whole-slice diff-line inventory vs `phase-92-base` (every changed line in all 30 files, deduped):

```
  21 +import { createClient } from 'jsr:@supabase/supabase-js@2';
  14 -import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
   7 +import { createClient } from 'jsr:@supabase/supabase-js@2'
   6 -import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
   5 -import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
   5 -    } = await supabaseClient.auth.getUser()
   5 +    } = await supabaseClient.auth.getUser(token)
   5 +    const token = authHeader.replace('Bearer ', '');
   5 +    const token = authHeader.replace('Bearer ', '')
   3 -    } = await supabaseClient.auth.getUser();
   3 +    } = await supabaseClient.auth.getUser(token);
   2 -import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
   2 -import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
   2 -    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
   2 +import { createClient } from "jsr:@supabase/supabase-js@2";
   2 +    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
   2 +    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
   1 -import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
   1 -    } = await supabase.auth.getUser();
   1 -    const { data: user } = await supabaseClient.auth.getUser();
   1 +    } = await supabase.auth.getUser(token);
   1 +    const { data: user } = await supabaseClient.auth.getUser(token);
```

30 imports out, 30 imports in; 12 `getUser()` → `getUser(token)`; 12 `const token` added.
**Nothing else changed.** No `createClient(...)` option object, no CORS import, no error idiom,
no service-role client appears on either side of the diff. Quote style (single vs double) and
semicolon style were preserved per file — `reports` and `word-assistant` keep double quotes.

## Gates

Both `<automated>` gate blocks were run verbatim from the repo root, unedited. **No gate text was
modified.** They emit no stdout on success; the observable is the exit code.

### Task 1 gate

Command (verbatim from `92-08-PLAN.md`, run from repo root):

```
for d in supabase/functions/push-notification-send ... supabase/functions/sync-pull; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <15 dirs> | wc -l)" -eq 0 && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <15 dirs> | wc -l)" -eq 0
```

(the 15 directory arguments are spelled out in full in the plan and were pasted unaltered)

Verbatim output:

```
### GATE T1 ###
GATE T1 EXIT: 0
```

**Verdict: PASS.** No `MISSING ROOT` line, so all 15 directories exist; both `test`s held, so zero
files match the 2.3x pin and zero match bare `auth.getUser()`.

### Task 2 gate

Command (verbatim from `92-08-PLAN.md`, run from repo root) — same two greps over the second 15
directories, plus the tag check and the `_shared` / `config.toml` scope guard:

```
for d in supabase/functions/tags-manage ... supabase/functions/working-groups; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <15 dirs> | wc -l)" -eq 0 && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <15 dirs> | wc -l)" -eq 0 && git rev-parse -q --verify refs/tags/phase-92-base >/dev/null && test "$(git diff --name-only phase-92-base -- supabase/functions/_shared ':(exclude)supabase/functions/_shared/auth.ts' supabase/config.toml | wc -l)" -eq 0
```

Verbatim output:

```
### GATE T2 ###
GATE T2 EXIT: 0
```

**Verdict: PASS.** All 15 directories exist; zero 2.3x pins; zero bare `auth.getUser()`;
`phase-92-base` resolves; and zero files under `supabase/functions/_shared` (excluding
`auth.ts`, which is 92-04's) or `supabase/config.toml` differ from `phase-92-base`.

### Extra check I ran that no gate requires — the criterion no gate checks

The brief's un-gated criterion ("every Class-1 edit retains its header-injected client") is
checkable, so I checked it rather than asserting it:

```bash
for d in <all 30>; do f="supabase/functions/$d/index.ts"
  base=$(git show "phase-92-base:$f" | grep -cE 'headers: *\{ *.?Authorization')
  now=$(grep -cE 'headers: *\{ *.?Authorization' "$f")
  [ "$base" != "$now" ] && echo "*** DRIFT: $d base=$base now=$now"
done
```

Verbatim output:

```
=== injected-client site count vs phase-92-base (ALL 30) ===
drift_flag=0 (0 = all 30 unchanged)
```

Zero drift. This is a static site count, not a runtime proof — see WHAT THIS DOES NOT ESTABLISH.

### Extra check — undeclared-token census

The brief warns that a file left referencing an undeclared `token` is broken code every gate here
reports green. Census across all 30 (`const|let token =` declarations, `getUser(token)` calls,
bare `getUser()` calls):

Every one of the 12 Class-1 files reports exactly `const_token=1  getUser(token)=1  bare=0`. No
file has a `token` reference without a declaration, and no file gained a duplicate declaration
(the 11 Class-2 files that already extracted a token still report exactly 1). The 7 files with no
`getUser` at all report `0 / 0 / 0` and were not given a token they would not use.

## Decisions Made

- **`themes` and `word-assistant`: token derived inline.** Both read the header as
  `req.headers.get('Authorization')!` directly inside `createClient` and never bind it to a
  variable. Rather than restructure the file or add a second header read with different semantics,
  I used `const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')` — the same
  header the injected client already reads. Behaviour on a missing header is unchanged: previously
  a bare `getUser()` on a client carrying `Authorization: null` errored into the 401 branch; now
  `getUser('')` errors into the same branch.
- **`word-assistant` placement.** Its `getUser` sits at line 211 while the client is built at 104;
  I confirmed by reading the brace structure that `try {` opens at 103 and `} catch` closes at 230,
  so a declaration adjacent to the call is in the same scope. Declaration placed next to the call,
  keeping the diff local.
- **`team-collaboration`.** Its injected client comes from a module-level
  `getSupabaseClient(authHeader)` factory. The factory was left untouched; only the call site
  gained `const token` and `getUser(token)`.

## Deviations from Plan

### Adaptations within the plan's Class-1 recipe

**1. [Rule 3 - Blocking] Class-1 recipe assumes a named `authHeader`; two files have none**

- **Found during:** Task 2 (themes, word-assistant)
- **Issue:** The plan's Class-1 recipe is literally
  `const token = authHeader.replace('Bearer ', '')`. In `themes/index.ts` and
  `word-assistant/index.ts` there is no `authHeader` binding — the header is read inline inside the
  client's `global.headers`. Emitting the literal line would reference an undeclared identifier,
  which is exactly the silent breakage the brief warns about (no gate here typechecks Deno).
- **Fix:** Derived the token from the same header expression the injected client already uses.
  The client construction was not touched in either file.
- **Files modified:** `supabase/functions/themes/index.ts`,
  `supabase/functions/word-assistant/index.ts`
- **Verification:** Both files show `const_token=1 / getUser(token)=1 / bare=0`; both retain their
  injected client at unchanged site count vs `phase-92-base`.
- **Committed in:** `6a7d7388` (Task 2 commit)

---

**Total deviations:** 1 adaptation, 0 scope additions. **Impact on plan:** none — the adaptation
implements the recipe's intent in two files whose shape the recipe's literal wording did not cover.

## Issues Encountered

- **Caught before commit:** my first edit to `supabase/functions/webhooks/index.ts` added the
  `const token` line but left the call as `getUser()` — precisely the half-applied Class-1 edit
  that would have passed nothing but the specifier gate while leaving an unused variable and an
  unfixed auth gate. Caught by re-reading the edit result before staging and corrected in the same
  uncommitted working state; the file landed correct in `6a7d7388`. It never existed in a commit in
  the broken form. Flagging it because it is the failure mode the brief predicted, and the thing
  that caught it was reading the diff, not a gate.
- **Concurrent lanes:** the pre-commit hook's `lint-staged` step reported "could not find any
  staged files matching configured tasks" on both commits — see WHAT THIS DOES NOT ESTABLISH.

## GATE CONCERN

None. Both `<automated>` gate blocks in `92-08-PLAN.md` were run exactly as written and both
returned 0. No gate text was edited, in this plan or any other.

## STATE.md / ROADMAP.md

Not touched, per the orchestrator brief — the orchestrator owns those. The executor contract's
`state.advance-plan` / `state.update-progress` / `roadmap.update-plan-progress` /
`requirements.mark-complete` steps were deliberately **not** run, because every one of them writes
to `.planning/STATE.md`, `.planning/ROADMAP.md`, or `.planning/REQUIREMENTS.md`. `requirements: [AUTH-02]`
is recorded in this SUMMARY's frontmatter for the orchestrator to act on.

## Next Phase Readiness

- Slice D is source-clean and ready for the `92-09` batch deploy. All 30 functions in this slice
  need deploying — the specifier change only takes effect on redeploy (eszip bundles at deploy time).
- Informational, not my gate: the whole-population derivation
  `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l`
  returned **0** in the shared working tree at 13:52 +0300. That reflects all four slices plus
  92-04 having landed, not slice D alone, and it will need re-deriving by the orchestrator once
  every lane has committed.

## WHAT THIS DOES NOT ESTABLISH

Read this section before treating the two green gates as coverage.

1. **Nothing typechecked or bundled these 30 files.** No `deno check`, no `deno bundle`, no
   `supabase functions deploy` ran. The plan states no gate in this phase does this, and none did.
   My substitute was reading every Class-1 auth block before editing plus the scripted
   declaration/usage census above — that is static text analysis, not a compiler. A type error, a
   scope error the brace-reading missed, or a jsr-vs-esm API difference would not have been caught
   here. It would surface in `92-09`.
2. **The pre-commit hook's green build says nothing about these files.** Its `lint-staged` step
   printed "could not find any staged files matching configured tasks" on both commits — so no
   ESLint and no prettier examined the 30 files. Its `turbo run build` builds `intake-frontend`,
   `intake-backend`, and `agent-runtime`; `supabase/functions` is Deno and is in none of those
   three packages. A green pre-commit here is not evidence about slice D.
3. **Nothing was deployed and nothing was invoked at runtime.** No function was called, no status
   code was observed, no response body was inspected. I have not observed a single `200`, `401`, or
   row count from any of these 30 functions.
4. **The RLS-preservation claim is a static count, not a runtime observation.** "Injected client
   retained" means the per-file count of `headers: { Authorization` sites is identical to
   `phase-92-base`. It does not prove the client is still the one every downstream query uses, and
   it would not catch a hypothetical edit that kept the site count while rewiring which client a
   query runs on. I made no such edit — the full diff inventory above shows no `createClient` line
   on either side except the import — but the count alone is weaker than what a live probe would show.
5. **The `_shared` / `config.toml` scope guard is a whole-tree fact, not a slice-D fact.** It runs
   `git diff` against the shared working tree, which four other lanes are editing concurrently. Its
   0 means nobody has touched `_shared` (except `auth.ts`) or `config.toml` as of my run — it does
   not isolate my contribution, and it could change after I stop.
6. **The whole-population 0 is not mine.** It depends on sibling lanes 92-04..92-07 having landed.
   Only the two slice-scoped gates above are statements about this plan.
7. **No E2E, no Playwright, no browser, no render.** Not in this plan's scope; none attempted.
8. **The two 401-behaviour claims for `themes` / `word-assistant` are reasoned, not measured.** I
   argue from the code that a missing header lands in the same 401 branch before and after. I did
   not send a request without an `Authorization` header to either function to confirm it.

## Self-Check: PASSED

```
FOUND: 5d1bc7b6
FOUND: 6a7d7388
FOUND: 92-08-SUMMARY.md
```

Both task commits resolve in `git log --all`; the SUMMARY exists on disk.

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
