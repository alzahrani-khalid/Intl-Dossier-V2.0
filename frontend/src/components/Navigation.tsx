import { useMemo, type ComponentType, type SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Globe2,
  Building2,
  FileText,
  CalendarDays,
  Brain,
  Database,
  Bell,
  LogOut,
  ChevronDown,
  CheckSquare,
  Inbox,
  Clock,
  Users,
} from 'lucide-react'
import { LanguageToggle } from './LanguageToggle'
import { ThemeSelector } from './theme-selector/theme-selector'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useAuth } from '../contexts/auth.context'
import { useUIStore } from '../store/uiStore'
import { useWorkQueueCounts } from '../hooks/useWorkQueueCounts'
import { cn } from '../lib/utils'

interface NavigationItem {
  id: string
  label: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badgeCount?: number
}

export function Navigation() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount } = useUIStore()

  // Fetch work queue counts (FR-034)
  const { data: workQueueCounts } = useWorkQueueCounts()

  // Use fetched counts or default to 0
  const counts = workQueueCounts || { assignments: 0, intake: 0, waiting: 0 }

  // Work-Queue-First Navigation (FR-032 to FR-038)
  const workItems = useMemo<NavigationItem[]>(
    () => [
      {
        id: 'my-assignments',
        label: t('navigation.myAssignments', 'My Assignments'),
        path: '/my-work/assignments',
        icon: CheckSquare,
        badgeCount: counts.assignments,
      },
      {
        id: 'intake-queue',
        label: t('navigation.intakeQueue', 'Intake Queue'),
        path: '/my-work/intake',
        icon: Inbox,
        badgeCount: counts.intake,
      },
      {
        id: 'waiting-queue',
        label: t('navigation.waitingQueue', 'Waiting Queue'),
        path: '/my-work/waiting',
        icon: Clock,
        badgeCount: counts.waiting,
      },
    ],
    [t, counts.assignments, counts.intake, counts.waiting]
  )

  // Standard navigation items
  const browseItems = useMemo<NavigationItem[]>(
    () => [
      { id: 'dashboard', label: t('navigation.dashboard', 'Dashboard'), path: '/dashboard', icon: LayoutDashboard },
      { id: 'countries', label: t('navigation.countries', 'Countries'), path: '/countries', icon: Globe2 },
      { id: 'organizations', label: t('navigation.organizations', 'Organizations'), path: '/organizations', icon: Building2 },
      { id: 'forums', label: t('navigation.forums', 'Forums'), path: '/forums', icon: Users },
      { id: 'mous', label: t('navigation.mous', 'MoUs'), path: '/mous', icon: FileText },
      { id: 'calendar', label: t('navigation.calendar', 'Calendar'), path: '/calendar', icon: CalendarDays },
      { id: 'intelligence', label: t('navigation.intelligence', 'Intelligence'), path: '/intelligence', icon: Brain },
      { id: 'data-library', label: t('navigation.dataLibrary', 'Data Library'), path: '/data-library', icon: Database },
    ],
    [t]
  )

  const activePath = location.pathname

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

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-card backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <span>GASTAT Dossier</span>
          </Link>
          <div className="hidden lg:flex items-center gap-1 ps-6">
            {/* Work Queue Section - Priority (FR-033) */}
            {workItems.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 && (
                    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Divider */}
            <div className="mx-2 h-6 w-px bg-border" />

            {/* Browse Section */}
            {browseItems.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSelector />
          <LanguageToggle compact />
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t('navigation.openNotifications', 'Open notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {userInitials}
                </span>
                <span className="hidden sm:inline-flex flex-col items-start text-start">
                  <span className="text-sm font-medium text-foreground">{user?.name ?? user?.email}</span>
                  <span className="text-xs text-muted-foreground">{user?.role ?? 'Administrator'}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onSelect={() => navigate({ to: '/settings' })}>
                {t('navigation.settings', 'Settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="me-2 h-4 w-4" />
                {t('common.logout', 'Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation - Work-Queue-First (FR-033) */}
      <div className="lg:hidden px-4 pb-3 space-y-3">
        {/* Work Queue Section - Priority on Mobile */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {t('navigation.myWork', 'My Work')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {workItems.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)
              return (
                <Link
                  key={`mobile-${item.id}`}
                  to={item.path}
                  className={cn(
                    'relative flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-h-11',
                    isActive
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 && (
                    <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Browse Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {t('navigation.browse', 'Browse')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {browseItems.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)
              return (
                <Link
                  key={`mobile-${item.id}`}
                  to={item.path}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-h-11',
                    isActive
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
