'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useContext, type CSSProperties, type ReactElement, type ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { KanbanContext, type KanbanContextProps, type KanbanItemProps } from './KanbanProvider'

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode
  className?: string
}

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
}: KanbanCardProps<T>): ReactElement => {
  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id,
  })
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps<T>
  const isActiveDragCard = activeCardId === id

  const style: CSSProperties = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  return (
    <div
      data-active-drag-card={isActiveDragCard ? 'true' : undefined}
      data-card-id={id}
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0"
      {...listeners}
      {...attributes}
    >
      <Card
        className={cn(
          'w-full min-w-0 overflow-hidden cursor-grab gap-2 rounded-md p-3 transition-all hover:bg-surface-raised hover:border-line-soft',
          isDragging && 'pointer-events-none cursor-grabbing opacity-30',
          className,
        )}
      >
        {children ?? <p className="m-0 truncate font-medium text-sm">{name}</p>}
      </Card>
    </div>
  )
}
