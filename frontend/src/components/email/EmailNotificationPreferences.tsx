import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Mail, Globe, Moon, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

const preferencesSchema = z.object({
  email_notifications_enabled: z.boolean(),
  preferred_language: z.enum(['en', 'ar']),
  ticket_created: z.boolean(),
  ticket_updated: z.boolean(),
  ticket_assigned: z.boolean(),
  ticket_resolved: z.boolean(),
  ticket_closed: z.boolean(),
  comment_added: z.boolean(),
  comment_mention: z.boolean(),
  status_change: z.boolean(),
  priority_change: z.boolean(),
  sla_warning: z.boolean(),
  sla_breach: z.boolean(),
  daily_digest_enabled: z.boolean(),
  daily_digest_time: z.string(),
  weekly_digest_enabled: z.boolean(),
  weekly_digest_day: z.number().min(0).max(6),
  quiet_hours_enabled: z.boolean(),
  quiet_hours_start: z.string(),
  quiet_hours_end: z.string(),
  quiet_hours_timezone: z.string(),
})

type PreferencesFormValues = z.infer<typeof preferencesSchema>

export function EmailNotificationPreferences() {
  const { t, i18n } = useTranslation('email')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch current preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['emailPreferences'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('email_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    },
  })

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: preferences || {
      email_notifications_enabled: true,
      preferred_language: 'en',
      ticket_created: true,
      ticket_updated: true,
      ticket_assigned: true,
      ticket_resolved: true,
      ticket_closed: true,
      comment_added: true,
      comment_mention: true,
      status_change: true,
      priority_change: false,
      sla_warning: true,
      sla_breach: true,
      daily_digest_enabled: false,
      daily_digest_time: '08:00',
      weekly_digest_enabled: false,
      weekly_digest_day: 1,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      quiet_hours_timezone: 'Asia/Riyadh',
    },
    values: preferences,
  })

  const updateMutation = useMutation({
    mutationFn: async (values: PreferencesFormValues) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('email_notification_preferences').upsert({
        user_id: user.id,
        ...values,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailPreferences'] })
      toast({
        title: t('preferences.saved'),
        description: t('preferences.savedDescription'),
      })
    },
    onError: () => {
      toast({
        title: t('preferences.error'),
        description: t('preferences.errorDescription'),
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (values: PreferencesFormValues) => {
    updateMutation.mutate(values)
  }

  const daysOfWeek = [
    { value: 0, label: t('days.sunday') },
    { value: 1, label: t('days.monday') },
    { value: 2, label: t('days.tuesday') },
    { value: 3, label: t('days.wednesday') },
    { value: 4, label: t('days.thursday') },
    { value: 5, label: t('days.friday') },
    { value: 6, label: t('days.saturday') },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Mail className={`h-5 w-5 ${isRTL ? 'ms-0 me-2' : ''}`} />
                {t('preferences.emailNotifications')}
              </CardTitle>
              <CardDescription className="text-start">
                {t('preferences.emailNotificationsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="email_notifications_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 text-start">
                      <FormLabel className="text-base">{t('preferences.enableEmails')}</FormLabel>
                      <FormDescription>{t('preferences.enableEmailsDescription')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_language"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('preferences.language')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('preferences.selectLanguage')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('preferences.languageDescription')}</FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Bell className={`h-5 w-5 ${isRTL ? 'ms-0 me-2' : ''}`} />
                {t('preferences.notificationTypes')}
              </CardTitle>
              <CardDescription className="text-start">
                {t('preferences.notificationTypesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ticket notifications */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground text-start">
                  {t('preferences.ticketNotifications')}
                </h4>

                {[
                  { name: 'ticket_created' as const, label: t('preferences.ticketCreated') },
                  { name: 'ticket_updated' as const, label: t('preferences.ticketUpdated') },
                  { name: 'ticket_assigned' as const, label: t('preferences.ticketAssigned') },
                  { name: 'ticket_resolved' as const, label: t('preferences.ticketResolved') },
                  { name: 'ticket_closed' as const, label: t('preferences.ticketClosed') },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={item.name}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Comment notifications */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground text-start">
                  {t('preferences.commentNotifications')}
                </h4>

                {[
                  { name: 'comment_added' as const, label: t('preferences.commentAdded') },
                  { name: 'comment_mention' as const, label: t('preferences.commentMention') },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={item.name}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Status notifications */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground text-start">
                  {t('preferences.statusNotifications')}
                </h4>

                {[
                  { name: 'status_change' as const, label: t('preferences.statusChange') },
                  { name: 'priority_change' as const, label: t('preferences.priorityChange') },
                  { name: 'sla_warning' as const, label: t('preferences.slaWarning') },
                  { name: 'sla_breach' as const, label: t('preferences.slaBreach') },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={item.name}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Digest Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Clock className={`h-5 w-5 ${isRTL ? 'ms-0 me-2' : ''}`} />
                {t('preferences.digestSettings')}
              </CardTitle>
              <CardDescription className="text-start">
                {t('preferences.digestSettingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Daily Digest */}
              <FormField
                control={form.control}
                name="daily_digest_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 text-start">
                      <FormLabel className="text-base">{t('preferences.dailyDigest')}</FormLabel>
                      <FormDescription>{t('preferences.dailyDigestDescription')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('daily_digest_enabled') && (
                <FormField
                  control={form.control}
                  name="daily_digest_time"
                  render={({ field }) => (
                    <FormItem className="ms-4">
                      <FormLabel>{t('preferences.digestTime')}</FormLabel>
                      <FormControl>
                        <input
                          type="time"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Weekly Digest */}
              <FormField
                control={form.control}
                name="weekly_digest_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 text-start">
                      <FormLabel className="text-base">{t('preferences.weeklyDigest')}</FormLabel>
                      <FormDescription>{t('preferences.weeklyDigestDescription')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('weekly_digest_enabled') && (
                <FormField
                  control={form.control}
                  name="weekly_digest_day"
                  render={({ field }) => (
                    <FormItem className="ms-4">
                      <FormLabel>{t('preferences.digestDay')}</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Moon className={`h-5 w-5 ${isRTL ? 'ms-0 me-2' : ''}`} />
                {t('preferences.quietHours')}
              </CardTitle>
              <CardDescription className="text-start">
                {t('preferences.quietHoursDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="quiet_hours_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 text-start">
                      <FormLabel className="text-base">
                        {t('preferences.enableQuietHours')}
                      </FormLabel>
                      <FormDescription>
                        {t('preferences.enableQuietHoursDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('quiet_hours_enabled') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ms-4">
                  <FormField
                    control={form.control}
                    name="quiet_hours_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('preferences.startTime')}</FormLabel>
                        <FormControl>
                          <input
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quiet_hours_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('preferences.endTime')}</FormLabel>
                        <FormControl>
                          <input
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} className="min-w-32">
              {updateMutation.isPending ? t('preferences.saving') : t('preferences.saveChanges')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
