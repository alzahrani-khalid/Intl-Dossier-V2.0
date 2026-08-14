/**
 * ElectedOfficialListTable
 * Data table for elected officials with filters and pagination.
 * Mobile-first, RTL-compatible, logical properties only.
 */

import type { KeyboardEvent, ReactElement } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { useElectedOfficials } from '@/domains/elected-officials/hooks/useElectedOfficials'
import type {
  ElectedOfficialFilters,
  ElectedOfficialListItem,
  OfficeType,
} from '@/domains/elected-officials/types/elected-official.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ListEmptyState } from '@/components/empty-states/ListEmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPersonLabel, nationalityBadgeText } from '@/lib/person-display'
import { usePersonIdentityEnrichment } from '@/domains/persons/hooks/usePersonIdentityEnrichment'
import type { PeekRegistration } from '@/store/peekStore'

// ============================================================================
// Filter chips
// ============================================================================

export const OFFICE_TYPES: OfficeType[] = [
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

export interface ElectedOfficialListTableProps {
  /** Filter + pagination state, owned by the route as validated URL params. */
  filters: ElectedOfficialFilters
  onPrevPage: () => void
  onNextPage: () => void
  onCreate?: () => void
  onClearFilters?: () => void
  onOpenElectedOfficial?: (item: ElectedOfficialListItem, registration: PeekRegistration) => void
  visibleProperties?: string[]
  filtered?: boolean
}

export function ElectedOfficialListTable({
  filters,
  onPrevPage,
  onNextPage,
  onCreate,
  onClearFilters,
  onOpenElectedOfficial,
  visibleProperties,
  filtered = false,
}: ElectedOfficialListTableProps): ReactElement {
  const { t } = useTranslation('elected-officials')
  const { isRTL } = useDirection()

  const { data, isLoading, error } = useElectedOfficials(filters)

  // Phase 32 (PBI-06): enrich visible rows with identity + nationality ISO-2.
  // search_persons_advanced doesn't return new identity columns yet; piggyback
  // with a second fetch via @/lib/supabase-client. See Plan 32-04.
  const visibleIds = useMemo(() => (data?.data ?? []).map((item) => item.id), [data?.data])
  const { data: identityMap } = usePersonIdentityEnrichment(visibleIds)
  const locale: 'en' | 'ar' = isRTL ? 'ar' : 'en'

  const currentPage = filters.page ?? 1
  const pageSize = filters.limit ?? 20
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const rows = data?.data ?? []
  const visible = new Set(visibleProperties ?? ['party', 'district', 'country'])

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
  if (rows.length === 0) {
    return (
      <ListEmptyState
        entityType="elected_official"
        onCreate={onCreate}
        filtered={filtered}
        onClearFilters={onClearFilters}
      />
    )
  }

  const openRow = (item: ElectedOfficialListItem): void => {
    onOpenElectedOfficial?.(item, {
      ids: rows.map((row) => row.id),
      type: 'elected_official',
      // Server total + real page offset so the peek counter spans the FULL
      // filtered set, not just the loaded page (the route wires fetchPage).
      total,
      pageOffset: (currentPage - 1) * pageSize,
      pageSize,
    })
  }

  const onRowKeyDown = (event: KeyboardEvent, item: ElectedOfficialListItem): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openRow(item)
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('columns.name')}</TableHead>
              <TableHead className="text-start">{t('columns.office')}</TableHead>
              <TableHead className="text-start">{t('columns.officeType')}</TableHead>
              {visible.has('party') ? (
                <TableHead className="text-start">{t('columns.party')}</TableHead>
              ) : null}
              {visible.has('district') ? (
                <TableHead className="text-start">{t('columns.district')}</TableHead>
              ) : null}
              <TableHead className="text-start">{t('columns.termStatus')}</TableHead>
              {visible.has('country') ? (
                <TableHead className="text-start">{t('columns.country')}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const badgeText = getNationalityBadge(item)
              return (
                <TableRow
                  key={item.id}
                  tabIndex={0}
                  onClick={() => openRow(item)}
                  onKeyDown={(event) => onRowKeyDown(event, item)}
                  className="min-h-11 cursor-pointer hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{getDisplayName(item)}</span>
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
                  {visible.has('party') ? (
                    <TableCell className="text-start">{item.party_en ?? '-'}</TableCell>
                  ) : null}
                  {visible.has('district') ? (
                    <TableCell className="text-start">{item.district_en ?? '-'}</TableCell>
                  ) : null}
                  <TableCell>
                    {item.is_current_term === true ? (
                      <Badge className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs">
                        {t('termStatus.current')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                        {t('termStatus.expired')}
                      </Badge>
                    )}
                  </TableCell>
                  {visible.has('country') ? (
                    <TableCell className="text-start">{item.country_name_en ?? '-'}</TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {rows.map((item) => {
          const badgeText = getNationalityBadge(item)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openRow(item)}
              className="block w-full p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors min-h-11 text-start"
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
                  <Badge className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs flex-shrink-0">
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
                {item.office_name_en ?? ''}
                {visible.has('party') && item.party_en != null ? ` - ${item.party_en}` : ''}
              </p>
              {visible.has('country') && item.country_name_en != null && (
                <p className="text-xs text-muted-foreground mt-1">{item.country_name_en}</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={onPrevPage}
            className="min-h-11 min-w-11 w-full sm:w-auto"
          >
            {t('common.previous', { ns: 'common', defaultValue: 'Previous' })}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={onNextPage}
            className="min-h-11 min-w-11 w-full sm:w-auto"
          >
            {t('common.next', { ns: 'common', defaultValue: 'Next' })}
          </Button>
        </div>
      )}
    </div>
  )
}
