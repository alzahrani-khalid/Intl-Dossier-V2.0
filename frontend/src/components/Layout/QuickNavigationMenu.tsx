/**
 * Quick Navigation Menu Component
 *
 * Provides fast access to:
 * - Pinned entities (user favorites)
 * - Recently viewed entities
 * - Quick navigation actions
 *
 * Mobile-first design with RTL support.
 */

import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import {
  Zap,
  Pin,
  PinOff,
  History,
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
  User,
  Calendar,
  Briefcase,
  Users,
  MessageSquare,
  FileText,
  Star,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useEntityHistoryStore,
  type EntityType,
  type EntityHistoryEntry,
} from '@/store/entityHistoryStore'
import {
  usePinnedEntitiesStore,
  type PinnedEntityEntry,
  getPinnedColorClass,
} from '@/store/pinnedEntitiesStore'

/** Map entity types to icons */
const entityIcons: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  dossier: FileText,
  country: Globe,
  organization: Building2,
  person: User,
  engagement: Calendar,
  position: Briefcase,
  forum: Users,
  working_group: Users,
  topic: MessageSquare,
}

/** Map entity types to colors */
const entityColors: Record<EntityType, string> = {
  dossier: 'text-slate-500 dark:text-slate-400',
  country: 'text-blue-500 dark:text-blue-400',
  organization: 'text-purple-500 dark:text-purple-400',
  person: 'text-green-500 dark:text-green-400',
  engagement: 'text-amber-500 dark:text-amber-400',
  position: 'text-teal-500 dark:text-teal-400',
  forum: 'text-indigo-500 dark:text-indigo-400',
  working_group: 'text-pink-500 dark:text-pink-400',
  topic: 'text-orange-500 dark:text-orange-400',
}

interface QuickNavItemProps {
  id: string
  type: EntityType
  name: string
  route: string
  subType?: string
  isPinned?: boolean
  onPinToggle?: () => void
  isRTL: boolean
  t: (key: string, fallback?: string) => string
  compact?: boolean
  onLinkClick?: () => void
}

function QuickNavItem({
  id,
  type,
  name,
  route,
  subType,
  isPinned,
  onPinToggle,
  isRTL,
  t,
  compact = false,
  onLinkClick,
}: QuickNavItemProps) {
  const Icon = entityIcons[type] || FileText
  const colorClass = entityColors[type]

  // Truncate long names
  const maxLength = compact ? 18 : 24
  const truncatedName = name.length > maxLength ? `${name.slice(0, maxLength - 2)}...` : name

  return (
    <div className="group relative flex items-center">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={route as any}
              onClick={onLinkClick}
              className={cn(
                'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md',
                'text-xs sm:text-sm',
                'transition-all duration-150',
                'hover:bg-accent/50',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                // Touch target
                'min-h-9 sm:min-h-8',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', colorClass)} />
              <span className="truncate flex-1">{truncatedName}</span>
              {isPinned && (
                <Star
                  className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500"
                  aria-label={t('quickNav.pinned', 'Pinned')}
                />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'}>
            <div className="text-sm">
              <p className="font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {t(`entityTypes.${type}`, type)}
                {subType && ` • ${subType}`}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Pin/Unpin button - visible on hover */}
      {onPinToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            'transition-opacity duration-150',
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onPinToggle()
          }}
          aria-label={
            isPinned
              ? t('quickNav.unpin', 'Unpin from quick access')
              : t('quickNav.pin', 'Pin for quick access')
          }
        >
          {isPinned ? (
            <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  )
}

interface QuickNavigationMenuProps {
  /** Whether the menu is expanded (for sidebar integration) */
  isExpanded?: boolean
  /** Maximum recent items to show */
  maxRecent?: number
  /** Maximum pinned items to show */
  maxPinned?: number
  /** Callback when a link is clicked (for mobile sheet close) */
  onLinkClick?: () => void
  /** Additional className */
  className?: string
  /** Compact mode */
  compact?: boolean
}

export function QuickNavigationMenu({
  isExpanded = true,
  maxRecent = 5,
  maxPinned = 5,
  onLinkClick,
  className,
  compact = false,
}: QuickNavigationMenuProps) {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'

  // State for collapsible sections
  const [isPinnedOpen, setIsPinnedOpen] = useState(true)
  const [isRecentOpen, setIsRecentOpen] = useState(true)

  // Get pinned and recent entities
  const { pinned, unpinEntity, isPinned: checkPinned } = usePinnedEntitiesStore()
  const { history } = useEntityHistoryStore()

  // Memoize displayed items
  const displayedPinned = useMemo(() => pinned.slice(0, maxPinned), [pinned, maxPinned])
  const displayedRecent = useMemo(() => history.slice(0, maxRecent), [history, maxRecent])
  const hasMorePinned = pinned.length > maxPinned
  const hasMoreRecent = history.length > maxRecent

  // Helper to toggle pin status
  const { togglePinned } = usePinnedEntitiesStore()

  const handlePinToggle = (entry: EntityHistoryEntry | PinnedEntityEntry) => {
    togglePinned({
      id: entry.id,
      type: entry.type,
      name_en: entry.name_en,
      name_ar: entry.name_ar,
      route: entry.route,
      subType: entry.subType,
    })
  }

  // Get display name based on language
  const getDisplayName = (entry: { name_en: string; name_ar: string }) => {
    return isRTL ? entry.name_ar : entry.name_en
  }

  // Don't render if no content
  if (displayedPinned.length === 0 && displayedRecent.length === 0) {
    return null
  }

  // Collapsed view (icon only)
  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={cn('h-10 w-10', className)}>
              <Zap className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'}>
            {t('quickNav.title', 'Quick Access')}
            <span className="text-xs text-muted-foreground ms-2">
              ({displayedPinned.length + displayedRecent.length})
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Section Header */}
      <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Zap className="h-3.5 w-3.5" />
        <span>{t('quickNav.title', 'Quick Access')}</span>
      </div>

      {/* Pinned Section */}
      {displayedPinned.length > 0 && (
        <Collapsible open={isPinnedOpen} onOpenChange={setIsPinnedOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5',
                'text-xs font-medium text-muted-foreground',
                'hover:bg-accent/30 rounded-md transition-colors',
                'min-h-8',
              )}
            >
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {t('quickNav.pinned', 'Pinned')}
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {pinned.length}
                </span>
              </span>
              {isPinnedOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AnimatePresence mode="popLayout">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-0.5 ps-2"
              >
                {displayedPinned.map((entry) => (
                  <QuickNavItem
                    key={entry.id}
                    id={entry.id}
                    type={entry.type}
                    name={getDisplayName(entry)}
                    route={entry.route}
                    subType={entry.subType}
                    isPinned={true}
                    onPinToggle={() => handlePinToggle(entry)}
                    isRTL={isRTL}
                    t={t}
                    compact={compact}
                    onLinkClick={onLinkClick}
                  />
                ))}
                {hasMorePinned && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 text-xs text-muted-foreground"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 me-1.5" />
                        {t('quickNav.viewAll', 'View all')} ({pinned.length - maxPinned}{' '}
                        {t('quickNav.more', 'more')})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? 'end' : 'start'} className="w-56">
                      {pinned.slice(maxPinned).map((entry) => {
                        const Icon = entityIcons[entry.type] || FileText
                        return (
                          <DropdownMenuItem key={entry.id} asChild>
                            <Link
                              to={entry.route as any}
                              onClick={onLinkClick}
                              className="flex items-center gap-2"
                            >
                              <Icon className={cn('h-4 w-4', entityColors[entry.type])} />
                              <span className="truncate">{getDisplayName(entry)}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Recent Section */}
      {displayedRecent.length > 0 && (
        <Collapsible open={isRecentOpen} onOpenChange={setIsRecentOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5',
                'text-xs font-medium text-muted-foreground',
                'hover:bg-accent/30 rounded-md transition-colors',
                'min-h-8',
              )}
            >
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                {t('quickNav.recent', 'Recent')}
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              </span>
              {isRecentOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AnimatePresence mode="popLayout">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-0.5 ps-2"
              >
                {displayedRecent.map((entry) => (
                  <QuickNavItem
                    key={entry.id}
                    id={entry.id}
                    type={entry.type}
                    name={getDisplayName(entry)}
                    route={entry.route}
                    subType={entry.subType}
                    isPinned={checkPinned(entry.id)}
                    onPinToggle={() => handlePinToggle(entry)}
                    isRTL={isRTL}
                    t={t}
                    compact={compact}
                    onLinkClick={onLinkClick}
                  />
                ))}
                {hasMoreRecent && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 text-xs text-muted-foreground"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 me-1.5" />
                        {t('quickNav.viewAll', 'View all')} ({history.length - maxRecent}{' '}
                        {t('quickNav.more', 'more')})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? 'end' : 'start'} className="w-56">
                      {history.slice(maxRecent).map((entry) => {
                        const Icon = entityIcons[entry.type] || FileText
                        return (
                          <DropdownMenuItem key={entry.id} asChild>
                            <Link
                              to={entry.route as any}
                              onClick={onLinkClick}
                              className="flex items-center gap-2"
                            >
                              <Icon className={cn('h-4 w-4', entityColors[entry.type])} />
                              <span className="truncate">{getDisplayName(entry)}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

export default QuickNavigationMenu
