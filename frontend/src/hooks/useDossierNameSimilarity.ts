/**
 * useDossierNameSimilarity Hook
 *
 * Real-time duplicate detection for dossier creation.
 * Uses pg_trgm similarity search to find existing dossiers with similar names.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useMemo } from 'react'
import type { DossierType } from '@/lib/dossier-type-guards'

export interface SimilarDossier {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: string
  similarity_score_en: number
  similarity_score_ar: number
  highest_similarity: number
}

interface UseDossierNameSimilarityOptions {
  /** Minimum similarity threshold (0-1). Default: 0.4 */
  threshold?: number
  /** Maximum number of results. Default: 5 */
  limit?: number
  /** Filter by dossier type */
  type?: DossierType
  /** Debounce delay in ms. Default: 500 */
  debounceMs?: number
  /** Enable the check. Default: true */
  enabled?: boolean
}

/**
 * Hook to check for similar dossier names in real-time
 *
 * @example
 * ```tsx
 * const { similarDossiers, isChecking, hasHighSimilarity } = useDossierNameSimilarity(
 *   nameEn,
 *   nameAr,
 *   { type: 'country', threshold: 0.5 }
 * );
 *
 * if (hasHighSimilarity) {
 *   // Show warning to user
 * }
 * ```
 */
export function useDossierNameSimilarity(
  nameEn: string,
  nameAr?: string,
  options: UseDossierNameSimilarityOptions = {},
) {
  const { threshold = 0.4, limit = 5, type, debounceMs = 500, enabled = true } = options

  // Debounce the search terms
  const [debouncedNameEn, setDebouncedNameEn] = useState(nameEn)
  const [debouncedNameAr, setDebouncedNameAr] = useState(nameAr)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameEn(nameEn)
      setDebouncedNameAr(nameAr)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [nameEn, nameAr, debounceMs])

  // Only run query if name is long enough (at least 3 characters)
  const shouldQuery = enabled && debouncedNameEn.length >= 3

  const {
    data: similarDossiers,
    isLoading: isChecking,
    error,
  } = useQuery({
    queryKey: ['dossier-name-similarity', debouncedNameEn, debouncedNameAr, type, threshold, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_dossier_name_similarity', {
        p_name_en: debouncedNameEn,
        p_name_ar: debouncedNameAr || null,
        p_dossier_type: type || null,
        p_similarity_threshold: threshold,
        p_limit: limit,
      })

      if (error) {
        // If the function doesn't exist yet, return empty array
        if (error.code === '42883' || error.message?.includes('does not exist')) {
          console.warn('check_dossier_name_similarity function not available')
          return []
        }
        throw error
      }

      return (data as SimilarDossier[]) || []
    },
    enabled: shouldQuery,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  })

  // Computed values
  const hasHighSimilarity = useMemo(() => {
    if (!similarDossiers?.length) return false
    return similarDossiers.some((d) => d.highest_similarity >= 0.8)
  }, [similarDossiers])

  const hasMediumSimilarity = useMemo(() => {
    if (!similarDossiers?.length) return false
    return similarDossiers.some((d) => d.highest_similarity >= 0.5 && d.highest_similarity < 0.8)
  }, [similarDossiers])

  const highestMatch = useMemo(() => {
    if (!similarDossiers?.length) return null
    return similarDossiers.reduce((max, current) =>
      current.highest_similarity > max.highest_similarity ? current : max,
    )
  }, [similarDossiers])

  return {
    /** List of similar dossiers found */
    similarDossiers: similarDossiers || [],
    /** Whether the similarity check is in progress */
    isChecking: shouldQuery && isChecking,
    /** Error if the check failed */
    error,
    /** Whether any dossier has >= 80% similarity (likely duplicate) */
    hasHighSimilarity,
    /** Whether any dossier has 50-80% similarity (potential duplicate) */
    hasMediumSimilarity,
    /** The dossier with the highest similarity score */
    highestMatch,
    /** The search term being used (debounced) */
    searchTerm: debouncedNameEn,
  }
}
