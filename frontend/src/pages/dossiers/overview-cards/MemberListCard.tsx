/**
 * MemberListCard
 *
 * Working-group-specific card showing member organizations/persons
 * with their roles. Max 5 members, "View all" link.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

interface MemberListCardProps {
  dossierId: string
}

interface MemberItem {
  id: string
  name: string
  role?: string
}

const MAX_MEMBERS = 5

export function MemberListCard({ dossierId }: MemberListCardProps): React.ReactElement {
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
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  // Extract member relations from related dossiers grouped by type
  const memberDossiers = data?.related_dossiers?.by_relationship_type?.has_member ?? []
  const partnerDossiers = data?.related_dossiers?.by_relationship_type?.partner ?? []
  const allRelated = [...memberDossiers, ...partnerDossiers]
  const members: MemberItem[] = allRelated.map((d) => ({
    id: d.id,
    name: isRTL ? (d.name_ar ?? d.name_en) : d.name_en,
    role: d.relationship_type,
  }))

  const displayMembers = members.slice(0, MAX_MEMBERS)
  const hasMore = members.length > MAX_MEMBERS

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.members.title', { defaultValue: 'Members' })}
        </h3>
      </div>

      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.members.empty', { defaultValue: 'No members linked' })}
        </p>
      ) : (
        <div className="space-y-2">
          {displayMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{member.name}</p>
              </div>
              {member.role != null && (
                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                  {member.role}
                </span>
              )}
            </div>
          ))}
          {hasMore && (
            <p className="text-xs text-primary cursor-pointer hover:underline pt-1">
              {t('overview.members.viewAll', {
                defaultValue: 'View all {{count}} members',
                count: members.length,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
