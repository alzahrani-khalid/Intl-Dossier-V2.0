/**
 * Entity Breadcrumb Trail Component
 *
 * Displays a persistent breadcrumb trail of the last 5-10 entities viewed.
 * Enables quick navigation back to recently accessed records.
 * Mobile-first design with RTL support.
 */

import { useRef, useCallback } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import {
  Globe,
  Building2,
  User,
  Calendar,
  Briefcase,
  Users,
  MessageSquare,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  History,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  dossier: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  country: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  organization: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  person: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  engagement: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
  position: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300',
  forum: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
  working_group: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
  topic: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
}

interface EntityBreadcrumbItemProps {
  entry: EntityHistoryEntry
  isRTL: boolean
  isActive: boolean
  onRemove: (id: string) => void
  t: (key: string, fallback?: string) => string
}

function EntityBreadcrumbItem({ entry, isRTL, isActive, onRemove, t }: EntityBreadcrumbItemProps) {
  const Icon = entityIcons[entry.type] || FileText
  const colorClass = entityColors[entry.type] || entityColors.dossier
  const displayName = isRTL ? entry.name_ar : entry.name_en

  // Truncate long names
  const truncatedName = displayName.length > 20 ? `${displayName.slice(0, 18)}...` : displayName

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="relative flex-shrink-0 group"
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={entry.route as any}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs sm:text-sm',
                'transition-all duration-200',
                'hover:ring-2 hover:ring-primary/30',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                colorClass,
                isActive && 'ring-2 ring-primary font-medium',
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline max-w-[120px] truncate">{truncatedName}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <div className="text-sm">
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {t(`entityTypes.${entry.type}`, entry.type)}
                {entry.subType && ` - ${entry.subType}`}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Remove button - visible on hover */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(entry.id)
        }}
        className={cn(
          'absolute -top-1.5 -end-1.5 p-0.5 rounded-full',
          'bg-muted hover:bg-destructive hover:text-destructive-foreground',
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          'transition-opacity duration-200',
          'focus:outline-none focus:ring-2 focus:ring-destructive',
        )}
        aria-label={t('breadcrumbTrail.remove', 'Remove from history')}
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}

export interface EntityBreadcrumbTrailProps {
  /** Maximum entities to display in the trail */
  maxDisplay?: number
  /** Additional className */
  className?: string
  /** Compact mode for smaller spaces */
  compact?: boolean
}

export function EntityBreadcrumbTrail({
  maxDisplay = 5,
  className,
  compact = false,
}: EntityBreadcrumbTrailProps) {
  const { t, i18n } = useTranslation('common')
  const location = useLocation()
  const isRTL = i18n.language === 'ar'

  const { history, removeEntity, clearHistory } = useEntityHistoryStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get displayed entities
  const displayedEntities = history.slice(0, maxDisplay)
  const hasMore = history.length > maxDisplay
  const remainingCount = history.length - maxDisplay

  // Check if current route matches an entity
  const currentPath = location.pathname
  const isCurrentEntity = (route: string) => currentPath === route

  // Scroll handlers for mobile
  const handleScroll = useCallback((direction: 'start' | 'end') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      const currentScroll = scrollContainerRef.current.scrollLeft
      const newScroll =
        direction === 'end' ? currentScroll + scrollAmount : currentScroll - scrollAmount
      scrollContainerRef.current.scrollTo({ left: newScroll, behavior: 'smooth' })
    }
  }, [])

  // Don't render if no history
  if (history.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-2',
        'bg-background/80 backdrop-blur-sm',
        compact ? 'py-1 px-2' : 'py-2 px-3 sm:px-4',
        'border-b border-border/50',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* History Icon & Label */}
      <div
        className={cn(
          'flex items-center gap-1.5 flex-shrink-0',
          'text-muted-foreground text-xs sm:text-sm',
        )}
      >
        <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden md:inline">{t('breadcrumbTrail.recent', 'Recent')}</span>
      </div>

      {/* Scroll Left Button (for overflow) */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0',
          'opacity-0 pointer-events-none',
          'md:hidden', // Only on mobile
        )}
        onClick={() => handleScroll('start')}
        aria-label={
          isRTL
            ? t('breadcrumbTrail.scrollRight', 'Scroll right')
            : t('breadcrumbTrail.scrollLeft', 'Scroll left')
        }
      >
        {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Scrollable Entity Trail */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 flex items-center gap-1.5 sm:gap-2',
          'overflow-x-auto scrollbar-hide',
          'snap-x snap-mandatory',
        )}
      >
        <AnimatePresence mode="popLayout">
          {displayedEntities.map((entry) => (
            <EntityBreadcrumbItem
              key={entry.id}
              entry={entry}
              isRTL={isRTL}
              isActive={isCurrentEntity(entry.route)}
              onRemove={removeEntity}
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Scroll Right Button (for overflow) */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0',
          'opacity-0 pointer-events-none',
          'md:hidden', // Only on mobile
        )}
        onClick={() => handleScroll('end')}
        aria-label={
          isRTL
            ? t('breadcrumbTrail.scrollLeft', 'Scroll left')
            : t('breadcrumbTrail.scrollRight', 'Scroll right')
        }
      >
        {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* More Menu (when overflow) */}
      {hasMore && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              +{remainingCount} {t('breadcrumbTrail.more', 'more')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
            {history.slice(maxDisplay).map((entry) => {
              const Icon = entityIcons[entry.type] || FileText
              const displayName = isRTL ? entry.name_ar : entry.name_en
              return (
                <DropdownMenuItem key={entry.id} asChild>
                  <Link to={entry.route as any} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{displayName}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                clearHistory()
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 me-2" />
              {t('breadcrumbTrail.clearAll', 'Clear all')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Clear All Button (when no overflow) */}
      {!hasMore && history.length > 1 && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                onClick={clearHistory}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('breadcrumbTrail.clearAll', 'Clear all')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export default EntityBreadcrumbTrail
