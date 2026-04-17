/**
 * Persons List Page (Feature 028 - User Story 2)
 *
 * Displays filterable list of person dossiers.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, UserCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { formatPersonLabel, nationalityBadgeText } from '@/lib/person-display'
import { usePersonIdentityEnrichment } from '@/domains/persons/hooks/usePersonIdentityEnrichment'

// URL search params type for dossier list pagination
interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/persons/')({
  component: PersonsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function PersonsListPage() {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  const { page, search: searchQuery } = Route.useSearch()
  const navigate = Route.useNavigate()
  const pageSize = 20

  // Fetch person dossiers
  const { data, isLoading, error } = useDossiersByType('person', page, pageSize)

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

  // Phase 32 (PBI-06): enrich visible rows with identity + nationality ISO-2.
  // The dossiers-list Edge Function only returns dossier-level fields; we batch-
  // fetch persons identity + countries.iso_code_2 for the page's IDs here.
  const visibleIds = useMemo(() => (filteredDossiers ?? []).map((d) => d.id), [filteredDossiers])
  const { data: identityMap } = usePersonIdentityEnrichment(visibleIds)
  const locale: 'en' | 'ar' = isRTL ? 'ar' : 'en'

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
    <div className="space-y-6">
      <PageHeader
        icon={<UserCircle className="h-6 w-6" />}
        title={t('type.person')}
        subtitle={t('typeDescription.person')}
        actions={
          <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
            <Link to="/dossiers/persons/create">
              <Plus className="h-4 w-4 me-2" />
              {t('action.create')}
            </Link>
          </Button>
        }
      />

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
          <UserCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            {searchQuery ? t('list.emptyFiltered') : t('list.empty')}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
            {searchQuery ? t('list.emptyFilteredDescription') : t('list.emptyDescription')}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link to="/dossiers/persons/create">{t('action.create')}</Link>
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
                {filteredDossiers.map((dossier) => {
                  const enrichment = identityMap?.get(dossier.id)
                  const primaryLabel = formatPersonLabel(
                    {
                      honorific_en: enrichment?.honorific_en ?? null,
                      honorific_ar: enrichment?.honorific_ar ?? null,
                      first_name_en: enrichment?.first_name_en ?? null,
                      last_name_en: enrichment?.last_name_en ?? null,
                      first_name_ar: enrichment?.first_name_ar ?? null,
                      last_name_ar: enrichment?.last_name_ar ?? null,
                      name_en: dossier.name_en,
                      name_ar: dossier.name_ar,
                    },
                    'en',
                  )
                  const primaryLabelAr = formatPersonLabel(
                    {
                      honorific_en: enrichment?.honorific_en ?? null,
                      honorific_ar: enrichment?.honorific_ar ?? null,
                      first_name_en: enrichment?.first_name_en ?? null,
                      last_name_en: enrichment?.last_name_en ?? null,
                      first_name_ar: enrichment?.first_name_ar ?? null,
                      last_name_ar: enrichment?.last_name_ar ?? null,
                      name_en: dossier.name_en,
                      name_ar: dossier.name_ar,
                    },
                    'ar',
                  )
                  const iso2 = enrichment?.nationality_iso_2 ?? null
                  const badgeText = nationalityBadgeText(iso2)
                  return (
                    <TableRow key={dossier.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={getDossierDetailPath(dossier.id, 'person')}
                            className="hover:text-primary hover:underline"
                          >
                            {primaryLabel}
                          </Link>
                          {badgeText !== '' && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              aria-label={t('form.nationality', { defaultValue: 'Nationality' })}
                            >
                              {badgeText}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{primaryLabelAr}</TableCell>
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
                          <Link to={getDossierDetailPath(dossier.id, 'person')}>
                            {t('action.view')}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Card List - Mobile */}
          <div className="md:hidden space-y-4">
            {filteredDossiers.map((dossier) => {
              const enrichment = identityMap?.get(dossier.id)
              const primaryLabel = formatPersonLabel(
                {
                  honorific_en: enrichment?.honorific_en ?? null,
                  honorific_ar: enrichment?.honorific_ar ?? null,
                  first_name_en: enrichment?.first_name_en ?? null,
                  last_name_en: enrichment?.last_name_en ?? null,
                  first_name_ar: enrichment?.first_name_ar ?? null,
                  last_name_ar: enrichment?.last_name_ar ?? null,
                  name_en: dossier.name_en,
                  name_ar: dossier.name_ar,
                },
                locale,
              )
              const iso2 = enrichment?.nationality_iso_2 ?? null
              const badgeText = nationalityBadgeText(iso2)
              return (
                <Link
                  key={dossier.id}
                  to={getDossierDetailPath(dossier.id, 'person')}
                  className="block p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors min-h-11"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-base text-start">{primaryLabel}</h3>
                      {badgeText !== '' && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                          aria-label={t('form.nationality', { defaultValue: 'Nationality' })}
                        >
                          {badgeText}
                        </Badge>
                      )}
                    </div>
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
              )
            })}
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
