/**
 * Working Groups List Page (Phase 40 LIST-03 · Phase 87 F23/F24/F26)
 *
 * Mirrors the countries template (87-06) on a GenericListPage surface. The list is
 * served by the `search_working_groups` RPC, so the controls are honestly narrowed:
 * - Filter: `status` only (RPC `p_status`) with active/inactive options — the RPC +
 *   count base exclude `archived`, and the RPC accepts no sensitivity param, so
 *   neither an `archived` status nor a sensitivity filter is offered (no dead options).
 * - Display: no Sort section (the RPC returns a fixed order; a client re-sort would
 *   only reorder one 20-row window). Properties toggle the secondary line + status chip.
 * - F23 peek + F26 empty states ship in full.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { DossierGlyph } from '@/components/signature-visuals'
import {
  useWorkingGroups,
  fetchWorkingGroupsPage,
  type WorkingGroupsFilters,
} from '@/hooks/useWorkingGroups'

const PAGE_SIZE = 20

export const WG_STATUS_TONE: Record<string, string> = {
  active: 'chip-ok',
  suspended: 'chip-warn',
  disbanded: 'chip-default',
}

/** Filter + Display contract for the working-groups surface (RPC-narrowed — see file header). */
const workingGroupsListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'status',
      labelKey: 'list-controls:field.status',
      options: [
        { value: 'active', labelKey: 'list-controls:status.active' },
        { value: 'inactive', labelKey: 'list-controls:status.inactive' },
      ],
      buildCountQuery: (value, active) =>
        dossierFacetCount('working_group', 'status', value, active),
    },
  ],
  properties: [
    { id: 'secondary', labelKey: 'list-controls:property.secondary', defaultVisible: true },
    { id: 'status', labelKey: 'list-controls:property.status', defaultVisible: true },
  ],
}

interface WorkingGroupsListSearch {
  page: number
  search?: string
  status?: string
  cols?: string
}

interface WGRow {
  id: string
  name_en?: string
  name_ar?: string
  status?: string
  wg_status?: string
}

export const Route = createFileRoute('/_protected/dossiers/working_groups/')({
  component: WorkingGroupsListPage,
  validateSearch: (raw: Record<string, unknown>): WorkingGroupsListSearch => {
    const controls = parseListControlsSearch(raw, workingGroupsListConfig)
    return {
      page: Math.max(1, Number(raw.page) || 1),
      search: typeof raw.search === 'string' && raw.search.length > 0 ? raw.search : undefined,
      status: controls.status,
      cols: controls.cols,
    }
  },
})

function WorkingGroupsListPage(): ReactNode {
  const { t, i18n } = useTranslation(['working-groups', 'list-pages'])
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

  const controls = useListControls(
    workingGroupsListConfig,
    search as Record<string, unknown>,
    setSearch,
  )

  const baseFilters = useMemo<WorkingGroupsFilters>(
    () => ({
      limit: PAGE_SIZE,
      search: search.search,
      status: (search.status ?? undefined) as WorkingGroupsFilters['status'],
    }),
    [search.search, search.status],
  )

  const query = useWorkingGroups({ ...baseFilters, page })

  const items = useMemo<GenericListPageItem[]>(() => {
    const rows: WGRow[] = (query.data?.data ?? []) as WGRow[]
    return rows.map((wg) => {
      const statusKey = wg.wg_status ?? wg.status ?? 'active'
      const chipClass = WG_STATUS_TONE[statusKey] ?? 'chip-default'
      const primary = (isArabic ? wg.name_ar : wg.name_en) ?? wg.name_en ?? ''
      const secondary = isArabic ? (wg.name_en ?? '') : (wg.name_ar ?? '')
      return {
        id: String(wg.id),
        primary,
        secondary,
        statusLabel: t(`working-groups:status.${statusKey}`, { defaultValue: statusKey }),
        statusChipClass: chipClass,
        icon: <DossierGlyph type="working_group" name={primary} size={32} />,
      }
    })
  }, [query.data, isArabic, t])

  const total = query.data?.pagination.total ?? null

  // Peek neighbor-page loader — same query key family as useWorkingGroups (no divergent query).
  const fetchPage = useCallback(
    async (p: number): Promise<string[]> => {
      const res = await queryClient.fetchQuery({
        queryKey: ['working-groups', 'list', { ...baseFilters, page: p }],
        queryFn: () => fetchWorkingGroupsPage({ ...baseFilters, page: p }),
        staleTime: 30_000,
      })
      return res.data.map((d) => String(d.id))
    },
    [queryClient, baseFilters],
  )

  const onItemClick = useCallback(
    (item: GenericListPageItem): void => {
      usePeekStore.getState().register({
        ids: items.map((i) => i.id),
        type: 'working_group',
        total: total ?? items.length,
        pageOffset: (page - 1) * PAGE_SIZE,
        fetchPage,
        pageSize: PAGE_SIZE,
      })
      openDossier({ id: item.id, type: 'working_group' })
    },
    [items, total, page, fetchPage, openDossier],
  )

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: WorkingGroupsListSearch) => ({
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
    void navigate({ to: '/dossiers/working_groups/create' })
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
        config={workingGroupsListConfig}
        surfaceKey="working-groups"
        activeFilters={controls.filters}
        activeFilterCount={controls.activeFilterCount}
        onFilterChange={controls.setFilter}
      />
      <DisplayPopover
        config={workingGroupsListConfig}
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
      title={t('working-groups:title', { defaultValue: 'Working Groups' })}
      subtitle={t('working-groups:subtitle', { defaultValue: 'Committees and task forces' })}
      toolbar={toolbar}
      actions={
        <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
          <Link to="/dossiers/working_groups/create">
            <Plus className="h-4 w-4 me-2" />
            {t('empty-states:list.working_group.cta')}
          </Link>
        </Button>
      }
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={
        <div data-testid="working-groups-empty">
          <ListEmptyState
            entityType="working_group"
            onCreate={onCreate}
            filtered={controls.hasActiveFilters}
            onClearFilters={controls.clearAll}
          />
        </div>
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
