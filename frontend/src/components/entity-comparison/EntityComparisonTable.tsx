/**
 * EntityComparisonTable Component
 * @feature entity-comparison-view
 *
 * Side-by-side comparison table for displaying entity differences.
 * Supports multiple view modes, filtering, and difference highlighting.
 */

import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  Columns,
  Rows,
  Filter,
  Check,
  X,
  Minus,
  Plus,
  AlertCircle,
  ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  EntityComparisonResult,
  FieldComparison,
  ComparisonFilters,
  ComparisonViewMode,
  FieldDifferenceType,
} from '@/types/entity-comparison.types'
import type { Dossier } from '@/lib/dossier-type-guards'

/**
 * Props for EntityComparisonTable
 */
interface EntityComparisonTableProps {
  comparisonResult: EntityComparisonResult
  viewMode: ComparisonViewMode
  filters: ComparisonFilters
  filteredFields: FieldComparison[]
  onViewModeChange?: (mode: ComparisonViewMode) => void
  onFiltersChange?: (filters: ComparisonFilters) => void
  className?: string
}

/**
 * Difference type badge colors
 */
const DIFFERENCE_COLORS: Record<FieldDifferenceType, string> = {
  same: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  different: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  added: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  removed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  modified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

/**
 * Difference type icons
 */
const DIFFERENCE_ICONS: Record<FieldDifferenceType, React.ReactNode> = {
  same: <Check className="h-3 w-3" />,
  different: <X className="h-3 w-3" />,
  added: <Plus className="h-3 w-3" />,
  removed: <Minus className="h-3 w-3" />,
  modified: <AlertCircle className="h-3 w-3" />,
}

/**
 * Format a value for display
 */
function formatValue(value: unknown, isRTL: boolean): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '✗'
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    return value
      .map((v) => {
        if (typeof v === 'object' && v !== null) {
          return JSON.stringify(v)
        }
        return String(v)
      })
      .join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  // Check if it's a date string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return String(value)
    }
  }

  return String(value)
}

/**
 * Field row component for table view
 */
const FieldRow = memo(function FieldRow({
  field,
  entities,
  isRTL,
}: {
  field: FieldComparison
  entities: Dossier[]
  isRTL: boolean
}) {
  const { t } = useTranslation('entity-comparison')

  return (
    <tr
      className={cn(
        'border-b last:border-b-0 hover:bg-muted/50 transition-colors',
        field.differenceType !== 'same' && 'bg-muted/20',
      )}
    >
      {/* Field name */}
      <td className="p-2 sm:p-3 font-medium text-sm whitespace-nowrap sticky start-0 bg-background z-10 border-e">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    'h-5 w-5 p-0 flex items-center justify-center',
                    DIFFERENCE_COLORS[field.differenceType],
                  )}
                >
                  {DIFFERENCE_ICONS[field.differenceType]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'}>
                <p>{t(`difference.${field.differenceType}`)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="truncate max-w-[120px] sm:max-w-[200px]">
            {t(field.fieldLabel, field.fieldKey)}
          </span>
        </div>
      </td>

      {/* Entity values */}
      {field.values.map((value, index) => (
        <td
          key={entities[index]?.id || index}
          className={cn(
            'p-2 sm:p-3 text-sm max-w-[150px] sm:max-w-[250px]',
            field.differenceType !== 'same' &&
              value !== field.values[0] &&
              'bg-amber-50/50 dark:bg-amber-950/20',
          )}
        >
          <div className="truncate" title={formatValue(value, isRTL)}>
            {formatValue(value, isRTL)}
          </div>
        </td>
      ))}
    </tr>
  )
})

/**
 * Summary statistics card
 */
const ComparisonSummary = memo(function ComparisonSummary({
  comparisonResult,
}: {
  comparisonResult: EntityComparisonResult
}) {
  const { t } = useTranslation('entity-comparison')
  const { summary } = comparisonResult

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          {t('summary.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="text-lg sm:text-2xl font-bold">{summary.totalFields}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('summary.totalFields')}
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
            <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.sameFields}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('summary.sameFields')}
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.differentFields}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('summary.differentFields')}
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.similarityPercentage}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('summary.similarity')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

/**
 * Filter controls component
 */
const FilterControls = memo(function FilterControls({
  filters,
  onFiltersChange,
}: {
  filters: ComparisonFilters
  onFiltersChange?: (filters: ComparisonFilters) => void
}) {
  const { t } = useTranslation('entity-comparison')

  if (!onFiltersChange) return null

  const handleFilterChange = (key: keyof ComparisonFilters, value: boolean) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="mb-4 w-full sm:w-auto">
          <Filter className="h-4 w-4 me-2" />
          {t('table.filters.title')}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mb-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 p-3 sm:p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Switch
              id="show-differences"
              checked={filters.showOnlyDifferences}
              onCheckedChange={(checked) => handleFilterChange('showOnlyDifferences', checked)}
            />
            <Label htmlFor="show-differences" className="text-sm">
              {t('table.filters.showDifferences')}
            </Label>
          </div>
          <Separator orientation="vertical" className="hidden sm:block h-6" />
          <div className="flex items-center gap-2">
            <Switch
              id="show-base"
              checked={filters.showBaseFields}
              onCheckedChange={(checked) => handleFilterChange('showBaseFields', checked)}
            />
            <Label htmlFor="show-base" className="text-sm">
              {t('table.filters.showBaseFields')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-extension"
              checked={filters.showExtensionFields}
              onCheckedChange={(checked) => handleFilterChange('showExtensionFields', checked)}
            />
            <Label htmlFor="show-extension" className="text-sm">
              {t('table.filters.showExtensionFields')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-metadata"
              checked={filters.showMetadataFields}
              onCheckedChange={(checked) => handleFilterChange('showMetadataFields', checked)}
            />
            <Label htmlFor="show-metadata" className="text-sm">
              {t('table.filters.showMetadataFields')}
            </Label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})

/**
 * View mode toggle buttons
 */
const ViewModeToggle = memo(function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ComparisonViewMode
  onViewModeChange?: (mode: ComparisonViewMode) => void
}) {
  const { t } = useTranslation('entity-comparison')

  if (!onViewModeChange) return null

  return (
    <div className="flex items-center border rounded-md overflow-hidden mb-4">
      <Button
        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="rounded-none border-e"
        aria-label={t('accessibility.viewModeToggle')}
      >
        <Table className="h-4 w-4 me-1 sm:me-2" />
        <span className="hidden sm:inline">{t('table.viewMode.table')}</span>
      </Button>
      <Button
        variant={viewMode === 'side_by_side' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('side_by_side')}
        className="rounded-none border-e"
      >
        <Columns className="h-4 w-4 me-1 sm:me-2" />
        <span className="hidden sm:inline">{t('table.viewMode.side_by_side')}</span>
      </Button>
      <Button
        variant={viewMode === 'highlights_only' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('highlights_only')}
        className="rounded-none"
      >
        <Rows className="h-4 w-4 me-1 sm:me-2" />
        <span className="hidden sm:inline">{t('table.viewMode.highlights_only')}</span>
      </Button>
    </div>
  )
})

/**
 * Main EntityComparisonTable component
 */
export const EntityComparisonTable = memo(function EntityComparisonTable({
  comparisonResult,
  viewMode,
  filters,
  filteredFields,
  onViewModeChange,
  onFiltersChange,
  className,
}: EntityComparisonTableProps) {
  const { t, i18n } = useTranslation('entity-comparison')
  const isRTL = i18n.language === 'ar'

  const { entities } = comparisonResult

  // Group fields by category for organized display
  const groupedFields = useMemo(() => {
    const groups = {
      base: [] as FieldComparison[],
      extension: [] as FieldComparison[],
      metadata: [] as FieldComparison[],
    }

    filteredFields.forEach((field) => {
      if (field.category === 'base') {
        groups.base.push(field)
      } else if (field.category === 'extension') {
        groups.extension.push(field)
      } else if (field.category === 'metadata') {
        groups.metadata.push(field)
      }
    })

    return groups
  }, [filteredFields])

  // Render highlights only mode (only different fields)
  if (viewMode === 'highlights_only') {
    const differentFields = filteredFields.filter((f) => f.differenceType !== 'same')

    if (differentFields.length === 0) {
      return (
        <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
          <ComparisonSummary comparisonResult={comparisonResult} />
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <div className="text-center py-8 sm:py-12 border rounded-lg bg-muted/30">
            <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h4 className="font-medium text-sm sm:text-base">{t('table.empty.title')}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              All fields are identical across selected entities
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Summary */}
      <ComparisonSummary comparisonResult={comparisonResult} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <FilterControls filters={filters} onFiltersChange={onFiltersChange} />
      </div>

      {/* Comparison table */}
      <Card>
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            <table
              className="w-full border-collapse"
              role="table"
              aria-label={t('accessibility.comparisonTable')}
            >
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 sm:p-3 text-start font-semibold text-sm sticky start-0 bg-muted/50 z-10 border-e">
                    {t('table.field')}
                  </th>
                  {entities.map((entity, index) => (
                    <th
                      key={entity.id}
                      className="p-2 sm:p-3 text-start font-semibold text-sm min-w-[150px]"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="truncate">{isRTL ? entity.name_ar : entity.name_en}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Base fields */}
                {filters.showBaseFields && groupedFields.base.length > 0 && (
                  <>
                    <tr className="bg-muted/30">
                      <td
                        colSpan={entities.length + 1}
                        className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {t('table.category.base')}
                      </td>
                    </tr>
                    {groupedFields.base.map((field) => (
                      <FieldRow
                        key={field.fieldKey}
                        field={field}
                        entities={entities}
                        isRTL={isRTL}
                      />
                    ))}
                  </>
                )}

                {/* Extension fields */}
                {filters.showExtensionFields && groupedFields.extension.length > 0 && (
                  <>
                    <tr className="bg-muted/30">
                      <td
                        colSpan={entities.length + 1}
                        className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {t('table.category.extension')}
                      </td>
                    </tr>
                    {groupedFields.extension.map((field) => (
                      <FieldRow
                        key={field.fieldKey}
                        field={field}
                        entities={entities}
                        isRTL={isRTL}
                      />
                    ))}
                  </>
                )}

                {/* Metadata fields */}
                {filters.showMetadataFields && groupedFields.metadata.length > 0 && (
                  <>
                    <tr className="bg-muted/30">
                      <td
                        colSpan={entities.length + 1}
                        className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {t('table.category.metadata')}
                      </td>
                    </tr>
                    {groupedFields.metadata.map((field) => (
                      <FieldRow
                        key={field.fieldKey}
                        field={field}
                        entities={entities}
                        isRTL={isRTL}
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  )
})

export default EntityComparisonTable
