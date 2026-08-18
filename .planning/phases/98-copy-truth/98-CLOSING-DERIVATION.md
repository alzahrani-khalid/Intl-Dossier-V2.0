# 98-CLOSING-DERIVATION — Phase 98 "Copy Truth", closed honestly

**Written by plan `98-09` (Wave 6), 2026-08-18. Single writer of this file and of
`.planning/REQUIREMENTS.md`.** Every number below is DERIVED by a command run while writing this
record, with its control, and the command is shown. Nothing is re-quoted from a SUMMARY as fact
(D-04). Where a SUMMARY's figure and mine differ, both are printed and the difference is attributed.

---

## §0 — THREE REGISTER ROWS WERE PRE-FLIPPED. THEY ARE CLAIMS, NOT EVIDENCE.

**Standing law, issued by the OVERSEER during this plan's execution: flipping a requirement to
Complete is the closing derivation's EXCLUSIVE act.** At the time this plan started,
`REQUIREMENTS.md:891-893` already read `Complete` for `COPY-06`, `COPY-07` and `COPY-08`.

**Attribution, derived by a flip detector, not by reading commit subjects:**

```
$ for each commit touching .planning/REQUIREMENTS.md since 98824ca77:
    same id with "| Pending" REMOVED and "| Complete" ADDED in one commit?
  FLIP  116f0fdfb   COPY-07 COPY-08      (docs(98-03): the lane that REPAIRED them)
  FLIP  c71f42515   COPY-06              (docs(98-04): the lane that REPAIRED it)
  no-flip on the other ELEVEN commits
```

**The repairing lane marked its own requirement complete, before any closing derivation ran.** That
is self-certification, and it is exactly what a single-writer closing plan exists to prevent: the
closing derivation is meant to be the FIRST place a requirement is called complete, not a read-back
of a claim the repairing lane wrote about itself.

**Consequence, applied throughout §1 and §3: those three cells are treated as CLAIMS.** `COPY-06`,
`COPY-07` and `COPY-08` are re-derived below from RENDERED EVIDENCE THIS PLAN OBSERVED ITSELF —
a phase-gate run of all eight oracles taken while writing this record — exactly as if their rows
read Open. No conclusion in this document rests on the pre-flipped cells.

### The single-writer invariant, restated with its measured carve-out

**The invariant is ONLY-AMONG-PLANS.** Derived: exactly one plan file in the phase declares this
file in its frontmatter.

```
$ command grep -c '^  - \.planning/REQUIREMENTS\.md' .planning/phases/98-copy-truth/98-*-PLAN.md
  98-01..98-08: 0 each      98-09: 1        sum = 1
```

**But the file's real writer set is bigger than the plan set, and a reader who greps its history
will find that immediately.** From the phase base `98-CONTEXT.md` itself names — `98824ca77`, "the
digest repair it ships with" — the writer set is **THIRTEEN commits: 2 plan-authored and 11
ruling-authored.** Control: the same log shape over the phase directory returns **32**, so the
sweep is live rather than silently empty.

**A POPULATION DISAGREEMENT, PRINTED RATHER THAN RECONCILED — THEN DIAGNOSED.** The overseer
independently derived **TEN** (2 plan-authored / 8 ruling-authored). The difference is entirely
**where the phase base is drawn**: its ten begins at `220abf343`, excluding three earlier
ruling-layer commits — `7b9d5348f` (RULING-02), `b5ba2ac37` (RULING-03) and `2aad479bc` (the
CLIENTSEC-02 filing). Both counts are correct about their own population; the SPLIT and the FINDING
are identical under both. Writing one number and hiding the other is the move this phase has caught
along eight separate dimensions, so both are here.

**RESOLVED, and the diagnosis is worth more than the number.** The overseer re-derived and confirmed
**THIRTEEN** from the CONTEXT-named base, naming the three extra commits exactly. **Its ten was
counted from `4e107b5d3` — the leg-1 / leg-2 boundary — which is where ITS OWN WORK began, not where
the PHASE began.** `98-CONTEXT.md` names `98824ca77` as the phase base at its own lines 6 and 17.
**The population had been defined by the observer's start point rather than by the subject's
boundary.** That is a NINTH dimension, catalogued at close and recorded in §7: **ORIGIN, chosen for
the observer's convenience.** It was found by reading the CONTEXT document instead of trusting a
number handed down, which is the only reason it surfaced at all.

**The carve-out is MEASURED ON BOTH POLARITIES, not asserted — and this table is the EVIDENCE FOR
it, not a check that passed.** The ruling layer files ROWS, BOUNDS and NOTES — which is what filing
means — and never flips a status cell. Reproduced independently by the overseer across all thirteen
commits. A narrower detector ("did a ruling ADD a `Complete` cell?") also returns 0 and is correct
for that question, but **could not have distinguished a filing from a flip**; this one does:

| detector                                           | 11 ruling commits |             the 2 plan commits |
| -------------------------------------------------- | ----------------: | -----------------------------: |
| added `- [x] **ID**` checkbox                      |             **0** |                        2 and 1 |
| same-id `Pending` removed **and** `Complete` added |             **0** | `COPY-07`+`COPY-08`, `COPY-06` |
| added status cell (coarse)                         |                 3 |                        2 and 1 |

The three coarse hits are **FILINGS OF NEW ROWS CARRYING `Pending`** — `COPY-09` (`7b9d5348f`),
`CLIENTSEC-02` (`2aad479bc`), `EDGECOPY-01` (`c1351090c`) — not flips. The detector discriminates in
both directions, which is the only reason its eleven zeros mean anything.

### ONE FINDING, TWO INSTANCES: the ruling layer as an UNMODELLED WRITER

Written as one finding because the generalisation is the useful part.

1. **Commit discipline.** A stray bare `git add` left `.planning/REQUIREMENTS.md` — a ruling-layer
   file — in a seat's index on a shared tree (`98-07` §11). Every one-writer-per-file rule in force
   had modelled only the SEATS. Nothing was lost, and 98-07 recorded that as luck rather than
   discipline.
2. **Single-writer accounting.** This plan's own first derivation counted only plan-authored writes
   and returned **2**. The file's actual writer set is 13 (or 10 by the other base), because the
   ruling layer writes it too.

**Two different invariants, the same hole: we modelled seats as writers and never modelled rulings
as writers.** The overseer adds its own tally line, carried here as filed rather than softened:
**the `[x] COPY-08` cell was VISIBLE to it while it edited the adjacent row, and went unremarked** —
the same shape as `98-08` reading past `Binary file … matches` in its own first tool result. The
evidence was in hand and unread.

---

## §1 — REQUIREMENT COVERAGE, RE-DERIVED BY COMMAND (D-01, D-02)

### §1a The register is the queue

```
$ command grep -n "^| COPY-0[1-8] " .planning/REQUIREMENTS.md
886:| COPY-01 |  887:| COPY-02 |  888:| COPY-03 |  889:| COPY-04 |
890:| COPY-05 |  891:| COPY-06 |  892:| COPY-07 |  893:| COPY-08 |
rows = 8      all owned by "Phase 98 — Copy Truth" = 8 of 8
```

### §1b The ROADMAP entry is its digest

```
$ awk '/^### Phase 98: Copy Truth/,/^### Phase 99/' .planning/ROADMAP.md | grep '^\*\*Requirements\*\*:'
**Requirements**: COPY-01, COPY-02, COPY-03, COPY-04, COPY-05, COPY-06, COPY-07, COPY-08
```

### §1c THE COMPARISON IS STATED, NOT ASSUMED (D-02)

Both sides derived in the same run, sorted, compared as sets:

```
register : COPY-01 COPY-02 COPY-03 COPY-04 COPY-05 COPY-06 COPY-07 COPY-08
roadmap  : COPY-01 COPY-02 COPY-03 COPY-04 COPY-05 COPY-06 COPY-07 COPY-08
MATCH: register == roadmap, 8 ids, exact.
```

They agreed at `98824ca77` and they still agree at close. **They did NOT agree before that commit** —
the digest named five ids while the register owned eight — which is why this comparison is run
rather than assumed.

### §1d Every id is claimed by a plan — a silent drop is a REJECT (D-01)

Derived by inverting the plan frontmatter, one id at a time, with the missing branch printed by name:

| id      | plans declaring it                            | closing plan(s) — the lane that landed the work        |
| ------- | --------------------------------------------- | ------------------------------------------------------ |
| COPY-01 | 98-01 · 98-05 · 98-09                         | **98-05** (Part A/B + week header + the B3 widening)   |
| COPY-02 | 98-01 · 98-04 · 98-09                         | **98-04** (+ 98-04b, the detector's own blindness fix) |
| COPY-03 | 98-01 · 98-06 · 98-09                         | **98-06**                                              |
| COPY-04 | 98-01 · 98-03 · 98-04 · 98-06 · 98-08 · 98-09 | **98-06** (values) + **98-08** (case)                  |
| COPY-05 | 98-01 · 98-02 · 98-07 · 98-09                 | **98-07** (98-02 built the instrument)                 |
| COPY-06 | 98-01 · 98-04 · 98-09                         | **98-04**                                              |
| COPY-07 | 98-01 · 98-03 · 98-09                         | **98-03**                                              |
| COPY-08 | 98-01 · 98-03 · 98-09                         | **98-03**                                              |

**8 of 8 claimed. Zero silent drops.** Control: the same inversion run for a non-existent
`COPY-99` prints `** NO PLAN DECLARES IT — REJECT (D-01) **`, so the eight non-empty rows are a
measurement and not a loop that never executed.

---

## §2 — DECISION COVERAGE, AND ITS FALSIFICATION DRILL IN BOTH COLOURS

A green scanner run is half of this section. The other half is a falsification drill landed on disk
in both colours, because **a coverage gate that has only ever been green has not been shown to
work** — it is indistinguishable from a scanner that cannot fail.

### The GREEN

```
$ node scripts/decision-coverage.mjs \
    /…/.planning/phases/98-copy-truth /…/.planning/phases/98-copy-truth/98-CONTEXT.md
RC=0
  "passed": true,  "plans_scanned": [98-01 … 98-09],  "total": 30,  "covered": 30,
  "uncovered": []
```

30 of 30 decisions `D-01`…`D-30`, every one cited mechanically in at least one plan's frontmatter
truths, must-haves or objective. `D-01`, `D-02` and `D-03` are cited by **this plan alone** — which
is correct, because they are the closing plan's own obligations.

### The FALSIFICATION DRILL — **a coverage gate never seen red is a gate nobody tested**

Run on disk in a scratch copy of the phase directory. **Control first:** the untouched scratch copy
reproduces `total 30 / covered 30 / uncovered []`, so the copy itself is not the variable.

**RED.** All 8 `D-22` citations rewritten to `D-XX` in the scratch `98-04-PLAN.md` only:

```
RC=1
  passed : False
  total  : 30   covered: 29
  uncovered:
    id   = D-22
    text = **D-22: (criterion 2, Q2 — the `calendar.recurrence` instance is REAL; the repair is ROUTING).**
```

**GREEN.** The scratch plan restored from the live tree, same command:

```
RC=0
  "passed": true,  "total": 30,  "covered": 30,  "uncovered": []
```

**The live tree was never touched by the drill** — `command grep -c "D-22"` on the real
`98-04-PLAN.md` returns **8** before and after. The gate names the specific decision it lost, not
just a count, which is what makes a red actionable rather than a puzzle.

---

## §3 — CRITERION → ORACLE CLOSURE, WITH EVERY GREEN'S LOCALE AND ROLE

**Every green in this table states its LOCALE and its ROLE** (pre-commitment 2 — a green without its
bound stated is not a green). **Role is `admin` (`TEST_USER_EMAIL`) for every rendered leg in this
phase, without exception.** No non-admin role was ever driven; `E2ECRED-01` → P101 means no
storage-state fixture is usable, so every leg logs in inline.

### The run of record for this table — taken by THIS plan, not inherited

```
$ # all 8 spec files asserted present, count hardcoded to 8 BEFORE the paths were passed (D-09)
$ pnpm exec playwright test <8 explicit paths> --project=chromium-en --no-deps --workers=1 \
    --reporter=json
expected=29  unexpected=2  skipped=0  flaky=0  duration=279 s
```

| spec                 | `test(` declarations | enumerated | passed | failed | skipped |
| -------------------- | -------------------: | ---------: | -----: | -----: | ------: |
| 98-copy01-labels     |                    6 |          6 |      5 |  **1** |       0 |
| 98-copy02-rawkeys    |                    7 |          7 |      6 |  **1** |       0 |
| 98-copy03-dashboard  |                    3 |          3 |      3 |      0 |       0 |
| 98-copy04-voice      |                    4 |          4 |      4 |      0 |       0 |
| 98-copy05-dates      |                    4 |          4 |      4 |      0 |       0 |
| 98-copy06-toast      |                    1 |          2 |      2 |      0 |       0 |
| 98-copy07-statscard  |                    2 |          2 |      2 |      0 |       0 |
| 98-copy08-eo-popover |                    2 |          3 |      3 |      0 |       0 |
| **total**            |               **29** |     **31** | **29** |  **2** |   **0** |

**SKIPPED IS NOT PASSED — the rule was CHECKED, not assumed.** The reporter's own `skipped` is **0**
and `command grep -c "test.skip"` summed across all eight files is **0**. A skip would have been
counted as a failure here; there were none to count.

**The 29 → 31 delta is reconciled, not waved at.** Two declarations are locale-parameterised and
each produces two runtime tests: `98-copy06`'s single toast declaration (`[en]` + `[ar]`) and one of
`98-copy08`'s two (`[en]` + `[ar]` popover). `29 + 2 = 31`. Expected-from-declaration-lines is the
97 §4c rule; where a declaration fans out, the fan-out is named rather than absorbed.

**BOTH failures are the two legs this phase named UNDRIVEN / NOT CONSTRUCTED from wave 1, and each
fails on its own precondition assertion quoting its own reason.** Neither is a repair that missed:

```
[failed] 98-copy01 :: engagements week headers carry no ISO-week token
   /engagements [en] renders no week-grouped list, so EngagementsList — the only renderer of the
   `WEEK OF 2026-W27` header — never mounts. The ISO-week leg is NOT CONSTRUCTED at this HEAD
[failed] 98-copy02 :: the intake ticket detail renders no raw key on the entity-link surface
   no intake ticket reachable from /intake/queue under en — leg UNDRIVEN (D-24)
```

### The seven criteria

| #   | requirement(s)     | named oracle                                                      | result and its BOUND — locale · role                                                                                                                                                                                                                                                                                                                                | exceptions carried                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | COPY-01            | `98-copy01-labels` + a bundle-resolving finder                    | **5/6, BOUNDED.** Signal source-type labels and waiting-queue status+priority render as labels — **en + ar**, admin, observed red at wave 0 and green now. `KanbanTaskCard`, `ActivityTimelineSection`, `AssignmentDetailsModal`, all 6 Part-B sites: source + type-check + **resolution** only, **NOT rendered-verified**                                          | ISO-week leg **NOT CONSTRUCTED** (`ENGREAD-01` → P102). Dynamic-prefix mask class **24 unresolved / 19 masking a raw value**, KNOWN·MEASURED·UNREPAIRED → `AR-04b`/P99. 22 Part-A + 17 Part-B text-position members handed off. **Criterion 1 does NOT read as whole**                                                                                |
| 2   | COPY-02            | `98-copy02-rawkeys` + resolution censuses                         | **6/7, BOUNDED.** Country-wizard and auth surfaces carry no raw key — **en + ar**, admin. `entityLinks` **97 leaves × 2 locales**, parity exact; `calendar.recurrence` 43 sites routed with conservation proven; `calendar.months` 1; `common.*` ×7 — all resolution-verified in both locales                                                                       | Intake-ticket detail **UNDRIVEN** (zero tickets on staging). AI-suggestion accept/reject **UNDRIVEN** (needs the AnythingLLM backend). `RecurrencePatternEditor` **UNDRIVEN** (no spec drives it) — census + conservation only. Dot-form long tail **ORDER HUNDREDS** (306/353, deliberately unreconciled) → `AR-04b`                                 |
| 3   | COPY-03 **[V]**    | `98-copy03-dashboard`                                             | **3/3, CLOSES IN FULL** on CDP-forced empty, CDP-forced error and route-fulfilled VIP-empty states — **en + ar**, admin. Re-run by this plan **three times** (two consecutive full-file RC 0, one isolated RC 0) discharging `RULING-P98A2-13` B2                                                                                                                   | The `ar` defect-term pattern matches **3 of the 4** AR pairs — `vip.empty.body` carried the seed instruction SEMANTICALLY, not lexically, and was repaired on key parity. A "4 AR hits" claim would have been a correct instrument returning a wrong number                                                                                           |
| 4   | COPY-04            | `98-copy04-voice` `@values` + `@case`                             | **4/4, BOUNDED.** `@values`: EO CTA sentence case and glossary `Deadline` — **en + ar**, admin. `@case`: **`en` ONLY, stated** (Arabic has no letter case). Exclamation leg **`en` only**. i18n-JSON populations closed in full: exclamation floor **1 EN / 1 AR**, first person **3 candidates, all verdicted OUT**, retired term **1 EN** (the ruled carve-out)   | Sentence case bounded to the captured set: **389 raw captures over 8 surfaces → 95 distinct matched → 3 flagged, 3 repaired, 0 KEEP**. 41 single-capital labels DECLARED non-flags → `COPY-09`. Hardcoded literals invisible **BY CONSTRUCTION**. Retired term in **5 edge functions** → `EDGECOPY-01`. **PARTIAL REPAIR OF ONE COMPONENT** — see §4f |
| 5   | COPY-05            | `98-copy05-dates` + the extended lint guard + a built-bundle grep | **4/4, CLOSES on its ruled population.** `/activity?lng=ar` renders `منذ 4 أشهر` out of the feed's own cells while the `en` leg finds no Arabic token anywhere in `main` — **en + ar**, admin, which is what makes the `ar` green discriminating rather than ambient. `intake:fillMock` absent from the EMITTED bundle with all four controls in one post-build run | `MMMM yyyy` month headers OUT by D-25. SLA `T−3`/`T+2` and labelled counters OUT by `RULING-P98A2-17`. **6 named permanent guard exemptions**, one of them a dead-code exemption with a stated **VOID CONDITION**. 2 edge functions → `EDGECOPY-01`. `.map` files excluded → `CLIENTSEC-02`/P100                                                      |
| 6   | COPY-06            | `98-copy06-toast`                                                 | **2/2, CLOSES IN FULL.** A **real** kanban TASK stage move raises the localized toast — `Changes saved` under **en**, `تم حفظ التغييرات` under **ar**, admin. The `ar` leg is the designated negative control and it is green. **Observed by THIS plan**, 5.8 s / 6.3 s                                                                                             | Generic-but-localized is the ruled end state; per-mutation specific copy explicitly NOT required. The English sentence still exists as a LATENT bundle value under a different key — §4g                                                                                                                                                              |
| 7   | COPY-08 (+COPY-07) | `98-copy08-eo-popover`, `98-copy07-statscard`                     | **3/3 + 2/2, CLOSES IN FULL.** The EO popover renders header, description and all four sections resolved — **en AND ar**, admin, with exactly 1 `lucide-crown`, 0 `lucide-globe` and `text-primary`. The stats-card label renders `النسبة من إجمالي الملفات النشطة` under `?lng=ar` with no English residue. **Observed by THIS plan**                              | The `en` leg of `98-copy07` PASSES and the spec **labels it a non-discriminator** — the EN value is byte-identical before and after the repair, so it is never counted as evidence. Seven sibling type-guide bodies stay hollow: `GUIDE-HOLLOW-01` → **Phase 102**, the tracked state, not a defect                                                   |

**Criteria 1, 2, 4 and 5 close BOUNDED by ruling and DO NOT read as whole.** Criteria 3, 6 and 7
close in full on rendered surfaces. That is four of seven bounded, and it is stated here rather than
left to be discovered in the ROADMAP's fine print.

---

## §4 — CLOSING POPULATION STATEMENTS, AND EVERYTHING THAT LEAVES THE PHASE

### §4a Every population re-derived at close, with what falls OUTSIDE (D-04 / D-05)

Derived by one walker over `frontend/src/i18n/{en,ar}` at HEAD — **129 namespaces per locale,
16,203 EN + 16,227 AR = 32,430 leaf string values**. That total is an exact independent match for
`98-08`'s separately written 32,430-leaf comparator: two instruments, one number.

| population                   | definition and CASING RULE                                                                            | at close                                            | OUTSIDE it                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `entityLinks` leaves         | every leaf under `common:entityLinks.*`, both locales                                                 | **97 / 97, parity diff 0**                          | the sibling `entity-linking.json` namespace; the backend; the dead `public/locales`                                      |
| exclamation floor            | leaf values containing `!`; casing N/A (one punctuation character, stated anyway)                     | **1 EN / 1 AR**                                     | hardcoded TSX literals; `t()` default masks (→ P99)                                                                      |
| — and the survivor is PROVEN | `validation:password.addSpecial` = `Add special characters (!@#$%^&*)` / `أضف رموزًا خاصة (!@#$%^&*)` | a **deliberately non-zero** floor                   | a zero here would have killed `98-copy04`'s own `bangValues.length > 0` self-test                                        |
| first-person plural          | EN leaves matching `\b([Ww]e\|[Oo]ur\|[Ll]et'?s)\b\|\bus\b`; **case-SENSITIVE** so `US` cannot enter  | **3 candidates, 0 unverdicted**                     | 27 repaired; the 3 survivors are 2 USER-speaker strings and 1 domain term (`dossier:overview.positions.ourStance`) → P99 |
| retired terminology          | EN `/due[ -]date/i` — **case-INSENSITIVE** (`RULING-P98A2-14`); AR on the ROOT `استحقاق`              | **1 EN / 5 AR**                                     | the EN survivor is the RULED `validation.json` carve-out; the 5 AR are 1 carve-out + 4 named out-of-scope members        |
| Part A enum renders          | a DB-backed enum value reaching the screen as user copy, `frontend/src/**/*.tsx`                      | 52 raw → **26 text-position**                       | 24 prop-position (only 5 receivers opened), 1 JSDoc, 1 non-JSX. **6 routed, 22 handed off**                              |
| Part B de-snake hacks        | `.replace(/_/g,' ')` over `frontend/src`, tests excluded                                              | **27** = 6 routed + 4 data-not-copy + 17 handed off | zero `.ts` sites — a zero meaningful only because the same run returned 27                                               |
| date/relative-time classes   | any path RENDERING a now-relative phrase; **code half case-SENSITIVE, copy half case-INSENSITIVE**    | burn-down **0 rows / 0 sites**                      | 6 named permanent exemptions; 2 edge functions; `MMMM yyyy`; `T±N`; labelled counters                                    |
| D-20 captured labels         | settled render on 8 surfaces, reverse-bundle exact match, **case-SENSITIVE by necessity**             | 389 raw → 95 matched → **3 flagged**                | the ~4.5k tail; 41 declared non-flags; sibling-role variants; Arabic values                                              |

**A whole-bundle parity check nobody asked for, run because it was cheap and it could have embarrassed
the phase:** `en`-only keys **0**, `ar`-only keys **24**. The 24 are **12 Arabic plural forms**
(`_zero/_two/_few/_many`, which English does not have — correct by i18next design) and **12
`common:dossierLinks.entityTypes.*`** keys from `2d2f5d7f1` (**2026-01-23, pre-Phase-98**). No Phase
98 commit touches `dossierLinks` (`git log -S` over the phase range returns nothing). **Pre-existing,
named, not this phase's.**

### §4b The OUT list, restated with owners (D-03)

| out of this phase                                                                                   | owner                                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `GUIDE-HOLLOW-01` — the seven sibling type-guide bodies; and the guide's local colour-switch drift  | **Phase 102**                                                |
| `COPY-09` — the ~4.5k sentence-case tail, the 41 declared non-flags, the class-2 hardcoded literals | **Phase 102**                                                |
| `ENGREAD-01` — `/engagements` renders no list, so the ISO-week header never mounts                  | **Phase 102**                                                |
| `EDGECOPY-01` — 5 edge functions ship the retired term + 2 ship now-relative copy                   | **Phase 102**                                                |
| `AR-01..04` — Arabic naturalness, the single-term glossary, pixel RTL                               | **Phase 99**                                                 |
| `AR-04a` — `t()` English-default masks                                                              | **Phase 99**                                                 |
| `AR-04b` — the dot-form long tail, the mask class, the nested-`common` inversion                    | **Phase 99**                                                 |
| `CLIENTSEC-02` — production sourcemaps embed verbatim sources (305 `.map`)                          | **Phase 100**                                                |
| `E2ECRED-01`, `ROOTALIAS-01`, CI                                                                    | **Phase 101**                                                |
| per-mutation success copy                                                                           | set aside by `RULING-P98A2-01-SCOPE` F1-b                    |
| **`NAV-01` — a Phase 97 row, NOT EDITED BY ANY PLAN**                                               | **Phase 97; its dated note is the overseer's close-out act** |

**`NAV-01` is byte-untouched.** Verified rather than claimed: no Phase 98 commit alters its row, and
this plan's register gate asserts it still reads `Complete (BOUNDED…)` in its Phase 97 shape.

### §4c EVERY UNDRIVEN, NOT-CONSTRUCTED AND HANDOFF LINE FROM ALL NINE SUMMARYs — ONE LIST

| #   | line                                                                                                                                                                                                                                                                                                                                                      | origin SUMMARY       | owner / disposition                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------- |
| 1   | copy01 `/engagements` ISO-week leg — no week-grouped list mounts; observed once as `Unable to load data`                                                                                                                                                                                                                                                  | 98-01, 98-05         | `ENGREAD-01` → **P102**                        |
| 2   | copy02 intake-ticket entity-link leg — staging holds **zero** intake tickets; locator control returns 24 links on the same page                                                                                                                                                                                                                           | 98-01, 98-04, 98-04b | census + this line (D-24)                      |
| 3   | copy02 AI-suggestion accept/reject leg — needs the AnythingLLM backend, outside the dev-server oracle                                                                                                                                                                                                                                                     | 98-01, 98-04         | census (19/19 resolve) + this line             |
| 4   | copy02 `RecurrencePatternEditor` leg — no 98 spec drives that component                                                                                                                                                                                                                                                                                   | 98-01, 98-04         | 37-path census + the conservation gate         |
| 5   | copy04 `Deadline / Due Date` chip — `CalendarEmptyWizard` has **zero importers**; the key family was DELETED instead (`RULING-P98A2-05` E1-a Q5 form)                                                                                                                                                                                                     | 98-01, 98-06         | closed on `/commitments` instead               |
| 6   | 22 Part-A text-position members outside 98-05's reservation                                                                                                                                                                                                                                                                                               | 98-05                | **handed off, unowned** — see §5               |
| 7   | 17 Part-B de-snake members outside the reservation                                                                                                                                                                                                                                                                                                        | 98-05                | **handed off, unowned** — see §5               |
| 8   | the dynamic-prefix mask class, **24 unresolved / 19 masking a raw value**                                                                                                                                                                                                                                                                                 | 98-05                | `AR-04b` → **P99**, instrument committed       |
| 9   | 4 Part-B `metrics` JSONB sites verdicted **data-not-copy** — no enumerable domain                                                                                                                                                                                                                                                                         | 98-05                | closed by verdict, not by repair               |
| 10  | the colon-form `common:*` inversion — **37 sites / 27 distinct**, renders a BARE UNDOTTED token invisible to every dotted-token detector                                                                                                                                                                                                                  | 98-04, 98-04b        | `AR-04b` → **P99**, MANDATORY SEQUENCING       |
| 11  | `AISuggestionPanel.tsx:294` (`entityTypes.*` with no prefix) and `EntitySearchDialog.tsx:555,576,584` (hardcoded `Match:`/`Level:`/`Last used:`)                                                                                                                                                                                                          | 98-04                | named, not repaired                            |
| 12  | `common.actions.remove` near-duplicate created by the ruled uniform authoring                                                                                                                                                                                                                                                                             | 98-04b               | recorded, not hidden                           |
| 13  | `PDFGeneratorButton.tsx:201` still leaks `afterActions.pdf.both`; `:127` misses in both locales — a criterion-2 leak that happens to be a countdown                                                                                                                                                                                                       | 98-04b, 98-07        | `AR-04b` / criterion-2 repair form             |
| 14  | `dossier:overview.positions.ourStance` = `Our Position` — the ONE banned-file member any derivation found                                                                                                                                                                                                                                                 | 98-06                | **P99** glossary                               |
| 15  | class-2 hardcoded literals: `HelpPage:166`, `useBriefingBooks:164-165`, `PositionTrackerCard:93`                                                                                                                                                                                                                                                          | 98-06                | `COPY-09` → **P102**                           |
| 16  | **the `validation.json` carve-out, WITH ITS REASON:** it is an explicit plan carve-out whose own gate asserts the member SURVIVES; repairing it would have manufactured a deliberate ruling collision. Cost stated: `Due date is required` now reads `Deadline is required` through `commitments:` and still reads the retired form through `validation:` | 98-06                | named on `COPY-09`                             |
| 17  | the 5 edge functions shipping the retired term — `pdf-generate` writes it into a document the user KEEPS                                                                                                                                                                                                                                                  | 98-06                | `EDGECOPY-01` → **P102**                       |
| 18  | 2 more edge functions shipping now-relative bilingual copy                                                                                                                                                                                                                                                                                                | 98-07                | `EDGECOPY-01` amendment → **P102**             |
| 19  | `NotificationList.tsx:125-126` and `NotificationPreviewTimeline.tsx:306` — hardcoded bilingual today/yesterday headers. **NO INSTRUMENT COVERS THIS CLASS**                                                                                                                                                                                               | 98-07                | found by a seat, ruled by nobody               |
| 20  | `CalendarTab.tsx:76,91` — one month-first render and a SECOND day-first implementation                                                                                                                                                                                                                                                                    | 98-07                | named, outside every file scope                |
| 21  | the `EnhancedActivityFeed` dead-code guard exemption — **VOID CONDITION: if this file gains an importer the exemption is void and both rows RETURN.** Re-verified at close: still **zero importers**, live control returns **9**                                                                                                                          | 98-07                | a dead-code exemption, NOT a correctness claim |
| 22  | 5 more guard exemptions (`sla.types.ts`, `LifecycleStepperBar`, `LifecycleTimeline`, `SLACountdown`, `OverdueCommitments`)                                                                                                                                                                                                                                | 98-07                | ruled OUT by `RULING-P98A2-17` §1(b)/(c)       |
| 23  | 3 COMPLIANT MEMBERS, not exemptions (`DrawerMetaStrip`, `DelegationCard`, `ConflictResolutionDialog`) — **an exemption and a compliant member are different artifacts; only the second survives an audit with the JSON open**                                                                                                                             | 98-07                | closed as compliant                            |
| 24  | the 41 captured-but-unflagged single-capital labels, enumerated in full and untouched                                                                                                                                                                                                                                                                     | 98-08                | `COPY-09` → **P102**                           |
| 25  | **the PARTIAL REPAIR OF ONE COMPONENT** — see §4f                                                                                                                                                                                                                                                                                                         | 98-08                | `COPY-09` → **P102**                           |
| 26  | 98-06's offered ninth probe for `/help/commitments`, preserved but NOT adopted (RED-BASELINE counts eight and every gate cites that figure)                                                                                                                                                                                                               | 98-06, ruling 16     | candidate instrument on `EDGECOPY-01`          |
| 27  | `98-07`'s commit `83c820d9e` is **EMPTY** — self-reported, not amended, not reset                                                                                                                                                                                                                                                                         | 98-07                | recorded; a log that says what happened        |
| 28  | the LATENT date-fns gap: `…Strict` / `intlFormatDistance` / `formatRelative` return 0 today against a control of 46 — one import re-opens it                                                                                                                                                                                                              | 98-07                | narrowed by check 9b; closed by nothing        |

### §4d The phase-wide evidence bounds — one list

- **ROLE: admin only.** Every rendered green in this phase. No non-admin role was driven at any point.
- **LOCALE:** both legs by `?lng=` inside `chromium-en`; **there is no `chromium-ar` project**. The
  `@case` leg is **`en` only** by orthographic necessity and says so; the `@values` exclamation leg
  is **`en` only**.
- **VIEWPORT:** 1400×900 throughout. No mobile or 768px leg was driven.
- **DATA PRECONDITION UNMET:** staging holds zero intake tickets, which is what makes item 2 above
  undriveable — a data fact, instrument-tested, not a locator failure.
- **BACKEND PRECONDITION UNMET:** AnythingLLM is outside the dev-server oracle.
- **SEARCH SPACE:** every P98 instrument, bundle-grep included, operates on `frontend/src`.
- **`--workers=1`** for the runs of record: eight parallel logins on one account reddens tests at
  the auth throttle, and a red that names the throttle is not a control.

### §4e The five instruments that returned a CONFIDENT FALSE GREEN

1. **zsh does NOT word-split** — `set -- $pair` leaves `$2` empty and the loop reports IDENTICAL
   from a comparison that never ran. Bit three separate seats.
2. **`comm` on unsorted input** misbehaves silently — and a "planted collision" that plants a member
   **already present** is not a control.
3. **zsh colon modifiers** — `git show $c:path` is read as the `:s` substitution modifier; git
   errors, `2>/dev/null` hides it, and empty input counts as a clean zero. Use `${c}`.
4. **`awk /\x00/`** matches EVERY line, not lines containing NUL.
5. **A NON-ZERO CAPTURE GUARD** — it cannot distinguish shell from hydrated. In blind mode
   `/intake/queue` captured **twenty** elements. Partially closed by this plan; see §4f.

> **Every loop that produces a number carries a control that would FAIL if the instrument were
> broken. A control that cannot distinguish the two outcomes is not a control.**
>
> **When a fresh derivation contradicts an earlier one, the FIRST hypothesis is that the NEW
> instrument is broken — not that the old number was wrong.**

That second rule paid three times this phase and once inside this plan: five Playwright-running
gates exited 0 inside a 120 s cap against my own 2.0 m measurement of the same spec. I timed the
gate body rather than believing either number — RC 0, 66 s, 4 passed — and found both right
(`--workers=1` versus the gate's bare `--no-deps` going 4-way parallel).

### §4f The capture-count FLOOR, and where it deliberately does not exist

`98-08` shipped a per-surface `captured.length > 0` guard and then named it **DECORATIVE** for the
defect the wave existed to fix. This plan replaced it **only where a known-good run already exists**:

- **BUILT** for `@case`, from `98-08`'s settled record (98 / 73 / 34 / 38 / 37 / 49 / 29 / 31 raw
  over the eight surfaces), floor `ceil(known × 0.8)` = 79 / 59 / 28 / 31 / 30 / 40 / 24 / 25.
  Drilled both ways: with the settle neutered the run reds at
  `capture on /dossiers fell below its floor … known-good 98, floor 79`; pristine, `copy04` is 4/4.
- **NOT BUILT** for the `@values` exclamation leg — it walks the same eight surfaces with a WIDER
  selector set for which **no known-good run exists**. Its Law-1 line therefore reads, in the
  required terms: **no floor; nothing prevents shell-capture regression; instrument: none.**
  Manufacturing a floor from a run taken today would be inventing the baseline the floor exists to
  check against.
- **A margin honestly bounded:** on the only two surfaces where a blind-mode count was ever
  measured, the floor sits well above the shell (79 vs 38; 28 vs 20). On the other six the 0.8 is a
  stated convention, not a measured discriminator.

**THE PARTIAL REPAIR OF ONE COMPONENT, stated as a predicate rather than a number** (item 25 above).
`IntakeRoleEmptyState` maps admin → the `reviewer` variant. That variant's three labels are
repaired; **its `requester` / `assignee` / `viewer` sibling variants are left Title Case and were
never mounted, because the oracle runs admin only.** A green `@case` does not mean the component is
clean — it means it is clean **for admin**. **The sibling count is UNDER-DETERMINED and the
predicate is what is recorded:** 12 members under the oracle's own Title-Case predicate (2–6 words,
not ALL-CAPS, ≥2 non-initial words matching `^[A-Z][a-z]+$`), 23 under a looser one that is visibly
over-inclusive — it sweeps multi-sentence descriptions whose capitals are proper nouns (`MoU`,
`Organization X`), which are not Title Case at all. Owner `COPY-09` → P102.

### §4g One thing I found at close that no plan owns and no instrument looks for

**The exact English sentence criterion 6 exists to eliminate still ships in the bundle, under a
different key.** `loading:statusMessage.completed` = `Operation completed successfully`, with an
`ar` counterpart `اكتملت العملية بنجاح`. It is:

- **LOCALIZED in both locales** — so it is not criterion 6's defect, which is an _unlocalized_
  hardcoded literal at a call site;
- **NOT criterion 6's subject** — that is `frontend/src/lib/query-client.ts`'s `mutations.onSuccess`,
  which is repaired and gate-asserted at count 0;
- **rendered by NOTHING** — `command grep -rl "statusMessage"` over `frontend/src` excluding the
  i18n trees returns **0** consumers, against a control of **1** for `savedGeneric`.

So it is a **latent bundle value, not a rendered leak** — and it is recorded because no P98
instrument would ever have found it: they all look at the CALL SITE for the literal, and none
searches the BUNDLE for the string. Named, not repaired, and not a criterion-6 miss.

---

## §5 — WEAKEST POINT

**THE WEAKEST POINT OF PHASE 98 IS THE 39 CRITERION-1 MEMBERS THAT WERE TRIAGED BY READING, HANDED
OFF, AND HANDED OFF TO NOBODY.**

Derived, not chosen from a shortlist. The candidates were the two the plan predicted (the UNDRIVEN
`entityLinks` surfaces; a `CANNOT CONSTRUCT` Playwright half) plus everything §4c turned up, and
each was tested against one question: **what would it cost if this were wrong, and what would tell
us?**

- The **UNDRIVEN `entityLinks` surfaces** (§4c items 2–4) are census-closed at 97/97 with `en`/`ar`
  parity asserted, and their undriveability is a DATA fact with an instrument control. If the census
  is right the surfaces are right; a ticket appearing on staging tests it immediately. **Bounded and
  self-resolving.**
- The **`CANNOT CONSTRUCT` halves** (`98-05.t3`, `98-07.t1`, `98-07.t2`) are each named, owned and
  re-verifiable in one command. `ENGREAD-01` is filed with P102; the dead-code exemption carries a
  VOID CONDITION that fires automatically the moment an importer appears. **Bounded and armed.**
- The **24/19 mask class** was the strongest rival, and it loses for one reason: **its instrument is
  now committed at `scripts/partA_maskfinder.py`.** P99 inherits a runnable derivation, not a
  number.

**What is left has none of those properties.** `98-05` triaged 52 Part-A matches and 27 Part-B
matches by reading, routed 6 + 6, verdicted 4 as data-not-copy, and **handed off 22 + 17 = 39
members**. Three things make that the weakest green in the phase:

1. **THE HANDOFF HAS NO OWNER.** Every other bound in §4c names a register row and a phase. These 39
   name a plan number — `98-09` — and this plan repairs no product code. They are in a SUMMARY table
   and in **no** register row.
2. **THE TRIAGE RULE IS CORRECT AND THE POPULATION MAY STILL BE WRONG.** 24 matches were classified
   prop-position and therefore out, on the rule that "a prop is not copy until rendered; the
   receiving component becomes the member". **Only five receivers were opened.** If any unopened
   receiver renders its prop as bare text, that is a criterion-1 member labelled OUT — and it would
   look exactly like a correct triage, because the rule applied is right. The seat named this as its
   own weakest point and it was right; nothing since has closed it.
3. **NO INSTRUMENT WOULD CATCH IT.** The Part-A finder is shape-keyed (`{x.y}`) and was already
   proven blind to ternary and other expression positions — that blindness is how
   `EngagementsList.tsx:168-169` was found, by reading, not by the finder. A prop-receiver render is
   in exactly the same blind spot. `partA_maskfinder.py` does not see it either: it hunts unresolved
   dynamic key prefixes, and a bare `{props.status}` has no key at all.

**Three sharpenings, so this cannot be read as vaguer than it is.** `AssignmentDetailsModal.tsx:276`
and `ActivityTimelineSection.tsx:221` have **no rendered evidence at all** — their domains were
derived from live catalog queries and their families resolve in both locales, but nobody has watched
either render; `entity.status` in particular needs a populated `linked_entities` payload that was
never confirmed to exist. The `sourceStatus` family's 22 values were read out of a `SECURITY
DEFINER` RPC **at one instant on staging**: add a branch to that function later and the new status
renders as a raw key, and **no test guards that**. And `monitoring/Dashboard.tsx:81,85`, sitting in
the handed-off 22, also hardcodes the English word `Overall:` — a second defect class inside a
member nobody owns.

**What would close it:** give the 39 a register row with an owner, and drive the five most
plausible prop receivers on a rendered surface. What would NOT close it: re-reading the triage.

**A uniform pass would itself have been a finding, and this phase did not produce one.** Four of
seven criteria close BOUNDED. Two of 31 oracle tests fail, both on named preconditions. Four of 21
gates are `CANNOT CONSTRUCT`. Three register rows were flipped by the lanes that repaired them,
before any derivation ran. **Nothing here was smoothed to make the close look clean.**

---

## §6 — LAW 1: THE NEGATIVE-SCOPE PASS, PER ORACLE

**`RULING-P98A2-13`: every one of the EIGHT criterion oracles gains a stated NEGATIVE SCOPE line —
what it cannot see, and which instrument covers that blind spot, or "nothing does" said plainly.**
**`RULING-P98A2-20` item 7 extends it:** per oracle, state whether its subject can render post-shell
and whether the oracle settles, with the `RULING-11`-form scoping sentence for affected oracles;
DOM-independent instruments are unaffected **and the pass says so**.

### The settle census, re-derived — AND ITS BOUND IS MORE IMPORTANT THAN ITS COUNT

```
$ command grep -cE "waitForLoadState|waitForTimeout|networkidle|toPass\(|waitForFunction" tests/e2e/98-copy0*.spec.ts
copy01 0   copy02 1   copy03 0   copy04 3   copy05 2   copy06 2   copy07 0   copy08 0
control: 95-search-renders 1, 96-calendar-family 1   (a sibling-spec non-zero, so the zeros are real)
```

`copy04` reads **3** where `98-08`'s census read 0 — that is its wave-5 repair, not a disagreement.

> **PRESENCE IS NOT PLACEMENT.** A non-zero count proves a settle primitive EXISTS IN THE FILE, not
> that it RUNS BEFORE THE CAPTURE. So _"copy02/05/06 are fine"_ is precisely the claim that census
> cannot support, and `98-08` refused to make it.

**I did not make it either. I determined PLACEMENT instead**, by reading what each oracle waits on
before it reads anything, and by checking that determination against what each oracle's observed RED
and GREEN actually quoted. The finding is that the census was asking the wrong question:

**`@case` was not blind because it lacked a dwell. It was blind because it captures a SELECTOR CLASS
(`button, a, [role=tab], h1, h2, h3, …`) that the synchronous nav shell already satisfies.** Every
other oracle in this phase waits on a SPECIFIC DATA-DRIVEN locator — a row, a card, a region, a
popover — which the shell cannot satisfy at all. **A dwell is one way to place a settle; waiting on
a post-hydration locator is a stronger one, because it cannot succeed early.**

| oracle                 | can its subject render POST-SHELL?                                                 | does it settle, and WHERE                                                                                                                                                                                      | negative scope — what it cannot see, and what covers that                                                                                                                                                                                                                                                                                                                                  | scoping needed?                                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `98-copy01-labels`     | **YES** — all five regions are data-driven                                         | **PLACED, by locator not dwell:** every leg awaits `rows.first()` / `columns.first()` / `cards.first()` visible, then asserts `scan.count > 0` with a "leg not driven" message. Rows do not exist in the shell | shape-blind to raw renders outside `{x.y}` (found by reading, not by it); blind to prop-position renders — **NOTHING covers those**, they are §5. Blind to dynamic-prefix masks — `scripts/partA_maskfinder.py` covers those                                                                                                                                                               | **NO.** Its reds quoted `human_entered` and 8 bare enum VALUES — hydrated data, not shell                                                                                                                                        |
| `98-copy02-rawkeys`    | YES                                                                                | **PLACED**; and its census legs are **DOM-INDEPENDENT** — bundle resolution, unaffected by any settle question                                                                                                 | blind to BARE UNDOTTED tokens by MECHANISM, not omission (the nested-`common` inversion): widening the alternation cannot catch one. Only resolution-checking sees them — the censuses and `i18n-mask-audit.mjs` do. Still blind to ~40 other first segments → `AR-04b`                                                                                                                    | **NO** for the census legs, explicitly. Its DOM legs are locator-placed                                                                                                                                                          |
| `98-copy03-dashboard`  | **YES** — the forced states mount only after the intercepted response resolves     | **PLACED, doubly:** awaits the widget `region` visible AND asserts an interception counter (`fulfilled > 0` / `blocked.length > 0`) — a state that cannot exist pre-response                                   | cannot see any dashboard surface it does not force; cannot see the `ar` copy of a leg that dies in the `en` iteration (the flake `RULING-13` B2 fixed)                                                                                                                                                                                                                                     | **NO.** Its reds quoted forced-state seed copy, which the shell never renders                                                                                                                                                    |
| `98-copy04-voice`      | **YES — AND IT WAS BLIND TO IT**                                                   | **PLACED SINCE WAVE 5 ONLY** (3 primitives + `expectLocale` per surface, + per-surface FLOORS from 98-09)                                                                                                      | `@values` legs gate on `bundleValues.has(text)` and cannot see hardcoded literals **BY CONSTRUCTION**; `@case` cannot see the ~4.5k tail, the 41 declared non-flags, non-admin role variants, or copy behind interaction — **`COPY-09`/P102 for the first three, NOTHING for the fourth**. **`@values` has NO capture floor: nothing prevents shell-capture regression; instrument: none** | **YES.** `RULING-P98A2-20` item 3, verbatim: **every prior `@case` green in this phase was produced by an instrument capturing only the synchronous nav shell. Those greens are SCOPED to the shell, not wholesale-invalidated** |
| `98-copy05-dates`      | YES                                                                                | **PLACED, and OBSERVED being fixed:** 98-01 caught this oracle sampling a skeleton table, and repaired it to await `networkidle` plus two identical consecutive reads before sampling                          | blind to any tree outside `frontend/src`; blind to i18n-JSON-authored relative phrases; blind to hardcoded full-word relative phrases — **NOTHING covers that class**, and two live members are named. Blind to reachability (dead code scans like live code) — the importer census covers it                                                                                              | **NO.** Its red quoted `about 2 hours ago` off a hydrated audit table; the fix predates every green                                                                                                                              |
| `98-copy06-toast`      | **YES** — the toast is raised BY a real mutation, so it cannot exist pre-hydration | **PLACED by construction:** the assertion waits for `data-sonner-toast` after driving a kanban drag                                                                                                            | sees one mutation path only; says nothing about the other write paths that inherit the same default                                                                                                                                                                                                                                                                                        | **NO.** A toast raised by a drag cannot be a shell artifact                                                                                                                                                                      |
| `98-copy07-statscard`  | YES — the card renders derived counts                                              | **PLACED, by locator:** awaits the EO `card` visible before reading its text                                                                                                                                   | the `en` leg is a NON-DISCRIMINATOR and the spec says so; sees one card on one surface                                                                                                                                                                                                                                                                                                     | **NO.** Its red quoted the card's own `ar` innerText — hydrated content                                                                                                                                                          |
| `98-copy08-eo-popover` | YES — the popover is POST-INTERACTION                                              | **PLACED, strongest of the eight:** awaits `card` visible → trigger `toHaveCount(1)` → click → `popover` visible → glyph counts. A popover cannot exist in a shell                                             | cannot see the seven sibling type-guide bodies (`GUIDE-HOLLOW-01` → P102); cannot see the `typeGuide.learnMore` silent English default it newly exposes (`AR-04a` → P99, named not pre-empted)                                                                                                                                                                                             | **NO**                                                                                                                                                                                                                           |

**The bound on this pass, stated:** placement was determined by READING each oracle's wait
mechanism and CORROBORATED against what its observed red and green quoted. It was **not** established
by a per-oracle settle/no-settle A/B experiment — `98-08` ran that experiment for `copy04` alone.
**Seven of the eight determinations rest on reading plus corroboration, not on a controlled
comparison**, and that is the honest limit of this section.

### The four already-named instrument-blindness instances, carried

1. **`RULING-P98A2-11`** — bare undotted tokens: a colon-form miss under the nested-`common`
   namespace renders `all` / `cancel`, which reads as plausible lowercase copy. **Every dotted-token
   detector in this phase is blind BY MECHANISM.**
2. **`RULING-P98A2-12`** — variable-second-arg sites: **both** of P99's committed acceptance greps
   are blind by construction, proven by direct test. P98's finder is the instrument of record and
   **it is now committed at `scripts/partA_maskfinder.py`** so P99 can run it.
3. **`RULING-P98A2-13` B4** — `copy04`'s `@values` legs gate on `bundleValues.has(text)`, so
   hardcoded literals are invisible **by construction**; its greens are claims about bundle values.
4. **`RULING-P98A2-16`** — **SEARCH SPACE:** every P98 instrument reads `frontend/src` only. Edge
   functions are outside it, including a `pdf-generate` path that writes the retired term into a
   document the user keeps.

**A fifth, found by this plan and not previously named:** `scripts/check-date-formatting.mjs` — the
file carrying the phase's negative-scope doctrine and its six named exemptions — was **BINARY**. A
raw NUL byte used as the burn-down key separator made `file(1)` report `data` and made plain `grep`
print `Binary file … matches` with **no lines** and **RC 0**. **The file the phase leaned on hardest
was invisible to the instrument the phase used most, and the invisibility read as a clean zero.**
Fixed as an escape, byte-identical at runtime (SHA-256 of the composed key unchanged; the stale-row
polarity reproduces verbatim).

---

## §7 — THE PHASE'S TRANSFERABLE FINDING

**NINE dimensions along which a population was defined wrong in this phase, each caught by a
DIFFERENT instrument than the blind one.** Eight were catalogued during execution; the ninth was
catalogued at close, in this document, and is marked as such.

| dimension                               | the instance                                                                                                                                                                                                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **file type**                           | i18n JSON produces relative time via `t()`, invisible to any code-token scan                                                                                                                                                                                                                               |
| **shape**                               | a one-arg matcher missed **409** sites with identical behaviour; a `{x.y}` regex missed ternary renders                                                                                                                                                                                                    |
| **token**                               | five hand-rolled `formatRelativeTime` locals enumerated by NAME, while siblings were called `formatRelativeDate`, `getRelativeTime`, `formatDeadline`                                                                                                                                                      |
| **casing**                              | the retired-term population was case-SENSITIVE; the term is case-insensitive by what it IS (`RULING-P98A2-14`)                                                                                                                                                                                             |
| **search space**                        | every instrument reads `frontend/src`; the term also ships from five edge functions (`RULING-P98A2-16`)                                                                                                                                                                                                    |
| **TIME**                                | the `@case` oracle captured the pre-hydration shell and returned a DETERMINISTIC false green, 3/3 runs (`RULING-P98A2-20`)                                                                                                                                                                                 |
| **ROLE**                                | admin maps to one `IntakeRoleEmptyState` variant; three sibling variants are structurally uncapturable                                                                                                                                                                                                     |
| **completeness**                        | the graded six named a component with ZERO importers; `98-06`'s help-page probe read first paint and saw 1 of 6 ruled sites                                                                                                                                                                                |
| **ORIGIN** _(new, catalogued at close)_ | the writer-set sweep was counted from `4e107b5d3`, the leg-1/leg-2 boundary — **where the OBSERVER's work began, not where the SUBJECT began.** `98-CONTEXT.md` names `98824ca77` as the phase base at its own lines 6 and 17. The population was bounded for the observer's convenience: 10 instead of 13 |

**The tally spans plan enumerations, seat derivations, orchestrator instruments and controls, and
the RULING layer itself** — `RULING-P98A2-17`'s "route onto the helper" instruction was
implementation-derived, and the overseer filed it as its own. **That breadth IS the finding: this is
structural to how populations get written down, not attributable to who wrote them. A per-layer
count understates it.**

**Two more instances landed inside this closing plan, in opposite directions, and the ORIGIN row
above is one of them.** My single-writer derivation counted plan-authored writes and returned **2**
where the file's writer set is **13** — the population defined by LAYER. The overseer's returned
**10** — the population defined by ORIGIN. **Two correct commands, three different numbers, one
question**, and neither of us was counting wrong; we were counting different sets and had not said
which. Sixteenth and seventeenth instances by the phase's running tally, one in each seat.

**Neither would have surfaced if either of us had accepted the other's number.** The 13 was found by
reading `98-CONTEXT.md` for the base rather than trusting a figure relayed down; the 2-versus-13 was
found by the overseer refusing to accept a count it could not reproduce. **That is the counter-practice
working in both directions on the same afternoon, which is the strongest evidence in this document
that it is installed rather than described.**

Sentences the rulings ordered carried, verbatim:

> **A genuine red from a blind instrument is the strongest false credential an oracle can earn.**
>
> **A drill not proven reverted is a drill that shipped.**
>
> **An exemption and a compliant member are different artifacts; only the second survives an audit
> with the JSON open.**
>
> **A repair nobody renders is indistinguishable from an unrepair.**

CLOSING-DERIVATION-END
