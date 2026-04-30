import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface GenericListPageItem {
  id: string
  primary: string
  secondary?: string
  statusLabel?: string
  statusChipClass?: string
  icon?: ReactNode
}

export interface GenericListPageProps {
  items: GenericListPageItem[]
  onItemClick?: (item: GenericListPageItem) => void
  isLoading?: boolean
  emptyState?: ReactNode
}

const RowSkeleton = (): ReactNode => (
  <div
    className="grid items-center gap-3 rounded-[var(--radius-sm)] bg-muted px-3.5 py-3.5 animate-pulse"
    style={{ gridTemplateColumns: 'auto 1fr auto auto', minHeight: 44 }}
    data-testid="generic-list-page-skeleton-row"
  >
    <div className="size-8 rounded-full bg-muted-foreground/20" />
    <div className="flex flex-col gap-1.5">
      <div className="h-3.5 w-1/2 rounded bg-muted-foreground/20" />
      <div className="h-3 w-1/3 rounded bg-muted-foreground/15" />
    </div>
    <div className="h-5 w-16 rounded-full bg-muted-foreground/15" />
    <div className="size-4 rounded bg-muted-foreground/15" />
  </div>
)

export function GenericListPage({
  items,
  onItemClick,
  isLoading = false,
  emptyState,
}: GenericListPageProps): ReactNode {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" data-testid="generic-list-page-skeleton">
        {Array.from({ length: 6 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <>{emptyState ?? null}</>
  }

  return (
    <ul className="flex flex-col gap-1.5" role="list" data-testid="generic-list-page">
      {items.map((item) => {
        const interactive = typeof onItemClick === 'function'
        return (
          <li key={item.id}>
            <div
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? (): void => onItemClick(item) : undefined}
              onKeyDown={
                interactive
                  ? (e): void => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onItemClick(item)
                      }
                    }
                  : undefined
              }
              className={[
                'grid items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-card px-3.5 py-3.5',
                'transition-colors',
                interactive
                  ? 'cursor-pointer hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-ring'
                  : '',
              ].join(' ')}
              style={{ gridTemplateColumns: 'auto 1fr auto auto', minHeight: 44 }}
              data-testid="generic-list-page-row"
            >
              <div
                className="flex items-center justify-center size-11 shrink-0 text-muted-foreground"
                aria-hidden={item.icon === undefined ? 'true' : undefined}
              >
                {item.icon ?? null}
              </div>

              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium text-foreground text-start truncate w-full">
                  {item.primary}
                </span>
                {item.secondary !== undefined && item.secondary !== '' ? (
                  <span className="text-xs text-muted-foreground text-start truncate w-full">
                    {item.secondary}
                  </span>
                ) : null}
              </div>

              {item.statusLabel !== undefined && item.statusLabel !== '' ? (
                <span
                  className={[
                    'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium',
                    item.statusChipClass ?? 'chip-default',
                  ].join(' ')}
                  data-testid="generic-list-page-status"
                >
                  {item.statusLabel}
                </span>
              ) : (
                <span aria-hidden="true" />
              )}

              <ChevronRight
                data-testid="row-chevron"
                className="size-4 text-muted-foreground shrink-0"
                style={isRTL ? { transform: 'scaleX(-1)' } : undefined}
                aria-hidden="true"
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
