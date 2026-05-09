/**
 * Import Data Hook
 * @module domains/import/hooks/useImportData
 *
 * Hooks for data import operations.
 * API calls delegated to import.repository.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { importData as importDataApi, getImportStatus } from '../repositories/import.repository'

export const importKeys = {
  all: ['import'] as const,
  job: (jobId: string) => [...importKeys.all, 'job', jobId] as const,
}

export function useImportData() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => importDataApi(data),
  })
}

export function useImportStatus(
  jobId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: jobId ? importKeys.job(jobId) : ['import', 'disabled'],
    queryFn: () => (jobId ? getImportStatus(jobId) : Promise.resolve(null)),
    enabled: options?.enabled !== false && Boolean(jobId),
    refetchInterval: options?.refetchInterval ?? 3000,
  })
}
