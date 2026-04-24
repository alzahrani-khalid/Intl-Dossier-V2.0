import { type ReactElement, type ReactNode } from 'react'

export interface WidgetHeaderProps {
  title: string
  titleId: string
  action?: ReactNode
}

export function WidgetHeader({ title, titleId, action }: WidgetHeaderProps): ReactElement {
  return (
    <div className="widget-header flex items-center justify-between mb-3">
      <h3 id={titleId} className="text-sm font-medium text-ink">
        {title}
      </h3>
      {action != null ? <div className="widget-header-action">{action}</div> : null}
    </div>
  )
}
