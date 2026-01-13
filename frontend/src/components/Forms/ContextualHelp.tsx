/**
 * ContextualHelp Component
 * Provides hover tooltips and expandable help sections for form fields
 * Mobile-first and RTL-compatible
 *
 * Features:
 * - Tooltip mode: Simple hover tooltip for quick hints
 * - Expandable mode: Expandable section with examples and links
 * - Combined mode: Both tooltip and expandable help
 * - Full RTL support via logical properties
 * - Touch-friendly with 44x44px minimum touch targets
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink, Lightbulb, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// =============================================================================
// TYPES
// =============================================================================

export interface HelpExample {
  /** Example value or code */
  value: string
  /** Description of the example */
  description?: string
}

export interface HelpLink {
  /** Link text */
  label: string
  /** URL to documentation */
  href: string
}

export interface ContextualHelpProps {
  /** Tooltip text for quick help on hover */
  tooltip?: string
  /** Title for the expandable help section */
  title?: string
  /** Detailed description for the expandable section */
  description?: string
  /** Examples to show in the expandable section */
  examples?: HelpExample[]
  /** Format requirements or constraints */
  formatRequirements?: string[]
  /** Links to additional documentation */
  links?: HelpLink[]
  /** Display mode: tooltip-only, expandable-only, or both */
  mode?: 'tooltip' | 'expandable' | 'both'
  /** Position of the help icon relative to the trigger */
  position?: 'inline' | 'floating'
  /** Icon to display (default: HelpCircle) */
  icon?: 'help' | 'info' | 'lightbulb'
  /** Size of the trigger icon */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Render as child trigger (for custom trigger elements) */
  children?: React.ReactNode
}

// =============================================================================
// ICON MAP
// =============================================================================

const iconMap = {
  help: HelpCircle,
  info: Info,
  lightbulb: Lightbulb,
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const touchTargetMap = {
  sm: 'min-h-8 min-w-8',
  md: 'min-h-10 min-w-10',
  lg: 'min-h-11 min-w-11',
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContextualHelp({
  tooltip,
  title,
  description,
  examples,
  formatRequirements,
  links,
  mode = 'tooltip',
  // position prop reserved for future use (floating vs inline)
  position: _position = 'inline',
  icon = 'help',
  size = 'sm',
  className,
  children,
}: ContextualHelpProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  // Suppress unused variable warning
  void _position

  const [isExpanded, setIsExpanded] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const IconComponent = iconMap[icon]
  const iconSize = sizeMap[size]
  const touchTarget = touchTargetMap[size]

  // Render tooltip trigger
  const renderTrigger = () => {
    if (children) {
      return children
    }

    return (
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'text-muted-foreground hover:text-foreground',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          touchTarget,
          className,
        )}
        aria-label={tooltip || title || 'Help'}
      >
        <IconComponent className={cn(iconSize, isRTL && icon === 'help' ? '' : '')} />
      </button>
    )
  }

  // Tooltip-only mode
  if (mode === 'tooltip' && tooltip) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{renderTrigger()}</TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'} className="max-w-xs text-sm">
            <p dir={isRTL ? 'rtl' : 'ltr'}>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Expandable-only mode (inline collapsible)
  if (mode === 'expandable') {
    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className={cn('space-y-2', className)}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 text-muted-foreground hover:text-foreground',
              'h-auto py-1 px-2',
              touchTarget,
            )}
          >
            <IconComponent className={iconSize} />
            <span className="text-sm">{title || 'Help'}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ExpandableHelpContent
              description={description}
              examples={examples}
              formatRequirements={formatRequirements}
              links={links}
              isRTL={isRTL}
            />
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Both mode: tooltip + popover with expandable content
  return (
    <TooltipProvider delayDuration={300}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
          </TooltipTrigger>
          {tooltip && !isPopoverOpen && (
            <TooltipContent side={isRTL ? 'left' : 'right'} className="max-w-xs text-sm">
              <p dir={isRTL ? 'rtl' : 'ltr'}>{tooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>
        <PopoverContent
          side={isRTL ? 'left' : 'right'}
          align="start"
          className="w-80 sm:w-96"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="space-y-3">
            {title && (
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">{title}</h4>
              </div>
            )}
            <ExpandableHelpContent
              description={description}
              examples={examples}
              formatRequirements={formatRequirements}
              links={links}
              isRTL={isRTL}
            />
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}

// =============================================================================
// EXPANDABLE HELP CONTENT
// =============================================================================

interface ExpandableHelpContentProps {
  description?: string
  examples?: HelpExample[]
  formatRequirements?: string[]
  links?: HelpLink[]
  isRTL: boolean
}

function ExpandableHelpContent({
  description,
  examples,
  formatRequirements,
  links,
  isRTL,
}: ExpandableHelpContentProps) {
  const { t } = useTranslation('contextual-help')

  return (
    <div
      className={cn('rounded-md border bg-muted/50 p-3 space-y-3', 'text-sm')}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Description */}
      {description && <p className="text-muted-foreground">{description}</p>}

      {/* Format Requirements */}
      {formatRequirements && formatRequirements.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
            {t('formatRequirements', 'Format Requirements')}
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {formatRequirements.map((req, index) => (
              <li key={index} className="text-sm">
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Examples */}
      {examples && examples.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
            {t('examples', 'Examples')}
          </p>
          <div className="space-y-2">
            {examples.map((example, index) => (
              <div key={index} className="bg-background rounded px-2 py-1.5 border">
                <code className="text-xs font-mono text-primary">{example.value}</code>
                {example.description && (
                  <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentation Links */}
      {links && links.length > 0 && (
        <div className="space-y-1 pt-2 border-t">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
            {t('learnMore', 'Learn More')}
          </p>
          <div className="space-y-1">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-1 text-sm text-primary hover:underline',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
                )}
              >
                <span>{link.label}</span>
                <ExternalLink className={cn('h-3 w-3', isRTL && 'rotate-180')} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// FIELD HELP LABEL WRAPPER
// =============================================================================

export interface FieldLabelWithHelpProps {
  /** The label text */
  label: string
  /** Whether the field is required */
  required?: boolean
  /** Help props for the contextual help */
  helpProps?: Omit<ContextualHelpProps, 'className'>
  /** Additional class names for the container */
  className?: string
  /** HTML for attribute for the label */
  htmlFor?: string
}

export function FieldLabelWithHelp({
  label,
  required,
  helpProps,
  className,
  htmlFor,
}: FieldLabelWithHelpProps) {
  const { i18n, t } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('flex items-center gap-1.5', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ms-0.5" aria-label={t('common:required', 'Required')}>
            *
          </span>
        )}
      </label>
      {helpProps && (
        <ContextualHelp
          {...helpProps}
          size="sm"
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ContextualHelp
