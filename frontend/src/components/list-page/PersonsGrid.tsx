import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type PersonCard = {
  id: string
  name_en: string
  name_ar: string
  role?: string
  organization?: string
  is_vip: boolean
}

export type PersonsGridProps = {
  persons: PersonCard[]
  onPersonClick?: (person: PersonCard) => void
  isLoading?: boolean
  emptyState?: ReactNode
}

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

const SkeletonCard = (): ReactNode => (
  <div
    aria-hidden="true"
    className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card animate-pulse"
  >
    <div className="size-11 rounded-full bg-muted" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  </div>
)

export function PersonsGrid({
  persons,
  onPersonClick,
  isLoading = false,
  emptyState,
}: PersonsGridProps): ReactNode {
  const { t, i18n } = useTranslation(['persons', 'list-pages'])
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div
        data-testid="persons-grid-skeleton"
        role="status"
        aria-label={t('loading', { ns: 'list-pages' })}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (persons.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            {t('empty', { ns: 'list-pages' })}
          </div>
        )}
      </>
    )
  }

  return (
    <div role="list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-0">
      {persons.map((person) => {
        const displayName = isRTL ? person.name_ar : person.name_en
        return (
          <button
            key={person.id}
            type="button"
            role="listitem"
            onClick={onPersonClick ? (): void => onPersonClick(person) : undefined}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card text-start min-h-11 transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-0"
          >
            <span
              aria-hidden="true"
              className="size-11 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center font-semibold text-sm shrink-0"
            >
              {initials(displayName)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-medium truncate">{displayName}</span>
                {person.is_vip ? (
                  <span className="chip chip-warn shrink-0" data-testid="vip-chip">
                    {t('chip.vip', { ns: 'persons', defaultValue: 'VIP' })}
                  </span>
                ) : null}
              </span>
              {(person.role !== undefined && person.role !== '') ||
              (person.organization !== undefined && person.organization !== '') ? (
                <span className="block text-sm text-muted-foreground truncate">
                  {[person.role, person.organization]
                    .filter((v): v is string => v !== undefined && v !== '')
                    .join(' · ')}
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
