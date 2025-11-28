/**
 * PersonalCommitmentsDashboard Component v1.1
 * Feature: 031-commitments-management
 *
 * Dashboard showing user's commitments with quick status updates
 * Mobile-first, RTL-compatible, accessible
 */

import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { CommitmentsList } from './CommitmentsList';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import type { CommitmentStatus } from '@/types/commitment.types';

export function PersonalCommitmentsDashboard() {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Get current user ID for filtering
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Stats query for quick counts
  const { data: stats } = useQuery({
    queryKey: ['commitmentStats', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return { active: 0, overdue: 0, completed: 0 };

      // Count active (pending + in_progress)
      const { count: activeCount } = await supabase
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .or(`owner_user_id.eq.${userData.id}`)
        .in('status', ['pending', 'in_progress']);

      // Count overdue
      const today = new Date().toISOString().split('T')[0];
      const { count: overdueCount } = await supabase
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .or(`owner_user_id.eq.${userData.id}`)
        .lt('due_date', today)
        .not('status', 'in', '(completed,cancelled)');

      // Count completed
      const { count: completedCount } = await supabase
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .or(`owner_user_id.eq.${userData.id}`)
        .eq('status', 'completed');

      return {
        active: activeCount ?? 0,
        overdue: overdueCount ?? 0,
        completed: completedCount ?? 0,
      };
    },
    enabled: !!userData?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ms-3 text-gray-600">{t('list.loading')}</span>
      </div>
    );
  }

  const activeStatuses: CommitmentStatus[] = ['pending', 'in_progress'];
  const overdueStatuses: CommitmentStatus[] = ['pending', 'in_progress']; // overdue filter applied separately
  const completedStatuses: CommitmentStatus[] = ['completed'];

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-start">
          {t('subtitle')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-start">
              {t('status.pending')} / {t('status.in_progress')}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-start">
              {stats?.active ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-start">
              {t('status.overdue')}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-red-600 text-start">
              {stats?.overdue ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-start">
              {t('status.completed')}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-green-600 text-start">
              {stats?.completed ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs with CommitmentsList for each status */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">
            {t('status.pending')} ({stats?.active ?? 0})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            {t('status.overdue')} ({stats?.overdue ?? 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('status.completed')} ({stats?.completed ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <CommitmentsList
            ownerId={userData?.id}
            status={activeStatuses}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <CommitmentsList
            ownerId={userData?.id}
            overdue={true}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="completed">
          <CommitmentsList
            ownerId={userData?.id}
            status={completedStatuses}
            showFilters={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
