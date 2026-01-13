/**
 * useDocumentVersions Hook
 *
 * Provides document version management functionality including:
 * - Fetching version history
 * - Comparing versions
 * - Reverting to previous versions
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  DocumentVersion,
  VersionComparisonResult,
  DiffViewMode,
  VersionComparisonState,
  DiffHunk,
  DiffStats,
} from '@/types/document-version.types'

// Get Supabase URL from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface UseDocumentVersionsOptions {
  documentId: string
  enabled?: boolean
  limit?: number
}

interface UseDocumentVersionsResult {
  // Version history
  versions: DocumentVersion[]
  isLoading: boolean
  error: string | null
  totalVersions: number

  // Comparison state
  comparisonState: VersionComparisonState
  selectedVersionA: DocumentVersion | null
  selectedVersionB: DocumentVersion | null

  // Actions
  selectVersionA: (version: number) => void
  selectVersionB: (version: number) => void
  clearSelection: () => void
  compareVersions: () => Promise<void>
  setViewMode: (mode: DiffViewMode) => void
  revertToVersion: (targetVersion: number, reason?: string) => Promise<void>
  refreshVersions: () => void

  // Mutation states
  isComparing: boolean
  isReverting: boolean
}

export function useDocumentVersions({
  documentId,
  enabled = true,
  limit = 50,
}: UseDocumentVersionsOptions): UseDocumentVersionsResult {
  const queryClient = useQueryClient()

  // Local state for comparison
  const [selectedVersionA, setSelectedVersionA] = useState<number | null>(null)
  const [selectedVersionB, setSelectedVersionB] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<DiffViewMode>('side_by_side')
  const [comparisonResult, setComparisonResult] = useState<VersionComparisonResult | null>(null)
  const [comparisonError, setComparisonError] = useState<string | null>(null)

  // Fetch version history
  const {
    data: versionsData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const params = new URLSearchParams({
        document_id: documentId,
        limit: limit.toString(),
        offset: '0',
      })

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/document-versions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch version history')
      }

      return response.json()
    },
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const versions: DocumentVersion[] = versionsData?.versions || []
  const totalVersions = versionsData?.total || 0

  // Get selected version objects
  const selectedVersionAObj = useMemo(
    () => versions.find((v) => v.version_number === selectedVersionA) || null,
    [versions, selectedVersionA],
  )

  const selectedVersionBObj = useMemo(
    () => versions.find((v) => v.version_number === selectedVersionB) || null,
    [versions, selectedVersionB],
  )

  // Compare versions mutation
  const compareMutation = useMutation({
    mutationFn: async ({ versionA, versionB }: { versionA: number; versionB: number }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-versions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'compare',
          document_id: documentId,
          version_a: versionA,
          version_b: versionB,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to compare versions')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setComparisonResult({
        versionA: data.versionA,
        versionB: data.versionB,
        canCompareText: data.canCompareText,
        diffHunks: data.diffHunks,
        diffStats: data.diffStats,
      })
      setComparisonError(null)
    },
    onError: (error) => {
      setComparisonError((error as Error).message)
      setComparisonResult(null)
    },
  })

  // Revert to version mutation
  const revertMutation = useMutation({
    mutationFn: async ({ targetVersion, reason }: { targetVersion: number; reason?: string }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-versions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revert',
          document_id: documentId,
          target_version: targetVersion,
          reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revert to version')
      }

      return response.json()
    },
    onSuccess: () => {
      // Refresh versions and document
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      // Clear comparison state
      setComparisonResult(null)
      setSelectedVersionA(null)
      setSelectedVersionB(null)
    },
  })

  // Actions
  const selectVersionA = useCallback((version: number) => {
    setSelectedVersionA(version)
  }, [])

  const selectVersionB = useCallback((version: number) => {
    setSelectedVersionB(version)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedVersionA(null)
    setSelectedVersionB(null)
    setComparisonResult(null)
    setComparisonError(null)
  }, [])

  const compareVersions = useCallback(async () => {
    if (selectedVersionA === null || selectedVersionB === null) {
      setComparisonError('Please select two versions to compare')
      return
    }

    if (selectedVersionA === selectedVersionB) {
      setComparisonError('Please select different versions to compare')
      return
    }

    await compareMutation.mutateAsync({
      versionA: selectedVersionA,
      versionB: selectedVersionB,
    })
  }, [selectedVersionA, selectedVersionB, compareMutation])

  const revertToVersion = useCallback(
    async (targetVersion: number, reason?: string) => {
      await revertMutation.mutateAsync({ targetVersion, reason })
    },
    [revertMutation],
  )

  const refreshVersions = useCallback(() => {
    refetch()
  }, [refetch])

  // Build comparison state
  const comparisonState: VersionComparisonState = useMemo(
    () => ({
      isLoading: compareMutation.isPending,
      error: comparisonError,
      versions,
      selectedVersionA,
      selectedVersionB,
      comparisonResult,
      viewMode,
    }),
    [
      compareMutation.isPending,
      comparisonError,
      versions,
      selectedVersionA,
      selectedVersionB,
      comparisonResult,
      viewMode,
    ],
  )

  return {
    // Version history
    versions,
    isLoading,
    error: queryError ? (queryError as Error).message : null,
    totalVersions,

    // Comparison state
    comparisonState,
    selectedVersionA: selectedVersionAObj,
    selectedVersionB: selectedVersionBObj,

    // Actions
    selectVersionA,
    selectVersionB,
    clearSelection,
    compareVersions,
    setViewMode,
    revertToVersion,
    refreshVersions,

    // Mutation states
    isComparing: compareMutation.isPending,
    isReverting: revertMutation.isPending,
  }
}

/**
 * Hook for quick version info lookup
 */
export function useDocumentVersion(documentId: string, versionNumber: number) {
  return useQuery({
    queryKey: ['document-version', documentId, versionNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .eq('version_number', versionNumber)
        .single()

      if (error) throw error
      return data as DocumentVersion
    },
    enabled: !!documentId && !!versionNumber,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for getting the latest version number
 */
export function useLatestVersionNumber(documentId: string) {
  return useQuery({
    queryKey: ['document-latest-version', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data?.version_number || 1
    },
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  })
}
