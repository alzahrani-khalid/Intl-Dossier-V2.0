// Phase 36 (shell-chrome) consumes NAVIGATION_GROUPS directly via the existing
// `id: 'operations' | 'dossiers' | 'administration'` discriminator. See 36-02 D-03.
// Admin gate: the administration group is only emitted by `createNavigationGroups`
// when `isAdmin === true` (lines 169-216), so Sidebar.tsx passes the auth flag
// through and no additional filter helper is required (audit verdict: Case A).
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  CheckSquare,
  CalendarDays,
  ScrollText,
  Activity,
  Globe,
  Building2,
  Users,
  MessageSquare,
  Tag,
  UsersRound,
  FolderOpen,
  Settings,
  Sparkles,
  Wrench,
  Shield,
  History,
  Database,
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badgeCount?: number
  secondary?: boolean
}

export interface NavigationGroup {
  id: 'operations' | 'dossiers' | 'administration'
  label: string
  icon: LucideIcon
  items: NavigationItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

/**
 * Legacy type alias — kept for backward compatibility during transition.
 * Can be removed after Phase 8 is fully verified.
 */
export interface NavigationSection {
  id: string
  label: string
  items: NavigationItem[]
}

export const createNavigationGroups = (
  counts: { tasks: number; approvals: number; engagements: number },
  isAdmin: boolean,
): NavigationGroup[] => {
  const groups: NavigationGroup[] = [
    // GROUP 1: Operations — day-to-day workflows
    {
      id: 'operations',
      label: 'navigation.operations',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        // Primary items
        {
          id: 'dashboard',
          label: 'navigation.dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'engagements',
          label: 'navigation.engagements',
          path: '/engagements',
          icon: Briefcase,
          badgeCount: counts.engagements,
        },
        {
          id: 'after-actions',
          label: 'navigation.afterActions',
          path: '/after-actions',
          icon: ClipboardList,
        },
        {
          id: 'tasks',
          label: 'navigation.tasks',
          path: '/my-work',
          icon: CheckSquare,
          badgeCount: counts.tasks,
        },
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
        // Secondary items (per D-02)
        {
          id: 'activity',
          label: 'navigation.activity',
          path: '/activity',
          icon: Activity,
          secondary: true,
        },
      ],
    },
    // GROUP 2: Dossiers — entity browsing
    {
      id: 'dossiers',
      label: 'navigation.dossiers',
      icon: FolderOpen,
      defaultOpen: true,
      items: [
        {
          id: 'dossier-countries',
          label: 'navigation.countries',
          path: '/dossiers/countries',
          icon: Globe,
        },
        {
          id: 'dossier-organizations',
          label: 'navigation.organizations',
          path: '/dossiers/organizations',
          icon: Building2,
        },
        {
          id: 'dossier-persons',
          label: 'navigation.persons',
          path: '/dossiers/persons',
          icon: Users,
        },
        {
          id: 'dossier-forums',
          label: 'navigation.forums',
          path: '/dossiers/forums',
          icon: MessageSquare,
        },
        {
          id: 'dossier-topics',
          label: 'navigation.topics',
          path: '/dossiers/topics',
          icon: Tag,
        },
        {
          id: 'dossier-working-groups',
          label: 'navigation.workingGroups',
          path: '/dossiers/working_groups',
          icon: UsersRound,
        },
      ],
    },
  ]

  // GROUP 3: Administration — admin-only
  if (isAdmin) {
    groups.push({
      id: 'administration',
      label: 'navigation.administration',
      icon: Settings,
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          id: 'admin-ai-settings',
          label: 'navigation.aiSettings',
          path: '/admin/ai-settings',
          icon: Sparkles,
        },
        {
          id: 'admin-system',
          label: 'navigation.systemSettings',
          path: '/admin/system',
          icon: Wrench,
        },
        {
          id: 'admin-field-permissions',
          label: 'navigation.fieldPermissions',
          path: '/admin/field-permissions',
          icon: Shield,
        },
        {
          id: 'admin-audit-logs',
          label: 'navigation.auditLogs',
          path: '/audit-logs',
          icon: History,
        },
        {
          id: 'admin-data-retention',
          label: 'navigation.dataRetention',
          path: '/admin/data-retention',
          icon: Database,
        },
        {
          id: 'admin-approvals',
          label: 'navigation.approvals',
          path: '/approvals',
          icon: CheckSquare,
          badgeCount: counts.approvals,
        },
      ],
    })
  }

  return groups
}

/**
 * Legacy wrapper — maps new 3-group structure to old section format.
 * Prevents breaking imports during transition. Remove after Phase 8 verified.
 */
export const createNavigationSections = (
  counts: { intake: number; waiting: number },
  isAdmin: boolean,
): NavigationSection[] => {
  const groups = createNavigationGroups(
    { tasks: counts.intake, approvals: counts.waiting, engagements: 0 },
    isAdmin,
  )
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.items,
  }))
}
