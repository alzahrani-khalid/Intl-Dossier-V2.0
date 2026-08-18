---
phase: 98
plan: 02
subsystem: date-formatting-guard
tags: [lint-guard, date-fns, i18n, relative-time, burn-down, positive-failure]
requires: []
provides:
  - 'the extended drilled instrument for criterion 5 — four new checks, each observed RED on a planted fixture'
  - 'formatRelativeTime — the ONE sanctioned localized relative-time helper (D-25), in the formatter module'
  - 'a 60-row named-debt list enumerating every pre-existing violation site, for 98-07 to empty'
affects:
  - '98-07: the routing sweep that empties the debt list and routes the six enumerated feed surfaces onto formatRelativeTime'
tech-stack:
  added: []
  patterns:
    - 'burn-down allowlist that is self-cleaning: a row whose site is gone turns the run red'
    - 'the named debt applies ONLY to the default scan, so an explicit-directory run reports checks and never stale rows'
    - 'fixture directory under the guard script as its own built-in positive-failure drill'
key-files:
  created:
    - scripts/date-format-fixtures/relative-time.fixture.ts
    - scripts/date-format-fixtures/skeleton.fixture.ts
    - scripts/date-format-fixtures/twelve-hour.fixture.ts
    - scripts/date-format-fixtures/localestring-date.fixture.ts
  modified:
    - frontend/src/lib/format-date.ts
    - scripts/check-date-formatting.mjs
decisions:
  - "check 8's receiver heuristic is case-INSENSITIVE: the plan's verbatim case-sensitive token list cannot match `clientDate.toLocaleString(`, one of the two offender shapes its own acceptance criterion says must be caught"
  - "`deadline` added to check 8's token list: it catches `new Date(assignment.sla_deadline).toLocaleString(` (MyAssignments.tsx:158), a real date renderer with no other date token in its name"
  - 'COPY-05 is NOT marked complete: this plan repairs no call site — 98-07 does, and the debt list is the proof that 97 sites are still live'
  - 'zero call sites migrated onto formatRelativeTime — D-25 gives that enumeration to 98-07 and it is graded there'
metrics:
  duration: ~1h
  completed: 2026-08-18
  tasks: 2
  files: 6
---

# Phase 98 Plan 02: Criterion-5 Instrument + Sanctioned Helper Summary

`scripts/check-date-formatting.mjs` extended from four checks to eight — the four new ones each
**observed failing on a planted fixture before its green over `frontend/src` was believed** — and
`formatRelativeTime` landed in `frontend/src/lib/format-date.ts` as D-25's single sanctioned home
for relative time. **Nothing was repaired and no call site moved**: the guard is green at HEAD only
through 60 enumerated debt rows excusing 97 live violation sites, all owned by plan 98-07.

## The both-polarity drill — observed, at the committed state `8b2574c5b`

Four polarities were run by hand and each is reproducible from the script's own header.

| #   | command                                                               | RC    | what it proves                                                      |
| --- | --------------------------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| 1   | `node scripts/check-date-formatting.mjs scripts/date-format-fixtures` | **1** | every new check FIRES — 8 findings, all four checks named           |
| 2   | `node scripts/check-date-formatting.mjs frontend/src/design-system`   | **0** | green on a clean subtree with the debt list INACTIVE                |
| 3   | `node scripts/check-date-formatting.mjs`                              | **0** | green at HEAD over `frontend/src`, debt list ACTIVE                 |
| 4   | polarity 3 with one planted stale row                                 | **1** | a row whose site is gone turns the run red (T-98-04, self-cleaning) |

**Polarity 1, the per-check findings as printed** (this is the D-06 drill, not a claim about it):

| check               | fixture findings | the captured text                                                                         |
| ------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `relative-time`     | 2                | `relative-time.fixture.ts:12 — date-fns relative time outside lib/format-date.ts`         |
| `skeleton`          | 3                | `skeleton.fixture.ts:12 — date-fns localized skeleton literal 'PPP'` (+ `'PPpp'`, `'PP'`) |
| `twelve-hour`       | 1                | `twelve-hour.fixture.ts:10 — 12-hour clock literal 'h:mm a'`                              |
| `localestring-date` | 2                | `localestring-date.fixture.ts:10` (`assigned_at`) and `:15` (`clientDate`)                |

**Polarity 4 verbatim**, with `{ file: 'frontend/src/lib/query-client.ts', check: 'relative-time' }`
planted (a file that carries no relative-time call), then removed:

```
date-formatting check FAILED: 1 stale burn-down row(s) — the pattern each excuses is gone
from its file. A row is a named debt, not a pass: delete it.
  frontend/src/lib/query-client.ts — relative-time
```

## Re-derived populations (D-04 — the counts fall out; nothing here is quoted from RESEARCH)

Derived by running the extended guard against `frontend/src` **with the debt list empty**, i.e. by
the instrument's own population, not by a separate grep. Cross-checked against a `command grep`
census before the checks were written; where the two disagreed the disagreement is stated below.

| check               | sites  | rows (file × check) | RESEARCH §C5 said | reconciliation                                                               |
| ------------------- | ------ | ------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `relative-time`     | 43     | 21                  | 21 files          | agrees exactly at file granularity                                           |
| `skeleton`          | 41     | 31                  | ≈9 sites          | **§C5 undercounted by ~4×** — the derived 41 governs                         |
| `twelve-hour`       | 5      | 2                   | 4 sites           | derived 5 (2 files) governs                                                  |
| `localestring-date` | 8      | 6                   | 2 confirmed       | both confirmed shapes caught, plus 4 more the confirmed pair did not predict |
| **total**           | **97** | **60**              | —                 | 60 rows carry the marker token; `grep -c` on it returns exactly 60           |

**POPULATION, stated (D-05).** IN: every non-test `.ts`/`.tsx` under `frontend/src` — exactly what
the script's `walkSourceFiles` returns, **1534 files** at this HEAD. OUT, deliberately, and written
into the script header so it travels with the instrument:

- `*.test.ts(x)` and `__tests__/` — the walker skips them (inherited FMT-02 scope).
- `yyyy-MM-dd` / `HH:mm` plumbing literals — machine input values, never user-facing prose.
- `MMMM yyyy` calendar-grid month headers — navigation chrome, **explicitly out of criterion 5's
  population per D-25**; their Arabic rides `AR-02` / Phase 99.
- `.toLocaleString()` on COUNTS. Substantiated rather than assumed: all 46 `.toLocaleString(`
  receivers in `frontend/src` were enumerated and read — the 38 the check does **not** flag are
  `entry.value`, `item.count`, `row.total_items`, `dossier.extension.population`, `charCount`,
  `maxLength`, `days`, `hours` and similar numerics. **Zero false positives** in the flagged 8.
- `frontend/src/.understand-anything/` — the git-ignored dashboard extract. Instrument-tested: it
  holds **0** `.ts`/`.tsx` files (the same `find` returns 43 under `frontend/src/lib`), so it
  contributes nothing to the walker's population either way.
- Non-`frontend/src` trees (backend, `tests/`, `supabase/`) — never scanned.

The four ORIGINAL checks returned **0** on the same run, so the extension neither disturbed nor
silently repaired anything they were holding.

## Gate results

| gate                                          | result                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Task 1 automated verify (verbatim)            | **RC 0** — export present, `formatDistanceToNow` present, 0 `ar-SA`, i18n import present |
| `cd frontend && pnpm type-check`              | **RC 0** (unpiped; `tsc --noEmit`, no diagnostics)                                       |
| `eslint` on `frontend/src/lib/format-date.ts` | **RC 0**                                                                                 |
| Task 2 automated verify (verbatim)            | **RC 0** — fixture run non-zero, repo run zero                                           |
| `cd frontend && pnpm lint` (all 4 guards)     | **RC 0** — eslint, i18n-namespaces, duplicate-rtl, bootstrap-parity, date-formatting     |

Final lint line: `1534 non-test file(s) scanned, 0 unexcused … Named debt: 60 row(s) excusing 97
site(s), all owned by plan 98-07.`

## `98-RED-BASELINE.md` is untouched by this plan

No component, route, or rendered surface was modified. `formatRelativeTime` has **zero consumers**
outside its own module (instrument-tested: the same sweep returns 201 for `formatDayFirst`), so
`98-copy05`'s two REDs — `/audit-logs [en]` rendering `about 24 hours ago` and `/activity [ar]`
rendering the bare `109d` token — both still stand at this HEAD. Nothing this plan did can be
mistaken for a repair, and no 98-01 oracle references the guard script (0 hits under `tests/e2e`).

## Deviations from Plan

### Reported, not improvised — the plan's check-8 regex cannot meet the plan's check-8 criterion

The `<action>` prescribes `/(date|time|_at|At|created|updated|timestamp)\w*\s*\)?\.toLocaleString\(/`
**verbatim**, and the `<acceptance_criteria>` says "the two confirmed offender shapes
(ConflictResolutionDialog, StatusTimeline) **must be caught**". Those two clauses are jointly
unsatisfiable: the offenders in `ConflictResolutionDialog.tsx:179-180` are `clientDate` and
`serverDate` — capital `D` — and the token list is case-sensitive with no `Date` alternative. Run
verbatim, the check found StatusTimeline and **missed** ConflictResolutionDialog.

**Resolution: the acceptance criterion governs, the illustrative regex yields.** The token list is
now case-insensitive, which is the minimal change that catches both named shapes. This strengthens
the instrument and narrows nothing; the plan's own contract for the heuristic ("false positives go
in the allowlist with a reason") is the mechanism that absorbs the widening — and in the event
there were **zero** false positives to absorb.

A second, smaller widening: `deadline` was added to the token list after reading all 46
`.toLocaleString(` receivers. It catches `new Date(assignment.sla_deadline).toLocaleString(` at
`frontend/src/pages/MyAssignments.tsx:158` — a rendered due date (`Due: …`) with no other date token
in its identifier.

**Both changes are inside the plan's `files_modified` and neither weakens a criterion**, so no
checkpoint was raised — but both are named here and in the return message rather than left for a
reader to find in the diff.

### Auto-fixed issues

**1. [Rule 1 - Bug] My own doc comment reddened Task 1's own gate**

- **Found during:** Task 1 verification. The gate requires zero `ar-SA` in `format-date.ts`; it
  returned 1.
- **Issue:** the count was correct and the surprise was mine — the offending occurrence was the
  literal inside a sentence **I had just written** explaining that the literal must not be used.
- **Fix:** the sentence now names the constraint without spelling the token.
- **Files:** `frontend/src/lib/format-date.ts`. **Commit:** `7275b01a1`.

**2. [Rule 1 - Bug] The clean-subtree green printed a debt figure that had not been applied**

- **Found during:** polarity 2. The OK line read `Named debt: 60 row(s) excusing 0 site(s)` on a run
  where the debt list is deliberately inactive — a true sentence that would be read as "the debt was
  checked and excused nothing".
- **Fix:** explicit-directory runs now print `Named debt NOT applied (explicit-directory run) —
this green is unexcused.`
- **Files:** `scripts/check-date-formatting.mjs`. **Commit:** `8b2574c5b`.

## ESCALATION — a fifth escaping class the plan does not name, owner 98-07

Found while instrument-testing "zero consumers of `formatRelativeTime`", which returned **31**
matches instead of 0. Reading them in context: they are all pre-existing and unrelated to my export.
**Five components declare their own local `formatRelativeTime`**, and a sixth module exports a
different shared one:

| site                                                                           | shape                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------- |
| `components/dossier/ActivityTimelineItem.tsx:100`                              | local `const formatRelativeTime`              |
| `components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx:103` | local `function formatRelativeTime`           |
| `components/dossier/ExpandableDossierCard.tsx:196`                             | local `function formatRelativeTime`           |
| `components/dashboard-widgets/NotificationsWidget.tsx:99`                      | local `function formatRelativeTime`           |
| `components/activity-feed/ActivityList.tsx:77`                                 | local `function formatRelativeTime`           |
| `lib/i18n/relativeTime.ts:18`                                                  | exported `formatRelativeTimeShort` (Phase 41) |

**Why this matters to 98-07, in two separate ways:**

1. **The guard cannot see them.** Check 5 bans _date-fns_ relative-time calls; these are hand-rolled
   delta arithmetic with no date-fns import. D-25 says "one shared localized helper" — six
   implementations is the defect that clause exists to prevent, and after this plan the instrument
   still does not enforce it. `98-copy05`'s `/activity [ar]` RED (`109d`, `110d`) is produced by
   `formatRelativeTimeShort`, i.e. by this class, **not** by any site in my 60-row debt list.
2. **Routing them will collide.** Five of the six files already bind the identifier
   `formatRelativeTime` locally; an `import { formatRelativeTime } from '@/lib/format-date'` into
   any of them is a redeclaration error until the local is deleted first.

**I did not act on this.** Adding a sixth check is a deviation from a work order that enumerates
exactly four, and the fix is a routing decision that belongs to 98-07's enumeration. Flagged for the
overseer to decide whether 98-07's plan gains a hand-rolled-relative-time check, or whether criterion
5 closes with this gap named.

## Requirements NOT marked complete

`COPY-05` is in this plan's frontmatter and is **deliberately left open**. This plan repairs no
rendered surface — the 60 debt rows are the standing proof that 97 competing-format sites are still
live. `COPY-05` closes when 98-07 empties the list and the `98-copy05` oracle goes green. Named
here rather than silently skipped, as 98-01 did for the same reason.

## Threat Flags

None. No network endpoint, auth path, file-access pattern, or schema change. `T-98-03` (a check that
never fired) is mitigated by polarity 1 in the gate itself — the verify command inverts the fixture
run so a zero exit is an explicit failure. `T-98-04` (rows outliving their sites) is mitigated and
**observed** in polarity 4. `T-98-SC` holds: **zero package installs**.

## Known Stubs

None. `formatRelativeTime` is fully implemented; that it has no consumers yet is the plan's design
(D-25 gives the six feed surfaces to 98-07), not a stub.

## Working tree

The only dirty paths remain the exogenous, harness-owned ones (`CLAUDE.md`, `AGENTS.md`,
`tickmarkr.spec.md`, `.agents/skills/*`, `.claude/skills/*`, `_archive-98-attempt1-260818/`).
**No commit in this plan touches any of them** — both commits used explicit pathspecs; `git add -A`
and `git commit -a` were never run.

## Self-Check: PASSED

All 6 claimed files verified present on disk; both commit hashes (`7275b01a1`, `8b2574c5b`) verified
present in `git log --all`.
