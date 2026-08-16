---
phase: 94-write-paths
plan: 02
subsystem: ui
tags: [zod, react-hook-form, intake, validation, uuid, vitest]

requires:
  - phase: 86-user-management
    provides: 'the standing law "never .uuid() a dossier id" — 35 of 44 staging dossiers carry non-RFC seed ids'
provides:
  - '/intake/new accepts any live staging dossier id (RFC check removed, requiredness kept)'
  - 'a picked dossier clears the stale required-dossier error without a second submit'
  - 'REQUIREMENTS.md WRITE-03 states the measured zod 4.3.6 mechanism instead of the falsified field-mismatch one'
affects: [94-write-paths, intake, dossier-linking]

tech-stack:
  added: []
  patterns:
    - 'Dossier-id validation is z.string().min(1, …) — never .uuid(); the staging seed set is not RFC-9562'
    - 'Component tests exercise the REAL Zod schema with the selector + API mocked (C9b real oracle)'

key-files:
  created: []
  modified:
    - frontend/src/components/intake-form/IntakeForm.tsx
    - frontend/tests/component/IntakeForm.test.tsx
    - .planning/REQUIREMENTS.md

key-decisions:
  - 'The filed WRITE-03 field-name-mismatch diagnosis is measured FALSE — picker and schema both use dossierId; corrected in the same commit as the fix (RULING-P94-04 order 1)'
  - 'Did NOT run `gsd-sdk query requirements.mark-complete WRITE-03` — see "Register closure NOT performed" below; orchestrator decision'

patterns-established:
  - 'Same-commit register correction: an overturned diagnosis is rewritten in the commit that overturns it, with both sides carrying real content change'

requirements-completed: [WRITE-03]

duration: 8 min
completed: 2026-08-16
---

# Phase 94 Plan 02: Intake dossier-id schema relaxation Summary

**`/intake/new` now submits with real staging dossier ids: Zod 4.3.6's RFC-9562-strict `.uuid()` was rejecting 35 of 44 seeded dossier ids and rendering "At least one dossier is required" over a linked dossier — replaced with `.min(1)` plus revalidating `setValue`, and the falsified WRITE-03 register prose corrected in the same commit.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-16T14:05:00Z (approx — first gate drill vitest `Start at 17:07:36` local)
- **Completed:** 2026-08-16T14:13:17Z
- **Tasks:** 2
- **Files modified:** 3

## GATE DRILL — both directions, real output

Both gates were observed RED on the undone tree **before** the work and GREEN **after**. Neither
gate was green before the work, so neither is a regression guard and neither is vacuous.

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| ---- | ------------------------------------- | -------------------------------------- | ----- |
| `94-02_g1` (plan :98) | `cd frontend && pnpm exec vitest run tests/component/IntakeForm.test.tsx && test "$(grep -cE "setValue\('dossierId'.*shouldValidate: true" src/…/IntakeForm.tsx)" -ge 2 && test "$(grep -cE "dossierId: z\.string\(\)\.uuid" src/…/IntakeForm.tsx)" -eq 0 && grep -q 'b0000001-0000-0000-0000-000000000005' tests/component/IntakeForm.test.tsx && pnpm type-check` → `Test Files 1 passed (1) / Tests 2 passed (2)` then `GATE_EXIT=1` | same command verbatim → `Test Files 1 passed (1) / Tests 4 passed (4)` … `> tsc --noEmit` … `GATE_EXIT=0` | **C2 satisfied — red for its SUBJECT, not for tooling.** The vitest step *passed* in the red run, so the chain reached its assertion of record; the failure is `test 0 -ge 2` on the `shouldValidate` clause. Instrument-tested in both directions first (below). |
| `94-02_g2` (plan :122) | `grep -q 'RFC-9562' .planning/REQUIREMENTS.md && grep -q '35 of 44' .planning/REQUIREMENTS.md` → `exit=1`; per-clause counts `RFC-9562`→`0` (exit 1), `35 of 44`→`0` (exit 1) | same command verbatim → `exit=0`; per-clause counts `RFC-9562`→`1`, `35 of 44`→`1` | Positive control on the same file in the same run: `grep -c 'WRITE-03' .planning/REQUIREMENTS.md` → `2`, exit 0. So the zeros were real absences, not a blind instrument. |

### Instrument tests run BEFORE trusting any zero

`grep` here is a ugrep wrapper that honours `.gitignore`; every clause was exercised against a token
known to be present in the same file before its zero was believed.

```
--- POSITIVE CONTROL: token known present ---
grep -cE "dossierId: z\.string\(\)\.uuid" src/components/intake-form/IntakeForm.tsx  -> 1   exit=0
grep -cE "shouldValidate: true"           src/components/intake-form/IntakeForm.tsx  -> 2   exit=0
--- the gate's own clauses (expected 0 on the undone tree) ---
grep -cE "setValue\('dossierId'.*shouldValidate: true" src/…/IntakeForm.tsx          -> 0   exit=1
grep -c 'b0000001-0000-0000-0000-000000000005' tests/component/IntakeForm.test.tsx   -> 0   exit=1
```

Note on the g1 `shouldValidate` clause: the sibling `requestType`/`urgency` precedents are
**multi-line** `setValue(…, { shouldValidate: true, shouldDirty: true })` calls, which the gate's
single-line regex cannot see. Both `dossierId` sites were therefore written single-line, exactly as
the plan's action text requires ("single-line so the gate can see the option").

### One discarded measurement, recorded rather than hidden

An intermediate red-direction run used `--reporter=basic` to get per-test names. Vitest 4.1.7 has no
such reporter: the run died with `Error: Failed to load custom Reporter from basic` and exited `1`.
That exit was **UNABLE TO MEASURE, not a red** (GATE-STANDARD C2 corollary — a crash recorded _as_
the red is instance 6 of the phase's defect class). It was discarded and the run redone with the
default reporter, output redirected to a file so the exit code was captured **directly and never
through a pipe**:

```
VITEST_EXIT=1
 ❯ tests/component/IntakeForm.test.tsx (4 tests | 2 failed) 2462ms
     × accepts a non-RFC-9562 staging dossier id and submits (real zod schema) 1269ms
     × clears the dossier validation error as soon as a dossier is picked 1069ms
 Test Files  1 failed (1)
      Tests  2 failed | 2 passed (4)
```

Exactly the two new cases fail; the two pre-existing cases (including the mandated-surviving "zod
blocks submit" case) pass. After the fix: `VITEST_EXIT=0`, `Tests 4 passed (4)`.

## TDD gate sequence

| gate     | commit                       | evidence                                           |
| -------- | ---------------------------- | -------------------------------------------------- |
| RED      | `fdc23dd537cd` `test(94-02)` | `Tests 2 failed \| 2 passed (4)`, exit 1           |
| GREEN    | `6d0456699e2c` `fix(94-02)`  | `Tests 4 passed (4)`, exit 0; `tsc --noEmit` clean |
| REFACTOR | —                            | not needed; no cleanup pass produced changes       |

**TDD Gate Compliance note:** the GREEN commit is typed `fix(…)` rather than `feat(…)`. The change
repairs broken behaviour on an existing surface, so `fix` is the accurate type per the executor's
commit-type table; the RED→GREEN ordering the gate exists to enforce is intact and shown above.

## Task Commits

1. **Task 1 (RED half): failing non-RFC-9562 cases on the real-schema oracle** — `fdc23dd537cdba2bef6d57a0eea2e00984221494` (test)
2. **Task 1 (GREEN half) + Task 2, one commit as required** — `6d0456699e2cf090a050cfb880f0bbd2dabc9630` (fix)

### The same-commit requirement, checked mechanically

`RULING-P94-04` cross-cutting order 1 requires the register correction and the code fix in **one**
commit, and hard rule 8 requires both sides to carry **real content change** (a `touch` or a reformat
does not count). `git show --numstat --format= 6d045669`:

```
4	1	.planning/REQUIREMENTS.md
8	4	frontend/src/components/intake-form/IntakeForm.tsx
```

Both sides, both with non-zero insertions and deletions, in the same commit.

## Files Created/Modified

Pinned to the commit sha, not to HEAD — HEAD moved under this plan while it ran (see Concurrency).

- `frontend/src/components/intake-form/IntakeForm.tsx` (`6d045669`) — `:53` schema `.uuid()` →
  `.min(1)`; `{ shouldValidate: true }` added to both `setValue('dossierId', …)` sites (`:82`, `:85`).
- `frontend/tests/component/IntakeForm.test.tsx` (`fdc23dd5`) — selector stub now surfaces the
  `error` prop and drives the form's real `handleDossierChange`; two new cases.
- `.planning/REQUIREMENTS.md` (`6d045669`) — WRITE-03 entry rewritten with the zod derivation inline.

## Accomplishments

- **The filed diagnosis was falsified, not implemented.** WRITE-03 was filed as "the dossier picker
  writes to the RHF field the schema reads" — a field-name mismatch. There is none: the picker writes
  `dossierId` (`IntakeForm.tsx:82`) and the schema reads `dossierId` (`:53`). The register now says so.
- **The real mechanism, now fixed:** Zod 4.3.6's `.uuid()` enforces RFC-9562 version/variant bits, and
  35 of 44 staging dossiers are seeded with a version nibble of `0` — OECD's
  `b0000001-0000-0000-0000-000000000005` among them. The rejection message is
  `dossier-context:validation.dossier_required` ("At least one dossier is required"), rendered at
  `:370`, while the badge at `:373-389` renders from the separate `selectedDossiers` React state.
  That is the audit's exact "Linked to: OECD" + "At least one dossier is required" coexistence.
- **Requiredness kept.** `z.string().min(1, …)` removes the RFC check and nothing else; an empty
  `dossierId` still blocks submit, proven by the pre-existing case surviving green.
- **Server-side validation untouched** (`T-94-03` mitigation, V5): `intake-tickets-create` was not
  edited. The relaxation is client-side only.
- **Zero new i18n keys.** The existing `dossier-context:validation.dossier_required` message became
  truthful rather than being replaced.

## Threat model discharge

| Threat ID | Disposition | Evidence                                                                                                                             |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `T-94-03` | mitigate    | `min(1)` keeps requiredness (the "zod blocks submit" case still passes); `supabase/functions/intake-tickets-create` not in the diff. |
| `T-94-SC` | accept      | Zero package installs. `git show --stat 6d045669` and `fdc23dd5` list no `package.json` / lockfile change.                           |

## C9b consumer sweep (D-28 mock-vs-real column included)

Run with the roots **derived**, never hardcoded — `find . -maxdepth 3 -type d -name tests` returns
**four** roots (`./frontend/tests`, `./tests`, `./backend/tests`, `./e2e/tests`), which is the
population the GATE-STANDARD amendment exists to enforce.

<!-- prettier-ignore -->
| consumer | how coupled | mock or real | disposition |
| -------- | ----------- | ------------ | ----------- |
| `frontend/tests/component/IntakeForm.test.tsx` | imports `IntakeForm`, exercises the REAL Zod schema | **REAL schema** (selector + `useIntakeApi` mocked) | updated in the SAME task; its re-run is the plan's acceptance criterion |
| `frontend/tests/a11y/intake-accessibility.spec.ts` | navigates `/intake/new` | — | **NAMED non-consumer**: `grep -ci dossier` → `0`. Asserts nothing about dossier validation. |
| `frontend/tests/e2e/convert-artifact.spec.ts` | navigates `/intake/new` | — | **NAMED non-consumer**: `grep -ci dossier` → `0`. |
| `frontend/tests/e2e/handle-duplicates.spec.ts` | navigates `/intake/new` | — | **NAMED non-consumer**: `grep -ci dossier` → `0`. |
| `frontend/tests/e2e/intake-audit-verification.spec.ts` | `:78-89` asserts the DossierSelector *appears* | — | **NAMED non-consumer**: asserts presence of the selector, which this change does not touch. |
| `frontend/tests/e2e/submit-request.spec.ts` | `:66-70` drives `dossier-link-existing` / `dossier-search` / `selected-dossier` testids | — | **NAMED non-consumer**: asserts a successful link path. This change removes no testid and makes submission strictly *more* permissive, so it cannot turn this red. |

**The decisive triage evidence:** no shipped test in any of the four roots asserts the
required-dossier message at all — `dossier_required` → `<none>`, `At least one dossier` → `<none>`.
A relaxation can only redden a test that asserts a rejection; none exists. Instrument-tested in the
same run (`createTicket` → resolves; `intake` → 8–30 hits per candidate spec), so the `<none>`
results are real absences.

**Population definition and what falls outside it:** identifier- and rendered-identity-based grep over
the four derived test roots. Outside it, and stated rather than discovered later: tests coupled by
**shape alone** (asserting `getByRole('alert')` plus visible text, naming no identifier) match no
grep. The residual defence for that class is running the shipped suite at phase close, which is a
phase-level act, not this plan's.

## Decisions Made

- **Did not mark WRITE-03 complete in the register.** See the section below — this is deliberate and
  needs an orchestrator decision, not a silent default.
- **Did not run the broader frontend suite.** Other lanes have uncommitted WIP in this shared tree
  (`backend/src/services/{auth,mou}.service.ts`, an untracked e2e spec, a probe script, a migration).
  A broad run's reds would be unattributable between lanes. The bounded evidence — the only consumer
  green, repo-wide `tsc --noEmit` clean, and `pnpm build` green in the pre-commit hook on both
  commits — covers this change's blast radius.

## Register closure NOT performed — orchestrator decision needed

`gsd-sdk query requirements.mark-complete WRITE-03` was **not** run, and the WRITE-03 checkbox
(`- [ ]`) and its traceability row (`| WRITE-03 | Phase 94 — Write Paths | Pending |`) are unchanged.
Two reasons, both deliberate:

1. **The plan does not ask for it.** Task 2's action is scoped to rewriting the entry's prose and
   ends with "Do not touch any other entry".
2. **Concurrency.** `requirements.mark-complete` rewrites the traceability table wholesale. Plans
   94-07 / 94-09 / 94-10 are wave-serialized on this same file; a wholesale table rewrite from this
   lane is a stomp hazard against theirs.

WRITE-03's own success criterion also reaches past this plan (`/intake/new` submitting against live
staging is an end-to-end observation, not a component-test one). Closing the checkbox is the
orchestrator's call.

## Deviations from Plan

None - plan executed exactly as written.

The plan's third behavior bullet was conditional ("Test (new, if expressible at component level)").
It **was** expressible, so it was written rather than skipped — that is the plan's stated preferred
branch, not a deviation.

## Issues Encountered

- **`--reporter=basic` does not exist in vitest 4.1.7.** Produced a startup error exiting `1` that
  could have been mistaken for a red. Caught, discarded, and documented above rather than banked as
  evidence.
- **HEAD moved during execution.** Commits `71677297f` (94-05) and `0c872b1c2` (94-06) from sibling
  lanes landed on `milestone/v10.0-trust` on top of this plan's work. Verified this plan's three
  files were untouched by them: `git diff --name-only 6d045669 HEAD -- <the three paths>` → empty.
  Every file claim in this SUMMARY is therefore pinned to a sha, never to HEAD.

## Concurrency notes

Worked directly in the main tree on `milestone/v10.0-trust`, no worktree, no branch switch, no PR.
Every commit used an explicit pathspec (`git commit -- <paths>`); at staging time the tree also held
five files belonging to other lanes, none of which entered either commit — confirmed by
`git show --stat` on both shas.

## GATE CONCERN

None. Zero gate text was edited. Both gates in this plan are sound as written and passed
unmodified.

## Intended-broken register

Nothing on the do-not-fix list was touched. In particular `/delegations`, `/admin/data-retention`
legal holds, `/tasks/queue`, `/analytics`, `DEAD-09`, `COPY-06`, `COUNT-03`/`COUNT-04` and the
22-mask floor were not approached. No `GRANT SELECT ON auth.users` was proposed or applied. No
migration was authored by this plan (the `42P17` migration belongs to 94-05).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WRITE-03's code path is closed at component level and ready for the phase's end-to-end pass.
- `.planning/REQUIREMENTS.md` is released for the wave-2+ writers (94-07 / 94-09 / 94-10); only the
  WRITE-03 entry was touched.

## BLOCKED

None.

## Self-Check: PASSED

- `frontend/src/components/intake-form/IntakeForm.tsx` — FOUND (`git show 6d045669:…` → `shouldValidate: true` count `2`)
- `frontend/tests/component/IntakeForm.test.tsx` — FOUND (contains `b0000001-0000-0000-0000-000000000005`)
- `.planning/REQUIREMENTS.md` — FOUND (`git show 6d045669:…` → `RFC-9562` count `1`)
- Commit `fdc23dd537cdba2bef6d57a0eea2e00984221494` — FOUND in history
- Commit `6d0456699e2cf090a050cfb880f0bbd2dabc9630` — FOUND in history
- `94-02_g1` — GREEN, exit 0, re-run verbatim
- `94-02_g2` — GREEN, exit 0, re-run verbatim at the current tree after HEAD moved

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
