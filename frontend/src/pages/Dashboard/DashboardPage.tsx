/**
 * DashboardPage Component
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Redesigned dashboard organized around dossier activity instead of generic metrics.
 * Includes:
 * - My Dossiers section with activity badges
 * - Recent Dossier Activity timeline
 * - Pending Work by Dossier grouping
 * - Quick stats summary
 *
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MyDossiersSection,
  RecentDossierActivity,
  PendingWorkByDossier,
} from '@/components/Dashboard'
import { useDossierDashboardSummary } from '@/hooks/useDossierDashboard'
import { RecommendationsPanel } from '@/components/engagement-recommendations'

// =============================================================================
// Component
// =============================================================================

export function DashboardPage() {
  const { t, i18n } = useTranslation(['dossier-dashboard', 'dashboard'])
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Fetch dashboard summary
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useDossierDashboardSummary()

  return (
    <div className="w-full space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t('dossier-dashboard:header.title', 'Dossier Dashboard')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          {t(
            'dossier-dashboard:header.subtitle',
            'Your dossiers, activities, and pending work at a glance.',
          )}
        </p>
      </section>

      {/* Quick Stats Summary */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <QuickStatCard
          icon={FolderKanban}
          label={t('dossier-dashboard:summary.myDossiers', 'My Dossiers')}
          value={summary?.total_dossiers ?? 0}
          subValue={
            summary?.owned_dossiers
              ? t('dossier-dashboard:summary.owned', '{{count}} owned', {
                  count: summary.owned_dossiers,
                })
              : undefined
          }
          isLoading={summaryLoading}
          variant="primary"
        />
        <QuickStatCard
          icon={Activity}
          label={t('dossier-dashboard:summary.activeDossiers', 'Active This Week')}
          value={summary?.active_dossiers ?? 0}
          isLoading={summaryLoading}
          variant="success"
        />
        <QuickStatCard
          icon={Clock}
          label={t('dossier-dashboard:summary.pendingWork', 'Pending Work')}
          value={summary?.total_pending_work ?? 0}
          subValue={
            summary?.due_today
              ? t('dossier-dashboard:summary.dueToday', '{{count}} due today', {
                  count: summary.due_today,
                })
              : undefined
          }
          isLoading={summaryLoading}
          variant="warning"
        />
        <QuickStatCard
          icon={AlertTriangle}
          label={t('dossier-dashboard:summary.needsAttention', 'Needs Attention')}
          value={summary?.attention_needed ?? 0}
          subValue={
            summary?.total_overdue
              ? t('dossier-dashboard:summary.overdue', '{{count}} overdue', {
                  count: summary.total_overdue,
                })
              : undefined
          }
          isLoading={summaryLoading}
          variant={summary?.attention_needed ? 'danger' : 'muted'}
        />
      </section>

      {/* My Dossiers Section */}
      <MyDossiersSection
        maxItems={6}
        showViewAll={true}
        onViewAll={() => navigate({ to: '/dossiers' })}
      />

      {/* Activity and Pending Work Grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Recent Dossier Activity */}
        <RecentDossierActivity maxItems={10} maxHeight="450px" showDossierBadges={true} />

        {/* Pending Work by Dossier */}
        <PendingWorkByDossier maxDossiers={5} defaultExpanded={false} />
      </section>

      {/* AI Recommendations Panel */}
      <section className="grid gap-6 lg:grid-cols-3">
        <RecommendationsPanel
          showStats={true}
          maxItems={3}
          onViewAll={() => navigate({ to: '/engagements' })}
          className="lg:col-span-1"
        />

        {/* Dossiers Needing Review */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              {t('dossier-dashboard:review.title', 'Due for Review')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <CheckCircle2 className="size-10 mb-3 text-muted-foreground/50" />
              <p className="text-sm">
                {t('dossier-dashboard:review.empty', 'No dossiers scheduled for review')}
              </p>
              <p className="text-xs mt-1">
                {t('dossier-dashboard:review.hint', 'Dossiers with review dates will appear here')}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

// =============================================================================
// QuickStatCard Sub-component
// =============================================================================

interface QuickStatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  subValue?: string
  isLoading?: boolean
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted'
}

function QuickStatCard({
  icon: Icon,
  label,
  value,
  subValue,
  isLoading,
  variant = 'primary',
}: QuickStatCardProps) {
  const { i18n } = useTranslation()

  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    muted: 'bg-muted text-muted-foreground',
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center size-10 rounded-lg shrink-0',
              variantStyles[variant],
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold">{value.toLocaleString(i18n.language)}</p>
            {subValue && <p className="text-xs text-muted-foreground truncate">{subValue}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardPage
