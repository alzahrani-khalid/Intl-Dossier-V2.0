/**
 * CommitmentFilterDrawer Component v1.1
 * Feature: 031-commitments-management
 * Tasks: T037, T042, T042a
 *
 * Filter panel for commitments:
 * - Bottom sheet on mobile, side panel on desktop
 * - Status, priority, owner type filters
 * - Overdue toggle
 * - Date range picker for due dates
 * - Mobile-first, RTL-compatible, 44x44px touch targets
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type {
  CommitmentStatus,
  CommitmentPriority,
  CommitmentOwnerType,
  CommitmentFilters,
} from '@/types/commitment.types';

export interface CommitmentFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CommitmentFilters;
  onFiltersChange: (filters: CommitmentFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

const STATUS_OPTIONS: CommitmentStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
const PRIORITY_OPTIONS: CommitmentPriority[] = ['low', 'medium', 'high', 'critical'];
const OWNER_TYPE_OPTIONS: CommitmentOwnerType[] = ['internal', 'external'];

export function CommitmentFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: CommitmentFilterDrawerProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Local state for form values
  const [localFilters, setLocalFilters] = useState<CommitmentFilters>(filters);

  // Sync local state with props when drawer opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Handle status toggle
  const handleStatusToggle = (status: CommitmentStatus) => {
    const currentStatus = localFilters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    setLocalFilters({ ...localFilters, status: newStatus.length > 0 ? newStatus : undefined });
  };

  // Handle priority toggle
  const handlePriorityToggle = (priority: CommitmentPriority) => {
    const currentPriority = localFilters.priority || [];
    const newPriority = currentPriority.includes(priority)
      ? currentPriority.filter((p) => p !== priority)
      : [...currentPriority, priority];
    setLocalFilters({ ...localFilters, priority: newPriority.length > 0 ? newPriority : undefined });
  };

  // Handle owner type selection
  const handleOwnerTypeChange = (ownerType: CommitmentOwnerType | undefined) => {
    setLocalFilters({ ...localFilters, ownerType });
  };

  // Handle overdue toggle
  const handleOverdueToggle = (checked: boolean) => {
    setLocalFilters({ ...localFilters, overdue: checked || undefined });
  };

  // Handle date range changes
  const handleDateFromChange = (date: Date | undefined) => {
    setLocalFilters({
      ...localFilters,
      dueDateFrom: date ? date.toISOString().split('T')[0] : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setLocalFilters({
      ...localFilters,
      dueDateTo: date ? date.toISOString().split('T')[0] : undefined,
    });
  };

  // Apply filters
  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onOpenChange(false);
  };

  // Clear filters
  const handleClear = () => {
    setLocalFilters({});
    onFiltersChange({});
    onClear();
  };

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
            <Label className="text-sm font-medium text-start block">
              {t('filters.status')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent min-h-11"
                >
                  <Checkbox
                    checked={localFilters.status?.includes(status) || false}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <span className="text-sm">{t(`status.${status}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-start block">
              {t('filters.priority')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_OPTIONS.map((priority) => (
                <label
                  key={priority}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent min-h-11"
                >
                  <Checkbox
                    checked={localFilters.priority?.includes(priority) || false}
                    onCheckedChange={() => handlePriorityToggle(priority)}
                  />
                  <span className="text-sm">{t(`priority.${priority}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Owner Type Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-start block">
              {t('filters.ownerType')}
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={!localFilters.ownerType ? 'default' : 'outline'}
                size="sm"
                className="min-h-11"
                onClick={() => handleOwnerTypeChange(undefined)}
              >
                {t('actions.clearFilters').split(' ')[0]} {/* "All" or similar */}
              </Button>
              {OWNER_TYPE_OPTIONS.map((ownerType) => (
                <Button
                  key={ownerType}
                  type="button"
                  variant={localFilters.ownerType === ownerType ? 'default' : 'outline'}
                  size="sm"
                  className="min-h-11"
                  onClick={() => handleOwnerTypeChange(ownerType)}
                >
                  {t(`ownerType.${ownerType}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Overdue Toggle - T042 */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-start block">
                {t('filters.overdue')}
              </Label>
              <p className="text-xs text-muted-foreground text-start">
                {t('filters.overdueDescription')}
              </p>
            </div>
            <Switch
              checked={localFilters.overdue || false}
              onCheckedChange={handleOverdueToggle}
            />
          </div>

          {/* Date Range Filter - T042a */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-start block">
              {t('filters.dueDate')}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* From Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t('filters.dueDateFrom')}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full min-h-11 justify-start text-start font-normal',
                        !localFilters.dueDateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {localFilters.dueDateFrom ? (
                        format(new Date(localFilters.dueDateFrom), 'PPP', {
                          locale: isRTL ? ar : enUS,
                        })
                      ) : (
                        <span>{t('filters.dueDateFrom')}</span>
                      )}
                      {localFilters.dueDateFrom && (
                        <X
                          className={`size-4 ${isRTL ? 'me-auto ms-2' : 'ms-auto me-2'} opacity-50 hover:opacity-100`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateFromChange(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dueDateFrom ? new Date(localFilters.dueDateFrom) : undefined}
                      onSelect={handleDateFromChange}
                      initialFocus
                      locale={isRTL ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t('filters.dueDateTo')}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full min-h-11 justify-start text-start font-normal',
                        !localFilters.dueDateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {localFilters.dueDateTo ? (
                        format(new Date(localFilters.dueDateTo), 'PPP', {
                          locale: isRTL ? ar : enUS,
                        })
                      ) : (
                        <span>{t('filters.dueDateTo')}</span>
                      )}
                      {localFilters.dueDateTo && (
                        <X
                          className={`size-4 ${isRTL ? 'me-auto ms-2' : 'ms-auto me-2'} opacity-50 hover:opacity-100`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateToChange(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dueDateTo ? new Date(localFilters.dueDateTo) : undefined}
                      onSelect={handleDateToChange}
                      disabled={(date) =>
                        localFilters.dueDateFrom
                          ? date < new Date(localFilters.dueDateFrom)
                          : false
                      }
                      initialFocus
                      locale={isRTL ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="min-h-11 w-full sm:w-auto"
          >
            {t('filters.clear')}
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="min-h-11 w-full sm:flex-1"
          >
            {t('filters.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
