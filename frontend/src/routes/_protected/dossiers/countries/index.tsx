/**
 * Countries List Page (Feature 028 - User Story 2)
 *
 * Displays filterable list of country dossiers.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Globe2, ChevronRight, Home, X } from 'lucide-react'
import { useDossiersByType } from '@/hooks/useDossier'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useDirection } from '@/hooks/useDirection'

// URL search params type for dossier list pagination
interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/countries/')({
  component: CountriesListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function CountriesListPage() {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  const { page, search: urlSearch } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [searchQuery, setSearchQuery] = useState(urlSearch ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch ?? '')
  const pageSize = 20
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Debounce search input (300ms) to avoid excessive API calls
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      // Reset to page 1 on new search and sync to URL
      void navigate({
        search: (prev: DossierListSearch) => ({
          ...prev,
          search: searchQuery.length > 0 ? searchQuery : undefined,
          page: 1,
        }),
        replace: true,
      })
    }, 300)
    return (): void => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, navigate])

  // Fetch country dossiers with server-side search
  const { data, isLoading, error } = useDossiersByType(
    'country',
    page,
    pageSize,
    debouncedSearch || undefined,
  )

  const filteredDossiers = data?.data

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
      {/* Breadcrumb */}
      <nav
        aria-label={t('nav.breadcrumb', 'Breadcrumb')}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <Link
          to="/dashboard"
          className="hover:text-foreground transition-colors flex items-center gap-1 min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">{t('nav.home', 'Home')}</span>
        </Link>
        <ChevronRight className={`h-3 w-3 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
        <Link
          to="/dossiers"
          className="hover:text-foreground transition-colors min-h-11 flex items-center sm:min-h-0"
        >
          {t('nav.dossiers', 'Dossiers')}
        </Link>
        <ChevronRight className={`h-3 w-3 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
        <span className="text-foreground font-medium">{t('type.country')}</span>
      </nav>

      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Globe2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-start">
              {t('type.country')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t('typeDescription.country')}
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
      <div className="mb-6 relative w-full sm:max-w-md">
        <Input
          type="text"
          placeholder={t('filter.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-11 pe-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors min-h-8 min-w-8 flex items-center justify-center"
            aria-label={t('filter.clearSearch', 'Clear search')}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Loading State - Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {/* Table skeleton for desktop */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16 ms-auto" />
                </div>
              ))}
            </div>
          </div>
          {/* Card skeleton for mobile */}
          <div className="md:hidden space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
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
          <Globe2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
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
                        to={`/dossiers/countries/${dossier.id}`}
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
                        <Link to={`/dossiers/countries/${dossier.id}`}>{t('action.view')}</Link>
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
                to={`/dossiers/countries/${dossier.id}`}
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
