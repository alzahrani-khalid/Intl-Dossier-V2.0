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
  same: <Check className="size-3" />,
  different: <X className="size-3" />,
  added: <Plus className="size-3" />,
  removed: <Minus className="size-3" />,
  modified: <AlertCircle className="size-3" />,
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
      <td className="sticky start-0 z-10 whitespace-nowrap border-e bg-background p-2 text-sm font-medium sm:p-3">
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
          <span className="max-w-[120px] truncate sm:max-w-[200px]">
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
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ArrowLeftRight className="size-5" />
          {t('summary.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-lg bg-muted/50 p-2 text-center sm:p-3">
            <div className="text-lg font-bold sm:text-2xl">{summary.totalFields}</div>
            <div className="text-xs text-muted-foreground sm:text-sm">
              {t('summary.totalFields')}
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950/30 sm:p-3">
            <div className="text-lg font-bold text-green-600 dark:text-green-400 sm:text-2xl">
              {summary.sameFields}
            </div>
            <div className="text-xs text-muted-foreground sm:text-sm">
              {t('summary.sameFields')}
            </div>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950/30 sm:p-3">
            <div className="text-lg font-bold text-red-600 dark:text-red-400 sm:text-2xl">
              {summary.differentFields}
            </div>
            <div className="text-xs text-muted-foreground sm:text-sm">
              {t('summary.differentFields')}
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950/30 sm:p-3">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 sm:text-2xl">
              {summary.similarityPercentage}%
            </div>
            <div className="text-xs text-muted-foreground sm:text-sm">
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
          <Filter className="me-2 size-4" />
          {t('table.filters.title')}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mb-4">
        <div className="flex flex-col flex-wrap gap-4 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:p-4">
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
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
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
    <div className="mb-4 flex items-center overflow-hidden rounded-md border">
      <Button
        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="rounded-none border-e"
        aria-label={t('accessibility.viewModeToggle')}
      >
        <Table className="me-1 size-4 sm:me-2" />
        <span className="hidden sm:inline">{t('table.viewMode.table')}</span>
      </Button>
      <Button
        variant={viewMode === 'side_by_side' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('side_by_side')}
        className="rounded-none border-e"
      >
        <Columns className="me-1 size-4 sm:me-2" />
        <span className="hidden sm:inline">{t('table.viewMode.side_by_side')}</span>
      </Button>
      <Button
        variant={viewMode === 'highlights_only' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('highlights_only')}
        className="rounded-none"
      >
        <Rows className="me-1 size-4 sm:me-2" />
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
          <div className="rounded-lg border bg-muted/30 py-8 text-center sm:py-12">
            <Check className="mx-auto mb-4 size-12 text-green-500" />
            <h4 className="text-sm font-medium sm:text-base">{t('table.empty.title')}</h4>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <th className="sticky start-0 z-10 border-e bg-muted/50 p-2 text-start text-sm font-semibold sm:p-3">
                    {t('table.field')}
                  </th>
                  {entities.map((entity, index) => (
                    <th
                      key={entity.id}
                      className="min-w-[150px] p-2 text-start text-sm font-semibold sm:p-3"
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
                        className="p-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                        className="p-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                        className="p-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
