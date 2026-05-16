'use client'

import type { HTMLAttributes, ReactElement } from 'react'

import { cn } from '@/lib/utils'

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps): ReactElement => (
  <div className={cn('m-0 p-2 font-semibold text-sm', className)} {...props} />
)
