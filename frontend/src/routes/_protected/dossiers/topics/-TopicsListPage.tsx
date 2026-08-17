/**
 * Topics List Page (Phase 40 LIST-03 · Phase 87 F23/F24/F26)
 *
 * Honestly-narrowed GenericListPage surface. Topics list through the domains API
 * repo (`useTopics` → `useDossiersByType('topic')`), whose call signature accepts
 * only `search` — no status/sensitivity filter and no sort param. So per the
 * config-driven-narrowing rule the surface exposes NO Filter popover (empty filters
 * array) and NO Sort section; only the client-side property toggles (secondary line
 * + status chip) ship in Display. F23 peek + F26 empty states ship in full — the
 * repo supports paging and a total, so the peek pages cross-page normally.
 */

import { useCallback, useMemo, type ReactElement } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { formatDayFirstYear } from '@/lib/format-date'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ListPageShell,
  GenericListPage,
  GenericListSkeleton,
  ToolbarSearch,
} from '@/components/list-page'
import type { GenericListPageItem } from '@/components/list-page'
import {
  useListControls,
  type ListControlsConfig,
} from '@/components/list-controls/useListControls'
import { DisplayPopover } from '@/components/list-controls/DisplayPopover'
import { ListEmptyState } from '@/components/empty-states/ListEmptyState'
import { usePeekStore } from '@/store/peekStore'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'
import { dossierKeys } from '@/domains/dossiers'
import { getDossiersByType } from '@/services/dossier-api'
import { useTopics } from '@/hooks/useTopics'

const PAGE_SIZE = 20
const TOPICS_ROUTE = '/_protected/dossiers/topics/'

const TOPIC_STATUS_CHIP: Record<string, string> = {
  active: 'chip-ok',
  archived: 'chip-info',
  draft: 'chip-warn',
}

/**
 * Topics Filter + Display contract. Filters intentionally empty — the domains repo
 * call accepts no server-side status/sensitivity filter and no sort param, so
 * neither the Filter popover nor a Sort section is rendered (no dead options). Only
 * the two client-side property toggles ship.
 */
export const topicsListConfig: ListControlsConfig = {
  filters: [],
  properties: [
    { id: 'secondary', labelKey: 'list-controls:property.secondary', defaultVisible: true },
    { id: 'status', labelKey: 'list-controls:property.status', defaultVisible: true },
  ],
}

/** Read the full filtered total from the repo response (falls back to the loaded window). */
function extractTotal(raw: unknown, loadedLength: number): number {
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const pagination = obj.pagination
    if (
      pagination !== null &&
      typeof pagination === 'object' &&
      typeof (pagination as Record<string, unknown>).total_count === 'number'
    ) {
      return (pagination as { total_count: number }).total_count
    }
    if (typeof obj.total === 'number') {
      return obj.total
    }
  }
  return loadedLength
}

export function TopicsListPage(): ReactElement {
  const { t, i18n } = useTranslation(['topics', 'list-pages'])
  const isArabic = i18n.language.startsWith('ar')
  const search = useSearch({ from: TOPICS_ROUTE })
  const navigate = useNavigate({ from: TOPICS_ROUTE })
  const queryClient = useQueryClient()
  const { openDossier } = useDossierDrawer()
  const { page } = search
  const query = useTopics({ page, limit: PAGE_SIZE, search: search.search })

  const setSearch = useCallback(
    (reducer: (prev: Record<string, unknown>) => Record<string, unknown>): void => {
      void navigate({
        search: (prev: Record<string, unknown>) => reducer(prev),
        replace: true,
      } as unknown as Parameters<typeof navigate>[0])
    },
    [navigate],
  )

  const controls = useListControls(topicsListConfig, search as Record<string, unknown>, setSearch)

  const rows = useMemo<Array<Record<string, unknown>>>(() => {
    const raw: unknown = query.data
    if (Array.isArray(raw)) {
      return raw as Array<Record<string, unknown>>
    }
    if (raw !== null && raw !== undefined && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      if (Array.isArray(obj.items)) {
        return obj.items as Array<Record<string, unknown>>
      }
      if (Array.isArray(obj.data)) {
        return obj.data as Array<Record<string, unknown>>
      }
    }
    return []
  }, [query.data])

  const items: GenericListPageItem[] = useMemo(
    () =>
      rows.map((row) => {
        const status = typeof row.status === 'string' ? row.status : 'active'
        const statusChipClass = TOPIC_STATUS_CHIP[status] ?? 'chip-info'
        const nameEn = typeof row.name_en === 'string' ? row.name_en : ''
        const nameAr = typeof row.name_ar === 'string' ? row.name_ar : ''
        const primary = isArabic && nameAr.length > 0 ? nameAr : nameEn
        const updated =
          typeof row.updated_at === 'string' ? formatDayFirstYear(row.updated_at) : undefined
        return {
          id: String(row.id),
          primary,
          secondary: updated,
          statusLabel: t(`topics:status.${status}`, { defaultValue: status }),
          statusChipClass,
          icon: <BookOpen className="size-5" aria-hidden="true" />,
        }
      }),
    [rows, isArabic, t],
  )

  const total = extractTotal(query.data, items.length)

  // Peek neighbor-page loader — same query key family as useTopics/useDossiersByType.
  const fetchPage = useCallback(
    async (p: number): Promise<string[]> => {
      const res = await queryClient.fetchQuery({
        queryKey: [...dossierKeys.byType('topic', p, PAGE_SIZE), search.search],
        queryFn: () => getDossiersByType('topic', p, PAGE_SIZE, search.search),
        staleTime: 1000 * 60 * 5,
      })
      return res.data.map((d) => String(d.id))
    },
    [queryClient, search.search],
  )

  const onItemClick = useCallback(
    (item: GenericListPageItem): void => {
      usePeekStore.getState().register({
        ids: items.map((i) => i.id),
        type: 'topic',
        total,
        pageOffset: (page - 1) * PAGE_SIZE,
        fetchPage,
        pageSize: PAGE_SIZE,
      })
      openDossier({ id: item.id, type: 'topic' })
    },
    [items, total, page, fetchPage, openDossier],
  )

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          search: next.length > 0 ? next : undefined,
          page: 1,
        }),
        replace: true,
      } as unknown as Parameters<typeof navigate>[0])
    },
    [navigate],
  )

  const onCreate = useCallback((): void => {
    void navigate({ to: '/dossiers/topics/create' })
  }, [navigate])

  const showSecondary = controls.visibleProperties.includes('secondary')
  const showStatus = controls.visibleProperties.includes('status')

  const toolbar = (
    <>
      <ToolbarSearch
        value={search.search ?? ''}
        onChange={onSearchChange}
        placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search...' })}
      />
      <DisplayPopover
        config={topicsListConfig}
        sort={controls.sort}
        dir={controls.dir}
        visibleProperties={controls.visibleProperties}
        onSetSort={controls.setSort}
        onSetDir={controls.setDir}
        onToggleProperty={controls.toggleProperty}
        onSetGroup={controls.setGroup}
        onReset={controls.resetDisplay}
      />
    </>
  )

  return (
    <ListPageShell
      title={t('topics:title', { defaultValue: 'Topics' })}
      subtitle={t('topics:subtitle', { defaultValue: '' })}
      toolbar={toolbar}
      actions={
        <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
          <Link to="/dossiers/topics/create">
            <Plus className="h-4 w-4 me-2" />
            {t('empty-states:list.topic.cta')}
          </Link>
        </Button>
      }
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={<ListEmptyState entityType="topic" onCreate={onCreate} />}
    >
      {query.isLoading ? (
        <GenericListSkeleton rows={6} />
      ) : (
        <GenericListPage
          items={items}
          onItemClick={onItemClick}
          showSecondary={showSecondary}
          showStatus={showStatus}
        />
      )}
    </ListPageShell>
  )
}
