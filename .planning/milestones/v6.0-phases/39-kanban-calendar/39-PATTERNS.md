# Phase 39: kanban-calendar — Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 32 files (creates, modifies, deletes, gates)
**Analogs found:** 30 / 32 (two flagged greenfield: `toArDigits.ts`, `KCard.tsx` — both partial composites)
**Upstream barrels:** `@/components/signature-visuals` (Phase 37 `<DossierGlyph>`), `@/components/ui/*` (Phase 33 wrappers, `<LtrIsolate>`, `<Skeleton>`), `frontend/src/pages/Dashboard/widgets/` (Phase 38 widget pattern)

---

## File Classification

| New / Modified File                                                                                                              | Role               | Data Flow                                                | Closest Analog                                                                                                                                                                      | Match Quality              |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `frontend/src/pages/WorkBoard/index.ts`                                                                                          | barrel             | re-export                                                | `frontend/src/pages/Dashboard/widgets/index.ts`                                                                                                                                     | exact                      |
| `frontend/src/pages/WorkBoard/WorkBoard.tsx`                                                                                     | page composer      | useUnifiedKanban + DnD                                   | `frontend/src/pages/Dashboard/index.tsx` (composer shape) + `frontend/src/routes/_protected/kanban.tsx` (current data wiring)                                                       | role-match                 |
| `frontend/src/pages/WorkBoard/KCard.tsx`                                                                                         | card widget        | render + click + DnD draggable                           | `frontend/src/pages/Dashboard/widgets/MyTasks.tsx` (chip+glyph+due+title)                                                                                                           | role-match (composite)     |
| `frontend/src/pages/WorkBoard/BoardColumn.tsx`                                                                                   | column widget      | sortable container                                       | `frontend/src/pages/Dashboard/widgets/WidgetCard.tsx` (section shell) + `frontend/src/components/unified-kanban/UnifiedKanbanColumn.tsx` (DnD shape, **read-only — being deleted**) | role-match                 |
| `frontend/src/pages/WorkBoard/BoardToolbar.tsx`                                                                                  | toolbar widget     | search + filter pills + chip                             | `frontend/src/pages/Dashboard/widgets/KpiStrip.tsx` (chip strip) + `PageHeader` action slot                                                                                         | role-match                 |
| `frontend/src/pages/WorkBoard/board.css`                                                                                         | styles             | CSS custom props                                         | `frontend/src/pages/Dashboard/widgets/dashboard.css` (Phase 38 .week-list source)                                                                                                   | exact                      |
| `frontend/src/components/calendar/UnifiedCalendar.tsx` (MODIFY)                                                                  | component          | in-place month-grid surgery                              | self (lines ~252–290 surgery zone)                                                                                                                                                  | self (preserve hook props) |
| `frontend/src/components/calendar/CalendarMonthGrid.tsx`                                                                         | grid widget        | day-cell render                                          | `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` (date+rows pattern)                                                                                                            | role-match                 |
| `frontend/src/components/calendar/CalendarEventPill.tsx`                                                                         | pill               | small token-styled chip                                  | `frontend/src/components/ui/badge.tsx` (Chip wrapper) + Phase 38 `.cal-ev` CSS                                                                                                      | role-match                 |
| `frontend/src/components/calendar/WeekListMobile.tsx`                                                                            | mobile widget      | week-list rows                                           | `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` (`.week-list` consumer)                                                                                                        | exact                      |
| `frontend/src/components/calendar/calendar.css` (NEW shared)                                                                     | styles             | `.cal-grid`, `.cal-cell`, `.cal-ev`, lifted `.week-list` | `frontend/src/pages/Dashboard/widgets/dashboard.css` (lift `.week-list` block)                                                                                                      | role-match                 |
| `frontend/src/lib/i18n/toArDigits.ts`                                                                                            | util               | string transform                                         | none — greenfield (port from `/tmp/.../data.jsx#L8`)                                                                                                                                | greenfield                 |
| `frontend/src/routes/_protected/kanban.tsx` (REWRITE)                                                                            | route              | thin mount                                               | `frontend/src/routes/_protected/dashboard.tsx` (Suspense + lazy + route file shape)                                                                                                 | exact                      |
| `frontend/src/routes/_protected/calendar.tsx` (KEEP)                                                                             | route              | unchanged                                                | self                                                                                                                                                                                | self                       |
| `frontend/src/routes/_protected/my-work/board.tsx` (DELETE)                                                                      | route cut          | —                                                        | Phase 36 layout deletions                                                                                                                                                           | n/a                        |
| `frontend/public/locales/en/unified-kanban.json` (EXTEND)                                                                        | i18n               | JSON keys                                                | self                                                                                                                                                                                | self                       |
| `frontend/public/locales/ar/unified-kanban.json` (EXTEND)                                                                        | i18n               | JSON keys                                                | self                                                                                                                                                                                | self                       |
| `frontend/public/locales/en/calendar.json` (EXTEND)                                                                              | i18n               | JSON keys                                                | self (already has `weekday.*`)                                                                                                                                                      | self                       |
| `frontend/public/locales/ar/calendar.json` (EXTEND)                                                                              | i18n               | JSON keys                                                | self                                                                                                                                                                                | self                       |
| `frontend/tests/e2e/kanban-render.spec.ts`                                                                                       | E2E                | render assertions                                        | `frontend/tests/e2e/dashboard.spec.ts`                                                                                                                                              | exact                      |
| `frontend/tests/e2e/kanban-rtl.spec.ts`                                                                                          | E2E (RTL)          | LTR/RTL diff                                             | `frontend/tests/e2e/dashboard-rtl.spec.ts`                                                                                                                                          | exact                      |
| `frontend/tests/e2e/kanban-visual.spec.ts`                                                                                       | visual regression  | 8-baseline matrix                                        | `frontend/tests/e2e/dashboard-visual.spec.ts`                                                                                                                                       | exact                      |
| `frontend/tests/e2e/kanban-dnd.spec.ts`                                                                                          | E2E (DnD)          | drag-between-cols                                        | `frontend/tests/e2e/kanban-drag-drop.spec.ts` (existing — reread before write)                                                                                                      | role-match                 |
| `frontend/tests/e2e/kanban-search.spec.ts`                                                                                       | E2E (network mock) | client-side filter                                       | `frontend/tests/e2e/dashboard.spec.ts` (network mock pattern)                                                                                                                       | role-match                 |
| `frontend/tests/e2e/kanban-filters.spec.ts`                                                                                      | E2E (a11y)         | aria-disabled                                            | `frontend/tests/e2e/dashboard-a11y.spec.ts`                                                                                                                                         | role-match                 |
| `frontend/tests/e2e/kanban-responsive.spec.ts`                                                                                   | E2E (responsive)   | 320/768/1280                                             | `frontend/tests/e2e/dashboard-responsive.spec.ts`                                                                                                                                   | exact                      |
| `frontend/tests/e2e/kanban-a11y.spec.ts`                                                                                         | E2E (axe)          | LTR + RTL axe                                            | `frontend/tests/e2e/dashboard-a11y.spec.ts`                                                                                                                                         | exact                      |
| `frontend/tests/e2e/calendar-render.spec.ts`                                                                                     | E2E                | grid + dow assertions                                    | `frontend/tests/e2e/dashboard.spec.ts`                                                                                                                                              | role-match                 |
| `frontend/tests/e2e/calendar-rtl.spec.ts`                                                                                        | E2E (RTL)          | Arabic dow + Indic digits                                | `frontend/tests/e2e/dashboard-rtl.spec.ts`                                                                                                                                          | role-match                 |
| `frontend/tests/e2e/calendar-visual.spec.ts`                                                                                     | visual regression  | 8-baseline matrix                                        | `frontend/tests/e2e/dashboard-visual.spec.ts`                                                                                                                                       | exact                      |
| `frontend/tests/e2e/calendar-mobile.spec.ts`                                                                                     | E2E (responsive)   | week-list <640                                           | `frontend/tests/e2e/dashboard-responsive.spec.ts`                                                                                                                                   | role-match                 |
| `frontend/tests/e2e/calendar-a11y.spec.ts`                                                                                       | E2E (axe)          | LTR + RTL axe                                            | `frontend/tests/e2e/dashboard-a11y.spec.ts`                                                                                                                                         | exact                      |
| `frontend/src/pages/WorkBoard/__tests__/*.test.tsx` (KCard, BoardColumn, BoardToolbar)                                           | unit               | RTL render + mock hooks                                  | `frontend/src/pages/Dashboard/widgets/__tests__/`                                                                                                                                   | exact                      |
| `frontend/src/components/calendar/__tests__/CalendarMonthGrid.test.tsx`, `CalendarEventPill.test.tsx`, `WeekListMobile.test.tsx` | unit               | RTL render                                               | `frontend/src/pages/Dashboard/widgets/__tests__/`                                                                                                                                   | exact                      |
| `frontend/src/lib/i18n/__tests__/toArDigits.test.ts`                                                                             | unit               | pure-function tests                                      | any util test in repo                                                                                                                                                               | role-match                 |
| **DELETE** `frontend/src/components/unified-kanban/EnhancedKanbanBoard.tsx`                                                      | cut                | —                                                        | Phase 38 `OperationsHub.tsx` deletion (D-04)                                                                                                                                        | n/a                        |
| **DELETE** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx`                                                       | cut                | —                                                        | same                                                                                                                                                                                | n/a                        |
| **DELETE** `frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx`                                                        | cut                | —                                                        | same                                                                                                                                                                                | n/a                        |
| **DELETE** `frontend/src/components/unified-kanban/UnifiedKanbanColumn.tsx`                                                      | cut                | —                                                        | same                                                                                                                                                                                | n/a                        |
| **DELETE** `frontend/src/components/unified-kanban/UnifiedKanbanHeader.tsx`                                                      | cut                | —                                                        | same                                                                                                                                                                                | n/a                        |
| **DELETE** `frontend/src/components/unified-kanban/utils/swimlane-utils.ts`                                                      | cut                | —                                                        | same                                                                                                                                                                                | n/a                        |
| **DELETE** `frontend/src/components/unified-kanban/utils/wip-limits.ts`                                                          | cut                | —                                                        | same                                                                                                                                                                                | n/a                        |
| **DELETE** `frontend/src/components/ui/kanban.tsx`                                                                               | cut                | —                                                        | same (after legacy-board cut, no remaining importers — Confirmation #1)                                                                                                             | n/a                        |
| **MODIFY** `frontend/src/components/unified-kanban/index.ts`                                                                     | barrel cleanup     | remove deleted re-exports                                | self                                                                                                                                                                                | self                       |
| **EXTEND** `scripts/check-deleted-components.sh`                                                                                 | CI gate            | shell script                                             | self (Phase 34 + 36 patterns)                                                                                                                                                       | exact                      |

---

## Pattern Assignments

### `frontend/src/pages/WorkBoard/index.ts` (barrel)

**Analog:** `frontend/src/pages/Dashboard/widgets/index.ts`

**Pattern to copy** (verbatim shape):

```ts
export { WorkBoard } from './WorkBoard'
export { KCard } from './KCard'
export { BoardColumn } from './BoardColumn'
export { BoardToolbar } from './BoardToolbar'
```

**Diff hint:** Phase 39 has 4 named exports vs Phase 38's 13; same flat re-export discipline.

---

### `frontend/src/pages/WorkBoard/WorkBoard.tsx` (page composer)

**Analog:** `frontend/src/pages/Dashboard/index.tsx` (composer shape) + `frontend/src/routes/_protected/kanban.tsx` lines 14–32 (current hook wiring — to be **lifted into the page** before deleting `EnhancedKanbanBoard`).

**Imports pattern to copy** (from `Dashboard/index.tsx`):

```ts
import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import {
  useUnifiedKanban,
  useUnifiedKanbanStatusUpdate,
  useUnifiedKanbanRealtime,
} from '@/hooks/useUnifiedKanban'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { BoardToolbar, BoardColumn } from './'
import './board.css'
```

**Hook signature** (from `useUnifiedKanban.ts:160` — **not** what CONTEXT.md says):

```ts
useUnifiedKanban({
  contextType: 'personal', // NOT 'context'
  columnMode: 'status', // NOT 'mode'
  sourceFilter: ['commitment', 'task'], // NOT 'sources'
  // DO NOT pass searchQuery — D-07 mandates client-side filter
})
```

**Mutation pattern** (from `useUnifiedKanban.ts:329`):

```ts
const update = useUnifiedKanbanStatusUpdate()
update.mutate({ itemId, source, newStatus, newWorkflowStage })
// source==='task' writes tasks.status + workflow_stage
// source==='commitment' writes aa_commitments.status only
```

**DnD sensor stack** (from deleted `components/ui/kanban.tsx:218-221` — capture before deletion):

```tsx
const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)
// D-03: when columnMode !== 'status', pass sensors={[]} to disable DnD
```

**Cancelled-stage filter** (Confirmation #8):

```ts
const visibleItems = items.filter(
  (it) => it.workflow_stage !== 'cancelled' && it.status !== 'cancelled',
)
```

**Diff hint:** Replaces `<EnhancedKanbanBoard>` with native `<DndContext>` + `<BoardColumn>` map; lifts hook calls out of route into page.

---

### `frontend/src/pages/WorkBoard/KCard.tsx` (card widget)

**Analog:** `frontend/src/pages/Dashboard/widgets/MyTasks.tsx` (chip + glyph + due + title pattern, lines 30–80).

**Imports pattern**:

```tsx
import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge' // chip
import { LtrIsolate } from '@/components/ui/ltr-isolate' // mono date in RTL
import { DossierGlyph } from '@/components/signature-visuals' // Phase 37 drop-in
import type { WorkItem } from '@/types/work-item.types'
```

**Anatomy** (handoff `pages.jsx#L143-167`):

```tsx
<article
  className={cn('kcard', item.is_overdue && 'overdue', isDone && 'done')}
  onClick={() => onItemClick(item)}
>
  <div className="kcard-top">
    <Badge className="chip-info">{kindLabel}</Badge>
    <Badge className={priorityChip}>{priorityLabel}</Badge>
  </div>
  <div className="kcard-title">{item.title_en /* or _ar */}</div>
  <div className="kcard-foot">
    <div className="kcard-dossier">
      <DossierGlyph flag={item.dossier?.flag ?? ''} size={14} />
      <span>{dossierName}</span>
    </div>
    <LtrIsolate>
      <span className="font-mono">{dueText}</span>
    </LtrIsolate>
    <div className="kcard-owner" aria-label={item.assignee_name}>
      {initials}
    </div>
  </div>
</article>
```

**BOARD-02 critical CSS** (handoff `app.css#L401-411` verbatim — **logical property mandatory**):

```css
.kcard.overdue {
  border-inline-start: 3px solid var(--danger);
}
.kcard.done {
  opacity: 0.55;
}
```

**Diff hint vs MyTasks:** adds two chip slots (kind + priority), replaces checkbox with onClick wrapper, mono due via `<LtrIsolate>`, owner-initials avatar (NOT photo — D-spec).

---

### `frontend/src/pages/WorkBoard/BoardColumn.tsx` (column widget)

**Analog:** `frontend/src/components/unified-kanban/UnifiedKanbanColumn.tsx` (read **before deleting** for sensor + sortable shape) + `frontend/src/pages/Dashboard/widgets/WidgetCard.tsx` (section shell).

**Section shell pattern** (from `WidgetCard.tsx`):

```tsx
<section role="region" aria-labelledby={titleId} className="col">
  <header className="col-head">
    <h3 id={titleId}>{title}</h3>
    <span className="col-count font-mono">{toArDigits(count, lang)}</span>
    <button aria-label={t('actions.addToColumn', { column: title })}>+</button>
  </header>
  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
    {items.map((it) => (
      <KCard key={it.id} item={it} />
    ))}
  </SortableContext>
</section>
```

**Diff hint:** strips swimlane / WIP-warning JSX from old `UnifiedKanbanColumn`; adds per-column `+` button wired to `TaskQuickForm` with `defaultWorkflowStage` prop (Confirmation #5).

---

### `frontend/src/pages/WorkBoard/BoardToolbar.tsx` (toolbar widget)

**Analog:** `frontend/src/pages/Dashboard/widgets/KpiStrip.tsx` (4-chip strip pattern).

**Filter-pill pattern** (D-06 — coming-soon stubs):

```tsx
<button className="filter-pill" aria-pressed={mode === 'status'} onClick={() => setMode('status')}>
  {t('filters.byStatus')}
</button>
<button className="filter-pill" aria-disabled="true" title={t('filters.comingSoon')}>
  {t('filters.byDossier')}
</button>
<button className="filter-pill" aria-disabled="true" title={t('filters.comingSoon')}>
  {t('filters.byOwner')}
</button>
<span className="overdue-chip font-mono">
  {t('overdueChip', { count: toArDigits(overdueCount, lang) })}
</span>
```

**Diff hint:** Two pills are visual-only (`aria-disabled="true"`) — landmine: do NOT call `setMode` in onClick of disabled pills.

---

### `frontend/src/components/calendar/UnifiedCalendar.tsx` (MODIFY in place)

**Analog:** self — surgery zone is lines ~252–290 (verified above: `<div className="grid grid-cols-7 gap-1...">` block + day-cell map).

**Surgery rules** (D-02):

- **KEEP:** Props `linkedItemType` / `linkedItemId` (lines 31–32) — Phase 41 dossier drawer depends on them.
- **KEEP:** `eachDayOfInterval` + `eventsByDay` Map (lines ~81–82) — data layer untouched.
- **KEEP:** Week and Day view modes — only month-view block changes.
- **REPLACE:** Tailwind weekday header (`{[0..6].map → format(new Date(2024,0,d+1), 'EEE')}`) with `<CalendarMonthGrid>` consuming bilingual `dowEn` / `dowAr`.
- **REPLACE:** Day-cell map with `<CalendarMonthGrid days={calendarDays} eventsByDay={eventsByDay} />` rendering `.cal-grid` + `.cal-cell.other` + `.cal-cell.today`.
- **ADD:** `useMediaQuery('(max-width: 640px)')` gate to swap to `<WeekListMobile>` (D-15).

**Diff hint:** in-place reskin of one render block; do NOT replace the component (D-02 explicit landmine).

---

### `frontend/src/components/calendar/CalendarMonthGrid.tsx` (NEW)

**Analog:** `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` lines 51–80 (`formatDayDate` + day-row pattern).

**Grid CSS** (handoff `app.css#L413-423`):

```css
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--line);
}
.cal-cell {
  background: var(--surface);
  padding: 8px;
  min-height: 80px;
}
.cal-cell.other {
  opacity: 0.4;
}
.cal-cell.today .cal-d {
  color: var(--accent-ink);
  font-weight: 700;
}
```

**Day-of-week header** (handoff verbatim):

```ts
const dowEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dowAr = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
const labels = lang === 'ar' ? dowAr : dowEn
```

**Day-number rendering with `toArDigits`**:

```tsx
<span className="cal-d">{toArDigits(format(day, 'd'), lang)}</span>
```

---

### `frontend/src/components/calendar/CalendarEventPill.tsx` (NEW)

**Analog:** `frontend/src/components/ui/badge.tsx` (token-styled span).

**D-13 fallback** (Confirmation #4 — `'travel'` and `'pending'` literals **do not exist** on live `CalendarEvent`):

```tsx
import { useEffect } from 'react'

// One warn per page-mount (parent emits it):
useEffect(() => {
  console.warn('[Phase39] CalendarEvent variants travel/pending not present in schema; rendering all events as default accent-soft')
}, [])

// Component:
<button className="cal-ev" onClick={() => onEventClick(event)}>
  <DossierGlyph flag={event.dossier?.flag ?? ''} size={12} />
  <span>{title}</span>
</button>
```

**Diff hint:** No variant branching this phase. CSS `.cal-ev.travel` / `.cal-ev.pending` ship in stylesheet but are never applied; backend follow-up phase will wire them.

---

### `frontend/src/components/calendar/WeekListMobile.tsx` (NEW)

**Analog:** `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` (`.week-list` consumer, exact CSS class).

**Reuse strategy** (Confirmation #10): lift `.week-list` from `frontend/src/pages/Dashboard/widgets/dashboard.css` into shared `frontend/src/components/calendar/calendar.css`. Keep dashboard.css importing the same source (single block).

**Toolbar pattern** (D-15):

```tsx
<div className="week-list-toolbar">
  <button onClick={prevWeek} aria-label={t('weeklist.previousWeek')}>
    ‹
  </button>
  <button onClick={goToday}>{t('weeklist.today')}</button>
  <button onClick={nextWeek} aria-label={t('weeklist.nextWeek')}>
    ›
  </button>
</div>
```

---

### `frontend/src/lib/i18n/toArDigits.ts` (NEW — greenfield)

**Analog:** none. Port from `/tmp/inteldossier-handoff/inteldossier/project/src/data.jsx#L8`.

**Skeleton**:

```ts
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const

export function toArDigits(input: string | number, lang: string): string {
  const s = String(input)
  if (lang !== 'ar') return s
  return s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)])
}
```

**Landmine** (RESEARCH §Landmines): never compose with `toLocaleString('ar')` — double-conversion. Apply once at render site only.

---

### `frontend/src/routes/_protected/kanban.tsx` (REWRITE)

**Analog:** `frontend/src/routes/_protected/dashboard.tsx` (Suspense + lazy + minimal route file shape).

**Pattern to copy**:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const WorkBoard = lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))

export const Route = createFileRoute('/_protected/kanban')({
  component: KanbanRoute,
})

function KanbanRoute() {
  return (
    <Suspense fallback={null /* page-level Skeleton inside WorkBoard */}>
      <WorkBoard />
    </Suspense>
  )
}
```

**Diff hint:** Drop Zod search schema (the new board owns its own URL state if any). Drop all imports from `@/components/unified-kanban`. Drop `useUnifiedKanban` hook calls — they move into `WorkBoard.tsx`.

---

### `frontend/src/routes/_protected/calendar.tsx` (KEEP)

**Analog:** self. No structural change — only the lazy-loaded `<UnifiedCalendar>` output changes (D-02 in-place surgery).

---

### `frontend/src/routes/_protected/my-work/board.tsx` (DELETE)

**Analog:** Phase 36 layout deletions in `scripts/check-deleted-components.sh`.

**Action** (Confirmation #1 + Risk #1): delete the file. Add redirect via TanStack Router's `redirect()` from `/my-work/board` → `/kanban` if the planner wants belt-and-braces — otherwise, link sweep + 404 acceptable.

**Diff hint:** This duplicates `/kanban` per D-01. Researcher recommendation: **delete** (planner finalizes — flag for user discussion if uncertain).

---

### Locale extensions

**Analog:** self — `unified-kanban.json` and `calendar.json` already exist in EN + AR.

**EN unified-kanban.json — append** (no key collisions, verified against Confirmation #13):

```json
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
```

**EN calendar.json — append**:

```json
"weeklist": {
  "previousWeek": "Previous week",
  "nextWeek": "Next week",
  "today": "Today"
},
"actions": { "newEvent": "New event" }
```

Arabic mirrors per Confirmation #13: `بالحالة`, `بالملف`, `بالمسؤول`, `قريبًا`, `بحث في عناصر العمل…`, `{{count}} متأخر`, `عنصر جديد`, `عرض القائمة`, `إضافة إلى {{column}}`, `الأسبوع السابق`, `الأسبوع التالي`, `اليوم`, `فعالية جديدة`.

---

### E2E tests (12 specs)

**Closest analogs (1:1 correspondence):**
| Phase 39 spec | Phase 38 analog | What to copy |
|---------------|-----------------|--------------|
| `kanban-render.spec.ts` | `dashboard.spec.ts` | login + waitForLoadState + role-query assertions |
| `kanban-rtl.spec.ts` | `dashboard-rtl.spec.ts` | `await page.locator('html').setAttribute('dir', 'rtl')` pattern |
| `kanban-visual.spec.ts` | `dashboard-visual.spec.ts` | `expect(page).toHaveScreenshot()` 8-baseline matrix; reduced-motion `addStyleTag`; `await document.fonts.ready` |
| `kanban-dnd.spec.ts` | existing `frontend/tests/e2e/kanban-drag-drop.spec.ts` (re-read; do not delete) | `page.dragTo()` API |
| `kanban-search.spec.ts` | `dashboard.spec.ts` | `page.route('**/api/**', ...)` mock + assert no calls |
| `kanban-filters.spec.ts` | `dashboard-a11y.spec.ts` | `expect(pill).toHaveAttribute('aria-disabled', 'true')` |
| `kanban-responsive.spec.ts` | `dashboard-responsive.spec.ts` | viewport.setSize matrix |
| `kanban-a11y.spec.ts` | `dashboard-a11y.spec.ts` | `AxeBuilder` zero serious/critical |
| `calendar-*.spec.ts` (5) | `dashboard-*.spec.ts` (5) | mirror 1:1 |

**Visual-regression matrix** (Confirmation #12): LTR/RTL × light/dark × {768, 1280} = 8 per spec → 16 baselines total.

---

### Unit tests under `__tests__/`

**Analog:** `frontend/src/pages/Dashboard/widgets/__tests__/` (exists; mock `useUnifiedKanban` similar to mock `useTasks` in MyTasks tests).

**Pattern**:

```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
// mock useUnifiedKanban return shape per useUnifiedKanban.ts:160
```

---

### CI gate `scripts/check-deleted-components.sh` (EXTEND)

**Analog:** self (Phase 34 + 36 patterns block, lines 8–32).

**Append patterns** (mirror existing format exactly):

```bash
# Phase 39 kanban-calendar deletions (D-04)
"from.*components/unified-kanban/UnifiedKanbanBoard"
"from.*components/unified-kanban/EnhancedKanbanBoard"
"from.*components/unified-kanban/UnifiedKanbanCard"
"from.*components/unified-kanban/UnifiedKanbanColumn"
"from.*components/unified-kanban/UnifiedKanbanHeader"
"from.*components/unified-kanban/utils/swimlane-utils"
"from.*components/unified-kanban/utils/wip-limits"
"from.*components/ui/kanban"
```

**Append filesystem-presence array** (mirror `PHASE_36_DELETED_FILES`):

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
for f in "${PHASE_39_DELETED_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "FAIL: Phase-39 deleted file reappeared: $f" >&2
    FAIL=1
  fi
done
```

**Diff hint:** Concat — do not replace existing arrays/patterns. The success line at bottom should be updated to mention Phase 39.

---

## Shared Patterns

### SP-1: RTL-safe logical properties (mandatory across every new file)

**Source:** project `CLAUDE.md` "RTL-Safe Tailwind Classes" + Phase 38 dashboard.css.
**Apply to:** all `WorkBoard/*`, `calendar/*` files.

```tsx
// ✅ ms-* / me-* / ps-* / pe-* / start-* / end-* / text-start / text-end
// ❌ ml-* / mr-* / pl-* / pr-* / left-* / right-* / text-left / text-right
// CSS: border-inline-start (BOARD-02 mandate), padding-inline-end, margin-inline-start
```

---

### SP-2: Token-only colors (Phase 33)

**Source:** Phase 33 D-12/D-16 + handoff `app.css`.
**Apply to:** `board.css`, `calendar.css`, every component.

```css
/* ✅ var(--surface), var(--line), var(--accent), var(--accent-soft), var(--accent-ink),
   var(--warn), var(--warn-soft), var(--danger), var(--ink), var(--ink-mute), var(--ink-faint) */
/* ❌ #fff, red, hsl(...), Tailwind color literals */
```

---

### SP-3: Skeleton shape-match (Phase 38 D-11)

**Source:** `frontend/src/pages/Dashboard/widgets/WidgetSkeleton.tsx` lines 1–18.
**Apply to:** WorkBoard page (4 columns × 3 kcard skeletons), CalendarMonthGrid (5×7 cell skeletons), WeekListMobile (7 row skeletons).

```tsx
import { Skeleton } from '@/components/ui/skeleton'
;<div className="space-y-2" aria-busy="true" aria-live="polite">
  {Array.from({ length: rows }).map((_, idx) => (
    <Skeleton key={idx} className="h-10 w-full min-h-[40px]" />
  ))}
</div>
```

---

### SP-4: `<LtrIsolate>` wrap for mono digits in RTL

**Source:** `frontend/src/components/ui/ltr-isolate.tsx` (verified present) + `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` line 88.
**Apply to:** kcard due text, BoardColumn count, BoardToolbar overdue chip count, CalendarMonthGrid day numbers.

```tsx
<LtrIsolate>
  <span className="font-mono">{dueText}</span>
</LtrIsolate>
```

---

### SP-5: i18n hook + namespace

**Source:** every Phase 38 widget.
**Apply to:** every new component.

```ts
const { t, i18n } = useTranslation('unified-kanban') // or 'calendar'
const lang = i18n.language
```

**Landmine:** Do NOT create new namespaces (CLAUDE.md "single source of truth"). Extend `unified-kanban` and `calendar` only.

---

### SP-6: DnD conditional sensors

**Source:** deleted `frontend/src/components/ui/kanban.tsx` lines 218–221 (capture before deletion).
**Apply to:** `WorkBoard.tsx` only.

```tsx
const sensors =
  columnMode === 'status'
    ? useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
      )
    : useSensors() // empty → drag fully disabled (D-03)
```

**Landmine** (RESEARCH §Landmines): TouchSensor `delay: 200` prevents drag-vs-scroll conflict on mobile (D-16 mandates horizontal-scroll preserved).

---

## No Analog Found

| File                                     | Role             | Reason                                                                                           | Recommended skeleton                                                                    |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `frontend/src/lib/i18n/toArDigits.ts`    | util             | Greenfield port from handoff `data.jsx#L8` (Confirmation #3)                                     | Provided in section above                                                               |
| `frontend/src/pages/WorkBoard/KCard.tsx` | composite widget | No existing repo file ships kind+priority chips + glyph + mono due + initials avatar in one card | Composite — copy each row of MyTasks pattern; assemble per handoff `pages.jsx#L143-167` |

---

## Metadata

**Analog search scope:** `frontend/src/`, `frontend/tests/e2e/`, `tests/e2e/`, `scripts/`, `frontend/public/locales/`, `.planning/phases/{37,38}/`.
**Files scanned:** ~80 files via targeted `sed`/`ls` ranges.
**Pattern extraction date:** 2026-04-25.
**Researcher Confirmations referenced:** #1, #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14.
**Risks flagged for planner:** A1 (`my-work/board.tsx` fate), A2 (commitment deep-link), A3 (`.week-list` lift location).

## PATTERN MAPPING COMPLETE
