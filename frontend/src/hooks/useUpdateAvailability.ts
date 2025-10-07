/**
 * useUpdateAvailability Hook
 *
 * TanStack Query mutation for updating staff availability status.
 * Handles leave-based reassignment workflow (urgent/high auto-reassign, normal/low flagged).
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#PUT /staff/availability
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export interface UpdateAvailabilityRequest {
  status: 'available' | 'on_leave' | 'unavailable';
  unavailable_until?: string; // ISO 8601 timestamp
  reason?: string;
}

export interface ReassignedItem {
  assignment_id: string;
  work_item_id: string;
  new_assignee_id: string;
  new_assignee_name: string;
}

export interface FlaggedItem {
  assignment_id: string;
  work_item_id: string;
  priority: string;
}

export interface AvailabilityUpdateResponse {
  updated: boolean;
  status: 'available' | 'on_leave' | 'unavailable';
  reassigned_items: ReassignedItem[];
  flagged_for_review: FlaggedItem[];
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<AvailabilityUpdateResponse, Error, UpdateAvailabilityRequest>({
    mutationFn: async (request: UpdateAvailabilityRequest) => {
      const { data, error } = await supabase.functions.invoke('staff-availability', {
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to update availability');
      }

      return data as AvailabilityUpdateResponse;
    },

    onSuccess: (data, variables) => {
      // Invalidate staff profile query
      queryClient.invalidateQueries({ queryKey: ['staff-profile'] });

      // Invalidate my-assignments query
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });

      // Show success toast with reassignment summary
      if (data.status === 'on_leave' || data.status === 'unavailable') {
        const totalReassigned = data.reassigned_items.length;
        const totalFlagged = data.flagged_for_review.length;

        toast({
          title: t('assignments:availability.updated.title'),
          description: t('assignments:availability.updated.description', {
            reassignedCount: totalReassigned,
            flaggedCount: totalFlagged,
          }),
          variant: 'default',
          duration: 5000,
        });

        // If items were flagged, show additional warning toast
        if (totalFlagged > 0) {
          toast({
            title: t('assignments:availability.flagged.title'),
            description: t('assignments:availability.flagged.description', {
              count: totalFlagged,
            }),
            variant: 'warning',
            duration: 7000,
          });
        }
      } else {
        toast({
          title: t('assignments:availability.updated.title'),
          description: t('assignments:availability.returnedToWork'),
          variant: 'success',
        });
      }
    },

    onError: (error) => {
      // Show error toast
      toast({
        title: t('assignments:availability.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },
  });
}
