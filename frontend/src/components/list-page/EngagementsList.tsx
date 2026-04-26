import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GlobeSpinner } from '@/components/signature-visuals'
import { getISOWeek } from '@/lib/date/getISOWeek'
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
}

const FILTERS: ReadonlyArray<{ value: EngagementFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'engagements.filter.all' },
  { value: 'meeting', labelKey: 'engagements.filter.meeting' },
  { value: 'call', labelKey: 'engagements.filter.call' },
  { value: 'travel', labelKey: 'engagements.filter.travel' },
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
}: EngagementsListProps): ReactNode {
  const { t, i18n } = useTranslation(['engagements', 'list-pages'])
  const isRTL = i18n.language === 'ar'

  const groupedByWeek = useMemo(() => {
    const map = new Map<
      string,
      { key: string; year: number; week: number; rows: EngagementRow[] }
    >()
    for (const e of engagements) {
      const w = getISOWeek(e.starts_at)
      const bucket = map.get(w.key) ?? { key: w.key, year: w.year, week: w.week, rows: [] }
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
      {/* Toolbar: search + filter pills */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <ToolbarSearch
          value={search}
          onChange={onSearchChange}
          placeholder={t('engagements.search.placeholder', { defaultValue: 'Search engagements…' })}
        />
        <div
          role="group"
          aria-label={t('engagements.filter.aria', { defaultValue: 'Filter engagements' })}
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
              aria-label={t('engagements.week.of', { defaultValue: 'Week of' }) + ' ' + group.key}
            >
              <h3 className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground bg-muted/30">
                {t('engagements.week.of', { defaultValue: 'Week of' })} {group.key}
              </h3>
              {group.rows.map((row) => {
                const title = isRTL ? row.title_ar : row.title_en
                const ariaLabel = t('engagements.row.openAria', {
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
                      {new Date(row.starts_at).toLocaleString(
                        i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                        {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        },
                      )}
                      {row.location !== undefined && row.location !== ''
                        ? ` · ${row.location}`
                        : ''}
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
                      aria-label={t('engagements.loadMore.loading', { defaultValue: 'Loading…' })}
                    />
                    <span>{t('engagements.loadMore.loading', { defaultValue: 'Loading…' })}</span>
                  </>
                ) : (
                  <span>{t('engagements.loadMore.cta', { defaultValue: 'Load more' })}</span>
                )}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
