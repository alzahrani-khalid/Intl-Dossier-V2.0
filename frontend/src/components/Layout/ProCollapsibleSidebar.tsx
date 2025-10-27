import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth.context';
import { useWorkQueueCounts } from '@/hooks/useWorkQueueCounts';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeSelector } from '@/components/theme-selector/theme-selector';
import {
  createNavigationSections,
  bottomNavigationItems,
  type NavigationItem,
  type NavigationSection,
} from './navigation-config';

interface ProCollapsibleSidebarProps {
  className?: string;
}

export function ProCollapsibleSidebar({ className }: ProCollapsibleSidebarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isRTL = i18n.language === 'ar';

  // Fetch work queue counts
  const { data: workQueueCounts, isLoading: isLoadingCounts } = useWorkQueueCounts();
  const counts = workQueueCounts || { assignments: 0, intake: 0, waiting: 0 };

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Generate navigation sections
  const navigationSections = useMemo(
    () => createNavigationSections(counts, isAdmin),
    [counts, isAdmin]
  );

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const userInitials = useMemo(() => {
    if (!user?.name && !user?.email) return 'GA';
    const source = user.name ?? user.email ?? 'User';
    return source
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [user]);

  // SidebarLink with animations
  interface SidebarLinkProps {
    item: NavigationItem;
    isActive: boolean;
    isRTL: boolean;
  }

  function SidebarLink({ item, isActive, isRTL }: SidebarLinkProps) {
    const Icon = item.icon;

    return (
      <Link to={item.path} className="group/link relative block">
        {/* Hover background animation */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="active-sidebar-link"
              className="absolute inset-0 bg-sidebar-accent rounded-lg z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Link content */}
        <div
          className={cn(
            'relative z-20 flex items-center gap-3 px-3 py-2 rounded-lg',
            'text-sidebar-foreground transition-all duration-150',
            'group-hover/link:bg-sidebar-accent/50',
            isActive && 'font-medium text-sidebar-accent-foreground'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-150',
              'group-hover/link:translate-x-1',
              isRTL && 'group-hover/link:-translate-x-1'
            )}
          />
          <span className="text-sm">{t(item.label, item.label)}</span>

          {/* Badge for work queue counts */}
          {item.badgeCount !== undefined && item.badgeCount > 0 && (
            <div
              className={cn(
                'ms-auto flex h-5 min-w-5 items-center justify-center',
                'rounded-md px-1 bg-primary text-primary-foreground',
                'text-xs font-medium tabular-nums'
              )}
            >
              {item.badgeCount > 99 ? '99+' : item.badgeCount}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'hidden md:flex md:flex-col h-full w-[300px] flex-shrink-0',
        'bg-sidebar text-sidebar-foreground',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="px-4 py-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">G</span>
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-semibold">GASTAT Dossier</span>
            <span className="truncate text-xs text-muted-foreground">
              {t('common.internationalRelations', 'International Relations')}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {navigationSections.map((section) => (
          <div key={section.id} className="mb-6">
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t(section.label, section.label)}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarLink
                  key={item.id}
                  item={item}
                  isActive={
                    location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
                  }
                  isRTL={isRTL}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        {/* Settings & Help */}
        <div className="space-y-1 mb-4">
          {bottomNavigationItems.map((item) => (
            <SidebarLink
              key={item.id}
              item={item}
              isActive={location.pathname === item.path}
              isRTL={isRTL}
            />
          ))}
        </div>

        {/* Theme & Language Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <LanguageToggle compact />
          <ThemeSelector />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <span className="text-sm font-bold">{userInitials}</span>
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
            <span className="truncate font-semibold text-sidebar-foreground">
              {user?.name ?? user?.email}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.role ?? t('common.administrator', 'Administrator')}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              'rounded-md p-1.5 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-all',
              'hover:scale-105 active:scale-95',
              isRTL && 'me-auto ms-0'
            )}
            aria-label={t('common.logout', 'Sign out')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
