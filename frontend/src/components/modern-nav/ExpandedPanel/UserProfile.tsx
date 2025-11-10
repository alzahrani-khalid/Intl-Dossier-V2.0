import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface UserProfileProps {
 /** User's display name */
 name?: string;
 /** User's email address */
 email?: string;
 /** Avatar image URL */
 avatarUrl?: string;
 /** Custom class name */
 className?: string;
 /** Callback for logout */
 onLogout?: () => void;
 /** Callback for settings */
 onSettings?: () => void;
 /** Callback for profile */
 onProfile?: () => void;
}

/**
 * UserProfile Component
 *
 * Displays user information in the expanded panel
 * with dropdown menu for account actions
 *
 * Features:
 * - Avatar (32x32px)
 * - Name and email display
 * - Dropdown menu
 * - RTL support
 *
 * @example
 * ```tsx
 * <UserProfile
 * name="John Doe"
 * email="customerpop@gmail.com"
 * onLogout={handleLogout}
 * />
 * ```
 */
export function UserProfile({
 name = 'John Doe',
 email = 'customerpop@gmail.com',
 avatarUrl,
 className,
 onLogout,
 onSettings,
 onProfile,
}: UserProfileProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 // Generate initials from name
 const getInitials = (name: string) => {
 return name
 .split(' ')
 .map((part) => part[0])
 .join('')
 .toUpperCase()
 .slice(0, 2);
 };

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 className={cn(
 // Layout
 'flex w-full items-center gap-3 px-4 py-3',

 // Border
 'border-b border-panel-border',

 // Background & hover
 'bg-panel hover:bg-panel-hover',

 // Transition
 'transition-colors duration-150',

 // Focus
 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icon-rail-active-indicator',

 // Custom classes
 className
 )}
 aria-label={t('navigation.userMenu', 'User menu')}
 >
 {/* Avatar */}
 <Avatar className="h-8 w-8 shrink-0">
 <AvatarImage src={avatarUrl} alt={name} />
 <AvatarFallback className="bg-icon-rail-active-indicator text-white text-xs font-semibold">
 {avatarUrl ? null : getInitials(name)}
 </AvatarFallback>
 </Avatar>

 {/* User Info */}
 <div className="flex-1 min-w-0 text-start">
 <p className="text-sm font-semibold text-panel-text truncate">
 {name}
 </p>
 <p className="text-xs text-panel-text-muted truncate">
 {email}
 </p>
 </div>

 {/* Dropdown Indicator */}
 <ChevronDown
 className={cn(
 'h-4 w-4 shrink-0 text-panel-text-muted transition-transform',
 isRTL && 'rotate-180'
 )}
 aria-hidden="true"
 />
 </button>
 </DropdownMenuTrigger>

 <DropdownMenuContent
 align={isRTL ? 'end' : 'start'}
 sideOffset={4}
 className="w-56"
 >
 <DropdownMenuLabel className="font-normal">
 <div className="flex flex-col space-y-1">
 <p className="text-sm font-medium leading-none">{name}</p>
 <p className="text-xs leading-none text-muted-foreground">
 {email}
 </p>
 </div>
 </DropdownMenuLabel>

 <DropdownMenuSeparator />

 {onProfile && (
 <DropdownMenuItem onClick={onProfile}>
 <User className="me-2 h-4 w-4" />
 <span>{t('navigation.profile', 'Profile')}</span>
 </DropdownMenuItem>
 )}

 {onSettings && (
 <DropdownMenuItem onClick={onSettings}>
 <User className="me-2 h-4 w-4" />
 <span>{t('navigation.settings', 'Settings')}</span>
 </DropdownMenuItem>
 )}

 <DropdownMenuSeparator />

 {onLogout && (
 <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
 <User className="me-2 h-4 w-4" />
 <span>{t('navigation.logout', 'Logout')}</span>
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 );
}

UserProfile.displayName = 'UserProfile';
