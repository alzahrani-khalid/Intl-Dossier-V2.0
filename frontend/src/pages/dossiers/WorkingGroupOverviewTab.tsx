/**
 * WorkingGroupOverviewTab
 *
 * Overview tab for Working Group dossiers composing shared + WG-specific
 * enrichment cards in a responsive grid layout.
 * Cards: SharedSummaryStats, MemberList, MeetingSchedule, DeliverablesTracker, SharedRecentActivity
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { DossierAnalyticsCard } from '@/components/analytics/DossierAnalyticsCard'
import { MemberListCard } from './overview-cards/MemberListCard'
import { MeetingScheduleCard } from './overview-cards/MeetingScheduleCard'
import { DeliverablesTrackerCard } from './overview-cards/DeliverablesTrackerCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface WorkingGroupOverviewTabProps {
  dossierId: string
}

export function WorkingGroupOverviewTab({
  dossierId,
}: WorkingGroupOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <DossierAnalyticsCard dossierId={dossierId} dossierType="working_group" />
      <MemberListCard dossierId={dossierId} />
      <MeetingScheduleCard dossierId={dossierId} />
      <DeliverablesTrackerCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
