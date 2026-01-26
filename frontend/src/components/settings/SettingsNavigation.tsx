import { useTranslation } from 'react-i18next'
import {
  User,
  Settings2,
  Palette,
  Bell,
  Mail,
  Plug,
  Accessibility,
  Shield,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingsSectionId } from '@/types/settings.types'
import { FloatingDock } from '@/components/ui/floating-dock'

interface SettingsNavigationProps {
  /** Currently active section */
  activeSection: SettingsSectionId
  /** Callback when section changes */
  onSectionChange: (section: SettingsSectionId) => void
  /** Variant: sidebar for desktop, dock for mobile */
  variant?: 'sidebar' | 'dock'
}

interface NavItem {
  id: SettingsSectionId
  labelKey: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { id: 'profile', labelKey: 'navigation.profile', icon: User },
  { id: 'general', labelKey: 'navigation.general', icon: Settings2 },
  { id: 'appearance', labelKey: 'navigation.appearance', icon: Palette },
  { id: 'notifications', labelKey: 'navigation.notifications', icon: Bell },
  { id: 'email-digest', labelKey: 'navigation.emailDigest', icon: Mail },
  { id: 'integrations', labelKey: 'navigation.integrations', icon: Plug },
  { id: 'accessibility', labelKey: 'navigation.accessibility', icon: Accessibility },
  { id: 'data-privacy', labelKey: 'navigation.dataPrivacy', icon: Shield },
  { id: 'security', labelKey: 'navigation.security', icon: Lock },
]

/**
 * Desktop sidebar navigation for settings
 */
export function SettingsNavigation({
  activeSection,
  onSectionChange,
  variant = 'sidebar',
}: SettingsNavigationProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  if (variant === 'dock') {
    return <SettingsMobileNav activeSection={activeSection} onSectionChange={onSectionChange} />
  }

  return (
    <nav
      className="space-y-1"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="navigation"
      aria-label={t('pageTitle')}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeSection === item.id

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'w-full flex items-center justify-between',
              'min-h-11 px-3 py-2.5 rounded-lg',
              'text-sm font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </span>
            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 opacity-50',
                isRTL && 'rotate-180',
                isActive && 'opacity-100',
              )}
            />
          </button>
        )
      })}
    </nav>
  )
}

/**
 * Mobile bottom navigation using FloatingDock
 */
function SettingsMobileNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: SettingsSectionId
  onSectionChange: (section: SettingsSectionId) => void
}) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  // Show only the most important items in mobile dock
  const mobileItems: NavItem[] = [
    { id: 'profile', labelKey: 'navigation.profile', icon: User },
    { id: 'general', labelKey: 'navigation.general', icon: Settings2 },
    { id: 'notifications', labelKey: 'navigation.notifications', icon: Bell },
    { id: 'accessibility', labelKey: 'navigation.accessibility', icon: Accessibility },
    { id: 'security', labelKey: 'navigation.security', icon: Lock },
  ]

  const dockItems = mobileItems.map((item) => ({
    title: t(item.labelKey),
    icon: (
      <item.icon
        className={cn(
          'h-full w-full',
          activeSection === item.id ? 'text-primary' : 'text-muted-foreground',
        )}
      />
    ),
    href: '#',
    onClick: () => onSectionChange(item.id),
  }))

  return (
    <div className="fixed bottom-0 start-0 end-0 z-50 pb-safe" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-background/95 backdrop-blur-sm border-t">
        <FloatingDock
          items={dockItems}
          desktopClassName="hidden"
          mobileClassName="flex justify-around items-center py-2 px-4"
        />
      </div>
    </div>
  )
}

/**
 * Settings navigation tabs for mobile (alternative to dock)
 */
export function SettingsTabs({
  activeSection,
  onSectionChange,
}: {
  activeSection: SettingsSectionId
  onSectionChange: (section: SettingsSectionId) => void
}) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex gap-2 pb-2 min-w-max">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'text-sm font-medium whitespace-nowrap',
                'transition-colors duration-150',
                'min-h-10',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { NAV_ITEMS }
