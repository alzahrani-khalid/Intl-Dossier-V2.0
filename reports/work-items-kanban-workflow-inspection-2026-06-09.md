# Work Items / Unified Kanban Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + staging Supabase verification  
**Environment:** Frontend `http://localhost:5173`, backend `http://localhost:5001`, staging project `zkrcjzdemdmwhearhfgg`  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Executive summary

The unified work-item stack spans **My Work** (`/my-work` → `useUnifiedWork` → `unified-work-list` edge function → `get_unified_work_items` RPC), **Work Board** (`/kanban` → `useUnifiedKanban` → `get_unified_work_kanban` RPC), and **dossier-scoped work** (`DossierWorkItemsTab` → `fetchDossierOverview` → `fetchWorkItems` in `dossier-overview.service.ts`). Tasks on the board group correctly by `workflow_stage`. **Commitments are mis-grouped** because the RPC returns `workflow_stage: null` and meaningful `column_key` values (`overdue`, `in_progress`, …) while `WorkBoard` buckets only by `workflow_stage ?? 'todo'`. **Linked intake tickets on dossier work tabs fail to load** because the intake query references removed columns and a non-existent PostgREST embed. Several **i18n gaps** leave English on the kanban cards in Arabic mode.

| Area                                                     | Verdict                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `get_unified_work_kanban` RPC (staging)                  | Pass — returns tasks + commitments                        |
| `unified-work-list` / `get_unified_work_items` (staging) | Pass                                                      |
| Work Board column placement (tasks)                      | Pass                                                      |
| Work Board column placement (commitments)                | **Fail** — all land in To Do                              |
| Dossier work tab (tasks, commitments)                    | Pass                                                      |
| Dossier work tab (linked intakes)                        | **Fail** — query errors                                   |
| KCard i18n (AR)                                          | **Fail** — hardcoded EN chips / overdue text              |
| RTL layout (board.css, `dir`)                            | Pass — logical properties, no `ml`/`mr` in WorkBoard tree |
| AddToDossier cache invalidation                          | Partial — tasks only                                      |

---

## Architecture traced

```
My Work list     /my-work          → useUnifiedWork → unified-work.service → unified-work-list → get_unified_work_items
Work Board       /kanban           → useUnifiedKanban → get_unified_work_kanban (+ get_kanban_column_counts)
Dossier tab      …/tasks           → DossierWorkItemsTab → fetchDossierOverview(include_sections: work_items) → fetchWorkItems
Add to dossier                     → AddToDossierDialogs (TaskDialog / CommitmentDialog / IntakeDialog) → create + work_item_dossiers links
DnD mutations                      → useUnifiedKanbanStatusUpdate → tasks | aa_commitments | intake_tickets
Column utilities                   → column-definitions.ts (mapStatusToColumnKey / mapColumnKeyToStatus) — used by hook optimistic updates, not by WorkBoard grouping
```

**Canonical column constants:** `frontend/src/lib/query-columns.ts` (`TASKS_COLUMNS`, `COMMITMENTS_COLUMNS`, `INTAKE_TICKETS_COLUMNS`).  
**Live schema reference:** `frontend/src/types/database.types.ts` (`aa_commitments.due_date`, `intake_tickets.assigned_to`, `commitment_status` includes `overdue`).

---

## Staging verification (authenticated)

Credentials from `.env.test`. Anon key from `frontend/.env.development`.

### `get_unified_work_kanban` — commitments

All eight personal commitments returned:

- `workflow_stage`: always `null`
- `column_key`: always `"overdue"` (matches `status: "overdue"`)
- `is_overdue`: `true`

Tasks returned aligned `workflow_stage` with `column_key` (`todo` / `in_progress`).

### `get_unified_work_kanban` — tasks (sample)

```
in_progress  in_progress  in_progress
todo         todo         pending
```

### Intake column probe

```http
GET /rest/v1/intake_tickets?select=subject,sla_deadline,assigned_to_id&limit=1
→ 42703 column intake_tickets.subject does not exist
```

```http
GET /rest/v1/intake_tickets?select=*,assigned_to:assigned_to_id(full_name)&limit=1
→ PGRST200 Could not find a relationship between 'intake_tickets' and 'assigned_to_id'
```

Actual columns (staging `select=*`): `title`, `title_ar`, `assigned_to`, `external_deadline`, `urgency`, `status` (`assigned` | `in_progress`), etc. No `subject`, `sla_deadline`, `assigned_to_id`, or `title_en`.

### `work_item_dossiers` intakes

No `work_item_type = intake` rows on staging at inspection time; intake bug is **latent** until links exist but the broken query path is confirmed.

---

## Defects (real issues only)

### 1. HIGH — Work Board places all commitments in the To Do column

|          |                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **File** | `frontend/src/pages/WorkBoard/WorkBoard.tsx` **L119–133**, **L137–144**                                                         |
| **Also** | `frontend/src/hooks/useUnifiedKanban.ts` **L142–154** (hook groups RPC rows by `column_key` correctly; WorkBoard discards that) |

**Why it is a bug:** `get_unified_work_kanban` sets `workflow_stage` to `NULL` for commitments and encodes board position in `column_key` (`overdue`, `in_progress`, `done`, …). `WorkBoard` builds `byStage` and `kanbanItems[].column` with `it.workflow_stage ?? 'todo'`. On staging, every commitment has `workflow_stage: null`, so **all commitments render in To Do** regardless of `column_key` or `status` (`overdue` included). Column counts in headers are wrong for the same reason. `useUnifiedKanban` already exposes items with correct `column_key`; the page ignores it.

**Fix:** For `source !== 'task'`, derive the board column from `column_key`, mapping `overdue` → `todo` (or a dedicated overdue swimlane if product requires it). Use `mapStatusToColumnKey(item.source, item.status, item.workflow_stage)` as fallback. Set `kanbanItems[].column` with the same resolver so `KanbanCards` filtering matches `byStage`.

---

### 2. HIGH — Dossier work tab cannot load linked intake tickets

|          |                                                                  |
| -------- | ---------------------------------------------------------------- |
| **File** | `frontend/src/services/dossier-overview.service.ts` **L723–753** |

**Why it is a bug:** When `work_item_dossiers` contains `work_item_type = 'intake'`, the service runs:

```ts
.from('intake_tickets')
.select('*, assigned_to:assigned_to_id(full_name)')
```

Staging returns **PGRST200** (no FK on `assigned_to_id`). The handler never checks `error`; `intakes` is empty and **linked intakes are silently omitted**. The mapper also reads non-existent fields: `subject`, `title_en`, `sla_deadline`, `assigned_to_id`; uses intake lifecycle `completed`/`cancelled` for overdue checks instead of `closed`/`merged`/`converted`; and passes raw intake `status` (e.g. `assigned`) into `WorkItemStatus` without mapping — `workItemStatus.assigned` is missing from `dossier-overview` i18n.

**Fix:**

1. `select` using `COLUMNS.INTAKE_TICKETS` aligned to live schema: `id, title, title_ar, description, description_ar, status, priority, urgency, assigned_to, external_deadline, created_at, updated_at`.
2. Resolve assignee names via batched `users` lookup on `assigned_to` (same pattern as tasks at L617–639).
3. Map intake `status` → unified display status via `mapStatusToColumnKey('intake', status)` or a dossier-specific mapper; compute overdue from `external_deadline` (or `submitted_at` + SLA policy).
4. Add `workItemStatus` keys for intake-native statuses **or** map to unified keys before `t()`.
5. Check PostgREST `error` and surface/log failures instead of swallowing.

---

### 3. MEDIUM — KCard shows hardcoded English on kanban cards (Arabic regression)

|          |                                                                   |
| -------- | ----------------------------------------------------------------- |
| **File** | `frontend/src/pages/WorkBoard/KCard.tsx` **L67–69**, **L100–102** |

**Why it is a bug:** In Arabic mode, title and dossier name respect `title_ar`, but kind chips (`Task` / `Commitment` / `Intake`), priority chips (capitalized raw enum), and overdue line (`Overdue ${n}d`) are **hardcoded English**. `unified-kanban.json` already defines `sources.task|commitment|intake`, `priority.*`, and `card.overdue` / `card.dueToday` (AR bundles present at `frontend/src/i18n/ar/unified-kanban.json`).

**Fix:** Use `const { t } = useTranslation('unified-kanban')` and replace literals with `t('sources.task')`, `t(\`priority.${item.priority}\`)`, and `t('card.overdue', { count })`or equivalent; keep`toArDigits` for numeric portions.

---

### 4. MEDIUM — Commitment / intake Add-to-Dossier omit work-tab cache invalidation

|          |                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **File** | `frontend/src/components/dossier/AddToDossierDialogs.tsx` **L352–357** (TaskDialog only), **L479–501** (CommitmentDialog), **L206–226** (IntakeDialog) |

**Why it is a bug:** `TaskDialog` invalidates `['dossier-tab', 'work_items', dossierId]` and timeline keys after create. `CommitmentDialog` and `IntakeDialog` create links but **never invalidate** those queries. `DossierWorkItemsTab` (`frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx` **L26–30**) will show stale data until `STALE_TIME.NORMAL` expires.

**Fix:** After successful `createLinks.mutateAsync`, mirror TaskDialog invalidation for commitment and intake paths (work_items + timeline).

---

### 5. MEDIUM — `INTAKE_TICKETS_COLUMNS.LIST` documents non-existent columns

|          |                                                  |
| -------- | ------------------------------------------------ |
| **File** | `frontend/src/lib/query-columns.ts` **L107–111** |

**Why it is a bug:** `LIST` includes `subject`, `title_en`, `sla_deadline`, `assigned_to_id`. Staging schema has `title`, `assigned_to`, `external_deadline` (verified via PostgREST `42703` on `subject`). Any consumer copying this constant will get runtime query failures — same class of bug as dossier-overview intake fetch.

**Fix:** Align with `database.types.ts` / live `intake_tickets` row; remove dead columns; add a comment that intake uses `urgency` (enum includes `critical`) distinct from work-item `priority`.

---

### 6. MEDIUM — Commitment drag-and-drop fails when dropped on another commitment card

|          |                                                           |
| -------- | --------------------------------------------------------- |
| **File** | `frontend/src/pages/WorkBoard/WorkBoard.tsx` **L189–197** |

**Why it is a bug:** `handleDragEnd` resolves the target column from `overCard.workflow_stage` when `over.id` is a card UUID. Commitments always have `workflow_stage: null`. With `@dnd-kit` `closestCenter`, drops often target a sibling card; dropping a commitment onto another commitment leaves `targetStage` undefined and the handler returns without calling `update.mutate`. Drops on empty column chrome (section droppable) still work.

**Fix:** When resolving sibling cards, use `overCard.column` (set from board column resolver) or `column_key` / `mapStatusToColumnKey`, not `workflow_stage` alone.

---

### 7. MEDIUM — Repo kanban RPC migrations out of sync with live `aa_commitments` schema

|          |                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| **File** | `supabase/migrations/20260206200004_kanban_search_support.sql` **L100–142** (and earlier kanban migrations) |

**Why it is a bug:** Migration SQL selects `c.deadline`, `c.is_overdue`, `c.owner_id` and joins `c.owner_id = u.id`. Live `aa_commitments` (types + staging) uses `due_date`, `owner_user_id`; overdue is a `commitment_status` value, not a boolean column. **Staging RPC works** (function was patched in DB), but a **fresh database built only from repo migrations** can break `get_unified_work_kanban` for commitments.

**Fix:** Add a forward migration replacing commitment branch with `due_date`, `owner_user_id`, computed `is_overdue` / `days_until_due`, and `column_key` logic that maps `status = 'overdue'` to a board column (staging already returns `column_key: 'overdue'`).

---

### 8. LOW — `useUnifiedKanban` header comment understates `task_status` enum

|          |                                                     |
| -------- | --------------------------------------------------- |
| **File** | `frontend/src/hooks/useUnifiedKanban.ts` **L10–13** |

**Why it is a bug:** Comment lists `task_status: pending, in_progress, completed, cancelled` but `20260206200001_normalize_task_status.sql` and `database.types.ts` include **`review`**. Misleading for maintainers; not a runtime failure.

**Fix:** Update comment to include `review` and note `workflow_stage` is source of truth with trigger sync.

---

### 9. LOW — Work Board does not subscribe to realtime updates

|          |                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **File** | `frontend/src/pages/WorkBoard/WorkBoard.tsx` (no `useUnifiedKanbanRealtime`); hook at `frontend/src/hooks/useUnifiedKanban.ts` **L480–562** |

**Why it is a note:** `useUnifiedKanbanRealtime` exists and filters commitments on `owner_user_id` (correct). Work Board never calls it; board data refreshes only on window focus / manual refetch. My Work uses `useUnifiedWorkRealtime`. May be intentional for Phase 39; operators see stale board if another session mutates items.

**Fix:** If live board is required, call `useUnifiedKanbanRealtime('personal', null, userId)` from WorkBoard with auth user id.

---

## Areas checked — no defect found

| Check                                                         | Result                                                                                                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy `commitments` / `assignments` tables in frontend hooks | Not referenced; uses `aa_commitments` / `tasks`                                                                                                                           |
| Task deadline field on board / My Work                        | RPC exposes unified `deadline`; tasks use `sla_deadline` at DB layer — consistent in RPC                                                                                  |
| My Work `priority.critical` i18n                              | Present in `en` + `ar` `my-work.json` (intake urgency / `priority_level` carve-out)                                                                                       |
| `unified-kanban` column / source keys (ar/en)                 | Bundles aligned; KCard simply does not use them                                                                                                                           |
| WorkBoard RTL                                                 | `dir={rtl\|ltr}` on root; `board.css` uses `margin-inline`, `border-inline-start`; no `ml-*`/`mr-*` in WorkBoard tree                                                     |
| `STAGE_TO_STATUS` + review column for tasks                   | `review` → `in_progress` in mutation, but DB trigger `sync_task_status_from_workflow_stage` sets `status := 'review'` when `workflow_stage` changes — final state correct |
| Intake excluded from Work Board                               | `SOURCE_FILTER: ['commitment','task']` — intentional (D-05)                                                                                                               |
| `/my-work/board`                                              | Redirects to `/kanban` (`frontend/src/routes/_protected/my-work/board.tsx`)                                                                                               |
| `COMMITMENTS_COLUMNS.SUMMARY`                                 | Matches live schema (`due_date`, `owner_user_id`) — dossier commitment fetch OK                                                                                           |

---

## Recommended fix order

1. **WorkBoard column resolver** (commitments + `column_key` / `overdue`) — unblocks correct board UX immediately.
2. **Dossier intake fetch** — unblocks dossier work tab for intake links.
3. **KCard i18n** — Arabic parity on `/kanban`.
4. **AddToDossier invalidation** — dossier tab freshness after create.
5. **Migration realignment** — protect fresh deploys and CI DB resets.
6. **DnD target resolution** — polish commitment moves in populated columns.

---

## Files inspected (primary)

- `frontend/src/pages/WorkBoard/WorkBoard.tsx`, `KCard.tsx`, `BoardColumn.tsx`, `BoardToolbar.tsx`, `board.css`
- `frontend/src/hooks/useUnifiedKanban.ts`, `useUnifiedWork.ts`
- `frontend/src/services/dossier-overview.service.ts`, `unified-work.service.ts`
- `frontend/src/components/dossier/AddToDossierDialogs.tsx`, `tabs/DossierWorkItemsTab.tsx`
- `frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx`
- `frontend/src/components/unified-kanban/utils/column-definitions.ts`
- `frontend/src/lib/query-columns.ts`
- `frontend/src/pages/my-work/MyWorkDashboard.tsx`, `components/WorkItemCard.tsx`
- `supabase/functions/unified-work-list/index.ts`, `tasks-create/index.ts`
- `supabase/migrations/20260206200004_kanban_search_support.sql`, `20260206200001_normalize_task_status.sql`
- `frontend/src/i18n/{en,ar}/unified-kanban.json`, `my-work.json`, `dossier-overview.json`

---

_End of report._
