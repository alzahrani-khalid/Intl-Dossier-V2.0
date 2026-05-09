/**
 * Countries List Page (Phase 40 LIST-01)
 *
 * Replaces legacy implementation per .planning/phases/40-list-pages/40-CONTEXT.md D-01.
 * Renders DossierTable inside ListPageShell with useCountries adapter.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo, type ReactElement } from 'react'
import { ListPageShell, DossierTable, ToolbarSearch } from '@/components/list-page'
import type { DossierTableRow } from '@/components/list-page'
import { useCountries } from '@/hooks/useCountries'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/countries/')({
  component: CountriesListRoute,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function CountriesListRoute(): ReactElement {
  const { page, search } = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: DossierListSearch) => ({
          ...prev,
          search: next.length > 0 ? next : undefined,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const onRowClick = useCallback(
    (row: DossierTableRow): void => {
      void navigate({
        to: '/dossiers/countries/$dossierId',
        params: { dossierId: row.id },
      })
    },
    [navigate],
  )

  return (
    <CountriesListPage
      page={page}
      search={search}
      onSearchChange={onSearchChange}
      onRowClick={onRowClick}
    />
  )
}

export interface CountriesListPageProps {
  page: number
  search?: string
  onSearchChange: (next: string) => void
  onRowClick?: (row: DossierTableRow) => void
}

export function CountriesListPage({
  page,
  search,
  onSearchChange,
  onRowClick,
}: CountriesListPageProps): ReactElement {
  const { t, i18n } = useTranslation(['countries', 'list-pages'])
  const isArabic = i18n.language.startsWith('ar')
  const query = useCountries({ page, limit: 20, search })

  const rows: DossierTableRow[] = useMemo(() => {
    const dossiers =
      (query.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []
    return dossiers.map((d) => {
      const sensitivity = typeof d.sensitivity_level === 'number' ? d.sensitivity_level : 1
      return {
        id: String(d.id),
        type: 'country' as const,
        iso: typeof d.iso_code === 'string' ? d.iso_code : undefined,
        name_en: String(d.name_en ?? ''),
        name_ar: String(d.name_ar ?? ''),
        engagement_count: typeof d.engagement_count === 'number' ? d.engagement_count : 0,
        last_touch: typeof d.updated_at === 'string' ? d.updated_at : null,
        sensitivity_level: sensitivity >= 1 && sensitivity <= 4 ? sensitivity : 1,
      }
    })
  }, [query.data])

  return (
    <ListPageShell
      title={t('countries:title', { defaultValue: isArabic ? 'الدول' : 'Countries' })}
      subtitle={t('countries:subtitle', {
        defaultValue: isArabic ? 'كل ملفات الدول' : 'All country dossiers',
      })}
      toolbar={
        <ToolbarSearch
          value={search ?? ''}
          onChange={onSearchChange}
          placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search…' })}
        />
      }
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && rows.length === 0}
      emptyState={
        <div className="empty-hint">
          <p>
            {t('countries:empty.title', {
              defaultValue: isArabic ? 'لا توجد دول بعد' : 'No countries yet',
            })}
          </p>
          <p className="sub">
            {t('countries:empty.description', {
              defaultValue: isArabic
                ? 'ستظهر ملفات الدول هنا.'
                : 'Country dossiers will appear here.',
            })}
          </p>
        </div>
      }
    >
      <DossierTable rows={rows} onRowClick={onRowClick} />
    </ListPageShell>
  )
}
