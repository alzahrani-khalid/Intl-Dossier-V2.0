/**
 * Bilateral Agreements Hook
 * @module hooks/useBilateralAgreements
 * @feature 029-dynamic-country-intelligence (User Story 6 - T079)
 *
 * TanStack Query hook for fetching bilateral agreements (MoUs) for a country.
 *
 * @description
 * This hook fetches all bilateral agreements (Memoranda of Understanding) associated
 * with a specific country dossier. It queries the mous table, filters by country,
 * excludes deleted records, and returns sorted by effective date (most recent first).
 *
 * MoU data includes:
 * - Reference numbers and titles (English and Arabic)
 * - MoU type and category
 * - Lifecycle state (draft, active, expired, terminated)
 * - Key dates (signed, effective, expiry)
 * - Associated parties and organizations
 *
 * Cache behavior:
 * - staleTime: 5 minutes (data considered fresh)
 * - gcTime: 10 minutes (garbage collection)
 * - Automatically disabled when countryId is falsy
 *
 * @example
 * // Basic usage
 * const { data, isLoading } = useBilateralAgreements({ countryId: 'country-uuid' });
 *
 * @example
 * // With conditional enabling
 * const { data } = useBilateralAgreements({
 *   countryId: 'country-uuid',
 *   enabled: isTabActive,
 * });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Bilateral agreement (MoU) data structure
 *
 * @property id - Unique identifier (UUID) of the MoU
 * @property reference_number - Official reference/tracking number
 * @property title - English title of the agreement
 * @property title_ar - Arabic title of the agreement
 * @property type - Type of agreement
 * @property mou_category - Category classification
 * @property lifecycle_state - Current state (draft, active, expired, terminated)
 * @property effective_date - ISO date when the MoU becomes effective
 * @property expiry_date - ISO date when the MoU expires
 * @property description - Optional description of the agreement
 * @property dates - Additional date information (signed, effective, expires)
 * @property parties - Parties involved in the agreement
 * @property country_id - UUID of the associated country
 * @property organization_id - UUID of the associated organization
 */
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

/**
 * Options for the useBilateralAgreements hook
 *
 * @property countryId - UUID of the country dossier to fetch agreements for
 * @property enabled - Whether the query should be enabled (default: true)
 */
export interface UseBilateralAgreementsOptions {
  countryId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch bilateral agreements (MoUs) for a country
 *
 * @description
 * Fetches all non-deleted bilateral agreements associated with a country,
 * sorted by effective date (most recent first).
 *
 * @param options - Hook configuration options
 * @param options.countryId - Required country dossier UUID
 * @param options.enabled - Optional flag to enable/disable the query
 * @returns TanStack Query result with BilateralAgreement array
 *
 * @example
 * const { data, isLoading, error } = useBilateralAgreements({
 *   countryId: 'country-uuid',
 * });
 *
 * if (data) {
 *   data.forEach(mou => {
 *     console.log(`${mou.title} - ${mou.lifecycle_state}`);
 *     console.log(`Effective: ${mou.effective_date}`);
 *   });
 * }
 */
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
