// T067: useCreatePositionDossierLink mutation hook
import { createMutation } from '@/lib/mutation-factory';

export interface CreatePositionDossierLinkInput {
  dossier_id: string;
  link_type?: 'primary' | 'related' | 'reference';
  notes?: string;
}

export function useCreatePositionDossierLink(positionId: string) {
  return createMutation<CreatePositionDossierLinkInput>({
    method: 'POST',
    url: {
      endpoint: 'positions-dossiers-create',
      queryParams: { positionId },
    },
    invalidation: {
      queryKeys: [['position-dossier-links', positionId]],
    },
  })();
}
