'use client'

import { useDroppable } from '@dnd-kit/core'
import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type KanbanBoardProps = {
  id: string
  children: ReactNode
  className?: string
  isCancelled?: boolean
}

export const KanbanBoard = ({
  id,
  children,
  className,
  isCancelled,
}: KanbanBoardProps): ReactElement => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      className={cn(
        'flex size-full min-h-40 flex-col divide-y overflow-hidden rounded-md border bg-muted/30 border-muted text-xs ring-2 transition-all',
        isOver ? 'ring-accent' : 'ring-transparent',
        isCancelled === true && 'border-danger/30',
        className,
      )}
      data-droppable-id={id}
      ref={setNodeRef}
    >
      {children}
    </div>
  )
}
