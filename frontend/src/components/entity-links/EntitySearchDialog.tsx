/**
 * Entity Search Dialog Component
 * Feature: 024-intake-entity-linking
 * Task: T047
 *
 * Mobile-first search dialog for finding entities to link
 * with FR-001a ranking (AI 50% + recency 30% + alphabetical 20%)
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useEntitySearchState, formatEntityType } from '@/hooks/use-entity-search';
import { useEntityLinks } from '@/hooks/use-entity-links';
import type { EntitySearchResult, EntityType } from '../../../../backend/src/types/intake-entity-links.types';

/**
 * Entity type filter options
 */
const ENTITY_TYPES: EntityType[] = [
  'dossier',
  'position',
  'mou',
  'engagement',
  'assignment',
  'commitment',
  'intelligence_signal',
  'organization',
  'country',
  'forum',
  'working_group',
  'topic',
];

export interface EntitySearchDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when entities are selected (batch mode) */
  onSelect: (entities: EntitySearchResult[], shouldReplacePrimary?: boolean) => void;
  /** Intake ID for fetching existing links */
  intakeId: string;
  /** Organization ID filter */
  organizationId?: string;
  /** Classification level filter */
  classificationLevel?: number;
  /** Whether to include archived entities */
  includeArchived?: boolean;
}

/**
 * EntitySearchDialog Component
 *
 * Provides a search interface for finding entities to link.
 * Results are ranked by AI confidence, recency, and alphabetical order.
 *
 * @example
 * ```tsx
 * <EntitySearchDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSelect={(entity) => createLink(entity)}
 *   organizationId={currentOrgId}
 * />
 * ```
 */
export function EntitySearchDialog({
  open,
  onOpenChange,
  onSelect,
  intakeId,
  organizationId,
  classificationLevel,
  includeArchived = false,
}: EntitySearchDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State for selected entities (multi-select)
  const [selectedEntities, setSelectedEntities] = useState<EntitySearchResult[]>([]);
  // State for which entity should be primary (only one allowed)
  const [primaryEntityKey, setPrimaryEntityKey] = useState<string | null>(null);

  const {
    query,
    setQuery,
    selectedTypes,
    toggleEntityType,
    clearFilters,
    data: results,
    isLoading,
    error,
  } = useEntitySearchState(
    {
      organization_id: organizationId,
      classification_level: classificationLevel,
      include_archived: includeArchived,
    },
    {
      debounceMs: 300,
      minQueryLength: 2,
      enabled: open,
      limit: 20,
    }
  );

  // Fetch existing links to highlight already-linked entities
  const { data: existingLinks } = useEntityLinks(intakeId, false);

  // Create a Set of already-linked entity IDs for quick lookup
  const linkedEntityIds = useMemo(() => {
    if (!existingLinks) return new Set<string>();
    return new Set(
      existingLinks.map((link) => `${link.entity_type}-${link.entity_id}`)
    );
  }, [existingLinks]);

  // Check if there's an existing primary link
  const existingPrimaryLink = useMemo(() => {
    if (!existingLinks) return null;
    return existingLinks.find((link) => link.link_type === 'primary');
  }, [existingLinks]);

  // Check if user has selected a new primary
  const willReplacePrimary = useMemo(() => {
    return !!existingPrimaryLink && !!primaryEntityKey;
  }, [existingPrimaryLink, primaryEntityKey]);

  // Toggle entity selection
  const handleToggleSelect = useCallback(
    (entity: EntitySearchResult) => {
      const entityKey = `${entity.entity_type}-${entity.entity_id}`;
      const isSelected = selectedEntities.some(
        (e) => `${e.entity_type}-${e.entity_id}` === entityKey
      );

      if (isSelected) {
        setSelectedEntities(
          selectedEntities.filter(
            (e) => `${e.entity_type}-${e.entity_id}` !== entityKey
          )
        );
      } else {
        setSelectedEntities([...selectedEntities, entity]);
      }
    },
    [selectedEntities]
  );

  // Submit selected entities with primary designation
  const handleSubmit = useCallback(() => {
    if (selectedEntities.length > 0) {
      // Add primary designation to entities
      const entitiesWithPrimary = selectedEntities.map((entity) => ({
        ...entity,
        _shouldBePrimary: `${entity.entity_type}-${entity.entity_id}` === primaryEntityKey,
      }));
      // Pass replacement flag if user is replacing an existing primary
      onSelect(entitiesWithPrimary, willReplacePrimary);
      onOpenChange(false);
      setQuery('');
      clearFilters();
      setSelectedEntities([]);
      setPrimaryEntityKey(null);
    }
  }, [selectedEntities, primaryEntityKey, willReplacePrimary, onSelect, onOpenChange, setQuery, clearFilters]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setQuery('');
    clearFilters();
    setSelectedEntities([]);
    setPrimaryEntityKey(null);
  }, [onOpenChange, setQuery, clearFilters]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          // Mobile-first sizing
          'max-w-full sm:max-w-2xl',
          'h-[90vh] sm:h-[80vh]', // Always constrain height for scrolling
          'mx-0 sm:mx-auto',
          'p-0',

          // RTL support
          isRTL && 'text-end'
        )}
      >
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className={cn(
            'text-lg sm:text-xl',
            'text-start'
          )}>
            {t('entityLinks.searchDialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-start">
            {t('entityLinks.searchDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Search input */}
          <div className={cn(
            'px-4 pb-3 sm:px-6 sm:pb-4',
            'border-b'
          )}>
            <div className="relative">
              <Search className={cn(
                'absolute top-1/2 -translate-y-1/2',
                'h-4 w-4 sm:h-5 sm:w-5',
                'text-slate-400',
                isRTL ? 'end-3' : 'start-3'
              )} />
              <Input
                type="text"
                placeholder={t('entityLinks.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(
                  'w-full',
                  'text-sm sm:text-base',
                  'min-h-11', // 44px touch target
                  isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3'
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
                autoFocus
                aria-label={t('entityLinks.searchInput')}
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2',
                    'h-8 w-8 sm:h-9 sm:w-9',
                    isRTL ? 'start-1' : 'end-1'
                  )}
                  onClick={() => setQuery('')}
                  aria-label={t('common.clear')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Entity type filters */}
          <div className={cn(
            'px-4 py-3 sm:px-6',
            'border-b bg-slate-50/50 dark:bg-slate-900/20'
          )}>
            {/* Filter header with clear button */}
            <div className={cn(
              'flex items-center justify-between mb-3',
              isRTL && 'flex-row-reverse'
            )}>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {selectedTypes && selectedTypes.length > 0
                  ? `${selectedTypes.length} ${t('entityLinks.filtersSelected', { count: selectedTypes.length })}`
                  : t('entityLinks.filterByType')}
              </span>
              {selectedTypes && selectedTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={clearFilters}
                >
                  {t('common.clearFilters')}
                </Button>
              )}
            </div>

            {/* Scrollable filter chips */}
            <ScrollArea className="w-full">
              <div className={cn(
                'flex gap-2 pb-2',
                isRTL && 'flex-row-reverse'
              )}>
                {ENTITY_TYPES.map((type) => {
                  const isSelected = selectedTypes?.includes(type);
                  return (
                    <Button
                      key={type}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'min-h-9 px-3 flex-shrink-0', // Touch-friendly
                        'text-xs',
                        'touch-manipulation',
                        'whitespace-nowrap',
                        'transition-all duration-200',
                        isSelected && 'shadow-sm'
                      )}
                      onClick={() => toggleEntityType(type)}
                      aria-label={t(`entityLinks.entityTypes.${type}`)}
                      aria-pressed={isSelected}
                    >
                      {formatEntityType(type)}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Search results */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <span className={cn(
                    'text-sm text-slate-500',
                    isRTL ? 'me-3' : 'ms-3'
                  )}>
                    {t('common.loading')}
                  </span>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">
                    {t('entityLinks.searchError')}
                  </p>
                </div>
              )}

              {/* Empty state - no query yet */}
              {!isLoading && !error && query.length < 2 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {t('entityLinks.searchTitle', 'Find and link entities')}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    {t('entityLinks.searchEmptyState', 'Enter at least 2 characters to search for dossiers, positions, countries, and more')}
                  </p>
                </div>
              )}

              {/* No results state */}
              {!isLoading && !error && query.length >= 2 && results?.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {t('entityLinks.noResultsTitle', 'No entities found')}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    {t('entityLinks.noResults', `No entities match "${query}"`)}
                  </p>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>{t('entityLinks.searchTips', 'Try:')}</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>{t('entityLinks.tip1', 'Using fewer or different keywords')}</li>
                      <li>{t('entityLinks.tip2', 'Checking your spelling')}</li>
                      <li>{t('entityLinks.tip3', 'Clearing filters to search all entity types')}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Results list */}
              {!isLoading && !error && results && results.length > 0 && (
                <div className="space-y-2">
                  {results.map((entity) => {
                    const entityKey = `${entity.entity_type}-${entity.entity_id}`;
                    const isAlreadyLinked = linkedEntityIds.has(entityKey);
                    const isSelected = selectedEntities.some(
                      (e) => `${e.entity_type}-${e.entity_id}` === entityKey
                    );

                    return (
                      <div
                        key={entityKey}
                        className={cn(
                          'w-full',
                          'min-h-16 sm:min-h-14', // Touch-friendly
                          'px-3 py-2 sm:px-4 sm:py-3',
                          'border rounded-lg',
                          'transition-all duration-200',
                          !isAlreadyLinked && 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer',
                          isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
                          isAlreadyLinked && 'bg-slate-50 dark:bg-slate-800 opacity-60 cursor-not-allowed',

                          // RTL support
                          'text-start',
                          isRTL && 'text-end'
                        )}
                        onClick={() => !isAlreadyLinked && handleToggleSelect(entity)}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-disabled={isAlreadyLinked}
                        aria-label={t('entityLinks.selectEntity', { name: entity.name })}
                        tabIndex={isAlreadyLinked ? -1 : 0}
                        onKeyDown={(e) => {
                          if (!isAlreadyLinked && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleToggleSelect(entity);
                          }
                        }}
                      >
                        <div className={cn(
                          'flex items-start gap-3',
                          isRTL && 'flex-row-reverse'
                        )}>
                          {/* Checkbox */}
                          {!isAlreadyLinked && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(entity)}
                              className="mt-1"
                              aria-hidden="true" // Handled by parent div
                            />
                          )}
                          {isAlreadyLinked && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                          )}

                          {/* Primary radio button (only for dossier/position if selected) */}
                          {!isAlreadyLinked && isSelected && (entity.entity_type === 'dossier' || entity.entity_type === 'position') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryEntityKey(entityKey);
                              }}
                              className={cn(
                                'flex items-center gap-1.5',
                                'px-2 py-1 rounded text-xs',
                                'transition-colors duration-200',
                                'touch-manipulation',
                                primaryEntityKey === entityKey
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                              )}
                              aria-label={t('entityLinks.setPrimary')}
                            >
                              <div className={cn(
                                'w-3 h-3 rounded-full border-2 flex items-center justify-center',
                                primaryEntityKey === entityKey
                                  ? 'border-green-600 dark:border-green-400'
                                  : 'border-slate-400'
                              )}>
                                {primaryEntityKey === entityKey && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                                )}
                              </div>
                              <span className="font-medium">
                                {primaryEntityKey === entityKey ? t('entityLinks.primary') : t('entityLinks.setPrimary')}
                              </span>
                            </button>
                          )}

                          {/* Entity info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Entity name */}
                            <div className={cn(
                              'flex items-center gap-2 flex-wrap',
                              isRTL && 'flex-row-reverse'
                            )}>
                              <h4 className={cn(
                                'text-sm sm:text-base font-semibold',
                                'truncate flex-1 min-w-0',
                                'text-start'
                              )}>
                                {entity.name}
                              </h4>
                              {/* Entity type badge */}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex-shrink-0 text-xs",
                                  "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                )}
                              >
                                {formatEntityType(entity.entity_type)}
                              </Badge>
                              {/* Already linked badge */}
                              {isAlreadyLinked && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex-shrink-0 text-xs",
                                    "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                  )}
                                >
                                  {t('entityLinks.alreadyLinked', 'Already linked')}
                                </Badge>
                              )}
                            </div>

                            {/* Description (if available) */}
                            {entity.description && (
                              <p className={cn(
                                'text-xs text-slate-600 dark:text-slate-400',
                                'line-clamp-2',
                                'text-start'
                              )}>
                                {entity.description}
                              </p>
                            )}

                            {/* Metadata row */}
                            <div className={cn(
                              'flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400',
                              isRTL && 'flex-row-reverse'
                            )}>
                              {/* AI confidence score (if available) */}
                              {entity.similarity_score !== undefined && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Match:</span>
                                  <span className={cn(
                                    "font-semibold",
                                    entity.similarity_score > 0.7 ? "text-green-600 dark:text-green-400" :
                                    entity.similarity_score > 0.4 ? "text-yellow-600 dark:text-yellow-400" :
                                    "text-slate-500"
                                  )}>
                                    {Math.round(entity.similarity_score * 100)}%
                                  </span>
                                </span>
                              )}

                              {/* Classification level (if available) */}
                              {entity.classification_level !== undefined && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Level:</span>
                                  <span>{entity.classification_level}</span>
                                </span>
                              )}

                              {/* Last linked date (if available) */}
                              {entity.last_linked_at && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Last used:</span>
                                  <span>{new Date(entity.last_linked_at).toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer with selected count and submit button */}
          {selectedEntities.length > 0 && (
            <div className={cn(
              'px-4 py-3 sm:px-6 sm:py-4',
              'border-t bg-slate-50/50 dark:bg-slate-900/20',
              'space-y-2'
            )}>
              {/* Warning message when replacing primary */}
              {willReplacePrimary && existingPrimaryLink && (
                <div className={cn(
                  'flex items-start gap-2 p-2 sm:p-3',
                  'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg',
                  isRTL && 'flex-row-reverse'
                )}>
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs sm:text-sm text-amber-800 dark:text-amber-200',
                      'text-start'
                    )}>
                      {t('entityLinks.replacePrimaryWarning', {
                        defaultValue: `This will replace the existing primary link (${(existingPrimaryLink as any).entity_name || existingPrimaryLink.entity_id})`,
                        currentPrimary: (existingPrimaryLink as any).entity_name || existingPrimaryLink.entity_id
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Selected count and submit button */}
              <div className={cn(
                'flex items-center justify-between gap-4',
                isRTL && 'flex-row-reverse'
              )}>
                <span className={cn(
                  'text-sm font-medium text-slate-700 dark:text-slate-300',
                  'text-start'
                )}>
                  {t('entityLinks.selectedCount', {
                    count: selectedEntities.length,
                    defaultValue: `${selectedEntities.length} selected`,
                  })}
                </span>
                <Button
                  onClick={handleSubmit}
                  className={cn(
                    'min-h-11 px-4 sm:px-6',
                    'text-sm sm:text-base',
                    'touch-manipulation'
                  )}
                >
                  {t('entityLinks.linkSelected', {
                    count: selectedEntities.length,
                    defaultValue: `Link ${selectedEntities.length} ${selectedEntities.length === 1 ? 'entity' : 'entities'}`,
                  })}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EntitySearchDialog;
