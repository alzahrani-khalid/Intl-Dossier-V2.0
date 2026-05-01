/**
 * SummarySection — Wave 0 stub. Plan 41-03 fills body with description sentence
 * cap + active-dossier fallback + last-touched line.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { Dossier } from '@/lib/dossier-type-guards'

export interface SummarySectionProps {
  dossier?: Dossier | undefined
}

export function SummarySection(_props: SummarySectionProps): React.JSX.Element {
  const { t } = useTranslation('dossier-drawer')
  return (
    <section>
      <h3 className="t-label">{t('section.summary')}</h3>
      <p data-loading="true">&nbsp;</p>
    </section>
  )
}
