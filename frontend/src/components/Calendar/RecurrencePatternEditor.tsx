/**
 * RecurrencePatternEditor Component
 * Feature: recurring-event-patterns
 *
 * A comprehensive editor for creating and editing recurring event patterns.
 * Supports daily, weekly, monthly, and yearly recurrence with custom options.
 * Mobile-first design with full RTL support for Arabic.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Repeat, ChevronDown, ChevronUp, Info } from 'lucide-react'
import type {
  RecurrenceFrequency,
  DayOfWeek,
  MonthWeekPosition,
  CreateRecurrenceRuleInput,
  RecurrencePreset,
  RecurrenceSummary,
} from '@/types/recurrence.types'
import {
  RECURRENCE_PRESETS,
  DAY_OF_WEEK_LABELS,
  MONTH_LABELS,
  WEEK_POSITION_LABELS,
} from '@/types/recurrence.types'

interface RecurrencePatternEditorProps {
  /** Initial recurrence pattern (for editing) */
  initialPattern?: CreateRecurrenceRuleInput | null
  /** Reference date for calculating occurrences */
  referenceDate?: string
  /** Called when pattern changes */
  onChange?: (pattern: CreateRecurrenceRuleInput | null) => void
  /** Whether the editor is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Generate a human-readable summary of the recurrence pattern
 */
function generateRecurrenceSummary(
  pattern: CreateRecurrenceRuleInput,
  lang: 'en' | 'ar',
  t: (key: string, options?: Record<string, unknown>) => string,
): RecurrenceSummary {
  const interval = pattern.interval_count || 1
  let shortText = ''
  let longText = ''

  const dayLabels = DAY_OF_WEEK_LABELS[lang]
  const monthLabels = MONTH_LABELS[lang]

  switch (pattern.frequency) {
    case 'daily':
      if (interval === 1) {
        shortText = t('calendar.recurrence.summaryText.daily_one')
      } else {
        shortText = t('calendar.recurrence.summaryText.daily_other', { interval })
      }
      break

    case 'weekly': {
      const selectedDays = (pattern.days_of_week || [])
        .sort((a, b) => a - b)
        .map((d) => dayLabels[d])
        .join(', ')
      if (interval === 1) {
        shortText = t('calendar.recurrence.summaryText.weekly_one', { days: selectedDays })
      } else {
        shortText = t('calendar.recurrence.summaryText.weekly_other', {
          interval,
          days: selectedDays,
        })
      }
      break
    }

    case 'monthly':
      if (pattern.day_of_month) {
        if (interval === 1) {
          shortText = t('calendar.recurrence.summaryText.monthly_day_one', {
            day: pattern.day_of_month,
          })
        } else {
          shortText = t('calendar.recurrence.summaryText.monthly_day_other', {
            interval,
            day: pattern.day_of_month,
          })
        }
      } else if (pattern.week_of_month && pattern.day_of_week_monthly !== undefined) {
        const position = WEEK_POSITION_LABELS[pattern.week_of_month][lang]
        const weekday = dayLabels[pattern.day_of_week_monthly]
        if (interval === 1) {
          shortText = t('calendar.recurrence.summaryText.monthly_weekday_one', {
            position,
            weekday,
          })
        } else {
          shortText = t('calendar.recurrence.summaryText.monthly_weekday_other', {
            interval,
            position,
            weekday,
          })
        }
      }
      break

    case 'yearly':
      if (pattern.month_of_year && pattern.day_of_month) {
        const month = monthLabels[pattern.month_of_year - 1]
        if (interval === 1) {
          shortText = t('calendar.recurrence.summaryText.yearly_one', {
            month,
            day: pattern.day_of_month,
          })
        } else {
          shortText = t('calendar.recurrence.summaryText.yearly_other', {
            interval,
            month,
            day: pattern.day_of_month,
          })
        }
      }
      break
  }

  longText = shortText

  // Add end condition
  if (pattern.end_date) {
    const endDate = new Date(pattern.end_date).toLocaleDateString(
      lang === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    )
    longText += ` ${t('calendar.recurrence.summaryText.until', { date: endDate })}`
  } else if (pattern.occurrence_count) {
    if (pattern.occurrence_count === 1) {
      longText += ` (${t('calendar.recurrence.summaryText.times_one')})`
    } else {
      longText += ` (${t('calendar.recurrence.summaryText.times_other', { count: pattern.occurrence_count })})`
    }
  }

  return {
    short_en: lang === 'en' ? shortText : '',
    short_ar: lang === 'ar' ? shortText : '',
    long_en: lang === 'en' ? longText : '',
    long_ar: lang === 'ar' ? longText : '',
    next_occurrences: [],
  }
}

export function RecurrencePatternEditor({
  initialPattern,
  referenceDate,
  onChange,
  disabled = false,
  className = '',
}: RecurrencePatternEditorProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const lang = isRTL ? 'ar' : 'en'

  // State for recurrence enabled
  const [isEnabled, setIsEnabled] = useState(!!initialPattern)
  const [isExpanded, setIsExpanded] = useState(!!initialPattern)

  // State for preset selection
  const [selectedPreset, setSelectedPreset] = useState<RecurrencePreset>('weekly')

  // State for recurrence pattern
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initialPattern?.frequency || 'weekly',
  )
  const [intervalCount, setIntervalCount] = useState(initialPattern?.interval_count || 1)
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(initialPattern?.days_of_week || [])
  const [dayOfMonth, setDayOfMonth] = useState(initialPattern?.day_of_month || 1)
  const [weekOfMonth, setWeekOfMonth] = useState<MonthWeekPosition>(
    initialPattern?.week_of_month || 'first',
  )
  const [dayOfWeekMonthly, setDayOfWeekMonthly] = useState<DayOfWeek>(
    initialPattern?.day_of_week_monthly || 0,
  )
  const [monthOfYear, setMonthOfYear] = useState(initialPattern?.month_of_year || 1)
  const [monthlyMode, setMonthlyMode] = useState<'day' | 'weekday'>(
    initialPattern?.week_of_month ? 'weekday' : 'day',
  )

  // State for end condition
  const [endMode, setEndMode] = useState<'never' | 'on' | 'after'>(
    initialPattern?.end_date ? 'on' : initialPattern?.occurrence_count ? 'after' : 'never',
  )
  const [endDate, setEndDate] = useState(initialPattern?.end_date || '')
  const [occurrenceCount, setOccurrenceCount] = useState(initialPattern?.occurrence_count || 10)

  // Set initial day of week based on reference date
  useEffect(() => {
    if (referenceDate && daysOfWeek.length === 0) {
      const date = new Date(referenceDate)
      const dayOfWeek = date.getDay() as DayOfWeek
      setDaysOfWeek([dayOfWeek])

      // Set day of month
      setDayOfMonth(date.getDate())

      // Set month
      setMonthOfYear(date.getMonth() + 1)
    }
  }, [referenceDate, daysOfWeek.length])

  // Build the current pattern
  const currentPattern = useMemo<CreateRecurrenceRuleInput | null>(() => {
    if (!isEnabled) return null

    const pattern: CreateRecurrenceRuleInput = {
      frequency,
      interval_count: intervalCount,
    }

    if (frequency === 'weekly') {
      pattern.days_of_week = daysOfWeek.length > 0 ? daysOfWeek : undefined
    } else if (frequency === 'monthly') {
      if (monthlyMode === 'day') {
        pattern.day_of_month = dayOfMonth
      } else {
        pattern.week_of_month = weekOfMonth
        pattern.day_of_week_monthly = dayOfWeekMonthly
      }
    } else if (frequency === 'yearly') {
      pattern.month_of_year = monthOfYear
      pattern.day_of_month = dayOfMonth
    }

    if (endMode === 'on' && endDate) {
      pattern.end_date = endDate
    } else if (endMode === 'after') {
      pattern.occurrence_count = occurrenceCount
    }

    return pattern
  }, [
    isEnabled,
    frequency,
    intervalCount,
    daysOfWeek,
    dayOfMonth,
    weekOfMonth,
    dayOfWeekMonthly,
    monthOfYear,
    monthlyMode,
    endMode,
    endDate,
    occurrenceCount,
  ])

  // Generate summary
  const summary = useMemo<RecurrenceSummary | null>(() => {
    if (!currentPattern) return null
    return generateRecurrenceSummary(currentPattern, lang, t)
  }, [currentPattern, lang, t])

  // Notify parent of changes
  useEffect(() => {
    onChange?.(currentPattern)
  }, [currentPattern, onChange])

  // Handle preset selection
  const handlePresetChange = useCallback((preset: RecurrencePreset) => {
    setSelectedPreset(preset)

    if (preset === 'custom') {
      // Keep current values but allow customization
      return
    }

    const presetConfig = RECURRENCE_PRESETS[preset]
    if (presetConfig) {
      setFrequency(presetConfig.frequency || 'weekly')
      setIntervalCount(presetConfig.interval_count || 1)
      if (presetConfig.days_of_week) {
        setDaysOfWeek(presetConfig.days_of_week)
      }
    }
  }, [])

  // Toggle day of week
  const toggleDayOfWeek = useCallback((day: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    )
    setSelectedPreset('custom')
  }, [])

  // Handle enable toggle
  const handleEnableToggle = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
    if (enabled) {
      setIsExpanded(true)
    }
  }, [])

  const dayLabels = DAY_OF_WEEK_LABELS[lang]
  const monthLabels = MONTH_LABELS[lang]

  return (
    <Card className={`p-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="recurrence-toggle" className="text-base font-medium cursor-pointer">
            {t('calendar.recurrence.title')}
          </Label>
        </div>
        <Switch
          id="recurrence-toggle"
          checked={isEnabled}
          onCheckedChange={handleEnableToggle}
          disabled={disabled}
        />
      </div>

      {isEnabled && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
              disabled={disabled}
            >
              <div className="flex flex-col items-start gap-1 text-start">
                <span className="text-sm font-medium">{t('calendar.recurrence.pattern')}</span>
                {summary && (
                  <span className="text-xs text-muted-foreground">
                    {lang === 'ar' ? summary.short_ar || summary.short_en : summary.short_en}
                  </span>
                )}
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-4">
            {/* Preset selection */}
            <div className="space-y-2">
              <Label>{t('calendar.recurrence.pattern')}</Label>
              <Select
                value={selectedPreset}
                onValueChange={(v) => handlePresetChange(v as RecurrencePreset)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('calendar.recurrence.presets.daily')}</SelectItem>
                  <SelectItem value="weekdays">
                    {t('calendar.recurrence.presets.weekdays')}
                  </SelectItem>
                  <SelectItem value="weekly">{t('calendar.recurrence.presets.weekly')}</SelectItem>
                  <SelectItem value="biweekly">
                    {t('calendar.recurrence.presets.biweekly')}
                  </SelectItem>
                  <SelectItem value="monthly_same_day">
                    {t('calendar.recurrence.presets.monthly_same_day')}
                  </SelectItem>
                  <SelectItem value="monthly_same_weekday">
                    {t('calendar.recurrence.presets.monthly_same_weekday')}
                  </SelectItem>
                  <SelectItem value="yearly">{t('calendar.recurrence.presets.yearly')}</SelectItem>
                  <SelectItem value="custom">{t('calendar.recurrence.presets.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom options - shown when preset is 'custom' or for fine-tuning */}
            {selectedPreset === 'custom' && (
              <>
                {/* Frequency and interval */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('calendar.recurrence.interval')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={intervalCount}
                        onChange={(e) =>
                          setIntervalCount(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-20"
                        disabled={disabled}
                      />
                      <Select
                        value={frequency}
                        onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">
                            {t('calendar.recurrence.frequencies.daily')}
                          </SelectItem>
                          <SelectItem value="weekly">
                            {t('calendar.recurrence.frequencies.weekly')}
                          </SelectItem>
                          <SelectItem value="monthly">
                            {t('calendar.recurrence.frequencies.monthly')}
                          </SelectItem>
                          <SelectItem value="yearly">
                            {t('calendar.recurrence.frequencies.yearly')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Weekly: Days of week selection */}
                {frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>{t('calendar.recurrence.daysOfWeek.label')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                        const dayIndex = day as DayOfWeek
                        const isSelected = daysOfWeek.includes(dayIndex)
                        const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day]
                        return (
                          <Button
                            key={day}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-11 h-11"
                            onClick={() => toggleDayOfWeek(dayIndex)}
                            disabled={disabled}
                          >
                            {t(`calendar.recurrence.daysOfWeek.${dayKey}`)}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Monthly: Day of month or weekday selection */}
                {frequency === 'monthly' && (
                  <div className="space-y-4">
                    <RadioGroup
                      value={monthlyMode}
                      onValueChange={(v) => setMonthlyMode(v as 'day' | 'weekday')}
                      disabled={disabled}
                    >
                      <div className="flex items-center gap-4 p-3 border rounded-lg">
                        <RadioGroupItem value="day" id="monthly-day" />
                        <Label htmlFor="monthly-day" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>
                              {
                                t('calendar.recurrence.monthly.dayOfMonth', { day: '' }).split(
                                  '{{day}}',
                                )[0]
                              }
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              value={dayOfMonth}
                              onChange={(e) =>
                                setDayOfMonth(
                                  Math.max(1, Math.min(31, parseInt(e.target.value) || 1)),
                                )
                              }
                              className="w-16"
                              disabled={disabled || monthlyMode !== 'day'}
                            />
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center gap-4 p-3 border rounded-lg">
                        <RadioGroupItem value="weekday" id="monthly-weekday" />
                        <Label htmlFor="monthly-weekday" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={weekOfMonth}
                              onValueChange={(v) => setWeekOfMonth(v as MonthWeekPosition)}
                              disabled={disabled || monthlyMode !== 'weekday'}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  [
                                    'first',
                                    'second',
                                    'third',
                                    'fourth',
                                    'last',
                                  ] as MonthWeekPosition[]
                                ).map((pos) => (
                                  <SelectItem key={pos} value={pos}>
                                    {t(`calendar.recurrence.monthly.positions.${pos}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={dayOfWeekMonthly.toString()}
                              onValueChange={(v) => setDayOfWeekMonthly(parseInt(v) as DayOfWeek)}
                              disabled={disabled || monthlyMode !== 'weekday'}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                  <SelectItem key={day} value={day.toString()}>
                                    {dayLabels[day]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Yearly: Month and day selection */}
                {frequency === 'yearly' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('calendar.months.january').split(' ')[0]}</Label>
                      <Select
                        value={monthOfYear.toString()}
                        onValueChange={(v) => setMonthOfYear(parseInt(v))}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {monthLabels.map((month, idx) => (
                            <SelectItem key={idx} value={(idx + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {String(t('calendar.recurrence.monthly.dayOfMonth', { day: '' }))
                          .split('{{day}}')[0]
                          ?.trim() || t('calendar.recurrence.monthly.dayOfMonth')}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={dayOfMonth}
                        onChange={(e) =>
                          setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* End condition */}
            <div className="space-y-4">
              <Label>{t('calendar.recurrence.ends')}</Label>
              <RadioGroup
                value={endMode}
                onValueChange={(v) => setEndMode(v as 'never' | 'on' | 'after')}
                disabled={disabled}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="never" id="end-never" />
                  <Label htmlFor="end-never" className="cursor-pointer">
                    {t('calendar.recurrence.endOptions.never')}
                  </Label>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <RadioGroupItem value="on" id="end-on" />
                  <Label htmlFor="end-on" className="cursor-pointer">
                    {t('calendar.recurrence.endOptions.on')}
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                    disabled={disabled || endMode !== 'on'}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <RadioGroupItem value="after" id="end-after" />
                  <Label htmlFor="end-after" className="cursor-pointer">
                    {String(t('calendar.recurrence.endOptions.after', { count: occurrenceCount }))
                      .split(String(occurrenceCount))[0]
                      ?.trim() || t('calendar.recurrence.endOptions.after')}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={occurrenceCount}
                    onChange={(e) => setOccurrenceCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20"
                    disabled={disabled || endMode !== 'after'}
                  />
                  <span className="text-sm text-muted-foreground">
                    {occurrenceCount === 1
                      ? t('calendar.recurrence.summaryText.times_one')
                      : t('calendar.recurrence.summaryText.times_other', {
                          count: occurrenceCount,
                        }).replace(String(occurrenceCount), '')}
                  </span>
                </div>
              </RadioGroup>
            </div>

            {/* Summary */}
            {summary && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{t('calendar.recurrence.summary')}</span>
                    <span className="text-sm text-muted-foreground">
                      {lang === 'ar' ? summary.long_ar || summary.long_en : summary.long_en}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  )
}

export default RecurrencePatternEditor
