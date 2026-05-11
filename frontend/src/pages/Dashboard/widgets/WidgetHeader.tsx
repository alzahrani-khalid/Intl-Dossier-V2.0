import { type ReactElement, type ReactNode } from 'react'

export interface WidgetHeaderProps {
  title: string
  titleId: string
  subtitle?: string
  action?: ReactNode
}

/**
 * Phase-41 design alignment: uses canonical `.card-head` + `.card-title` so
 * direction-specific typography (Inter 16/600 in bureau, Fraunces 18/500 in
 * chancery, mono 11/600 uppercase in situation) applies via app.css overrides.
 * Optional `subtitle` renders the design's `.card-sub` line below the title.
 */
export function WidgetHeader({
  title,
  titleId,
  subtitle,
  action,
}: WidgetHeaderProps): ReactElement {
  return (
    <div className="card-head">
      <div className="min-w-0">
        <h3 id={titleId} className="card-title">
          {title}
        </h3>
        {subtitle != null && subtitle !== '' && <div className="card-sub">{subtitle}</div>}
      </div>
      {action != null && <div className="widget-header-action">{action}</div>}
    </div>
  )
}
