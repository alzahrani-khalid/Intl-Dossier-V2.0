# 98-GATE-DRILL — every gate in Phase 98, examined once, by one author, in one pass

**Written by plan `98-09` (Wave 6), 2026-08-18. Single writer of this file.**
**Subject set:** the **21** automated-gate blocks in the eight `98-0N-PLAN.md` repair plans, as
they stand at HEAD. `98-09`'s own plan is excluded from the drilled scope — the 97-12 precedent —
so a gate cannot grade itself.

`GATE-STANDARD-P92.md`'s pass procedure exists because **isolation is the mechanism**: in Phase 92
every repair was locally correct and the SET was wrong. So all eight plans are held here at once,
by one seat, rather than each plan grading itself. The per-plan observations were made by their own
executors; this record consolidates them, attributes each, and adds the cross-plan checks no single
plan can perform.

Gates are named `98-NN.tN` throughout — never by line number, and never by their opening tag
literal. **Both are deliberate.** Line numbers shift the moment any earlier clause is deleted. The
tag literal is avoided because `gate-drill.mjs` pairs an opening tag written in PROSE with the next
real closing tag and extracts the text between as a spurious gate.

---

## THE VERDICT VOCABULARY, AND THE RULE THAT DECIDES THE AMBIGUOUS CASE

`GATE-STANDARD-P92.md` fixes exactly three verdicts:

| verdict                           | meaning                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `SOUND`                           | red observed on the undone tree, green observed on a fully constructed done state, no C2–C10 exception outstanding         |
| `REPAIRED (what changed)`         | as above, but the gate or its consumed artifact was edited under a ruling; an edited gate is a NEW gate and was re-drilled |
| `CANNOT CONSTRUCT (what and why)` | no green direction was observed on a fully constructed done state                                                          |

**THERE IS NO FOURTH TERM FOR "HALF CONSTRUCTED", AND THE STANDARD ALREADY ANSWERS IT: a gate whose
done state was not FULLY constructed is `CANNOT CONSTRUCT`, never `SOUND`.** That rule is stated
here, at the top, so no row below splits the difference. Where a row is `CANNOT CONSTRUCT` it names
which half was constructed and which was not.

**The verdict is a claim about what was OBSERVED, not about today's exit code.** Four gates are red
against the tree as it stands and are nevertheless `SOUND` or `REPAIRED`, because a LATER plan
legitimately changed their subject after they closed green. Those are enumerated in
§POST-CLOSE MUTATIONS and named in each row's exceptions column; conflating "red today" with
"never sound" would misreport the phase in the opposite direction from the usual error.

**The set is complete — said explicitly rather than left implicit.** Every one of the 21 rows
carries one of the three terms; no row invents a term; no row is absent.
**Distribution: 10 `SOUND` · 7 `REPAIRED` · 4 `CANNOT CONSTRUCT`.**

**`CANNOT CONSTRUCT: none — all constructed` is NOT the state of this phase, and that is the point.**
A phase with a dev-stack dependency, a criterion routed to another phase's blocker, and two gates
superseded by mid-execution rulings would be suspicious if it reported a clean sweep. It does not.

### The `NOT CONSTRUCTED` label count is PROSE-CONTAMINATED, and the derivation says so

```
$ command grep -c 'NOT CONSTRUCTED' .planning/phases/98-copy-truth/98-0[1-8]-PLAN.md
98-01:9  98-02:0  98-03:3  98-04:0  98-05:3  98-06:1  98-07:1  98-08:1      total = 18
```

**All 18 are the DISCIPLINE stated, not a label APPLIED.** Every one is an instruction of the form
"if the spec half cannot be constructed in this environment, record NOT CONSTRUCTED with what and
why", or a frontmatter comment, or a threat-register cell, or the closed-vocabulary clause inside
`98-01.t3`'s own gate. **Zero legs are labelled NOT CONSTRUCTED in any PLAN.** The real labels live
in `98-RED-BASELINE.md` (**5** legs) and in the SUMMARYs. This is the 97-12 finding reproducing
exactly: a whole-file grep contaminated by commentary about labels. `98-09-PLAN.md` adds 2 more
prose hits of its own and they are excluded here for the same reason.

---

## MECHANICAL HALF — `scripts/gate-drill.mjs`, run with its flags

The script's own header records that the documented bare-directory form printed usage instead of
running, so the flags are passed (C3). The scratch scope was built by copying the eight repair
plans and asserting the count before the run — a ninth appearing or one vanishing breaks the pin.

```
$ ls "$D"/98-*-PLAN.md | wc -l              -> 8   (98-09 excluded)
$ node scripts/gate-drill.mjs "$D" --json --timeout 120 > "$D/drill.json"
DRILL_RC=0
gateCount: 21        21 parsed · 0 parse-fail · 0 timed out · 15 exited 0 · 6 exited 1
```

Per-gate, against the tree at HEAD (`51b77d056`, after this plan's three ruled widenings):

```
98-01_g1  PARSE-OK exit=0     98-04_g2  PARSE-OK exit=0     98-06_g3  PARSE-OK exit=0
98-01_g2  PARSE-OK exit=0     98-04_g3  PARSE-OK exit=1     98-07_g1  PARSE-OK exit=1
98-01_g3  PARSE-OK exit=0     98-05_g1  PARSE-OK exit=1     98-07_g2  PARSE-OK exit=1
98-02_g1  PARSE-OK exit=0     98-05_g2  PARSE-OK exit=0     98-07_g3  PARSE-OK exit=0
98-02_g2  PARSE-OK exit=1     98-05_g3  PARSE-OK exit=1     98-08_g1  PARSE-OK exit=0
98-03_g1  PARSE-OK exit=0     98-06_g1  PARSE-OK exit=0     98-08_g2  PARSE-OK exit=0
98-03_g2  PARSE-OK exit=0     98-06_g2  PARSE-OK exit=0
98-04_g1  PARSE-OK exit=0
```

`gN` maps to `tN` one-to-one in every plan: each task carries exactly one automated-gate block, and
the mapping was derived by interleaving task-name positions with block positions in document order,
not assumed from the numbering.

**What this establishes: 21/21 parse, and today's exit codes. What it does NOT establish: that any
gate is sound.** The script cannot distinguish a red-because-the-subject-is-absent from a
red-for-the-right-reason; that half is authored per gate and is the whole content of the table
below. A green from this script is not evidence of soundness — the script's own header says so, and
this record does not cite it as such.

### A CONTRADICTION I RESOLVED THE RIGHT WAY ROUND, RECORDED BECAUSE THE HABIT IS THE POINT

Five of the six gates that run Playwright in-band exited **0 inside a 120 s cap**, and I had
measured `98-copy04-voice.spec.ts` at **2.0 m** an hour earlier. That is a fresh derivation
contradicting an earlier one, so the first hypothesis was that the NEW instrument (the drill) was
broken — not that the old number was wrong.

**Measured rather than argued.** `98-08.t2`'s body was extracted and timed by hand:

```
$ time bash <98-08_g2 body>        RC=0   elapsed=66s
  4 passed (47.9s)
```

**Neither number was wrong; they answer different questions.** My 2.0 m run passed `--workers=1`
(the RED-BASELINE convention, forced by the login throttle). The gate as written passes only
`--no-deps`, so Playwright runs 4-way parallel and the same four tests finish in 47.9 s. The drill's
zeros are real and reproducible. **The drill is not exonerated by my expectation being wrong — it is
exonerated by the timing run.**

### RULED-EDIT AND POST-CLOSE-MUTATION inventory — derived by command, not recalled

**C9a cross-plan sweep** (`GATE-STANDARD.md` C9: if an oracle, command or artifact name changes,
every plan that references it must be repointed in the same edit; paste the count). Run over all
**nine** `98-*-PLAN.md` files:

| name (changed / retired / added during execution)                                        | occurrences | files |
| ---------------------------------------------------------------------------------------- | ----------: | ----: |
| `EnhancedActivityFeed` (replaced in the graded six by `RULING-P98A2-17`)                 |       **7** | **2** |
| `ActivityList` (the ruled REPLACEMENT)                                                   |       **0** | **0** |
| `relativeTime` / `formatRelativeTimeShort` (module + symbol `git rm`'d by 98-07)         |           0 |     0 |
| `WaitingQueue` (declared into 98-05 by `RULING-P98A2-13` B3)                             |       **0** | **0** |
| `fillMock` (key deleted by 98-07 under D-26)                                             |          20 |     2 |
| `deadlineReminder` (key family deleted by 98-06 under `RULING-P98A2-05` E1-a)            |           0 |     0 |
| `check-date-formatting` (ruled-extended 98-02, 98-07; NUL-fixed 98-09)                   |          22 |     3 |
| `i18n-mask-audit` (rebuilt by 98-04)                                                     |           9 |     1 |
| `98-copy04-voice` (settle+locale 98-08; floors 98-09)                                    |          14 |     3 |
| `98-copy02-rawkeys` (detector widened by 98-04b)                                         |          14 |     2 |
| `TaskCard` (cited as the correct idiom; proven broken)                                   |           6 |     1 |
| `partA_maskfinder` / `resolve-check` / `neg-taskcard` (committed to `scripts/` by 98-09) |           0 |     0 |
| `chromium-ar` (bare, i.e. the project that does not exist)                               |       **1** |     1 |

Controls on the same instrument, same run: a token that cannot be present returns **0**; `automated`
returns **48**. So the zeros are absences, not a broken sweep.

**Two of these rows are findings, not bookkeeping.**

- **`EnhancedActivityFeed` 7 / `ActivityList` 0 is a LIVE C9 STALENESS.** `RULING-P98A2-17` replaced
  the dead component with `ActivityList` in criterion 5's graded six and ordered the dead file
  untouched. The ruling superseded the plans; **no plan text was repointed**, so two plans still
  name a component nothing renders and no plan anywhere names its replacement. Plans as committed
  are the work order, so this is recorded rather than edited — but it is exactly the "correct in its
  own plan, stale in its consumer" shape C9 exists to catch, and it is why `98-07.t1` is
  `CANNOT CONSTRUCT` below.
- **The single bare `chromium-ar` is NOT a landmine — and checking is the point.** It is
  `98-01-PLAN.md:26`, inside 98-01's own acceptance criterion **prohibiting** the non-existent
  project. Zero of the eight specs reference it (`command grep` over `tests/e2e/98-*.spec.ts`
  returns nothing, with `chromium-en` returning hits from the same command). Mention is not use —
  the same distinction that produced this phase's `Due Date` JSX-comment miscount and its
  `pdf-generate` count correction.

---

## THE 21 ROWS

| gate     | C1 red — observed, and how                                                                                                                                                                                                                                                                       | C1 green — how the done state was constructed                                                                                                                                                                                                                                                                                                       | C2–C10 exceptions and post-close mutations                                                                                                                                                                                                                                                                                                                                                                                                                                | verdict                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 98-01.t1 | undone tree: the four detector specs did not exist, so `test -f` died on its own subject; `--list` RC 1 on an absent spec is the phase's recorded control (present spec RC 0)                                                                                                                    | files written → RC 0. The specs ARE the deliverable, so done-state == delivered-state; no simulation gap                                                                                                                                                                                                                                            | C6 `--no-deps` on every invocation. **Consumed artifacts ruled-edited post-close:** `98-copy02-rawkeys.spec.ts` widened for the `common.` shape (`RULING-P98A2-10`, `78c5ccefe`); `98-copy04-voice.spec.ts` given settle+locale (`RULING-P98A2-20`, `5f28d7bcc`) then per-surface floors (98-09, `51b77d056`). Re-drilled today: exit 0                                                                                                                                   | REPAIRED (two of its four consumed specs were ruled-edited after it closed; re-drilled green)                                                         |
| 98-01.t2 | undone tree: the four state-forcing specs absent; same `test -f` attribution                                                                                                                                                                                                                     | files written → RC 0, with `setBlockedURLs`, `data-sonner-toast`, `lucide-crown`, `text-primary`, `typeGuide` tokens all asserted present                                                                                                                                                                                                           | **Consumed artifact ruled-edited post-close:** `98-copy03-dashboard.spec.ts`'s force-verification assertion strengthened from `blocked[0]` to `blocked.some(...)` (`RULING-P98A2-13` B2, `0ff7125d8`). Re-drilled today: exit 0                                                                                                                                                                                                                                           | REPAIRED (copy03 instrument strengthened under B2; re-drilled green)                                                                                  |
| 98-01.t3 | undone tree: `98-RED-BASELINE.md` absent → `test -f` red; the eight-file count and the zero-GREEN clause both derived in the same chain                                                                                                                                                          | baseline written: exactly 8 rows, all in the closed `RED` / `NOT CONSTRUCTED` vocabulary, zero `GREEN` rows, 0 `chromium-ar-smoke` references summed across the eight specs → RC 0                                                                                                                                                                  | **`RULING-P98A2-20` item 3 RETROACTIVE SCOPE:** the baseline's `copy04` row was produced by an instrument that captured only the synchronous nav shell. The row's red was GENUINE (that CTA sits in the shell) — **a genuine red from a blind instrument is the strongest false credential an oracle can earn.** Prior `@case` greens are SCOPED to the shell, not wholesale-invalidated                                                                                  | REPAIRED (its subject set is all eight specs; three were ruled-edited post-close; re-drilled green)                                                   |
| 98-02.t1 | `formatRelativeTime` absent from `lib/format-date.ts`; the `ar-SA` zero-count clause red on the author's own explanatory sentence (auto-fixed, `7275b01a1`)                                                                                                                                      | helper written → RC 0: export present, `formatDistanceToNow` present, 0 `ar-SA`, i18n import present; `type-check` RC 0 unpiped                                                                                                                                                                                                                     | C10 every clause the criterion names is checked separately                                                                                                                                                                                                                                                                                                                                                                                                                | SOUND                                                                                                                                                 |
| 98-02.t2 | **four polarities, run and recorded**: fixture dir RC 1 (8 findings across all four new checks), clean subtree RC 0, default scan RC 0, planted stale row RC 1 naming the row                                                                                                                    | guard extended → the fixture run inverted inside the gate so a zero exit is an explicit failure; `pnpm lint` RC 0 across all five guards                                                                                                                                                                                                            | **POST-CLOSE MUTATION, §PCM-1: red TODAY (exit 1) at `command grep -q P98-BURNDOWN`.** 98-07 emptied the burn-down to 0 rows, taking the marker with it — and `98-07.t3` asserts that marker is ABSENT. The two gates are exact opposites by design. Guard also NUL-fixed by 98-09; all four polarities re-run and reproduced                                                                                                                                             | REPAIRED (guard ruled-extended by 98-07 under `RULING-P98A2-06` §3, then NUL-encoding-fixed by 98-09; all four polarities re-drilled)                 |
| 98-03.t1 | re-observed at the seat's OWN head `f5b5d19e1`, not taken on 98-01's authority: EO card renders **0** help triggers (locator resolved 0 elements, 14 polls, both locales); `typeDescription.elected_official` → `undefined` in both bundles                                                      | the atomic commit `e354c8c94` (5 keys × 2 locales + guard deletion + both `elected_official` switch arms) → `KEYS-OK`, guard count 0 while `DossierTypeGuide` still referenced in the same file, exactly 2 case arms, `WR-07` + `Crown` present                                                                                                     | C1 instrument-control pair: the guard zero rides with a still-referenced-component assertion, so a gutted file cannot pass. `RULING-P98A2-08` resolved a jointly-unsatisfiable action-vs-criterion collision (Reading B does not compile, TS2678) — gate text unchanged                                                                                                                                                                                                   | SOUND                                                                                                                                                 |
| 98-03.t2 | `ar` leg renders the English literal `% of total active dossiers`, 4 occurrences across the card grid. The `en` leg PASSED at HEAD and the spec LABELS it a non-discriminator — it is not counted as evidence                                                                                    | `8bad8ec73` → literal gone from the TSX **and** `percentOfActive` present (absence + replacement as a pair), EN value byte-identical, AR key present, 0 `"Due Date"` values in `en/dossier.json` while `"dueDate": "Deadline"` survives                                                                                                             | D-06 control: `command grep -c '"Deadline"'` returns **2** on the same file the `"Due Date"` count returns 0 for — the zero is an absence, not a broken instrument                                                                                                                                                                                                                                                                                                        | SOUND                                                                                                                                                 |
| 98-04.t1 | `command grep -c 'entityLinks'` returned **0** in both `en/common.json` and `ar/common.json` at `d6a61bf22` — the subtree did not exist                                                                                                                                                          | 61 leaves × 2 locales in one commit → `CORE-OK` (≥ the 50 floor, every leaf a non-empty string, both locales), `PARITY-OK`                                                                                                                                                                                                                          | D-16 both locales in the SAME commit, verifiable by `git show --stat 6b919c856`                                                                                                                                                                                                                                                                                                                                                                                           | SOUND                                                                                                                                                 |
| 98-04.t2 | the 80 static `entityLinks` paths unresolved in both bundles — the census enumerated all 80 by name                                                                                                                                                                                              | `58109e47b` → `CENSUS-OK 80 static paths resolved in both locales`; dynamic domains asserted EXACT against the `EntityType` / `LinkType` TS unions; 97 leaves; parity exact                                                                                                                                                                         | C1 negative control in the same run: `entityLinks.zz` returns `None`. T-98-07 mitigated by re-deriving the referenced set from the 9 source files at gate time rather than trusting a recorded list                                                                                                                                                                                                                                                                       | SOUND                                                                                                                                                 |
| 98-04.t3 | **coarse-aggregate row, red attributed to its own subject:** `98-copy06` 2 failed — the `ar` leg (the designated negative control) read `Operation completed successfully` off the toast; the `en` leg failed on `expected Changes saved`. Not a type-check or lint red                          | `0d69760bb` → banned literal 0 **and** `savedGeneric` present, both locale keys, dot-form 0, conservation `PRE 43 == POST 43`; `98-copy06` both legs green on a REAL kanban stage move (`تم حفظ التغييرات` under `ar`)                                                                                                                              | **Red TODAY (exit 1) is the gate's OWN FAIL-CLOSED RE-BASE CONTROL**, dying at `test 0 -ge 1`: `LASTC^` is no longer the pre-fix blob, so `PRE` derives 0 and trips the gate's negative control. 98-04 predicted this in writing and re-ran the conservation check against the TRUE pre-fix blob `58109e47b`. A stale parent reddens this gate; it cannot silently green it                                                                                               | SOUND                                                                                                                                                 |
| 98-05.t1 | corrected BSD-safe ERE instrument, one file at a time, against `13d5094ea`: `SignalRow` 1, `AssignmentDetailsModal` 1, `KanbanTaskCard` 1, `ActivityTimelineSection` 1 → all **0** after. `grep -P` exits 2 on this machine, verified not assumed                                                | **the gate's own zero-count clause was NEVER constructible.** `{signal.source_type}` is a literal SUBSTRING of its repair `${signal.source_type}`, so `command grep -c` returns **1** and `test 1 -eq 0` can never hold                                                                                                                             | C1: substance verified by the corrected discriminating instrument (RED 1/1/1/1 → GREEN 0/0/0/0) and by 214 real-i18next lookups, 0 misses, `ar` with `fallbackLng` DISABLED. 98-05 corrected its own over-claim here: **3 of the 4 sites, not 4**, are unsatisfiable by plan design — `SignalRow`'s is unsatisfiable because the seat chose a template literal for idiom consistency                                                                                      | CANNOT CONSTRUCT (the zero-count clause is unsatisfiable against the shipped idiom; the criterion's substance was verified by a different instrument) |
| 98-05.t2 | `TaskDetail` 1, `MiniRelationshipGraph` 2, `EnhancedGraphVisualization` 2, `AlertRuleForm` 1 at `13d5094ea` → 0 after                                                                                                                                                                            | `fe1b7ba00` → zeros, **with a scratch fixture planted and counted in the SAME gate chain returning exactly 1**, so the zero and its control ride one run (D-06)                                                                                                                                                                                     | C10 every named site checked separately. Widened-extension check: the same predicate over ALL extensions also returns 27, i.e. zero `.ts` de-snake sites — a zero meaningful only because 27 was non-zero in the same run                                                                                                                                                                                                                                                 | SOUND                                                                                                                                                 |
| 98-05.t3 | `defaultValue: 'Week of'` count 2 → 0; bare `row.type` / `row.status` renders 2 → 0; `key={group.key}` held at 1 throughout — the discriminator proving the edit hit the rendered header text and not the list identity                                                                          | source + unit half CONSTRUCTED and green. **The RENDERED half was not.** The gate runs `98-copy01-labels.spec.ts` in-band; re-run today: **5 passed / 1 failed**, the failure quoting its own precondition — `/engagements [en] renders no week-grouped list, so EngagementsList — the only renderer of the WEEK OF 2026-W27 header — never mounts` | The blocker is `ENGREAD-01`, **owner Phase 102**, dated note at `220abf343`. `RULING-P98A2-05` E2 forbids any P98 plan touching the `/engagements` route or data path, so the half was not constructible by anyone in this phase                                                                                                                                                                                                                                          | CANNOT CONSTRUCT (rendered ISO-week half — no rendered surface exists at this HEAD; source+unit half constructed and green)                           |
| 98-06.t1 | 11 of 24 checks red at `13d5094ea`, including both locales' seed values and both headings byte-exactly; the rendered legs quoted the defect strings — `Digest is ready for seeded publications.`, `Digest could not load. Check the staging seed and try again.`, `Add VIP participant data to…` | `a9d2414a5` → 0 failing checks, 9 control checks still PASS; forced empty / forced error / route-fulfilled VIP empty all green in both locales                                                                                                                                                                                                      | **`RULING-P98A2-13` B2's stability conditions were NOT recorded as discharged in 98-06's SUMMARY — DISCHARGED HERE.** Two consecutive full-file runs RC 0 (27 s, 28 s, 3 passed each) plus one isolated `--grep "ERROR state"` run RC 0 (18 s). The `ar` leg REACHES the forced-error state: the locale loop is unconditional over `['en','ar']` with no `continue`/`return`/`skip` inside it and per-locale assertion messages, so a pass means both iterations executed | REPAIRED (force-verification assertion strengthened under B2; re-drilled, and B2's own stability conditions observed by this plan)                    |
| 98-06.t2 | `"Due Date"` file count non-zero; EO CTA reading `Add Elected Official` in EN                                                                                                                                                                                                                    | `a9d2414a5` + `dc7295558` → zero retired-term values case-INsensitively in both locales; EO CTA `Add elected official` green in BOTH locale legs of the `@values` group — the one leg of that spec that discriminated                                                                                                                               | **The bundle-grep oracle is the discriminating instrument a source grep is not:** a source sweep returns 10 files for `Due Date`, of which **7 are JSX comments stripped at build**. `validation.json`'s member SURVIVES by explicit plan carve-out and the gate ASSERTS its survival, so an over-eager sweep reds. Casing rule corrected mid-flight (`RULING-P98A2-14`) — the trip-1 population was case-SENSITIVE and wrong                                             | SOUND                                                                                                                                                 |
| 98-06.t3 | exclamation floor and first-person residue both red at `13d5094ea` in the same 24-check run                                                                                                                                                                                                      | floor **exactly 1 EN / 1 AR**, and the survivor PROVEN to be `validation:password.addSpecial` — floor and carve-out asserted TOGETHER, so a sweep that deleted the charset listing also reds                                                                                                                                                        | **A non-zero floor, deliberately** — the zero-trap does not arise. Cross-check: `98-copy04`'s `@values` leg self-tests with `bangValues.length > 0`, so sweeping to 0 would have killed the spec's own instrument. **POST-CLOSE MUTATION §PCM-2: 98-08 edited three `empty-states.json` values after this gate closed.** Re-drilled today: exit 0, floor still 1/1                                                                                                        | SOUND                                                                                                                                                 |
| 98-07.t1 | `ActivityList.tsx:77` emitted `` `${diffD}d` `` / `` `${diffD}ي` `` — the true producer of wave 1's witnessed `/activity [ar]` RED, which the spec's `ARABIC_RELATIVE` alternation contains no bare `ي` for                                                                                      | the six sanctioned feeds routed onto `formatRelativeTime`; `98-copy05` 4/4 green, the `ar` leg read out of the feed's own `.act-t` cells (`منذ 4 أشهر` ×8) with the `en` leg finding no Arabic token anywhere in `main` — which is what makes the `ar` green discriminating rather than ambient                                                     | **The gate names a component nothing renders.** `RULING-P98A2-17` ruled `ActivityList` REPLACES `EnhancedActivityFeed` in the graded six and ordered the dead file untouched; the gate still requires `formatRelativeTime` inside `EnhancedActivityFeed.tsx` and dies there (`MISSING helper in components/activity-feed/EnhancedActivityFeed.tsx`). **C9 staleness, ruled not repaired** — see the C9a sweep: 7 references, 0 to the replacement                         | CANNOT CONSTRUCT (its subject was replaced by ruling and the gate text was never repointed; the ruled subject's green WAS constructed)                |
| 98-07.t2 | 46 `formatDistanceToNow` occurrences pre-repair, 21 files by the guard's own population                                                                                                                                                                                                          | 15 date-of-record files migrated; the parallel helper module `lib/i18n/relativeTime.ts` and its test `git rm`'d; its one production consumer re-pointed. `HITS` fell from 21 files to **1**                                                                                                                                                         | **`HITS -eq 0` is unsatisfiable against a RULING.** The surviving 1 is `EnhancedActivityFeed.tsx` — genuine offenders left unrepaired BECAUSE NOTHING RENDERS THEM (`RULING-P98A2-18`, dead-code exemption with a stated VOID CONDITION). Re-verified here: still **zero importers**, against a live control returning **9** for `SharedRecentActivityCard`. 98-07 drilled the exemption BOTH ways — same bytes at an unnamed path → RC 1 with 3 offenders                | CANNOT CONSTRUCT (the zero-count clause cannot hold while `RULING-P98A2-18`'s exemption stands; the exemption itself is drilled both ways)            |
| 98-07.t3 | **coarse-aggregate row, red attributed to its own subject:** the pre-repair BUILT bundle carried the EN value `Fill with Mock Data` and the AR `تعبئة بيانات وهمية` (case-insensitive, `.map` excluded) — a build-output red, not a lint red                                                     | key deleted from both locales, label inlined inside the DEV gate, burn-down worked to 0 rows → emitted `js`/`css` contains **0** hits; `pnpm lint` RC 0; `pnpm build` RC 0                                                                                                                                                                          | **All controls in ONE post-build run:** NEGATIVE control fires ≥1 on the known-present source literal (a pattern that cannot find the string where it provably exists never ran); POSITIVE control `Changes saved` ≥1 in the same artifacts dir; IN-BLOCK DCE control source 1 / dist 0 / dist-with-map 1. Excluded population STATED: including `.map` the count is 1 — `CLIENTSEC-02`, owner P100. **Guard NUL-fixed by 98-09**; re-drilled today exit 0                | REPAIRED (its consumed guard's separator encoding was fixed by 98-09; re-drilled green, all guard polarities reproduced)                              |
| 98-08.t1 | the unamended oracle passed **3/3** at 6.2–6.5 s — deterministic, not flaky — while a SETTLED capture over the same eight surfaces found **three** Title Case labels. The red is the divergence itself: 389 raw settled vs 202 unsettled; 3 flagged vs 0                                         | the capture record written with per-surface reachability (6 VISITED / 1 REDIRECTED / 1 ERROR-CHROME / 0 NOT-CONSTRUCTED) and the REPAIR/KEEP split 3/0                                                                                                                                                                                              | settle-sufficiency evidence: 3 s and 8 s dwells are BYTE-IDENTICAL on all eight surfaces; widening the selector list adds 4 raw captures and 0 new flags — the hidden dimension was TIME, not shape. Long-tail non-interference proven by a 32,430-leaf comparator reporting `changed=3 added=0 removed=0`, with a planted edit making it report 4                                                                                                                        | SOUND                                                                                                                                                 |
| 98-08.t2 | the three `empty-states.json` Title Case labels flagged by a settled capture; planted post-settle fixture DETECTED, and MISSED when the settle was neutered — the control discriminates                                                                                                          | three values repaired → `@case` green; `copy04` **4/4 passed**, run twice. Re-run by 98-09 after the floor edit: RC 0, 66 s, 4 passed under the gate's own parallel invocation                                                                                                                                                                      | **Plan defect recorded not escalated:** the gate greps the literal `\| REPAIR \|` but Prettier pads markdown cells to the `VERDICT` header width, so the gate could never match a formatted table; discharged by adding the prescribed row shape inside a fenced block Prettier does not reformat. **Consumed spec edited by 98-09** (per-surface floors, `51b77d056`); re-drilled green                                                                                  | REPAIRED (its consumed spec gained per-surface capture floors under a ruled 98-09 widening; re-drilled green)                                         |

---

## POST-CLOSE MUTATIONS — later work that changed a CLOSED gate's subject

A gate closes green and a later plan legitimately edits what it measures. Naming these is the only
way a reader can tell a stale red from a real one.

**§PCM-1 — 98-07 emptied the burn-down that 98-02.t2 asserts exists.** `98-02.t2` requires the
`P98-BURNDOWN` marker PRESENT (60 rows carried it); `98-07.t3` requires it **ABSENT** (`-eq 0`).
They are exact opposites, and both were correct at their own close: 98-02 built the named-debt
mechanism, 98-07 was chartered to empty it. State after wave 4: 0 rows, 0 sites, guard strict.
`98-02.t2` is red today and will stay red; it is not a defect and it is not a regression.

**§PCM-2 — 98-08's JSON value edits changed the subject of 98-06's floor gates and of the copy04
`@values` oracle.** This was the known member at plan time and it is discharged, not assumed:

| closed gate whose subject moved            | what 98-08 changed                                                       | state after wave 5                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `98-06.t3` — the exclamation-floor walker  | three `en/empty-states.json` leaf VALUES, case-only                      | **floor still exactly 1 EN / 1 AR, byte-identical before and after** (98-08 ran the walker both sides); `98-06.t3` re-drilled by this plan today → **exit 0** |
| `98-06.t2` — retired-term + Title Case pin | the same three values                                                    | the named-instance pin (`"add": "Add elected official"`) untouched; `98-06.t2` re-drilled today → **exit 0**                                                  |
| the `copy04` `@values` legs                | the same three values, which the legs match through `bundleValues.has()` | `@values` 3/3 green in the same run as `@case`; re-run twice by this plan (`--workers=1` 2.0 m and the gate's parallel form 47.9 s), 4/4 both times           |
| `98-06.t1` — the copy03 rendered legs      | nothing (different namespace)                                            | re-drilled today → **exit 0**, and B2's stability conditions discharged above                                                                                 |

**§PCM-3 — 98-09's own three ruled widenings changed three closed gates' subjects.** Named here
because a closing plan that mutates the tree and does not say which gates it disturbed is the same
failure one level up:

| what 98-09 changed                                                                   | closed gates whose subject it is   | re-drill result                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-date-formatting.mjs` — raw NUL → escape (`54f179e51`)                 | `98-02.t2`, `98-07.t3`             | all four 98-02 polarities reproduce (fixture RC 1 with 13 findings, clean subtree RC 0, default RC 0, **planted stale row RC 1 naming the row**); `98-07.t3` exit 0; `pnpm lint` RC 0 |
| `tests/e2e/98-copy04-voice.spec.ts` — per-surface floors (`51b77d056`)               | `98-01.t1`, `98-01.t3`, `98-08.t2` | all three exit 0; copy04 4/4 green in both invocation forms                                                                                                                           |
| `scripts/{partA_maskfinder.py,resolve-check.mjs,neg-taskcard.mjs}` NEW (`894f5b2ed`) | none — no gate consumes them       | committed-path re-run reproduces 24 total / 19 masked, four control polarities True/True/False/False, 214 lookups 0 misses, `MISS=true` ×3                                            |

**The stale-row polarity is the one that matters for the NUL fix**, and it is why it was run: it is
the only drill that exercises `burndownKey` on BOTH sides (`excused.add` and the stale filter). It
reproduces 98-02's polarity-4 output verbatim, which proves the composed key is byte-identical at
runtime in the way a SHA of the string alone cannot.

---

## COARSE-AGGREGATE GATES — which rows carry one, and the attribution rule

C7's problem is that `pnpm type-check`, `pnpm lint`, a full build and a whole-spec run can each go
red for a reason that has nothing to do with the gate's subject. Nine of the 21 gates carry at
least one such aggregate:

| aggregate                        | gates carrying it                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `cd frontend && pnpm type-check` | 98-02.t1 · 98-03.t1 · 98-03.t2 · 98-04.t3 · 98-05.t1 · 98-05.t2 · 98-05.t3 · 98-06.t2 · 98-07.t1 · 98-07.t2 · 98-08.t2 |
| `cd frontend && pnpm lint`       | 98-02.t2 · 98-07.t3                                                                                                    |
| a production build               | 98-07.t3                                                                                                               |
| a whole-spec Playwright run      | 98-01.t1 · 98-01.t2 · 98-03.t1 · 98-03.t2 · 98-04.t3 · 98-05.t3 · 98-06.t1 · 98-06.t3 · 98-07.t3 · 98-08.t2            |

**Every red recorded in the rows above is attributed by CAPTURED TEXT naming the gate's own
subject** — a toast literal, a raw key, a percentage label, an `ago` phrase, a Title Case CTA, a
seed instruction, a bundle string — never by a bare non-zero exit. The two rows whose red today is
NOT of that kind say so explicitly and name the mechanism instead (`98-04.t3`'s fail-closed re-base
control; `98-02.t2`'s §PCM-1 marker).

**D-19 is honoured throughout and it is not cosmetic:** every aggregate above is `cd frontend &&
pnpm <script>`, never `pnpm --filter frontend`, which matches ZERO packages and **exits 0** — a
gate built on it would be green by vacuum. The script is `type-check`, never `typecheck`.

---

## WHAT THIS RECORD DOES NOT ESTABLISH

- **That a green gate means a correct repair.** Four of this phase's five confident false greens
  came from instruments that ran perfectly and answered a question nobody asked. A gate is evidence
  about its own clause, bounded by that clause's population.
- **That the 21 gates cover criterion 4's or criterion 1's whole subject.** They do not, by ruling:
  criteria 1, 2, 4 and 5 all close BOUNDED, and the bounds are in `98-CLOSING-DERIVATION.md`.
- **That the four `CANNOT CONSTRUCT` rows are equivalent.** Two are blocked by another phase's
  defect (`98-05.t3`, `ENGREAD-01` → P102) or by a ruling that deliberately preserves the state
  (`98-07.t2`, the dead-code exemption). Two are the gate text having been superseded — one by its
  own repair's idiom (`98-05.t1`), one by a mid-execution ruling nobody repointed (`98-07.t1`).
  Only the last is a process defect, and it is a C9 one.

GATE-DRILL-END
