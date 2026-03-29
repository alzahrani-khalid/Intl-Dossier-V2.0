import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { LogOut, Settings, User } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { useDirection } from '@/hooks/useDirection'

/**
 * NavUser — compact header-friendly user menu.
 * Shows avatar + truncated name in sidebar header.
 * Dropdown provides Profile, Settings, and Sign Out.
 */
export function NavUser(): React.ReactElement | null {
  const { t } = useTranslation('common')
  const { isRTL } = useDirection()
  const { user, logout } = useAuth()
  const { isMobile } = useSidebar()

  if (user == null) return null

  const initials = (user.name ?? user.email ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-sidebar-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Avatar className="size-7 rounded-md shrink-0">
            {user.avatar != null && user.avatar !== '' && (
              <AvatarImage src={user.avatar} alt={user.name ?? ''} />
            )}
            <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side={isMobile ? 'bottom' : isRTL ? 'left' : 'right'}
        align="start"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-start text-sm">
            <Avatar className="size-8 rounded-md">
              {user.avatar != null && user.avatar !== '' && (
                <AvatarImage src={user.avatar} alt={user.name ?? ''} />
              )}
              <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{user.name ?? user.email}</span>
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
        <DropdownMenuItem onClick={() => logout()} className="gap-2">
          <LogOut className="size-4" />
          {t('navigation.logout', 'Logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
