import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Debounce time to prevent excessive invalidations (300ms following realtime patterns)
const DEBOUNCE_MS = 300;

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
 * T194: Subscribe to realtime updates via WebSocket
 */
export function useNotifications(unreadOnly: boolean = false) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    enabled: true,
  });

  // Debounced invalidation handler
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, DEBOUNCE_MS);
  }, [queryClient]);

  // T194: Realtime subscription to notifications table
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a unique channel name for this user's notifications
      const channelName = `notifications:${user.id}`;

      // Subscribe to realtime changes on notifications table
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (_payload) => {
            // Invalidate queries with debouncing
            debouncedInvalidate();
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, debouncedInvalidate]);

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
