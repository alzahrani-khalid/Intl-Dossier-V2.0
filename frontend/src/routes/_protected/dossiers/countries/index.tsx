/**
 * Countries List Page (Phase 40 LIST-01 · Phase 87 F23/F24/F26)
 *
 * The Phase-40 template surface, now wired with the full Linear affordance set:
 * - F23 peek: row click registers the loaded id window in the peek store and opens
 *   the DossierDrawer (cross-page counter + chevrons) instead of navigating away.
 * - F24 popovers: Filter (status + sensitivity, live counts) + Display (sort by
 *   name/updated, toggle engagements/lastTouch/sensitivity columns), URL-persisted.
 * - F26 empty states: rich create CTA when truly empty; "no matching rows" + ghost
 *   Clear filters when filtered-empty.
 *
 * Organizations mirrors this file exactly (country → organization swaps).
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListPageShell, DossierTable, ToolbarSearch } from '@/components/list-page'
import type { DossierTableRow, DossierTableColumn } from '@/components/list-page'
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
import { useCountries, fetchCountriesPage, type CountriesFilters } from '@/hooks/useCountries'

const PAGE_SIZE = 20

/** Filter + Display contract for the countries surface (organizations shares the shape). */
const countriesListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'status',
      labelKey: 'list-controls:field.status',
      options: [
        { value: 'active', labelKey: 'list-controls:status.active' },
        { value: 'inactive', labelKey: 'list-controls:status.inactive' },
        { value: 'archived', labelKey: 'list-controls:status.archived' },
      ],
      buildCountQuery: (value, active) => dossierFacetCount('country', 'status', value, active),
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
      buildCountQuery: (value, active) =>
        dossierFacetCount('country', 'sensitivity', value, active),
    },
  ],
  sortFields: [
    { id: 'name', labelKey: 'list-controls:sort.name' },
    { id: 'updated', labelKey: 'list-controls:sort.updated' },
  ],
  properties: [
    { id: 'engagements', labelKey: 'list-controls:property.engagements', defaultVisible: true },
    { id: 'lastTouch', labelKey: 'list-controls:property.lastTouch', defaultVisible: true },
    { id: 'sensitivity', labelKey: 'list-controls:property.sensitivity', defaultVisible: true },
  ],
}

interface CountriesListSearch {
  page: number
  search?: string
  status?: string
  sensitivity?: string
  sort?: string
  dir?: 'asc' | 'desc'
  cols?: string
}

export const Route = createFileRoute('/_protected/dossiers/countries/')({
  component: CountriesListRoute,
  validateSearch: (raw: Record<string, unknown>): CountriesListSearch => {
    const controls = parseListControlsSearch(raw, countriesListConfig)
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

function CountriesListRoute(): ReactElement {
  const { t, i18n } = useTranslation(['countries', 'list-pages'])
  const isArabic = i18n.language.startsWith('ar')
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { openDossier } = useDossierDrawer()
  const { page } = search

  // Router-agnostic setSearch applier (replace:true — no history spam per change).
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
    countriesListConfig,
    search as Record<string, unknown>,
    setSearch,
  )

  const orderBy =
    controls.sort === 'name' || controls.sort === 'updated' ? controls.sort : undefined
  const sensitivity = search.sensitivity !== undefined ? Number(search.sensitivity) : undefined
  const nameColumn = isArabic ? 'name_ar' : 'name_en'

  const baseFilters = useMemo<CountriesFilters>(
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

  const query = useCountries({ ...baseFilters, page })

  const response = query.data
  const rows: DossierTableRow[] = useMemo(() => {
    const dossiers = response?.data ?? []
    return dossiers.map((d) => {
      const level = typeof d.sensitivity_level === 'number' ? d.sensitivity_level : 1
      return {
        id: String(d.id),
        type: 'country' as const,
        iso: typeof d.iso_code === 'string' ? d.iso_code : undefined,
        name_en: String(d.name_en ?? ''),
        name_ar: String(d.name_ar ?? ''),
        engagement_count: typeof d.engagement_count === 'number' ? d.engagement_count : 0,
        last_touch: typeof d.updated_at === 'string' ? d.updated_at : null,
        sensitivity_level: level >= 1 && level <= 4 ? level : 1,
      }
    })
  }, [response])

  const total = response?.pagination.total ?? null

  // Peek neighbor-page loader — same query key family as useCountries (no divergent query).
  const fetchPage = useCallback(
    async (p: number): Promise<string[]> => {
      const res = await queryClient.fetchQuery({
        queryKey: ['countries', { ...baseFilters, page: p }],
        queryFn: () => fetchCountriesPage({ ...baseFilters, page: p }),
        staleTime: 1000 * 60 * 5,
      })
      return res.data.map((d) => String(d.id))
    },
    [queryClient, baseFilters],
  )

  const onRowClick = useCallback(
    (row: DossierTableRow): void => {
      usePeekStore.getState().register({
        ids: rows.map((r) => r.id),
        type: 'country',
        total: total ?? rows.length,
        pageOffset: (page - 1) * PAGE_SIZE,
        fetchPage,
        pageSize: PAGE_SIZE,
      })
      openDossier({ id: row.id, type: 'country' })
    },
    [rows, total, page, fetchPage, openDossier],
  )

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: CountriesListSearch) => ({
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
    void navigate({ to: '/dossiers/countries/create' })
  }, [navigate])

  const visibleColumns = controls.visibleProperties as DossierTableColumn[]

  const toolbar = (
    <>
      <ToolbarSearch
        value={search.search ?? ''}
        onChange={onSearchChange}
        placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search…' })}
      />
      <FilterPopover
        config={countriesListConfig}
        surfaceKey="countries"
        activeFilters={controls.filters}
        activeFilterCount={controls.activeFilterCount}
        onFilterChange={controls.setFilter}
      />
      <DisplayPopover
        config={countriesListConfig}
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
      title={t('countries:title', { defaultValue: isArabic ? 'الدول' : 'Countries' })}
      subtitle={t('countries:subtitle', {
        defaultValue: isArabic ? 'كل ملفات الدول' : 'All country dossiers',
      })}
      toolbar={toolbar}
      actions={
        <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
          <Link to="/dossiers/countries/create">
            <Plus className="h-4 w-4 me-2" />
            {t('empty-states:list.country.cta')}
          </Link>
        </Button>
      }
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && rows.length === 0}
      emptyState={
        <ListEmptyState
          entityType="country"
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
      <DossierTable rows={rows} onRowClick={onRowClick} visibleColumns={visibleColumns} />
    </ListPageShell>
  )
}
