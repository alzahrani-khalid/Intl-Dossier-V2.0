---
phase: 93-failure-visibility
plan: 15
subsystem: verification
tags: [closing-derivations, gate-drill, c9b, intended-broken-register, populations]
requires:
  [93-01, 93-02, 93-03, 93-04, 93-05, 93-06, 93-07, 93-08, 93-09, 93-10, 93-11, 93-12, 93-13, 93-14]
provides:
  - '.planning/phases/93-failure-visibility/93-VERIFICATION.md — the phase close-out evidence'
affects: []
tech-stack:
  added: []
  patterns:
    - 'every closing derivation carries POPULATION DEFINITION + WHAT FALLS OUTSIDE IT (D-18)'
    - 'both-directions derivation: same instrument at phase-93-base and at HEAD'
key-files:
  created:
    - .planning/phases/93-failure-visibility/93-VERIFICATION.md
  modified: []
decisions:
  - 'The two tasks share ONE artifact, so they share ONE commit — Task 2 declares an empty <files> block and produces no file of its own.'
  - "The C9b sweep was re-run with a reject-unsafe-id check replacing GATE-STANDARD C9b's BSD-broken sed escape (GATESTD-01). The standard was NOT edited."
  - "The 34 prior-plan gate greens are CITED from their SUMMARYs, not re-run: their reds were observed when the work landed and today's tree cannot reproduce them."
metrics:
  duration: ~2h
  completed: 2026-08-16
requirements: [TRUST-01, TRUST-02, TRUST-03, TRUST-04, DELEG-01, DR-42501, AUDIT-42703, PIN-2390-01]
---

# Phase 93 Plan 15: Closing Verification Summary

**The phase's numbers now say what set they measured** — five closing derivations re-run in both
directions with stated populations, 36 gates drilled, 18 behavioural oracles green, 11 functions
probed live, and every deliberately-broken surface named with its owning phase.

## Tasks

| #   | Task                                               | Commit                     | Files                         |
| --- | -------------------------------------------------- | -------------------------- | ----------------------------- |
| 1   | Re-run the closing derivations, populations stated | `fc01b6c4`                 | `93-VERIFICATION.md`          |
| 2   | Full oracle run — specs, probe, gate drill         | `fc01b6c4` (same artifact) | — (`<files>` empty by design) |

## Gate observations — both directions

| gate       | C1 red                                                                                                                                                                                                                                                                                                                                                                     | C1 green                                                                                                                                                            | notes                                                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `93-15_g1` | `exit=1` at the pre-write drill — `93-VERIFICATION.md` did not exist; `test -f` fails first, before any count reaches its subject                                                                                                                                                                                                                                          | `exit=0` against the written doc. C4 max-reachable shown: **12** `POPULATION` lines against a threshold of 5                                                        | C5 satisfied — existence precedes every count in the same `&&` chain                                                                                                                                                            |
| `93-15_g2` | **RED-1 (constructed, scratch worktree at HEAD):** one named spec deleted → existence loop `EXIT=1` in **2 ms**, zero output — short-circuits **before Playwright runs**. **RED-2 (real output, not fabricated):** the `18 passed` and zero-`failed` clauses applied to a genuine captured run that came up short (`1 failed / 1 did not run / 16 passed`) → both `EXIT=1` | `EXIT=0`: `18 passed (26.3s)`, zero failed lines, probe `my-delegations -> 500` / `data-retention -> 200` / `audit-logs-viewer -> 200` / `field-permissions -> 200` | Gate text amended under `RULING-P93-05` before this plan ran. `--list --no-deps` independently returns **`Total: 18 tests in 10 files`**, matching the frozen 18 per-spec (`1/1/1/4/2/2/3/1/1/2`) — confirmed, not tuned toward |

**Whole-phase drill at close:** `36 gates · 36 parsed · 0 parse-fail · 36 exited 0`, zero reds
(`/tmp/p93-gatedrill-FINAL.log`). The pre-write run was 35/36 with `93-15_g1` the only red — the
honest state, since its subject did not yet exist.

**Tree integrity:** `git status --porcelain` empty before the first construction and empty after the
last. Two scratch worktrees created, used, removed; `git worktree list` carries no Phase-93 entries.

## What the derivations found

| #   | derivation                                                | at `phase-93-base`           | at HEAD                                                            |
| --- | --------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| D1  | TRUST-01 widened catch-and-return over the 6 defect sites | **6**                        | **0** (whole-shape control: 45 → 39, shrank by exactly the defect) |
| D2  | Criterion 5 bucket-(a) over the 25-file population        | **26** lines                 | **0**                                                              |
| D3  | `PIN-2390-01`, `--include='*.ts'`                         | **2**                        | **0**                                                              |
| D4  | anti-grant guard, uncommented                             | **0** (regression guard)     | **0**; raw incl. comments **3** — the C8 control                   |
| D5  | i18n `errors.*` key-sets + 7 named keys                   | 6/6 equal, all 7 `undefined` | 13/13 equal, all 7 present, **all 7 `en !== ar`**                  |

**The sharpest cell in the document is D3's second column.** Phase 92's narrow population
(`--include='index.ts'`) returns `0` at the base tag **and** at HEAD — a correct command returning a
correct number about the wrong set, while two live pins sat in the tree. It would keep returning `0`
forever. That is the phase's thesis, reproduced on demand.

**Live evidence:** `SELECT` on `auth.users` granted to **`postgres` only** (the refusal holds); **11
residual RLS policies over 9 tables** still read `auth.users`, matching `RLS-AUTHUSERS-01` exactly;
zero 401s across all eleven probed functions.

## Deviations from Plan

**1. [Method] The C9b sweep used a reject-unsafe-id check instead of `GATE-STANDARD.md`'s escape
step.** That step (`sed -E 's/[][.*+?^${}()|\\]/\\&/g'`) is rejected outright by BSD/macOS sed; sed
errors to stderr while the loop continues with an **empty `id`**, the pattern degenerates to `\b\b`,
and every changed file reports as coupled to every spec. Substituted
`case "$id" in *[^A-Za-z0-9_-]*) echo UNSAFE; continue;; esac`, which fails **closed and loud**.
**The standard was NOT edited** — it is the overseer's text and `GATESTD-01` is pending. Recorded
here as required.

**2. [Scope, declared] Both tasks committed as one artifact.** Task 2's `<files>` block is empty by
design; its outputs (spec run, probe, drill table) land inside Task 1's `93-VERIFICATION.md`. One
file, one commit.

**3. [Sourcing, declared] The 34 prior-plan gate greens are cited from their SUMMARYs, not re-run.**
Their reds were observed at the moment each plan's work landed. Re-running a green today would
establish strictly less, because today's tree already contains the work. Only the two `93-15` gates
were constructed by this seat.

## Findings raised — three, all OPEN and none absorbed

- **F-1 · `NOTFOUND-COMPONENT-01` was raised by `93-12` and never filed.** It exists in exactly one
  place in the repo (`93-12-SUMMARY.md:299`) and in **no** section of `REQUIREMENTS.md`, with no
  owner. Its sibling in the same list, `P52FIXTURE-01`, was filed. Re-derived: **0 `notFound()`
  throw sites at base, 3 at HEAD**; two carry `{ routeId: rootRouteId }` and are behaviourally
  proven; the third is a bare `notFound()` in a route **loader** (not a component), so the mechanism
  does not apply to it. **The systemic finding is real and unowned; no live instance remains.**
  Needs an owner or an explicit retirement.
- **F-2 · The oracle set has an unquantified capacity limit.** 18 tests × 1 inline sign-in each;
  two full runs inside the provider's rate-limit window red the suite at the auth wall with
  `Request rate limit reached` — measured, with the page snapshot on the record. **Per C2 that is
  `UNABLE TO MEASURE`, not a valid red**, and it is a direct cost of `E2ECRED-01` (no shared
  `storageState`). Suggested owner: **Phase 101**. Anyone re-running this phase's evidence must
  space the runs, or the first re-run will look like a Phase 93 regression.
- **F-3 · `RLS-AUTHUSERS-01`'s header count is one table over.** It says "15 policies across 13
  tables". Live: **11 residual policies over 9 distinct tables**, plus D-10's 4 fixed policies over
  3 tables. Policies reconcile exactly (11 + 4 = 15 ✓); tables give **12**, not 13. The source
  enumeration in `PARK-P93.md:74-88` renders 13 markdown **rows** over 12 distinct tables —
  `tag_categories` appears twice. The header counted rows in a table, not tables in a database.
  Documentation-only; the fixed set and the residual set are both exactly right. **Not edited** —
  `REQUIREMENTS.md` is outside this plan's `files_modified`. Owner: **Phase 100**.

## Method notes worth keeping

**The requirement-count derivation is itself an instance of the phase's class.** The obvious command
— `grep 'from Phase 93' .planning/REQUIREMENTS.md` — returns **8**, missing `RETENTION-CAST-01` and
`DR-SUBPATH-01`, whose attribution lives in a blockquote **above** the pair rather than in either
entry's own body. Reading by section heading returns the correct **10**. The brief's stated count was
verified, not trusted, and the narrow command was wrong in exactly the way the phase exists to catch.

**The raw C9b sweep returns 410 candidate consumer specs, not 11.** Common domain nouns match
hundreds of backend contract tests that merely mention the noun. Triage narrows 410 → 11, and of
those 11 only **6** are real oracles. Anyone re-running the sweep and reading 410 — or 11 — as
coverage has read the wrong number.

## Threat Flags

None. This plan created one markdown file and executed read-only derivations, one read-only SQL
catalog query, and existing scripts. Zero package installs (T-93-SC). No credential is echoed
anywhere in the artifact (T-93-33).

## Known Stubs

None.

## GATE CONCERN

None. No `<automated>` gate text was edited by this seat. `93-15_g2`'s amendment predates this plan
(`RULING-P93-05`, authorized) and both its directions were re-observed here rather than inherited.
The one gate concern this plan **surfaces** rather than carries is F-2: `93-15_g2` embeds a
Playwright run whose failure mode at the auth wall is indistinguishable, by exit code alone, from a
subject failure. Decomposition and the captured page snapshot are what separated them.

## BLOCKED

None.

All plan tasks completed; both gates observed red and green; the whole-phase drill is 36/36 with
zero reds. The three findings above are **filed, not blocking** — each is measured, written up with
its evidence, and carries a suggested owner for the orchestrator to assign. None prevents this plan
from closing, and none was repaired opportunistically.

## Self-Check: PASSED

```
$ [ -f .planning/phases/93-failure-visibility/93-VERIFICATION.md ] && echo FOUND    → FOUND
$ git log --oneline --all | grep -q fc01b6c4 && echo FOUND                          → FOUND
$ git show --stat fc01b6c4                        → 1 file changed, 528 insertions(+)
$ 93-15_g1                                        → EXIT=0 (12 POPULATION lines ≥ 5)
$ 93-15_g2                                        → EXIT=0 (18 passed; probe 500/200/200/200)
$ node scripts/gate-drill.mjs <phase dir>         → 36 gates · 36 parsed · 36 exited 0
$ git status --porcelain                          → empty
$ git worktree list                               → no Phase-93 scratch entries
```

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-16_
