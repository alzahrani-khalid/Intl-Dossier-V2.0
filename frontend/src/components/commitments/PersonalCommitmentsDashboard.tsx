import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { CommitmentsList } from './CommitmentsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface Commitment {
  id: string;
  dossier_id: string;
  dossier_name: string;
  dossier_type: 'country' | 'organization' | 'forum';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  due_date: string;
  owner_id: string;
  owner_name: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export function PersonalCommitmentsDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const supabase = createClient();
  const queryClient = useQueryClient();

  // T171: Fetch commitments assigned to current user
  const { data: commitments, isLoading, error } = useQuery({
    queryKey: ['personalCommitments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch commitments where owner_id = auth.uid()
      const { data, error } = await supabase
        .from('commitments')
        .select(`
          id,
          dossier_id,
          description,
          status,
          due_date,
          owner_id,
          priority,
          created_at,
          dossiers (
            name,
            type
          ),
          profiles!commitments_owner_id_fkey (
            full_name
          )
        `)
        .eq('owner_id', user.id)
        .order('due_date', { ascending: true }); // T172: Sort by due_date ASC

      if (error) throw error;

      // Transform data to match Commitment interface
      return data.map((commitment: any) => ({
        id: commitment.id,
        dossier_id: commitment.dossier_id,
        dossier_name: commitment.dossiers?.name || 'Unknown',
        dossier_type: commitment.dossiers?.type || 'country',
        description: commitment.description,
        status: commitment.status,
        due_date: commitment.due_date,
        owner_id: commitment.owner_id,
        owner_name: commitment.profiles?.full_name || 'Unknown',
        priority: commitment.priority,
        created_at: commitment.created_at,
      })) as Commitment[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // T173: Quick status update mutation
  const quickUpdateMutation = useMutation({
    mutationFn: async ({ commitmentId, newStatus }: { commitmentId: string; newStatus: string }) => {
      const { data, error } = await supabase
        .from('commitments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', commitmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['personalCommitments'] });
      queryClient.invalidateQueries({ queryKey: ['dossierStats'] });

      // T174: Health score recalculation is triggered via backend job
      // (This happens automatically within 2 minutes)
    },
  });

  const handleQuickUpdate = (commitmentId: string, newStatus: string) => {
    quickUpdateMutation.mutate({ commitmentId, newStatus });
  };

  const filterByStatus = (status: string[]) => {
    return commitments?.filter((c) => status.includes(c.status)) || [];
  };

  const activeCommitments = filterByStatus(['pending', 'in_progress', 'overdue']);
  const completedCommitments = filterByStatus(['completed']);
  const overdueCommitments = filterByStatus(['overdue']);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ms-3 text-gray-600">{t('commitments.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 text-start">
              {t('commitments.error.title')}
            </CardTitle>
            <CardDescription className="text-red-600 text-start">
              {t('commitments.error.message')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          {t('commitments.myCommitments')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-start">
          {t('commitments.dashboardDescription')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-start">
              {t('commitments.stats.active')}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-start">
              {activeCommitments.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-start">
              {t('commitments.stats.overdue')}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-red-600 text-start">
              {overdueCommitments.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-start">
              {t('commitments.stats.completed')}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-green-600 text-start">
              {completedCommitments.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* T173: Quick status update actions for each commitment */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">
            {t('commitments.tabs.active')} ({activeCommitments.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            {t('commitments.tabs.overdue')} ({overdueCommitments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('commitments.tabs.completed')} ({completedCommitments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <CommitmentsList
            commitments={activeCommitments}
            showDossierContext={true}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <CommitmentsList
            commitments={overdueCommitments}
            showDossierContext={true}
          />
        </TabsContent>

        <TabsContent value="completed">
          <CommitmentsList
            commitments={completedCommitments}
            showDossierContext={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
