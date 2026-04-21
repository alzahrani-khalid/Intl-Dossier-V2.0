import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from '@tanstack/react-router'
import {
  HelpCircle,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Settings,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useResponsive } from '@/hooks/useResponsive'
import { useWorkQueueCounts } from '@/hooks/useWorkQueueCounts'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import { createNavigationGroups } from './navigation-config'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>): React.ReactElement {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'
  const { user } = useAuth()
  const { isTablet } = useResponsive()
  const location = useLocation()
  const { setOpenMobile, setOpen, toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const { data: workCounts } = useWorkQueueCounts()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Build navigation groups from config
  const groups = useMemo(
    () =>
      createNavigationGroups(
        {
          tasks: workCounts?.intake ?? 0,
          approvals: workCounts?.waiting ?? 0,
          engagements: 0,
        },
        isAdmin,
      ),
    [workCounts?.intake, workCounts?.waiting, isAdmin],
  )

  // Auto-close mobile sidebar on navigation (render-time adjustment)
  const prevPathnameRef = useRef(location.pathname)
  if (prevPathnameRef.current !== location.pathname) {
    prevPathnameRef.current = location.pathname
    setOpenMobile(false)
  }

  // Auto-collapse when viewport shrinks to tablet size
  useEffect(() => {
    if (isTablet) {
      setOpen(false)
    }
  }, [isTablet])

  const pathname = location.pathname
  const isExpanded = isMobile ? openMobile : open
  const SidebarToggleIcon = isRTL
    ? isExpanded
      ? PanelRightCloseIcon
      : PanelRightOpenIcon
    : isExpanded
      ? PanelLeftCloseIcon
      : PanelLeftOpenIcon
  const toggleLabel = isExpanded ? 'Collapse sidebar' : 'Expand sidebar'

  return (
    <Sidebar collapsible="icon" side="left" variant="inset" {...props}>
      {/* Logo / Brand + User Avatar (per D-05) */}
      <SidebarHeader className="relative pb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="GASTAT Dossier"
              className="h-10 hover:bg-[var(--primary)]/5 hover:text-foreground group-data-[collapsible=icon]:px-0!"
            >
              <Link to="/dashboard">
                <div className="bg-card text-foreground flex aspect-square size-8 items-center justify-center rounded-md border border-border">
                  <span className="text-sm font-bold">G</span>
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">GASTAT Dossier</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t('navigation.workspace', 'Workspace')}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User avatar in header (per D-05) */}
        <div className="mt-1 px-2">
          <NavUser />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute end-2 top-2 size-7 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          onClick={toggleSidebar}
          aria-label={toggleLabel}
          aria-expanded={isExpanded}
        >
          <SidebarToggleIcon className="size-4" />
          <span className="sr-only">{toggleLabel}</span>
        </Button>
      </SidebarHeader>

      {/* Main scrollable content */}
      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Main Navigation — 3 groups */}
          <NavMain groups={groups} />

          <SidebarSeparator />

          {/* Bottom items: Settings & Help */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings'}
                  tooltip={t('navigation.settings', 'Settings')}
                >
                  <Link to="/settings">
                    <Settings className="size-4" />
                    <span>{t('navigation.settings', 'Settings')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/help'}
                  tooltip={t('navigation.getHelp', 'Help')}
                >
                  <Link to="/help">
                    <HelpCircle className="size-4" />
                    <span>{t('navigation.getHelp', 'Help')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {/* Footer: UI-preference controls live in the Tweaks drawer (SiteHeader trigger). */}
      <SidebarRail />
    </Sidebar>
  )
}
