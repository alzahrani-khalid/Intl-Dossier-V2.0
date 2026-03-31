/**
 * ForumMetadataCard
 *
 * Forum-specific compact metadata card showing forum type, frequency,
 * host organization, and participant count.
 * Per D-10: metadata card + activity feed, no filler.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, Building2, Users, RefreshCw } from 'lucide-react'

interface ForumMetadataCardProps {
  dossierId: string
}

interface MetadataRow {
  icon: React.ReactNode
  label: string
  value: string
}

export function ForumMetadataCard({ dossierId }: ForumMetadataCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-8" />
          ))}
        </div>
      </div>
    )
  }

  // Extract host from related_to relationships (forums link to host org)
  const relatedOrgs = data?.related_dossiers?.by_dossier_type?.organization ?? []
  const hostOrg = relatedOrgs[0]
  const participantCount = data?.related_dossiers?.total_count ?? 0

  const rows: MetadataRow[] = [
    {
      icon: <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.forum.type', { defaultValue: 'Forum Type' }),
      value: data?.dossier?.description_en ?? '-',
    },
    {
      icon: <RefreshCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.forum.frequency', { defaultValue: 'Frequency' }),
      value: (data?.dossier?.metadata?.frequency as string | undefined) ?? '-',
    },
    {
      icon: <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.forum.host', { defaultValue: 'Host Organization' }),
      value: hostOrg != null
        ? (isRTL ? (hostOrg.name_ar ?? hostOrg.name_en) : hostOrg.name_en)
        : '-',
    },
    {
      icon: <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
      label: t('overview.forum.participants', { defaultValue: 'Participants' }),
      value: String(participantCount),
    },
  ]

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.forum.title', { defaultValue: 'Forum Details' })}
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
