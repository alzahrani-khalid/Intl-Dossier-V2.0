/**
 * OpenCommitmentsSection — Wave 0 stub. Plan 41-05 fills body with overview.work_items
 * filtered to commitment source / open status.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

export interface OpenCommitmentsSectionProps {
  overview?: DossierOverviewResponse | undefined
}

export function OpenCommitmentsSection(_props: OpenCommitmentsSectionProps): React.JSX.Element {
  const { t } = useTranslation('dossier-drawer')
  return (
    <section>
      <h3 className="t-label">{t('section.open_commitments')}</h3>
      <div data-loading="true" />
    </section>
  )
}
