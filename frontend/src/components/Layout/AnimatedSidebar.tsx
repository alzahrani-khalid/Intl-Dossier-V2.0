import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
 LayoutDashboard,
 Globe2,
 Building2,
 FileText,
 CalendarDays,
 Brain,
 Database,
 Users,
 CheckSquare,
 Inbox,
 Clock,
 Settings,
 HelpCircle,
 LogOut,
 User,
 Folder,
 Briefcase,
 MessageSquare,
 ClipboardList,
 ScrollText,
 TrendingUp,
 BarChart3,
 Activity,
 Download,
 UserCog,
 ListChecks,
 PenTool,
 Target,
} from 'lucide-react'
import {
 Sidebar,
 SidebarContent,
 SidebarFooter,
 SidebarGroup,
 SidebarGroupContent,
 SidebarGroupLabel,
 SidebarHeader,
 SidebarMenu,
 SidebarMenuBadge,
 SidebarMenuButton,
 SidebarMenuItem,
 SidebarMenuSkeleton,
 SidebarRail,
 useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/auth.context'
import { useWorkQueueCounts } from '@/hooks/useWorkQueueCounts'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeSelector } from '@/components/theme-selector/theme-selector'
import { cn } from '@/lib/utils'

interface NavigationItem {
 id: string
 label: string
 path: string
 icon: typeof LayoutDashboard
 badgeCount?: number
}

export function AnimatedSidebar() {
 const { t, i18n } = useTranslation()
 const location = useLocation()
 const navigate = useNavigate()
 const { user, logout } = useAuth()
 const { state } = useSidebar()
 const isRTL = i18n.language === 'ar'

 // Fetch work queue counts
 const { data: workQueueCounts, isLoading: isLoadingCounts } = useWorkQueueCounts()
 const counts = workQueueCounts || { assignments: 0, intake: 0, waiting: 0 }

 // Work Queue Navigation Items (Priority)
 const workItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'my-assignments',
 label: t('navigation.myAssignments', 'My Assignments'),
 path: '/tasks',
 icon: CheckSquare,
 badgeCount: counts.assignments,
 },
 {
 id: 'intake-queue',
 label: t('navigation.intakeQueue', 'Intake Queue'),
 path: '/my-work/intake',
 icon: Inbox,
 badgeCount: counts.intake,
 },
 {
 id: 'waiting-queue',
 label: t('navigation.waitingQueue', 'Waiting Queue'),
 path: '/my-work/waiting',
 icon: Clock,
 badgeCount: counts.waiting,
 },
 ],
 [t, counts]
 )

 // Main Work Items
 const mainWorkItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'dashboard',
 label: t('navigation.dashboard', 'Dashboard'),
 path: '/dashboard',
 icon: LayoutDashboard,
 },
 {
 id: 'approvals',
 label: t('navigation.approvals', 'Approvals'),
 path: '/approvals',
 icon: CheckSquare,
 },
 {
 id: 'dossiers',
 label: t('navigation.dossiers', 'Dossiers'),
 path: '/dossiers',
 icon: Folder,
 },
 {
 id: 'positions',
 label: t('navigation.positions', 'Positions'),
 path: '/positions',
 icon: MessageSquare,
 },
 {
 id: 'after-actions',
 label: t('navigation.afterActions', 'After Actions'),
 path: '/after-actions',
 icon: ClipboardList,
 },
 ],
 [t]
 )

 // Browse Navigation Items (7 Unified Dossier Types)
 const browseItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'countries',
 label: t('navigation.countries', 'Countries'),
 path: '/countries',
 icon: Globe2,
 },
 {
 id: 'organizations',
 label: t('navigation.organizations', 'Organizations'),
 path: '/organizations',
 icon: Building2,
 },
 {
 id: 'forums',
 label: t('navigation.forums', 'Forums'),
 path: '/forums',
 icon: Users,
 },
 {
 id: 'engagements',
 label: t('navigation.engagements', 'Engagements'),
 path: '/engagements',
 icon: CalendarDays,
 },
 {
 id: 'themes',
 label: t('navigation.themes', 'Themes'),
 path: '/themes',
 icon: Target,
 },
 {
 id: 'working-groups',
 label: t('navigation.workingGroups', 'Working Groups'),
 path: '/working-groups',
 icon: Briefcase,
 },
 {
 id: 'persons',
 label: t('navigation.persons', 'Persons'),
 path: '/persons',
 icon: User,
 },
 ],
 [t]
 )

 // Tools & Reports Items
 const toolsItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'calendar',
 label: t('navigation.calendar', 'Calendar'),
 path: '/calendar',
 icon: CalendarDays,
 },
 {
 id: 'briefs',
 label: t('navigation.briefs', 'Briefs'),
 path: '/briefs',
 icon: ScrollText,
 },
 {
 id: 'intelligence',
 label: t('navigation.intelligence', 'Intelligence'),
 path: '/intelligence',
 icon: Brain,
 },
 {
 id: 'analytics',
 label: t('navigation.analytics', 'Analytics'),
 path: '/analytics',
 icon: TrendingUp,
 },
 {
 id: 'reports',
 label: t('navigation.reports', 'Reports'),
 path: '/reports',
 icon: BarChart3,
 },
 ],
 [t]
 )

 // Documents Items
 const documentItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'data-library',
 label: t('navigation.dataLibrary', 'Data Library'),
 path: '/data-library',
 icon: Database,
 },
 {
 id: 'word-assistant',
 label: t('navigation.wordAssistant', 'Word Assistant'),
 path: '/word-assistant',
 icon: PenTool,
 },
 ],
 [t]
 )

 // Admin Items (role-based)
 const adminItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'users',
 label: t('navigation.users', 'User Management'),
 path: '/users',
 icon: UserCog,
 },
 {
 id: 'monitoring',
 label: t('navigation.monitoring', 'Monitoring'),
 path: '/monitoring',
 icon: Activity,
 },
 {
 id: 'export',
 label: t('navigation.export', 'Export'),
 path: '/export',
 icon: Download,
 },
 ],
 [t]
 )

 // Check if user is admin
 const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

 // Bottom Navigation Items
 const bottomItems = useMemo<NavigationItem[]>(
 () => [
 {
 id: 'settings',
 label: t('navigation.settings', 'Settings'),
 path: '/settings',
 icon: Settings,
 },
 {
 id: 'help',
 label: t('navigation.getHelp', 'Help'),
 path: '/help',
 icon: HelpCircle,
 },
 ],
 [t]
 )

 const handleLogout = async () => {
 await logout()
 navigate({ to: '/login' })
 }

 const userInitials = useMemo(() => {
 if (!user?.name && !user?.email) return 'GA'
 const source = user.name ?? user.email ?? 'User'
 return source
 .split(' ')
 .map((part) => part.charAt(0).toUpperCase())
 .join('')
 .slice(0, 2)
 }, [user])

 const activePath = location.pathname

 return (
 <Sidebar collapsible="icon" side={isRTL ? 'right' : 'left'} dir={isRTL ? 'rtl' : 'ltr'}>
 <SidebarHeader>
 <SidebarMenu>
 <SidebarMenuItem>
 <SidebarMenuButton
 asChild
 className="group/header transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to="/dashboard">
 <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover/header:scale-110">
 <span className="text-sm font-bold">G</span>
 </div>
 <div className="grid flex-1 text-start text-sm leading-tight">
 <span className="truncate font-semibold">GASTAT Dossier</span>
 <span className="truncate text-xs text-muted-foreground">
 {t('common.internationalRelations', 'International Relations')}
 </span>
 </div>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 </SidebarMenu>
 </SidebarHeader>

 <SidebarContent>
 {/* My Work Section - Priority */}
 <SidebarGroup>
 <SidebarGroupLabel>{t('navigation.myWork', 'My Work')}</SidebarGroupLabel>
 <SidebarGroupContent>
 <SidebarMenu>
 {isLoadingCounts ? (
 // Show loading skeletons
 Array.from({ length: 3 }).map((_, index) => (
 <SidebarMenuItem key={`skeleton-${index}`}>
 <SidebarMenuSkeleton showIcon />
 </SidebarMenuItem>
 ))
 ) : (
 // Show actual work items
 workItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 {item.badgeCount !== undefined && item.badgeCount > 0 && (
 <SidebarMenuBadge className="bg-primary text-primary-foreground">
 {item.badgeCount > 99 ? '99+' : item.badgeCount}
 </SidebarMenuBadge>
 )}
 </SidebarMenuItem>
 )
 })
 )}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>

 {/* Main Work Section */}
 <SidebarGroup>
 <SidebarGroupLabel>Main</SidebarGroupLabel>
 <SidebarGroupContent>
 <SidebarMenu>
 {mainWorkItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 )
 })}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>

 {/* Browse Section (Entities) */}
 <SidebarGroup>
 <SidebarGroupLabel>{t('navigation.browse', 'Browse')}</SidebarGroupLabel>
 <SidebarGroupContent>
 <SidebarMenu>
 {browseItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 )
 })}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>

 {/* Tools & Reports Section */}
 <SidebarGroup>
 <SidebarGroupLabel>Tools</SidebarGroupLabel>
 <SidebarGroupContent>
 <SidebarMenu>
 {toolsItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 )
 })}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>

 {/* Documents Section */}
 <SidebarGroup>
 <SidebarGroupLabel>Documents</SidebarGroupLabel>
 <SidebarGroupContent>
 <SidebarMenu>
 {documentItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 )
 })}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>

 {/* Admin Section (role-based) */}
 {isAdmin && (
 <SidebarGroup>
 <SidebarGroupLabel>Admin</SidebarGroupLabel>
 <SidebarGroupContent>
 <SidebarMenu>
 {adminItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 )
 })}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>
 )}

 {/* Settings & Help */}
 <SidebarGroup className="mt-auto">
 <SidebarGroupContent>
 <SidebarMenu>
 {bottomItems.map((item) => {
 const Icon = item.icon
 const isActive = activePath === item.path

 return (
 <SidebarMenuItem key={item.id}>
 <SidebarMenuButton
 asChild
 isActive={isActive}
 tooltip={item.label}
 className="group/item transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Link to={item.path}>
 <Icon className="transition-transform duration-200 group-hover/item:scale-110" />
 <span>{item.label}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 )
 })}
 </SidebarMenu>
 </SidebarGroupContent>
 </SidebarGroup>
 </SidebarContent>

 <SidebarFooter>
 {/* Settings & Theme Controls */}
 <SidebarMenu>
 <SidebarMenuItem>
 <div className="flex items-center justify-center gap-2 px-2 py-1.5">
 <LanguageToggle compact />
 <ThemeSelector />
 </div>
 </SidebarMenuItem>
 </SidebarMenu>

 {/* User Profile Card */}
 <SidebarMenu>
 <SidebarMenuItem>
 <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
 <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
 <span className="text-sm font-bold">{userInitials}</span>
 </div>
 <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
 <span className="truncate font-semibold text-sidebar-foreground">{user?.name ?? user?.email}</span>
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
 </SidebarMenuItem>
 </SidebarMenu>
 </SidebarFooter>

 <SidebarRail />
 </Sidebar>
 )
}

// Wrapper component with provider
export function AnimatedSidebarWrapper({ children }: { children: React.ReactNode }) {
 return (
 <SidebarProvider>
 <AnimatedSidebar />
 {children}
 </SidebarProvider>
 )
}
