import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { LogOut, Settings, User } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useResponsive } from '@/hooks/useResponsive'
import { useDirection } from '@/hooks/useDirection'

function getInitials(name: string | undefined, email: string | undefined): string {
  const source = (name ?? email ?? '').trim()
  if (source.length === 0) return '·'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

/**
 * NavUser — the sidebar user card, as an interactive menu (Phase 92, AUTH-01/D-01).
 *
 * The trigger keeps the visual identity of the static card it replaced
 * (`Sidebar.tsx` §2): accent initials disc, two-line name + role, `--radius-sm`
 * wash on `--sidebar-bg`. The dropdown provides Profile, Settings, and Sign out.
 *
 * `isMobile` comes from `useResponsive`, NOT the shadcn sidebar-context hook (D-23):
 * `SidebarProvider` renders nowhere in this app, so that hook would throw. Both expose
 * the same `isMobile` field. The mobile branch of `side` is genuinely reachable — the
 * same `<Sidebar />` renders in the desktop column AND the AppShell mobile drawer.
 */
export function NavUser(): React.ReactElement | null {
  const { t, i18n } = useTranslation('common')
  const { isRTL } = useDirection()
  const { user, logout } = useAuth()
  const { isMobile } = useResponsive()

  if (user == null) return null

  const initials = getInitials(user.name, user.email)
  const displayName = user.name ?? user.email ?? t('shell.user.noRole')
  const localizedJobTitle = i18n.language === 'ar' ? user.jobTitleAr : user.jobTitleEn
  const roleLabel = localizedJobTitle ?? user.role ?? t('shell.user.noRole')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="user-menu"
          className="sb-user flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--sidebar-ink)_6%,transparent)] p-2 text-start transition-colors hover:bg-[color-mix(in_srgb,var(--sidebar-ink)_10%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] font-body text-[11px] font-semibold">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-body text-[13px] font-medium leading-[1.4] truncate">
              {displayName}
            </span>
            <span className="font-body text-[10.5px] leading-[1.3] truncate text-[var(--sidebar-ink)]/70">
              {roleLabel}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        side={isMobile ? 'bottom' : isRTL ? 'left' : 'right'}
        align="start"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-start text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] font-body text-[11px] font-semibold">
              {initials}
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="gap-2">
            <User className="size-4" />
            {t('navigation.profile', 'Profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="gap-2">
            <Settings className="size-4" />
            {t('navigation.settings', 'Settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Plain ink, NOT danger (UI-SPEC Surface 1): signing out ends a session, it
            does not destroy data. Label is `common.logout` with no inline default —
            the key exists in both locales, and the rendered value in EN and AR must
            keep matching the e2e accessible-name regex
            /sign out|logout|تسجيل الخروج|خروج/i (D-27). */}
        <DropdownMenuItem onClick={() => logout()} className="gap-2">
          <LogOut className="size-4" />
          {t('common:logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
