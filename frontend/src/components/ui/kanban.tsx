'use client'

import type { ReactNode } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type UniqueIdentifier,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { forwardRef, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------------------------------
 * KanbanBoard
 * -----------------------------------------------------------------------------------------------*/

export type KanbanBoardProps<TData extends { id: UniqueIdentifier }> = {
  id: UniqueIdentifier
  children: ReactNode
  data: TData[]
  onDataChange?: (data: TData[]) => void
  className?: string
}

export const KanbanBoard = <TData extends { id: UniqueIdentifier }>({
  children,
  className,
}: KanbanBoardProps<TData>) => {
  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto pb-4',
        'min-h-[400px] sm:min-h-[500px] md:min-h-[600px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * KanbanProvider - Main DnD Context Provider
 * -----------------------------------------------------------------------------------------------*/

export type KanbanColumn<TData> = {
  id: UniqueIdentifier
  title: string
  items: TData[]
}

export type KanbanProviderProps<TData extends { id: UniqueIdentifier }> = {
  children: ReactNode
  columns: KanbanColumn<TData>[]
  onColumnsChange?: (columns: KanbanColumn<TData>[]) => void
  onDragEnd?: (
    itemId: UniqueIdentifier,
    sourceColumnId: UniqueIdentifier,
    targetColumnId: UniqueIdentifier,
  ) => void
  renderOverlay?: (activeItem: TData | null) => ReactNode
}

export const KanbanProvider = <TData extends { id: UniqueIdentifier }>({
  children,
  columns,
  onColumnsChange,
  onDragEnd: onDragEndCallback,
  renderOverlay,
}: KanbanProviderProps<TData>) => {
  const [activeItem, setActiveItem] = useState<TData | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const findColumn = useCallback(
    (id: UniqueIdentifier): KanbanColumn<TData> | undefined => {
      // First check if id is a column
      const column = columns.find((col) => col.id === id)
      if (column) return column

      // If not, find which column contains this item
      return columns.find((col) => col.items.some((item) => item.id === id))
    },
    [columns],
  )

  const findItem = useCallback(
    (id: UniqueIdentifier): TData | undefined => {
      for (const column of columns) {
        const item = column.items.find((item) => item.id === id)
        if (item) return item
      }
      return undefined
    },
    [columns],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const item = findItem(active.id)
      const column = findColumn(active.id)

      setActiveItem(item ?? null)
      setActiveColumnId(column?.id ?? null)
    },
    [findItem, findColumn],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event

      if (!over) return

      const activeId = active.id
      const overId = over.id

      if (activeId === overId) return

      const activeColumn = findColumn(activeId)
      const overColumn = findColumn(overId)

      if (!activeColumn || !overColumn) return

      // Moving to a different column
      if (activeColumn.id !== overColumn.id) {
        const newColumns = columns.map((col) => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              items: col.items.filter((item) => item.id !== activeId),
            }
          }
          if (col.id === overColumn.id) {
            const activeItem = activeColumn.items.find((item) => item.id === activeId)
            if (!activeItem) return col

            // Find where to insert - if over is an item, insert at that position
            const overIndex = col.items.findIndex((item) => item.id === overId)

            if (overIndex === -1) {
              // Dropping on the column itself, add to end
              return {
                ...col,
                items: [...col.items, activeItem],
              }
            }

            // Insert at the over position
            const newItems = [...col.items]
            newItems.splice(overIndex, 0, activeItem)
            return {
              ...col,
              items: newItems,
            }
          }
          return col
        })

        onColumnsChange?.(newColumns)
      }
    },
    [columns, findColumn, onColumnsChange],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over) {
        setActiveItem(null)
        setActiveColumnId(null)
        return
      }

      const activeId = active.id
      const overId = over.id

      const activeColumn = findColumn(activeId)
      const overColumn = findColumn(overId)

      if (!activeColumn || !overColumn) {
        setActiveItem(null)
        setActiveColumnId(null)
        return
      }

      // Reordering within the same column
      if (activeColumn.id === overColumn.id) {
        const oldIndex = activeColumn.items.findIndex((item) => item.id === activeId)
        const newIndex = activeColumn.items.findIndex((item) => item.id === overId)

        if (oldIndex !== newIndex && newIndex !== -1) {
          const newColumns = columns.map((col) => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                items: arrayMove(col.items, oldIndex, newIndex),
              }
            }
            return col
          })
          onColumnsChange?.(newColumns)
        }
      }

      // Notify about the drag end
      if (activeColumnId && overColumn.id !== activeColumnId) {
        onDragEndCallback?.(activeId, activeColumnId, overColumn.id)
      }

      setActiveItem(null)
      setActiveColumnId(null)
    },
    [columns, findColumn, onColumnsChange, onDragEndCallback, activeColumnId],
  )

  const handleDragCancel = useCallback(() => {
    setActiveItem(null)
    setActiveColumnId(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeItem && renderOverlay ? renderOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * KanbanColumn
 * -----------------------------------------------------------------------------------------------*/

export type KanbanColumnProps<TData extends { id: UniqueIdentifier }> = {
  id: UniqueIdentifier
  title: string
  titleAr?: string
  items: TData[]
  children: ReactNode
  className?: string
  headerClassName?: string
  isRTL?: boolean
}

export const KanbanColumn = <TData extends { id: UniqueIdentifier }>({
  id,
  title,
  titleAr,
  items,
  children,
  className,
  headerClassName,
  isRTL = false,
}: KanbanColumnProps<TData>) => {
  const { setNodeRef, isOver } = useSortable({
    id,
    data: {
      type: 'column',
      column: { id, title, items },
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col',
        'w-full sm:w-[300px] sm:min-w-[300px] sm:max-w-[300px]',
        'rounded-lg border bg-card shadow-sm',
        'h-full min-h-[400px] sm:min-h-[500px]',
        isOver && 'ring-2 ring-primary ring-offset-2',
        className,
      )}
    >
      <div className={cn('flex items-center justify-between px-4 py-3 border-b', headerClassName)}>
        <h3 className="text-sm sm:text-base font-semibold">{isRTL && titleAr ? titleAr : title}</h3>
        <span className="text-xs sm:text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">
          {items.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * KanbanCard
 * -----------------------------------------------------------------------------------------------*/

export type KanbanCardProps = {
  id: UniqueIdentifier
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ id, children, className, disabled = false, onClick }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
      disabled,
      data: {
        type: 'card',
      },
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const handleClick = () => {
      if (!isDragging && onClick) {
        onClick()
      }
    }

    return (
      <div
        ref={(node) => {
          setNodeRef(node)
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        style={style}
        className={cn(
          'rounded-lg border bg-card p-3 sm:p-4',
          'cursor-grab active:cursor-grabbing',
          'transition-all hover:shadow-md hover:border-primary/20',
          'min-h-11 min-w-11',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDragging && 'opacity-50 shadow-lg scale-[1.02] z-50',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        onClick={handleClick}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>
    )
  },
)
KanbanCard.displayName = 'KanbanCard'

/* -------------------------------------------------------------------------------------------------
 * KanbanEmpty
 * -----------------------------------------------------------------------------------------------*/

export type KanbanEmptyProps = {
  message?: string
  subMessage?: string
  className?: string
}

export const KanbanEmpty = forwardRef<HTMLDivElement, KanbanEmptyProps>(
  ({ message = 'No items', subMessage, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center',
          'p-4 text-sm text-muted-foreground text-center',
          'rounded-md border-2 border-dashed min-h-[100px]',
          className,
        )}
      >
        <p>{message}</p>
        {subMessage && <p className="text-xs mt-1">{subMessage}</p>}
      </div>
    )
  },
)
KanbanEmpty.displayName = 'KanbanEmpty'
