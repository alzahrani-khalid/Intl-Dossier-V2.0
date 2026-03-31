/**
 * MembershipStructureCard
 *
 * Organization-specific card showing membership tiers or departments.
 * Displays member dossiers grouped by relationship type.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Users } from 'lucide-react'

interface MembershipStructureCardProps {
  dossierId: string
}

export function MembershipStructureCard({
  dossierId,
}: MembershipStructureCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers'],
  })

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

  const members = data?.related_dossiers?.by_relationship_type?.has_member ?? []
  const memberOf = data?.related_dossiers?.by_relationship_type?.member_of ?? []
  const children = data?.related_dossiers?.by_relationship_type?.child ?? []

  const sections = [
    {
      label: t('overview.membership.members', { defaultValue: 'Members' }),
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      count: members.length,
    },
    {
      label: t('overview.membership.memberOf', { defaultValue: 'Member Of' }),
      icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
      count: memberOf.length,
    },
    {
      label: t('overview.membership.subUnits', { defaultValue: 'Sub-Units' }),
      icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
      count: children.length,
    },
  ].filter((s) => s.count > 0)

  const totalRelated = data?.related_dossiers?.total_count ?? 0

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.membership.title', { defaultValue: 'Membership Structure' })}
      </h3>

      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.membership.empty', { defaultValue: 'No membership data available' })}
        </p>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.label} className="flex items-center gap-3">
              {section.icon}
              <span className="text-sm text-muted-foreground flex-1">{section.label}</span>
              <span className="text-sm font-semibold">{section.count}</span>
            </div>
          ))}
          {totalRelated > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              {t('overview.membership.totalRelated', {
                count: totalRelated,
                defaultValue: '{{count}} total related dossiers',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
