/**
 * Document Classification Hook
 *
 * Provides document classification management functionality:
 * - Fetching classified documents with access control
 * - Changing document classification
 * - Approving classification changes
 * - Access audit logging
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import type {
  DocumentClassification,
  ClassifiedDocument,
  ClassificationChangeRequest,
  DocumentAccessLog,
  ClassificationApiRequest,
  ClassificationListResponse,
  ClassificationGetResponse,
  ClassificationChangeResponse,
  ClassificationApproveResponse,
  ClassificationAccessLogResponse,
  ClassificationPendingResponse,
} from '@/types/document-classification.types'

const EDGE_FUNCTION_URL = 'document-classification'

/**
 * Call the document-classification edge function
 */
async function callClassificationApi<T>(request: ClassificationApiRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(EDGE_FUNCTION_URL, {
    body: request,
  })

  if (error) {
    throw new Error(error.message || 'Classification API error')
  }

  return data as T
}

/**
 * Hook to fetch accessible documents for an entity with classification info
 */
export function useClassifiedDocuments(entityType: string, entityId: string, enabled = true) {
  return useQuery({
    queryKey: ['classified-documents', entityType, entityId],
    queryFn: async () => {
      const response = await callClassificationApi<ClassificationListResponse>({
        action: 'list',
        entityType,
        entityId,
      })
      return response.documents
    },
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single document with redaction applied
 */
export function useClassifiedDocument(documentId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['classified-document', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error('Document ID required')
      const response = await callClassificationApi<ClassificationGetResponse>({
        action: 'get',
        documentId,
      })
      return response.document
    },
    enabled: enabled && !!documentId,
    staleTime: 30000,
  })
}

/**
 * Hook to change document classification
 */
export function useChangeClassification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      documentId,
      newClassification,
      reason,
    }: {
      documentId: string
      newClassification: DocumentClassification
      reason: string
    }) => {
      const response = await callClassificationApi<ClassificationChangeResponse>({
        action: 'change',
        documentId,
        newClassification,
        reason,
      })
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate document queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['classified-documents'] })
      queryClient.invalidateQueries({ queryKey: ['classified-document', variables.documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })

      // If pending approval, invalidate pending approvals list
      if (!data.approved) {
        queryClient.invalidateQueries({ queryKey: ['classification-pending-approvals'] })
      }
    },
  })
}

/**
 * Hook to approve a pending classification change
 */
export function useApproveClassificationChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (changeId: string) => {
      const response = await callClassificationApi<ClassificationApproveResponse>({
        action: 'approve',
        changeId,
      })
      return response
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['classified-documents'] })
      queryClient.invalidateQueries({ queryKey: ['classified-document'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['classification-pending-approvals'] })
    },
  })
}

/**
 * Hook to fetch document access logs (admin only)
 */
export function useDocumentAccessLogs(
  documentId: string | null,
  limit = 50,
  offset = 0,
  enabled = true,
) {
  return useQuery({
    queryKey: ['document-access-logs', documentId, limit, offset],
    queryFn: async () => {
      if (!documentId) throw new Error('Document ID required')
      const response = await callClassificationApi<ClassificationAccessLogResponse>({
        action: 'access-log',
        documentId,
        limit,
        offset,
      })
      return response
    },
    enabled: enabled && !!documentId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to fetch pending classification approvals (admin only)
 */
export function usePendingClassificationApprovals(limit = 50, offset = 0, enabled = true) {
  return useQuery({
    queryKey: ['classification-pending-approvals', limit, offset],
    queryFn: async () => {
      const response = await callClassificationApi<ClassificationPendingResponse>({
        action: 'pending-approvals',
        limit,
        offset,
      })
      return response
    },
    enabled,
    staleTime: 30000,
  })
}

/**
 * Hook to get user's clearance level
 */
export function useUserClearance() {
  return useQuery({
    queryKey: ['user-clearance'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return 1 // Default to lowest clearance

      // Try to get clearance from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('clearance_level')
        .eq('user_id', user.id)
        .single()

      if (profile?.clearance_level) {
        return profile.clearance_level
      }

      // Fallback: Try to get from user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (roles && roles.length > 0) {
        // Map roles to clearance levels
        const roleToLevel: Record<string, number> = {
          admin: 3,
          manager: 3,
          analyst: 2,
          user: 1,
        }

        const maxClearance = Math.max(...roles.map((r) => roleToLevel[r.role] || 1))
        return maxClearance
      }

      return 1 // Default
    },
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Combined hook for document classification management
 */
export function useDocumentClassificationManager(entityType: string, entityId: string) {
  const queryClient = useQueryClient()

  const documentsQuery = useClassifiedDocuments(entityType, entityId)
  const clearanceQuery = useUserClearance()
  const changeClassification = useChangeClassification()
  const approveChange = useApproveClassificationChange()

  const refreshDocuments = () => {
    queryClient.invalidateQueries({ queryKey: ['classified-documents', entityType, entityId] })
  }

  return {
    // Data
    documents: documentsQuery.data || [],
    userClearance: clearanceQuery.data || 1,

    // Loading states
    isLoading: documentsQuery.isLoading,
    isLoadingClearance: clearanceQuery.isLoading,
    isChangingClassification: changeClassification.isPending,
    isApproving: approveChange.isPending,

    // Errors
    error: documentsQuery.error,
    clearanceError: clearanceQuery.error,
    changeError: changeClassification.error,
    approvalError: approveChange.error,

    // Actions
    changeClassification: changeClassification.mutateAsync,
    approveChange: approveChange.mutateAsync,
    refreshDocuments,
  }
}

export default useDocumentClassificationManager
