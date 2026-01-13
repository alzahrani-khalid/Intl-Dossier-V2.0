import React from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { ThemeSelector } from '../theme-selector/theme-selector'
import { LanguageToggle } from '../LanguageToggle'
import { NotificationPanel } from '../notifications'
import { useOptionalKeyboardShortcutContext } from '../KeyboardShortcuts'

export function Header() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const keyboardContext = useOptionalKeyboardShortcutContext()
  const isRTL = i18n.language === 'ar'

  // Platform-aware keyboard shortcut display
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  const cmdKey = isMac ? '⌘' : 'Ctrl+'

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

          {/* Search bar with keyboard shortcut hint */}
          <button
            onClick={() => keyboardContext?.openCommandPalette()}
            className="hidden md:flex relative w-80 items-center gap-2 ps-10 pe-3 py-2 rounded-lg bg-muted border-0 hover:bg-accent/50 transition-colors text-muted-foreground"
            aria-label={t('keyboard-shortcuts:quickActions.title', 'Quick Actions')}
          >
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <span className="flex-1 text-start text-sm">{t('search.searchPlaceholder')}</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium">
              {cmdKey}K
            </kbd>
          </button>

          {/* Mobile search button */}
          <button
            onClick={() => keyboardContext?.openCommandPalette()}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label={t('keyboard-shortcuts:quickActions.title', 'Quick Actions')}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme selector */}
          <ThemeSelector />

          {/* Language toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <NotificationPanel />

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
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
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
