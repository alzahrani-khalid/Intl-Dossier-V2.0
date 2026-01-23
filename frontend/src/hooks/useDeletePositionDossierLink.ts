// T068: useDeletePositionDossierLink mutation hook
import { mutationHelpers } from '@/lib/mutation-factory';

export interface DeletePositionDossierLinkInput {
  positionId: string;
  dossierId: string;
}

export const useDeletePositionDossierLink = mutationHelpers.delete<
  DeletePositionDossierLinkInput,
  unknown
>(
  'positions-dossiers-delete',
  (input) => ({
    positionId: input.positionId,
    dossierId: input.dossierId,
  }),
  (variables) => [['position-dossier-links', variables.positionId]]
);
