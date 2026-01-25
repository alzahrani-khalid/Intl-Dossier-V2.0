/**
 * Legislation Service
 * API client for legislation tracking operations
 */

import { supabase } from '@/lib/supabase'
import { COLUMNS } from '@/lib/query-columns'
import type {
  Legislation,
  LegislationWithDetails,
  LegislationCreateInput,
  LegislationUpdateInput,
  LegislationStatusUpdateInput,
  LegislationFilters,
  LegislationListResponse,
  LegislationSponsor,
  LegislationSponsorInput,
  LegislationAmendment,
  LegislationAmendmentInput,
  LegislationDeadline,
  LegislationDeadlineInput,
  LegislationStatusHistory,
  LegislationWatcher,
  LegislationWatcherInput,
  RelatedLegislation,
  RelatedLegislationInput,
  RelatedLegislationWithDetails,
  UpcomingDeadline,
  OpenCommentPeriod,
  LegislationDeadlineFilters,
} from '@/types/legislation.types'

// =============================================
// LEGISLATION CRUD
// =============================================

/**
 * Get a list of legislations with optional filters
 */
export async function getLegislations(
  filters?: LegislationFilters,
  cursor?: string,
  limit: number = 20,
): Promise<LegislationListResponse> {
  let query = supabase
    .from('legislations')
    .select(
      `
      *,
      dossier:dossiers!dossier_id(id, name_en, name_ar, type),
      parent_legislation:legislations!parent_legislation_id(id, title_en, title_ar, reference_number),
      sponsors:legislation_sponsors(count),
      amendments:legislation_amendments(count),
      deadlines:legislation_deadlines(count)
    `,
      { count: 'exact' },
    )
    .is('deleted_at', null)

  // Apply filters
  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'english',
    })
  }

  if (filters?.type?.length) {
    query = query.in('type', filters.type)
  }

  if (filters?.status?.length) {
    query = query.in('status', filters.status)
  }

  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.impact_level?.length) {
    query = query.in('impact_level', filters.impact_level)
  }

  if (filters?.jurisdiction) {
    query = query.ilike('jurisdiction', `%${filters.jurisdiction}%`)
  }

  if (filters?.dossier_id) {
    query = query.eq('dossier_id', filters.dossier_id)
  }

  if (filters?.tags?.length) {
    query = query.overlaps('tags', filters.tags)
  }

  if (filters?.sectors?.length) {
    query = query.overlaps('sectors', filters.sectors)
  }

  if (filters?.comment_period_status?.length) {
    query = query.in('comment_period_status', filters.comment_period_status)
  }

  if (filters?.introduced_date_from) {
    query = query.gte('introduced_date', filters.introduced_date_from)
  }

  if (filters?.introduced_date_to) {
    query = query.lte('introduced_date', filters.introduced_date_to)
  }

  if (filters?.effective_date_from) {
    query = query.gte('effective_date', filters.effective_date_from)
  }

  if (filters?.effective_date_to) {
    query = query.lte('effective_date', filters.effective_date_to)
  }

  if (filters?.has_open_comment_period) {
    const today = new Date().toISOString().split('T')[0]
    query = query.eq('comment_period_status', 'open').gte('comment_period_end', today)
  }

  // Cursor-based pagination
  if (cursor) {
    const [cursorDate, cursorId] = cursor.split('_')
    query = query.or(
      `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`,
    )
  }

  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch legislations: ${error.message}`)
  }

  const legislations = (data || []).map((item) => ({
    ...item,
    sponsors: undefined,
    amendments: undefined,
    deadlines: undefined,
    sponsors_count: item.sponsors?.[0]?.count ?? 0,
    amendments_count: item.amendments?.[0]?.count ?? 0,
    deadlines_count: item.deadlines?.[0]?.count ?? 0,
  })) as LegislationWithDetails[]

  const lastItem = legislations[legislations.length - 1]
  const nextCursor =
    legislations.length === limit && lastItem ? `${lastItem.created_at}_${lastItem.id}` : null

  return {
    legislations,
    totalCount: count ?? 0,
    nextCursor,
    hasMore: legislations.length === limit,
  }
}

/**
 * Get a single legislation by ID with full details
 */
export async function getLegislation(id: string): Promise<LegislationWithDetails> {
  const { data, error } = await supabase
    .from('legislations')
    .select(
      `
      *,
      dossier:dossiers!dossier_id(id, name_en, name_ar, type),
      parent_legislation:legislations!parent_legislation_id(id, title_en, title_ar, reference_number),
      sponsors:legislation_sponsors(*),
      amendments:legislation_amendments(*),
      deadlines:legislation_deadlines(*),
      status_history:legislation_status_history(*)
    `,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    throw new Error(`Failed to fetch legislation: ${error.message}`)
  }

  // Check if user is watching this legislation
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let isWatching = false
  if (user) {
    const { data: watchData } = await supabase
      .from('legislation_watchers')
      .select('id')
      .eq('legislation_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    isWatching = !!watchData
  }

  // Get watchers count
  const { count: watchersCount } = await supabase
    .from('legislation_watchers')
    .select('*', { count: 'exact', head: true })
    .eq('legislation_id', id)

  return {
    ...data,
    is_watching: isWatching,
    watchers_count: watchersCount ?? 0,
  } as LegislationWithDetails
}

/**
 * Create a new legislation
 */
export async function createLegislation(input: LegislationCreateInput): Promise<Legislation> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('legislations')
    .insert({
      ...input,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create legislation: ${error.message}`)
  }

  return data as Legislation
}

/**
 * Update an existing legislation
 */
export async function updateLegislation(
  id: string,
  input: LegislationUpdateInput,
): Promise<Legislation> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { version, ...updateData } = input

  const { data, error } = await supabase
    .from('legislations')
    .update({
      ...updateData,
      updated_by: user?.id,
    })
    .eq('id', id)
    .eq('version', version) // Optimistic locking
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Legislation was modified by another user. Please refresh and try again.')
    }
    throw new Error(`Failed to update legislation: ${error.message}`)
  }

  return data as Legislation
}

/**
 * Update legislation status with history tracking
 */
export async function updateLegislationStatus(
  input: LegislationStatusUpdateInput,
): Promise<Legislation> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id, status, change_reason, change_notes_en, change_notes_ar } = input

  // Get current version for optimistic locking
  const { data: current, error: fetchError } = await supabase
    .from('legislations')
    .select('version')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch legislation: ${fetchError.message}`)
  }

  const { data, error } = await supabase
    .from('legislations')
    .update({
      status,
      last_action_date: new Date().toISOString().split('T')[0],
      updated_by: user?.id,
    })
    .eq('id', id)
    .eq('version', current.version)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update legislation status: ${error.message}`)
  }

  // Note: Status history is automatically recorded by the trigger

  return data as Legislation
}

/**
 * Soft delete a legislation
 */
export async function deleteLegislation(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('legislations')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id,
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete legislation: ${error.message}`)
  }
}

// =============================================
// SPONSORS
// =============================================

export async function getLegislationSponsors(legislationId: string): Promise<LegislationSponsor[]> {
  const { data, error } = await supabase
    .from('legislation_sponsors')
    .select(COLUMNS.LEGISLATION_SPONSORS.LIST)
    .eq('legislation_id', legislationId)
    .order('sponsor_type', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch sponsors: ${error.message}`)
  }

  return data as LegislationSponsor[]
}

export async function addLegislationSponsor(
  input: LegislationSponsorInput,
): Promise<LegislationSponsor> {
  const { data, error } = await supabase
    .from('legislation_sponsors')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add sponsor: ${error.message}`)
  }

  return data as LegislationSponsor
}

export async function removeLegislationSponsor(id: string): Promise<void> {
  const { error } = await supabase.from('legislation_sponsors').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to remove sponsor: ${error.message}`)
  }
}

// =============================================
// AMENDMENTS
// =============================================

export async function getLegislationAmendments(
  legislationId: string,
): Promise<LegislationAmendment[]> {
  const { data, error } = await supabase
    .from('legislation_amendments')
    .select(COLUMNS.LEGISLATION_AMENDMENTS.LIST)
    .eq('legislation_id', legislationId)
    .order('proposed_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch amendments: ${error.message}`)
  }

  return data as LegislationAmendment[]
}

export async function createLegislationAmendment(
  input: LegislationAmendmentInput,
): Promise<LegislationAmendment> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get current legislation version
  const { data: legislation } = await supabase
    .from('legislations')
    .select('version')
    .eq('id', input.legislation_id)
    .single()

  const { data, error } = await supabase
    .from('legislation_amendments')
    .insert({
      ...input,
      legislation_version: legislation?.version,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create amendment: ${error.message}`)
  }

  return data as LegislationAmendment
}

export async function updateLegislationAmendment(
  id: string,
  input: Partial<LegislationAmendmentInput>,
): Promise<LegislationAmendment> {
  const { data, error } = await supabase
    .from('legislation_amendments')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update amendment: ${error.message}`)
  }

  return data as LegislationAmendment
}

// =============================================
// DEADLINES
// =============================================

export async function getLegislationDeadlines(
  legislationId: string,
): Promise<LegislationDeadline[]> {
  const { data, error } = await supabase
    .from('legislation_deadlines')
    .select(COLUMNS.LEGISLATION_DEADLINES.LIST)
    .eq('legislation_id', legislationId)
    .order('deadline_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch deadlines: ${error.message}`)
  }

  return data as LegislationDeadline[]
}

export async function createLegislationDeadline(
  input: LegislationDeadlineInput,
): Promise<LegislationDeadline> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('legislation_deadlines')
    .insert({
      ...input,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create deadline: ${error.message}`)
  }

  return data as LegislationDeadline
}

export async function updateLegislationDeadline(
  id: string,
  input: Partial<LegislationDeadlineInput>,
): Promise<LegislationDeadline> {
  const { data, error } = await supabase
    .from('legislation_deadlines')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update deadline: ${error.message}`)
  }

  return data as LegislationDeadline
}

export async function completeLegislationDeadline(id: string): Promise<LegislationDeadline> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('legislation_deadlines')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      completed_by: user?.id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to complete deadline: ${error.message}`)
  }

  return data as LegislationDeadline
}

export async function deleteLegislationDeadline(id: string): Promise<void> {
  const { error } = await supabase.from('legislation_deadlines').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete deadline: ${error.message}`)
  }
}

// =============================================
// UPCOMING DEADLINES & OPEN COMMENT PERIODS
// =============================================

export async function getUpcomingDeadlines(
  filters?: LegislationDeadlineFilters,
): Promise<UpcomingDeadline[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const daysAhead = filters?.days_ahead ?? 30

  const { data, error } = await supabase.rpc('get_user_legislation_deadlines', {
    p_user_id: user.id,
    p_days_ahead: daysAhead,
  })

  if (error) {
    throw new Error(`Failed to fetch upcoming deadlines: ${error.message}`)
  }

  return data as UpcomingDeadline[]
}

export async function getOpenCommentPeriods(): Promise<OpenCommentPeriod[]> {
  const { data, error } = await supabase.rpc('get_open_comment_periods')

  if (error) {
    throw new Error(`Failed to fetch open comment periods: ${error.message}`)
  }

  return data as OpenCommentPeriod[]
}

// =============================================
// STATUS HISTORY
// =============================================

export async function getLegislationStatusHistory(
  legislationId: string,
): Promise<LegislationStatusHistory[]> {
  const { data, error } = await supabase
    .from('legislation_status_history')
    .select(COLUMNS.LEGISLATION_STATUS_HISTORY.LIST)
    .eq('legislation_id', legislationId)
    .order('changed_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch status history: ${error.message}`)
  }

  return data as LegislationStatusHistory[]
}

// =============================================
// WATCHERS
// =============================================

export async function watchLegislation(
  input: LegislationWatcherInput,
): Promise<LegislationWatcher> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('legislation_watchers')
    .insert({
      ...input,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to watch legislation: ${error.message}`)
  }

  return data as LegislationWatcher
}

export async function unwatchLegislation(legislationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('legislation_watchers')
    .delete()
    .eq('legislation_id', legislationId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to unwatch legislation: ${error.message}`)
  }
}

export async function updateWatchPreferences(
  legislationId: string,
  preferences: Partial<Omit<LegislationWatcherInput, 'legislation_id'>>,
): Promise<LegislationWatcher> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('legislation_watchers')
    .update(preferences)
    .eq('legislation_id', legislationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update watch preferences: ${error.message}`)
  }

  return data as LegislationWatcher
}

export async function getMyWatchedLegislations(): Promise<LegislationWithDetails[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('legislation_watchers')
    .select(
      `
      legislation:legislations(
        *,
        dossier:dossiers!dossier_id(id, name_en, name_ar, type)
      )
    `,
    )
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to fetch watched legislations: ${error.message}`)
  }

  return (data || [])
    .map((item) => item.legislation)
    .filter((leg): leg is LegislationWithDetails => leg !== null && leg.deleted_at === null)
}

// =============================================
// RELATED LEGISLATIONS
// =============================================

export async function getRelatedLegislations(
  legislationId: string,
): Promise<RelatedLegislationWithDetails[]> {
  const { data, error } = await supabase
    .from('related_legislations')
    .select(
      `
      *,
      related_legislation:legislations!related_legislation_id(
        id, title_en, title_ar, reference_number, status, type
      )
    `,
    )
    .eq('legislation_id', legislationId)

  if (error) {
    throw new Error(`Failed to fetch related legislations: ${error.message}`)
  }

  return (data || []).filter(
    (item) => item.related_legislation?.deleted_at === null,
  ) as RelatedLegislationWithDetails[]
}

export async function addRelatedLegislation(
  input: RelatedLegislationInput,
): Promise<RelatedLegislation> {
  const { data, error } = await supabase
    .from('related_legislations')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add related legislation: ${error.message}`)
  }

  return data as RelatedLegislation
}

export async function removeRelatedLegislation(id: string): Promise<void> {
  const { error } = await supabase.from('related_legislations').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to remove related legislation: ${error.message}`)
  }
}

// =============================================
// SEARCH
// =============================================

export async function searchLegislations(
  query: string,
  limit: number = 20,
): Promise<Legislation[]> {
  const { data, error } = await supabase.rpc('search_legislations', {
    p_search_query: query,
    p_limit: limit,
  })

  if (error) {
    throw new Error(`Failed to search legislations: ${error.message}`)
  }

  return data as Legislation[]
}
