/**
 * RecentActivitySection — Wave 0 stub. Plan 41-04 fills body with the top-4 fixed
 * slice of overview.activity_timeline.activities (D-03: no infinite scroll).
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

export interface RecentActivitySectionProps {
  overview?: DossierOverviewResponse | undefined
}

export function RecentActivitySection(_props: RecentActivitySectionProps): React.JSX.Element {
  const { t } = useTranslation('dossier-drawer')
  return (
    <section>
      <h3 className="t-label">{t('section.recent_activity')}</h3>
      <div data-loading="true" />
    </section>
  )
}
