import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Home,
  Globe2,
  Building2,
  Users,
  FileText,
  Calendar,
  ScrollText,
  Brain,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  Plus,
  User,
  LogOut,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  path: string
  badge?: number
}

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { isSidebarOpen } = useUIStore()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      navigate({ to: '/login' })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: Home,
      path: '/',
    },
    {
      id: 'countries',
      label: t('navigation.countries'),
      icon: Globe2,
      path: '/countries',
    },
    {
      id: 'organizations',
      label: t('navigation.organizations'),
      icon: Building2,
      path: '/organizations',
    },
    {
      id: 'forums',
      label: t('navigation.forums'),
      icon: Users,
      path: '/forums',
    },
    {
      id: 'mous',
      label: t('navigation.mous'),
      icon: FileText,
      path: '/mous',
    },
    {
      id: 'events',
      label: t('navigation.events'),
      icon: Calendar,
      path: '/events',
    },
    {
      id: 'briefs',
      label: t('navigation.briefs'),
      icon: ScrollText,
      path: '/briefs',
    },
    {
      id: 'intelligence',
      label: t('navigation.intelligence'),
      icon: Brain,
      path: '/intelligence',
    },
    {
      id: 'reports',
      label: t('navigation.reports'),
      icon: BarChart3,
      path: '/reports',
    },
  ]

  const documentItems: NavItem[] = [
    {
      id: 'data-library',
      label: 'Data Library',
      icon: FileText,
      path: '/data-library',
    },
    {
      id: 'word-assistant',
      label: 'Word Assistant',
      icon: FileText,
      path: '/word-assistant',
    },
  ]

  const bottomNavItems: NavItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
    {
      id: 'help',
      label: 'Get Help',
      icon: HelpCircle,
      path: '/help',
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      path: '/search',
    },
  ]

  if (!isSidebarOpen) return null

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-base-900 lg:flex">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900">Acme Inc.</span>
        </div>
        
        <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium mb-6">
          <Plus className="h-4 w-4" />
          Quick Create
        </button>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Documents
          </h3>
          <ul className="space-y-1">
            {documentItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-full transition-colors mt-1">
            <Plus className="h-4 w-4" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-gray-500 text-xs">{user?.email || 'user@gastat.gov.sa'}</p>
            </div>
            <button 
              aria-label="User menu"
              className="p-1 hover:bg-gray-200 rounded"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
