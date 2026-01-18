// T066: usePositionDossierLinks hook
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PositionDossierLink {
  id: string
  position_id: string
  dossier_id: string
  link_type: 'primary' | 'related' | 'reference'
  notes?: string | null
  created_by: string
  created_at: string
  dossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
    description_en?: string
    description_ar?: string
  }
}

export interface UsePositionDossierLinksFilters {
  link_type?: string
}

export interface UsePositionDossierLinksResult {
  links: PositionDossierLink[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function usePositionDossierLinks(
  positionId: string,
  filters?: UsePositionDossierLinksFilters,
): UsePositionDossierLinksResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['position-dossier-links', positionId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ positionId })
      if (filters?.link_type) {
        params.append('link_type', filters.link_type)
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/positions-dossiers-get?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch position-dossier links')
      }

      const result = await response.json()
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!positionId,
  })

  return {
    links: data?.links || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
