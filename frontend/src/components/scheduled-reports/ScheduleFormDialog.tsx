/**
 * Schedule Form Dialog
 *
 * Dialog for creating and editing scheduled reports with
 * frequency, recipients, and condition configuration.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

import {
  useCreateSchedule,
  useUpdateSchedule,
  useAvailableReports,
  type ReportSchedule,
  type CreateScheduleInput,
} from '@/hooks/useScheduledReports'

import { RecipientsManager } from './RecipientsManager'
import { ConditionsManager } from './ConditionsManager'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  name_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  report_id: z.string().min(1, 'Report is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string().min(1, 'Time is required'),
  timezone: z.string().default('UTC'),
  day_of_week: z.coerce.number().optional(),
  day_of_month: z.coerce.number().optional(),
  export_format: z.string().default('pdf'),
  language: z.enum(['en', 'ar', 'both']).default('en'),
  is_active: z.boolean().default(true),
  is_shared: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ReportSchedule | null
}

export function ScheduleFormDialog({ open, onOpenChange, schedule }: ScheduleFormDialogProps) {
  const { t, i18n } = useTranslation('scheduled-reports')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('general')

  const { data: reports } = useAvailableReports()
  const createSchedule = useCreateSchedule()
  const updateSchedule = useUpdateSchedule()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      report_id: '',
      frequency: 'weekly',
      time: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      day_of_week: 1,
      day_of_month: 1,
      export_format: 'pdf',
      language: 'en',
      is_active: true,
      is_shared: false,
    },
  })

  const frequency = form.watch('frequency')

  useEffect(() => {
    if (schedule) {
      form.reset({
        name: schedule.name,
        name_ar: schedule.name_ar || '',
        description: schedule.description || '',
        description_ar: schedule.description_ar || '',
        report_id: schedule.report_id,
        frequency: schedule.frequency,
        time: schedule.time,
        timezone: schedule.timezone,
        day_of_week: schedule.day_of_week,
        day_of_month: schedule.day_of_month,
        export_format: schedule.export_format,
        language: schedule.language,
        is_active: schedule.is_active,
        is_shared: schedule.is_shared,
      })
    } else {
      form.reset()
    }
    setActiveTab('general')
  }, [schedule, form, open])

  const onSubmit = async (values: FormValues) => {
    try {
      const input: CreateScheduleInput = {
        ...values,
        day_of_week: frequency === 'weekly' ? values.day_of_week : undefined,
        day_of_month: frequency === 'monthly' ? values.day_of_month : undefined,
      }

      if (schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, ...input })
        toast({ title: t('messages.updateSuccess') })
      } else {
        await createSchedule.mutateAsync(input)
        toast({ title: t('messages.createSuccess') })
      }

      onOpenChange(false)
    } catch {
      toast({ title: t('messages.error'), variant: 'destructive' })
    }
  }

  const timezones = Intl.supportedValuesOf('timeZone')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{schedule ? t('editSchedule') : t('createNew')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t('form.name')}</TabsTrigger>
            <TabsTrigger value="recipients" disabled={!schedule}>
              {t('recipients.title')}
            </TabsTrigger>
            <TabsTrigger value="conditions" disabled={!schedule}>
              {t('conditions.title')}
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="general" className="space-y-4 mt-4">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form.namePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.nameAr')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form.nameArPlaceholder')} dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('form.descriptionPlaceholder')}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Report Selection */}
                <FormField
                  control={form.control}
                  name="report_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.selectReport')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.selectReportPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reports?.map((report) => (
                            <SelectItem key={report.id} value={report.id}>
                              {isRTL && report.name_ar ? report.name_ar : report.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Frequency & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.frequency')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">{t('frequency.daily')}</SelectItem>
                            <SelectItem value="weekly">{t('frequency.weekly')}</SelectItem>
                            <SelectItem value="monthly">{t('frequency.monthly')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {frequency === 'weekly' && (
                    <FormField
                      control={form.control}
                      name="day_of_week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.dayOfWeek')}</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {t(`days.${day}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {frequency === 'monthly' && (
                    <FormField
                      control={form.control}
                      name="day_of_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.dayOfMonth')}</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.time')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.timezone')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {timezones.map((tz) => (
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

                {/* Format & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="export_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.format')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">{t('format.pdf')}</SelectItem>
                            <SelectItem value="excel">{t('format.excel')}</SelectItem>
                            <SelectItem value="csv">{t('format.csv')}</SelectItem>
                            <SelectItem value="json">{t('format.json')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.language')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">{t('language.en')}</SelectItem>
                            <SelectItem value="ar">{t('language.ar')}</SelectItem>
                            <SelectItem value="both">{t('language.both')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">{t('form.isActive')}</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_shared"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">{t('form.isShared')}</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter thumbZone>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSchedule.isPending || updateSchedule.isPending}
                  >
                    {t('actions.save')}
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="recipients" className="mt-4">
                {schedule && <RecipientsManager scheduleId={schedule.id} />}
              </TabsContent>

              <TabsContent value="conditions" className="mt-4">
                {schedule && <ConditionsManager scheduleId={schedule.id} />}
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
