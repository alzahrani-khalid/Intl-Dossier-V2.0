/**
 * CalendarEmptyWizard Component
 *
 * Interactive wizard shown when calendar has no events.
 * Guides users to create their first meeting or commitment with
 * templates for common event types and smart defaults based on user role.
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - Role-based template recommendations
 * - Event type templates with smart defaults
 * - Direct event creation flow
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Users,
  Clock,
  Flag,
  GraduationCap,
  FileCheck,
  Globe,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Briefcase,
  CalendarDays,
  Target,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// Event template type
interface EventTemplate {
  id: string
  type: string
  titleKey: string
  descriptionKey: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  defaults: {
    entry_type: string
    duration_minutes: number
    reminder_minutes: number
    all_day?: boolean
  }
  suggestedFor: string[] // User roles this template is suggested for
  tags: string[]
}

// Template definitions
const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'stakeholder-meeting',
    type: 'internal_meeting',
    titleKey: 'wizard.templates.stakeholderMeeting.title',
    descriptionKey: 'wizard.templates.stakeholderMeeting.description',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaults: {
      entry_type: 'internal_meeting',
      duration_minutes: 60,
      reminder_minutes: 15,
    },
    suggestedFor: ['admin', 'manager', 'analyst', 'officer'],
    tags: ['meeting', 'stakeholder', 'coordination'],
  },
  {
    id: 'deadline-reminder',
    type: 'deadline',
    titleKey: 'wizard.templates.deadlineReminder.title',
    descriptionKey: 'wizard.templates.deadlineReminder.description',
    icon: Flag,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    defaults: {
      entry_type: 'deadline',
      duration_minutes: 0,
      reminder_minutes: 1440, // 1 day before
      all_day: true,
    },
    suggestedFor: ['admin', 'manager', 'analyst', 'officer', 'viewer'],
    tags: ['deadline', 'reminder', 'due-date'],
  },
  {
    id: 'forum-event',
    type: 'main_event',
    titleKey: 'wizard.templates.forumEvent.title',
    descriptionKey: 'wizard.templates.forumEvent.description',
    icon: Globe,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    defaults: {
      entry_type: 'main_event',
      duration_minutes: 480, // 8 hours
      reminder_minutes: 1440,
    },
    suggestedFor: ['admin', 'manager', 'analyst'],
    tags: ['forum', 'international', 'event'],
  },
  {
    id: 'training-session',
    type: 'training',
    titleKey: 'wizard.templates.trainingSession.title',
    descriptionKey: 'wizard.templates.trainingSession.description',
    icon: GraduationCap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaults: {
      entry_type: 'training',
      duration_minutes: 120,
      reminder_minutes: 60,
    },
    suggestedFor: ['admin', 'manager', 'officer'],
    tags: ['training', 'workshop', 'learning'],
  },
  {
    id: 'review-meeting',
    type: 'review',
    titleKey: 'wizard.templates.reviewMeeting.title',
    descriptionKey: 'wizard.templates.reviewMeeting.description',
    icon: FileCheck,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    defaults: {
      entry_type: 'review',
      duration_minutes: 90,
      reminder_minutes: 30,
    },
    suggestedFor: ['admin', 'manager', 'analyst'],
    tags: ['review', 'assessment', 'evaluation'],
  },
  {
    id: 'bilateral-meeting',
    type: 'internal_meeting',
    titleKey: 'wizard.templates.bilateralMeeting.title',
    descriptionKey: 'wizard.templates.bilateralMeeting.description',
    icon: Briefcase,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    defaults: {
      entry_type: 'internal_meeting',
      duration_minutes: 45,
      reminder_minutes: 15,
    },
    suggestedFor: ['admin', 'manager', 'analyst', 'officer'],
    tags: ['bilateral', 'diplomatic', 'meeting'],
  },
]

interface CalendarEmptyWizardProps {
  onCreateEvent: (template: EventTemplate) => void
  onDismiss?: () => void
  className?: string
}

export function CalendarEmptyWizard({
  onCreateEvent,
  onDismiss,
  className,
}: CalendarEmptyWizardProps) {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'
  const { user } = useAuth()

  const [step, setStep] = useState<'welcome' | 'templates' | 'quick-create'>('welcome')
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null)

  // Get user role for smart defaults
  const userRole = user?.role || 'viewer'

  // Filter and sort templates based on user role
  const sortedTemplates = useMemo(() => {
    return [...EVENT_TEMPLATES].sort((a, b) => {
      const aRecommended = a.suggestedFor.includes(userRole)
      const bRecommended = b.suggestedFor.includes(userRole)
      if (aRecommended && !bRecommended) return -1
      if (!aRecommended && bRecommended) return 1
      return 0
    })
  }, [userRole])

  // Get recommended templates (first 3 for the user's role)
  const recommendedTemplates = useMemo(() => {
    return sortedTemplates.filter((t) => t.suggestedFor.includes(userRole)).slice(0, 3)
  }, [sortedTemplates, userRole])

  const handleTemplateSelect = useCallback((template: EventTemplate) => {
    setSelectedTemplate(template)
    setStep('quick-create')
  }, [])

  const handleCreateEvent = useCallback(() => {
    if (selectedTemplate) {
      onCreateEvent(selectedTemplate)
    }
  }, [selectedTemplate, onCreateEvent])

  const handleBack = useCallback(() => {
    if (step === 'quick-create') {
      setStep('templates')
      setSelectedTemplate(null)
    } else if (step === 'templates') {
      setStep('welcome')
    }
  }, [step])

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">{t('wizard.welcome.title')}</CardTitle>
              <CardDescription className="text-sm sm:text-base max-w-md mx-auto">
                {t('wizard.welcome.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Quick action cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setStep('templates')}
                  className="flex flex-col items-center gap-2 p-4 sm:p-6 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all group min-h-[120px]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">
                    {t('wizard.welcome.useTemplate')}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground text-center">
                    {t('wizard.welcome.useTemplateDesc')}
                  </span>
                </button>

                <button
                  onClick={() => onCreateEvent(EVENT_TEMPLATES[0]!)}
                  className="flex flex-col items-center gap-2 p-4 sm:p-6 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground hover:bg-muted/50 transition-all group min-h-[120px]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">
                    {t('wizard.welcome.createBlank')}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground text-center">
                    {t('wizard.welcome.createBlankDesc')}
                  </span>
                </button>
              </div>

              {/* Recommended templates preview */}
              {recommendedTemplates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('wizard.welcome.recommended')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-sm',
                          template.bgColor,
                          'hover:ring-2 hover:ring-primary/20',
                        )}
                      >
                        <template.icon className={cn('h-4 w-4', template.color)} />
                        <span className="text-sm font-medium">{t(template.titleKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dismiss button */}
              {onDismiss && (
                <div className="flex justify-center pt-2">
                  <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs">
                    {t('wizard.welcome.dismiss')}
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}

        {step === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="min-h-11 min-w-11"
                >
                  {isRTL ? (
                    <ChevronRight className="h-4 w-4 me-1" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 me-1" />
                  )}
                  {t('wizard.back')}
                </Button>
                {onDismiss && (
                  <Button variant="ghost" size="icon" onClick={onDismiss} className="h-9 w-9">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardTitle className="text-lg sm:text-xl">{t('wizard.templates.title')}</CardTitle>
              <CardDescription className="text-sm">
                {t('wizard.templates.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto">
              {sortedTemplates.map((template) => {
                const isRecommended = template.suggestedFor.includes(userRole)
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      'w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all text-start',
                      'hover:shadow-md hover:border-primary/50',
                      isRecommended && 'ring-2 ring-primary/20',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg',
                        template.bgColor,
                      )}
                    >
                      <template.icon className={cn('h-5 w-5 sm:h-6 sm:w-6', template.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm sm:text-base">
                          {t(template.titleKey)}
                        </span>
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            {t('wizard.recommended')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {t(template.descriptionKey)}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.defaults.duration_minutes > 0
                            ? `${template.defaults.duration_minutes} ${t('wizard.minutes')}`
                            : t('wizard.allDay')}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {t(`types.${template.defaults.entry_type}`)}
                        </span>
                      </div>
                    </div>
                    {isRTL ? (
                      <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                    )}
                  </button>
                )
              })}
            </CardContent>
          </motion.div>
        )}

        {step === 'quick-create' && selectedTemplate && (
          <motion.div
            key="quick-create"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="min-h-11 min-w-11"
                >
                  {isRTL ? (
                    <ChevronRight className="h-4 w-4 me-1" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 me-1" />
                  )}
                  {t('wizard.back')}
                </Button>
                {onDismiss && (
                  <Button variant="ghost" size="icon" onClick={onDismiss} className="h-9 w-9">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Selected template preview */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 sm:p-6 rounded-xl',
                  selectedTemplate.bgColor,
                )}
              >
                <div
                  className={cn(
                    'flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-background/50',
                  )}
                >
                  <selectedTemplate.icon
                    className={cn('h-7 w-7 sm:h-8 sm:w-8', selectedTemplate.color)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg">
                    {t(selectedTemplate.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(selectedTemplate.descriptionKey)}
                  </p>
                </div>
              </div>

              {/* Default settings summary */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">{t('wizard.quickCreate.defaults')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {t('wizard.quickCreate.type')}:{' '}
                      </span>
                      <span className="font-medium">
                        {t(`types.${selectedTemplate.defaults.entry_type}`)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {t('wizard.quickCreate.duration')}:{' '}
                      </span>
                      <span className="font-medium">
                        {selectedTemplate.defaults.duration_minutes > 0
                          ? `${selectedTemplate.defaults.duration_minutes} ${t('wizard.minutes')}`
                          : t('wizard.allDay')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">{t('wizard.quickCreate.tip')}</p>
                  <p className="text-muted-foreground mt-1">{t('wizard.quickCreate.tipDesc')}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full sm:w-auto min-h-11"
                >
                  {t('wizard.quickCreate.chooseAnother')}
                </Button>
                <Button onClick={handleCreateEvent} className="w-full sm:flex-1 min-h-11">
                  <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('wizard.quickCreate.createEvent')}
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export { EVENT_TEMPLATES, type EventTemplate }
