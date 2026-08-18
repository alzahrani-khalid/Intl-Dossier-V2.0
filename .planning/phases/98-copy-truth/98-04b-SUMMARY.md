---
phase: 98
plan: 04b
subsystem: i18n-oracle-instrument
tags: [i18n, copy, oracle-extension, both-polarity, collision, ruling-application]
requires:
  - '98-04 — the copy02 oracle and the common.json lane it repaired'
  - 'RULING-P98A2-09 (months class member) and RULING-P98A2-10 (common.* population + detector extension)'
provides:
  - 'the 98-copy02 DOM detector can see the `common.`-shape at all — planted fixture FIRING and PASSING, both polarities, in the run record'
  - 'the statement of record that every copy02 green before that fixture fired was produced by a blind instrument'
  - 'an independent derivation of the `common.*` population (7 distinct keys / 8 sites) and the identification of the prior "45 sites" figure as a different bucket'
affects:
  - 'AR-04b / Phase 99: the residual detector blindness for ~40 other first segments is now NAMED in the spec file rather than latent'
tech-stack:
  added: []
  patterns:
    - "RED must be re-observed at YOUR OWN head. Two of this trip's three dispatched items were already landed or already in the tree when I looked; only one was real."
    - 'a widened detector needs a negative control for the false positive the widening introduces — here a word-boundary guard, asserted in both polarities'
    - 'scope a detector to what its phase OWNS: widening past the ruled shape would red driven legs for a repair routed to another phase'
key-files:
  created:
    - .planning/phases/98-copy-truth/98-04b-SUMMARY.md
  modified:
    - tests/e2e/98-copy02-rawkeys.spec.ts
decisions:
  - 'The detector extension is scoped to the ruled `common.` shape and NOT generalized. The blindness is structural and identical for `afterActions` (100 sites), `stepUp` (24), `forms` (20) and ~40 more first segments — but RULING-P98A2-10 item 3 routed that long tail to AR-04b/P99. A generic matcher would red the driven legs for a ~300-site repair this phase does not own. The residual blindness is written into the spec file so the next reader inherits the finding, not the surprise.'
  - 'A leading word boundary was added with the `common` alternative. `common` is an ordinary English word, unlike `entityLinks`/`typeGuide`; without the boundary `uncommon.Add` matches on the embedded substring. The guard carries its own negative control rather than being asserted in prose.'
  - "I did not commit the `common.*` bundle authoring. It appeared in my working tree written by another seat while I was deriving the population. Committing another seat's uncommitted work under my name on a shared main tree risks a lost update and misattributes the authoring. I disclosed with the file list and held; the other seat then committed it itself."
metrics:
  duration: ~25m
  completed: 2026-08-18
  tasks: 3 dispatched / 1 executed / 2 found already landed
  files: 1 code + 1 doc
---

# Phase 98 Plan 04b: the ride-along trip Summary

Three ruled items were dispatched. **I re-observed RED at my own head for each, as the contract
requires, and only ONE was still red.** Item 1 was already committed. Item 2 appeared in my
working tree, authored by another seat, while I was deriving its population — I disclosed and
held rather than commit work that was not mine, and that seat then committed it. Item 3 was
real, and it is the one I executed: **the copy02 DOM detector could not see the `common.`-shape,
proven by making its own fixture fail, then fixed and proven again.**

**One commit, one file, zero exogenous paths.**

## Commits

| hash        | what                                                                 | files                                 |
| ----------- | -------------------------------------------------------------------- | ------------------------------------- |
| `78c5ccefe` | copy02 detector extended for the `common.`-shape (`RULING-P98A2-10`) | `tests/e2e/98-copy02-rawkeys.spec.ts` |

Not mine, landed by another seat during this trip and named here so the record is not silent:
`c0c32d524` and `df30658bb` (the `common.*` ×7 authoring and its discrepancy note).

## THE DISPATCH'S PREMISE WAS STALE — stated first, because it changes what this trip is

The dispatch named HEAD `38533bce1`. **My head was `af3f64b32`** — two commits further on. That
gap is the whole story of items 1 and 2.

| item               | dispatched as                        | what I actually observed at my head                                          |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------- |
| 1 — months flip    | "still reads dot-form, colon-form 0" | **already colon-form.** Flip at `c5661eeb8`, conditions recorded `af3f64b32` |
| 2 — `common.*` ×7  | to be authored on this trip          | **already in my working tree**, uncommitted, written by another seat         |
| 3 — detector blind | to be extended on this trip          | **genuinely red.** Executed.                                                 |

`RULING-P98A2-10` item 1 named the relay as the failure mode and bound a release to its receipt.
This trip is the same failure one turn later: the _dispatch_ was not re-derived against the head
it was sent to. I did not re-apply item 1 and I did not silently reconcile item 2 — both are
reported.

## ITEM 3 — THE ONE REAL REPAIR: both polarities, at run time, in the run record

### RED — the instrument failing on its own fixture

Method matters here. I added the fixture assertion **first, while leaving the regex untouched**,
and ran it. So the RED is not an argument about a regex; it is the oracle failing.

Runner: `pnpm exec playwright test tests/e2e/98-copy02-rawkeys.spec.ts --project=chromium-en
--no-deps --workers=1 --reporter=list -g "DOM detector"`, dev server `http://localhost:5173`,
viewport 1400×900. Spec existence asserted and the enumeration read (`--list` → 7 tests in
`chromium-en`) before running (D-09 — **spec paths are FILTERS**).

```
1 failed
  Error: detector must fire on the planted common.clearFilters
  Expected: true
  Received: false
    at tests/e2e/98-copy02-rawkeys.spec.ts:304
```

**Locale · role:** none — this leg is an INSTRUMENT self-test evaluated in-page against
`RAW_KEY_TOKEN.source`, the same source string the driven-surface assertions consume. It is
locale-independent by construction, and that is stated rather than left for a reader to assume.

**RC caveat, disclosed:** that first run was piped to `tail`, so the `$?` I captured was the
pipe's, not Playwright's (the zsh landmine — `${PIPESTATUS[0]}` is a bash-ism and empty here).
The verdict does not rest on that RC: the runner printed `1 failed` with the assertion text. Every
subsequent run in this record was redirected to a file, not piped, so its RC is Playwright's own.

### GREEN — at `78c5ccefe`

```
✓ 1 [chromium-en] › BOTH-POLARITY SELF-TEST: the DOM detector fires on a planted key
                    and passes clean copy (123ms)
1 passed        SELFTEST_RC=0   (real exit code, not a pipe's)
```

The regex gains one alternative and one word boundary:

```
before  /(entityLinks|regions|typeGuide|typeDescription|calendar\.recurrence)\.[A-Za-z.]+/
after   /\b(entityLinks|regions|typeGuide|typeDescription|calendar\.recurrence|common)\.[A-Za-z.]+/
```

**Four fixtures, gate-executable — a control that is only described is not run:**

| polarity  | fixture                                        | required | why this one                                            |
| --------- | ---------------------------------------------- | -------- | ------------------------------------------------------- |
| **FIRES** | `common.clearFilters`                          | `true`   | the exact defect the detector could not see             |
| PASSES    | `Clear filters`                                | `false`  | the resolved VALUE must never look like a leak          |
| PASSES    | `This pattern is common. Add one to continue.` | `false`  | `common` is an ordinary English word before a full stop |
| PASSES    | `That spelling is uncommon.Add a note.`        | `false`  | the word-boundary guard, on the substring it guards     |

The pre-existing `entityLinks.title` / `regions.Europe` / prose fixtures are untouched and still
assert.

### The statement `RULING-P98A2-10` requires, in the file and here

**Every green the `98-copy02` detector produced before this fixture fired was produced by an
instrument that could not see the `common.`-shape.** That is not a hypothetical: the shape it
could not see was `common.clearFilters` at `EntitySearchDialog.tsx:293` — a raw key on a surface
plan 98-04 had _just repaired_. The oracle returned clean over a defect inside its own population.
Those greens are retrospectively untrusted for this shape; the fixture is what makes the next one
mean something. The sentence is written into the spec file itself, not only into this summary, so
it cannot be lost by anyone reading the code instead of the record.

### Why NARROW — the deliberate limit, with its cost stated

The blindness is **structural, not a typo**: the alternation lists 5 prefixes, and the finder
reports **68 distinct first segments** among unresolved raw-key sites. `afterActions` alone is
**100 sites / 95 distinct keys**, then `stepUp` 24, `forms` 20. A generic dotted-token matcher
would see all of them — and would **red the driven legs for a ~300-site repair that
`RULING-P98A2-10` item 3 explicitly routed to `AR-04b` (Phase 99)**. This phase does not own that
work and cannot absorb it, so widening past the ruled shape would manufacture a red nobody can
clear.

**What that sets aside, stated rather than implied:** after this commit the detector still cannot
see ~40 other first segments. Criterion 2's DOM leg is a closer for the ruled populations only.
The limitation is written into the spec file so the next reader inherits the finding.

## ITEM 2 — the population I derived, and a number that was about a different question

I derived it before looking at anyone's count, as instructed.

**Population definition (BEHAVIOUR, not token):** a `t()` lookup with **no string fallback**,
whose dot-form key begins `common.`, in a file whose `useTranslation()` takes **no namespace** —
so the lookup resolves into defaultNS `common` and lands at path `common.<key>` inside
`common.json` — where the key is **absent**, therefore the raw key reaches the screen.

**Derived: 7 distinct keys / 8 sites.**

| key                   | sites | file(s)                                                                            |
| --------------------- | ----- | ---------------------------------------------------------------------------------- |
| `common.clearFilters` | 1     | `entity-links/EntitySearchDialog.tsx:293`                                          |
| `common.hide`         | 1     | `edit-approval-flow/EditApprovalFlow.tsx:207`                                      |
| `common.show`         | 1     | `edit-approval-flow/EditApprovalFlow.tsx:207`                                      |
| `common.none`         | 1     | `version-comparison/VersionComparison.tsx:162`                                     |
| `common.recommended`  | 1     | `pdf-generator-button/PDFGeneratorButton.tsx:201`                                  |
| `common.remove`       | 1     | `tasks/WorkItemLinker.tsx:146`                                                     |
| `common.selectDate`   | **2** | `commitment-editor/CommitmentEditor.tsx:347`, `decision-list/DecisionList.tsx:172` |

All 7 files call bare `useTranslation()` — verified per file, not assumed. All 7 keys were absent
at **both** candidate paths (top level AND `common.<key>`) in **both** locales; the resolver's
positive control `common.loading` resolved in both, which is what proves the resolver worked.

### THE DISCREPANCY — reported, not reconciled

`98-04-SUMMARY.md` recorded "`common` **45 sites** but only 7 distinct keys". My derivation
returns **8 sites**. Both numbers are correct; they answer different questions.

**45 is the count of unresolved keys containing NO DOT AT ALL** — the bare `save`/`cancel`-shape
bucket, which has nothing to do with the `common.` prefix. I measured it directly:

```
first-segment histogram over the 308 unresolved raw-key sites
  common          ->   8 sites /  7 distinct     <- the common.* population
  (no dot at all) ->  45 sites                   <- the figure the prior summary reported as "common"
```

The distinct-key count (7) is right in both records, which is why the error survived. **This is
the phase's own failure pattern for the fourteenth time: a correct number about a question nobody
asked.** I am not silently reconciling it — I measured 8, the prior record says 45, and the
reason they differ is named above. (The other seat independently reached the same conclusion and
committed it at `df30658bb`; two instruments, one answer.)

### Post-fix both-locale resolution — verified independently at MY head, from the committed blobs

Required evidence under `RULING-P98A2-10`, and not waived just because another seat did the
authoring:

| key            | `en` `common.<key>` | `ar` `common.<key>` |
| -------------- | ------------------- | ------------------- |
| `clearFilters` | `Clear filters`     | `مسح عوامل التصفية` |
| `hide`         | `Hide`              | `إخفاء`             |
| `none`         | `None`              | `لا شيء`            |
| `recommended`  | `Recommended`       | `موصى به`           |
| `remove`       | `Remove`            | `إزالة`             |
| `selectDate`   | `Select date`       | `اختر التاريخ`      |
| `show`         | `Show`              | `عرض`               |

**7/7 resolve in BOTH locales. Negative control on the same resolver:** `common.zzNope` →
`undefined` in both — so the resolver reports absence rather than resolving everything.

**Second instrument, same question:** the finder's `common.*` unresolved bucket went **8 → 0**
(total unresolved raw-key sites 308 → 300, a delta of exactly 8). Both locales landed in the same
commit (D-16).

**Named, not repaired — the partially-repaired line:** `PDFGeneratorButton.tsx:201` renders
`{t('afterActions.pdf.both')} {t('common.recommended')}`. My population's half now resolves; its
neighbour `afterActions.pdf.both` **still does not resolve anywhere** and is a member of the
100-site `afterActions` bucket routed to `AR-04b`/P99. **That line still leaks a raw key.** Anyone
reading "the `common.*` repair is complete" should not infer that line is clean.

**Near-duplicate, flagged not hidden:** `common.actions.remove` already existed with the same
values (`Remove` / `إزالة`). The ruled authoring flavour produces a second key with identical
content. Re-routing that one call site would have avoided it; uniform authoring across all 7 was
chosen instead, and the duplication is recorded rather than left to be discovered as a defect.

## ITEM 1 — already landed. No RED was observable, so nothing was repaired.

Re-observed at my own head, **not quoted from the previous seat**:

```
$ command grep -c 'calendar\.months'  RecurrencePatternEditor.tsx    -> 0   (dot-form)
$ command grep -n  'calendar:months'  RecurrencePatternEditor.tsx
  557: <Label>{t('calendar:months.january').split(' ')[0]}</Label>   (colon-form)
```

**The zero is instrument-tested** (the repo landmine): the identical `grep` shape returns the line
for the colon pattern, so the 0 is an absence, not a broken command. Pinned to a sha rather than
to a moving HEAD: at **`78c5ccefe`**, dot-form count is 0 and line 557 is colon-form.

The flip landed at `c5661eeb8`; `RULING-09`'s four conditions are recorded in `98-04-SUMMARY.md`
as committed at `af3f64b32` (the `.split(' ')[0]` render-path proof appears twice, the CONDITION-2
both-locale table once, the conservation-gate non-endorsement once). **I re-applied nothing.**

Independently re-verified at `78c5ccefe`, because a condition is worth more when a second seat
reproduces it:

| locale | `calendar.json` `months.january` | what `<Label>` renders after `.split(' ')[0]` |
| ------ | -------------------------------- | --------------------------------------------- |
| `en`   | `January`                        | `January`                                     |
| `ar`   | `يناير`                          | `يناير`                                       |

**The conservation gate does not endorse this fix and no reader should infer that it does** —
it counts `calendar\.recurrence\.` tokens only, so it moves for neither side. Its evidence is the
resolution check above plus the render-path proof: a raw key contains no space, so
`.split(' ')[0]` returns the WHOLE key, which is what proves `calendar.months.january` reached the
screen rather than sitting latent.

## Gates

| gate                                                       | result                                                                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `98-copy02` self-test, `chromium-en --no-deps --workers=1` | **RED then GREEN** — see the run record above; RC 0 at `78c5ccefe`                                                                                  |
| `98-copy02` FULL spec, `chromium-en`                       | **6 passed / 1 failed** — see below                                                                                                                 |
| `pnpm exec eslint tests/e2e/98-copy02-rawkeys.spec.ts`     | **RC 0** (`--max-warnings 0`)                                                                                                                       |
| `cd frontend && pnpm lint` (all five guards)               | **RC 0** — eslint; i18n-namespaces (1718 files / 800 literals / 128 ns); duplicate-rtl; bootstrap-parity; date-formatting (1534 files, 0 unexcused) |
| `cd frontend && pnpm type-check`                           | **RC 0** (`tsc --noEmit`)                                                                                                                           |
| `prettier --check` on the edited spec                      | **RC 0** after `--write`                                                                                                                            |

**The 1 failure, named rather than absorbed:** `the intake ticket detail renders no raw key` fails
on `Error: no intake ticket reachable from /intake/queue under en — leg UNDRIVEN (D-24)`. That is
the spec's own **precondition** assertion, not a raw-key assertion — the detector never ran on
that surface, so my regex change cannot have caused it, and equally **my change is not evidenced
on that surface**. It is the same UNDRIVEN leg `98-04` recorded. The country-wizard and auth legs
stayed green across the change, which is the evidence that the widened alternation introduced no
false positive on a driven surface.

## Deviations from Plan

### 1. Item 2 was NOT committed by me — a collision, disclosed BEFORE any commit

While deriving item 2's population I re-read `common.json` and found it had changed **between two
reads within my own session**. `git status` showed `frontend/src/i18n/{en,ar}/common.json` dirty
with exactly the 7 keys, written at 05:06, **by another seat** — I had written nothing. Hashes
were stable over a 6 s window, so the writer had finished or paused.

I stopped and escalated to the team lead **with the full dirty file list**, as
`RULING-P98A2-08` requires, and explicitly did not commit: committing another seat's uncommitted
work under my name on a shared main tree with no worktree isolation risks a lost update and
misattributes the authoring. I offered both readings (adopt / cede) and asked for the call.

**The question was answered by events** — that seat committed its own work at `c0c32d524` and
`df30658bb` while I executed item 3. I verified the committed result independently anyway (the
both-locale table above), because the ruled evidence requirement is about the repair, not about
who typed it.

**No act-then-disclose occurred.** Nothing was in my tree when I raised it; `RULING-P98A2-05` is
not engaged.

### 2. The detector extension went one character beyond "add `common` to the alternation"

A leading `\b` was added. `common` is an ordinary English word where the other five prefixes are
invented identifiers, so the alternation introduces a false-positive class the original never had
(`uncommon.Add`). The guard ships with its own negative control rather than an assurance. Strictly
additive: every pre-existing fixture still asserts and still passes.

### 3. Four lines of PRE-EXISTING prettier drift are in my diff

The spec's HEAD blob was **already not prettier-clean** — verified by piping the blob through
`prettier --check --stdin-filepath` (RC 1) before I formatted anything, so this is inherited, not
caused. `--write` (which the pre-commit hook would have run anyway) collapsed an over-wrapped
`expect(unresolvedLeaves, …)` in the recurrence census. **No semantic change.** Recorded so nobody
wonders why an instrument edit touched the census block.

### 4. No auto-fix was needed; zero packages were installed

No bug, no missing critical functionality, no blocking issue. `T-98-SC` holds.

## Requirements

**No register row is ticked by this trip, and that is deliberate.** `COPY-02` closes under
`RULING-P98A2-10` item 3 on four conditions, one of which is "NO raw key on any oracle-driven
surface … **with the extended detector**". This commit supplies the extended detector; it does not
supply the driven-surface green, because the intake leg — the surface where the `entityLinks` and
`common.clearFilters` classes actually render — remains **UNDRIVEN**. Marking `COPY-02` complete
on an instrument fix while its sharpest surface has never been driven would be exactly the
manufactured green this phase keeps catching. Whoever closes `COPY-02` should close it on the
whole ruled set.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change — the only code file I
modified is a test spec. Register dispositions:

- **`T-98-07`** (a green over a misspelled key) — **directly reduced.** The detector's blind spot
  was a live instance of exactly this threat: an oracle reporting clean over a defect in its own
  population. Now exercised by a planted fixture in both polarities.
- **`T-98-08`** (new copy leaking internals) — **holds**: I authored no user-facing copy.
- **`T-98-09`** (i18next escaping) — **untouched**: no interpolation option changed.
- **`T-98-SC`** (package installs) — **holds: zero installs.**

## Known Stubs

None introduced. Two pre-existing defects are named with their reasons rather than stubbed over:
the residual detector blindness for ~40 first segments (routed to `AR-04b`/P99, written into the
spec file), and `afterActions.pdf.both` still leaking on `PDFGeneratorButton.tsx:201`.

## Operator parks — untouched

**Arabic naturalness:** I authored no `ar` copy on this trip. The seven `ar` values verified above
were authored by another seat; I verified they RESOLVE and I make **no claim about how they
read** — that remains Phase 99's and the operator's. Pixel RTL, the `/calendar` baseline and
`E2ECRED-01` were not approached.

## Working tree

My one commit `78c5ccefe` contains **exactly one file**, `tests/e2e/98-copy02-rawkeys.spec.ts`
(`git show --stat 78c5ccefe`: `1 file changed, 38 insertions(+), 6 deletions(-)`). **Zero
exogenous paths.** The dirty exogenous set (`CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`,
`.agents/skills/*` ×2, `.claude/skills/*` ×2, `_archive-98-attempt1-260818/`) was dirty when I
arrived and is untouched by me.

Every commit used an explicit pathspec (`git commit -F <msg> -- <path>`). `git add -A` and
`git commit -a` were **never** run. No `git clean`, no `git stash`, no `git reset`, and
`--no-verify` was never used.

**One failed command, disclosed:** my first commit attempt put `--` before `-m`, so git read the
message as a pathspec and refused (`did not match any file(s) known to git`). Nothing was
committed and nothing was lost — verified with `git log` before retrying with `-F`.

## Tooling quirks recorded

- Piping a Playwright run into `tail` yields the pipe's exit code, and `${PIPESTATUS[0]}` is a
  bash-ism that is empty under this shell. Every verdict-bearing run here was redirected to a file
  and its RC captured on its own line.
- `HEAD` moved twice underneath this session (another seat committing to the same branch). Every
  file claim in this summary is pinned to a **sha**, not to `HEAD`.

## Self-Check: PASSED

- `tests/e2e/98-copy02-rawkeys.spec.ts` — present on disk, and present in commit `78c5ccefe`.
- `.planning/phases/98-copy-truth/98-04b-SUMMARY.md` — this file.
- `78c5ccefe` verified present in `git log`; `c5661eeb8`, `af3f64b32`, `c0c32d524` and `df30658bb`
  verified present and correctly attributed to other commits, not to mine.

SUMMARY-END
