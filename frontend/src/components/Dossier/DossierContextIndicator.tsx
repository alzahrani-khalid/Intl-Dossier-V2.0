/**
 * DossierContextIndicator Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Persistent context indicator showing current dossier scope in page headers.
 * Display format: 📁 Viewing in context of: [Dossier Name] [Type Badge] [Change] [Clear]
 *
 * Mobile-first, RTL-compatible, with smooth animations.
 */

import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { FolderOpen, X, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { useDossierContext } from '@/hooks/useDossierContext'
import { DossierTypeIcon } from './DossierTypeIcon'
import { DossierSelector, type SelectedDossier } from './DossierSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DossierType as IconDossierType } from '@/types/relationship.types'
import type { DossierType as ContextDossierType } from '@/types/dossier-context.types'

// ============================================================================
// Props
// ============================================================================

export interface DossierContextIndicatorProps {
  /**
   * Whether to show the indicator even when no context is active.
   * @default false
   */
  showWhenEmpty?: boolean
  /**
   * Whether the indicator can be dismissed/cleared.
   * @default true
   */
  clearable?: boolean
  /**
   * Whether the indicator allows changing context.
   * @default true
   */
  changeable?: boolean
  /**
   * Whether to show the dossier link.
   * @default true
   */
  linkable?: boolean
  /**
   * Size variant.
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * Additional CSS classes for the container.
   */
  className?: string
  /**
   * Callback when context is cleared.
   */
  onClear?: () => void
  /**
   * Callback when context is changed.
   */
  onChange?: () => void
}

// ============================================================================
// Size Configurations
// ============================================================================

const sizeConfig = {
  sm: {
    container: 'py-1.5 px-2 sm:py-1 sm:px-3 gap-1.5 sm:gap-2',
    text: 'text-xs',
    icon: 'size-3.5 sm:size-4',
    badge: 'text-[10px] px-1.5 py-0',
    button: 'h-6 w-6 sm:h-7 sm:w-7',
  },
  default: {
    container: 'py-2 px-3 sm:py-2 sm:px-4 gap-2 sm:gap-3',
    text: 'text-xs sm:text-sm',
    icon: 'size-4 sm:size-5',
    badge: 'text-xs px-2 py-0.5',
    button: 'h-7 w-7 sm:h-8 sm:w-8',
  },
  lg: {
    container: 'py-2.5 px-4 sm:py-3 sm:px-5 gap-2.5 sm:gap-3',
    text: 'text-sm sm:text-base',
    icon: 'size-5 sm:size-6',
    badge: 'text-sm px-2.5 py-0.5',
    button: 'h-8 w-8 sm:h-9 sm:w-9',
  },
}

// ============================================================================
// Component
// ============================================================================

export const DossierContextIndicator = memo(function DossierContextIndicator({
  showWhenEmpty = false,
  clearable = true,
  changeable = true,
  linkable = true,
  size = 'default',
  className,
  onClear,
  onChange,
}: DossierContextIndicatorProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { activeDossier, activeInheritance, hasDossierContext, reset, setActiveDossier } =
    useDossierContext()

  const [changePopoverOpen, setChangePopoverOpen] = useState(false)

  // Get display name based on language
  const displayName = isRTL
    ? activeDossier?.name_ar || activeDossier?.name_en
    : activeDossier?.name_en

  // Get size-specific classes
  const sizeClasses = sizeConfig[size]

  // Handle clear action
  const handleClear = useCallback(() => {
    reset()
    setActiveDossier(null)
    onClear?.()
  }, [reset, setActiveDossier, onClear])

  // Handle dossier selection from DossierSelector
  const handleDossierChange = useCallback(
    (_dossierIds: string[], dossiers: SelectedDossier[]) => {
      const selected = dossiers[0]
      if (selected) {
        setActiveDossier({
          id: selected.id,
          name_en: selected.name_en,
          name_ar: selected.name_ar ?? '',
          type: selected.type as ContextDossierType,
          status: 'active',
        })
        setChangePopoverOpen(false)
        onChange?.()
      }
    },
    [setActiveDossier, onChange],
  )

  // Get inheritance label for display
  const getInheritanceLabel = () => {
    if (!activeInheritance || activeInheritance.source === 'direct') return null

    const labelMap: Record<string, string> = {
      engagement: t('contextIndicator.inheritedFrom.engagement', 'via Engagement'),
      after_action: t('contextIndicator.inheritedFrom.afterAction', 'via After-Action'),
      position: t('contextIndicator.inheritedFrom.position', 'via Position'),
      mou: t('contextIndicator.inheritedFrom.mou', 'via MOU'),
    }

    return labelMap[activeInheritance.source]
  }

  const inheritanceLabel = getInheritanceLabel()

  // Don't render if no context and showWhenEmpty is false
  if (!hasDossierContext && !activeDossier && !showWhenEmpty) {
    return null
  }

  // Safely cast the dossier type for DossierTypeIcon (uses relationship.types DossierType)
  const dossierType = activeDossier?.type as IconDossierType | undefined

  // Empty state
  if (!hasDossierContext && !activeDossier) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          // Mobile-first responsive styling
          'flex items-center rounded-lg',
          'bg-muted/50 border border-dashed border-muted-foreground/30',
          sizeClasses.container,
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <FolderOpen className={cn(sizeClasses.icon, 'text-muted-foreground')} />
        <span className={cn(sizeClasses.text, 'text-muted-foreground')}>
          {t('contextIndicator.noContext', 'No dossier context selected')}
        </span>
        {changeable && (
          <Popover open={changePopoverOpen} onOpenChange={setChangePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'min-h-8 min-w-8 px-2 sm:px-3',
                  'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="hidden sm:inline">{t('contextIndicator.select', 'Select')}</span>
                <ChevronDown className={cn('size-4', isRTL ? 'me-1 sm:me-0' : 'ms-1 sm:ms-0')} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] sm:w-[400px] p-2" align={isRTL ? 'end' : 'start'}>
              <DossierSelector
                onChange={handleDossierChange}
                required={false}
                multiple={false}
                label={t('contextIndicator.selectDossier', 'Select a dossier...')}
              />
            </PopoverContent>
          </Popover>
        )}
      </motion.div>
    )
  }

  // Active context indicator
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeDossier?.id || 'context'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          // Mobile-first responsive styling
          'flex items-center flex-wrap rounded-lg',
          'bg-primary/5 border border-primary/20',
          'dark:bg-primary/10 dark:border-primary/30',
          sizeClasses.container,
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="dossier-context-indicator"
      >
        {/* Context icon */}
        <FolderOpen className={cn(sizeClasses.icon, 'text-primary shrink-0')} />

        {/* Label - hidden on very small screens */}
        <span className={cn(sizeClasses.text, 'text-muted-foreground hidden xs:inline shrink-0')}>
          {t('contextIndicator.viewingInContext', 'Viewing in context of:')}
        </span>

        {/* Dossier name with link */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {linkable && activeDossier && dossierType ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={getDossierDetailPath(activeDossier.id, dossierType)}
                    className={cn(
                      'flex items-center gap-1.5 min-w-0',
                      'text-primary hover:underline',
                      'font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]',
                      sizeClasses.text,
                    )}
                  >
                    <DossierTypeIcon
                      type={dossierType}
                      size={size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm'}
                      colored
                    />
                    <span className="truncate">{displayName}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-50" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}>
                  <div className="space-y-1">
                    <p className="font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`type.${dossierType}`, dossierType)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('contextIndicator.clickToView', 'Click to view dossier')}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span
              className={cn(
                'flex items-center gap-1.5',
                'font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]',
                sizeClasses.text,
              )}
            >
              {activeDossier && dossierType && (
                <DossierTypeIcon
                  type={dossierType}
                  size={size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm'}
                  colored
                />
              )}
              <span className="truncate">{displayName || t('untitled', 'Untitled')}</span>
            </span>
          )}

          {/* Type badge - hidden on mobile */}
          {activeDossier && dossierType && (
            <Badge
              variant="secondary"
              className={cn(sizeClasses.badge, 'hidden sm:inline-flex shrink-0')}
            >
              {t(`type.${dossierType}`, dossierType)}
            </Badge>
          )}

          {/* Inheritance label - hidden on mobile */}
          {inheritanceLabel && (
            <span
              className={cn(
                'text-muted-foreground italic hidden md:inline shrink-0',
                size === 'sm' ? 'text-[10px]' : 'text-xs',
              )}
            >
              {inheritanceLabel}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 ms-auto">
          {/* Change button */}
          {changeable && (
            <Popover open={changePopoverOpen} onOpenChange={setChangePopoverOpen}>
              <PopoverTrigger asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          sizeClasses.button,
                          'text-muted-foreground hover:text-foreground hover:bg-primary/10',
                        )}
                        aria-label={t('contextIndicator.change', 'Change dossier')}
                      >
                        <RefreshCw className="size-3.5 sm:size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side={isRTL ? 'left' : 'right'}>
                      {t('contextIndicator.change', 'Change dossier')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </PopoverTrigger>
              <PopoverContent
                className="w-[300px] sm:w-[400px] p-2"
                align={isRTL ? 'start' : 'end'}
              >
                <div className="mb-3">
                  <h4 className={cn('font-medium', sizeClasses.text)}>
                    {t('contextIndicator.changeDossier', 'Change Dossier Context')}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      'contextIndicator.changeDescription',
                      'Select a different dossier to work within',
                    )}
                  </p>
                </div>
                <DossierSelector
                  onChange={handleDossierChange}
                  required={false}
                  multiple={false}
                  label={t('contextIndicator.searchDossiers', 'Search dossiers...')}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Clear button */}
          {clearable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className={cn(
                      sizeClasses.button,
                      'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                    )}
                    aria-label={t('contextIndicator.clear', 'Clear context')}
                  >
                    <X className="size-3.5 sm:size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}>
                  {t('contextIndicator.clear', 'Clear context')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
})

export default DossierContextIndicator
