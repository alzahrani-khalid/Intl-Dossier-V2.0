import { type ReactElement, type ReactNode } from 'react'

export interface DashboardGridProps {
  left: ReactNode[]
  right: ReactNode[]
}

export function DashboardGrid({ left, right }: DashboardGridProps): ReactElement {
  return (
    <div className="dash-grid">
      <div className="dash-col dash-col-left">{left}</div>
      <div className="dash-col dash-col-right">{right}</div>
    </div>
  )
}
