/**
 * KeyRepresentativesCard
 *
 * Organization-specific card showing key representatives.
 * Similar to KeyContactsCard but shows role/position within the organization.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@tanstack/react-router'
import { User, ChevronLeft } from 'lucide-react'

interface KeyRepresentativesCardProps {
  dossierId: string
}

const MAX_REPS = 5

export function KeyRepresentativesCard({
  dossierId,
}: KeyRepresentativesCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['key_contacts'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-12" />
          ))}
        </div>
      </div>
    )
  }

  const contacts = data?.key_contacts?.contacts ?? []
  const totalCount = data?.key_contacts?.total_count ?? 0
  const displayContacts = contacts.slice(0, MAX_REPS)
  const hasMore = totalCount > MAX_REPS

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.representatives.title', { defaultValue: 'Key Representatives' })}
      </h3>

      {displayContacts.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.representatives.empty', { defaultValue: 'No representatives linked' })}
        </p>
      ) : (
        <div className="space-y-2">
          {displayContacts.map((contact) => {
            const displayName = isRTL && contact.name_ar ? contact.name_ar : contact.name
            const displayTitle = isRTL && contact.title_ar ? contact.title_ar : contact.title_en
            const displayOrg =
              isRTL && contact.organization_ar ? contact.organization_ar : contact.organization_en

            const content = (
              <div className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors min-h-11">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  {(displayTitle ?? displayOrg) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[displayTitle, displayOrg].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </div>
                <ChevronLeft
                  className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${isRTL ? '' : 'rotate-180'}`}
                />
              </div>
            )

            if (contact.linked_person_dossier_id) {
              return (
                <Link
                  key={contact.id}
                  to="/dossiers/persons/$id"
                  params={{ id: contact.linked_person_dossier_id }}
                  className="block"
                >
                  {content}
                </Link>
              )
            }

            return <div key={contact.id}>{content}</div>
          })}

          {hasMore && (
            <Link
              to="/dossiers/organizations/$id"
              params={{ id: dossierId }}
              search={{ tab: 'contacts' }}
              className="block"
            >
              <button
                type="button"
                className="w-full text-sm text-primary hover:text-primary/80 py-2 min-h-11 transition-colors"
              >
                {t('overview.representatives.viewAll', {
                  count: totalCount,
                  defaultValue: 'View all {{count}} representatives',
                })}
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
