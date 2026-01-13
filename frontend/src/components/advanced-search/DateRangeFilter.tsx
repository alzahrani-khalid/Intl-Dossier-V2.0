/**
 * DateRangeFilter Component
 * Feature: advanced-search-filters
 * Description: Date range picker with presets for advanced search
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { DateRange, DatePreset } from '@/types/advanced-search.types'
import { DATE_PRESET_LABELS } from '@/types/advanced-search.types'

interface DateRangeFilterProps {
  value: DateRange | null
  onChange: (value: DateRange | null) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const { t, i18n } = useTranslation('advanced-search')
  const isRTL = i18n.language === 'ar'
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'preset' | 'custom'>(value?.preset ? 'preset' : 'custom')

  const presets: DatePreset[] = [
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'last_90_days',
    'this_month',
    'this_year',
    'next_7_days',
    'next_30_days',
  ]

  const handlePresetClick = (preset: DatePreset) => {
    onChange({ preset, from: null, to: null })
    setIsOpen(false)
  }

  const handleDateSelect = (type: 'from' | 'to', date: Date | undefined) => {
    if (date) {
      onChange({
        preset: null,
        from: type === 'from' ? date.toISOString() : value?.from || null,
        to: type === 'to' ? date.toISOString() : value?.to || null,
      })
    }
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (!value) return t('dateRange.preset')
    if (value.preset) {
      return isRTL
        ? DATE_PRESET_LABELS[value.preset].label_ar
        : DATE_PRESET_LABELS[value.preset].label_en
    }
    if (value.from || value.to) {
      const from = value.from ? new Date(value.from).toLocaleDateString() : '...'
      const to = value.to ? new Date(value.to).toLocaleDateString() : '...'
      return `${from} - ${to}`
    }
    return t('dateRange.preset')
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('dateRange.title')}
      </label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('w-full justify-between min-h-11 px-3', value && 'text-foreground')}
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{getDisplayText()}</span>
            </span>
            <div className="flex items-center gap-1">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label={t('dateRange.clear')}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'} side="bottom">
          <div className="flex flex-col sm:flex-row">
            {/* Presets Column */}
            <div className="border-b sm:border-b-0 sm:border-e p-2 sm:p-3">
              <div className="flex gap-2 mb-2">
                <Button
                  variant={mode === 'preset' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('preset')}
                  className="flex-1"
                >
                  {t('dateRange.preset')}
                </Button>
                <Button
                  variant={mode === 'custom' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('custom')}
                  className="flex-1"
                >
                  {t('dateRange.custom')}
                </Button>
              </div>

              {mode === 'preset' && (
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                  {presets.map((preset) => {
                    const label = isRTL
                      ? DATE_PRESET_LABELS[preset].label_ar
                      : DATE_PRESET_LABELS[preset].label_en
                    const isSelected = value?.preset === preset

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={cn(
                          'w-full text-start px-3 py-2 rounded-md text-sm transition-colors min-h-10',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              {mode === 'custom' && (
                <div className="flex flex-col gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t('dateRange.from')}
                    </label>
                    <CalendarComponent
                      mode="single"
                      selected={value?.from ? new Date(value.from) : undefined}
                      onSelect={(date) => handleDateSelect('from', date)}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t('dateRange.to')}
                    </label>
                    <CalendarComponent
                      mode="single"
                      selected={value?.to ? new Date(value.to) : undefined}
                      onSelect={(date) => handleDateSelect('to', date)}
                      className="rounded-md border"
                      disabled={(date) => (value?.from ? date < new Date(value.from) : false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DateRangeFilter
