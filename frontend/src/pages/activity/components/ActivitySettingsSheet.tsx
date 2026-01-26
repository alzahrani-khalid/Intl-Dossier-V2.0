/**
 * Activity Settings Sheet Component
 *
 * Settings panel for activity preferences:
 * - Push notifications toggle
 * - Email digest frequency selector
 *
 * Mobile-first and RTL-ready
 */

import { useTranslation } from 'react-i18next'
import { Bell, Mail, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useActivityPreferences } from '@/hooks/useActivityFeed'

interface ActivitySettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivitySettingsSheet({ open, onOpenChange }: ActivitySettingsSheetProps) {
  const { t, i18n } = useTranslation('activity-feed')
  const isRTL = i18n.language === 'ar'

  const { preferences, isLoading, updatePreferences, isUpdating } = useActivityPreferences()

  const handleNotificationsChange = async (enabled: boolean) => {
    await updatePreferences({
      push_notifications_enabled: enabled,
    })
  }

  const handleEmailDigestChange = async (value: string) => {
    await updatePreferences({
      email_digest_frequency: value as 'never' | 'daily' | 'weekly',
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRTL ? 'left' : 'right'}
        className="w-full sm:max-w-md"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SheetHeader>
          <SheetTitle>{t('settings.title')}</SheetTitle>
          <SheetDescription>{t('settings.description')}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Push Notifications */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="push-notifications" className="font-medium cursor-pointer">
                      {t('settings.notifications.title')}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('settings.notifications.description')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences?.push_notifications_enabled ?? false}
                  onCheckedChange={handleNotificationsChange}
                  disabled={isUpdating}
                  className="flex-shrink-0"
                />
              </div>

              {/* Email Digest */}
              <div className="p-4 rounded-lg border space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <Label className="font-medium">{t('settings.emailDigest.title')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('settings.emailDigest.description')}
                    </p>
                  </div>
                </div>

                <Select
                  value={preferences?.email_digest_frequency ?? 'never'}
                  onValueChange={handleEmailDigestChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t('settings.emailDigest.options.never')}</SelectItem>
                    <SelectItem value="daily">{t('settings.emailDigest.options.daily')}</SelectItem>
                    <SelectItem value="weekly">
                      {t('settings.emailDigest.options.weekly')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ActivitySettingsSheet
