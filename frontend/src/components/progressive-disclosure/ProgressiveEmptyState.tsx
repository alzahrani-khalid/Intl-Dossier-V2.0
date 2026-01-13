/**
 * ProgressiveEmptyState Component
 *
 * Enhanced empty state that progressively reveals helpful content
 * based on user experience level and interaction history.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Plus,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Keyboard,
  Sparkles,
  Zap,
  LucideIcon,
} from 'lucide-react'
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure'
import { ProgressiveHint } from './ProgressiveHint'
import type {
  ProgressiveEmptyStateProps,
  ProgressiveHintSet,
  HintTier,
  HintDefinition,
  UserExperienceLevel,
} from '@/types/progressive-disclosure.types'

// Size configurations
const sizeConfig = {
  sm: {
    container: 'py-6 px-3 sm:py-8 sm:px-4',
    iconWrapper: 'w-12 h-12 sm:w-14 sm:h-14 mb-3',
    icon: 'w-6 h-6 sm:w-7 sm:h-7',
    title: 'text-base sm:text-lg font-semibold mb-1',
    description: 'text-sm mb-4',
    button: 'min-h-10 px-4',
    hints: 'gap-2',
  },
  md: {
    container: 'py-10 px-4 sm:py-12 sm:px-6',
    iconWrapper: 'w-16 h-16 sm:w-20 sm:h-20 mb-4',
    icon: 'w-8 h-8 sm:w-10 sm:h-10',
    title: 'text-lg sm:text-xl md:text-2xl font-semibold mb-2',
    description: 'text-sm sm:text-base mb-6',
    button: 'min-h-11 px-6',
    hints: 'gap-3',
  },
  lg: {
    container: 'py-14 px-4 sm:py-16 sm:px-6 lg:py-20 lg:px-8',
    iconWrapper: 'w-20 h-20 sm:w-24 sm:h-24 mb-5',
    icon: 'w-10 h-10 sm:w-12 sm:h-12',
    title: 'text-xl sm:text-2xl md:text-3xl font-semibold mb-3',
    description: 'text-base sm:text-lg mb-8',
    button: 'min-h-12 px-8',
    hints: 'gap-4',
  },
}

// Tier icons and labels
const tierConfig: Record<
  HintTier['level'],
  { icon: LucideIcon; labelKey: string; badgeVariant: 'default' | 'secondary' | 'outline' }
> = {
  basic: {
    icon: Lightbulb,
    labelKey: 'tiers.basic',
    badgeVariant: 'secondary',
  },
  intermediate: {
    icon: Zap,
    labelKey: 'tiers.intermediate',
    badgeVariant: 'default',
  },
  advanced: {
    icon: Sparkles,
    labelKey: 'tiers.advanced',
    badgeVariant: 'outline',
  },
}

interface HintTierSectionProps {
  tier: HintTier
  isExpanded: boolean
  isLocked: boolean
  onToggle: () => void
  size: 'sm' | 'md' | 'lg'
  isRTL: boolean
}

function HintTierSection({
  tier,
  isExpanded,
  isLocked,
  onToggle,
  size,
  isRTL,
}: HintTierSectionProps) {
  const { t } = useTranslation('progressive-disclosure')
  const config = tierConfig[tier.level]
  const TierIcon = config.icon
  const sizes = sizeConfig[size]

  return (
    <div className={cn('border rounded-lg overflow-hidden', isLocked && 'opacity-60')}>
      {/* Header */}
      <button
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3',
          'hover:bg-muted/50 transition-colors text-start',
          isLocked && 'cursor-not-allowed',
        )}
        onClick={onToggle}
        disabled={isLocked}
        aria-expanded={isExpanded}
      >
        <div className="p-1.5 rounded-md bg-primary/10">
          <TierIcon className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{t(config.labelKey)}</span>
        </div>

        <Badge variant={config.badgeVariant} className="text-xs">
          {tier.hints.length} {t('hints.count', { count: tier.hints.length })}
        </Badge>

        {isLocked ? (
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        ) : isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn('border-t bg-muted/30 p-3 sm:p-4', 'flex flex-col', sizes.hints)}>
              {tier.hints.map((hint) => (
                <ProgressiveHint
                  key={hint.id}
                  hint={hint}
                  variant="inline"
                  size={size === 'lg' ? 'md' : 'sm'}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * ProgressiveEmptyState Component
 *
 * Displays an empty state with progressively revealed hints based on user experience.
 *
 * @example
 * <ProgressiveEmptyState
 *   pageContext="dossiers"
 *   title={t('dossiers.empty.title')}
 *   description={t('dossiers.empty.description')}
 *   icon={FileText}
 *   primaryAction={{
 *     label: t('dossiers.create'),
 *     onClick: () => navigate('/dossiers/create'),
 *     icon: Plus,
 *   }}
 *   hints={dossierHints}
 * />
 */
export function ProgressiveEmptyState({
  pageContext,
  entityType,
  title,
  description,
  icon: Icon,
  primaryAction,
  hints,
  variant = 'default',
  size = 'md',
  className,
}: ProgressiveEmptyStateProps) {
  const { t, i18n } = useTranslation('progressive-disclosure')
  const isRTL = i18n.language === 'ar'
  const sizes = sizeConfig[size]

  const { experienceLevel, isFirstVisit, hasInteractedBefore, hintsEnabled, recordActionTaken } =
    useProgressiveDisclosure({ pageContext })

  // Track which tiers are expanded
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    basic: true, // Basic tips always start expanded
    intermediate: false,
    advanced: false,
  })

  // Determine which tiers are unlocked based on user state
  const unlockedTiers = useMemo(() => {
    const tiers: Record<string, boolean> = {
      basic: true, // Always unlocked
      intermediate: hasInteractedBefore, // Unlocked after first interaction
      advanced: !isFirstVisit && hasInteractedBefore, // Unlocked on subsequent visits
    }
    return tiers
  }, [isFirstVisit, hasInteractedBefore])

  // Auto-expand appropriate tier based on experience
  useEffect(() => {
    if (experienceLevel === 'intermediate' || experienceLevel === 'advanced') {
      setExpandedTiers((prev) => ({
        ...prev,
        intermediate: true,
      }))
    }
    if (experienceLevel === 'advanced' || experienceLevel === 'expert') {
      setExpandedTiers((prev) => ({
        ...prev,
        advanced: true,
      }))
    }
  }, [experienceLevel])

  const toggleTier = useCallback((level: string) => {
    setExpandedTiers((prev) => ({
      ...prev,
      [level]: !prev[level],
    }))
  }, [])

  // Handle primary action click
  const handlePrimaryAction = useCallback(() => {
    if (primaryAction?.onClick) {
      // Record action taken for the page context
      recordActionTaken(`${pageContext}-primary-action`).catch(console.error)
      primaryAction.onClick()
    }
  }, [primaryAction, pageContext, recordActionTaken])

  // Filter hints based on user experience
  const visibleHints = useMemo(() => {
    if (!hints) return null

    return {
      ...hints,
      tiers: hints.tiers.filter((tier) => {
        // Always show basic tier
        if (tier.level === 'basic') return true

        // Show intermediate if unlocked
        if (tier.level === 'intermediate' && unlockedTiers.intermediate) {
          return true
        }

        // Show advanced if unlocked
        if (tier.level === 'advanced' && unlockedTiers.advanced) {
          return true
        }

        return false
      }),
    }
  }, [hints, unlockedTiers])

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="progressive-empty-state"
    >
      {/* Main empty state */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted',
            sizes.iconWrapper,
          )}
        >
          <Icon className={cn('text-muted-foreground', sizes.icon)} />
        </div>

        {/* Title */}
        <h3 className={cn('text-foreground', sizes.title)}>{title}</h3>

        {/* Description */}
        <p className={cn('text-muted-foreground max-w-md', sizes.description)}>{description}</p>

        {/* Primary Action */}
        {primaryAction && (
          <Button onClick={handlePrimaryAction} className={cn('min-h-11 min-w-11', sizes.button)}>
            {primaryAction.icon && (
              <primaryAction.icon className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
            )}
            {primaryAction.label}
          </Button>
        )}
      </motion.div>

      {/* Progressive hints section */}
      {hintsEnabled && visibleHints && visibleHints.tiers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="w-full max-w-lg mt-8 sm:mt-10"
        >
          <Separator className="mb-6" />

          <div className="text-start">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h4 className="text-sm sm:text-base font-medium text-foreground">
                {t('hints.section.title')}
              </h4>
            </div>

            <div className={cn('flex flex-col', sizes.hints)}>
              {visibleHints.tiers.map((tier) => (
                <HintTierSection
                  key={tier.level}
                  tier={tier}
                  isExpanded={expandedTiers[tier.level] ?? false}
                  isLocked={!unlockedTiers[tier.level]}
                  onToggle={() => toggleTier(tier.level)}
                  size={size}
                  isRTL={isRTL}
                />
              ))}
            </div>

            {/* Show locked tier notice */}
            {(!unlockedTiers.intermediate || !unlockedTiers.advanced) && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {!unlockedTiers.intermediate
                  ? t('hints.unlock.intermediate')
                  : t('hints.unlock.advanced')}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Keyboard shortcuts hint for experienced users */}
      {experienceLevel !== 'beginner' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-6"
        >
          <Badge variant="outline" className="text-xs">
            <Keyboard className="w-3 h-3 me-1.5" />
            {t('hints.keyboard.available')}
          </Badge>
        </motion.div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={className} data-testid="progressive-empty-state-card">
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn('flex flex-col items-center justify-center text-center py-8 px-4', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="progressive-empty-state"
      >
        <Icon className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {primaryAction && (
          <Button onClick={handlePrimaryAction} variant="ghost" size="sm">
            {primaryAction.icon && (
              <primaryAction.icon className={cn('w-4 h-4', isRTL ? 'ms-1' : 'me-1')} />
            )}
            {primaryAction.label}
          </Button>
        )}
      </div>
    )
  }

  return content
}

export default ProgressiveEmptyState
