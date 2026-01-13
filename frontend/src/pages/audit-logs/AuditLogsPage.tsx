/**
 * Audit Logs Page
 *
 * Comprehensive audit log viewer with:
 * - Advanced filtering (table, operation, date range, IP, search)
 * - Sortable table with expandable rows
 * - Export functionality (CSV/JSON)
 * - Statistics panel
 * - Pagination
 *
 * Mobile-first and RTL-ready
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Loader2,
  AlertCircle,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  AuditLogFilters,
  AuditLogTable,
  AuditLogExport,
  AuditLogStatistics,
} from '@/components/audit-logs'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import type { AuditLogEntry } from '@/types/audit-log.types'

// =============================================
// COMPONENT
// =============================================

export function AuditLogsPage() {
  const { t, i18n } = useTranslation('audit-logs')
  const isRTL = i18n.language === 'ar'

  const [showStatistics, setShowStatistics] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  const {
    logs,
    isLoading,
    isFetchingNextPage,
    error,
    total,
    hasMore,
    filters,
    pagination,
    setFilters,
    clearFilters,
    setPagination,
    nextPage,
    prevPage,
    refetch,
  } = useAuditLogs()

  const handleLogClick = useCallback((log: AuditLogEntry) => {
    setSelectedLog(log)
    // Could open a detail modal here
  }, [])

  const handlePageSizeChange = useCallback(
    (value: string) => {
      setPagination({ ...pagination, limit: parseInt(value), offset: 0 })
    },
    [pagination, setPagination],
  )

  // Calculate pagination info
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1
  const totalPages = Math.ceil(total / pagination.limit)
  const showingFrom = pagination.offset + 1
  const showingTo = Math.min(pagination.offset + pagination.limit, total)

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatistics(!showStatistics)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('statistics.title')}</span>
          </Button>
          <AuditLogExport filters={filters} disabled={isLoading || logs.length === 0} />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Panel (Collapsible) */}
      <Collapsible open={showStatistics} onOpenChange={setShowStatistics}>
        <CollapsibleContent>
          <AuditLogStatistics
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            className="mb-6"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <AuditLogFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('error.title')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error.message || t('error.description')}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                {t('error.retry')}
              </Button>
            </div>
          )}

          {/* Table */}
          {!error && (
            <>
              <AuditLogTable
                logs={logs}
                isLoading={isLoading}
                filters={filters}
                onFiltersChange={setFilters}
                onLogClick={handleLogClick}
              />

              {/* Pagination */}
              {!isLoading && logs.length > 0 && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t">
                  {/* Showing info */}
                  <div className="text-sm text-muted-foreground">
                    {t('pagination.showing', {
                      from: showingFrom,
                      to: showingTo,
                      total,
                    })}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Page size */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('pagination.per_page')}:
                      </span>
                      <Select
                        value={pagination.limit.toString()}
                        onValueChange={handlePageSizeChange}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevPage}
                        disabled={pagination.offset === 0 || isFetchingNextPage}
                      >
                        <ChevronLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                        <span className="hidden sm:inline ms-1">{t('pagination.previous')}</span>
                      </Button>

                      <span className="text-sm px-2">
                        {t('pagination.page', {
                          page: currentPage,
                          pages: totalPages || 1,
                        })}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={!hasMore || isFetchingNextPage}
                      >
                        <span className="hidden sm:inline me-1">{t('pagination.next')}</span>
                        <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogsPage
