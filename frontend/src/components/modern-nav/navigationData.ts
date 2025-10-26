import {
  Home,
  FolderOpen,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  Globe2,
  Building2,
  Users,
  UserCircle,
  Palette,
  Handshake,
  BriefcaseBusiness,
  Users2,
  MapPin,
  FileText,
  ListChecks,
  Inbox,
  ListTodo,
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  FileBarChart,
  TrendingUp,
  Lightbulb,
  Activity,
  Download,
  Database,
  FileEdit,
  HelpCircle,
  Shield,
  Eye,
  LucideIcon,
} from 'lucide-react';

/**
 * Navigation item structure for ExpandedPanel sections
 */
export interface NavigationItem {
  id: string;
  label: string;
  labelKey: string; // i18n key
  icon: LucideIcon;
  path: string;
  count?: number;
  badge?: string;
  adminOnly?: boolean; // Only visible to admin users
}

/**
 * Main category structure for IconRail
 */
export interface NavigationCategory {
  id: string;
  icon: LucideIcon;
  tooltipKey: string;
  path: string; // Default path when category is clicked
  items: NavigationItem[]; // Items to show in ExpandedPanel
}

/**
 * Navigation structure organized by 6 main categories
 */
export const navigationCategories: NavigationCategory[] = [
  // 1. Dashboard
  {
    id: 'dashboard',
    icon: Home,
    tooltipKey: 'navigation.dashboard',
    path: '/dashboard',
    items: [
      {
        id: 'dashboard-overview',
        label: 'Dashboard Overview',
        labelKey: 'navigation.dashboardOverview',
        icon: Home,
        path: '/dashboard',
      },
    ],
  },

  // 2. Dossiers - All entity types
  {
    id: 'dossiers',
    icon: FolderOpen,
    tooltipKey: 'navigation.dossiers',
    path: '/dossiers',
    items: [
      {
        id: 'countries',
        label: 'Countries',
        labelKey: 'navigation.countries',
        icon: Globe2,
        path: '/countries',
      },
      {
        id: 'organizations',
        label: 'Organizations',
        labelKey: 'navigation.organizations',
        icon: Building2,
        path: '/organizations',
      },
      {
        id: 'forums',
        label: 'Forums',
        labelKey: 'navigation.forums',
        icon: Users,
        path: '/forums',
      },
      {
        id: 'persons',
        label: 'Persons',
        labelKey: 'navigation.persons',
        icon: UserCircle,
        path: '/persons',
      },
      {
        id: 'themes',
        label: 'Themes',
        labelKey: 'navigation.themes',
        icon: Palette,
        path: '/themes',
      },
      {
        id: 'engagements',
        label: 'Engagements',
        labelKey: 'navigation.engagements',
        icon: Handshake,
        path: '/engagements',
      },
      {
        id: 'working-groups',
        label: 'Working Groups',
        labelKey: 'navigation.workingGroups',
        icon: Users2,
        path: '/working-groups',
      },
      {
        id: 'positions',
        label: 'Positions',
        labelKey: 'navigation.positions',
        icon: MapPin,
        path: '/positions',
      },
      {
        id: 'mous',
        label: 'MoUs',
        labelKey: 'navigation.mous',
        icon: FileText,
        path: '/mous',
      },
      {
        id: 'briefs',
        label: 'Briefs',
        labelKey: 'navigation.briefs',
        icon: BriefcaseBusiness,
        path: '/briefs',
      },
    ],
  },

  // 3. Workflow - Tasks, Intake, Queue
  {
    id: 'workflow',
    icon: ClipboardList,
    tooltipKey: 'navigation.workflow',
    path: '/tasks',
    items: [
      {
        id: 'tasks',
        label: 'Tasks',
        labelKey: 'navigation.tasks',
        icon: ListChecks,
        path: '/tasks',
      },
      {
        id: 'task-queue',
        label: 'Task Queue',
        labelKey: 'navigation.taskQueue',
        icon: ListTodo,
        path: '/tasks/queue',
      },
      {
        id: 'intake',
        label: 'Intake',
        labelKey: 'navigation.intake',
        icon: Inbox,
        path: '/intake',
      },
      {
        id: 'task-escalations',
        label: 'Task Escalations',
        labelKey: 'navigation.taskEscalations',
        icon: AlertTriangle,
        path: '/tasks/escalations',
      },
    ],
  },

  // 4. Calendar - Calendar, Events
  {
    id: 'calendar',
    icon: Calendar,
    tooltipKey: 'navigation.calendar',
    path: '/calendar',
    items: [
      {
        id: 'calendar-overview',
        label: 'Calendar',
        labelKey: 'navigation.calendar',
        icon: CalendarDays,
        path: '/calendar',
      },
      {
        id: 'events',
        label: 'Events',
        labelKey: 'navigation.events',
        icon: CalendarDays,
        path: '/events',
      },
      {
        id: 'new-event',
        label: 'New Event',
        labelKey: 'navigation.newEvent',
        icon: CalendarPlus,
        path: '/calendar/new',
      },
    ],
  },

  // 5. Reports - Reports, Analytics, Intelligence, Export, Data Library, Word Assistant
  {
    id: 'reports',
    icon: BarChart3,
    tooltipKey: 'navigation.reports',
    path: '/reports',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        labelKey: 'navigation.reports',
        icon: FileBarChart,
        path: '/reports',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        labelKey: 'navigation.analytics',
        icon: TrendingUp,
        path: '/analytics',
      },
      {
        id: 'intelligence',
        label: 'Intelligence Signals',
        labelKey: 'navigation.intelligence',
        icon: Lightbulb,
        path: '/intelligence',
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        labelKey: 'navigation.monitoring',
        icon: Activity,
        path: '/monitoring',
      },
      {
        id: 'export',
        label: 'Export',
        labelKey: 'navigation.export',
        icon: Download,
        path: '/export',
      },
      {
        id: 'data-library',
        label: 'Data Library',
        labelKey: 'navigation.dataLibrary',
        icon: Database,
        path: '/data-library',
      },
      {
        id: 'word-assistant',
        label: 'Word Assistant',
        labelKey: 'navigation.wordAssistant',
        icon: FileEdit,
        path: '/word-assistant',
      },
    ],
  },

  // 6. System - Settings, Admin, Help
  {
    id: 'system',
    icon: Settings,
    tooltipKey: 'navigation.system',
    path: '/settings',
    items: [
      {
        id: 'users',
        label: 'Users',
        labelKey: 'navigation.users',
        icon: Users,
        path: '/users',
      },
      {
        id: 'settings',
        label: 'Settings',
        labelKey: 'navigation.settings',
        icon: Settings,
        path: '/settings',
      },
      {
        id: 'help',
        label: 'Help',
        labelKey: 'navigation.help',
        icon: HelpCircle,
        path: '/help',
      },
      {
        id: 'admin',
        label: 'Admin',
        labelKey: 'navigation.admin',
        icon: Shield,
        path: '/admin',
        adminOnly: true, // Only visible to admin users
      },
      {
        id: 'accessibility',
        label: 'Accessibility',
        labelKey: 'navigation.accessibility',
        icon: Eye,
        path: '/accessibility',
      },
    ],
  },
];

/**
 * Get navigation category by ID
 */
export function getNavigationCategory(id: string): NavigationCategory | undefined {
  return navigationCategories.find((cat) => cat.id === id);
}

/**
 * Get all navigation items flattened (for search, etc.)
 */
export function getAllNavigationItems(): NavigationItem[] {
  return navigationCategories.flatMap((cat) => cat.items);
}
