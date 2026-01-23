/**
 * AddToDossierMenu - Contextual action menu for dossier detail pages
 *
 * Provides a unified "Add to Dossier" mental model with actions:
 * - New Intake
 * - New Task
 * - New Commitment
 * - New Position
 * - Schedule Event
 * - Add Relationship
 * - Generate Brief
 * - Upload Document
 *
 * All created items automatically inherit dossier context with proper
 * inheritance_source tracking ('direct' for items created from dossier page).
 *
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 *
 * @module AddToDossierMenu
 * @see specs/035-dossier-context
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Inbox,
  CheckSquare,
  Handshake,
  MessageSquare,
  Calendar,
  GitBranch,
  FileText,
  Upload,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Dossier } from '@/lib/dossier-type-guards'
import type { DossierType } from '@/types/dossier-context.types'

// =============================================================================
// Types
// =============================================================================

export type AddToDossierActionType =
  | 'intake'
  | 'task'
  | 'commitment'
  | 'position'
  | 'event'
  | 'relationship'
  | 'brief'
  | 'document'

export interface AddToDossierAction {
  type: AddToDossierActionType
  icon: React.ReactNode
  label: string
  description?: string
  /** Callback when action is triggered */
  onClick?: () => void
  /** Whether the action is disabled */
  disabled?: boolean
  /** Hide this action entirely */
  hidden?: boolean
}

export interface AddToDossierMenuProps {
  /** The dossier to add items to */
  dossier: Dossier
  /** Callback when any action is triggered, receives action type and dossier context */
  onAction?: (actionType: AddToDossierActionType, dossierContext: DossierContext) => void
  /** Override default actions */
  actions?: Partial<Record<AddToDossierActionType, Partial<AddToDossierAction>>>
  /** Custom class names */
  className?: string
  /** Variant: 'button' (dropdown) | 'fab' (floating action button) | 'card' (vertical list) */
  variant?: 'button' | 'fab' | 'card'
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Show action descriptions in menu */
  showDescriptions?: boolean
}

export interface DossierContext {
  dossier_id: string
  dossier_type: DossierType
  dossier_name_en: string
  dossier_name_ar: string | null
  inheritance_source: 'direct'
}

// =============================================================================
// Default Actions Configuration
// =============================================================================

const getDefaultActions = (
  t: (key: string) => string,
): Record<AddToDossierActionType, AddToDossierAction> => ({
  intake: {
    type: 'intake',
    icon: <Inbox className="h-4 w-4" />,
    label: t('addToDossier.actions.intake.label'),
    description: t('addToDossier.actions.intake.description'),
  },
  task: {
    type: 'task',
    icon: <CheckSquare className="h-4 w-4" />,
    label: t('addToDossier.actions.task.label'),
    description: t('addToDossier.actions.task.description'),
  },
  commitment: {
    type: 'commitment',
    icon: <Handshake className="h-4 w-4" />,
    label: t('addToDossier.actions.commitment.label'),
    description: t('addToDossier.actions.commitment.description'),
  },
  position: {
    type: 'position',
    icon: <MessageSquare className="h-4 w-4" />,
    label: t('addToDossier.actions.position.label'),
    description: t('addToDossier.actions.position.description'),
  },
  event: {
    type: 'event',
    icon: <Calendar className="h-4 w-4" />,
    label: t('addToDossier.actions.event.label'),
    description: t('addToDossier.actions.event.description'),
  },
  relationship: {
    type: 'relationship',
    icon: <GitBranch className="h-4 w-4" />,
    label: t('addToDossier.actions.relationship.label'),
    description: t('addToDossier.actions.relationship.description'),
  },
  brief: {
    type: 'brief',
    icon: <FileText className="h-4 w-4" />,
    label: t('addToDossier.actions.brief.label'),
    description: t('addToDossier.actions.brief.description'),
  },
  document: {
    type: 'document',
    icon: <Upload className="h-4 w-4" />,
    label: t('addToDossier.actions.document.label'),
    description: t('addToDossier.actions.document.description'),
  },
})

// =============================================================================
// Action Groups (categorized for better UX)
// =============================================================================

const ACTION_GROUPS: { labelKey: string; actions: AddToDossierActionType[] }[] = [
  {
    labelKey: 'addToDossier.groups.workItems',
    actions: ['intake', 'task', 'commitment'],
  },
  {
    labelKey: 'addToDossier.groups.planning',
    actions: ['position', 'event'],
  },
  {
    labelKey: 'addToDossier.groups.content',
    actions: ['relationship', 'brief', 'document'],
  },
]

// =============================================================================
// Helper: Build Dossier Context
// =============================================================================

function buildDossierContext(dossier: Dossier): DossierContext {
  return {
    dossier_id: dossier.id,
    dossier_type: dossier.type as DossierType,
    dossier_name_en: dossier.name_en,
    dossier_name_ar: dossier.name_ar ?? null,
    inheritance_source: 'direct',
  }
}

// =============================================================================
// Component: AddToDossierMenu (Button Variant)
// =============================================================================

function AddToDossierButton({
  dossier,
  onAction,
  actions: actionOverrides,
  className,
  size = 'default',
  showDescriptions = false,
}: AddToDossierMenuProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const [isOpen, setIsOpen] = React.useState(false)

  const defaultActions = getDefaultActions(t)
  const dossierContext = buildDossierContext(dossier)

  // Merge default actions with overrides
  const mergedActions = Object.entries(defaultActions).reduce(
    (acc, [key, defaultAction]) => {
      const override = actionOverrides?.[key as AddToDossierActionType]
      acc[key as AddToDossierActionType] = {
        ...defaultAction,
        ...override,
      }
      return acc
    },
    {} as Record<AddToDossierActionType, AddToDossierAction>,
  )

  const handleAction = (actionType: AddToDossierActionType) => {
    const action = mergedActions[actionType]
    action.onClick?.()
    onAction?.(actionType, dossierContext)
    setIsOpen(false)
  }

  const sizeClasses = {
    sm: 'h-8 text-sm',
    default: 'h-10',
    lg: 'h-12 text-lg',
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className={cn('gap-2', sizeClasses[size], className)}
          aria-label={t('addToDossier.title')}
        >
          <Plus className={cn('shrink-0', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
          <span className="hidden sm:inline">{t('addToDossier.title')}</span>
          <ChevronDown
            className={cn(
              'shrink-0 transition-transform',
              isOpen && 'rotate-180',
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-64 sm:w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t('addToDossier.subtitle', { name: isRTL ? dossier.name_ar : dossier.name_en })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {ACTION_GROUPS.map((group, groupIndex) => (
          <React.Fragment key={group.labelKey}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                {t(group.labelKey)}
              </DropdownMenuLabel>
              {group.actions.map((actionType) => {
                const action = mergedActions[actionType]
                if (action.hidden) return null

                return (
                  <DropdownMenuItem
                    key={actionType}
                    onClick={() => handleAction(actionType)}
                    disabled={action.disabled}
                    className="flex items-start gap-3 py-2 cursor-pointer"
                  >
                    <span className="shrink-0 mt-0.5 text-muted-foreground">{action.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{action.label}</div>
                      {showDescriptions && action.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {action.description}
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// =============================================================================
// Component: AddToDossierMenu (FAB Variant)
// =============================================================================

function AddToDossierFAB({
  dossier,
  onAction,
  actions: actionOverrides,
  className,
  size = 'default',
}: AddToDossierMenuProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const [isExpanded, setIsExpanded] = React.useState(false)

  const defaultActions = getDefaultActions(t)
  const dossierContext = buildDossierContext(dossier)

  // Merge default actions with overrides
  const mergedActions = Object.entries(defaultActions).reduce(
    (acc, [key, defaultAction]) => {
      const override = actionOverrides?.[key as AddToDossierActionType]
      acc[key as AddToDossierActionType] = {
        ...defaultAction,
        ...override,
      }
      return acc
    },
    {} as Record<AddToDossierActionType, AddToDossierAction>,
  )

  // Flatten actions for FAB display
  const visibleActions = Object.values(mergedActions).filter((a) => !a.hidden)

  const handleAction = (actionType: AddToDossierActionType) => {
    const action = mergedActions[actionType]
    action.onClick?.()
    onAction?.(actionType, dossierContext)
    setIsExpanded(false)
  }

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isExpanded])

  const fabSize = {
    sm: 'h-12 w-12 min-w-12',
    default: 'h-14 w-14 min-w-14',
    lg: 'h-16 w-16 min-w-16',
  }

  const miniSize = {
    sm: 'h-10 w-10 min-w-10',
    default: 'h-11 w-11 min-w-11',
    lg: 'h-12 w-12 min-w-12',
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div
        className={cn(
          'fixed z-50',
          'bottom-[max(1rem,env(safe-area-inset-bottom))]',
          isRTL ? 'start-4 sm:start-6' : 'end-4 sm:end-6',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Speed dial items */}
        <AnimatePresence>
          {isExpanded &&
            visibleActions.map((action, index) => {
              const distanceFromMain = 64 + index * 52
              const delay = index * 0.04

              return (
                <motion.div
                  key={action.type}
                  className="absolute flex items-center gap-2"
                  style={{
                    bottom: distanceFromMain,
                    [isRTL ? 'left' : 'right']: 0,
                  }}
                  initial={{ opacity: 0, y: 16, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.8 }}
                  transition={{ duration: 0.2, delay }}
                >
                  {/* Label */}
                  <motion.span
                    className={cn(
                      'rounded-md bg-popover px-2 py-1 text-sm font-medium text-popover-foreground shadow-md',
                      'whitespace-nowrap',
                      isRTL ? 'order-2' : 'order-1',
                    )}
                    initial={{ opacity: 0, x: isRTL ? -8 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: delay + 0.05 }}
                  >
                    {action.label}
                  </motion.span>

                  {/* Mini FAB */}
                  <Button
                    variant="secondary"
                    className={cn(
                      'rounded-full shadow-md hover:shadow-lg transition-shadow',
                      miniSize[size],
                      isRTL ? 'order-1' : 'order-2',
                    )}
                    onClick={() => handleAction(action.type)}
                    disabled={action.disabled}
                    aria-label={action.label}
                  >
                    {action.icon}
                  </Button>
                </motion.div>
              )
            })}
        </AnimatePresence>

        {/* Main FAB */}
        <Button
          variant="default"
          className={cn('rounded-full shadow-lg hover:shadow-xl transition-all', fabSize[size])}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? t('addToDossier.close') : t('addToDossier.title')}
          aria-expanded={isExpanded}
        >
          <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {isExpanded ? (
              <X className={size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'} />
            ) : (
              <Plus className={size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'} />
            )}
          </motion.div>
        </Button>
      </div>
    </>
  )
}

// =============================================================================
// Component: AddToDossierMenu (Card Variant)
// =============================================================================

function AddToDossierCard({
  dossier,
  onAction,
  actions: actionOverrides,
  className,
  showDescriptions = true,
}: AddToDossierMenuProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const defaultActions = getDefaultActions(t)
  const dossierContext = buildDossierContext(dossier)

  // Merge default actions with overrides
  const mergedActions = Object.entries(defaultActions).reduce(
    (acc, [key, defaultAction]) => {
      const override = actionOverrides?.[key as AddToDossierActionType]
      acc[key as AddToDossierActionType] = {
        ...defaultAction,
        ...override,
      }
      return acc
    },
    {} as Record<AddToDossierActionType, AddToDossierAction>,
  )

  const handleAction = (actionType: AddToDossierActionType) => {
    const action = mergedActions[actionType]
    action.onClick?.()
    onAction?.(actionType, dossierContext)
  }

  return (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">{t('addToDossier.title')}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('addToDossier.subtitle', { name: isRTL ? dossier.name_ar : dossier.name_en })}
        </p>
      </div>

      {/* Actions Grid */}
      <div className="p-3 space-y-1">
        {ACTION_GROUPS.map((group, groupIndex) => (
          <div key={group.labelKey}>
            {groupIndex > 0 && <div className="h-px bg-border my-2" />}
            <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
              {t(group.labelKey)}
            </div>
            {group.actions.map((actionType) => {
              const action = mergedActions[actionType]
              if (action.hidden) return null

              return (
                <Button
                  key={actionType}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-auto py-2.5 px-3',
                    'hover:bg-muted/50',
                  )}
                  onClick={() => handleAction(actionType)}
                  disabled={action.disabled}
                >
                  <span className="shrink-0 text-muted-foreground">{action.icon}</span>
                  <div className="flex-1 min-w-0 text-start">
                    <div className="font-medium text-sm">{action.label}</div>
                    {showDescriptions && action.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {action.description}
                      </div>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Main Export: AddToDossierMenu
// =============================================================================

export function AddToDossierMenu(props: AddToDossierMenuProps) {
  const { variant = 'button' } = props

  switch (variant) {
    case 'fab':
      return <AddToDossierFAB {...props} />
    case 'card':
      return <AddToDossierCard {...props} />
    case 'button':
    default:
      return <AddToDossierButton {...props} />
  }
}

// Named exports for direct imports
export { AddToDossierButton, AddToDossierFAB, AddToDossierCard }
