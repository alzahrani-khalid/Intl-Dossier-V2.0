# Events Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/events` and the modern-nav Calendar category entries `events` -> `/events` and `new-event` -> `/calendar/new`; route files, pages, components, hooks; list/detail/create flows; backend/Supabase surfaces for `events`, `event_details`, `calendar_entries`, `calendar_events`, `event_attendees`, `event_participants`, and `engagements`; active Sidebar discoverability; i18n EN+AR registration/parity; RTL/design-token compliance; honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: `reports/calendar-workflow-inspection-2026-06-09.md` already inspected the operational calendar. This report treats `calendar_entries` as the canonical operational calendar table and `calendar_events` as the separate forum/session calendar model. It does not propose consolidating those two tables.

---

## Scope

### Routes traced

| URL             | Nav source                                                                 | Route file                                             | Page / component                                                    | Result                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/events`       | Dormant modern-nav Calendar item `events`; not in active Sidebar           | `frontend/src/routes/_protected/events.tsx:4-5`        | `Events` -> `EventsPage` -> internal `CalendarView` / `ListView`    | Mounted in generated route tree and reads `event_details`. No create, detail, edit, month navigation, or row/card action is wired.          |
| `/calendar/new` | Dormant modern-nav Calendar item `new-event`; not directly in active Sidebar | `frontend/src/routes/_protected/calendar/new.tsx:9-10` | `NewCalendarEntryPage` -> `CalendarEntryForm`                       | Creates operational `calendar_entries` through `calendar-create`; it does not create rows for `/events`' `event_details` / `events` surface. |

Nav wiring notes:

- `/events` is generated at `frontend/src/routeTree.gen.ts:431-435` and `frontend/src/routeTree.gen.ts:2896-2901`.
- `/calendar/new` is generated at `frontend/src/routeTree.gen.ts:1451` and `frontend/src/routeTree.gen.ts:3351-3356`.
- The active protected app shell renders `Sidebar` from `frontend/src/components/layout/AppShell.tsx:182-193`; `Sidebar` consumes `createNavigationGroups` from `frontend/src/components/layout/navigation-config.ts:58-64`.
- The active Sidebar includes `/calendar` at `frontend/src/components/layout/navigation-config.ts:97-102`, but no `/events` or `/calendar/new` item. The older modern-nav dataset includes both at `frontend/src/components/modern-nav/navigationData.ts:207-219`.

### Child components & hooks

| Surface                 | Files                                                                 | Role                                           | Current wiring                                                                                         |
| ----------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Events route            | `frontend/src/routes/_protected/events.tsx:1-5`, `frontend/src/pages/Events.tsx:1-5` | Route wrapper                                  | Mounts `EventsPage`; no child route exists for `/events/$id`.                                          |
| Events page             | `frontend/src/pages/events/EventsPage.tsx:260-370`                    | Filter toolbar, calendar/list toggle, data query | Direct Supabase query to `event_details`; no repository, generated type, error state, pagination, or action wiring. |
| Events calendar view    | `frontend/src/pages/events/EventsPage.tsx:45-95`                      | Month grid                                      | Buckets by `start_datetime` from `event_details`; day click only updates local `selectedDate`.          |
| Events list view        | `frontend/src/pages/events/EventsPage.tsx:104-233`                    | Card list                                       | Renders seven logical columns in a six-column grid; cards have pointer styling but no click behavior.   |
| New calendar route      | `frontend/src/routes/_protected/calendar/new.tsx:13-56`               | Standalone create page                          | Navigates back to `/calendar` after success/cancel; page header keys use default namespace dot form.    |
| Calendar entry form     | `frontend/src/components/calendar/CalendarEntryForm.tsx:143-900`      | Operational entry create/update form            | Single-entry create calls `useCreateCalendarEvent`; recurrence calls `useCreateRecurringEvent`.         |
| Calendar create hook    | `frontend/src/domains/calendar/hooks/useCreateCalendarEvent.ts:15-25` | React Query mutation                            | Calls repository `createCalendarEvent`; invalidates `calendar-events`.                                  |
| Calendar repository     | `frontend/src/domains/calendar/repositories/calendar.repository.ts:124-126` | API client bridge                               | Posts `/calendar-create`, which inserts `calendar_entries`.                                             |
| Recurring create path   | `frontend/src/components/calendar/CalendarEntryForm.tsx:366-383`, `supabase/functions/recurring-events/index.ts:230-247` | Optional recurrence flow                        | Writes `calendar_events`, not `calendar_entries`; noted here only as model context, already calendar-adjacent. |

### Backend / Supabase surfaces

| Surface                    | Role                                                                 | Wired from workflow? |
| -------------------------- | -------------------------------------------------------------------- | -------------------- |
| View `event_details`       | `/events` read model over `public.events`, with organizer/country derived from `event_attendees` | Yes for `/events` reads at `frontend/src/pages/events/EventsPage.tsx:270-288`. Defined in migrations at `supabase/migrations/037_update_event_details_add_org_country.sql:6-29`, but absent from generated `frontend/src/types/database.types.ts`; live availability is **VERIFY vs live**. |
| Table `events`             | Public event/domain model behind `event_details`                     | Indirect read only. Generated type uses `title`, `start_time`, `end_time`, `type`, `status` at `frontend/src/types/database.types.ts:12745-12767`. No `/events` create/update/delete frontend is wired. Live schema drift across migrations is **VERIFY vs live**. |
| Table `event_attendees`    | Organizer/country derivation for `event_details`                     | Indirect read through the view. Table type exists at `frontend/src/types/database.types.ts:12436`; no `/events` UI writes attendees. Live RLS is **VERIFY vs live**. |
| Edge function `events`     | CRUD/conflict surface for an older event shape                        | Not wired from `/events`. Its body expects `title_en`, `start_datetime`, `organizer_id`, and `country_id` (`supabase/functions/events/index.ts:5-27`), which do not match generated `events` types; deployment/live use is **VERIFY vs live**. |
| Table `calendar_entries`   | Canonical operational calendar                                       | `/calendar/new` single-entry create writes it through `calendar-create` (`supabase/functions/calendar-create/index.ts:115-136`). `/events` does not read it. Generated type exists at `frontend/src/types/database.types.ts:4575-4601`. |
| Table `calendar_events`    | Separate forum/session calendar model                                | Not read by `/events` or by single `/calendar/new` creates. Recurring creation and conflict/rescheduling helpers still use it (`supabase/functions/recurring-events/index.ts:230-247`, `supabase/functions/calendar-conflicts/index.ts:249-253`). |
| Table `event_participants` | Participant rows for `calendar_events`                               | Recurring and conflict helpers use it; single `calendar_entries` create does not persist selected form participants (`supabase/functions/calendar-create/index.ts:111-114`). |
| Table `engagements`        | Engagement dossier extension                                         | No `/events` or `/calendar/new` read/write path found. Generated type exists at `frontend/src/types/database.types.ts:11008-11032`. |

### i18n namespaces

| Namespace / key group               | Routes / components                         | EN                                      | AR                                      | Registered in `i18n/index.ts` | Notes |
| ----------------------------------- | ------------------------------------------- | --------------------------------------- | --------------------------------------- | ----------------------------- | ----- |
| `common` / `translation` `events.*` | `/events` page                              | `frontend/src/i18n/en/common.json:322-351` | `frontend/src/i18n/ar/common.json:322-351` | `frontend/src/i18n/index.ts:255-257,381-383` | EN+AR event labels exist in the default namespace. |
| `common` / `translation` `navigation.*` | Active Sidebar and dormant modern-nav labels | `frontend/src/i18n/en/common.json:150-211` | `frontend/src/i18n/ar/common.json:150-211` | `frontend/src/i18n/index.ts:255-257,381-383` | `navigation.events` exists; `navigation.newEvent` is not present in the shown navigation block. |
| `calendar`                          | `CalendarEntryForm`                         | `frontend/src/i18n/en/calendar.json`    | `frontend/src/i18n/ar/calendar.json`    | `frontend/src/i18n/index.ts:57-58,283,409` | Form uses `useTranslation('calendar')`; route wrapper does not. |
| Default namespace dot form          | `/calendar/new` route wrapper               | Not found                               | Not found                               | Not applicable                | Uses `t('calendar.new_event.*')` from default namespace at `frontend/src/routes/_protected/calendar/new.tsx:34-48`; matching keys are not in `calendar.json`'s page block (`frontend/src/i18n/en/calendar.json:392-397`). |

---

## Environment

| Check                       | Result |
| --------------------------- | ------ |
| Backend health              | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T20:38:30.947Z","environment":"development"}` |
| Frontend `/events` shell    | `HEAD http://127.0.0.1:5175/events` -> **200** SPA HTML |
| Frontend `/calendar/new` shell | `HEAD http://127.0.0.1:5175/calendar/new` -> **200** SPA HTML |
| Authenticated browser UAT   | Not performed; inspection stayed source/read-only and sent no write requests. |
| Live Supabase DB/RPC/schema | Not probed with auth; DB/RPC/view deployment claims are **VERIFY vs live**. |
| Typecheck / tests           | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint. |

---

## Findings

### 1. [EVENT] `/events` exposes create/detail affordances that do nothing

**Severity:** HIGH  
**Location:** `frontend/src/pages/events/EventsPage.tsx:218-220,315-318`, `frontend/src/routes/_protected/events.tsx:4-5`

**Root cause:** The `/events` page renders an **Add Event** button without `onClick`, `asChild`, `Link`, or form state. Event list cards also use `cursor-pointer` and hover styling but have no click handler, link, or detail route. The route tree contains only `/events`; no `/events/$id` route file was found.

**Suggested fix:** Either wire the Add Event button to a deliberate create path and add an event detail/edit route, or remove/disable the affordances until the workflow exists. If the chosen create path is `/calendar/new`, label it as an operational calendar entry, not as a public event create flow.

---

### 2. [MODEL] `events` and `new-event` nav items point to different data models

**Severity:** HIGH  
**Location:** `frontend/src/components/modern-nav/navigationData.ts:207-219`, `frontend/src/pages/events/EventsPage.tsx:270-288`, `frontend/src/components/calendar/CalendarEntryForm.tsx:339-386`, `supabase/functions/calendar-create/index.ts:115-136`

**Root cause:** The dormant modern-nav Calendar category presents `events` -> `/events` and `new-event` -> `/calendar/new` as sibling workflow actions. They are not siblings in the data layer: `/events` reads `event_details` over `public.events`, while `/calendar/new` writes `calendar_entries`. A user who follows "New Event" creates an operational calendar entry that `/events` will never show.

**Suggested fix:** Decide what `/events` means. If it is the public/domain `events` surface, build create/edit/detail against `events` or a typed `event_details` repository. If it is meant to be the operational calendar event list, repoint `/events` to `calendar_entries` or redirect it to `/calendar` with a clear label. Do not bridge this by merging `calendar_entries` and `calendar_events`; they are separate models.

---

### 3. [NEW-EVENT] Participant selection on `/calendar/new` is not persisted for single entries

**Severity:** HIGH  
**Location:** `frontend/src/components/calendar/CalendarEntryForm.tsx:554-730,339-358,384-386`, `supabase/functions/calendar-create/index.ts:111-136`, `frontend/src/types/database.types.ts:4577-4595`

**Root cause:** `CalendarEntryForm` lets users select person/organization dossier participants and includes them in `eventData.participants`. The single-entry create path posts to `calendar-create`, but `calendar-create` explicitly does not persist form participants because `calendar_entries.attendee_ids` is a user-id array and does not match person/org dossier participants. Users can complete a form control that appears real, but the selected participants are dropped on save. The recurring path is different and writes participant rows against `calendar_events`.

**Suggested fix:** Add a real participant persistence model for operational `calendar_entries` or remove/disable the participant picker on single-entry creation. If conflict checks continue using selected participants before save, label the control as temporary scheduling input until it is actually stored.

---

### 4. [DATA] `/events` relies on an untyped `event_details` view and has enum drift against generated DB types

**Severity:** HIGH  
**Location:** `frontend/src/pages/events/EventsPage.tsx:28-35,236-258,270-288,292`, `supabase/migrations/037_update_event_details_add_org_country.sql:6-29`, `frontend/src/types/database.types.ts:12745-12767,37475-37488`

**Root cause:** The direct Supabase client is untyped (`frontend/src/lib/supabase.ts:13-17`), so `.from('event_details')` is not checked against generated DB types. The generated `database.types.ts` contains `events` but no `event_details` symbol. The UI also hardcodes event types `meeting`, `conference`, `workshop`, `training`, `ceremony`, `other`, while generated `event_type` is `meeting`, `conference`, `workshop`, `ceremony`, `visit`, `other`; `training` is not generated and `visit` is not rendered or translated by `/events`. Live view/table state is **VERIFY vs live** because migrations define `event_details`, but the generated type snapshot does not.

**Suggested fix:** Regenerate Supabase types after verifying the live view, type the `/events` query through a repository, and align filters/colors/i18n with the generated enum or with a deliberate view-level adapter. Add a contract test that covers one `visit` row and one missing/unknown type.

---

### 5. [NAV] `/events` and `/calendar/new` are not discoverable from the active Sidebar

**Severity:** MEDIUM  
**Location:** `frontend/src/components/layout/AppShell.tsx:182-193`, `frontend/src/components/layout/Sidebar.tsx:58-65`, `frontend/src/components/layout/navigation-config.ts:77-102`, `frontend/src/components/modern-nav/navigationData.ts:207-219`

**Root cause:** The live protected shell renders `Sidebar`, which is built from `createNavigationGroups`. That active navigation includes `/calendar` but not `/events` or `/calendar/new`. The only inspected nav dataset containing both requested items is `modern-nav/navigationData.ts`, which is not the shell used by `AppShell`.

**Suggested fix:** Add deliberate active navigation entries only after resolving the model split in finding #2. If `/events` remains a separate surface, add it to the active Sidebar with EN+AR labels. If `/calendar/new` is only a create action, expose it from `/calendar` or a FAB/action menu rather than as a misleading sibling route.

---

### 6. [I18N] `/events` and `new-event` labels leak wrong or missing keys

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/events/EventsPage.tsx:261,297`, `frontend/src/components/modern-nav/navigationData.ts:215-219`, `frontend/src/routes/_protected/calendar/new.tsx:14,34-48`, `frontend/src/i18n/en/common.json:150-211`, `frontend/src/i18n/en/calendar.json:392-397`

**Root cause:** `/events` uses the default namespace and renders the page title as `t('navigation.calendar')`, so the Events route is headed "Calendar" / "التقويم" instead of Events. The dormant modern-nav `new-event` item uses `labelKey: 'navigation.newEvent'`, but that key is not present in the inspected EN/AR `navigation` blocks. `/calendar/new` uses `t('calendar.new_event.*')` through the default namespace; the registered `calendar` namespace has a `page` block, not a `new_event` block, so these route-wrapper strings can render raw keys.

**Suggested fix:** Give `/events` either a dedicated `events` namespace or correct default keys and title it with `navigation.events`. Add EN+AR `navigation.newEvent` if modern-nav is revived. Move `/calendar/new` wrapper strings into `calendar.json` and call `useTranslation('calendar')`, or add matching default-namespace keys in both locales.

---

### 7. [EVENT] Calendar/list browsing is locked to the initial month and selected day has no visible result

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/events/EventsPage.tsx:45-52,260-289,294-367`

**Root cause:** The query window is derived from `selectedDate`, but the page renders no previous/next month controls and no selected-day detail panel. `CalendarView` only renders days from the current `selectedDate` month and clicking a day sets `selectedDate` to another date in the same month. List view uses the same month-scoped query. Users cannot browse other months, and day selection has no visible effect beyond a same-month refetch.

**Suggested fix:** Add explicit month navigation and a selected-day event panel, or remove the calendar view toggle and make `/events` a list/search surface with a visible date-range filter.

---

### 8. [DESIGN] `/events` list/filter layout and event pills are not token-clean or responsive enough

**Severity:** LOW  
**Location:** `frontend/src/pages/events/EventsPage.tsx:78-80,105-214,221-228,327-345`

**Root cause:** `ListView` defines seven columns but renders them in `grid-cols-6`, which forces one column to wrap unpredictably. The filter row and type buttons use fixed horizontal flex without wrapping, so small screens can overflow. Calendar event pills use hardcoded `text-white` over semantic background classes instead of a foreground token paired to the semantic color.

**Suggested fix:** Use responsive grid tracks that match the actual column count, allow the filter bar to wrap or collapse into a select on mobile, and replace hardcoded `text-white` with semantic foreground tokens for each event type.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope | Why |
| ---------- | ----- | --- |
| 1 | Remove inert cursor/button affordances, or route Add Event only after model decision | The honest-UI cleanup is local; full create routing depends on finding #2. |
| 6 | i18n title/key cleanup | Local EN+AR key additions and namespace call-site fixes. |
| 7 | Add visible month controls or remove inert selected-day behavior | Local `/events` UI behavior once the intended browsing mode is chosen. |
| 8 | Responsive grid/filter and token cleanup | Local component styling with low data risk. |

### (B) Needs planned phase

| Finding ID | Scope | Why |
| ---------- | ----- | --- |
| 2 | Canonical meaning of `/events` vs `/calendar/new` | Product/data-model decision across `events`, `event_details`, and `calendar_entries`. |
| 3 | Operational entry participant persistence | Requires a persistence model or explicit product decision to drop the control. |
| 4 | `event_details` live/type contract | Requires live Supabase verification, type regeneration, and enum/adapter alignment. |
| 5 | Active Sidebar placement | Should follow the route/model decision so navigation does not promote the wrong workflow. |

Summary: `/events` is currently an orphaned read surface over `event_details` / `events`, while the nearby `new-event` route creates `calendar_entries`. That means the apparent list/detail/create workflow is split across unrelated models, and the visible `/events` page has inert create/detail affordances. Recommended phase order: first decide whether `/events` is an `events` domain surface or an operational `calendar_entries` alias, then verify/regenerate the `event_details` contract, then wire or remove create/detail/participant affordances honestly, and finally land navigation, i18n, month browsing, and design-token cleanup.
