import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Mail,
  Clock,
  Calendar,
  Eye,
  Bell,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  FileText,
  Users,
  Loader2,
  Check,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Link } from '@tanstack/react-router'

const digestSettingsSchema = z.object({
  // Basic digest toggles
  daily_digest_enabled: z.boolean(),
  daily_digest_time: z.string(),
  weekly_digest_enabled: z.boolean(),
  weekly_digest_day: z.number().min(0).max(6),
  weekly_digest_time: z.string(),

  // Content inclusion toggles
  digest_include_watchlist: z.boolean(),
  digest_include_deadlines: z.boolean(),
  digest_include_unresolved_tickets: z.boolean(),
  digest_include_assignments: z.boolean(),
  digest_include_commitments: z.boolean(),
  digest_include_mentions: z.boolean(),
  digest_include_calendar: z.boolean(),

  // Advanced settings
  digest_deadline_lookahead_days: z.number().min(1).max(30),
  digest_max_items_per_section: z.number().min(3).max(25),
})

type DigestSettingsFormValues = z.infer<typeof digestSettingsSchema>

interface WatchlistSummary {
  entity_type: string
  total_count: number
  active_count: number
  high_priority_count: number
}

export function EmailDigestSettings() {
  const { t, i18n } = useTranslation('email-digest')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch current digest preferences
  const { data: preferences, isLoading: isPrefsLoading } = useQuery({
    queryKey: ['digestPreferences'],
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

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
  })

  // Fetch watchlist summary
  const { data: watchlistSummary, isLoading: isWatchlistLoading } = useQuery({
    queryKey: ['watchlistSummary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watchlist_summary')
      if (error) throw error
      return data as WatchlistSummary[]
    },
  })

  const form = useForm<DigestSettingsFormValues>({
    resolver: zodResolver(digestSettingsSchema),
    defaultValues: {
      daily_digest_enabled: false,
      daily_digest_time: '08:00',
      weekly_digest_enabled: false,
      weekly_digest_day: 1,
      weekly_digest_time: '08:00',
      digest_include_watchlist: true,
      digest_include_deadlines: true,
      digest_include_unresolved_tickets: true,
      digest_include_assignments: true,
      digest_include_commitments: true,
      digest_include_mentions: true,
      digest_include_calendar: true,
      digest_deadline_lookahead_days: 7,
      digest_max_items_per_section: 10,
    },
    values: preferences
      ? {
          daily_digest_enabled: preferences.daily_digest_enabled ?? false,
          daily_digest_time: preferences.daily_digest_time ?? '08:00',
          weekly_digest_enabled: preferences.weekly_digest_enabled ?? false,
          weekly_digest_day: preferences.weekly_digest_day ?? 1,
          weekly_digest_time: preferences.weekly_digest_time ?? '08:00',
          digest_include_watchlist: preferences.digest_include_watchlist ?? true,
          digest_include_deadlines: preferences.digest_include_deadlines ?? true,
          digest_include_unresolved_tickets: preferences.digest_include_unresolved_tickets ?? true,
          digest_include_assignments: preferences.digest_include_assignments ?? true,
          digest_include_commitments: preferences.digest_include_commitments ?? true,
          digest_include_mentions: preferences.digest_include_mentions ?? true,
          digest_include_calendar: preferences.digest_include_calendar ?? true,
          digest_deadline_lookahead_days: preferences.digest_deadline_lookahead_days ?? 7,
          digest_max_items_per_section: preferences.digest_max_items_per_section ?? 10,
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: async (values: DigestSettingsFormValues) => {
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
      queryClient.invalidateQueries({ queryKey: ['digestPreferences'] })
      toast({
        title: t('saved'),
        description: t('savedDescription'),
      })
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('errorDescription'),
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (values: DigestSettingsFormValues) => {
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

  const totalWatchedEntities =
    watchlistSummary?.reduce((acc, item) => acc + item.active_count, 0) || 0

  const contentSections = [
    {
      name: 'digest_include_watchlist' as const,
      icon: Eye,
      label: t('content.watchlist'),
      description: t('content.watchlistDescription'),
    },
    {
      name: 'digest_include_deadlines' as const,
      icon: AlertTriangle,
      label: t('content.deadlines'),
      description: t('content.deadlinesDescription'),
    },
    {
      name: 'digest_include_unresolved_tickets' as const,
      icon: FileText,
      label: t('content.unresolvedTickets'),
      description: t('content.unresolvedTicketsDescription'),
    },
    {
      name: 'digest_include_assignments' as const,
      icon: CheckSquare,
      label: t('content.assignments'),
      description: t('content.assignmentsDescription'),
    },
    {
      name: 'digest_include_commitments' as const,
      icon: Users,
      label: t('content.commitments'),
      description: t('content.commitmentsDescription'),
    },
    {
      name: 'digest_include_mentions' as const,
      icon: MessageSquare,
      label: t('content.mentions'),
      description: t('content.mentionsDescription'),
    },
    {
      name: 'digest_include_calendar' as const,
      icon: Calendar,
      label: t('content.calendar'),
      description: t('content.calendarDescription'),
    },
  ]

  if (isPrefsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="email-digest-settings"
    >
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-start">{t('title')}</h1>
        <p className="text-muted-foreground text-start">{t('description')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Digest Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Clock className="h-5 w-5" />
                {t('schedule.title')}
              </CardTitle>
              <CardDescription className="text-start">{t('schedule.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daily Digest */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="daily_digest_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5 text-start">
                        <FormLabel className="text-base">{t('schedule.dailyDigest')}</FormLabel>
                        <FormDescription>{t('schedule.dailyDigestDescription')}</FormDescription>
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
                      <FormItem className="ms-4 sm:ms-8">
                        <FormLabel>{t('schedule.deliveryTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" className="w-full sm:w-48" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Weekly Digest */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="weekly_digest_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5 text-start">
                        <FormLabel className="text-base">{t('schedule.weeklyDigest')}</FormLabel>
                        <FormDescription>{t('schedule.weeklyDigestDescription')}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('weekly_digest_enabled') && (
                  <div className="ms-4 sm:ms-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weekly_digest_day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('schedule.deliveryDay')}</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="weekly_digest_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('schedule.deliveryTime')}</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Digest Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Mail className="h-5 w-5" />
                {t('content.title')}
              </CardTitle>
              <CardDescription className="text-start">{t('content.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contentSections.map((section) => {
                const Icon = section.icon
                return (
                  <FormField
                    key={section.name}
                    control={form.control}
                    name={section.name}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4">
                        <div className="flex items-center gap-3 text-start">
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">{section.label}</FormLabel>
                            <FormDescription className="text-xs sm:text-sm">
                              {section.description}
                            </FormDescription>
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )
              })}
            </CardContent>
          </Card>

          {/* Watched Entities Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Eye className="h-5 w-5" />
                {t('watchlist.title')}
              </CardTitle>
              <CardDescription className="text-start">{t('watchlist.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isWatchlistLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !watchlistSummary || watchlistSummary.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{t('watchlist.noEntities')}</p>
                  <p className="text-sm mt-1">{t('watchlist.noEntitiesDescription')}</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/my-work">{t('watchlist.addEntities')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{t('watchlist.totalWatched')}</span>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {totalWatchedEntities}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {watchlistSummary.map((item) => (
                      <div
                        key={item.entity_type}
                        className="flex items-center justify-between p-2 sm:p-3 border rounded-lg"
                      >
                        <span className="text-sm capitalize">
                          {t(`watchlist.types.${item.entity_type}`)}
                        </span>
                        <Badge variant="outline">{item.active_count}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button variant="link" size="sm" className="px-0" asChild>
                      <Link to="/my-work">{t('watchlist.manageWatchlist')}</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Bell className="h-5 w-5" />
                {t('advanced.title')}
              </CardTitle>
              <CardDescription className="text-start">{t('advanced.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="digest_deadline_lookahead_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('advanced.lookaheadDays')}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(val) => field.onChange(parseInt(val))}
                          value={field.value.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[3, 5, 7, 14, 21, 30].map((days) => (
                              <SelectItem key={days} value={days.toString()}>
                                {days} {t('advanced.days')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>{t('advanced.lookaheadDaysDescription')}</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="digest_max_items_per_section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('advanced.maxItems')}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(val) => field.onChange(parseInt(val))}
                          value={field.value.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 25].map((count) => (
                              <SelectItem key={count} value={count.toString()}>
                                {count} {t('advanced.items')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>{t('advanced.maxItemsDescription')}</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} className="min-h-11 min-w-32">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  {t('saveChanges')}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
