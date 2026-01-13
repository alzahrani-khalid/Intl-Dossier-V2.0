/**
 * Audit Log Table Component
 *
 * Displays audit logs in a responsive table with:
 * - Sortable columns
 * - Expandable rows for change details
 * - Operation type badges
 * - User and IP info display
 *
 * Mobile-first and RTL-ready
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow, format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Globe,
  Clock,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import type { AuditLogEntry, AuditOperation, AuditLogFilters } from '@/types/audit-log.types'

// =============================================
// CONFIGURATION
// =============================================

const OPERATION_CONFIG: Record<
  AuditOperation,
  { icon: typeof Plus; color: string; bgColor: string }
> = {
  INSERT: { icon: Plus, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  UPDATE: { icon: Edit3, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  DELETE: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}

// =============================================
// PROPS
// =============================================

interface AuditLogTableProps {
  logs: AuditLogEntry[]
  isLoading: boolean
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
  onLogClick?: (log: AuditLogEntry) => void
  className?: string
}

// =============================================
// COMPONENT
// =============================================

export function AuditLogTable({
  logs,
  isLoading,
  filters,
  onFiltersChange,
  onLogClick,
  className,
}: AuditLogTableProps) {
  const { t, i18n } = useTranslation('audit-logs')
  const isRTL = i18n.language === 'ar'

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSort = useCallback(
    (column: 'timestamp' | 'table_name' | 'operation' | 'user_email') => {
      const newOrder = filters.sort_by === column && filters.sort_order === 'desc' ? 'asc' : 'desc'
      onFiltersChange({
        ...filters,
        sort_by: column,
        sort_order: newOrder,
      })
    },
    [filters, onFiltersChange],
  )

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, 'PPpp', { locale: isRTL ? ar : undefined })
  }

  const formatTimeAgo = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: isRTL ? ar : undefined,
    })
  }

  const SortableHeader = ({
    column,
    children,
  }: {
    column: 'timestamp' | 'table_name' | 'operation' | 'user_email'
    children: React.ReactNode
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(column)}
    >
      {children}
      <ArrowUpDown className={cn('ms-2 h-4 w-4', filters.sort_by === column && 'text-primary')} />
    </Button>
  )

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('empty.title')}</h3>
        <p className="text-muted-foreground text-sm">{t('empty.description')}</p>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <SortableHeader column="timestamp">{t('columns.timestamp')}</SortableHeader>
            </TableHead>
            <TableHead className="w-[150px]">
              <SortableHeader column="table_name">{t('columns.table')}</SortableHeader>
            </TableHead>
            <TableHead className="w-[100px]">
              <SortableHeader column="operation">{t('columns.operation')}</SortableHeader>
            </TableHead>
            <TableHead className="w-[200px]">
              <SortableHeader column="user_email">{t('columns.user')}</SortableHeader>
            </TableHead>
            <TableHead className="hidden lg:table-cell w-[120px]">
              {t('columns.ip_address')}
            </TableHead>
            <TableHead>{t('columns.changes')}</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id)
            const config = OPERATION_CONFIG[log.operation]
            const Icon = config.icon
            const hasChanges = log.changed_fields && log.changed_fields.length > 0

            return (
              <>
                <TableRow
                  key={log.id}
                  className={cn('cursor-pointer hover:bg-muted/50', isExpanded && 'bg-muted/30')}
                  onClick={() => onLogClick?.(log)}
                >
                  {/* Timestamp */}
                  <TableCell className="font-mono text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{formatTimeAgo(log.timestamp)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatTimestamp(log.timestamp)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Table Name */}
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {t(`tables.${log.table_name}`, log.table_name)}
                    </Badge>
                  </TableCell>

                  {/* Operation */}
                  <TableCell>
                    <Badge className={cn('gap-1', config.bgColor, config.color, 'border-0')}>
                      <Icon className="h-3 w-3" />
                      {t(`operations.${log.operation}`)}
                    </Badge>
                  </TableCell>

                  {/* User */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[150px]">
                        {log.user_email || 'System'}
                      </span>
                    </div>
                  </TableCell>

                  {/* IP Address */}
                  <TableCell className="hidden lg:table-cell">
                    {log.ip_address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Globe className="h-3 w-3" />
                        {log.ip_address}
                      </div>
                    )}
                  </TableCell>

                  {/* Changes Summary */}
                  <TableCell>
                    {hasChanges ? (
                      <span className="text-sm text-muted-foreground">
                        {log.diff_summary || log.changed_fields?.slice(0, 3).join(', ')}
                        {(log.changed_fields?.length || 0) > 3 && (
                          <span className="text-xs ms-1">
                            +{(log.changed_fields?.length || 0) - 3}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        {t('detail.no_changes')}
                      </span>
                    )}
                  </TableCell>

                  {/* Expand Button */}
                  <TableCell>
                    {hasChanges && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => toggleExpand(log.id, e)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded Row - Changes Detail */}
                {isExpanded && hasChanges && (
                  <TableRow key={`${log.id}-expanded`}>
                    <TableCell colSpan={7} className="bg-muted/20 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{t('detail.changed_fields')}</h4>
                          {onLogClick && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onLogClick(log)
                              }}
                            >
                              <ExternalLink className="h-4 w-4 me-2" />
                              {t('detail.view_related')}
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {log.changed_fields?.map((field) => {
                            const oldValue = log.old_data?.[field]
                            const newValue = log.new_data?.[field]

                            return (
                              <div key={field} className="rounded-md bg-background p-3 border">
                                <div className="font-medium text-xs text-muted-foreground mb-2">
                                  {field}
                                </div>
                                {log.operation === 'INSERT' ? (
                                  <div className="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 text-sm text-green-800 dark:text-green-200 break-all">
                                    {JSON.stringify(newValue)}
                                  </div>
                                ) : log.operation === 'DELETE' ? (
                                  <div className="bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 text-sm text-red-800 dark:text-red-200 break-all">
                                    {JSON.stringify(oldValue)}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-muted-foreground min-w-[40px]">
                                        {t('detail.old_value')}:
                                      </span>
                                      <span className="bg-red-50 dark:bg-red-900/20 rounded px-1.5 py-0.5 text-xs text-red-800 dark:text-red-200 break-all">
                                        {JSON.stringify(oldValue)}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-muted-foreground min-w-[40px]">
                                        {t('detail.new_value')}:
                                      </span>
                                      <span className="bg-green-50 dark:bg-green-900/20 rounded px-1.5 py-0.5 text-xs text-green-800 dark:text-green-200 break-all">
                                        {JSON.stringify(newValue)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Additional metadata */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                          {log.session_id && (
                            <span>
                              {t('detail.session_id')}: {log.session_id.slice(0, 8)}...
                            </span>
                          )}
                          {log.request_id && (
                            <span>
                              {t('detail.request_id')}: {log.request_id.slice(0, 8)}...
                            </span>
                          )}
                          <span>
                            {t('detail.record_id')}: {log.row_id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default AuditLogTable
