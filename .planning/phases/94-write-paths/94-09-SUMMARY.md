---
phase: 94-write-paths
plan: 09
subsystem: ui
tags: [react, tanstack-query, i18next, vitest, supabase-functions, reports]

requires:
  - phase: 94-05
    provides: the 42P17 migration + the probe that closes WRITE-06's REAL surfaces (custom-reports CRUD, scheduled-report creation)
  - phase: 94-07
    provides: the prior REQUIREMENTS.md wave (this plan is the third writer; waves 1–2 preserved)
provides:
  - 'ReportsPage sends the body key `type` — the name `supabase/functions/reports/index.ts:258` requires; every generate no longer 400s'
  - 'A pure, tested entry mapping (`buildGeneratedReportEntry`) that makes a fabricated `completed` entry impossible by construction'
  - '`report-builder:generate.unavailable` in both locales, addressed in colon form'
  - 'DEAD-09 — the mock POST handler filed with owner Phase 95 and a status-table row'
affects: [95-routes-that-dont-render, 98-copy-truth]

tech-stack:
  added: []
  patterns:
    - "Extract a page's response→state mapping into a pure module so its behaviour is testable without a browser, a server, or a mock"

key-files:
  created:
    - frontend/src/pages/reports/generate-entry.ts
    - frontend/src/pages/reports/__tests__/generate-entry.test.ts
  modified:
    - frontend/src/pages/reports/ReportsPage.tsx
    - frontend/src/i18n/en/report-builder.json
    - frontend/src/i18n/ar/report-builder.json
    - .planning/REQUIREMENTS.md

key-decisions:
  - "The rename and the terminal state and the DEAD-09 filing ship as ONE commit (68414f219) — PARK-94-06's pairing rule makes them one honest act, and splitting would leave an intermediate commit whose page imports a module that does not exist"
  - "The `t()` call lives in ReportsPage (rendering); the pure function returns only a status discriminator — so the mapping stays framework-free and the gate's key assertion lands where the copy actually renders"
  - 'No `onError` was added to the generate mutation: the global handler at `lib/query-client.ts:62` already surfaces a translated `common:errors.queryFailedInline` and never a server `error.message` (D-08 satisfied ambiently). Adding one would be unrequested scope.'

patterns-established:
  - 'Pure response→entry mapping module colocated with the page (`pages/<x>/<mapping>.ts` + `__tests__/`), replacing an inline object literal in `onSuccess`'

requirements-completed: [WRITE-06]

duration: ~35min
completed: 2026-08-16
---

# Phase 94 Plan 09: Reports generate — rename paired with an honest terminal state

**The `template`→`type` rename shipped PAIRED with a tested pure mapping that makes a fabricated
`completed` entry impossible, a bilingual `generate.unavailable` state, and `DEAD-09` filing the
mock POST handler to Phase 95.**

## Performance

- **Duration:** ~35 min (start approximate; commit stamped `2026-08-16T18:13:41+03:00`)
- **Completed:** 2026-08-16T15:15:03Z
- **Tasks:** 3 (Task 1, Task 1b, Task 2) — committed as one paired commit, per PARK-94-06
- **Files modified:** 6 (4 modified, 2 created)

## Task Commits

The plan mandates the pairing (`Task 2`: _"STAGE AND COMMIT WITH TASK 1 — the rename and the filing
are one honest act"_), and Task 1b's module is imported by Task 1's page. All three therefore land in
one commit:

1. **Tasks 1 + 1b + 2** — `68414f219` (`fix`) — `fix(94-09): pair the reports template→type rename with an honest terminal state`

`.planning/REQUIREMENTS.md | 3 ++` — purely additive; waves 1 and 2 preserved, zero deletions.

---

## GATE DRILL — every gate, both directions, real output

Gate ids are the `scripts/gate-drill.mjs` ids: the Nth `<automated>` block in `94-09-PLAN.md`, in file
order. Bodies were extracted **verbatim** from the plan by script (never retyped) and run with `bash
<file>` from the repo root — the same instrument gate-drill uses, which also sidesteps the zsh `grep`
wrapper entirely.

> **Id/line mapping, stated because the spawn prompt's prose and its line anchors disagree.** The
> prompt's line anchors (`g1`:100, `g2`:129, `g3`:155) match `gate-drill.mjs` exactly and are what
> this table uses. Its _prose_ descriptions of `g2` and `g3` are swapped relative to those anchors
> (it describes `g2` as the DEAD-09 marker check and `g3` as the pure-function test; by line, `g2` IS
> the pure-function test and `g3` IS the DEAD-09 check). No gate text was touched; the discrepancy is
> in the prompt's prose only.

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-09_g1` (:100) — vitest + `type` sent + `template` gone + unavailable key wired + no literal `status: 'completed'` + bilingual key pair + `pnpm type-check` | `bash /tmp/94-09_g1.sh` → **`EXIT=1`**. Output: `No test files found, exiting with code 1` / `filter: src/pages/reports/__tests__/generate-entry.test.ts`. Per-clause decomposition on the same undone tree (below) shows **every** clause red independently, not just the first. | `bash /tmp/94-09_g1.sh` → **`EXIT=0`**. Output: `Test Files  1 passed (1)` / `Tests  5 passed (5)` / `> tsc --noEmit` (silent, exit 0). Re-run post-commit: `94-09_g1 EXIT=0`. | Was plan-check BLOCKER `B4`. C3: `type-check` **does** exist in `frontend/package.json` (`tsc --noEmit`) and its **baseline was measured clean (`EXIT=0`) before any edit** — so its green is attributable to this work, not to a pre-broken tree. Falsification drill 2 below. |
| `94-09_g2` (:129) — the pure-function test + `export` in `generate-entry.ts` + page imports it + no literal `status: 'completed'` | `bash /tmp/94-09_g2.sh` → **`EXIT=1`**. Output: `No test files found, exiting with code 1` / `filter: src/pages/reports/__tests__/generate-entry.test.ts`. Clause 2 alone: `grep -q 'export' src/pages/reports/generate-entry.ts` → `grep: … No such file or directory`, `exit=2`. Clause 3: `grep -q 'generate-entry' ReportsPage.tsx` → `exit=1`. | `bash /tmp/94-09_g2.sh` → **`EXIT=0`**. Output: `Test Files  1 passed (1)` / `Tests  5 passed (5)`. Re-run post-commit: `94-09_g2 EXIT=0`. | One of the three gates the repair round ADDED and never green-constructed. **Now green-constructed and falsified** — drill 1 below reproduces PARK-94-06's forbidden shape and the gate fires. Exit code captured directly, never through a pipe (`B5`). |
| `94-09_g3` (:155) — `DEAD-09` count ≥2 + `PARK-94-06` present in `REQUIREMENTS.md` | `bash /tmp/94-09_g3.sh` → **`EXIT=1`**. Clause decomposition: `grep -c 'DEAD-09' .planning/REQUIREMENTS.md` → `count=0` (want ≥2); `grep -q 'PARK-94-06' .planning/REQUIREMENTS.md` → `exit=1`. | `bash /tmp/94-09_g3.sh` → **`EXIT=0`**. `grep -c 'DEAD-09'` → `2` (the `### DEAD` entry + the status-table row); `PARK-94-06` present via the entry's `RULING-P94-04 §PARK-94-06` citation. Re-run post-commit: `94-09_g3 EXIT=0`. | Marker-shape check. Falsification drill 3 below shows it fires when DEAD-09 is filed as prose only. |

**None of the three was green before the work** — so none is a regression guard and none is a vacuous
oracle. All three read `exit=1` on the undone tree, matching the orchestrator's whole-phase drill.

### Per-clause RED decomposition (undone tree) — C2, red for the RIGHT reason

A gate that dies at its first clause proves only that its first clause is red. Each clause was
therefore measured independently against the undone tree, so no clause is trusted un-fired:

<!-- prettier-ignore -->
| clause | undone-tree result |
| --- | --- |
| `g1.c2` `grep -qE "type: *templateId" ReportsPage.tsx` | `exit=1` |
| `g1.c3` `grep -cE "template: *templateId"` (want `0`) | `count=1` |
| `g1.c4` `grep -q "report-builder:generate.unavailable"` | `exit=1` |
| `g1.c5` `grep -cE "status: *'completed'"` (want `0`) | `count=1` |
| `g1.c6` node key-pair check (both locales, values differ) | `exit=1` |
| `g1.c7` `pnpm type-check` | `exit=0` — **baseline green**, i.e. NOT a discriminating clause on the undone tree; it is a no-regression clause and is labelled as one here rather than counted as a red |
| `g2.c2` `grep -q 'export' generate-entry.ts` | `exit=2` (file absent) |
| `g2.c3` `grep -q 'generate-entry' ReportsPage.tsx` | `exit=1` |
| `g3.c1` `grep -c 'DEAD-09'` (want ≥2) | `count=0` |
| `g3.c2` `grep -q 'PARK-94-06'` | `exit=1` |

### Falsification drills on the DONE tree (C1 clause 2, the half a script cannot do)

Each drill mutated the done tree, ran the gate, and restored from a byte-backup. **`git status
--porcelain` and SHA-256 of all three touched files are identical before and after** (verified below).

<!-- prettier-ignore -->
| drill | mutation | gate | result |
| --- | --- | --- | --- |
| **1 — "the rename ships alone"** (PARK-94-06's forbidden shape, reproduced) | `generate-entry.ts`: predicate `if (typeof url === 'string' && url.length > 0)` → `if (true)`, so the mapping returns `completed` unconditionally | `94-09_g2` | **`EXIT=1`** · `Failed Tests 3` · `AssertionError: expected 'completed' to be 'unavailable' // Object.is equality` (×2) + `refuses to fabricate a completed entry from an empty or non-string url`. **This is the property `B4` said the grep-only gate could not express, now observed firing.** |
| **2 — terminal state de-translated** | `ReportsPage.tsx`: `{t('report-builder:generate.unavailable')}` → a hardcoded English literal | `94-09_g1` | **`EXIT=1`** · key count in the page dropped `1 → 0` |
| **3 — DEAD-09 filed as prose only** | `REQUIREMENTS.md`: status-table row `\| DEAD-09 \| Phase 95 … \|` deleted, entry kept | `94-09_g3` | **`EXIT=1`** · `DEAD-09 count now: 1` (want ≥2) |

Byte-identity after the drills (matches the pre-drill capture exactly):

```
20cfd68d1a3ca30096ccef77441076456643a92c9d522a347ab12b2ce46939b7  frontend/src/pages/reports/generate-entry.ts
ba26d0fc2e38a923aa68d67231f341131ad1a41f0b2bfe275f9a5cf1963026e2  frontend/src/pages/reports/ReportsPage.tsx
b3dd863300563a41c78d004c531c57d76083c1068e64485f6de7f8fe57f329b7  .planning/REQUIREMENTS.md
```

---

## GATE CONCERN

**NON-BLOCKING. No gate text was edited. Zero gate edits were made in this leg.** Recorded because
the phase asks for oracle-strength observations, not because either gate failed — both are green and
both were falsified above.

**`94-09_g2` clause 3 (`grep -q 'generate-entry' src/pages/reports/ReportsPage.tsx`) is satisfied by
the import line alone.** Evidence, run against the committed tree:

```
frontend/src/pages/reports/ReportsPage.tsx:19:import { buildGeneratedReportEntry, type GeneratedReportEntry } from './generate-entry'
```

That single line makes the clause green. A page that imported the module and still built its entry
inline would pass clause 3 — the residual is caught only by `g1.c5`/`g2.c4`
(`grep -cE "status: *'completed'" == 0`), which forbids the literal but does not positively assert
that `onSuccess` consumes the function's **return value**. The pairing is closed by the two clauses
in combination, not by clause 3 alone.

Closed here by direct observation rather than by a stronger gate (which would be a gate edit):
`ReportsPage.tsx:195-208` is `setGeneratedReports((prev) => [buildGeneratedReportEntry(data, {…}), ...prev])`
— the function's return value **is** the pushed entry, and there is no other entry construction in
the file.

---

## Accomplishments

- **The 400 is gone and it did not become a lie.** `ReportsPage.tsx:186` now sends `type: templateId`,
  the name `supabase/functions/reports/index.ts:258` guards on. The function was **not** edited — its
  mock is filed, not fixed.
- **A fabricated `completed` entry is impossible by construction.**
  `buildGeneratedReportEntry(response, meta)` returns `completed` **only** when `response.url` is a
  non-empty string; every other response — including the mock's literal
  `{ job_id, status: 'pending' }` — maps to `status: 'unavailable', url: null`. Five vitest cases pin
  it, including the mock's real payload and the empty-string/`null`/`undefined` url cases.
- **The list renders the truth.** The entry's `unavailable` branch shows
  `t('report-builder:generate.unavailable')` in a `role="alert"` span with `text-warning` +
  `AlertTriangle` — replacing the old `Clock … animate-pulse`, which read as "still working" for a
  job that will never finish. Logical property `text-end`; tokens only, no new chrome or variants.
- **Bilingual, colon form, one commit.** `generate.unavailable` in both locales; key sets stay equal
  at **236 = 236**, and the two values differ:
  - EN `"Report generation is unavailable"`
  - AR `"إنشاء التقارير غير متاح"` — copied **verbatim** from `94-UI-SPEC.md:333`.
- **`DEAD-09` filed** with the mechanism (`reports/index.ts:266-285`: a `setTimeout` that only
  `console.log`s), the ruling citation, the repair candidates, **Owner: Phase 95 — Routes That Don't
  Render**, the **approve-as-placed** flag, and its status-table row.

## Files Created/Modified

- `frontend/src/pages/reports/generate-entry.ts` — **created.** The pure response→entry mapping plus
  the `CompletedReportEntry | UnavailableReportEntry` discriminated union.
- `frontend/src/pages/reports/__tests__/generate-entry.test.ts` — **created.** 5 cases; the oracle
  that fails if the rename ever ships alone again.
- `frontend/src/pages/reports/ReportsPage.tsx` — body key `template`→`type`; `onSuccess` delegates to
  the mapping; `generatedReports` typed `GeneratedReportEntry[]` (was `any[]`); the list's non-completed
  branch renders the translated unavailable state; `Clock` import replaced by `AlertTriangle` (orphaned
  by this change — the status union has exactly two members now).
- `frontend/src/i18n/{en,ar}/report-builder.json` — the `generate.unavailable` pair.
- `.planning/REQUIREMENTS.md` — `DEAD-09` entry + scope note + status-table row (3 insertions,
  0 deletions).

## C9b sweep — consumers across EVERY shipped phase

Derived, not named. Roots derived by `find . -maxdepth 3 -type d -name tests -not -path '*/node_modules/*'`
→ **4 roots** (`./frontend/tests`, `./tests`, `./backend/tests`, `./e2e/tests`), **672 test files**
searched. Run under `bash` (this shell is zsh — `for x in $VAR` does not word-split; the first zsh
attempt produced `bfs: error:` and a file count of **1**, which is exactly the "implausibly empty"
signal C9b warns about). Instrument-tested with a token certain to be present (`\btest\b` → **572**
files) before any zero was believed.

<!-- prettier-ignore -->
| identifier | hits | disposition |
| --- | --- | --- |
| `ReportsPage` | **0** | No shipped test asserts this page's DOM or rendered output. |
| `generate-entry` | 0 | New module. |
| `buildGeneratedReportEntry` | 0 | New export. |
| `reports` (common noun — CANDIDATE list, 30 files) | triaged | See below. |

**NAMED non-consumers** (C9b requires the reason, not the absence):

- `backend/tests/contract/reports-generate.test.ts`, `backend/tests/contract/test_reports_generate.ts`,
  `backend/tests/contract/reports-schedule.test.ts`, `tests/contract/reports.test.ts` — these exercise
  the **Express** `/api/reports/*` surface with a `template_id` body against a `TestServer`. They touch
  neither the Supabase edge function `reports` nor `ReportsPage`; the field this plan renames
  (`template` → `type` in the edge-function body) appears in none of them. The plan's `<interfaces>`
  additionally records the first and third as routing to the **NON-REQUIRED** integration job, i.e.
  non-oracles unless individually shown green pre-phase — they were not, and nothing here depends on
  them.
- The remaining `reports` candidates (`intelligence-reports-*`, `ReportService.test.ts`,
  a11y specs, `tests/e2e/93-report-notfound.spec.ts`) match the domain noun only.

**What this sweep cannot see, stated as part of the result:** a test coupled by shape alone
(`getByRole('alert')` + visible text, naming no identifier). `role="alert"` was _added_ here, so the
risk direction is a new incidental match rather than a break; no such spec was found.

## Decisions Made

- **One commit, not three.** `PARK-94-06`'s pairing rule ("the rename NEVER ships alone") is a
  property of the _commit_, and Task 2's action text mandates it explicitly. Both sides carry real
  content change in that commit — mechanically checked, not asserted: `git show HEAD -- .planning/REQUIREMENTS.md | grep -c '^+.*DEAD-09'` → **2**;
  `git show HEAD -- …/ReportsPage.tsx | grep -c '^+.*type: templateId'` → **1**.
- **`t()` in the page, discriminator in the module.** Keeps the mapping pure (no i18n, no React) and
  puts `g1.c4`'s key assertion where the copy actually renders.
- **A discriminated union of two full interfaces**, not `Base & (A | B)` — narrowing on
  `report.status === 'completed'` at the JSX site then needs no cleverness.
- **The AR value ships as authored.** `RULING-P94-07`: grammatical, on-glossary, key-set-equal,
  **naturalness UNREVIEWED**. Not reworded, and not to be read as vetted.

## Deviations from Plan

None — plan executed as written. Two judgement calls inside the plan's own latitude, recorded for
transparency:

1. The plan offered "a short description key if the list entry renders two lines". The entry is one
   line, so **one key** shipped. Key-set equality holds either way.
2. The plan's item (4) says the mutation's `onError` path "**(if any)**" keeps or gains translated
   copy. There is none, and the global `mutations.onError` (`frontend/src/lib/query-client.ts:62`)
   already emits `i18n.t('common:errors.queryFailedInline')` with the rejection going to `console.error`
   — no server `error.message` reaches the DOM. Nothing to fix; nothing added.

## Issues Encountered

Instrument traps hit and cleared, each measured rather than assumed:

- **zsh does not word-split `$ROOTS`.** The first C9b sweep reported `bfs: error:` and "1 file
  searched" with `0` hits for every identifier. Re-run under `bash` → 672 files, 572 instrument hits.
  The zero was not believed until the instrument test fired.
- **`grep` in this shell is a ugrep wrapper.** `command grep` was used for every ad-hoc search; all
  gate greps ran under `bash <file>`, where the wrapper does not exist.
- **`pnpm type-check` baseline measured first.** If `tsc --noEmit` had been pre-broken, `g1` could
  never have gone green for its subject. It was clean (`EXIT=0`) before any edit — so `g1.c7` is a
  no-regression clause, and it is labelled as one above rather than counted as a red.

## Out of scope — observed, deliberately NOT touched

- **`COPY-06` (Phase 98).** The global `mutations.onSuccess` in `frontend/src/lib/query-client.ts:71`
  fires `toast.success('Operation completed successfully')` — a hardcoded English literal — on this
  mutation too. So a generate that renders an honest **unavailable** entry still raises a generic
  English success toast. That is `COPY-06`'s blast radius (every mutation in the app), it is filed
  with an owner, and it is on the intended-broken register. Recorded, not repaired.
- **`DEAD-09` itself.** The mock generate path is being **filed dead, not shipped working**. No
  browser oracle was built for it, deliberately (plan truth `D-25`), and `supabase/functions/reports/index.ts`
  was not edited.

## Next Phase Readiness

- `WRITE-06`'s generate surface is honest: the real surfaces (custom-reports CRUD + scheduled-report
  creation) are closed by `94-05`; the mock path renders its truth in both locales; its repair has a
  named owner and a tracked id.
- `94-10` owns the next `.planning/REQUIREMENTS.md` edit — this plan's edit is purely additive
  (3 insertions, 0 deletions), so waves 1 and 2 are intact for it.

## BLOCKED

None.

---

## Self-Check

<!-- prettier-ignore -->
| claim | check | result |
| --- | --- | --- |
| `frontend/src/pages/reports/generate-entry.ts` exists | `git show HEAD:…` | FOUND (printed, header verified) |
| `frontend/src/pages/reports/__tests__/generate-entry.test.ts` exists | `git show --stat HEAD` | FOUND (`create mode 100644`) |
| commit `68414f219` exists | `git rev-parse --short HEAD` | FOUND — `6 files changed, 141 insertions(+), 9 deletions(-)` |
| no accidental deletions | `git diff --diff-filter=D --name-only HEAD~1 HEAD` | empty |
| `94-09_g1/g2/g3` green post-commit | `bash /tmp/94-09_gN.sh` | `EXIT=0`, `EXIT=0`, `EXIT=0` |
| lint clean on changed files | `pnpm exec eslint … --max-warnings 0` | `ESLINT EXIT=0` |
| i18n namespace registration | `node scripts/check-i18n-namespaces.mjs` | `OK: 1715 file(s) scanned … 128 registered namespaces`, `EXIT=0` |
| prettier clean | `pnpm exec prettier --check` (5 files) | `All matched files use Prettier code style!` |
| mapping reachable from a routed page | importer sweep | `routes/_protected/reports/index.tsx:8` imports `ReportsPage`; `ReportsPage.tsx:19` imports `generate-entry` |

## Self-Check: PASSED

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
