import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, Search, User, LogOut, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth.context'
import { useCollapsingHeader } from '@/hooks/useCollapsingHeader'
import { useOptionalKeyboardShortcutContext } from '@/components/KeyboardShortcuts'
import { ThemeSelector } from '@/components/theme-selector/theme-selector'
import { LanguageToggle } from '@/components/LanguageToggle'
import { NotificationPanel } from '@/components/notifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Route-to-title mapping for contextual header titles
const routeTitleMap: Record<string, string> = {
  '/dashboard': 'navigation.dashboard',
  '/dossiers': 'navigation.dossiers',
  '/engagements': 'navigation.engagements',
  '/calendar': 'navigation.calendar',
  '/intake': 'navigation.intakeQueue',
  '/my-work': 'navigation.myWork',
  '/search': 'navigation.search',
  '/analytics': 'navigation.analytics',
  '/forums': 'navigation.forums',
  '/persons': 'navigation.persons',
  '/working-groups': 'navigation.workingGroups',
  '/settings': 'navigation.settings',
  '/kanban': 'navigation.kanban',
}

// Get contextual title based on current route
function getContextualTitle(
  pathname: string,
  t: (key: string, fallback?: string) => string,
): string {
  // Exact match
  if (routeTitleMap[pathname]) {
    return t(routeTitleMap[pathname])
  }

  // Check for parent routes (e.g., /dossiers/123 should show "Dossiers")
  for (const [route, titleKey] of Object.entries(routeTitleMap)) {
    if (pathname.startsWith(`${route}/`)) {
      return t(titleKey)
    }
  }

  // Default fallback
  return t('common.appName', 'GASTAT Dossier')
}

export interface CollapsingHeaderProps {
  /** Callback when sidebar toggle is clicked */
  onToggleSidebar?: () => void
  /** Additional class names */
  className?: string
  /** Whether the header is enabled (default: true) */
  enabled?: boolean
  /** Container ref for scroll tracking */
  containerRef?: React.RefObject<HTMLElement>
}

/**
 * CollapsingHeader - A mobile-first header that:
 * 1. Shrinks on scroll to maximize content space
 * 2. Shows contextual title bar when collapsed
 * 3. Implements quick-return pattern (reappears on scroll up)
 *
 * Reclaims 15-20% of vertical space while maintaining context awareness.
 */
export function CollapsingHeader({
  onToggleSidebar,
  className,
  enabled = true,
  containerRef,
}: CollapsingHeaderProps) {
  const { t, i18n } = useTranslation(['common', 'navigation'])
  const location = useLocation()
  const { user, logout } = useAuth()
  const keyboardContext = useOptionalKeyboardShortcutContext()
  const isRTL = i18n.language === 'ar'

  // Get collapsing header state
  const { isVisible, isCollapsed, collapseProgress, isAtTop, scrollDirection } =
    useCollapsingHeader({
      enabled,
      containerRef,
      collapseThreshold: 60,
      quickReturnThreshold: 20,
      collapseDistance: 100,
    })

  // Platform-aware keyboard shortcut display
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  const cmdKey = isMac ? '⌘' : 'Ctrl+'

  // Get contextual title for collapsed state
  const contextualTitle = useMemo(
    () => getContextualTitle(location.pathname, t),
    [location.pathname, t],
  )

  // Calculate header height based on collapse progress
  // Full height: 64px (h-16), Collapsed height: 48px (h-12)
  const headerHeight = 64 - collapseProgress * 16

  const handleLogout = async () => {
    await logout()
  }

  return (
    <AnimatePresence mode="wait">
      <motion.header
        className={cn(
          // Base positioning
          'fixed top-0 inset-x-0 z-40',
          // Background with blur effect
          'bg-card/95 backdrop-blur-sm border-b border-border',
          // Shadow when scrolled
          !isAtTop && 'shadow-sm',
          className,
        )}
        // Animation states
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
          height: headerHeight,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Sidebar toggle - visible on mobile only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className={cn('md:hidden min-h-10 min-w-10', 'hover:bg-accent transition-colors')}
              aria-label={t('sidebar.toggle', 'Toggle sidebar')}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search bar - hidden when collapsed, desktop only */}
            <motion.button
              onClick={() => keyboardContext?.openCommandPalette()}
              className={cn(
                'hidden md:flex relative items-center gap-2',
                'ps-10 pe-3 py-2 rounded-lg',
                'bg-muted border-0 hover:bg-accent/50 transition-colors',
                'text-muted-foreground',
              )}
              animate={{
                width: isCollapsed ? 44 : 320,
                opacity: 1,
              }}
              transition={{ duration: 0.2 }}
              aria-label={t('keyboard-shortcuts:quickActions.title', 'Quick Actions')}
            >
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <motion.span
                className="flex-1 text-start text-sm whitespace-nowrap overflow-hidden"
                animate={{
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : 'auto',
                }}
                transition={{ duration: 0.15 }}
              >
                {t('search.searchPlaceholder')}
              </motion.span>
              {!isCollapsed && (
                <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium">
                  {cmdKey}K
                </kbd>
              )}
            </motion.button>

            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => keyboardContext?.openCommandPalette()}
              className="md:hidden min-h-10 min-w-10 hover:bg-accent transition-colors"
              aria-label={t('keyboard-shortcuts:quickActions.title', 'Quick Actions')}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Center section - Contextual title (visible when collapsed) */}
          <AnimatePresence>
            {isCollapsed && (
              <motion.div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                    {contextualTitle}
                  </span>
                  {/* Scroll direction indicator */}
                  <motion.div
                    animate={{ opacity: scrollDirection !== 'idle' ? 0.6 : 0 }}
                    className="text-muted-foreground"
                  >
                    {scrollDirection === 'up' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme selector - hidden when collapsed on mobile */}
            <motion.div
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : 'auto',
                marginInlineEnd: isCollapsed ? 0 : undefined,
              }}
              className={cn('hidden sm:block', isCollapsed && 'pointer-events-none')}
            >
              <ThemeSelector />
            </motion.div>

            {/* Language toggle - always visible */}
            <LanguageToggle />

            {/* Notifications - always visible */}
            <NotificationPanel />

            {/* User menu - simplified when collapsed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'flex items-center gap-2 p-2 min-h-10',
                    'hover:bg-accent transition-colors',
                    isCollapsed && 'px-1.5',
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                    {user?.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  {!isCollapsed && (
                    <motion.span
                      className="hidden md:block text-sm font-medium max-w-[150px] truncate"
                      animate={{ opacity: isCollapsed ? 0 : 1 }}
                    >
                      {user?.name || user?.email}
                    </motion.span>
                  )}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 hidden md:block transition-transform',
                      isCollapsed && 'rotate-0',
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <User className="h-4 w-4" />
                  {t('navigation.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  {t('navigation.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>
    </AnimatePresence>
  )
}

/**
 * Spacer component to account for fixed header height
 * Use this below the CollapsingHeader to prevent content from being hidden
 */
export function CollapsingHeaderSpacer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // Base height matches full header height (h-16 = 64px)
        'h-16',
        // Additional safety padding on mobile for potential notches
        'pt-safe-top',
        className,
      )}
      aria-hidden="true"
    />
  )
}

export default CollapsingHeader
