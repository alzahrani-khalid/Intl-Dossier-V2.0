/**
 * ElectedOfficialListTable
 * Data table for elected officials with filters and pagination.
 * Mobile-first, RTL-compatible, logical properties only.
 */

import type { ReactElement } from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { useElectedOfficials } from '@/domains/elected-officials/hooks/useElectedOfficials'
import type {
  ElectedOfficialFilters,
  ElectedOfficialListItem,
  OfficeType,
} from '@/domains/elected-officials/types/elected-official.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserCheck, Plus } from 'lucide-react'
import { formatPersonLabel, nationalityBadgeText } from '@/lib/person-display'
import { usePersonIdentityEnrichment } from '@/domains/persons/hooks/usePersonIdentityEnrichment'

// ============================================================================
// Filter chips
// ============================================================================

const OFFICE_TYPES: OfficeType[] = [
  'head_of_state',
  'head_of_government',
  'cabinet_minister',
  'legislature_upper',
  'legislature_lower',
  'regional_executive',
  'regional_legislature',
  'local_executive',
  'local_legislature',
  'judiciary',
  'ambassador',
  'international_org',
  'other',
]

// ============================================================================
// Component
// ============================================================================

export function ElectedOfficialListTable(): ReactElement {
  const { t } = useTranslation('elected-officials')
  const { isRTL } = useDirection()
  const [filters, setFilters] = useState<ElectedOfficialFilters>({
    page: 1,
    limit: 20,
  })

  const { data, isLoading, error } = useElectedOfficials(filters)

  // Phase 32 (PBI-06): enrich visible rows with identity + nationality ISO-2.
  // search_persons_advanced doesn't return new identity columns yet; piggyback
  // with a second fetch via @/lib/supabase-client. See Plan 32-04.
  const visibleIds = useMemo(() => (data?.data ?? []).map((item) => item.id), [data?.data])
  const { data: identityMap } = usePersonIdentityEnrichment(visibleIds)
  const locale: 'en' | 'ar' = isRTL ? 'ar' : 'en'

  const handleSearchChange = useCallback((value: string): void => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }, [])

  const handleOfficeTypeChange = useCallback((value: string): void => {
    setFilters((prev) => ({
      ...prev,
      office_type: value !== '' ? (value as OfficeType) : undefined,
      page: 1,
    }))
  }, [])

  const handleTermStatusChange = useCallback((value: string): void => {
    setFilters((prev) => ({
      ...prev,
      is_current_term: value === 'current' ? true : value === 'expired' ? false : undefined,
      page: 1,
    }))
  }, [])

  const handlePrevPage = useCallback((): void => {
    setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))
  }, [])

  const handleNextPage = useCallback((): void => {
    setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
  }, [])

  const currentPage = filters.page ?? 1
  const pageSize = filters.limit ?? 20
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  // Determine display name based on language (D-15 composed name + legacy fallback)
  const getDisplayName = useMemo(() => {
    return (item: ElectedOfficialListItem): string => {
      const enrichment = identityMap?.get(item.id)
      return formatPersonLabel(
        {
          honorific_en: enrichment?.honorific_en ?? null,
          honorific_ar: enrichment?.honorific_ar ?? null,
          first_name_en: enrichment?.first_name_en ?? null,
          last_name_en: enrichment?.last_name_en ?? null,
          first_name_ar: enrichment?.first_name_ar ?? null,
          last_name_ar: enrichment?.last_name_ar ?? null,
          name_en: item.name_en,
          name_ar: item.name_ar,
        },
        locale,
      )
    }
  }, [identityMap, locale])

  // Nationality ISO-2 lookup helper for list-row badge (D-11..D-14)
  const getNationalityBadge = useMemo(() => {
    return (item: ElectedOfficialListItem): string => {
      const enrichment = identityMap?.get(item.id)
      return nationalityBadgeText(enrichment?.nationality_iso_2 ?? null)
    }
  }, [identityMap])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  // Error state
  if (error != null) {
    return (
      <div
        className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6"
        role="alert"
      >
        <h3 className="text-base sm:text-lg font-semibold text-destructive mb-2">
          {t('list.error')}
        </h3>
        <p className="text-sm sm:text-base text-destructive/90">{error.message}</p>
      </div>
    )
  }

  // Empty state
  if (data?.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
        <UserCheck className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2">{t('list.empty')}</h3>
        <Button asChild className="mt-4 min-h-11">
          <Link to="/dossiers/create">
            <Plus className="h-4 w-4 me-2" />
            {t('list.add')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder={t('columns.name')}
          value={filters.search ?? ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs min-h-11"
        />
        <select
          value={filters.office_type ?? ''}
          onChange={(e) => handleOfficeTypeChange(e.target.value)}
          className="min-h-11 rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t('filters.allOfficeTypes')}</option>
          {OFFICE_TYPES.map((ot) => (
            <option key={ot} value={ot}>
              {t(`officeTypes.${ot}`)}
            </option>
          ))}
        </select>
        <select
          value={
            filters.is_current_term === true
              ? 'current'
              : filters.is_current_term === false
                ? 'expired'
                : ''
          }
          onChange={(e) => handleTermStatusChange(e.target.value)}
          className="min-h-11 rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t('filters.allTerms')}</option>
          <option value="current">{t('filters.currentTerm')}</option>
          <option value="expired">{t('filters.expiredTerm')}</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('columns.name')}</TableHead>
              <TableHead className="text-start">{t('columns.office')}</TableHead>
              <TableHead className="text-start">{t('columns.officeType')}</TableHead>
              <TableHead className="text-start">{t('columns.party')}</TableHead>
              <TableHead className="text-start">{t('columns.district')}</TableHead>
              <TableHead className="text-start">{t('columns.termStatus')}</TableHead>
              <TableHead className="text-start">{t('columns.country')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((item) => {
              const badgeText = getNationalityBadge(item)
              return (
                <TableRow key={item.id} className="min-h-11 cursor-pointer hover:bg-accent">
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/dossiers/elected-officials/$id/overview"
                        params={{ id: item.id }}
                        className="hover:text-primary hover:underline"
                      >
                        {getDisplayName(item)}
                      </Link>
                      {badgeText !== '' && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          aria-label={t('columns.country')}
                        >
                          {badgeText}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-start">{item.office_name_en ?? '-'}</TableCell>
                  <TableCell className="text-start">
                    {item.office_type != null ? t(`officeTypes.${item.office_type}`) : '-'}
                  </TableCell>
                  <TableCell className="text-start">{item.party_en ?? '-'}</TableCell>
                  <TableCell className="text-start">{item.district_en ?? '-'}</TableCell>
                  <TableCell>
                    {item.is_current_term === true ? (
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2 py-0.5 text-xs">
                        {t('termStatus.current')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                        {t('termStatus.expired')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-start">{item.country_name_en ?? '-'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {data?.data.map((item) => {
          const badgeText = getNationalityBadge(item)
          return (
            <Link
              key={item.id}
              to="/dossiers/elected-officials/$id/overview"
              params={{ id: item.id }}
              className="block p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors min-h-11"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-base text-start">{getDisplayName(item)}</h3>
                  {badgeText !== '' && (
                    <Badge
                      variant="secondary"
                      className="text-xs flex-shrink-0"
                      aria-label={t('columns.country')}
                    >
                      {badgeText}
                    </Badge>
                  )}
                </div>
                {item.is_current_term === true ? (
                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2 py-0.5 text-xs flex-shrink-0">
                    {t('termStatus.current')}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-xs flex-shrink-0"
                  >
                    {t('termStatus.expired')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {item.office_name_en ?? ''} {item.party_en != null ? `- ${item.party_en}` : ''}
              </p>
              {item.country_name_en != null && (
                <p className="text-xs text-muted-foreground mt-1">{item.country_name_en}</p>
              )}
            </Link>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={handlePrevPage}
            className="min-h-11 min-w-11 w-full sm:w-auto"
          >
            {t('termStatus.expired', { ns: 'common', defaultValue: 'Previous' })}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={handleNextPage}
            className="min-h-11 min-w-11 w-full sm:w-auto"
          >
            {t('termStatus.current', { ns: 'common', defaultValue: 'Next' })}
          </Button>
        </div>
      )}
    </div>
  )
}
