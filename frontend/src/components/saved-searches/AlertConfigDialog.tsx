/**
 * AlertConfigDialog Component
 * Feature: saved-searches-feature
 * Description: Dialog for configuring alerts on saved searches
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  BellOff,
  Mail,
  Smartphone,
  MonitorSmartphone,
  Clock,
  TrendingUp,
  Hash,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  useCreateSearchAlert,
  useUpdateSearchAlert,
  useDeleteSearchAlert,
  useSavedSearch,
} from '@/hooks/useSavedSearches'
import type {
  SavedSearch,
  AlertFrequency,
  AlertTrigger,
  SavedSearchAlert,
} from '@/types/saved-search.types'
import { ALERT_FREQUENCY_OPTIONS, ALERT_TRIGGER_OPTIONS } from '@/types/saved-search.types'

interface AlertConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: SavedSearch
}

export function AlertConfigDialog({ open, onOpenChange, search }: AlertConfigDialogProps) {
  const { t, i18n } = useTranslation('saved-searches')
  const isRTL = i18n.language === 'ar'

  // Get updated search data with alert
  const { data: searchData } = useSavedSearch(search.id)
  const existingAlert = searchData?.data?.alert

  // Form state
  const [isEnabled, setIsEnabled] = useState(true)
  const [frequency, setFrequency] = useState<AlertFrequency>('daily')
  const [triggerOn, setTriggerOn] = useState<AlertTrigger>('new_results')
  const [thresholdCount, setThresholdCount] = useState<number>(10)
  const [notifyInApp, setNotifyInApp] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(false)
  const [notifyPush, setNotifyPush] = useState(false)

  // Mutations
  const createMutation = useCreateSearchAlert()
  const updateMutation = useUpdateSearchAlert()
  const deleteMutation = useDeleteSearchAlert()

  // Load existing alert data
  useEffect(() => {
    if (open && existingAlert) {
      setIsEnabled(existingAlert.is_enabled)
      setFrequency(existingAlert.frequency)
      setTriggerOn(existingAlert.trigger_on)
      setThresholdCount(existingAlert.threshold_count || 10)
      setNotifyInApp(existingAlert.notify_in_app)
      setNotifyEmail(existingAlert.notify_email)
      setNotifyPush(existingAlert.notify_push)
    } else if (open && !existingAlert) {
      // Reset to defaults
      setIsEnabled(true)
      setFrequency('daily')
      setTriggerOn('new_results')
      setThresholdCount(10)
      setNotifyInApp(true)
      setNotifyEmail(false)
      setNotifyPush(false)
    }
  }, [open, existingAlert])

  const handleSave = async () => {
    try {
      const alertData = {
        is_enabled: isEnabled,
        frequency,
        trigger_on: triggerOn,
        threshold_count: triggerOn === 'threshold_reached' ? thresholdCount : undefined,
        notify_in_app: notifyInApp,
        notify_email: notifyEmail,
        notify_push: notifyPush,
      }

      if (existingAlert) {
        await updateMutation.mutateAsync({
          searchId: search.id,
          data: alertData,
        })
      } else {
        await createMutation.mutateAsync({
          searchId: search.id,
          data: alertData,
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Save alert error:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(search.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Delete alert error:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const hasNotificationChannel = notifyInApp || notifyEmail || notifyPush

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('alert.title')}
          </DialogTitle>
          <DialogDescription>{t('alert.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Search info */}
          <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 p-3">
            <p className="text-sm font-medium">{isRTL ? search.name_ar : search.name_en}</p>
            {existingAlert && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={existingAlert.is_enabled ? 'default' : 'secondary'}>
                  {existingAlert.is_enabled ? t('alert.active') : t('alert.paused')}
                </Badge>
                <span className="text-xs text-gray-500">
                  {t('alert.alertCount', { count: existingAlert.alert_count })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Bell className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <Label htmlFor="alert-enabled">{t('alert.enabled')}</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('alert.enabledDescription')}
                </p>
              </div>
            </div>
            <Switch id="alert-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          {isEnabled && (
            <>
              <Separator />

              {/* Frequency */}
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('alert.frequency')}
                </Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as AlertFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{isRTL ? option.label_ar : option.label_en}</span>
                          <span className="text-xs text-gray-500">
                            {isRTL ? option.description_ar : option.description_en}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trigger condition */}
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('alert.triggerOn')}
                </Label>
                <Select value={triggerOn} onValueChange={(v) => setTriggerOn(v as AlertTrigger)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TRIGGER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{isRTL ? option.label_ar : option.label_en}</span>
                          <span className="text-xs text-gray-500">
                            {isRTL ? option.description_ar : option.description_en}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Threshold count (for threshold trigger) */}
              {triggerOn === 'threshold_reached' && (
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {t('alert.threshold')}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={thresholdCount}
                    onChange={(e) => setThresholdCount(parseInt(e.target.value) || 10)}
                    placeholder={t('alert.thresholdPlaceholder')}
                  />
                  <p className="text-xs text-gray-500">{t('alert.thresholdDescription')}</p>
                </div>
              )}

              <Separator />

              {/* Notification channels */}
              <div className="flex flex-col gap-3">
                <Label>{t('alert.notifyVia')}</Label>

                {/* In-app */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="notify-app">{t('alert.notifyInApp')}</Label>
                      <p className="text-xs text-gray-500">{t('alert.notifyInAppDescription')}</p>
                    </div>
                  </div>
                  <Switch id="notify-app" checked={notifyInApp} onCheckedChange={setNotifyInApp} />
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="notify-email">{t('alert.notifyEmail')}</Label>
                      <p className="text-xs text-gray-500">{t('alert.notifyEmailDescription')}</p>
                    </div>
                  </div>
                  <Switch
                    id="notify-email"
                    checked={notifyEmail}
                    onCheckedChange={setNotifyEmail}
                  />
                </div>

                {/* Push */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="notify-push">{t('alert.notifyPush')}</Label>
                      <p className="text-xs text-gray-500">{t('alert.notifyPushDescription')}</p>
                    </div>
                  </div>
                  <Switch id="notify-push" checked={notifyPush} onCheckedChange={setNotifyPush} />
                </div>

                {/* Warning if no channel selected */}
                {!hasNotificationChannel && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-xs">{t('alert.noChannelWarning')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingAlert && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {deleteMutation.isPending ? t('alert.deleting') : t('alert.delete')}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('alert.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || (isEnabled && !hasNotificationChannel)}
          >
            {isLoading ? t('alert.saving') : existingAlert ? t('alert.update') : t('alert.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AlertConfigDialog
