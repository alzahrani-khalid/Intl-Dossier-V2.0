import type { LucideIcon } from 'lucide-react';
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
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badgeCount?: number;
  adminOnly?: boolean;
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}

export const createNavigationSections = (
  counts: { assignments: number; intake: number; waiting: number },
  isAdmin: boolean
): NavigationSection[] => {
  const sections: NavigationSection[] = [
    {
      id: 'my-work',
      label: 'navigation.myWork',
      items: [
        {
          id: 'my-assignments',
          label: 'navigation.myAssignments',
          path: '/tasks',
          icon: CheckSquare,
          badgeCount: counts.assignments,
        },
        {
          id: 'intake-queue',
          label: 'navigation.intakeQueue',
          path: '/my-work/intake',
          icon: Inbox,
          badgeCount: counts.intake,
        },
        {
          id: 'waiting-queue',
          label: 'navigation.waitingQueue',
          path: '/my-work/waiting',
          icon: Clock,
          badgeCount: counts.waiting,
        },
      ],
    },
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'navigation.dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'approvals',
          label: 'navigation.approvals',
          path: '/approvals',
          icon: CheckSquare,
        },
        {
          id: 'dossiers',
          label: 'navigation.dossiers',
          path: '/dossiers',
          icon: Folder,
        },
        {
          id: 'positions',
          label: 'navigation.positions',
          path: '/positions',
          icon: MessageSquare,
        },
        {
          id: 'after-actions',
          label: 'navigation.afterActions',
          path: '/after-actions',
          icon: ClipboardList,
        },
      ],
    },
    {
      id: 'browse',
      label: 'navigation.browse',
      items: [
        {
          id: 'countries',
          label: 'navigation.countries',
          path: '/countries',
          icon: Globe2,
        },
        {
          id: 'organizations',
          label: 'navigation.organizations',
          path: '/organizations',
          icon: Building2,
        },
        {
          id: 'forums',
          label: 'navigation.forums',
          path: '/forums',
          icon: Users,
        },
        {
          id: 'engagements',
          label: 'navigation.engagements',
          path: '/engagements',
          icon: CalendarDays,
        },
        {
          id: 'themes',
          label: 'navigation.themes',
          path: '/themes',
          icon: Target,
        },
        {
          id: 'working-groups',
          label: 'navigation.workingGroups',
          path: '/working-groups',
          icon: Briefcase,
        },
        {
          id: 'persons',
          label: 'navigation.persons',
          path: '/persons',
          icon: Users,
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          id: 'calendar',
          label: 'navigation.calendar',
          path: '/calendar',
          icon: CalendarDays,
        },
        {
          id: 'briefs',
          label: 'navigation.briefs',
          path: '/briefs',
          icon: ScrollText,
        },
        {
          id: 'intelligence',
          label: 'navigation.intelligence',
          path: '/intelligence',
          icon: Brain,
        },
        {
          id: 'analytics',
          label: 'navigation.analytics',
          path: '/analytics',
          icon: TrendingUp,
        },
        {
          id: 'reports',
          label: 'navigation.reports',
          path: '/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'documents',
      label: 'Documents',
      items: [
        {
          id: 'data-library',
          label: 'navigation.dataLibrary',
          path: '/data-library',
          icon: Database,
        },
        {
          id: 'word-assistant',
          label: 'navigation.wordAssistant',
          path: '/word-assistant',
          icon: PenTool,
        },
      ],
    },
  ];

  // Add admin section if user is admin
  if (isAdmin) {
    sections.push({
      id: 'admin',
      label: 'Admin',
      items: [
        {
          id: 'users',
          label: 'navigation.users',
          path: '/users',
          icon: UserCog,
          adminOnly: true,
        },
        {
          id: 'monitoring',
          label: 'navigation.monitoring',
          path: '/monitoring',
          icon: Activity,
          adminOnly: true,
        },
        {
          id: 'export',
          label: 'navigation.export',
          path: '/export',
          icon: Download,
          adminOnly: true,
        },
      ],
    });
  }

  return sections;
};

export const bottomNavigationItems: NavigationItem[] = [
  {
    id: 'settings',
    label: 'navigation.settings',
    path: '/settings',
    icon: Settings,
  },
  {
    id: 'help',
    label: 'navigation.getHelp',
    path: '/help',
    icon: HelpCircle,
  },
];
