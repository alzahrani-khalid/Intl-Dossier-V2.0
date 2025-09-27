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
} from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useAuth } from '../contexts/auth.context'
import { useUIStore } from '../store/uiStore'
import { cn } from '../lib/utils'

interface NavigationItem {
  id: string
  label: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export function Navigation() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount } = useUIStore()

  const items = useMemo<NavigationItem[]>(
    () => [
      { id: 'dashboard', label: t('navigation.dashboard', 'Dashboard'), path: '/dashboard', icon: LayoutDashboard },
      { id: 'countries', label: t('navigation.countries', 'Countries'), path: '/countries', icon: Globe2 },
      { id: 'organizations', label: t('navigation.organizations', 'Organizations'), path: '/organizations', icon: Building2 },
      { id: 'mous', label: t('navigation.mous', 'MoUs'), path: '/mous', icon: FileText },
      { id: 'events', label: t('navigation.events', 'Events'), path: '/events', icon: CalendarDays },
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
    <nav className="sticky top-0 z-30 border-b border-base-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-base-700 dark:bg-base-900/80">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold text-primary-700 dark:text-primary-300"
          >
            <span>GASTAT Dossier</span>
          </Link>
          <div className="hidden lg:flex items-center gap-1 ps-6">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                      : 'text-base-600 hover:bg-base-100 dark:text-base-300 dark:hover:bg-base-800'
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
          <LanguageSwitcher compact />
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t('navigation.openNotifications', 'Open notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                  {userInitials}
                </span>
                <span className="hidden sm:inline-flex flex-col items-start text-start">
                  <span className="text-sm font-medium text-base-800 dark:text-base-100">{user?.name ?? user?.email}</span>
                  <span className="text-xs text-base-500 dark:text-base-400">{user?.role ?? 'Administrator'}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-base-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onSelect={() => navigate({ to: '/settings' })}>
                {t('navigation.settings', 'Settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t('common.logout', 'Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-3 lg:hidden">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)
          return (
            <Link
              key={`mobile-${item.id}`}
              to={item.path}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-base-200 text-base-600 hover:border-primary-400 hover:text-primary-600'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
