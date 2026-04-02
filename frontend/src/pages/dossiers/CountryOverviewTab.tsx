/**
 * CountryOverviewTab
 *
 * Overview tab for Country dossiers composing shared + country-specific
 * enrichment cards in a responsive grid layout.
 * Mobile-first (single column), 2 columns on md+.
 * RTL-compatible with logical properties.
 */

import { useTranslation } from 'react-i18next'
import { SharedSummaryStatsCard } from './overview-cards/SharedSummaryStatsCard'
import { DossierAnalyticsCard } from '@/components/analytics/DossierAnalyticsCard'
import { BilateralSummaryCard } from './overview-cards/BilateralSummaryCard'
import { KeyContactsCard } from './overview-cards/KeyContactsCard'
import { EngagementsByStageCard } from './overview-cards/EngagementsByStageCard'
import { SharedRecentActivityCard } from './overview-cards/SharedRecentActivityCard'

interface CountryOverviewTabProps {
  dossierId: string
}

export function CountryOverviewTab({ dossierId }: CountryOverviewTabProps): React.ReactElement {
  const { i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SharedSummaryStatsCard dossierId={dossierId} />
      <DossierAnalyticsCard dossierId={dossierId} dossierType="country" />
      <BilateralSummaryCard dossierId={dossierId} />
      <KeyContactsCard dossierId={dossierId} />
      <EngagementsByStageCard dossierId={dossierId} />
      <SharedRecentActivityCard dossierId={dossierId} />
    </div>
  )
}
