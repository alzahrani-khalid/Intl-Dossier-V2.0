import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
 Home,
 Globe2,
 Building2,
 Users,
 FileText,
 Calendar,
 ScrollText,
 Brain,
 BarChart3,
 Settings,
 HelpCircle,
 Search,
 Plus,
 User,
 LogOut,
 Inbox,
 Folder,
 MessageSquare,
 ClipboardList,
 ListChecks,
 Briefcase,
 CheckSquare,
 TrendingUp,
 Activity,
 Download,
 UserCog,
 ChevronRight,
 Target,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
 id: string
 label: string
 icon: React.ElementType
 path: string
 badge?: number
 adminOnly?: boolean
 children?: NavItem[]
}

export function Sidebar() {
 const { t, i18n } = useTranslation()
 const location = useLocation()
 const navigate = useNavigate()
 const { isSidebarOpen } = useUIStore()
 const { user, logout } = useAuthStore()
 const isRTL = i18n.language === 'ar'

 const handleLogout = async () => {
 try {
 await logout()
 navigate({ to: '/login' })
 } catch (error) {
 console.error('Logout failed:', error)
 }
 }

 // Check if user has admin role
 const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

 const navItems: NavItem[] = [
 {
 id: 'dashboard',
 label: t('navigation.dashboard'),
 icon: Home,
 path: '/dashboard',
 },
 {
 id: 'my-work',
 label: t('navigation.myWork'),
 icon: Briefcase,
 path: '/tasks',
 children: [
 {
 id: 'my-assignments',
 label: t('navigation.myAssignments'),
 icon: ListChecks,
 path: '/tasks',
 },
 {
 id: 'my-intake',
 label: t('navigation.intakeQueue'),
 icon: Inbox,
 path: '/my-work/intake',
 },
 {
 id: 'waiting',
 label: t('navigation.waitingQueue'),
 icon: ClipboardList,
 path: '/my-work/waiting',
 },
 ],
 },
 ]

 const workflowItems: NavItem[] = [
 {
 id: 'intake',
 label: t('navigation.intake'),
 icon: Inbox,
 path: '/intake/queue',
 },
 {
 id: 'approvals',
 label: t('navigation.approvals'),
 icon: CheckSquare,
 path: '/approvals',
 },
 {
 id: 'assignments',
 label: t('navigation.assignments'),
 icon: ListChecks,
 path: '/tasks',
 },
 ]

 const contentItems: NavItem[] = [
 {
 id: 'dossiers',
 label: t('navigation.dossiers'),
 icon: Folder,
 path: '/dossiers',
 children: [
 {
 id: 'countries',
 label: t('navigation.countries'),
 icon: Globe2,
 path: '/countries',
 },
 {
 id: 'organizations',
 label: t('navigation.organizations'),
 icon: Building2,
 path: '/organizations',
 },
 {
 id: 'forums',
 label: t('navigation.forums'),
 icon: Users,
 path: '/forums',
 },
 {
 id: 'engagements',
 label: t('navigation.engagements'),
 icon: Calendar,
 path: '/engagements',
 },
 {
 id: 'themes',
 label: t('navigation.themes'),
 icon: Target,
 path: '/themes',
 },
 {
 id: 'working-groups',
 label: t('navigation.workingGroups'),
 icon: Briefcase,
 path: '/working-groups',
 },
 {
 id: 'persons',
 label: t('navigation.persons'),
 icon: User,
 path: '/persons',
 },
 ],
 },
 {
 id: 'positions',
 label: t('navigation.positions'),
 icon: MessageSquare,
 path: '/positions',
 },
 {
 id: 'after-actions',
 label: t('navigation.afterActions'),
 icon: ClipboardList,
 path: '/after-actions',
 },
 ]

 const toolItems: NavItem[] = [
 {
 id: 'calendar',
 label: t('navigation.calendar'),
 icon: Calendar,
 path: '/calendar',
 },
 {
 id: 'briefs',
 label: t('navigation.briefs'),
 icon: ScrollText,
 path: '/briefs',
 },
 {
 id: 'intelligence',
 label: t('navigation.intelligence'),
 icon: Brain,
 path: '/intelligence',
 },
 {
 id: 'analytics',
 label: t('navigation.analytics'),
 icon: TrendingUp,
 path: '/analytics',
 },
 {
 id: 'reports',
 label: t('navigation.reports'),
 icon: BarChart3,
 path: '/reports',
 },
 ]

 const adminItems: NavItem[] = [
 {
 id: 'users',
 label: t('navigation.users'),
 icon: UserCog,
 path: '/users',
 adminOnly: true,
 },
 {
 id: 'monitoring',
 label: t('navigation.monitoring'),
 icon: Activity,
 path: '/monitoring',
 adminOnly: true,
 },
 {
 id: 'export',
 label: t('navigation.export'),
 icon: Download,
 path: '/export',
 adminOnly: true,
 },
 ]

 const documentItems: NavItem[] = [
 {
 id: 'data-library',
 label: t('navigation.dataLibrary'),
 icon: FileText,
 path: '/data-library',
 },
 {
 id: 'word-assistant',
 label: t('navigation.wordAssistant'),
 icon: FileText,
 path: '/word-assistant',
 },
 ]

 const bottomNavItems: NavItem[] = [
 {
 id: 'settings',
 label: t('navigation.settings'),
 icon: Settings,
 path: '/settings',
 },
 {
 id: 'help',
 label: t('navigation.getHelp'),
 icon: HelpCircle,
 path: '/help',
 },
 {
 id: 'search',
 label: t('navigation.search'),
 icon: Search,
 path: '/search',
 },
 ]

 const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
 new Set(['my-work', 'dossiers'])
 )

 const toggleExpand = (itemId: string) => {
 setExpandedItems((prev) => {
 const next = new Set(prev)
 if (next.has(itemId)) {
 next.delete(itemId)
 } else {
 next.add(itemId)
 }
 return next
 })
 }

 const renderNavItem = (item: NavItem, level: number = 0) => {
 const Icon = item.icon
 const isActive = location.pathname === item.path
 const hasChildren = item.children && item.children.length > 0
 const isExpanded = expandedItems.has(item.id)
 const indentClass = level > 0 ? 'ps-6' : ''

 if (item.adminOnly && !isAdmin) {
 return null
 }

 return (
 <li key={item.id}>
 {hasChildren ? (
 <>
 <button
 onClick={() => toggleExpand(item.id)}
 className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${indentClass} ${
 isActive
 ? 'bg-sidebar-accent text-sidebar-accent-foreground'
 : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
 }`}
 >
 <Icon className="h-4 w-4 shrink-0" />
 <span className="flex-1 text-start">{item.label}</span>
 <ChevronRight
 className={`h-4 w-4 shrink-0 transition-transform ${
 isExpanded ? 'rotate-90' : ''
 } ${isRTL ? 'rotate-180' : ''}`}
 />
 </button>
 {isExpanded && (
 <ul className="mt-1 space-y-1">
 {item.children.map((child) => renderNavItem(child, level + 1))}
 </ul>
 )}
 </>
 ) : (
 <Link
 to={item.path}
 className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${indentClass} ${
 isActive
 ? 'bg-sidebar-accent text-sidebar-accent-foreground'
 : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
 }`}
 >
 <Icon className="h-4 w-4 shrink-0" />
 <span>{item.label}</span>
 </Link>
 )}
 </li>
 )
 }

 if (!isSidebarOpen) return null

 return (
 <aside
 className="hidden h-screen w-72 flex-col border-e border-border bg-sidebar lg:flex"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="p-4">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
 <span className="text-background font-bold text-sm">G</span>
 </div>
 <span className="font-semibold text-sidebar-foreground">GASTAT Dossier</span>
 </div>

 <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium mb-6">
 <Plus className="h-4 w-4" />
 Quick Create
 </button>
 </div>

 <nav className="flex-1 overflow-y-auto px-4">
 {/* Main Navigation */}
 <div className="mb-6">
 <ul className="space-y-1">{navItems.map((item) => renderNavItem(item))}</ul>
 </div>

 {/* Workflows Section */}
 <div className="mb-6">
 <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
 Workflows
 </h3>
 <ul className="space-y-1">{workflowItems.map((item) => renderNavItem(item))}</ul>
 </div>

 {/* Content Section */}
 <div className="mb-6">
 <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
 Content
 </h3>
 <ul className="space-y-1">{contentItems.map((item) => renderNavItem(item))}</ul>
 </div>

 {/* Tools & Reports Section */}
 <div className="mb-6">
 <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
 Tools
 </h3>
 <ul className="space-y-1">{toolItems.map((item) => renderNavItem(item))}</ul>
 </div>

 {/* Admin Section */}
 {isAdmin && (
 <div className="mb-6">
 <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
 Admin
 </h3>
 <ul className="space-y-1">{adminItems.map((item) => renderNavItem(item))}</ul>
 </div>
 )}

 {/* Documents Section */}
 <div className="mb-6">
 <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
 Documents
 </h3>
 <ul className="space-y-1">{documentItems.map((item) => renderNavItem(item))}</ul>
 <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors mt-1">
 <Plus className="h-4 w-4" />
 <span>More</span>
 </button>
 </div>
 </nav>

 <div className="p-4 border-t border-sidebar-border">
 <ul className="space-y-1">{bottomNavItems.map((item) => renderNavItem(item))}</ul>

 <div className="mt-4 p-3 bg-sidebar-accent/30 rounded-lg">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
 <User className="h-4 w-4 text-muted-foreground" />
 </div>
 <div className="flex-1">
 <p className="text-sidebar-foreground text-sm font-medium">
 {user?.name || 'User'}
 </p>
 <p className="text-muted-foreground text-xs">
 {user?.email || 'user@gastat.gov.sa'}
 </p>
 </div>
 <button
 aria-label={t('common.logout')}
 className="p-1 hover:bg-sidebar-accent rounded"
 onClick={handleLogout}
 >
 <LogOut className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 </div>
 </div>
 </aside>
 )
}
