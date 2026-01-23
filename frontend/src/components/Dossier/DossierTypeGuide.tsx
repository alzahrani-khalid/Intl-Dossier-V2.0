/**
 * DossierTypeGuide Component
 *
 * Provides contextual guidance about dossier types to help users understand
 * which dossier type to use for different scenarios. Displays as a popover
 * with examples, use cases, and common relationships.
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Accessible tooltip/popover pattern
 * - Rich content with examples and guidance
 * - Smooth animations
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  UserCheck,
  HelpCircle,
  Check,
  X,
  Link2,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { DossierType } from '@/services/dossier-api'

interface DossierTypeGuideProps {
  type: DossierType
  /** Render as compact tooltip or full popover */
  variant?: 'tooltip' | 'popover' | 'inline'
  /** Custom trigger element */
  trigger?: React.ReactNode
  /** Additional class names */
  className?: string
  /** Whether to show the info icon trigger */
  showTrigger?: boolean
  /** Callback when type is selected (for wizard integration) */
  onSelect?: (type: DossierType) => void
}

/**
 * Get type-specific icon component
 */
function getTypeIcon(type: DossierType, className?: string) {
  const iconProps = { className: className || 'h-5 w-5' }

  switch (type) {
    case 'country':
      return <Globe {...iconProps} />
    case 'organization':
      return <Building2 {...iconProps} />
    case 'forum':
      return <Users {...iconProps} />
    case 'engagement':
      return <Calendar {...iconProps} />
    case 'topic':
      return <Target {...iconProps} />
    case 'working_group':
      return <Briefcase {...iconProps} />
    case 'person':
      return <User {...iconProps} />
    case 'elected_official':
      return <UserCheck {...iconProps} />
    default:
      return <Globe {...iconProps} />
  }
}

/**
 * Get type-specific color classes
 */
function getTypeColors(type: DossierType): { bg: string; text: string; border: string } {
  switch (type) {
    case 'country':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case 'organization':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
      }
    case 'forum':
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
      }
    case 'engagement':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
      }
    case 'topic':
      return {
        bg: 'bg-pink-50 dark:bg-pink-950',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
      }
    case 'working_group':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800',
      }
    case 'person':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800',
      }
    case 'elected_official':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800',
      }
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
      }
  }
}

/**
 * Guide content component - reused in both tooltip and popover variants
 */
function GuideContent({
  type,
  variant,
  onSelect,
}: {
  type: DossierType
  variant: 'tooltip' | 'popover' | 'inline'
  onSelect?: (type: DossierType) => void
}) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const colors = getTypeColors(type)

  // Get guide content from translations
  const whenToUse = t(`typeGuide.${type}.whenToUse`, '')
  const examples = t(`typeGuide.${type}.examples`, { returnObjects: true }) as string[]
  const commonLinks = t(`typeGuide.${type}.commonLinks`, { returnObjects: true }) as string[]
  const notFor = t(`typeGuide.${type}.notFor`, '')

  // Tooltip variant - compact
  if (variant === 'tooltip') {
    return (
      <div className="space-y-2 max-w-xs" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2">
          {getTypeIcon(type, cn('h-4 w-4', colors.text))}
          <span className="font-semibold">{t(`type.${type}`)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t(`typeDescription.${type}`)}</p>
        {whenToUse && (
          <p className="text-xs">
            <Lightbulb className="inline h-3 w-3 me-1" />
            {whenToUse}
          </p>
        )}
      </div>
    )
  }

  // Popover and inline variants - full content
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'space-y-4',
        variant === 'popover' && 'p-1',
        variant === 'inline' && 'p-4 rounded-lg border',
        variant === 'inline' && colors.bg,
        variant === 'inline' && colors.border,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          {getTypeIcon(type, cn('h-5 w-5', colors.text))}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base">{t(`type.${type}`)}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{t(`typeDescription.${type}`)}</p>
        </div>
      </div>

      {/* When to Use */}
      {whenToUse && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className={cn('h-4 w-4', colors.text)} />
            <span>{isRTL ? 'متى تستخدم' : 'When to Use'}</span>
          </div>
          <p className="text-sm text-muted-foreground ps-6">{whenToUse}</p>
        </div>
      )}

      {/* Examples */}
      {Array.isArray(examples) && examples.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="h-4 w-4 text-green-500" />
            <span>{isRTL ? 'أمثلة' : 'Examples'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 ps-6">
            {examples.slice(0, 5).map((example, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-normal">
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Common Links */}
      {Array.isArray(commonLinks) && commonLinks.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className={cn('h-4 w-4', colors.text)} />
            <span>{isRTL ? 'روابط شائعة' : 'Common Links'}</span>
          </div>
          <ul className="text-sm text-muted-foreground ps-6 space-y-0.5">
            {commonLinks.slice(0, 4).map((link, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <ArrowRight className={cn('h-3 w-3 shrink-0', isRTL && 'rotate-180')} />
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Not For */}
      {notFor && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              <X className="h-4 w-4" />
              <span>{isRTL ? 'لا تستخدم لـ' : 'Not For'}</span>
            </div>
            <p className="text-sm text-muted-foreground ps-6">{notFor}</p>
          </div>
        </>
      )}

      {/* Select Button (for wizard integration) */}
      {onSelect && (
        <>
          <Separator />
          <Button onClick={() => onSelect(type)} className="w-full" size="sm">
            {isRTL ? `إنشاء دوسيه ${t(`type.${type}`)}` : `Create ${t(`type.${type}`)} Dossier`}
          </Button>
        </>
      )}
    </motion.div>
  )
}

/**
 * DossierTypeGuide Component
 *
 * Provides contextual help for understanding dossier types
 */
export function DossierTypeGuide({
  type,
  variant = 'popover',
  trigger,
  className,
  showTrigger = true,
  onSelect,
}: DossierTypeGuideProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const [open, setOpen] = useState(false)
  const colors = getTypeColors(type)

  // Inline variant - no trigger needed
  if (variant === 'inline') {
    return (
      <div className={className}>
        <GuideContent type={type} variant="inline" onSelect={onSelect} />
      </div>
    )
  }

  // Default trigger (info icon)
  const defaultTrigger = (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'min-h-6 min-w-6 p-1',
        'rounded-full',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-muted/50',
        'transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
      aria-label={t('typeGuide.learnMore', 'Learn more about this dossier type')}
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  )

  const triggerElement = trigger || (showTrigger ? defaultTrigger : null)

  // Tooltip variant
  if (variant === 'tooltip') {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{triggerElement}</TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'} align="start" className="p-3">
            <GuideContent type={type} variant="tooltip" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Popover variant (default)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>
      <PopoverContent
        side={isRTL ? 'left' : 'right'}
        align="start"
        className={cn('w-80 sm:w-96', 'p-4', 'shadow-lg')}
      >
        <AnimatePresence mode="wait">
          <GuideContent type={type} variant="popover" onSelect={onSelect} />
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  )
}

/**
 * DossierTypeGuideGrid Component
 *
 * Displays all dossier types in a grid with inline guides
 * Useful for the create wizard type selection step
 */
export function DossierTypeGuideGrid({
  onSelect,
  selectedType,
  className,
}: {
  onSelect: (type: DossierType) => void
  selectedType?: DossierType
  className?: string
}) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const types: DossierType[] = [
    'country',
    'organization',
    'person',
    'elected_official',
    'engagement',
    'forum',
    'working_group',
    'topic',
  ]

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {types.map((type) => {
        const colors = getTypeColors(type)
        const isSelected = selectedType === type

        return (
          <motion.button
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              'text-start p-4 rounded-xl border-2 transition-all duration-200',
              'hover:shadow-md',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSelected ? colors.border : 'border-transparent',
              isSelected ? colors.bg : 'bg-card hover:bg-muted/30',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg', colors.bg)}>
                {getTypeIcon(type, cn('h-5 w-5', colors.text))}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{t(`type.${type}`)}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t(`typeDescription.${type}`)}
                </p>
              </div>
              {isSelected && <Check className={cn('h-5 w-5 shrink-0', colors.text)} />}
            </div>

            {/* Expandable hint on hover/focus */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: isSelected ? 'auto' : 0, opacity: isSelected ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                <Lightbulb className="inline h-3 w-3 me-1" />
                {t(`typeGuide.${type}.whenToUse`, '')}
              </p>
            </motion.div>
          </motion.button>
        )
      })}
    </div>
  )
}

// Backward compatibility exports - map old names to new names
export const EntityTypeGuide = DossierTypeGuide
export const EntityTypeGuideGrid = DossierTypeGuideGrid
export type EntityTypeGuideProps = DossierTypeGuideProps

export default DossierTypeGuide
