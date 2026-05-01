/**
 * MiniKpiStrip — Wave 0 stub. Plan 41-03 fills body with 4 KPI cells (engagements,
 * commitments, overdue, documents) computed from DossierOverviewResponse.stats.
 */
import type * as React from 'react'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

export interface MiniKpiStripProps {
  overview?: DossierOverviewResponse | undefined
}

export function MiniKpiStrip(_props: MiniKpiStripProps): React.JSX.Element {
  return (
    <div className="kpi-mini-strip">
      <div className="kpi-mini" data-loading="true" />
      <div className="kpi-mini" data-loading="true" />
      <div className="kpi-mini" data-loading="true" />
      <div className="kpi-mini" data-loading="true" />
    </div>
  )
}
