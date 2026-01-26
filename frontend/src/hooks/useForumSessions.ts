/**
 * useForumSessions Hook
 *
 * Fetches engagement dossiers linked to a forum via dossier_relationships.
 * Forums like G20 are recurring events - each edition is an engagement dossier
 * linked to the parent forum via 'parent_of' relationship.
 *
 * Hierarchy:
 * Forum Dossier: "G20" (the recurring concept)
 * ├── Engagement: "G20 2024 - Brazil"
 * ├── Engagement: "G20 2023 - India"
 * └── Engagement: "G20 2022 - Indonesia"
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ForumSession {
  id: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  status: string
  created_at: string
  updated_at: string
  extension: {
    engagement_date?: string
    engagement_end_date?: string
    engagement_type?: string
    engagement_category?: string
    location?: string
    location_en?: string
    location_ar?: string
    participants?: string[]
    status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  } | null
  relationship_id: string
  relationship_type: string
}

export interface ForumSessionsResponse {
  sessions: ForumSession[]
  total: number
}

/**
 * Query Keys Factory for Forum Sessions
 */
export const forumSessionsKeys = {
  all: ['forum-sessions'] as const,
  list: (forumId: string) => [...forumSessionsKeys.all, 'list', forumId] as const,
}

/**
 * Fetch forum sessions (engagement dossiers linked to a forum)
 */
async function fetchForumSessions(forumId: string): Promise<ForumSessionsResponse> {
  // Query relationships where the forum is the source and target is an engagement
  // Using 'parent_of' or similar relationship types that link forums to their editions
  const { data: relationships, error: relError } = await supabase
    .from('dossier_relationships')
    .select(
      `
      id,
      relationship_type,
      target_dossier_id,
      target_dossier:dossiers!dossier_relationships_target_dossier_id_fkey (
        id,
        name_en,
        name_ar,
        description_en,
        description_ar,
        status,
        type,
        metadata,
        created_at,
        updated_at
      )
    `,
    )
    .eq('source_dossier_id', forumId)
    .in('relationship_type', ['parent_of', 'hosts', 'organizes'])
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (relError) {
    console.error('Error fetching forum sessions via relationships:', relError)
    throw relError
  }

  // Get engagement extension data for all target dossiers
  const targetIds = (relationships || [])
    .filter((rel) => rel.target_dossier && (rel.target_dossier as any).type === 'engagement')
    .map((rel) => rel.target_dossier_id)

  let engagementExtensions: Record<string, any> = {}
  if (targetIds.length > 0) {
    const { data: extensions } = await supabase
      .from('engagements')
      .select('id, engagement_type, engagement_category, location_en, location_ar')
      .in('id', targetIds)

    if (extensions) {
      engagementExtensions = extensions.reduce(
        (acc, ext) => {
          acc[ext.id] = ext
          return acc
        },
        {} as Record<string, any>,
      )
    }
  }

  // Get calendar entries for date information
  let calendarDates: Record<string, { event_date: string; duration_minutes?: number }> = {}
  if (targetIds.length > 0) {
    const { data: calendarEntries } = await supabase
      .from('calendar_entries')
      .select('dossier_id, event_date, duration_minutes')
      .in('dossier_id', targetIds)
      .order('event_date', { ascending: true })

    if (calendarEntries) {
      // Get the first (earliest) calendar entry for each dossier
      calendarDates = calendarEntries.reduce(
        (acc, entry) => {
          if (entry.dossier_id && !acc[entry.dossier_id]) {
            acc[entry.dossier_id] = {
              event_date: entry.event_date,
              duration_minutes: entry.duration_minutes ?? undefined,
            }
          }
          return acc
        },
        {} as Record<string, { event_date: string; duration_minutes?: number }>,
      )
    }
  }

  // Filter to only engagement type dossiers and combine data
  const engagementSessions: ForumSession[] = (relationships || [])
    .filter((rel) => rel.target_dossier && (rel.target_dossier as any).type === 'engagement')
    .map((rel) => {
      const dossier = rel.target_dossier as any
      const ext = engagementExtensions[dossier.id]
      const calendar = calendarDates[dossier.id]
      const metadata = dossier.metadata as Record<string, any> | null

      return {
        id: dossier.id,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
        description_en: dossier.description_en,
        description_ar: dossier.description_ar,
        status: dossier.status,
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
        extension: {
          engagement_type: ext?.engagement_type,
          engagement_category: ext?.engagement_category,
          location: ext?.location_en || ext?.location_ar,
          location_en: ext?.location_en,
          location_ar: ext?.location_ar,
          engagement_date: calendar?.event_date || metadata?.engagement_date,
          engagement_end_date: metadata?.engagement_end_date,
          status: metadata?.status as
            | 'upcoming'
            | 'ongoing'
            | 'completed'
            | 'cancelled'
            | undefined,
        },
        relationship_id: rel.id,
        relationship_type: rel.relationship_type,
      }
    })
    // Sort by engagement date (most recent first)
    .sort((a, b) => {
      const dateA = a.extension?.engagement_date || a.created_at
      const dateB = b.extension?.engagement_date || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

  return {
    sessions: engagementSessions,
    total: engagementSessions.length,
  }
}

/**
 * Hook to fetch forum sessions (editions/instances)
 *
 * @param forumId - The forum dossier ID
 * @param options - TanStack Query options
 *
 * @example
 * const { data, isLoading, error } = useForumSessions(forumId);
 * // data.sessions contains linked engagement dossiers
 */
export function useForumSessions(
  forumId: string,
  options?: Omit<UseQueryOptions<ForumSessionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: forumSessionsKeys.list(forumId),
    queryFn: () => fetchForumSessions(forumId),
    enabled: !!forumId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Get engagement status based on dates
 */
export function getSessionStatus(
  session: ForumSession,
): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' {
  // If explicitly set in extension, use that
  if (session.extension?.status) {
    return session.extension.status
  }

  // Derive from dates
  const now = new Date()
  const startDate = session.extension?.engagement_date
    ? new Date(session.extension.engagement_date)
    : null
  const endDate = session.extension?.engagement_end_date
    ? new Date(session.extension.engagement_end_date)
    : startDate

  if (!startDate) {
    return 'upcoming' // Default if no date
  }

  if (now < startDate) {
    return 'upcoming'
  } else if (endDate && now > endDate) {
    return 'completed'
  } else {
    return 'ongoing'
  }
}
