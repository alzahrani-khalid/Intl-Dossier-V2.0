import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  ClipboardList,
  Inbox,
  Calendar,
  AlertTriangle,
  AtSign,
  Clock,
  GitBranch,
  Mail,
  Smartphone,
  Monitor,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Check,
  Settings,
  Sparkles,
  FileText,
  Users,
  Play,
  Pause,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { NotificationCategory, CategoryPreference } from '@/hooks/useNotificationCenter'

// Example notification data for preview
export interface PreviewNotification {
  id: string
  type: NotificationCategory
  titleKey: string
  messageKey: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  timeAgo: string
  isExample: true
}

// Category icons mapping
const categoryIcons: Record<NotificationCategory, React.ElementType> = {
  assignments: ClipboardList,
  intake: Inbox,
  calendar: Calendar,
  signals: AlertTriangle,
  mentions: AtSign,
  deadlines: Clock,
  system: Bell,
  workflow: GitBranch,
}

// Priority colors
const priorityColors: Record<string, string> = {
  urgent: 'border-s-red-600 bg-red-50 dark:bg-red-950/20',
  high: 'border-s-orange-500 bg-orange-50 dark:bg-orange-950/20',
  normal: 'border-s-blue-500 bg-card',
  low: 'border-s-gray-400 bg-card',
}

// Category colors
const categoryColors: Record<NotificationCategory, string> = {
  assignments: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  intake: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  calendar: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  signals: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  mentions: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  deadlines: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  system: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
  workflow: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
}

// Sample notifications for the timeline preview
const SAMPLE_NOTIFICATIONS: PreviewNotification[] = [
  {
    id: '1',
    type: 'mentions',
    titleKey: 'preview.examples.mention.title',
    messageKey: 'preview.examples.mention.message',
    priority: 'high',
    timeAgo: '2m',
    isExample: true,
  },
  {
    id: '2',
    type: 'assignments',
    titleKey: 'preview.examples.assignment.title',
    messageKey: 'preview.examples.assignment.message',
    priority: 'normal',
    timeAgo: '15m',
    isExample: true,
  },
  {
    id: '3',
    type: 'calendar',
    titleKey: 'preview.examples.calendar.title',
    messageKey: 'preview.examples.calendar.message',
    priority: 'normal',
    timeAgo: '1h',
    isExample: true,
  },
  {
    id: '4',
    type: 'deadlines',
    titleKey: 'preview.examples.deadline.title',
    messageKey: 'preview.examples.deadline.message',
    priority: 'urgent',
    timeAgo: '2h',
    isExample: true,
  },
  {
    id: '5',
    type: 'workflow',
    titleKey: 'preview.examples.workflow.title',
    messageKey: 'preview.examples.workflow.message',
    priority: 'normal',
    timeAgo: '3h',
    isExample: true,
  },
  {
    id: '6',
    type: 'signals',
    titleKey: 'preview.examples.signal.title',
    messageKey: 'preview.examples.signal.message',
    priority: 'high',
    timeAgo: '4h',
    isExample: true,
  },
]

// Categories for preferences
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

// Default category preferences
const DEFAULT_CATEGORY_PREFERENCE: Omit<CategoryPreference, 'category'> = {
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  sms_enabled: false,
  sound_enabled: true,
}

export interface NotificationPreviewTimelineProps {
  /** Callback when user completes the wizard */
  onComplete?: (preferences: CategoryPreference[]) => void
  /** Callback to skip the wizard */
  onSkip?: () => void
  /** Whether to show in compact mode */
  compact?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Interactive timeline showing example notifications with preference configuration.
 * Helps users understand notification types before receiving real ones.
 */
export function NotificationPreviewTimeline({
  onComplete,
  onSkip,
  compact = false,
  className,
}: NotificationPreviewTimelineProps) {
  const { t, i18n } = useTranslation('notification-center')
  const isRTL = i18n.language === 'ar'

  // Current step: 0 = timeline preview, 1 = preferences setup
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0)

  // Local preferences state
  const [preferences, setPreferences] = useState<Record<NotificationCategory, CategoryPreference>>(
    () => {
      const initial: Record<NotificationCategory, CategoryPreference> = {} as any
      CATEGORIES.forEach((category) => {
        initial[category] = { ...DEFAULT_CATEGORY_PREFERENCE, category }
      })
      return initial
    },
  )

  // Animation effect for cycling through notifications
  React.useEffect(() => {
    if (!isAnimating || currentStep !== 0) return

    const interval = setInterval(() => {
      setActiveNotificationIndex((prev) => (prev >= SAMPLE_NOTIFICATIONS.length - 1 ? 0 : prev + 1))
    }, 3000)

    return () => clearInterval(interval)
  }, [isAnimating, currentStep])

  const handleTogglePreference = useCallback(
    (category: NotificationCategory, field: keyof CategoryPreference, value: boolean) => {
      setPreferences((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }))
    },
    [],
  )

  const handleEnableAll = useCallback(() => {
    setPreferences((prev) => {
      const updated = { ...prev }
      CATEGORIES.forEach((category) => {
        updated[category] = {
          ...updated[category],
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          sound_enabled: true,
        }
      })
      return updated
    })
  }, [])

  const handleDisableAll = useCallback(() => {
    setPreferences((prev) => {
      const updated = { ...prev }
      CATEGORIES.forEach((category) => {
        updated[category] = {
          ...updated[category],
          email_enabled: false,
          push_enabled: false,
          in_app_enabled: false,
          sound_enabled: false,
        }
      })
      return updated
    })
  }, [])

  const handleComplete = useCallback(() => {
    const prefsArray = Object.values(preferences)
    onComplete?.(prefsArray)
  }, [preferences, onComplete])

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight
  const BackChevronIcon = isRTL ? ChevronRight : ChevronLeft

  // Render preview notification item
  const renderPreviewNotification = (notification: PreviewNotification, index: number) => {
    const Icon = categoryIcons[notification.type] || Bell
    const isActive = index === activeNotificationIndex

    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: isActive ? 1.02 : 1,
        }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={cn(
          'relative flex gap-3 p-3 sm:p-4 border-s-4 rounded-lg transition-all',
          priorityColors[notification.priority],
          isActive && 'ring-2 ring-primary shadow-lg',
        )}
      >
        {/* Example badge */}
        <Badge variant="secondary" className="absolute top-2 end-2 text-xs">
          {t('preview.exampleBadge')}
        </Badge>

        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center',
            categoryColors[notification.type],
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pe-16">
          <p className="text-sm font-medium truncate">{t(notification.titleKey)}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {t(notification.messageKey)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {notification.timeAgo} {t('preview.ago')}
            </span>
            {notification.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs">
                {t('priority.urgent')}
              </Badge>
            )}
            {notification.priority === 'high' && (
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                {t('priority.high')}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Step 0: Timeline Preview
  const renderTimelinePreview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">{t('preview.title')}</h2>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          {t('preview.description')}
        </p>
      </div>

      {/* Animation control */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAnimating(!isAnimating)}
          className="gap-2"
        >
          {isAnimating ? (
            <>
              <Pause className="h-4 w-4" />
              {t('preview.pauseAnimation')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {t('preview.playAnimation')}
            </>
          )}
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {SAMPLE_NOTIFICATIONS.map((notification, index) =>
          renderPreviewNotification(notification, index),
        )}
      </div>

      {/* Category legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('preview.categoriesTitle')}</CardTitle>
          <CardDescription className="text-sm">
            {t('preview.categoriesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {CATEGORIES.map((category) => {
              const Icon = categoryIcons[category]
              return (
                <div key={category} className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      categoryColors[category],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs sm:text-sm truncate">{t(`categories.${category}`)}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => setCurrentStep(1)} className="min-h-11 gap-2">
          <Settings className="h-4 w-4" />
          {t('preview.configurePreferences')}
          <ChevronIcon className={cn('h-4 w-4', isRTL && 'rotate-180')} />
        </Button>
        {onSkip && (
          <Button variant="outline" onClick={onSkip} className="min-h-11">
            {t('preview.skipForNow')}
          </Button>
        )}
      </div>
    </div>
  )

  // Step 1: Preferences Setup
  const renderPreferencesSetup = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">{t('preview.preferencesTitle')}</h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          {t('preview.preferencesDescription')}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {t('preview.step1')}
          </span>
        </div>
        <div className="h-px w-8 bg-primary" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium hidden sm:inline">{t('preview.step2')}</span>
        </div>
      </div>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="h-5 w-5" />
                {t('preview.channelSettings')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('preview.channelDescription')}
              </CardDescription>
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
          {/* Table header - hidden on mobile */}
          <div className="hidden sm:grid grid-cols-6 gap-4 mb-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-2">{t('preferences.channels')}</div>
            <div className="text-center">
              <Mail className="h-4 w-4 mx-auto" />
              <span className="text-xs">{t('preferences.email')}</span>
            </div>
            <div className="text-center">
              <Smartphone className="h-4 w-4 mx-auto" />
              <span className="text-xs">{t('preferences.push')}</span>
            </div>
            <div className="text-center">
              <Monitor className="h-4 w-4 mx-auto" />
              <span className="text-xs">{t('preferences.inApp')}</span>
            </div>
            <div className="text-center">
              <Volume2 className="h-4 w-4 mx-auto" />
              <span className="text-xs">{t('preferences.sound')}</span>
            </div>
          </div>

          <Separator className="mb-4 hidden sm:block" />

          {/* Category rows - responsive layout */}
          <div className="space-y-4">
            {CATEGORIES.map((category) => {
              const pref = preferences[category]
              const Icon = categoryIcons[category]
              return (
                <div key={category} className="border rounded-lg p-3 sm:p-0 sm:border-0">
                  {/* Mobile layout */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          categoryColors[category],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <Label className="font-medium">{t(`categories.${category}`)}</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.email_enabled}
                          onCheckedChange={(v) =>
                            handleTogglePreference(category, 'email_enabled', v)
                          }
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.push_enabled}
                          onCheckedChange={(v) =>
                            handleTogglePreference(category, 'push_enabled', v)
                          }
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.in_app_enabled}
                          onCheckedChange={(v) =>
                            handleTogglePreference(category, 'in_app_enabled', v)
                          }
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={pref.sound_enabled}
                          onCheckedChange={(v) =>
                            handleTogglePreference(category, 'sound_enabled', v)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-6 gap-4 items-center py-2">
                    <div className="col-span-2 flex items-center gap-2">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          categoryColors[category],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <Label className="font-medium">{t(`categories.${category}`)}</Label>
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref.email_enabled}
                        onCheckedChange={(v) =>
                          handleTogglePreference(category, 'email_enabled', v)
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref.push_enabled}
                        onCheckedChange={(v) => handleTogglePreference(category, 'push_enabled', v)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref.in_app_enabled}
                        onCheckedChange={(v) =>
                          handleTogglePreference(category, 'in_app_enabled', v)
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref.sound_enabled}
                        onCheckedChange={(v) =>
                          handleTogglePreference(category, 'sound_enabled', v)
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tip card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-3 pt-4">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{t('preview.tip')}</p>
            <p className="text-sm text-muted-foreground">{t('preview.tipDescription')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(0)} className="min-h-11 gap-2">
          <BackChevronIcon className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          {t('preview.backToPreview')}
        </Button>
        <Button onClick={handleComplete} className="min-h-11 gap-2">
          <Check className="h-4 w-4" />
          {t('preview.saveAndContinue')}
        </Button>
      </div>
    </div>
  )

  return (
    <div
      className={cn('w-full', compact ? 'max-w-2xl' : 'max-w-3xl', 'mx-auto', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="notification-preview-timeline"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 ? renderTimelinePreview() : renderPreferencesSetup()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
