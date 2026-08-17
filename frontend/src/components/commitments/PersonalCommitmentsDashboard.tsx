/**
 * PersonalCommitmentsDashboard Component v1.1
 * Feature: 031-commitments-management
 *
 * Dashboard showing user's commitments with quick status updates
 * Mobile-first, RTL-compatible, accessible
 */

import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { CommitmentsList } from './CommitmentsList'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryErrorState } from '@/components/error-states/QueryErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import type { CommitmentStatus } from '@/types/commitment.types'

export function PersonalCommitmentsDashboard() {
  const { t } = useTranslation('commitments')
  // Get current user ID for filtering
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  // Stats query for quick counts.
  //
  // Phase 96 · COUNT-01/COUNT-04 (D-06/D-09) — the STORED notion wins for commitments. The
  // `commitment_overdue_check` trigger owns `status = 'overdue'`; the tabs read that fact instead
  // of re-deriving it from `due_date` on the client:
  //   - active  = status IN (pending, in_progress, overdue) — stored overdue IS active work.
  //               Before: (pending, in_progress) alone, which made 10 stored-overdue commitments
  //               vanish from "active" while the kanban board kept showing them (measured 0 vs 10).
  //   - overdue = status = 'overdue' — the stored fact, replacing the computed date comparison.
  //   - completed unchanged.
  // -- seam (stated): the three head-counts share one queryFn but are three round trips, so they
  // are same-clock only to within that sub-second window. The RENDERED agreement oracle
  // (tests/e2e/96-count-agreement.spec.ts, Test 2) is a single DOM snapshot, which is where the
  // contemporaneous claim is actually made (D-16).
  // -- seam (stated): overdue rows are counted by BOTH the active and the overdue tab — the
  // overdue tab is a subset view of active work under the winning notion, not a disjoint bucket.
  const {
    data: stats,
    isError: statsError,
    isPending: statsPending,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['commitmentStats', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return { active: 0, overdue: 0, completed: 0 }

      // Count active (pending + in_progress + stored overdue)
      const { count: activeCount } = await supabase
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .or(`owner_user_id.eq.${userData.id}`)
        .in('status', ['pending', 'in_progress', 'overdue'])

      // Count overdue — the stored status, not a date comparison
      const { count: overdueCount } = await supabase
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .or(`owner_user_id.eq.${userData.id}`)
        .eq('status', 'overdue')

      // Count completed
      const { count: completedCount } = await supabase
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .or(`owner_user_id.eq.${userData.id}`)
        .eq('status', 'completed')

      return {
        active: activeCount ?? 0,
        overdue: overdueCount ?? 0,
        completed: completedCount ?? 0,
      }
    },
    enabled: !!userData?.id,
    staleTime: 2 * 60 * 1000,
  })

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-ink-mute" />
        <span className="ms-3 text-ink-mute">{t('list.loading')}</span>
      </div>
    )
  }

  // The lists render exactly the population their tab counts (COUNT-01): the same stored statuses,
  // never a second notion. The overdue tab reads `status = 'overdue'` rather than the computed
  // `overdue` date filter, so its count and its rows cannot disagree.
  const activeStatuses: CommitmentStatus[] = ['pending', 'in_progress', 'overdue']
  const overdueStatuses: CommitmentStatus[] = ['overdue']
  const completedStatuses: CommitmentStatus[] = ['completed']

  /**
   * A count that has not been answered renders NO number — never a 0 (D-06, the forbidden shape).
   * That covers both branches: a FAILED query (the error contract renders below) and an in-flight
   * one, which used to paint "(0)" next to a list already showing 10 rows.
   */
  const tabCount = (value: number | undefined): string =>
    statsError || statsPending ? '' : ` (${value ?? 0})`

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-sm sm:text-base text-ink-mute text-start">{t('subtitle')}</p>
      </div>

      {/* Quick Stats — or the error contract, never zeros over a query that failed */}
      {statsError ? (
        <QueryErrorState
          variant="inline"
          className="mb-6 sm:mb-8"
          onRetry={() => void refetchStats()}
          isRetrying={statsFetching}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-start">
                {t('status.pending')} / {t('status.in_progress')} / {t('status.overdue')}
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-start">
                {statsPending ? <Skeleton className="h-7 w-12" /> : (stats?.active ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-start">{t('status.overdue')}</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-danger text-start">
                {statsPending ? <Skeleton className="h-7 w-12" /> : (stats?.overdue ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-start">{t('status.completed')}</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-success text-start">
                {statsPending ? <Skeleton className="h-7 w-12" /> : (stats?.completed ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs with CommitmentsList for each status */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">
            <bdi>
              {t('status.pending')}
              {tabCount(stats?.active)}
            </bdi>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            <bdi>
              {t('status.overdue')}
              {tabCount(stats?.overdue)}
            </bdi>
          </TabsTrigger>
          <TabsTrigger value="completed">
            <bdi>
              {t('status.completed')}
              {tabCount(stats?.completed)}
            </bdi>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <CommitmentsList ownerId={userData?.id} status={activeStatuses} showFilters={false} />
        </TabsContent>

        <TabsContent value="overdue">
          <CommitmentsList ownerId={userData?.id} status={overdueStatuses} showFilters={false} />
        </TabsContent>

        <TabsContent value="completed">
          <CommitmentsList ownerId={userData?.id} status={completedStatuses} showFilters={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
