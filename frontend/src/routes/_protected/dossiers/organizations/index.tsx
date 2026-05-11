/**
 * Organizations List Page (Phase 40 — list-pages, Plan 04 / LIST-01)
 *
 * Replaces the legacy body with ListPageShell + DossierTable + useOrganizations.
 * Mirrors Phase 40 Plan 03 (Countries) shape with `country` → `organization` swaps.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo, type ReactElement } from 'react'
import {
  ListPageShell,
  DossierTable,
  ToolbarSearch,
  type DossierTableRow,
} from '@/components/list-page'
import { useOrganizations } from '@/hooks/useOrganizations'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/organizations/')({
  component: OrganizationsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function OrganizationsListPage(): ReactElement {
  const { t, i18n } = useTranslation(['organizations', 'list-pages'])
  const isArabic = i18n.language.startsWith('ar')
  const { page, search } = Route.useSearch()
  const navigate = Route.useNavigate()
  const rootNavigate = useNavigate()

  const query = useOrganizations({ page, limit: 20, search })

  const rows: DossierTableRow[] = useMemo(() => {
    const dossiers =
      (query.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []
    return dossiers.map((d) => ({
      id: String(d.id),
      type: 'organization' as const,
      iso: undefined,
      name_en: String(d.name_en ?? ''),
      name_ar: String(d.name_ar ?? ''),
      engagement_count: typeof d.engagement_count === 'number' ? d.engagement_count : 0,
      last_touch: typeof d.updated_at === 'string' ? d.updated_at : null,
      sensitivity_level:
        typeof d.sensitivity_level === 'number' &&
        d.sensitivity_level >= 1 &&
        d.sensitivity_level <= 4
          ? d.sensitivity_level
          : 1,
    }))
  }, [query.data])

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

  const onRowClick = useCallback(
    (row: DossierTableRow): void => {
      void rootNavigate({
        to: '/dossiers/organizations/$id',
        params: { id: row.id },
      })
    },
    [rootNavigate],
  )

  return (
    <ListPageShell
      title={t('organizations:title', {
        defaultValue: isArabic ? 'المنظمات' : 'Organizations',
      })}
      subtitle={t('organizations:subtitle', {
        defaultValue: isArabic ? 'كل ملفات المنظمات' : 'All organization dossiers',
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
            {t('organizations:empty.title', {
              defaultValue: isArabic ? 'لا توجد منظمات بعد' : 'No organizations yet',
            })}
          </p>
          <p className="sub">
            {t('organizations:empty.description', {
              defaultValue: isArabic
                ? 'ستظهر ملفات المنظمات هنا.'
                : 'Organization dossiers will appear here.',
            })}
          </p>
        </div>
      }
    >
      <DossierTable rows={rows} onRowClick={onRowClick} />
    </ListPageShell>
  )
}
