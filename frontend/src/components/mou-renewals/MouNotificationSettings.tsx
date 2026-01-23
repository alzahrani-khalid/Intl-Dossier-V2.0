/**
 * MoU Notification Settings Component
 *
 * Comprehensive settings panel for managing MoU notification preferences.
 * Features:
 * - Toggle notifications by type (deliverables, renewals, workflow, etc.)
 * - Configure due date warning days
 * - Channel preferences (email, push, in-app)
 * - Batching and quiet hours configuration
 *
 * Mobile-first, RTL-aware design.
 * Feature: mou-notification-hooks
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import {
  useMouNotificationPreferences,
  useUpdateMouNotificationPreferences,
  type PreferencesUpdateInput,
} from '@/hooks/useMouNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Bell,
  BellOff,
  Mail,
  Smartphone,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Workflow,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Days options for due date warnings
const DUE_DATE_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
]

const EXPIRATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]

const BATCH_FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

interface MouNotificationSettingsProps {
  className?: string
  compact?: boolean
}

export function MouNotificationSettings({
  className,
  compact = false,
}: MouNotificationSettingsProps) {
  const { t, i18n } = useTranslation('mou-notifications')
  const isRTL = i18n.language === 'ar'

  const { data: preferences, isLoading, error } = useMouNotificationPreferences()
  const updatePreferences = useUpdateMouNotificationPreferences()

  const [hasChanges, setHasChanges] = useState(false)

  // Form setup
  const { control, watch, setValue, handleSubmit, reset } = useForm<PreferencesUpdateInput>({
    defaultValues: {
      mou_notifications_enabled: true,
      deliverable_due_soon_enabled: true,
      deliverable_due_soon_days: [7, 3, 1],
      deliverable_overdue_enabled: true,
      deliverable_completed_enabled: true,
      milestone_completed_enabled: true,
      expiration_warning_enabled: true,
      expiration_warning_days: [90, 60, 30, 7],
      mou_expired_enabled: true,
      renewal_initiated_enabled: true,
      renewal_approved_enabled: true,
      renewal_completed_enabled: true,
      workflow_state_change_enabled: true,
      health_score_drop_enabled: true,
      health_score_drop_threshold: 20,
      assignment_change_enabled: true,
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      batch_notifications: false,
      batch_frequency: 'immediate',
      batch_delivery_time: '09:00',
      batch_delivery_day: 1,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
    },
  })

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      reset({
        mou_notifications_enabled: preferences.mou_notifications_enabled,
        deliverable_due_soon_enabled: preferences.deliverable_due_soon_enabled,
        deliverable_due_soon_days: preferences.deliverable_due_soon_days,
        deliverable_overdue_enabled: preferences.deliverable_overdue_enabled,
        deliverable_completed_enabled: preferences.deliverable_completed_enabled,
        milestone_completed_enabled: preferences.milestone_completed_enabled,
        expiration_warning_enabled: preferences.expiration_warning_enabled,
        expiration_warning_days: preferences.expiration_warning_days,
        mou_expired_enabled: preferences.mou_expired_enabled,
        renewal_initiated_enabled: preferences.renewal_initiated_enabled,
        renewal_approved_enabled: preferences.renewal_approved_enabled,
        renewal_completed_enabled: preferences.renewal_completed_enabled,
        workflow_state_change_enabled: preferences.workflow_state_change_enabled,
        health_score_drop_enabled: preferences.health_score_drop_enabled,
        health_score_drop_threshold: preferences.health_score_drop_threshold,
        assignment_change_enabled: preferences.assignment_change_enabled,
        email_enabled: preferences.email_enabled,
        push_enabled: preferences.push_enabled,
        in_app_enabled: preferences.in_app_enabled,
        batch_notifications: preferences.batch_notifications,
        batch_frequency: preferences.batch_frequency,
        batch_delivery_time: preferences.batch_delivery_time?.slice(0, 5) || '09:00',
        batch_delivery_day: preferences.batch_delivery_day,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start?.slice(0, 5) || '22:00',
        quiet_hours_end: preferences.quiet_hours_end?.slice(0, 5) || '07:00',
      })
      setHasChanges(false)
    }
  }, [preferences, reset])

  // Track changes
  const formValues = watch()
  useEffect(() => {
    if (preferences) {
      const changed =
        JSON.stringify(formValues) !==
        JSON.stringify({
          mou_notifications_enabled: preferences.mou_notifications_enabled,
          deliverable_due_soon_enabled: preferences.deliverable_due_soon_enabled,
          deliverable_due_soon_days: preferences.deliverable_due_soon_days,
          deliverable_overdue_enabled: preferences.deliverable_overdue_enabled,
          deliverable_completed_enabled: preferences.deliverable_completed_enabled,
          milestone_completed_enabled: preferences.milestone_completed_enabled,
          expiration_warning_enabled: preferences.expiration_warning_enabled,
          expiration_warning_days: preferences.expiration_warning_days,
          mou_expired_enabled: preferences.mou_expired_enabled,
          renewal_initiated_enabled: preferences.renewal_initiated_enabled,
          renewal_approved_enabled: preferences.renewal_approved_enabled,
          renewal_completed_enabled: preferences.renewal_completed_enabled,
          workflow_state_change_enabled: preferences.workflow_state_change_enabled,
          health_score_drop_enabled: preferences.health_score_drop_enabled,
          health_score_drop_threshold: preferences.health_score_drop_threshold,
          assignment_change_enabled: preferences.assignment_change_enabled,
          email_enabled: preferences.email_enabled,
          push_enabled: preferences.push_enabled,
          in_app_enabled: preferences.in_app_enabled,
          batch_notifications: preferences.batch_notifications,
          batch_frequency: preferences.batch_frequency,
          batch_delivery_time: preferences.batch_delivery_time?.slice(0, 5) || '09:00',
          batch_delivery_day: preferences.batch_delivery_day,
          quiet_hours_enabled: preferences.quiet_hours_enabled,
          quiet_hours_start: preferences.quiet_hours_start?.slice(0, 5) || '22:00',
          quiet_hours_end: preferences.quiet_hours_end?.slice(0, 5) || '07:00',
        })
      setHasChanges(changed)
    }
  }, [formValues, preferences])

  const onSubmit = async (data: PreferencesUpdateInput) => {
    try {
      await updatePreferences.mutateAsync(data)
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to update preferences:', err)
    }
  }

  const handleDaysToggle = (
    field: 'deliverable_due_soon_days' | 'expiration_warning_days',
    value: number,
    currentValues: number[],
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value].sort((a, b) => b - a)
    setValue(field, newValues)
  }

  const globalEnabled = watch('mou_notifications_enabled')
  const batchEnabled = watch('batch_notifications')
  const quietHoursEnabled = watch('quiet_hours_enabled')
  const batchFrequency = watch('batch_frequency')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-4 sm:mx-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t('error.loadFailed')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4 sm:space-y-6', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Global Toggle */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {globalEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base sm:text-lg">{t('global.title')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('global.description')}
                </CardDescription>
              </div>
            </div>
            <Controller
              name="mou_notifications_enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="min-h-11 min-w-11"
                />
              )}
            />
          </div>
        </CardHeader>
      </Card>

      {globalEnabled && (
        <>
          {/* Deliverable Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <CardTitle className="text-sm sm:text-base">{t('deliverables.title')}</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                {t('deliverables.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Due Soon */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('deliverables.dueSoon')}</Label>
                  <Controller
                    name="deliverable_due_soon_enabled"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                {watch('deliverable_due_soon_enabled') && (
                  <div className="flex flex-wrap gap-2 ps-4">
                    <Controller
                      name="deliverable_due_soon_days"
                      control={control}
                      render={({ field }) => (
                        <>
                          {DUE_DATE_OPTIONS.map((option) => (
                            <Badge
                              key={option.value}
                              variant={field.value?.includes(option.value) ? 'default' : 'outline'}
                              className="cursor-pointer min-h-8 px-3"
                              onClick={() =>
                                handleDaysToggle(
                                  'deliverable_due_soon_days',
                                  option.value,
                                  field.value || [],
                                )
                              }
                            >
                              {t(`days.${option.value}`, { defaultValue: option.label })}
                            </Badge>
                          ))}
                        </>
                      )}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Overdue */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('deliverables.overdue')}</Label>
                <Controller
                  name="deliverable_overdue_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Completed */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('deliverables.completed')}</Label>
                <Controller
                  name="deliverable_completed_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Milestone Completed */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('deliverables.milestoneCompleted')}</Label>
                <Controller
                  name="milestone_completed_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Expiration & Renewal Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <CardTitle className="text-sm sm:text-base">{t('renewal.title')}</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                {t('renewal.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Expiration Warnings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('renewal.expirationWarning')}</Label>
                  <Controller
                    name="expiration_warning_enabled"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                {watch('expiration_warning_enabled') && (
                  <div className="flex flex-wrap gap-2 ps-4">
                    <Controller
                      name="expiration_warning_days"
                      control={control}
                      render={({ field }) => (
                        <>
                          {EXPIRATION_OPTIONS.map((option) => (
                            <Badge
                              key={option.value}
                              variant={field.value?.includes(option.value) ? 'default' : 'outline'}
                              className="cursor-pointer min-h-8 px-3"
                              onClick={() =>
                                handleDaysToggle(
                                  'expiration_warning_days',
                                  option.value,
                                  field.value || [],
                                )
                              }
                            >
                              {t(`days.${option.value}`, { defaultValue: option.label })}
                            </Badge>
                          ))}
                        </>
                      )}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Expired */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('renewal.expired')}</Label>
                <Controller
                  name="mou_expired_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Renewal Initiated */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('renewal.initiated')}</Label>
                <Controller
                  name="renewal_initiated_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Renewal Approved */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('renewal.approved')}</Label>
                <Controller
                  name="renewal_approved_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Renewal Completed */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('renewal.completed')}</Label>
                <Controller
                  name="renewal_completed_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Workflow & Health Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <CardTitle className="text-sm sm:text-base">{t('workflow.title')}</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                {t('workflow.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Workflow State Change */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('workflow.stateChange')}</Label>
                <Controller
                  name="workflow_state_change_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Assignment Change */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('workflow.assignmentChange')}</Label>
                <Controller
                  name="assignment_change_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <Separator />

              {/* Health Score Drop */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <Label className="text-sm">{t('workflow.healthScoreDrop')}</Label>
                  </div>
                  <Controller
                    name="health_score_drop_enabled"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                {watch('health_score_drop_enabled') && (
                  <div className="space-y-2 ps-4">
                    <Label className="text-xs text-muted-foreground">
                      {t('workflow.healthThreshold', {
                        value: watch('health_score_drop_threshold'),
                      })}
                    </Label>
                    <Controller
                      name="health_score_drop_threshold"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          value={[field.value || 20]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={5}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Channel Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <CardTitle className="text-sm sm:text-base">{t('channels.title')}</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                {t('channels.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Label className="text-sm">{t('channels.email')}</Label>
                </div>
                <Controller
                  name="email_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Push */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label className="text-sm">{t('channels.push')}</Label>
                </div>
                <Controller
                  name="push_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* In-App */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label className="text-sm">{t('channels.inApp')}</Label>
                </div>
                <Controller
                  name="in_app_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Batching & Quiet Hours */}
          {!compact && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                  <CardTitle className="text-sm sm:text-base">{t('timing.title')}</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {t('timing.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Batch Notifications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('timing.batchNotifications')}</Label>
                    <Controller
                      name="batch_notifications"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                  {batchEnabled && (
                    <div className="space-y-3 ps-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {t('timing.frequency')}
                        </Label>
                        <Controller
                          name="batch_frequency"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BATCH_FREQUENCY_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {t(`timing.${option.value}`, { defaultValue: option.label })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {batchFrequency === 'daily' && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            {t('timing.deliveryTime')}
                          </Label>
                          <Controller
                            name="batch_delivery_time"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="time"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                              />
                            )}
                          />
                        </div>
                      )}

                      {batchFrequency === 'weekly' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              {t('timing.deliveryDay')}
                            </Label>
                            <Controller
                              name="batch_delivery_day"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  value={String(field.value)}
                                  onValueChange={(v) => field.onChange(parseInt(v))}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {WEEKDAYS.map((day) => (
                                      <SelectItem key={day.value} value={String(day.value)}>
                                        {t(`weekdays.${day.value}`, { defaultValue: day.label })}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              {t('timing.deliveryTime')}
                            </Label>
                            <Controller
                              name="batch_delivery_time"
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="time"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                />
                              )}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('timing.quietHours')}</Label>
                    <Controller
                      name="quiet_hours_enabled"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                  {quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-3 ps-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t('timing.from')}</Label>
                        <Controller
                          name="quiet_hours_start"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="time"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t('timing.to')}</Label>
                        <Controller
                          name="quiet_hours_end"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="time"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Save Button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 -mx-4 sm:mx-0 sm:p-0 border-t sm:border-0">
        <Button
          type="submit"
          className="w-full sm:w-auto min-h-11"
          disabled={!hasChanges || updatePreferences.isPending}
        >
          {updatePreferences.isPending ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('actions.saving')}
            </>
          ) : (
            t('actions.save')
          )}
        </Button>
      </div>

      {/* Success message */}
      {updatePreferences.isSuccess && !hasChanges && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {t('success.saved')}
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}

export default MouNotificationSettings
