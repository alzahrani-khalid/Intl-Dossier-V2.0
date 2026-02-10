/**
 * Dashboard Date Range Picker
 *
 * Popover with preset date ranges and i18n-aware formatting.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type DateRangePreset = 'today' | 'thisWeek' | 'last7' | 'last28' | 'last90'

interface DashboardDateRangePickerProps {
  className?: string
  onRangeChange?: (preset: DateRangePreset) => void
}

export function DashboardDateRangePicker({
  className,
  onRangeChange,
}: DashboardDateRangePickerProps) {
  const { t, i18n } = useTranslation('dashboard')
  const isRTL = i18n.language === 'ar'
  const [selected, setSelected] = useState<DateRangePreset>('last7')
  const [open, setOpen] = useState(false)

  const presets: { key: DateRangePreset; label: string }[] = [
    { key: 'today', label: t('dateRange.today') },
    { key: 'thisWeek', label: t('dateRange.thisWeek') },
    { key: 'last7', label: t('dateRange.last7') },
    { key: 'last28', label: t('dateRange.last28') },
    { key: 'last90', label: t('dateRange.last90') },
  ]

  const handleSelect = (preset: DateRangePreset) => {
    setSelected(preset)
    onRangeChange?.(preset)
    setOpen(false)
  }

  const selectedLabel = presets.find((p) => p.key === selected)?.label ?? ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('h-9 gap-2 text-sm', className)}>
          <CalendarIcon className="size-4" />
          <span className="hidden sm:inline">{selectedLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align={isRTL ? 'start' : 'end'}>
        <div className="space-y-1">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {t('dateRange.title')}
          </p>
          {presets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleSelect(preset.key)}
              className={cn(
                'w-full rounded-md px-2 py-1.5 text-start text-sm',
                'hover:bg-accent transition-colors',
                selected === preset.key && 'bg-accent font-medium',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
