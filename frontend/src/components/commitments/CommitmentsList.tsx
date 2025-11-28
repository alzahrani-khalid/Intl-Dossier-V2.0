/**
 * CommitmentsList Component v1.1
 * Feature: 031-commitments-management
 * Tasks: T025, T026, T043, T044, T061, T064, T065, T066
 *
 * Displays a list of commitments with:
 * - CommitmentCard components
 * - Create commitment dialog integration
 * - Filter drawer and chips integration (T043)
 * - Empty state when no results match filters (T044)
 * - Detail drawer on card tap (T061)
 * - Infinite scroll pagination (T064, T065, T066)
 * - Mobile-first, RTL-compatible, accessible
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Filter,
  SearchX,
  Loader2,
} from 'lucide-react';
import { useInfiniteCommitments } from '@/hooks/useCommitments';
import { CommitmentCard } from './CommitmentCard';
import { CommitmentForm } from './CommitmentForm';
import { CommitmentFilterDrawer } from './CommitmentFilterDrawer';
import { CommitmentDetailDrawer } from './CommitmentDetailDrawer';
import { FilterChips } from './FilterChips';
import type {
  CommitmentStatus,
  CommitmentPriority,
  Commitment,
  CommitmentFilters,
} from '@/types/commitment.types';

export interface CommitmentsListProps {
  dossierId?: string;
  status?: CommitmentStatus[];
  priority?: CommitmentPriority[];
  ownerId?: string;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  showFilters?: boolean;
  showCreateButton?: boolean;
  onFiltersChange?: (filters: CommitmentFilters) => void;
}

export function CommitmentsList({
  dossierId,
  status,
  priority,
  ownerId,
  overdue,
  dueDateFrom,
  dueDateTo,
  showFilters = false,
  showCreateButton = true,
  onFiltersChange,
}: CommitmentsListProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // State for create/edit dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  // T061: State for detail drawer
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null);

  // Build filters from props
  const filters: CommitmentFilters = {
    dossierId,
    status,
    priority,
    ownerId,
    overdue,
    dueDateFrom,
    dueDateTo,
  };

  // Local filter state for the drawer
  const [localFilters, setLocalFilters] = useState<CommitmentFilters>(filters);

  // T064: Ref for scroll detection
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch commitments with infinite scroll pagination
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCommitments({
    dossierId,
    status,
    priority,
    ownerId,
    overdue,
    dueDateFrom,
    dueDateTo,
  });

  // T064: Scroll detection using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Flatten pages into single array of commitments
  const allCommitments = data?.pages.flatMap((page) => page.commitments) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Handle edit commitment
  const handleEdit = (commitment: Commitment) => {
    setEditingCommitment(commitment);
  };

  // T061: Handle card click - open detail drawer
  const handleCardClick = (commitmentId: string) => {
    setSelectedCommitmentId(commitmentId);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingCommitment(null);
  };

  // Handle filter changes from drawer
  const handleFiltersChange = useCallback((newFilters: CommitmentFilters) => {
    setLocalFilters(newFilters);
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    onFiltersChange?.(localFilters);
  }, [localFilters, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: CommitmentFilters = { dossierId };
    setLocalFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [dossierId, onFiltersChange]);

  // T043: Remove individual filter from chips
  const handleRemoveFilter = useCallback(
    (key: keyof CommitmentFilters, value?: string) => {
      const newFilters = { ...filters };

      if (key === 'status' && value) {
        newFilters.status = filters.status?.filter((s) => s !== value);
        if (newFilters.status?.length === 0) newFilters.status = undefined;
      } else if (key === 'priority' && value) {
        newFilters.priority = filters.priority?.filter((p) => p !== value);
        if (newFilters.priority?.length === 0) newFilters.priority = undefined;
      } else {
        (newFilters as Record<string, unknown>)[key] = undefined;
      }

      setLocalFilters(newFilters);
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Check if any filters are active (excluding dossierId)
  const hasActiveFilters =
    (filters.status?.length || 0) > 0 ||
    (filters.priority?.length || 0) > 0 ||
    !!filters.ownerId ||
    !!filters.ownerType ||
    !!filters.overdue ||
    !!filters.dueDateFrom ||
    !!filters.dueDateTo;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t('errors.loadFailed')}
            {error?.message && `: ${error.message}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // T044: Empty state when no results match filters
  if (!data || allCommitments.length === 0) {
    const isFiltered = hasActiveFilters;

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header with filter button even when empty */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-start">
              {t('title')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => setShowFilterDrawer(true)}
              >
                <Filter className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('filters.title')}
                {hasActiveFilters && (
                  <span className="ms-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                    {(filters.status?.length || 0) +
                      (filters.priority?.length || 0) +
                      (filters.ownerId ? 1 : 0) +
                      (filters.ownerType ? 1 : 0) +
                      (filters.overdue ? 1 : 0) +
                      (filters.dueDateFrom ? 1 : 0) +
                      (filters.dueDateTo ? 1 : 0)}
                  </span>
                )}
              </Button>
              {showCreateButton && dossierId && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  className="min-h-11"
                >
                  <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.create')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Filter chips when empty but filtered */}
        {isFiltered && (
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />
        )}

        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          {isFiltered ? (
            <>
              <SearchX className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('list.emptyFiltered')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {t('list.emptyFiltered')}
              </p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="min-h-11"
              >
                {t('filters.clear')}
              </Button>
            </>
          ) : (
            <>
              <CheckCircle className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('list.empty')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {t('list.empty')}
              </p>
              {showCreateButton && dossierId && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="min-h-11"
                >
                  <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.create')}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Filter Drawer */}
        <CommitmentFilterDrawer
          open={showFilterDrawer}
          onOpenChange={setShowFilterDrawer}
          filters={localFilters}
          onFiltersChange={handleFiltersChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        {/* Create Dialog */}
        {dossierId && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent
              className="max-w-lg max-h-[90vh] overflow-y-auto"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <DialogHeader>
                <DialogTitle className="text-start">
                  {t('actions.create')}
                </DialogTitle>
              </DialogHeader>
              <CommitmentForm
                dossierId={dossierId}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with count and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-start">
          {t('title')}
          <span className="ms-2 text-sm font-normal text-muted-foreground">
            ({totalCount})
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setShowFilterDrawer(true)}
            >
              <Filter className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('filters.title')}
              {hasActiveFilters && (
                <span className="ms-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {(filters.status?.length || 0) +
                    (filters.priority?.length || 0) +
                    (filters.ownerType ? 1 : 0) +
                    (filters.overdue ? 1 : 0) +
                    (filters.dueDateFrom ? 1 : 0) +
                    (filters.dueDateTo ? 1 : 0)}
                </span>
              )}
            </Button>
          )}
          {showCreateButton && dossierId && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="min-h-11"
            >
              <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('actions.create')}
            </Button>
          )}
        </div>
      </div>

      {/* T043: Filter chips above list */}
      {hasActiveFilters && (
        <FilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />
      )}

      {/* Commitments Grid - Mobile First */}
      <div className="grid grid-cols-1 gap-4">
        {allCommitments.map((commitment) => (
          <CommitmentCard
            key={commitment.id}
            commitment={commitment}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* T064: Scroll detection trigger and T065: Loading indicator */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">{t('list.loading')}</span>
          </div>
        )}
        {hasNextPage && !isFetchingNextPage && (
          <p className="text-sm text-muted-foreground text-center">
            {t('list.loadMore')}
          </p>
        )}
      </div>

      {/* T066: End of list indicator */}
      {!hasNextPage && allCommitments.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t('list.endOfList')}
        </p>
      )}

      {/* Filter Drawer */}
      <CommitmentFilterDrawer
        open={showFilterDrawer}
        onOpenChange={setShowFilterDrawer}
        filters={localFilters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Create Dialog */}
      {dossierId && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent
            className="max-w-lg max-h-[90vh] overflow-y-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <DialogHeader>
              <DialogTitle className="text-start">
                {t('actions.create')}
              </DialogTitle>
            </DialogHeader>
            <CommitmentForm
              dossierId={dossierId}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Sheet (bottom sheet on mobile, side panel on desktop) */}
      <Sheet
        open={!!editingCommitment}
        onOpenChange={(open) => !open && setEditingCommitment(null)}
      >
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-lg overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <SheetHeader>
            <SheetTitle className="text-start">
              {t('actions.edit')}
            </SheetTitle>
          </SheetHeader>
          {editingCommitment && dossierId && (
            <div className="mt-6">
              <CommitmentForm
                dossierId={dossierId}
                commitment={editingCommitment}
                onSuccess={handleFormSuccess}
                onCancel={() => setEditingCommitment(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
