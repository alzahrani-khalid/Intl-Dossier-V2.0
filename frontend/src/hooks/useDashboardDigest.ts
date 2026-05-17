import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface DashboardDigestRow {
  id: string
  headline_en: string
  headline_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  source_publication: string
  occurred_at: string
  dossier_id: string | null
  created_at: string
}

const DASHBOARD_DIGEST_SELECT =
  'id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, dossier_id, created_at'

export function useDashboardDigest(
  limit: number = 6,
): ReturnType<typeof useQuery<DashboardDigestRow[], Error>> {
  return useQuery<DashboardDigestRow[], Error>({
    queryKey: ['dashboard', 'dashboard-digest', limit],
    queryFn: async (): Promise<DashboardDigestRow[]> => {
      const { data, error } = await supabase
        .from('dashboard_digest')
        .select(DASHBOARD_DIGEST_SELECT)
        .order('occurred_at', { ascending: false })
        .limit(limit)

      if (error !== null && error !== undefined) {
        throw new Error(`Failed to fetch dashboard digest: ${error.message}`)
      }

      return (data as DashboardDigestRow[]) ?? []
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}
