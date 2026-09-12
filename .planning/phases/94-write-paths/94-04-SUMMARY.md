---
phase: 94-write-paths
plan: 04
subsystem: ui
tags: [settings, supabase, postgrest, rls, playwright, notifications, i18n]

requires:
  - phase: 93-trust
    provides: 'D-08 (no server-originated error.message reaches the DOM) and the reload-as-read-back oracle discipline'
provides:
  - "SettingsPage's users write is an UPDATE scoped to the caller's own row — Save reaches the database"
  - 'The notification bridge (applySettingsTogglesToCategoryPrefs) is now reachable and observed to round-trip'
  - 'The save-failure toast renders settings:saveError alone; the raw error goes to console.error'
  - 'frontend/tests/e2e/settings-save.spec.ts — a 2-test reload-persistence oracle for WRITE-05'
affects: [94-11, WRITE-05, settings, notifications]

tech-stack:
  added: []
  patterns:
    - 'reload-as-read-back: a write oracle asserts post-reload state through the app''s own query path, never "no error shown"'
    - 'serial describe for specs that share one fixture row through one mutation'

key-files:
  created:
    - frontend/tests/e2e/settings-save.spec.ts
  modified:
    - frontend/src/pages/settings/SettingsPage.tsx

key-decisions:
  - "D-14 applied as written: .upsert({ id, ... }) became .update({ ... }).eq('id', user.id). No email field was added to the payload — the fix is the verb, not the tuple."
  - 'D-15 honored: steps 2-3 of the mutationFn were left byte-identical. The oracle observes the bridge EFFECT (a toggle round-tripping through a full page reload), not that Save stopped erroring.'
  - 'D-16 population statement lives in the spec header — where the oracle lives — naming Population A as IN and Population B / callback / security-MFA / data-privacy as OUT with reasons.'
  - 'The two tests run in serial mode: both drive the one shared saveMutation against the one fixture row, and fullyParallel let them clobber each other. Observed, not assumed.'

patterns-established:
  - 'Cross-test write races on a shared staging row are a serial-resource problem, diagnosed by running the failing test alone before touching the subject.'

requirements-completed: [WRITE-05]

duration: 42min
completed: 2026-08-16
---

# Phase 94 Plan 04: /settings write path Summary

**`/settings` Save now reaches the database — the `users` write became `.update().eq('id', user.id)` (PostgREST upsert was firing `NOT NULL email` 23502 before conflict resolution), which also unblocked the notification bridge, and a 2-test reload-persistence spec proves both halves survive a full page reload.**

## Performance

- **Duration:** ~42 min
- **Tasks:** 2/2
- **Files modified:** 2 (1 modified, 1 created)

## Gate drill — every gate in this plan, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-04_g1` (plan :94) | `(cd frontend && test "$(grep -v '^[[:space:]]*//' src/pages/settings/SettingsPage.tsx \| grep -cE '\.upsert\(')" -eq 1 && grep -qE "\.eq\('id', *user\.id\)" src/pages/settings/SettingsPage.tsx && test "$(grep -c 'description: detail' src/pages/settings/SettingsPage.tsx)" -eq 0 && pnpm type-check); echo "exit=$?"` → **`94-04_g1 RED exit=1`**. Clause-by-clause measurement on the same tree, run first so the red is attributable to the SUBJECT and not to tooling (C2): non-comment `.upsert(` count = **`2`** (gate wants 1) → this clause is what fails; `.eq('id', user.id)` count = **`1`**; `description: detail` count = **`1`** (gate wants 0). | Same command verbatim after Task 1: stdout `> intake-frontend@1.0.0 type-check … > tsc --noEmit` then **`94-04_g1 GREEN exit=0`**. Re-run at HEAD after both commits: **`94-04_g1 final exit=0`**. | Never observed green before this plan. `pnpm type-check` resolves in `frontend/package.json` as `tsc --noEmit` — verified before running (C3): `node -e "…" → type-check = tsc --noEmit`. **Clause 2 is vacuous — see GATE CONCERN below.** |
| `94-04_g2` (plan :118) | `(test -f frontend/tests/e2e/settings-save.spec.ts && cd frontend && OUT=$(pnpm exec playwright test tests/e2e/settings-save.spec.ts --reporter=line 2>&1) && echo "$OUT" \| grep -qE '(^\|[^0-9])2 passed'); echo "exit=$?"` → **`94-04_g2 RED exit=1`**, with `ls -l frontend/tests/e2e/settings-save.spec.ts` → `No such file or directory`. The existence precondition is what fails, which is the correct red for a not-yet-authored spec. | Same command verbatim after Task 2: **`94-04_g2 exit=0`**. Human-readable run: `Running 2 tests using 1 worker` … `[1/2] … profile save survives reload` … `[2/2] … notification toggle survives reload (the D-15 bridge effect)` … **`2 passed (17.0s)`**. | Never observed green before this plan. Count pinned independently (C6): `pnpm exec playwright test tests/e2e/settings-save.spec.ts --list` → `Total: 2 tests in 1 file`, both under `[chromium]`. The frontend config has **no** dependency projects (auth is `globalSetup`, not a `setup` project), so `--no-deps` is not needed and `--list` is not inflated. |

### Instrument tests performed (per the phase's standing traps)

- **The grep clauses were instrument-tested in both directions before being trusted.** On the undone
  tree they returned `2`, `1`, `1` — live numbers, not zeros. After the edit they return `1`, `1`, `0`.
  A clause that could only ever read `0` was therefore ruled out by measurement, not by reading.
- **Exit codes were captured directly**, never through a pipe: every gate run ends with
  `); echo "exit=$?"` on the whole `&&` chain.
- **`test -f` runs FIRST in `g2`**, and only one spec path is passed, so the "≥2 paths, ≥1 match →
  silent partial run that exits 0" failure mode cannot apply here.
- **The C9b consumer sweep used `find … | xargs grep`** (not a recursive `grep` from the repo root,
  which this repo's ugrep wrapper filters through `.gitignore`), and was proven live before its zero
  was believed: the same invocation shape returned two files for `SettingsPage`
  (`tests/e2e/92-signout.spec.ts`, `frontend/tests/e2e/settings-page.spec.ts`) and zero for
  `saveError|Failed to save settings`. **No shipped test asserts the save toast's description**, so
  removing it turns nothing red. `frontend/tests/e2e/settings-page.spec.ts` is a **NAMED
  non-consumer** — it asserts the 240+1fr layout and the mobile pill nav only, never Save.

## GATE CONCERN

**`94-04_g1`, clause 2 — `grep -qE "\.eq\('id', *user\.id\)"` is vacuous.** Not edited; recorded for
a ruling.

Evidence, at the phase base tag:

```
$ git show phase-94-base:frontend/src/pages/settings/SettingsPage.tsx | grep -nE "\.eq\('id', *user\.id\)"
155:        .eq('id', user.id)
```

Line 155 is the **SELECT** in the settings `useQuery` — it has carried `.eq('id', user.id)` since
before this phase. The clause was therefore already green on the undone tree and cannot distinguish
a repaired file from a broken one: it would still pass if the `users` write had been left as the
23502 upsert. It is not a regression guard either, because nothing in this plan touches line 155.

The gate as a whole still fired correctly — clause 1 (`.upsert(` count `2 → 1`) and clause 3
(`description: detail` `1 → 0`) both go red on the undone tree and green on the done tree, and they
are what carried both observations above. So `94-04_g1` is sound overall; clause 2 simply
contributes nothing. Flagged rather than repaired, per the zero-gate-edits rule.

## Task Commits

1. **Task 1: the users write becomes UPDATE; the failure toast stops leaking** — `f0e1c56a` (fix)
2. **Task 2: the settings-save reload-persistence spec (Wave 0)** — `21f7dd5f` (test)

Both were committed with explicit pathspecs (`git commit … -- <path>`) on the shared
`milestone/v10.0-trust` tree, and each was verified with `git show --stat HEAD` plus a
`git show HEAD:<file>` content read. Neither swept in a concurrent lane's work: Task 1's commit shows
`1 file changed` while another lane's `frontend/tests/component/IntakeForm.test.tsx` sat modified in
the tree, and Task 2's shows `1 file changed` while another lane's
`frontend/src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts` sat **staged** in the index —
and was still staged afterwards.

Scope diff is exactly the plan's `files_modified`:

```
$ git diff --name-only phase-94-base -- frontend/src/pages/settings/SettingsPage.tsx frontend/tests/e2e/settings-save.spec.ts
frontend/src/pages/settings/SettingsPage.tsx
frontend/tests/e2e/settings-save.spec.ts
```

## Files Created/Modified

- `frontend/src/pages/settings/SettingsPage.tsx` — step 1 of `saveMutation` is now
  `.from('users').update({…}).eq('id', user.id)`; the stale repair comment now names the 23502
  defect this commit removes; `onError` drops the raw description.
- `frontend/tests/e2e/settings-save.spec.ts` — 2-test reload-persistence oracle with the D-16
  population statement in its header.

## Accomplishments

- **The write verb changed, and nothing else about the tuple did.** The payload lost the `id` key
  (it moved into `.eq()`) and gained nothing — in particular **no `email` field**. Confirmed in the
  committed blob.
- **The bridge was proven reachable by observing its effect, not its absence of error.** Test 2
  flips the `Mentions` toggle, saves, does a full `page.reload()`, re-opens the Notifications
  section (the reload resets `activeSection` to `profile`), and asserts `aria-checked` held. That
  round trip only survives if step 2 wrote `notification_category_preferences` — the toggle maps to
  the single cell (`mentions`, `in_app_enabled`), which `SETTINGS_NOTIFICATION_PREF_MAP` makes
  lossless.
- **Steps 2-3 are byte-identical** — `git show --stat` reports 28 insertions / 20 deletions, all in
  the step-1 block, its comment, and `onError`.

## Decisions Made

- **The two tests run serially.** See "Issues Encountered" — this was diagnosed by measurement, not
  chosen defensively.
- **No inline `signInInline` helper was added.** `E2ECRED-01` forbids depending on the Playwright
  **`setup` project**; this spec runs under `frontend/playwright.config.ts`, whose auth is a
  `globalSetup` that performs one real login from `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`. That is
  a real login, it is not the root config's `setup` project, and it worked on every run recorded
  here. Adding a redundant second login path would have been speculative. **No credential value is
  echoed anywhere** — not in the spec, not in this summary, not in any command run.
- **The spec asserts the fixture's `full_name` is non-empty before mutating it.** A blank name would
  make the _restore_ save fail zod's `min(1)` and leave staging dirty; asserting is honest, whereas
  inventing a fallback name to restore to would be fabricating data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The two tests raced each other on the one shared fixture row**

- **Found during:** Task 2 (first full-gate run)
- **Issue:** The gate run failed with `1 failed, 1 passed`. Test 1 read back the **original**
  name after reload:
  `Expected: "Khalid Alzahrani P94-1786889511466"` / `Received: "Khalid Alzahrani"`, timeout 15000ms.
  This is precisely the shape of a silently-failing write (an `.update()` matching zero rows under
  RLS returns no error), so it could not be assumed to be a test artifact.
- **Diagnosis — the discriminating run, before touching the subject:** the same test alone,
  `pnpm exec playwright test tests/e2e/settings-save.spec.ts --grep "profile save survives reload"`
  → `1 passed (8.4s)`. The `users` UPDATE persists. The failure was the sibling: the config sets
  `fullyParallel: true`, both tests drive the **same** `saveMutation`, and step 1 writes `full_name`
  from whatever that test's form loaded — so the toggle test's save (and its restore save) rewrote
  `full_name` with its own stale copy over test 1's write.
- **Fix:** `test.describe.configure({ mode: 'serial' })`, with the observation recorded in the
  comment above it. The fixture row is a serial resource.
- **Files modified:** `frontend/tests/e2e/settings-save.spec.ts`
- **Verification:** gate `94-04_g2` re-run verbatim → `exit=0`; `2 passed (17.0s)`.
- **Committed in:** `21f7dd5f` (part of the Task 2 commit)

**2. [Rule 3 - Blocking] `onError`'s `detail` local became unused**

- **Found during:** Task 1
- **Issue:** Removing `description: detail` left
  `const detail = error instanceof Error ? error.message : null` with no reader, which
  `@typescript-eslint/no-unused-vars` errors on.
- **Fix:** Deleted the binding. `console.error(error)` already carries the full error object, so the
  diagnostic is not weakened.
- **Files modified:** `frontend/src/pages/settings/SettingsPage.tsx`
- **Verification:** `pnpm type-check` clean inside gate `94-04_g1`; pre-commit hooks passed.
- **Committed in:** `f0e1c56a`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking). **Impact:** no scope creep — both are inside
the plan's two declared files and neither changed what the plan asked for.

## Issues Encountered

- **The index lock.** `git commit` for Task 2 failed once with
  `fatal: Unable to create '…/.git/index.lock': File exists` — a concurrent lane held it. Waited
  (lock cleared after 7s) and retried. No lock was removed or forced.
- **`pnpm type-check` inside `g1` covers the whole `frontend` workspace on a tree other lanes are
  editing concurrently.** It was green at the moment of the Task 1 edit and green again at HEAD after
  both commits. If a later lane introduces a frontend type error, `94-04_g1` will go red for a cause
  outside this plan's two files; the scope diff above is the discriminator.

## Known Stubs

None.

## Threat Flags

None — no new security surface. Both registered threats were mitigated as planned:

- **T-94-06 (Elevation of Privilege, users write):** the write is `.update(…).eq('id', user.id)`
  under the existing `users_update_self` policy; `email` is never written from the client.
- **T-94-07 (Information Disclosure, save-failure toast):** the raw description is gone;
  `t('saveError')` renders alone; the error object goes to `console.error`.

## Intended-broken register

Nothing on the intended-broken list was touched. No repair was made outside this plan's two files.

## BLOCKED

None.

## Self-Check

- `[ -f frontend/tests/e2e/settings-save.spec.ts ]` → FOUND (and `git show HEAD:` reads it back).
- `git show --stat f0e1c56a` → FOUND, 1 file changed.
- `git show --stat 21f7dd5f` → FOUND, 1 file changed, `create mode 100644`.
- Both gates re-run verbatim at HEAD → `94-04_g1 final exit=0`, `94-04_g2 exit=0`.

## Self-Check: PASSED

## Next Phase Readiness

WRITE-05's criterion 5 first half now has a behavioural oracle that a regression turns red. Carried
forward to `94-11`'s closing derivations: the **D-16 population statement** (restate it there), and
the **GATE CONCERN** above (`94-04_g1` clause 2 is vacuous — a ruling, not an edit).

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
