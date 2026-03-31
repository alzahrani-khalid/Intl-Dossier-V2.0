/**
 * ForumOverviewTab
 *
 * Overview tab for Forum dossiers composing shared + forum-specific
 * enrichment cards in a responsive grid layout.
 * Cards: SharedSummaryStats, ForumMetadata, ForumSessions, SharedRecentActivity
 * Per D-10: compact metadata + activity feed, no filler.
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { ForumMetadataCard } from './overview-cards/ForumMetadataCard'
import { ForumSessionsCard } from './overview-cards/ForumSessionsCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface ForumOverviewTabProps {
  dossierId: string
}

export function ForumOverviewTab({ dossierId }: ForumOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <ForumMetadataCard dossierId={dossierId} />
      <ForumSessionsCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
