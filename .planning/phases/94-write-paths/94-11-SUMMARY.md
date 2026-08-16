---
phase: 94-write-paths
plan: 11
subsystem: testing
tags: [gate-drill, playwright, vitest, probes, i18n, rls, audit-logs, verification]

requires:
  - phase: 94-write-paths
    provides: 'SUMMARYs 94-01..94-10 — claims to CHECK, not facts to copy'
  - phase: 94-write-paths
    provides: 'scripts/gate-drill.mjs, the four probes, the three phase specs, 94-DEPLOY-LEDGER.md'
provides:
  - '.planning/phases/94-write-paths/94-VERIFICATION.md — 7 population-stated derivations, the whole-set C1 gate table, the oracle evidence, the C9b consumer table, the intended-broken register, and the nine-requirement disposition'
  - 'the whole-set gate drill GREEN observation: 0/31 exited 0 undone -> 28/31 done'
  - 'the first observed GREEN of 94-11_g2 — the full behavioural oracle set — in this phase'
  - 'three findings recorded OPEN for orchestrator disposition'
affects: [94-close-out, 95, 96, 98, 99, 100, 101, 102]

tech-stack:
  added: []
  patterns:
    - "A gate can be run VERBATIM and still yield its output: echo the gate's own captured variables AFTER $? is read, never inside the && chain"
    - 'A closing derivation is instrument-tested against the phase base tree materialised with `git archive`, so a zero at HEAD is a measured absence'

key-files:
  created:
    - .planning/phases/94-write-paths/94-VERIFICATION.md
  modified: []

key-decisions:
  - 'The line-oriented D-08 copy sweep was DISCARDED, not patched: it read 0 in BOTH directions, and a clause that cannot fire is not evidence. Rewritten balanced-argument-aware.'
  - "The 22-mask floor was NOT re-derived — it is another phase's number over another phase's population, and a fresh derivation under a different rule would look comparable and not be."
  - "g2's RED-before is the whole-set drill's exit=2, not a hand-run variant: the shared instrument ran the gate text verbatim, and re-running it back-to-back would have courted an ORACLECAP-01 rate-limit red."
  - "Three findings are recorded OPEN rather than absorbed; none is repaired here, because REQUIREMENTS.md is not this plan's file."

patterns-established:
  - 'Population-shrink honesty: when a repair moves files OUT of a content-identified population, the base-tree positive control is what makes the HEAD zero mean anything'

requirements-completed: []

duration: ~45min
completed: 2026-08-16
---

# Phase 94 Plan 11: Closing verification Summary

**The phase closes on evidence whose scope is stated: seven derivations each carrying its population
and what falls outside it, the whole plan set's gates drilled by one author in one pass from
`0 of 31` green to `28 of 31`, the full behavioural oracle set observed GREEN for the first time in
this phase, and three findings recorded OPEN rather than absorbed.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3/3
- **Files modified:** 1 created (`94-VERIFICATION.md`), plus this SUMMARY

## THE GATE DRILL — every gate in this plan, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-11_g1` (:122) | Gate text run verbatim before the file existed → **`g1_exit=1`**, no stdout. Attributed to its subject in the same run: `ls -l .planning/phases/94-write-paths/94-VERIFICATION.md` → `No such file or directory`. Independently reproduced by the whole-set drill: `94-11_g1  PARSE-OK  exit=1  94-11-PLAN.md:122`. | Same text verbatim after the file was written → **`g1_exit=0`**. Re-run against the **committed** tree → **`94-11_g1 final exit=0`**. Clause values: `grep -c 'POPULATION'` = **20** (needs ≥7); `COUNT-04` 5, `DEAD-09` 5, `COPY-06` 3, `C9b` 5, `ARMA-01` 5 — all non-zero. | Not vacuous and not a regression guard: it was red for its own subject. **Two honest limits — see GATE CONCERN 1 and 2.** |
| `94-11_g2` (:153) | Whole-set drill, gate text verbatim: **`94-11_g2  PARSE-OK  exit=2  94-11-PLAN.md:153`**. `2` is `grep`'s file-not-found, and it is the gate's **last** clause — so every spec, probe and tag check ahead of it had already passed. Deliberately NOT re-run by hand in the red direction: back-to-back auth-heavy runs court an `ORACLECAP-01` rate-limit red, which is UNABLE TO MEASURE, not evidence. | Gate text run verbatim → **`GATE_94-11_g2_EXIT=0`**. Root spec `1 passed (2.8s)`; frontend specs `3 passed (12.4s)`; `probe-report-rls` `PROBE PASSED — no 42P17; A=1 / B=1 / C=0`; `probe-commitment-readback` `PROBE PASSED` (future-due persisted `in_progress`, past-due coerced to `overdue`, census `{"overdue":8,"pending":2}` unchanged); `probe-after-actions-list` `PASS — deployed function answers 200 with the composed shape and hides nothing`; `probe-audit-row` `count BEFORE: 8 → AFTER: 9 (delta 1)`, `AUDIT ROW LANDED: id=d7cdc528-…`; `git tag -v` `Good "git" signature … ED25519 key SHA256:YlslD6Lyam…`. Full output in `94-VERIFICATION.md` §4.2. | **This gate had never been observed green in this phase. It is the single largest piece of the phase's evidence debt, and it is now paid.** Gate text unaltered: `$OUT`/`$OUT2` were echoed only after `$?` was captured, outside the `&&` chain. |
| `94-11_g3` (:203) | Gate text run verbatim → **`g3_exit=2`**. The marker loop ran to completion with `$BAD` **empty** (no `SAME-COMMIT SWEEP FAILURES:` line printed), so the red is provably the final `grep` on the absent file, not a sweep failure. Whole-set drill agrees: `exit=2`. | Same text verbatim → **`g3_exit=0`**. Re-run against the committed tree → **`94-11_g3 final exit=0`**. Per-marker: `RFC-9562`→`6d0456699` (1 code path), `PGRST200`→`76b46bb8d` (2), `DEAD-09`→`68414f219` (5), `38 files`→`4aba197e5` (27), `default_organization_id`→`4aba197e5` (27). **Docs-only list EMPTY.** | Its load-bearing half — the pickaxe over git history — is unfakeable by an author. Only its last clause is self-certifying, and that clause only asks "did you write it down". |

### The whole-set drill — the phase-level red→green

<!-- prettier-ignore -->
| direction | tree | result |
| --- | --- | --- |
| RED | undone (orchestrator's run today) | `31 gates · 31 parsed · 0 parse-fail · **0 exited 0**` |
| GREEN | done (this tree, my run) | `31 gates · 31 parsed · 0 parse-fail · **28 exited 0**` |

The three non-zero in the GREEN run are exactly `94-11_g1/g2/g3` — mine, all asserting against a file
that did not exist while that run executed, all three green afterwards as shown above.

**What this does and does not establish.** It establishes that 28 gates, whose subjects now exist,
pass with their text unedited — which the RED run proves none of them did before. It does **not**
establish soundness: the script's own header says a green from it is not evidence, and §1.2 of
`94-VERIFICATION.md` carries the per-gate C1 rows plus six `GATE CONCERN`s inherited from the lanes.

## Task commits

<!-- prettier-ignore -->
| sha | message |
| --- | --- |
| `1235b625a5c3bed1833209ca429a7e3e9d0817d5` | `docs(94-11): close Phase 94 — derivations with populations, the whole-set gate drill, the oracle re-run` |

Committed with an explicit pathspec (`git commit … -- .planning/phases/94-write-paths/94-VERIFICATION.md`);
never `-a`, never `add -A`. `git show --stat HEAD` → **1 file changed, 702 insertions(+)**, while five
other lanes' files sat modified in the shared tree and none entered the commit. Content read back with
`git show HEAD:<file>`. `HUSKY=0` was set and all paths are under `.planning/` — the hook ran anyway and
reported `.planning/-only change — skipping pnpm build + knip`.

## What the derivations found

Full text in `94-VERIFICATION.md`. The measurements that carry the most weight:

- **`AUDIT-ZERO-01` key-diff, both quote styles, both directions.** `phase-94-base` materialised with
  `git archive`: **38 matched / 36 writers / 27 BROKEN / 9 clean / 2 read-only** — reproducing the
  filed population exactly, with all 27 named and their bad keys printed. HEAD: **0 broken**. The
  population itself **shrank** 38→12, because the repair moves files _out_ of it; the base control is
  what makes the HEAD zero mean anything, and the summary says so rather than presenting a smaller
  number as an improvement.
- **`D-03` re-derived LIVE one final time** (MCP, staging): five values, no `review`. The reverse
  mapping was then read out of the shipped code (`WorkBoard.tsx:105-118` + the `isCancelled` filter at
  `:214`), not out of a document.
- **`D-08` copy sweep: 3 leaks at base → 0 at HEAD**, over 13 toast calls in the five repaired files.
- **Zero i18n masks added:** `t('key','English default')` sites over the 27 changed `frontend/src`
  files are **9 at base and 9 at HEAD**.
- **Deploy ledger: 27 verdict-last `OK`, 0 `FAIL`**; threshold `-ge 27` against a max achievable of 27.
- **Intended-broken register re-verified LIVE:** `92-delegations-error` 2 passed, `93-tasks-queue-error`
  1, `93-analytics-error` 1, `93-admin-surfaces-error` 4 — each existence-asserted, count hardcoded,
  one path per invocation, `--no-deps` + inline auth. **These specs pass by asserting the error state
  is present, so a green means still-broken-as-intended, not working.**

## Instrument failures I hit and did not paper over

1. **The first `D-08` copy sweep could never have fired.** A line-oriented
   `grep -cE "toast[A-Za-z.]*\([^)]*\.message"` returned `0` at HEAD **and `0` at `phase-94-base`**,
   where three leaks are known. The pre-repair leaks are multi-line `toast({ … })` calls. **Discarded,
   not patched** — a clause that is 0 in both directions is not an oracle — and rewritten to scan the
   balanced argument list. The rewrite finds exactly the three known leaks at base (`after-action.tsx:103`,
   `useUnifiedKanban.ts:481`, `$afterActionId.tsx:109`) and 0 at HEAD. This is instrument trap 10,
   caught by the positive control rather than by luck.
2. **That sweep has a blind spot it found on itself.** `SettingsPage.tsx` reads 0 leaks at the base tag
   **too**, yet carried one: `const detail = error instanceof Error ? error.message : null` (`:315`)
   consumed as `description: detail ?? undefined` (`:318`). **A leak laundered through a local binding
   is invisible to any sweep that reads a toast's arguments.** Closed by direct observation instead
   (`grep_exit=1`, 0 matching lines at HEAD; both lines present at base) and stated as an unswept class.
3. **The first shell expansion ate two filenames.** `$engagementId` and `$afterActionId` are literal
   path segments; unquoted, the shell expanded them to empty and the sweep silently measured three files
   instead of five while printing `MISSING` lines I had to actually read. Re-run with `set -f` and quoted
   paths.

## Findings recorded OPEN — none absorbed, none repaired here

`.planning/REQUIREMENTS.md` is not this plan's file. All three need an orchestrator id and owner.

1. **`common.json` is not key-set-equal as a whole namespace.** EN **1087** / AR **1099** — twelve
   AR-only keys, all `dossierLinks.entityTypes.*`, zero EN-only. **Not a Phase 94 regression**, measured:
   the identical twelve keys and the identical gap exist at `phase-94-base` (1084/1096); this phase added
   exactly 3 keys per locale. **Unguarded:** `phase-42-i18n-parity.test.ts` covers five namespaces and
   `common` is not among them. Direction matters — surplus AR keys are inert, unlike missing ones. Low
   severity, real. Natural owner: Phase 99.
2. **Four ids are filed in the register body with NO row in its status table** — the table that is the
   actual queue: `COPY-06`, `COUNT-04`, `EDGEPATH-01`, `FUNC-GRANT-01`, all `0` rows. Control on the same
   instrument and file: `DEAD-09`, `COUNT-03`, `E2ESTALE-01`, `ARMA-01`, `ORACLECAP-01` → 1 row each; the
   table holds 81 rows. This is the "named in its own prose, queued nowhere" shape.
3. **This plan's own interfaces text misattributes the key-set-equality instrument.** It says `pnpm lint`
   "carries `scripts/check-i18n-namespaces.mjs`" as that gate. That script's header states what it
   actually asserts — namespace **REGISTRATION**, that every `useTranslation('ns')` literal resolves to a
   registered namespace. It is not a key-set-equality gate. The property holds regardless (re-derived
   directly, all four subtrees equal, 0 identical EN/AR values); only the instrument named for it was
   wrong, and the correction is written into `94-VERIFICATION.md` §2.4 rather than repeated.

## GATE CONCERN

**Zero gate text was edited by this plan.** Both concerns are recorded for a ruling, not repaired.
Neither makes its gate unpassable-when-done, so neither is a PARK.

1. **`94-11_g1` is SELF-CERTIFYING — the same class `94-08` raised for its `g3`.** Every clause is a
   token-presence check on a document this same task authors. `grep -c 'POPULATION' >= 7` counts the
   **word**, not seven derivations with populations; seven mentions in a comment would satisfy it
   identically. Its red-direction power comes entirely from the file's absence, and once the file exists
   it cannot distinguish honest derivations from a token list. The seven derivations here are real and
   each carries its search root, matching rule and outside-statement — but that is **author honesty, not
   an independent measurement**, and the phase's gate ledger should record which of its greens rest on
   which.
2. **`94-11_g1`'s green was NOT observed with the discriminating control present.** The spawn brief warns
   that `g1` was repaired under `RULING-P94-05` (it originally required
   `94-VERIFICATION-INDEPENDENT.md` to be **absent**, which would have gone red exactly when the
   independent verifier did its job) and re-drilled with that file present. **That file does not exist on
   disk at the time of writing** — `ls .planning/phases/94-write-paths/94-VERIFICATION*.md` returns only
   mine. So my green is observed with it **absent**. The repaired text carries no absence clause, so it
   cannot red on that account; but the control the brief describes was run during planning, not by me,
   and I am not claiming it.

## Path discipline (`D-29`)

**I wrote `.planning/phases/94-write-paths/94-VERIFICATION.md` and nothing else.**
`94-VERIFICATION-INDEPENDENT.md` is the independent `gsd-verifier`'s path: not written, not edited,
not appended to, not claimed, not merged into. It did not exist while I ran; had it appeared, it would
still not have been mine. `94-VERIFICATION.md`'s own header states the distinction so a later reader
cannot conflate them.

## Scope discipline

- No `<automated>` gate text edited anywhere. Verified: the commit's file list is one `.planning/`
  path and contains no `-PLAN.md`.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` **not touched** —
  derived, not asserted: `git show --stat 1235b625` lists exactly one file.
- **No requirement checkbox flipped.** §7 of the verification doc is prose disposition; the nine flips
  are the orchestrator's single close-out act.
- Nothing on the intended-broken register was repaired. It was re-verified live and reported **as
  intended-broken**.
- No `GRANT SELECT ON auth.users` proposed or applied. No migration, no DDL, no schema change by this
  plan. Zero package installs.
- No `git checkout` / `restore` / `stash` at any point. No `git config` — no worktree was created, and
  the only throwaway trees are `/tmp` copies made with `git archive`.
- Staging left as found: every probe fixture deleted, the `aa_commitments` live census re-asserted
  identical (`{"overdue":8,"pending":2}`), both report tables back to 0. The one `audit_logs` row this
  run added is **kept**, per `94-10`'s standing decision. No credential value was echoed.
- **Shared stash stack:** my lint-staged backup `93caa19e1` was correctly dropped (`0` occurrences).
  The one remaining entry is `30bcdc15f…` — byte-identical sha and timestamp to the one `94-09`
  reported as another lane's. **Not mine, untouched, not popped.**

## Carried open for the orchestrator — not mine to close

- **`frontend/tests/e2e/user-management.spec.ts` is a REAL C9b consumer and was still not run**
  (`94-10`'s filed BLOCKED, unchanged at phase close). It drives `create-user` and the `assign-role`
  flow, both now precondition-graded. It needs a provisioned app plus the Playwright `setup` project,
  which `E2ECRED-01` forbids any oracle here from depending on. **Whether it passes today is unknown.**
  Recorded in `94-VERIFICATION.md` §8 item 1 as a gap, not as a named non-consumer.
- **`W4`** — the `WRITE-04` retarget-to-Done hole — remains open and **unpinned by any oracle**.
- **Six gates across the phase are weaker than they read** (verification doc §1.3), plus the two above.
- **`EDGEPATH-01`** (≥61 edge functions in scope, 52 entirely unassessed; **61 is a scope, never a
  defect count**, and the population is open-ended by construction) and **`FUNC-GRANT-01`** (population
  334, knowingly-accepted residual) — both Phase 100, both from this leg's parks, neither a Phase 94
  regression and neither part of the intended-broken register.
- **Arabic naturalness and pixel RTL are OPERATOR parks.** The AR strings this phase authored ship as
  authored (`RULING-P94-07`): grammatical, on-glossary, key-set-equal and string-unequal to EN — and
  **UNREVIEWED for naturalness**. Nothing in my artifacts claims either.

## Deviations from Plan

None — plan executed as written. Two judgement calls inside its own latitude:

1. **The `22-mask floor` was reported, not re-derived.** The plan's register contract names it; it is
   Phase 93's number over Phase 93's population. A fresh derivation under a different rule would produce
   a number that _looks_ comparable and is not — the population-definition class this phase has already
   paid for repeatedly. What I measured instead is in-population and answerable: this phase added
   **zero** masks.
2. **`g2`'s red direction was taken from the whole-set drill rather than re-run by hand.** The drill ran
   the gate text verbatim through the shared instrument and recorded `exit=2` at its final clause. A
   hand re-run minutes later would have been the third auth-heavy pass in a row — the `ORACLECAP-01`
   wall — and a rate-limit red is UNABLE TO MEASURE, not a red.

## A uniform pass is suspicious — what this leg did NOT establish

Named at length in `94-VERIFICATION.md` §8; the short list: an unrun real consumer; an unpinned `W4`;
`94-07_g1`'s inner-join arm explicitly `NOT CONSTRUCTED`; a one-record population behind the list
probe; the `.insert(payload)` spread class still unmeasured; the RLS `WITH CHECK` silent-zero-row class
never swept and the trigger sweep's own completeness **asserted, not proven**; shape-only test coupling
invisible to every C9b sweep run; and the six weak gates. Three independent plan-check rounds each found
defects the previous round missed — the honest prior is that more exist.

## Self-Check: PASSED

- `.planning/phases/94-write-paths/94-VERIFICATION.md` — FOUND; read back with `git show HEAD:<file>`
  (702 lines, frontmatter + `# Phase 94 — Closing Verification`).
- Commit `1235b625a5c3bed1833209ca429a7e3e9d0817d5` — FOUND; `git show --stat` = 1 file changed.
- All three gates re-run **verbatim** against the committed tree: `94-11_g1 final exit=0`,
  `94-11_g3 final exit=0`; `94-11_g2` observed `GATE_94-11_g2_EXIT=0`, and its only tree-dependent
  clause (`grep -q 'gate-drill'`) resolves in the **committed blob** — verified `3` hits there.
- `94-VERIFICATION-INDEPENDENT.md` — **absent, and not created by me.**

## BLOCKED

**None.** All three tasks executed and all three gates are green. The three OPEN findings above, the
inherited `user-management.spec.ts` gap, and the two `GATE CONCERN`s are **recorded for orchestrator
disposition, not blockers on this plan** — each is either outside this plan's `files_modified`
(`REQUIREMENTS.md`), forbidden to my oracles by `E2ECRED-01`, or a gate I may not edit.

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
