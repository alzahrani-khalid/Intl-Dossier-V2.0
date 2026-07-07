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
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Crown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  ElectedOfficialListTable,
  OFFICE_TYPES,
} from '@/components/elected-officials/ElectedOfficialListTable'
import type {
  ElectedOfficialFilters,
  OfficeType,
} from '@/domains/elected-officials/types/elected-official.types'

interface ElectedOfficialsListSearch {
  page: number
  search?: string
  office_type?: OfficeType
  term?: 'current' | 'expired'
}

export const Route = createFileRoute('/_protected/dossiers/elected-officials/')({
  component: ElectedOfficialsListPage,
  validateSearch: (search: Record<string, unknown>): ElectedOfficialsListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
    office_type: OFFICE_TYPES.includes(search.office_type as OfficeType)
      ? (search.office_type as OfficeType)
      : undefined,
    term: search.term === 'current' || search.term === 'expired' ? search.term : undefined,
  }),
})

function ElectedOfficialsListPage(): ReactElement {
  const { t } = useTranslation('elected-officials')
  const { page, search, office_type, term } = Route.useSearch()
  const navigate = Route.useNavigate()

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

  const onOfficeTypeChange = useCallback(
    (value: string): void => {
      void navigate({
        search: (prev: ElectedOfficialsListSearch) => ({
          ...prev,
          office_type: value !== '' ? (value as OfficeType) : undefined,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const onTermStatusChange = useCallback(
    (value: string): void => {
      void navigate({
        search: (prev: ElectedOfficialsListSearch) => ({
          ...prev,
          term: value === 'current' ? 'current' : value === 'expired' ? 'expired' : undefined,
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

      {/* Data Table */}
      <ElectedOfficialListTable
        filters={filters}
        onSearchChange={onSearchChange}
        onOfficeTypeChange={onOfficeTypeChange}
        onTermStatusChange={onTermStatusChange}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
    </div>
  )
}
