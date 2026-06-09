# Intake / Service-Request Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + schema verification (no live browser session this pass)  
**Environment:** Frontend `http://localhost:5173`, backend `http://localhost:5001`, staging Supabase `zkrcjzdemdmwhearhfgg`  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Executive summary

The intake workflow spans **submission** (`/intake/new` → `IntakeForm` → `intake-tickets-create`), **triage queue** (`/my-work/intake` → `IntakeQueuePage` direct PostgREST read + `TriagePanel` → `intake-tickets-triage`), **detail** (`/intake/tickets/$id` → `TicketDetail` → `intake-tickets-get`), **assignment** (via triage accept/override, not a separate UI), **SLA** (`find_sla_configuration` RPC + hardcoded `SLACountdown`), and **conversion** (`intake-tickets-convert` RPC or `engagement-dossiers/promote-intake` for engagement tickets). Legacy route `/intake/queue` redirects to `/my-work/intake`.

Several **hard failures** block core analyst actions: **Close Ticket** calls a non-existent edge function; **Convert to Artifact** sends the wrong ticket id field; **manual triage override** sends camelCase fields the edge function does not read; **SLA pause/resume** calls RPCs that are not defined in migrations. **Arabic UI** on queue, detail, and triage surfaces extensive English fallbacks because keys are missing or namespaced incorrectly. **Dossier-linked intake rows** fail PostgREST queries due to removed column names and a bad embed.

Verified carve-outs **not** flagged: intake `status` lifecycle (`draft` … `merged`), urgency enum including `critical`, and real columns `title`, `title_ar`, `assigned_to`, `external_deadline`, `urgency`, `status`.

| Area                                         | Verdict                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| Submission form (`IntakeForm` + create edge) | Partial — form validation OK; create edge allows NULL bilingual fields            |
| Triage queue (`IntakeQueuePage`)             | Partial — loads via `select('*')`; errors swallowed as empty state                |
| Ticket detail (`TicketDetail`)               | Partial — get edge OK; close/convert broken                                       |
| Triage (`TriagePanel` + triage edge)         | Partial — accept may work; override broken; UI/API casing mismatch                |
| Assignment                                   | Partial — only via triage; standalone assign edge unused by UI                    |
| SLA tracking                                 | Partial — preview RPC works; detail countdown hardcoded; pause/resume RPC missing |
| Conversion to engagement                     | Pass path exists (`promote-intake`); generic convert broken                       |
| i18n (AR)                                    | **Fail** — large key gaps on queue, detail, triage                                |
| RTL (forms / queue)                          | Pass — logical properties; no `ml`/`mr`/`pl`/`pr` in intake pages                 |
| Dossier-linked intakes                       | **Fail** — wrong columns in `dossier-overview.service.ts`                         |

---

## Architecture traced

```
Submit          /intake/new                    → IntakeForm → useCreateTicket → intake-tickets-create (edge)
Queue           /my-work/intake                → IntakeQueuePage → supabase.from('intake_tickets').select('*')
                /intake/queue                  → redirect → /my-work/intake
Detail          /intake/tickets/$id            → TicketDetail → useTicket → intake-tickets-get (edge)
Triage          TriagePanel (dialog + tab)     → useTriageSuggestions / useApplyTriage → intake-tickets-triage/{id}/triage
Close           TicketDetail InputDialog       → useCloseTicket → POST /intake-tickets-close  ← MISSING
Convert         TicketDetail InputDialog       → useConvertTicket → intake-tickets-convert → convert_ticket_to_artifact RPC
Promote         TicketDetail (engagement only) → usePromoteIntake → engagement-dossiers/promote-intake
SLA preview     IntakeForm                     → useGetSLAPreview → find_sla_configuration RPC
SLA countdown   TicketDetail                   → SLACountdown (hardcoded minutes from priority)
SLA pause       SLACountdown                   → pause_sla_timer / resume_sla_timer RPC  ← NOT IN MIGRATIONS
Dossier tab     fetchWorkItems (overview)      → intake_tickets select with legacy column names  ← BROKEN
```

**Schema reference (generated types):** `frontend/src/types/database.types.ts` — `intake_tickets` Row includes `title`, `title_ar`, `description`, `description_ar`, `assigned_to`, `external_deadline`, `urgency`, `status`, `priority`, etc. No `subject`, `title_en`, `sla_deadline`, or `assigned_to_id`.

**Status enum (DB):** `draft`, `submitted`, `triaged`, `assigned`, `in_progress`, `converted`, `closed`, `merged`.

---

## Findings

### CRITICAL

#### 1. Close-ticket edge function is missing

**Location:** `frontend/src/domains/intake/repositories/intake.repository.ts` lines 69–71; `frontend/src/domains/intake/hooks/useIntakeApi.ts` lines 158–169; `frontend/src/pages/TicketDetail.tsx` lines 323–387.

**Why it is a bug:** `closeTicket()` POSTs to `/intake-tickets-close`, but there is no `supabase/functions/intake-tickets-close/` directory in the repo (only contract tests reference it in `backend/tests/contract/close.test.ts`). Any "Close Ticket" action on the detail page returns 404 from the functions router. This is a complete failure of the close path, not a styling issue.

**Recommended fix:** Implement and deploy `intake-tickets-close` (validate resolution, update `status` to `closed`, set `resolution` / `resolution_ar`, `closed_at`, audit log). Align request body with the hook (`ticket_id` or `id` — pick one and map in the hook).

---

#### 2. Convert ticket sends `ticket_id`; edge function requires `id`

**Location:** `frontend/src/domains/intake/hooks/useIntakeApi.ts` lines 121–129; `supabase/functions/intake-tickets-convert/index.ts` lines 52–63.

**Why it is a bug:** The mutation spreads `{ ...data, ticket_id: ticketId }`. The convert edge reads `const ticketId = raw.id` and returns 400 `"Ticket ID is required"` when `id` is absent. "Convert to Artifact" on a triaged ticket always fails before reaching `convert_ticket_to_artifact`.

**Recommended fix:** Pass `id: ticketId` (or teach the edge function to accept `ticket_id` as an alias, matching `promote-intake`).

---

#### 3. Dossier work tab intake query uses removed columns and invalid embed

**Location:** `frontend/src/services/dossier-overview.service.ts` lines 723–754.

**Why it is a bug:** The query is:

```typescript
.select('*, assigned_to:assigned_to_id(full_name)')
```

Staging/live schema has `assigned_to` (UUID FK to users), not `assigned_to_id`. The mapper reads `i.subject`, `i.title_en`, `i.sla_deadline`, `i.assigned_to_id`, and compares `status` to `'completed'` / `'cancelled'` (work-item statuses, not intake `closed` / `merged`). PostgREST returns 42703 for unknown columns/embeds, so linked intakes on dossier overview tabs fail silently (empty list) or error depending on error handling upstream.

**Recommended fix:** Select real columns: `id, title, title_ar, description, description_ar, status, priority, urgency, assigned_to, external_deadline, created_at, updated_at`. Embed assignee via `assigned_to` → `users` or `profiles` per FK. Map intake status to display/overdue using `external_deadline` or SLA policy, not `sla_deadline`.

---

### HIGH

#### 4. Manual triage override sends camelCase; edge expects snake_case

**Location:** `frontend/src/components/triage-panel/TriagePanel.tsx` lines 87–98; `supabase/functions/intake-tickets-triage/index.ts` lines 620–639.

**Why it is a bug:** Override posts `{ action: 'override', assignedTo, assignedUnit, overrideReason, overrideReasonAr }`. The edge checks `body.override_reason`, `body.assigned_to`, `body.assigned_unit`. Missing `override_reason` yields 400 even when the user filled the textarea. Assignee/unit overrides are ignored.

**Recommended fix:** Map fields in `useApplyTriage` or `applyTriage` repository call: `assigned_to`, `assigned_unit`, `override_reason`, `override_reason_ar`.

---

#### 5. SLA pause/resume RPCs are referenced but never migrated

**Location:** `frontend/src/domains/intake/hooks/useIntakeApi.ts` lines 278–312; `frontend/src/components/sla-countdown/SLACountdown.tsx` lines 48–50.

**Why it is a bug:** `usePauseSLA` / `useResumeSLA` call `supabase.rpc('pause_sla_timer')` and `resume_sla_timer`. Grep across `supabase/migrations/` finds **no** definitions for these functions (only `find_sla_configuration` exists in `20260116600001_sla_configurations.sql`). Steward+ users see pause controls that fail at runtime.

**Recommended fix:** Add migrations for pause/resume RPCs (or remove UI affordances until implemented).

---

#### 6. Create edge writes attachments to non-existent `ticket_attachments` table

**Location:** `supabase/functions/intake-tickets-create/index.ts` lines 210–212; schema uses `intake_attachments` per `20250129002_create_intake_attachments_table.sql`.

**Why it is a bug:** If `attachments` array is ever non-empty, insert targets `ticket_attachments`, which does not exist. Error is logged but ticket creation succeeds without links — silent data loss.

**Recommended fix:** Change table name to `intake_attachments` and match column names from that migration.

---

#### 7. Intake queue hides query failures behind empty state

**Location:** `frontend/src/pages/IntakeQueue.tsx` lines 128–160, 417–434.

**Why it is a bug:** `useQuery` throws on PostgREST/RLS errors, but the component only branches on `isLoading` and `tickets.length === 0`. On error, `data` defaults to `[]`, so users see `IntakeRoleEmptyState` ("no tickets") instead of `queue.error`. Operators cannot distinguish permission failures from an genuinely empty queue.

**Recommended fix:** Destructure `isError` / `error` and render `queue.error` (or actionable error UI) when the fetch fails.

---

#### 8. Missing / mis-namespaced i18n keys on queue, detail, and triage (Arabic fallback)

**Locations:**

- `frontend/src/pages/IntakeQueue.tsx` — uses keys like `intake.description`, `intake.filters.pendingTriage`, `intake.status.*` with default namespace `common` (lines 114, 276–359, 482).
- `frontend/src/pages/TicketDetail.tsx` — entire `ticketDetail.*` block (lines 108–408); not present in `frontend/src/i18n/{en,ar}/intake.json`.
- `frontend/src/components/triage-panel/TriagePanel.tsx` — most `triage.*` keys except `overrideReasonLabel` / `overrideReasonRequired`; line 299 uses `intake.form.requestType.options.*` inside the `intake` namespace (wrong prefix — should be `form.requestType.options.*`).

**Why it is a bug:** `frontend/src/i18n/en/intake.json` and `ar/intake.json` define `queue.status.*` but not `intake.status.*`, `intake.filters.pendingTriage`, or any `ticketDetail` / full `triage` trees. With `useTranslation(['common', 'intake'])`, keys prefixed `intake.` resolve against the **common** namespace first and miss. Arabic mode shows English `defaultValue` strings throughout the queue and detail flows.

**Recommended fix:** Add missing keys to both `en/intake.json` and `ar/intake.json`, or fix call sites to use `t('queue.status.submitted', { ns: 'intake' })`, `t('queue.subtitle', { ns: 'intake' })`, etc. Add `ticketDetail` and full `triage` sections to both locale files.

---

### MEDIUM

#### 9. Triage suggestions API returns snake_case; UI expects camelCase

**Location:** `supabase/functions/intake-tickets-triage/index.ts` lines 566–575; `frontend/src/components/triage-panel/TriagePanel.tsx` lines 293–331, 62–77.

**Why it is a bug:** GET returns `request_type`, `suggested_unit`, `suggested_assignee`, `confidence_scores`, `model_info`. The panel reads `requestType`, `suggestedUnit`, `suggestedAssignee`, `confidenceScores`, `modelInfo.name`. Urgency/sensitivity still display; request type and suggested unit cards stay hidden; model name shows "Unknown". Accept path may still work because the edge re-reads the latest `triage_decisions` row server-side, but the UI misrepresents ML output.

**Recommended fix:** Normalize to camelCase in the edge response or map snake_case in `useTriageSuggestions` before the panel consumes data.

---

#### 10. Convert dialog offers `dossier` target; RPC does not support it

**Location:** `frontend/src/pages/TicketDetail.tsx` lines 344–353; `supabase/functions/intake-tickets-convert/index.ts` lines 66–77; `supabase/migrations/20250129011_create_conversion_functions.sql` lines 46–51.

**Why it is a bug:** UI select includes `dossier`. Edge allows `dossier` in validation list, but `convert_ticket_to_artifact` CASE only handles `engagement`, `position`, `mou_action`, `foresight`. Choosing Dossier fails at RPC with invalid target type even after fixing the `id` field bug.

**Recommended fix:** Remove dossier from UI until RPC supports it, or extend RPC to create/link dossier records.

---

#### 11. Create edge may violate NOT NULL on bilingual columns

**Location:** `supabase/functions/intake-tickets-create/index.ts` lines 163–165; schema `20250129001_create_intake_tickets_table.sql` lines 21–23; `database.types.ts` Insert requires `title_ar`, `description_ar`.

**Why it is a bug:** Edge sets `title_ar: body.title_ar || null` and `description_ar: body.description_ar || null`. Non-form API clients sending only English fields get a Postgres NOT NULL violation on insert. The React form requires both via Zod, so the web path is protected; the edge contract is still wrong.

**Recommended fix:** Require both AR fields in edge validation, or default `title_ar` / `description_ar` from EN copies instead of NULL.

---

#### 12. Ticket detail SLA countdown ignores SLA configuration and `external_deadline`

**Location:** `frontend/src/pages/TicketDetail.tsx` lines 152–175.

**Why it is a bug:** Countdown uses hardcoded minutes from `ticket.priority` (`urgent`/`high` → 30/480, else 60/1440). It ignores `slaStatus` returned by `intake-tickets-get`, `find_sla_configuration`, and the `external_deadline` column present on live tickets. Analysts see SLA timers that may not match configured policy or external party deadlines.

**Recommended fix:** Drive targets from `ticket.slaStatus` or `useGetSLAPreview(ticket.urgency, …)`; surface `external_deadline` when set.

---

#### 13. `intake-tickets-list` WIP stats reference invalid status `awaiting_info`

**Location:** `supabase/functions/intake-tickets-list/index.ts` lines 230, 259.

**Why it is a bug:** Stats query filters `.in('status', [..., 'awaiting_info'])` and increments `awaiting_info` counters, but `ticket_status` enum has no `awaiting_info` value (`database.types.ts` lines 39354–39362). Stats branch never counts real tickets for that bucket.

**Recommended fix:** Remove `awaiting_info` or add a migration extending `ticket_status` if product requires it.

---

#### 14. Stale `INTAKE_TICKETS_COLUMNS` constant documents wrong schema

**Location:** `frontend/src/lib/query-columns.ts` lines 107–112.

**Why it is a bug:** `LIST` includes `subject`, `title_en`, `sla_deadline`, `assigned_to_id`. Live schema uses `title`, `assigned_to`, `external_deadline`. Any future consumer copying this constant will reproduce PostgREST 42703 errors (same class as dossier-overview).

**Recommended fix:** Align constant with `database.types.ts` intake_tickets Row fields.

---

### LOW

#### 15. Intake form swallows submission errors to console only

**Location:** `frontend/src/components/intake-form/IntakeForm.tsx` lines 130–132.

**Why it is a bug:** `onSubmit` catch block only `console.error`s. Users rely on `createTicketMutation.isError` banner; thrown errors outside the mutation path would show no UI feedback.

**Recommended fix:** Set local error state or rethrow so the existing error banner covers all failure modes.

---

#### 16. Queue priority badge renders raw DB enum in English

**Location:** `frontend/src/pages/IntakeQueue.tsx` lines 478–480.

**Why it is a bug:** Badge text is `{ticket.priority}` (e.g. `urgent`) without `t('queue.priority.urgent', { ns: 'intake' })`. Arabic users see English priority tokens on cards (status badge has the same key-path bug as finding 8).

**Recommended fix:** Translate via `intake` namespace `queue.priority.*` and `queue.status.*`.

---

#### 17. Standalone assign edge function is not wired from the UI

**Location:** `supabase/functions/intake-tickets-assign/index.ts` (exists); no frontend `useAssignTicket` / repository call.

**Why it is a bug:** Assignment only happens inside triage accept/override. Supervisors cannot reassign from detail view via the dedicated assign API. This is a product gap if assignment after triage is required without re-opening triage.

**Recommended fix:** Add assign UI on ticket detail calling `intake-tickets-assign/{id}/assign`, or document triage as the sole assignment path.

---

## Items verified as OK (not defects)

- **Urgency `critical`** on intake tickets — correct for `urgency_level` enum; not conflated with work-item `urgent` priority.
- **Intake status lifecycle** — queue filters and kanban mappers use DB enum values (`submitted`, `triaged`, etc.), not unified work-item statuses.
- **Column names on main queue query** — `IntakeQueuePage` uses `.select('*')` against real table; no `subject` / `sla_deadline` in that path.
- **Create ticket field mapping** — `useCreateTicket` maps to snake_case for create edge (`request_type`, `title_ar`, `dossier_id`, etc.).
- **Ticket detail fetch** — `intake-tickets-get` returns nested `{ ticket, attachments, … }` with camelCase ticket object; `TicketDetail` unwraps `(response)?.ticket ?? response`.
- **Promote to engagement** — `engagement-dossiers/promote-intake` validates `ticket_id`, creates dossier + engagement, marks ticket converted (separate from generic convert).
- **RTL on intake surfaces** — `IntakeForm`, `IntakeQueuePage`, `TicketDetail`, `TriagePanel` use logical spacing (`ms-*`, `text-start`, `dir="rtl"` on AR fields); no physical `ml`/`mr`/`pl`/`pr` violations found in these files.
- **Legacy route redirect** — `/intake/queue` and `/intake/` redirect to `/my-work/intake` as documented.

---

## Suggested fix order

1. Implement `intake-tickets-close` and fix convert `id` / triage snake_case payloads (unblocks detail actions).
2. Fix `dossier-overview.service.ts` intake select (unblocks dossier tab intakes).
3. Add i18n keys and fix namespace prefixes on queue/detail/triage.
4. Add SLA pause/resume RPCs or hide controls; wire countdown to real SLA config / `external_deadline`.
5. Clean up create attachments table name and list-edge `awaiting_info` reference.

---

## Files inspected (primary)

| Layer         | Paths                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes        | `frontend/src/routes/_protected/intake/new.tsx`, `queue.tsx`, `tickets.$id.tsx`, `index.tsx`, `my-work/intake.tsx`                                                                                            |
| UI            | `IntakeForm.tsx`, `IntakeQueue.tsx`, `TicketDetail.tsx`, `TriagePanel.tsx`, `SLACountdown.tsx`, `TypeSpecificFields.tsx`                                                                                      |
| Domain        | `domains/intake/hooks/useIntakeApi.ts`, `repositories/intake.repository.ts`, `types/index.ts`                                                                                                                 |
| Types / i18n  | `types/intake.ts`, `types/database.types.ts`, `i18n/{en,ar}/intake.json`                                                                                                                                      |
| Edge          | `intake-tickets-{create,get,list,triage,convert,assign}.ts`, `engagement-dossiers/index.ts` (promote-intake)                                                                                                  |
| SQL           | `20250129001_create_intake_tickets_table.sql`, `20250129011_create_conversion_functions.sql`, `20260116600001_sla_configurations.sql`, `20260206120001_correspondence_participants.sql` (`external_deadline`) |
| Cross-cutting | `dossier-overview.service.ts`, `query-columns.ts`                                                                                                                                                             |

---

_End of report._
