/**
 * useDossier Hook
 *
 * Fetches a single dossier by ID with optional includes for related data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Dossier } from '@/types/dossier';

export type DossierInclude = 'stats' | 'owners' | 'contacts' | 'recent_briefs';

export interface DossierWithIncludes extends Dossier {
  stats?: {
    total_engagements: number;
    total_positions: number;
    total_mous: number;
    total_commitments: number;
  };
  owners?: Array<{
    id: string;
    user_id: string;
    role: string;
  }>;
  contacts?: Array<{
    id: string;
    name: string;
    title?: string;
    organization?: string;
    email?: string;
    phone?: string;
  }>;
  recent_briefs?: Array<{
    id: string;
    created_at: string;
    summary: string;
  }>;
}

export function useDossier(
  dossierId: string,
  includes: DossierInclude[] = []
) {
  return useQuery({
    queryKey: ['dossier', dossierId, includes],
    queryFn: async () => {
      // Build select query based on includes
      let query = supabase
        .from('dossiers')
        .select('*')
        .eq('id', dossierId)
        .single();

      const { data: dossier, error } = await query;

      if (error) throw error;
      if (!dossier) throw new Error('Dossier not found');

      const result: DossierWithIncludes = dossier;

      // Fetch additional data based on includes
      if (includes.includes('stats')) {
        // Determine the foreign key column based on dossier reference_type
        const referenceColumn =
          result.reference_type === 'country' ? 'country_id' :
          result.reference_type === 'organization' ? 'organization_id' : null;

        // Fetch stats
        const [engagements, positions, mous, commitments] = await Promise.all([
          // Engagements: has dossier_id column
          supabase.from('engagements').select('id', { count: 'exact', head: true }).eq('dossier_id', dossierId),

          // Positions: linked via position_dossier_links junction table
          supabase.from('position_dossier_links').select('position_id', { count: 'exact', head: true }).eq('dossier_id', dossierId),

          // MoUs: use reference_id with type-specific column
          referenceColumn && result.reference_id
            ? supabase.from('mous').select('id', { count: 'exact', head: true }).eq(referenceColumn, result.reference_id)
            : Promise.resolve({ count: 0 }),

          // Commitments: no dossier relationship in current schema
          Promise.resolve({ count: 0 }),
        ]);

        result.stats = {
          total_engagements: engagements.count || 0,
          total_positions: positions.count || 0,
          total_mous: mous.count || 0,
          total_commitments: commitments.count || 0,
        };
      }

      if (includes.includes('owners')) {
        const { data: owners } = await supabase
          .from('dossier_owners')
          .select('*')
          .eq('dossier_id', dossierId);
        result.owners = owners || [];
      }

      if (includes.includes('contacts')) {
        const { data: contacts } = await supabase
          .from('key_contacts')
          .select('*')
          .eq('dossier_id', dossierId)
          .limit(5);
        result.contacts = contacts || [];
      }

      if (includes.includes('recent_briefs')) {
        // Briefs use reference_id with type-specific column
        const referenceColumn =
          result.reference_type === 'country' ? 'country_id' :
          result.reference_type === 'organization' ? 'organization_id' : null;

        let briefs = [];
        if (referenceColumn && result.reference_id) {
          const { data } = await supabase
            .from('briefs')
            .select('id, created_at, summary')
            .eq(referenceColumn, result.reference_id)
            .order('created_at', { ascending: false })
            .limit(3);
          briefs = data || [];
        }
        result.recent_briefs = briefs;
      }

      return result;
    },
    enabled: !!dossierId,
  });
}
