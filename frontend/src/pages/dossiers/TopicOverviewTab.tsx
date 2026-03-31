/**
 * TopicOverviewTab
 *
 * Overview tab for Topic dossiers composing shared + topic-specific
 * enrichment cards in a responsive grid layout.
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { ConnectedAnchorsCard } from './overview-cards/ConnectedAnchorsCard'
import { PositionTrackerCard } from './overview-cards/PositionTrackerCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface TopicOverviewTabProps {
  dossierId: string
}

export function TopicOverviewTab({ dossierId }: TopicOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <ConnectedAnchorsCard dossierId={dossierId} />
      <PositionTrackerCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
