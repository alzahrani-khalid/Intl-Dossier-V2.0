import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from '@tanstack/react-router'
import { m, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'
import { useDirection } from '@/hooks/useDirection'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useWorkQueueCounts } from '@/hooks/useWorkQueueCounts'
import {
  createNavigationGroups,
  type NavigationGroup,
} from './navigation-config'
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetClose,
} from '@/components/ui/bottom-sheet'

// ============================================================================
// Types
// ============================================================================

interface TabItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badgeCount?: number
}

// ============================================================================
// Constants
// ============================================================================

const MOBILE_TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'dossiers',
    label: 'navigation.dossiers',
    path: '/dossiers',
    icon: FolderOpen,
  },
  {
    id: 'tasks',
    label: 'navigation.tasks',
    path: '/my-work',
    icon: CheckSquare,
  },
]

// ============================================================================
// Helper: check active state
// ============================================================================

function isTabActive(tabPath: string, currentPath: string): boolean {
  if (tabPath === '/dashboard') {
    return currentPath === '/dashboard' || currentPath === '/'
  }
  return currentPath.startsWith(tabPath)
}

// ============================================================================
// Sub-component: TabButton
// ============================================================================

interface TabButtonProps {
  tab: TabItem
  isActive: boolean
  badgeCount?: number
}

function TabButton({ tab, isActive, badgeCount }: TabButtonProps): React.ReactElement {
  const { t } = useTranslation('common')
  const Icon = tab.icon

  return (
    <Link
      to={tab.path}
      className={cn(
        'relative flex flex-1 flex-col items-center justify-center gap-0.5',
        'min-h-11 min-w-11 py-1.5',
        'transition-colors duration-150',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="relative">
        <Icon
          className={cn(
            'h-5 w-5',
            isActive ? 'stroke-[2.5]' : 'stroke-[1.5]',
          )}
        />
        {/* Badge dot */}
        {(badgeCount ?? 0) > 0 && (
          <span
            className={cn(
              'absolute -top-1 -end-1.5',
              'flex h-4 min-w-4 items-center justify-center',
              'rounded-full bg-destructive px-1',
              'text-[10px] font-bold leading-none text-destructive-foreground',
            )}
          >
            {badgeCount}
          </span>
        )}
      </span>
      <span
        className={cn(
          'text-[10px] leading-tight',
          isActive ? 'font-semibold' : 'font-normal',
        )}
      >
        {t(tab.label)}
      </span>
    </Link>
  )
}

// ============================================================================
// Sub-component: MoreSheet
// ============================================================================

interface MoreSheetProps {
  groups: NavigationGroup[]
  currentPath: string
}

function MoreSheet({ groups, currentPath }: MoreSheetProps): React.ReactElement {
  const { t } = useTranslation('common')

  // Collect items not in the primary 4 tabs
  const primaryPaths = new Set(['/dashboard', '/dossiers', '/my-work'])

  // Filter groups to only show items NOT in primary tabs
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !primaryPaths.has(item.path) && !item.path.startsWith('/dossiers/'),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="flex flex-col gap-4 py-2">
      {filteredGroups.map((group) => (
        <div key={group.id}>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t(group.label)}
          </h3>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isTabActive(item.path, currentPath)
              return (
                <BottomSheetClose key={item.id} asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5',
                      'min-h-11 transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{t(item.label)}</span>
                    {(item.badgeCount ?? 0) > 0 && (
                      <span
                        className={cn(
                          'ms-auto flex h-5 min-w-5 items-center justify-center',
                          'rounded-full bg-destructive px-1.5',
                          'text-xs font-bold text-destructive-foreground',
                        )}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                </BottomSheetClose>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component: MobileBottomTabBar
// ============================================================================

export function MobileBottomTabBar(): React.ReactElement | null {
  const { isMobile } = useResponsive()
  const { direction } = useDirection()
  const { t } = useTranslation('common')
  const location = useLocation()
  const scrollDirection = useScrollDirection()
  const { data: workCounts } = useWorkQueueCounts()
  const [moreOpen, setMoreOpen] = useState(false)

  // Only render on mobile
  if (!isMobile) return null

  const currentPath = location.pathname
  const isVisible = scrollDirection !== 'down'

  // Build navigation groups for the "More" sheet
  const groups = createNavigationGroups(
    {
      tasks: workCounts?.intake ?? 0,
      approvals: workCounts?.waiting ?? 0,
      engagements: 0,
    },
    true, // show admin items in More sheet
  )

  // Resolve badge count for tasks tab
  const tasksBadge = (workCounts?.intake ?? 0) + (workCounts?.waiting ?? 0)

  return (
    <AnimatePresence>
      {isVisible && (
        <m.nav
          dir={direction}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-0 start-0 end-0 z-50',
            'border-t bg-background/95 backdrop-blur-md',
            'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
          aria-label={t('navigation.mobileNav', 'Navigation')}
        >
          <div className="flex items-stretch">
            {/* Primary tabs */}
            {MOBILE_TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={isTabActive(tab.path, currentPath)}
                badgeCount={tab.id === 'tasks' ? tasksBadge : tab.badgeCount}
              />
            ))}

            {/* More tab — opens bottom sheet */}
            <BottomSheet
              open={moreOpen}
              onOpenChange={setMoreOpen}
              snapPreset="large"
            >
              <BottomSheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'relative flex flex-1 flex-col items-center justify-center gap-0.5',
                    'min-h-11 min-w-11 py-1.5',
                    'transition-colors duration-150',
                    moreOpen
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                  aria-label={t('navigation.more', 'More')}
                  aria-expanded={moreOpen}
                >
                  {moreOpen ? (
                    <X className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <Menu className="h-5 w-5 stroke-[1.5]" />
                  )}
                  <span
                    className={cn(
                      'text-[10px] leading-tight',
                      moreOpen ? 'font-semibold' : 'font-normal',
                    )}
                  >
                    {t('navigation.more', 'More')}
                  </span>
                </button>
              </BottomSheetTrigger>

              <BottomSheetContent padding="sm">
                <BottomSheetHeader>
                  <BottomSheetTitle>{t('navigation.more', 'More')}</BottomSheetTitle>
                  <BottomSheetDescription>
                    {t('navigation.moreDescription', 'Additional navigation options')}
                  </BottomSheetDescription>
                </BottomSheetHeader>
                <MoreSheet groups={groups} currentPath={currentPath} />
              </BottomSheetContent>
            </BottomSheet>
          </div>
        </m.nav>
      )}
    </AnimatePresence>
  )
}
