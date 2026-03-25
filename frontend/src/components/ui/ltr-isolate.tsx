import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LtrIsolateProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function LtrIsolate({ children, className, style }: LtrIsolateProps): ReactElement {
  return (
    <div dir="ltr" className={cn(className)} style={style}>
      {children}
    </div>
  )
}
