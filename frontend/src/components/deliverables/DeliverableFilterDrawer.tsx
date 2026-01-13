/**
 * DeliverableFilterDrawer Component
 * Feature: commitment-deliverables
 *
 * Filter drawer for deliverables list with status, priority, date range filters.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import type {
  DeliverableFilters,
  DeliverableStatus,
  DeliverablePriority,
} from '@/types/deliverable.types'

const STATUSES: DeliverableStatus[] = [
  'pending',
  'not_started',
  'in_progress',
  'at_risk',
  'delayed',
  'completed',
  'cancelled',
]

const PRIORITIES: DeliverablePriority[] = ['low', 'medium', 'high', 'urgent']

interface DeliverableFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DeliverableFilters
  onFiltersChange: (filters: DeliverableFilters) => void
  onApply: () => void
  onClear: () => void
}

export function DeliverableFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: DeliverableFilterDrawerProps) {
  const { t, i18n } = useTranslation('deliverables')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const handleStatusToggle = (status: DeliverableStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    })
  }

  const handlePriorityToggle = (priority: DeliverablePriority) => {
    const currentPriorities = filters.priority || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority]

    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    })
  }

  const handleOverdueToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      overdue: checked || undefined,
    })
  }

  const handleDueDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dueDateFrom: date ? format(date, 'yyyy-MM-dd') : undefined,
    })
  }

  const handleDueDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dueDateTo: date ? format(date, 'yyyy-MM-dd') : undefined,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRTL ? 'left' : 'right'}
        className="w-full sm:max-w-md overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SheetHeader>
          <SheetTitle className="text-start">{t('filters.title')}</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('filters.status')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status?.includes(status) || false}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                    {t(`status.${status}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('filters.priority')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map((priority) => (
                <div key={priority} className="flex items-center gap-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={filters.priority?.includes(priority) || false}
                    onCheckedChange={() => handlePriorityToggle(priority)}
                  />
                  <Label htmlFor={`priority-${priority}`} className="text-sm cursor-pointer">
                    {t(`priority.${priority}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Filter */}
          <div className="flex items-center justify-between">
            <Label htmlFor="overdue-switch" className="text-sm font-medium">
              {t('filters.overdueOnly')}
            </Label>
            <Switch
              id="overdue-switch"
              checked={!!filters.overdue}
              onCheckedChange={handleOverdueToggle}
            />
          </div>

          {/* Date Range Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('filters.dateRange')}</Label>

            {/* Due Date From */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('filters.dueDateFrom')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-start font-normal min-h-11',
                      !filters.dueDateFrom && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                    {filters.dueDateFrom
                      ? format(new Date(filters.dueDateFrom), 'PP', { locale: dateLocale })
                      : t('filters.selectDate')}
                    {filters.dueDateFrom && (
                      <X
                        className="size-4 ms-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDueDateFromChange(undefined)
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined}
                    onSelect={handleDueDateFromChange}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Due Date To */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('filters.dueDateTo')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-start font-normal min-h-11',
                      !filters.dueDateTo && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                    {filters.dueDateTo
                      ? format(new Date(filters.dueDateTo), 'PP', { locale: dateLocale })
                      : t('filters.selectDate')}
                    {filters.dueDateTo && (
                      <X
                        className="size-4 ms-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDueDateToChange(undefined)
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dueDateTo ? new Date(filters.dueDateTo) : undefined}
                    onSelect={handleDueDateToChange}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <SheetFooter className="flex flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClear} className="flex-1 min-h-11">
            {t('filters.clear')}
          </Button>
          <Button onClick={onApply} className="flex-1 min-h-11">
            {t('filters.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default DeliverableFilterDrawer
