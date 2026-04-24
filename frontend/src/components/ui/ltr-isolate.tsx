import type { HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LtrIsolateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'dir' | 'children'> {
  children: ReactNode
}

export function LtrIsolate({ children, className, ...rest }: LtrIsolateProps): ReactElement {
  return (
    <div dir="ltr" className={cn(className)} {...rest}>
      {children}
    </div>
  )
}
