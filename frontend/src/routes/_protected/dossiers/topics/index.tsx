/**
 * Topics List Page (Feature 028 - Type-Specific Detail Pages)
 *
 * Displays filterable list of topic dossiers (policy areas, strategic priorities).
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Target } from 'lucide-react'
import { useDossiersByType } from '@/hooks/useDossier'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useMemo, useCallback } from 'react'
import { useDirection } from '@/hooks/useDirection'

// URL search params type for dossier list pagination
interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/topics/')({
  component: TopicsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function TopicsListPage() {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  const { page, search: searchQuery } = Route.useSearch()
  const navigate = Route.useNavigate()
  const pageSize = 20

  // Fetch topic dossiers
  const { data, isLoading, error } = useDossiersByType('topic', page, pageSize)

  // Memo: prevents re-filtering entire list on every render; only recomputes when data or search changes
  const filteredDossiers = useMemo(
    () =>
      data?.data.filter((dossier) => {
        if (searchQuery == null || searchQuery.length === 0) return true
        const searchLower = searchQuery.toLowerCase()
        return (
          dossier.name_en.toLowerCase().includes(searchLower) ||
          dossier.name_ar?.toLowerCase().includes(searchLower) ||
          dossier.description_en?.toLowerCase().includes(searchLower) ||
          dossier.description_ar?.toLowerCase().includes(searchLower)
        )
      }),
    [data?.data, searchQuery],
  )

  // URL-driven pagination handlers
  const handlePrevPage = useCallback((): void => {
    void navigate({
      search: (prev: DossierListSearch) => ({ ...prev, page: Math.max(1, page - 1) }),
    })
  }, [navigate, page])
  const handleNextPage = useCallback((): void => {
    void navigate({ search: (prev: DossierListSearch) => ({ ...prev, page: page + 1 }) })
  }, [navigate, page])

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-start">
              {t('type.topic')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t('typeDescription.topic')}
            </p>
          </div>
        </div>
        <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
          <Link to="/dossiers/create">
            <Plus className="h-4 w-4 me-2" />
            {t('action.create')}
          </Link>
        </Button>
      </header>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder={t('filter.search')}
          value={searchQuery ?? ''}
          onChange={(e): void => {
            void navigate({
              search: (prev: DossierListSearch) => ({
                ...prev,
                search: e.target.value.length > 0 ? e.target.value : undefined,
                page: 1,
              }),
              replace: true,
            })
          }}
          className="max-w-md min-h-11"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 sm:py-16 lg:py-20">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-muted-foreground" />
          <span className="ms-3 text-muted-foreground text-sm sm:text-base">
            {t('list.loading')}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6"
          role="alert"
        >
          <h3 className="text-base sm:text-lg font-semibold text-destructive mb-2">
            {t('list.error')}
          </h3>
          <p className="text-sm sm:text-base text-destructive/90">{error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredDossiers?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
          <Target className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            {searchQuery ? t('list.emptyFiltered') : t('list.empty')}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
            {searchQuery ? t('list.emptyFilteredDescription') : t('list.emptyDescription')}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link to="/dossiers/create">{t('action.create')}</Link>
            </Button>
          )}
        </div>
      )}

      {/* Table - Desktop */}
      {!isLoading && !error && filteredDossiers && filteredDossiers.length > 0 && (
        <>
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('form.nameEn')}</TableHead>
                  <TableHead>{t('form.nameAr')}</TableHead>
                  <TableHead>{t('form.status')}</TableHead>
                  <TableHead>{t('form.sensitivityLevel')}</TableHead>
                  <TableHead className="text-end">{t('action.more')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDossiers.map((dossier) => (
                  <TableRow key={dossier.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={getDossierDetailPath(dossier.id, 'topic')}
                        className="hover:text-primary hover:underline"
                      >
                        {dossier.name_en}
                      </Link>
                    </TableCell>
                    <TableCell>{dossier.name_ar}</TableCell>
                    <TableCell>
                      <Badge variant={dossier.status === 'active' ? 'default' : 'secondary'}>
                        {t(`status.${dossier.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`sensitivityLevel.${dossier.sensitivity_level}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" asChild className="min-h-11 min-w-11">
                        <Link to={getDossierDetailPath(dossier.id, 'topic')}>
                          {t('action.view')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card List - Mobile */}
          <div className="md:hidden space-y-4">
            {filteredDossiers.map((dossier) => (
              <Link
                key={dossier.id}
                to={getDossierDetailPath(dossier.id, 'topic')}
                className="block p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors min-h-11"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-base">
                    {isRTL ? dossier.name_ar : dossier.name_en}
                  </h3>
                  <Badge variant={dossier.status === 'active' ? 'default' : 'secondary'}>
                    {t(`status.${dossier.status}`)}
                  </Badge>
                </div>
                {(isRTL ? dossier.description_ar : dossier.description_en) && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {isRTL ? dossier.description_ar : dossier.description_en}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t(`sensitivityLevel.${dossier.sensitivity_level}`)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total! > pageSize && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={handlePrevPage}
                className="min-h-11 min-w-11 w-full sm:w-auto"
              >
                {t('action.back')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('list.pageInfo', {
                  current: page,
                  total: Math.ceil(data.total! / pageSize),
                })}
              </span>
              <Button
                variant="outline"
                disabled={page * pageSize >= data.total!}
                onClick={handleNextPage}
                className="min-h-11 min-w-11 w-full sm:w-auto"
              >
                {t('action.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
