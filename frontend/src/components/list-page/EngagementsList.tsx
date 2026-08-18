import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GlobeSpinner } from '@/components/signature-visuals'
import { startOfISOWeek } from 'date-fns'
import { getISOWeek } from '@/lib/date/getISOWeek'
import { formatDateTime, formatDayFirst } from '@/lib/format-date'
import { FilterPill } from './FilterPill'
import { ToolbarSearch } from './ToolbarSearch'

export type EngagementRow = {
  id: string
  title_en: string
  title_ar: string
  starts_at: string
  type?: 'meeting' | 'call' | 'travel' | 'event'
  location?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export type EngagementFilter = 'all' | 'meeting' | 'call' | 'travel' | 'event'

export type EngagementsListProps = {
  engagements: EngagementRow[]
  search: string
  onSearchChange: (next: string) => void
  filter: EngagementFilter
  onFilterChange: (next: EngagementFilter) => void
  onEngagementClick?: (e: EngagementRow) => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  isLoading?: boolean
  emptyState?: ReactNode
  showToolbar?: boolean
  visibleProperties?: string[]
}

const FILTERS: ReadonlyArray<{ value: EngagementFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'filter.all' },
  { value: 'meeting', labelKey: 'filter.meeting' },
  // no 'call' pill: no engagement_type maps to 'call', so it always filtered to
  // an empty list; an 'event' pill is gated on the server-side filter contract
  { value: 'travel', labelKey: 'filter.travel' },
] as const

const SkeletonRow = (): ReactNode => (
  <div aria-hidden="true" className="px-4 py-3 border-b border-border animate-pulse">
    <div className="h-4 w-2/3 rounded bg-muted mb-2" />
    <div className="h-3 w-1/3 rounded bg-muted" />
  </div>
)

export function EngagementsList({
  engagements,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onEngagementClick,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  isLoading = false,
  emptyState,
  showToolbar = true,
  visibleProperties,
}: EngagementsListProps): ReactNode {
  const { t, i18n } = useTranslation(['engagements', 'list-pages'])
  const isRTL = i18n.language === 'ar'
  const visible = new Set(visibleProperties ?? ['type', 'status', 'location'])

  const groupedByWeek = useMemo(() => {
    const map = new Map<
      string,
      { key: string; year: number; week: number; weekStart: Date; rows: EngagementRow[] }
    >()
    for (const e of engagements) {
      const w = getISOWeek(e.starts_at)
      const bucket = map.get(w.key) ?? {
        key: w.key,
        year: w.year,
        week: w.week,
        // any date inside the ISO week resolves to the same Monday
        weekStart: startOfISOWeek(new Date(e.starts_at)),
        rows: [],
      }
      bucket.rows.push(e)
      map.set(w.key, bucket)
    }
    // Sort weeks descending (newest first), and rows within each week descending by date.
    return Array.from(map.values())
      .sort((a, b) => (a.year !== b.year ? b.year - a.year : b.week - a.week))
      .map((g) => ({
        ...g,
        rows: [...g.rows].sort((a, b) => (a.starts_at > b.starts_at ? -1 : 1)),
      }))
  }, [engagements])

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {showToolbar ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <ToolbarSearch
            value={search}
            onChange={onSearchChange}
            placeholder={t('search.placeholder', { defaultValue: 'Search engagements…' })}
          />
          <div
            role="group"
            aria-label={t('filter.aria', { defaultValue: 'Filter engagements' })}
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((f) => (
              <FilterPill
                key={f.value}
                active={filter === f.value}
                label={t(f.labelKey, { ns: 'engagements', defaultValue: f.value })}
                onClick={(): void => onFilterChange(f.value)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Body */}
      {isLoading ? (
        <div
          data-testid="engagements-list-skeleton"
          role="status"
          aria-label={t('loading', { ns: 'list-pages' })}
        >
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : engagements.length === 0 ? (
        <>
          {emptyState ?? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              {t('empty', { ns: 'list-pages' })}
            </div>
          )}
        </>
      ) : (
        <div role="list">
          {groupedByWeek.map((group) => (
            <section
              key={group.key}
              aria-label={t('week.of') + ' ' + formatDayFirst(group.weekStart)}
            >
              <h3 className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground bg-muted/30">
                {t('week.of')} {formatDayFirst(group.weekStart)}
              </h3>
              {group.rows.map((row) => {
                const title = isRTL ? row.title_ar : row.title_en
                const ariaLabel = t('row.openAria', {
                  defaultValue: 'Open engagement: {{title}}',
                  title,
                })
                return (
                  <button
                    key={row.id}
                    type="button"
                    role="listitem"
                    data-testid="engagement-row"
                    data-engagement-row={row.id}
                    aria-label={ariaLabel}
                    onClick={onEngagementClick ? (): void => onEngagementClick(row) : undefined}
                    className="w-full text-start min-h-11 px-4 py-3 border-b border-border transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-0"
                  >
                    <div className="font-medium truncate min-w-0">{title}</div>
                    <div className="text-sm text-muted-foreground truncate min-w-0">
                      {[
                        formatDateTime(row.starts_at),
                        visible.has('type') && row.type !== undefined
                          ? t(`filter.${row.type}`)
                          : undefined,
                        visible.has('status') && row.status !== undefined
                          ? t(`statuses.${row.status}`)
                          : undefined,
                        visible.has('location') ? row.location : undefined,
                      ]
                        .filter((value): value is string => value !== undefined && value !== '')
                        .join(' · ')}
                    </div>
                  </button>
                )
              })}
            </section>
          ))}

          {/* Load-more row */}
          {hasNextPage ? (
            <div className="flex justify-center px-4 py-4">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                aria-busy={isFetchingNextPage}
                className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm transition-colors"
              >
                {isFetchingNextPage ? (
                  <>
                    <GlobeSpinner
                      size={16}
                      aria-label={t('loadMore.loading', { defaultValue: 'Loading…' })}
                    />
                    <span>{t('loadMore.loading', { defaultValue: 'Loading…' })}</span>
                  </>
                ) : (
                  <span>{t('loadMore.cta', { defaultValue: 'Load more' })}</span>
                )}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
