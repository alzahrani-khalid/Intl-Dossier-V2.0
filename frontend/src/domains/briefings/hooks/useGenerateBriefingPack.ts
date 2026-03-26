/**
 * Generate Briefing Pack Hook
 * @module domains/briefings/hooks/useGenerateBriefingPack
 *
 * Mutation hook for triggering briefing pack generation.
 * API calls delegated to briefings.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateBriefingPack } from '../repositories/briefings.repository'
import { briefingPackKeys } from './useBriefingPackStatus'

export function useGenerateBriefingPack(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { engagementId: string; options?: Record<string, unknown> }) =>
      generateBriefingPack(params.engagementId, params.options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: briefingPackKeys.all })
    },
  })
}

export { briefingPackKeys }
