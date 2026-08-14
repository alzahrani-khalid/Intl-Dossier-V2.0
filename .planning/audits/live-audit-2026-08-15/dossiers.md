# Lane B: dossiers

Probed against the running app (localhost:5173) with the shared `probe.mjs` plus five
short bespoke Playwright scripts in `mine/` (row-click, compare, tags, export, drawer,
overlap/measure). Session was valid throughout — no re-login needed. Read-only: no code
changed, no migrations, no commits. Supabase MCP was used **read-only** (`select` only) to
separate "no data seeded" from "feature not wired"; that distinction is cited per finding.

Screenshots: `shots/dossiers/*.png`. Raw probe JSON: `json/dossiers/*.json`.

## Routes covered (66 distinct route/tab URLs)

**Hub**

- `/dossiers` — OK (EN 1440/1024/768 + AR) — has F3, F14, F16, F17, F23
- `/dossiers/create` — OK (7 type cards; Elected Official absent → F8)

**Type list pages (EN + AR)**

- `/dossiers/countries` — OK
- `/dossiers/organizations` — OK
- `/dossiers/persons` — **HOLLOW** (F2 drops 1 of 16; F9 no create affordance)
- `/dossiers/persons?page=2` — **HOLLOW** (empty state on page 2 of a 16-row set)
- `/dossiers/forums` — OK
- `/dossiers/topics` — OK
- `/dossiers/working_groups` — OK
- `/dossiers/elected-officials` — OK but **orphaned** (F8)
- `/dossiers/engagements` — **HOLLOW** (F2 shows 3 of 5; F12 raw enums)

**Top-level aliases** — all redirect correctly, all OK

- `/countries` `/organizations` `/persons` `/forums` `/working-groups`

**Create pages (8)** — all render; all HOLLOW-adjacent (F9 unreachable, F15, F18, F19, F24)

- `/dossiers/{countries,organizations,persons,forums,topics,working_groups,elected-officials,engagements}/create`

**Edit**

- `/dossiers/edit/country/$id` — **BROKEN (i18n)** — raw key `regions.Europe` (F25)

**Countries detail — full tab sweep (`d7aee637…`, United Kingdom)**

- `/index` (redirects → overview) OK · `/overview` **HOLLOW** (F5-class, F6) · `/engagements` OK-empty
- `/docs` OK · `/tasks` OK-empty · `/timeline` OK-empty · `/signals` OK-empty · `/digests` OK-empty
- `/positions` OK-empty · `/audit` **HOLLOW** (F7 duplicate of `/timeline`, not in tab bar)

**Organizations detail — full tab sweep (`e0af80a7…`, ONS)**

- `/overview` **HOLLOW** (F6) · `/mous` OK (real data) · `/docs` OK · `/engagements` OK-empty
- `/tasks` `/timeline` `/signals` `/digests` OK-empty · `/audit` **HOLLOW** (F7)

**Other six types — spot-check**

- persons `/overview` **HOLLOW** (F5) · `/engagements` `/docs` `/tasks` `/signals` `/digests` OK-empty
- forums `/overview` OK · `/engagements` OK-empty
- topics `/overview` OK · `/positions` OK (real data)
- working_groups `/overview` OK · `/tasks` OK-empty
- elected-officials `/overview` OK · `/committees` OK-empty · `/engagements` OK-empty
- engagements `/dossiers/engagements/7c0d830b…` **BROKEN** (F1) · `/…/00000000-0000-0052-…`
  **BROKEN** (F1) · `/…/b0000002-…-000000000003` OK

**Cross-cutting**

- `/compare` — OK, works end-to-end (F17 raw UUIDs, F13 dates)
- `/relationships/graph` — **HOLLOW** bare (F21); OK with `?dossierId=`
- `/tags` — Tag Hierarchy OK · **Tag Analytics BROKEN** (F4) · **Tag History HOLLOW** (F4)

---

## Findings

### F1. Engagement dossiers without an `engagement_dossiers` row render a nameless, dataless shell — the 404 is swallowed [severity: P0] [class: broken]

- Route: `/dossiers/engagements/7c0d830b-5dc7-4419-a0ad-ce550031712d` (redirects to
  `/engagements/<id>/overview`), and `/dossiers/engagements/00000000-0000-0052-0000-000000000001`
- Observed: page renders a full engagement chrome — stage rail (Intake…Closed), 8 tabs, KPI
  tiles — but with **no title, no breadcrumb, no name anywhere**. Tiles read `Current Stage --`,
  `Days in Stage 0`, `Task Progress 0%`, `Deadline --`. No error message, no `role="alert"`,
  no empty state. The user sees a working-looking page about nothing.
- Evidence: `shots/dossiers/en_dossiers_engagements_7c0d830b-5dc7-4419-a0ad-ce550031712d_1440.png`;
  `404 GET .../functions/v1/engagement-dossiers/7c0d830b-…`. Re-probed on a second
  engagement (`00000000-0000-0052-…`) → identical 404 + identical nameless shell.
  `json/dossiers/eng_detail.json`, `json/dossiers/eng_reverify.json`
- Reachable from the primary UI: the `/dossiers` hub lists "Bilateral engagement with ONS —
  census methodology exchange"; its quick-look modal's **View Dossier** button lands here
  (`shots/dossiers/hub_drawer_broken_engagement.png`).
- Data-vs-wiring: **both, and the wiring half is the bug.** `dossiers` has 5 rows of
  `type='engagement'`; `engagement_dossiers` has only 3. The missing extension rows are a data
  gap, but the page treating a 404 as "render an empty shell" is a wiring defect — a dossier
  the app itself links to must not render anonymously.
- Suggested fix (1 line): on a 404 from `engagement-dossiers`, render a not-found/degraded
  state (with the `dossiers.name_en` the hub already has) instead of an empty shell.

### F2. Type list pages silently drop dossiers that lack an extension row, while the hub counts them [severity: P1] [class: hollow]

- Routes: `/dossiers/persons`, `/dossiers/persons?page=2`, `/dossiers/engagements`, `/dossiers`
- Observed:
  - Hub "Person" card says **16** active; `/dossiers/persons` renders **15** cards. Missing:
    "Test ONS Contact — Intl Relations Director". `?page=2` renders the **"No persons yet"**
    empty state, so the 16th row is unreachable through the UI entirely.
  - Hub "Engagement" card says **5** active; `/dossiers/engagements` renders **3**.
  - Same screen, three totals: chip `43 items`, banner `1 results hidden by filters (44 total)`,
    footer `Showing 1 to 12 of …`.
- Evidence: `shots/dossiers/en_dossiers_1440.png` (16 / 5), `shots/dossiers/en_dossiers_persons_1440.png`
  (15 cards), `shots/dossiers/en_dossiers_engagements_1440.png` (3 rows),
  `json/dossiers/persons_p2.json` (`headings: ["Key Contacts","No persons yet"]`)
- Data-vs-wiring: **feature not wired.** Verified in the DB: `dossiers` has 16 `type='person'`
  rows, all `status='active'`, all sensitivity 1–2 (so not clearance-gated); exactly one
  (`87e23aad…`) has no matching `persons` row. Identical shape for engagements (5 vs 3
  `engagement_dossiers`). The list query inner-joins the extension table; the hub counter
  does not. Note the _detail_ page for the orphan person renders fine
  (`json/dossiers/orphan_person.json`) — only the list drops it.
- Suggested fix (1 line): left-join the extension table in the type-list query (or make the
  hub counter use the same join) so counts and rows cannot disagree.

### F3. Hub "Export Dossiers" fails with `[object Object]` shown to the user, twice [severity: P1] [class: broken + devcopy]

- Route: `/dossiers` → **Export Dossiers** → **Export**
- Observed: toast reads **"Export Failed / [object Object]"**; the in-dialog progress row reads
  **"[object Object] 0%"**. No file downloads, the dialog stays open. Backend returns
  `401` from the `data-export` edge function. Re-run twice — identical both times.
- Evidence: `shots/dossiers/hub_export_after.png`;
  `401 https://…supabase.co/functions/v1/data-export`
- Data-vs-wiring: **feature not wired** (auth failure on the edge function) _and_ an error-handling
  bug — an Error object is being string-concatenated into user copy. Every other request on the
  page authenticates fine, so this is specific to `data-export`, not a stale session.
- Suggested fix (1 line): fix the `data-export` function's auth, and render `err.message`
  (with a generic fallback) rather than the raw object.

### F4. `/tags` → Tag Analytics is permanently "Failed to load tags"; Refresh is a no-op; Tag History can never show anything [severity: P1] [class: hollow]

- Route: `/tags` (Tag Analytics tab, Tag History tab)
- Observed: Tag Analytics renders a red error icon + **"Failed to load tags"** + a **Refresh**
  button, forever — waited 6s and 15s, clicked Refresh, no change. Zero failed network requests
  (`badRequests: []`), so nothing actually failed. Its sibling Tag Hierarchy loads 13 tags fine.
  Tag History shows "No history available" under both Merge and Rename.
- Evidence: `shots/dossiers/tags_Tag_Analytics.png`, `shots/dossiers/tags_Tag_History.png`;
  `json/dossiers/tags_analytics.json`
- Data-vs-wiring: **feature not wired — confirmed in source.**
  `frontend/src/domains/tags/hooks/useTagHierarchy.ts:144` — `useTagAnalytics` is a stub
  (`queryFn: () => Promise.resolve({ totalTags: 0, categories: [], usage: [] })`). The component
  reads `analytics.data`, gets `undefined`, so `stats` is `null` and
  `TagAnalytics.tsx:167` (`if (error || !stats)`) renders `errors.loadFailed` — **a false error
  for a query that succeeded.** `useRefreshTagAnalytics` (:152) resolves nothing;
  `useTagMergeHistory` (:101) and `useTagRenameHistory` (:109) both resolve `[]`;
  `useMergeTags` (:165) resolves its own params without calling anything — so a tag merge would
  report success and do nothing.
- Suggested fix (1 line): hide the Tag Analytics/History tabs and the merge action behind a
  feature flag until the repository calls exist, rather than shipping a stub that lies about failing.

### F5. A person's own Profile card reads "-" for data the app already renders on two other screens [severity: P1] [class: hollow]

- Route: `/dossiers/persons/10b47a54-a235-4228-89a2-c80f03c102af/overview`
- Observed: Profile card shows `Organization: -`, `Role / Title: -`; Analytics shows
  `Affiliations 0`; Summary shows `No data available`. Yet the **same** person renders as
  "Head of International Partnerships - Office for National Statistics" under **Key
  Representatives** on `/dossiers/organizations/e0af80a7…/overview`, and the persons list card
  shows "Head of International Partnerships · Office for Nationa…".
- Evidence: `json/dossiers/ov_persons.json` vs `json/dossiers/o_overview.json`;
  `shots/dossiers/en_dossiers_persons_1440.png`
- Data-vs-wiring: **feature not wired.** The affiliation data demonstrably exists and is read
  by two other components; the person overview's Profile card just doesn't query it.
- Suggested fix (1 line): point the person Profile card at the same affiliation source the
  organization's Key Representatives widget uses.

### F6. Overview "Recent Activity: N" counter contradicts the Recent Activity panel and the Timeline tab on the same dossier [severity: P1] [class: hollow]

- Routes: `/dossiers/countries/d7aee637…/overview`, `/dossiers/organizations/e0af80a7…/overview`
- Observed: UK Summary card says **`Recent Activity  1`**, the Recent Activity panel two rows
  below says **"No recent activity"**, and the Timeline tab says **"0 · No activities found for
  this dossier"**. ONS says **`Recent Activity  2`** with the same "No recent activity" panel.
  Verified on two different dossiers of two different types.
- Evidence: `shots/dossiers/en_dossiers_countries_d7aee637-9c81-4c78-8c21-bcfc5d11d379_overview_1440.png`;
  `json/dossiers/o_overview.json`; `json/dossiers/c_timeline.json`
- Data-vs-wiring: **feature not wired.** Counter and panel read different sources; at most one
  can be right. (Related, same card: UK shows `Linked Dossiers 1` alongside `Bilateral Partners 0`
  for its single ONS relationship.)
- Suggested fix (1 line): back the Summary counter with the same query the Recent Activity
  panel and Timeline tab use.

### F7. `/$id/audit` is a byte-identical duplicate of `/$id/timeline` on all 7 dossier types [severity: P1] [class: hollow]

- Routes: `/dossiers/{countries,organizations,persons,forums,topics,working_groups,elected-officials}/$id/audit`
- Observed: rendered page text is **identical** to the `/timeline` sibling — `diff` of the two
  probes' full page text returns nothing. Both show "Activity Timeline / 0 / Refresh / No
  activities found for this dossier". `audit` is also **absent from the tab bar**, so the route
  is reachable only by typing the URL.
- Evidence: `diff json/dossiers/o_timeline.json json/dossiers/o_audit.json` → IDENTICAL.
  Source: every `$id/audit.tsx` renders `<DossierActivityTimeline dossierId={id} />` with the
  same props as `$id/timeline.tsx`; only the doc comment differs.
- Data-vs-wiring: **feature not wired.** `DossierTabNav.tsx:45-47` still says _"every dossier
  audit route is a coming-soon stub"_ — that comment is now stale; the routes silently serve the
  timeline instead. An audit trail that is actually the activity feed is worse than an absent one.
- Suggested fix (1 line): delete the `$id/audit.tsx` routes, or point them at the real
  `audit_logs` reader that `/audit-logs` already uses.

### F8. Elected Officials is an orphaned feature — reachable only by typing the URL [severity: P1] [class: hollow]

- Routes: `/dossiers/elected-officials`, `/dossiers/elected-officials/create`,
  `/dossiers/elected-officials/$id/*`
- Observed: the whole surface works (list renders Sen. Maria Vergara, Office Information and
  Committees tabs render), but there is **no entry point**: not in the sidebar (Countries,
  Organizations, People, Forums, Topics, Working Groups only), not among the 7 "Browse by Type"
  cards on `/dossiers`, not among the 7 cards on `/dossiers/create`, not among the 7 types in
  `/compare`'s picker.
- Evidence: `shots/dossiers/en_dossiers_elected-officials_1440.png` (works);
  `shots/dossiers/en_dossiers_1440.png` (7 cards, no Elected Official);
  `json/dossiers/dcreate.json` headings; `mine/compare.mjs` output (7 options)
- Data-vs-wiring: **feature not wired.** CLAUDE.md declares 8 dossier types; the UI exposes 7.
  Note the underlying model is `persons.person_subtype='elected_official'` (verified in DB) —
  so Sen. Vergara correctly appears in _both_ People and Elected Officials; the type is real,
  only its navigation is missing.
- Suggested fix (1 line): add Elected Officials to the sidebar Dossiers group and to the
  hub/create/compare type lists.

### F9. Seven of eight type list pages have no way to create anything [severity: P1] [class: hollow]

- Routes: `/dossiers/{countries,organizations,persons,forums,topics,working_groups,engagements}`
- Observed: those seven pages expose only Search / Filter / Display. `/dossiers/<type>/create`
  exists and renders fine for all eight types, but only `/dossiers/elected-officials` links to
  its create page ("Add Elected Official"). The persons create CTA exists **only inside the
  empty state** — visible on `?page=2` ("Add person") and invisible on page 1, i.e. once you
  have data you can no longer add more from this screen.
- Evidence: `json/dossiers/list_*.json` `links` arrays (only `list_elected-officials.json`
  contains `/dossiers/…/create`); `json/dossiers/persons_p2.json` text contains "Add person"
- Data-vs-wiring: **feature not wired.** The routes exist; the affordance doesn't. (`/dossiers`
  "Create New" → `/dossiers/create` is the only working path, and it omits Elected Official.)
- Suggested fix (1 line): add the same primary "Create" button the Elected Officials list has
  to the other seven list headers.

### F10. Arabic hub: "% of total active dossiers" is untranslated on all seven type cards [severity: P1] [class: i18n]

- Route: `/dossiers` with `--lang ar`
- Observed: every "Browse by Type" card renders the English string `% of total active dossiers`
  in the middle of an otherwise fully-Arabic page (title, card names, نشط/غير نشط, sidebar all
  translated). Seven occurrences on one screen.
- Evidence: `shots/dossiers/ar_dossiers_1440.png`
- Data-vs-wiring: **feature not wired** — the string never goes through i18n (or its `ar` key
  is missing, which per `frontend/CLAUDE.md` silently falls back to English).
- Suggested fix (1 line): move that label into the dossiers namespace and add the `ar` key.

### F11. Arabic: dates and engagement type/status stay in English on list rows [severity: P1] [class: i18n]

- Routes: `/dossiers/engagements` and `/dossiers/countries`, both `--lang ar`
- Observed: Arabic engagement rows read
  `Sun 05 Jul 18:00 GST · travel · scheduled · الرياض · فندق ريتز كارلتون` — the weekday, month,
  engagement type and status are all English inside an Arabic sentence. The Arabic countries
  table shows `Mon 06 Jul`, `Fri 12 Jun`, `Thu 30 Apr` under "آخر تحديث". (Latin _digits_ are
  the project's deliberate choice and are not the complaint — the English _words_ are.)
- Evidence: `shots/dossiers/ar_dossiers_engagements_1440.png`,
  `shots/dossiers/ar_dossiers_countries_1440.png`
- Data-vs-wiring: **feature not wired.** The date formatter isn't locale-aware, and the enum
  labels aren't translated (see F12 — they aren't humanised in English either).
- Suggested fix (1 line): route weekday/month through the locale-aware formatter and add
  `ar` labels for `engagement_type` / `engagement_status`.

### F12. Raw database enum values shipped as user copy in English too [severity: P2] [class: devcopy]

- Route: `/dossiers/engagements`
- Observed: rows read `Sat 04 Jul 01:00 GST · meeting · in_progress · Riyadh · GASTAT HQ, Room 4C`.
  `in_progress` is a raw snake_case enum. The section header reads `WEEK OF 2026-W27` — an ISO
  week token, machine-facing, and under Arabic bidi it visually reorders to `W27-2026`.
- Evidence: `shots/dossiers/en_dossiers_engagements_1440.png`,
  `shots/dossiers/ar_dossiers_engagements_1440.png`
- Data-vs-wiring: **feature not wired** — no display mapping for the enum.
- Suggested fix (1 line): map `engagement_status`/`engagement_type` to sentence-case labels and
  render the week header as a date range.

### F13. Three different date formats across dossier surfaces; one violates DESIGN.md outright [severity: P2] [class: design]

- Routes: list pages · `/dossiers/countries/$id/docs` + `/dossiers/organizations/$id/mous` ·
  `/dossiers/elected-officials/$id/overview` · `/compare`
- Observed: list pages use `Mon 06 Jul` (correct per DESIGN.md). Docs/MoUs/compare use
  `06 Jul 2026`, `24 Jan 2022`, `29 Jun 2026` (no weekday, year appended). Elected-official
  Office Information uses **`Jun 30, 2025`** — month-first with a comma, which DESIGN.md's
  "Dates: `Tue 28 Apr` (day-first, no comma)" rule explicitly excludes.
- Evidence: `json/dossiers/c_docs.json`, `json/dossiers/o_mous.json`, `json/dossiers/ov_eo.json`,
  `mine/compare2.mjs` output
- Data-vs-wiring: n/a — formatting inconsistency.
- Suggested fix (1 line): route every date through one shared formatter.

### F14. Search icon renders on top of the placeholder text on the dossier hub [severity: P2] [class: design]

- Route: `/dossiers` (Saved Views search panel, below the fold)
- Observed: reads `S⌕earch dossiers...` — the magnifier glyph sits over the second character.
  Measured: input at `x=317` with `padding-inline-start: 10px` (text starts ≈327) while the
  absolutely-positioned 16×16 icon sits at `x=333, y=847` — squarely inside the text run.
- Evidence: `shots/dossiers/hub_search_zoom.png` (clipped crop), `shots/dossiers/en_dossiers_1440.png`,
  `mine/overlap.mjs` measurements
- Data-vs-wiring: n/a — CSS bug.
- Suggested fix (1 line): give that input `ps-9` instead of `padding-inline-start: 10px`.

### F15. Half the form labels are uppercase-transformed and half are sentence case, side by side in the same row [severity: P2] [class: design]

- Routes: all 8 `/dossiers/<type>/create`, `/dossiers/edit/$type/$id`, the hub Export dialog
- Observed: on `/dossiers/persons/create`, `FIRST NAME (ENGLISH)` sits directly beside
  `Last name (English) *` in the same grid row. Computed styles confirm two different label
  components: `text-transform: uppercase` on Abbreviation / Description (English) / Description
  (Arabic) / Tags, `none` on Name (English) / Last name. The transform also hits placeholder
  text — the Abbreviation field reads `E.G., WDF, WHO, SDGS`. The Export dialog uppercases its
  option chips too (`EXCEL (XLSX)`, `CSV (COMMA-SEPARATED)`, `INCLUDE TEMPLATE HEADERS`).
- Evidence: `shots/dossiers/en_dossiers_persons_create_1440.png`,
  `shots/dossiers/en_dossiers_countries_create_768.png`, `shots/dossiers/hub_export_after.png`,
  `mine/measure.mjs` computed-style dump
- Data-vs-wiring: n/a. DESIGN.md: "UPPERCASE only for classification ribbons, mono labels, and
  table-column headers" — form field labels and option chips are neither.
- Suggested fix (1 line): standardise on one field-label component in sentence case.

### F16. Plural bugs in user copy: "1 months ago", "1 results hidden" [severity: P2] [class: devcopy]

- Route: `/dossiers`
- Observed: dossier cards read `1 months ago` (appears on most cards — UK, ONS, the persons);
  the filter banner reads `1 results hidden by filters (44 total)`.
- Evidence: `shots/dossiers/hub_drawer_broken_engagement.png` (three "1 months ago" visible in
  one frame), `json/dossiers/dossiers.json` text
- Data-vs-wiring: n/a — missing i18n plural rule (`_one`/`_other`).
- Suggested fix (1 line): use i18next plural keys for the relative-time and filter-count strings.

### F17. Raw UUIDs surfaced as user-facing fields [severity: P2] [class: devcopy]

- Routes: `/dossiers` quick-look modal · `/compare`
- Observed: the quick-look modal shows a labelled field **`Dossier ID  7c0d830b-5dc7-4419-a0ad-ce550031712d`**.
  `/compare`'s table has an **ID** row of UUIDs and a **Created By** row that shows
  `de2734cf-f962-4e05-bf62-bc9e92efff96` instead of a person's name.
- Evidence: `shots/dossiers/hub_drawer_broken_engagement.png`, `mine/compare2.mjs` output
- Data-vs-wiring: **feature not wired** for Created By (the users table is joinable); the
  Dossier ID row is a deliberate-looking but dev-facing choice.
- Suggested fix (1 line): drop the ID rows and resolve `created_by`/`updated_by` to display names.

### F18. `role="alert"` on every create-form info hint, and absent from the one real error [severity: P2] [class: a11y]

- Routes: all 8 `/dossiers/<type>/create`, `/dossiers/edit/$type/$id`, `/tags`
- Observed: each create/edit wizard emits `role="alert"` for a purely informational hint —
  "Tell us about the country — official names and a short description." Screen readers announce
  these as urgent interruptions on page load. Meanwhile `/tags` → Tag Analytics' genuine
  **"Failed to load tags"** has **no** `role="alert"` at all (probe `alerts: []`).
- Evidence: `json/dossiers/cr_*.json` `alerts` arrays (8/8 contain the hint);
  `json/dossiers/tags_analytics.json` `alerts: []`
- Data-vs-wiring: n/a. Secondary note: "Tell us about…" is conversational second-person, which
  sits oddly against DESIGN.md's voice rules.
- Suggested fix (1 line): swap the hints to `role="note"` (or no role) and add `role="alert"`
  to the error states.

### F19. Create/edit wizard heading is 264px out of alignment with the form it labels [severity: P2] [class: responsive]

- Routes: all `/dossiers/<type>/create`, `/dossiers/edit/$type/$id`, at 1440px
- Observed: "New Country Dossier" / "Create Person" and the "Back to …" link are flush-left at
  `x=280`, while the wizard card is a fixed 608px centered at `x=544`. At 1440 that leaves a
  264px gap between the heading and the content it heads; at 1024 it's 56px; at 768 the card
  goes full-width and the layout reads correctly.
- Evidence: `mine/measure.mjs` — 1440: `title{x:280,w:1136} card{x:544,w:608}`; 1024:
  `card{x:336,w:608}`; 768: `card{x:72,w:624}`. Screenshots
  `en_dossiers_persons_create_1440.png` vs `en_dossiers_countries_create_768.png`
- Data-vs-wiring: n/a — layout. No horizontal overflow at any width; this is alignment only.
- Suggested fix (1 line): put the heading and back-link inside the same centered max-width
  container as the wizard card.

### F20. "Draft restored from your previous session" fires over a completely empty form [severity: P2] [class: hollow]

- Routes: `/dossiers/persons/create`, `/dossiers/elected-officials/create` (only these two)
- Observed: a warning banner claims a draft was restored, but every field below it is blank —
  Honorific unset, all name fields empty. Reproduced in a fresh browser context that had never
  visited these pages. The other six create pages show no banner.
- Evidence: `shots/dossiers/en_dossiers_persons_create_1440.png`; `json/dossiers/cr_*.json`
  (grep "Draft restored" → persons 1, elected-officials 1, others 0)
- Data-vs-wiring: **unsure, because** I can't tell whether an empty draft object was persisted
  earlier by the session that minted `storageState.json`, or whether the restore itself fails
  and only the banner fires. Either way the user-visible behaviour is wrong: the banner asserts
  something that visibly didn't happen.
- Suggested fix (1 line): only show the banner when the restored draft has at least one
  non-empty field.

### F21. Command palette's "view network" lands on a dead-end page [severity: P2] [class: hollow]

- Route: `/relationships/graph` (no params)
- Observed: renders only "No dossier selected. Please select a dossier to view its relationship
  graph." + a "Browse dossiers" link — no dossier picker on the page itself. With
  `?dossierId=<id>` the same route renders a working "Relationship graph".
- Evidence: `json/dossiers/relgraph.json` (478 chars, no headings) vs
  `json/dossiers/relgraph_p.json` (919 chars, heading "Relationship graph"). Source:
  `components/keyboard-shortcuts/CommandPalette.tsx:794` → `navigateTo('/relationships/graph')`
  with no dossierId, while `MiniRelationshipGraph.tsx:724` correctly passes `search={{dossierId}}`.
- Data-vs-wiring: **feature not wired** — a shipped command with no argument reaches a page
  that cannot function without one.
- Suggested fix (1 line): give the bare route a dossier picker, or have the palette command
  pass the currently-open dossier.

### F22. Dossier rows and cards are not links — no href, no open-in-new-tab [severity: P2] [class: a11y]

- Routes: all 8 `/dossiers/<type>` list pages
- Observed: the probe's `links` array on every list page contains only nav/sidebar hrefs — zero
  detail-page hrefs. Rows/cards navigate via JS click, opening the quick-look drawer
  (`?dossier=<id>&dossierType=<type>`). Middle-click, ⌘-click, "Copy link address" and
  link-role keyboard semantics are all unavailable on the primary list interaction of the app.
- Evidence: `json/dossiers/list_*.json` `links` arrays; `mine/rowclick.mjs` (clicking a row
  yields `?dossier=…`, never a route change)
- Data-vs-wiring: n/a — interaction design. The deep-link params are whitelisted in
  `_protected.tsx`, so the URL is shareable once opened; it just isn't reachable as a link.
- Suggested fix (1 line): wrap the row's title in an `<a href>` to the detail route while
  keeping the click-to-drawer behaviour.

### F23. The quick-look modal's close button sits on top of the top bar's "Tweaks" control [severity: P2] [class: design]

- Route: `/dossiers` (any card → quick-look)
- Observed: the ✕ renders at the viewport's top-right corner (`x≈1404, y≈36`), detached from the
  modal (which spans x 384–1056) and overlapping the "Tweaks" button, which is clipped to "Twe".
- Evidence: `shots/dossiers/hub_drawer_broken_engagement.png`
- Data-vs-wiring: n/a — z-index/positioning.
- Suggested fix (1 line): anchor the close button to the modal's own top-right, not the viewport.

### F24. Create-page titles use two competing patterns [severity: P2] [class: design]

- Routes: the 8 `/dossiers/<type>/create` pages
- Observed: "New Country Dossier", "New Forum Dossier", "New Working Group Dossier", "New
  Engagement Dossier" vs "Create Organization", "Create Person", "Create Topic", "Create
  Elected Official" — 4 and 4.
- Evidence: `json/dossiers/cr_*.json` headings
- Data-vs-wiring: n/a — copy.
- Suggested fix (1 line): pick one ("Create <type>") and apply it to all eight.

### F25. Raw i18n key `regions.Europe` rendered in the dossier edit wizard's Review step [severity: P1] [class: i18n]

- Route: `/dossiers/edit/country/d7aee637-9c81-4c78-8c21-bcfc5d11d379`
- Observed: the Review step's summary list shows the literal string **`regions.Europe`** where
  the region name belongs. Confirmed visible (not a hidden option): a leaf `<dd class="text-sm
text-foreground">` at `x=561, y=1586`, `281×17px`. The Country Details _select_ renders the
  region names correctly ("Asia, Africa, Europe, …") — only the review summary leaks the key.
- Evidence: `json/dossiers/dedit.json` `i18nKeyLeaks: ["regions.Europe"]`;
  `mine/findleak.mjs` DOM position dump
- Data-vs-wiring: **feature not wired** — the review renderer prints the raw key instead of
  calling `t()` (or uses the dot form against the wrong namespace, per `frontend/CLAUDE.md`'s
  colon-separator gotcha).
- Suggested fix (1 line): resolve the region through the same `t()` call the select uses.

---

## Verified as **resolved**: the "generic overview" issue named in the brief

The brief flagged a prior known issue — dossier overview tabs reading generic data while richer
sections sit unused. **That is no longer true.** Every one of the 8 types now renders
type-specific overview sections, verified live:

| Type             | Type-specific overview sections observed                                   |
| ---------------- | -------------------------------------------------------------------------- |
| country          | Bilateral Summary, Key Contacts, Engagements by Stage                      |
| organization     | Membership Structure, Key Representatives, GASTAT focal points, MoU Status |
| person           | Profile, Engagement History                                                |
| forum            | Forum Details, Sessions                                                    |
| topic            | Connected Anchors, Position Tracker                                        |
| working_group    | Members, Upcoming Meetings, Deliverables                                   |
| elected_official | Office Information, Committee Assignments                                  |
| engagement       | stage rail, Participants, Quick Actions                                    |

Several of these read real data (ONS Key Representatives lists 3 people; MoU Status shows the
GASTAT–ONS agreement; topics/positions shows a real attached position; elected-official Office
Information shows chamber/party/term). The residual gaps are narrower and are filed as F5
(person Profile not reading affiliations that other widgets read) and F6 (counter vs panel).

## Routes that are genuinely fine

These render correctly, read real data where it exists, and I found nothing to file against them:

- `/dossiers` at 1024 and 768 — sidebar collapses to a rail as specified, no overflow at any width
- `/dossiers/countries`, `/dossiers/organizations`, `/dossiers/forums`, `/dossiers/topics`,
  `/dossiers/working_groups` — all render complete row sets matching the DB, EN and AR
- All five top-level aliases (`/countries` `/organizations` `/persons` `/forums`
  `/working-groups`) redirect to their canonical `/dossiers/<type>` route
- `/dossiers/create` — 7 type cards, navigates correctly (F8 aside)
- `/dossiers/organizations/$id/mous` and `/docs` — real MoU data, filter chips work
- `/dossiers/topics/$id/positions` — real attached position
- `/dossiers/countries/$id/positions`, `/signals`, `/digests` — honest, well-written empty
  states with working filter controls; these are **no data seeded**, not broken
- `/compare` — works end-to-end: type picker → entity picker → 18-field diff table with a
  similarity score, `?type=&ids=` deep-links correctly (F17/F13 aside)
- `/tags` Tag Hierarchy tab — loads 13 tags, expand/collapse and per-tag menus present
- `/relationships/graph?dossierId=<id>` — renders the graph
- `/dossiers` Import Dossiers dialog — opens with format guidance and a template download
- Arabic across all 8 list pages — `dir="rtl"`, `<html lang="ar">`, Tajawal applied, layout
  correctly mirrored (tables, sidebar, chips), **zero horizontal overflow** at 1440, no raw
  i18n key leaks. The Arabic issues I found (F10, F11) are missing translations, not RTL breakage.

## Ambiguities recorded, not resolved

1. **F20** — cannot distinguish "an empty draft was persisted by the session that minted
   `storageState.json`" from "the restore silently fails and only the banner fires."
2. **Engagement links on dossiers** — every dossier's Engagements tab is empty. In the DB all
   three `engagement_dossiers` rows have `host_country_id` and `host_organization_id` NULL, so
   this is most likely **no data seeded**; I could not prove the tab's query is correct without
   seeding, which is out of scope for a read-only audit.
3. **Countries list "Engagements: 0"** for every country — same root as (2); unverified whether
   the column reads a denormalised `engagement_count` or a live join.
4. **`data-export` 401 (F3)** — the 401's cause is server-side; I observed it but did not read
   the edge function's auth code, so I can't say whether it's the known bare-`getUser()` class
   of failure or a missing deploy.
