/**
 * dossierFacetCount — Phase 87 F24 (AFF-02) live facet counts for dossier lists.
 *
 * RLS-scoped head-count for a single Filter-popover option on a dossier-type list
 * (countries, organizations, …). Counts `dossiers` of `dossierType` matching this
 * option's predicate PLUS the OTHER active filters, so counts narrow with
 * co-selections (Linear-style). Anon Supabase client only → RLS applies (T-87-16);
 * never a service-role count endpoint. Head-count pattern per useWorkingGroups.ts.
 */

import { supabase } from '@/lib/supabase'
import type { DossierType } from '@/lib/dossier-type-guards'

/** The dossier-list facet keys these surfaces expose. */
type DossierFacetKey = 'status' | 'sensitivity'

export async function dossierFacetCount(
  dossierType: DossierType,
  field: DossierFacetKey,
  value: string,
  active: Record<string, string | undefined>,
): Promise<number> {
  // This option's own value wins over any active value for the same field.
  const predicates: Record<string, string | undefined> = { ...active, [field]: value }

  let query = supabase
    .from('dossiers')
    .select('*', { count: 'exact', head: true })
    .eq('type', dossierType)
    .neq('status', 'deleted')

  if (typeof predicates.status === 'string' && predicates.status.length > 0) {
    query = query.eq('status', predicates.status)
  }
  if (typeof predicates.sensitivity === 'string' && predicates.sensitivity.length > 0) {
    query = query.eq('sensitivity_level', Number(predicates.sensitivity))
  }

  const { count } = await query
  return count ?? 0
}
