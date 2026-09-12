---
phase: 98
plan: 01
subsystem: e2e-oracles
tags: [playwright, i18n, copy, nyquist, red-baseline]
requires: []
provides:
  - 'the eight criterion oracles for Phase 98, each proven RED at HEAD on its own defect'
  - '98-RED-BASELINE.md — the machine-checkable RED / NOT CONSTRUCTED record'
affects:
  - 'every later Phase 98 plan: these specs are what its greens are read against'
tech-stack:
  added: []
  patterns:
    - '96-calendar-family header discipline: criterion text, population, stated exclusions, locale + role'
    - 'inline auth + --no-deps (E2ECRED-01 → P101); ?lng= URL flip for the both-locale legs'
    - 'in-spec both-polarity instrument self-tests that execute on every run'
    - 'render-vs-bundle assertions instead of hardcoded prose the spec cannot yet know'
key-files:
  created:
    - tests/e2e/98-copy01-labels.spec.ts
    - tests/e2e/98-copy02-rawkeys.spec.ts
    - tests/e2e/98-copy03-dashboard.spec.ts
    - tests/e2e/98-copy04-voice.spec.ts
    - tests/e2e/98-copy05-dates.spec.ts
    - tests/e2e/98-copy06-toast.spec.ts
    - tests/e2e/98-copy07-statscard.spec.ts
    - tests/e2e/98-copy08-eo-popover.spec.ts
    - .planning/phases/98-copy-truth/98-RED-BASELINE.md
  modified: []
decisions:
  - 'COPY-07 gets its own spec file: 98-VALIDATION offered a fold-in, its own Wave 0 list demands eight files, and D-08 (a criterion no oracle NAMES fails grading) makes eight the stronger reading'
  - 'Expected prose comes from the i18n bundle, not from the spec: copy07/copy08/copy06 assert rendered === bundle so the oracle proves the component reads the key and cannot go stale against a legitimate rewording'
  - 'The copy02 console leg stays dropped: saveMissing:false makes missingKeyHandler dead code, and a leg that cannot fire is not a closer'
  - 'The eight requirements COPY-01..COPY-08 are NOT marked complete by this plan — it repairs nothing'
metrics:
  duration: ~2h
  completed: 2026-08-18
  tasks: 3
  files: 9
---

# Phase 98 Plan 01: Wave-1 Oracles Summary

Eight Playwright oracles — one per requirement — authored to their POST-repair green assertions
and then **observed failing at HEAD, each on the defect it exists to detect**, with the observation
recorded in `98-RED-BASELINE.md`. Nothing was repaired.

## What was built

| spec                   | closes on                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `98-copy01-labels`     | five NAMED regions: snake / ISO-week detectors + a bare-enum leaf check + a positive label leg                   |
| `98-copy02-rawkeys`    | raw-key DOM detector on three driven surfaces + 80-path `entityLinks` and 37-path `calendar.recurrence` censuses |
| `98-copy03-dashboard`  | forced digest empty / digest error / VIP empty states, both locales                                              |
| `98-copy04-voice`      | `@values` (CTA, glossary, exclamations) and `@case` (D-20 bounded captured-label population)                     |
| `98-copy05-dates`      | canonical shapes on non-sanctioned surfaces + the D-25 sanctioned-feed enumeration                               |
| `98-copy06-toast`      | one real kanban TASK stage move, sonner DOM, both locales                                                        |
| `98-copy07-statscard`  | the EO stats-card percentage label, `ar` leg as the sole discriminator                                           |
| `98-copy08-eo-popover` | the rendered popover (crown, no globe, `text-primary`, four sections) + an in-spec census                        |

## RED evidence — captured text, per spec

Run of record: `pnpm exec playwright test <8 paths> --project=chromium-en --no-deps --workers=1
--reporter=json`, HEAD `4e107b5d3`, 2026-08-18, **role admin (`TEST_USER_EMAIL`)**, dev server
`http://localhost:5173`, viewport 1400×900, both locale legs by `?lng=`.

| spec                   | locale of the observation  | captured attributing text                                                                                                                                                                                                                                                                       |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `98-copy01-labels`     | `en` (admin)               | `/intelligence signals rows [en]: rendered text leaks a snake_case token` — the received region text ends `Tue 30 Jun · human_entered`, and `human_entered` is the **only** snake token the detector matched anywhere in the region (re-derived from the failure payload): zero false positives |
| `98-copy01-labels`     | `en` (admin)               | `/my-work/waiting rows [en]: element renders a bare enum value as its whole text` — received `["high","medium","high","high","high", …]`, 8 elements                                                                                                                                            |
| `98-copy02-rawkeys`    | bundle (locale-invariant)  | `en/common.json: 80 of 80 entityLinks paths unresolved` — the received array lists all 80, starting `entityLinks.activeLinks`, `entityLinks.add`, `entityLinks.addLink`, `entityLinks.aiSuggestions.accept`                                                                                     |
| `98-copy03-dashboard`  | `en` (admin), forced empty | expected `No publications yet`, received `Intelligence Digest· Digest is ready for seeded publications.· Apply the dashboard demo seed, then refresh the digest.`                                                                                                                               |
| `98-copy03-dashboard`  | `en` (admin), forced error | expected `The digest could not load. Try again.`, received `Intelligence DigestDigest could not load. Check the staging seed and try again.`                                                                                                                                                    |
| `98-copy03-dashboard`  | `en` (admin), forced empty | expected `No VIP participants to show yet.`, received `VIP Visits· No VIP visits with country data.· Add VIP participant data to the dashboard seed, then refresh the widget.`                                                                                                                  |
| `98-copy04-voice`      | `en` (admin)               | `EO CTA text under en` — expected `Add elected official`, received `Add Elected Official`                                                                                                                                                                                                       |
| `98-copy04-voice`      | `en` (admin)               | `Title Case labels captured on visited surfaces` — received `["/dossiers/elected-officials: Add Elected Official"]`, flagged by the independent reverse-bundle detector                                                                                                                         |
| `98-copy05-dates`      | `en` (admin)               | `/audit-logs [en] renders relative time outside the D-25 enumeration` — the audit table renders `about 24 hours ago`, `3 days ago`, `about 1 month ago`, `about 2 months ago`                                                                                                                   |
| `98-copy05-dates`      | `ar` (admin)               | `/activity [ar] renders no localized relative-time phrase — the D-25 shared localized helper is absent and the feed emits a bare compact token instead` (observed output: `109d`, `110d`)                                                                                                       |
| `98-copy06-toast`      | `en` (admin)               | `toast copy under en` — expected `Changes saved`, received `Operation completed successfully`                                                                                                                                                                                                   |
| `98-copy06-toast`      | **`ar` (admin)**           | `toast copy under ar` — expected `تم حفظ التغييرات`, received `Operation completed successfully`. **This is the plan's designated negative control and it fired**: the English literal renders under Arabic, proving the probe watches the right toast rather than any toast                    |
| `98-copy07-statscard`  | **`ar` (admin)**           | `EO card percentage label under ar` — expected `النسبة من إجمالي الملفات النشطة`, received `— مسؤول منتخب % of total active dossiers — نشط — غير نشط —`. The `en` leg PASSES and the spec labels it a non-discriminator                                                                         |
| `98-copy08-eo-popover` | bundle (locale-invariant)  | `en/dossier.json: typeDescription.elected_official must be a string` — received `undefined`                                                                                                                                                                                                     |
| `98-copy08-eo-popover` | `en` and `ar` (admin)      | `the EO stats card renders no help trigger — the render guard is still in place` — locator resolved to **0** elements, 14 polls                                                                                                                                                                 |

## JSON-reporter counts (97 §4c: expected from declaration lines; SKIPPED is red)

| spec                   | `test(` declarations | tests enumerated | failed | passed | skipped |
| ---------------------- | -------------------- | ---------------- | ------ | ------ | ------- |
| `98-copy01-labels`     | 6                    | 6                | 3      | 3      | 0       |
| `98-copy02-rawkeys`    | 7                    | 7                | 2      | 5      | 0       |
| `98-copy03-dashboard`  | 3                    | 3                | 3      | 0      | 0       |
| `98-copy04-voice`      | 4                    | 4                | 2      | 2      | 0       |
| `98-copy05-dates`      | 4                    | 4                | 2      | 2      | 0       |
| `98-copy06-toast`      | 1 (× 2 locale legs)  | 2                | 2      | 0      | 0       |
| `98-copy07-statscard`  | 2                    | 2                | 1      | 1      | 0       |
| `98-copy08-eo-popover` | 2 (one × 2 legs)     | 3                | 3      | 0      | 0       |
| **total**              | —                    | **31**           | **18** | **13** | **0**   |

Reporter stats: `{expected: 13, unexpected: 18, skipped: 0, flaky: 0, duration: 205 s}`.
`command grep -c "test.skip"` summed across all eight files = **0**.

## NOT CONSTRUCTED legs (D-24 — named, never silent)

Full text in `98-RED-BASELINE.md`. Summarised, with what and why:

1. **copy01 · the `/engagements` ISO-week leg.** `/engagements` renders no week-grouped list at
   this HEAD — observed once as the explicit error state `Unable to load data / The request
failed.` and once as no list at all — so `EngagementsList`, the only renderer of the
   `WEEK OF 2026-W27` header, never mounts. **This load failure is owned by no Phase 98 plan and
   was deliberately NOT repaired** (scope boundary: only issues this task's own changes caused are
   auto-fixed). Criterion 1's ISO-week half therefore has no rendered surface at this HEAD.
2. **copy02 · the intake-ticket entity-link leg.** Staging holds **zero** intake tickets:
   `/intake/queue` reports `0 items` / `No Pending Reviews` and `/intake` exposes no ticket link.
   Instrument-tested — the same `a[href]` collector returns 24 nav links on the same page, so the
   zero is a fact about the data, not about the locator. Closes on the 80-path census + this line.
3. **copy02 · the AI-suggestion accept/reject leg.** `entityLinks.aiSuggestions.*` renders only
   through `components/ai/EntityLinkSuggestions.tsx`, which needs the AnythingLLM backend —
   outside the dev-server oracle. Closes on census + this line.
4. **copy02 · the `RecurrencePatternEditor` leg.** No 98 spec drives that component (the plan says
   so). Closes on the 37-path `calendar.recurrence` census — which PASSES in both locales at HEAD,
   independently confirming D-22's finding that the repair is ROUTING, not authoring — plus this
   line; routing is verified by 98-04's conservation gate.
5. **copy04 · the `Deadline / Due Date` chip.** See "Deviations" below.

## D-24 UNDRIVEN candidates the copy02 spec names in its own header

`RecurrencePatternEditor` (census + the required header line, verbatim) and the AI-suggestion
accept/reject flow. Both are written into the spec header, not only here, so the scope line
travels with the oracle.

## Reconciliation stated per the plan's success criteria

`98-VALIDATION.md`'s requirement table offers COPY-07 as "folded into the C1 or C8 spec"; its own
**Wave 0 Requirements** list demands _eight_ `tests/e2e/98-*.spec.ts` files. The eight-file reading
governs (D-08: a criterion no oracle NAMES fails grading), so COPY-07 has its own
`98-copy07-statscard.spec.ts` and the fold-in option is superseded. The reconciliation is also
stated in that spec's header.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Per-spec timeout budgets raised above the 30 s default**

- **Found during:** Task 3, first full run.
- **Issue:** eight tests failed with `Test timeout of 30000ms exceeded` — copy03's error leg needs
  three query retries with exponential backoff (~7 s) in each of two locales, copy06 does two
  drags, and `/dossiers` loads 111 rows behind the type-card grid. A timeout tells nobody whether
  copy is wrong; it is a red that names the clock.
- **Fix:** `test.beforeEach(() => test.setTimeout(N))` per describe (150–300 s), with the reason
  written at the call site.
- **Files:** all eight spec files. **Commit:** `2d829196e`.

**2. [Rule 1 - Bug] The copy05 date detector sampled before the data arrived**

- **Found during:** Task 3, first full run.
- **Issue:** `main` becomes visible while the audit table is still a skeleton. The first run read
  it then, saw no relative-time phrase, passed the absence assertions over an empty table, and
  reddened only on the positive control. A correct command about the wrong **instant**.
- **Fix:** `mainText` now waits for `networkidle` and then for two identical consecutive reads.
  After the fix the same test reds on `/audit-logs [en] renders relative time outside the D-25
enumeration` — the defect, not the control.
- **Files:** `tests/e2e/98-copy05-dates.spec.ts`. **Commit:** `2d829196e`.

**3. [Rule 1 - Bug] The copy04 EO-CTA locator was keyed on the text under test**

- **Found during:** Task 3, first full run.
- **Issue:** the CTA is an **anchor** to `/dossiers/elected-officials/create`, not a `<button>`, so
  `getByRole('button', {name: /Add elected official/i})` found nothing and the red read "control
  not reachable" — infra, not the defect. Worse, a name-based locator goes MISSING exactly when the
  text is wrong, which is the only case the oracle exists for.
- **Fix:** locate by `href`, then assert the text. The red now reads `expected "Add elected
official", received "Add Elected Official"`.
- **Files:** `tests/e2e/98-copy04-voice.spec.ts`. **Commit:** `2d829196e`.

**4. [Rule 1 - Bug] The copy04 `@case` label set could not see criterion 4's own named instance**

- **Found during:** Task 3, first full run — `@case` passed GREEN at HEAD, which is impossible if
  the population is right (D-14 names a Title Case string on a visited surface). The vacuous-oracle
  class, caught by predicting the result before reading it.
- **Issue:** `LABEL_SELECTORS` captured `nav a` but not free anchors, and the EO CTA is a free
  anchor.
- **Fix:** capture `a` broadly; the reverse-bundle filter still removes data-driven anchor text.
  `@case` now reds on `Add Elected Official`.
- **Files:** `tests/e2e/98-copy04-voice.spec.ts`. **Commit:** `2d829196e`.

**5. [Rule 3 - Blocking] Parallel workers reddened five tests at the login wall**

- **Found during:** Task 3, second full run.
- **Issue:** eight workers logging into one account concurrently produced
  `64 × unexpected value "http://localhost:5173/login"` — the auth throttle, not a copy defect.
- **Fix:** the baseline run of record uses `--workers=1`; recorded in `98-RED-BASELINE.md`'s
  observation conditions so a future reader can reproduce it.
- **Files:** none (run parameter). **Commit:** `2d829196e` (recorded in the baseline).

**6. [Rule 1 - Bug] The copy06 drag dropped before @dnd-kit resolved the target**

- **Found during:** Task 3, second full run — the `ar` leg reported "no toast raised".
- **Fix:** a second settling move over the target plus a 400 ms pause before `mouse.up`. Both
  locale legs then raised the toast and reddened on its copy.
- **Files:** `tests/e2e/98-copy06-toast.spec.ts`. **Commit:** `2d829196e`.

### Departures from the plan's action text — reported, not improvised

**A. The `Deadline / Due Date` calendar chip is UNMOUNTED at HEAD, so copy04 cannot close on it.**
The plan's action text says "the calendar deadline chip renders `Deadline` (never `Deadline / Due
Date`)". That string is `calendar:wizard.templates.deadlineReminder.title`, rendered only by
`components/calendar/CalendarEmptyWizard.tsx` — which has **zero importers** at HEAD, because
Phase 96 (DEAD-07) replaced the empty-month wizard with the always-rendered grid. Verified with a
positive control: the same instrument returns importers for `DossierTypeStatsCard`. The glossary
clause is therefore closed on `/commitments`, where `commitments:form.dueDate` = `Due Date` does
reach the screen. **Task 1's acceptance criteria are unaffected** (they require the two group tags,
which are present). Recorded here because the substitution is mine and the overseer should see it.

**B. copy03's empty states are FORCED by fulfilling the data request with `[]`, not by blocking
it.** The plan says "force the digest widget's empty and error states via CDP
`Network.setBlockedURLs`". A blocked request produces the ERROR state by construction; it cannot
produce an empty one. The error legs use the narrow CDP block exactly as specified
(`*/rest/v1/dashboard_digest*`); the empty legs use `page.route` + `route.fulfill({body: '[]'})`,
with an interception counter asserted non-zero so a pattern that matched nothing cannot pass. Both
mechanisms are documented in the spec header.

**C. The eight requirements are NOT marked complete.** The plan frontmatter lists
`[COPY-01 … COPY-08]` and the executor's state-update step would check them off. **This plan
repairs nothing** — checking them off now would put eight false completions in the register while
the defects are all still live and all still observed red above. They close when the repairs land.
This is the one state-update step deliberately skipped, and it is named rather than silently
omitted.

## Threat Flags

None. No file created by this plan introduces a network endpoint, an auth path, a file-access
pattern, or a schema change. `T-98-01` (a spec that never failed) is mitigated by the artifact this
plan produced; `T-98-02` (spec-path filtering silently dropping a spec) is mitigated by asserting
all eight files by name and hardcoding the count 8 before every multi-spec invocation; `T-98-SC`
(package installs) holds — **zero installs**.

## Known Stubs

None. No component, route or data path was created or modified.

## Verification

- Task 1 gate: green — four files exist, 0 `test.skip`, all required tokens present, `--list` RC 0.
- Task 2 gate: green — four files exist, `setBlockedURLs` / `data-sonner-toast` / the banned
  literal / `lucide-crown` / `text-primary` / `typeGuide` all present, 0 `test.skip`, `--list` RC 0.
- Task 3 gate: green — exactly 8 spec files, 0 references to `chromium-ar-smoke` summed across all
  eight, `98-RED-BASELINE.md` present with exactly 8 rows, all 8 in the closed
  `RED` / `NOT CONSTRUCTED` vocabulary, zero rows recording a pass.
- Working tree: the only dirty paths are the exogenous, harness-owned ones (`CLAUDE.md`,
  `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`, `.claude/skills/*`,
  `_archive-98-attempt1-260818/`). **No commit in this plan touches any of them** — every commit
  used explicit pathspecs; `git add -A` and `git commit -a` were never run.

## Self-Check: PASSED

All 10 claimed files verified present on disk; all 3 per-task commit hashes verified present in
`git log --all` (`a5381a921`, `40be09af7`, `2d829196e`).
