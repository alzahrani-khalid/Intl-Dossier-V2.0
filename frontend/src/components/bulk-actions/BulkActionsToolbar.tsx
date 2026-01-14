import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  X,
  ChevronDown,
  RefreshCw,
  UserPlus,
  Tags,
  Download,
  Trash2,
  Archive,
  RotateCcw,
  Bell,
  AlertTriangle,
  ArrowUpCircle,
  MoreHorizontal,
} from 'lucide-react'
import type {
  BulkSelectableItem,
  BulkSelectionState,
  BulkActionDefinition,
  BulkActionState,
  BulkActionEntityType,
} from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'

export interface BulkActionsToolbarProps<T extends BulkSelectableItem = BulkSelectableItem> {
  /** Selection state */
  selection: BulkSelectionState
  /** Available actions */
  actions: BulkActionDefinition<T>[]
  /** Entity type for display */
  entityType: BulkActionEntityType
  /** Action state */
  actionState: BulkActionState
  /** Callback when action is triggered */
  onActionClick: (action: BulkActionDefinition<T>) => void
  /** Callback to clear selection */
  onClearSelection: () => void
  /** Callback to select all visible items */
  onSelectAll?: () => void
  /** Whether component is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Icon mapping for action types
 */
const ACTION_ICONS: Record<string, React.ReactNode> = {
  'update-status': <RefreshCw className="h-4 w-4" />,
  assign: <UserPlus className="h-4 w-4" />,
  unassign: <UserPlus className="h-4 w-4" />,
  'add-tags': <Tags className="h-4 w-4" />,
  'remove-tags': <Tags className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  archive: <Archive className="h-4 w-4" />,
  restore: <RotateCcw className="h-4 w-4" />,
  'send-reminder': <Bell className="h-4 w-4" />,
  escalate: <AlertTriangle className="h-4 w-4" />,
  'change-priority': <ArrowUpCircle className="h-4 w-4" />,
}

/**
 * BulkActionsToolbar - Displays bulk action controls when items are selected
 *
 * Features:
 * - Shows selection count with entity type
 * - Primary action buttons for common operations
 * - Dropdown menu for additional actions
 * - "Clear Selection" button
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - Touch-friendly controls (44x44px minimum)
 * - Warning at max item limit
 */
export function BulkActionsToolbar<T extends BulkSelectableItem = BulkSelectableItem>({
  selection,
  actions,
  entityType,
  actionState,
  onActionClick,
  onClearSelection,
  onSelectAll,
  disabled = false,
  className,
}: BulkActionsToolbarProps<T>) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  const { selectedCount, maxReached } = selection
  const isProcessing = actionState.status === 'processing'

  // Don't render if nothing selected
  if (selectedCount === 0) {
    return null
  }

  // Split actions into primary (first 3) and secondary (rest)
  const primaryActions = actions.slice(0, 3)
  const secondaryActions = actions.slice(3)

  // Get entity type label
  const entityLabel =
    selectedCount === 1 ? t(`entityTypes.${entityType}`) : t(`entityTypes.${entityType}_plural`)

  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex flex-col gap-2 p-3 sm:p-4',
        'bg-blue-50 border-b border-blue-200',
        'dark:bg-blue-950 dark:border-blue-800',
        'sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="toolbar"
      aria-label={t('accessibility.toolbar')}
    >
      {/* Selection Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100 sm:text-base">
          {t('selection.selected', { count: selectedCount })} {entityLabel}
        </span>

        {maxReached && (
          <span className="text-xs text-orange-600 dark:text-orange-400 sm:text-sm">
            {t('selection.maxReached')}
          </span>
        )}

        {onSelectAll && !maxReached && (
          <Button
            variant="link"
            size="sm"
            onClick={onSelectAll}
            disabled={disabled || isProcessing}
            className="h-auto p-0 text-blue-600 dark:text-blue-400"
          >
            {t('selection.selectAll')}
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Primary Actions */}
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            onClick={() => onActionClick(action)}
            disabled={disabled || isProcessing}
            variant={action.variant || 'default'}
            size="sm"
            className={cn(
              'h-10 min-w-10 px-3 text-sm sm:h-11 sm:px-4',
              action.isDestructive && 'hover:bg-red-600 hover:text-white',
            )}
            aria-label={t(`actions.${action.id.replace(/-/g, '')}`)}
          >
            <span className={cn('me-0 sm:me-2', isRTL && 'rotate-0')}>
              {ACTION_ICONS[action.id] || <MoreHorizontal className="h-4 w-4" />}
            </span>
            <span className="hidden sm:inline">{t(`actions.${action.id.replace(/-/g, '')}`)}</span>
          </Button>
        ))}

        {/* Secondary Actions Dropdown */}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
                className="h-10 min-w-10 px-3 sm:h-11 sm:px-4"
                aria-label={t('actions.moreActions')}
              >
                <MoreHorizontal className="h-4 w-4 me-0 sm:me-2" />
                <span className="hidden sm:inline">{t('actions.moreActions')}</span>
                <ChevronDown className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
              {secondaryActions.map((action, index) => (
                <div key={action.id}>
                  {action.isDestructive && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onActionClick(action)}
                    disabled={disabled || isProcessing}
                    className={cn(
                      'gap-2',
                      action.isDestructive && 'text-red-600 dark:text-red-400 focus:text-red-600',
                    )}
                  >
                    {ACTION_ICONS[action.id] || <MoreHorizontal className="h-4 w-4" />}
                    <span>{t(`actions.${action.id.replace(/-/g, '')}`)}</span>
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Selection */}
        <Button
          onClick={onClearSelection}
          variant="ghost"
          size="sm"
          disabled={isProcessing}
          className="h-10 min-w-10 px-3 sm:h-11 sm:px-4 text-gray-600 dark:text-gray-400"
          aria-label={t('selection.clearSelection')}
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline ms-2">{t('selection.clearSelection')}</span>
        </Button>
      </div>
    </div>
  )
}

export default BulkActionsToolbar
