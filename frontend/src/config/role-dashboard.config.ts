/**
 * Role-Specific Dashboard Configurations
 *
 * Defines the dashboard layout, quick actions, KPIs, and features
 * for each user role in the system.
 */

import type {
  DashboardRole,
  RoleDashboardConfig,
  RoleQuickAction,
  RoleKpiConfig,
  DashboardSection,
  EntityFocus,
  RoleDashboardFeatures,
} from '@/types/role-dashboard.types'

// ============================================================================
// Quick Actions by Role
// ============================================================================

/**
 * All available quick actions with role visibility
 */
export const ROLE_QUICK_ACTIONS: RoleQuickAction[] = [
  // Dossier actions
  {
    id: 'create-dossier',
    label: 'Create Dossier',
    labelAr: 'إنشاء ملف',
    icon: 'FolderPlus',
    action: 'create-dossier',
    route: '/dossiers/new',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    visibleTo: ['admin', 'editor', 'analyst', 'manager', 'executive'],
    priority: 1,
  },
  // Task actions
  {
    id: 'create-task',
    label: 'Create Task',
    labelAr: 'إنشاء مهمة',
    icon: 'ListTodo',
    action: 'create-task',
    route: '/my-work?action=create-task',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    visibleTo: ['admin', 'editor', 'analyst', 'manager', 'staff'],
    priority: 2,
  },
  // Intake actions
  {
    id: 'create-intake',
    label: 'New Request',
    labelAr: 'طلب جديد',
    icon: 'Inbox',
    action: 'create-intake',
    route: '/intake/new',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    visibleTo: ['admin', 'intake_officer', 'staff'],
    priority: 1,
  },
  // Engagement actions
  {
    id: 'schedule-engagement',
    label: 'Schedule Meeting',
    labelAr: 'جدولة اجتماع',
    icon: 'Calendar',
    action: 'navigate',
    route: '/calendar?action=new',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    visibleTo: ['lobbyist', 'executive', 'manager'],
    priority: 1,
  },
  // Brief actions
  {
    id: 'create-brief',
    label: 'New Brief',
    labelAr: 'موجز جديد',
    icon: 'FileText',
    action: 'navigate',
    route: '/briefs/new',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    visibleTo: ['analyst', 'executive', 'manager'],
    priority: 2,
  },
  // Search
  {
    id: 'search',
    label: 'Search',
    labelAr: 'بحث',
    icon: 'Search',
    action: 'open-search',
    color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
    visibleTo: [
      'admin',
      'editor',
      'viewer',
      'analyst',
      'manager',
      'lobbyist',
      'executive',
      'intake_officer',
      'staff',
    ],
    priority: 10,
  },
  // View calendar
  {
    id: 'view-calendar',
    label: 'Calendar',
    labelAr: 'التقويم',
    icon: 'Calendar',
    action: 'navigate',
    route: '/calendar',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    visibleTo: ['admin', 'editor', 'analyst', 'manager', 'lobbyist', 'executive', 'staff'],
    priority: 5,
  },
  // Reports
  {
    id: 'view-reports',
    label: 'Reports',
    labelAr: 'التقارير',
    icon: 'BarChart2',
    action: 'navigate',
    route: '/reports',
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    visibleTo: ['admin', 'manager', 'executive', 'analyst'],
    priority: 6,
  },
  // My Work
  {
    id: 'my-work',
    label: 'My Work',
    labelAr: 'أعمالي',
    icon: 'Briefcase',
    action: 'navigate',
    route: '/my-work',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    visibleTo: ['editor', 'analyst', 'staff', 'intake_officer'],
    priority: 1,
  },
  // Team management
  {
    id: 'team-workload',
    label: 'Team Workload',
    labelAr: 'أعباء الفريق',
    icon: 'Users',
    action: 'navigate',
    route: '/my-work?view=team',
    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    visibleTo: ['manager', 'admin'],
    priority: 2,
  },
  // Approvals
  {
    id: 'pending-approvals',
    label: 'Approvals',
    labelAr: 'الموافقات',
    icon: 'CheckSquare',
    action: 'navigate',
    route: '/approvals',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    visibleTo: ['manager', 'admin', 'executive'],
    priority: 2,
    showWhen: 'has_pending_reviews',
  },
  // Intelligence
  {
    id: 'intelligence',
    label: 'Intelligence',
    labelAr: 'الاستخبارات',
    icon: 'Brain',
    action: 'navigate',
    route: '/intelligence',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    visibleTo: ['analyst', 'executive', 'manager'],
    priority: 3,
  },
  // Admin tools
  {
    id: 'system-settings',
    label: 'Settings',
    labelAr: 'الإعدادات',
    icon: 'Settings',
    action: 'navigate',
    route: '/admin/system',
    color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400',
    visibleTo: ['admin'],
    priority: 4,
  },
  // User management
  {
    id: 'user-management',
    label: 'Users',
    labelAr: 'المستخدمون',
    icon: 'UserCog',
    action: 'navigate',
    route: '/admin/users',
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    visibleTo: ['admin'],
    priority: 3,
  },
  // Intake queue
  {
    id: 'intake-queue',
    label: 'Intake Queue',
    labelAr: 'قائمة الاستقبال',
    icon: 'ClipboardList',
    action: 'navigate',
    route: '/intake',
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    visibleTo: ['intake_officer', 'admin'],
    priority: 1,
  },
]

// ============================================================================
// KPI Configurations by Role
// ============================================================================

const ADMIN_KPIS: RoleKpiConfig[] = [
  {
    metric: 'active-dossiers',
    titleKey: 'roleDashboard.kpis.totalDossiers',
    priority: 1,
    visibleTo: ['admin'],
    showTrend: true,
  },
  {
    metric: 'pending-tasks',
    titleKey: 'roleDashboard.kpis.systemTasks',
    priority: 2,
    visibleTo: ['admin'],
    showTrend: true,
  },
  {
    metric: 'sla-compliance',
    titleKey: 'roleDashboard.kpis.slaCompliance',
    priority: 3,
    visibleTo: ['admin'],
    showTrend: true,
    showTarget: true,
    targetValue: 95,
  },
  {
    metric: 'custom',
    titleKey: 'roleDashboard.kpis.activeUsers',
    priority: 4,
    visibleTo: ['admin'],
  },
]

const ANALYST_KPIS: RoleKpiConfig[] = [
  {
    metric: 'pending-tasks',
    titleKey: 'roleDashboard.kpis.assignedTasks',
    priority: 1,
    visibleTo: ['analyst'],
    showTrend: true,
  },
  {
    metric: 'active-dossiers',
    titleKey: 'roleDashboard.kpis.dossiersInProgress',
    priority: 2,
    visibleTo: ['analyst'],
  },
  {
    metric: 'completed-this-week',
    titleKey: 'roleDashboard.kpis.completedThisWeek',
    priority: 3,
    visibleTo: ['analyst'],
    showTrend: true,
  },
  {
    metric: 'response-rate',
    titleKey: 'roleDashboard.kpis.researchEfficiency',
    priority: 4,
    visibleTo: ['analyst'],
  },
]

const MANAGER_KPIS: RoleKpiConfig[] = [
  {
    metric: 'pending-tasks',
    titleKey: 'roleDashboard.kpis.teamPendingTasks',
    priority: 1,
    visibleTo: ['manager'],
    showTrend: true,
  },
  {
    metric: 'overdue-items',
    titleKey: 'roleDashboard.kpis.overdueItems',
    priority: 2,
    visibleTo: ['manager'],
    showTrend: true,
  },
  {
    metric: 'sla-compliance',
    titleKey: 'roleDashboard.kpis.teamSlaCompliance',
    priority: 3,
    visibleTo: ['manager'],
    showTarget: true,
    targetValue: 90,
  },
  {
    metric: 'custom',
    titleKey: 'roleDashboard.kpis.pendingApprovals',
    priority: 4,
    visibleTo: ['manager'],
  },
]

const EXECUTIVE_KPIS: RoleKpiConfig[] = [
  {
    metric: 'engagement-count',
    titleKey: 'roleDashboard.kpis.activePartners',
    priority: 1,
    visibleTo: ['executive'],
    showTrend: true,
  },
  {
    metric: 'custom',
    titleKey: 'roleDashboard.kpis.mouInWorkflow',
    priority: 2,
    visibleTo: ['executive'],
  },
  {
    metric: 'custom',
    titleKey: 'roleDashboard.kpis.upcomingMissions',
    priority: 3,
    visibleTo: ['executive'],
  },
  {
    metric: 'sla-compliance',
    titleKey: 'roleDashboard.kpis.overallCompliance',
    priority: 4,
    visibleTo: ['executive'],
    showTarget: true,
    targetValue: 95,
  },
]

const LOBBYIST_KPIS: RoleKpiConfig[] = [
  {
    metric: 'engagement-count',
    titleKey: 'roleDashboard.kpis.upcomingEngagements',
    priority: 1,
    visibleTo: ['lobbyist'],
    showTrend: true,
  },
  {
    metric: 'pending-tasks',
    titleKey: 'roleDashboard.kpis.pendingFollowUps',
    priority: 2,
    visibleTo: ['lobbyist'],
  },
  {
    metric: 'custom',
    titleKey: 'roleDashboard.kpis.activeRelationships',
    priority: 3,
    visibleTo: ['lobbyist'],
  },
  {
    metric: 'response-rate',
    titleKey: 'roleDashboard.kpis.engagementSuccess',
    priority: 4,
    visibleTo: ['lobbyist'],
    showTrend: true,
  },
]

const INTAKE_OFFICER_KPIS: RoleKpiConfig[] = [
  {
    metric: 'intake-volume',
    titleKey: 'roleDashboard.kpis.pendingIntake',
    priority: 1,
    visibleTo: ['intake_officer'],
    showTrend: true,
  },
  {
    metric: 'completed-this-week',
    titleKey: 'roleDashboard.kpis.processedToday',
    priority: 2,
    visibleTo: ['intake_officer'],
  },
  {
    metric: 'sla-compliance',
    titleKey: 'roleDashboard.kpis.slaCompliance',
    priority: 3,
    visibleTo: ['intake_officer'],
    showTarget: true,
    targetValue: 95,
  },
  {
    metric: 'overdue-items',
    titleKey: 'roleDashboard.kpis.backlogSize',
    priority: 4,
    visibleTo: ['intake_officer'],
  },
]

// ============================================================================
// Dashboard Sections by Role
// ============================================================================

const COMMON_SECTIONS: DashboardSection[] = [
  {
    id: 'quick-actions',
    titleKey: 'roleDashboard.sections.quickActions',
    order: 1,
    visibleTo: [
      'admin',
      'editor',
      'viewer',
      'analyst',
      'manager',
      'lobbyist',
      'executive',
      'intake_officer',
      'staff',
    ],
  },
  {
    id: 'kpis',
    titleKey: 'roleDashboard.sections.keyMetrics',
    order: 2,
    visibleTo: ['admin', 'editor', 'analyst', 'manager', 'lobbyist', 'executive', 'intake_officer'],
  },
]

const ADMIN_SECTIONS: DashboardSection[] = [
  ...COMMON_SECTIONS,
  {
    id: 'system-health',
    titleKey: 'roleDashboard.sections.systemHealth',
    order: 3,
    visibleTo: ['admin'],
  },
  {
    id: 'recent-activity',
    titleKey: 'roleDashboard.sections.recentActivity',
    order: 4,
    visibleTo: ['admin'],
    isCollapsible: true,
  },
  {
    id: 'pending-approvals',
    titleKey: 'roleDashboard.sections.pendingApprovals',
    order: 5,
    visibleTo: ['admin'],
  },
]

const ANALYST_SECTIONS: DashboardSection[] = [
  ...COMMON_SECTIONS,
  {
    id: 'my-assignments',
    titleKey: 'roleDashboard.sections.myAssignments',
    order: 3,
    visibleTo: ['analyst'],
  },
  {
    id: 'research-queue',
    titleKey: 'roleDashboard.sections.researchQueue',
    order: 4,
    visibleTo: ['analyst'],
  },
  {
    id: 'recent-briefs',
    titleKey: 'roleDashboard.sections.recentBriefs',
    order: 5,
    visibleTo: ['analyst'],
    isCollapsible: true,
  },
]

const MANAGER_SECTIONS: DashboardSection[] = [
  ...COMMON_SECTIONS,
  {
    id: 'team-workload',
    titleKey: 'roleDashboard.sections.teamWorkload',
    order: 3,
    visibleTo: ['manager'],
  },
  {
    id: 'pending-reviews',
    titleKey: 'roleDashboard.sections.pendingReviews',
    order: 4,
    visibleTo: ['manager'],
  },
  {
    id: 'escalations',
    titleKey: 'roleDashboard.sections.escalations',
    order: 5,
    visibleTo: ['manager'],
  },
]

const EXECUTIVE_SECTIONS: DashboardSection[] = [
  ...COMMON_SECTIONS,
  {
    id: 'strategic-overview',
    titleKey: 'roleDashboard.sections.strategicOverview',
    order: 3,
    visibleTo: ['executive'],
  },
  {
    id: 'upcoming-missions',
    titleKey: 'roleDashboard.sections.upcomingMissions',
    order: 4,
    visibleTo: ['executive'],
  },
  {
    id: 'intelligence-highlights',
    titleKey: 'roleDashboard.sections.intelligenceHighlights',
    order: 5,
    visibleTo: ['executive'],
  },
  {
    id: 'alerts',
    titleKey: 'roleDashboard.sections.highPriorityAlerts',
    order: 6,
    visibleTo: ['executive'],
  },
]

const LOBBYIST_SECTIONS: DashboardSection[] = [
  ...COMMON_SECTIONS,
  {
    id: 'upcoming-engagements',
    titleKey: 'roleDashboard.sections.upcomingEngagements',
    order: 3,
    visibleTo: ['lobbyist'],
  },
  {
    id: 'follow-ups',
    titleKey: 'roleDashboard.sections.pendingFollowUps',
    order: 4,
    visibleTo: ['lobbyist'],
  },
  {
    id: 'relationship-health',
    titleKey: 'roleDashboard.sections.relationshipHealth',
    order: 5,
    visibleTo: ['lobbyist'],
  },
]

const INTAKE_OFFICER_SECTIONS: DashboardSection[] = [
  ...COMMON_SECTIONS,
  {
    id: 'intake-queue',
    titleKey: 'roleDashboard.sections.intakeQueue',
    order: 3,
    visibleTo: ['intake_officer'],
  },
  {
    id: 'processing',
    titleKey: 'roleDashboard.sections.currentlyProcessing',
    order: 4,
    visibleTo: ['intake_officer'],
  },
  {
    id: 'sla-tracker',
    titleKey: 'roleDashboard.sections.slaTracker',
    order: 5,
    visibleTo: ['intake_officer'],
  },
]

// ============================================================================
// Entity Focus by Role
// ============================================================================

const ADMIN_ENTITIES: EntityFocus[] = [
  {
    entityType: 'dossier',
    priority: 1,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'task',
    priority: 2,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'intake',
    priority: 3,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
]

const ANALYST_ENTITIES: EntityFocus[] = [
  {
    entityType: 'dossier',
    priority: 1,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'brief',
    priority: 2,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'task',
    priority: 3,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
]

const MANAGER_ENTITIES: EntityFocus[] = [
  {
    entityType: 'task',
    priority: 1,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'commitment',
    priority: 2,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: false,
  },
  {
    entityType: 'dossier',
    priority: 3,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
]

const EXECUTIVE_ENTITIES: EntityFocus[] = [
  {
    entityType: 'engagement',
    priority: 1,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: false,
  },
  {
    entityType: 'mou',
    priority: 2,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: false,
  },
  {
    entityType: 'brief',
    priority: 3,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: false,
  },
]

const LOBBYIST_ENTITIES: EntityFocus[] = [
  {
    entityType: 'engagement',
    priority: 1,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'calendar_event',
    priority: 2,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'commitment',
    priority: 3,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
]

const INTAKE_OFFICER_ENTITIES: EntityFocus[] = [
  {
    entityType: 'intake',
    priority: 1,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'task',
    priority: 2,
    showInSidebar: true,
    showInDashboard: true,
    quickCreateEnabled: true,
  },
  {
    entityType: 'document',
    priority: 3,
    showInSidebar: true,
    showInDashboard: false,
    quickCreateEnabled: false,
  },
]

// ============================================================================
// Feature Flags by Role
// ============================================================================

const DEFAULT_FEATURES: RoleDashboardFeatures = {
  showOnboarding: true,
  showQuickActions: true,
  showKpis: true,
  showRecentActivity: true,
  showUpcomingEvents: true,
  showNotifications: true,
  showTeamWorkload: false,
  showRecommendations: false,
  showIntelligence: false,
  showAlerts: false,
}

const ADMIN_FEATURES: RoleDashboardFeatures = {
  ...DEFAULT_FEATURES,
  showTeamWorkload: true,
  showAlerts: true,
}

const ANALYST_FEATURES: RoleDashboardFeatures = {
  ...DEFAULT_FEATURES,
  showIntelligence: true,
  showRecommendations: true,
}

const MANAGER_FEATURES: RoleDashboardFeatures = {
  ...DEFAULT_FEATURES,
  showTeamWorkload: true,
  showAlerts: true,
}

const EXECUTIVE_FEATURES: RoleDashboardFeatures = {
  ...DEFAULT_FEATURES,
  showIntelligence: true,
  showAlerts: true,
  showRecommendations: true,
  showTeamWorkload: true,
}

const LOBBYIST_FEATURES: RoleDashboardFeatures = {
  ...DEFAULT_FEATURES,
  showRecommendations: true,
}

const INTAKE_OFFICER_FEATURES: RoleDashboardFeatures = {
  ...DEFAULT_FEATURES,
  showAlerts: true,
}

// ============================================================================
// Complete Role Configurations
// ============================================================================

export const ROLE_DASHBOARD_CONFIGS: Record<DashboardRole, RoleDashboardConfig> = {
  admin: {
    role: 'admin',
    titleKey: 'roleDashboard.admin.title',
    subtitleKey: 'roleDashboard.admin.subtitle',
    welcomeMessageKey: 'roleDashboard.admin.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('admin')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: ADMIN_KPIS,
    sections: ADMIN_SECTIONS,
    primaryEntities: ADMIN_ENTITIES,
    features: ADMIN_FEATURES,
  },
  analyst: {
    role: 'analyst',
    titleKey: 'roleDashboard.analyst.title',
    subtitleKey: 'roleDashboard.analyst.subtitle',
    welcomeMessageKey: 'roleDashboard.analyst.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('analyst')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: ANALYST_KPIS,
    sections: ANALYST_SECTIONS,
    primaryEntities: ANALYST_ENTITIES,
    features: ANALYST_FEATURES,
  },
  manager: {
    role: 'manager',
    titleKey: 'roleDashboard.manager.title',
    subtitleKey: 'roleDashboard.manager.subtitle',
    welcomeMessageKey: 'roleDashboard.manager.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('manager')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: MANAGER_KPIS,
    sections: MANAGER_SECTIONS,
    primaryEntities: MANAGER_ENTITIES,
    features: MANAGER_FEATURES,
  },
  executive: {
    role: 'executive',
    titleKey: 'roleDashboard.executive.title',
    subtitleKey: 'roleDashboard.executive.subtitle',
    welcomeMessageKey: 'roleDashboard.executive.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('executive')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: EXECUTIVE_KPIS,
    sections: EXECUTIVE_SECTIONS,
    primaryEntities: EXECUTIVE_ENTITIES,
    features: EXECUTIVE_FEATURES,
  },
  lobbyist: {
    role: 'lobbyist',
    titleKey: 'roleDashboard.lobbyist.title',
    subtitleKey: 'roleDashboard.lobbyist.subtitle',
    welcomeMessageKey: 'roleDashboard.lobbyist.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('lobbyist')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: LOBBYIST_KPIS,
    sections: LOBBYIST_SECTIONS,
    primaryEntities: LOBBYIST_ENTITIES,
    features: LOBBYIST_FEATURES,
  },
  intake_officer: {
    role: 'intake_officer',
    titleKey: 'roleDashboard.intakeOfficer.title',
    subtitleKey: 'roleDashboard.intakeOfficer.subtitle',
    welcomeMessageKey: 'roleDashboard.intakeOfficer.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('intake_officer')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: INTAKE_OFFICER_KPIS,
    sections: INTAKE_OFFICER_SECTIONS,
    primaryEntities: INTAKE_OFFICER_ENTITIES,
    features: INTAKE_OFFICER_FEATURES,
  },
  editor: {
    role: 'editor',
    titleKey: 'roleDashboard.editor.title',
    subtitleKey: 'roleDashboard.editor.subtitle',
    welcomeMessageKey: 'roleDashboard.editor.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('editor')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: ANALYST_KPIS.map((k) => ({ ...k, visibleTo: ['editor'] })),
    sections: ANALYST_SECTIONS.map((s) => ({ ...s, visibleTo: ['editor'] })),
    primaryEntities: ANALYST_ENTITIES,
    features: DEFAULT_FEATURES,
  },
  viewer: {
    role: 'viewer',
    titleKey: 'roleDashboard.viewer.title',
    subtitleKey: 'roleDashboard.viewer.subtitle',
    welcomeMessageKey: 'roleDashboard.viewer.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('viewer')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: [],
    sections: COMMON_SECTIONS.filter((s) => s.id === 'quick-actions'),
    primaryEntities: [
      {
        entityType: 'dossier',
        priority: 1,
        showInSidebar: true,
        showInDashboard: true,
        quickCreateEnabled: false,
      },
    ],
    features: { ...DEFAULT_FEATURES, showKpis: false, showRecentActivity: false },
  },
  staff: {
    role: 'staff',
    titleKey: 'roleDashboard.staff.title',
    subtitleKey: 'roleDashboard.staff.subtitle',
    welcomeMessageKey: 'roleDashboard.staff.welcome',
    quickActions: ROLE_QUICK_ACTIONS.filter((a) => a.visibleTo.includes('staff')).sort(
      (a, b) => a.priority - b.priority,
    ),
    kpis: [
      {
        metric: 'pending-tasks',
        titleKey: 'roleDashboard.kpis.myTasks',
        priority: 1,
        visibleTo: ['staff'],
        showTrend: true,
      },
      {
        metric: 'overdue-items',
        titleKey: 'roleDashboard.kpis.overdueItems',
        priority: 2,
        visibleTo: ['staff'],
      },
    ],
    sections: [
      ...COMMON_SECTIONS,
      { id: 'my-work', titleKey: 'roleDashboard.sections.myWork', order: 3, visibleTo: ['staff'] },
    ],
    primaryEntities: [
      {
        entityType: 'task',
        priority: 1,
        showInSidebar: true,
        showInDashboard: true,
        quickCreateEnabled: true,
      },
    ],
    features: DEFAULT_FEATURES,
  },
}

/**
 * Get dashboard configuration for a role
 */
export function getRoleDashboardConfig(role: DashboardRole): RoleDashboardConfig {
  return ROLE_DASHBOARD_CONFIGS[role] || ROLE_DASHBOARD_CONFIGS.staff
}

/**
 * Get quick actions for a role
 */
export function getQuickActionsForRole(role: DashboardRole): RoleQuickAction[] {
  return ROLE_QUICK_ACTIONS.filter((action) => action.visibleTo.includes(role)).sort(
    (a, b) => a.priority - b.priority,
  )
}

/**
 * Map system user role to dashboard role
 */
export function mapUserRoleToDashboardRole(userRole: string | undefined): DashboardRole {
  const roleMap: Record<string, DashboardRole> = {
    admin: 'admin',
    super_admin: 'admin',
    editor: 'editor',
    viewer: 'viewer',
    analyst: 'analyst',
    manager: 'manager',
    executive: 'executive',
    lobbyist: 'lobbyist',
    intake_officer: 'intake_officer',
    staff: 'staff',
  }
  return roleMap[userRole?.toLowerCase() || 'staff'] || 'staff'
}
