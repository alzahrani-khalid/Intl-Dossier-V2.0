import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, Plus, Upload, Search, HelpCircle } from 'lucide-react'

export type EmptyStateVariant = 'default' | 'card' | 'inline' | 'compact'
export type EmptyStateSize = 'sm' | 'md' | 'lg'

export interface QuickAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
}

export interface EmptyStateProps {
  /** Icon to display (Lucide icon component) */
  icon: LucideIcon
  /** Main heading for empty state */
  title: string
  /** Supporting text explaining why section is empty */
  description: string
  /** Optional hint text providing examples or guidance */
  hint?: string
  /** Optional primary action */
  primaryAction?: QuickAction
  /** Optional secondary actions */
  secondaryActions?: QuickAction[]
  /** Visual variant of the empty state */
  variant?: EmptyStateVariant
  /** Size variant */
  size?: EmptyStateSize
  /** Additional CSS classes */
  className?: string
  /** Test ID for automated testing */
  testId?: string
}

const sizeClasses = {
  sm: {
    container: 'py-6 px-3 sm:py-8 sm:px-4',
    iconWrapper: 'w-10 h-10 sm:w-12 sm:h-12 mb-3',
    icon: 'w-5 h-5 sm:w-6 sm:h-6',
    title: 'text-sm sm:text-base font-semibold mb-1',
    description: 'text-xs sm:text-sm mb-3',
    hint: 'text-xs mb-3',
    button: 'h-9 px-3 text-xs sm:text-sm',
  },
  md: {
    container: 'py-10 px-4 sm:py-12 sm:px-6',
    iconWrapper: 'w-14 h-14 sm:w-16 sm:h-16 mb-4',
    icon: 'w-7 h-7 sm:w-8 sm:h-8',
    title: 'text-base sm:text-lg md:text-xl font-semibold mb-2',
    description: 'text-sm sm:text-base mb-4 sm:mb-6',
    hint: 'text-xs sm:text-sm mb-4',
    button: 'h-10 px-4 sm:px-6 text-sm',
  },
  lg: {
    container: 'py-12 px-4 sm:py-16 sm:px-6 lg:py-20 lg:px-8',
    iconWrapper: 'w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6',
    icon: 'w-8 h-8 sm:w-10 sm:h-10',
    title: 'text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3',
    description: 'text-sm sm:text-base md:text-lg mb-6 sm:mb-8',
    hint: 'text-sm mb-6',
    button: 'min-h-11 min-w-11 px-6 sm:px-8 text-sm sm:text-base',
  },
}

/**
 * Comprehensive empty state component with multiple variants and sizes.
 * Supports mobile-first responsive design and RTL layouts.
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   icon={FileText}
 *   title="No documents yet"
 *   description="Upload your first document to get started"
 *   primaryAction={{
 *     label: "Upload Document",
 *     icon: Upload,
 *     onClick: () => handleUpload()
 *   }}
 * />
 *
 * @example
 * // Card variant with multiple actions
 * <EmptyState
 *   variant="card"
 *   icon={Users}
 *   title="No team members"
 *   description="Invite team members to collaborate"
 *   primaryAction={{ label: "Invite", onClick: handleInvite }}
 *   secondaryActions={[
 *     { label: "Import", onClick: handleImport, variant: "outline" }
 *   ]}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  primaryAction,
  secondaryActions = [],
  variant = 'default',
  size = 'md',
  className = '',
  testId = 'empty-state',
}: EmptyStateProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const sizes = sizeClasses[size]

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid={testId}
    >
      {/* Icon */}
      <div
        className={cn('flex items-center justify-center rounded-full bg-muted', sizes.iconWrapper)}
      >
        <Icon className={cn('text-muted-foreground', sizes.icon)} />
      </div>

      {/* Title */}
      <h3 className={cn('text-foreground', sizes.title)}>{title}</h3>

      {/* Description */}
      <p className={cn('text-muted-foreground max-w-md', sizes.description)}>{description}</p>

      {/* Hint */}
      {hint && (
        <p
          className={cn(
            'text-muted-foreground/70 max-w-sm italic flex items-center gap-1',
            sizes.hint,
          )}
        >
          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          {hint}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryActions.length > 0) && (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || 'default'}
              className={cn('min-h-11 min-w-11', sizes.button)}
            >
              {primaryAction.icon && (
                <primaryAction.icon className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
              )}
              {primaryAction.label}
            </Button>
          )}
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              className={cn('min-h-11 min-w-11', sizes.button)}
            >
              {action.icon && <action.icon className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={className} data-testid={`${testId}-card`}>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 py-4 px-3 sm:px-4 rounded-lg bg-muted/50',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid={testId}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        </div>
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            variant={primaryAction.variant || 'outline'}
            size="sm"
            className="min-h-9 min-w-9 flex-shrink-0"
          >
            {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
            <span className="hidden sm:inline ms-2">{primaryAction.label}</span>
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn('flex flex-col items-center justify-center text-center py-6 px-4', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid={testId}
      >
        <Icon className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{description}</p>
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            variant={primaryAction.variant || 'ghost'}
            size="sm"
            className="mt-2"
          >
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

// Export common icons for convenience
export { Plus, Upload, Search, HelpCircle }
