import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types based on API spec
export interface Decision {
  id: string;
  after_action_id: string;
  description: string;
  rationale?: string | null;
  decision_maker: string;
  decision_date: string;
  created_at: string;
}

export interface CreateDecision {
  description: string;
  rationale?: string;
  decision_maker: string;
  decision_date: string;
}

export interface Commitment {
  id: string;
  after_action_id: string;
  dossier_id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  owner_type: 'internal' | 'external';
  owner_user_id?: string | null;
  owner_contact_id?: string | null;
  tracking_mode: 'automatic' | 'manual';
  due_date: string;
  completed_at?: string | null;
  ai_confidence?: number | null;
}

export interface CreateCommitment {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner_type: 'internal' | 'external';
  owner_user_id?: string;
  owner_contact_email?: string;
  owner_contact_name?: string;
  due_date: string;
  ai_confidence?: number;
}

export interface Risk {
  id: string;
  after_action_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation_strategy?: string | null;
  owner?: string | null;
  ai_confidence?: number | null;
}

export interface CreateRisk {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation_strategy?: string;
  owner?: string;
  ai_confidence?: number;
}

export interface FollowUpAction {
  id: string;
  after_action_id: string;
  description: string;
  assigned_to?: string | null;
  target_date?: string | null;
  completed: boolean;
}

export interface CreateFollowUpAction {
  description: string;
  assigned_to?: string;
  target_date?: string;
}

export interface AfterActionRecord {
  id: string;
  engagement_id: string;
  dossier_id: string;
  publication_status: 'draft' | 'published' | 'edit_requested' | 'edit_approved' | 'edit_rejected';
  is_confidential: boolean;
  attendees?: string[];
  notes?: string | null;
  decisions?: Decision[];
  commitments?: Commitment[];
  risks?: Risk[];
  follow_up_actions?: FollowUpAction[];
  created_by: string;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
  published_by?: string | null;
  published_at?: string | null;
  version: number;
}

export interface CreateAfterActionRequest {
  engagement_id: string;
  is_confidential: boolean;
  attendees?: string[];
  notes?: string;
  decisions?: CreateDecision[];
  commitments?: CreateCommitment[];
  risks?: CreateRisk[];
  follow_up_actions?: CreateFollowUpAction[];
}

export interface UpdateAfterActionRequest extends CreateAfterActionRequest {
  version: number;
}

// Fetch single after-action by ID
export function useAfterAction(id: string | undefined) {
  return useQuery({
    queryKey: ['after-action', id],
    queryFn: async () => {
      if (!id) throw new Error('After-action ID is required');

      const { data, error } = await supabase.functions.invoke('after-actions-get', {
        body: { id },
      });

      if (error) throw error;
      return data as AfterActionRecord;
    },
    enabled: !!id,
  });
}

// Fetch after-actions list for a dossier
export function useAfterActions(
  dossierId: string | undefined,
  options?: {
    status?: 'draft' | 'published' | 'edit_requested';
    limit?: number;
    offset?: number;
  }
) {
  return useQuery({
    queryKey: ['after-actions', dossierId, options],
    queryFn: async () => {
      if (!dossierId) throw new Error('Dossier ID is required');

      const { data, error } = await supabase.functions.invoke('after-actions-list', {
        body: { dossier_id: dossierId, ...options },
      });

      if (error) throw error;
      return data as { data: AfterActionRecord[]; total: number };
    },
    enabled: !!dossierId,
  });
}

// Create after-action mutation
export function useCreateAfterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAfterActionRequest) => {
      const { data, error } = await supabase.functions.invoke('after-actions-create', {
        body: request,
      });

      if (error) throw error;
      return data as AfterActionRecord;
    },
    onSuccess: (data) => {
      // Invalidate after-actions list for the dossier
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] });
      // Set the single after-action in cache
      queryClient.setQueryData(['after-action', data.id], data);
    },
  });
}

// Update after-action mutation with optimistic locking
export function useUpdateAfterAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAfterActionRequest) => {
      const { data, error } = await supabase.functions.invoke('after-actions-update', {
        body: { id, ...request },
      });

      if (error) {
        // Check for version conflict
        if (error.message?.includes('version') || error.message?.includes('conflict')) {
          throw new Error('Record was modified by another user. Please refresh.');
        }
        throw error;
      }
      return data as AfterActionRecord;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['after-action', id] });

      // Snapshot previous value
      const previousAfterAction = queryClient.getQueryData<AfterActionRecord>(['after-action', id]);

      // Optimistically update
      if (previousAfterAction) {
        queryClient.setQueryData(['after-action', id], {
          ...previousAfterAction,
          ...newData,
          version: newData.version + 1,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousAfterAction };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousAfterAction) {
        queryClient.setQueryData(['after-action', id], context.previousAfterAction);
      }
    },
    onSuccess: (data) => {
      // Update cache with server data
      queryClient.setQueryData(['after-action', id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] });
    },
  });
}
