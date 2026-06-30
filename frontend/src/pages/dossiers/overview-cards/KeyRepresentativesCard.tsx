/**
 * KeyRepresentativesCard
 *
 * Organization-specific card showing the people affiliated with this
 * organization (persons whose `organization_id` is this org dossier), plus an
 * affordance to add a new pre-linked contact. Mobile-first, RTL-compatible.
 *
 * Reads `usePersons({ organization_id })` directly rather than the dossier-overview
 * `key_contacts` section, which is populated from a different (representation)
 * source and stayed empty for org dossiers even when contacts were affiliated.
 */

import { useTranslation } from 'react-i18next'
import { usePersons } from '@/domains/persons/hooks/usePersons'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@tanstack/react-router'
import { User, ChevronLeft, Plus } from 'lucide-react'

interface KeyRepresentativesCardProps {
  dossierId: string
}

const MAX_REPS = 5

export function KeyRepresentativesCard({
  dossierId,
}: KeyRepresentativesCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading, isError } = usePersons(
    { organization_id: dossierId, limit: MAX_REPS },
    { staleTime: 30_000 },
  )

  const title = t('overview.representatives.title', { defaultValue: 'Key Representatives' })
  const addLabel = t('overview.representatives.add', { defaultValue: 'Add representative' })

  const AddLink = (): React.ReactElement => (
    <Link
      to="/persons/create"
      search={{ organization_id: dossierId }}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline min-h-11 px-1"
      aria-label={addLabel}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span>{addLabel}</span>
    </Link>
  )

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

  // Error before empty (OVRERR-01): only when no cached data — stale-while-error
  // retains last-good data on a background refetch failure.
  if (isError && data == null) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-base font-semibold leading-tight text-start mb-4">{title}</h3>
        <p role="alert" className="text-sm text-[var(--danger)] text-center py-8">
          {t('overview.sectionError', {
            defaultValue: 'Failed to load this section. Check your connection and try again.',
          })}
        </p>
      </div>
    )
  }

  const reps = data?.data ?? []
  const hasMore = data?.pagination?.has_more ?? false

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-base font-semibold leading-tight text-start">{title}</h3>
        <AddLink />
      </div>

      {reps.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.representatives.empty', { defaultValue: 'No representatives linked' })}
        </p>
      ) : (
        <div className="space-y-2">
          {reps.map((rep) => {
            const displayName = isRTL && rep.name_ar ? rep.name_ar : rep.name_en
            const displayTitle = isRTL && rep.title_ar ? rep.title_ar : rep.title_en
            const displayOrg = rep.organization_name

            return (
              <Link
                key={rep.id}
                to="/dossiers/persons/$id"
                params={{ id: rep.id }}
                className="block"
              >
                <div className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors min-h-11">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    {rep.photo_url ? (
                      <img
                        src={rep.photo_url}
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
              </Link>
            )
          })}

          {hasMore && (
            <p className="w-full text-sm text-muted-foreground py-2 text-start">
              {t('overview.representatives.more', {
                count: MAX_REPS,
                defaultValue: 'Showing first {{count}}',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
