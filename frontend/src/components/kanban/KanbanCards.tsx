'use client'

import { SortableContext } from '@dnd-kit/sortable'
import { useContext, type HTMLAttributes, type ReactElement, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { KanbanContext, type KanbanContextProps, type KanbanItemProps } from './KanbanProvider'

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
  id,
  ...props
}: KanbanCardsProps<T>): ReactElement => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>
  const filteredData = data.filter((item) => item.column === id)
  const items = filteredData.map((item) => item.id)

  // Plain div instead of Radix ScrollArea. ScrollArea's Viewport renders a
  // `display: table` wrapper with `min-width: 100%`, which lets card content
  // expand horizontally past the column boundary at narrow viewports (Phase
  // 52 Plan 05 finding). A plain overflow-y-auto + overflow-x-hidden gives
  // vertical-only scroll with proper width constraint.
  return (
    <div className="w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden">
      <SortableContext items={items}>
        <div
          className={cn('flex flex-grow flex-col gap-2 p-2 w-full min-w-0 max-w-full', className)}
          id={id}
          {...props}
        >
          {filteredData.map(children)}
        </div>
      </SortableContext>
    </div>
  )
}
