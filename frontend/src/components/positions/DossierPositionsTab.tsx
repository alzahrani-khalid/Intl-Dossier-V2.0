/**
 * Dossier Positions Tab (T053)
 *
 * Displays positions filtered by dossier context with search and filters
 * Features: Virtual scrolling, quick attach/detach, context-aware display
 * Integration: Part of dossier detail tabs
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDossierPositionLinks } from '../../hooks/useDossierPositionLinks'
import { createPositionDossierLink } from '../../domains/positions/repositories/positions.repository'
import { useDossier } from '../../domains/dossiers/hooks/useDossier'
import { PositionList } from './PositionList'
import { AttachPositionDialog } from './AttachPositionDialog'
import { NewPositionDialog } from './NewPositionDialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { PositionStatus, PositionType } from '../../types/position'
import type { PositionDossierLinkType } from '../../domains/positions/types'
import type { DossierContextForAction } from '../../hooks/useAddToDossierActions'

interface DossierPositionsTabProps {
  dossierId: string
}

export function DossierPositionsTab({ dossierId }: DossierPositionsTabProps) {
  const { t, i18n } = useTranslation(['positions', 'common'])
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PositionStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<PositionType | 'all'>('all')
  const [linkTypeFilter, setLinkTypeFilter] = useState<PositionDossierLinkType | 'all'>('all')
  const [showAttachDialog, setShowAttachDialog] = useState(false)
  const [showNewPositionDialog, setShowNewPositionDialog] = useState(false)

  // Cache hit on dossierKeys.detail — the dossier shell already loaded this row,
  // so this resolves immediately (zero extra network). Used to build the
  // create-dialog's dossier context.
  const { data: dossier } = useDossier(dossierId)

  // Debounce search input
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  // Fetch positions linked to this dossier with link_type information
  const { positions, totalCount, isLoading, error } = useDossierPositionLinks(dossierId, {
    link_type: linkTypeFilter === 'all' ? undefined : linkTypeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: debouncedSearch,
  })

  // Build the create-dialog's dossier context from the cached dossier row.
  const dossierContext: DossierContextForAction | null = dossier
    ? {
        dossier_id: dossierId,
        dossier_type: dossier.type,
        dossier_name_en: dossier.name_en,
        dossier_name_ar: dossier.name_ar,
        inheritance_source: 'direct',
      }
    : null

  // Handler for creating a new position — opens the quick-create dialog (D-13).
  const handleCreatePosition = (): void => {
    setShowNewPositionDialog(true)
  }

  // Handler for attaching an existing position (demoted to a secondary action).
  const handleAttachExisting = (): void => {
    setShowAttachDialog(true)
  }

  // Handler for clearing filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setLinkTypeFilter('all')
  }

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || linkTypeFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            {t('positions:dossier_tab.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('positions:dossier_tab.subtitle', { count: totalCount })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCreatePosition}
            // The dialog only renders once the dossier row has loaded; without
            // this guard the click is a silent no-op while useDossier is
            // loading or errored (WR-03).
            disabled={dossierContext === null}
            className="w-full sm:w-auto min-h-11"
            aria-label={t('positions:dossier_tab.create_position')}
          >
            {t('positions:dossier_tab.create_position')}
          </Button>
          <Button
            variant="outline"
            onClick={handleAttachExisting}
            className="w-full sm:w-auto min-h-11"
            aria-label={t('positions:dossier_tab.attach_existing')}
          >
            {t('positions:dossier_tab.attach_existing')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              type="search"
              placeholder={t('positions:dossier_tab.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              aria-label={t('positions:dossier_tab.search_label')}
            />
          </div>

          {/* Link Type Filter - NEW */}
          <div>
            <Select
              value={linkTypeFilter}
              onValueChange={(value) => setLinkTypeFilter(value as PositionDossierLinkType | 'all')}
            >
              <SelectTrigger aria-label={t('positions:position_dossier_links.link_type')}>
                <SelectValue placeholder={t('positions:dossier_tab.all_link_types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('positions:dossier_tab.all_link_types')}</SelectItem>
                <SelectItem value="applies_to">
                  {t('positions:position_dossier_links.types.applies_to')}
                </SelectItem>
                <SelectItem value="related_to">
                  {t('positions:position_dossier_links.types.related_to')}
                </SelectItem>
                <SelectItem value="endorsed_by">
                  {t('positions:position_dossier_links.types.endorsed_by')}
                </SelectItem>
                <SelectItem value="opposed_by">
                  {t('positions:position_dossier_links.types.opposed_by')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PositionStatus | 'all')}
            >
              <SelectTrigger aria-label={t('positions:dossier_tab.status_filter')}>
                <SelectValue placeholder={t('positions:dossier_tab.all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('positions:dossier_tab.all_statuses')}</SelectItem>
                <SelectItem value="draft">{t('positions:status.draft')}</SelectItem>
                <SelectItem value="under_review">{t('positions:status.under_review')}</SelectItem>
                <SelectItem value="approved">{t('positions:status.approved')}</SelectItem>
                <SelectItem value="published">{t('positions:status.published')}</SelectItem>
                <SelectItem value="unpublished">{t('positions:status.unpublished')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              aria-label={t('positions:dossier_tab.clear_filters')}
            >
              {t('positions:dossier_tab.clear_filters')}
            </Button>
          </div>
        )}
      </div>

      {/* Positions List */}
      {error ? (
        <div
          className="bg-danger/5 dark:bg-danger/20 border border-danger/20 dark:border-danger/70 rounded-lg p-6 text-center"
          role="alert"
        >
          <p className="text-sm text-danger">
            {error instanceof Error ? error.message : t('positions:dossier_tab.error_loading')}
          </p>
        </div>
      ) : (
        <PositionList
          positions={positions}
          isLoading={isLoading}
          context="dossier"
          contextId={dossierId}
          hideFilters={true}
          emptyMessage={
            hasActiveFilters
              ? t('positions:dossier_tab.no_results')
              : t('positions:dossier_tab.no_positions')
          }
        />
      )}

      {/* Attach Position Dialog */}
      {showAttachDialog && (
        <AttachPositionDialog
          engagementId=""
          dossierId={dossierId}
          attachedPositionIds={positions.map((p) => p.id)}
          onAttach={async (positionIds) => {
            // Persist each selected position as a position_dossier_link. The
            // dialog previously discarded the selection (no-op), so attaching
            // never added rows to the tab (R12-06).
            const results = await Promise.allSettled(
              positionIds.map((positionId) =>
                createPositionDossierLink(positionId, { dossier_id: dossierId }),
              ),
            )
            const failed = results.filter((r) => r.status === 'rejected').length
            // Invalidate the dossier-scoped reader (the mutation hook only knows
            // the inverse position-detail key) so the new rows render.
            await queryClient.invalidateQueries({
              queryKey: ['dossier-position-links', dossierId],
            })
            if (failed > 0) {
              toast.error(
                t('positions:attach.attachPartialError', {
                  failed,
                  total: positionIds.length,
                  defaultValue: 'Failed to attach {{failed}} of {{total}} positions',
                }),
              )
            } else {
              toast.success(
                t('positions:attach.attachSuccess', {
                  count: positionIds.length,
                  defaultValue: 'Attached {{count}} position(s)',
                }),
              )
            }
            setShowAttachDialog(false)
          }}
        />
      )}

      {/* New Position Dialog (quick-create) — rendered once the dossier row is
          cached so the context badge has its names/type. */}
      {dossierContext && (
        <NewPositionDialog
          isOpen={showNewPositionDialog}
          onClose={() => setShowNewPositionDialog(false)}
          dossierContext={dossierContext}
          isRTL={isRTL}
        />
      )}
    </div>
  )
}
