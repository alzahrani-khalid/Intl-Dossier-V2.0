---
phase: 98-copy-truth
plan: 08
seat: p98-exec-08
wave: 5
requirements: [COPY-04]
status: EXECUTED
derived_at_head: 742bac2ed2dbb89aed27ddba0a1d0b377d0d6ec1
committed_at: 5f28d7bcca2aec04744cac2d0c12249e1ccdfdce
ruling: RULING-P98A2-20 (option A, seven conditions)
role: admin (TEST_USER_EMAIL) — every green below
---

# 98-08 execution record — criterion 4's bounded sentence-case clause

**Outcome: the clause closes at the ruled bound, and the wave's headline finding is not the three
labels it repaired — it is that the instrument grading the clause could not see them.**

---

## 0. The wave in one paragraph

The `@case` oracle passed. It should not have. It contained **zero settle primitives**, so every
capture read the pre-hydration skeleton — the synchronous nav shell — and returned a
**deterministic false green** (3/3 runs, 6.2–6.5 s). A settled capture over the same eight surfaces
found **three Title Case labels** in the intake empty state, which mounts only after its data query
resolves. The escalation went up pre-commit; `RULING-P98A2-20` ruled **(A)** — repair the spec under
ruled instruction — and refused (B), because a wave graded by an instrument proven blind to its
subject is what acceptance clause 4 exists to prevent. The three labels are repaired, the oracle can
now see the region it was blind to, and the bound is stated per surface.

---

## 1. The population, its casing rule, and its exclusions

**CAPTURED COUNT: 389 raw captures over 8 surfaces → 95 distinct bundle-matched → 3 flagged.**
Derived by running the oracle against the phase-final tree (D-04), never quoted from the
4,471 / 4,562 magnitude figures — those size `COPY-09`.

**REPAIR / KEEP SPLIT: 3 REPAIR, 0 KEEP.**

**PER-KEEP CARVE-OUT REASONS: none, because there are no KEEP rows.** This is stated rather than
left blank: no flagged label carried an embedded proper noun, an acronym, a legitimate UPPERCASE
ribbon class the selector exclusions missed, or a mono face — so no carve-out was _available_ to any
of the three, and none was claimed. A KEEP with no reason would have been the incomplete-record
failure the plan's closed-vocabulary clause names.

**THE CASING RULE OF THE MATCHER** (`RULING-P98A2-14` — a per-population property derived from the
population's semantics, never a brief-wide default; and here **the subject IS case**):

- Reverse-bundle matching is **CASE-SENSITIVE** (`Set.has` on the raw string). Forced by the
  semantics: a case-insensitive matcher would equate `Add Elected Official` with
  `Add elected official` and could not tell a repair from a no-op.
- The Title-Case predicate is case-sensitive by construction: 2–6 words, not ALL-CAPS, **≥2**
  non-initial words matching `^[A-Z][a-z]+$`.
- Every shell cross-check used `command grep`, never the repo wrapper, which silently implies `-i`
  on `-ril`.
- **"Title Case" and "sentence case" are claims about RENDERED TEXT, not key names.** No key was
  renamed; only leaf values changed. `accessQueue` remaining camelCase is not a finding.

**EXCLUSIONS — what falls OUTSIDE the population (D-05):** the ~4.5k long tail (`COPY-09` → P102);
the 41 captured labels the predicate declaredly does not flag; the sibling-role labels the
admin-only oracle cannot mount; Arabic values (no letter case; `AR-01..04` / Phase 99 park);
data-driven text; and the CLAUDE.md `th` / uppercase-transform / mono carve-outs.

**WHICH DIMENSION I TESTED MY POPULATION AGAINST — and what each returned:**

| dimension        | how it was tested                                                 | result                                                                                                |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **time**         | settle vs no-settle, capture mechanics held identical             | **THE DEFECT.** 389 vs 202 raw (both derived, not added by eye); 3 vs 0 flagged                       |
| **shape**        | selector list widened by 11 more selectors                        | +4 raw captures, **0** new flagged — shape was not hiding anything                                    |
| **file type**    | every unmatched capture run through the predicate                 | **0** hardcoded Title Case labels — the wave-3 blocker shape did not reproduce here                   |
| **search space** | `find` for every i18n/locale root in the repo                     | one live source (`frontend/src/i18n/en`); `public/locales` dead (D-10), `dist/` build output          |
| **token**        | each flagged string grepped repo-wide for a second source path    | exactly **1** source each — no second namespace, no TSX duplicate                                     |
| **casing**       | matcher's sensitivity stated and justified from semantics         | case-sensitive, necessarily                                                                           |
| **completeness** | per-surface reachability; settle convergence at 3 s vs 8 s        | 6 VISITED / 1 REDIRECTED / 1 ERROR-CHROME / 0 NOT-CONSTRUCTED; captures byte-identical at both dwells |
| **role**         | `IntakeRoleEmptyState` role map read; sibling variants enumerated | **admin → `reviewer` only**; 3 sibling variants structurally uncapturable — see §6                    |

---

## 2. Controls shown NON-ZERO before any post-repair zero was believed

Every zero in this record has a matching non-zero from the same instrument on the same run.

| control                                      | non-zero shown                                                                       | what a bare zero would otherwise have meant         |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| per-surface capture count                    | 98 / 73 / 34 / 38 / 37 / 49 / 29 / 31 — all non-zero                                 | "clean surface" when the page never rendered        |
| reverse-lookup grep for each flagged string  | positive control on the same file (`"Reviewer"` → line 405) before the 1-hit results | a blind zero from a mis-quoted pattern              |
| settle-primitive census across the 8 oracles | same census returns non-zero on `95-search-renders`, `96-calendar-family`            | "no oracle settles" from a sweep that never ran     |
| exclamation-floor walker                     | floor is **1 EN / 1 AR**, deliberately non-zero (the charset carve-out)              | the zero-trap 98-06 designed the carve-out to avoid |
| long-tail comparator                         | planted edit at an untouched key → reports **4**                                     | "changed=3" from a comparator that never compared   |
| Title-Case predicate                         | flags `Add Elected Official`, passes `Add elected official`, ignores acronyms        | a predicate that flags nothing                      |

**The `pnpm --filter frontend` trap was avoided** (D-19): type-check was run as
`cd frontend && pnpm type-check`, never `--filter frontend` (matches zero packages, exits 0) and
never `typecheck` (wrong script name).

---

## 3. Run record — BOTH POLARITIES EXECUTING

### 3a. The finding: the oracle's blindness, isolated to TIME

| mode                              | wall clock | `/dossiers` raw | `/intake/queue` raw | flagged |
| --------------------------------- | ---------- | --------------- | ------------------- | ------- |
| NOSETTLE (≡ the unamended oracle) | 6.3 s      | 38              | 20 (all nav shell)  | **0**   |
| SETTLED (`networkidle` + 3 s)     | 43.7 s     | 98              | 34                  | **3**   |
| SETTLED, 8 s dwell                | 1.4 m      | 98              | 34                  | **3**   |

3 s and 8 s are **byte-identical on all eight surfaces** (+0 / −0 unique) — the **settle-sufficiency
evidence** the ruling names, and why 3 s is the dwell shipped. The unamended oracle passed **3/3** at
6.2 / 6.5 / 6.3 s: deterministic, not flaky.

### 3b. The amended oracle inherits no trust (`RULING-P98A2-20` item 2)

The ruled shape: the RED must be planted in a **post-settle** region, because the shell-red class was
already proven and **the blind region is what needed a fixture**.

| polarity                                                          | result                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| NEGATIVE — Title Case label injected into `main` on a 1.5 s timer | **DETECTED.** Fixture derived live from the bundle (`Activity Feed Preferences`), so P102's COPY-09 work cannot stale it |
| NEGATIVE, **settle neutered (drill)**                             | **MISSED** — `Received array: []`; spec reds at the fixture in 2.9 s. **The control discriminates**                      |
| POSITIVE, pre-repair                                              | **RED** in 47.6 s on exactly the three labels — a second instrument agreeing with the seat's                             |
| POSITIVE, post-repair                                             | **GREEN** in 46.9 s, and again at 46.4 s on a second run                                                                 |

The drill edit was made in the working tree, run, and reverted; the revert was proven by **SHA-256
equality** before and after (`0557f77e744b37717d62f38025ac17d1fa0655828cbd7e4480a98bcd137cd86b`) plus
`grep -c P98-DRILL` = 0. A drill that is not proven reverted is a drill that shipped.

### 3c. The locale probe — both polarities on one landed URL

`/intake/queue` 302s to `/my-work/intake` and **drops `?lng=`**, so the capture's locale could have
been _inherited_ rather than asserted (acceptance clause 3; ruling item 4).

| requested | landed URL        | `<html lang>` | `dir` | headings                                                     |
| --------- | ----------------- | ------------- | ----- | ------------------------------------------------------------ |
| `?lng=ar` | `/my-work/intake` | `ar`          | `rtl` | `قائمة الاستقبال \| لا توجد مراجعات معلقة \| معايير التقييم` |
| `?lng=en` | `/my-work/intake` | `en`          | `ltr` | `Intake Queue \| No Pending Reviews \| Evaluation Criteria`  |

The `?lng=` is consumed and persisted **before** the redirect resolves. **This is now enforced on
every run**, not merely recorded: `expectLocale()` asserts `document.documentElement.lang` after
settling **every surface of every leg**.

---

## 4. Every green, tagged with LOCALE and ROLE

**Role is `admin` (TEST_USER_EMAIL) for all of the below.** Non-admin roles were not driven —
see §6.

| green                                      | locale                        | evidence                                                                 |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| `@values` EO CTA reads sentence case       | **en AND ar** (both asserted) | 12.4 s; `Add elected official` / `إضافة مسؤول منتخب`                     |
| `@values` glossary `Deadline` ≠ `Due Date` | **en AND ar** (both asserted) | 11.3 s on `/commitments`                                                 |
| `@values` no exclamation reaches screen    | **en only** (stated)          | 42.8 s over the 8 surfaces                                               |
| `@case` captured labels are sentence case  | **en ONLY — stated bound**    | 46.4 s; Arabic has no letter case, so the leg would discriminate nothing |
| exclamation-floor regression control       | **en AND ar**                 | 1 EN / 1 AR, byte-identical before and after the case edits              |
| frontend `type-check`                      | n/a                           | RC=0                                                                     |
| `eslint` on the amended spec               | n/a                           | RC=0                                                                     |
| `prettier --check` on all three files      | n/a                           | clean                                                                    |

**copy04 IN FULL: 4/4 passed, 1.9 m — run twice, both green.** Spec existence was asserted before the
path was used (D-09, paths are FILTERS), and the expected test count (**4**) was hardcoded, not
derived from the list just passed.

**EXCLAMATION-FLOOR REGRESSION RE-CHECK (the plan's named control): PASS, byte-identical
before/after.** Floor exactly **1 EN / 1 AR**; the survivor is proven to be
`validation:password.addSpecial` (the charset carve-out), asserted _together_ with the floor so an
over-eager sweep would also red; and the NEGATIVE polarity plants an **absent** non-carve-out `!` and
proves the walker counts it (n=2). **The case edits introduced and removed no `!`.**

---

## 5. The file set actually edited, and the commit

**COMMIT: `5f28d7bcca2aec04744cac2d0c12249e1ccdfdce`** on `milestone/v10.0-trust`.

Committed with `git commit -F <msgfile> -- <paths>` **exclusively**, pathspec built from my own edit
table and never from `git status`. The index was verified **EMPTY** before the single unavoidable
stage (the new record file, which `git commit -- <path>` cannot reach for an untracked file) and
verified **EQUAL to that one intended path** immediately before the commit. No bare `git add`, no
`git add -A`, no `git commit -a`.

`git show --stat HEAD`, read:

```
 .../phases/98-copy-truth/98-CAPTURED-LABELS.md     | 345 +++++++++++++++++++++
 frontend/src/i18n/en/empty-states.json             |   6 +-
 tests/e2e/98-copy04-voice.spec.ts                  | 120 ++++++-
 3 files changed, 463 insertions(+), 8 deletions(-)
```

**Every file in that commit is from my edit table; zero files I did not author.** Acceptance clause 5
verified by pattern: **zero exogenous paths** (`CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`,
`.agents/*`, `.claude/*`, `_archive-98-attempt1-260818/`) appear in the commit. Those five modified
and three untracked exogenous paths were present at my seat start and are untouched at my seat end.

**HEAD MOVED UNDER ME MID-WAVE** — `742bac2ed` → `8a8f746d3` (the overseer's `RULING-P98A2-20` docs
commit, touching `.planning/ROADMAP.md` only). Checked rather than assumed: `git diff --name-only
742bac2ed..HEAD -- <my four paths>` returned **empty**, so no collision. The long-tail proof was
**re-run against the new HEAD** and still reports changed=3 / added=0 / removed=0.

### en + ar commit evidence (D-16)

| file                                     | in commit   | why                                                                                                                                                        |
| ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/i18n/en/empty-states.json` | +3 / −3     | the three REPAIR rows                                                                                                                                      |
| `frontend/src/i18n/ar/empty-states.json` | **0 lines** | **named in the pathspec and reviewed in this same commit**, deliberately unedited — the edits are case-only, Arabic has no letter case, no meaning shifted |

The `ar` pair values (`لا توجد مراجعات معلقة`, `الوصول لقائمة المراجعة`, `عرض جميع التذاكر`) are
correct before and after. Naming the path with no diff makes the review a **claim on the record**
rather than something implied by silence. Arabic naturalness remains the operator's park, untouched.

---

## 6. Proof the long tail was NOT touched

**Proved, not asserted.** A leaf-by-leaf diff of the entire bundle — `frontend/src/i18n/{en,ar}`,
**258 files, 32,430 leaf values** — between the base ref and the tree reports:

```
changed = 3   added = 0   removed = 0
```

and the three are exactly the REPAIR rows of the record. The **same comparator**, given a planted
edit at an untouched key (`ar/actionable-errors: actions.addAtSymbol`), reports **4** — so the 3 is a
measurement, not a comparator that never compared. Run against both `742bac2ed` and `8a8f746d3`.

**Nothing outside the captured set + the named instance was edited.** In particular:

- the **41** captured-but-unflagged labels (the predicate's declared non-flags — `My Desk`,
  `Audit Logs`, `Week Ahead`, …) are **enumerated in full in the record and untouched**;
  `RULING-P98A2-20` item 6 makes editing even one of them a wave failure;
- the **12** sibling-role labels (`intake.requester` / `assignee` / `viewer`) are untouched;
- `COPY-09` remains filed with P102 as its owner — not absorbed, not silently narrowed further.

**The role bound, stated in the ruling's own words: this wave repairs the `reviewer` variant and
leaves its three siblings Title Case. It is a PARTIAL REPAIR OF ONE COMPONENT.** A green `@case` does
not mean `IntakeRoleEmptyState` is clean; it means it is clean **for admin**, the only role driven.
**The sibling count is UNDER-DETERMINED and the record says which predicate produced it:** 12 under
the oracle's own predicate, 23 under a looser one — and the looser set is visibly over-inclusive
(it sweeps multi-sentence descriptions whose capitals are proper nouns, `MoU`, `Organization X`,
which are not Title Case at all). The predicate is named rather than the number asserted.

---

## 7. Plan defect, recorded not escalated (`RULING-P98A2-07`)

Task 2's automated gate greps the literal `| REPAIR |`, but **Prettier pads markdown table cells to
the width of the `VERDICT` header**, producing a two-space cell that the gate cannot match — and
Prettier runs on this repo's commit path, so the gate could never have passed against a formatted
table. The acceptance criterion governs the action-body mechanism: the criterion asks that the two
counts be **EQUAL, derived from the same file in the same run**. Discharged by keeping the human
table **and** adding the plan's exact prescribed row shape inside a fenced block, which Prettier does
not reformat. Both counts are **3** and equal, re-derived from the **committed** content at HEAD, not
the worktree. Mechanical; not escalated, per the ruling's instruction for this class.

---

## 8. Blast radius — routed, not widened

Five of the eight criterion oracles carry **zero** settle primitives (`copy01`, `copy03`, `copy04`,
`copy07`, `copy08`); `copy02` has 1, `copy05` and `copy06` have 2. **No-settle is a house pattern in
this suite, not an outlier.**

**STATED BOUND, adopted verbatim from the ruling: PRESENCE IS NOT PLACEMENT.** A non-zero count
proves a settle primitive _exists in the file_; it does **not** prove it runs before the capture.
This record therefore makes **no** claim that `copy02` / `copy05` / `copy06` are unaffected — the
claim my own census cannot support is the one I did not make. Per `RULING-P98A2-20` item 7 the
per-oracle question belongs to **98-09's Law-1 pass**; DOM-independent instruments (bundle greps,
resolution censuses) are unaffected. **This seat did not widen into it.**

**RETROACTIVE SCOPE (ruling item 3, RULING-11 form), for lifting into the exec report:** _every prior
`@case` green in this phase was produced by an instrument capturing only the synchronous nav shell._
Those greens are **scoped to the shell, not wholesale-invalidated.** Riding with it: \*\*a genuine red
from a blind instrument is the strongest false credential an oracle can earn\*\* — the RED baseline's
`Add Elected Official` flag was real precisely because that CTA sits in the shell, and it bought
every green that followed.

---

## 9. Disclosed widening, authorized before the commit

`RULING-P98A2-20` item 1 names the **file**. I added `settle()` + `expectLocale()` to **all four
tests**, not only `@case`, because the `@values` exclamation leg walks the identical eight surfaces
with the identical blindness and the EO-CTA and glossary legs read their surfaces pre-hydration.
Evidence it was not cosmetic: those legs moved from 6 s-class to 12.4 s / 11.3 s / 42.8 s wall clock
— they had been reading the shell too. **Disclosed to the orchestrator before committing, with
countermand explicitly left open; authorized and reported upward.** Not act-then-disclose.

The spec diff removes only **5** lines, each checked: three are the bare
`expect(main).toBeVisible()` waits now living inside `settle()`, and two are a Prettier reflow of the
`bangValues` instrument self-test, verified **intact**. The three `@case` predicate self-tests are
intact. **No assertion was weakened.**

---

## 10. Instruments preserved, and the pre-close disk answer

**Does anything I produced exist only outside HEAD?** Everything **graded** is in HEAD: the record,
the repairs, the amended oracle — commit `5f28d7bcc`. The **instruments and their raw evidence** are
preserved at `.tickmarkr/overseer/INSTRUMENTS-P98/`, which is the phase's established instrument
home and is `.gitignore`d (`.gitignore:179`) — the same place `resolve-check.mjs` and
`neg-taskcard.mjs` live, so this follows the precedent rather than inventing a location:

- `p98-exec-08-capture.spec.ts` — the full-capture dump with the NOSETTLE / dwell / selector controls
  that found the divergence, carrying its own NEGATIVE SCOPE header
- `p98-exec-08-floor-walker.py` — the exclamation-floor regression control, both polarities
- `p98-exec-08-longtail-proof.py` — the 32,430-leaf comparator, both polarities
- `p98-exec-08-evidence/` — all 23 raw run logs and capture JSONs behind every number above

**The capture spec was MOVED out of `tests/e2e/`, not merely left uncommitted.** An untracked spec
inside `testDir` would be collected by any suite-wide Playwright run — a live hazard, not clutter.
`tests/e2e/` is verified clear of `p98-exec-*`.

**Temp-file discipline:** every path this seat wrote carries the seat name (`p98-exec-08-*`) under
the session scratchpad. No generic `/tmp/x`-class name was used. **No stray generic temp file was
encountered**; had one appeared it would have been preserved and reported, never tidied away.

---

## 11. My own weakest point, named by me

**Not the role bound and not the interaction bound — those are disclosed, quantified, and owned by
P102. The weakest thing I shipped is the per-surface guard I added to the oracle.**

I added `expect(captured.length).toBeGreaterThan(0)` on every surface and described it as protection
against a quiet zero. **It would not have caught the defect this wave exists to fix.** In the blind
mode, `/intake/queue` captured **20** elements — comfortably non-zero. My guard distinguishes
_nothing rendered_ from _something rendered_; it does **not** distinguish _shell only_ from _fully
hydrated_, which is the failure mode that actually occurred. By the phase's own rule — _a control
that cannot distinguish the two outcomes is not a control_ — that guard is **decorative for this
class of defect**, and I would rather say so than let a reader take it for a safety net.

What genuinely holds the line is the planted post-settle fixture, which **did** fail when I neutered
the settle. That is one discriminating control, and it protects the mechanism (the settle) rather
than the outcome (a hydrated capture). **A surface that hydrates more slowly than 3 s on a slower
machine, or after a slower query, would under-capture and every assertion in the file would still be
green** — the convergence evidence bounds that risk for these eight surfaces on this machine with
this data, and bounds it nowhere else. A capture-count _floor per surface_, recorded from a known-good
run, would close it; I did not build one, and I am naming its absence rather than leaving the
convergence table to imply more coverage than it has.

Second, smaller: I verified the **shape** and **time** dimensions by measurement but asserted the
**interaction** dimension (menus, dialogs, popovers, unselected tabs) as a bound **without testing
it**. It is declared in the oracle's negative-scope block as covered by nothing — which is honest —
but it is the one bound in this record backed by reasoning instead of a run.

---

## 12. Requirement status

| requirement | status                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COPY-04`   | criterion 4's sentence-case clause **CLOSED at the D-20 bound as amended by `RULING-P98A2-20`**: named instance + captured labels, sentence case, settled capture, per-surface reachability stated |
| `COPY-09`   | **untouched and still filed with P102** — proved by a 32,430-leaf diff, not asserted                                                                                                               |

SUMMARY-END
