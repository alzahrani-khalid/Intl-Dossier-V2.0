/**
 * Forums List Page (Phase 40 LIST-03 · Phase 87 F23/F24/F26)
 *
 * Mirrors the countries template (87-06) on a GenericListPage surface:
 * - F23 peek: row click registers the loaded id window in the peek store and opens
 *   the DossierDrawer (cross-page counter + chevrons) instead of navigating away.
 * - F24 popovers: Filter (status + sensitivity, live counts) + Display (sort by
 *   name/updated, toggle the secondary line + status chip), URL-persisted.
 * - F26 empty states: rich create CTA when truly empty; "no matching rows" + ghost
 *   Clear filters when filtered-empty.
 *
 * Status chip mapping (per plan 40-06 must_haves):
 *   active → chip-ok · completed → chip-info · planned → chip-accent · cancelled → chip-danger
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, type ReactNode } from 'react'
import { formatDayFirstYear } from '@/lib/format-date'
import {
  ListPageShell,
  GenericListPage,
  GenericListSkeleton,
  ToolbarSearch,
  type GenericListPageItem,
} from '@/components/list-page'
import {
  useListControls,
  parseListControlsSearch,
  type ListControlsConfig,
} from '@/components/list-controls/useListControls'
import { FilterPopover } from '@/components/list-controls/FilterPopover'
import { DisplayPopover } from '@/components/list-controls/DisplayPopover'
import { FilterChipsRow } from '@/components/list-controls/FilterChipsRow'
import { dossierFacetCount } from '@/lib/dossier-facet-count'
import { ListEmptyState } from '@/components/empty-states/ListEmptyState'
import { usePeekStore } from '@/store/peekStore'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'
import { DossierGlyph } from '@/components/signature-visuals/DossierGlyph'
import { useForums, fetchForumsPage, type ForumsFilters } from '@/hooks/useForums'

const PAGE_SIZE = 20

const FORUM_STATUS_CHIP: Record<string, string> = {
  active: 'chip-ok',
  completed: 'chip-info',
  planned: 'chip-accent',
  cancelled: 'chip-danger',
}

/** Filter + Display contract for the forums surface (shares the countries shape). */
const forumsListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'status',
      labelKey: 'list-controls:field.status',
      options: [
        { value: 'active', labelKey: 'list-controls:status.active' },
        { value: 'inactive', labelKey: 'list-controls:status.inactive' },
        { value: 'archived', labelKey: 'list-controls:status.archived' },
      ],
      buildCountQuery: (value, active) => dossierFacetCount('forum', 'status', value, active),
    },
    {
      key: 'sensitivity',
      labelKey: 'list-controls:field.sensitivity',
      options: [
        { value: '1', labelKey: 'list-controls:sensitivity.1' },
        { value: '2', labelKey: 'list-controls:sensitivity.2' },
        { value: '3', labelKey: 'list-controls:sensitivity.3' },
        { value: '4', labelKey: 'list-controls:sensitivity.4' },
      ],
      buildCountQuery: (value, active) => dossierFacetCount('forum', 'sensitivity', value, active),
    },
  ],
  sortFields: [
    { id: 'name', labelKey: 'list-controls:sort.name' },
    { id: 'updated', labelKey: 'list-controls:sort.updated' },
  ],
  properties: [
    { id: 'secondary', labelKey: 'list-controls:property.secondary', defaultVisible: true },
    { id: 'status', labelKey: 'list-controls:property.status', defaultVisible: true },
  ],
}

interface ForumsListSearch {
  page: number
  search?: string
  status?: string
  sensitivity?: string
  sort?: string
  dir?: 'asc' | 'desc'
  cols?: string
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
  validateSearch: (raw: Record<string, unknown>): ForumsListSearch => {
    const controls = parseListControlsSearch(raw, forumsListConfig)
    return {
      page: Math.max(1, Number(raw.page) || 1),
      search: typeof raw.search === 'string' && raw.search.length > 0 ? raw.search : undefined,
      status: controls.status,
      sensitivity: controls.sensitivity,
      sort: controls.sort,
      dir: controls.dir === 'asc' || controls.dir === 'desc' ? controls.dir : undefined,
      cols: controls.cols,
    }
  },
})

function ForumsListPage(): ReactNode {
  const { t, i18n } = useTranslation(['forums', 'list-pages'])
  const isArabic = i18n.language.startsWith('ar')
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { openDossier } = useDossierDrawer()
  const { page } = search

  const setSearch = useCallback(
    (reducer: (prev: Record<string, unknown>) => Record<string, unknown>): void => {
      void navigate({
        search: (prev: Record<string, unknown>) => reducer(prev),
        replace: true,
      } as unknown as Parameters<typeof navigate>[0])
    },
    [navigate],
  )

  const controls = useListControls(forumsListConfig, search as Record<string, unknown>, setSearch)

  const orderBy =
    controls.sort === 'name' || controls.sort === 'updated' ? controls.sort : undefined
  const sensitivity = search.sensitivity !== undefined ? Number(search.sensitivity) : undefined
  const nameColumn = isArabic ? 'name_ar' : 'name_en'

  const baseFilters = useMemo<ForumsFilters>(
    () => ({
      limit: PAGE_SIZE,
      search: search.search,
      status: search.status,
      sensitivity:
        sensitivity !== undefined && Number.isFinite(sensitivity) ? sensitivity : undefined,
      orderBy,
      dir: controls.dir,
      nameColumn,
    }),
    [search.search, search.status, sensitivity, orderBy, controls.dir, nameColumn],
  )

  const query = useForums({ ...baseFilters, page })

  const items: GenericListPageItem[] = useMemo(() => {
    const list: ForumRow[] = (query.data?.data ?? []) as ForumRow[]
    return list.map((f) => {
      const status = typeof f.status === 'string' ? f.status : 'active'
      const chipClass = FORUM_STATUS_CHIP[status] ?? 'chip-default'
      const meta = typeof f.updated_at === 'string' ? formatDayFirstYear(f.updated_at) : undefined
      const primary = (isArabic ? f.name_ar : f.name_en) ?? f.name_en ?? ''
      return {
        id: String(f.id),
        primary,
        secondary: meta,
        statusLabel: t(`forums:status.${status}`, { defaultValue: status }),
        statusChipClass: chipClass,
        icon: <DossierGlyph type="forum" name={primary} size={20} />,
      }
    })
  }, [query.data, isArabic, t])

  const total = query.data?.pagination.total ?? null

  // Peek neighbor-page loader — same query key family as useForums (no divergent query).
  const fetchPage = useCallback(
    async (p: number): Promise<string[]> => {
      const res = await queryClient.fetchQuery({
        queryKey: ['forums', { ...baseFilters, page: p }],
        queryFn: () => fetchForumsPage({ ...baseFilters, page: p }),
        staleTime: 1000 * 60 * 5,
      })
      return res.data.map((d) => String(d.id))
    },
    [queryClient, baseFilters],
  )

  const onItemClick = useCallback(
    (item: GenericListPageItem): void => {
      usePeekStore.getState().register({
        ids: items.map((i) => i.id),
        type: 'forum',
        total: total ?? items.length,
        pageOffset: (page - 1) * PAGE_SIZE,
        fetchPage,
        pageSize: PAGE_SIZE,
      })
      openDossier({ id: item.id, type: 'forum' })
    },
    [items, total, page, fetchPage, openDossier],
  )

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: ForumsListSearch) => ({
          ...prev,
          search: next.length > 0 ? next : undefined,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const onCreate = useCallback((): void => {
    void navigate({ to: '/dossiers/forums/create' })
  }, [navigate])

  const showSecondary = controls.visibleProperties.includes('secondary')
  const showStatus = controls.visibleProperties.includes('status')

  const toolbar = (
    <>
      <ToolbarSearch
        value={search.search ?? ''}
        onChange={onSearchChange}
        placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search' })}
      />
      <FilterPopover
        config={forumsListConfig}
        surfaceKey="forums"
        activeFilters={controls.filters}
        activeFilterCount={controls.activeFilterCount}
        onFilterChange={controls.setFilter}
      />
      <DisplayPopover
        config={forumsListConfig}
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
      title={t('forums:pageTitle')}
      subtitle={t('forums:pageSubtitle')}
      toolbar={toolbar}
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={
        <ListEmptyState
          entityType="forum"
          onCreate={onCreate}
          filtered={controls.hasActiveFilters}
          onClearFilters={controls.clearAll}
        />
      }
    >
      <FilterChipsRow
        chips={controls.filterChips}
        onRemove={controls.removeFilter}
        onClearAll={controls.clearAll}
      />
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
