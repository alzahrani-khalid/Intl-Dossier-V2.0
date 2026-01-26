import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Smartphone, Key, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SettingsSectionCard, SettingsItem, SettingsGroup } from '../SettingsSectionCard'
import { SESSION_TIMEOUT_OPTIONS } from '@/types/settings.types'
import { cn } from '@/lib/utils'

interface SecuritySettingsSectionProps {
  form: UseFormReturn<any>
}

/**
 * Security settings section component
 * Handles MFA, session timeout, and password change
 */
export function SecuritySettingsSection({ form }: SecuritySettingsSectionProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const mfaEnabled = form.watch('mfa_enabled')
  const sessionTimeout = form.watch('session_timeout')

  const handlePasswordChange = async () => {
    // TODO: Implement password change via Supabase Auth
    setIsChangingPassword(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsChangingPassword(false)
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  const getTimeoutLabel = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${t('security.minutes')}`
    } else if (minutes === 60) {
      return `1 ${t('security.hour')}`
    } else {
      return `${minutes / 60} ${t('security.hours')}`
    }
  }

  return (
    <SettingsSectionCard
      title={t('security.title')}
      description={t('security.description')}
      icon={Lock}
    >
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Two-Factor Authentication */}
        <SettingsGroup>
          <SettingsItem
            label={t('security.twoFactor')}
            description={t('security.twoFactorDesc')}
            icon={Smartphone}
          >
            <div className="flex items-center gap-3">
              <Badge
                variant={mfaEnabled ? 'default' : 'outline'}
                className={cn(
                  mfaEnabled
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'text-muted-foreground',
                )}
              >
                {mfaEnabled ? t('security.twoFactorEnabled') : t('security.twoFactorDisabled')}
              </Badge>
              <Switch
                checked={mfaEnabled}
                onCheckedChange={(checked) =>
                  form.setValue('mfa_enabled', checked, { shouldDirty: true })
                }
              />
            </div>
          </SettingsItem>

          {mfaEnabled && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      {t('security.mfaSetupRequired')}
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      {t('security.mfaSetupInstructions')}
                    </p>
                    <Button size="sm" className="mt-3" variant="outline">
                      <Key className="h-4 w-4 me-2" />
                      {t('security.setupTwoFactor')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </SettingsGroup>

        {/* Session Timeout */}
        <SettingsGroup>
          <div className="space-y-3">
            <div>
              <Label className="text-start block">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('security.sessionTimeout')}
                </span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1 text-start">
                {t('security.sessionTimeoutDesc')}
              </p>
            </div>
            <Select
              value={sessionTimeout?.toString()}
              onValueChange={(value) =>
                form.setValue('session_timeout', parseInt(value), {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TIMEOUT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {getTimeoutLabel(option.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsGroup>

        <Separator />

        {/* Password Change */}
        <SettingsGroup title={t('security.passwordChange')}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-start block">
                {t('security.currentPassword')}
              </Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="max-w-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-start block">
                {t('security.newPassword')}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground text-start">
                {t('security.passwordRequirements')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-start block">
                {t('security.confirmPassword')}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="max-w-md"
              />
            </div>

            <Button
              type="button"
              onClick={handlePasswordChange}
              disabled={
                isChangingPassword ||
                !passwordForm.current ||
                !passwordForm.new ||
                passwordForm.new !== passwordForm.confirm
              }
              className="min-h-11"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 me-2" />
                  {t('security.changePasswordButton')}
                </>
              )}
            </Button>
          </div>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
