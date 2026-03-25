import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LtrIsolateProps {
  children: ReactNode
  className?: string
}

export function LtrIsolate({ children, className }: LtrIsolateProps): ReactElement {
  return (
    <div dir="ltr" className={cn(className)}>
      {children}
    </div>
  )
}
