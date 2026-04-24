import { type ReactElement, type ReactNode } from 'react'

export interface WidgetCardProps {
  titleId: string
  className?: string
  children: ReactNode
}

export function WidgetCard({ titleId, className, children }: WidgetCardProps): ReactElement {
  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className={['rounded-lg border border-line bg-surface-raised p-4', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  )
}
