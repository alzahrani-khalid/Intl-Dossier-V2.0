import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  LayoutGrid,
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
  FolderOpen,
  MessageSquare,
  ClipboardList,
  ScrollText,
  TrendingUp,
  BarChart3,
  Activity,
  Download,
  UserCog,
  PenTool,
  Shield,
  Wrench,
  Briefcase,
  FileCheck,
  Sparkles,
  Sliders,
  Gauge,
  Tag,
  Webhook,
  Workflow,
  BookOpen,
  Globe2,
  Building2,
  Users2,
  Calendar,
  Target,
  User,
  Network,
  History,
  Vote,
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badgeCount?: number
  adminOnly?: boolean
}

export interface NavigationSection {
  id: string
  label: string
  items: NavigationItem[]
}

export const createNavigationSections = (
  counts: { assignments: number; intake: number; waiting: number },
  isAdmin: boolean,
): NavigationSection[] => {
  const sections: NavigationSection[] = [
    // DOSSIERS - Primary Hub (First-class citizen)
    {
      id: 'dossiers-hub',
      label: 'navigation.dossiersHub',
      items: [
        {
          id: 'all-dossiers',
          label: 'navigation.allDossiers',
          path: '/dossiers',
          icon: FolderOpen,
        },
        {
          id: 'dossier-countries',
          label: 'navigation.countries',
          path: '/dossiers/countries',
          icon: Globe2,
        },
        {
          id: 'dossier-organizations',
          label: 'navigation.organizations',
          path: '/dossiers/organizations',
          icon: Building2,
        },
        {
          id: 'dossier-forums',
          label: 'navigation.forums',
          path: '/dossiers/forums',
          icon: Users2,
        },
        {
          id: 'dossier-engagements',
          label: 'navigation.engagements',
          path: '/dossiers/engagements',
          icon: Calendar,
        },
        {
          id: 'dossier-working-groups',
          label: 'navigation.workingGroups',
          path: '/dossiers/working_groups',
          icon: Briefcase,
        },
        {
          id: 'dossier-persons',
          label: 'navigation.persons',
          path: '/dossiers/persons',
          icon: User,
        },
        {
          id: 'dossier-topics',
          label: 'navigation.topics',
          path: '/dossiers/topics',
          icon: Target,
        },
        {
          id: 'dossier-elected-officials',
          label: 'navigation.electedOfficials',
          path: '/dossiers/elected_officials',
          icon: Vote,
        },
        {
          id: 'relationship-graph',
          label: 'navigation.relationshipGraph',
          path: '/relationships',
          icon: Network,
        },
        {
          id: 'recent-activity',
          label: 'navigation.recentActivity',
          path: '/activity',
          icon: History,
        },
      ],
    },
    // My Work Section
    {
      id: 'my-work',
      label: 'navigation.myWork',
      items: [
        {
          id: 'unified-work',
          label: 'navigation.unifiedWork',
          path: '/my-work',
          icon: Briefcase,
          badgeCount: counts.assignments + counts.intake + counts.waiting,
        },
        {
          id: 'my-assignments',
          label: 'navigation.myAssignments',
          path: '/tasks',
          icon: CheckSquare,
          badgeCount: counts.assignments,
        },
        {
          id: 'commitments',
          label: 'navigation.commitments',
          path: '/commitments',
          icon: FileCheck,
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
    // Main Section (Dashboard, Approvals, etc.)
    {
      id: 'main',
      label: 'navigation.main',
      items: [
        {
          id: 'dashboard',
          label: 'navigation.dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'custom-dashboard',
          label: 'navigation.customDashboard',
          path: '/custom-dashboard',
          icon: LayoutGrid,
        },
        {
          id: 'approvals',
          label: 'navigation.approvals',
          path: '/approvals',
          icon: CheckSquare,
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
          id: 'briefing-books',
          label: 'navigation.briefingBooks',
          path: '/briefing-books',
          icon: BookOpen,
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
        {
          id: 'sla-monitoring',
          label: 'navigation.slaMonitoring',
          path: '/sla-monitoring',
          icon: Gauge,
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
  ]

  // Add admin section if user is admin
  if (isAdmin) {
    sections.push({
      id: 'admin',
      label: 'navigation.admin',
      items: [
        {
          id: 'admin-system',
          label: 'navigation.adminSystem',
          path: '/admin/system',
          icon: Wrench,
          adminOnly: true,
        },
        {
          id: 'admin-approvals',
          label: 'navigation.adminApprovals',
          path: '/admin/approvals',
          icon: Shield,
          adminOnly: true,
        },
        {
          id: 'ai-usage',
          label: 'navigation.aiUsage',
          path: '/admin/ai-usage',
          icon: Sparkles,
          adminOnly: true,
        },
        {
          id: 'ai-settings',
          label: 'navigation.aiSettings',
          path: '/admin/ai-settings',
          icon: Sliders,
          adminOnly: true,
        },
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
        {
          id: 'tags',
          label: 'navigation.tags',
          path: '/tags',
          icon: Tag,
          adminOnly: true,
        },
        {
          id: 'webhooks',
          label: 'navigation.webhooks',
          path: '/settings/webhooks',
          icon: Webhook,
          adminOnly: true,
        },
        {
          id: 'workflow-automation',
          label: 'navigation.workflowAutomation',
          path: '/workflow-automation',
          icon: Workflow,
          adminOnly: true,
        },
      ],
    })
  }

  return sections
}

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
]
