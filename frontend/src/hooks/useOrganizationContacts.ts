/**
 * useOrganizationContacts Hooks
 *
 * TanStack Query hooks for organization contacts and focal points
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  OrganizationContact,
  ContactWithOrganization,
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
  FocalPointMatch,
} from '@/types/contacts.types'

// Query keys
export const contactKeys = {
  all: ['organization-contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (orgId: string, filters?: Partial<ContactFilters>) =>
    [...contactKeys.lists(), orgId, filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
  focalPoints: (orgId: string) => [...contactKeys.all, 'focal-points', orgId] as const,
  search: (query: string) => [...contactKeys.all, 'search', query] as const,
}

/**
 * Fetch contacts for an organization
 */
export function useOrganizationContacts(
  organizationId: string,
  filters: Partial<ContactFilters> = {},
) {
  return useQuery<ContactWithOrganization[], Error>({
    queryKey: contactKeys.list(organizationId, filters),
    queryFn: async () => {
      let query = supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (filters.contact_type) {
        query = query.eq('contact_type', filters.contact_type)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }

      query = query
        .order('is_primary', { ascending: false })
        .order('contact_type', { ascending: true })
        .order('name_en', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get organization name
      const { data: org } = await supabase
        .from('organizations')
        .select('name_en, name_ar')
        .eq('id', organizationId)
        .single()

      return (data || []).map((c) => ({
        ...c,
        organization_name_en: org?.name_en,
        organization_name_ar: org?.name_ar,
      })) as ContactWithOrganization[]
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch focal points for an organization
 */
export function useOrganizationFocalPoints(organizationId: string) {
  return useQuery<OrganizationContact[], Error>({
    queryKey: contactKeys.focalPoints(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('contact_type', 'focal_point')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('is_primary', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single contact
 */
export function useOrganizationContact(id: string | undefined) {
  return useQuery<OrganizationContact | null, Error>({
    queryKey: contactKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('id', id)
        .single()

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
 * Create contact
 */
export function useCreateOrganizationContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateContactRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If setting as primary, unset existing primary
      if (data.is_primary) {
        await supabase
          .from('organization_contacts')
          .update({ is_primary: false })
          .eq('organization_id', data.organization_id)
          .eq('contact_type', data.contact_type)
          .eq('is_primary', true)
      }

      const { data: contact, error } = await supabase
        .from('organization_contacts')
        .insert({
          ...data,
          is_active: true,
          is_primary: data.is_primary ?? false,
          is_public: data.is_public ?? true,
          languages: data.languages || [],
          expertise_areas: data.expertise_areas || [],
          topics: data.topics || [],
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return contact as OrganizationContact
    },
    onSuccess: (contact) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.list(contact.organization_id),
      })
      queryClient.invalidateQueries({
        queryKey: contactKeys.focalPoints(contact.organization_id),
      })
      toast.success('Contact added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add contact')
    },
  })
}

/**
 * Update contact
 */
export function useUpdateOrganizationContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      organizationId,
      data,
    }: {
      id: string
      organizationId: string
      data: UpdateContactRequest
    }) => {
      const { data: contact, error } = await supabase
        .from('organization_contacts')
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

      return { contact: contact as OrganizationContact, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: contactKeys.focalPoints(organizationId) })
      toast.success('Contact updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update contact')
    },
  })
}

/**
 * Delete contact (soft delete)
 */
export function useDeleteOrganizationContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('organization_contacts')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return { id, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: contactKeys.focalPoints(organizationId) })
      toast.success('Contact removed successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove contact')
    },
  })
}

/**
 * Set contact as primary
 */
export function useSetPrimaryContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      organizationId,
      contactType,
    }: {
      id: string
      organizationId: string
      contactType: string
    }) => {
      // Unset existing primary
      await supabase
        .from('organization_contacts')
        .update({ is_primary: false })
        .eq('organization_id', organizationId)
        .eq('contact_type', contactType)
        .eq('is_primary', true)

      // Set new primary
      const { error } = await supabase
        .from('organization_contacts')
        .update({ is_primary: true })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return { id, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.list(organizationId) })
      toast.success('Primary contact updated')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to set primary contact')
    },
  })
}

/**
 * Search for focal points by expertise
 */
export function useFocalPointSearch(query: string, enabled: boolean = true) {
  return useQuery<FocalPointMatch[], Error>({
    queryKey: contactKeys.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) return []

      const { data, error } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('contact_type', 'focal_point')
        .eq('is_active', true)
        .is('deleted_at', null)
        .or(
          `name_en.ilike.%${query}%,name_ar.ilike.%${query}%,expertise_areas.cs.{${query}},topics.cs.{${query}}`,
        )
        .limit(20)

      if (error) {
        throw new Error(error.message)
      }

      // Calculate match scores
      const matches: FocalPointMatch[] = (data || []).map((c) => {
        let score = 0

        // Name match
        if (c.name_en?.toLowerCase().includes(query.toLowerCase())) score += 10
        if (c.name_ar?.includes(query)) score += 10

        // Expertise match
        const expertiseMatch = c.expertise_areas?.some((e: string) =>
          e.toLowerCase().includes(query.toLowerCase()),
        )
        if (expertiseMatch) score += 15

        // Topics match
        const topicsMatch = c.topics?.some((t: string) =>
          t.toLowerCase().includes(query.toLowerCase()),
        )
        if (topicsMatch) score += 15

        return {
          id: c.id,
          name_en: c.name_en,
          name_ar: c.name_ar,
          title_en: c.title_en,
          email: c.email,
          phone: c.phone,
          expertise_areas: c.expertise_areas,
          match_score: score,
        }
      })

      // Sort by match score
      matches.sort((a, b) => b.match_score - a.match_score)

      return matches
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 2,
  })
}
