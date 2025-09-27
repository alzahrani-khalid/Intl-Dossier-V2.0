import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  Bell,
  Search,
  User,
  Globe,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { switchLanguage } from '../../i18n'

export function Header() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const {
    toggleSidebar,
    notifications: _notifications,
    unreadCount,
    language,
    setLanguage,
  } = useUIStore()
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const [langMenuOpen, setLangMenuOpen] = React.useState(false)

  const handleLanguageChange = async (lang: 'en' | 'ar') => {
    await switchLanguage(lang)
    setLanguage(lang)
    setLangMenuOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    // Navigate to login page - will be handled by router guard
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar */}
          <div className="relative hidden md:block">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search.searchPlaceholder')}
              className="w-80 ps-10 pe-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">
                {language === 'ar' ? 'العربية' : 'English'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {langMenuOpen && (
              <div className="absolute end-0 mt-2 w-40 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full px-4 py-2 text-start hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    language === 'en' ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={`w-full px-4 py-2 text-start hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    language === 'ar' ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  العربية
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                {user?.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.name || user?.email}
              </span>
              <ChevronDown className="h-4 w-4 hidden md:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute end-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <button className="w-full px-4 py-2 text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('navigation.profile')}
                </button>
                <button className="w-full px-4 py-2 text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('navigation.settings')}
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-start hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
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