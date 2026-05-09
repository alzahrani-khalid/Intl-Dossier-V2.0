/**
 * Generate Briefing Pack Hook
 * @module domains/briefings/hooks/useGenerateBriefingPack
 *
 * Mutation hook for triggering briefing pack generation.
 * API calls delegated to briefings.repository.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { generateBriefingPack } from '../repositories/briefings.repository'
import { briefingPackKeys } from './useBriefingPackStatus'

export interface GenerateBriefingPackParams {
  engagementId: string
  language: 'en' | 'ar'
  options?: Record<string, unknown>
}

export interface GenerateBriefingPackResult {
  job_id: string
}

export function useGenerateBriefingPack(): UseMutationResult<
  GenerateBriefingPackResult,
  Error,
  GenerateBriefingPackParams
> {
  const queryClient = useQueryClient()

  return useMutation<GenerateBriefingPackResult, Error, GenerateBriefingPackParams>({
    mutationFn: async (params) => {
      const result = await generateBriefingPack(params.engagementId, {
        language: params.language,
        ...params.options,
      })
      return result as GenerateBriefingPackResult
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: briefingPackKeys.all })
    },
  })
}

export { briefingPackKeys }
