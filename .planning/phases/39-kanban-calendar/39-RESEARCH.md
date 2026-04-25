# Phase 39: kanban-calendar — Research

**Researched:** 2026-04-25
**Domain:** Verbatim handoff port of `/kanban` (WorkBoard) and `/calendar` (UnifiedCalendar month view) using Phase 33 tokens, Phase 36 AppShell, Phase 37 `<DossierGlyph>`, Phase 38 plan/wave pattern
**Confidence:** HIGH (CONTEXT.md is highly prescriptive; codebase verified directly)

<user_constraints>

## User Constraints (from 39-CONTEXT.md)

### Locked Decisions (D-01 .. D-16) — copied verbatim

- **D-01:** Replace `/kanban` route outright. Build fresh `WorkBoard.tsx` from handoff `WorkBoardPage` verbatim. Rewrite `frontend/src/routes/_protected/kanban.tsx` to mount the new component. No `legacy/` folder — git history is the archive.
- **D-02:** Reskin month view inside existing `UnifiedCalendar.tsx`. Keep `linkedItemType` / `linkedItemId` props intact. Rewrite ONLY the month-grid render block (the `eachDayOfInterval` + day-cell map) to handoff `.cal-grid`. Week / Day modes stay visually-untouched.
- **D-03:** DnD enabled only when group-by mode = `'status'`. Wire `@dnd-kit/core` + `@dnd-kit/sortable` + `useUnifiedKanbanStatusUpdate`. In `'dossier'` / `'owner'` modes, drag is disabled at the sensor level and `cursor: grab` falls back to `cursor: pointer`.
- **D-04:** Drop swimlanes / WIP / bulk multi-select / realtime presence entirely. Delete source files (researcher-confirmed importers below). Add CI gate (`check-deleted-components.sh` extension) blocking reintroduction.
- **D-05:** WorkBoard data source = `useUnifiedKanban` with `context: 'personal'`, `mode: 'status'`, `sources: ['commitment', 'task']`. NOTE — actual codebase signature is `{ contextType, columnMode, sourceFilter }` (see Confirmation #2 below). No new adapter hook.
- **D-06:** `By status` fully wired (toggles `columnMode='status'`). `By dossier` / `By owner` render visually-correct but `aria-disabled="true"` with `title="Coming soon"`. Real wiring deferred.
- **D-07:** Search input filters client-side over already-loaded items: `title`, `title_ar`, `dossier.name`, `dossier.name_ar`, `assignee.name`. No new endpoint.
- **D-08:** Column counts + `27 overdue` chip computed client-side from `useUnifiedKanban` response. `column.count = items.filter(it => it.column_key === col.key).length`. `overdueCount = items.filter(it => it.is_overdue).length`. `WorkItem.is_overdue` already present.
- **D-09:** kcard click → existing work-item detail surface (researcher confirms each `WorkItem.source` mapping below). Phase 41 dossier drawer overlays without changing Phase 39 wiring.
- **D-10:** `cal-ev` click reuses `UnifiedCalendar`'s existing `onEventClick` prop. No new event-detail component.
- **D-11:** `+ New event` button → existing `/calendar/new` route.
- **D-12:** `+ New item` button (board toolbar) + per-column `+` → existing TaskCreate flow. Researcher identifies entry point below. Per-column `+` may pre-fill target `workflow_stage`.
- **D-13:** Calendar event variant mapping: `event_type === 'travel'` → `.travel` class; `status === 'pending'` → `.pending` class; else default. **NEITHER 'travel' NOR 'pending' EXISTS in the live `CalendarEvent` interface (Confirmation #4 below) — flag falls back to Claude's Discretion: render all events as default `.cal-ev` (accent-soft) and emit one `console.warn`.**
- **D-14:** 7×5 grid padding = handoff verbatim. Pad with prev-/next-month days as `.cal-cell.other` (`opacity: 0.4`). Other-month cells clickable → navigate to that month.
- **D-15:** Mobile (<640px) calendar = pageable single-week list. Reuse Phase 38 `.week-list` aesthetic (Confirmation #10 below). Toolbar adds prev/next week buttons; "Today" jumps to active week.
- **D-16:** Mobile (<640px) kanban = same horizontal-scroll. Touch-momentum + RTL-correct scroll direction. No layout pivot.

### Claude's Discretion

- Folder layout for new WorkBoard (mirror Phase 37 / Phase 38 pattern)
- Exact `priority` → chip-color mapping (`urgent`/`high` → `chip-danger`, `medium` → `chip-warn`, `low` → bare)
- Exact `kind` → chip-color mapping (`source==='commitment'` → `chip-accent`, `source==='task'` → `chip-info`)
- Skeleton fidelity (column outline + 3 kcard skeletons + 5×7 cal-cell skeletons)
- Owner-avatar initials algorithm (first letter of `assignee.name` + first letter of last word, fallback "?")
- `components/ui/kanban.tsx` deletion fate (Confirmation #1 says: do NOT delete — sole external importers ARE the legacy components being deleted; safe to delete after legacy cut)

### Deferred Ideas (OUT OF SCOPE)

Swimlanes, WIP limits, bulk multi-select, realtime presence UI, advanced kanban view, real `By dossier` / `By owner` wiring, week+day calendar reskin (Phase 42), week-swipe gestures (Phase 43), `calendar_event.variant` backend column.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                                                                                              | Research Support                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BOARD-01 | Horizontal-scroll kanban with column header (title + count + add) and `kcard` (kind chip · priority chip · title · glyph+dossier · mono due date · avatar owner)                                         | Handoff `WorkBoardPage` JSX `/tmp/inteldossier-handoff/.../pages.jsx#L113-178` + CSS `app.css#L390-411` (verified). Data via existing `useUnifiedKanban`.                         |
| BOARD-02 | Overdue cards: `border-inline-start: 3px solid var(--danger)`. Done cards: `opacity: 0.55`                                                                                                               | Handoff CSS `.kcard.overdue` and `.kcard.done` (verbatim). `WorkItem.is_overdue` already on the response shape. Done = `workflow_stage === 'done'` (or `status === 'completed'`). |
| BOARD-03 | 7×5 calendar grid with 1px dividers on `--line` background, day-of-week header, day number + stacked `.cal-ev` (default / `.travel` warn-soft / `.pending` line-soft), today's day-number accent-colored | Handoff `CalendarPage` JSX + CSS `app.css#L413-423`. Reskin in place inside `UnifiedCalendar.tsx`. Variant fields fallback (D-13).                                                |

</phase_requirements>

## Architectural Responsibility Map

| Capability                                              | Primary Tier                                                                 | Secondary Tier | Rationale                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| Kanban data fetch + mutation                            | Backend (Supabase RPC) → React Query                                         | —              | `useUnifiedKanban` already calls a Supabase RPC; mutation goes via `useUnifiedKanbanStatusUpdate` |
| Client-side filter (search, column-count, overdue chip) | Frontend Browser                                                             | —              | D-07/D-08 explicit: zero new endpoints                                                            |
| DnD orchestration                                       | Frontend Browser (`@dnd-kit`)                                                | —              | Existing dep, no SSR concerns                                                                     |
| Calendar grid render                                    | Frontend Browser                                                             | —              | Pure presentational rewrite of `UnifiedCalendar.tsx` month block                                  |
| Calendar event fetch                                    | Backend (REST) → React Query (`useCalendarEvents` from `@/domains/calendar`) | —              | Untouched                                                                                         |
| i18n key resolution                                     | Frontend Browser (i18next)                                                   | —              | Extend existing `unified-kanban` + `calendar` namespaces                                          |
| RTL direction                                           | Frontend Browser (CSS logical props + locale class)                          | —              | Mandatory per BOARD-02 (border-inline-start) and D-16                                             |

## Validation Architecture

> `nyquist_validation` not explicitly disabled in `.planning/config.json` — included by default.

### Test Framework

| Property           | Value                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| Framework          | Playwright (E2E) + Vitest (unit) + axe-core (a11y) — same toolchain as Phase 38 |
| Config file        | `frontend/playwright.config.ts` (already inherits `maxDiffPixelRatio: 0.01`)    |
| Quick run command  | `pnpm --filter frontend test:e2e -- --grep "@phase39"`                          |
| Full suite command | `pnpm test && pnpm --filter frontend exec playwright test`                      |

### BOARD-01/02/03 → Testable Assertions

| Req      | Behavior                                                                                                                | Test Type                   | Automated Command                                                                   | File Exists?      |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------- | ----------------- |
| BOARD-01 | 4 columns render with correct titles + monospace counts                                                                 | E2E                         | `playwright test tests/e2e/kanban-render.spec.ts`                                   | ❌ Wave 0         |
| BOARD-01 | kcard renders all anatomy elements (kind chip, priority chip, title, `<DossierGlyph>`, mono due, owner initials avatar) | E2E + unit (KCard.test.tsx) | `pnpm test KCard.test.tsx`                                                          | ❌ Wave 0         |
| BOARD-01 | Horizontal scroll at all viewports (320/768/1280) — `.board-scroll` overflow-x:auto verified                            | E2E responsive              | `playwright test tests/e2e/kanban-responsive.spec.ts`                               | ❌ Wave 0         |
| BOARD-01 | RTL: first column lands on right edge; scroll direction reversed                                                        | E2E                         | `playwright test tests/e2e/kanban-rtl.spec.ts`                                      | ❌ Wave 0         |
| BOARD-02 | `.kcard.overdue` has `border-inline-start: 3px solid var(--danger)` (computed style)                                    | unit + E2E                  | `getComputedStyle(kcard).borderInlineStartColor`                                    | ❌ Wave 0         |
| BOARD-02 | `.kcard.overdue` edge sits on **right** in LTR, **left** in RTL — visual diff                                           | Visual regression           | `playwright test tests/e2e/kanban-visual.spec.ts --update-snapshots`                | ❌ Wave 0         |
| BOARD-02 | `.kcard.done` has `opacity: 0.55` (computed style)                                                                      | unit                        | `expect(getComputedStyle).opacity).toBe('0.55')`                                    | ❌ Wave 0         |
| BOARD-03 | Calendar grid is `display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--line)`              | unit                        | `getComputedStyle(cal-grid)`                                                        | ❌ Wave 0         |
| BOARD-03 | 7×5 = 35 `.cal-cell` divs render; padding cells have `.other` class with `opacity: 0.4`                                 | E2E                         | `playwright test tests/e2e/calendar-render.spec.ts`                                 | ❌ Wave 0         |
| BOARD-03 | Day-of-week header shows EN labels in LTR (`Sun..Sat`) and AR labels in RTL (`أحد..سبت`)                                | E2E + i18n                  | `playwright test tests/e2e/calendar-rtl.spec.ts`                                    | ❌ Wave 0         |
| BOARD-03 | Today's `.cal-d` has `color: var(--accent-ink)` and `font-weight: 700`                                                  | unit                        | `getComputedStyle`                                                                  | ❌ Wave 0         |
| BOARD-03 | `.cal-ev` default = accent-soft; `.travel` = warn-soft; `.pending` = line-soft (verified per CSS variable)              | unit                        | `getComputedStyle(cal-ev).backgroundColor`                                          | ❌ Wave 0         |
| Cross    | Visual regression matrix (LTR/RTL × light/dark × 768/1280 = 8 baselines per page) — kanban + calendar                   | Visual regression           | `playwright test tests/e2e/kanban-visual.spec.ts tests/e2e/calendar-visual.spec.ts` | ❌ Wave 0         |
| Cross    | axe-core: zero serious/critical violations on `/kanban` and `/calendar` in LTR + RTL                                    | a11y                        | `playwright test tests/e2e/{kanban,calendar}-a11y.spec.ts`                          | ❌ Wave 0         |
| Cross    | DnD: drag a kcard from `todo` → `in_progress`, mutation called with `{ newWorkflowStage: 'in_progress' }`               | E2E                         | `playwright test tests/e2e/kanban-dnd.spec.ts`                                      | ❌ Wave 0         |
| Cross    | Search input filters client-side; no network calls fired during typing                                                  | E2E (network mock)          | `playwright test tests/e2e/kanban-search.spec.ts`                                   | ❌ Wave 0         |
| Cross    | "Coming soon" filter pills are `aria-disabled="true"` and do NOT toggle when clicked                                    | E2E + a11y                  | `playwright test tests/e2e/kanban-filters.spec.ts`                                  | ❌ Wave 0         |
| Cross    | Mobile <640px calendar renders week-list (one row per day, prev/next/today buttons)                                     | E2E responsive              | `playwright test tests/e2e/calendar-mobile.spec.ts`                                 | ❌ Wave 0         |
| Cross    | Legacy file deletion gate — `check-deleted-components.sh` exits 0 with new patterns appended                            | CI shell                    | `bash scripts/check-deleted-components.sh`                                          | ✅ exists, extend |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test:unit -- --changed`
- **Per wave merge:** `pnpm test && pnpm --filter frontend exec playwright test --grep "@phase39"`
- **Phase gate:** Full suite green + `bash scripts/check-deleted-components.sh` + `pnpm typecheck` before `/gsd-verify-work`

### Wave 0 Gaps (test infrastructure)

- [ ] `frontend/tests/e2e/kanban-render.spec.ts` — BOARD-01 anatomy
- [ ] `frontend/tests/e2e/kanban-rtl.spec.ts` — BOARD-02 RTL edge + horizontal-scroll direction
- [ ] `frontend/tests/e2e/kanban-visual.spec.ts` — 8-snapshot visual regression
- [ ] `frontend/tests/e2e/kanban-dnd.spec.ts` — drag-between-columns
- [ ] `frontend/tests/e2e/kanban-search.spec.ts` — client-side filter
- [ ] `frontend/tests/e2e/kanban-filters.spec.ts` — Coming-soon pills aria-disabled
- [ ] `frontend/tests/e2e/kanban-responsive.spec.ts` — 320/768/1280
- [ ] `frontend/tests/e2e/kanban-a11y.spec.ts` — axe-core LTR + RTL
- [ ] `frontend/tests/e2e/calendar-render.spec.ts` — BOARD-03 grid
- [ ] `frontend/tests/e2e/calendar-rtl.spec.ts` — Arabic dow labels + Arabic-Indic digits
- [ ] `frontend/tests/e2e/calendar-visual.spec.ts` — 8-snapshot visual regression
- [ ] `frontend/tests/e2e/calendar-mobile.spec.ts` — week-list <640px
- [ ] `frontend/tests/e2e/calendar-a11y.spec.ts` — axe-core LTR + RTL
- [ ] Unit tests for `KCard.tsx`, `BoardColumn.tsx`, `BoardToolbar.tsx`, `CalendarEventPill.tsx`, `WeekListMobile.tsx`, plus `toArDigits` if newly authored

## Researcher Confirmations (1 .. 15)

### #1. Importer grep before legacy cut (D-04)

Direct grep against `frontend/src` (excluding `EngagementKanbanDialog.tsx` and `components/kibo-ui/kanban` per CONTEXT.md):

| Legacy symbol                                                                    | Importing files (in scope)                                                                                         | Action                                                                                                                                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EnhancedKanbanBoard`                                                            | `frontend/src/components/unified-kanban/index.ts` (re-export) · `frontend/src/routes/_protected/kanban.tsx`        | Delete file. Rewrite kanban route. Remove from `index.ts`.                                                                                                         |
| `UnifiedKanbanBoard`                                                             | `frontend/src/components/unified-kanban/index.ts` (re-export) · `frontend/src/routes/_protected/my-work/board.tsx` | Delete file + remove `my-work/board.tsx` route OR rewrite that route to use the new `WorkBoard` (CONTEXT does not name `my-work/board.tsx`; **flag for planner**). |
| `UnifiedKanbanCard` (and `UnifiedKanbanCardContent`/`UnifiedKanbanCardSkeleton`) | `index.ts` only                                                                                                    | Delete file + remove exports.                                                                                                                                      |
| `UnifiedKanbanColumn`                                                            | `index.ts` (re-export from `components/ui/kanban`)                                                                 | Delete `UnifiedKanbanColumn.tsx`.                                                                                                                                  |
| `UnifiedKanbanHeader`                                                            | `index.ts` only                                                                                                    | Delete file.                                                                                                                                                       |
| `swimlane-utils`                                                                 | `index.ts` only (re-export)                                                                                        | Delete file.                                                                                                                                                       |
| `wip-limits`                                                                     | `index.ts` only (re-export)                                                                                        | Delete file.                                                                                                                                                       |
| `components/ui/kanban`                                                           | Only the 3 deleted legacy files (`UnifiedKanbanBoard`, `EnhancedKanbanBoard`, `UnifiedKanbanColumn`)               | **Safe to delete after legacy cut** (no other importers).                                                                                                          |

⚠️ **Flag for planner:** `frontend/src/routes/_protected/my-work/board.tsx` exists and imports `useUnifiedKanban` + the legacy board. CONTEXT.md does not name it. Three options: (a) delete the route, (b) point it at the new `WorkBoard` (route consolidation), (c) leave it and exclude from gate. Researcher recommends **(a) delete** — `/my-work/board` and `/kanban` are duplicates of the same surface; consolidating onto `/kanban` matches D-01.

### #2. `useUnifiedKanban` hook signature

**File:** `frontend/src/hooks/useUnifiedKanban.ts:160`
**Signature:** `useUnifiedKanban(options: UseUnifiedKanbanOptions)` where:

```ts
interface UseUnifiedKanbanOptions {
  contextType: KanbanContextType // NOT 'context' as CONTEXT.md says
  contextId?: string
  columnMode?: KanbanColumnMode // NOT 'mode'
  sourceFilter?: WorkSource[] // NOT 'sources'
  searchQuery?: string // already supports D-07 server-side, but D-07 says client-side — use it client-side, do NOT pass searchQuery prop
  limitPerColumn?: number
  enabled?: boolean
}
```

**Returns** (from `KanbanRpcRow` transform): rows containing `column_key`, `is_overdue`, `days_until_due`, `assignee_id/name/avatar_url`, `dossier_id`, `workflow_stage`, `priority`, `source` (`'task' | 'commitment' | 'intake'`).

**Mutation:** `useUnifiedKanbanStatusUpdate()` at line 329 — accepts `{ itemId, source, newStatus, newWorkflowStage }`. For `source === 'task'`: writes `tasks.status` + `tasks.workflow_stage`. For `source === 'commitment'`: writes `aa_commitments.status` only.

**Realtime hook (D-04 drop):** `useUnifiedKanbanRealtime` at line 480 — Phase 39 keeps the _data refresh_ (silent), drops the _presence UI_. Caller still mounts the hook so item updates stream in.

### #3. `toArDigits` utility

**Status:** **NOT FOUND in repo.** Grep across `frontend/src` returned zero matches for `toArDigits`, `arabicDigits`, `toArabicDigits`. Handoff defines it in `data.jsx#L8`. Phase 39 must port it.

**Recommended location:** `frontend/src/lib/i18n/toArDigits.ts` (single function, ~5 lines). Used by:

- `BoardToolbar` overdue chip count
- `BoardColumn` count badge
- `CalendarCell` day number
- `WeekListMobile` day number

Alternative: place in `frontend/src/utils/format.ts` if the project conventions prefer flat utils. Planner finalizes.

### #4. `CalendarEvent` shape (D-13 fields)

**File:** `frontend/src/domains/calendar/types/index.ts:39` (re-exported by `frontend/src/hooks/useCalendarEvents.ts`).

**Live `CalendarEvent` fields:**

```ts
event_type: 'main_event' | 'session' | 'plenary' | 'working_session' | 'ceremony' | 'reception'
status: 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'postponed'
```

**`'travel'` and `'pending'` literals do NOT exist on either field.** D-13 fallback applies: render every event as default `.cal-ev` (accent-soft) and emit one `console.warn` per page-mount calling out the missing variant data so backend can extend later.

Optional non-breaking enhancement (Claude's Discretion): treat `event_type === 'main_event'` events that are out-of-state (cross-dossier travel events) as `.travel` only if a future migration adds an `is_travel` boolean. Default decision: ship pure default until backend ships variant.

### #5. TaskCreate prefill capability (D-12)

**No `/tasks/new` route exists.** `frontend/src/routes/_protected/tasks/index.tsx` mounts `MyTasksPage`. Task creation is a **dialog** flow:

- `frontend/src/components/tasks/TaskEditDialog.tsx` (edit; reuse possible)
- `frontend/src/components/work-creation/forms/TaskQuickForm.tsx` (quick-create)
- `frontend/src/components/work-creation/WorkCreationPalette.tsx` (palette entry)

`TaskEditDialog`'s zod schema declares `workflow_stage: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled'])` with `defaultValues.workflow_stage` resolved from `task.workflow_stage || 'todo'` (line 77). It accepts `defaultValues` overrides → **prefill IS supported** structurally; the planner needs to expose either a `defaultWorkflowStage` prop on the dialog or a thin `TaskCreateDialog` wrapper that forwards initial workflow stage.

**Recommendation:** Use `TaskQuickForm` (already designed for quick-create) and add a thin `defaultWorkflowStage?: WorkflowStage` prop. Per-column `+` opens the dialog with that prop pre-set. Global `+ New item` opens with no prefill.

### #6. Work-item detail surface per source (D-09)

| `WorkItem.source` | Detail surface                                                                                                                                                                              | File                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `'task'`          | `TaskDetail` component (mountable in dialog)                                                                                                                                                | `frontend/src/components/tasks/TaskDetail.tsx`                                    |
| `'commitment'`    | Existing commitment detail flow inside after-action / dossier engagement; NO standalone dialog file. The current legacy `EnhancedKanbanBoard` likely navigates to a dossier route on click. | `frontend/src/components/after-action/*` (planner verifies during implementation) |
| `'intake'`        | Out of scope (D-05 says `sources: ['commitment', 'task']` only)                                                                                                                             | —                                                                                 |

**Recommendation:** Phase 39 wires kcard click via a shared `onItemClick(item: WorkItem)` callback on `<WorkBoard>` that the route resolves: `task` → open `TaskDetail` dialog; `commitment` → navigate to `/dossiers/{dossier_id}#commitments-{id}` (planner confirms exact deep-link).

### #7. `UnifiedCalendar.tsx` month-view surgery target (D-02)

**File:** `frontend/src/components/calendar/UnifiedCalendar.tsx`
**Surgery zone:** Lines ~252-290 (the `<div className="grid grid-cols-7 gap-1...">` block plus its children) — replace with `.cal-grid` markup. The `eachDayOfInterval` + `eventsByDay` Map at lines 81-82 / earlier is **kept as-is** (data layer unchanged).
**Props preserved:** `linkedItemType?: string` and `linkedItemId?: string` at lines 31-32 — passed unchanged to `CalendarEntryForm` (line 167). Phase 41 dossier drawer already covered.
**Day-of-week header:** Lines 256-267 (`{[0..6].map(...)}` rendering `format(new Date(2024, 0, day + 1), 'EEE')`) — replace with the bilingual `dowEn` / `dowAr` arrays from handoff.
**Mobile week-list (D-15):** Add a `useMediaQuery('(max-width: 640px)')` (or existing equivalent — verify) gate above the grid to switch to `<WeekListMobile>` component.

### #8. WorkflowStage `cancelled` rendering

**Handoff `BOARD_COLS` keys** (per data.jsx#L302+ comment in CONTEXT.md): `'todo' | 'doing' | 'review' | 'done'` — **no `cancelled` column.**
**Repo `WorkflowStage` enum:** `['todo', 'in_progress', 'review', 'done', 'cancelled']` (verified in `TaskEditDialog.tsx:51`).
**Mapping decision (locked by handoff):** `cancelled` items are filtered OUT of the WorkBoard render. Filter:

```ts
const visibleItems = items.filter(
  (it) => it.workflow_stage !== 'cancelled' && it.status !== 'cancelled',
)
```

Planner adds this filter in `WorkBoard.tsx` and an i18n note that cancelled items remain accessible via list view (consistent with handoff `List view` button).

### #9. Phase 38 `<Skeleton>` import path

**File:** `frontend/src/components/ui/skeleton.tsx` (verified present).
Import: `import { Skeleton } from '@/components/ui/skeleton'` — directly reusable for kcard + cal-cell shape-match skeletons. No new shadcn install needed.

### #10. Phase 38 `.week-list` CSS class & component

**Files:**

- `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` — JSX consumer
- `frontend/src/pages/Dashboard/widgets/dashboard.css` — defines `.week-list`

**Reuse strategy:** Phase 39 imports the same `.week-list` class from `dashboard.css` for mobile calendar week-list (D-15). To avoid coupling, planner may either (a) re-import that CSS file from the calendar component, or (b) lift `.week-list` into a shared CSS file (e.g. `frontend/src/pages/WorkBoard/board.css` is wrong — it's a calendar concern; suggest `frontend/src/components/calendar/calendar.css` shared with mobile week-list). Planner finalizes.

### #11. CI deletion gate (`check-deleted-components.sh`)

**File:** `scripts/check-deleted-components.sh` (verified present, Phase 34/36 precedent).

**Append patterns** (mirror existing format):

```bash
# Phase 39 kanban-calendar deletions (D-04)
"from.*components/unified-kanban/UnifiedKanbanBoard"
"from.*components/unified-kanban/EnhancedKanbanBoard"
"from.*components/unified-kanban/UnifiedKanbanCard"
"from.*components/unified-kanban/UnifiedKanbanColumn"
"from.*components/unified-kanban/UnifiedKanbanHeader"
"from.*components/unified-kanban/utils/swimlane-utils"
"from.*components/unified-kanban/utils/wip-limits"
"from.*components/ui/kanban"   # safe per Confirmation #1
```

**Append filesystem-presence check:**

```bash
PHASE_39_DELETED_FILES=(
  "frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx"
  "frontend/src/components/unified-kanban/EnhancedKanbanBoard.tsx"
  "frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx"
  "frontend/src/components/unified-kanban/UnifiedKanbanColumn.tsx"
  "frontend/src/components/unified-kanban/UnifiedKanbanHeader.tsx"
  "frontend/src/components/unified-kanban/utils/swimlane-utils.ts"
  "frontend/src/components/unified-kanban/utils/wip-limits.ts"
  "frontend/src/components/ui/kanban.tsx"
)
```

### #12. Visual-regression baseline tool

**Tool:** Playwright `expect(page).toHaveScreenshot()` with `maxDiffPixelRatio: 0.01` set in `frontend/playwright.config.ts` (per `38-09-PLAN.md` header).
**Baseline directory:** `frontend/tests/e2e/__screenshots__/{spec-name}.spec.ts/` (Playwright default).
**Flake controls (mirror Phase 38):** `await document.fonts.ready` + injected reduced-motion CSS via `addStyleTag`.
**Matrix:** LTR/RTL × light/dark × {768, 1280} = 8 baselines per spec → 16 total for kanban + calendar.
**Update command:** `pnpm --filter frontend exec playwright test --grep "@phase39" --update-snapshots` then human review against `/tmp/inteldossier-handoff/.../reference/{kanban,kanban-arabic,calendar}.png` per Phase 38 D-09 manual gate.

### #13. i18n key conflicts

**Existing keys to AVOID overwriting** (`frontend/public/locales/en/unified-kanban.json` has): `title`, `viewModes.{list,board}`, `columnModes.{label,status,priority,trackingType}`, `columns.{todo,pending,in_progress,review,done,...}`, `sources.{task,commitment,intake}`, `card.{overdue,dueToday,dueTomorrow,dueIn,...}`.

**`calendar.json` already has:** `title`, `today`, `previous`, `next`, `more`, `weekday.{sun,mon,...,sat}` (perfect for D-15), `view.{month,week,day}`, `types.*`, `form.create_event`.

**Recommended new keys (no collisions):**

```json
// unified-kanban.json — extend
{
  "filters": {
    "byStatus": "By status",
    "byDossier": "By dossier",
    "byOwner": "By owner",
    "comingSoon": "Coming soon",
    "search": "Search work items…"
  },
  "overdueChip": "{{count}} overdue",
  "actions": {
    "newItem": "New item",
    "listView": "List view",
    "addToColumn": "Add to {{column}}"
  }
}

// calendar.json — extend
{
  "weeklist": {
    "previousWeek": "Previous week",
    "nextWeek": "Next week",
    "today": "Today"
  },
  "actions": {
    "newEvent": "New event"
  }
}
```

Arabic translations follow handoff strings exactly (`عرض القائمة`, `عنصر جديد`, `بالحالة`, `بالملف`, `بالمسؤول`, `فعالية جديدة`).

### #14. DnD sensor configuration

**Existing pattern:** `frontend/src/components/ui/kanban.tsx` (the file scheduled for deletion) uses `useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))` — lines 218-221.
**Alternate reference:** `frontend/src/components/report-builder/ReportBuilder.tsx` uses `PointerSensor` directly.

**Recommendation for Phase 39 `WorkBoard`:** mirror `ui/kanban.tsx`'s sensor stack (Mouse + Touch + Keyboard) — covers desktop, mobile, and a11y in one config. Wrap in conditional: when `columnMode !== 'status'`, pass empty `sensors={[]}` so drag is fully disabled.

### #15. Wave structure & proposed plan list

Mirrors Phase 38's 10-plan structure (`38-00..09`). Phase 39 fits cleanly into 10 plans across 3 waves (with `39-00` as Wave 0 infra and `39-09` as Wave 2 verification + cut + gate).

## Existing Patterns to Reuse

| Pattern                               | File                                                                                                 | Why                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Verbatim port discipline              | `.planning/phases/38-dashboard-verbatim/38-CONTEXT.md` D-01/D-02                                     | Same handoff source-of-truth model                                              |
| Wave 0/1/2 structure                  | `.planning/phases/38-dashboard-verbatim/38-09-PLAN.md` header                                        | Wave 0 infra → Wave 1 widgets → Wave 2 E2E + cut + gate                         |
| Visual-regression matrix              | `frontend/tests/e2e/dashboard-visual.spec.ts` (lines 1-30 of header)                                 | 8 baselines pattern                                                             |
| `<Skeleton>` shape-match              | `frontend/src/components/ui/skeleton.tsx` + Phase 38 widget skeletons                                | Drop-in component                                                               |
| Legacy cut without archive (D-04)     | Phase 38 OperationsHub deletion + Phase 36 layout deletions in `scripts/check-deleted-components.sh` | Git history is the archive                                                      |
| `<DossierGlyph>` flag/symbol/initials | Phase 37 — already shipped                                                                           | Single drop-in for kcard footer                                                 |
| `<LtrIsolate>` for mono digits in RTL | Phase 38 (VipVisits countdown)                                                                       | Wrap mono due-date string when locale=ar so the timestamp doesn't visually flip |
| `useUnifiedKanban` family             | `frontend/src/hooks/useUnifiedKanban.ts`                                                             | Data + mutation + realtime, untouched                                           |
| `UnifiedCalendar` data layer          | `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 59-82                                   | `eachDayOfInterval` + `eventsByDay` Map preserved                               |
| Phase 38 `.week-list` aesthetic       | `frontend/src/pages/Dashboard/widgets/dashboard.css`                                                 | Mobile calendar reuse                                                           |
| AppShell mount                        | `frontend/src/routes/_protected/__layout` (Phase 36)                                                 | Routes already inside; no change                                                |

## Recommended Plan Breakdown

> Researcher proposes; planner finalizes plan IDs and exact file lists.

### Wave 0 — Infrastructure (1 plan)

- **39-00-PLAN.md** — Folder scaffold + route stubs + i18n key skeleton + visual-regression baseline capture stubs + CI gate scaffold + `toArDigits` util.
  - Create `frontend/src/pages/WorkBoard/{WorkBoard.tsx, KCard.tsx, BoardColumn.tsx, BoardToolbar.tsx, board.css, index.ts}` (empty/stub)
  - Create `frontend/src/components/calendar/CalendarMonthGrid.tsx`, `CalendarEventPill.tsx`, `WeekListMobile.tsx` (empty/stub)
  - Create `frontend/src/lib/i18n/toArDigits.ts` (port from handoff)
  - Extend `frontend/public/locales/{en,ar}/unified-kanban.json` + `calendar.json` (keys per Confirmation #13)
  - Stub all 13 Wave 0 spec files (per Wave 0 Gaps list above)
  - Append patterns to `scripts/check-deleted-components.sh` (per Confirmation #11)
  - Capture initial Playwright visual baselines (`--update-snapshots`)
  - Closest analogs: `38-00-PLAN.md`, Phase 37 folder scaffold

### Wave 1 — Parallelizable widgets (7 plans)

- **39-01-PLAN.md** — `KCard.tsx` (kind chip + priority chip + title + glyph+dossier + mono due + owner-initials avatar; `.kcard.overdue` + `.kcard.done`; click handler resolved per source).
  - Source: handoff `pages.jsx#L143-167`; CSS verbatim from `app.css#L401-411`. Closest analog: Phase 38 `MyTasks` widget rows.
- **39-02-PLAN.md** — `BoardColumn.tsx` (head with title + count + per-column `+` button; body with `<KCard>` list; `cursor: grab` semantics conditional on DnD enabled).
- **39-03-PLAN.md** — `BoardToolbar.tsx` (search input + 3 filter pills + overdue chip; "Coming soon" tooltip + `aria-disabled` on stub pills).
- **39-04-PLAN.md** — `WorkBoard.tsx` page (composes toolbar + horizontal-scroll columns; mounts `useUnifiedKanban`; client-side filter; cancelled-stage filter; `<DndContext>` conditional on `columnMode==='status'`; mutation wiring via `useUnifiedKanbanStatusUpdate`). Rewrites `frontend/src/routes/_protected/kanban.tsx` to mount it. Skeleton placeholder shape-match.
- **39-05-PLAN.md** — `CalendarMonthGrid.tsx` + `CalendarEventPill.tsx` (7×5 grid; padding cells; today accent; `.cal-ev` default with D-13 console.warn fallback; preserved click handler delegating to `onEventClick`). Surgically replace lines ~252-290 of `UnifiedCalendar.tsx`. Skeleton 5×7 cal-cell shape-match.
- **39-06-PLAN.md** — `WeekListMobile.tsx` (D-15: pageable single-week list; prev/next/today; reuse `.week-list` aesthetic; emits same click events as desktop grid). Wired into `UnifiedCalendar.tsx` via `useMediaQuery('(max-width: 640px)')`.
- **39-07-PLAN.md** — `toArDigits` integration + Arabic-Indic digit rendering across `BoardColumn` count, `BoardToolbar` overdue chip, `CalendarMonthGrid` day numbers, `WeekListMobile` day numbers.

### Wave 2 — Verification + Legacy cut + CI gate (2 plans)

- **39-08-PLAN.md** — Playwright E2E suite (all specs from Wave 0 Gaps): render, RTL, DnD, search, filters-aria, responsive, mobile-week-list. axe-core a11y. Visual regression matrix (16 baselines). Per-test reduced-motion + `await document.fonts.ready`.
- **39-09-PLAN.md** — Legacy cut sweep + CI gate verification + manual reference-image checkpoint. Delete the 8 files from Confirmation #1. Decide `my-work/board.tsx` fate (recommend delete). Run `bash scripts/check-deleted-components.sh` (must exit 0). Final visual diff vs handoff `kanban.png`/`kanban-arabic.png`/`calendar.png`. Human checkpoint.

## Risks & Open Questions

1. **`my-work/board.tsx` is not in CONTEXT.md.** It imports the legacy `UnifiedKanbanBoard`. Three options listed in Confirmation #1. **Recommend planner add a discuss-phase clarification or default to delete** (consolidates onto `/kanban` per D-01).
2. **D-13 fallback (no `'travel'` / `'pending'` in live `CalendarEvent`).** All events render as default accent-soft. Visually less rich than handoff. Acceptable per CONTEXT but flag for backend follow-up phase.
3. **Per-column `+` prefill of `workflow_stage`** requires a thin wrapper around `TaskQuickForm` / `TaskEditDialog` with `defaultWorkflowStage` prop. Small surgery on form, not greenfield.
4. **Commitment-source kcard click target** is not a single dialog. Researcher recommends deep-link to dossier engagement view; planner verifies during 39-01 implementation.
5. **`useUnifiedKanban` exposes a `searchQuery` server-side option** but D-07 mandates client-side filter. Planner must NOT pass `searchQuery` through; instead filter the returned items array in `WorkBoard.tsx`.
6. **Phase 38 visual snapshot baselines** are in the same `__screenshots__/` directory pattern. Adding 16 new baselines may bloat git LFS / repo size; confirm with infra owner if LFS quota is a concern.

## Landmines / Things to Avoid

- ❌ **Do NOT use `border-left` / `border-right`** for `.kcard.overdue`. BOARD-02 mandates `border-inline-start` (logical property) — this is the explicit RTL test in `kanban-arabic.png`.
- ❌ **Do NOT replace `UnifiedCalendar.tsx`.** D-02 mandates in-place reskin. Replacing the component breaks the `linkedItemType`/`linkedItemId` integration that Phase 41 dossier drawer depends on.
- ❌ **Do NOT add new endpoints** for column counts or overdue chip (D-08).
- ❌ **Do NOT pass `searchQuery` to `useUnifiedKanban`** — D-07 is client-side only.
- ❌ **Do NOT use `textAlign: "right"` anywhere** — RTL flips it to LEFT (per global CLAUDE.md Rule 3 in user instructions). Use `text-start`/`text-end` Tailwind logical classes.
- ❌ **Do NOT re-import `EngagementKanbanDialog.tsx` or `components/kibo-ui/kanban`** — Phase 11 engagement workspace, out of scope.
- ❌ **Do NOT delete `realtime data refresh` (`useUnifiedKanbanRealtime` data path).** Drop only the _presence UI_ per D-04; the hook keeps refreshing items.
- ❌ **Do NOT introduce a new i18n namespace.** Extend `unified-kanban` and `calendar` only.
- ❌ **Do NOT use Tailwind `ml-*`/`mr-*`/`pl-*`/`pr-*`/`left-*`/`right-*`** — project CLAUDE.md MANDATORY rule. Use `ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*`.
- ❌ **Do NOT hard-code colors** (`#fff`, `red`, etc). Phase 33 mandate: every color is a CSS variable.
- ❌ **Do NOT render a `cancelled` column.** Filter `cancelled` items out per Confirmation #8.
- ❌ **Do NOT rely on the ROADMAP plan list under Phase 39** — it is a typo carrying Phase 37 plan names. Use this RESEARCH.md's "Recommended Plan Breakdown" instead.
- ⚠️ **Watch for Arabic-Indic digit double-render.** `toArDigits` should be applied at render-time only on the formatted string; don't pass the number through `toLocaleString('ar')` AND `toArDigits` (double conversion).
- ⚠️ **DnD sensor stack must include TouchSensor** for mobile horizontal drag, but mobile <640px is "horizontal-scroll-only" per D-16 — confirm sensor activation distance prevents drag-vs-scroll conflict on touch.

## Assumptions Log

| #   | Claim                                                                       | Section          | Risk if Wrong                                                                                                            |
| --- | --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A1  | `my-work/board.tsx` should be deleted in Phase 39 (consolidating `/kanban`) | Confirmation #1  | Route disappears for users who bookmark it. Mitigation: planner asks user OR adds redirect.                              |
| A2  | `aa_commitments` deep-link is `/dossiers/{id}#commitments-{cid}`            | Confirmation #6  | Click is wrong target. Mitigation: planner verifies during implementation.                                               |
| A3  | `.week-list` from `dashboard.css` can be reused for mobile calendar         | Confirmation #10 | Style coupling between Dashboard and Calendar. Mitigation: lift to shared CSS.                                           |
| A4  | Done = `workflow_stage === 'done'` (not also `status === 'completed'`)      | BOARD-02         | False positive/negative on done-treatment. Mitigation: use `mapStatusToColumnKey` from existing `column-definitions.ts`. |

## Sources

### Primary (HIGH confidence — direct file reads)

- `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/39-kanban-calendar/39-CONTEXT.md` — full read
- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx` lines 113-235 — `WorkBoardPage` + `CalendarPage`
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` lines 390-423 — kanban + calendar CSS
- `frontend/src/hooks/useUnifiedKanban.ts` lines 55-110, 160, 329, 480 — signature, mutation, realtime
- `frontend/src/components/calendar/UnifiedCalendar.tsx` lines 30-290 — props, surgery target
- `frontend/src/domains/calendar/types/index.ts` lines 35-75 — `CalendarEvent` shape
- `frontend/src/components/tasks/TaskEditDialog.tsx` lines 51, 72-77, 105, 238-254 — workflow_stage prefill
- `frontend/src/components/unified-kanban/index.ts` — exports inventory
- `frontend/src/routes/_protected/kanban.tsx` + `frontend/src/routes/_protected/my-work/board.tsx` — current importers
- `scripts/check-deleted-components.sh` — CI gate template
- `frontend/tests/e2e/dashboard-visual.spec.ts` — visual-regression pattern

### Secondary (MEDIUM — CONTEXT.md cross-references verified)

- `.planning/REQUIREMENTS.md#L71-73` — BOARD-01/02/03
- `.planning/ROADMAP.md#L243-264` — Phase 39 block (plan list ignored per CONTEXT note)
- `.planning/phases/38-dashboard-verbatim/38-09-PLAN.md` — Wave 2 template

### Tertiary (LOW — flagged for verification)

- `aa_commitments` deep-link path (Confirmation #6) — researcher inferred, planner verifies during 39-01

## Metadata

**Confidence breakdown:**

- BOARD-01/02/03 success criteria: HIGH — handoff CSS + JSX read verbatim
- `useUnifiedKanban` integration: HIGH — interface + return shape verified directly
- D-13 variant fallback: HIGH (negative confirmed) — `CalendarEvent` interface read directly, no matching literals
- `my-work/board.tsx` fate: LOW — not addressed by CONTEXT.md
- Commitment-source click target: LOW — file-level verification deferred to planner
- Phase 38 reuse paths: HIGH — files exist and are accessible
- DnD sensor strategy: HIGH — existing `ui/kanban.tsx` pattern verified

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (handoff is locked; codebase moves slowly on this surface)

## RESEARCH COMPLETE
