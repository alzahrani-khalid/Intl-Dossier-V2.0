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

  // Component implementation will be completed in next tasks
  return (
    <div className={cn('flex h-full', className)}>
      <p>Sidebar placeholder - will be completed in Task 4</p>
    </div>
  );
}
