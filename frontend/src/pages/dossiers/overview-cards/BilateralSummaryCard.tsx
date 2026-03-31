/**
 * BilateralSummaryCard
 *
 * Country-specific card showing bilateral relationship overview:
 * diplomatic level, key agreements count, last high-level meeting date.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Handshake, FileSignature, CalendarCheck } from 'lucide-react'

interface BilateralSummaryCardProps {
  dossierId: string
}

export function BilateralSummaryCard({ dossierId }: BilateralSummaryCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers', 'documents', 'calendar_events'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-8" />
          ))}
        </div>
      </div>
    )
  }

  // Extract bilateral relationships
  const bilateralRelations = data?.related_dossiers?.by_relationship_type?.bilateral ?? []
  const mouCount = data?.documents?.mous?.length ?? 0
  const lastMeeting = data?.calendar_events?.past?.[0]

  const items = [
    {
      icon: <Handshake className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.bilateral.partnerships', { defaultValue: 'Bilateral Partners' }),
      value: String(bilateralRelations.length),
    },
    {
      icon: <FileSignature className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.bilateral.agreements', { defaultValue: 'Key Agreements' }),
      value: String(mouCount),
    },
    {
      icon: <CalendarCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.bilateral.lastMeeting', { defaultValue: 'Last Meeting' }),
      value: lastMeeting
        ? format(new Date(lastMeeting.start_datetime), 'PP', {
            locale: isRTL ? ar : enUS,
          })
        : t('overview.bilateral.noMeeting', { defaultValue: 'None recorded' }),
    },
  ]

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.bilateral.title', { defaultValue: 'Bilateral Summary' })}
      </h3>

      {bilateralRelations.length === 0 && mouCount === 0 && !lastMeeting ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.bilateral.empty', { defaultValue: 'No bilateral data available' })}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              {item.icon}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
