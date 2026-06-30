/**
 * GastatFocalPointsCard
 *
 * Organization-specific card showing the three GASTAT focal-point officers
 * (responsible / alternate / support) captured on the organization profile.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { UserCheck } from 'lucide-react'
import type { OrganizationFocalPoint } from '@/types/dossier-overview.types'

interface GastatFocalPointsCardProps {
  dossierId: string
}

type FocalRole = 'responsible' | 'alternate' | 'support'

const FOCAL_ROLES: FocalRole[] = ['responsible', 'alternate', 'support']

export function GastatFocalPointsCard({
  dossierId,
}: GastatFocalPointsCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading, isError } = useDossierOverview(dossierId, {
    includeSections: ['organization_profile'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-12" />
          ))}
        </div>
      </div>
    )
  }

  // Error before empty (OVRERR-01): only when no cached data — stale-while-error
  // retains last-good data on a background refetch failure.
  if (isError && data === null) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-base font-semibold leading-tight text-start mb-4">
          {t('overview.focalPoints.title', { defaultValue: 'GASTAT focal points' })}
        </h3>
        <p role="alert" className="text-sm text-[var(--danger)] text-center py-8">
          {t('overview.sectionError', {
            defaultValue: 'Failed to load this section. Check your connection and try again.',
          })}
        </p>
      </div>
    )
  }

  const focalPoints = data?.organization_profile?.focal_points ?? null

  const resolveName = (officer: OrganizationFocalPoint): string =>
    isRTL && officer.name_ar ? officer.name_ar : (officer.name_en ?? officer.name_ar ?? '')

  const officers = FOCAL_ROLES.map((role) => {
    const officer = focalPoints?.[role] ?? null
    if (!officer) return null
    const name = resolveName(officer)
    if (name === '') return null
    return { role, name }
  }).filter((o): o is { role: FocalRole; name: string } => o !== null)

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.focalPoints.title', { defaultValue: 'GASTAT focal points' })}
      </h3>

      {officers.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.focalPoints.empty', { defaultValue: 'No focal points recorded' })}
        </p>
      ) : (
        <div className="space-y-2">
          {officers.map((officer) => (
            <div key={officer.role} className="flex items-center gap-3 rounded-md p-2 min-h-11">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{officer.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t(`overview.focalPoints.${officer.role}`, { defaultValue: officer.role })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
