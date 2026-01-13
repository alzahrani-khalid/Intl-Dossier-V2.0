/**
 * useSmartImportSuggestions Hook
 *
 * Detects available data sources and provides smart import suggestions
 * for empty sections. Integrates with calendar sync, email, and document systems.
 */

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCalendarConnections } from './useCalendarSync'
import type {
  DataSource,
  DataSourceType,
  ImportableSection,
  ImportSuggestion,
  ImportPreviewRequest,
  ImportPreviewResponse,
  ExecuteImportRequest,
  ExecuteImportResponse,
  UseSmartImportSuggestionsOptions,
  UseSmartImportSuggestionsReturn,
  FieldMapping,
  ImportableItem,
} from '@/types/smart-import.types'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-import-suggestions`

// Query keys
export const smartImportKeys = {
  all: ['smart-import'] as const,
  suggestions: (section: ImportableSection, entityId: string) =>
    [...smartImportKeys.all, 'suggestions', section, entityId] as const,
  preview: (sourceId: string, section: ImportableSection) =>
    [...smartImportKeys.all, 'preview', sourceId, section] as const,
  dataSources: (section: ImportableSection) =>
    [...smartImportKeys.all, 'data-sources', section] as const,
}

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }
}

// API helper
async function fetchSmartImport<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Map section to relevant data source types
const sectionToDataSources: Record<ImportableSection, DataSourceType[]> = {
  documents: ['document', 'existing_dossier', 'email'],
  contacts: ['email_signature', 'existing_dossier', 'external_api'],
  events: ['calendar', 'email'],
  briefs: ['document', 'existing_dossier'],
  relationships: ['existing_dossier'],
}

// Default field mappings by section
const defaultFieldMappings: Record<ImportableSection, FieldMapping[]> = {
  documents: [
    {
      sourceField: 'name',
      targetField: 'file_name',
      displayName: 'File Name',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'url',
      targetField: 'file_path',
      displayName: 'File Path',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'mimeType',
      targetField: 'mime_type',
      displayName: 'MIME Type',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'size',
      targetField: 'size_bytes',
      displayName: 'Size',
      isRequired: false,
      isAutoMapped: true,
    },
  ],
  contacts: [
    {
      sourceField: 'name',
      targetField: 'name',
      displayName: 'Full Name',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'email',
      targetField: 'email',
      displayName: 'Email',
      isRequired: false,
      isAutoMapped: true,
      transform: 'extract_email',
    },
    {
      sourceField: 'title',
      targetField: 'title',
      displayName: 'Title/Position',
      isRequired: false,
      isAutoMapped: true,
    },
    {
      sourceField: 'organization',
      targetField: 'organization',
      displayName: 'Organization',
      isRequired: false,
      isAutoMapped: true,
    },
    {
      sourceField: 'phone',
      targetField: 'phone',
      displayName: 'Phone',
      isRequired: false,
      isAutoMapped: true,
    },
  ],
  events: [
    {
      sourceField: 'summary',
      targetField: 'title',
      displayName: 'Event Title',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'start',
      targetField: 'start_time',
      displayName: 'Start Time',
      isRequired: true,
      isAutoMapped: true,
      transform: 'parse_date',
    },
    {
      sourceField: 'end',
      targetField: 'end_time',
      displayName: 'End Time',
      isRequired: true,
      isAutoMapped: true,
      transform: 'parse_date',
    },
    {
      sourceField: 'description',
      targetField: 'description',
      displayName: 'Description',
      isRequired: false,
      isAutoMapped: true,
    },
    {
      sourceField: 'location',
      targetField: 'location',
      displayName: 'Location',
      isRequired: false,
      isAutoMapped: true,
    },
    {
      sourceField: 'attendees',
      targetField: 'participants',
      displayName: 'Participants',
      isRequired: false,
      isAutoMapped: true,
    },
  ],
  briefs: [
    {
      sourceField: 'title',
      targetField: 'title',
      displayName: 'Brief Title',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'content',
      targetField: 'content',
      displayName: 'Content',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'source',
      targetField: 'source_document_id',
      displayName: 'Source Document',
      isRequired: false,
      isAutoMapped: true,
    },
  ],
  relationships: [
    {
      sourceField: 'targetId',
      targetField: 'target_dossier_id',
      displayName: 'Related Dossier',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'type',
      targetField: 'relationship_type',
      displayName: 'Relationship Type',
      isRequired: true,
      isAutoMapped: true,
    },
    {
      sourceField: 'description',
      targetField: 'description',
      displayName: 'Description',
      isRequired: false,
      isAutoMapped: true,
    },
  ],
}

/**
 * Hook for smart import suggestions
 */
export function useSmartImportSuggestions({
  section,
  entityId,
  entityType,
  autoDetect = true,
  onSuggestionsLoaded,
}: UseSmartImportSuggestionsOptions): UseSmartImportSuggestionsReturn {
  const queryClient = useQueryClient()
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null)

  // Get calendar connections for calendar data sources
  const { data: calendarConnections = [] } = useCalendarConnections()

  // Build data sources based on connected services
  const buildDataSources = useCallback((): DataSource[] => {
    const relevantTypes = sectionToDataSources[section] || []
    const sources: DataSource[] = []

    // Calendar sources
    if (relevantTypes.includes('calendar')) {
      calendarConnections.forEach((conn) => {
        if (conn.status === 'active') {
          sources.push({
            id: `calendar-${conn.id}`,
            type: 'calendar',
            name: `${conn.provider} Calendar`,
            nameAr: `تقويم ${conn.provider}`,
            description: `Import events from your ${conn.provider} calendar`,
            descriptionAr: `استيراد الأحداث من تقويم ${conn.provider}`,
            status: 'connected',
            icon: 'Calendar',
            providerId: conn.id,
            isRecommended: section === 'events',
          })
        }
      })

      // Add generic calendar suggestion if no connections
      if (calendarConnections.length === 0) {
        sources.push({
          id: 'calendar-connect',
          type: 'calendar',
          name: 'Connect Calendar',
          nameAr: 'ربط التقويم',
          description: 'Connect Google or Outlook to import events',
          descriptionAr: 'اربط Google أو Outlook لاستيراد الأحداث',
          status: 'disconnected',
          icon: 'Calendar',
          isRecommended: section === 'events',
        })
      }
    }

    // Email/email signature sources
    if (relevantTypes.includes('email') || relevantTypes.includes('email_signature')) {
      sources.push({
        id: 'email-contacts',
        type: 'email_signature',
        name: 'Email Contacts',
        nameAr: 'جهات اتصال البريد',
        description: 'Extract contacts from recent email signatures',
        descriptionAr: 'استخراج جهات الاتصال من توقيعات البريد الأخيرة',
        status: 'connected', // Assume connected if email integration exists
        icon: 'Mail',
        isRecommended: section === 'contacts',
      })
    }

    // Document sources
    if (relevantTypes.includes('document')) {
      sources.push({
        id: 'existing-documents',
        type: 'document',
        name: 'Existing Documents',
        nameAr: 'المستندات الموجودة',
        description: 'Link documents already uploaded to the system',
        descriptionAr: 'ربط المستندات المرفوعة مسبقاً في النظام',
        status: 'connected',
        icon: 'FileText',
        isRecommended: section === 'documents' || section === 'briefs',
      })
    }

    // Existing dossier sources
    if (relevantTypes.includes('existing_dossier')) {
      sources.push({
        id: 'related-dossiers',
        type: 'existing_dossier',
        name: 'Related Dossiers',
        nameAr: 'الملفات ذات الصلة',
        description: 'Import data from related dossiers in the system',
        descriptionAr: 'استيراد البيانات من الملفات ذات الصلة في النظام',
        status: 'connected',
        icon: 'FolderOpen',
        isRecommended: section === 'relationships',
      })
    }

    return sources
  }, [section, calendarConnections])

  // Query for suggestions
  const suggestionsQuery = useQuery({
    queryKey: smartImportKeys.suggestions(section, entityId),
    queryFn: async (): Promise<ImportSuggestion> => {
      const dataSources = buildDataSources()
      const connectedSources = dataSources.filter((s) => s.status === 'connected')
      const recommendedSource = dataSources.find((s) => s.isRecommended && s.status === 'connected')

      // Try to get item counts from the server
      try {
        const response = await fetchSmartImport<{
          dataSources: Array<{ id: string; itemCount: number }>
        }>(`/suggestions?section=${section}&entityId=${entityId}&entityType=${entityType}`)

        // Update data sources with item counts
        response.dataSources.forEach((serverSource) => {
          const localSource = dataSources.find((s) => s.id === serverSource.id)
          if (localSource) {
            localSource.itemCount = serverSource.itemCount
          }
        })
      } catch {
        // Server call failed, use local data sources without counts
      }

      const totalAvailableItems = dataSources.reduce((sum, s) => sum + (s.itemCount || 0), 0)

      const suggestion: ImportSuggestion = {
        section,
        dataSources,
        recommendedSource,
        totalAvailableItems,
        hasAvailableData: connectedSources.length > 0 && totalAvailableItems > 0,
        message:
          connectedSources.length > 0
            ? `${connectedSources.length} connected source${connectedSources.length > 1 ? 's' : ''} available`
            : 'Connect services to import data',
        messageAr:
          connectedSources.length > 0
            ? `${connectedSources.length} مصدر${connectedSources.length > 1 ? ' متصل' : ''} متاح`
            : 'اربط الخدمات لاستيراد البيانات',
      }

      onSuggestionsLoaded?.(suggestion)
      return suggestion
    },
    enabled: autoDetect,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (request: ImportPreviewRequest): Promise<ImportPreviewResponse> => {
      // For local sources, build preview locally
      if (request.sourceType === 'document' && request.sourceId === 'existing-documents') {
        return buildLocalDocumentPreview(request)
      }

      if (request.sourceType === 'existing_dossier' && request.sourceId === 'related-dossiers') {
        return buildLocalDossierPreview(request)
      }

      // For external sources, call the API
      return fetchSmartImport<ImportPreviewResponse>('/preview', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    onSuccess: (data) => {
      setPreviewData(data)
    },
  })

  // Execute import mutation
  const importMutation = useMutation({
    mutationFn: async (request: ExecuteImportRequest): Promise<ExecuteImportResponse> => {
      return fetchSmartImport<ExecuteImportResponse>('/execute', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-entries'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
    },
  })

  // Preview source function
  const previewSource = useCallback(
    async (sourceId: string): Promise<ImportPreviewResponse> => {
      const source = suggestionsQuery.data?.dataSources.find((s) => s.id === sourceId)
      if (!source) {
        throw new Error('Source not found')
      }

      const request: ImportPreviewRequest = {
        sourceId,
        sourceType: source.type,
        targetSection: section,
        entityId,
        entityType,
        limit: 50,
      }

      return previewMutation.mutateAsync(request)
    },
    [suggestionsQuery.data, section, entityId, entityType, previewMutation],
  )

  // Execute import function
  const executeImport = useCallback(
    async (request: ExecuteImportRequest): Promise<ExecuteImportResponse> => {
      return importMutation.mutateAsync(request)
    },
    [importMutation],
  )

  // Refresh function
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: smartImportKeys.suggestions(section, entityId) })
  }, [queryClient, section, entityId])

  // Memoized data sources
  const dataSources = useMemo(() => {
    return suggestionsQuery.data?.dataSources || buildDataSources()
  }, [suggestionsQuery.data, buildDataSources])

  return {
    suggestions: suggestionsQuery.data || null,
    isLoading: suggestionsQuery.isLoading,
    error: suggestionsQuery.error as Error | null,
    dataSources,
    hasDataSources: dataSources.some((s) => s.status === 'connected'),
    previewSource,
    executeImport,
    isPreviewLoading: previewMutation.isPending,
    isImporting: importMutation.isPending,
    refresh,
  }
}

// Helper function to build local document preview
async function buildLocalDocumentPreview(
  request: ImportPreviewRequest,
): Promise<ImportPreviewResponse> {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .neq('entity_id', request.entityId)
    .limit(request.limit || 50)
    .order('uploaded_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  const items: ImportableItem[] = (documents || []).map((doc) => ({
    id: doc.id,
    sourceId: 'existing-documents',
    sourceType: 'document',
    title: doc.file_name,
    preview: `${formatFileSize(doc.size_bytes)} • ${doc.mime_type}`,
    selected: false,
    rawData: doc,
    mappedData: {
      file_name: doc.file_name,
      file_path: doc.file_path,
      mime_type: doc.mime_type,
      size_bytes: doc.size_bytes,
    },
    mappingConfidence: 1,
    timestamp: doc.uploaded_at,
  }))

  return {
    items,
    fieldMappings: defaultFieldMappings.documents,
    totalCount: items.length,
    hasMore: items.length >= (request.limit || 50),
    generatedAt: new Date().toISOString(),
  }
}

// Helper function to build local dossier preview
async function buildLocalDossierPreview(
  request: ImportPreviewRequest,
): Promise<ImportPreviewResponse> {
  const { data: dossiers, error } = await supabase
    .from('dossiers')
    .select('id, name, name_ar, dossier_type, created_at')
    .neq('id', request.entityId)
    .limit(request.limit || 50)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch dossiers: ${error.message}`)
  }

  const items: ImportableItem[] = (dossiers || []).map((dossier) => ({
    id: dossier.id,
    sourceId: 'related-dossiers',
    sourceType: 'existing_dossier',
    title: dossier.name,
    titleAr: dossier.name_ar,
    preview: dossier.dossier_type,
    selected: false,
    rawData: dossier,
    mappedData: {
      target_dossier_id: dossier.id,
      relationship_type: 'related_to',
    },
    mappingConfidence: 0.8,
    timestamp: dossier.created_at,
  }))

  return {
    items,
    fieldMappings: defaultFieldMappings.relationships,
    totalCount: items.length,
    hasMore: items.length >= (request.limit || 50),
    generatedAt: new Date().toISOString(),
  }
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default useSmartImportSuggestions
