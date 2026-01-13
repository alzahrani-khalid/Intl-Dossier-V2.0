/**
 * Schedule Report Dialog Component
 *
 * Dialog for scheduling automatic report generation.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Loader2, Plus, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportSchedule, ScheduleFrequency, ExportFormat } from '@/types/report-builder.types'

interface ScheduleReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  existingSchedule?: ReportSchedule | null
  onSave: (data: {
    name: string
    nameAr?: string
    frequency: ScheduleFrequency
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    timezone: string
    exportFormat: ExportFormat
    recipients: string[]
    isActive?: boolean
  }) => Promise<void>
  isSaving: boolean
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nameAr: z.string().max(100).optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timezone: z.string().min(1),
  exportFormat: z.enum(['pdf', 'excel', 'csv', 'json']),
  recipientInput: z.string().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const DAYS_OF_WEEK = [
  { value: 0, labelKey: 'common:days.sunday' },
  { value: 1, labelKey: 'common:days.monday' },
  { value: 2, labelKey: 'common:days.tuesday' },
  { value: 3, labelKey: 'common:days.wednesday' },
  { value: 4, labelKey: 'common:days.thursday' },
  { value: 5, labelKey: 'common:days.friday' },
  { value: 6, labelKey: 'common:days.saturday' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Shanghai',
  'Australia/Sydney',
]

export function ScheduleReportDialog({
  open,
  onOpenChange,
  reportId,
  existingSchedule,
  onSave,
  isSaving,
}: ScheduleReportDialogProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingSchedule?.name || '',
      nameAr: existingSchedule?.nameAr || '',
      frequency: existingSchedule?.frequency || 'weekly',
      dayOfWeek: existingSchedule?.dayOfWeek ?? 1,
      dayOfMonth: existingSchedule?.dayOfMonth ?? 1,
      time: existingSchedule?.time || '09:00',
      timezone:
        existingSchedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      exportFormat: existingSchedule?.exportFormat || 'pdf',
      recipientInput: '',
      isActive: existingSchedule?.isActive ?? true,
    },
  })

  const [recipients, setRecipients] = useState<string[]>(existingSchedule?.recipients || [])

  const frequency = form.watch('frequency')

  const handleAddRecipient = (value: string) => {
    const email = value.trim()
    if (email && !recipients.includes(email) && email.includes('@')) {
      setRecipients([...recipients, email])
      form.setValue('recipientInput', '')
    }
  }

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email))
  }

  const onSubmit = async (values: FormValues) => {
    await onSave({
      name: values.name,
      nameAr: values.nameAr,
      frequency: values.frequency as ScheduleFrequency,
      dayOfWeek: values.frequency === 'weekly' ? values.dayOfWeek : undefined,
      dayOfMonth: ['monthly', 'quarterly'].includes(values.frequency)
        ? values.dayOfMonth
        : undefined,
      time: values.time,
      timezone: values.timezone,
      exportFormat: values.exportFormat as ExportFormat,
      recipients,
      isActive: values.isActive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {existingSchedule ? t('schedule.updateButton') : t('schedule.title')}
          </DialogTitle>
          <DialogDescription>{t('schedule.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('schedule.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule.frequency')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">{t('schedule.frequencies.once')}</SelectItem>
                      <SelectItem value="daily">{t('schedule.frequencies.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('schedule.frequencies.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('schedule.frequencies.monthly')}</SelectItem>
                      <SelectItem value="quarterly">
                        {t('schedule.frequencies.quarterly')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Day of Week (for weekly) */}
            {frequency === 'weekly' && (
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule.dayOfWeek')}</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {t(day.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Day of Month (for monthly/quarterly) */}
            {['monthly', 'quarterly'].includes(frequency) && (
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule.dayOfMonth')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule.time')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock
                          className={cn(
                            'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                            isRTL ? 'end-3' : 'start-3',
                          )}
                        />
                        <Input type="time" className={cn(isRTL ? 'pe-9' : 'ps-9')} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule.timezone')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Export Format */}
            <FormField
              control={form.control}
              name="exportFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule.exportFormat')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">{t('schedule.formats.pdf')}</SelectItem>
                      <SelectItem value="excel">{t('schedule.formats.excel')}</SelectItem>
                      <SelectItem value="csv">{t('schedule.formats.csv')}</SelectItem>
                      <SelectItem value="json">{t('schedule.formats.json')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipients */}
            <FormField
              control={form.control}
              name="recipientInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule.recipients')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('schedule.recipientsPlaceholder')}
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          handleAddRecipient(field.value || '')
                        }
                      }}
                    />
                  </FormControl>
                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recipients.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveRecipient(email)}
                        >
                          {email}
                          <X className="h-3 w-3 ms-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Toggle */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('schedule.isActive')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('savedReports.confirmDelete.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {existingSchedule ? t('schedule.updateButton') : t('schedule.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
