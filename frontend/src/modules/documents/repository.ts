/**
 * Documents Module - Repository
 *
 * Data access layer for the Documents module.
 * All database operations are encapsulated here.
 *
 * @module documents/repository
 */

import { supabase } from '@/lib/supabase-client'
import type {
  Document,
  DocumentVersion,
  DocumentLink,
  DocumentSearchParams,
  DocumentCreateParams,
  DocumentUpdateParams,
  DocumentListResponse,
  DocumentUploadResponse,
  DocumentLinkType,
} from './types'

// ============================================================================
// Document Repository
// ============================================================================

export const documentRepository = {
  /**
   * List documents with filters and pagination
   */
  async list(params: DocumentSearchParams = {}): Promise<DocumentListResponse> {
    const {
      search,
      documentTypes,
      classifications,
      tags,
      createdBy,
      createdAfter,
      createdBefore,
      linkedModuleId,
      linkedEntityType,
      linkedEntityId,
      includeDeleted = false,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortDirection = 'desc',
    } = params

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    if (search) {
      query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`)
    }

    if (documentTypes?.length) {
      query = query.in('document_type', documentTypes)
    }

    if (classifications?.length) {
      query = query.in('classification', classifications)
    }

    if (tags?.length) {
      query = query.overlaps('tags', tags)
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy)
    }

    if (createdAfter) {
      query = query.gte('created_at', createdAfter)
    }

    if (createdBefore) {
      query = query.lte('created_at', createdBefore)
    }

    // Filter by linked entity
    if (linkedModuleId || linkedEntityType || linkedEntityId) {
      const linkQuery = supabase.from('document_links').select('document_id')

      if (linkedModuleId) {
        linkQuery.eq('linked_module', linkedModuleId)
      }
      if (linkedEntityType) {
        linkQuery.eq('linked_entity_type', linkedEntityType)
      }
      if (linkedEntityId) {
        linkQuery.eq('linked_entity_id', linkedEntityId)
      }

      const { data: links } = await linkQuery

      if (links?.length) {
        query = query.in(
          'id',
          links.map((l) => l.document_id),
        )
      } else {
        // No matching links, return empty result
        return {
          documents: [],
          total: 0,
          limit,
          offset,
          hasMore: false,
        }
      }
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list documents: ${error.message}`)
    }

    return {
      documents: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    }
  },

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      throw new Error(`Document not found: ${error.message}`)
    }

    return data
  },

  /**
   * Create a new document
   */
  async create(params: DocumentCreateParams, userId: string): Promise<DocumentUploadResponse> {
    const {
      name_en,
      name_ar,
      description_en,
      description_ar,
      document_type,
      classification,
      file,
      tags,
      metadata,
      linkedEntities,
    } = params

    // Generate file path
    const timestamp = Date.now()
    const fileName = `${timestamp}_${name_en.replace(/[^a-zA-Z0-9]/g, '_')}`
    const filePath = `documents/${userId}/${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Create document record
    const documentData = {
      name_en,
      name_ar,
      description_en,
      description_ar,
      document_type,
      mime_type: file.type,
      file_size: file.size,
      file_path: filePath,
      storage_bucket: 'documents',
      classification,
      version_number: 1,
      is_latest_version: true,
      tags,
      metadata,
      created_by: userId,
    }

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (docError) {
      // Clean up uploaded file on error
      await supabase.storage.from('documents').remove([filePath])
      throw new Error(`Failed to create document: ${docError.message}`)
    }

    // Create initial version
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        version_number: 1,
        file_path: filePath,
        file_size: file.size,
        created_by: userId,
      })
      .select()
      .single()

    if (versionError) {
      console.warn('Failed to create version record:', versionError.message)
    }

    // Create links if provided
    if (linkedEntities?.length) {
      const links = linkedEntities.map((entity) => ({
        document_id: document.id,
        linked_module: entity.moduleId,
        linked_entity_type: entity.entityType,
        linked_entity_id: entity.entityId,
        link_type: entity.linkType || 'reference',
        created_by: userId,
      }))

      await supabase.from('document_links').insert(links)
    }

    return {
      document,
      version: version || {
        id: '',
        document_id: document.id,
        version_number: 1,
        file_path: filePath,
        file_size: file.size,
        created_by: userId,
        created_at: document.created_at,
      },
    }
  },

  /**
   * Update a document
   */
  async update(id: string, params: DocumentUpdateParams, userId: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...params,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`)
    }

    return data
  },

  /**
   * Soft delete a document
   */
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`)
    }
  },

  /**
   * Get document versions
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })

    if (error) {
      throw new Error(`Failed to get versions: ${error.message}`)
    }

    return data || []
  },

  /**
   * Get document links
   */
  async getLinks(documentId: string): Promise<DocumentLink[]> {
    const { data, error } = await supabase
      .from('document_links')
      .select('*')
      .eq('document_id', documentId)

    if (error) {
      throw new Error(`Failed to get links: ${error.message}`)
    }

    return data || []
  },

  /**
   * Get documents linked to an entity
   */
  async getLinkedDocuments(
    moduleId: string,
    entityType: string,
    entityId: string,
  ): Promise<Document[]> {
    const { data: links, error: linkError } = await supabase
      .from('document_links')
      .select('document_id')
      .eq('linked_module', moduleId)
      .eq('linked_entity_type', entityType)
      .eq('linked_entity_id', entityId)

    if (linkError) {
      throw new Error(`Failed to get document links: ${linkError.message}`)
    }

    if (!links?.length) {
      return []
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in(
        'id',
        links.map((l) => l.document_id),
      )
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to get linked documents: ${error.message}`)
    }

    return data || []
  },

  /**
   * Link a document to an entity
   */
  async linkDocument(
    documentId: string,
    moduleId: string,
    entityType: string,
    entityId: string,
    linkType: DocumentLinkType,
    userId: string,
  ): Promise<DocumentLink> {
    // Check for existing link
    const { data: existing } = await supabase
      .from('document_links')
      .select('id')
      .eq('document_id', documentId)
      .eq('linked_module', moduleId)
      .eq('linked_entity_type', entityType)
      .eq('linked_entity_id', entityId)
      .single()

    if (existing) {
      throw new Error('Document is already linked to this entity')
    }

    const { data, error } = await supabase
      .from('document_links')
      .insert({
        document_id: documentId,
        linked_module: moduleId,
        linked_entity_type: entityType,
        linked_entity_id: entityId,
        link_type: linkType,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to link document: ${error.message}`)
    }

    return data
  },

  /**
   * Unlink a document from an entity
   */
  async unlinkDocument(
    documentId: string,
    moduleId: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('document_links')
      .delete()
      .eq('document_id', documentId)
      .eq('linked_module', moduleId)
      .eq('linked_entity_type', entityType)
      .eq('linked_entity_id', entityId)

    if (error) {
      throw new Error(`Failed to unlink document: ${error.message}`)
    }
  },

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(document: Document): Promise<string> {
    const { data, error } = await supabase.storage
      .from(document.storage_bucket)
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`)
    }

    return data.signedUrl
  },
}

export type DocumentRepository = typeof documentRepository
