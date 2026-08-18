---
phase: 98
slug: copy-truth
plan: 01
artifact: red-baseline
observed_at_head: 4e107b5d3
observed_on: 2026-08-18
runner: 'pnpm exec playwright test <8 paths> --project=chromium-en --no-deps --workers=1 --reporter=json'
role: admin
locales: [en, ar]
---

# Phase 98 — RED-at-HEAD baseline

The machine-checkable half of the Nyquist proof (98-VALIDATION Wave 0): **every one of the eight
oracles was OBSERVED failing at HEAD, on the defect it exists to detect, before any repair
landed.** A spec that has never been seen failing has not been shown to detect anything.

**The vocabulary is CLOSED and has two terms: `RED` and `NOT CONSTRUCTED`.** A passing spec is by
definition a defective spec — the defect exists at HEAD — so a third term is not available and a
row recording one may not be written. The gate re-derives both counts.

**Observation conditions, stated so the greens and reds are readable.** Dev server at
`http://localhost:5173` (the only origin in `ALLOWED_ORIGINS`), project `chromium-en`, viewport
1400×900, `--no-deps` with inline auth (`E2ECRED-01` → P101 means no storage-state fixture is
usable), role **admin** (`TEST_USER_EMAIL`), both locale legs by `?lng=` URL flip. `--workers=1`:
a parallel run put 8 simultaneous logins on one account and several tests reddened at the login
wall instead of at an assertion — a red that names the auth throttle is not a control.

Run of record: 31 tests, **18 failing / 13 passing**, 205 s. Every one of the eight spec files
carries at least one failing test whose text names its own defect.

## Per-spec outcome

| spec                 | outcome and the text that attributes it                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 98-copy01-labels     | RED — `/intelligence` signal rows render the raw column value `human_entered` (the ONLY snake token the detector matched in that region, i.e. zero false positives) and `/my-work/waiting` rows render 8 bare enum values (`high`, `medium`, …) |
| 98-copy02-rawkeys    | RED — census: **80 of 80** static `entityLinks.*` paths unresolved in `en/common.json` AND `ar/common.json`; every one of them renders as a raw dotted key today                                                                                |
| 98-copy03-dashboard  | RED — forced empty renders `Digest is ready for seeded publications.`; forced error renders `Digest could not load. Check the staging seed and try again.`; forced VIP empty renders `Add VIP participant data to the dashboard seed…`          |
| 98-copy04-voice      | RED — the EO CTA renders `Add Elected Official` where sentence case requires `Add elected official`; the independent `@case` captured-label detector flags the same string from the reverse-bundle population                                   |
| 98-copy05-dates      | RED — `/audit-logs` renders `about 24 hours ago` / `3 days ago` / `about 2 months ago`, relative time OUTSIDE the D-25 sanctioned enumeration; and `/activity?lng=ar` renders no localized relative phrase (the shared helper does not exist)   |
| 98-copy06-toast      | RED — a real kanban TASK stage move raises `Operation completed successfully` in BOTH locales; observing that English literal under `?lng=ar` is the designated negative control, and it fired                                                  |
| 98-copy07-statscard  | RED — the EO stats card renders the English literal `% of total active dossiers` under `?lng=ar` (the `en` leg passes and is labelled a non-discriminator in the spec, because the EN value is unchanged by the repair)                         |
| 98-copy08-eo-popover | RED — the EO card renders **0** help triggers (`type !== 'elected_official' &&` still in place) and `typeDescription.elected_official` is absent from both `dossier.json` bundles                                                               |

## Legs that could NOT be constructed at this HEAD

Named, never silent (D-24). Neither leg belongs to the spec's attributing red above; each is
recorded so that a later green on the same spec cannot be read as covering it.

| leg                                          | why it could not be constructed                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| copy01 · the `/engagements` ISO-week leg     | `/engagements` renders no week-grouped list at this HEAD (observed once as the explicit error state `Unable to load data`, once as no list at all), so `EngagementsList` — the only renderer of the `WEEK OF 2026-W27` header — never mounts. The load failure is owned by no Phase 98 plan and was NOT repaired here (scope boundary).                                                                                                                        |
| copy02 · the intake-ticket entity-link leg   | Staging holds **zero** intake tickets: `/intake/queue` reports `0 items` / `No Pending Reviews`, and `/intake` exposes no ticket link. Instrument-tested — the same locator finds links elsewhere on the same page. Closes on the 80-path census plus this line (D-24).                                                                                                                                                                                        |
| copy02 · the AI-suggestion accept/reject leg | `entityLinks.aiSuggestions.*` renders only through `components/ai/EntityLinkSuggestions.tsx`, which needs the AnythingLLM backend — outside the dev-server oracle. Closes on census plus this line (D-24).                                                                                                                                                                                                                                                     |
| copy02 · the `RecurrencePatternEditor` leg   | No 98 spec drives that component. Closes on the 37-path `calendar.recurrence` census (which is GREEN in both locales at HEAD, confirming D-22's finding that the repair is ROUTING, not authoring) plus this line; routing is verified by 98-04's conservation gate.                                                                                                                                                                                           |
| copy04 · the `Deadline / Due Date` chip      | That string is `calendar:wizard.templates.deadlineReminder.title`, rendered only by `components/calendar/CalendarEmptyWizard.tsx`, which has **zero importers** at HEAD — Phase 96 (DEAD-07) replaced the empty-month wizard with the always-rendered grid. Verified with a positive control (the same instrument returns importers for `DossierTypeStatsCard`). The glossary clause closes instead on `/commitments`, where `Due Date` does reach the screen. |

## Tests that PASS at HEAD, and why that is not a hole

Recorded because a silent pass is how a vacuous oracle hides.

- The four **instrument self-tests** (copy01, copy02 ×2, copy05) pass by construction: each shows
  its regex or resolver firing on a planted defect AND passing clean input. Both polarities run on
  every spec execution, so neutering a detector reds the spec before it can silence a surface.
- `98-copy02` recurrence census passes: the content already exists under the `calendar` namespace
  in both locales (D-22). The census is a BACKSTOP, not the closure.
- `98-copy02` country wizard and auth surfaces pass: no `regions.*` or dot-form key leaked there
  on this run. The `regions.Europe` casing-miss class needs a capitalised region value in the
  wizard's data path, which this drive did not reach.
- `98-copy01` kanban and dossier-type-card regions pass: no raw value renders in either region.
- `98-copy04` `@values` exclamation and glossary legs pass: no exclamation copy and no `Due Date`
  rendered on the visited surfaces on this run.
- `98-copy05` `/dashboard` passes the competing-shape clause: it already renders `Tue 18 Aug` and
  `Fri 08 May 11:44 GST` from the shared formatter.
- `98-copy07` `en` leg passes and the spec SAYS SO — the EN value is byte-identical before and
  after the repair, so that leg discriminates nothing and is never counted as evidence.

RED-BASELINE-END
