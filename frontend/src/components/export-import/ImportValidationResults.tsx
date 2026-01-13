/**
 * ImportValidationResults Component
 * Feature: export-import-templates
 *
 * Displays validation results for imported data with error highlighting
 * and row-level status indicators.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { ImportValidationResult, CellValidationError } from '@/types/export-import.types'
import { cn } from '@/lib/utils'

interface ImportValidationResultsProps {
  result: ImportValidationResult
  maxRowsPreview?: number
  className?: string
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  valid: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  invalid: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  conflict: <AlertCircle className="h-4 w-4 text-blue-500" />,
  pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
}

const STATUS_BADGES: Record<
  string,
  { variant: 'default' | 'destructive' | 'secondary' | 'outline'; className?: string }
> = {
  valid: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  invalid: { variant: 'destructive' },
  warning: {
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  conflict: { variant: 'outline', className: 'border-blue-500 text-blue-600 dark:text-blue-400' },
  pending: { variant: 'secondary' },
}

export function ImportValidationResults({
  result,
  maxRowsPreview = 100,
  className,
}: ImportValidationResultsProps) {
  const { t, i18n } = useTranslation('export-import')
  const isRTL = i18n.language === 'ar'

  const [showAllErrors, setShowAllErrors] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpanded = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowNumber)) {
        next.delete(rowNumber)
      } else {
        next.add(rowNumber)
      }
      return next
    })
  }

  const displayedRows = useMemo(() => {
    let rows = result.rows

    // Filter to show only errors if not showing all
    if (!showAllErrors) {
      const invalidRows = rows.filter(
        (r) => r.status === 'invalid' || r.status === 'warning' || r.status === 'conflict',
      )
      if (invalidRows.length > 0 && invalidRows.length < rows.length) {
        rows = invalidRows
      }
    }

    return rows.slice(0, maxRowsPreview)
  }, [result.rows, showAllErrors, maxRowsPreview])

  const errorsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of result.rows) {
      for (const error of row.errors) {
        counts[error.code] = (counts[error.code] || 0) + 1
      }
    }
    return counts
  }, [result.rows])

  const getErrorMessage = (error: CellValidationError): string => {
    return isRTL ? error.message_ar : error.message_en
  }

  const getSuggestion = (error: CellValidationError): string | undefined => {
    return isRTL ? error.suggestion_ar : error.suggestion_en
  }

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 bg-card">
          <div className="text-2xl font-bold">{result.totalRows}</div>
          <div className="text-xs text-muted-foreground">
            {t('import.validation.summary.totalRows')}
          </div>
        </div>
        <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-900/20">
          <div className="text-2xl font-bold text-green-600">{result.validRows}</div>
          <div className="text-xs text-green-700 dark:text-green-400">
            {t('import.validation.summary.validRows')}
          </div>
        </div>
        <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-900/20">
          <div className="text-2xl font-bold text-red-600">{result.invalidRows}</div>
          <div className="text-xs text-red-700 dark:text-red-400">
            {t('import.validation.summary.invalidRows')}
          </div>
        </div>
        <div className="rounded-lg border p-3 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="text-2xl font-bold text-yellow-600">{result.warningRows}</div>
          <div className="text-xs text-yellow-700 dark:text-yellow-400">
            {t('import.validation.summary.warningRows')}
          </div>
        </div>
      </div>

      {/* Missing Columns Warning */}
      {result.missingRequiredColumns && result.missingRequiredColumns.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">
              {t('import.error.missingColumns', {
                columns: result.missingRequiredColumns.join(', '),
              })}
            </span>
          </div>
        </div>
      )}

      {/* Unmapped Columns Info */}
      {result.unmappedColumns && result.unmappedColumns.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Unmapped columns will be ignored: {result.unmappedColumns.join(', ')}</span>
          </div>
        </div>
      )}

      {/* Error Summary */}
      {Object.keys(errorsByType).length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('import.validation.errors.title')}
                <Badge variant="secondary">
                  {Object.values(errorsByType).reduce((a, b) => a + b, 0)}
                </Badge>
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-lg border p-3 space-y-2">
              {Object.entries(errorsByType).map(([code, count]) => (
                <div key={code} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t(`errors.${code}`)}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Toggle All/Errors Only */}
      {result.validRows > 0 && result.invalidRows > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowAllErrors(!showAllErrors)}>
            {showAllErrors ? (
              <>
                <EyeOff className="h-4 w-4 me-2" />
                {t('import.validation.errors.hideErrors')}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 me-2" />
                {t('import.validation.errors.showAll')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Rows Table */}
      <ScrollArea className="h-[300px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                {(t('import.preview.showingRows', { shown: '', total: '' }) || '')
                  .split(':')[0]
                  .trim() || 'Row'}
              </TableHead>
              <TableHead className="w-24">
                {t('import.validation.status.valid').split(' ')[0] || 'Status'}
              </TableHead>
              <TableHead>
                {t('import.validation.errors.title').split(' ')[0] || 'Details'}
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRows.map((row) => (
              <TableRow
                key={row.row}
                className={cn(
                  row.status === 'invalid' && 'bg-red-50/50 dark:bg-red-900/10',
                  row.status === 'warning' && 'bg-yellow-50/50 dark:bg-yellow-900/10',
                  row.status === 'conflict' && 'bg-blue-50/50 dark:bg-blue-900/10',
                )}
              >
                <TableCell className="font-medium">#{row.row}</TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_BADGES[row.status]?.variant || 'secondary'}
                    className={STATUS_BADGES[row.status]?.className}
                  >
                    <span className="flex items-center gap-1">
                      {STATUS_ICONS[row.status]}
                      {t(`import.validation.status.${row.status}`)}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.errors.length > 0 ? (
                    <div className="space-y-1">
                      {row.errors
                        .slice(0, expandedRows.has(row.row) ? undefined : 2)
                        .map((error, idx) => (
                          <TooltipProvider key={idx}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm">
                                  <span className="font-medium text-muted-foreground">
                                    {error.column}:
                                  </span>{' '}
                                  <span
                                    className={
                                      error.severity === 'error'
                                        ? 'text-red-600'
                                        : 'text-yellow-600'
                                    }
                                  >
                                    {getErrorMessage(error)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              {getSuggestion(error) && (
                                <TooltipContent>
                                  <p>{getSuggestion(error)}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      {row.errors.length > 2 && !expandedRows.has(row.row) && (
                        <div className="text-xs text-muted-foreground">
                          +{row.errors.length - 2} more errors
                        </div>
                      )}
                    </div>
                  ) : row.status === 'conflict' ? (
                    <div className="text-sm text-blue-600">
                      {t('errors.conflict_detected')}
                      {row.existingId && (
                        <span className="text-muted-foreground ms-2">
                          (ID: {row.existingId.slice(0, 8)}...)
                        </span>
                      )}
                    </div>
                  ) : row.data ? (
                    <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {Object.entries(row.data)
                        .filter(([k, v]) => v && !k.includes('_at'))
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`)
                        .join(', ')}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  {row.errors.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleRowExpanded(row.row)}
                    >
                      {expandedRows.has(row.row) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {displayedRows.length < result.rows.length && (
        <p className="text-sm text-muted-foreground text-center">
          {t('import.preview.showingRows', {
            shown: displayedRows.length,
            total: result.rows.length,
          })}
        </p>
      )}

      {/* Status Message */}
      <div
        className={cn(
          'rounded-lg p-4 text-center',
          result.invalidRows === 0 &&
            'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          result.invalidRows > 0 && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
        )}
      >
        {result.invalidRows === 0 ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {t('import.validation.noErrors')}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <XCircle className="h-5 w-5" />
            {t('import.validation.hasErrors')}
          </div>
        )}
      </div>
    </div>
  )
}
