/**
 * RoleDashboard Component
 *
 * Main role-specific dashboard component that renders personalized content
 * based on user role. Surfaces relevant entities, pending actions, and shortcuts.
 * Mobile-first with RTL support.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  BarChart2,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoleBasedDashboard } from '@/hooks/useRoleBasedDashboard'
import { RoleQuickActions } from './RoleQuickActions'
import { PendingActionsWidget } from './PendingActionsWidget'
import { WorkloadSummaryWidget } from './WorkloadSummaryWidget'
import type { RoleDashboardProps, DashboardRole } from '@/types/role-dashboard.types'

/**
 * Role-specific welcome section
 */
function WelcomeSection({
  role,
  userName,
  isRTL,
}: {
  role: DashboardRole
  userName: string
  isRTL: boolean
}) {
  const { t } = useTranslation('role-dashboard')
  const config = useRoleBasedDashboard({ roleOverride: role }).config

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greetings.morning')
    if (hour < 17) return t('greetings.afternoon')
    return t('greetings.evening')
  }

  return (
    <section className="flex flex-col gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
          {getGreeting()}, {userName}
        </h1>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
        {config ? t(config.subtitleKey) : t('roleDashboard.generic.subtitle')}
      </p>
    </section>
  )
}

/**
 * KPI Grid component for role-specific metrics
 */
function KpiGrid({ role, isRTL }: { role: DashboardRole; isRTL: boolean }) {
  const { t } = useTranslation('role-dashboard')

  // Mock KPI data based on role
  const kpis = useMemo(() => {
    const baseKpis = {
      admin: [
        { label: t('kpis.totalDossiers'), value: '156', change: '+12%', trend: 'up' },
        { label: t('kpis.activeUsers'), value: '312', change: '+5%', trend: 'up' },
        { label: t('kpis.systemHealth'), value: '99.8%', change: '', trend: 'neutral' },
        { label: t('kpis.pendingApprovals'), value: '8', change: '-3', trend: 'down' },
      ],
      analyst: [
        { label: t('kpis.assignedDossiers'), value: '12', change: '+2', trend: 'up' },
        { label: t('kpis.briefsInProgress'), value: '4', change: '', trend: 'neutral' },
        { label: t('kpis.completedThisWeek'), value: '7', change: '+3', trend: 'up' },
        { label: t('kpis.researchQueue'), value: '5', change: '-1', trend: 'down' },
      ],
      manager: [
        { label: t('kpis.teamTasks'), value: '45', change: '+8%', trend: 'up' },
        { label: t('kpis.overdueItems'), value: '3', change: '-2', trend: 'down' },
        { label: t('kpis.teamUtilization'), value: '87%', change: '+5%', trend: 'up' },
        { label: t('kpis.pendingReviews'), value: '6', change: '', trend: 'neutral' },
      ],
      executive: [
        { label: t('kpis.activePartners'), value: '64', change: '+4', trend: 'up' },
        { label: t('kpis.mouInWorkflow'), value: '28', change: '', trend: 'neutral' },
        { label: t('kpis.upcomingMissions'), value: '17', change: '+2', trend: 'up' },
        { label: t('kpis.overallCompliance'), value: '95%', change: '+2%', trend: 'up' },
      ],
      lobbyist: [
        { label: t('kpis.upcomingMeetings'), value: '8', change: '+3', trend: 'up' },
        { label: t('kpis.pendingFollowUps'), value: '12', change: '-2', trend: 'down' },
        { label: t('kpis.activeRelationships'), value: '34', change: '+5', trend: 'up' },
        { label: t('kpis.engagementRate'), value: '78%', change: '+8%', trend: 'up' },
      ],
      intake_officer: [
        { label: t('kpis.pendingIntake'), value: '15', change: '+3', trend: 'up' },
        { label: t('kpis.processedToday'), value: '8', change: '', trend: 'neutral' },
        { label: t('kpis.slaCompliance'), value: '96%', change: '+1%', trend: 'up' },
        { label: t('kpis.avgResponseTime'), value: '2.4h', change: '-0.3h', trend: 'down' },
      ],
    }
    return baseKpis[role as keyof typeof baseKpis] || baseKpis.analyst
  }, [role, t])

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {kpis.map((kpi, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{kpi.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{kpi.value}</p>
              {kpi.change && (
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-medium',
                    kpi.trend === 'up'
                      ? 'text-green-600'
                      : kpi.trend === 'down'
                        ? 'text-red-600'
                        : 'text-muted-foreground',
                  )}
                >
                  {kpi.change}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Role-specific shortcuts section
 */
function ShortcutsSection({ role, isRTL }: { role: DashboardRole; isRTL: boolean }) {
  const { t } = useTranslation('role-dashboard')

  const shortcuts = useMemo((): Array<{
    label: string
    route: string
    icon: typeof FileText
    count?: number
  }> => {
    const roleShortcuts: Record<
      string,
      Array<{ label: string; route: string; icon: typeof FileText; count?: number }>
    > = {
      admin: [
        { label: t('shortcuts.userManagement'), route: '/admin/users', icon: Users, count: 5 },
        { label: t('shortcuts.systemSettings'), route: '/admin/system', icon: BarChart2 },
        { label: t('shortcuts.auditLogs'), route: '/admin/audit-logs', icon: FileText },
        {
          label: t('shortcuts.pendingApprovals'),
          route: '/approvals',
          icon: CheckCircle2,
          count: 8,
        },
      ],
      analyst: [
        {
          label: t('shortcuts.myDossiers'),
          route: '/dossiers?assigned=me',
          icon: FileText,
          count: 12,
        },
        {
          label: t('shortcuts.researchQueue'),
          route: '/briefs?status=draft',
          icon: Clock,
          count: 5,
        },
        { label: t('shortcuts.intelligence'), route: '/intelligence', icon: TrendingUp },
        { label: t('shortcuts.calendar'), route: '/calendar', icon: Calendar },
      ],
      manager: [
        { label: t('shortcuts.teamWorkload'), route: '/my-work?view=team', icon: Users },
        { label: t('shortcuts.pendingReviews'), route: '/approvals', icon: CheckCircle2, count: 6 },
        { label: t('shortcuts.reports'), route: '/reports', icon: BarChart2 },
        { label: t('shortcuts.escalations'), route: '/escalations', icon: AlertTriangle, count: 2 },
      ],
      executive: [
        { label: t('shortcuts.strategicOverview'), route: '/reports/strategic', icon: TrendingUp },
        {
          label: t('shortcuts.upcomingMissions'),
          route: '/calendar?filter=missions',
          icon: Calendar,
          count: 17,
        },
        { label: t('shortcuts.intelligenceBriefs'), route: '/briefs', icon: FileText },
        { label: t('shortcuts.partnerHealth'), route: '/relationships', icon: Users },
      ],
      lobbyist: [
        {
          label: t('shortcuts.upcomingEngagements'),
          route: '/engagements?upcoming=true',
          icon: Calendar,
          count: 8,
        },
        {
          label: t('shortcuts.followUps'),
          route: '/commitments?type=follow_up',
          icon: Clock,
          count: 12,
        },
        { label: t('shortcuts.contacts'), route: '/persons', icon: Users },
        { label: t('shortcuts.recommendations'), route: '/recommendations', icon: Sparkles },
      ],
      intake_officer: [
        {
          label: t('shortcuts.intakeQueue'),
          route: '/intake?status=pending',
          icon: FileText,
          count: 15,
        },
        {
          label: t('shortcuts.processing'),
          route: '/intake?status=processing',
          icon: Clock,
          count: 3,
        },
        { label: t('shortcuts.slaTracker'), route: '/sla-monitoring', icon: AlertTriangle },
        { label: t('shortcuts.completed'), route: '/intake?status=completed', icon: CheckCircle2 },
      ],
    }
    return roleShortcuts[role] ?? roleShortcuts.analyst ?? []
  }, [role, t])

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{t('shortcuts.title')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('shortcuts.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {shortcuts.map((shortcut, index) => {
            const Icon = shortcut.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto flex-col gap-1.5 p-3 sm:p-4"
                onClick={() => {
                  window.location.href = shortcut.route
                }}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 text-primary" />
                  {shortcut.count !== undefined && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -end-2 h-4 min-w-4 px-1 text-[10px]"
                    >
                      {shortcut.count}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-center line-clamp-1">
                  {shortcut.label}
                </span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

/**
 * Main RoleDashboard component
 */
export function RoleDashboard({ roleOverride, onLoad, onError, className }: RoleDashboardProps) {
  const { t, i18n } = useTranslation('role-dashboard')
  const isRTL = i18n.language === 'ar'

  const { dashboardRole, config, quickActions, pendingActions, workload, isLoading, error } =
    useRoleBasedDashboard({ roleOverride, autoFetch: true })

  // Get user name from auth (mock for now)
  const userName = 'User' // In production: useAuth().user?.name || 'User'

  // Handle load callback
  if (!isLoading && config && onLoad) {
    onLoad()
  }

  // Handle error callback
  if (error && onError) {
    onError(new Error(error))
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold text-foreground">{t('error.title')}</h2>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          {t('error.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Welcome Section */}
      <WelcomeSection role={dashboardRole} userName={userName} isRTL={isRTL} />

      {/* Quick Actions */}
      {config?.features.showQuickActions && quickActions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">{t('quickActions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleQuickActions actions={quickActions} maxVisible={6} />
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {config?.features.showKpis && <KpiGrid role={dashboardRole} isRTL={isRTL} />}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Actions - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          <PendingActionsWidget
            actions={pendingActions}
            maxItems={5}
            showViewAll={true}
            onActionClick={(action) => {
              window.location.href = action.route
            }}
            onViewAll={() => {
              window.location.href = '/my-work'
            }}
          />

          {/* Role-specific shortcuts */}
          <ShortcutsSection role={dashboardRole} isRTL={isRTL} />
        </div>

        {/* Workload Summary - 1 column on desktop */}
        <div className="space-y-6">
          {workload && (
            <WorkloadSummaryWidget
              workload={workload}
              showBreakdown={true}
              onCategoryClick={(category) => {
                window.location.href = `/my-work?filter=${category}`
              }}
            />
          )}

          {/* Upcoming Events Card */}
          {config?.features.showUpcomingEvents && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {t('upcomingEvents.title')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/calendar'
                  }}
                >
                  {t('common.viewAll')}
                  <ArrowRight className={cn('h-3 w-3 ms-1', isRTL && 'rotate-180')} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Mock upcoming events */}
                  {[
                    { title: 'GCC Statistics Forum', time: 'Tomorrow, 10:00 AM', type: 'meeting' },
                    { title: 'MoU Review Deadline', time: 'Wed, 2:00 PM', type: 'deadline' },
                    { title: 'OECD Briefing Call', time: 'Thu, 9:00 AM', type: 'call' },
                  ].map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleDashboard
