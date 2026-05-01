/**
 * UpcomingSection — Wave 0 stub. Plan 41-04 fills body with the top calendar_events
 * filtered to upcoming, formatted with formatRelativeTimeShort.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

export interface UpcomingSectionProps {
  overview?: DossierOverviewResponse | undefined
}

export function UpcomingSection(_props: UpcomingSectionProps): React.JSX.Element {
  const { t } = useTranslation('dossier-drawer')
  return (
    <section>
      <h3 className="t-label">{t('section.upcoming')}</h3>
      <div data-loading="true" />
    </section>
  )
}
