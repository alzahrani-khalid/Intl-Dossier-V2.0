import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { ThemeSelector } from '../theme-selector/theme-selector'
import { LanguageToggle } from '../LanguageToggle'

export function Header() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const {
    toggleSidebar,
    notifications: _notifications,
    unreadCount,
  } = useUIStore()
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    // Navigate to login page - will be handled by router guard
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar */}
          <div className="relative hidden md:block">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search.searchPlaceholder')}
              className="w-80 ps-10 pe-4 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme selector */}
          <ThemeSelector />

          {/* Language toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user?.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.name || user?.email}
              </span>
              <ChevronDown className="h-4 w-4 hidden md:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute end-0 mt-2 w-56 rounded-lg bg-popover shadow-lg border border-border">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <button className="w-full px-4 py-2 text-start hover:bg-accent flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('navigation.profile')}
                </button>
                <button className="w-full px-4 py-2 text-start hover:bg-accent flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('navigation.settings')}
                </button>
                <div className="border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-start hover:bg-accent flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}