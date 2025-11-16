import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  metadata: {
    dossierId?: string;
    commitmentId?: string;
    type?: 'health_score_drop' | 'commitment_overdue' | 'general';
    healthScore?: {
      previous: number;
      current: number;
      factors: string[];
    };
  };
  read: boolean;
  created_at: string;
}

/**
 * T193: TanStack Query hook to fetch notifications for current user
 * T194: Poll for new notifications every 30 seconds
 */
export function useNotifications(unreadOnly: boolean = false) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let notificationsQuery = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        notificationsQuery = notificationsQuery.eq('read', false);
      }

      const { data, error } = await notificationsQuery;

      if (error) throw error;
      return (data as Notification[]) || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // T194: Poll every 30 seconds
    enabled: true,
  });

  // T197: Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: query.data || [],
    unreadCount: query.data?.filter((n) => !n.read).length || 0,
    isLoading: query.isLoading,
    error: query.error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}
