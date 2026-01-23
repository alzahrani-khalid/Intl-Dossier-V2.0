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
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 transition-colors hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-5" />
          </button>

          {/* Search bar with keyboard shortcut hint */}
          <button
            onClick={() => keyboardContext?.openCommandPalette()}
            className="relative hidden w-80 items-center gap-2 rounded-lg border-0 bg-muted py-2 pe-3 ps-10 text-muted-foreground transition-colors hover:bg-accent/50 md:flex"
            aria-label={t('keyboard-shortcuts:quickActions.title', 'Quick Actions')}
          >
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2" />
            <span className="flex-1 text-start text-sm">{t('search.searchPlaceholder')}</span>
            <kbd className="hidden items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium lg:inline-flex">
              {cmdKey}K
            </kbd>
          </button>

          {/* Mobile search button */}
          <button
            onClick={() => keyboardContext?.openCommandPalette()}
            className="rounded-lg p-2 transition-colors hover:bg-accent md:hidden"
            aria-label={t('keyboard-shortcuts:quickActions.title', 'Quick Actions')}
          >
            <Search className="size-5" />
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
              className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.name ? user.name[0].toUpperCase() : <User className="size-4" />}
              </div>
              <span className="hidden text-sm font-medium md:block">
                {user?.name || user?.email}
              </span>
              <ChevronDown className="hidden size-4 md:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute end-0 mt-2 w-56 rounded-lg border border-border bg-popover shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-start hover:bg-accent">
                  <User className="size-4" />
                  {t('navigation.profile')}
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-start hover:bg-accent">
                  <Settings className="size-4" />
                  {t('navigation.settings')}
                </button>
                <div className="border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-start text-destructive hover:bg-accent"
                  >
                    <LogOut className="size-4" />
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
