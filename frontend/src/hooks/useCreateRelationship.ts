// T064: useCreateRelationship mutation hook
import { createMutation } from '@/lib/mutation-factory';

export interface CreateRelationshipInput {
  parent_dossier_id: string;
  child_dossier_id: string;
  relationship_type: 'member_of' | 'participates_in' | 'collaborates_with' | 'monitors' | 'is_member' | 'hosts';
  relationship_strength?: 'primary' | 'secondary' | 'observer';
  established_date?: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface RelationshipResponse {
  id: string;
  parent_dossier_id: string;
  child_dossier_id: string;
  relationship_type: string;
  relationship_strength: string;
  established_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useCreateRelationship = createMutation<
  CreateRelationshipInput,
  RelationshipResponse
>({
  method: 'POST',
  url: {
    endpoint: 'dossiers-relationships-create',
    queryParams: (input) => ({ dossierId: input.parent_dossier_id }),
  },
  invalidation: {
    queryKeys: (variables) => [['relationships', variables.parent_dossier_id]],
  },
  transformBody: (input) => {
    // Exclude parent_dossier_id from body since it's in query params
    const { parent_dossier_id: _parent_dossier_id, ...body } = input;
    return body;
  },
});
