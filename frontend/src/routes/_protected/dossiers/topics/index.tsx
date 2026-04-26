/**
 * Topics List Page (Phase 40 LIST-03)
 *
 * Replaces legacy implementation per .planning/phases/40-list-pages/40-CONTEXT.md.
 * Renders GenericListPage inside ListPageShell with useTopics adapter.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { ListPageShell, GenericListPage, ToolbarSearch } from '@/components/list-page'
import type { GenericListPageItem } from '@/components/list-page'
import { useTopics } from '@/hooks/useTopics'
import { useDirection } from '@/hooks/useDirection'

interface DossierListSearch {
  page: number
  search?: string
}

const TOPIC_STATUS_CHIP: Record<string, string> = {
  active: 'chip-ok',
  archived: 'chip-info',
  draft: 'chip-warn',
}

export const Route = createFileRoute('/_protected/dossiers/topics/')({
  component: TopicsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

export function TopicsListPage(): JSX.Element {
  const { t } = useTranslation(['topics', 'list-pages'])
  const { isRTL } = useDirection()
  const { page, search } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useTopics({ page, limit: 20, search })

  const items: GenericListPageItem[] = useMemo(() => {
    const raw: unknown = query.data
    let list: Array<Record<string, unknown>> = []
    if (Array.isArray(raw)) {
      list = raw as Array<Record<string, unknown>>
    } else if (
      raw !== null &&
      raw !== undefined &&
      typeof raw === 'object' &&
      'items' in raw &&
      Array.isArray((raw as { items?: unknown[] }).items)
    ) {
      list = (raw as { items: Array<Record<string, unknown>> }).items
    } else if (
      raw !== null &&
      raw !== undefined &&
      typeof raw === 'object' &&
      'data' in raw &&
      Array.isArray((raw as { data?: unknown[] }).data)
    ) {
      list = (raw as { data: Array<Record<string, unknown>> }).data
    }

    return list.map((row) => {
      const status = typeof row.status === 'string' ? row.status : 'active'
      const statusChipClass = TOPIC_STATUS_CHIP[status] ?? 'chip-info'
      const nameEn = typeof row.name_en === 'string' ? row.name_en : ''
      const nameAr = typeof row.name_ar === 'string' ? row.name_ar : ''
      const primary = isRTL && nameAr.length > 0 ? nameAr : nameEn
      const updated =
        typeof row.updated_at === 'string'
          ? new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(row.updated_at))
          : undefined
      return {
        id: String(row.id),
        primary,
        secondary: updated,
        statusLabel: t(`topics:status.${status}`, { defaultValue: status }),
        statusChipClass,
        icon: <BookOpen className="size-5" aria-hidden="true" />,
      }
    })
  }, [query.data, isRTL, t])

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: DossierListSearch) => ({
          ...prev,
          search: next.length > 0 ? next : undefined,
          page: 1,
        }),
      })
    },
    [navigate],
  )

  const onItemClick = useCallback(
    (item: GenericListPageItem): void => {
      void navigate({ to: `/dossiers/topics/${item.id}` })
    },
    [navigate],
  )

  return (
    <ListPageShell
      title={t('topics:title', { defaultValue: 'Topics' })}
      subtitle={t('topics:subtitle', { defaultValue: '' })}
      toolbar={
        <ToolbarSearch
          value={search ?? ''}
          onChange={onSearchChange}
          placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search…' })}
        />
      }
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={
        <div className="empty-hint">
          <p>{t('topics:empty.title', { defaultValue: 'No topics yet' })}</p>
          <p className="sub">{t('topics:empty.description', { defaultValue: '' })}</p>
        </div>
      }
    >
      <GenericListPage items={items} onItemClick={onItemClick} />
    </ListPageShell>
  )
}
