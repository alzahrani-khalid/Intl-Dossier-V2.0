/**
 * useSampleData Hook
 * Manages sample data population and removal for empty workspaces
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth.context'
import type {
  SampleDataTemplate,
  SampleDataStatus,
  PopulateSampleDataResponse,
  RemoveSampleDataResponse,
} from '@/types/sample-data.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Query keys
export const sampleDataKeys = {
  all: ['sample-data'] as const,
  templates: () => [...sampleDataKeys.all, 'templates'] as const,
  status: () => [...sampleDataKeys.all, 'status'] as const,
}

// Helper to get access token
async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return session.access_token
}

// API functions
async function fetchTemplates(): Promise<SampleDataTemplate[]> {
  const accessToken = await getAccessToken()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sample-data?action=list-templates`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch templates')
  }

  const data = await response.json()
  return data.templates
}

async function fetchStatus(): Promise<SampleDataStatus> {
  const accessToken = await getAccessToken()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sample-data?action=status`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch status')
  }

  return response.json()
}

async function populateSampleData(templateSlug: string): Promise<PopulateSampleDataResponse> {
  const accessToken = await getAccessToken()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sample-data?action=populate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template_slug: templateSlug }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to populate sample data')
  }

  return response.json()
}

async function removeSampleDataApi(instanceId?: string): Promise<RemoveSampleDataResponse> {
  const accessToken = await getAccessToken()
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sample-data?action=remove`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance_id: instanceId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to remove sample data')
  }

  return response.json()
}

// Hooks
export function useSampleDataTemplates() {
  const { user } = useAuth()

  return useQuery({
    queryKey: sampleDataKeys.templates(),
    queryFn: fetchTemplates,
    enabled: !!user, // Only fetch when authenticated
    staleTime: 1000 * 60 * 60, // 1 hour - templates don't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

export function useSampleDataStatus() {
  const { user } = useAuth()

  return useQuery({
    queryKey: sampleDataKeys.status(),
    queryFn: fetchStatus,
    enabled: !!user, // Only fetch when authenticated
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function usePopulateSampleData() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return useMutation({
    mutationFn: populateSampleData,
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: sampleDataKeys.all })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })

      const message = isArabic ? data.message_ar : data.message_en
      toast.success(message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveSampleData() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return useMutation({
    mutationFn: removeSampleDataApi,
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: sampleDataKeys.all })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })

      const message = isArabic ? data.message_ar : data.message_en
      toast.success(message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Combined hook for convenience (no params needed)
export function useSampleData() {
  const templates = useSampleDataTemplates()
  const status = useSampleDataStatus()
  const populate = usePopulateSampleData()
  const remove = useRemoveSampleData()

  return {
    // Template data
    templates: templates.data || [],
    isLoadingTemplates: templates.isLoading,
    templatesError: templates.error,

    // Status data
    hasSampleData: status.data?.has_sample_data || false,
    activeInstances: status.data?.instances || [],
    isLoadingStatus: status.isLoading,
    statusError: status.error,

    // Mutations
    populateSampleData: populate.mutate,
    isPopulating: populate.isPending,
    populateError: populate.error,

    removeSampleData: remove.mutate,
    isRemoving: remove.isPending,
    removeError: remove.error,

    // Refetch functions
    refetchTemplates: templates.refetch,
    refetchStatus: status.refetch,
  }
}

export default useSampleData
