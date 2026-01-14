import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { LogOut, User, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { IconArrowNarrowLeft } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth.context'
import { useWorkQueueCounts } from '@/hooks/useWorkQueueCounts'
import { useIsMobile } from '@/hooks/use-mobile'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeSelector } from '@/components/theme-selector/theme-selector'
import { NotificationPanel } from '@/components/Notifications'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  createNavigationSections,
  bottomNavigationItems,
  type NavigationItem,
  type NavigationSection,
} from './navigation-config'

interface ProCollapsibleSidebarProps {
  className?: string
  onLinkClick?: () => void // Callback for mobile to close Sheet after navigation
  isInSheet?: boolean // Whether sidebar is rendered inside a mobile Sheet
}

export function ProCollapsibleSidebar({
  className,
  onLinkClick,
  isInSheet = false,
}: ProCollapsibleSidebarProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const isRTL = i18n.language === 'ar'

  // Collapsible state (start expanded on desktop, always expanded in Sheet)
  const [isOpen, setIsOpen] = useState(true)

  // When in Sheet, always show as expanded
  const effectiveIsOpen = isInSheet ? true : isOpen

  // Fetch work queue counts
  const { data: workQueueCounts, isLoading: isLoadingCounts } = useWorkQueueCounts()
  const counts = workQueueCounts || { assignments: 0, intake: 0, waiting: 0 }

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Generate navigation sections
  const navigationSections = useMemo(
    () => createNavigationSections(counts, isAdmin),
    [counts, isAdmin],
  )

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  const userInitials = useMemo(() => {
    if (!user?.name && !user?.email) return 'GA'
    const source = user.name ?? user.email ?? 'User'
    return source
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }, [user])

  // SidebarLink with animations
  interface SidebarLinkProps {
    item: NavigationItem
    isActive: boolean
    isRTL: boolean
  }

  function SidebarLink({ item, isActive, isRTL }: SidebarLinkProps) {
    const Icon = item.icon
    const labelText = t(item.label, item.label)

    const linkContent = (
      <Link
        to={item.path}
        onClick={onLinkClick} // Close mobile sheet after navigation
        className="group/link relative block"
      >
        {/* Hover background animation */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="active-sidebar-link"
              className="absolute inset-0 bg-sidebar-accent rounded-lg z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Link content - Mobile-first with proper touch targets */}
        <div
          className={cn(
            'relative z-20 flex items-center',
            // Mobile-first: proper touch targets and spacing
            'gap-2 px-3 py-3 sm:gap-3 sm:py-2.5 md:py-2',
            'min-h-11 sm:min-h-10', // WCAG AA touch target minimum
            'rounded-lg',
            'text-sidebar-foreground transition-all duration-150',
            'group-hover/link:bg-sidebar-accent/50',
            isActive && 'font-medium text-sidebar-accent-foreground',
          )}
        >
          <Icon
            className={cn(
              // Mobile-first icon sizing
              'h-5 w-5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-150',
              'group-hover/link:translate-x-1',
              isRTL && 'group-hover/link:-translate-x-1',
            )}
          />
          <motion.span
            className="text-sm whitespace-pre"
            animate={{
              display: effectiveIsOpen ? 'inline-block' : 'none',
              opacity: effectiveIsOpen ? 1 : 0,
            }}
            transition={{ duration: 0.15 }}
          >
            {labelText}
          </motion.span>

          {/* Badge for work queue counts */}
          {item.badgeCount !== undefined && item.badgeCount > 0 && effectiveIsOpen && (
            <motion.div
              className={cn(
                'ms-auto flex h-5 min-w-5 items-center justify-center',
                'rounded-md px-1 bg-primary text-primary-foreground',
                'text-xs font-medium tabular-nums',
              )}
              animate={{
                display: effectiveIsOpen ? 'flex' : 'none',
                opacity: effectiveIsOpen ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
            >
              {item.badgeCount > 99 ? '99+' : item.badgeCount}
            </motion.div>
          )}
        </div>
      </Link>
    )

    // Show tooltip when sidebar is collapsed
    if (!effectiveIsOpen) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'} className="flex items-center gap-2">
            {labelText}
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-md px-1 bg-primary text-primary-foreground text-xs font-medium">
                {item.badgeCount > 99 ? '99+' : item.badgeCount}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        className={cn(
          // Mobile-first: sidebar is always full-width in Sheet, collapsible on desktop
          'group/sidebar-btn relative flex flex-col h-screen flex-shrink-0',
          'bg-sidebar text-sidebar-foreground',
          // Only show border on desktop (not in mobile Sheet) - use logical property for RTL
          !isInSheet && 'border-e border-sidebar-border',
          className,
        )}
        // Only animate width on desktop (md:768px+), on mobile it's always full width in Sheet
        animate={{ width: isMobile || isInSheet ? '100%' : effectiveIsOpen ? '300px' : '70px' }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Collapse/Expand Toggle Button - Desktop only with proper touch target */}
        {!isInSheet && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              // RTL-compatible positioning - always use -end-3 (logical property)
              // In LTR: end = right (button on right edge of left sidebar)
              // In RTL: end = left (button on left edge of right sidebar)
              'absolute top-[20px] z-40 -end-3',
              // Touch-friendly size (44x44px minimum)
              'min-h-11 min-w-11 flex items-center justify-center',
              'rounded-md border-2 border-sidebar-border bg-sidebar shadow-md',
              'transition duration-200',
              'hover:bg-sidebar-accent hover:border-sidebar-accent-foreground/20',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              // Only show on desktop, hide on mobile
              'hidden md:flex',
              // Show on hover for desktop
              'md:opacity-0 md:group-hover/sidebar-btn:opacity-100',
              // Rotation based on state and RTL
              isOpen ? (isRTL ? 'rotate-180' : 'rotate-0') : isRTL ? 'rotate-0' : 'rotate-180',
            )}
            aria-label={
              isOpen
                ? t('sidebar.collapse', 'Collapse sidebar')
                : t('sidebar.expand', 'Expand sidebar')
            }
          >
            <IconArrowNarrowLeft className="h-5 w-5 sm:h-4 sm:w-4 text-sidebar-foreground/80 hover:text-sidebar-foreground" />
          </button>
        )}

        {/* Header */}
        <div className="px-4 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">G</span>
            </div>
            <motion.div
              className="grid flex-1 text-start text-sm leading-tight"
              animate={{
                display: effectiveIsOpen ? 'grid' : 'none',
                opacity: effectiveIsOpen ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="truncate font-semibold">GASTAT Dossier</span>
              <span className="truncate text-xs text-muted-foreground">
                {t('common.internationalRelations', 'International Relations')}
              </span>
            </motion.div>
          </Link>
        </div>

        {/* Navigation Content - Mobile-first spacing */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4">
          {navigationSections.map((section) => (
            <div key={section.id} className="mb-4 sm:mb-6">
              {effectiveIsOpen && (
                <h3 className="px-2 mb-2 sm:mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t(section.label, section.label)}
                </h3>
              )}
              <div className="space-y-1 sm:space-y-1">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.id}
                    item={item}
                    isActive={
                      location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
                    }
                    isRTL={isRTL}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          {/* Settings & Help */}
          <div className="space-y-1 mb-4">
            {bottomNavigationItems.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                isActive={location.pathname === item.path}
                isRTL={isRTL}
              />
            ))}
          </div>

          {/* Theme, Language & Notifications Controls */}
          {effectiveIsOpen && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <LanguageToggle compact />
              <ThemeSelector />
              <NotificationPanel />
            </div>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm font-bold">{userInitials}</span>
            </div>
            {effectiveIsOpen && (
              <>
                <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    {user?.name ?? user?.email}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.role ?? t('common.administrator', 'Administrator')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(
                    'rounded-md p-1.5 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-all',
                    'hover:scale-105 active:scale-95',
                    isRTL && 'me-auto ms-0',
                  )}
                  aria-label={t('common.logout', 'Sign out')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}

// Mobile wrapper component with Sheet
export function ProCollapsibleSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  const isRTL = i18n.language === 'ar'

  // Close mobile menu after navigation
  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Menu Trigger & Sheet (< 768px) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        {/* Mobile Menu Button - Fixed position on mobile only */}
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              // Show only on mobile
              'fixed top-4 z-50',
              isRTL ? 'right-4' : 'left-4',
              'md:hidden', // Hide on desktop (sidebar is always visible)
              // Touch-friendly size
              'min-h-11 min-w-11',
              'bg-sidebar border border-sidebar-border shadow-lg',
              'hover:bg-sidebar-accent',
            )}
            aria-label={t('sidebar.openMenu', 'Open menu')}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        {/* Mobile Sheet Content */}
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-[300px] p-0 bg-sidebar border-sidebar-border"
        >
          {/* Accessibility: Required for screen readers, visually hidden */}
          <SheetHeader className="sr-only">
            <SheetTitle>{t('sidebar.title', 'Navigation Menu')}</SheetTitle>
            <SheetDescription>
              {t('sidebar.description', 'Main navigation menu for the application')}
            </SheetDescription>
          </SheetHeader>
          <ProCollapsibleSidebar onLinkClick={handleLinkClick} isInSheet={true} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar (≥ 768px) */}
      <ProCollapsibleSidebar className="hidden md:flex" />

      {/* Main Content */}
      {children}
    </>
  )
}

export default ProCollapsibleSidebarWrapper
