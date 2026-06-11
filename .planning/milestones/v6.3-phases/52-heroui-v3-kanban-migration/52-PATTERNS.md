# Phase 52: HeroUI v3 Kanban Migration - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 14 new/modified files
**Analogs found:** 14 / 14 (100% coverage — every new file has a closest in-repo analog)

## File Classification

| New/Modified File                                                           | Role                           | Data Flow        | Closest Analog                                                                                                    | Match Quality                      |
| --------------------------------------------------------------------------- | ------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `frontend/src/components/kanban/KanbanProvider.tsx`                         | primitive (container)          | event-driven     | `frontend/src/components/kibo-ui/kanban/index.tsx:171-317` + `frontend/src/pages/WorkBoard/WorkBoard.tsx:132-141` | exact (provider) + exact (sensors) |
| `frontend/src/components/kanban/KanbanBoard.tsx`                            | primitive (drop target)        | event-driven     | `frontend/src/components/kibo-ui/kanban/index.tsx:60-83`                                                          | exact                              |
| `frontend/src/components/kanban/KanbanHeader.tsx`                           | primitive (presentational)     | static           | `frontend/src/components/kibo-ui/kanban/index.tsx:165-169`                                                        | exact                              |
| `frontend/src/components/kanban/KanbanCards.tsx`                            | primitive (sortable container) | event-driven     | `frontend/src/components/kibo-ui/kanban/index.tsx:136-163`                                                        | exact                              |
| `frontend/src/components/kanban/KanbanCard.tsx`                             | primitive (sortable item)      | event-driven     | `frontend/src/components/kibo-ui/kanban/index.tsx:85-134`                                                         | exact                              |
| `frontend/src/components/kanban/index.ts`                                   | barrel export                  | static           | `frontend/src/components/kibo-ui/kanban/index.tsx:32` (re-export idiom)                                           | role-match                         |
| `frontend/src/components/kanban/__tests__/KanbanProvider.test.tsx`          | test (unit)                    | event-driven     | `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx`                                                       | exact (mock pattern)               |
| `frontend/src/components/kanban/__tests__/KanbanBoard.test.tsx`             | test (unit)                    | event-driven     | `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx`                                                       | role-match                         |
| `frontend/src/pages/engagements/workspace/TasksTab.tsx` (modified)          | page/consumer                  | event-driven     | self (current file) — import-swap only                                                                            | exact                              |
| `frontend/src/components/assignments/EngagementKanbanDialog.tsx` (modified) | dialog/consumer                | event-driven     | self (current file) — import-swap only                                                                            | exact                              |
| `frontend/tests/e2e/tasks-tab-visual.spec.ts`                               | test (e2e visual)              | request-response | `frontend/tests/e2e/kanban-visual.spec.ts`                                                                        | exact                              |
| `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts`                | test (e2e visual)              | request-response | `frontend/tests/e2e/kanban-visual.spec.ts`                                                                        | exact                              |
| `tools/eslint-fixtures/bad-kibo-ui-import.tsx`                              | test (lint fixture)            | static           | `tools/eslint-fixtures/bad-design-token.tsx` + `bad-vi-mock.ts`                                                   | exact                              |
| `eslint.config.mjs` (modified)                                              | config (lint)                  | static           | self (lines 133-165 patterns block + line 332 carve-out)                                                          | exact                              |

## Pattern Assignments

### `frontend/src/components/kanban/KanbanProvider.tsx` (primitive, event-driven)

**Primary analog:** `frontend/src/components/kibo-ui/kanban/index.tsx` (lines 171-317) — the file being replaced. Behavior contract is verbatim-preserved (CONTEXT D-01).
**Secondary analog:** `frontend/src/pages/WorkBoard/WorkBoard.tsx` (lines 132-141) — sensor stack source (CONTEXT D-04).

**Imports pattern** (from kibo-ui/kanban/index.tsx lines 1-28, prune `tunnel-rat` per D-02, add `sortableKeyboardCoordinates` per D-04):

```typescript
'use client'

import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
// DO NOT import 'tunnel-rat' — removed per D-02 / D-19
import { cn } from '@/lib/utils'
```

**Context shape** (verbatim from kibo-ui/kanban/index.tsx lines 45-58):

```typescript
type KanbanItemProps = {
  id: string
  name: string
  column: string
} & Record<string, unknown>

type KanbanColumnProps = {
  id: string
  name: string
} & Record<string, unknown>

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[]
  data: T[]
  activeCardId: string | null
}

export const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
})

export type { DragEndEvent } from '@dnd-kit/core'
```

**Sensor stack pattern** (from `WorkBoard.tsx:132-139` — REPLACES kibo-ui's constraint-less sensors at lines 201-205 per D-04):

```typescript
// SOURCE: frontend/src/pages/WorkBoard/WorkBoard.tsx:132-139 (proven since Phase 39)
const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: { delay: 200, tolerance: 5 },
})
const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
})
const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)
```

**Live-reorder pattern (D-03)** (verbatim from kibo-ui/kanban/index.tsx lines 215-245):

```typescript
const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event

  if (!over) {
    return
  }

  const activeItem = data.find((item) => item.id === active.id)
  const overItem = data.find((item) => item.id === over.id)

  if (!activeItem) {
    return
  }

  const activeColumn = activeItem.column
  const overColumn =
    overItem?.column || columns.find((col) => col.id === over.id)?.id || columns[0]?.id

  if (activeColumn !== overColumn) {
    let newData = [...data]
    const activeIndex = newData.findIndex((item) => item.id === active.id)
    const overIndex = newData.findIndex((item) => item.id === over.id)

    newData[activeIndex]!.column = overColumn!
    newData = arrayMove(newData, activeIndex, overIndex)

    onDataChange?.(newData)
  }

  onDragOver?.(event)
}
```

**Drag lifecycle pattern** (handleDragStart + handleDragEnd verbatim from kibo-ui/kanban/index.tsx lines 207-266):

```typescript
const handleDragStart = (event: DragStartEvent) => {
  const card = data.find((item) => item.id === event.active.id)
  if (card) {
    setActiveCardId(event.active.id as string)
  }
  onDragStart?.(event)
}

const handleDragEnd = (event: DragEndEvent) => {
  setActiveCardId(null)
  onDragEnd?.(event)
  const { active, over } = event
  if (!over || active.id === over.id) {
    return
  }
  let newData = [...data]
  const oldIndex = newData.findIndex((item) => item.id === active.id)
  const newIndex = newData.findIndex((item) => item.id === over.id)
  newData = arrayMove(newData, oldIndex, newIndex)
  onDataChange?.(newData)
}
```

**Announcements pattern** (verbatim from kibo-ui/kanban/index.tsx lines 268-291 — screen-reader bilingual support):

```typescript
const announcements: Announcements = {
  onDragStart({ active }) {
    const { name, column } = data.find((item) => item.id === active.id) ?? {}
    return `Picked up the card "${name}" from the "${column}" column`
  },
  onDragOver({ active, over }) {
    const { name } = data.find((item) => item.id === active.id) ?? {}
    const newColumn = columns.find((column) => column.id === over?.id)?.name
    return `Dragged the card "${name}" over the "${newColumn}" column`
  },
  onDragEnd({ active, over }) {
    const { name } = data.find((item) => item.id === active.id) ?? {}
    const newColumn = columns.find((column) => column.id === over?.id)?.name
    return `Dropped the card "${name}" into the "${newColumn}" column`
  },
  onDragCancel({ active }) {
    const { name } = data.find((item) => item.id === active.id) ?? {}
    return `Cancelled dragging the card "${name}"`
  },
}
```

**DndContext + native DragOverlay pattern (D-02 — replaces tunnel-rat)** (adapted from kibo-ui/kanban/index.tsx lines 293-316; remove `<t.Out />`, render gated overlay-child as documented in 52-RESEARCH §"Pattern 1"):

```typescript
return (
  <KanbanContext.Provider value={{ columns, data, activeCardId }}>
    <DndContext
      accessibility={{ announcements }}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
      {...props}
    >
      <div className={cn('grid size-full auto-cols-fr grid-flow-col gap-4', className)}>
        {columns.map((column) => children(column))}
      </div>
      {typeof window !== 'undefined' &&
        createPortal(
          <DragOverlay>
            {/* Native overlay — gating handled by KanbanCard via activeCardId === id
                (see KanbanCard pattern below). NO <t.Out /> from tunnel-rat. */}
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  </KanbanContext.Provider>
)
```

**RTL pattern** (no manual `.reverse()`; let `dir="rtl"` flip flexbox — anti-pattern documented in 52-RESEARCH §"Anti-Patterns to Avoid"). The `columns.map((column) => children(column))` iterates in natural order; the parent consumer (TasksTab) sets `dir={isRTL ? 'rtl' : 'ltr'}` on the wrapper.

---

### `frontend/src/components/kanban/KanbanBoard.tsx` (primitive, event-driven)

**Analog:** `frontend/src/components/kibo-ui/kanban/index.tsx` (lines 60-83) — verbatim API, MODIFIED token swap per D-06 / D-07 / D-12.

**Imports pattern** (lines 17-28 of source):

```typescript
import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
```

**Core useDroppable pattern** (from kibo-ui/kanban/index.tsx lines 66-83 — KEEP shape, SWAP tokens):

```typescript
// SOURCE: kibo-ui/kanban/index.tsx:66-83 with three token swaps:
//   1) D-06 — bg-secondary → bg-muted/30 border-muted (column body)
//   2) D-09/D-12 — shadow-sm removed (no shadows); ring-primary → ring-accent
//   3) D-07 — NEW prop isCancelled: when true, adds border-danger/30 outline
export type KanbanBoardProps = {
  id: string
  children: ReactNode
  className?: string
  isCancelled?: boolean  // NEW (D-07)
}

export const KanbanBoard = ({ id, children, className, isCancelled }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      className={cn(
        // FROM kibo-ui:
        //   'flex size-full min-h-40 flex-col divide-y overflow-hidden rounded-md border
        //    bg-secondary text-xs shadow-sm ring-2 transition-all'
        // TO Phase 52 (token-bound, no shadow):
        'flex size-full min-h-40 flex-col divide-y overflow-hidden rounded-md border bg-muted/30 border-muted text-xs ring-2 transition-all',
        isOver ? 'ring-accent' : 'ring-transparent',  // D-12 (was ring-primary)
        isCancelled === true && 'border-danger/30',   // D-07 cancelled cue
        className,
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  )
}
```

**Token resolution notes** (verified against `frontend/src/index.css` `@theme` block, lines 43-118):

- `bg-muted/30` → `--color-muted: var(--surface)` (`#ffffff @ 30%`)
- `border-muted` → same token surface for border
- `ring-accent` → `--color-accent: var(--accent)` (`oklch(58% 0.14 32)`)
- `border-danger/30` → `--color-danger` (per index.css line 65 `--color-danger-foreground` family)

---

### `frontend/src/components/kanban/KanbanCard.tsx` (primitive, event-driven)

**Analog:** `frontend/src/components/kibo-ui/kanban/index.tsx` (lines 85-134) — KEEP useSortable + Card wrapper shape; STRIP `shadow-sm` and `hover:shadow-md`; SWAP `ring-primary` → `ring-accent`.

**Imports pattern** (lines 21-26 of source):

```typescript
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useContext, type ReactNode } from 'react'
import { Card } from '@/components/ui/card' // shadcn-compatible re-export of HeroUICard
import { cn } from '@/lib/utils'
import { KanbanContext, type KanbanContextProps } from './KanbanProvider'
```

**useSortable + transform style pattern** (verbatim from kibo-ui/kanban/index.tsx lines 96-104):

```typescript
const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
  id,
})
const { activeCardId } = useContext(KanbanContext) as KanbanContextProps

const style = {
  transition,
  transform: CSS.Transform.toString(transform),
}
```

**Card render pattern (D-09 + D-10 + D-11)** — kibo-ui source at lines 106-133, with token swaps:

```typescript
// SOURCE: kibo-ui/kanban/index.tsx:106-133 with three token swaps:
//   D-09: strip 'shadow-sm' from Card className entirely
//   D-10: replace 'hover:shadow-md' with 'hover:bg-surface-raised hover:border-line-soft'
//   D-11: drag-overlay clone uses 'ring-2 ring-accent' (was ring-primary)
return (
  <>
    <div style={style} {...listeners} {...attributes} ref={setNodeRef}>
      <Card
        className={cn(
          // FROM: 'cursor-grab gap-4 rounded-md p-3 shadow-sm'
          // TO  : flat surface, hover lift via tokens (D-09 + D-10):
          'cursor-grab gap-4 rounded-md p-3 transition-all hover:bg-surface-raised hover:border-line-soft',
          isDragging && 'pointer-events-none cursor-grabbing opacity-30',
          className,
        )}
      >
        {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
      </Card>
    </div>
    {activeCardId === id && (
      // Native DragOverlay child rendered via React Portal in KanbanProvider.
      // kibo-ui used <t.In>; Phase 52 uses createPortal to dnd-kit's DragOverlay
      // OR — recommended per 52-RESEARCH Pattern 1 option 2 — render the
      // overlay clone here as a sibling that dnd-kit's overlay slot picks up.
      // See 52-RESEARCH Pitfall 1 for the three render-strategy options.
      <DragOverlayChild>
        <Card
          className={cn(
            // FROM kibo-ui: 'cursor-grab gap-4 rounded-md p-3 shadow-sm ring-2 ring-primary'
            // TO Phase 52 (D-11 ring-accent, no shadow):
            'cursor-grab gap-4 rounded-md p-3 ring-2 ring-accent',
            isDragging && 'cursor-grabbing',
            className,
          )}
        >
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </Card>
      </DragOverlayChild>
    )}
  </>
)
```

**Hover state token resolution** (verified against `frontend/src/index.css` `@theme` block):

- `hover:bg-surface-raised` → `--color-surface-raised: var(--surface-raised)` (`#ffffff` in Bureau)
- `hover:border-line-soft` → `--color-line-soft: var(--line-soft)` (`#efece3` in Bureau, line 141)

---

### `frontend/src/components/kanban/KanbanCards.tsx` (primitive, sortable container)

**Analog:** `frontend/src/components/kibo-ui/kanban/index.tsx` (lines 136-163) — verbatim (no token changes, ScrollArea + SortableContext shape preserved).

**Imports pattern**:

```typescript
import { SortableContext } from '@dnd-kit/sortable'
import { useContext, type HTMLAttributes, type ReactNode } from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { KanbanContext, type KanbanContextProps } from './KanbanProvider'
```

**SortableContext + filtering pattern** (verbatim from source lines 144-163):

```typescript
export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id'
> & {
  children: (item: T) => ReactNode
  id: string
}

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>
  const filteredData = data.filter((item) => item.column === props.id)
  const items = filteredData.map((item) => item.id)

  return (
    <ScrollArea className="overflow-hidden">
      <SortableContext items={items}>
        <div className={cn('flex flex-grow flex-col gap-2 p-2', className)} {...props}>
          {filteredData.map(children)}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}
```

---

### `frontend/src/components/kanban/KanbanHeader.tsx` (primitive, presentational)

**Analog:** `frontend/src/components/kibo-ui/kanban/index.tsx` (lines 165-169) — KEEP shape, default classes already token-friendly (`font-semibold text-sm`).

**Component pattern** (verbatim from source):

```typescript
import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  // D-06 default: bg-muted/50 border-b is applied by consumers via className override;
  // the primitive ships with just the typography defaults.
  <div className={cn('m-0 p-2 font-semibold text-sm', className)} {...props} />
)
```

Both consumers (TasksTab.tsx line 204, EngagementKanbanDialog.tsx line 169) already pass `className="bg-muted/50 font-semibold text-sm px-4 py-3 border-b"`, so the default stays minimal.

---

### `frontend/src/components/kanban/index.ts` (barrel export)

**Analog:** `frontend/src/components/kibo-ui/kanban/index.tsx` line 32 (`export type { DragEndEvent } from '@dnd-kit/core'`) — re-export idiom.

**Barrel pattern**:

```typescript
// Re-export the five primitives + the DragEndEvent type for consumer ergonomics
// (matches kibo-ui pattern at index.tsx:32).
export { KanbanProvider, KanbanContext } from './KanbanProvider'
export type { KanbanProviderProps, KanbanItemProps, KanbanColumnProps } from './KanbanProvider'
export { KanbanBoard } from './KanbanBoard'
export type { KanbanBoardProps } from './KanbanBoard'
export { KanbanCards } from './KanbanCards'
export type { KanbanCardsProps } from './KanbanCards'
export { KanbanCard } from './KanbanCard'
export type { KanbanCardProps } from './KanbanCard'
export { KanbanHeader } from './KanbanHeader'
export type { KanbanHeaderProps } from './KanbanHeader'
export type { DragEndEvent } from '@dnd-kit/core'
```

---

### `frontend/src/components/kanban/__tests__/KanbanProvider.test.tsx` (test, unit)

**Analog:** `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` — the only in-repo precedent that mocks `@dnd-kit/core` at the boundary to assert sensor configuration. Phase 52 mirrors this exact shape.

**Mock pattern for `@dnd-kit/core`** (verbatim from WorkBoard.test.tsx lines 46-76 — captures sensors + onDragEnd at the DndContext boundary):

```typescript
// SOURCE: frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx:46-76
let lastDndSensors: unknown[] = []
let lastDragEndHandler: ((e: unknown) => void) | undefined

vi.mock('@dnd-kit/core', () => {
  const useSensor = (sensor: unknown, opts?: unknown): { sensor: unknown; opts: unknown } => ({
    sensor,
    opts,
  })
  const useSensors = (...sensors: unknown[]): unknown[] => sensors
  return {
    DndContext: ({
      children,
      sensors,
      onDragEnd,
    }: {
      children: ReactNode
      sensors: unknown[]
      onDragEnd: (e: unknown) => void
    }): ReactElement => {
      lastDndSensors = sensors
      lastDragEndHandler = onDragEnd
      return <div data-testid="dnd-ctx">{children}</div>
    },
    MouseSensor: { name: 'MouseSensor' },
    TouchSensor: { name: 'TouchSensor' },
    KeyboardSensor: { name: 'KeyboardSensor' },
    useSensor,
    useSensors,
    DragOverlay: ({ children }: { children: ReactNode }): ReactElement => <div data-testid="overlay">{children}</div>,
    closestCenter: vi.fn(),
  }
})

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }): ReactElement => <>{children}</>,
  arrayMove: <T,>(arr: T[], from: number, to: number): T[] => {
    const next = [...arr]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved!)
    return next
  },
  sortableKeyboardCoordinates: (): { x: number; y: number } => ({ x: 0, y: 0 }),
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transition: '', transform: null, isDragging: false }),
}))
```

**Sensor-assertion test pattern** (from WorkBoard.test.tsx lines 393-402 — assert MouseSensor first + D-04 activation constraint passed through):

```typescript
it('sensors include MouseSensor + TouchSensor + KeyboardSensor with D-04 constraints', async () => {
  // ... render KanbanProvider with empty data
  expect(lastDndSensors.length).toBe(3)
  const mouse = lastDndSensors[0] as {
    sensor: { name: string }
    opts: { activationConstraint: { distance: number } }
  }
  expect(mouse.sensor.name).toBe('MouseSensor')
  expect(mouse.opts.activationConstraint.distance).toBe(8)
  const touch = lastDndSensors[1] as {
    sensor: { name: string }
    opts: { activationConstraint: { delay: number; tolerance: number } }
  }
  expect(touch.opts.activationConstraint.delay).toBe(200)
  expect(touch.opts.activationConstraint.tolerance).toBe(5)
})
```

**Drag-end mutation test pattern** (from WorkBoard.test.tsx lines 404-417 — fire the captured handler and assert onDragEnd was called):

```typescript
it('handleDragEnd fires onDragEnd callback when dropped on a different column', async () => {
  // ... render with data
  expect(typeof lastDragEndHandler).toBe('function')
  lastDragEndHandler!({
    active: { id: 'card-1' },
    over: { id: 'in_progress' },
  })
  expect(onDragEndSpy).toHaveBeenCalledTimes(1)
})
```

---

### `frontend/src/components/kanban/__tests__/KanbanBoard.test.tsx` (test, unit)

**Analog:** Same as KanbanProvider test — `WorkBoard.test.tsx` mock pattern. Focus on `useDroppable.isOver` ring toggle and the new `isCancelled` border-danger cue.

**Mock pattern for `useDroppable`**:

```typescript
let isOverState = false
vi.mock('@dnd-kit/core', () => ({
  useDroppable: (): { isOver: boolean; setNodeRef: (n: HTMLElement | null) => void } => ({
    isOver: isOverState,
    setNodeRef: vi.fn(),
  }),
}))
```

**Assertion patterns**:

```typescript
it('applies ring-accent when isOver=true', () => {
  isOverState = true
  const { container } = render(<KanbanBoard id="todo">x</KanbanBoard>)
  expect(container.firstChild).toHaveClass('ring-accent')
})

it('applies border-danger/30 when isCancelled=true', () => {
  isOverState = false
  const { container } = render(<KanbanBoard id="cancelled" isCancelled>x</KanbanBoard>)
  expect(container.firstChild).toHaveClass('border-danger/30')
})

it('default surface is bg-muted/30 border-muted (D-06)', () => {
  isOverState = false
  const { container } = render(<KanbanBoard id="todo">x</KanbanBoard>)
  expect(container.firstChild).toHaveClass('bg-muted/30')
  expect(container.firstChild).toHaveClass('border-muted')
})

it('does NOT apply any shadow utility (D-09)', () => {
  isOverState = false
  const { container } = render(<KanbanBoard id="todo">x</KanbanBoard>)
  const cls = (container.firstChild as HTMLElement).className
  expect(cls).not.toMatch(/shadow-/)
})
```

---

### `frontend/src/pages/engagements/workspace/TasksTab.tsx` (modified — page/consumer)

**Analog:** self (current file). Modification is import-path swap + STAGE_COLORS deletion + D-08 mobile section update + Tier-C disable removal.

**Import swap pattern** (lines 19-25 of current file):

```typescript
// CURRENT (delete):
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban'

// REPLACE WITH:
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kanban'
```

**STAGE_COLORS deletion (D-05)** — remove lines 34-45 entirely:

```typescript
// DELETE THIS BLOCK (D-05 — resolves 5 Tier-C eslint-disable directives):
const STAGE_COLORS: Record<WorkflowStage, string> = {
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: ...
  todo: 'bg-slate-100 dark:bg-slate-800',
  // ... (lines 35-44)
}
```

**Mobile section className update (D-08)** — line 284 current:

```tsx
// CURRENT (line 284):
<div className={`rounded-lg border ${STAGE_COLORS[stage]} overflow-hidden`}>

// REPLACE WITH:
<div
  className={cn(
    'rounded-lg border bg-muted/30 border-muted overflow-hidden',
    stage === 'cancelled' && 'border-danger/30',
  )}
>
```

**Desktop KanbanCard className strip** — line 221 current:

```tsx
// CURRENT (line 221):
className = 'bg-background hover:shadow-md transition-shadow border-border'

// REPLACE WITH (D-09 / D-10 — strip shadow, use surface-raised hover):
className = 'bg-background hover:bg-surface-raised hover:border-line-soft transition-all'
```

**Cancelled column ring pass-through (D-07)** — line 202 current:

```tsx
// CURRENT (line 199-203):
<KanbanBoard
  key={column.id}
  id={column.id}
  className={`bg-muted/30 border-muted min-w-[280px]`}
>

// REPLACE WITH (use new isCancelled prop):
<KanbanBoard
  key={column.id}
  id={column.id}
  isCancelled={column.id === 'cancelled'}
  className="min-w-[280px]"
>
```

---

### `frontend/src/components/assignments/EngagementKanbanDialog.tsx` (modified — dialog/consumer)

**Analog:** self (current file). Single import-path swap + KanbanCard className strip.

**Import swap pattern** (lines 15-21 of current file):

```typescript
// CURRENT (delete):
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban'

// REPLACE WITH:
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kanban'
```

**KanbanCard className strip** — line 187 current:

```tsx
// CURRENT (line 187):
className = 'bg-background hover:shadow-md transition-shadow border-border'

// REPLACE WITH (D-09 / D-10):
className = 'bg-background hover:bg-surface-raised hover:border-line-soft transition-all'
```

**KanbanBoard isCancelled pass-through** — line 168 current:

```tsx
// CURRENT (line 168):
<KanbanBoard key={column.id} id={column.id} className="bg-muted/30 border-muted">

// REPLACE WITH:
<KanbanBoard
  key={column.id}
  id={column.id}
  isCancelled={column.id === 'cancelled'}
/>
```

---

### `frontend/tests/e2e/tasks-tab-visual.spec.ts` (test, e2e visual)

**Analog:** `frontend/tests/e2e/kanban-visual.spec.ts` (28 lines) — verbatim matrix shape per CONTEXT D-14 / D-15. Mirror determinism layers per 52-RESEARCH §"Common Pitfalls" #6 + #8.

**Imports + matrix pattern** (verbatim from kanban-visual.spec.ts lines 1-8):

```typescript
import { test, expect } from '@playwright/test'

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const
```

**Test loop pattern** (verbatim from kanban-visual.spec.ts lines 10-30, swap `goto` target to seeded engagement URL per CONTEXT D-14 / D-16):

```typescript
// Engagement seeded with: todo:2, in_progress:2, review:1, done:2, cancelled:1
// (CONTEXT D-16 — exercises cancelled-column D-07 border-only cue)
const SEEDED_ENGAGEMENT_ID = '<TBD-planner-supplies-from-fixture>'

test.describe('Phase 52: TasksTab Kanban visual regression', () => {
  for (const { dir, viewport } of matrix) {
    test(`${dir} @ ${viewport.width}x${viewport.height}`, async ({ page }): Promise<void> => {
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      })
      await page.goto(`/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')
      await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)

      await expect(page).toHaveScreenshot(`tasks-tab-${dir}-${viewport.width}.png`, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      })
    })
  }
})
```

**Auth pre-condition** — inherited from `frontend/playwright.config.ts:38` → `tests/e2e/global-setup.ts` (TEST_USER_EMAIL / TEST_USER_PASSWORD). DO NOT override `storageState` per spec (52-RESEARCH Pitfall 8).

---

### `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts` (test, e2e visual)

**Analog:** Same as TasksTab visual spec — `kanban-visual.spec.ts` shape. Different `goto` target.

**Trigger discovery** (52-RESEARCH user_constraints lines 59-60): EngagementKanbanDialog is imported at `frontend/src/pages/dossiers/EngagementDossierPage.tsx:18` and rendered at line 66. Drive headlessly through that page.

**Test pattern** (mirror tasks-tab-visual.spec.ts; only `goto` URL differs):

```typescript
// goto target via EngagementDossierPage trigger (open the kanban dialog from a button click)
await page.goto(`/dossiers/engagements/${SEEDED_ENGAGEMENT_ID}`)
await page.waitForLoadState('networkidle')
// Click the trigger that opens EngagementKanbanDialog — planner confirms selector via
// `rg "EngagementKanbanDialog" frontend/src/pages/dossiers/EngagementDossierPage.tsx`
await page
  .getByRole('button', { name: /kanban|board/i })
  .first()
  .click()
await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)
```

---

### `tools/eslint-fixtures/bad-kibo-ui-import.tsx` (lint regression fixture)

**Analog:** `tools/eslint-fixtures/bad-design-token.tsx` (21 lines) + `tools/eslint-fixtures/bad-vi-mock.ts` (11 lines). Both are in-repo precedents for "fixture file that MUST lint-fail to prove the rule fires".

**Imports + structure pattern** (from bad-design-token.tsx lines 1-20):

```typescript
// Phase 52 regression fixture for ESLint no-restricted-imports widening (D-18).
// `pnpm lint tools/eslint-fixtures/bad-kibo-ui-import.tsx` MUST exit non-zero
// after Phase 52 adds '@/components/kibo-ui/*' to the patterns.group array.
// The fixture deliberately imports from the banned local kibo-ui path.
// See eslint.config.mjs:148 (patterns) and 52-CONTEXT.md D-18.

import { KanbanProvider } from '@/components/kibo-ui/kanban'

void KanbanProvider

export {}
```

**Wire-up pattern in eslint.config.mjs** (the fixture must trigger the rule; verify by running `pnpm lint tools/eslint-fixtures/bad-kibo-ui-import.tsx` — non-zero exit = pass):

```js
// Already wired via the general lint rule — no per-file override needed
// because the patterns.group block fires globally. The fixture sits OUTSIDE
// frontend/src/ so the kibo-ui dir still exists during early steps of D-18
// (deletion happens at step 4 — until then, the kibo-ui module physically
// resolves but the import is banned by ESLint, which is what we want to
// regression-test).
```

**Naming convention** — matches existing fixture file naming: `bad-<rule-name>.<ext>` (compare `bad-design-token.tsx`, `bad-vi-mock.ts`).

---

### `eslint.config.mjs` (modified — config/lint)

**Analog:** self (current file lines 122-165 `no-restricted-imports` block + line 332 carve-out).

**Patterns widening (D-18 step 5)** — current `patterns.group` at lines 148-163; ADD `'@/components/kibo-ui/*'`:

```js
// CURRENT (eslint.config.mjs:148-163):
patterns: [
  {
    group: [
      'aceternity-ui/*',
      '@aceternity/*',
      'kibo-ui/*',
      '@kibo-ui/*',
      '@/components/ui/3d-card',
      '@/components/ui/bento-grid',
      '@/components/ui/floating-navbar',
      '@/components/ui/link-preview',
    ],
    message: 'Banned by CLAUDE.md primitive cascade. ...',
  },
],

// REPLACE WITH (insert '@/components/kibo-ui/*' as the 5th line):
patterns: [
  {
    group: [
      'aceternity-ui/*',
      '@aceternity/*',
      'kibo-ui/*',
      '@kibo-ui/*',
      '@/components/kibo-ui/*',  // NEW Phase 52 D-18 — local kibo-ui ban
      '@/components/ui/3d-card',
      '@/components/ui/bento-grid',
      '@/components/ui/floating-navbar',
      '@/components/ui/link-preview',
    ],
    message: 'Banned by CLAUDE.md primitive cascade. ...',
  },
],
```

**Narrowing comment block deletion (D-18 step 5)** — DELETE lines 122-132 verbatim (the entire multi-line comment explaining why the local kibo-ui path was deferred):

```js
// DELETE these lines (122-132):
// CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom).
// Aceternity and Kibo UI are banned without explicit user request (D-05/D-06).
//
// 48-02 narrowing: minimatch in `patterns.group` performs path-component contains
// matching, which over-matches the LOCAL alias `@/components/kibo-ui/*` (a repo
// primitive co-located under components/, not the upstream npm package). Use `paths`
// for exact-name match on the npm package shape, and reserve `patterns` for the
// scoped-package shape and the explicit local deleted-component paths. Per CLAUDE.md
// the local `kibo-ui` dir is *also* banned in the long run, but the refactor of the
// two existing kibo-ui kanban call sites (TasksTab, EngagementKanbanDialog) exceeds
// 48-02 lint-zero scope and is tracked as a deferred follow-up item in the SUMMARY.

// REPLACE WITH a single-line replacement:
// CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom).
// Aceternity and Kibo UI are banned without explicit user request.
```

**Carve-out deletion (D-18 step 5)** — DELETE line 332 (the `frontend/src/components/**/index.tsx` carve-out for kibo-ui/kanban/index.tsx):

```js
// CURRENT (line 332):
'frontend/src/components/**/index.tsx', // 48-02 scope-expansion: ...

// DELETE this line entirely. (Pitfall 7 verification: first run
// `find frontend/src/components -name "index.tsx" -not -path "*/kibo-ui/*"`
// to confirm no other consumers exist.)
```

---

## Shared Patterns

### Pattern: Token-bound class composition via `cn(...)` helper

**Source:** `frontend/src/lib/utils.ts` (the `cn` helper — already imported by every component in this phase).
**Apply to:** All 5 new `frontend/src/components/kanban/*.tsx` files + the 2 modified consumer files.

**Excerpt** (usage pattern from kibo-ui/kanban/index.tsx line 28 + WorkBoard.tsx imports):

```typescript
import { cn } from '@/lib/utils'

// Usage — combine base tokens with conditional + caller-supplied className:
className={cn(
  'base token classes',
  isOver && 'conditional-token-class',
  className,  // caller override always wins last
)}
```

---

### Pattern: Sensor configuration with activation constraints

**Source:** `frontend/src/pages/WorkBoard/WorkBoard.tsx` lines 132-139 (Phase 39 proven precedent).
**Apply to:** `frontend/src/components/kanban/KanbanProvider.tsx` (CONTEXT D-04).

**Excerpt** (verbatim from WorkBoard.tsx:132-139):

```typescript
const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: { delay: 200, tolerance: 5 },
})
const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
})
const activeSensors = useSensors(mouseSensor, touchSensor, keyboardSensor)
```

---

### Pattern: Design token resolution via Tailwind `@theme` block

**Source:** `frontend/src/index.css` lines 43-118 (Phase 33-06 / 51 token engine).
**Apply to:** Every class used in new kanban primitive files.

**Verified token mappings** (from index.css inspection):

- `bg-muted/30` → `--color-muted: var(--surface)` → `#ffffff @ 30% alpha`
- `bg-muted/50` → same → `#ffffff @ 50% alpha`
- `border-muted` → same token surface for border
- `bg-surface-raised` → `--color-surface-raised: var(--surface-raised)` → `#ffffff`
- `border-line-soft` → `--color-line-soft: var(--line-soft)` → `#efece3`
- `ring-accent` → `--color-accent: var(--accent)` → `oklch(58% 0.14 32)` (terracotta)
- `border-danger/30` → danger family → `oklch(52% 0.18 25) @ 30% alpha`
- `bg-background` → standard shadcn surface mapping
- `bg-secondary` (used by count badges via Badge component) → `--color-secondary: var(--accent-soft)`

**Banned classes** (will trigger `no-restricted-syntax` rule at error severity per eslint.config.mjs:170-220):

- `text-blue-*`, `bg-red-*`, `bg-slate-*`, `bg-amber-*`, `bg-emerald-*`, `text-{slate,zinc,gray,stone}-*` (Tailwind palette literals)
- `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `left-*`, `right-*`, `rounded-l-*`, `rounded-r-*` (physical CSS — must use logical)

---

### Pattern: Bilingual screen-reader announcements via `Announcements` API

**Source:** `frontend/src/components/kibo-ui/kanban/index.tsx` lines 268-291.
**Apply to:** `frontend/src/components/kanban/KanbanProvider.tsx` (preserved verbatim per CONTEXT D-01).

**Excerpt** (lines 268-291):

```typescript
const announcements: Announcements = {
  onDragStart({ active }) {
    const { name, column } = data.find((item) => item.id === active.id) ?? {}
    return `Picked up the card "${name}" from the "${column}" column`
  },
  onDragOver({ active, over }) {
    const { name } = data.find((item) => item.id === active.id) ?? {}
    const newColumn = columns.find((column) => column.id === over?.id)?.name
    return `Dragged the card "${name}" over the "${newColumn}" column`
  },
  onDragEnd({ active, over }) {
    const { name } = data.find((item) => item.id === active.id) ?? {}
    const newColumn = columns.find((column) => column.id === over?.id)?.name
    return `Dropped the card "${name}" into the "${newColumn}" column`
  },
  onDragCancel({ active }) {
    const { name } = data.find((item) => item.id === active.id) ?? {}
    return `Cancelled dragging the card "${name}"`
  },
}
```

Wired via `<DndContext accessibility={{ announcements }}>`.

---

### Pattern: Playwright visual determinism layers

**Source:** `frontend/tests/e2e/kanban-visual.spec.ts` (lines 13-23).
**Apply to:** Both new visual specs (`tasks-tab-visual.spec.ts`, `engagement-kanban-dialog-visual.spec.ts`).

**Excerpt — full determinism stack** (verbatim from kanban-visual.spec.ts):

```typescript
// 1. Pin i18n language BEFORE app boots:
await page.addInitScript((d: string): void => {
  localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
}, dir)

// 2. Set viewport BEFORE navigation:
await page.setViewportSize(viewport)

// 3. Kill animations + transitions via injected stylesheet:
await page.addStyleTag({
  content:
    '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
})

// 4. Navigate:
await page.goto('/some/path')

// 5. Wait for network idle:
await page.waitForLoadState('networkidle')

// 6. Wait for fonts (CRITICAL for AR/Tajawal — Pitfall 6):
await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)

// 7. Snapshot with tolerance:
await expect(page).toHaveScreenshot('name.png', {
  maxDiffPixelRatio: 0.01,
  fullPage: true,
})
```

---

### Pattern: TanStack Query optimistic mutation hook (data consumer)

**Source:** `frontend/src/domains/engagements/hooks/useEngagementKanban.ts` (lines 86-113).
**Apply to:** UNCHANGED in Phase 52. Both consumer files consume the existing hook unchanged. New primitive files are PURELY presentational — they MUST NOT introduce a mutation. Mutation persistence happens at the consumer's `onDragEnd` callback.

**Excerpt — mutation + callback pattern** (lines 86-113 — read-only reference for planner; do NOT modify):

```typescript
const updateStageMutation = useMutation({
  mutationFn: async ({
    assignmentId,
    newStage,
  }: {
    assignmentId: string
    newStage: WorkflowStage
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }
    return engagementsRepo.updateWorkflowStage(assignmentId, newStage, user.id)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['engagement-kanban', engagementId] })
  },
})

const handleDragEnd = useCallback(
  (assignmentId: string, newStage: WorkflowStage) => {
    updateStageMutation.mutate({ assignmentId, newStage })
  },
  [updateStageMutation],
)
```

**Consumer wiring pattern** (TasksTab.tsx lines 100-116 + EngagementKanbanDialog.tsx lines 102-119) — drag-end event validates `over.id` against `WorkflowStage` enum, then calls `handleDragEnd`:

```typescript
const onKanbanDragEnd = useCallback(
  (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over) return
    const assignmentId = active.id as string
    const item = kanbanData.find((a) => a.id === assignmentId)
    if (!item) return
    const validStages: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']
    const newStage = over.id as WorkflowStage
    if (validStages.includes(newStage) && item.column !== newStage) {
      handleDragEnd(assignmentId, newStage)
    }
  },
  [kanbanData, handleDragEnd],
)
```

This validation is the V5 (Input Validation) gate from 52-RESEARCH §"Security Domain" — PRESERVED VERBATIM in both surfaces.

---

### Pattern: RTL detection via `useDirection` hook + `dir` attribute

**Source:** `frontend/src/pages/engagements/workspace/TasksTab.tsx` line 53 + line 150 — uses `useDirection` (not raw `useTranslation`).
**Apply to:** Both consumer files keep this pattern; new kanban primitive files DO NOT set `dir` (the parent wrapper owns it).

**Excerpt** (TasksTab.tsx:53, 150):

```typescript
import { useDirection } from '@/hooks/useDirection'

// In component:
const { isRTL } = useDirection()

// On root wrapper:
<div className="space-y-4 p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
```

The kanban primitive itself iterates `columns.map(...)` in natural order — browser RTL flow flips the visual layout automatically. NO `.reverse()` call (anti-pattern documented in 52-RESEARCH §"Anti-Patterns to Avoid").

---

## No Analog Found

All 14 files have at least a partial in-repo analog. Zero files require RESEARCH.md fallback patterns.

| File   | Status                                         |
| ------ | ---------------------------------------------- |
| (none) | All files mapped to existing in-repo patterns. |

The closest-to-no-analog case is the **DragOverlay-without-tunnel-rat render strategy** (D-02). The native `<DragOverlay>` primitive itself has the in-repo precedent at kibo-ui/kanban/index.tsx:309-311; only the gating/cloning strategy lacks an exact in-repo analog. 52-RESEARCH §"Pattern 1" + §"Pitfall 1" enumerate three options ranked by complexity, with CONTEXT D-02 fallback (keep tunnel-rat) as the escape hatch if all three fail visual parity.

---

## Metadata

**Analog search scope:**

- `frontend/src/components/kibo-ui/kanban/` — the file being replaced (primary analog for all 5 new primitive files)
- `frontend/src/pages/WorkBoard/` — proven in-repo `@dnd-kit/core` direct-use precedent (sensor stack source)
- `frontend/src/pages/WorkBoard/__tests__/` — Vitest unit test pattern for `@dnd-kit/core` boundary mocking
- `frontend/src/pages/engagements/workspace/` — TasksTab consumer
- `frontend/src/components/assignments/` — EngagementKanbanDialog consumer + KanbanTaskCard inner content
- `frontend/src/components/ui/` — Card + ScrollArea token-bound primitives (verified shadcn-compatible re-exports of HeroUICard)
- `frontend/src/domains/engagements/hooks/` — data hook contract (unchanged)
- `frontend/tests/e2e/` — visual + DnD spec patterns (kanban-visual.spec.ts as canonical template)
- `tools/eslint-fixtures/` — lint regression fixture pattern (bad-design-token.tsx, bad-vi-mock.ts)
- `eslint.config.mjs` — patterns block + carve-out structure (lines 122-165, 326-345)
- `frontend/src/index.css` — `@theme` block token resolution (lines 43-118)

**Files scanned:**

- 13 source files read in full or in targeted ranges
- 5 e2e spec files inspected (kanban-visual, kanban-dnd, dashboard-visual + e2e directory enumeration)
- 2 lint fixture files read in full
- 1 lint config file (eslint.config.mjs) read in targeted range (lines 115-345)
- 1 token CSS file (index.css) — grep-only for token name verification

**Pattern extraction date:** 2026-05-16

---

## PATTERN MAPPING COMPLETE
