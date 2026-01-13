/**
 * Audit Log Filters Component
 *
 * Provides comprehensive filtering options for the audit log viewer:
 * - Table filter (multi-select)
 * - Operation filter (INSERT, UPDATE, DELETE)
 * - Date range filter (presets + custom)
 * - User email search
 * - IP address filter
 * - Free text search
 *
 * Mobile-first and RTL-ready
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  X,
  ChevronDown,
  Filter,
  Calendar,
  Database,
  Plus,
  Edit3,
  Trash2,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuditLogDistinctValues } from '@/hooks/useAuditLogs'
import type {
  AuditLogFilters as FiltersType,
  AuditOperation,
  DateRangePreset,
} from '@/types/audit-log.types'

// =============================================
// CONFIGURATION
// =============================================

const OPERATION_CONFIG: Record<
  AuditOperation,
  { icon: typeof Plus; label_en: string; label_ar: string; color: string }
> = {
  INSERT: { icon: Plus, label_en: 'Created', label_ar: 'إنشاء', color: 'text-green-600' },
  UPDATE: { icon: Edit3, label_en: 'Updated', label_ar: 'تحديث', color: 'text-blue-600' },
  DELETE: { icon: Trash2, label_en: 'Deleted', label_ar: 'حذف', color: 'text-red-600' },
}

const DATE_PRESETS: {
  value: DateRangePreset
  label_en: string
  label_ar: string
}[] = [
  { value: 'today', label_en: 'Today', label_ar: 'اليوم' },
  { value: 'yesterday', label_en: 'Yesterday', label_ar: 'أمس' },
  { value: 'last_7_days', label_en: 'Last 7 days', label_ar: 'آخر 7 أيام' },
  { value: 'last_30_days', label_en: 'Last 30 days', label_ar: 'آخر 30 يوم' },
  { value: 'last_90_days', label_en: 'Last 90 days', label_ar: 'آخر 90 يوم' },
  { value: 'this_month', label_en: 'This month', label_ar: 'هذا الشهر' },
  { value: 'last_month', label_en: 'Last month', label_ar: 'الشهر الماضي' },
  { value: 'custom', label_en: 'Custom range', label_ar: 'نطاق مخصص' },
]

// =============================================
// PROPS
// =============================================

interface AuditLogFiltersProps {
  filters: FiltersType
  onFiltersChange: (filters: FiltersType) => void
  onClearFilters: () => void
  className?: string
}

// =============================================
// COMPONENT
// =============================================

export function AuditLogFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
}: AuditLogFiltersProps) {
  const { t, i18n } = useTranslation('audit-logs')
  const isRTL = i18n.language === 'ar'

  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last_30_days')
  const [showCustomDates, setShowCustomDates] = useState(false)

  // Get available tables for filter dropdown
  const { values: availableTables } = useAuditLogDistinctValues('table_name')

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.table_name) count += 1
    if (filters.operation) count += 1
    if (filters.date_from || filters.date_to) count += 1
    if (filters.user_email) count += 1
    if (filters.ip_address) count += 1
    if (filters.search) count += 1
    return count
  }, [filters])

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined })
      }, 500)
      return () => clearTimeout(timeoutId)
    },
    [filters, onFiltersChange],
  )

  // Handle date preset change
  const handleDatePresetChange = useCallback(
    (preset: DateRangePreset) => {
      setDatePreset(preset)

      if (preset === 'custom') {
        setShowCustomDates(true)
        return
      }

      setShowCustomDates(false)

      const now = new Date()
      let from: Date | undefined
      let to: Date | undefined = new Date()

      switch (preset) {
        case 'today':
          from = new Date()
          from.setHours(0, 0, 0, 0)
          break
        case 'yesterday':
          from = new Date()
          from.setDate(from.getDate() - 1)
          from.setHours(0, 0, 0, 0)
          to = new Date(from)
          to.setHours(23, 59, 59, 999)
          break
        case 'last_7_days':
          from = new Date()
          from.setDate(from.getDate() - 7)
          break
        case 'last_30_days':
          from = new Date()
          from.setDate(from.getDate() - 30)
          break
        case 'last_90_days':
          from = new Date()
          from.setDate(from.getDate() - 90)
          break
        case 'this_month':
          from = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          to = new Date(now.getFullYear(), now.getMonth(), 0)
          break
        default:
          break
      }

      onFiltersChange({
        ...filters,
        date_from: from?.toISOString(),
        date_to: to?.toISOString(),
      })
    },
    [filters, onFiltersChange],
  )

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search and Quick Actions Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('filters.search_placeholder')}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-10 pe-4 h-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Clear Filters */}
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 me-1" />
              {t('filters.clear_all')}
              <Badge variant="secondary" className="ms-1">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Buttons Row */}
      <div className="flex flex-wrap gap-2">
        {/* Table Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Database className="h-4 w-4 me-2" />
              {t('filters.table')}
              {filters.table_name ? (
                <Badge variant="secondary" className="ms-2">
                  1
                </Badge>
              ) : (
                <ChevronDown className="h-4 w-4 ms-2" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              <Select
                value={filters.table_name || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    table_name: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('filters.table')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('operations.all')}</SelectItem>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {t(`tables.${table}`, table)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Operation Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 me-2" />
              {t('filters.operation')}
              {filters.operation ? (
                <Badge variant="secondary" className="ms-2">
                  1
                </Badge>
              ) : (
                <ChevronDown className="h-4 w-4 ms-2" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-2">
              <Button
                variant={!filters.operation ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => onFiltersChange({ ...filters, operation: undefined })}
              >
                {t('operations.all')}
              </Button>
              {(Object.keys(OPERATION_CONFIG) as AuditOperation[]).map((op) => {
                const config = OPERATION_CONFIG[op]
                const Icon = config.icon
                const isSelected = filters.operation === op
                return (
                  <Button
                    key={op}
                    variant={isSelected ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onFiltersChange({ ...filters, operation: op })}
                  >
                    <Icon className={cn('h-4 w-4 me-2', config.color)} />
                    {isRTL ? config.label_ar : config.label_en}
                  </Button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="h-4 w-4 me-2" />
              {t('filters.date_range')}
              {(filters.date_from || filters.date_to) && (
                <Badge variant="secondary" className="ms-2">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <Select
                value={datePreset}
                onValueChange={(value) => handleDatePresetChange(value as DateRangePreset)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('filters.date_range')} />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {isRTL ? preset.label_ar : preset.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showCustomDates && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">{isRTL ? 'من' : 'From'}</Label>
                    <Input
                      type="date"
                      value={filters.date_from ? filters.date_from.split('T')[0] : ''}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          date_from: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isRTL ? 'إلى' : 'To'}</Label>
                    <Input
                      type="date"
                      value={filters.date_to ? filters.date_to.split('T')[0] : ''}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          date_to: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              )}

              {(filters.date_from || filters.date_to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      date_from: undefined,
                      date_to: undefined,
                    })
                  }
                >
                  {isRTL ? 'مسح التاريخ' : 'Clear dates'}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* IP Address Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Globe className="h-4 w-4 me-2" />
              {t('filters.ip_address')}
              {filters.ip_address && (
                <Badge variant="secondary" className="ms-2">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              <Input
                placeholder={t('filters.ip_address')}
                value={filters.ip_address || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    ip_address: e.target.value || undefined,
                  })
                }
                className="h-9"
              />
              {filters.ip_address && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      ip_address: undefined,
                    })
                  }
                >
                  {isRTL ? 'مسح' : 'Clear'}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.table_name && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <Database className="h-3 w-3" />
              {t(`tables.${filters.table_name}`, filters.table_name)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                onClick={() => onFiltersChange({ ...filters, table_name: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.operation && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <Filter className="h-3 w-3" />
              {t(`operations.${filters.operation}`)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                onClick={() => onFiltersChange({ ...filters, operation: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.date_from || filters.date_to) && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <Calendar className="h-3 w-3" />
              {filters.date_from &&
                new Date(filters.date_from).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              {filters.date_to &&
                ` - ${new Date(filters.date_to).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}`}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    date_from: undefined,
                    date_to: undefined,
                  })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.ip_address && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <Globe className="h-3 w-3" />
              {filters.ip_address}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                onClick={() => onFiltersChange({ ...filters, ip_address: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default AuditLogFilters
