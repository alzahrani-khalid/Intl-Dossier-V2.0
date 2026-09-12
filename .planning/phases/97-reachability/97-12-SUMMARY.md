---
phase: 97-reachability
plan: 12
wave: 5
status: complete
requirements: [NAV-01, NAV-02, NAV-03, NAV-04]
files_modified:
  - .planning/phases/97-reachability/97-CLOSING-DERIVATION.md
  - .planning/phases/97-reachability/97-GATE-DRILL.md
  - .planning/REQUIREMENTS.md
gate_1: GREEN (red observed first, at its own subject; 4 wrong states red)
gate_2: GREEN (red observed first; 6 wrong states red; 1 non-landing mutation caught and redone)
gate_3: GREEN (two reds observed in order; 3 wrong states red)
executed: 2026-08-17
---

# 97-12 — close the phase honestly

**Executed 2026-08-17** on `milestone/v10.0-trust`. Three gates green in both directions, all three
byte-identical to the accepted set at `d561738fa` (verified by extraction and comparison, below).
Thirteen wrong states constructed and each observed red. `## BLOCKED` is EMPTY. Two items that are
not blockers — a second register writer and two unfiled ruled findings — are recorded under their
own headings rather than absorbed.

---

## Gate text, verified frozen before anything else

Every gate this plan runs was extracted programmatically from the plan file and compared body-for-body
against `d561738fa`:

```
d561738fa gate count: 3   HEAD gate count: 3
gate1 identical: true
gate2 identical: true
gate3 identical: true
bash -n: gate1 rc=0  gate2 rc=0  gate3 rc=0
```

**No gate was edited.** Exit codes were captured DIRECTLY (`cmd; RC=$?`), never through a pipe.

---

## Task 1 — the consolidated gate-drill record

`.planning/phases/97-reachability/97-GATE-DRILL.md`, **29 rows, one per automated-gate block across
the twelve plans**, consolidating each plan's own drill observations by one author in one pass —
because `GATE-STANDARD-P92`'s pass procedure exists on the finding that _isolation is the mechanism_,
so splitting the pass across seats would reproduce the cause it exists to remove.

### The mechanical half

```
$ node scripts/gate-drill.mjs .planning/phases/97-reachability --json --timeout 900
DRILL-RC=0
gateCount: 29
29 gates · 29 parsed · 0 parse-fail · 24 exited 0
```

Reds at that moment: `97-08_g1`, `97-08_g3` (measured ceilings on the engagements read path) and
`97-12_g1/g2/g3` (this plan's own undone state). The script's flags are passed because its own header
records that the documented bare-directory form printed usage instead of running (C3).

### Gate-count-to-row-count reconciliation, both sides derived in the same run

```
$ command grep -c '^ *<automated>' .planning/phases/97-reachability/97-*-PLAN.md | awk -F: '{s+=$2} END {print s}'
29                       # summed across the twelve plan files
$ command grep -c '^| 97-' .planning/phases/97-reachability/97-GATE-DRILL.md
29                       # rows in the record
$ ls .planning/phases/97-reachability/97-*-PLAN.md | wc -l
12                       # PLANS, pinned so a plan appearing or vanishing changes the denominator loudly
```

Per plan: `97-01` 2, `97-02` 2, `97-03` 2, `97-04` 2, `97-05` 3, `97-06` 2, `97-07` 3, `97-08` 3,
`97-09` 2, `97-10` 3, `97-11` 2, `97-12` 3 = **29**.

### Verdicts

| verdict            | count | gates                                                                                                                        |
| ------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SOUND`            | 17    | `97-01` ×2, `97-02` ×2, `97-03` task2, `97-05` task1/task2, `97-06` ×2, `97-07` task2, `97-10` ×3, `97-11` task1, `97-12` ×3 |
| `REPAIRED`         | 10    | `97-03` task1, `97-04` ×2, `97-05` task3, `97-07` task1/task3, `97-08` task2, `97-09` ×2, `97-11` task2                      |
| `CANNOT CONSTRUCT` | 2     | `97-08` task1, `97-08` task3                                                                                                 |

Tally DERIVED from the record's own 29 rows rather than counted by hand — my first hand count read
16/11/2, which sums to 29 and is still wrong in both non-trivial cells:

```
$ command grep '^| 97-' 97-GATE-DRILL.md | awk -F'|' '{v=$(NF-1); …}' | grep -c '^SOUND'            -> 17
$ … | grep -c '^REPAIRED'                                                                            -> 10
$ … | grep -c '^CANNOT CONSTRUCT'                                                                    ->  2
```

The ruled-edit inventory was DERIVED by byte-diff rather than recalled: **18 gates byte-identical to
`d561738fa`, 11 ruled-edited**, and the 11 reconcile exactly against `RULING-P97-09` ×2, `-10` ×4,
`-12` ×3, `-15` ×1, `-16` ×3 (two gates appear under two rulings, so 11 gates carry 13 edits).

### The closed-vocabulary check, and a count correction

There is no fourth term for "half constructed", and the rule is stated at the top of the record:
**a gate whose done state was not FULLY constructed is `CANNOT CONSTRUCT`, never `SOUND`.**

The plan predicted six half-constructed gates. **At execution there are ZERO** — all six behavioural
halves were constructed and observed against the live stack, discharging every `NOT CONSTRUCTED`
label. The two `CANNOT CONSTRUCT` rows are the opposite case: their behavioural halves RAN and could
not reach threshold for a defect outside their subject.

**A correction I owe the acceptance.** `ACCEPTANCE-P97-EXEC` condition 5 says _"All 8
NOT-CONSTRUCTED labels across 6 plans"_. Derived: `97-05` 1, `97-06` 1, `97-07` 1, `97-08` 2,
`97-10` 1, **`97-12` 2** = 8. Two of the eight are `97-12`'s own PROSE about labels. **The real count
is 6, across 5 plans.** C8's shape landing on an acceptance condition rather than on a gate.

---

## Task 2 — coverage re-derived, populations closed, weakest point named

`.planning/phases/97-reachability/97-CLOSING-DERIVATION.md`.

### §1 — the coverage derivation, output verbatim

```
$ command grep -n "^| NAV-0" .planning/REQUIREMENTS.md
599:| NAV-01 | Phase 97 — Reachability | Pending |
600:| NAV-02 | Phase 97 — Reachability | Pending |
601:| NAV-03 | Phase 97 — Reachability | Pending |
602:| NAV-04 | Phase 97 — Reachability | Pending |
```

**The rows have MOVED AGAIN — to 599–602.** `97-CONTEXT.md` and `ACCEPTANCE-P97-PLAN.md` say
543–546; `97-12-PLAN.md` corrected that to 551–554 the same day. The gates use a row-prefix grep and
are line-independent, so this cost nothing. The two out-of-plan documents still carry the stale
figure; correcting them is the orchestrator's.

```
register rows : NAV-01 NAV-02 NAV-03 NAV-04
definitions   : NAV-01 NAV-02 NAV-03 NAV-04
ROADMAP line  : NAV-01 NAV-02 NAV-03 NAV-04
REGISTER == ROADMAP     : IDENTICAL (4/4, checked not assumed)
REGISTER == DEFINITIONS : IDENTICAL
counts: register=4 definitions=4 roadmap=4
```

**The match is real this phase and it was RUN, not eyeballed.** Both NAV-04 sub-items are named:
`frontend/src/services/auth.ts` (DELETE, zero-importer derivation re-run against a live control) and
`frontend/src/components/layout/QuickNavigationMenu.tsx` (DELETE; `RULING-P97-03` §1's premise that
it held a second route list was REFUTED by reading the file — it has no route list at all, so the
"say what its list contained" obligation is discharged with _nothing was discarded_).

### §2 — decision coverage, and BOTH colours of its falsification drill

```
$ node scripts/decision-coverage.mjs .planning/phases/97-reachability \
       .planning/phases/97-reachability/97-CONTEXT.md
DC-RC=0
"passed": true, "total": 13, "covered": 13, "uncovered": []
```

Falsification drill, in a scratch copy at `/tmp/p97-12/dcdrill` (the repo tree was untouched
throughout — `git status --porcelain` on the phase directory shows no drill residue):

```
=== scratch baseline (unmutated) ===
SCRATCH-BASE-RC=0        passed true  covered 13/13  uncovered []

=== mutation: strip the ONLY D-01 citation from 97-12's `truths` ===
=== RED ===
SCRATCH-MUTATED-RC=1
passed false  covered 12/13
uncovered: [ { "id": "D-01",
               "text": "**D-01: The phase closes 4 requirements** — `NAV-01..04`, each mapped in plan frontmatter to" } ]

=== RESTORED ===
SCRATCH-RESTORED-RC=0    passed true  covered 13/13  uncovered []
```

**The drill produced a second fact worth more than the red.** After the mutation `D-01` still appears
**8 times** across the scratch plan set — in prose, task bodies, acceptance criteria — and the scanner
reported it UNCOVERED anyway. That is positive evidence the scanner is correctly SCOPED and does not
accept a decision id mentioned in passing.

### §3–§4c

Both populations restated with what falls outside each; the phase-level population with the five
out-of-phase owner sets named (P98 copy, P99 Arabic/a11y, P100 RLS, P101 CI, P102 debt tail); the
intended-broken exclusions **re-verified as untouched by command** (`/delegations` still registered,
legal-holds host `admin/data-retention.tsx` 0 changed files, `scenario-sandbox` + `responsive-demo`
still registered, the `/engagements` double-mount intact, and the four `ALREADY-REACHABLE` admin
routes each still at occurrence count exactly 1); nineteen bounds B1–B19; the closed-vocabulary
register with **three sets still incomplete** (the `/admin/` index has no true term; the
data-precondition vocabulary mis-files a measured third cause as a seeding gap; and two terms were
ADDED at authoring time); and the skipped-is-not-passed rule with expected-vs-actual counts per spec.

Route population re-derived at close: **203 at `phase-97-base`, 203 at HEAD, delta 0**,
`routeTree.gen.ts` byte-unchanged. `97-03-SUMMARY.md` predicted this number would move; it did not,
and the prediction is recorded as UNMET rather than absorbed.

### §5 — THE WEAKEST POINT, repeated verbatim so the two records cannot drift

> **THE WEAKEST POINT: thirty-two test titles across four specs assert that they prove the surface
> for an "ordinary authenticated user", and every one of them ran as an ADMIN — the `.env.test`
> credential resolves to `public.users.role = "admin"`, measured at close. The role label is not
> merely unverified; it is wrong, and `97-01`'s and `97-02`'s gates PIN that exact phrase as a
> `D == T` equality, so the wrong label is now machine-enforced.**

**Found by running the discriminating command, not by ranking reports.** The record contained a live
contradiction: `97-05` B3 probed the account and found the admin-only row visible; `97-09`, `97-10`
and `97-11` each recorded `ROLE=adminOnly, PROVEN IN-RUN`; and `97-06`'s scope note says the opposite
in as many words — _"the ordinary authenticated user (`TEST_USER_EMAIL`, not an admin role)"_ —
citing no measurement. Four plans, one credential, two incompatible claims. So:

```
$ node /tmp/p97-12/roleprobe.cjs        # reads .env.test, prints ONLY the resolved role
SIGNIN: ok, session for a uid ending ff96
public.users.role = "admin"
isAdmin by the app's own predicate (role === admin || super_admin) = true
```

No credential value was printed. The predicate is the product's own
(`Sidebar.tsx:54  user?.role === 'admin' || user?.role === 'super_admin'`), not an analogue.

```
$ command grep -c '^\s*test(.*ordinary authenticated user' tests/e2e/97-*.spec.ts   -> 32
$ command grep -c '^\s*test.*adminOnly'                    tests/e2e/97-*.spec.ts   ->  3
```

It compounds with B3: the one test that would have exercised a non-admin session is `test.fixme`
because the only committed non-admin storage state expired 2026-06-04. **The phase has no non-admin
observation in either direction.** Closing it is Phase 101 territory via `E2ECRED-01`; it is not a
code defect in what this phase built. The greens are real about the surfaces; the sentence describing
WHO they are real for is wrong.

---

## Task 3 — the register, one writer, what actually shipped

All four `NAV-01`..`NAV-04` rows rewritten from `Pending` to `Complete (BOUNDED — …)` in the P96
precedent's form, each naming its residues and citing `97-CLOSING-DERIVATION.md` by section. Line
numbers were RE-DERIVED with `command grep -n "^| NAV-0"` rather than sought at a pinned offset — the
rows now sit at **627–630** after the register grew.

**The requirement DEFINITIONS at `:132-135` were NOT edited** — execution proved none of them
factually wrong. Verified: `git diff` removes 0 definition lines.

### The hand-offs, both stated — an empty hand-off stated is evidence, an unstated one is silence

- **`PALETTE-ADMIN-01`: NOT written, and the condition is why.** The plan says to add it _if `97-10`
  elected branch B_. It elected **BRANCH-A** (`DECISION PALETTE-ADMIN-01: BRANCH-A` at
  `97-NAV04-DECISIONS.md:489`, count exactly 1) and fixed the palette in-phase, so there is nothing
  to carry.
- **`PARALLEL-TRUTH-01`: WRITTEN**, because `97-04` did find residue it could not re-point and
  `97-NAV04-DECISIONS.md` §6 routes it explicitly ("filed by `97-12`"). Both arms added — a
  requirement bullet with all three `file:line` sites and the deliberately-not-filed near-copy, and a
  traceability row. **Owner: Phase 102** — and the row says plainly that the phase assignment is this
  plan's judgement, since §6 named the filer and no owning phase.

### Single-writer, checked three ways rather than trusted

```
(a) plans declaring .planning/REQUIREMENTS.md in files_modified = 1   -> 97-12-PLAN.md
(b) any plan SUMMARY reporting it WROTE the register              = 0   (4 hits, all CITATIONS of :135)
(c) git log phase-97-base..HEAD -- .planning/REQUIREMENTS.md      = 1 commit, and it is NOT a plan
```

**No plan-level single-writer violation.** Check (c) is reported under its own heading below.

### The register's own derivation invariant, re-checked

```
documented bullets / rows (^…[A-Z]+-[0-9]+…)              = 76 / 76   (equal — the published claim holds)
hyphen-tolerant  bullets / rows                            = 94 / 94
bullets with no row: none · rows with no bullet: none · duplicated rows: none
```

**The register's OWN published derivation is blind to 18 of its 94 ids (19%)** — every multi-segment
name, including `E2ECRED-01`, `INSERT-SYNC-01`, `WRITER-ROUTE-01`, `SPINNER-A11Y-01` and the
`PARALLEL-TRUTH-01` I just added. It still agrees with itself, so its "0 orphaned, 0 duplicated"
claim is true about the set it can see and silent about the rest. Filed as B17.

---

## Every gate, BOTH directions, with output

### RED — observed on the undone tree, before any deliverable existed

```
$ ls .planning/phases/97-reachability/97-GATE-DRILL.md        -> No such file or directory
$ ls .planning/phases/97-reachability/97-CLOSING-DERIVATION.md -> No such file or directory
$ command grep -c "^| NAV-0[1-4] | Phase 97 — Reachability | Pending" .planning/REQUIREMENTS.md
4

GATE-1 RED RC=1
GATE-2 RED RC=1
GATE-3 RED RC=1
```

Attributed clause by clause, so no red is a tooling death (C2) and no control is vacuous (C5):

```
=== GATE 1 (undone tree) ===
  c1 CONTROL gate-drill.mjs exists      rc=0
  c2 CONTROL c9b-sweep.sh exists        rc=0
  c3 SUBJECT 97-GATE-DRILL.md exists    rc=1   <-- RED LANDS HERE
  PLANS derived = 12 (threshold -eq 12)        <-- live and non-vacuous at red time
  GATES derived = 29 (threshold -gt 0)

=== GATE 2 (undone tree) ===
  c1 SUBJECT 97-CLOSING-DERIVATION.md exists rc=1   <-- RED LANDS HERE
  c2 CONTROL decision-coverage.mjs exists    rc=0
  c3 CONTROL 97-CONTEXT.md exists            rc=0

=== GATE 3 (undone tree) — TWO reds, both on real subjects, in order ===
  c1 CONTROL REQUIREMENTS.md exists          rc=0
  c2 SUBJECT-DEP closing derivation exists   rc=1   <-- first red
  row shape NAV-01..04                       rc=0 ×4
  Pending count = 4 (threshold -eq 0)                <-- second red, the gate's own subject
  W (declared writers) = 1 (threshold -eq 1)
```

### GREEN — observed on the delivered tree, verbatim frozen gates

```
GATE-2 GREEN RC=0
GATE-3 GREEN RC=0
GATE-1 GREEN RC=0
```

Gates 2 and 3 were re-run after every subsequent edit to their subjects and stayed 0.

**Gate 1 RE-ENTERS ITSELF, and I intervened — stated plainly, with why it cannot have produced a
false green.** Gate 1 invokes `gate-drill.mjs` over the directory that contains gate 1, so once the
record exists the drill runs this gate, which starts another drill, and so on. Measured: a new level
roughly every two minutes, reaching depth 3, each level running the phase's full Playwright battery
against one dev server — which is the parallel-worker condition `97-02` measured a theme-crash under.

```
$ ps -o pid=,etime= -p $(pgrep -f gate-drill.mjs)
86373 04:50      <- level 1, the one gate 1 invoked
88987 03:01      <- level 2
91578 00:59      <- level 3
```

I pruned levels 2 and 3 and let level 1 finish. **That cannot change this gate's verdict:**
`gate-drill.mjs` exits 0 **iff every gate PARSES** — run results are DATA, and its own header says so
— and killing a grandchild changes no parse result. Re-verified independently after the fact with a
short-timeout run that asserts parse only:

```
$ node scripts/gate-drill.mjs .planning/phases/97-reachability --json --timeout 20
DRILL-PARSE-RC=0        gateCount: 29   parse-fail: 0
```

Left-over processes reaped to zero afterwards (`gate-drill` 0, `playwright test` 0). Had I simply
waited, the outer level's own 900 s cap would have produced the identical exit code by timing the
child out — the prune bought minutes, not a result.

**One more honest qualifier, because the record changed after that green.** Prose was added to the
drill record afterwards (this recursion note itself), so the verbatim gate was re-run — and a second
attempt hit the same recursion and was cut off at a 10-minute wall. Rather than claim a green I did
not watch finish, every clause was re-derived individually against the final content, plus the
content half through the reversal-proven harness:

```
c1 gate-drill.mjs exists  rc=0     c5 PLANS=12 -eq 12       rc=0     c8 'C1 green' present  rc=0
c2 c9b-sweep.sh exists    rc=0     c6 GATES=29 -gt 0        rc=0     c9 'c9b-sweep' present rc=0
c3 the record exists      rc=0     c7 ROWS=29 -eq GATES=29  rc=0
c4 drill exit (parse-only) rc=0                       GATE-1 (harness) RC=0
```

**So the claim is: gate 1 ran VERBATIM to completion and returned 0 against the 29-row record; the
later edits were prose that touched no clause's subject, and every clause was re-derived green
against the final bytes.** The one clause not re-run end-to-end afterwards is the recursive drill
invocation, whose exit depends only on parse results, re-verified at `parse-fail: 0`.

### THIRTEEN WRONG STATES, each constructed and observed red

**Gate 1 — through a harness that is the frozen gate with exactly ONE clause removed** (its own
recursive drill invocation), with the reversal proven byte-identical to the frozen text. The removed
clause is an assertion sitting upstream of the equality being drilled, so the truncation is
conservative. **The unmutated record was green through the harness FIRST** — a negative control that
passes would only prove something inert had been mutated.

```
HARNESS-PROOF reversal byte-identical to the frozen gate: true
frozen bytes: 746  harness bytes: 639  removed: 107
DRILL-CONTROL-G1 RC=0 (expect 0)

W1 one row deleted        ROWS=28 vs GATES=29   G1 RC=1 (expect 1)
W2 one row duplicated     ROWS=30 vs GATES=29   G1 RC=1 (expect 1)
W3 'C1 green' removed     occurrences=0         G1 RC=1 (expect 1)
W4 'c9b-sweep' removed    occurrences=0         G1 RC=1 (expect 1)
RESTORED                  ROWS=29               G1 RC=0 (expect 0)   byte-identical: yes
```

**Gate 2 — six token removals on the completed record, each mutation's occurrence count printed
before and after so a silently-failed edit cannot masquerade as a passing drill:**

```
W1 QuickNavigationMenu removed    occurrences 1 -> 0   GATE-2 RC=1 (expect 1)
W2 'Phase 101' removed            occurrences 4 -> 0   GATE-2 RC=1 (expect 1)
W3 'services/auth.ts' removed     occurrences 1 -> 0   GATE-2 RC=1 (expect 1)
W4 'WEAKEST POINT' removed        occurrences 2 -> 0   GATE-2 RC=1 (expect 1)
W5 'SKIPPED' removed              occurrences 3 -> 0   GATE-2 RC=1 (expect 1)
W6 'NAV-03' removed               occurrences 5 -> 0   GATE-2 RC=1 (expect 1)
RESTORED                          GATE-2 RC=0 (expect 0)   byte-identical: yes
```

> **Drill-honesty note: W3's FIRST attempt reported RC=0, and that was my mutation failing to land,
> not the gate passing a broken file.** `perl -0pi -e "s/\Qservices/auth.ts\E//g"` — the `/` inside
> the token collided with the `s///` delimiter, perl reported _"Illegal division by zero"_, and the
> count stayed `1 -> 1`. It was redone with `s{…}{}g`, the applied mutation proven by printing the
> count, and the gate then returned 1. Recorded rather than quietly overwritten: a green from an
> instrument that did nothing is the exact class this drill exists to catch.

**Gate 3 — three wrong states, each derived value printed before the gate ran:**

```
W1 one row left Pending        Pending count 0 -> 1        GATE-3 RC=1 (expect 1)
W2 a SECOND declared writer    W 1 -> 2 (97-09 mutated)    GATE-3 RC=1 (expect 1)
W3 em dash -> hyphen in a row  row-shape count 1 -> 0      GATE-3 RC=1 (expect 1)
RESTORED                       GATE-3 RC=0 (expect 0)
REQUIREMENTS.md byte-identical: yes    97-09-PLAN.md byte-identical: yes
```

### MAX REACHABLE (C4)

| gate | quantity                                    | today  | max achievable | threshold        | reached                                                    |
| ---- | ------------------------------------------- | ------ | -------------- | ---------------- | ---------------------------------------------------------- |
| 1    | `PLANS`                                     | 12     | 12             | `-eq 12`         | exactly                                                    |
| 1    | `GATES`                                     | 29     | 29             | `-gt 0`          | yes                                                        |
| 1    | `ROWS`                                      | 0 → 29 | 29             | `-eq GATES` = 29 | exactly, both sides derived in the same run                |
| 2    | decision-coverage `uncovered`               | `[]`   | `[]`           | literal `[]`     | exactly                                                    |
| 2    | four ids / 2 sub-items / 4 phases / heading | absent | present        | present          | yes                                                        |
| 3    | `Pending` rows                              | 4 → 0  | 0              | `-eq 0`          | exactly                                                    |
| 3    | `W` (declared writers)                      | 1      | 1              | `-eq 1`          | equal — an ANTI-VIOLATION invariant, not a progress clause |

---

## C9a sweep — counts, with the instrument tested first (and the first form was WRONG)

```
$ command grep -rlc -- 'zzz_no_such_token_zzz' frontend/src | wc -l   ->  2505   # BROKEN: -c beats -l
$ command grep -rl  -- 'zzz_no_such_token_zzz' frontend/src | wc -l   ->     0   # correct
$ command grep -rl  -- 'DossierType'           frontend/src | wc -l   ->   133   # known positive
```

`grep -rlc` silently ignores `-l` and prints a count line for every file, so my first sweep reported
~2 500 "hits" for every token including nonsense. Recorded rather than quietly re-run — a non-zero
from an untested instrument is the same defect as a zero from one.

| name                                                             | plans | live files | verdict                                                  |
| ---------------------------------------------------------------- | ----- | ---------- | -------------------------------------------------------- |
| `isSettingsPathExact` (final) / `isSettingsIndexPath` (rejected) | 0 / 0 | 4 / **0**  | consistent                                               |
| `dossier-type-card-`                                             | 4     | 2          | producer + consumer agree                                |
| `dossier-count-unavailable`                                      | 8     | 4          | consistent                                               |
| `DOSSIER_CARD_TYPES`                                             | 24    | 6          | consistent                                               |
| `dash-hero-actions`                                              | 4     | 5          | consistent                                               |
| `tabs.digests`                                                   | 5     | 3          | consistent                                               |
| `settings-nav-card`                                              | 6     | 4          | preserved                                                |
| `VALID_DOSSIER_TYPES` (deleted)                                  | 6     | 1          | the 1 is a git-ignored knowledge-graph cache, not source |
| `HubCardType` (deleted)                                          | 4     | 0          | clean                                                    |
| `onSectionChange` (deleted)                                      | 1     | 2          | both the same cache                                      |
| `QuickNavigationMenu` (deleted)                                  | 19    | 19         | 15 cache, **4 real**                                     |
| `services/auth'` (deleted)                                       | 2     | 4          | **all 4 real**                                           |

The 4+4 real hits are `tests/unit/components/{Header,MFASetup,MFAVerification,Sidebar}.test.tsx` —
`ROOTALIAS-01`/P101, already broken pre-phase with **zero tests running**, ruled a DATED NOTE by
`RULING-P97-16` §4. `command grep` bypasses the ugrep wrapper and therefore `.gitignore`, which is
why `frontend/src/.understand-anything/` surfaced; confirmed ignored via `git check-ignore -v`.

Ruled gate-edit literals, swept **inside gate bodies only** (never whole files — that is the
prose-contamination population error):

```
'--filter frontend '        inside gate bodies = 0   (vacuous form fully retired)
'--filter intake-frontend'  inside gate bodies = 5   (corrected form, all five sites)
'^\s*test[.(]'              inside gate bodies = 0   (over-counting form fully retired)
```

---

## C9b sweep — `scripts/c9b-sweep.sh` ONLY, with every consumer triaged

```
$ bash scripts/c9b-sweep.sh phase-97-base
C9B-RC=0
CONTROL OK: \bdescribe\b -> 630 file(s) of 763 across 4 root(s): ./backend/tests ./e2e/tests ./frontend/tests ./tests
```

Input: 41 changed files under `frontend/src` since `phase-97-base`. Triage in full in
`97-GATE-DRILL.md`; the load-bearing outcomes:

- **REPAIRED IN THE SAME EDIT by their owners** (not left for this sweep to find red):
  `SettingsLayout.test.tsx` 3 → 10 tests green, `ListPageShell.test.tsx` 8 green,
  `settings-route.test.ts` 17 green.
- **RED, real, and UNREPAIRED — `tests/e2e/93-dossier-list-counts-error.spec.ts`.** Measured at
  close, spec existence asserted first and the expected count hardcoded at 1:

  ```
  SPEC93-RC=1
  Error: expect(locator).toHaveCount(expected) failed
  Expected: 7
  Received: 8            > 83 |     await expect(unknownCounts).toHaveCount(DOSSIER_TYPE_COUNT)
  ```

  `97-05` widened the counts-error branch from the DB-7 to the CARD-8 exactly as its plan directed;
  that Phase-93 oracle freezes `DOSSIER_TYPE_COUNT = 7`. `git log phase-97-base..HEAD` on the file is
  empty. Filed as B2; it has **no owner at close** and needs a ruling.

- **NON-ORACLE, never cited as evidence:** `dossier-fixtures.ts`, `mocks/handlers.ts`,
  `support/pages/DossierListPage.ts` (fixture / MSW handler / page object), and the `backend/tests/**`
  common-noun matches (a different population — no backend file changed this phase).
- **NINE consumer specs FOUND and NOT RUN**, stated as a bound (B9) rather than reported as a clean
  sweep: the four `frontend/tests/e2e/list-pages-*`, `settings-{page,save}` + `92-signout`, and
  `03-dossier-navigation` / `04-command-palette` / `08-export-import` /
  `ar-smoke/dossier-navigation.ar`.
- **Hand-triaged as the script demands:** its `AMBIGUOUS` row on the stoplisted `auth` identifier
  (repo-wide: 4 real dangling refs + 3 hits on the BACKEND's own `services/auth.service`, a different
  population, verified by reading the import lines; control `services/dossier-api` = 40) and its seven
  `UNSAFE` rows (rejected rather than escaped, per `GATESTD-01`).

---

## Not blockers, recorded rather than absorbed

**1. The register has a SECOND writer this phase, and it is not a plan.** The mechanical single-writer
check passes and no plan SUMMARY reports writing the file, but
`git log phase-97-base..HEAD -- .planning/REQUIREMENTS.md` returns **`b78b2333a docs(97): file
ENGREAD-01 … + SPINNER-A11Y-01`** — the orchestrator, writing under `RULING-P97-13`'s filing order.
**Disjoint in fact**: +50 lines adding two new sections, touching **0** of the four `NAV-0*` rows and
**0** of the four definitions (derived, not assumed). Nothing was overwritten. Recorded because
"exactly one writer" measured over PLAN files is a narrower claim than "exactly one writer", and
reporting the narrow result as the general one is this phase's own named failure mode. Filed as B19.

**2. Two ruled findings still have no register row, and I did not file them.** `PREVIEW-HOLLOW-01`
was assigned an owner by `RULING-P97-14` §2 (Phase 102) and has 0 bullets / 0 rows; the
`93-dossier-list-counts-error.spec.ts` red has no id at all. **Task 3's action authorizes exactly two
conditional new rows and neither of these is one of them**, so I named both in the NAV-01/NAV-04
register rows' bound text and in §4 (B18, B2) rather than filing rows outside my declared scope. A
finding named only in a ruling reaches nobody — these need the orchestrator.

**3. `97-NAV04-DECISIONS.md` carries stale pre-ruling prose** at `:251` and `:301`, superseded by
`RULING-P97-14` but never rewritten. `97-10` correctly followed the anchored tokens and did not edit
another plan's single-writer file. A reader who reads §3 and not §2 gets the pre-ruling answer.
Filed as B12; owner the orchestrator.

---

## Compliance notes

- Branch `milestone/v10.0-trust` throughout; no branch created or switched; `main` untouched; no PR.
- **The 7 exogenous paths were never touched** — `git status --porcelain` for them is byte-identical
  to session start (5 ` M`, 2 `??`), verified before and after the drills and before the commit. The
  full-status diff against the pre-drill snapshot is exactly one line: my own ` M .planning/REQUIREMENTS.md`.
- Commits use explicit pathspecs; `git commit -a` was never used. Git identity left as configured.
- **No file was `git checkout`ed.** Every file about to be mutated was copied to a `.prev` in `/tmp`
  first and restored from that copy, per `RULING-P97-17`'s rule; every restore was verified with
  `cmp -s`.
- `timeout` was never used. Exit codes captured DIRECTLY, never through a pipe. ABSOLUTE paths in
  every command whose cwd was not just set. `command grep` throughout, with **every count tested
  against a known-positive control** — one of which was broken and is reported above.
- No credential value was read into output. The role probe prints only the resolved role string and
  the last four characters of a uid.
- Zero package installs. No product code touched: `git status` shows exactly my three declared paths.
- Scratch work confined to `/tmp/p97-12/`.
- **prettier reflowed every markdown table in both records inside the pre-commit hook, so all three
  gates were RE-RUN against the committed (post-prettier) bytes** — `GATE-2 POST-COMMIT RC=0`,
  `GATE-3 POST-COMMIT RC=0`, gate 1's content clauses `RC=0`, `ROWS=29` still equal to `GATES=29`,
  and the verdict tally re-derived post-reflow still 17 / 10 / 2. `git show HEAD:<record>` carries 29
  rows, so the content the gates measured IS the content committed. Neither record carries
  frontmatter; this SUMMARY does, and it is re-checked after its own commit.
- **97-03's lint-staged stale-index quirk recurred.** After the commit, `git status` showed `MM` on
  both records while `git diff HEAD` on them was **empty** — HEAD and the worktree both held the
  prettier output and only the INDEX held the pre-prettier blob. Nothing was pending; cleared with
  `git reset -q HEAD -- <explicit paths>`, which does not touch the worktree. Left uncleared it
  would hand the next commit a stale blob.
- `stash@{0}: lint-staged automatic backup` is the **pre-existing Phase-94 stash**
  (`94-05-SUMMARY.md` + two `WorkBoard` files), not mine — verified by `git stash show --name-only`.
  My commit's own hook backup was cleaned up by the hook. Left untouched.

---

## BLOCKED

_(empty — nothing blocked this plan.)_

SUMMARY-END
