/**
 * ElectedOfficialOverviewTab
 *
 * Overview tab for Elected Official dossiers composing shared + EO-specific
 * enrichment cards in a responsive grid layout.
 * Cards: SharedSummaryStats, ElectedOfficialOffice, ElectedOfficialCommittees, SharedRecentActivity
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { DossierAnalyticsCard } from '@/components/analytics/DossierAnalyticsCard'
import { ElectedOfficialOfficeCard } from './overview-cards/ElectedOfficialOfficeCard'
import { ElectedOfficialCommitteesCard } from './overview-cards/ElectedOfficialCommitteesCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface ElectedOfficialOverviewTabProps {
  dossierId: string
}

export function ElectedOfficialOverviewTab({
  dossierId,
}: ElectedOfficialOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <DossierAnalyticsCard dossierId={dossierId} dossierType="elected_official" />
      <ElectedOfficialOfficeCard dossierId={dossierId} />
      <ElectedOfficialCommitteesCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
