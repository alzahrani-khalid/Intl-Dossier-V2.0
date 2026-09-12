---
phase: 96-real-numbers
plan: 11
subsystem: database
tags: [postgres, pg_trigger, plpgsql, supabase, instrument, falsification-drill]

# Dependency graph
requires:
  - phase: 94-write-paths
    provides: 'P94-TRIGGER-SWEEP.md — the inherited `:=`-only instrument and its stated boundary'
provides:
  - 'scripts/trigsweep-classify.mjs — a behaviour-derived BEFORE-trigger classifier (four-form union + non-plpgsql suspicion), fail-closed, residual-listing'
  - '96-TRIGSWEEP-DRILL.md — both-direction control record, full hand-classified residual, and the filed floor'
  - 'FLOOR: 194 NEW-writing BEFORE ROW triggers of 212 across 181 tables (staging, 2026-08-17)'
affects: [any phase asking "what rewrites my writes?", COUNT-03, COUNT-04, future write-path phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'self-aborting DDL control: create + sweep + RAISE EXCEPTION in one DO block — rollback is structural, not a cleanup step'
    - 'capture-integrity digest: SQL-side md5(string_agg(...)) vs locally recomputed digest before a capture is used'

key-files:
  created:
    - scripts/trigsweep-classify.mjs
    - .planning/phases/96-real-numbers/96-TRIGSWEEP-DRILL.md
  modified: []

key-decisions:
  - 'Control ran as a rolled-back transaction, not a migration pair — the research offers both; the brief forbids persistent DDL and rules a sixth migration a PARK'
  - 'Residual is a deliverable: all 18 read by hand, then backstopped by a deliberately over-flagging mechanical probe'
  - 'Classes are first-match labels, not disjoint populations — stated so the INTO count (1) does not read as a discrepancy against research (2 INTO-carrying bodies)'

patterns-established:
  - 'Both-direction control before belief: the count section is placed AFTER the control section in the artifact, on purpose'
  - 'The instrument that checks an instrument is itself controlled (baseline-vs-baseline must FAIL)'

requirements-completed: [TRIGSWEEP-01]

# Metrics
duration: 41min
completed: 2026-08-17
---

# Phase 96 / Plan 11: TRIGSWEEP-01 Summary

**A behaviour-derived BEFORE-trigger classifier (four-form union + non-plpgsql suspicion) that lists its residual, control-tested in both directions against a self-aborting synthetic pair, filing a FLOOR of 194 NEW-writers of 212 BEFORE ROW triggers across 181 tables.**

## Performance

- **Duration:** ~41 min
- **Tasks:** 2 of 2
- **Files created:** 2 (no files modified, no migration applied)

## Accomplishments

- **The instrument exists and fails closed.** `scripts/trigsweep-classify.mjs` classifies by the
  union of all four known forms (`:=`, statement-position `=` **including same-line after
  `BEGIN`/`THEN`/`ELSE`/`LOOP`**, `INTO [STRICT] NEW.`, whole-record `NEW :=`) plus
  `lanname <> 'plpgsql'` as writer-suspect, prints **every** residual row for hand-classification,
  and exits `2 UNABLE TO MEASURE` rather than reporting a silent zero.
- **The fourth blindness is closed against the exact rows that demonstrated it.**
  `document_templates_updated_at_trigger` and `templated_documents_updated_at_trigger` — the
  one-line `BEGIN NEW.updated_at = NOW();` bodies that defeated the research session's own sharper
  regex — both now classify `writer (=)`.
- **Both directions observed on disk.** Synthetic writer caught; synthetic RAISE-only not flagged;
  the population CTE itself returned 214 with the pair present, proving they arrived through the
  real population path.
- **Zero missed writers in the residual.** All 18 read and classified: 16 non-writer-guards, 2
  other-row-writers, 0 `WRITER-missed-by-classifier`. No form was added; no re-run was owed.
- **The floor is filed with its date and its population definition**, superseding — not restating —
  P94's 29, the register's ≈193 and research's ≥194.

## Task Commits

1. **Task 1: the classifier instrument** — `038ac0b22` (feat)
2. **Task 2: derivation + both-direction control + drill artifact** — `625d23289` (docs)
3. **This summary** — see final commit (docs)

## Files Created/Modified

- `scripts/trigsweep-classify.mjs` — the behaviour classifier; house script posture (header
  contract carrying the re-capture SQL, labelled exits, reads a file and never a credential)
- `.planning/phases/96-real-numbers/96-TRIGSWEEP-DRILL.md` — the drill artifact (this plan is its
  only writer, D-20)

## The final classification counts

Capture 2026-08-17, staging `zkrcjzdemdmwhearhfgg`. Population: 212 BEFORE ROW triggers, 181
tables, all plpgsql. Capture verified byte-faithful — SQL-side digest
`52c207e5b14c6ca3ed72da7d26a0dec8` == locally recomputed digest.

<!-- prettier-ignore -->
| class | count |
| --- | --- |
| `writer (:=)` | 29 |
| `writer (=)` | 164 |
| `writer (INTO)` | 1 |
| `writer (record)` | 0 |
| `writer-suspect (non-plpgsql)` | 0 |
| `RESIDUAL — hand-classify` | 18 |

All six ORCH-BRIEF meaningful rewrites confirmed present in a writer class (their absence is exit 1
in the instrument): `staff_profiles.version`, `assignments._version`, `entity_comments.*` (two
triggers), `organization_leadership.is_current`, `legislations.version`,
`intelligence_sources.next_scan_at`.

**FLOOR: 194 writers of 212 BEFORE ROW triggers across 181 tables, captured 2026-08-17 — a FLOOR,
never a total.**

## The residual verdict list — all 18

<!-- prettier-ignore -->
| verdict | count | triggers |
| --- | --- | --- |
| non-writer-guard | 16 | `validate_country_type`, `validate_engagement_type`, `validate_forum_type`, `validate_organization_type`, `validate_person_type`, `validate_topic_type`, `validate_working_group_type` (all `validate_dossier_type()`); `enforce_aa_attachment_limit`; `enforce_attachment_limit`; `check_attachment_total_size`; `trg_prevent_premature_audit_deletion`; `trigger_prevent_version_snapshot_delete`; `trigger_prevent_version_snapshot_update`; `prevent_circular_delegation`; `trg_guard_profiles_clearance_change`; `trg_guard_users_role_change` |
| other-row-writer | 2 | `tr_enforce_single_default_layout` (`entity_preview_layouts`), `ensure_single_default_view_trigger` (`user_saved_views`) — both UPDATE **other** rows and return `NEW` unmodified |
| WRITER-missed-by-classifier | 0 | — |

The two other-row-writers were the ones a deliberately over-flagging backstop probe FLAGged; reading
them resolved every `NEW.<col> =` occurrence as a **comparison inside `IF … THEN`**. That is the
finding worth carrying: the statement-position anchor is not noise reduction, it is what separates
assignment from comparison — and dropping it turns these two into false writers.

## Control outputs, verbatim

**Direction one + the in-transaction population (the DO block's abort payload):**

```
ERROR:  P0001: P96CONTROL popn=214 rows=[
  {"tgname":"p96_ctl_a_writer","relname":"p96_trigsweep_control",
   "proname":"p96_trigsweep_control_writer","lanname":"plpgsql",
   "prosrc":"\n  BEGIN NEW.touched = now(); RETURN NEW; END;\n  ",
   "sql_class":"writer (=)"},
  {"tgname":"p96_ctl_b_raiser","relname":"p96_trigsweep_control",
   "proname":"p96_trigsweep_control_raiser","lanname":"plpgsql",
   "prosrc":"\n  BEGIN RAISE NOTICE 'p96 control: this trigger writes nothing'; RETURN NEW; END;\n  ",
   "sql_class":"RESIDUAL — hand-classify"}]
CONTEXT:  PL/pgSQL function inline_code_block line 49 at RAISE
```

**Both directions through the shipped JS instrument:**

```
PASS  must-catch     synthetic WRITER absent from the residual list
PASS  must-catch     writer (=) rose by exactly 1
PASS  must-not-catch synthetic RAISE-only present in the residual list
PASS  must-not-catch residual rose by exactly 1
baseline: writer(=) 164, residual 18  |  control: writer(=) 165, residual 19
CONTROL_ASSERT_EXIT=0
```

**The assertion instrument's own negative control (baseline vs baseline — must fail):**

```
PASS  must-catch     synthetic WRITER absent from the residual list
FAIL  must-catch     writer (=) rose by exactly 1
FAIL  must-not-catch synthetic RAISE-only present in the residual list
FAIL  must-not-catch residual rose by exactly 1
SHAM_EXIT=1
```

**Zero persistence, verified after the abort:** `to_regclass('public.p96_trigsweep_control')` =
`null`; `p96_trigsweep%` functions = 0; `p96_ctl_%` triggers = 0; population back to 212; digest
back to `52c207e5b14c6ca3ed72da7d26a0dec8` — the catalog is bit-identical to its pre-control state.

## Create/drop migration names

**None. No migration was applied by this plan and `supabase/migrations/` is untouched.** The plan's
letter named a create-migration + drop-migration pair; this run used the rolled-back-transaction
shape the research offers for the same control (see Deviations). The "names printed" duty is
discharged by the object names, all of which existed only inside the aborted transaction:
`public.p96_trigsweep_control` (table), `public.p96_trigsweep_control_writer()` and
`public.p96_trigsweep_control_raiser()` (functions), `p96_ctl_a_writer` and `p96_ctl_b_raiser`
(triggers).

## Per-gate red→green records

Both gates were labelled UNPROVEN at planning (subject is the task's own product). Both halves were
observed this run. Gate text was run **byte-identical** to plan-accept HEAD `b4072302a`; the scratch
green rebases the working directory, never the gate text.

**Gate 1 — `96-11-PLAN.md` Task 1**

<!-- prettier-ignore -->
| observation | how | exit |
| --- | --- | --- |
| RED | run on the undone tree, before Task 1 (subject absent: `test -f` fails) | **1** |
| GREEN (scratch) | synthetic script carrying every pin in `/tmp/p96-11-scratch-t1`, gate text verbatim | **0** |
| GREEN (real) | the real `scripts/trigsweep-classify.mjs` | **0** |
| GREEN (post-hook) | re-run after the pre-commit prettier hook | **0** |

Runtime posture verified live beyond the gate: absent file → `UNABLE TO MEASURE — capture file
absent: …`, exit **2**; no argument → exit **2**.

**Gate 2 — `96-11-PLAN.md` Task 2**

<!-- prettier-ignore -->
| observation | how | exit |
| --- | --- | --- |
| RED | run on the undone tree, before Task 2 (subject absent) | **1** |
| GREEN (scratch) | synthetic artifact carrying every pin in `/tmp/p96-11-scratch-t2`, gate text verbatim | **0** |
| GREEN (real) | the real drill artifact | **0** |
| GREEN (post-hook, and against the HEAD blob itself) | re-run after prettier reformatted the file in-commit | **0** |

The plan labelled Gate 2's control half UNPROVEN-until-execution ("needs MCP"). It ran: §2 of the
drill artifact carries the verbatim both-direction outputs and the zero-persistence proof.

## Decisions Made

- **The count section sits after the control section in the artifact.** D-11 says the instrument is
  tested before any count is believed; ordering the document that way makes the discipline
  structural rather than a claim.
- **First-match labelling stated explicitly.** `writer (INTO)` = 1 while research counted 2 bodies
  carrying `INTO NEW.` — `set_inline_comment_thread_root_trigger` carries `INTO` _and_ `:=` and
  lands in the earlier class. Recorded so a reader does not read it as a lost trigger.
- **`writer (record)` and `writer-suspect (non-plpgsql)` are carried at count 0.** Zero live
  instances today; removing them would rebuild the exact blindness this requirement exists to end.

## Deviations from Plan

### Auto-fixed Issues

**1. [Method substitution — brief-mandated] The both-direction control ran as a rolled-back transaction, not a migration pair**

- **Found during:** Task 2 (the control)
- **Issue:** The plan's letter prescribes `apply_migration` create + a second drop migration. The
  executor brief for this plan requires the control to leave **zero persistent DDL** on staging and
  rules that an additional migration is a PARK, not an executor's call — and the plan names no
  migration filename in `files_modified`, so a migration would also fall outside the brief's
  "only the filename(s) your plan names" rule.
- **Fix:** Used the alternative the plan's own cited context offers for this same control
  (`96-RESEARCH.md` §Derivation 1: _"a migration-created-and-dropped pair **or a rolled-back
  transaction via MCP**"_) — one `DO` block that creates the scratch table + both functions + both
  triggers, sweeps the population inside the same transaction, and `RAISE EXCEPTION`s to abort.
  Rollback is structural, not a second step that could fail.
- **Files modified:** none (the drill artifact records the method in §2 and §7)
- **Verification:** control semantics unchanged and strictly stronger on persistence —
  `popn=214` proves the same population CTE enumerated the synthetics; both directions observed;
  §2c proves the catalog returned bit-identical (table `null`, 0 functions, 0 triggers, 212 rows,
  identical digest).
- **Committed in:** `625d23289` (Task 2 commit)

**2. [Rule 1 - Bug in own instrument] The control-assertion script's regex escaping was broken**

- **Found during:** Task 2 (asserting the control)
- **Issue:** The first version of the throwaway assertion script double-escaped its class-name
  regex, so `writer (=)` parsed as `NaN` and it reported
  `FAIL  must-catch writer (=) rose by exactly 1` from its own bug rather than from the data.
- **Fix:** Replaced the regex lookup with a plain prefix match, added an explicit
  `UNABLE TO MEASURE` exit-2 when any count fails to parse, and added a negative control
  (baseline-vs-baseline, which must FAIL — it does, `SHAM_EXIT=1`).
- **Files modified:** none in-repo (the script is scratch tooling under `/tmp`); both the failure
  and its resolution are recorded verbatim in the drill artifact §2b.
- **Verification:** fixed run `CONTROL_ASSERT_EXIT=0`; sham run exits 1.
- **Committed in:** `625d23289` (the record; the script itself is scratch)

**3. [Housekeeping] Stale index entry left by lint-staged after the Task 2 commit**

- **Found during:** post-commit verification of Task 2
- **Issue:** The pre-commit hook committed prettier's reformat but left the pre-format content in
  the index (`MM`), so `git status` showed my file dirty against a commit that had already landed
  it. A concurrent lane's summary shows the same shape, so this is the repo's lint-staged behaviour,
  not a lane collision.
- **Fix:** Re-staged the file (`git add` with an explicit pathspec) so index == worktree == HEAD.
  Nothing was checked out and no content was reverted.
- **Verification:** `git status --short <file>` empty; `git diff HEAD -- <file>` empty; Gate 2
  re-run against the HEAD blob itself exits 0.

---

**Total deviations:** 3 (1 brief-mandated method substitution, 1 own-instrument bug, 1
housekeeping)
**Impact on plan:** No change to what the plan measures or claims. The control's substance — both
directions observed against the real population path before the count is believed — is delivered in
full, with the persistence guarantee strengthened.

## Issues Encountered

- **The full 212-row capture exceeded the MCP result budget.** The harness spooled it to disk
  instead, which turned out to be the better path: the capture reached the file **without passing
  through a transcription step**, and its fidelity was then proven by digest rather than trusted.
  The two synthetic control rows (the only hand-carried data) were cross-checked by an independent
  SQL-side classifier in the same payload.
- **The two flagged residual bodies** looked like writers to the loose backstop probe. Resolved by
  reading them: every `NEW.<col> =` there is an `IF … THEN` comparison. Recorded verbatim rather
  than asserted.

## Reservation assertion (D-20)

**`96-VERIFICATION-INDEPENDENT.md` was NOT created, written, staged or committed by this plan.** It
does not exist in `.planning/phases/96-real-numbers/` and has no creating commit in this branch's
history. The reservation held. `96-TRIGSWEEP-DRILL.md` has exactly one writer — this plan — and ends
with its terminal marker `TRIGSWEEP-DRILL-END`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The next phase that asks "what rewrites my writes?" inherits an instrument and a re-run recipe
  (drill §6), not an anecdote. Re-capture, re-digest, re-control, re-classify.
- **Handed forward, not closed here:** the population's stated outside — `AFTER`/`INSTEAD OF`
  triggers, statement-level triggers, non-`public` schemas — and P94's still-open sibling class, RLS
  `WITH CHECK` silent filtering (an `UPDATE` matching no rows returns success with zero rows
  affected). Neither is swept by this instrument and neither should be assumed empty.
- **Two other-row-writers are live** (`entity_preview_layouts`, `user_saved_views`): a count that
  folds them into "writers" is wrong in the other direction.

## BLOCKED

None.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
