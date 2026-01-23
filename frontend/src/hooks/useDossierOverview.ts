/**
 * useDossierOverview Hook
 * Feature: Everything about [Dossier] comprehensive view
 *
 * TanStack Query hook for fetching aggregated dossier overview data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchDossierOverview,
  exportDossierProfile,
  downloadJSONExport,
  dossierOverviewKeys,
} from '@/services/dossier-overview.service'
import type {
  DossierOverviewRequest,
  DossierOverviewResponse,
  DossierExportRequest,
  DossierExportResponse,
  DossierOverviewSection,
  ExportFormat,
  UseDossierOverviewReturn,
  UseDossierExportReturn,
} from '@/types/dossier-overview.types'

/**
 * Hook for fetching a comprehensive dossier overview
 */
export function useDossierOverview(
  dossierId: string | undefined,
  options?: {
    enabled?: boolean
    includeSections?: DossierOverviewSection[]
    activityLimit?: number
    workItemsLimit?: number
    calendarDaysAhead?: number
    calendarDaysBehind?: number
  },
): UseDossierOverviewReturn {
  const {
    enabled = true,
    includeSections,
    activityLimit,
    workItemsLimit,
    calendarDaysAhead,
    calendarDaysBehind,
  } = options || {}

  const query = useQuery({
    queryKey: dossierOverviewKeys.detail(dossierId || ''),
    queryFn: async () => {
      if (!dossierId) throw new Error('Dossier ID is required')

      const request: DossierOverviewRequest = {
        dossier_id: dossierId,
        include_sections: includeSections,
        activity_limit: activityLimit,
        work_items_limit: workItemsLimit,
        calendar_days_ahead: calendarDaysAhead,
        calendar_days_behind: calendarDaysBehind,
      }

      return fetchDossierOverview(request)
    },
    enabled: enabled && !!dossierId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Hook for exporting a dossier profile
 */
export function useDossierExport(): UseDossierExportReturn {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (request: DossierExportRequest): Promise<DossierExportResponse> => {
      // For JSON format, we can export client-side
      if (request.format === 'json') {
        const overview = queryClient.getQueryData<DossierOverviewResponse>(
          dossierOverviewKeys.detail(request.dossier_id),
        )

        if (overview) {
          // Generate and download JSON
          const fileName = `dossier-${overview.dossier.name_en
            .toLowerCase()
            .replace(/\s+/g, '-')}-overview.json`
          downloadJSONExport(overview, fileName)

          return {
            download_url: '',
            file_name: fileName,
            file_size: 0,
            expires_at: new Date().toISOString(),
          }
        }
      }

      // For PDF/DOCX, use the backend
      return exportDossierProfile(request)
    },
    onSuccess: (data, variables) => {
      // If we have a download URL (from backend), open it
      if (data.download_url) {
        window.open(data.download_url, '_blank')
      }
    },
  })

  return {
    exportDossier: mutation.mutateAsync,
    isExporting: mutation.isPending,
    exportError: mutation.error,
  }
}

/**
 * Hook for invalidating dossier overview cache
 */
export function useInvalidateDossierOverview() {
  const queryClient = useQueryClient()

  return {
    invalidate: (dossierId: string) => {
      queryClient.invalidateQueries({
        queryKey: dossierOverviewKeys.detail(dossierId),
      })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: dossierOverviewKeys.all,
      })
    },
  }
}

/**
 * Hook for prefetching dossier overview (useful for hover states)
 */
export function usePrefetchDossierOverview() {
  const queryClient = useQueryClient()

  return {
    prefetch: (dossierId: string) => {
      queryClient.prefetchQuery({
        queryKey: dossierOverviewKeys.detail(dossierId),
        queryFn: () =>
          fetchDossierOverview({
            dossier_id: dossierId,
          }),
        staleTime: 1000 * 60 * 5, // 5 minutes
      })
    },
  }
}
