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
import { createContext, useState, type ReactElement, type ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type { DragEndEvent } from '@dnd-kit/core'

export type KanbanItemProps = {
  id: string
  name: string
  column: string
} & Record<string, unknown>

export type KanbanColumnProps = {
  id: string
  name: string
} & Record<string, unknown>

export type KanbanContextProps<
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

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, 'children'> & {
  children: (column: C) => ReactNode
  className?: string
  columns: C[]
  data: T[]
  onDataChange?: (data: T[]) => void
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  onDragOver?: (event: DragOverEvent) => void
}

type DragOverlayCardProps<T extends KanbanItemProps> = {
  item: T
}

function DragOverlayCard<T extends KanbanItemProps>({
  item,
}: DragOverlayCardProps<T>): ReactElement {
  return (
    <Card className="cursor-grab gap-4 rounded-md p-3 ring-2 ring-accent">
      <p className="m-0 font-medium text-sm">{item.name}</p>
    </Card>
  )
}

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  ...props
}: KanbanProviderProps<T, C>): ReactElement => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

  const activeOverlayItem =
    activeCardId === null ? undefined : data.find((item) => item.id === activeCardId)

  const handleDragStart = (event: DragStartEvent): void => {
    const activeId = String(event.active.id)
    const card = data.find((item) => item.id === activeId)

    if (card !== undefined) {
      setActiveCardId(activeId)
    }

    onDragStart?.(event)
  }

  const handleDragOver = (event: DragOverEvent): void => {
    const { active, over } = event

    if (over === null) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeItem = data.find((item) => item.id === activeId)
    const overItem = data.find((item) => item.id === overId)

    if (activeItem === undefined) {
      return
    }

    const activeColumn = activeItem.column
    const overColumn =
      overItem?.column ?? columns.find((col) => col.id === overId)?.id ?? columns[0]?.id

    if (activeColumn !== overColumn) {
      let newData = [...data]
      const activeIndex = newData.findIndex((item) => item.id === activeId)
      const overIndex = newData.findIndex((item) => item.id === overId)

      newData[activeIndex]!.column = overColumn!
      newData = arrayMove(newData, activeIndex, overIndex)

      onDataChange?.(newData)
    }

    onDragOver?.(event)
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveCardId(null)

    onDragEnd?.(event)

    const { active, over } = event

    if (over === null || active.id === over.id) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    let newData = [...data]

    const oldIndex = newData.findIndex((item) => item.id === activeId)
    const newIndex = newData.findIndex((item) => item.id === overId)

    newData = arrayMove(newData, oldIndex, newIndex)

    onDataChange?.(newData)
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === String(active.id)) ?? {}

      return `Picked up the card "${name}" from the "${column}" column`
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === String(active.id)) ?? {}
      const newColumn = columns.find((column) => column.id === String(over?.id))?.name

      return `Dragged the card "${name}" over the "${newColumn}" column`
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === String(active.id)) ?? {}
      const newColumn = columns.find((column) => column.id === String(over?.id))?.name

      return `Dropped the card "${name}" into the "${newColumn}" column`
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === String(active.id)) ?? {}

      return `Cancelled dragging the card "${name}"`
    },
  }

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
        <DragOverlay>
          {activeOverlayItem !== undefined ? <DragOverlayCard item={activeOverlayItem} /> : null}
        </DragOverlay>
      </DndContext>
    </KanbanContext.Provider>
  )
}
