/**
 * useCreateDossier Hook
 *
 * Mutation hook for creating new dossiers using the mutation factory pattern.
 * Handles authentication, request execution, and automatic query invalidation.
 *
 * @module hooks/useCreateDossier
 */

import { mutationHelpers } from '@/lib/mutation-factory';
import type { DossierCreate } from '@/types/dossier';

/**
 * Create dossier mutation hook
 *
 * Invalidates 'dossiers' query on success to trigger refetch
 */
export const useCreateDossier = mutationHelpers.create<DossierCreate>(
  'dossiers-create',
  [['dossiers']]
);
