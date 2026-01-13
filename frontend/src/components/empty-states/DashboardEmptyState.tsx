import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  Bell,
  Calendar,
  Target,
  Plus,
  Settings,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState, EmptyStateVariant, EmptyStateSize, QuickAction } from './EmptyState'
import { ContextualSuggestions } from './ContextualSuggestions'
import type { SuggestionContext } from '@/types/contextual-suggestion.types'

export type DashboardWidgetType =
  | 'overview'
  | 'analytics'
  | 'activity'
  | 'notifications'
  | 'calendar'
  | 'tasks'
  | 'metrics'
  | 'recent'

interface DashboardEmptyStateProps {
  /** Type of dashboard widget */
  widgetType: DashboardWidgetType
  /** Callback for primary action (e.g., create, configure) */
  onPrimaryAction?: () => void
  /** Callback for setup/configuration */
  onSetup?: () => void
  /** Custom title override */
  title?: string
  /** Custom description override */
  description?: string
  /** Visual variant */
  variant?: EmptyStateVariant
  /** Size variant */
  size?: EmptyStateSize
  /** Additional CSS classes */
  className?: string
  /** Show contextual suggestions */
  showContextualSuggestions?: boolean
}

const widgetConfig: Record<
  DashboardWidgetType,
  { icon: LucideIcon; primaryActionIcon: LucideIcon; suggestionContext: SuggestionContext }
> = {
  overview: { icon: LayoutDashboard, primaryActionIcon: Settings, suggestionContext: 'dashboard' },
  analytics: { icon: TrendingUp, primaryActionIcon: Plus, suggestionContext: 'dashboard' },
  activity: { icon: Activity, primaryActionIcon: Plus, suggestionContext: 'dashboard' },
  notifications: { icon: Bell, primaryActionIcon: Settings, suggestionContext: 'dashboard' },
  calendar: { icon: Calendar, primaryActionIcon: Plus, suggestionContext: 'calendar' },
  tasks: { icon: Target, primaryActionIcon: Plus, suggestionContext: 'task' },
  metrics: { icon: TrendingUp, primaryActionIcon: Settings, suggestionContext: 'dashboard' },
  recent: { icon: Activity, primaryActionIcon: Plus, suggestionContext: 'dashboard' },
}

/**
 * Specialized empty state for dashboard widgets.
 * Provides context-aware messaging for different dashboard sections.
 * Now includes intelligent contextual suggestions based on upcoming events,
 * organizational calendar, and user's pending work.
 *
 * @example
 * // Analytics widget empty state with contextual suggestions
 * <DashboardEmptyState
 *   widgetType="analytics"
 *   onPrimaryAction={() => navigateToAnalytics()}
 *   showContextualSuggestions
 * />
 *
 * @example
 * // Activity feed empty state
 * <DashboardEmptyState
 *   widgetType="activity"
 *   variant="compact"
 *   size="sm"
 * />
 */
export function DashboardEmptyState({
  widgetType,
  onPrimaryAction,
  onSetup,
  title: customTitle,
  description: customDescription,
  variant = 'default',
  size = 'sm',
  className,
  showContextualSuggestions = false,
}: DashboardEmptyStateProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  const config = widgetConfig[widgetType]

  const title =
    customTitle ||
    t(`dashboard.${widgetType}.title`, { defaultValue: t('dashboard.generic.title') })

  const description =
    customDescription ||
    t(`dashboard.${widgetType}.description`, {
      defaultValue: t('dashboard.generic.description'),
    })

  const hint = t(`dashboard.${widgetType}.hint`, {
    defaultValue: t('dashboard.generic.hint'),
  })

  const primaryAction: QuickAction | undefined = onPrimaryAction
    ? {
        label: t(`dashboard.${widgetType}.action`, {
          defaultValue: t('dashboard.generic.action'),
        }),
        icon: config.primaryActionIcon,
        onClick: onPrimaryAction,
      }
    : undefined

  const secondaryActions: QuickAction[] = []
  if (onSetup) {
    secondaryActions.push({
      label: t('dashboard.configure'),
      icon: Settings,
      onClick: onSetup,
      variant: 'ghost',
    })
  }

  return (
    <div className={cn('flex flex-col', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <EmptyState
        icon={config.icon}
        title={title}
        description={description}
        hint={hint}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        variant={variant}
        size={size}
        testId={`dashboard-empty-state-${widgetType}`}
      />

      {/* Contextual Suggestions */}
      {showContextualSuggestions && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <ContextualSuggestions
            context={config.suggestionContext}
            limit={4}
            variant="compact"
            size={size}
            showTitle
            testId={`dashboard-suggestions-${widgetType}`}
          />
        </div>
      )}
    </div>
  )
}
