/**
 * Briefing Pack Status Hook
 * @module domains/briefings/hooks/useBriefingPackStatus
 *
 * TanStack Query hook for polling briefing pack generation status.
 * API calls delegated to briefings.repository.
 */

import { useQuery } from '@tanstack/react-query'
import { getBriefingPackStatus } from '../repositories/briefings.repository'

export const briefingPackKeys = {
  all: ['briefing-packs'] as const,
  jobStatus: (jobId: string) => [...briefingPackKeys.all, 'job-status', jobId] as const,
}

export function useBriefingPackStatus(
  jobId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: jobId ? briefingPackKeys.jobStatus(jobId) : ['briefing-packs', 'disabled'],
    queryFn: () => (jobId ? getBriefingPackStatus(jobId) : Promise.resolve(null)),
    enabled: options?.enabled !== false && Boolean(jobId),
    refetchInterval: options?.refetchInterval ?? 3000,
  })
}

export type { BriefingPackJob } from '../types'
