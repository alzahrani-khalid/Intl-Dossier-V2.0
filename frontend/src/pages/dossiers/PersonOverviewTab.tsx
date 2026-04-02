/**
 * PersonOverviewTab
 *
 * Overview tab for Person dossiers composing shared + person-specific
 * enrichment cards in a responsive grid layout.
 * Cards: SharedSummaryStats, PersonMetadata, EngagementHistory, SharedRecentActivity
 * Per D-10: compact metadata + activity feed pattern.
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { DossierAnalyticsCard } from '@/components/analytics/DossierAnalyticsCard'
import { PersonMetadataCard } from './overview-cards/PersonMetadataCard'
import { EngagementHistoryCard } from './overview-cards/EngagementHistoryCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface PersonOverviewTabProps {
  dossierId: string
}

export function PersonOverviewTab({ dossierId }: PersonOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <DossierAnalyticsCard dossierId={dossierId} dossierType="person" />
      <PersonMetadataCard dossierId={dossierId} />
      <EngagementHistoryCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
