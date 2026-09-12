---
phase: 98-copy-truth
plan: 09
type: execute-summary
wave: 6
seat: p98-exec-09 (herdr pane wK:p7W)
head_at_dispatch: 8697f65de
commits: [894f5b2ed, 54f179e51, 51b77d056, 0a0659e8a, 6d578445e, 4dac460cf]
files_committed: 8
requirements: [COPY-01, COPY-02, COPY-03, COPY-04, COPY-05, COPY-06, COPY-07, COPY-08]
rulings_executed:
  [
    RULING-P98A2-15,
    RULING-P98A2-13 Law 1,
    RULING-P98A2-20 item 7,
    the OVERSEER's two mid-execution rulings on the writer set and on closing-derivation exclusivity,
  ]
status: 3 of 3 tasks CLOSED, all three gates run VERBATIM and GREEN; three ruled widenings executed and both-polarity verified
---

# 98-09 — the close: coverage re-derived, every gate drilled, the weakest green named

**Every file claim below cites a sha.** Six commits, eight files, zero exogenous paths.

---

## 0. What closed

| task                                             | gate, run verbatim | outcome                                                                    |
| ------------------------------------------------ | ------------------ | -------------------------------------------------------------------------- |
| 1 — the consolidated gate-drill record           | **RC 0**           | 21 gates, one author, one pass; 10 SOUND / 7 REPAIRED / 4 CANNOT CONSTRUCT |
| 2 — coverage, populations, bounds, weakest point | **RC 0**           | 8/8 derived, 30/30 decisions, falsification drill on disk in both colours  |
| 3 — the register, one writer                     | **RC 0**           | eight bounded rows; 8 changed / 8 added and nothing else                   |
| W1 — the instruments of record → `scripts/`      | 5 ruled conditions | all five discharged, re-run FROM THE COMMITTED PATHS                       |
| W2 — the NUL byte                                | 3-point + a 4th    | `file(1)`, plain `grep`, byte-identical key, and the stale-row polarity    |
| W3 — the bounded capture floors                  | both polarities    | isolated RED, and the absence STATED where no known-good run exists        |

---

## 1. Coverage derivation — OUTPUT VERBATIM (D-01, D-02)

```
===== §1a THE REGISTER (the queue) =====
886:| COPY-01 | Phase 98 — Copy Truth | Pending |
887:| COPY-02 | Phase 98 — Copy Truth | Pending |
888:| COPY-03 | Phase 98 — Copy Truth | Pending |
889:| COPY-04 | Phase 98 — Copy Truth | Pending |
890:| COPY-05 | Phase 98 — Copy Truth | Pending |
891:| COPY-06 | Phase 98 — Copy Truth | Complete |
892:| COPY-07 | Phase 98 — Copy Truth | Complete |
893:| COPY-08 | Phase 98 — Copy Truth | Complete |
rows: 8
all owned by Phase 98? -> 8 of 8

===== §1b THE ROADMAP DIGEST =====
**Requirements**: COPY-01, COPY-02, COPY-03, COPY-04, COPY-05, COPY-06, COPY-07, COPY-08

===== §1c THE COMPARISON — both sides derived in this run =====
register : COPY-01 COPY-02 COPY-03 COPY-04 COPY-05 COPY-06 COPY-07 COPY-08
roadmap  : COPY-01 COPY-02 COPY-03 COPY-04 COPY-05 COPY-06 COPY-07 COPY-08
MATCH: register == roadmap, 8 ids, exact
```

**8 of 8, and every id inverted back to the plan that claims it** — with the REJECT branch printed
for a control id (`COPY-99` → `** NO PLAN DECLARES IT — REJECT (D-01) **`), so the eight non-empty
rows are a measurement and not a loop that never executed. **Zero silent drops.**

**Three of those eight status cells were PRE-FLIPPED and are recorded as claims, not evidence.**
See §5.

---

## 2. Decision coverage, and the falsification drill in BOTH colours

**GREEN**, `node scripts/decision-coverage.mjs <phase_dir> <context>` — **RC 0**:

```
"passed": true,  "plans_scanned": [98-01 … 98-09],  "total": 30,  "covered": 30,  "uncovered": []
```

**CONTROL FIRST:** an untouched scratch copy of the phase directory reproduces `30 / 30 / []`, so
the copy is not the variable.

**RED** — all 8 `D-22` citations rewritten to `D-XX` in the scratch `98-04-PLAN.md` only:

```
RC=1
  passed : False
  total  : 30   covered: 29
  uncovered:
    id   = D-22
    text = **D-22: (criterion 2, Q2 — the `calendar.recurrence` instance is REAL; the repair is ROUTING).**
```

**GREEN AGAIN** — scratch plan restored from the live tree, same command: `RC=0`, `30 / 30 / []`.

**The live tree was never the drill's subject:** `command grep -c "D-22"` on the real
`98-04-PLAN.md` returns **8** before and after. The gate names the decision it lost, not just a
count, which is what makes its red actionable.

---

## 3. Gate-count ↔ row-count reconciliation

Both sides derived in the SAME run, which is the point of the pin:

```
scratch scope             : 8 plan files (98-09 excluded — a gate cannot grade itself)
gate-drill.mjs … --json --timeout 120
  gateCount               : 21      (plan-time expectation 21; floor 20)
  parse                   : 21 PARSE-OK, 0 parse-fail, 0 timed out
  today's exits           : 15 exited 0, 6 exited 1
98-GATE-DRILL.md rows     : 21      (command grep -c '^| 98-')
ROWS == GATES             : TRUE
verdict distribution      : 10 SOUND · 7 REPAIRED · 4 CANNOT CONSTRUCT   (sums to 21)
```

Row count re-verified **after** the prettier hook ran on the commit: still 21.

**`gN` → `tN` was DERIVED, not assumed** — by interleaving task-name positions with gate-block
positions in document order. Every plan carries exactly one gate per task, so the mapping is 1:1,
but that was measured rather than inferred from the numbering.

**The four `CANNOT CONSTRUCT` rows are NOT equivalent, and only one is a process defect:**
`98-05.t1` (its zero-count clause is a literal substring of its own repair), `98-05.t3` (the rendered
ISO-week half has no surface — `ENGREAD-01` → P102), `98-07.t2` (`HITS -eq 0` cannot hold while
`RULING-P98A2-18`'s dead-code exemption stands), and **`98-07.t1`** — whose subject was replaced by
`RULING-P98A2-17` with **no plan text repointed**. That last is C9 staleness, and the C9a sweep is
what makes it visible: `EnhancedActivityFeed` appears **7 times in 2 plans** while its ruled
replacement `ActivityList` appears **0 times anywhere**.

**Two gates are red today and are still SOUND**, because the verdict is a claim about what was
observed, not about today's exit code: `98-02.t2` asserts the `P98-BURNDOWN` marker is PRESENT and
`98-07.t3` asserts the SAME marker is ABSENT — exact opposites, both correct at their own close —
and `98-04.t3`'s red is its own fail-closed re-base control (`PRE=0 < 1`), exactly as 98-04
predicted in writing.

### A contradiction resolved the right way round

Five Playwright-running gates exited **0 inside a 120 s cap** while I had measured
`98-copy04-voice.spec.ts` at **2.0 m** an hour earlier. Per the phase's own rule the first
hypothesis was that the NEW instrument was broken. **I timed the gate body rather than believing
either number:** `RC=0, elapsed 66 s, 4 passed (47.9 s)`. Both numbers are right — my run used
`--workers=1` (the RED-BASELINE convention, forced by the login throttle) and the gate passes bare
`--no-deps`, so Playwright goes 4-way parallel. **The drill is exonerated by the timing run, not by
my expectation having been wrong.**

### A ruling condition nobody had discharged, discharged here

`RULING-P98A2-13` **B2** required, after the copy03 instrument fix, "two consecutive full-file runs
plus one isolated run, and the `ar` leg observed reaching the forced-error state". **98-06's SUMMARY
does not record any of it** — its §5 still reads "I am NOT claiming a stable copy03 green" from
trip 1. Discharged: full-file **RC 0 (27 s)**, full-file **RC 0 (28 s)**, isolated
`--grep "ERROR state"` **RC 0 (18 s)**. The `ar` leg reaches the forced-error state — the locale loop
is unconditional over `['en','ar']` with no `continue` / `return` / `test.skip` inside it and
per-locale assertion messages, so a pass means both iterations executed.

---

## 4. The phase gate, and SKIPPED-is-not-PASSED

Run by this plan, with the eight paths asserted present and the count **hardcoded to 8 before they
were passed** (D-09 — spec paths are FILTERS):

```
expected=29  unexpected=2  skipped=0  flaky=0  duration=279 s
```

| spec                 | `test(` decls | enumerated | passed | failed | skipped |
| -------------------- | ------------: | ---------: | -----: | -----: | ------: |
| 98-copy01-labels     |             6 |          6 |      5 |  **1** |       0 |
| 98-copy02-rawkeys    |             7 |          7 |      6 |  **1** |       0 |
| 98-copy03-dashboard  |             3 |          3 |      3 |      0 |       0 |
| 98-copy04-voice      |             4 |          4 |      4 |      0 |       0 |
| 98-copy05-dates      |             4 |          4 |      4 |      0 |       0 |
| 98-copy06-toast      |             1 |          2 |      2 |      0 |       0 |
| 98-copy07-statscard  |             2 |          2 |      2 |      0 |       0 |
| 98-copy08-eo-popover |             2 |          3 |      3 |      0 |       0 |
| **total**            |        **29** |     **31** | **29** |  **2** |   **0** |

**SKIPPED IS NOT PASSED — checked, not assumed.** Reporter `skipped` = 0 and
`command grep -c "test.skip"` summed across all eight files = 0. **The 29 → 31 delta is reconciled**,
not waved at: two declarations are locale-parameterised (`98-copy06`'s single toast declaration and
one of `98-copy08`'s two), each producing two runtime tests. `29 + 2 = 31`.

**Both failures are the two legs this phase has named since wave 1**, each failing on its own
precondition assertion quoting its own reason — the `/engagements` ISO-week leg (`ENGREAD-01` →
P102) and the intake-ticket entity-link leg (UNDRIVEN, D-24). **Neither is a repair that missed.**

---

## 5. THE SINGLE-WRITER VIOLATION — found, extended, ruled, and recorded with its shape

**Found:** this plan is the phase's ONLY declared writer of `.planning/REQUIREMENTS.md`
(`command grep -c '^  - \.planning/REQUIREMENTS\.md'` summed over the nine plans = **1**), yet
`REQUIREMENTS.md:891-893` already read `Complete` when I started.

**Attributed by a PRECISE flip detector** — same id with `| Pending` REMOVED and `| Complete` ADDED
in one commit — not by reading commit subjects:

```
FLIP  116f0fdfb   COPY-07 COPY-08      docs(98-03): the lane that REPAIRED them
FLIP  c71f42515   COPY-06              docs(98-04): the lane that REPAIRED it
no-flip on the other ELEVEN commits
```

**THE REPAIRING LANE MARKED ITS OWN REQUIREMENT COMPLETE, before any closing derivation ran.** That
is self-certification. The overseer issued **standing law during this execution: flipping a
requirement to Complete is the closing derivation's EXCLUSIVE act**, and I re-derived all three from
rendered evidence **this plan observed itself** (§4's phase-gate run) exactly as if the rows read
Open. Each of the three register rows now CARRIES its pre-flip and its attributing commit.

**MY OWN DERIVATION'S POPULATION WAS TOO NARROW, and the overseer caught it.** I counted
plan-authored writes and returned **2**; the file's real writer set from the CONTEXT-named phase
base `98824ca77` is **13 commits — 2 plan-authored, 11 ruling-authored** (control: 32 phase-dir
commits over the same span). **The invariant is ONLY-AMONG-PLANS**, and the carve-out is now
MEASURED on both polarities rather than asserted: across the eleven ruling commits, added `[x]`
boxes = **0** and flips = **0**, against **2 and 1** on the two plan commits; the three ruling
commits that DO add a status cell are **filings of NEW rows carrying `Pending`** (`COPY-09`,
`CLIENTSEC-02`, `EDGECOPY-01`). A narrower detector ("did a ruling ADD a `Complete` cell?") also
returns 0 and is correct for that question but **could not have distinguished a filing from a flip**.

**AND THE COUNT ITSELF PRODUCED ANOTHER INSTANCE, in the other seat.** The overseer independently
derived **TEN** and, on re-derivation, confirmed 13: its ten was counted from `4e107b5d3`, the
leg-1/leg-2 boundary — **where its own work began, not where the phase began**. Both numbers are in
the record with their start points. That is a **NINTH population dimension, catalogued at close:
ORIGIN, chosen for the observer's convenience.**

**Written as ONE finding with TWO instances, because the generalisation is the useful part: the
ruling layer as an UNMODELLED WRITER.** The first instance was the commit-discipline incident, where
a stray bare `git add` left this same ruling-layer file in a seat's index and every one-writer rule
in force had modelled only the seats. **Two different invariants, the same hole.** The overseer's own
tally line is carried as filed rather than softened: the `[x] COPY-08` cell was VISIBLE to it while
it edited the adjacent row and went unremarked — the same shape as `98-08` reading past
`Binary file … matches` in its own first tool result.

---

## 6. The three ruled widenings — applied, not re-escalated

### W1 — the instruments of record (`RULING-P98A2-15`), `894f5b2ed`

`scripts/partA_maskfinder.py`, `scripts/resolve-check.mjs`, `scripts/neg-taskcard.mjs`. Copied
FIRST so the derivation bodies stay byte-identical (preserved sha16 `6091239cc1ebf407` /
`5ac49679446a72a6` / `291c7b5d448a0e97` all reproduced on the copies before any edit), then only
headers and the repo-path binding changed.

| condition                              | discharge                                                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1 parameterize the two `.mjs`          | both take the repo root as `argv[2]` and **exit 2** without it; zero hardcoded absolute paths remain in the three files |
| 2 header: provenance, usage, NEG SCOPE | present in all three; `resolve-check.mjs` names the **`fallbackLng`-disabled-on-`ar`** property in its own banner block |
| 3 the negative control ships WITH it   | `neg-taskcard.mjs` is in the same commit                                                                                |
| 4 re-run FROM THE COMMITTED PATHS      | **run at `cwd=/`**, deliberately foreign — see below                                                                    |
| 5 close-out register note              | the overseer's, not mine                                                                                                |

```
partA_maskfinder.py <repo>            -> 24 total (19 mask a raw value; 5 render a raw key)
partA_maskfinder.py <repo> --control  -> True / True / False / False   (all four polarities)
resolve-check.mjs   <repo>            -> RC 0; 214 lookups, 22 OK rows, 0 routings with a miss;
                                         negative control detected-as-miss=true,
                                         positive control detected-as-miss=false
neg-taskcard.mjs    <repo>            -> MISS=true ×3, contrast resolves "Low"
both .mjs with no argument            -> RC 2
```

**A copy step is a transformation and the preserved copies' live-proof does not transfer** — that is
why every one of these was re-run from `scripts/`, from a foreign cwd, rather than cited.

**Recorded rather than "improved":** `neg-taskcard.mjs` exits 0 whatever it prints, so a caller
gating on `$?` gates on nothing. Its header now says so and says to assert the three `MISS=true`
lines. I did not add an exit code — a silent behaviour change to an instrument of record is how a
derivation stops being reproducible, and the ruling ordered the bytes parameterized and headed, not
rewritten.

### W2 — the NUL byte (`54f179e51`)

The idiom was right and the encoding was not. **Three-point verification, all three required:**

| point                        | before                                                             | after                              |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| (a) `file -b`                | `data`                                                             | `Unicode text, UTF-8 text`         |
| (b) plain `command grep -A2` | `Binary file … matches`, **no lines**                              | prints the line and its successors |
| (c) composed key SHA-256     | `2cf4a82e1681a1c21d9ff04254ba1fefab753976f86e8005fdd745d6d7185e1a` | **identical**                      |
| (c2) guard RC / `pnpm lint`  | —                                                                  | **RC 0 / RC 0**                    |

**And a fourth, which is the one that actually matters:** the STALE-ROW polarity is the only drill
that exercises `burndownKey` on BOTH sides (`excused.add` and the stale filter). Planted a row for a
file carrying no such pattern → **RC 1**, reproducing 98-02's polarity-4 output verbatim. Reverted;
SHA-256 `a251cc5a…` identical before and after, `P98-DRILL-09` count 0. All four 98-02 polarities
re-run and reproduced (fixture RC 1 with 13 findings, clean subtree RC 0, default RC 0, stale RC 1).

**Attribution carried as ratified:** `a2c8afb49` NUL=0 · **`8b2574c5b` (98-02) INTRODUCED** ·
`e686c9fca` (98-07) CARRIED. **98-02 is CLOSED and was NOT re-opened.**

### W3 — the bounded capture floors (`51b77d056`)

Built for `@case` ONLY, from `98-08`'s settled record (98 / 73 / 34 / 38 / 37 / 49 / 29 / 31),
floor `ceil(known × 0.8)`. **The counts are QUOTED, not re-measured** — manufacturing a fresh
known-good today would be inventing the baseline the floor exists to check against.

**THE DRILL HAD TO BE ISOLATED, and the first attempt would have been a false credential.** With the
settle neutered the run reddened — **at 98-08's planted-fixture assertion, which sits earlier in the
test.** That red proved nothing about my floor. Suspending the fixture assertion so the loop under
test is reached:

```
Error: capture on /dossiers fell below its floor — this run read the pre-hydration shell,
       not the settled surface (98-08 known-good 98, floor 79)          RC=1
```

Positive polarity, pristine file: `copy04` **4 passed, RC 0**. **A drill not proven reverted is a
drill that shipped** — SHA-256 `98616c05…` identical before the drill and after the revert;
`P98-DRILL-09` count **2** during and **0** after (the zero has its own non-zero from the same
command on the same path).

**Where the floor deliberately does NOT exist, stated in the required terms:** the `@values`
exclamation leg walks the same eight surfaces with a WIDER selector set for which no known-good run
exists — **no floor; nothing prevents shell-capture regression; instrument: none.**

---

## 7. Every handoff line written into a register bound, with its SUMMARY of origin

All 28 consolidated lines are in `98-CLOSING-DERIVATION.md` §4c with origins and owners. The ones
that became register-row TEXT:

| bound now in a register row                                                         | origin SUMMARY       | row     |
| ----------------------------------------------------------------------------------- | -------------------- | ------- |
| 24/19 dynamic-prefix mask class → `AR-04b`/P99, instrument now committed            | 98-05                | COPY-01 |
| rendered ISO-week NOT CONSTRUCTED → `ENGREAD-01`/P102                               | 98-01, 98-05         | COPY-01 |
| 39 text-position members handed off with NO OWNER                                   | 98-05                | COPY-01 |
| rendered-verified vs resolution-only, per site                                      | 98-05                | COPY-01 |
| three UNDRIVEN criterion-2 surfaces, census-closed per D-24                         | 98-01, 98-04, 98-04b | COPY-02 |
| ORDER-HUNDREDS dot-form tail, 306/353 unreconciled → `AR-04b`                       | 98-04                | COPY-02 |
| nested-`common` bare-token class, 37/27, MANDATORY SEQUENCING → `AR-04b`            | 98-04, 98-04b        | COPY-02 |
| the pre-`78c5ccefe` detector blindness statement                                    | 98-04b               | COPY-02 |
| the AR seed-pattern 3-of-4 semantic-not-lexical note                                | 98-06                | COPY-03 |
| exclamation floor 1/1 with the survivor proven                                      | 98-06, 98-08         | COPY-04 |
| **the `validation.json` carve-out WITH ITS REASON CITED and its cost stated**       | 98-06                | COPY-04 |
| the D-20 captured-set bound as amended by `RULING-P98A2-20`                         | 98-08                | COPY-04 |
| **the PARTIAL REPAIR OF ONE COMPONENT, stated as a PREDICATE not a number**         | 98-08                | COPY-04 |
| `@values` blind to hardcoded literals BY CONSTRUCTION                               | 98-06                | COPY-04 |
| class-2 literals + the 41 declared non-flags + the ~4.5k tail → `COPY-09`/P102      | 98-06, 98-08         | COPY-04 |
| 5 edge functions + `pdf-generate` → `EDGECOPY-01`/P102 (repair + DEPLOY + artifact) | 98-06                | COPY-04 |
| six named guard exemptions incl. the dead-code **VOID CONDITION**                   | 98-07                | COPY-05 |
| the relative-phrase class NOTHING covers, with two live members                     | 98-07                | COPY-05 |
| 2 more edge functions → `EDGECOPY-01`; `.map` exclusion → `CLIENTSEC-02`/P100       | 98-07                | COPY-05 |
| the latent `loading:statusMessage.completed` bundle value                           | **98-09**            | COPY-06 |
| the `en`-leg non-discriminator statement                                            | 98-03                | COPY-07 |
| `GUIDE-HOLLOW-01` asymmetry; the `typeGuide.learnMore` `AR-04a` interaction         | 98-03                | COPY-08 |
| **ADMIN-only, phase-wide** — on every one of the eight rows                         | all                  | all     |

**`NAV-01` is byte-untouched** (0 diff lines), and so is `COPY-09`'s row. The register diff is
**8 changed / 8 added**, and the only ids on changed lines are `COPY-01`…`COPY-08`.

**No requirement DEFINITION was edited** — execution proved none of them factually wrong. Definition
checkboxes were deliberately left alone, with the reason: three read `[x]` only because
`requirements.mark-complete` writes both cells when the pre-flipping lanes ran it, and **there is no
convention to restore** — among ids whose traceability row reads `Complete`, **25 carry `[x]` and
21 carry `[ ]`**, `NAV-01` among the latter.

---

## 8. Deviations from plan

**None requiring a decision.** No auto-fix was needed; zero package installs (`T-98-SC` holds). Three
things are worth naming rather than leaving in the diff:

1. **The Task-2 gate reds on a lowercase token I had only written shouting.** It requires
   `falsification`; my §2 heading said `FALSIFICATION`. I added the lowercase word to the section's
   own prose rather than touching the gate. **The gate was right and my prose was thin** — a
   section that names its drill only in a heading has not explained why the drill exists.
2. **`scripts/*.mjs` is outside lint-staged and outside prettier's enforced surface.** All 17
   pre-existing `scripts/*.mjs` are prettier-non-clean; my two match the house, and reformatting them
   would have changed derivation bytes for no enforced gain.
3. **My own three widenings mutated three closed gates' subjects.** Named in `98-GATE-DRILL.md`
   §PCM-3 with each re-drill result, because a closing plan that mutates the tree and does not say
   which gates it disturbed is the same failure one level up.

---

## 9. Threat flags

`T-98-18` (unattributed coverage claims) — **mitigated and exercised**: both scanners RUN inside
their gates, and the falsification drill landed in both colours.
`T-98-19` (a definition or another phase's row edited at close) — **mitigated and MEASURED**:
`NAV-01` and `COPY-09` have 0 diff lines; the whole register diff is 8/8 over `COPY-01..08` only.
`T-98-20` (a uniform pass read as strength) — **mitigated**: the weakest point is named, machine-pinned,
and derived against the two candidates the plan predicted, both of which lost.
`T-98-SC` (package installs) — **holds: zero installs.**

---

## 10. Commit hygiene, and the pre-close disk check

Six commits, **`git commit -F <msgfile> -- <paths>` exclusively**, pathspec built from my own edit
table and never from `git status`. Staging was unavoidable exactly twice (three untracked instrument
files; one untracked record) and in both cases the index was asserted **EMPTY before the first
stage** and **EQUAL to the intended set immediately before commit**, with a planted-path control
proving the comparator discriminates. `git show --stat HEAD` was READ after every commit; no file I
did not author appeared in any of them. **Never a bare `git add`, never `git add -A`, never
`git commit -a`, never `--no-verify`.**

**Exogenous set untouched:** `CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`,
`.claude/skills/*`, `_archive-98-attempt1-260818/`, `stash@{0}`. Verified per commit by a filter
shown FIRING on a planted exogenous path.

**Pre-close disk check — the population is artifacts existing only OUTSIDE HEAD, not files in a
scratchpad.** All eight authored files are carried by HEAD. The working tree is clean of everything
except the exogenous set. `tests/e2e/` is clear of `p98-exec-*` and `OFFERED-*` — **an untracked
spec left inside `testDir` gets COLLECTED by any suite-wide Playwright run**, so instruments stayed
out of it. Every temp path carries this seat's name (`p98-exec-09-*`); **no stray generic temp file
was encountered**, and had one appeared it would have been preserved and reported, never tidied.

---

## 11. Operator parks — untouched, not closed by me

Arabic naturalness, pixel RTL, the `/calendar` baseline, `E2ECRED-01`. **No human checkpoint was
auto-answered; none was presented.** I authored no `ar` copy on this trip.

---

## 12. The weakest point, VERBATIM from the closing record so the two cannot drift

> **THE WEAKEST POINT OF PHASE 98 IS THE 39 CRITERION-1 MEMBERS THAT WERE TRIAGED BY READING, HANDED
> OFF, AND HANDED OFF TO NOBODY.**

It beat the two candidates the plan predicted on one question — _what would it cost if this were
wrong, and what would tell us?_ The UNDRIVEN `entityLinks` surfaces are census-closed with an
instrument control and self-resolve the moment a ticket exists; the `CANNOT CONSTRUCT` halves are
each owned and re-verifiable in one command, one of them carrying a VOID CONDITION that fires by
itself. The 39 have none of those properties: **they name a plan number and no register row; 24 of
them were ruled out on a rule that is CORRECT while only five receivers were opened; and no
instrument in this phase can see a prop-receiver render.**

**A uniform pass would itself have been a finding, and this phase did not produce one.** Four of
seven criteria close BOUNDED. Two of 31 oracle tests fail, both on named preconditions. Four of 21
gates are `CANNOT CONSTRUCT`. Three register rows were flipped by the lanes that repaired them.
Nothing was smoothed to make the close look clean.

SUMMARY-END
