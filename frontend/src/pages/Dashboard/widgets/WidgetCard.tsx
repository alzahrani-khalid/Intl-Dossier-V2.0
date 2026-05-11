import { type ReactElement, type ReactNode } from 'react'

export interface WidgetCardProps {
  titleId: string
  className?: string
  children: ReactNode
}

/**
 * Phase-41 design alignment: uses the canonical `.card` class so direction-
 * specific overrides (e.g. `.dir-bureau .card { border-radius: 12px }`) apply
 * automatically. The previous Tailwind utility build (`rounded-lg p-4`) was
 * hardcoded and didn't respond to direction/density tokens.
 */
export function WidgetCard({ titleId, className, children }: WidgetCardProps): ReactElement {
  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className={['card', className ?? ''].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  )
}
