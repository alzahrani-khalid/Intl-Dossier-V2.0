---
phase: 92-session-integrity-edge-function-auth
plan: 05
subsystem: auth
tags: [supabase-js, deno, edge-functions, jsr, gotrue, rls]

# Dependency graph
requires:
  - phase: 92-01
    provides: phase-92-base tag + the AUTH-02 derivation command (D-08) used as this slice's acceptance
provides:
  - 33 edge functions (alphabetical slice access-review-detail → document-versions) off the floating 2.3x pin and onto jsr:@supabase/supabase-js@2
  - 15 Class-1 functions converted from bare getUser() to explicit getUser(token)
  - header-injected clients preserved verbatim in all 22 files that had one
affects: [92-09 (batch deploy of the sweep), 92-04, 92-06, 92-07, 92-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Class-1 edit: specifier bump + `const token = authHeader.replace(...)` + `getUser(token)`, injected client untouched'
    - 'Class-2 edit: specifier bump only'

key-files:
  created:
    - .planning/phases/92-session-integrity-edge-function-auth/92-05-SUMMARY.md
  modified:
    - supabase/functions/{33 slice-A functions}/index.ts

key-decisions:
  - "data-library was treated as a Class-1 variant: it forwards the caller header inline (`req.headers.get('Authorization')!`) with no `authHeader` local, so the token is derived at the call site using `?.`/`??` rather than inventing an `authHeader` binding — this preserves its existing behavior when no header is present"
  - 'Six files in this slice have no getUser call at all; they were bumped as Class 2 rather than having an auth gate invented for them'

patterns-established:
  - 'Per-file class decided by reading the auth call, never inferred from a list'
  - 'Specifier bump applied by scripted sed only after verifying each file has exactly one occurrence; every auth-block edit hand-applied'

requirements-completed: [AUTH-02]

# Metrics
duration: ~20min
completed: 2026-08-15
---

# Phase 92 Plan 05: AUTH-02 Sweep Slice A Summary

**33 edge functions (access-review-detail → document-versions) moved off the floating `https://esm.sh/@supabase/supabase-js@2.39.x` pin to `jsr:@supabase/supabase-js@2`, with 15 bare `getUser()` calls converted to explicit `getUser(token)` and every header-injected client left byte-identical so RLS scoping survives.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2/2
- **Files modified:** 33 `index.ts` + this SUMMARY

## Task Commits

1. **Task 1: Slice A first half (17 files)** — `ed099ad8` (refactor)
2. **Task 2: Slice A second half (16 files)** — `3cdeb094` (refactor)

Both commits used explicit pathspecs (`git commit -- <33 explicit paths>`); `git show --stat HEAD`
after each confirmed exactly the intended file set and nothing from a sibling lane.

## Per-file class tally (decided by reading each file's auth call)

**Class 1 — 15 files** (pinned + bare `getUser()` + a client that forwards the caller header):
specifier bump + `const token = authHeader.replace('Bearer ', '')` + `getUser(token)`,
`{ global: { headers: { Authorization: authHeader } } }` untouched.

| Function               | Base pin | Task | Injected-header lines (base → now) |
| ---------------------- | -------- | ---- | ---------------------------------- |
| access-review-detail   | 2.39.0   | 1    | 1 → 1                              |
| ai-interaction-logs    | 2.39.0   | 1    | 1 → 1                              |
| ai-summary-generate    | 2.39.0   | 1    | 1 → 1                              |
| approve-role-change    | 2.39.0   | 1    | 1 → 1                              |
| assign-role            | 2.39.0   | 1    | 1 → 1                              |
| auth-step-up-complete  | 2.39.0   | 1    | 1 → 1                              |
| auth-step-up-initiate  | 2.39.0   | 1    | 1 → 1                              |
| auth-verify-step-up    | 2.39.0   | 1    | 1 → 1                              |
| certify-user-access    | 2.39.0   | 2    | 1 → 1                              |
| complete-access-review | 2.39.0   | 2    | 1 → 1                              |
| create-user            | 2.39.0   | 2    | 1 → 1                              |
| data-export            | 2.39.0   | 2    | 1 → 1                              |
| data-import            | 2.39.0   | 2    | 1 → 1                              |
| data-library           | 2.39.0   | 2    | 1 → 1 (variant — see below)        |
| delegate-permissions   | 2.39.0   | 2    | 1 → 1                              |

**Class 2 — 18 files**, specifier bump only. Two sub-shapes:

_Already passing a token to `getUser` (12):_

| Function                              | Base pin | Task |
| ------------------------------------- | -------- | ---- |
| assignments-checklist-create-item     | 2.39.0   | 1    |
| assignments-checklist-import-template | 2.39.0   | 1    |
| assignments-checklist-toggle-item     | 2.39.0   | 1    |
| assignments-comments-create           | 2.39.0   | 1    |
| assignments-comments-reactions-toggle | 2.39.0   | 1    |
| assignments-complete                  | 2.39.0   | 1    |
| assignments-escalate                  | 2.39.0   | 1    |
| assignments-observer-action           | 2.39.0   | 1    |
| assignments-related-get               | 2.39.0   | 1    |
| calendar-conflicts                    | 2.39.0   | 2    |
| content-expiration                    | 2.39.3   | 2    |
| document-versions                     | 2.39.0   | 2    |

`content-expiration` passes the token inline —
`getUser(authHeader.replace('Bearer ', ''))` — which is already token-passing, so it took the
bump only. No `const token` was inserted where one was not needed.

_No `getUser` call in the file at all (6):_

| Function                     | Base pin | Task | What it does instead                                             |
| ---------------------------- | -------- | ---- | ---------------------------------------------------------------- |
| bot-notification-dispatcher  | 2.39.3   | 2    | no caller-auth gate; builds its own outbound `Bearer` headers    |
| briefing-packs-list          | 2.39.3   | 2    | 401s on missing header, then relies on the injected client + RLS |
| calculate-health-score       | 2.39.0   | 2    | 401s on missing header; service-role client for writes           |
| content-expiration-processor | 2.39.3   | 2    | service-role, cron-shaped                                        |
| countries                    | 2.39.0   | 2    | injected client (inline header), no explicit auth call           |
| detect-overdue-commitments   | 2.39.7   | 2    | service-role / anon-key outbound calls                           |

These six were **not** given an invented auth gate — the plan's edit spec is a specifier bump plus
a `getUser` conversion where a `getUser` exists, and adding a gate where none existed is out of scope.

## Deviations from Plan

### 1. `data-library` — Class-1 variant, token derived at the call site

- **Found during:** Task 2
- **Issue:** The plan's Class-1 recipe assumes an `authHeader` local. `data-library` has none: its
  client is built with `headers: { Authorization: req.headers.get('Authorization')! }` inline
  (`index.ts:64-71`) and the bare `getUser()` sits ~180 lines later inside the upload branch.
  It does forward an Authorization header, so it is **not** the "no Authorization header anywhere"
  anomaly the plan says to stop on.
- **Fix:** derived the token at the call site instead of inventing an `authHeader` binding:
  ```ts
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: user } = await supabaseClient.auth.getUser(token)
  ```
  The `?.`/`??` form is deliberate: a bare `.replace()` on a null header would throw into the
  surrounding `try` and turn today's "no user → `uploaded_by` undefined" path into a 500. The
  chosen form preserves existing behavior exactly.
- **Injected client:** untouched (verified 1 → 1 header line vs `phase-92-base`).
- **Committed in:** `3cdeb094`

**Total deviations:** 1 (a per-file adaptation of the Class-1 recipe, not a scope change).
No auto-fixes under Rules 1–3 were needed; no Rule-4 architectural questions arose.

## Anomalies

**None of the "bare `getUser()` with no Authorization header anywhere" kind.** Every one of the 15
Class-1 files forwards a caller header. No file required stopping for the orchestrator.

## GATE CONCERN

None. No `<automated>` gate text was edited, in this plan or any other.

## Gates

Both gates are the plan's `<automated>` text run verbatim from the repo root, after both commits
landed. They are `test`-chains: **on success they emit no stdout** — the exit code is the entire
observable. Both are recorded below with their real (empty) output.

### Gate 1 — Task 1 (17 dirs exist; 0 files pin 2.3x; 0 files have bare `auth.getUser()`)

```bash
for d in supabase/functions/access-review-detail supabase/functions/ai-interaction-logs supabase/functions/ai-summary-generate supabase/functions/approve-role-change supabase/functions/assign-role supabase/functions/assignments-checklist-create-item supabase/functions/assignments-checklist-import-template supabase/functions/assignments-checklist-toggle-item supabase/functions/assignments-comments-create supabase/functions/assignments-comments-reactions-toggle supabase/functions/assignments-complete supabase/functions/assignments-escalate supabase/functions/assignments-observer-action supabase/functions/assignments-related-get supabase/functions/auth-step-up-complete supabase/functions/auth-step-up-initiate supabase/functions/auth-verify-step-up; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <same 17 dirs> | wc -l)" -eq 0 && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <same 17 dirs> | wc -l)" -eq 0
```

<!-- prettier-ignore -->
Verbatim output:

```
########## GATE 1 (Task 1) ##########
GATE1_EXIT=0
```

**Exit code: 0. Verdict: PASS.** (No stdout between the banner and the exit line — that is the
gate's actual output, not an omission.)

### Gate 2 — Task 2 (16 dirs exist; 0 pins; 0 bare calls; `phase-92-base` resolves; 0 changed files under `_shared` excluding `auth.ts`, and `config.toml` unchanged)

```bash
for d in supabase/functions/bot-notification-dispatcher ... supabase/functions/document-versions; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <same 16 dirs> | wc -l)" -eq 0 && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <same 16 dirs> | wc -l)" -eq 0 && git rev-parse -q --verify refs/tags/phase-92-base >/dev/null && test "$(git diff --name-only phase-92-base -- supabase/functions/_shared ':(exclude)supabase/functions/_shared/auth.ts' supabase/config.toml | wc -l)" -eq 0
```

<!-- prettier-ignore -->
Verbatim output:

```
########## GATE 2 (Task 2) ##########
GATE2_EXIT=0
```

**Exit code: 0. Verdict: PASS.**

> Both gate commands were run with the full literal directory lists exactly as written in the plan;
> the `<same N dirs>` / `...` elisions above are only to keep this document readable. The commands
> executed were byte-identical to the plan's `<automated>` text.

### Byte-identity re-run (proof the two gates above are the plan's, not a paraphrase)

Rather than trusting a transcription, both gate bodies were extracted straight out of
`92-05-PLAN.md` and `eval`'d:

```bash
perl -ne 'if (m{<automated>(.*)</automated>}) { print "$1\n" }' 92-05-PLAN.md > /tmp/92-05-gates.txt
i=0; while IFS= read -r g; do i=$((i+1)); eval "$g"; echo "GATE${i}_EXIT=$?"; done < /tmp/92-05-gates.txt
```

<!-- prettier-ignore -->
Verbatim output:

```
gates extracted:        2
md5 of extracted gate bodies:
845ab62b37563b6030749a68353c2df3
######## GATE 1 (verbatim from .planning/phases/92-session-integrity-edge-function-auth/92-05-PLAN.md) ########
GATE1_EXIT=0
######## GATE 2 (verbatim from .planning/phases/92-session-integrity-edge-function-auth/92-05-PLAN.md) ########
GATE2_EXIT=0
```

**2 gates found, 2 executed, both exit 0.** The plan file is unmodified in the working tree
(`git status --short` on it is empty) and its last commit is `f3af109a` (05:44), which predates
this execution — so the gates run are the current committed gate text, unedited by me.

### Supplementary checks (mine, not gates)

Run to protect the criterion no gate in this phase checks:

```
=== full-slice (33) residual 2.3x pins ===
       0
=== full-slice (33) residual bare auth.getUser() ===
       0
=== cors imports still present across the 33 ===
      33
```

Per-file injected-header line count (`headers: { Authorization:`) compared against
`git show phase-92-base:<path>` for all 33 files: **every count is unchanged** (22 files at 1 → 1,
11 files at 0 → 0). No `global:` option, service-role client, or CORS import was removed.

Diff shape vs `phase-92-base`: Class-2 files are `2 +-` (one import line), Class-1 files are
`6 ++++--` (import line + two added lines + the `getUser` line), `data-library` is `5 +++--`.
No file shows an unexpected hunk.

## Issues Encountered

1. **zsh does not word-split unquoted variables.** The first sweep attempt used
   `for f in $FILES`, which zsh passed as a single 33-name word — `sed` failed with
   "File name too long" and **zero files were modified**. Caught by re-checking
   `git diff --name-only` before proceeding; redone with a literal in-loop list.
   Recorded because it is the kind of failure that silently reads as "done".
2. **`.git/index.lock` held by a sibling lane** during the Task-2 commit
   (`fatal: Unable to create '.../.git/index.lock': File exists`). Waited for it to clear,
   then committed. No force, no lock removal.

## Concurrency notes

At the end of this plan the working tree still carries another lane's uncommitted work —
`frontend/src/store/authStore.ts` (modified) and
`.planning/phases/.../92-DEPLOY-LEDGER.md` (untracked). Neither is mine and neither was touched,
staged, or committed. Nothing was stashed, checked out, restored, or cleaned at any point.

## WHAT THIS DOES NOT ESTABLISH

This is a **static, code-only** result. Specifically, it does **not** establish:

- **That any of these 33 functions actually work.** Nothing was deployed. `supabase functions deploy`
  was never run — that is plan `92-09`'s job. The deployed staging functions still run the old
  bundles.
- **That the migrated code compiles or bundles.** No gate in this phase typechecks or bundles an
  edge function, and I ran no `deno check`, no `deno bundle`, and no `supabase functions serve`.
  The `const token` declarations were placed by reading each file, and each edited region was
  re-read from the committed object — but that is human/model inspection, not a compiler.
- **That RLS scoping actually survives at runtime.** What was verified is _structural_: the
  `headers: { Authorization: ... }` line count per file is unchanged against `phase-92-base`, and
  the diffs contain no removal of a `global:` option. Nobody executed a query as a real user and
  observed non-empty rows. The `200`-with-`[]` failure this criterion exists to catch would only
  surface on a live call.
- **That `getUser(token)` returns a user.** No token was minted, no GoTrue call was made. The
  `@2` wrapper's behavior is taken from the phase's prior research, not re-measured here.
- **That `data-library`'s adapted edit behaves identically to before.** The `?.`/`??` reasoning is
  argued from the source, not observed. Its upload branch was not exercised.
- **Anything about the other 100 files in the AUTH-02 population.** This slice is 33 of 133. The
  derivation grep was run **slice-scoped**, not repo-wide; the repo-wide count is the orchestrator's
  to re-derive once `92-04` and `92-06`..`92-08` land.
- **Anything about the six no-`getUser` functions' auth posture.** They were bumped, not audited.
  Whether `bot-notification-dispatcher`, `content-expiration-processor`, or
  `detect-overdue-commitments` _should_ have a caller-auth gate is a question this plan did not ask
  and did not answer.
- **Test results of any kind.** No unit, integration, or E2E test was run in this plan. Playwright
  was not invoked (`E2ECRED-01` blocks the `setup` project regardless).

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
