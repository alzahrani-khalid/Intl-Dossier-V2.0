/**
 * useEngagement Hook
 *
 * Fetches a single engagement by ID with real-time updates
 * Uses unified dossier architecture with JOIN
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Engagement {
  id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  engagement_type:
    | 'meeting'
    | 'consultation'
    | 'coordination'
    | 'workshop'
    | 'conference'
    | 'site_visit'
    | 'ceremony'
  engagement_category: 'bilateral' | 'multilateral' | 'regional' | 'internal'
  location_en?: string
  location_ar?: string
  status: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export function useEngagement(engagementId: string) {
  return useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: async (): Promise<Engagement> => {
      // The canonical create path writes a base `dossiers` row (type 'engagement')
      // plus an `engagement_dossiers` extension row — there is no legacy
      // `engagements` CTI row. Read the base dossier first.
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select(
          'id, name_en, name_ar, description_en, description_ar, status, created_at, updated_at, created_by, updated_by',
        )
        .eq('id', engagementId)
        .eq('type', 'engagement')
        .single()

      if (dossierError) throw dossierError

      // Engagement-specific fields live in the `engagement_dossiers` extension
      // table (shared PK). A separate LEFT-join-style read with maybeSingle keeps
      // app-created engagements that lack an extension row from throwing — and
      // avoids PostgREST embed ambiguity (engagement_dossiers has 3 FKs to dossiers).
      const { data: ext, error: extError } = await supabase
        .from('engagement_dossiers')
        .select('engagement_type, engagement_category, location_en, location_ar')
        .eq('id', engagementId)
        .maybeSingle()

      if (extError) throw extError

      const flattenedData: Engagement = {
        id: dossier.id,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
        description_en: dossier.description_en,
        description_ar: dossier.description_ar,
        engagement_type: ext?.engagement_type as Engagement['engagement_type'],
        engagement_category: ext?.engagement_category as Engagement['engagement_category'],
        location_en: ext?.location_en ?? undefined,
        location_ar: ext?.location_ar ?? undefined,
        status: dossier.status,
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
        created_by: dossier.created_by,
        updated_by: dossier.updated_by,
      }

      return flattenedData
    },
    enabled: !!engagementId,
  })
}
