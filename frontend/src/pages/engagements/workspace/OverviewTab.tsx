/**
 * OverviewTab — Engagement summary dashboard (D-01)
 *
 * Landing view showing engagement health at a glance:
 * - 4 metric cards (current stage, days in stage, task progress, deadline)
 * - Participants list
 * - Recent activity feed (lifecycle transitions)
 * - Quick action buttons
 *
 * Mobile-first, RTL-safe, logical properties only.
 */

import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from '@tanstack/react-router'
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Users,
} from 'lucide-react'
import { useDirection } from '@/hooks/useDirection'
import { useEngagement, useEngagementParticipants } from '@/domains/engagements/hooks/useEngagements'
import { useEngagementKanban } from '@/domains/engagements/hooks/useEngagementKanban'
import { useLifecycleHistory } from '@/domains/engagements/hooks/useLifecycle'
import { LIFECYCLE_STAGE_LABELS } from '@/types/lifecycle.types'
import type { LifecycleStage, LifecycleTransition } from '@/types/lifecycle.types'
import type { EngagementParticipant } from '@/types/engagement.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// Helpers
// ============================================================================

function computeDaysInStage(transitions: LifecycleTransition[] | undefined): number {
  if (transitions == null || transitions.length === 0) return 0
  const sorted = [...transitions].sort(
    (a, b) => new Date(b.transitioned_at).getTime() - new Date(a.transitioned_at).getTime(),
  )
  const lastTransition = sorted[0]
  if (lastTransition == null) return 0
  return Math.floor(
    (Date.now() - new Date(lastTransition.transitioned_at).getTime()) / 86_400_000,
  )
}

function formatDate(dateStr: string | undefined | null, locale: string): string {
  if (dateStr == null || dateStr === '') return '--'
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatRelativeDate(dateStr: string, locale: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86_400_000)
    if (diffDays === 0) return locale === 'ar' ? 'اليوم' : 'Today'
    if (diffDays === 1) return locale === 'ar' ? 'أمس' : 'Yesterday'
    return formatDate(dateStr, locale)
  } catch {
    return dateStr
  }
}

function getParticipantDisplayName(
  participant: EngagementParticipant,
  isRTL: boolean,
): string {
  if (participant.dossier != null) {
    return isRTL
      ? (participant.dossier.name_ar ?? participant.dossier.name_en)
      : participant.dossier.name_en
  }
  return isRTL
    ? (participant.external_name_ar ?? participant.external_name_en ?? '')
    : (participant.external_name_en ?? '')
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

// ============================================================================
// Component
// ============================================================================

export default function OverviewTab(): ReactElement {
  const { engagementId } = useParams({
    from: '/_protected/engagements/$engagementId',
  })
  const { t, i18n } = useTranslation('workspace')
  const { direction, isRTL } = useDirection()
  const locale = i18n.language

  // Data fetching
  const { data: profile, isLoading: profileLoading } = useEngagement(engagementId)
  const { data: participantsData, isLoading: participantsLoading } =
    useEngagementParticipants(engagementId)
  const { stats, isLoading: kanbanLoading } = useEngagementKanban(engagementId)
  const { data: lifecycleHistory, isLoading: historyLoading } =
    useLifecycleHistory(engagementId)

  const engagement = profile?.engagement
  const participants: EngagementParticipant[] = useMemo(() => {
    if (participantsData == null) return []
    const raw = participantsData as { data?: EngagementParticipant[] }
    return raw.data ?? []
  }, [participantsData])

  const daysInStage = useMemo(
    () => computeDaysInStage(lifecycleHistory),
    [lifecycleHistory],
  )

  const recentTransitions = useMemo(() => {
    if (lifecycleHistory == null) return []
    return [...lifecycleHistory]
      .sort(
        (a, b) =>
          new Date(b.transitioned_at).getTime() - new Date(a.transitioned_at).getTime(),
      )
      .slice(0, 5)
  }, [lifecycleHistory])

  const currentStageLabel = useMemo((): string => {
    const stage = engagement?.lifecycle_stage as LifecycleStage | undefined
    if (stage == null) return '--'
    const labels = LIFECYCLE_STAGE_LABELS[stage]
    return isRTL ? labels.ar : labels.en
  }, [engagement?.lifecycle_stage, isRTL])

  const isLoading = profileLoading || kanbanLoading || historyLoading

  return (
    <div dir={direction} className="space-y-6">
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Stage */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {t('overview.currentStage')}
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-24" />
              ) : (
                <p className="text-xl font-semibold truncate">{currentStageLabel}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Days in Stage */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <Clock className="size-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {t('overview.daysInStage')}
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-12" />
              ) : (
                <p className="text-xl font-semibold">{daysInStage}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Progress */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {t('overview.taskProgress')}
              </p>
              {kanbanLoading ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <>
                  <p className="text-xl font-semibold">{stats.progressPercentage}%</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.done}/{stats.total}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deadline */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {t('overview.deadline')}
              </p>
              {profileLoading ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="text-xl font-semibold truncate">
                  {formatDate(engagement?.end_date, locale)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column section: Participants + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participants */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Users className="size-5" />
              {t('overview.participants')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participantsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'لم يتم إضافة مشاركين بعد' : 'No participants added yet'}
              </p>
            ) : (
              participants.map((participant) => {
                const name = getParticipantDisplayName(participant, isRTL)
                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 min-h-11"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {participant.role}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Activity className="size-5" />
              {t('overview.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : recentTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'لا يوجد نشاط بعد' : 'No activity yet'}
              </p>
            ) : (
              recentTransitions.map((transition) => {
                const stageLabels =
                  LIFECYCLE_STAGE_LABELS[transition.to_stage as LifecycleStage]
                const stageLabel = isRTL ? stageLabels?.ar : stageLabels?.en
                return (
                  <div
                    key={transition.id}
                    className={cn(
                      'border-s-2 border-primary/30 ps-3 py-1',
                    )}
                  >
                    <p className="text-sm">
                      <span className="font-medium">
                        {transition.user_name ?? (isRTL ? 'النظام' : 'System')}
                      </span>
                      {' '}
                      <span className="text-muted-foreground">
                        {isRTL ? 'انتقل إلى' : 'transitioned to'}
                      </span>
                      {' '}
                      <span className="font-medium">{stageLabel}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(transition.transitioned_at, locale)}
                    </p>
                    {transition.note != null && transition.note !== '' && (
                      <p className="mt-0.5 text-xs text-muted-foreground italic truncate">
                        {transition.note}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">
            {t('overview.quickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" className="min-h-11 min-w-11">
              {t('actions.transitionStage')}
            </Button>
            <Button variant="outline" className="min-h-11 min-w-11" asChild>
              <Link
                to="/engagements/$engagementId/after-action"
                params={{ engagementId }}
              >
                {t('actions.logAfterAction')}
              </Link>
            </Button>
            <Button variant="outline" className="min-h-11 min-w-11">
              <Plus className="size-4" />
              {t('actions.createTask')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
