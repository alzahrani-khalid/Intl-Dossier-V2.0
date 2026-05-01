/**
 * MiniKpiStrip — verbatim port of handoff app.css#L298-302 + pages.jsx kpi-mini-strip.
 *
 * D-04 KPI mapping (LOCKED — see 41-CONTEXT.md, 41-RESEARCH.md §2):
 *   engagements → stats.calendar_events_count
 *   commitments → work_items.by_source.commitments.length
 *   overdue     → stats.overdue_work_items
 *   documents   → stats.documents_count
 *
 * Numeric values pass through toArDigits and are wrapped in LtrIsolate so that
 * digits stay LTR inside the RTL drawer column.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { LtrIsolate } from '@/components/ui/ltr-isolate'

export interface MiniKpiStripProps {
  overview?: DossierOverviewResponse | undefined
}

type KpiKey = 'engagements' | 'commitments' | 'overdue' | 'documents'

export function MiniKpiStrip({ overview }: MiniKpiStripProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language

  const engagements = overview?.stats.calendar_events_count ?? 0
  const commitments = overview?.work_items.by_source.commitments?.length ?? 0
  const overdue = overview?.stats.overdue_work_items ?? 0
  const documents = overview?.stats.documents_count ?? 0

  const cells: ReadonlyArray<{ key: KpiKey; val: number }> = [
    { key: 'engagements', val: engagements },
    { key: 'commitments', val: commitments },
    { key: 'overdue', val: overdue },
    { key: 'documents', val: documents },
  ]

  return (
    <div className="kpi-mini-strip" data-testid="dossier-drawer-kpi-strip">
      {cells.map((c) => (
        <div key={c.key} className="kpi-mini">
          <span className="kpi-mini-val">
            <LtrIsolate>{toArDigits(c.val, lang)}</LtrIsolate>
          </span>
          <span className="kpi-mini-label">{t(`kpi.${c.key}`)}</span>
        </div>
      ))}
    </div>
  )
}
