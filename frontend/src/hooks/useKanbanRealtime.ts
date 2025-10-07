import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface RealtimePayload {
  assignment_id: string;
  from_stage: string;
  to_stage: string;
  moved_by_user_id: string;
}

export function useKanbanRealtime(engagementId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!engagementId) return;

    const channel = supabase.channel(`engagement:${engagementId}:kanban`);

    channel
      .on('broadcast', { event: 'assignment:moved' }, (payload: { payload: RealtimePayload }) => {
        // Invalidate and refetch Kanban data when an assignment moves
        queryClient.invalidateQueries({ queryKey: ['engagement-kanban', engagementId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [engagementId, queryClient]);
}
