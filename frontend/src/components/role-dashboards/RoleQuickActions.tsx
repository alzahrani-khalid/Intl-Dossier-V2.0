/**
 * RoleQuickActions Component
 *
 * Displays role-specific quick action buttons.
 * Mobile-first with RTL support.
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
  Users,
  CheckSquare,
  Brain,
  Settings,
  UserCog,
  ClipboardList,
  Briefcase,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoleQuickAction, RoleQuickActionsProps } from '@/types/role-dashboard.types'

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
    Users,
    CheckSquare,
    Brain,
    Settings,
    UserCog,
    ClipboardList,
    Briefcase,
  }
  return icons[iconName] || Plus
}

/**
 * Single action button component
 */
function ActionButton({
  action,
  isRTL,
  onClick,
}: {
  action: RoleQuickAction
  isRTL: boolean
  onClick?: () => void
}) {
  const Icon = getActionIcon(action.icon)
  const label = isRTL ? action.labelAr : action.label

  const buttonContent = (
    <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3">
      <div
        className={cn(
          'p-2 sm:p-3 rounded-lg transition-transform hover:scale-105',
          action.color || 'bg-muted',
        )}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-center line-clamp-1">{label}</span>
    </div>
  )

  // If action has a route and is a navigate action, wrap in Link
  if (action.route && action.action === 'navigate') {
    return (
      <Link
        to={action.route}
        className={cn(
          'flex-1 min-w-[70px] sm:min-w-[80px] max-w-[100px] sm:max-w-[120px] rounded-lg transition-colors',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {buttonContent}
      </Link>
    )
  }

  // If action has a route for creation, wrap in Link
  if (action.route) {
    return (
      <Link
        to={action.route}
        className={cn(
          'flex-1 min-w-[70px] sm:min-w-[80px] max-w-[100px] sm:max-w-[120px] rounded-lg transition-colors',
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
        'flex-1 min-w-[70px] sm:min-w-[80px] max-w-[100px] sm:max-w-[120px] rounded-lg transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {buttonContent}
    </button>
  )
}

export function RoleQuickActions({
  actions,
  onActionClick,
  layout = 'grid',
  maxVisible = 6,
  className,
}: RoleQuickActionsProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const visibleActions = actions.slice(0, maxVisible)

  const handleActionClick = (action: RoleQuickAction) => {
    if (onActionClick) {
      onActionClick(action)
    }
  }

  return (
    <div
      className={cn(
        'h-full',
        layout === 'grid' ? 'flex items-center justify-center' : '',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={cn(
          layout === 'grid'
            ? 'flex flex-wrap justify-center gap-2 sm:gap-3 p-1'
            : 'flex flex-row gap-2 sm:gap-3 overflow-x-auto p-1 scrollbar-hide',
        )}
      >
        {visibleActions.map((action) => (
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

export default RoleQuickActions
