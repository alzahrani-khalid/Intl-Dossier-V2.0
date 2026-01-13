/**
 * OnboardingChecklist Component
 *
 * Displays role-specific onboarding checklist items with progress tracking,
 * visual feedback, and milestone celebrations. Mobile-first, RTL-compatible.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronRight,
  Clock,
  Lock,
  SkipForward,
  X,
  RotateCcw,
  FolderOpen,
  GitBranch,
  Bell,
  Calendar,
  FileText,
  FileCheck,
  FileSignature,
  LayoutDashboard,
  Users,
  Zap,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist'
import type { OnboardingChecklistItem, OnboardingChecklistProps } from '@/types/onboarding.types'

// Icon mapping for checklist items
const iconMap: Record<string, LucideIcon> = {
  FolderOpen,
  GitBranch,
  Bell,
  Calendar,
  FileText,
  FileCheck,
  FileSignature,
  LayoutDashboard,
  Users,
  Zap,
}

/**
 * Individual checklist item component
 */
interface ChecklistItemProps {
  item: OnboardingChecklistItem
  isCompleted: boolean
  isSkipped: boolean
  isLocked: boolean
  onComplete: () => void
  onSkip: () => void
  onClick: () => void
  allowSkip: boolean
  isRTL: boolean
  variant: 'full' | 'compact' | 'inline' | 'card'
}

function ChecklistItem({
  item,
  isCompleted,
  isSkipped,
  isLocked,
  onComplete,
  onSkip,
  onClick,
  allowSkip,
  isRTL,
  variant,
}: ChecklistItemProps) {
  const { t } = useTranslation('onboarding')
  const Icon = iconMap[item.iconName] || FolderOpen

  const handleClick = useCallback(() => {
    if (isLocked) return
    if (isCompleted) return
    onClick()
  }, [isLocked, isCompleted, onClick])

  const handleComplete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isLocked && !isCompleted) {
        onComplete()
      }
    },
    [isLocked, isCompleted, onComplete],
  )

  const handleSkip = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isLocked && !isCompleted && !isSkipped) {
        onSkip()
      }
    },
    [isLocked, isCompleted, isSkipped, onSkip],
  )

  // Compact variant
  if (variant === 'compact' || variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={isLocked}
        className={cn(
          'flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-3 rounded-lg transition-all',
          'text-start',
          isCompleted && 'bg-green-50 dark:bg-green-950/30',
          isSkipped && 'bg-muted/50 opacity-60',
          isLocked && 'opacity-50 cursor-not-allowed',
          !isCompleted && !isSkipped && !isLocked && 'hover:bg-muted/50 cursor-pointer',
        )}
      >
        {/* Status indicator */}
        <div
          className={cn(
            'flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center',
            isCompleted && 'bg-green-500 text-white',
            isSkipped && 'bg-muted text-muted-foreground',
            isLocked && 'bg-muted text-muted-foreground',
            !isCompleted && !isSkipped && !isLocked && 'bg-primary/10 text-primary',
          )}
        >
          {isCompleted ? (
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : isLocked ? (
            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : isSkipped ? (
            <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-xs sm:text-sm font-medium truncate',
              isCompleted && 'text-green-700 dark:text-green-400 line-through',
              isSkipped && 'text-muted-foreground line-through',
            )}
          >
            {t(item.titleKey)}
          </p>
        </div>

        {/* Chevron */}
        {!isCompleted && !isLocked && !isSkipped && (
          <ChevronRight
            className={cn('w-4 h-4 text-muted-foreground flex-shrink-0', isRTL && 'rotate-180')}
          />
        )}
      </button>
    )
  }

  // Full variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative rounded-lg border p-3 sm:p-4 transition-all',
        isCompleted && 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800',
        isSkipped && 'border-muted bg-muted/30 opacity-60',
        isLocked && 'border-muted bg-muted/10 opacity-50',
        !isCompleted &&
          !isSkipped &&
          !isLocked &&
          'border-border hover:border-primary/50 hover:shadow-sm cursor-pointer',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center',
            isCompleted && 'bg-green-500 text-white',
            isSkipped && 'bg-muted text-muted-foreground',
            isLocked && 'bg-muted text-muted-foreground',
            !isCompleted && !isSkipped && !isLocked && 'bg-primary/10 text-primary',
          )}
        >
          {isCompleted ? (
            <Check className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : isLocked ? (
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4
                className={cn(
                  'text-sm sm:text-base font-semibold',
                  isCompleted && 'text-green-700 dark:text-green-400',
                  isSkipped && 'text-muted-foreground',
                )}
              >
                {t(item.titleKey)}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                {t(item.descriptionKey)}
              </p>
            </div>

            {/* Badge */}
            {item.isRequired && !isCompleted && (
              <span className="flex-shrink-0 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {t('checklist.required')}
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
            {item.estimatedMinutes && !isCompleted && (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {t('checklist.estimatedTime', { minutes: item.estimatedMinutes })}
              </span>
            )}

            {isLocked && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {t('checklist.locked')}
              </span>
            )}

            {isCompleted && (
              <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                {t('checklist.completed')}
              </span>
            )}

            {isSkipped && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {t('checklist.skipped')}
              </span>
            )}
          </div>

          {/* Actions (visible on hover for desktop) */}
          {!isCompleted && !isLocked && (
            <div className="flex items-center gap-2 mt-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button size="sm" onClick={handleComplete} className="h-8 text-xs">
                <Check className={cn('w-3 h-3', isRTL ? 'ms-1' : 'me-1')} />
                {t('checklist.completed')}
              </Button>
              {allowSkip && !item.isRequired && !isSkipped && (
                <Button size="sm" variant="ghost" onClick={handleSkip} className="h-8 text-xs">
                  <SkipForward className={cn('w-3 h-3', isRTL ? 'ms-1' : 'me-1')} />
                  {t('checklist.skip')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        {!isCompleted && !isLocked && (
          <ChevronRight
            className={cn(
              'w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1',
              isRTL && 'rotate-180 group-hover:-translate-x-1',
            )}
          />
        )}
      </div>

      {/* Hint tooltip */}
      {item.hintKey && !isCompleted && !isLocked && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed">
          <p className="text-[10px] sm:text-xs text-muted-foreground/70 italic">
            💡 {t(item.hintKey)}
          </p>
        </div>
      )}
    </motion.div>
  )
}

/**
 * Main OnboardingChecklist component
 */
export function OnboardingChecklist({
  variant = 'full',
  showProgress = true,
  showEstimatedTime = true,
  allowSkip = true,
  allowDismiss = true,
  maxItems,
  className,
  onItemClick,
  onDismiss,
  onComplete,
}: OnboardingChecklistProps) {
  const { t, i18n } = useTranslation('onboarding')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const {
    checklist,
    isLoading,
    completedCount,
    totalCount,
    completionPercentage,
    estimatedTimeRemaining,
    isFullyCompleted,
    isDismissed,
    completeItem,
    skipItem,
    dismissOnboarding,
    resumeOnboarding,
    resetProgress,
    isItemCompleted,
    isItemSkipped,
    isItemLocked,
  } = useOnboardingChecklist()

  const [showCompleted, setShowCompleted] = useState(false)

  // Get items to display
  const items = checklist?.items ?? []
  const displayItems = maxItems
    ? items.slice(0, maxItems)
    : showCompleted
      ? items
      : items.filter((item) => !isItemCompleted(item.id) && !isItemSkipped(item.id))

  // Handle item click
  const handleItemClick = useCallback(
    (item: OnboardingChecklistItem) => {
      if (onItemClick) {
        onItemClick(item)
      } else if (item.route) {
        navigate({ to: item.route })
      }
    },
    [navigate, onItemClick],
  )

  // Handle dismiss
  const handleDismiss = useCallback(async () => {
    await dismissOnboarding()
    onDismiss?.()
  }, [dismissOnboarding, onDismiss])

  // Handle completion
  const handleComplete = useCallback(
    async (itemId: string) => {
      await completeItem(itemId)
      if (completedCount + 1 === totalCount) {
        onComplete?.()
      }
    },
    [completeItem, completedCount, totalCount, onComplete],
  )

  // Handle skip
  const handleSkip = useCallback(
    async (itemId: string) => {
      await skipItem(itemId)
    },
    [skipItem],
  )

  // If dismissed, show resume option
  if (isDismissed) {
    return (
      <div
        className={cn('flex items-center justify-center p-4', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Button variant="outline" onClick={resumeOnboarding} className="min-h-11">
          <RotateCcw className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('checklist.resume')}
        </Button>
      </div>
    )
  }

  // If fully completed, show success message
  if (isFullyCompleted) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-6 sm:p-8 text-center',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-green-700 dark:text-green-400">
          {t('checklist.allComplete')}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          {t('checklist.allCompleteMessage')}
        </p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-2 bg-muted rounded w-full" />
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Card variant wrapper
  if (variant === 'card') {
    return (
      <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">{t('checklist.title')}</CardTitle>
            {allowDismiss && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('checklist.dismiss')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('checklist.dismissConfirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDismiss}>
                      {t('checklist.dismiss')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('checklist.subtitle')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-muted-foreground">
                  {t('checklist.progress', { completed: completedCount, total: totalCount })}
                </span>
                <span className="font-medium text-primary">
                  {t('checklist.progressPercentage', { percentage: completionPercentage })}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}

          {/* Estimated time */}
          {showEstimatedTime && estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
              <Clock className="w-3 h-3" />
              {t('checklist.totalEstimatedTime', { minutes: estimatedTimeRemaining })}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  isCompleted={isItemCompleted(item.id)}
                  isSkipped={isItemSkipped(item.id)}
                  isLocked={isItemLocked(item.id)}
                  onComplete={() => handleComplete(item.id)}
                  onSkip={() => handleSkip(item.id)}
                  onClick={() => handleItemClick(item)}
                  allowSkip={allowSkip}
                  isRTL={isRTL}
                  variant="compact"
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Toggle completed */}
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full mt-3 text-xs"
            >
              {showCompleted ? t('checklist.hideCompleted') : t('checklist.showCompleted')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Compact/inline variant
  if (variant === 'compact' || variant === 'inline') {
    return (
      <div className={cn('space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {showProgress && (
          <div className="flex items-center gap-2 mb-3">
            <Progress value={completionPercentage} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedCount}/{totalCount}
            </span>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              isCompleted={isItemCompleted(item.id)}
              isSkipped={isItemSkipped(item.id)}
              isLocked={isItemLocked(item.id)}
              onComplete={() => handleComplete(item.id)}
              onSkip={() => handleSkip(item.id)}
              onClick={() => handleItemClick(item)}
              allowSkip={allowSkip}
              isRTL={isRTL}
              variant={variant}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }

  // Full variant (default)
  return (
    <div className={cn('space-y-4 sm:space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{t('checklist.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('checklist.subtitle')}</p>
        </div>
        {allowDismiss && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                {t('checklist.dismiss')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('checklist.dismiss')}</AlertDialogTitle>
                <AlertDialogDescription>{t('checklist.dismissConfirm')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDismiss}>
                  {t('checklist.dismiss')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('checklist.progress', { completed: completedCount, total: totalCount })}
            </span>
            <span className="font-medium text-primary">
              {t('checklist.progressPercentage', { percentage: completionPercentage })}
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2.5" />
          {showEstimatedTime && estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {t('checklist.totalEstimatedTime', { minutes: estimatedTimeRemaining })}
            </div>
          )}
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              isCompleted={isItemCompleted(item.id)}
              isSkipped={isItemSkipped(item.id)}
              isLocked={isItemLocked(item.id)}
              onComplete={() => handleComplete(item.id)}
              onSkip={() => handleSkip(item.id)}
              onClick={() => handleItemClick(item)}
              allowSkip={allowSkip}
              isRTL={isRTL}
              variant="full"
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-2">
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs"
          >
            {showCompleted ? t('checklist.hideCompleted') : t('checklist.showCompleted')}
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <RotateCcw className={cn('w-3 h-3', isRTL ? 'ms-1' : 'me-1')} />
              {t('checklist.reset')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('checklist.reset')}</AlertDialogTitle>
              <AlertDialogDescription>{t('checklist.resetConfirm')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={resetProgress}>{t('checklist.reset')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default OnboardingChecklist
