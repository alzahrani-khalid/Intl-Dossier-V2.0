# Lane A: worksurfaces

Shot root: `<scratchpad>/shots/worksurfaces/` — paths below are relative to it.
Interaction scripts I wrote: `<scratchpad>/lane-worksurfaces/*.mjs` (probe.mjs untouched).

**Session note:** the shared `storageState.json` expired near the end of my run —
`400 POST /auth/v1/token?grant_type=refresh_token`, every route now redirects to
`/login` (`session-check/en_dashboard_1440.png`). All findings below were captured
**before** expiry against a live authenticated session. Per the brief I did not re-mint.

**Mutations I made (QA side effects, disclosed):** to answer "does the Kanban accept a
drag" I moved task `b0000004-…0003` ("Sign travel authorisation — Muscat") In Progress →
Review, then **moved it back to In Progress** and verified the board is restored
(To Do 14 / In Progress 2 / Review 0 / Done 0). No other writes succeeded anywhere —
the intake form never POSTed, and every commitment drag was rejected by the server.

## Routes covered (20 EN + 8 AR + responsive)

| Route                  | Verdict                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `/dashboard`           | OK shell, **HOLLOW** widgets (F11, F19, F21)                             |
| `/my-work`             | **HOLLOW** — renders 11 of its own 21 items (F5)                         |
| `/my-work/assignments` | OK, **devcopy/design** (F15, F14) — also orphaned from nav               |
| `/my-work/board`       | OK — 302s to `/kanban`                                                   |
| `/my-work/waiting`     | **HOLLOW** — rows titled by truncated UUID (F6)                          |
| `/my-work/intake`      | **HOLLOW** — lands on an empty view while 3 tickets exist (F9)           |
| `/tasks`               | OK, **devcopy** raw enums (F14)                                          |
| `/tasks/queue`         | **BROKEN** — 404 edge function, page replaced by a raw error (F3)        |
| `/tasks/escalations`   | OK / empty; timeline card renders a blank box (F28)                      |
| `/tasks/$id`           | OK — but Progress reads **200%** (F13)                                   |
| `/kanban`              | **BROKEN for commitments** — drag 400s (F4); Done can never fill (F20)   |
| `/commitments`         | OK — tabs filter correctly; counts disagree with dashboard (F21)         |
| `/intake`              | OK — 302s to `/my-work/intake`                                           |
| `/intake/new`          | **BROKEN** — form cannot be submitted at all (F2)                        |
| `/intake/queue`        | OK — 302s to `/my-work/intake` (3 routes → 1 page)                       |
| `/intake/tickets/$id`  | **HOLLOW** — Links tab leaks 5 raw i18n keys + 4 failing endpoints (F10) |
| `/approvals`           | **genuinely fine** (empty, clean)                                        |
| `/notifications`       | **HOLLOW + devcopy** — 6 fake "Example" notifications, dead bell (F7)    |
| `/activity`            | **HOLLOW** — every row ends `in —`; Following tab = All tab (F8)         |
| `/search`              | **BROKEN** — error boundary on every query (F1)                          |

Arabic (`--lang ar`): `/dashboard` `/my-work` `/kanban` `/intake` `/intake/new` `/tasks`
`/commitments` `/activity`. `dir="rtl"` and Tajawal apply everywhere; no horizontal
overflow anywhere; mirroring is correct (KPI order, row arrows ↗→↖, sidebar side).
RTL _layout_ is in good shape — the Arabic problems are i18n coverage, not direction.

Responsive: `/dashboard` `/kanban` (`= /my-work/board`) `/intake/new` at 1024 and 768.

---

## Findings

### F1. `/search` throws an uncaught TypeError on every query — the page dies [severity: P0] [class: broken]

- Route: `/search?q=<anything>`
- Observed: the empty state renders fine, but _any_ search — including clicking the
  app's own suggestion chip "Saudi Arabia" — replaces the whole page with an error
  boundary reading `TypeError / Cannot read properties of undefined (reading 'forEach')`
  and a Retry button. Retry re-crashes. Reproduced 2×, two independent ways (chip click,
  and direct `/search?q=OECD`).
- Evidence: `search/01-chip-saudi.png`, `en_search_q_OECD_1440.png`; console:
  `TypeError … at src/domains/dossiers/hooks/useDossierFirstSearch.ts:58:31`, plus
  `Warning: Error in route match: /_protected/search/search`. **No 4xx** — the request
  succeeds and the hook mis-reads the payload shape.
- Data-vs-wiring: **feature not wired** — a response-shape mismatch in the hook, not missing data.
- Suggested fix: guard/default the array `useDossierFirstSearch.ts:58` iterates before `forEach`.

### F2. `/intake/new` cannot be submitted — the selected dossier never reaches the validator [severity: P0] [class: broken]

- Route: `/intake/new`
- Observed: filled the form via its own "Fill with Mock Data", opened the dossier
  popover, typed "OECD", picked the OECD option. The UI then shows the chip
  **"Linked to: OECD · Primary"** — and directly above it the error **"At least one
  dossier is required"**. Clicking "Submit request" does nothing: URL stays `/intake/new`
  and **no POST is ever issued** (the only POST in the whole session is the 404 below).
  With nothing selected the same field shows a raw Zod message:
  **"Invalid input: expected string, received undefined"**.
- Evidence: `intake-form/08-after-real-submit.png` (chip and error visible together),
  `intake-form/04-after-submit.png` (raw Zod text), `intake-form/02-empty-submit.png`.
- Data-vs-wiring: **feature not wired** — the picker writes to display state, not to the
  form field the schema reads. The intake pipeline has no working entry point.
- Suggested fix: bind the dossier picker's `onSelect` into the RHF field, and give the
  dossier field a translated `required` message instead of Zod's default.

### F3. `/tasks/queue` is replaced by a raw internal error — its edge function is 404 [severity: P0] [class: broken]

- Route: `/tasks/queue`
- Observed: after ~3s the entire page (heading, 4 KPIs, both filters, the queue) is
  replaced by a single red banner: **"Edge Function returned a non-2xx status code"**.
  Nothing else renders. `404 GET /functions/v1/assignments-queue` (4 retries).
- Evidence: `en_tasks_queue_1440.png`; `404 GET …/functions/v1/assignments-queue`.
- Data-vs-wiring: **feature not wired** — the `assignments-queue` edge function is not
  deployed to the staging project.
- Suggested fix: deploy `assignments-queue`; render an error card inside the page shell,
  never the supabase-js message (CLAUDE.md: user-facing errors must not leak internals).

### F4. Kanban rejects every commitment drag with a 400 — 10 of 16 cards can't be moved [severity: P0] [class: broken]

- Route: `/kanban` (= `/my-work/board`)
- Observed: dragged "Send follow-up documentation" (a **Commitment**) To Do → Review.
  Toast: **"Failed to update status / Unknown error"**; two `PATCH
/rest/v1/aa_commitments?id=eq.b0000003-…0008` fire and **both return 400**; the card
  does not move, and does not move after a hard reload. Reproduced 2×.
  A **Task** card dragged the same way works perfectly and persists across reload —
  so the board is broken specifically for the 10 commitment cards, not for dnd itself.
  Worse variant: dropping a commitment onto a _column header_ returns
  **"Operation completed successfully"** while nothing moves (`kanban/02-after-drag.png`).
- Evidence: `kanban/04-after-review-drop.png`, `kanban/02-after-drag.png`;
  `400 PATCH …/aa_commitments…` ×2 vs `200 PATCH …/tasks…` for the task case.
- Data-vs-wiring: **feature not wired** — the drop handler writes the kanban stage
  (`review`) into `aa_commitments`, whose lifecycle is `pending/in_progress/completed/
cancelled` (per CLAUDE.md's source-specific carve-outs). Mapping is missing.
- Suggested fix: map board stage → commitment status at the mutation layer; surface the
  PostgREST message instead of "Unknown error"; de-dupe the double PATCH.

### F5. `/my-work` "All" renders 11 of the 21 items it says it has [severity: P1] [class: hollow]

- Route: `/my-work?tab=all`
- Observed: three different numbers on one screen — tab badge **18**, list footer
  **"21 items"**, and only **11 rows actually rendered** (8 commitments + 3 tasks).
  Scrolling to the bottom 6× loads nothing more; there is no pagination control.
  The per-source tabs are self-consistent (Commitments 10/10, Intake 2/2), so the
  10 missing rows — including every Intake row — are dropped only on "All".
  The Tasks tab badge is also wrong: badge **6**, footer 9, 9 rows rendered.
- Evidence: `en_my-work_1440.png`; measured per-tab in `lane-worksurfaces/mywork4.mjs`.
- Data-vs-wiring: **feature not wired** — the data is there (each tab can show it).
- Suggested fix: one source of truth for the merged list + counts; badges from the same query.

### F6. `/my-work/waiting` titles every row with a truncated UUID [severity: P1] [class: hollow]

- Route: `/my-work/waiting`
- Observed: 6 rows whose headline is `00000000…`, `b0000004…` — the record's own ID,
  repeated again on the same row as `ID: 00000000…`. Three rows are literally
  indistinguishable. These are the same tasks that render with proper titles on
  `/tasks` and `/kanban`. Also `Status: assigned` raw lowercase. Loads in ~5–15s with
  skeletons (the 2.5s default probe only ever sees skeletons).
- Evidence: `en_my-work_waiting_1440.png`.
- Data-vs-wiring: **feature not wired** — titles exist; the row renders the id field.
- Suggested fix: render `title`/`title_ar` with the id as a secondary mono chip, not the headline.

### F7. Notification Center ships 6 fabricated "Example" notifications, and the bell is dead [severity: P1] [class: devcopy]

- Route: `/notifications` (bell tested from `/dashboard`)
- Observed: with zero real notifications the page shows a section "What You'll See Here —
  _Before you receive any real notifications, take a moment to see examples of the types
  of updates you'll get_", then an auto-playing reel (with a **Pause** button) of six
  invented notifications: "Sarah mentioned you in a comment", "MOU renewal document for
  Japan is due in 3 days", "Quarterly Review Meeting … Conference Room A". Each is tagged
  "Example", but they are styled exactly like real rows — an analyst will read them as real.
  Separately: the topbar bell carries a red badge **"3"** on every page, has
  `aria-label="Open notifications"`, and **clicking it opens nothing and navigates
  nowhere** (tested 2×, no popover/dialog/menu appears in the DOM) — while this very page
  says "All caught up!".
- Evidence: `en_notifications_1440.png`; bell probe in `lane-worksurfaces/bell.mjs`.
- Data-vs-wiring: **feature not wired** (bell) + shipped demo content (examples).
- Suggested fix: delete the example reel; wire the bell to a panel or a link to
  `/notifications`; make the badge read the same count the page reads.

### F8. `/activity` — every entry's context is an em-dash placeholder; "Following" == "All Activity" [severity: P1] [class: hollow]

- Route: `/activity`
- Observed: all 8 rows read `Khalid Alzahrani created Indonesia in —`. The trailing `—`
  is where the dossier should be; on four rows it's even rendered as an accent-coloured
  **link** — so the href resolves and only the label is missing. Clicking the "Following"
  tab selects it and renders **byte-identical** content to "All Activity".
- Evidence: `en_activity_1440.png`, `activity-following/en_activity_1440.png`.
- Data-vs-wiring: **feature not wired** — the link target exists, the name lookup doesn't.
  ("Following" is _unsure_: either no follow set exists yet, or the tab is unfiltered —
  but it should then say so rather than silently duplicating.)
- Suggested fix: join the dossier name into the feed payload; make Following either filter or empty-state.

### F9. Intake lands on an empty queue while 3 tickets exist; the empty-state CTA no-ops [severity: P1] [class: hollow]

- Route: `/intake` → `/my-work/intake` (also `/intake/queue`)
- Observed: the default view is "Pending Triage — 0 items — **No Pending Reviews**" with a
  full-page marketing empty state. Switching the filter to "All" reveals **3 real
  tickets** (DEMO-INTAKE-002 In Progress, DEMO-INTAKE-001 Assigned, TKT-2026-000001
  Converted). So the operator's landing view is blank while work is queued. The
  empty state's primary CTA **"Access Review Queue"** returns to the same empty view —
  it does nothing. Rows also show "Not submitted" on tickets that are In Progress /
  Assigned, `email`/`web` raw source values, and `1093h waiting` (should be days).
- Evidence: `en_intake_1440.png` (empty), `intake-all/en_intake_1440.png` (3 tickets).
- Data-vs-wiring: **data exists; the default filter hides it** — plus a genuinely dead CTA.
- Suggested fix: default the queue to a filter that has rows, or state the active filter
  in the empty copy ("No tickets pending triage — 3 in other states"); wire or drop the CTA.

### F10. Intake ticket Triage/Links leak raw i18n keys, an internal model id, and 4 failing endpoints [severity: P1] [class: i18n]

- Route: `/intake/tickets/b0000007-0000-0000-0000-000000000002` (Triage + Links tabs; the
  Triage panel is also the "Classify" dialog reachable from the queue list)
- Observed: the AI classification panel prints the untranslated key
  **`intake.form.requestType.options.mou_action`** as the suggested Request Type, plus
  **"Model: fallback-rules"** and **"Assigned Unit: mou-team"** (raw slug) — all
  user-visible. The Links tab prints **five** raw keys as its page title, primary button,
  both sub-tabs and its error line: `entityLinks.title`, `entityLinks.addLink`,
  `entityLinks.activeLinks (0)`, `entityLinks.deletedLinks (0)`, `entityLinks.loadError`.
  Backing calls: `500 GET /api/ai/intake/{id}/proposals`, `404 GET /api/ai/intake/{id}/links`,
  `400 GET /functions/v1/intake-links-get`, then `429` on the retries.
- Evidence: `ticket/02-classify.png`, `ticket/links-long.png`.
- Data-vs-wiring: **feature not wired** — missing translation namespace _and_ missing endpoints.
- Suggested fix: register the `entityLinks` + intake request-type namespaces (see the
  known "unregistered namespaces fall back to EN in both languages" trap); resolve the
  suggestion enum through the same label map the Details tab already uses.

### F11. Dashboard "My Tasks" lists Completed tasks as "Overdue" [severity: P1] [class: hollow]

- Route: `/dashboard`
- Observed: the My Tasks widget shows "Respond to OECD data request — Overdue" and
  "Approve Indonesia delegation brief v3 — Overdue". Opening the first
  (`/tasks/b0000004-…0005`) shows **Status: Completed, "Completed 3 weeks late",
  Completed Sat 30 May**. `/tasks` also renders both struck through. So the dashboard's
  primary to-do widget is telling the user to do work that is already done.
- Evidence: `en_dashboard_1440.png`, `click2/en_tasks_1440.png`, `en_tasks_1440.png`.
- Data-vs-wiring: **feature not wired** — the widget query doesn't exclude completed items.
- Suggested fix: filter `status != completed` in the My Tasks widget query.

### F12. "Fill with Mock Data" — a developer button shipped in the user-facing intake form [severity: P1] [class: devcopy]

- Route: `/intake/new` (both languages — it's even translated: "تعبئة بيانات وهمية")
- Observed: the form's action row is `Cancel | Reset Form | **Fill with Mock Data** |
Submit request`. It fills title/description with "New Partnership with ExampleCorp".
- Evidence: `intake-form/04-after-submit.png`, `ar_intake_new_1440.png`.
- Data-vs-wiring: dev affordance not gated out of the production build.
- Suggested fix: gate behind `import.meta.env.DEV`.

### F13. Task detail shows "Progress 200%" with a full-width red bar [severity: P1] [class: broken]

- Route: `/tasks/b0000004-0000-0000-0000-000000000006`
- Observed: SLA panel reads **Progress 200%**. The value is elapsed/allotted, uncapped —
  the task is 3 months past a 1-day SLA window.
- Evidence: `click/en_tasks_1440.png`.
- Data-vs-wiring: **feature not wired** — no clamp.
- Suggested fix: `Math.min(pct, 100)` for the bar; show the overrun as "3 months overdue" text (already present).

### F14. Raw snake_case / lowercase DB enums shipped as user-visible labels [severity: P1] [class: devcopy]

- Routes: `/tasks`, `/my-work/assignments`, `/my-work/waiting`, `/my-work/intake`
- Observed: `/tasks` subtitles every row with `dossier · action_item`, `follow_up`,
  `preparation`, `analysis`. `/my-work/assignments` shows priority as lowercase
  `high` / `medium` and a work-type chip reading `dossier` — next to an **empty grey
  chip** on the rows where that value is null. `/my-work/waiting` shows `Status: assigned`.
  Intake rows show `email` / `web`. Identical in Arabic (untranslated).
- Evidence: `en_tasks_1440.png`, `en_my-work_assignments_1440.png`,
  `en_my-work_waiting_1440.png`, `ar_tasks_1440.png`.
- Data-vs-wiring: **feature not wired** — no label map between DB enum and display string.
- Suggested fix: one shared enum→label i18n map; don't render the chip when the value is null.

### F15. `/my-work/assignments` prints raw `toLocaleString()` US dates [severity: P1] [class: design]

- Route: `/my-work/assignments`
- Observed: every row shows `Assigned: 4/30/2026, 12:37:38 PM` and
  `Due: 5/1/2026, 12:37:38 PM` — seconds and AM/PM included. DESIGN.md mandates
  `Tue 28 Apr` and `14:30 GST`. This page also takes >2.5s to resolve behind a bare
  "Loading assignments…" string and "…" KPI placeholders.
- Evidence: `en_my-work_assignments_1440.png`.
- Data-vs-wiring: formatting, not data.
- Suggested fix: route through the shared date formatter used by `/tasks` (which is correct).

### F16. "Due in -105 days" — negative day counts rendered to users [severity: P1] [class: devcopy]

- Route: `/my-work` (rows for Approve Indonesia, Review ESCWA, Respond to OECD)
- Observed: overdue items render `Due in -105 days` / `Due in -103 days`. Arabic shows
  `مستحق خلال -105 أيام`. Sibling rows use a correct "Overdue" chip, so the two paths disagree.
- Evidence: `lane-worksurfaces/mywork3.mjs` output; `ar_my-work_1440.png`.
- Data-vs-wiring: formatting.
- Suggested fix: branch on sign — `Overdue 105d` when negative.

### F17. Arabic: work-item titles stay English on `/my-work` and `/commitments` though Arabic titles exist [severity: P1] [class: i18n]

- Routes: `/my-work`, `/commitments` (AR) vs `/dashboard`, `/kanban` (AR)
- Observed: the same commitment record renders as **"إرسال وثائق المتابعة"** on the AR
  dashboard and AR kanban, but as **"Send follow-up documentation"** on AR `/my-work`.
  Same for "التزام تجريبي لشراكة الصين" vs "Test commitment for China partnership".
  The chrome around it is fully translated, so the row reads half-Arabic half-English.
- Evidence: `ar_my-work_1440.png` vs `ar_dashboard_1440.png` / `ar_kanban_1440.png`.
- Data-vs-wiring: **feature not wired** — the Arabic column exists (two other surfaces
  read it); the work-item list selects the English one unconditionally.
- Suggested fix: use the same `title_ar ?? title` selector the kanban card uses.

### F18. Arabic: the intake queue header is half-English [severity: P1] [class: i18n]

- Route: `/my-work/intake` (AR)
- Observed: title "قائمة الاستقبال" but subtitle **"Review and classify incoming requests"**
  and both header buttons — **"New Request"**, **"Pending Triage"** — in English, sitting
  next to a fully-translated body. `/intake/new` (AR) similarly shows a section heading
  "دعم المشاركة - **Additional Information**" and the helper "**Select the dossier this
  request relates to**" under an Arabic label. Also `تطوير المنصب` for "Position
  Development" is the wrong sense of _position_ (job post, not policy paper).
- Evidence: `ar_intake_1440.png`, `ar_intake_new_1440.png`.
- Data-vs-wiring: missing translation keys on those three strings.
- Suggested fix: translate; check for an unregistered namespace on the intake header.

### F19. Dashboard "Recent Dossiers" is empty while 5 country dossiers exist [severity: P1] [class: hollow]

- Route: `/dashboard`
- Observed: a full-height card reading only "No recent dossiers" — on a page whose own
  Forums widget lists 4 forum dossiers and whose Overdue Commitments widget groups rows
  by dossier (UAE, China, G20, Vision 2030, OECD). `/dossiers/countries` lists 5 countries
  with "LAST TOUCH" dates (Mon 06 Jul, Fri 12 Jun, Thu 30 Apr). "Week Ahead" is likewise
  empty and consistent with its own KPI (0), so that one is plausibly just no data.
- Evidence: `en_dashboard_1440.png`; countries listing via `lane-worksurfaces/final.mjs`.
- Data-vs-wiring: **unsure, because** the dossiers exist and carry LAST TOUCH timestamps,
  but "recent" may key off a per-user view-history table that is genuinely empty. Either
  way the widget contradicts the LAST TOUCH data one click away.
- Suggested fix: fall back to `last_touch DESC` when no per-user history exists.

### F20. Kanban "Done" can never fill — completed tasks keep `workflow_stage = To do` [severity: P1] [class: hollow]

- Route: `/kanban`, cross-checked on `/tasks/$id`
- Observed: Done shows **0** and Review **0** permanently, yet three tasks are Completed
  (struck through on `/tasks`). Opening one — "Respond to OECD data request" — shows
  **Status: Completed** _and_ **Workflow Stage: To do** on the same panel. The two fields
  are written independently, so completion never advances the board column.
- Evidence: `en_kanban_1440.png`, `click2/en_tasks_1440.png`.
- Data-vs-wiring: **feature not wired** — no status↔stage sync.
- Suggested fix: set `workflow_stage='done'` when status becomes completed (and vice-versa).

### F21. Four surfaces give four different counts for the same work [severity: P1] [class: hollow]

- Routes: `/dashboard`, `/my-work`, `/commitments`, `/kanban`
- Observed, same account, same minute:
  - Dashboard KPI **"OPEN COMMITMENTS 18"** — but `/commitments` totals **12**
    (Pending/In Progress 2 + Overdue 10). 18 is exactly `/my-work`'s _all-sources_ Total
    Active, so the KPI is mislabelled: it counts work items, not commitments.
  - `/my-work`: badge 18 / footer 21 / 11 rendered (F5); Tasks badge 6 vs 9 rows.
  - `/kanban`: 16 cards, "16 overdue"; its Filter panel says Intake **0** while
    `/my-work` has 2 intake items — intake is silently excluded from the board.
  - `/my-work/assignments`: "Total Active **6**".
  - `/commitments`: the same record ("UAT round-11 commitment") is counted under both
    "Pending (2)" and "Overdue (10)", so the tab counts aren't a partition.
- Evidence: `en_dashboard_1440.png`, `en_my-work_1440.png`, `en_commitments_1440.png`,
  `buttons/kanban-filter.png`, `en_my-work_assignments_1440.png`.
- Data-vs-wiring: **feature not wired** — each surface has its own count query.
- Suggested fix: rename the dashboard KPI to "Open work items" (or query commitments);
  derive board/list counts from one RPC.

### F22. Marketing voice and an exclamation mark in shipped copy [severity: P2] [class: design]

- Routes: `/notifications`, `/my-work/intake`
- Observed: "**All caught up!**" (DESIGN.md bans exclamation marks) as the Notification
  Center subtitle. The intake empty state promises a feature in future tense —
  "_AI suggestions will help speed up your review process_" — and instructs
  "_take a moment to see examples … and configure your preferences_" (F7).
- Evidence: `en_notifications_1440.png`, `en_intake_1440.png`.
- Suggested fix: "No unread notifications." / drop the future-tense promises.

### F23. A11y: unlabeled controls, and the drag announcement says "undefined" [severity: P2] [class: a11y]

- Routes: `/tasks` (9 unlabeled buttons), `/dashboard` (6), `/kanban`, `/search` (1)
- Observed: every per-task completion toggle is a `<button class="task-box">` with no
  text, no `aria-label`, no `title` — 9 on `/tasks`, 3 more in the dashboard My Tasks
  widget. On `/kanban`, the dnd live region announced
  **`Dropped the card "Send follow-up documentation" into the "undefined" column`** when
  the drop landed on a column header — screen-reader users get the literal string
  "undefined". `/my-work/waiting` rows also carry unlabeled selection checkboxes with no
  bulk-action bar to use them with.
- Evidence: `lane-worksurfaces/final.mjs` output; `kanban-drag.mjs` toast capture.
- Suggested fix: `aria-label={t('task.toggleComplete', {title})}`; fall back to the
  column title in the dnd announcer.

### F24. "New request" on the dashboard goes to an empty queue, not the request form [severity: P2] [class: hollow]

- Route: `/dashboard` → `/my-work/intake`
- Observed: the dashboard's primary quick action **"New request"** navigates to
  `/my-work/intake` — the "No Pending Reviews" queue — instead of `/intake/new`.
  "New engagement" likewise lands on the `/engagements` list rather than a create flow.
  Meanwhile `+ New item` (kanban) and "New task" (`/tasks`) both open a "Select Dossier"
  dialog that **already displays the error "At least one dossier is required" before the
  user has touched anything**, with Continue disabled.
- Evidence: `buttons/dash-newrequest.png`, `buttons/kanban-newitem.png`, `buttons/tasks-newtask.png`.
- Data-vs-wiring: mis-wired route + validation fired on mount.
- Suggested fix: point "New request" at `/intake/new`; only validate after touch/submit.

### F25. Ticket "History" tab is a developer placeholder [severity: P2] [class: devcopy]

- Route: `/intake/tickets/$id` → History
- Observed: the tab renders exactly one line — "**Audit history will be displayed here**".
  The Duplicates tab does work but takes ~20s behind "Checking for duplicates…" before
  settling on "No potential duplicates detected".
- Evidence: `ticket/tab-History.png`, `ticket/dup-long.png`.
- Suggested fix: hide the tab until wired, or render an empty state in product voice.

### F26. Arabic i18n gaps in dates, day-suffixes and plurals [severity: P2] [class: i18n]

- Routes: `/dashboard`, `/tasks`, `/my-work`, `/commitments` (AR)
- Observed: AR dashboard subtitle is "**Sat 15 Aug** · نظرة عامة على المحفظة"; the
  Intelligence Digest keeps "**Fri 08 May 11:44 GST**"; the Overdue Commitments widget
  keeps the English suffix "**271d**" while `/kanban` correctly renders "متأخر 271 يوم"
  — so two components disagree in the same language. AR `/tasks` keeps English deadlines
  ("Fri 31 Jul", "Thu 11 Jun"). Plurals are broken in both languages: "**1 members**" /
  "**1 أعضاء**", "**21 عناصر**" (should be عنصرًا), "**0 عناصر**".
  (Latin digits are intentional per the brief — not reported.)
- Evidence: `ar_dashboard_1440.png`, `ar_tasks_1440.png`, `ar_my-work_1440.png`, `en_my-work_1440.png`.
- Suggested fix: locale-aware date formatter everywhere; i18next plural forms for counts.

### F27. Five different date formats across five work surfaces [severity: P2] [class: design]

- Routes: `/tasks` `Fri 31 Jul` ✔ · `/my-work` `9 months ago` · `/my-work/assignments`
  `4/30/2026, 12:37:38 PM` · `/my-work/intake` `30 Apr 2026` · `/my-work/waiting`
  `Waiting for 106 days` · `/kanban` `Overdue 271d` · `/tasks/escalations` `15 Jul - 15 Aug 2026`
- Observed: only `/tasks` and the task/commitment detail panels follow DESIGN.md
  (`Tue 28 Apr`, `14:30 GST`). Everything else invents its own.
- Evidence: the screenshots named above.
- Suggested fix: one formatter module; ban direct `toLocaleString`/`formatDistance` in views.

### F28. `/tasks/escalations` renders an empty chart box with no empty state [severity: P2] [class: hollow]

- Route: `/tasks/escalations`
- Observed: the "Escalation Timeline" card shows its title and subtitle over ~60px of
  blank space — no chart, no axes, no "no data" message. Its own banner claims
  "Escalations are automatically created when SLA deadlines are breached", yet Total
  Escalations = 0 while `/my-work/assignments` reports **6 SLA Breached** assignments.
- Evidence: `en_tasks_escalations_1440.png`, `en_my-work_assignments_1440.png`.
- Data-vs-wiring: **unsure, because** the auto-escalation job may simply have never run
  in this environment — but the page contradicts itself either way.
- Suggested fix: render an empty state in the timeline card; reconcile the auto-escalation claim.

### F29. Responsive deviations from the documented breakpoint spec [severity: P2] [class: responsive]

- Routes: `/dashboard`, `/kanban`, `/intake/new` at 1024 and 768
- Observed: no horizontal page overflow anywhere and the intake form is clean at both
  widths. But at **1024** the sidebar stays full-width and Review + Done are pushed
  off-screen (the `.board-columns` container does scroll — 1076px content in 720px — but
  there is no visible affordance, so the two columns read as missing). At **768**
  CLAUDE.md specifies "collapse sidebar to icon rail; KPI strip 2×2"; the app instead
  collapses to a hamburger and keeps the KPI strip 4-across.
- Evidence: `en_kanban_1024.png`, `en_dashboard_768.png`, `en_my-work_board_768.png`;
  geometry in `lane-worksurfaces/resp.mjs`.
- Suggested fix: show a scroll affordance/edge fade on the board; reconcile the 768 rules
  with the spec (or update the spec).

### F30. Small copy/label defects [severity: P2] [class: design]

- `/intake/new`: the field label **"SELECT DOSSIER \*"** is uppercase while every other
  label on the form is sentence case — DESIGN.md reserves uppercase for classification
  ribbons, mono labels and table headers. Same form: **"Collaboration Type(Select all
  that apply)"** (missing space). `/commitments`: **"Commitments(2)"** (missing space).
- `/my-work`: the filter search field's magnifier sits **on top of** the placeholder in
  LTR, and in RTL it stays pinned to the left edge — i.e. at the _end_ of the field —
  instead of mirroring to the start.
- Evidence: `en_intake_new_1440.png`, `en_commitments_1440.png`, `en_my-work_1440.png`,
  `ar_my-work_1440.png`.
- Suggested fix: sentence case the label; add the space; position the icon with
  `inset-inline-start` and pad the input with `padding-inline-start`.

---

## Routes that are genuinely fine

- **`/approvals`** — loads clean, honest empty state ("No positions pending your approval",
  0 Pending). Nothing to fix.
- **`/tasks`** — list, tabs, completion strikethrough and row→detail navigation all work;
  correct `Fri 31 Jul` dates. Its only defects are the raw enum subtitles (F14) and the
  unlabeled toggles (F23).
- **`/tasks/$id`** — full detail panel, linked dossier, SLA state, contributors, correct
  date/time format. Only the 200% progress bar (F13) is wrong.
- **`/commitments`** — the one list page whose filters I could prove correct: Pending (2) /
  Overdue (10) / Completed (0) each swap the list properly, and the status chips match.
  (Tab state isn't reflected in the URL, so it isn't linkable — noted, not filed.)
- **`/kanban` for task cards** — drag, optimistic update, server PATCH and reload-persistence
  all work correctly; the Filter and Display popovers both open with real, correct facets.
- **`/my-work` sort + tracking-type filter** — `Sort By` (6 options) and `Tracking Type`
  both write to the URL (`?sortBy=priority&sortOrder=desc`, `?trackingType=sla`) and
  genuinely re-query: SLA returns 11 SLA-only rows, follow-up correctly returns
  "0 items found". These are wired properly.
- **`/my-work/board`, `/intake`, `/intake/queue`** — all three redirect correctly
  (to `/kanban` and `/my-work/intake` respectively). Not broken, but worth knowing that
  three of the routes on the audit list are aliases for two pages.
- **RTL direction handling overall** — `dir="rtl"`, Tajawal, mirrored KPI order, mirrored
  row arrows, no horizontal overflow on any Arabic page at any width I tested. The Arabic
  problems in this lane are translation coverage (F17, F18, F26), not layout.

## Not tested / open ambiguities

- `/my-work/waiting`'s **"Send Reminder"** button — skipped deliberately; it would send a
  real notification. Unverified whether it is wired.
- `/tasks/escalations` sub-tabs (By Unit / By Staff / By Work Type) — not clicked.
- `/notifications` category tabs and "Notification Preferences" — not clicked.
- `/intake/new` requires **both** English _and_ Arabic title and description before submit.
  That may be deliberate bilingual policy, but it blocks any English-only requester —
  flagging as an ambiguity, not a bug.
- `/my-work/assignments`, `/my-work/waiting` and `/tasks/queue` have **no entry point in
  the sidebar or from `/my-work`** — I reached them only by typing the URL. Whether they
  are unreleased or orphaned, I can't tell from the UI.
- The AR label "مستوى الأولوية" (Priority) is used for the EN field "Urgency Level";
  CLAUDE.md treats urgency and priority as distinct enums, so this may be a real
  terminology drift rather than a translation choice.
