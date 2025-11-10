/**
 * Bilateral Agreements Hook (Feature 029 - User Story 6 - T079)
 *
 * Fetches bilateral agreements (MoUs) for a specific country dossier.
 * Includes caching and error handling via TanStack Query.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BilateralAgreement {
  id: string;
  reference_number: string;
  title: string;
  title_ar: string;
  type: string;
  mou_category: string;
  lifecycle_state: string;
  effective_date?: string;
  expiry_date?: string;
  description?: string;
  dates?: {
    signed?: string;
    effective?: string;
    expires?: string;
  };
  parties?: any;
  country_id?: string;
  organization_id?: string;
}

export interface UseBilateralAgreementsOptions {
  countryId: string;
  enabled?: boolean;
}

export function useBilateralAgreements({
  countryId,
  enabled = true,
}: UseBilateralAgreementsOptions) {
  return useQuery({
    queryKey: ['bilateral-agreements', countryId],
    queryFn: async (): Promise<BilateralAgreement[]> => {
      const { data, error } = await supabase
        .from('mous')
        .select('*')
        .eq('country_id', countryId)
        .eq('is_deleted', false)
        .order('effective_date', { ascending: false, nullsFirst: false });

      if (error) {
        throw new Error(`Failed to fetch bilateral agreements: ${error.message}`);
      }

      return data || [];
    },
    enabled: enabled && !!countryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
