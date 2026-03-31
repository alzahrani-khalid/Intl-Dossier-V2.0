/**
 * ElectedOfficialCommitteesCard
 *
 * Elected-official-specific card showing committee memberships.
 * Reads committee_assignments JSONB from persons table via useElectedOfficial.
 * Bilingual names, role badges, active/inactive status.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useElectedOfficial } from '@/domains/elected-officials/hooks/useElectedOfficials'
import { Skeleton } from '@/components/ui/skeleton'
import { Building } from 'lucide-react'
import type { CommitteeAssignment } from '@/domains/elected-officials/types/elected-official.types'

interface ElectedOfficialCommitteesCardProps {
  dossierId: string
}

export function ElectedOfficialCommitteesCard({
  dossierId,
}: ElectedOfficialCommitteesCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('elected-officials')
  const isRTL = i18n.language === 'ar'

  const { data: official, isLoading } = useElectedOfficial(dossierId)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  const committees: CommitteeAssignment[] = official?.committee_assignments ?? []

  function getRoleBadgeClass(role: CommitteeAssignment['role']): string {
    switch (role) {
      case 'chair':
        return 'bg-primary/10 text-primary'
      case 'vice_chair':
        return 'bg-warning/10 text-warning'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <Building className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('committees.title')}
        </h3>
      </div>

      {committees.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('committees.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {committees.map((committee, index) => (
            <div
              key={`${committee.name_en}-${index}`}
              className={`flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors ${
                !committee.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    !committee.is_active ? 'text-muted-foreground' : ''
                  }`}
                >
                  {isRTL
                    ? (committee.name_ar !== '' ? committee.name_ar : committee.name_en)
                    : committee.name_en}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeClass(committee.role)}`}
                >
                  {t(`committees.roles.${committee.role}`)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    committee.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {committee.is_active
                    ? t('committees.active')
                    : t('committees.inactive')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
