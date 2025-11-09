import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from '@tanstack/react-router';
import { Toaster } from 'react-hot-toast';
import {
  ChevronRight,
  LogOut,
  User,
  Home,
  FolderOpen,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { navigationCategories, type NavigationCategory, type NavigationItem } from '@/components/modern-nav/navigationData';
import { cn } from '@/lib/utils';

interface MainLayoutAceternityProps {
  children: ReactNode;
}

/**
 * Aceternity-based Main Layout with Sidebar
 *
 * Features:
 * - Mobile-first responsive design (base → sm: → md: → lg:)
 * - RTL support with logical properties (ms-*, me-*, ps-*, pe-*)
 * - Collapsible sidebar with keyboard shortcut (Cmd/Ctrl + B)
 * - Smooth animations with Framer Motion
 * - Touch-friendly (min 44x44px targets)
 * - Integrated user profile dropdown
 * - Auto-route detection for active states
 */
export function MainLayoutAceternity({ children }: MainLayoutAceternityProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Aceternity Sidebar */}
          <AppSidebar
            user={user}
            onLogout={handleLogout}
            navigationCategories={navigationCategories}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            {/* Header with sidebar trigger */}
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 lg:px-8">
              <SidebarTrigger className="min-h-11 min-w-11" />
              <div className="flex-1" />
              {/* Additional header content can go here */}
            </header>

            {/* Page Content */}
            <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />
    </>
  );
}

/**
 * Application Sidebar Component
 *
 * Mobile-first, RTL-ready sidebar with navigation categories
 */
interface AppSidebarProps {
  user: any;
  onLogout: () => void;
  navigationCategories: NavigationCategory[];
}

function AppSidebar({ user, onLogout, navigationCategories }: AppSidebarProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-e">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-start">
                {t('app.name', 'Intl Dossier')}
              </h1>
              <p className="text-xs text-muted-foreground text-start">
                {t('app.tagline', 'International Relations Management')}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Sidebar Content - Navigation */}
      <SidebarContent className="px-2 py-4">
        {navigationCategories.map((category) => (
          <SidebarGroup key={category.id}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-start">
                {t(category.tooltipKey)}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <NavigationMenuItem
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    isRTL={isRTL}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Sidebar Footer - User Profile */}
      <SidebarFooter className="border-t px-2 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="min-h-11 data-[state=open]:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-col text-start ms-3 flex-1">
                      <span className="text-sm font-medium">
                        {user?.name || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email || ''}
                      </span>
                    </div>
                  )}
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isRTL && 'rotate-180'
                    )}
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align={isRTL ? 'end' : 'start'}
                className="w-56"
              >
                <DropdownMenuLabel className="text-start">
                  {t('navigation.myAccount', 'My Account')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link to="/settings" className="flex items-center">
                    <User className="h-4 w-4 me-2" />
                    <span>{t('navigation.profile', 'Profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 me-2" />
                    <span>{t('navigation.settings', 'Settings')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 me-2" />
                  <span>{t('auth.logout', 'Log out')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Navigation Menu Item Component
 *
 * Handles individual navigation items with:
 * - Active state detection
 * - RTL icon flipping
 * - Touch-friendly sizing
 * - Smooth transitions
 */
interface NavigationMenuItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  isRTL: boolean;
}

function NavigationMenuItem({
  item,
  isCollapsed,
  isRTL,
}: NavigationMenuItemProps) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = item.icon;

  // Close sidebar on mobile when clicking a navigation item
  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="min-h-11">
        <Link to={item.path} className="flex items-center gap-3" onClick={handleClick}>
          <Icon className={cn('h-4 w-4', isRTL && 'scale-x-[-1]')} />
          {!isCollapsed && (
            <span className="flex-1 text-start">{t(item.labelKey)}</span>
          )}
          {!isCollapsed && item.badge && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {item.badge}
            </span>
          )}
          {!isCollapsed && item.count !== undefined && (
            <span className="text-xs text-muted-foreground">{item.count}</span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
