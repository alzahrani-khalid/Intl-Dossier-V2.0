import { useTranslation } from 'react-i18next'
import {
  Bell,
  Mail,
  Smartphone,
  AlertTriangle,
  Calendar,
  FileText,
  CheckSquare,
  AtSign,
} from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { SettingsSectionCard, SettingsItem } from '../SettingsSectionCard'

interface NotificationsSettingsSectionProps {
  form: UseFormReturn<any>
}

/**
 * Notifications settings section component
 * Handles all notification preferences
 */
export function NotificationsSettingsSection({ form }: NotificationsSettingsSectionProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  const notificationSettings = [
    {
      key: 'notifications_push',
      label: t('notifications.pushNotifications'),
      description: t('notifications.pushNotificationsDesc'),
      icon: Smartphone,
    },
    {
      key: 'notifications_email',
      label: t('notifications.emailNotifications'),
      description: t('notifications.emailNotificationsDesc'),
      icon: Mail,
    },
    {
      key: 'notifications_mou_expiry',
      label: t('notifications.mouAlerts'),
      description: t('notifications.mouAlertsDesc'),
      icon: AlertTriangle,
    },
    {
      key: 'notifications_event_reminders',
      label: t('notifications.eventReminders'),
      description: t('notifications.eventRemindersDesc'),
      icon: Calendar,
    },
    {
      key: 'notifications_report_generation',
      label: t('notifications.reportGeneration'),
      description: t('notifications.reportGenerationDesc'),
      icon: FileText,
    },
    {
      key: 'notifications_assignment_updates',
      label: t('notifications.assignmentUpdates'),
      description: t('notifications.assignmentUpdatesDesc'),
      icon: CheckSquare,
    },
    {
      key: 'notifications_commitment_deadlines',
      label: t('notifications.commitmentDeadlines'),
      description: t('notifications.commitmentDeadlinesDesc'),
      icon: Calendar,
    },
    {
      key: 'notifications_mentions',
      label: t('notifications.mentions'),
      description: t('notifications.mentionsDesc'),
      icon: AtSign,
    },
  ]

  return (
    <SettingsSectionCard
      title={t('notifications.title')}
      description={t('notifications.description')}
      icon={Bell}
    >
      <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
        {notificationSettings.map((setting) => {
          const Icon = setting.icon
          const value = form.watch(setting.key)

          return (
            <SettingsItem
              key={setting.key}
              label={setting.label}
              description={setting.description}
              icon={Icon}
            >
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  form.setValue(setting.key, checked, { shouldDirty: true })
                }
                className="shrink-0"
              />
            </SettingsItem>
          )
        })}
      </div>
    </SettingsSectionCard>
  )
}
