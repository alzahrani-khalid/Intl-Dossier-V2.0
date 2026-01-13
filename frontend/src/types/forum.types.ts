// Forum entity types for the unified dossier architecture
// These types extend the base dossier types with forum-specific fields

import type { DossierStatus } from './dossier'

// Forum status (extends dossier status with forum-specific states)
export type ForumStatus = DossierStatus | 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

// Sponsor tier levels
export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze'

// Keynote speaker structure (bilingual)
export interface KeynoteSpeaker {
  name_en: string
  name_ar: string
  title_en?: string
  title_ar?: string
  bio_en?: string
  bio_ar?: string
  photo_url?: string
  organization_en?: string
  organization_ar?: string
}

// Sponsor structure (bilingual)
export interface ForumSponsor {
  name_en: string
  name_ar: string
  logo_url?: string
  tier?: SponsorTier
  website?: string
}

// Forum extension data (stored in forums extension table)
export interface ForumExtension {
  id?: string
  number_of_sessions?: number
  keynote_speakers?: KeynoteSpeaker[]
  sponsors?: ForumSponsor[]
  registration_fee?: number
  currency?: string
  agenda_url?: string
  live_stream_url?: string
}

// Complete forum entity (base dossier + extension)
export interface Forum {
  // Base dossier fields
  id: string
  type: 'forum'
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  status: DossierStatus
  sensitivity_level: number
  tags: string[]
  metadata: Record<string, unknown>
  search_vector?: string
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  is_active?: boolean
  // Forum extension
  extension: ForumExtension
}

// Request type for creating a forum
export interface ForumCreateRequest {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extension?: Omit<ForumExtension, 'id'>
}

// Request type for updating a forum
export interface ForumUpdateRequest {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extension?: Partial<Omit<ForumExtension, 'id'>>
}

// Pagination info
export interface Pagination {
  page: number
  limit: number
  total: number | null
  totalPages: number
}

// List response type
export interface ForumListResponse {
  data: Forum[]
  pagination: Pagination
}

// Forum filters for list queries
export interface ForumFilters {
  search?: string
  status?: DossierStatus
  page?: number
  limit?: number
}

// API error response
export interface ForumApiError {
  error: {
    code: string
    message_en: string
    message_ar: string
    details?: string
  }
}

// Forum with related data (for detail views)
export interface ForumWithRelations extends Forum {
  participants_count?: number
  sessions_count?: number
  documents_count?: number
  relationships?: Array<{
    id: string
    relationship_type: string
    target_dossier: {
      id: string
      name_en: string
      name_ar: string
      type: string
    }
  }>
}
