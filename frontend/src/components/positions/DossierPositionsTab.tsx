/**
 * Dossier Positions Tab (T053)
 *
 * Displays positions filtered by dossier context with search and filters
 * Features: Virtual scrolling, quick attach/detach, context-aware display
 * Integration: Part of dossier detail tabs
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePositions } from '../../hooks/usePositions';
import { PositionList } from './PositionList';
import { AttachPositionDialog } from './AttachPositionDialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { PositionStatus, PositionType } from '../../types/position';

interface DossierPositionsTabProps {
  dossierId: string;
}

export function DossierPositionsTab({ dossierId }: DossierPositionsTabProps) {
  const { t } = useTranslation(['positions', 'common']);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PositionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PositionType | 'all'>('all');
  const [showAttachDialog, setShowAttachDialog] = useState(false);

  // Debounce search input
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Fetch positions filtered by dossier
  const { data, isLoading, error, fetchNextPage, hasNextPage } = usePositions({
    dossierId,
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    sort: 'updated_at',
    order: 'desc',
    limit: 50, // Fetch more items per page for better performance
  });

  // Flatten infinite query pages into single array
  const positions = useMemo(
    () => data?.pages.flatMap(page => page.data) || [],
    [data]
  );

  const totalCount = data?.pages[0]?.total || 0;

  // Handler for creating new position
  const handleCreatePosition = () => {
    setShowAttachDialog(true);
  };

  // Handler for clearing filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('positions:dossier_tab.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('positions:dossier_tab.subtitle', { count: totalCount })}
          </p>
        </div>
        <Button
          onClick={handleCreatePosition}
          className="w-full sm:w-auto"
          aria-label={t('positions:dossier_tab.create_position')}
        >
          {t('positions:dossier_tab.create_position')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as PositionStatus | 'all')
              }
            >
              <SelectTrigger aria-label={t('positions:dossier_tab.status_filter')}>
                <SelectValue placeholder={t('positions:dossier_tab.all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('positions:dossier_tab.all_statuses')}
                </SelectItem>
                <SelectItem value="draft">
                  {t('positions:status.draft')}
                </SelectItem>
                <SelectItem value="review">
                  {t('positions:status.review')}
                </SelectItem>
                <SelectItem value="approved">
                  {t('positions:status.approved')}
                </SelectItem>
                <SelectItem value="published">
                  {t('positions:status.published')}
                </SelectItem>
                <SelectItem value="archived">
                  {t('positions:status.archived')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as PositionType | 'all')}
            >
              <SelectTrigger aria-label={t('positions:dossier_tab.type_filter')}>
                <SelectValue placeholder={t('positions:dossier_tab.all_types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('positions:dossier_tab.all_types')}
                </SelectItem>
                <SelectItem value="statement">
                  {t('positions:type.statement')}
                </SelectItem>
                <SelectItem value="brief">
                  {t('positions:type.brief')}
                </SelectItem>
                <SelectItem value="talking_points">
                  {t('positions:type.talking_points')}
                </SelectItem>
                <SelectItem value="q_and_a">
                  {t('positions:type.q_and_a')}
                </SelectItem>
                <SelectItem value="guidance">
                  {t('positions:type.guidance')}
                </SelectItem>
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
              {t('common:clear_filters')}
            </Button>
          </div>
        )}
      </div>

      {/* Positions List */}
      {error ? (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            {error instanceof Error
              ? error.message
              : t('positions:dossier_tab.error_loading')}
          </p>
        </div>
      ) : (
        <PositionList
          positions={positions}
          isLoading={isLoading}
          context="dossier"
          dossierId={dossierId}
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
          open={showAttachDialog}
          onClose={() => setShowAttachDialog(false)}
          context="dossier"
          contextId={dossierId}
        />
      )}
    </div>
  );
}
