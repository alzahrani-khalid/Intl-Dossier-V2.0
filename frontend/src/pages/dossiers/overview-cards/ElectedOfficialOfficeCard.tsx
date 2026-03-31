/**
 * ElectedOfficialOfficeCard
 *
 * Elected-official-specific card showing office/term information.
 * Data comes from persons table fields via useElectedOfficial hook.
 * Bilingual names, term status badge per UI-SPEC.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useElectedOfficial } from '@/domains/elected-officials/hooks/useElectedOfficials'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Landmark } from 'lucide-react'

interface ElectedOfficialOfficeCardProps {
  dossierId: string
}

export function ElectedOfficialOfficeCard({
  dossierId,
}: ElectedOfficialOfficeCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('elected-officials')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data: official, isLoading } = useElectedOfficial(dossierId)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-8" />
          ))}
        </div>
      </div>
    )
  }

  const officeName = isRTL
    ? (official?.office_name_ar ?? official?.office_name_en ?? '-')
    : (official?.office_name_en ?? '-')
  const partyName = isRTL
    ? (official?.party_ar ?? official?.party_en ?? '-')
    : (official?.party_en ?? '-')
  const districtName = isRTL
    ? (official?.district_ar ?? official?.district_en ?? '-')
    : (official?.district_en ?? '-')

  const formatDate = (dateStr: string | null | undefined): string => {
    if (dateStr == null || dateStr === '') return '-'
    try {
      return format(new Date(dateStr), 'PP', { locale: dateLocale })
    } catch {
      return dateStr
    }
  }

  const rows = [
    { label: t('columns.office'), value: officeName },
    {
      label: t('columns.officeType'),
      value: official?.office_type != null
        ? t(`officeTypes.${official.office_type}`)
        : '-',
    },
    {
      label: t('columns.party'),
      value: official?.party_abbreviation != null
        ? `${partyName} (${official.party_abbreviation})`
        : partyName,
    },
    { label: t('columns.district'), value: districtName },
    { label: 'Term Start', value: formatDate(official?.term_start) },
    { label: 'Term End', value: formatDate(official?.term_end) },
  ]

  // Filter out empty rows
  const displayRows = rows.filter((r) => r.value !== '-')

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold leading-tight text-start">
            {t('detail.officeInfo')}
          </h3>
        </div>
        {/* Term status badge */}
        {official != null && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              official.is_current_term === true
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {official.is_current_term === true
              ? t('termStatus.current')
              : t('termStatus.expired')}
          </span>
        )}
      </div>

      {displayRows.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('list.empty', { defaultValue: 'No office data available' })}
        </p>
      ) : (
        <dl className="space-y-3">
          {displayRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <dt className="text-sm text-muted-foreground flex-1 min-w-0">
                {row.label}
              </dt>
              <dd className="text-sm font-medium truncate max-w-[50%] text-end">
                {row.value}
              </dd>
            </div>
          ))}
          {official?.term_number != null && (
            <div className="flex items-center gap-3">
              <dt className="text-sm text-muted-foreground flex-1 min-w-0">
                Term Number
              </dt>
              <dd className="text-sm font-medium text-end">
                {official.term_number}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
