/**
 * Persons List Page (Feature 028 - User Story 2)
 *
 * Displays filterable list of person dossiers.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Users } from 'lucide-react'
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
import { useState } from 'react'

export const Route = createFileRoute('/_protected/dossiers/persons/')({
  component: PersonsListPage,
})

function PersonsListPage() {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Fetch person dossiers
  const { data, isLoading, error } = useDossiersByType('person', page, pageSize)

  // Filter by search query (client-side for now)
  const filteredDossiers = data?.data.filter((dossier) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      dossier.name_en.toLowerCase().includes(searchLower) ||
      dossier.name_ar?.toLowerCase().includes(searchLower) ||
      dossier.description_en?.toLowerCase().includes(searchLower) ||
      dossier.description_ar?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t('type.person')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t('typeDescription.person')}
            </p>
          </div>
        </div>
        <Button asChild>
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
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
          <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
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
                        to={getDossierDetailPath(dossier.id, 'person')}
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={getDossierDetailPath(dossier.id, 'person')}>
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
                to={getDossierDetailPath(dossier.id, 'person')}
                className="block p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
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
          {data && data.total > pageSize && (
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('action.back')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('list.pageInfo', {
                  current: page,
                  total: Math.ceil(data.total / pageSize),
                })}
              </span>
              <Button
                variant="outline"
                disabled={page * pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
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
