/**
 * SLA Policy Form Component
 * Feature: sla-monitoring
 *
 * Form for creating and editing SLA policies with RTL support
 */

import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SLAPolicyInput, EscalationLevel } from '@/types/sla.types'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SLAPolicyFormProps {
  defaultValues?: Partial<SLAPolicyInput>
  onSubmit: (data: SLAPolicyInput) => void
  onCancel?: () => void
  isSubmitting?: boolean
  className?: string
}

const REQUEST_TYPES = ['engagement', 'position', 'mou_action', 'foresight']
const SENSITIVITIES = ['public', 'internal', 'confidential', 'secret']
const URGENCIES = ['low', 'medium', 'high', 'critical']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const NOTIFICATION_CHANNELS = ['in_app', 'email', 'sms', 'push']
const ESCALATION_ROLES = ['supervisor', 'manager', 'admin', 'director']

export function SLAPolicyForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  className,
}: SLAPolicyFormProps) {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'

  const [escalationLevels, setEscalationLevels] = useState<EscalationLevel[]>(
    defaultValues?.escalation_levels || [],
  )
  const [notificationChannels, setNotificationChannels] = useState<string[]>(
    defaultValues?.notification_channels || ['in_app', 'email'],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SLAPolicyInput>({
    defaultValues: {
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      acknowledgment_target: 60,
      resolution_target: 480,
      business_hours_only: true,
      timezone: 'Asia/Riyadh',
      warning_threshold_pct: 75,
      escalation_enabled: true,
      is_active: true,
      ...defaultValues,
    },
  })

  const escalationEnabled = watch('escalation_enabled')

  const handleAddEscalationLevel = () => {
    const nextLevel = escalationLevels.length + 1
    setEscalationLevels([
      ...escalationLevels,
      {
        level: nextLevel,
        after_minutes: nextLevel * 60,
        notify_role: 'supervisor',
      },
    ])
  }

  const handleRemoveEscalationLevel = (index: number) => {
    setEscalationLevels(escalationLevels.filter((_, i) => i !== index))
  }

  const handleEscalationLevelChange = (
    index: number,
    field: keyof EscalationLevel,
    value: string | number,
  ) => {
    const updated = [...escalationLevels]
    updated[index] = { ...updated[index], [field]: value }
    setEscalationLevels(updated)
  }

  const toggleNotificationChannel = (channel: string) => {
    setNotificationChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    )
  }

  const onFormSubmit = (data: SLAPolicyInput) => {
    onSubmit({
      ...data,
      escalation_levels: escalationLevels,
      notification_channels: notificationChannels,
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className={className}>
        <CardHeader>
          <CardTitle>{defaultValues?.name ? t('policies.edit') : t('policies.create')}</CardTitle>
          <CardDescription>{t('policies.formDescription')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('policies.basicInfo')}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('policies.name')} *</Label>
                <Input
                  id="name"
                  {...register('name', { required: true })}
                  placeholder={t('policies.namePlaceholder')}
                  className={errors.name ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">{t('policies.nameAr')}</Label>
                <Input
                  id="name_ar"
                  {...register('name_ar')}
                  placeholder={t('policies.nameArPlaceholder')}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">{t('policies.description')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('policies.descriptionPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ar">{t('policies.descriptionAr')}</Label>
                <Textarea
                  id="description_ar"
                  {...register('description_ar')}
                  placeholder={t('policies.descriptionArPlaceholder')}
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Matching Criteria */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('policies.matchingCriteria')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('policies.matchingCriteriaDescription')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('policies.requestType')}</Label>
                <Select
                  onValueChange={(v) => setValue('request_type', v === 'all' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('policies.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('policies.allTypes')}</SelectItem>
                    {REQUEST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`, type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('policies.sensitivity')}</Label>
                <Select onValueChange={(v) => setValue('sensitivity', v === 'all' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('policies.allSensitivities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('policies.allSensitivities')}</SelectItem>
                    {SENSITIVITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`sensitivity.${s}`, s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('policies.urgency')}</Label>
                <Select onValueChange={(v) => setValue('urgency', v === 'all' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('policies.allUrgencies')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('policies.allUrgencies')}</SelectItem>
                    {URGENCIES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {t(`urgency.${u}`, u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('policies.priority')}</Label>
                <Select onValueChange={(v) => setValue('priority', v === 'all' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('policies.allPriorities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('policies.allPriorities')}</SelectItem>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`priority.${p}`, p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* SLA Targets */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('policies.slaTargets')}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acknowledgment_target">
                  {t('policies.acknowledgmentTarget')} ({t('policies.minutes')}) *
                </Label>
                <Input
                  id="acknowledgment_target"
                  type="number"
                  {...register('acknowledgment_target', {
                    required: true,
                    valueAsNumber: true,
                    min: 1,
                  })}
                  className={errors.acknowledgment_target ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  {t('policies.acknowledgmentTargetHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution_target">
                  {t('policies.resolutionTarget')} ({t('policies.minutes')}) *
                </Label>
                <Input
                  id="resolution_target"
                  type="number"
                  {...register('resolution_target', {
                    required: true,
                    valueAsNumber: true,
                    min: 1,
                  })}
                  className={errors.resolution_target ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  {t('policies.resolutionTargetHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warning_threshold_pct">{t('policies.warningThreshold')} (%)</Label>
                <Input
                  id="warning_threshold_pct"
                  type="number"
                  {...register('warning_threshold_pct', {
                    valueAsNumber: true,
                    min: 0,
                    max: 100,
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t('policies.warningThresholdHelp')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center gap-2">
                <Switch
                  id="business_hours_only"
                  {...register('business_hours_only')}
                  onCheckedChange={(checked) => setValue('business_hours_only', checked)}
                />
                <Label htmlFor="business_hours_only">{t('policies.businessHoursOnly')}</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Escalation Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('policies.escalationSettings')}</h3>
              <div className="flex items-center gap-2">
                <Switch
                  id="escalation_enabled"
                  {...register('escalation_enabled')}
                  onCheckedChange={(checked) => setValue('escalation_enabled', checked)}
                />
                <Label htmlFor="escalation_enabled">{t('policies.enableEscalation')}</Label>
              </div>
            </div>

            {escalationEnabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {escalationLevels.map((level, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('policies.escalationLevel')}</Label>
                          <Input
                            type="number"
                            value={level.level}
                            onChange={(e) =>
                              handleEscalationLevelChange(index, 'level', parseInt(e.target.value))
                            }
                            min={1}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('policies.afterMinutes')}</Label>
                          <Input
                            type="number"
                            value={level.after_minutes}
                            onChange={(e) =>
                              handleEscalationLevelChange(
                                index,
                                'after_minutes',
                                parseInt(e.target.value),
                              )
                            }
                            min={1}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('policies.notifyRole')}</Label>
                          <Select
                            value={level.notify_role}
                            onValueChange={(v) =>
                              handleEscalationLevelChange(index, 'notify_role', v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESCALATION_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {t(`roles.${role}`, role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEscalationLevel(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEscalationLevel}
                >
                  <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('policies.addEscalationLevel')}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('policies.notificationChannels')}</h3>
            <div className="flex flex-wrap gap-2">
              {NOTIFICATION_CHANNELS.map((channel) => (
                <Button
                  key={channel}
                  type="button"
                  variant={notificationChannels.includes(channel) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleNotificationChannel(channel)}
                >
                  {t(`channels.${channel}`, channel)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              {...register('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">{t('policies.isActive')}</Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
