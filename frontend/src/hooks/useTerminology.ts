/**
 * useTerminology Hooks
 *
 * TanStack Query hooks for terminology glossary operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  Terminology,
  TerminologyWithUsage,
  CreateTerminologyRequest,
  UpdateTerminologyRequest,
  TerminologyFilters,
  TermSearchResult,
  TermSearchParams,
  MostUsedTerm,
  MostUsedTermsParams,
  TermTranslation,
  CreateTranslationRequest,
  LogUsageRequest,
  RelatedTerm,
} from '@/types/terminology.types'

// Query keys
export const terminologyKeys = {
  all: ['terminology'] as const,
  lists: () => [...terminologyKeys.all, 'list'] as const,
  list: (filters?: Partial<TerminologyFilters>) => [...terminologyKeys.lists(), filters] as const,
  details: () => [...terminologyKeys.all, 'detail'] as const,
  detail: (id: string) => [...terminologyKeys.details(), id] as const,
  search: (params: TermSearchParams) => [...terminologyKeys.all, 'search', params] as const,
  mostUsed: (params?: MostUsedTermsParams) =>
    [...terminologyKeys.all, 'most-used', params] as const,
  translations: (termId: string) => [...terminologyKeys.all, 'translations', termId] as const,
  related: (termId: string) => [...terminologyKeys.all, 'related', termId] as const,
}

/**
 * Fetch paginated terminology list
 */
export function useTerminologyList(filters: Partial<TerminologyFilters> = {}) {
  return useQuery<TerminologyWithUsage[], Error>({
    queryKey: terminologyKeys.list(filters),
    queryFn: async () => {
      let query = supabase.from('terminology').select('*').eq('is_active', true)

      if (filters.domain) {
        query = query.eq('domain', filters.domain)
      }
      if (filters.subdomain) {
        query = query.eq('subdomain', filters.subdomain)
      }
      if (filters.is_approved !== undefined) {
        query = query.eq('is_approved', filters.is_approved)
      }
      if (filters.has_abbreviation) {
        query = query.not('abbreviation_en', 'is', null)
      }
      if (filters.frequency_of_use) {
        query = query.eq('frequency_of_use', filters.frequency_of_use)
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after)
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before)
      }

      query = query.order('term_en', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get usage counts
      const termIds = (data || []).map((t) => t.id)
      let usageCounts: Record<string, number> = {}

      if (termIds.length > 0) {
        const { data: usage } = await supabase
          .from('term_usage_log')
          .select('terminology_id')
          .in('terminology_id', termIds)

        if (usage) {
          usage.forEach((u) => {
            usageCounts[u.terminology_id] = (usageCounts[u.terminology_id] || 0) + 1
          })
        }
      }

      return (data || []).map((t) => ({
        ...t,
        usage_count: usageCounts[t.id] || 0,
      })) as TerminologyWithUsage[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single terminology entry
 */
export function useTerminology(id: string | undefined) {
  return useQuery<Terminology | null, Error>({
    queryKey: terminologyKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase.from('terminology').select('*').eq('id', id).single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Search terminology
 */
export function useTerminologySearch(params: TermSearchParams) {
  return useQuery<TermSearchResult[], Error>({
    queryKey: terminologyKeys.search(params),
    queryFn: async () => {
      if (!params.query || params.query.length < 2) return []

      const limit = params.limit || 20
      const searchQuery = params.query.toLowerCase()

      let query = supabase
        .from('terminology')
        .select('*')
        .eq('is_active', true)
        .or(
          `term_en.ilike.%${searchQuery}%,term_ar.ilike.%${searchQuery}%,abbreviation_en.ilike.%${searchQuery}%,abbreviation_ar.ilike.%${searchQuery}%,definition_en.ilike.%${searchQuery}%,definition_ar.ilike.%${searchQuery}%`,
        )
        .limit(limit)

      if (params.domain) {
        query = query.eq('domain', params.domain)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Calculate match scores
      return (data || [])
        .map((t) => {
          let score = 0

          // Exact term match
          if (t.term_en?.toLowerCase() === searchQuery) score += 100
          if (t.term_ar === params.query) score += 100

          // Term contains query
          if (t.term_en?.toLowerCase().includes(searchQuery)) score += 50
          if (t.term_ar?.includes(params.query)) score += 50

          // Abbreviation match
          if (t.abbreviation_en?.toLowerCase() === searchQuery) score += 80
          if (t.abbreviation_ar === params.query) score += 80

          // Definition match
          if (t.definition_en?.toLowerCase().includes(searchQuery)) score += 20
          if (t.definition_ar?.includes(params.query)) score += 20

          return {
            ...t,
            match_score: score,
          } as TermSearchResult
        })
        .sort((a, b) => b.match_score - a.match_score)
    },
    enabled: params.query.length >= 2,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Fetch most used terms
 */
export function useMostUsedTerms(params: MostUsedTermsParams = {}) {
  return useQuery<MostUsedTerm[], Error>({
    queryKey: terminologyKeys.mostUsed(params),
    queryFn: async () => {
      const days = params.days || 30
      const limit = params.limit || 10
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      // Get usage counts from recent period
      let usageQuery = supabase
        .from('term_usage_log')
        .select('terminology_id')
        .gte('used_at', cutoffDate.toISOString())

      const { data: usageData, error: usageError } = await usageQuery

      if (usageError) {
        throw new Error(usageError.message)
      }

      // Count by term
      const counts: Record<string, number> = {}
      ;(usageData || []).forEach((u) => {
        counts[u.terminology_id] = (counts[u.terminology_id] || 0) + 1
      })

      // Get top terms
      const topTermIds = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id)

      if (topTermIds.length === 0) return []

      // Fetch term details
      let termQuery = supabase
        .from('terminology')
        .select('id, term_en, term_ar, abbreviation_en, domain')
        .in('id', topTermIds)

      if (params.domain) {
        termQuery = termQuery.eq('domain', params.domain)
      }

      const { data: terms, error: termError } = await termQuery

      if (termError) {
        throw new Error(termError.message)
      }

      return (terms || [])
        .map((t) => ({
          ...t,
          usage_count: counts[t.id] || 0,
        }))
        .sort((a, b) => b.usage_count - a.usage_count) as MostUsedTerm[]
    },
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Create terminology entry
 */
export function useCreateTerminology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTerminologyRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: term, error } = await supabase
        .from('terminology')
        .insert({
          ...data,
          is_active: true,
          is_approved: false,
          related_terms: data.related_terms || [],
          synonyms_en: data.synonyms_en || [],
          synonyms_ar: data.synonyms_ar || [],
          tags: data.tags || [],
          frequency_of_use: data.frequency_of_use || 'common',
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return term as Terminology
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminologyKeys.lists() })
      toast.success('Term added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add term')
    },
  })
}

/**
 * Update terminology entry
 */
export function useUpdateTerminology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTerminologyRequest }) => {
      const { data: term, error } = await supabase
        .from('terminology')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return term as Terminology
    },
    onSuccess: (term) => {
      queryClient.invalidateQueries({ queryKey: terminologyKeys.lists() })
      queryClient.setQueryData(terminologyKeys.detail(term.id), term)
      toast.success('Term updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update term')
    },
  })
}

/**
 * Approve terminology entry
 */
export function useApproveTerminology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: term, error } = await supabase
        .from('terminology')
        .update({
          is_approved: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return term as Terminology
    },
    onSuccess: (term) => {
      queryClient.invalidateQueries({ queryKey: terminologyKeys.lists() })
      queryClient.setQueryData(terminologyKeys.detail(term.id), term)
      toast.success('Term approved')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to approve term')
    },
  })
}

/**
 * Delete terminology entry (soft delete)
 */
export function useDeleteTerminology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('terminology').update({ is_active: false }).eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: terminologyKeys.lists() })
      queryClient.removeQueries({ queryKey: terminologyKeys.detail(id) })
      toast.success('Term deleted')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete term')
    },
  })
}

// ============================================================================
// Translations Hooks
// ============================================================================

/**
 * Fetch translations for a term
 */
export function useTermTranslations(terminologyId: string) {
  return useQuery<TermTranslation[], Error>({
    queryKey: terminologyKeys.translations(terminologyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('term_translations')
        .select('*')
        .eq('terminology_id', terminologyId)
        .order('language_name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!terminologyId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create translation
 */
export function useCreateTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTranslationRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: translation, error } = await supabase
        .from('term_translations')
        .insert({
          ...data,
          is_approved: false,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return translation as TermTranslation
    },
    onSuccess: (translation) => {
      queryClient.invalidateQueries({
        queryKey: terminologyKeys.translations(translation.terminology_id),
      })
      toast.success('Translation added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add translation')
    },
  })
}

// ============================================================================
// Usage Logging
// ============================================================================

/**
 * Log term usage
 */
export function useLogTermUsage() {
  return useMutation({
    mutationFn: async (data: LogUsageRequest) => {
      const { error } = await supabase.from('term_usage_log').insert({
        terminology_id: data.terminology_id,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        context_snippet: data.context_snippet,
        language: data.language || 'en',
        used_at: new Date().toISOString(),
      })

      if (error) {
        throw new Error(error.message)
      }
    },
    onError: (error) => {
      console.error('Failed to log term usage:', error)
    },
  })
}

// ============================================================================
// Related Terms
// ============================================================================

/**
 * Fetch related terms
 */
export function useRelatedTerms(terminologyId: string) {
  return useQuery<RelatedTerm[], Error>({
    queryKey: terminologyKeys.related(terminologyId),
    queryFn: async () => {
      // Get the term's related_terms and parent_term_id
      const { data: term, error: termError } = await supabase
        .from('terminology')
        .select('related_terms, parent_term_id')
        .eq('id', terminologyId)
        .single()

      if (termError) {
        throw new Error(termError.message)
      }

      const relatedIds = term?.related_terms || []
      if (term?.parent_term_id) {
        relatedIds.push(term.parent_term_id)
      }

      if (relatedIds.length === 0) return []

      // Fetch related term details
      const { data: relatedTerms, error: relatedError } = await supabase
        .from('terminology')
        .select('id, term_en, term_ar, abbreviation_en, domain')
        .in('id', relatedIds)

      if (relatedError) {
        throw new Error(relatedError.message)
      }

      return (relatedTerms || []).map((t) => ({
        ...t,
        relation_type:
          t.id === term?.parent_term_id
            ? 'parent'
            : term?.related_terms?.includes(t.id)
              ? 'related'
              : 'child',
      })) as RelatedTerm[]
    },
    enabled: !!terminologyId,
    staleTime: 1000 * 60 * 5,
  })
}
