/**
 * ActionBar Component
 * Phase 10: Operations Hub Dashboard
 *
 * Header bar with time-of-day greeting, current date,
 * action buttons (New Engagement, New Request, Cmd+K),
 * and RoleSwitcher dropdown.
 *
 * Desktop (md+): sticky top with backdrop blur per D-08.
 * Mobile: scrolls with page.
 */

import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Plus, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useWorkCreation } from '@/components/work-creation/WorkCreationProvider'
import { RoleSwitcher } from './RoleSwitcher'
import type { DashboardRole } from '@/domains/operations-hub/types/operations-hub.types'

interface ActionBarProps {
  role: DashboardRole
  onRoleChange: (role: DashboardRole) => void
}

/**
 * Returns the appropriate greeting key based on time of day.
 */
function getGreetingKey(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 11) return 'greeting.morning'
  if (hour >= 12 && hour <= 16) return 'greeting.afternoon'
  return 'greeting.evening'
}

// DEBT-01 / OPS-07 verified 2026-04-08:
// This ActionBar intentionally contains NO TanStack Router navigate() calls.
// - New Engagement / New Request open the WorkCreation palette (modal) via useWorkCreation().openPalette(...).
// - Cmd+K dispatches a synthetic KeyboardEvent consumed by the global listener in CommandPalette.tsx.
// Do not "modernize" these to navigate({ to, params }) — they are not navigations.
export function ActionBar({ role, onRoleChange }: ActionBarProps): React.ReactElement {
  const { t, i18n } = useTranslation('operations-hub')
  const isRTL = i18n.language === 'ar'
  const displayName = useAuthStore((s) => s.user?.name)
  const { openPalette } = useWorkCreation()

  const greetingText =
    displayName != null && displayName !== ''
      ? `${t(getGreetingKey())}, ${displayName}`
      : t(getGreetingKey())

  const dateLocale = isRTL ? ar : enUS
  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy', { locale: dateLocale })

  const handleCmdK = (): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="col-span-full md:sticky md:top-0 md:z-10 md:backdrop-blur md:py-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-4 md:py-0">
        {/* Greeting + Date */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-normal text-foreground">{greetingText}</h1>
          <p className="text-sm font-normal text-muted-foreground">{formattedDate}</p>
        </div>

        {/* Actions + Role Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="default"
            className="min-h-11 gap-2"
            onClick={() => openPalette('commitment')}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t('actions.new_engagement')}</span>
          </Button>
          <Button
            variant="outline"
            className="min-h-11 gap-2"
            onClick={() => openPalette('intake')}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t('actions.new_request')}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 gap-1 px-3"
            onClick={handleCmdK}
            aria-label="Command palette"
          >
            <Command className="size-3.5" />
            <span className="text-xs text-muted-foreground">K</span>
          </Button>
          <RoleSwitcher role={role} onChange={onRoleChange} />
        </div>
      </div>
    </div>
  )
}
