/**
 * PersonMetadataCard
 *
 * Person-specific compact metadata card showing organization affiliation,
 * role/title, last engagement date, and contact info.
 * Per D-10: compact metadata pattern, not elaborate enrichment.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { User, Building2, Briefcase, CalendarCheck } from 'lucide-react'

interface PersonMetadataCardProps {
  dossierId: string
}

interface MetadataRow {
  icon: React.ReactNode
  label: string
  value: string
}

export function PersonMetadataCard({ dossierId }: PersonMetadataCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers', 'calendar_events'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-8" />
          ))}
        </div>
      </div>
    )
  }

  // Extract org affiliation from related dossiers grouped by type
  const relatedOrgs = data?.related_dossiers?.by_dossier_type?.organization ?? []
  const primaryOrg = relatedOrgs[0]

  const lastEvent = data?.calendar_events?.past?.[0]

  const rows: MetadataRow[] = [
    {
      icon: <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.person.organization', { defaultValue: 'Organization' }),
      value: primaryOrg != null
        ? (isRTL ? (primaryOrg.name_ar ?? primaryOrg.name_en) : primaryOrg.name_en)
        : '-',
    },
    {
      icon: <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.person.role', { defaultValue: 'Role / Title' }),
      value: data?.dossier?.description_en ?? '-',
    },
    {
      icon: <CalendarCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.person.lastEngagement', { defaultValue: 'Last Engagement' }),
      value: lastEvent != null
        ? format(new Date(lastEvent.start_datetime), 'PP', { locale: dateLocale })
        : t('overview.person.noEngagement', { defaultValue: 'None recorded' }),
    },
  ]

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <User className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.person.title', { defaultValue: 'Profile' })}
        </h3>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            {row.icon}
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
            </div>
            <span className="text-sm font-medium truncate max-w-[50%] text-end">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
