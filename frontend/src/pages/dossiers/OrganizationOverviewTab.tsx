/**
 * OrganizationOverviewTab
 *
 * Overview tab for Organization dossiers composing shared + org-specific
 * enrichment cards in a responsive grid layout.
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { MembershipStructureCard } from './overview-cards/MembershipStructureCard'
import { KeyRepresentativesCard } from './overview-cards/KeyRepresentativesCard'
import { MoUStatusCard } from './overview-cards/MoUStatusCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface OrganizationOverviewTabProps {
  dossierId: string
}

export function OrganizationOverviewTab({
  dossierId,
}: OrganizationOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <MembershipStructureCard dossierId={dossierId} />
      <KeyRepresentativesCard dossierId={dossierId} />
      <MoUStatusCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
