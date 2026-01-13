/**
 * ProgressiveHint Component
 *
 * Displays contextual hints that adapt based on user experience level
 * and interaction history. Supports multiple variants for different UI contexts.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Info,
  HelpCircle,
  Keyboard,
  Sparkles,
  LucideIcon,
} from 'lucide-react'
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure'
import type {
  HintDefinition,
  HintContextType,
  ProgressiveHintProps,
} from '@/types/progressive-disclosure.types'

// Icon mapping for hint contexts
const contextIcons: Record<HintContextType, LucideIcon> = {
  empty_state: Lightbulb,
  first_interaction: Sparkles,
  feature_discovery: Info,
  keyboard_shortcut: Keyboard,
  advanced_feature: Sparkles,
  form_field: HelpCircle,
  navigation: Info,
}

// Size configurations
const sizeConfig = {
  sm: {
    container: 'p-2 sm:p-3',
    icon: 'w-4 h-4',
    title: 'text-xs sm:text-sm font-medium',
    content: 'text-xs',
    button: 'h-6 w-6 sm:h-7 sm:w-7',
    badge: 'text-[10px]',
  },
  md: {
    container: 'p-3 sm:p-4',
    icon: 'w-4 h-4 sm:w-5 sm:h-5',
    title: 'text-sm sm:text-base font-medium',
    content: 'text-xs sm:text-sm',
    button: 'h-7 w-7 sm:h-8 sm:w-8',
    badge: 'text-xs',
  },
  lg: {
    container: 'p-4 sm:p-5',
    icon: 'w-5 h-5 sm:w-6 sm:h-6',
    title: 'text-base sm:text-lg font-medium',
    content: 'text-sm sm:text-base',
    button: 'h-8 w-8 sm:h-9 sm:w-9',
    badge: 'text-xs sm:text-sm',
  },
}

interface InternalHintProps {
  hint: HintDefinition
  variant: 'tooltip' | 'inline' | 'expandable' | 'card'
  size: 'sm' | 'md' | 'lg'
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  showDismiss: boolean
  onDismiss?: () => void
  onExpand?: () => void
  onAction?: () => void
  children?: React.ReactNode
  className?: string
  delayMs?: number
  isRTL: boolean
}

function InlineHint({
  hint,
  size,
  showDismiss,
  onDismiss,
  onExpand,
  onAction,
  className,
  isRTL,
}: Omit<InternalHintProps, 'variant' | 'position' | 'children' | 'delayMs'>) {
  const { t } = useTranslation('progressive-disclosure')
  const sizes = sizeConfig[size]
  const Icon = contextIcons[hint.contextType] || Lightbulb

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-start gap-2 sm:gap-3 rounded-lg bg-primary/5 border border-primary/20',
        sizes.container,
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10">
        <Icon className={cn('text-primary', sizes.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-foreground', sizes.title)}>{t(hint.titleKey)}</p>
        <p className={cn('text-muted-foreground mt-0.5', sizes.content)}>{t(hint.contentKey)}</p>

        {hint.shortcut && (
          <Badge variant="secondary" className={cn('mt-2', sizes.badge)}>
            <Keyboard className="w-3 h-3 me-1" />
            {hint.shortcut}
          </Badge>
        )}

        {hint.actionKey && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 text-primary"
            onClick={onAction}
          >
            {t(hint.actionKey)}
          </Button>
        )}
      </div>

      {showDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'flex-shrink-0 min-h-7 min-w-7 text-muted-foreground hover:text-foreground',
            sizes.button,
          )}
          onClick={onDismiss}
          aria-label={t('hint.dismiss')}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  )
}

function ExpandableHint({
  hint,
  size,
  showDismiss,
  onDismiss,
  onExpand,
  onAction,
  className,
  isRTL,
}: Omit<InternalHintProps, 'variant' | 'position' | 'children' | 'delayMs'>) {
  const { t } = useTranslation('progressive-disclosure')
  const [isExpanded, setIsExpanded] = useState(false)
  const sizes = sizeConfig[size]
  const Icon = contextIcons[hint.contextType] || Lightbulb

  const handleToggle = useCallback(() => {
    const newState = !isExpanded
    setIsExpanded(newState)
    if (newState && onExpand) {
      onExpand()
    }
  }, [isExpanded, onExpand])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('rounded-lg border bg-card overflow-hidden', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <button
        className={cn(
          'w-full flex items-center gap-2 sm:gap-3 text-start hover:bg-muted/50 transition-colors',
          sizes.container,
        )}
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10">
          <Icon className={cn('text-primary', sizes.icon)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-foreground truncate', sizes.title)}>{t(hint.titleKey)}</p>
        </div>

        <div className="flex items-center gap-1">
          {showDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'min-h-7 min-w-7 text-muted-foreground hover:text-foreground',
                sizes.button,
              )}
              onClick={(e) => {
                e.stopPropagation()
                onDismiss?.()
              }}
              aria-label={t('hint.dismiss')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className={cn('text-muted-foreground', sizes.icon)} />
          ) : (
            <ChevronDown className={cn('text-muted-foreground', sizes.icon)} />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn('border-t bg-muted/30', sizes.container)}>
              <p className={cn('text-muted-foreground', sizes.content)}>{t(hint.contentKey)}</p>

              {hint.expandedContentKey && (
                <p className={cn('text-muted-foreground mt-2', sizes.content)}>
                  {t(hint.expandedContentKey)}
                </p>
              )}

              {hint.shortcut && (
                <Badge variant="secondary" className={cn('mt-3', sizes.badge)}>
                  <Keyboard className="w-3 h-3 me-1" />
                  {hint.shortcut}
                </Badge>
              )}

              {hint.actionKey && (
                <Button variant="default" size="sm" className="mt-3" onClick={onAction}>
                  {t(hint.actionKey)}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CardHint({
  hint,
  size,
  showDismiss,
  onDismiss,
  onAction,
  className,
  isRTL,
}: Omit<InternalHintProps, 'variant' | 'position' | 'children' | 'delayMs' | 'onExpand'>) {
  const { t } = useTranslation('progressive-disclosure')
  const sizes = sizeConfig[size]
  const Icon = contextIcons[hint.contextType] || Lightbulb

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className={cn('relative overflow-hidden', className)}>
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />

        <CardContent className={cn('pt-5', sizes.container)}>
          {showDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute top-2 end-2 min-h-7 min-w-7 text-muted-foreground hover:text-foreground',
                sizes.button,
              )}
              onClick={onDismiss}
              aria-label={t('hint.dismiss')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <Icon className={cn('text-primary', sizes.icon)} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn('text-foreground', sizes.title)}>{t(hint.titleKey)}</p>
              <p className={cn('text-muted-foreground mt-1 sm:mt-2', sizes.content)}>
                {t(hint.contentKey)}
              </p>

              {hint.expandedContentKey && (
                <p className={cn('text-muted-foreground/80 mt-2', sizes.content)}>
                  {t(hint.expandedContentKey)}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                {hint.shortcut && (
                  <Badge variant="secondary" className={sizes.badge}>
                    <Keyboard className="w-3 h-3 me-1" />
                    {hint.shortcut}
                  </Badge>
                )}

                {hint.actionKey && (
                  <Button variant="default" size="sm" onClick={onAction}>
                    {t(hint.actionKey)}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TooltipHint({
  hint,
  size,
  position,
  showDismiss,
  onDismiss,
  children,
  delayMs,
  isRTL,
}: Omit<InternalHintProps, 'variant' | 'onExpand' | 'onAction' | 'className'>) {
  const { t } = useTranslation('progressive-disclosure')
  const sizes = sizeConfig[size]
  const Icon = contextIcons[hint.contextType] || Lightbulb

  // Map position for RTL
  const side = isRTL
    ? position === 'left'
      ? 'right'
      : position === 'right'
        ? 'left'
        : position
    : position

  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayMs}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side === 'auto' ? undefined : side}
          className="max-w-[300px] sm:max-w-[350px]"
        >
          <div className="flex items-start gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
            <Icon className={cn('text-primary flex-shrink-0 mt-0.5', sizes.icon)} />
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium', sizes.title)}>{t(hint.titleKey)}</p>
              <p className={cn('text-muted-foreground mt-1', sizes.content)}>
                {t(hint.contentKey)}
              </p>
              {hint.shortcut && (
                <Badge variant="secondary" className={cn('mt-2', sizes.badge)}>
                  <Keyboard className="w-3 h-3 me-1" />
                  {hint.shortcut}
                </Badge>
              )}
            </div>
            {showDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="min-h-6 min-w-6 h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss?.()
                }}
                aria-label={t('hint.dismiss')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * ProgressiveHint Component
 *
 * Displays contextual hints that adapt based on user experience level.
 *
 * @example
 * // Inline hint
 * <ProgressiveHint
 *   hint={{
 *     id: 'dossier-create-tip',
 *     contextType: 'empty_state',
 *     titleKey: 'hints.dossier.create.title',
 *     contentKey: 'hints.dossier.create.content',
 *   }}
 *   variant="inline"
 *   onDismiss={() => console.log('Dismissed')}
 * />
 *
 * @example
 * // Tooltip hint
 * <ProgressiveHint
 *   hint={hintDefinition}
 *   variant="tooltip"
 *   position="bottom"
 * >
 *   <Button>Create Dossier</Button>
 * </ProgressiveHint>
 */
export function ProgressiveHint({
  hint,
  variant = 'inline',
  size = 'md',
  position = 'auto',
  showDismiss = true,
  onDismiss,
  onExpand,
  onAction,
  children,
  className,
  delayMs,
}: ProgressiveHintProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [isVisible, setIsVisible] = useState(true)
  const hasTrackedShow = useRef(false)

  const {
    shouldShowHint,
    recordHintShown,
    recordHintDismissed,
    recordHintExpanded,
    recordActionTaken,
    preferences,
  } = useProgressiveDisclosure()

  // Resolve hint definition if string ID is passed
  const hintDefinition =
    typeof hint === 'string'
      ? {
          id: hint,
          contextType: 'empty_state' as HintContextType,
          titleKey: `hints.${hint}.title`,
          contentKey: `hints.${hint}.content`,
        }
      : hint

  // Check if hint should be shown
  const { shouldShow } = shouldShowHint(hintDefinition.id, hintDefinition.contextType)

  // Record hint shown on mount
  useEffect(() => {
    if (shouldShow && isVisible && !hasTrackedShow.current) {
      hasTrackedShow.current = true
      recordHintShown(
        hintDefinition.id,
        hintDefinition.contextType,
        hintDefinition.pageContext,
      ).catch(console.error)
    }
  }, [
    shouldShow,
    isVisible,
    hintDefinition.id,
    hintDefinition.contextType,
    hintDefinition.pageContext,
    recordHintShown,
  ])

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    recordHintDismissed(hintDefinition.id).catch(console.error)
    onDismiss?.()
  }, [hintDefinition.id, recordHintDismissed, onDismiss])

  // Handle expand
  const handleExpand = useCallback(() => {
    recordHintExpanded(hintDefinition.id).catch(console.error)
    onExpand?.()
  }, [hintDefinition.id, recordHintExpanded, onExpand])

  // Handle action
  const handleAction = useCallback(() => {
    recordActionTaken(hintDefinition.id).catch(console.error)
    onAction?.()
  }, [hintDefinition.id, recordActionTaken, onAction])

  // Don't render if hint shouldn't be shown
  if (!shouldShow || !isVisible) {
    // For tooltip variant, still render children
    if (variant === 'tooltip' && children) {
      return <>{children}</>
    }
    return null
  }

  const effectiveDelayMs = delayMs ?? preferences?.hintDelayMs ?? 300

  // Render based on variant
  if (variant === 'tooltip') {
    return (
      <TooltipHint
        hint={hintDefinition}
        size={size}
        position={position}
        showDismiss={showDismiss}
        onDismiss={handleDismiss}
        delayMs={effectiveDelayMs}
        isRTL={isRTL}
      >
        {children}
      </TooltipHint>
    )
  }

  if (variant === 'expandable') {
    return (
      <AnimatePresence>
        <ExpandableHint
          hint={hintDefinition}
          size={size}
          showDismiss={showDismiss}
          onDismiss={handleDismiss}
          onExpand={handleExpand}
          onAction={handleAction}
          className={className}
          isRTL={isRTL}
        />
      </AnimatePresence>
    )
  }

  if (variant === 'card') {
    return (
      <AnimatePresence>
        <CardHint
          hint={hintDefinition}
          size={size}
          showDismiss={showDismiss}
          onDismiss={handleDismiss}
          onAction={handleAction}
          className={className}
          isRTL={isRTL}
        />
      </AnimatePresence>
    )
  }

  // Default: inline
  return (
    <AnimatePresence>
      <InlineHint
        hint={hintDefinition}
        size={size}
        showDismiss={showDismiss}
        onDismiss={handleDismiss}
        onExpand={handleExpand}
        onAction={handleAction}
        className={className}
        isRTL={isRTL}
      />
    </AnimatePresence>
  )
}

export default ProgressiveHint
