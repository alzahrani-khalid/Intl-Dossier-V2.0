/**
 * Elected Officials List Page Route
 * Displays data table of elected officials with filters.
 *
 * Phase 87-05 (AFF-01): filter + pagination state lives in validated URL params
 * (validateSearch below) and is threaded into the now-controlled
 * ElectedOfficialListTable, so filters/page survive refresh/share and 87-08 has a
 * stable source for peek position math. PageHeader structure is intentionally
 * kept (no ListPageShell migration — planner decision).
 */

import type { ReactElement } from 'react'
import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Crown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { ToolbarSearch } from '@/components/list-page'
import {
  parseListControlsSearch,
  useListControls,
  type ListControlsConfig,
} from '@/components/list-controls/useListControls'
import { FilterPopover } from '@/components/list-controls/FilterPopover'
import { DisplayPopover } from '@/components/list-controls/DisplayPopover'
import { FilterChipsRow } from '@/components/list-controls/FilterChipsRow'
import {
  ElectedOfficialListTable,
  OFFICE_TYPES,
} from '@/components/elected-officials/ElectedOfficialListTable'
import {
  electedOfficialKeys,
  fetchElectedOfficialsPage,
} from '@/domains/elected-officials/hooks/useElectedOfficials'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'
import { usePeekStore, type PeekRegistration } from '@/store/peekStore'
import type {
  ElectedOfficialFilters,
  ElectedOfficialListItem,
  OfficeType,
} from '@/domains/elected-officials/types/elected-official.types'

const electedOfficialsListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'office_type',
      labelKey: 'elected-officials:filters.officeType',
      options: OFFICE_TYPES.map((value) => ({
        value,
        labelKey: `elected-officials:officeTypes.${value}`,
      })),
    },
    {
      key: 'term',
      labelKey: 'elected-officials:filters.termStatus',
      options: [
        { value: 'current', labelKey: 'elected-officials:filters.currentTerm' },
        { value: 'expired', labelKey: 'elected-officials:filters.expiredTerm' },
      ],
    },
  ],
  properties: [
    { id: 'party', labelKey: 'elected-officials:columns.party', defaultVisible: true },
    { id: 'district', labelKey: 'elected-officials:columns.district', defaultVisible: true },
    { id: 'country', labelKey: 'elected-officials:columns.country', defaultVisible: true },
  ],
}

interface ElectedOfficialsListSearch {
  page: number
  search?: string
  office_type?: OfficeType
  term?: 'current' | 'expired'
  cols?: string
}

export const Route = createFileRoute('/_protected/dossiers/elected-officials/')({
  component: ElectedOfficialsListPage,
  validateSearch: (search: Record<string, unknown>): ElectedOfficialsListSearch => {
    const controls = parseListControlsSearch(search, electedOfficialsListConfig)
    return {
      page: Math.max(1, Number(search.page) || 1),
      search:
        typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
      office_type: OFFICE_TYPES.includes(controls.office_type as OfficeType)
        ? (controls.office_type as OfficeType)
        : undefined,
      term: controls.term === 'current' || controls.term === 'expired' ? controls.term : undefined,
      cols: controls.cols,
    }
  },
})

function ElectedOfficialsListPage(): ReactElement {
  const { t } = useTranslation('elected-officials')
  const { page, search, office_type, term } = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { openDossier } = useDossierDrawer()

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
    electedOfficialsListConfig,
    Route.useSearch() as Record<string, unknown>,
    setSearch,
  )

  const filters: ElectedOfficialFilters = useMemo(
    () => ({
      page,
      limit: 20,
      search,
      office_type,
      is_current_term: term === 'current' ? true : term === 'expired' ? false : undefined,
    }),
    [page, search, office_type, term],
  )

  const onSearchChange = useCallback(
    (value: string): void => {
      void navigate({
        search: (prev: ElectedOfficialsListSearch) => ({
          ...prev,
          search: value.length > 0 ? value : undefined,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const onPrevPage = useCallback((): void => {
    void navigate({
      search: (prev: ElectedOfficialsListSearch) => ({ ...prev, page: Math.max(1, prev.page - 1) }),
      replace: true,
    })
  }, [navigate])

  const onNextPage = useCallback((): void => {
    void navigate({
      search: (prev: ElectedOfficialsListSearch) => ({ ...prev, page: prev.page + 1 }),
      replace: true,
    })
  }, [navigate])

  const onCreate = useCallback((): void => {
    void navigate({ to: '/dossiers/elected-officials/create' })
  }, [navigate])

  const onClearFilters = useCallback((): void => {
    void navigate({
      search: (prev: ElectedOfficialsListSearch) => ({
        ...prev,
        search: undefined,
        office_type: undefined,
        term: undefined,
        page: 1,
      }),
      replace: true,
    })
  }, [navigate])

  const fetchPage = useCallback(
    async (page: number): Promise<string[]> => {
      const pageFilters: ElectedOfficialFilters = { ...filters, page }
      const res = await queryClient.fetchQuery({
        queryKey: electedOfficialKeys.list(pageFilters),
        queryFn: () => fetchElectedOfficialsPage(pageFilters),
        staleTime: 30_000,
      })
      return res.data.map((row) => row.id)
    },
    [filters, queryClient],
  )

  const onOpenElectedOfficial = useCallback(
    (item: ElectedOfficialListItem, registration: PeekRegistration): void => {
      usePeekStore.getState().register({ ...registration, fetchPage })
      openDossier({ id: item.id, type: 'elected_official' })
    },
    [fetchPage, openDossier],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Crown className="h-6 w-6" />}
        title={t('list.title')}
        actions={
          <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
            <Link to="/dossiers/elected-officials/create">
              <Plus className="h-4 w-4 me-2" />
              {t('list.add')}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToolbarSearch
          value={search ?? ''}
          onChange={onSearchChange}
          placeholder={t('columns.name')}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            config={electedOfficialsListConfig}
            surfaceKey="elected-officials"
            activeFilters={controls.filters}
            activeFilterCount={controls.activeFilterCount}
            onFilterChange={controls.setFilter}
          />
          <DisplayPopover
            config={electedOfficialsListConfig}
            sort={controls.sort}
            dir={controls.dir}
            visibleProperties={controls.visibleProperties}
            onSetSort={controls.setSort}
            onSetDir={controls.setDir}
            onToggleProperty={controls.toggleProperty}
            onSetGroup={controls.setGroup}
            onReset={controls.resetDisplay}
          />
        </div>
      </div>

      <FilterChipsRow
        chips={controls.filterChips}
        onRemove={controls.removeFilter}
        onClearAll={controls.clearAll}
      />

      {/* Data Table */}
      <ElectedOfficialListTable
        filters={filters}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        onCreate={onCreate}
        onClearFilters={onClearFilters}
        onOpenElectedOfficial={onOpenElectedOfficial}
        visibleProperties={controls.visibleProperties}
        filtered={search !== undefined || controls.hasActiveFilters}
      />
    </div>
  )
}
