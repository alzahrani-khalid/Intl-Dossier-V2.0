/**
 * Forums List Page (Phase 40 LIST-03)
 *
 * Replaces legacy 266-line implementation per .planning/phases/40-list-pages/40-CONTEXT.md D-01.
 * Renders <GenericListPage> inside <ListPageShell> with the existing useForums adapter.
 *
 * Status chip mapping (per plan 40-06 must_haves):
 *   active    → chip-ok
 *   completed → chip-info
 *   planned   → chip-accent
 *   cancelled → chip-danger
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import {
  ListPageShell,
  GenericListPage,
  GenericListSkeleton,
  ToolbarSearch,
  type GenericListPageItem,
} from '@/components/list-page'
import { DossierGlyph } from '@/components/signature-visuals/DossierGlyph'
import { useForums } from '@/hooks/useForums'
import { useDirection } from '@/hooks/useDirection'

interface DossierListSearch {
  page: number
  search?: string
}

const FORUM_STATUS_CHIP: Record<string, string> = {
  active: 'chip-ok',
  completed: 'chip-info',
  planned: 'chip-accent',
  cancelled: 'chip-danger',
}

interface ForumRow {
  id: string
  name_en?: string
  name_ar?: string
  status?: string
  updated_at?: string
}

export const Route = createFileRoute('/_protected/dossiers/forums/')({
  component: ForumsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function ForumsListPage(): React.ReactNode {
  const { t } = useTranslation(['forums', 'list-pages'])
  const { isRTL } = useDirection()
  const { page, search } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useForums({ page, limit: 20, search })

  const items: GenericListPageItem[] = useMemo(() => {
    const list: ForumRow[] = (query.data?.data ?? []) as ForumRow[]
    return list.map((f) => {
      const status = typeof f.status === 'string' ? f.status : 'active'
      const chipClass = FORUM_STATUS_CHIP[status] ?? 'chip-default'
      const meta =
        typeof f.updated_at === 'string'
          ? new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(f.updated_at))
          : undefined
      const primary = (isRTL ? f.name_ar : f.name_en) ?? f.name_en ?? ''
      return {
        id: String(f.id),
        primary,
        secondary: meta,
        statusLabel: t(`forums:status.${status}`, { defaultValue: status }),
        statusChipClass: chipClass,
        icon: <DossierGlyph type="forum" name={primary} size={20} />,
      }
    })
  }, [query.data, isRTL, t])

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: DossierListSearch): DossierListSearch => ({
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
      void navigate({
        to: '/dossiers/forums/$id' as never,
        params: { id: item.id } as never,
      })
    },
    [navigate],
  )

  return (
    <ListPageShell
      title={t('forums:title')}
      subtitle={t('forums:subtitle')}
      toolbar={
        <ToolbarSearch
          value={search ?? ''}
          onChange={onSearchChange}
          placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search' })}
        />
      }
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={
        <div className="empty-hint flex flex-col items-start gap-1 py-6">
          <p className="text-sm font-medium">{t('forums:empty.title')}</p>
          <p className="text-xs text-muted-foreground">{t('forums:empty.description')}</p>
        </div>
      }
    >
      {query.isLoading ? (
        <GenericListSkeleton rows={6} />
      ) : (
        <GenericListPage items={items} onItemClick={onItemClick} />
      )}
    </ListPageShell>
  )
}
