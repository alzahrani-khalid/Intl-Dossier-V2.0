import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Mail, Smartphone, Volume2, Monitor, Trash2, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useCategoryPreferences,
  usePushDevices,
  type CategoryPreference,
  type NotificationCategory,
} from '@/hooks/useNotificationCenter'
import { useEmailPreferences } from '@/hooks/useEmailNotifications'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

const CATEGORIES: NotificationCategory[] = [
  'assignments',
  'intake',
  'calendar',
  'signals',
  'mentions',
  'deadlines',
  'system',
  'workflow',
]

const DEFAULT_PREFERENCES: CategoryPreference = {
  category: 'system',
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  sms_enabled: false,
  sound_enabled: true,
}

export function NotificationPreferences() {
  const { t, i18n } = useTranslation('notification-center')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  // Hooks
  const {
    preferences: categoryPrefs,
    isLoading: isCatLoading,
    updatePreferences,
    isUpdating,
  } = useCategoryPreferences()

  const {
    preferences: emailPrefs,
    isLoading: isEmailLoading,
    updatePreferences: updateEmailPrefs,
    isUpdating: isEmailUpdating,
  } = useEmailPreferences()

  const { devices, isLoading: isDevicesLoading, removeDevice, isRemoving } = usePushDevices()

  // Local state for editing
  const [localPrefs, setLocalPrefs] = useState<Record<NotificationCategory, CategoryPreference>>(
    {} as any,
  )
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize local preferences
  useEffect(() => {
    if (categoryPrefs) {
      const prefsMap: Record<NotificationCategory, CategoryPreference> = {} as any
      for (const category of CATEGORIES) {
        const existing = categoryPrefs.find((p) => p.category === category)
        prefsMap[category] = existing || { ...DEFAULT_PREFERENCES, category }
      }
      setLocalPrefs(prefsMap)
    }
  }, [categoryPrefs])

  const handleToggle = (
    category: NotificationCategory,
    field: keyof CategoryPreference,
    value: boolean,
  ) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleEnableAll = () => {
    const updated: Record<NotificationCategory, CategoryPreference> = {} as any
    for (const category of CATEGORIES) {
      updated[category] = {
        ...localPrefs[category],
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        sound_enabled: true,
      }
    }
    setLocalPrefs(updated)
    setHasChanges(true)
  }

  const handleDisableAll = () => {
    const updated: Record<NotificationCategory, CategoryPreference> = {} as any
    for (const category of CATEGORIES) {
      updated[category] = {
        ...localPrefs[category],
        email_enabled: false,
        push_enabled: false,
        in_app_enabled: false,
        sound_enabled: false,
      }
    }
    setLocalPrefs(updated)
    setHasChanges(true)
  }

  const handleSave = () => {
    const prefsArray = Object.values(localPrefs)
    updatePreferences(prefsArray, {
      onSuccess: () => {
        setHasChanges(false)
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
  }

  const handleRemoveDevice = (deviceToken: string) => {
    removeDevice(deviceToken)
  }

  const isLoading = isCatLoading || isEmailLoading || isDevicesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} data-testid="notification-preferences">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{t('preferences.title')}</h2>
        <p className="mt-1 text-muted-foreground">{t('preferences.description')}</p>
      </div>

      {/* Category Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5" />
                {t('preferences.categorySettings')}
              </CardTitle>
              <CardDescription>{t('preferences.channelsDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEnableAll}>
                {t('preferences.enableAll')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisableAll}>
                {t('preferences.disableAll')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="mb-4 grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-2">{t('preferences.channels')}</div>
            <div className="text-center">
              <Mail className="mx-auto size-4" />
              <span className="text-xs">{t('preferences.email')}</span>
            </div>
            <div className="text-center">
              <Smartphone className="mx-auto size-4" />
              <span className="text-xs">{t('preferences.push')}</span>
            </div>
            <div className="text-center">
              <Monitor className="mx-auto size-4" />
              <span className="text-xs">{t('preferences.inApp')}</span>
            </div>
            <div className="text-center">
              <Volume2 className="mx-auto size-4" />
              <span className="text-xs">{t('preferences.sound')}</span>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Category rows */}
          <div className="space-y-4">
            {CATEGORIES.map((category) => {
              const pref = localPrefs[category] || DEFAULT_PREFERENCES
              return (
                <div key={category} className="grid grid-cols-6 items-center gap-4 py-2">
                  <div className="col-span-2">
                    <Label className="font-medium">{t(`categories.${category}`)}</Label>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.email_enabled}
                      onCheckedChange={(v) => handleToggle(category, 'email_enabled', v)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.push_enabled}
                      onCheckedChange={(v) => handleToggle(category, 'push_enabled', v)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.in_app_enabled}
                      onCheckedChange={(v) => handleToggle(category, 'in_app_enabled', v)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.sound_enabled}
                      onCheckedChange={(v) => handleToggle(category, 'sound_enabled', v)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Registered Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="size-5" />
            {t('preferences.devices')}
          </CardTitle>
          <CardDescription>{t('preferences.devicesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!devices || devices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Smartphone className="mx-auto mb-3 size-12 opacity-50" />
              <p className="font-medium">{t('preferences.noDevices')}</p>
              <p className="mt-1 text-sm">{t('preferences.noDevicesDescription')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-background">
                      <Smartphone className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {device.device_name || t(`preferences.platform.${device.platform}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('preferences.lastUsed')}:{' '}
                        {device.last_used_at
                          ? new Date(device.last_used_at).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDevice(device.device_token)}
                    disabled={isRemoving}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="me-2 size-4 animate-spin" />
                {t('preferences.saving')}
              </>
            ) : (
              <>
                <Check className="me-2 size-4" />
                {t('preferences.save')}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
