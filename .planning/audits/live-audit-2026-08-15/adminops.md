# Lane D: adminops

Screenshots live under `<scratchpad>/shots/adminops/`. Raw probe JSON under
`<scratchpad>/json/adminops/`. All paths below are relative to `<scratchpad>/`.

**Session note:** the shared `storageState.json` expired partway through my run
(Supabase rotated the refresh token, `refresh_token_not_found` → redirect to
`/login`); the orchestrator has since re-minted it. No finding in this report was
ever based on a logged-out page — the only probe that returned `url: /login` was
the check that _detected_ the expiry, and it is not cited anywhere. After the
re-mint I re-ran the five HTTP-level P0s against a brand-new session and **all five
reproduce byte-identically** (F1 401×2, F2 401×1 and 401×6, F4 404, F6 500), as do
the two mutation P0s (F3 23502, F5 400). These are defects, not session artifacts.
The re-mint also let me finish the one test the expiry cut short — see F19, which
is now a considerably worse finding than it first appeared.

## Routes covered (44: 35 EN + 9 AR)

| Route                       | Verdict                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`                    | OK — 302 to `/admin/ai-settings`                                                                                                                  |
| `/admin/ai-settings`        | OK (verified save + reload persists)                                                                                                              |
| `/admin/ai-usage`           | OK — no data seeded (`ai_interaction_logs` = 0 rows)                                                                                              |
| `/admin/approvals`          | OK — no data seeded (0 positions in review); orphan route                                                                                         |
| `/admin/data-retention`     | **BROKEN** — 6× 401, rendered as "no data" (F2)                                                                                                   |
| `/admin/field-permissions`  | **BROKEN** — 2× 401, hides 19 real rows (F1)                                                                                                      |
| `/admin/preview-layouts`    | OK; orphan route                                                                                                                                  |
| `/admin/system`             | OK (invisible icon, F17)                                                                                                                          |
| `/settings`                 | **BROKEN** — every tab's Save 400s (F3)                                                                                                           |
| `/settings/notifications`   | HOLLOW — persists correctly, but no nav chrome (F8) + 32 unlabeled switches (F15)                                                                 |
| `/settings/integrations`    | OK; no nav chrome (F8)                                                                                                                            |
| `/settings/webhooks`        | HOLLOW — bare shell, no nav chrome (F8)                                                                                                           |
| `/settings/email-digest`    | OK (verified persists); no nav chrome (F8)                                                                                                        |
| `/settings/calendar-sync`   | OK — no data seeded; no nav chrome (F8)                                                                                                           |
| `/users`                    | HOLLOW — 415 rows, ~all test fixtures; Last Login never written (F12, F13)                                                                        |
| `/users/create`             | OK (form renders; submit not exercised — would write real records)                                                                                |
| `/users/<realId>`           | OK                                                                                                                                                |
| `/analytics`                | **HOLLOW** — backend endpoint does not exist (F4)                                                                                                 |
| `/reports`                  | **BROKEN** — Generate 400s on a field-name mismatch, silently (F5)                                                                                |
| `/reports/scheduled`        | **HOLLOW** — required dropdown 500s, schedule uncreatable (F6)                                                                                    |
| `/reports/<id>`             | HOLLOW + layout collapse at 1440 and 1024 (F14)                                                                                                   |
| `/audit-logs`               | **BROKEN** — 401 "Invalid user session" (F2)                                                                                                      |
| `/monitoring`               | **BROKEN** — dead route, raw JSON 404 (F7)                                                                                                        |
| `/sla-monitoring`           | HOLLOW — renders `nullm`; false "Critical" (F16)                                                                                                  |
| `/intelligence`             | OK — Reports/Signals/Digests/Alerts all distinct and wired                                                                                        |
| `/legislation`              | OK — no data seeded (`legislations` = 0 rows); orphan route                                                                                       |
| `/legislation/<id>`         | **BROKEN** — child route is dead, renders the list (F9)                                                                                           |
| `/data-library`             | OK — no data seeded                                                                                                                               |
| `/geographic-visualization` | HOLLOW — country names can never resolve (F10); orphan                                                                                            |
| `/stakeholder-influence`    | HOLLOW — empty card shells + undefined query (F11); orphan                                                                                        |
| `/workflow-automation`      | OK — no data seeded (`workflow_rules` = 0 rows); orphan                                                                                           |
| `/custom-dashboard`         | HOLLOW — dead chart + 400 on events + fake deltas (F18); orphan                                                                                   |
| `/word-assistant`           | **HOLLOW** — no AI at all; echoes the prompt back (F19)                                                                                           |
| `/help`                     | OK — 5 of 6 guides "Coming Soon"; marketing voice (F20); invisible icons (F17)                                                                    |
| `/help/commitments`         | OK — documents the wrong priority enum (F21)                                                                                                      |
| **AR (`--lang ar`)**        | `/admin/ai-settings`, `/settings`, `/settings/notifications`, `/users`, `/analytics`, `/audit-logs`, `/admin/data-retention`, `/reports`, `/help` |

Arabic verdict up front: RTL is in **good** shape on this lane. All 9 AR routes
returned `dir=rtl`, `bodyFont: Tajawal`, zero raw-i18n-key leaks, zero horizontal
overflow, and correct mirroring (nav, chevrons, switch knobs, textarea grip). I
checked four suspected RTL defects by DOM measurement and all four were false
alarms; they are not reported. Only two real i18n issues survived (F22, F23).

---

## Findings

### F1. Field Permissions reports "0 permissions" while 19 real rules exist — the 401 is swallowed [severity: P0] [class: broken]

- Route: `/admin/field-permissions`
- Observed: page shows `0 Permissions / 0 Active / 0 Role / 0 User / 0 Restricted`
  and the empty state "No permission rules configured". Both API calls return 401.
  The database has **19 rows** in `public.field_permissions` (and 19 in
  `resolved_field_permissions`). The admin is told access control is unconfigured
  when it is in fact configured — the most dangerous possible failure mode for
  this page.
- Evidence: `shots/adminops/en_admin_field-permissions_1440.png`;
  `401 GET .../functions/v1/field-permissions` and
  `401 GET .../functions/v1/field-permissions/audit?limit=50`;
  `select count(*) from public.field_permissions` → 19.
- Data-vs-wiring: **feature not wired** (auth), and the data definitely exists.
- Suggested fix (1 line): fix the edge-function auth (see F2) and render a real
  error state instead of the empty state when the query rejects.

### F2. Three admin pages 401 because their edge functions use `supabase-js@2.39.0` + bare `getUser()` [severity: P0] [class: broken]

- Route: `/audit-logs`, `/admin/data-retention`, `/admin/field-permissions`
- Observed: 9 distinct 401s with a valid session. `/audit-logs` at least says
  "Error Loading Audit Logs / Invalid user session"; the other two swallow it and
  show friendly zeros — so Data Retention shows `0 Active Policies / 0 Legal Holds`
  next to a live **"Run Processor"** button. Reproduced identically in EN and AR.
  Root cause is the known pattern: the pinned old client sends the JWT as a global
  header but `getUser()` is called with no argument, so it never validates.
  `supabase/functions/audit-logs-viewer/index.ts:21,385`,
  `data-retention/index.ts:2,91`, `field-permissions/index.ts:2,179`.
  **This is systemic, not three bugs: 133 of 303 edge functions still pin
  `supabase-js@2.3x`** (`grep -l "supabase-js@2\.3" supabase/functions/*/index.ts | wc -l`).
- Evidence: `shots/adminops/en_audit-logs_1440.png`,
  `en_admin_data-retention_1440.png`, `ar_admin_data-retention_1440.png`;
  direct curl with a fresh token → `{"error":"Invalid user session","code":"AUTH_REQUIRED"}` HTTP 401.
- Data-vs-wiring: **feature not wired**. (`audit_log` is separately empty — 0 rows
  — so audit-logs would show an empty table even once auth is fixed.)
- Suggested fix (1 line): move these functions to `@supabase/supabase-js@2` and
  `getUser(token)`, then sweep the remaining 130 pinned functions.

### F3. Every tab of `/settings` fails to save — upsert into `users` omits the NOT NULL `email` [severity: P0] [class: broken]

- Route: `/settings` (Profile, General, Appearance, Notifications, Access & Security, Accessibility, Data & Privacy)
- Observed: change anything, click "Save Changes" → toast **"Failed to save settings"**,
  nothing persists. The request is
  `POST /rest/v1/users {"id":…,"full_name":…,"job_title_en":…,"department":…,"phone":…,"avatar_url":null,"language_preference":"en","timezone":"UTC","updated_at":…}`
  → `400 {"code":"23502","message":"null value in column \"email\" of relation \"users\" violates not-null constraint"}`.
  `.upsert()` issues an INSERT…ON CONFLICT, so PostgREST must satisfy NOT NULL on
  `email` (and `username`), which the payload never sends. Verified on three tabs
  (Profile via the phone field, Notifications via a toggle, Accessibility via a
  toggle) — identical payload, identical 400 each time.
  Source: `frontend/src/pages/settings/SettingsPage.tsx:210`.
  Second-order: the notification-bridge write at `SettingsPage.tsx:~226` is
  step 2 of the same mutation, so it never runs — the 8 toggles on the
  Notifications tab would be discarded even if the upsert succeeded (they aren't
  in the payload at all).
- Evidence: `shots/adminops/settings-profile-save.png`,
  `shots/adminops/settings-tab-Notifications.png`; payload/response captured in
  `persist4-adminops.mjs` / `p6.mjs` output.
- Data-vs-wiring: **feature not wired**. Note the in-code comment says a prior fix
  replaced a PGRST204; this Save has evidently never worked.
- Suggested fix (1 line): `.update({…}).eq('id', user.id)` instead of `.upsert({…})`.

### F4. `/analytics` is a permanent brochure — the backend endpoint does not exist [severity: P0] [class: hollow]

- Route: `/analytics` (EN + AR)
- Observed: all four tabs render "…Preview" cards with **fabricated chart art**
  (a fake sparkline, a fake donut, fake bars) plus "Insights you'll gain" bullets.
  The real request is `404 GET http://localhost:5173/analytics-dashboard?time_range=30d&metric=overview`.
  There is no `/analytics-dashboard` route in `backend/src` at all (grep returns
  only frontend hits); curling the backend directly gives 404. The page _has_ an
  `isError` branch that renders a destructive Alert
  (`AnalyticsDashboardPage.tsx:269`) but it is dead code, because
  `analytics.repository.ts:13-19` catches every failure, `console.warn`s, and
  returns `{ data: null }`. Same swallow for `/organization-benchmarks` and
  `/organization-benchmarks?action=current-stats`. An analyst has no way to tell
  this page from one that is merely waiting for data.
- Evidence: `shots/adminops/en_analytics_1440.png`, `ar_analytics_1440.png`;
  console `[warning] Analytics dashboard endpoint not available`.
- Data-vs-wiring: **feature not wired** — three endpoints that were never built.
- Suggested fix (1 line): stop swallowing in the repository so `isError` fires,
  and either build `/analytics-dashboard` on the Express backend or delete the route.

### F5. Report generation 400s on a one-word contract mismatch, and shows no error [severity: P0] [class: broken]

- Route: `/reports`
- Observed: pick any of the 6 templates → pick a format → "Generate Report".
  Client sends `{"template":"country-overview","format":"pdf","parameters":{}}`;
  the edge function checks `body.type` (`supabase/functions/reports/index.ts:258`)
  and returns `400 {"error":"Report type and format are required"}`. **No toast, no
  alert, no state change** — the button just does nothing, twice (React StrictMode
  double-fires it). All 6 templates are affected.
- Evidence: `shots/adminops/reports-generate2.png`; request/response captured by
  `rep3.mjs`: `REQ BODY {"template":…}` / `RESP 400 :: {"error":"Report type and format are required"}`.
- Data-vs-wiring: **feature not wired** (field-name drift `template` vs `type`).
- Suggested fix (1 line): send `type` instead of `template` (or accept both in the
  edge function) and surface the error response in a toast.

### F6. Scheduled reports can never be created — `custom_reports` RLS is mutually recursive [severity: P0] [class: broken]

- Route: `/reports/scheduled`
- Observed: the page shows a clean "No scheduled reports yet" empty state, which is
  truthful for `report_schedules` (0 rows). But **"Create Schedule" opens a dialog
  whose required "SELECT REPORT" dropdown can never be populated**: it loads from
  `custom_reports`, which returns
  `500 {"code":"42P17","message":"infinite recursion detected in policy for relation \"custom_reports\""}`.
  The SELECT policy on `custom_reports` sub-queries `report_shares`, and the SELECT
  policy on `report_shares` sub-queries `custom_reports` (verified in `pg_policies`).
  No error is shown; the dropdown is simply empty forever.
- Evidence: `shots/adminops/en_reports_scheduled_1440.png`;
  `500 GET .../rest/v1/custom_reports?select=id,name,name_ar,…`; direct curl returns
  the 42P17 body.
- Data-vs-wiring: **feature not wired** (RLS defect). `custom_reports` is also 0
  rows, but the 500 fires before that matters.
- Suggested fix (1 line): break the cycle — make one side's policy use a
  `SECURITY DEFINER` helper (or drop the `report_shares` sub-select from
  `custom_reports`' SELECT policy).

### F7. `/monitoring` is a dead route — the dev proxy shadows it and users see raw JSON [severity: P0] [class: broken]

- Route: `/monitoring`
- Observed: the browser renders `{"error":"Not Found","message":"The requested resource was not found"}`
  in Chrome's JSON viewer. No app chrome, no `dir`, `bodyFont: Times`.
  `frontend/src/routes/_protected/monitoring.tsx` exists, but
  `frontend/vite.config.ts:130` proxies the whole `/monitoring` prefix to the
  Express backend, so the SPA route is unreachable in dev and the backend's 404
  body is what ships. The only inbound link is from
  `components/modern-nav/navigationData.ts:262`, which belongs to the
  `modern-nav-standalone` demo, not the real app.
- Evidence: `shots/adminops/en_monitoring_1440.png`;
  `404 GET http://localhost:5173/monitoring`; `curl localhost:5001/monitoring` → same body.
- Data-vs-wiring: **feature not wired** — proxy/route collision.
- Suggested fix (1 line): namespace the proxy (`/api/monitoring`) or delete the
  route — see F24, this is a strong deletion candidate.

### F8. The whole `/settings/*` subtree renders with NO navigation at all [severity: P1] [class: broken]

- Route: `/settings/webhooks`, `/settings/notifications`, `/settings/email-digest`, `/settings/integrations`, `/settings/calendar-sync`
- Observed: no global sidebar, no settings sub-nav, no page header, no back link —
  just the topbar and content bleeding to the viewport edge. The only way back is
  the browser button. `AppShell.tsx:125` suppresses the global sidebar with
  `pathname.startsWith('/settings')`, but `settings.tsx:13-30` only renders the
  240px settings nav when the path is **exactly** `/settings`; children get a bare
  `<Outlet/>`. So the prefix check and the exact check disagree and the children
  fall through the gap.
- Evidence: `shots/adminops/en_settings_webhooks_1440.png`,
  `en_settings_notifications_1440.png`, `en_settings_email-digest_1440.png`,
  `en_settings_calendar-sync_1440.png` (compare `en_settings_1440.png`, which has
  the settings nav).
- Data-vs-wiring: **feature not wired** (routing/layout).
- Suggested fix (1 line): render the settings nav around `<Outlet/>` in
  `SettingsLayout`, or narrow `isSettingsRoute` to an exact match.

### F9. `/legislation/<id>` is dead code — the detail route can never render [severity: P1] [class: broken]

- Route: `/legislation/<any id>`
- Observed: navigating to a legislation detail URL renders the **list page**
  ("Legislation Tracker / No legislation found"), and the URL is rewritten with
  the list route's search params (`?hasOpenCommentPeriod=false&hasUpcomingDeadlines=false`).
  `routes/_protected/legislation.tsx` renders `LegislationPage` with **no `<Outlet/>`**,
  so `legislation/$id.tsx` (a fully-written 60-line detail page with an edit Sheet)
  is unreachable.
- Evidence: `shots/adminops/en_legislation_00000000-…-000000000001_1440.png` —
  pixel-identical to `en_legislation_1440.png`; probe `url` field shows the
  rewritten query string.
- Data-vs-wiring: **feature not wired**. (`legislations` is also 0 rows, so no real
  id exists to test with — but the routing defect is independent of data.)
- Suggested fix (1 line): make `legislation.tsx` a layout that renders `<Outlet/>`
  and move the list into `legislation/index.tsx`.

### F10. Geographic Visualization can never show country names — the view joins on metadata that is always empty [severity: P1] [class: hollow]

- Route: `/geographic-visualization`
- Observed: the map labels its 5 pins `SA CN GB AE ID` instead of country names,
  and the "Regional Breakdown" rows read "2 countries | 0 eng." with **no region
  label at all**. `v_country_engagement_metrics.name_en` is NULL for all 5 rows;
  the RPC falls back to `COALESCE(name_en, iso_code_2)`. The view joins
  `dossiers d ON d.type='country' AND (d.metadata->>'country_id' = c.id::text OR d.metadata->>'iso_code_2' = c.iso_code_2)`,
  but `countries` is a **dossier extension table** — `countries.id` _is_ the dossier
  id, and `dossiers.metadata` is `{}` / `{"handoff_demo": true}`, never carrying
  those keys. `select … from countries c join dossiers d on d.id = c.id` returns
  "Saudi Arabia / Indonesia / China / United Arab Emirates / United Kingdom"
  immediately. This will show ISO codes forever, at any data volume.
  Separately: "Engagements 0" here is **honest** — all 3 `engagement_dossiers` rows
  have `host_country_id = NULL`, which is what the view counts on. Two blank region
  labels are also data (`countries.region` is NULL for SA and AE).
- Evidence: `shots/adminops/en_geographic-visualization_1440.png`;
  `pg_get_viewdef('v_country_engagement_metrics')` tail; comparison query above.
- Data-vs-wiring: **feature not wired** for names/regions; **no data seeded** for
  the engagement counts. Both, and they should be fixed separately.
- Suggested fix (1 line): `LEFT JOIN dossiers d ON d.id = c.id` in
  `v_country_engagement_metrics`.

### F11. Stakeholder Influence ships empty card shells and a React error [severity: P1] [class: hollow]

- Route: `/stakeholder-influence`
- Observed: "Top Influencers" and "Key Connectors" render as **headers with nothing
  underneath** — no rows, no empty-state text, just blank cards. Console carries
  `Query data cannot be undefined … ["stakeholder-influence","network-statistics",null]`
  (the queryFn returns nothing) and a React hydration error,
  `In HTML, <div> cannot be a descendant of <p>` inside `<StakeholderInfluencePage>`
  → `<HeroUICard>` → `<CardRoot>`.
- Evidence: `shots/adminops/en_stakeholder-influence_1440.png`; console errors in
  `json/adminops/en_stakeholder-influence_1440.json`.
- Data-vs-wiring: **both** — `stakeholder_influence_scores`, `_history`,
  `_interactions` and `influence_reports` are all 0 rows (no data seeded), but the
  undefined-returning queryFn and the invalid DOM nesting are wiring defects that
  data will not fix.
- Suggested fix (1 line): return `null` (not `undefined`) from the queryFn, add
  empty states to the two side cards, and change the `<p>` wrapper to a `<div>`.

### F12. The Users directory is 400+ automated test accounts, all Active [severity: P1] [class: hollow]

- Route: `/users` (EN + AR)
- Observed: "Showing 1-25 of **415** users". Every visible row is a test fixture —
  `test-wip-extra-3-1786559010933@gastat.test`, `workflow-test-1786558989651@example.com`,
  `mentioned-…`, `observer-…`, `assignee-…`, `other-…`. `select count(*) … where is_active`
  → **415 of 415 are active**. Real staff accounts are buried past page 1 of 17.
- Evidence: `shots/adminops/en_users_1440.png`, `ar_users_1440.png`; DB counts above.
- Data-vs-wiring: **no data seeded** in the sense that this is not a code bug — it
  is test-suite residue that was never cleaned up. It still makes the page unusable.
- Suggested fix (1 line): purge `%@example.com` / `%@gastat.test` fixture users
  from staging and have the E2E suite clean up after itself.

### F13. "Last Login" is never written, so the column is permanently blank [severity: P1] [class: hollow]

- Route: `/users`, `/users/<id>`
- Observed: every row shows `-` under Last Login; the detail page shows `—`.
  `select count(last_login_at) from public.users` → **0 of 415**, including the
  account I signed in with repeatedly during this audit. Combined with F12 (all 415
  Active), an admin has no signal at all for which accounts are dormant.
- Evidence: `shots/adminops/en_users_1440.png`,
  `en_users_de2734cf-…_1440.png`; DB count above.
- Data-vs-wiring: **feature not wired** — nothing writes `users.last_login_at` on
  sign-in.
- Suggested fix (1 line): stamp `last_login_at` in the auth callback (or via an
  `auth.users` trigger), or drop the column from both views.

### F14. The Report Builder's labels collide into unreadable mush at 1440 and 1024 [severity: P1] [class: responsive]

- Route: `/reports/<id>`
- Observed: at **1440** the Data Sources tiles overlap into
  "Dossie**Engagem**Commitmen**Work Items**Calendar Events" and
  "Perso**Organizatio**Forum**Documen**Relationships"; the Visualization row reads
  "Donut**Scatter**Heatmap**Card". At **1024\*\* it is far worse — tiles squeeze to
  ~28px and every label smears together ("Tab Ba Lin Pi Are Do Scatter Car KPI"),
  while card headers wrap into 4-line stacks. Both widths are inside the mandated
  desktop range (CLAUDE.md: build for 1280, verify at 1024). Also: loading a
  nonexistent report id shows a blank builder rather than a not-found state.
- Evidence: `shots/adminops/en_reports_00000000-…-000000000001_1440.png`,
  `…_1024.png`.
- Data-vs-wiring: **feature not wired** (fixed-width grid, no label truncation).
- Suggested fix (1 line): give the entity/visualization tiles a min-width and
  `truncate` + `title` on their labels.

### F15. 32 unlabeled switches on the Notifications page [severity: P1] [class: a11y]

- Route: `/settings/notifications` (EN + AR)
- Observed: 41 buttons, **32 with no text, no `aria-label`, no `title`**. The
  8×4 grid is legible sighted (row = category, column header = channel) but a
  screen reader hears "switch, on" thirty-two times with nothing to distinguish
  "Assignments · Email" from "System · Sound". Same count in Arabic.
  (Smaller instances of the same pattern: 9 unlabeled on `/settings/email-digest`,
  10 on `/custom-dashboard`, 4 on `/admin/ai-settings`.)
- Evidence: `shots/adminops/en_settings_notifications_1440.png`,
  `ar_settings_notifications_1440.png`; probe `unlabeledButtons: 32`.
- Data-vs-wiring: **feature not wired**.
- Suggested fix (1 line): `aria-label={`${categoryLabel} — ${channelLabel}`}` on
  each `<Switch>`.

### F16. SLA Monitoring renders the literal string `nullm`, and calls 0% "Critical" [severity: P1] [class: devcopy]

- Route: `/sla-monitoring`
- Observed: the Average Resolution Time card reads **"nullm"** — a raw `null`
  concatenated with a "m" (minutes) suffix — next to "Across all resolved items".
  Compliance Rate shows "0%" labelled **"Critical"** in red, which reads as a live
  SLA emergency when in fact nothing was measured. The 0 counts themselves are
  honest: all 3 `intake_tickets` predate the "Last 30 Days" window (newest
  2026-06-30, i.e. 46 days old). Also "Last 30 D" is a truncated label.
- Evidence: `shots/adminops/en_sla-monitoring_1440.png`; DB ticket dates above.
- Data-vs-wiring: `nullm` and the "Critical" label are **not wired**; the zeros are
  **no data in window**.
- Suggested fix (1 line): render `—` when the average is null, and suppress the
  severity label when the denominator is 0.

### F17. Icon tiles render as solid color blocks — the icon is the same color as its background [severity: P2] [class: design]

- Route: `/help` (3 of 6 tiles), `/admin/system` (1 tile)
- Observed: on `/help`, the Commitments (blue), Dossiers (green) and Tasks (gold)
  tiles are **filled squares with no glyph**, while Calendar/Contacts/Analytics show
  their icons. `HelpPage.tsx:403` writes `${guide.color} bg-opacity-10` — but
  `bg-opacity-*` is a Tailwind **v3** utility and is a no-op in v4 (this repo is
  v4), so the tile paints at 100% and the `text-accent`/`text-success`/`text-warning`
  icon inside vanishes into it. `admin/system.tsx:222` is the same bug by a
  different route: `bg-success/10 dark:bg-success` re-opaques the tile in dark
  mode — which is the default mode — behind a `text-success` icon. Reproduces in
  EN and AR.
- Evidence: `shots/adminops/en_help_1440.png`, `ar_help_1440.png`,
  `en_admin_system_1440.png`. Repo-wide `bg-opacity-` count: 2 (both listed).
- Data-vs-wiring: **feature not wired** (Tailwind v3→v4 migration relic).
- Suggested fix (1 line): `bg-opacity-10` → the `/10` opacity modifier, and drop
  the `dark:bg-success` override.

### F18. Custom Dashboard: dead chart, blank events widget, fake trend deltas, wrong date format [severity: P2] [class: hollow]

- Route: `/custom-dashboard`
- Observed, four defects on one page:
  1. **"Work Items by Status" renders a legend and no bars** — while the KPI cards
     directly above it report 6 Pending and 16 Overdue. Still empty at a 10s wait.
  2. **"Upcoming Events" is completely blank** — no rows, no empty state. Caused by
     `400 GET /rest/v1/calendar_entries?select=…start_datetime…` →
     `{"code":"42703","message":"column calendar_entries.start_datetime does not exist"}`.
     The real columns are `event_date` (date) + `event_time` (time).
  3. **Every KPI shows "— 0.0% from last Week"**, including Active Dossiers 43. The
     comparison requests are all `HEAD … net::ERR_ABORTED`, so the delta is never
     computed and 0.0% is displayed as if measured. ("last Week" is also mid-sentence
     title case.)
  4. Task List uses relative dates — "271 days ago", "118 days ago" — where
     DESIGN.md mandates `Tue 28 Apr`. Quick Actions tile labels truncate to three
     identical "Create…".
- Evidence: `shots/adminops/en_custom-dashboard_1440.png` (1440×1400 full grid);
  400/ERR_ABORTED list in `json/adminops/en_custom-dashboard_1440.json`.
- Data-vs-wiring: **feature not wired** on all four counts — the data exists (43
  dossiers, 22 work items, calendar rows) and the page fails to read it.
- Suggested fix (1 line): query `event_date`/`event_time`, stop aborting the
  comparison HEADs, and format dates with the shared `Tue 28 Apr` helper.

### F19. Word Assistant does no AI at all — it echoes your prompt back under a green "Connected" badge [severity: P1] [class: devcopy]

- Route: `/word-assistant`
- Observed: I sent "Summarize this in one sentence: hello world." The assistant
  replied:

  > **Draft response**
  > You asked: Summarize this in one sentence: hello world.
  > Context considered (50 chars shown): USER: Summarize this in one sentence: hello world.
  > Suggested next steps:
  >
  > - Refine the prompt with specific objectives or data points.
  > - Add any constraints such as audience, tone, or deadline.
  > - **When the AI service is available, re-run for a full draft.**

  **Zero AI network calls were made** — the only outbound requests during the send
  were the routine profile fetch. The reply is assembled client-side by
  `generateLocalAssistantResponse()` (`WordAssistantPage.tsx:92-109`, returns
  `model: 'local-fallback'`). Root cause:
  `VITE_WORD_ASSISTANT_MODE` **defaults to `'fallback'`** (`:88`), and in that mode
  the send path never touches the network (`:127`) _and_ the connectivity check
  short-circuits to `setIsConnected(true)` without probing anything (`:254-256`) —
  which is why the page confidently displays a green **"Connected"** pill while
  being wired to nothing. `isConnected` also initialises to `true` (`:57`).
  This is exactly the class the brief flagged: the sentence "When the AI service is
  available, re-run for a full draft" is developer copy shipped to end users, on a
  page whose subtitle promises "AI drafting help for briefs, summaries, and
  translations".

- Evidence: `shots/adminops/word-assistant-send.png` (badge + stub reply in one
  frame); network capture from `wa.mjs` shows no AI request; source lines above.
- Data-vs-wiring: **feature not wired** — and actively misrepresented as working.
- Suggested fix (1 line): show a plain "AI service not configured" state when
  `assistantMode !== 'supabase'` instead of a canned draft plus a "Connected" badge.

### F20. Help centre: first-person marketing voice and 5 of 6 guides unbuilt [severity: P2] [class: devcopy]

- Route: `/help` (EN + AR)
- Observed: the H1 is **"How can we help you?"** — first-person plural, explicitly
  banned by CLAUDE.md's voice rules (AR is the same: "كيف يمكننا مساعدتك؟"). Five of
  six Feature Guides are badged "Coming Soon" (Dossiers, Tasks & Workflows, Calendar,
  Contacts, Analytics) — and **Contacts points at a retired area of the app**. Phone
  support is the placeholder-looking "+966 11 123 4567".
  `/settings/integrations` carries the same voice problem ("What You Can Do",
  "Start your day with a personalized summary…", "Get instant alerts…") plus title
  case throughout where sentence case is mandated.
- Evidence: `shots/adminops/en_help_1440.png`, `ar_help_1440.png`,
  `en_settings_1440.png` (Integrations tab).
- Data-vs-wiring: **feature not wired** (content never written).
- Suggested fix (1 line): retitle to "Help", drop the Contacts guide, and rewrite
  the Integrations blurbs in sentence case without second-person benefit copy.

### F21. The one shipped help guide documents the wrong priority enum [severity: P2] [class: devcopy]

- Route: `/help/commitments`
- Observed: "Priority — Low, Medium, High, **Critical**". CLAUDE.md's work-item
  glossary is explicit that priority is `low | medium | high | urgent` and that
  `critical` belongs to the intake `urgency_level` enum, _not_ to work items. The
  only user-facing guide in the product teaches the wrong value.
- Evidence: `shots/adminops/en_help_commitments_1440.png`.
- Data-vs-wiring: **feature not wired** (stale documentation).
- Suggested fix (1 line): "Low, Medium, High, Urgent".

### F22. Server error text reaches Arabic users untranslated [severity: P2] [class: i18n]

- Route: `/audit-logs` (`--lang ar`)
- Observed: the heading is correctly localised ("خطأ في تحميل سجلات التدقيق") but the
  detail line below it is raw English straight from the API: **"Invalid user session"**.
  Any server-side message on this page will surface verbatim in Arabic.
- Evidence: `shots/adminops/ar_audit-logs_1440.png`.
- Data-vs-wiring: **feature not wired**.
- Suggested fix (1 line): map the API `code` (`AUTH_REQUIRED`) to a translated
  string rather than rendering `error.message`.

### F23. Arabic orthography errors in the push-notification string [severity: P2] [class: i18n]

- Route: `/settings/notifications` (Registered Devices, `--lang ar`)
- Observed: `frontend/src/i18n/ar/push-notifications.json:12` reads
  "متصفحك لا يدعم **اشعارات** الدفع. جرب Chrome **او** Firefox." — missing hamza on both
  "إشعارات" and "أو". This is the only bare `او` in the whole `i18n/ar` tree, so it is
  an outlier, not a house style. Minor related inconsistency: "last 30 days" is
  spelled three ways across namespaces ("آخر 30 يوم" ×7, "آخر 30 يوماً", "آخر 30 يومًا").
- Evidence: grep over `frontend/src/i18n/ar/`.
- Data-vs-wiring: **feature not wired** (copy defect).
- Suggested fix (1 line): "إشعارات" and "أو"; standardise on "آخر 30 يومًا".

### F24. Nine routes in this lane have zero inbound links anywhere in the app [severity: P2] [class: hollow]

- Route: `/legislation`, `/sla-monitoring`, `/custom-dashboard`, `/geographic-visualization`, `/stakeholder-influence`, `/workflow-automation`, `/admin/ai-usage`, `/admin/approvals`, `/admin/preview-layouts`
- Observed: `navigation-config.ts` exposes exactly 20 paths; only 6 of my 34 routes
  are among them (`/admin/ai-settings`, `/admin/system`, `/admin/field-permissions`,
  `/audit-logs`, `/admin/data-retention`, `/approvals`). Grepping `components/`,
  `pages/` and `routes/` for `to="<path>"` / `path: '<path>'` / `href="<path>"`
  returns **0 files** for each of the nine above. They are reachable only by typing
  the URL. Four of them are also the weakest pages in the lane (F10, F11, F16, F18),
  and `/monitoring` (F7) is unreachable even by URL.
- Evidence: link-count sweep in this session; `components/layout/navigation-config.ts`.
- Data-vs-wiring: **feature not wired** (no nav entry).
- Suggested fix (1 line): decide per route — add a nav entry, or delete.
  My deletion shortlist: `/monitoring` (F7, dead), `/custom-dashboard` (duplicates
  `/dashboard` with worse widgets), `/stakeholder-influence` (F11, no backing data
  model in use).

### F25. Search inputs across the lane render their placeholder underneath the search icon [severity: P2] [class: design]

- Route: `/audit-logs`, `/users`, `/admin/field-permissions`, `/settings/webhooks`, `/help`, `/workflow-automation`, `/legislation` (and mirrored in AR)
- Observed: measured on five routes — the input has `padding-inline-start: 10px`
  while the absolutely-positioned magnifier sits at offset 12px with width 16–20px
  (so it occupies 12–28px, or 16–36px on `/help`). The placeholder therefore starts
  _under_ the icon: "⌕arch by email, table, or content…", "⌕arch users by name…",
  "S⌕arch for help…". Needs roughly `ps-9`. It mirrors correctly in Arabic — and so
  does the overlap.
- Evidence: `shots/adminops/en_audit-logs_1440.png`, `en_users_1440.png`,
  `en_admin_field-permissions_1440.png`, `en_settings_webhooks_1440.png`,
  `en_help_1440.png`, `ar_users_1440.png`; measurements from `icon.mjs`.
- Data-vs-wiring: **feature not wired** (shared search-field styling).
- Suggested fix (1 line): set the input's `padding-inline-start` to clear the icon
  (`ps-9`) in the shared search-input recipe.

### F26. Minor layout and labelling nits [severity: P2] [class: design]

- Route: as listed
- Observed: `/intelligence` lays 4 KPI cards out as 3 + 1 with a large dead gap
  (`en_intelligence_1440.png`); `/data-library` does the same with 6 cards as 5 + 1.
  `/users` and `/workflow-automation` each show three filter dropdowns all reading
  "Show All" / "All" with no field labels, so you cannot tell what they filter.
  `/admin/system` is labelled "System Settings" in the sidebar but titled "System
  Utilities" and contains a single data-import button. `/admin/approvals` titles
  itself "Admin: Approval Management" — the only page in the app that prefixes its
  own title with a role. `/admin/ai-usage` truncates its range label to "Last 30".
  `/intelligence` → Signals renders the raw enum `human_entered` to the user.
  `/word-assistant` stamps chat messages "01:16" with no zone, where DESIGN.md
  mandates `14:30 GST`.
- Evidence: the named screenshots.
- Data-vs-wiring: **feature not wired** (cosmetic).
- Suggested fix (1 line): 4-up/6-up grid classes, add filter labels, align the
  sidebar label to the page title, drop the "Admin:" prefix, humanise the enum.

---

## Routes that are genuinely fine

Worth stating plainly, because it bounds the work — these need no attention:

- **`/admin/ai-settings`** — the best page in the lane. I toggled Brief Generation
  off, saved, reloaded, confirmed it stuck, then restored it; both round-trips
  produced a clean `POST organization_llm_policies` + "Settings saved" toast. The
  one 406 on first load is `.single()` against an empty policy table and is
  cosmetic — the page falls back to correct defaults. Fully translated in AR.
- **`/settings/notifications`** — the toggles _do_ persist (I initially misread this:
  the Save control is a sticky footer button that only appears after a change; once
  clicked it writes `notification_category_preferences` and survives a reload).
  Verified in both directions and restored. Its problems are chrome (F8) and
  labelling (F15), not wiring.
- **`/settings/email-digest`** — same, verified persist + restore.
- **`/intelligence`** — all four tabs are distinct and wired. Signals shows real
  data with the correct `Tue 30 Jun` / `13:38 GST` formats; Digests shows live
  subscriptions; Alerts has an honest empty state.
- **`/admin/ai-usage`**, **`/admin/approvals`**, **`/data-library`**,
  **`/workflow-automation`**, **`/legislation`**, **`/settings/calendar-sync`** —
  all render correctly with honest empty states, and I confirmed against the
  database that each backing table really is empty (`ai_interaction_logs` 0,
  positions-in-review 0, `workflow_rules` 0, `legislations` 0). **No data seeded,
  not broken.**
- **`/users/<id>`**, **`/admin/preview-layouts`**, **`/help/commitments`**,
  **`/reports`** (the template list itself; only Generate is broken — F5),
  **`/settings/integrations`** (voice aside).
- **Responsive**: zero horizontal overflow on any lane route at 1440, 1024 or 768.
  The only responsive defect is F14. Below 768 is read-only by design and I did not
  report against it.
- **RTL**: all 9 Arabic routes correct — `dir=rtl`, Tajawal, no key leaks, no
  overflow, correct mirroring. Four suspected RTL bugs (switch-knob side, back-chevron
  direction, button/text collision on the notifications header, "او"/"أخر" spellings)
  were each checked by DOM measurement or against the i18n source and **all four were
  false alarms** — not reported.
