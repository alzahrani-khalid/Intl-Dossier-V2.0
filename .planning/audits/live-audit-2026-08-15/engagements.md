# Lane C: engagements

Probed 27 distinct routes at 1440 (EN), 10 of them again in Arabic, and `/calendar` +
`/engagements` at 1024 and 768. Screenshots in `shots/engagements/`, raw probe JSON in
`json/engagements/`. Real IDs used:
`engagement = b0000002-0000-0000-0000-000000000001` (Bilateral consultation — ESCWA),
`position = 44c105d3-…9315` (published) / `8955b666-…9a75` (draft),
`after_action = 905b6a3a-…3ea5`.

**Session note:** `storageState.json` is valid — every page authenticated fine. The 401 in F4
is a server-side failure, not a stale session (all other calls on the same page succeed).

**Mutations I made while testing** (staging DB, disclosed for cleanup): generated one brief on
the ESCWA engagement (`Brief: Bilateral consultation — ESCWA`, draft), and advanced that
engagement's lifecycle stage Execution → Follow-up. No records deleted.

## Routes covered (27)

| Route                           | Verdict                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `/engagements`                  | OK (layout + i18n nits — F17, F22)                      |
| `/engagements/$id` (index)      | OK — redirects to `/overview`                           |
| `/engagements/$id/overview`     | OK                                                      |
| `/engagements/$id/context`      | OK — empty, slow (F27)                                  |
| `/engagements/$id/tasks`        | OK — empty state + CTA                                  |
| `/engagements/$id/positions`    | OK — empty state + CTA                                  |
| `/engagements/$id/docs`         | OK — brief generation genuinely works                   |
| `/engagements/$id/signals`      | OK — empty state + keyboard hints                       |
| `/engagements/$id/digests`      | HOLLOW — F16, F15                                       |
| `/engagements/$id/audit`        | OK — verified it populates after a real event           |
| `/engagements/$id/calendar`     | OK — date-format violation (F21)                        |
| `/engagements/$id/after-action` | **BROKEN — F3**                                         |
| `/dossiers/engagements`         | OK — duplicate of `/engagements` with different toolbar |
| `/dossiers/engagements/create`  | OK — validation works; copy/layout nits (F24, F25)      |
| `/after-actions`                | **BROKEN — F1**                                         |
| `/after-actions/$id`            | **BROKEN — F2**                                         |
| `/after-actions/$id/versions`   | **BROKEN — F2**                                         |
| `/positions`                    | HOLLOW — F7, F23                                        |
| `/positions/$id`                | OK — slow (F27), attachments broken (F9)                |
| `/positions/$id/approvals`      | **BROKEN — F5**                                         |
| `/positions/$id/versions`       | **BROKEN — F5**, and the tab itself is a stub (F6)      |
| `/briefs`                       | HOLLOW — F13, F14                                       |
| `/mous`                         | OK — data hygiene + layout (F15, F23)                   |
| `/calendar`                     | HOLLOW — F11                                            |
| `/calendar/new`                 | **BROKEN — F10**                                        |
| `/events`                       | HOLLOW — F12                                            |
| `/delegations`                  | **BROKEN — F4**                                         |

---

## Findings

### F1. `/after-actions` list is dead — edge function 500s on a missing FK relationship [severity: P0] [class: broken]

- Route: `/after-actions` (EN and AR)
- Observed: 8 skeleton rows for ~10s, then `role="alert"` "Could not load after-action records.
  Try refreshing the page." Zero records ever render. The After-Actions nav item is one of six
  top-level OPERATIONS entries, so this is a whole section of the app.
- Evidence: `shots/engagements/en_after-actions_1440.png`;
  `500 POST .../functions/v1/after-actions-list-all` →
  `{"error":"Could not find a relationship between 'after_action_records' and 'engagements' in the schema cache"}`
  (captured 4× on retry, `mine/body.mjs`). Same in AR: `json/engagements/ar_1440_after-actions.json`.
- Data-vs-wiring: **feature not wired.** A record exists (`after_action_records` has 1 row) — the
  PostgREST embed targets a relationship that does not exist. Note `engagement_dossiers` is the
  engagement extension table in this schema, so the embed is almost certainly pointed at the
  wrong table.
- Suggested fix (1 line): point the `after-actions-list-all` embed at the table that actually
  holds the FK (`engagement_dossiers`/`dossiers`), or resolve engagement titles in a second query.

### F2. `/after-actions/$id` and `/versions` both render "afterActions.loadError" — a raw i18n key as the error message [severity: P0] [class: broken]

- Route: `/after-actions/905b6a3a-4c94-482f-9857-d268cc4d3ea5` and `…/versions`
- Observed: after ~12s of skeletons the page renders exactly two strings: heading "Error", body
  `afterActions.loadError`. The user is shown an untranslated translation key.
- Evidence: `json/engagements/en_1440_aa_detail_slow.json`, `…aa_versions_slow.json`;
  `405 POST .../functions/v1/after-actions-get`.
- Data-vs-wiring: **feature not wired.** The record exists; the client POSTs to an endpoint that
  rejects POST (405). Two bugs stacked: wrong HTTP verb, and an error path that renders the key
  instead of `t(key)`.
- Suggested fix (1 line): match the verb `after-actions-get` accepts, and register the
  `afterActions` namespace so `loadError` resolves.

### F3. After-action create/publish is impossible from the UI — "Save Draft" never enables and no Publish button is ever rendered [severity: P0] [class: broken]

- Route: `/engagements/b0000002-…-0001/after-action` (reachable from the "Log After-Action"
  button on every engagement, and from Quick Actions)
- Observed: filled the form for real — added attendee "QA Consultant" (chip accepted, counter
  `1/100`), added a Decision, typed a 53-char description, typed a decision maker, blurred each
  field, decision date defaulted to `Sat 15 Aug`. **"Save Draft" stayed `disabled` at every
  step**, and there is no Publish/Submit control anywhere in the DOM at any point. Verified
  twice, second time with real per-character `type()` + Tab blur (`mine/aa3.mjs`):
  `initial → true, attendee added → true, decision row added → true, decision filled+blurred →
true, notes filled → true`. Zero network requests are ever attempted.
- Evidence: `shots/engagements/aa_datepicker.png`, `shots/engagements/aa_filled.png`;
  `mine/aa3.mjs` output.
- Data-vs-wiring: **feature not wired**, and I found the exact cause. In
  `frontend/src/components/after-action-form/AfterActionForm.tsx:131-134` the dirty-tracking
  effect is `if (!initialData) return; setIsDirty(true)` — in create mode `initialData` is
  undefined, so `isDirty` is permanently `false`, and line 482 gates Save on `!isDirty`.
  Separately, Publish is gated on `canPublish && onPublish` (lines 66, 499), and the route
  `routes/_protected/engagements/$engagementId/after-action.tsx:156-162` passes neither.
- Suggested fix (1 line): drop the `!initialData` early-return so create-mode edits mark the form
  dirty, and pass `canPublish` + `onPublish` from the engagement route.

### F4. `/delegations` renders "You haven't granted any delegations" while the API is returning 401 [severity: P0] [class: hollow]

- Route: `/delegations`
- Observed: 24 skeletons resolve into counters "Permissions I Granted 0 / Permissions I Received
  0 / Expiring within 7 days 0" and the empty state "You haven't granted any delegations —
  Delegate your permissions to a colleague when you're away". Underneath, both data calls
  returned 401. Nothing tells the user the page failed.
- Evidence: `shots/engagements/en_delegations_1440.png`;
  `401 GET .../functions/v1/my-delegations?active_only=true&expiring_within_days=7` and
  `?type=all&active_only=true`, both → `{"error":"Invalid user session","code":"UNAUTHORIZED"}`
  (captured 4×). Every other edge function on every other page accepts the same session token.
- Data-vs-wiring: **feature not wired.** This is the most dangerous shape of bug in the audit —
  a hard auth failure presented as a confident, reassuring empty state. A user with active
  delegations would be told they have none.
- Suggested fix (1 line): fix the token handling in `my-delegations` (it does not accept the
  session the rest of the app uses), and render an error state instead of the empty state on a
  failed query.

### F5. `/positions/$id/approvals` and `/positions/$id/versions` both render the Editor pane [severity: P1] [class: broken]

- Route: `/positions/44c105d3-…9315/approvals` and `…/versions`
- Observed: both URLs render byte-identical content to `/positions/$id` — the "Editor" tab is
  the highlighted/active tab, and the English Content / Arabic Content / Linked Dossiers /
  Attachments panes are shown. Deep-linking to Approvals or Versions is impossible. Clicking the
  in-page tabs _does_ work ("No approval chain configured" / "View version history and compare
  changes") but the URL never changes, so the tab state is component-local and the two child
  routes are orphans.
- Evidence: `shots/engagements/en_positions_44c105d3-…-9315_approvals_1440.png` (note "Editor"
  is the active tab while the URL says `/approvals`); compare
  `json/engagements/en_1440_pos_approvals.json` vs `en_1440_pos_versions.json` vs
  `en_1440_pos_detail_slow.json` — same headings, same text.
- Data-vs-wiring: **feature not wired** — the routes exist in the router but do not drive tab state.
- Suggested fix (1 line): derive the active tab from the route param instead of local state.

### F6. Positions "Versions" tab is a placeholder sentence [severity: P1] [class: hollow]

- Route: `/positions/44c105d3-…9315` → click Versions
- Observed: the entire pane is the single line "View version history and compare changes". No
  version list, no diff, no dates, no CTA. The published position's banner explicitly tells users
  to "create a new version" — and the versions surface is empty text.
- Evidence: `mine/steps.mjs` output for the Versions click; text ends at
  `Editor | Approvals | Versions | View version history and compare changes`.
- Data-vs-wiring: **feature not wired.** It is a description string where a component should be.
- Suggested fix (1 line): render the version list, or hide the tab until it is implemented.

### F7. Positions stat cards report 0 Published / 0 In Review / 0 Drafts while the list below shows 2 published and 2 drafts [severity: P1] [class: hollow]

- Route: `/positions` (both languages)
- Observed: "Total Positions 4" is correct; "Published 0", "In Review 0", "Drafts 0" are all
  wrong. The list immediately underneath shows `Audience Test Position — Draft`,
  `New Trade Policy Position — Draft`, `GASTAT stance on open data licensing — Published`,
  `Position on regional statistical harmonization — Published`.
- Evidence: `shots/engagements/en_positions_1440.png`, `shots/engagements/ar_positions_1440.png`.
  DB confirms 2 `draft` + 2 `published`.
- Data-vs-wiring: **feature not wired** — the total is computed, the per-status breakdown is not.
- Suggested fix (1 line): count by `status` from the same result set that feeds the total.

### F8. "Submit for Review" fails with a 400 and the user is shown nothing at all [severity: P1] [class: broken]

- Route: `/positions/8955b666-…9a75` (draft position)
- Observed: clicked the page's primary CTA. The request returned
  `400 PUT .../functions/v1/positions-submit` →
  `{"error":"Bilingual content required","error_ar":"المحتوى ثنائي اللغة مطلوب"}`. The page did
  not change: no toast, no `role="alert"`, no inline error, no dialog. The backend even returns a
  ready-translated Arabic message that is thrown away.
- Evidence: `shots/engagements/pos_submit_dialog.png` (identical to the pre-click state);
  `mine/steps.mjs` NET log. Also emitted a page error: "There was an error during concurrent
  rendering but React was able to recover…".
- Data-vs-wiring: mixed — the _rejection_ is correct (`content_en`/`content_ar` are genuinely
  empty in the DB, so this is **no data seeded**), but **the error surfacing is not wired**. A
  user would click Submit repeatedly with no idea why nothing happens.
- Suggested fix (1 line): surface the `error`/`error_ar` payload as a toast, and disable Submit
  with a reason when the bilingual content is empty.

### F9. Position attachments are CORS-blocked, and the failure renders as "No attachments yet" [severity: P1] [class: broken]

- Route: `/positions/$id` (all three tabs, both positions I tried)
- Observed: `GET .../functions/v1/positions/<id>/attachments` fails preflight —
  "Response to preflight request doesn't pass access control check: It does not have HTTP ok
  status", repeated 4× per page load. The Attachments card nonetheless shows the upload
  dropzone and "No attachments yet".
- Evidence: `json/engagements/en_1440_pos_detail.json` badRequests; console errors captured in
  the Versions-click run.
- Data-vs-wiring: **feature not wired** (network layer). Whether attachments exist is unknowable
  from the UI — same false-empty pattern as F4.
- Suggested fix (1 line): add the dev origin to the `ALLOWED_ORIGINS` secret / fix the OPTIONS
  handler on the path-routed `positions/*` function, and show an error state on fetch failure.

### F10. "Create Event" and `/calendar/new` dead-end on the calendar page itself [severity: P1] [class: broken]

- Route: `/calendar` → "Create Event", and `/calendar/new` directly
- Observed: the primary header CTA navigates to `/calendar/new`, and `/calendar/new` renders the
  exact same Calendar page — same heading, same "Your Calendar is Empty" onboarding card, same
  text, character for character. No form, no modal, no error. Verified twice (direct probe of
  `/calendar/new`, then via the button).
- Evidence: `json/engagements/en_1440_calendar.json` vs `en_1440_calendar_new.json` — identical
  `text`; `mine/steps.mjs` cal_create run ends at `URL: http://localhost:5173/calendar/new` with
  unchanged content.
- Data-vs-wiring: **feature not wired.** The working create form exists and is reachable — but
  only via the "Create from Scratch" card inside the empty state, which disappears once any event
  exists.
- Suggested fix (1 line): make `/calendar/new` mount the same create-event form that
  "Create from Scratch" opens.

### F11. `/calendar` never renders a calendar — Month/Week/Day change nothing [severity: P1] [class: hollow]

- Route: `/calendar` (EN + AR, 1440/1024/768)
- Observed: the page shows a Month/Week/Day segmented control above an onboarding card ("Your
  Calendar is Empty", "Use a Template", "Create from Scratch", "Recommended for you" chips).
  Clicking "Week" produces the identical card. No grid, no timeline, no date range is ever
  rendered at any viewport in either language. Meanwhile `/events` _does_ render a month grid,
  and `/engagements/$id/calendar` renders a date range — so three different calendar surfaces
  disagree.
- Evidence: `shots/engagements/en_calendar_1440.png`, `ar_calendar_1440.png`,
  `en_calendar_768.png`, `cal_week_week.png`.
- Data-vs-wiring: **unsure, because** the calendar entries table may legitimately be empty — but
  a calendar with zero events should still draw the grid. The view switcher being inert is
  wiring, not data.
- Suggested fix (1 line): render the grid unconditionally and put the onboarding card inside it.
- _(Checked and cleared: the RTL mirroring here is correct. I measured the toolbar —
  EN `301..506`, AR `953..1139` against a 1440 viewport — an exact mirror. Not a bug.)_

### F12. `/events` month grid ignores the real weekday offset and has no month label or navigation [severity: P1] [class: broken]

- Route: `/events` (EN + AR)
- Observed: the grid lays out days 1–31 starting in the first column, so "1" sits under Sun/الأحد.
  1 Aug 2026 is a **Saturday** — the app's own datepicker on the after-action form renders
  August 2026 correctly, with 15 under "Sa". So the same app has a correct calendar component and
  an incorrect one. There is also no "August 2026" heading and no prev/next controls: the user
  cannot tell which month they are looking at or move to another one.
- Evidence: `shots/engagements/en_events_1440.png`, `shots/engagements/ar_events_1440.png`
  (mirroring itself is correct — الأحد rightmost), vs `shots/engagements/aa_datepicker.png`.
- Data-vs-wiring: **feature not wired** — this is date math, independent of whether events exist.
- Suggested fix (1 line): pad the grid with the first-of-month weekday offset and add a
  month/year header with prev/next.

### F13. `/briefs` shows "No briefs yet" after a brief was successfully generated [severity: P1] [class: hollow]

- Route: `/briefs`, vs `/engagements/b0000002-…-0001/docs`
- Observed: I generated a brief from the engagement Docs tab — it worked, returning
  "1 document / Brief: Bilateral consultation — ESCWA / Draft / Classic Brief / 15 Aug 2026".
  Reloading `/briefs` immediately after still shows "No briefs yet" with zero rows and no errors.
- Evidence: `mine/steps.mjs` brief_gen output; `shots/engagements/en_briefs_1440.png` (taken
  _after_ generation).
- Data-vs-wiring: **feature not wired.** The record exists (the engagement tab reads it back);
  the global Briefs list queries a different source.
- Suggested fix (1 line): point `/briefs` at the same store the engagement Docs tab writes to.
- _(Positive note: brief generation itself is real, not a no-op. Its body is a template summary —
  "Includes 0 participant(s), 0 relevant position(s), and 0 active commitment(s)" — which is
  honest given the engagement has no participants or positions seeded.)_

### F14. The "New brief" modal is a stub that echoes the page's own header [severity: P1] [class: hollow]

- Route: `/briefs` → "New brief"
- Observed: the dialog's title is "New brief", its body is the page subtitle verbatim ("Captured
  intelligence summaries and AI-generated briefs."), and it contains one control — a dropdown
  also labelled "New brief". No title field, no type selector, no Generate/Create button, no
  Cancel. The dropdown does open a working dossier picker, so there is a live component in
  there, but there is no way to complete the action.
- Evidence: `shots/engagements/briefs_new_after_new.png`, `shots/engagements/briefs_dd_dropdown.png`.
- Data-vs-wiring: **feature not wired.**
- Suggested fix (1 line): give the dialog a real form + submit action, and label the dossier
  picker something other than "New brief".

### F15. Internal build artefacts shipped as user-facing content [severity: P1] [class: devcopy]

- Routes: `/engagements/$id/digests`, `/briefs` (dossier picker), `/mous`, `/positions`
- Observed, all verbatim from the running UI:
  - Digests card: **"Phase 70 staging verification digest"**
  - Brief dossier picker: **"Phase 52 Kanban Fixture Engagement"**, **"Phase 63 graph
    verification topic"**, **"Phase 63 second-degree verification forum"**, **"Test Person A —
    Senior Diplomat"**, **"Test Working Group D — Health Cooperation"**
  - MOU table row: **"E2E MoU 1783364705954"** (a raw epoch-millis test fixture)
  - Positions list: "Audience Test Position", "New Trade Policy Position"
- Evidence: `shots/engagements/en_engagements_b0000002-…-0001_digests_1440.png`,
  `shots/engagements/briefs_dd_dropdown.png`, `shots/engagements/en_mous_1440.png`.
- Data-vs-wiring: **no data seeded properly** — these are real DB rows created by test runs and
  never cleaned up. They are indistinguishable from real diplomatic records to a user.
- Suggested fix (1 line): purge phase/E2E fixture rows from the staging dataset and stop E2E runs
  writing into the shared seed.

### F16. The Digests tab is unreachable — the route renders but is missing from the tab bar [severity: P1] [class: hollow]

- Route: `/engagements/$id/digests`
- Observed: the engagement tab bar has exactly eight tabs — Overview, Context, Positions,
  Signals, Tasks, Calendar, Docs, Audit. `/digests` renders a full working surface (Subscribe to
  digest, Your subscriptions, a digest card with Signals/Engagements/Commitments counts, Generate
  now, Unsubscribe) but nothing in the UI links to it. Typing the URL is the only way in.
- Evidence: `shots/engagements/en_engagements_b0000002-…-0001_digests_1440.png` — the tab strip
  and the Digests heading are visible in the same frame.
- Data-vs-wiring: **feature not wired** into navigation. Also note the card carries two competing
  "Generate now" buttons (page-level and card-level), and the DAILY subscription's last digest is
  dated Mon 15 Jun — two months stale — which suggests the daily job is not running either.
- Suggested fix (1 line): add Digests to the engagement tab list.

### F17. Raw enum values and an ISO week code are shown to users, untranslated in Arabic [severity: P1] [class: i18n]

- Routes: `/engagements`, `/dossiers/engagements` (both languages)
- Observed EN: rows read `Sun 05 Jul 18:00 GST · travel · scheduled · Riyadh · Ritz-Carlton` and
  `… · meeting · in_progress · …`. `in_progress` with a literal underscore is a database value,
  not copy. The group header reads `WEEK OF 2026-W27` — an ISO week code.
  Observed AR: titles and locations translate ("زيارة وفد — هيئة الإحصاء الإندونيسية", "الرياض"),
  but the same line still reads `Sun 05 Jul 18:00 GST · travel · scheduled` — English weekday,
  English month, English enums — and the header is `أسبوع 2026-W27`.
- Evidence: `shots/engagements/en_engagements_1440.png`,
  `json/engagements/ar_1440_engagements.json`.
- Data-vs-wiring: **feature not wired** — the values are rendered raw instead of through a label
  map, in both locales.
- Suggested fix (1 line): map `type`/`status` through translated labels and format the group
  header as a localized date range instead of `2026-W27`.

### F18. The position read-only banner stays in English under Arabic [severity: P1] [class: i18n]

- Route: `/positions/44c105d3-…9315` with `id.locale=ar`
- Observed: the whole page is Arabic (tabs المحرر / الموافقات / الإصدارات, headings المحتوى
  الإنجليزي / المحتوى العربي / المرفقات, button حفظ) except the most important sentence on the
  page, which renders in English: "Position Published - Read Only. This position has been
  published. To make changes, you must use the Emergency Correction workflow or create a new
  version."
- Evidence: `json/engagements/ar_1440_pos_detail.json` text.
- Data-vs-wiring: **feature not wired** — hardcoded English string, not a `t()` call.
- Suggested fix (1 line): move the banner text into the translation bundle.

### F19. Raw i18n key `CALENDAR.RECURRENCE.TITLE` shipped in the create-event form [severity: P1] [class: i18n]

- Route: `/calendar` → "Create from Scratch" (EN and AR)
- Observed: the recurrence section's heading renders as the literal uppercase key
  `CALENDAR.RECURRENCE.TITLE` in both languages.
- Evidence: `shots/engagements/cal_scratch_ar_scratch_ar.png` (visible bottom-right of the form);
  same string in the EN run.
- Data-vs-wiring: **feature not wired** — key case/namespace mismatch (the rest of the form
  translates correctly, so the bundle is loaded).
- Suggested fix (1 line): correct the key casing/namespace to match the calendar bundle.

### F20. Raw i18n key `common.loading` leaks in the Linked Dossiers panel [severity: P2] [class: i18n]

- Route: `/positions/44c105d3-…9315/approvals`
- Observed: while Linked Dossiers loads, the panel renders the literal string `common.loading`.
  Dot-form keys resolve to nothing in this app's i18n setup; colon namespaces are required.
- Evidence: `json/engagements/en_1440_pos_approvals.json` → `i18nKeyLeaks: ["common.loading"]`.
- Data-vs-wiring: **feature not wired** (wrong key separator).
- Suggested fix (1 line): use `common:loading` or a skeleton instead of a text label.

### F21. Five different date formats across this lane; four of them violate DESIGN.md [severity: P2] [class: design]

- Routes: as listed
- Observed, all in the same product, none matching each other:
  - `Sat 04 Jul 01:00 GST` — `/engagements` list ✅ correct
  - `Sat 15 Aug 01:59 GST` — engagement Audit tab ✅ correct
  - `Jul 4, 2026` — engagement Overview "Deadline" ❌
  - `Fri, July 3, 2026` — engagement Calendar tab range ❌
  - `Aug 12, 2026` / `Jun 10, 2026` — `/positions` cards ❌
  - `24 Jan 2027` — `/mous` DATES column ❌
  - `15 Aug 2026` — generated brief card ❌
    DESIGN.md mandates `Tue 28 Apr` (day-first, weekday, no comma).
- Evidence: `shots/engagements/en_engagements_b0000002-…-0001_overview_1440.png`,
  `en_positions_1440.png`, `en_mous_1440.png`, `json/engagements/en_1440_eng_calendar.json`.
- Data-vs-wiring: **feature not wired** — a shared formatter exists and is used correctly in two
  places; five other call sites use ad-hoc `toLocaleDateString`.
- Suggested fix (1 line): route every date through the existing formatter used by the engagements
  list and the audit tab.

### F22. Engagements filter chips wrap onto a second line at every viewport, including 1440 [severity: P2] [class: design]

- Route: `/engagements` at 1440, 1024, 768
- Observed: the "All / Meeting / Travel" chip group is pinned to the right of the search field in
  a narrow column, so "Travel" always wraps to its own line, misaligned below "Meeting", leaving
  a large empty band above the search box. This is not a responsive breakpoint issue — it happens
  identically at 1440px with ~600px of unused horizontal space.
- Evidence: `shots/engagements/en_engagements_1440.png`, `en_engagements_1024.png`,
  `en_engagements_768.png` — same wrap in all three.
- Data-vs-wiring: n/a — layout.
- Suggested fix (1 line): let the chip row size to content instead of sharing a fixed grid column
  with the search field.
- _(The filters themselves work: clicking "Travel" correctly narrows to the one travel
  engagement, and searching "ESCWA" correctly narrows to one row. Verified both.)_

### F23. Duplicated, unlabelled filter bars on `/positions` and `/mous`, with a search icon printing over the placeholder [severity: P2] [class: design]

- Routes: `/positions`, `/mous`
- Observed: `/positions` renders a titled "Search & Filter" card (Search by title… / All Statuses
  / All Types / Last Updated) and then, immediately below it, a _second_ unlabelled bar (Search
  positions… / All / All / All Time). `/mous` does the same (Filter card with a Search box and
  status chips, then a second Search box above the table). In both second bars the magnifier icon
  is painted on top of the placeholder text, rendering as "⌕earch positions…". Separately on
  `/positions`, the four stat cards lay out as a 3-wide grid with "Drafts" orphaned on a second
  row and half the row empty, at 1440.
- Evidence: `shots/engagements/en_positions_1440.png`, `shots/engagements/ar_positions_1440.png`,
  `shots/engagements/en_mous_1440.png`.
- Data-vs-wiring: n/a — two filter implementations mounted on the same page.
- Suggested fix (1 line): delete one of the two filter bars per page and set the stat grid to 4
  columns at ≥1024.

### F24. `role="alert"` used for a passive hint, and the hint uses first-person plural [severity: P2] [class: a11y]

- Route: `/dossiers/engagements/create`
- Observed: "Tell us about the engagement — official names and a short description." is exposed
  with `role="alert"`, so assistive tech interrupts the user with it on page load even though
  nothing has gone wrong. It is also the only `role="alert"` on the page, which means a genuine
  validation failure has no distinct announcement. The copy itself uses "us" — DESIGN.md bans
  first-person plural in UI copy.
- Evidence: `json/engagements/en_1440_dossiers_engagements_create.json` → `alerts: ["Tell us
about the engagement — official names and a short description."]`;
  `shots/engagements/en_dossiers_engagements_create_1440.png`.
- Data-vs-wiring: n/a.
- Suggested fix (1 line): use `role="note"`/no role for the hint and reword to "Enter the
  official names and a short description."

### F25. Create-engagement wizard: step 4 is clipped off-screen and the page has a phantom empty left column [severity: P2] [class: design]

- Route: `/dossiers/engagements/create` at 1440
- Observed: the 4-step indicator runs off the right edge — "1 Basic Information", "2 Engagement
  Details", "3 Participants" render, then step 4 ("Review") is cut in half at the container edge
  and its label is invisible. Separately, the page heading "New Engagement Dossier" sits at
  x≈280 while all form content starts at x≈543, leaving a ~260px empty gutter that reads as a
  failed two-column layout. Placeholder text reads "E.G., WDF, WHO, SDGS" — uppercase "E.G."
  from a label style leaking into a placeholder.
- Evidence: `shots/engagements/en_dossiers_engagements_create_1440.png`.
- Data-vs-wiring: n/a — layout.
- Suggested fix (1 line): let the stepper wrap or scroll, and align the form to the page heading.
- _(The wizard's validation is real: clicking Next with empty fields correctly surfaces "English
  name must be at least 2 characters" / "Arabic name must be at least 2 characters".)_

### F26. The lifecycle stepper mutates the engagement on a single click, with no confirmation and wrong attribution [severity: P2] [class: hollow]

- Route: `/engagements/b0000002-…-0001/overview`
- Observed: clicking "Follow-up" in the stage stepper immediately and permanently moved the
  engagement from Execution to Follow-up — no confirm dialog, no undo. The resulting activity
  entry reads "**System** transitioned to Follow-up", attributing a deliberate human action to
  the system. The six stage boxes look like a passive progress indicator, not six buttons.
- Evidence: `mine/steps.mjs` stage run — Current Stage changed to "Follow-up", Recent Activity
  gained "System transitioned to Follow-up / Today".
- Data-vs-wiring: **feature is wired** — it works, arguably too well. This is a UX/data-integrity
  risk, not a break.
- Suggested fix (1 line): confirm before a backward/forward stage jump and record the acting user
  instead of "System".
- _(Positive: this also proved the Audit tab is genuinely wired — it went from "No activity
  recorded" to `Sat 15 Aug 01:59 GST — Execution → Follow-up`, in the correct date format. The
  earlier empty audit tab was **no data seeded**, not broken.)_

### F27. Several routes take 9–14 seconds to resolve their skeletons [severity: P2] [class: broken]

- Routes: `/engagements/$id/docs`, `/engagements/$id/context`, `/positions/$id`
- Observed: at the probe's default 2.5s settle these render as bare skeletons (docs: 5 skeletons
  and zero content; context: 9 skeletons; positions detail: 2 skeletons, 385 chars = nav chrome
  only). At 9s docs/context resolve; `/positions/$id` needed 14s. `/after-actions` needed ~12s
  just to show its error. On a slower connection these read as broken pages.
- Evidence: compare `json/engagements/en_1440_eng_docs.json` vs `…_eng_docs_slow.json`;
  `en_1440_pos_detail.json` vs `en_1440_pos_detail_slow.json`.
- Data-vs-wiring: **unsure, because** I cannot separate cold edge-function starts from genuine
  query cost without server timings. Flagging as a measured symptom.
- Suggested fix (1 line): profile the position-detail and engagement-docs queries; they are the
  two slowest surfaces in this lane.

### F28. Aborted `search_engagements_advanced` request on both engagement list routes [severity: P2] [class: broken]

- Route: `/engagements` and `/dossiers/engagements`
- Observed: every load emits
  `FAILED HEAD .../rest/v1/rpc/search_engagements_advanced?p_limit=100000&p_offset=0
net::ERR_ABORTED`. The list still renders correctly, so this is likely a cancelled count query
  — but `p_limit=100000` on a HEAD count is a smell, and a permanently-aborted request will mask
  a real failure later.
- Evidence: `json/engagements/en_1440_engagements.json`, `en_1440_dossiers_engagements.json`.
- Data-vs-wiring: **unsure, because** the abort may be intentional React Query cancellation.
- Suggested fix (1 line): confirm the count query is meant to be cancelled; if so, suppress it
  from the network log rather than leaving a permanent ERR_ABORTED.

---

## Cross-cutting observations (not counted as findings)

- **`/engagements` and `/dossiers/engagements` render the same list with different chrome** —
  `/engagements` has a search box + All/Meeting/Travel chips; `/dossiers/engagements` has
  "Filter"/"Display" buttons. The dual mount is understood to be intentional, but the two
  toolbars are not, and a user landing on either has different capabilities.
- **Arabic terminology is inconsistent for the same concept.** The nav calls engagements
  "الارتباطات"; the page title calls them "المشاركات"; the after-actions subtitle says
  "المشاركات السابقة". Likewise "Log After-Action" is "تسجيل التقييم" in the engagement header
  but "تسجيل ما بعد الإجراء" on the form itself.
- **Positions category chips stay English under Arabic** — "Security", "Trade Policy".
- **Arabic infrastructure is otherwise solid.** All 10 AR routes returned `dir=rtl`, `lang=ar`,
  Tajawal resolved as the body font, and **zero horizontal overflow**. The `/events` month grid
  and the `/calendar` page both mirror correctly (I measured element rects rather than eyeballing
  the screenshots, and an apparent toolbar-mirroring bug did not survive that check).
- **Responsive is clean in this lane.** `/engagements` and `/calendar` at 1024 and 768: no
  horizontal scroll (`scrollW` == viewport at every width), sidebar collapses to a hamburger at
  768, all content reachable. The only defect visible at small widths (F22) is present at 1440 too.

## Routes that are genuinely fine

- `/engagements` — search and both type filters actually filter (verified); rows navigate to the
  correct detail route. Defects are cosmetic/i18n only (F17, F22).
- `/engagements/$id/overview` — stats, participants, recent activity, quick actions all render;
  stage/task/deadline values are correct.
- `/engagements/$id/tasks`, `/positions`, `/signals` (engagement tabs) — honest empty states with
  a clear CTA and no console noise. These are **no data seeded**, not broken.
- `/engagements/$id/context` — correct empty states; the "Linked dossiers appear here when a host
  country, organizations, or participants are added" copy is exactly the right register.
- `/engagements/$id/docs` — **brief generation genuinely works** and writes a record.
- `/engagements/$id/audit` — verified live: went from empty to a correctly-formatted entry after
  a real state change.
- `/engagements/$id/calendar` — renders scheduled/past sections and derives Start/Deadline
  entries; only the date format is wrong.
- `/dossiers/engagements/create` — 4-step wizard with working per-field validation and a working
  Save Draft / Next; only copy and layout issues.
- `/calendar` → "Create from Scratch" — a real, complete, bilingual create-event form (spoiled
  only by the F19 key leak).
- `/mous` — table, status chips, column picker, pagination, and both stat counters are correct;
  the empty PARTIES cell on MOU-001 is **no data seeded** (`parties = []` in the DB), not a
  broken join — the other row joins both parties correctly.
