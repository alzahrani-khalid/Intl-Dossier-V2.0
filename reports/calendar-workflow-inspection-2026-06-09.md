# Calendar Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + schema verification (no live browser session this pass)  
**Environment:** Frontend `http://localhost:5173`, backend `http://localhost:5001`, staging Supabase `zkrcjzdemdmwhearhfgg`  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Executive summary

The operational calendar is correctly anchored on **`calendar_entries`** at the write path (`calendar-create`, `calendar-update` edge functions) and read path (`calendar-get` → `calendar_entries`). The main `/calendar` UI, however, still types and renders rows as **`calendar_events`** forum-session objects (`start_datetime`, `event_type`, `location_en`). Raw `calendar_entries` rows (`event_date`, `event_time`, `entry_type`, `location`) are returned unchanged from the hook with **no normalization**, so month/week grids bucket on `event.start_datetime` and silently fail to place events. Type and dossier filters sent by the repository use query param names the edge function does not read.

A **parallel legacy stack** still reads/writes **`calendar_events`** for dossier overview sections, conflict detection, and recurring-event creation — so data created through those paths never appears on the main grid, and conflict checks miss real operational entries.

| Area                                  | Verdict                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Routes (`/calendar`, `/calendar/new`) | Partial — create route works; no edit/detail route                                |
| Views (month / week / day / agenda)   | **Fail** — only month grid + mobile week list implemented; week/day toggles inert |
| Data fetch (`calendar-get` + hooks)   | Partial — correct table; wrong client contract                                    |
| Create / update (single entry)        | Pass on `calendar_entries` — with Arabic-only title risk                          |
| Recurring create                      | **Fail** — writes `calendar_events`                                               |
| Dossier calendar surface              | **Fail** — overview reads `calendar_events`                                       |
| Engagement `CalendarTab`              | Pass (by design) — synthetic engagement dates only                                |
| Conflict detection                    | **Fail** — RPC/queries target `calendar_events`                                   |
| i18n (`calendar` namespace)           | Partial — large `calendar.json`; missing error + new-page keys                    |
| RTL grid / nav                        | Partial — logical props + `icon-flip` on desktop; week nav glyphs not flipped     |

**Verified carve-outs (not bugs):** `calendar_entries` is the canonical operational table; `calendar-create` / `calendar-update` correctly INSERT/UPDATE `calendar_entries`; `calendar_events` is a separate forum-session model and is allowed to be largely empty.

---

## Architecture traced

```
Routes
  /calendar                    → calendar.tsx (month/week/day toggle UI)
                              → UnifiedCalendar (lazy)
  /calendar/new                → calendar/new.tsx → CalendarEntryForm
  /engagements/$id/calendar    → CalendarTab.tsx (engagement lifecycle dates only)

Read path (operational)
  useCalendarEvents            → calendar.repository.getCalendarEvents
                              → GET /functions/v1/calendar-get
                              → SELECT * FROM calendar_entries
                              → { entries, total_count }  (raw rows, no mapping)

Write path (operational)
  CalendarEntryForm            → useCreateCalendarEvent / useUpdateCalendarEvent
                              → POST calendar-create / PATCH calendar-update
                              → calendar_entries

Display
  CalendarMonthGrid            → buckets by event.start_datetime
  WeekListMobile               → filters by ev.start_datetime
  CalendarEventPill            → title_en/ar; no start_datetime synthesis

Parallel (forum-session model)
  dossier-overview.service     → fetchCalendarEvents → calendar_events
  CalendarEventsSection        → dossier drawer / overview tabs
  recurring-events edge        → INSERT calendar_events
  calendar-conflicts edge      → check_event_conflicts RPC on calendar_events
```

**Schema reference (`calendar_entries` Row):** `frontend/src/types/database.types.ts` lines 4575–4601 — `entry_type`, `event_date`, `event_time`, `duration_minutes`, `all_day`, `location`, `title_en` (required), `title_ar`, `dossier_id`, `status`, etc. No `start_datetime`, `end_datetime`, `event_type`, or `location_en`.

---

## Findings

### CRITICAL

#### 1. API rows are never mapped to UI `CalendarEvent` shape — grid cannot place events

**Location:** `frontend/src/domains/calendar/hooks/useCalendarEvents.ts` lines 30–31; `frontend/src/components/calendar/CalendarMonthGrid.tsx` lines 56–66; `frontend/src/components/calendar/WeekListMobile.tsx` lines 75–77; `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 287–291.

**Why it is a bug:** `useCalendarEvents` returns `data?.entries || []` with no adapter. `calendar-get` returns raw `calendar_entries` rows with `event_date` + `event_time`, not `start_datetime`. `CalendarMonthGrid` builds day buckets with `format(new Date(event.start_datetime), 'yyyy-MM-dd')`. When `start_datetime` is `undefined`, `new Date(undefined)` is invalid and `format` does not produce a stable day key — events never attach to cells. The mobile upcoming list and badges use the same missing fields (`start_datetime`, `event.event_type` vs `entry_type`). Users can create entries successfully (write path is correct) but see an empty or mis-bucketed grid despite `entries.length > 0`.

**Recommended fix:** Add a single mapper (repository or hook) from `calendar_entries` → view model, e.g. synthesize `start_datetime` from `event_date` + (`event_time` || `00:00:00`) with explicit timezone policy (Asia/Riyadh or UTC date-only for all-day), map `entry_type` → display type, `location` → display location. Type `CalendarEvent` (or rename to `CalendarEntry`) to match `calendar_entries`. Unit-test one row with only `event_date` lands on the correct grid cell.

---

#### 2. Type filter query param mismatch — filter never applied server-side

**Location:** `frontend/src/domains/calendar/repositories/calendar.repository.ts` line 55; `supabase/functions/calendar-get/index.ts` lines 28–29, 63–66; `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 61, 76–78, 234–250.

**Why it is a bug:** The repository appends `event_type` to the query string. `calendar-get` reads `entry_type` and filters `.eq('entry_type', entryType)`. The UI Select sets values like `internal_meeting`, `deadline`, etc. (correct enum for `calendar_entries`), but because the param name is wrong, **every type filter request returns the unfiltered set**. Analysts believe they filtered the calendar; the server ignores the constraint.

**Recommended fix:** Change the repository to `params.append('entry_type', filters.event_type)` (or alias both names in the edge function). Align `CalendarEventsFilters` field name to `entry_type` for clarity.

---

### HIGH

#### 3. `dossier_id` filter sent by client; `calendar-get` does not implement it

**Location:** `frontend/src/domains/calendar/repositories/calendar.repository.ts` line 56; `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 76–79; `supabase/functions/calendar-get/index.ts` lines 25–71 (no `dossier_id` handling).

**Why it is a bug:** `UnifiedCalendar` passes `dossier_id: linkedItemId` into the hook for dossier-scoped embedding. The edge function never reads `dossier_id` or filters `.eq('dossier_id', …)`. Any future or embedded dossier-scoped calendar shows all entries the user can see, not entries for that dossier.

**Recommended fix:** In `calendar-get`, parse `dossier_id` (and optionally `linked_item_id`) and apply `.eq('dossier_id', dossierId)` when present. Add an integration test.

---

#### 4. Dossier overview / drawer calendar section reads `calendar_events`, not operational entries

**Location:** `frontend/src/services/dossier-overview.service.ts` lines 783–821; `frontend/src/components/dossier/dossier-overview/DossierOverview.tsx` line 395; `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` line 46.

**Why it is a bug:** `fetchCalendarEvents` queries `.from('calendar_events')` with `start_datetime` / `event_type` / `location_en` — the forum-session table that is largely empty. Operational entries created via `/calendar` live in `calendar_entries` with `event_date` / `entry_type` / `location`. Dossier **Calendar events** tabs and drawer upcoming sections therefore omit real analyst-created calendar entries.

**Recommended fix:** Repoint `fetchCalendarEvents` to `calendar_entries` filtered by `dossier_id`, map columns to `DossierCalendarEvent` (or unify types). Keep `calendar_events` only if forum-session agenda is explicitly surfaced as a separate subsection.

---

#### 5. Recurring-event creation writes `calendar_events` — invisible on main calendar

**Location:** `frontend/src/components/calendar/CalendarEntryForm.tsx` lines 364–381; `frontend/src/domains/calendar/repositories/calendar.repository.ts` lines 240–244; `supabase/functions/recurring-events/index.ts` lines 232, 274, 444+.

**Why it is a bug:** When the user sets a recurrence pattern, the form calls `createRecurringEvent` → `recurring-events` edge, which inserts into `calendar_events`. The main calendar grid reads `calendar_entries` via `calendar-get`. Recurring series created in the UI do not appear in the operational calendar.

**Recommended fix:** Extend `calendar_entries` recurrence columns (`is_recurring`, `recurrence_pattern`, `recurrence_end_date` already exist on the table) and teach `recurring-events` (or a new edge) to expand/store on `calendar_entries`, or have `calendar-get` UNION generated occurrences. Until then, disable recurrence in the form or show an explicit warning.

---

#### 6. Conflict detection only considers `calendar_events`

**Location:** `supabase/functions/calendar-conflicts/index.ts` lines 186, 252–253, 307, 534; `frontend/src/components/calendar/CalendarEntryForm.tsx` (conflict UI wired to `checkConflicts`).

**Why it is a bug:** `check_event_conflicts` RPC and travel-time queries join `calendar_events` and `event_participants`. Operational entries in `calendar_entries` are invisible to conflict detection. Users can schedule overlapping meetings/deadlines that the conflict banner never flags.

**Recommended fix:** Add `check_entry_conflicts` (or extend RPC) over `calendar_entries` using `event_date` + `event_time` + `duration_minutes`, and point the form’s pre-save check at that path.

---

#### 7. Arabic-only titles can fail DB insert (`title_en` NOT NULL)

**Location:** `frontend/src/components/calendar/CalendarEntryForm.tsx` lines 339–342, 383; `supabase/functions/calendar-create/index.ts` lines 117–120; `frontend/src/types/database.types.ts` lines 4600, 4627 (`title_en: string` required on Insert).

**Why it is a bug:** The form sends `title_en: titleEn || undefined` with no requirement that at least one title is present. The edge inserts `title_en` as provided. Postgres rejects NULL/omitted `title_en` on `calendar_entries`. Arabic-first analysts filling only `title_ar` get a failed save (`alert(t('form.save_failed'))`) with no field-level validation.

**Recommended fix:** Client: require `titleEn || titleAr` and default `title_en` to `title_ar` (or a placeholder) before POST. Server: `title_en: title_en ?? title_ar ?? 'Untitled'` for defense in depth.

---

### MEDIUM

#### 8. Week / Day view toggles do not change rendering

**Location:** `frontend/src/routes/_protected/calendar.tsx` lines 23, 42–66, 79–80; `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 34–35, 44 (`viewMode: _viewMode` discarded).

**Why it is a bug:** The page renders Month / Week / Day buttons and passes `viewMode` to `UnifiedCalendar`, but the component ignores the prop and always renders `CalendarMonthGrid` (desktop) or `WeekListMobile` (mobile). Week and Day modes are dead UI.

**Recommended fix:** Branch on `viewMode`: implement week/day components or remove toggles until implemented. Wire `viewMode` into query windows (week start/end, single day).

---

#### 9. Mobile week navigation decoupled from parent month and fetch window

**Location:** `frontend/src/components/calendar/WeekListMobile.tsx` lines 31–44; `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 66–77, 259–260.

**Why it is a bug:** `WeekListMobile` keeps its own `activeWeek` initialized to `startOfWeek(new Date())`. Parent `currentMonth` drives the API `start_date`/`end_date` range and the desktop month header, but changing month in the header does not update `activeWeek`, and swiping weeks inside `WeekListMobile` does not change the fetched range. On mobile, users can navigate to a week outside the loaded month while the event list still reflects only the parent month query.

**Recommended fix:** Lift `activeWeek` to `UnifiedCalendar`, derive fetch range from `max(month, week)` union, or pass `currentMonth`/`activeWeek` as controlled props with shared navigation handlers.

---

#### 10. Date-range filters use ISO timestamps against a `DATE` column — timezone boundary risk

**Location:** `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 66–77; `supabase/functions/calendar-get/index.ts` lines 52–56.

**Why it is a bug:** Filters pass `monthStart.toISOString()` and `monthEnd.toISOString()` (UTC instant strings). `calendar-get` compares them to `event_date` (`date` type). Postgres casts timestamptz to date in the session timezone (typically UTC on Supabase). For users east of UTC, month start local midnight can become the **previous calendar date** in UTC, pulling in stray prior-month rows or excluding first-of-month entries depending on comparison direction.

**Recommended fix:** Send date-only bounds: `format(monthStart, 'yyyy-MM-dd')` and `format(monthEnd, 'yyyy-MM-dd')`. Document that operational entries are date-keyed, not instant-keyed.

---

#### 11. `status` filter param ignored by `calendar-get`

**Location:** `frontend/src/domains/calendar/repositories/calendar.repository.ts` line 57; `supabase/functions/calendar-get/index.ts` (no `status` param).

**Why it is a bug:** Repository forwards `status` but the edge function never filters on it. Any caller expecting to hide `cancelled` entries gets no server-side filtering.

**Recommended fix:** Add optional `.eq('status', status)` in `calendar-get`, or remove the unused filter from the client contract.

---

#### 12. Missing i18n keys — English fallback / raw keys in Arabic UI

**Location:** `frontend/src/components/calendar/UnifiedCalendar.tsx` line 152 (`t('errors.failed_to_load')`); `frontend/src/routes/_protected/calendar/new.tsx` lines 14, 34–48 (`t('calendar.new_event.*')` with default namespace); `frontend/src/i18n/en/calendar.json` (no `errors` or `new_event` sections — verified by search).

**Why it is a bug:** On fetch failure, users see the raw key `errors.failed_to_load` instead of Arabic copy. The `/calendar/new` page uses keys under `calendar.new_event` in the **default** namespace (`common`), but those keys are not defined in `frontend/src/i18n/en/common.json` or `ar/common.json` (only `common.calendar.*` day abbreviations exist). Arabic mode shows English key strings for title, description, and back link.

**Recommended fix:** Add `errors.failed_to_load` to `calendar.json` (en + ar). Either move new-page strings into `calendar.json` (`page.new_event.*`) and use `useTranslation('calendar')`, or add `new_event` block to `common.json` in both locales.

---

#### 13. Month header and mobile datetime formatting omit Arabic `date-fns` locale

**Location:** `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 207, 287 (`format(currentMonth, 'MMMM yyyy')`, `format(..., 'PPp')`).

**Why it is a bug:** In Arabic UI, month names and `PPp` datetime strings render in English because `format` is called without `locale: ar` from `date-fns/locale`. DOW headers in the grid correctly use `DOW_AR`, but the prominent month title and upcoming list timestamps do not.

**Recommended fix:** `import { ar, enUS } from 'date-fns/locale'` and pass `locale: i18n.language === 'ar' ? ar : enUS` to `format`, or use `Intl.DateTimeFormat` with `ar-SA` (consistent with `CalendarTab` engagement view).

---

#### 14. Type badge uses `event.event_type` after API returns `entry_type`

**Location:** `frontend/src/components/calendar/UnifiedCalendar.tsx` line 291; `frontend/src/domains/calendar/types/index.ts` lines 39–42.

**Why it is a bug:** Even after entries load, mobile badges call `t(\`types.${event.event_type}\`)`. Rows have `entry_type` (`internal_meeting`, etc.), not `event_type` (`main_event`, `session`, …). i18n resolves to missing keys or wrong forum labels.

**Recommended fix:** Use `entry_type` in the mapper and UI, or map operational types in the adapter from finding #1.

---

### LOW

#### 15. No edit / detail route for existing entries

**Location:** `frontend/src/components/calendar/CalendarEntryForm.tsx` (supports `entryId` / `isEditing`); `frontend/src/routes/_protected/calendar/` (only `calendar.tsx`, `calendar/new.tsx` — no `$entryId` route).

**Why it is a bug:** Update hooks and `calendar-update` edge exist, but the only create entry points are inline form and `/calendar/new`. Clicking an event opens the dossier drawer when `dossier_id` is set (`calendar.tsx` lines 81–90) but never an edit form. Users cannot correct entries from the calendar UI.

**Recommended fix:** Add `/calendar/$entryId/edit` route (or drawer) passing `entryId` into `CalendarEntryForm`, prefill from `calendar-get` single-row fetch.

---

#### 16. `CalendarEvent` TypeScript type documents wrong table

**Location:** `frontend/src/domains/calendar/types/index.ts` lines 39–65, 75–77 (`entries: CalendarEvent[]`).

**Why it is a bug:** Types encode `calendar_events` forum fields (`event_type`, `start_datetime`, `status: planned|ongoing|…`). TypeScript does not catch the contract mismatch with `calendar_entries`, enabling the critical display bug to compile cleanly.

**Recommended fix:** Split types: `CalendarEntryRow` (DB) and `CalendarEntryView` (UI), or align `CalendarEvent` with generated `Database['public']['Tables']['calendar_entries']['Row']` plus computed fields.

---

#### 17. Form collects participants and reminders not persisted on create

**Location:** `frontend/src/components/calendar/CalendarEntryForm.tsx` lines 351–355; `supabase/functions/calendar-create/index.ts` lines 111–114, 133 (`attendee_ids: []`; no `reminder_minutes` column write).

**Why it is a bug:** Users configure participants and reminder minutes; create path documents participants as out-of-scope and always stores empty `attendee_ids`. Reminder preference is dropped. Not a crash, but silent data loss relative to form labels.

**Recommended fix:** Persist `attendee_ids` when IDs are user UUIDs; add reminder column or link to notification pipeline; until then, hide or disable non-functional fields.

---

#### 18. Agenda / list view keys exist in i18n but no route implements them

**Location:** `frontend/src/i18n/en/calendar.json` lines 187–191 (`view.agenda`); no agenda/list component in `frontend/src/components/calendar/`.

**Why it is a bug:** Product copy promises an agenda view that is not implemented. Lower severity than broken month grid because toggles for week/day already signal incomplete views.

**Recommended fix:** Implement agenda list or remove unused `view.agenda` key until scheduled.

---

#### 19. Week list prev/next uses literal `‹` / `›` without RTL mirroring

**Location:** `frontend/src/components/calendar/WeekListMobile.tsx` lines 52–69.

**Why it is a bug:** Desktop month nav uses `icon-flip` on chevrons for RTL (`UnifiedCalendar.tsx` lines 202, 213). Week list mobile nav uses Unicode angle quotes that do not flip with `dir=rtl`, so visual “back/forward” may disagree with reading direction (aria-labels are correct).

**Recommended fix:** Reuse `ChevronLeft`/`ChevronRight` with `icon-flip` class, matching desktop pattern.

---

## Surfaces reviewed (no additional defects filed)

| Surface                                              | Notes                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `calendar-create` / `calendar-update`                | Correct table; splits `start_datetime` → `event_date` / `event_time` / `duration_minutes`                          |
| `calendar-get`                                       | Correct table; missing filters/mapping only (findings above)                                                       |
| Engagement `CalendarTab`                             | Documented synthetic dates; not operational calendar — OK                                                          |
| `CalendarMonthGrid` RTL                              | `dir` from document; DOW arrays; `toArDigits`; no `ml`/`mr` in component                                           |
| `calendar.css`                                       | Grid layout; centered DOW acceptable                                                                               |
| Backend Express `localhost:5001`                     | Calendar ops go to Supabase Edge Functions via `api-client` (`VITE_SUPABASE_URL/functions/v1`), not Express        |
| Contract tests `tests/contract/calendar-get.test.ts` | Expect legacy `{ events }` + `start`/`end` params — tests drifted from implementation (test debt, not runtime bug) |

---

## Recommended fix order

1. **Adapter + types** (CRITICAL #1, #14, #16) — unblocks grid display immediately.
2. **Query param fixes** (CRITICAL #2, HIGH #3, MEDIUM #11) — restores filtering.
3. **Dossier overview data source** (HIGH #4) — aligns dossier tab with operational entries.
4. **Recurring + conflicts** (HIGH #5, #6) — stop writing/checking wrong table.
5. **i18n + date locale** (HIGH #7, MEDIUM #12–13) — Arabic UX.
6. **View modes + mobile week sync** (MEDIUM #8–9) — complete navigation story.
7. **Edit route** (LOW #15) — round out CRUD.

---

## Inspection metadata

- **Files traced:** 25+ across `frontend/src/routes`, `frontend/src/components/calendar`, `frontend/src/domains/calendar`, `frontend/src/services/dossier-overview.service.ts`, `supabase/functions/calendar-*`, `supabase/functions/recurring-events`, engagement `CalendarTab`, `frontend/src/i18n/{en,ar}/calendar.json`.
- **Runtime verification:** Not executed in this pass; defects inferred from static contract alignment between types, edge functions, and UI field access.
- **Report path:** `reports/calendar-workflow-inspection-2026-06-09.md`
