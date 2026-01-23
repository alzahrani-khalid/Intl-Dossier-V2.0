/**
 * Countries List Page (Feature 028 - User Story 2)
 *
 * Displays filterable list of country dossiers.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Globe2 } from 'lucide-react';
import { useDossiersByType } from '@/hooks/useDossier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export const Route = createFileRoute('/_protected/dossiers/countries/')({
  component: CountriesListPage,
});

function CountriesListPage() {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch country dossiers
  const { data, isLoading, error } = useDossiersByType('country', page, pageSize);

  // Filter by search query (client-side for now)
  const filteredDossiers = data?.data.filter((dossier) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      dossier.name_en.toLowerCase().includes(searchLower) ||
      dossier.name_ar?.toLowerCase().includes(searchLower) ||
      dossier.description_en?.toLowerCase().includes(searchLower) ||
      dossier.description_ar?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div
      className="container mx-auto p-4 sm:p-6 lg:p-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Globe2 className="size-6 text-primary sm:size-8" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
              {t('type.country')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {t('typeDescription.country')}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/dossiers/create">
            <Plus className="me-2 size-4" />
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
          <Loader2 className="size-8 animate-spin text-muted-foreground sm:size-10" />
          <span className="ms-3 text-sm text-muted-foreground sm:text-base">
            {t('list.loading')}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 sm:p-6"
          role="alert"
        >
          <h3 className="mb-2 text-base font-semibold text-destructive sm:text-lg">
            {t('list.error')}
          </h3>
          <p className="text-sm text-destructive/90 sm:text-base">
            {error.message}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredDossiers?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16 lg:py-20">
          <Globe2 className="mb-4 size-12 text-muted-foreground sm:size-16" />
          <h3 className="mb-2 text-base font-semibold sm:text-lg">
            {searchQuery ? t('list.emptyFiltered') : t('list.empty')}
          </h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
            {searchQuery
              ? t('list.emptyFilteredDescription')
              : t('list.emptyDescription')}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link to="/dossiers/create">
                {t('action.create')}
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Table - Desktop */}
      {!isLoading && !error && filteredDossiers && filteredDossiers.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dossiers/countries/${dossier.id}`}>
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
          <div className="space-y-4 md:hidden">
            {filteredDossiers.map((dossier) => (
              <Link
                key={dossier.id}
                to={`/dossiers/countries/${dossier.id}`}
                className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">
                    {isRTL ? dossier.name_ar : dossier.name_en}
                  </h3>
                  <Badge variant={dossier.status === 'active' ? 'default' : 'secondary'}>
                    {t(`status.${dossier.status}`)}
                  </Badge>
                </div>
                {(isRTL ? dossier.description_ar : dossier.description_en) && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
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
  );
}
