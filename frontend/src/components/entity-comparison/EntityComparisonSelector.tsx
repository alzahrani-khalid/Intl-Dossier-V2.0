/**
 * EntityComparisonSelector Component
 * @feature entity-comparison-view
 *
 * Entity selection interface for choosing multiple entities
 * of the same type to compare. Supports search, multi-select,
 * and type filtering.
 */

import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Check,
  X,
  ArrowRight,
  Building2,
  Globe,
  User,
  Users,
  Calendar,
  MessageSquare,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDossiersByType } from '@/hooks/useDossier'
import type { DossierType } from '@/lib/dossier-type-guards'
import type { DossierWithExtension } from '@/services/dossier-api'
import { MIN_COMPARISON_ENTITIES, MAX_COMPARISON_ENTITIES } from '@/types/entity-comparison.types'

/**
 * Props for EntityComparisonSelector
 */
interface EntityComparisonSelectorProps {
  selectedType: DossierType | null
  onTypeChange: (type: DossierType | null) => void
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onCompare: () => void
  minSelections?: number
  maxSelections?: number
  className?: string
}

/**
 * Entity type options with icons
 */
const ENTITY_TYPE_OPTIONS: { value: DossierType; icon: React.ReactNode }[] = [
  { value: 'country', icon: <Globe className="h-4 w-4" /> },
  { value: 'organization', icon: <Building2 className="h-4 w-4" /> },
  { value: 'person', icon: <User className="h-4 w-4" /> },
  { value: 'engagement', icon: <Calendar className="h-4 w-4" /> },
  { value: 'forum', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'working_group', icon: <Users className="h-4 w-4" /> },
  { value: 'topic', icon: <Tag className="h-4 w-4" /> },
]

/**
 * Get icon for entity type
 */
function getEntityTypeIcon(type: DossierType): React.ReactNode {
  const option = ENTITY_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.icon ?? <Tag className="h-4 w-4" />
}

/**
 * Entity card component for selection
 */
const EntityCard = memo(function EntityCard({
  entity,
  isSelected,
  onToggle,
  isRTL,
}: {
  entity: DossierWithExtension
  isSelected: boolean
  onToggle: (id: string) => void
  isRTL: boolean
}) {
  const { t } = useTranslation('entity-comparison')

  return (
    <button
      type="button"
      onClick={() => onToggle(entity.id)}
      className={cn(
        'w-full text-start p-3 sm:p-4 rounded-lg border transition-all',
        'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-muted-foreground/30',
      )}
      aria-label={
        isSelected
          ? t('accessibility.deselectEntity', { name: isRTL ? entity.name_ar : entity.name_en })
          : t('accessibility.selectEntity', { name: isRTL ? entity.name_ar : entity.name_en })
      }
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30',
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm sm:text-base truncate">
            {isRTL ? entity.name_ar : entity.name_en}
          </h4>
          {entity.name_ar && entity.name_en && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
              {isRTL ? entity.name_en : entity.name_ar}
            </p>
          )}
        </div>
        {isSelected && (
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            {t('difference.same')}
          </Badge>
        )}
      </div>
    </button>
  )
})

/**
 * Loading skeleton for entity cards
 */
function EntityCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 rounded-lg border border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

/**
 * Main EntityComparisonSelector component
 */
export const EntityComparisonSelector = memo(function EntityComparisonSelector({
  selectedType,
  onTypeChange,
  selectedIds,
  onSelectionChange,
  searchQuery,
  onSearchChange,
  onCompare,
  minSelections = MIN_COMPARISON_ENTITIES,
  maxSelections = MAX_COMPARISON_ENTITIES,
  className,
}: EntityComparisonSelectorProps) {
  const { t, i18n } = useTranslation('entity-comparison')
  const isRTL = i18n.language === 'ar'

  // Fetch entities when type is selected
  const { data: entitiesData, isLoading } = useDossiersByType(selectedType || 'country', 1, 50, {
    enabled: !!selectedType,
  })

  const entities = entitiesData?.dossiers || []

  // Filter entities by search query
  const filteredEntities = entities.filter((entity) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const nameEn = entity.name_en?.toLowerCase() || ''
    const nameAr = entity.name_ar?.toLowerCase() || ''
    return nameEn.includes(query) || nameAr.includes(query)
  })

  // Toggle entity selection
  const handleToggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((existingId) => existingId !== id))
      } else if (selectedIds.length < maxSelections) {
        onSelectionChange([...selectedIds, id])
      }
    },
    [selectedIds, onSelectionChange, maxSelections],
  )

  // Clear all selections
  const handleClear = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  // Handle type change (clear selections when type changes)
  const handleTypeChange = useCallback(
    (value: string) => {
      onTypeChange(value as DossierType)
      onSelectionChange([])
      onSearchChange('')
    },
    [onTypeChange, onSelectionChange, onSearchChange],
  )

  const canCompare = selectedIds.length >= minSelections && selectedIds.length <= maxSelections

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">{t('selector.title')}</CardTitle>
        <CardDescription>
          {t('selector.subtitle', { min: minSelections, max: maxSelections })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('selector.selectType')}</label>
          <Select value={selectedType || ''} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('selector.selectTypePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{t(`selector.entityTypes.${option.value}`)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search and selection controls */}
        {selectedType && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('selector.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="ps-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="whitespace-nowrap">
                  {t('selector.selectedCount', { count: selectedIds.length })}
                </Badge>
                {selectedIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 me-1" />
                    {t('selector.clearSelection')}
                  </Button>
                )}
              </div>
            </div>

            {/* Selection status */}
            {selectedIds.length > 0 && selectedIds.length < minSelections && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('selector.minRequired', { min: minSelections })}
              </p>
            )}
            {selectedIds.length >= maxSelections && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('selector.maxReached', { max: maxSelections })}
              </p>
            )}

            {/* Entity list */}
            <ScrollArea className="h-[300px] sm:h-[400px] border rounded-lg">
              <div className="p-2 sm:p-3 space-y-2">
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, i) => <EntityCardSkeleton key={i} />)
                ) : filteredEntities.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8 sm:py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                      {getEntityTypeIcon(selectedType)}
                    </div>
                    <h4 className="font-medium text-sm sm:text-base">
                      {t('selector.noEntitiesFound')}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {t('selector.noEntitiesDescription')}
                    </p>
                  </div>
                ) : (
                  // Entity list
                  filteredEntities.map((entity) => (
                    <EntityCard
                      key={entity.id}
                      entity={entity}
                      isSelected={selectedIds.includes(entity.id)}
                      onToggle={handleToggle}
                      isRTL={isRTL}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Compare button */}
            <div className="flex justify-end pt-2">
              <Button onClick={onCompare} disabled={!canCompare} className="w-full sm:w-auto">
                {t('selector.compareButton')}
                <ArrowRight className={cn('h-4 w-4 ms-2', isRTL && 'rotate-180')} />
              </Button>
            </div>
          </>
        )}

        {/* Initial state - no type selected */}
        {!selectedType && (
          <div className="text-center py-8 sm:py-12 border rounded-lg bg-muted/30">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Globe className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-sm sm:text-base">{t('table.empty.title')}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {t('description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default EntityComparisonSelector
