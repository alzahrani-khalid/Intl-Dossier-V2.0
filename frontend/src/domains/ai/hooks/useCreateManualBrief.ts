/**
 * useCreateManualBrief
 * @module domains/ai/hooks/useCreateManualBrief
 *
 * Persists a manually-entered brief (the analyst types the summary, background,
 * and recommendations) via the Express backend. Used as the fallback when AI
 * generation is unavailable. Returns the created brief so the caller can open it.
 */

import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { createManualBrief } from '../repositories/ai.repository'
import type { BriefContent, CreateManualBriefParams } from '../types'

export function useCreateManualBrief(): UseMutationResult<
  BriefContent,
  Error,
  CreateManualBriefParams
> {
  return useMutation<BriefContent, Error, CreateManualBriefParams>({
    mutationFn: async (params: CreateManualBriefParams): Promise<BriefContent> => {
      const { data } = await createManualBrief({
        engagement_id: params.engagementId,
        dossier_id: params.dossierId,
        summary: params.summary,
        background: params.background,
        recommendations: params.recommendations,
      })
      return data
    },
  })
}
