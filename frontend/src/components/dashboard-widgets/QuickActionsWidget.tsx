/**
 * QuickActionsWidget Component
 *
 * Displays quick action buttons for common operations.
 * Supports custom actions and RTL layout.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Plus,
  Search,
  Calendar,
  FileText,
  Inbox,
  ListTodo,
  BarChart2,
  FolderPlus,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuickActionsWidgetConfig, QuickAction } from '@/types/dashboard-widget.types'

interface QuickActionsWidgetProps {
  config: QuickActionsWidgetConfig
  onActionClick?: (action: QuickAction) => void
}

/**
 * Get icon component for action type
 */
function getActionIcon(iconName: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    Plus,
    Search,
    Calendar,
    FileText,
    Inbox,
    ListTodo,
    BarChart2,
    FolderPlus,
  }
  return icons[iconName] || Plus
}

/**
 * Default quick actions
 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-dossier',
    label: 'Create Dossier',
    labelAr: 'إنشاء ملف',
    icon: 'FolderPlus',
    action: 'create-dossier',
    route: '/dossiers/new',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'create-task',
    label: 'Create Task',
    labelAr: 'إنشاء مهمة',
    icon: 'ListTodo',
    action: 'create-task',
    route: '/my-work?action=create-task',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    id: 'create-intake',
    label: 'Create Intake',
    labelAr: 'إنشاء استقبال',
    icon: 'Inbox',
    action: 'create-intake',
    route: '/intake/new',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'search',
    label: 'Search',
    labelAr: 'بحث',
    icon: 'Search',
    action: 'open-search',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'view-calendar',
    label: 'Calendar',
    labelAr: 'التقويم',
    icon: 'Calendar',
    action: 'navigate',
    route: '/calendar',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
  {
    id: 'view-reports',
    label: 'Reports',
    labelAr: 'التقارير',
    icon: 'BarChart2',
    action: 'navigate',
    route: '/reports',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  },
]

/**
 * Single action button component
 */
function ActionButton({
  action,
  isRTL,
  onClick,
}: {
  action: QuickAction
  isRTL: boolean
  onClick?: () => void
}) {
  const Icon = getActionIcon(action.icon)
  const label = isRTL ? action.labelAr : action.label

  const buttonContent = (
    <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3">
      <div className={cn('p-2 sm:p-3 rounded-lg', action.color || 'bg-muted')}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-center line-clamp-1">{label}</span>
    </div>
  )

  // If action has a route, wrap in Link
  if (action.route && action.action === 'navigate') {
    return (
      <Link
        to={action.route}
        className={cn(
          'flex-1 min-w-[70px] sm:min-w-[80px] rounded-lg transition-colors',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {buttonContent}
      </Link>
    )
  }

  // Otherwise, render as a button
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-[70px] sm:min-w-[80px] rounded-lg transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {buttonContent}
    </button>
  )
}

export function QuickActionsWidget({ config, onActionClick }: QuickActionsWidgetProps) {
  const { i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const { settings } = config
  const actions = settings.actions.length > 0 ? settings.actions : DEFAULT_QUICK_ACTIONS

  const handleActionClick = (action: QuickAction) => {
    if (onActionClick) {
      onActionClick(action)
    }
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-1">
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            isRTL={isRTL}
            onClick={() => handleActionClick(action)}
          />
        ))}
      </div>
    </div>
  )
}

export default QuickActionsWidget
