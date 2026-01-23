import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import { cacheHelpers } from '../config/redis'

type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'theme'
  | 'working_group'
  | 'person'
type DossierStatus = 'active' | 'inactive' | 'archived' | 'deleted'

// Cache configuration constants
const CACHE_TTL = {
  DOSSIER: 300, // 5 minutes for individual dossiers
  LIST: 300, // 5 minutes for dossier lists (optimized with materialized view)
  DOCUMENTS: 240, // 4 minutes for document links
  PERSONS: 240, // 4 minutes for organization persons
} as const

const CACHE_KEYS = {
  DOSSIER: (id: string) => `dossier:${id}`,
  LIST: (type?: string, status?: string, limit?: number, offset?: number) =>
    `dossier:list:${type || 'all'}:${status || 'all'}:${limit || 50}:${offset || 0}`,
  DOCUMENTS: (id: string) => `dossier:docs:${id}`,
  PERSONS: (orgId: string) => `dossier:persons:${orgId}`,
} as const

interface CreateDossierBase {
  type: DossierType
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
}

interface DossierExtensionData {
  // Country-specific fields
  iso_code_2?: string
  iso_code_3?: string
  capital_en?: string
  capital_ar?: string
  region?: string
  subregion?: string
  population?: number
  area_sq_km?: number
  flag_url?: string

  // Organization-specific fields
  org_code?: string
  org_type?: 'government' | 'ngo' | 'private' | 'international' | 'academic'
  headquarters_country_id?: string
  parent_org_id?: string
  website?: string
  email?: string
  phone?: string
  address_en?: string
  address_ar?: string
  logo_url?: string
  established_date?: string

  // Forum-specific fields
  number_of_sessions?: number
  keynote_speakers?: Array<{ name: string; title: string; org: string }>
  sponsors?: Array<unknown>
  registration_fee?: number
  currency?: string
  agenda_url?: string
  live_stream_url?: string

  // Engagement-specific fields
  engagement_type?:
    | 'meeting'
    | 'consultation'
    | 'coordination'
    | 'workshop'
    | 'conference'
    | 'site_visit'
    | 'ceremony'
  engagement_category?: 'bilateral' | 'multilateral' | 'regional' | 'internal'
  location_en?: string
  location_ar?: string

  // Theme-specific fields
  theme_category?: 'policy' | 'technical' | 'strategic' | 'operational'
  parent_theme_id?: string

  // Working Group-specific fields
  mandate_en?: string
  mandate_ar?: string
  lead_org_id?: string
  wg_status?: 'active' | 'suspended' | 'disbanded'
  established_date?: string
  disbandment_date?: string

  // Person-specific fields
  title_en?: string
  title_ar?: string
  organization_id?: string
  nationality_country_id?: string
  biography_en?: string
  biography_ar?: string
  photo_url?: string
}

interface CreateDossierInput extends CreateDossierBase {
  extensionData?: DossierExtensionData
}

interface UpdateDossierInput {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extensionData?: DossierExtensionData
}

/**
 * DossierService - Unified service for managing all dossier types using Class Table Inheritance pattern
 *
 * This service provides CRUD operations for the unified dossier architecture where:
 * - All entities share a common dossiers base table (id, type, names, status, etc.)
 * - Type-specific data stored in extension tables (countries, organizations, etc.)
 * - Single ID namespace eliminates table-switching confusion
 *
 * @example
 * // Create a country dossier
 * const country = await dossierService.createCountryDossier({
 *   name_en: 'Saudi Arabia',
 *   name_ar: 'المملكة العربية السعودية',
 *   iso_code_2: 'SA',
 *   iso_code_3: 'SAU'
 * });
 *
 * @example
 * // Get any dossier with extension data
 * const dossier = await dossierService.getDossierWithExtension('uuid-here');
 * // Returns: { id, type, name_en, name_ar, ..., extensionData: {...} }
 */
export class DossierService {
  private supabase: SupabaseClient<Database>

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_ANON_KEY!,
    )
  }

  /**
   * Create a country dossier with extension data
   * @param input - Country-specific data including ISO codes, capital, etc.
   * @returns Created dossier with extension data
   */
  async createCountryDossier(
    input: CreateDossierBase & {
      iso_code_2: string
      iso_code_3: string
      capital_en?: string
      capital_ar?: string
      region?: string
      subregion?: string
      population?: number
      area_sq_km?: number
      flag_url?: string
    },
  ) {
    const {
      iso_code_2,
      iso_code_3,
      capital_en,
      capital_ar,
      region,
      subregion,
      population,
      area_sq_km,
      flag_url,
      ...baseData
    } = input

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'country',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert country extension
    const { data: countryData, error: countryError } = await this.supabase
      .from('countries')
      .insert({
        id: dossier.id,
        iso_code_2,
        iso_code_3,
        capital_en,
        capital_ar,
        region,
        subregion,
        population,
        area_sq_km,
        flag_url,
      })
      .select()
      .single()

    if (countryError) {
      // Rollback: delete dossier if country insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw countryError
    }

    // T131: Invalidate list caches after creating new dossier
    await this.invalidateListCaches()

    return { ...dossier, extensionData: countryData }
  }

  /**
   * Create an organization dossier with extension data
   * @param input - Organization-specific data including org_code, org_type, etc.
   * @returns Created dossier with extension data
   */
  async createOrganizationDossier(
    input: CreateDossierBase & {
      org_code?: string
      org_type: 'government' | 'ngo' | 'private' | 'international' | 'academic'
      headquarters_country_id?: string
      parent_org_id?: string
      website?: string
      email?: string
      phone?: string
      address_en?: string
      address_ar?: string
      logo_url?: string
      established_date?: string
    },
  ) {
    const {
      org_code,
      org_type,
      headquarters_country_id,
      parent_org_id,
      website,
      email,
      phone,
      address_en,
      address_ar,
      logo_url,
      established_date,
      ...baseData
    } = input

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'organization',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert organization extension
    const { data: orgData, error: orgError } = await this.supabase
      .from('organizations')
      .insert({
        id: dossier.id,
        org_code,
        org_type,
        headquarters_country_id,
        parent_org_id,
        website,
        email,
        phone,
        address_en,
        address_ar,
        logo_url,
        established_date,
      })
      .select()
      .single()

    if (orgError) {
      // Rollback: delete dossier if organization insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw orgError
    }

    return { ...dossier, extensionData: orgData }
  }

  /**
   * Create a forum dossier with extension data
   * @param input - Forum-specific data including sessions, speakers, etc.
   * @returns Created dossier with extension data
   */
  async createForumDossier(
    input: CreateDossierBase & {
      number_of_sessions?: number
      keynote_speakers?: Array<{ name: string; title: string; org: string }>
      sponsors?: Array<unknown>
      registration_fee?: number
      currency?: string
      agenda_url?: string
      live_stream_url?: string
    },
  ) {
    const {
      number_of_sessions,
      keynote_speakers,
      sponsors,
      registration_fee,
      currency,
      agenda_url,
      live_stream_url,
      ...baseData
    } = input

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'forum',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert forum extension
    const { data: forumData, error: forumError } = await this.supabase
      .from('forums')
      .insert({
        id: dossier.id,
        number_of_sessions,
        keynote_speakers,
        sponsors,
        registration_fee,
        currency,
        agenda_url,
        live_stream_url,
      })
      .select()
      .single()

    if (forumError) {
      // Rollback: delete dossier if forum insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw forumError
    }

    return { ...dossier, extensionData: forumData }
  }

  /**
   * Create an engagement dossier with extension data
   * @param input - Engagement-specific data including engagement_type, category, location
   * @returns Created dossier with extension data
   */
  async createEngagementDossier(
    input: CreateDossierBase & {
      engagement_type:
        | 'meeting'
        | 'consultation'
        | 'coordination'
        | 'workshop'
        | 'conference'
        | 'site_visit'
        | 'ceremony'
      engagement_category: 'bilateral' | 'multilateral' | 'regional' | 'internal'
      location_en?: string
      location_ar?: string
    },
  ) {
    const { engagement_type, engagement_category, location_en, location_ar, ...baseData } = input

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'engagement',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert engagement extension
    const { data: engagementData, error: engagementError } = await this.supabase
      .from('engagements')
      .insert({
        id: dossier.id,
        engagement_type,
        engagement_category,
        location_en,
        location_ar,
      })
      .select()
      .single()

    if (engagementError) {
      // Rollback: delete dossier if engagement insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw engagementError
    }

    return { ...dossier, extensionData: engagementData }
  }

  /**
   * Create a theme dossier with extension data
   * @param input - Theme-specific data including category and parent theme
   * @returns Created dossier with extension data
   */
  async createThemeDossier(
    input: CreateDossierBase & {
      theme_category: 'policy' | 'technical' | 'strategic' | 'operational'
      parent_theme_id?: string
    },
  ) {
    const { theme_category, parent_theme_id, ...baseData } = input

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'theme',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert theme extension
    const { data: themeData, error: themeError } = await this.supabase
      .from('themes')
      .insert({
        id: dossier.id,
        theme_category,
        parent_theme_id,
      })
      .select()
      .single()

    if (themeError) {
      // Rollback: delete dossier if theme insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw themeError
    }

    return { ...dossier, extensionData: themeData }
  }

  /**
   * Create a working group dossier with extension data
   * @param input - Working group-specific data including mandate, lead org, status
   * @returns Created dossier with extension data
   */
  async createWorkingGroupDossier(
    input: CreateDossierBase & {
      mandate_en?: string
      mandate_ar?: string
      lead_org_id?: string
      wg_status?: 'active' | 'suspended' | 'disbanded'
      established_date?: string
      disbandment_date?: string
    },
  ) {
    const {
      mandate_en,
      mandate_ar,
      lead_org_id,
      wg_status,
      established_date,
      disbandment_date,
      ...baseData
    } = input

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'working_group',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert working group extension
    const { data: wgData, error: wgError } = await this.supabase
      .from('working_groups')
      .insert({
        id: dossier.id,
        mandate_en,
        mandate_ar,
        lead_org_id,
        wg_status,
        established_date,
        disbandment_date,
      })
      .select()
      .single()

    if (wgError) {
      // Rollback: delete dossier if working group insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw wgError
    }

    return { ...dossier, extensionData: wgData }
  }

  /**
   * Create a person dossier with extension data
   * @param input - Person-specific data including title, organization, nationality
   * @returns Created dossier with extension data
   */
  async createPersonDossier(
    input: CreateDossierBase & {
      title_en?: string
      title_ar?: string
      organization_id?: string
      nationality_country_id?: string
      email?: string
      phone?: string
      biography_en?: string
      biography_ar?: string
      photo_url?: string
    },
  ) {
    const {
      title_en,
      title_ar,
      organization_id,
      nationality_country_id,
      email,
      phone,
      biography_en,
      biography_ar,
      photo_url,
      ...baseData
    } = input

    // Validate person-specific fields
    if (title_en && title_en.trim().length === 0) {
      throw new Error('title_en cannot be empty')
    }
    if (title_ar && title_ar.trim().length === 0) {
      throw new Error('title_ar cannot be empty')
    }

    // Validate organization_id references a valid organization dossier
    if (organization_id) {
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('id', organization_id)
        .single()

      if (orgError || !org) {
        throw new Error(
          `Invalid organization_id: ${organization_id} does not reference a valid organization dossier`,
        )
      }
    }

    // Validate nationality_country_id references a valid country dossier
    if (nationality_country_id) {
      const { data: country, error: countryError } = await this.supabase
        .from('countries')
        .select('id')
        .eq('id', nationality_country_id)
        .single()

      if (countryError || !country) {
        throw new Error(
          `Invalid nationality_country_id: ${nationality_country_id} does not reference a valid country dossier`,
        )
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format')
    }

    // Insert base dossier
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'person',
        ...baseData,
      })
      .select()
      .single()

    if (dossierError) throw dossierError

    // Insert person extension
    const { data: personData, error: personError } = await this.supabase
      .from('persons')
      .insert({
        id: dossier.id,
        title_en,
        title_ar,
        organization_id,
        nationality_country_id,
        email,
        phone,
        biography_en,
        biography_ar,
        photo_url,
      })
      .select()
      .single()

    if (personError) {
      // Rollback: delete dossier if person insert fails
      await this.supabase.from('dossiers').delete().eq('id', dossier.id)
      throw personError
    }

    return { ...dossier, extensionData: personData }
  }

  /**
   * Get a dossier by ID with its extension data
   * Uses optimized RPC function that queries the materialized view
   * Implements Redis caching with 5-minute TTL (T130 - Performance Optimization)
   * @param dossierId - UUID of the dossier
   * @param useOptimized - Whether to use the optimized materialized view (default: true)
   * @returns Dossier with extension data or null if not found
   */
  async getDossierWithExtension(dossierId: string, useOptimized: boolean = true) {
    // T130: Check cache first
    const cacheKey = CACHE_KEYS.DOSSIER(dossierId)
    try {
      const cached = await cacheHelpers.get(cacheKey)
      if (cached) {
        return cached
      }
    } catch (cacheError) {
      // Cache read errors are non-fatal, continue to database
      console.warn('Redis cache read error:', cacheError)
    }

    let result = null

    if (useOptimized) {
      // Use optimized RPC function that queries the materialized view
      const { data, error } = await this.supabase.rpc('get_dossier_with_extension', {
        p_dossier_id: dossierId,
      })

      if (error) {
        console.warn('Optimized query failed, falling back to direct query:', error)
        // Fall back to direct query
        return this.getDossierWithExtension(dossierId, false)
      }

      result = data
    } else {
      // Fallback: Direct query with type-based JOIN
      const { data: dossier, error: dossierError } = await this.supabase
        .from('dossiers')
        .select('*')
        .eq('id', dossierId)
        .single()

      if (dossierError) throw dossierError
      if (!dossier) return null

      // Get extension data based on type
      let extensionData = null
      const extensionTableMap: Record<DossierType, string> = {
        country: 'countries',
        organization: 'organizations',
        forum: 'forums',
        engagement: 'engagements',
        theme: 'themes',
        working_group: 'working_groups',
        person: 'persons',
      }

      const tableName = extensionTableMap[dossier.type as DossierType]
      if (tableName) {
        const { data, error } = await this.supabase
          .from(tableName as any)
          .select('*')
          .eq('id', dossierId)
          .single()

        if (error) throw error
        extensionData = data
      }

      result = { ...dossier, extensionData }
    }

    // T130: Store in cache
    if (result) {
      try {
        await cacheHelpers.set(cacheKey, result, CACHE_TTL.DOSSIER)
      } catch (cacheError) {
        // Cache write errors are non-fatal
        console.warn('Redis cache write error:', cacheError)
      }
    }

    return result
  }

  /**
   * Update a dossier (base fields and/or extension fields)
   * Implements cache invalidation on update (T131 - Performance Optimization)
   * @param dossierId - UUID of the dossier
   * @param input - Fields to update
   * @returns Updated dossier with extension data
   * @throws Error if attempting to change dossier type (immutable)
   */
  async updateDossier(dossierId: string, input: UpdateDossierInput) {
    const { extensionData, ...baseFields } = input

    // Get current dossier for type validation
    const { data: currentDossier, error: fetchError } = await this.supabase
      .from('dossiers')
      .select('type')
      .eq('id', dossierId)
      .single()

    if (fetchError) throw fetchError
    if (!currentDossier) throw new Error(`Dossier not found: ${dossierId}`)

    // VALIDATION: Prevent type changes (type is immutable)
    if ('type' in baseFields) {
      const attemptedType = (baseFields as any).type
      if (attemptedType !== currentDossier.type) {
        throw new Error(
          `Type mismatch: Cannot change dossier type from '${currentDossier.type}' to '${attemptedType}'. ` +
            `Type is immutable after creation. Create a new dossier instead.`,
        )
      }
      // Remove type from update (it's not changing anyway)
      delete (baseFields as any).type
    }

    // Update base dossier fields if provided
    if (Object.keys(baseFields).length > 0) {
      const { error: dossierError } = await this.supabase
        .from('dossiers')
        .update(baseFields)
        .eq('id', dossierId)

      if (dossierError) throw dossierError
    }

    // Update extension data if provided
    if (extensionData) {
      const extensionTableMap: Record<DossierType, string> = {
        country: 'countries',
        organization: 'organizations',
        forum: 'forums',
        engagement: 'engagements',
        theme: 'themes',
        working_group: 'working_groups',
        person: 'persons',
      }

      const tableName = extensionTableMap[currentDossier.type as DossierType]
      if (tableName) {
        const { error: extensionError } = await this.supabase
          .from(tableName as any)
          .update(extensionData)
          .eq('id', dossierId)

        if (extensionError) throw extensionError
      }
    }

    // T131: Invalidate cache after update
    await this.invalidateDossierCache(dossierId)

    // Return updated dossier (will fetch fresh data and update cache)
    return this.getDossierWithExtension(dossierId)
  }

  /**
   * Delete a dossier (CASCADE will delete extension and relationships)
   * Implements cache invalidation on delete (T131 - Performance Optimization)
   * @param dossierId - UUID of the dossier
   * @returns Success status
   */
  async deleteDossier(dossierId: string) {
    const { error } = await this.supabase.from('dossiers').delete().eq('id', dossierId)

    if (error) throw error

    // T131: Invalidate cache after delete
    await this.invalidateDossierCache(dossierId)

    return { success: true }
  }

  /**
   * T131: Invalidate all caches related to a dossier
   * Clears individual dossier cache and all list caches
   * @param dossierId - UUID of the dossier to invalidate
   */
  private async invalidateDossierCache(dossierId: string): Promise<void> {
    try {
      // Invalidate individual dossier cache
      await cacheHelpers.del(CACHE_KEYS.DOSSIER(dossierId))

      // Invalidate all list caches (they contain this dossier)
      await cacheHelpers.clearPattern('dossier:list:*')

      // Invalidate document cache if exists
      await cacheHelpers.del(CACHE_KEYS.DOCUMENTS(dossierId))
    } catch (error) {
      // Cache invalidation errors are non-fatal
      console.warn('Redis cache invalidation error:', error)
    }
  }

  /**
   * T131: Invalidate list caches after create operations
   * Only clears list caches since the new dossier isn't cached individually yet
   */
  private async invalidateListCaches(): Promise<void> {
    try {
      await cacheHelpers.clearPattern('dossier:list:*')
    } catch (error) {
      console.warn('Redis cache invalidation error:', error)
    }
  }

  /**
   * List dossiers with optional type filtering and cursor-based pagination
   * Uses optimized materialized view (dossier_list_mv) to eliminate N+1 queries
   * Implements Redis caching with 5-minute TTL (T130 - Performance Optimization)
   * @param options - Filter and pagination options
   * @returns List of dossiers with extension data
   */
  async listDossiers(
    options: {
      type?: DossierType
      status?: DossierStatus
      statusArray?: DossierStatus[]
      sensitivity?: string
      tags?: string[]
      search?: string
      cursor?: string
      limit?: number
      offset?: number
    } = {},
  ) {
    const {
      type,
      status,
      statusArray,
      sensitivity,
      tags,
      search,
      cursor,
      limit = 50,
      offset = 0,
    } = options

    // T130: Check cache first (include cursor in cache key)
    const cacheKey = CACHE_KEYS.LIST(type, status, limit, cursor ? 1 : offset)
    try {
      const cached = await cacheHelpers.get(cacheKey)
      if (cached) {
        return cached
      }
    } catch (cacheError) {
      console.warn('Redis cache read error:', cacheError)
    }

    // Use optimized RPC function that leverages materialized view
    const { data, error } = await this.supabase.rpc('list_dossiers_optimized', {
      p_type: type || null,
      p_status: status || null,
      p_status_array: statusArray || null,
      p_sensitivity: sensitivity || null,
      p_tags: tags || null,
      p_search: search || null,
      p_cursor: cursor || null,
      p_limit: Math.min(limit, 100),
    })

    if (error) throw error

    // Transform RPC result to match expected format
    const result = {
      data: data?.data || [],
      count: data?.pagination?.total_count || 0,
      limit,
      offset,
      pagination: data?.pagination || {
        next_cursor: null,
        has_more: false,
        total_count: 0,
      },
    }

    // T130: Store in cache with 5-minute TTL
    try {
      await cacheHelpers.set(cacheKey, result, CACHE_TTL.LIST)
    } catch (cacheError) {
      console.warn('Redis cache write error:', cacheError)
    }

    return result
  }

  /**
   * List dossiers with offset-based pagination (legacy support)
   * @deprecated Use listDossiers with cursor parameter instead
   */
  async listDossiersLegacy(
    options: {
      type?: DossierType
      status?: DossierStatus
      limit?: number
      offset?: number
    } = {},
  ) {
    const { type, status, limit = 50, offset = 0 } = options

    let query = this.supabase
      .from('dossiers')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query

    if (error) throw error

    // Fetch extension data for each dossier (N+1 pattern - use only for legacy support)
    const dossiersWithExtension = await Promise.all(
      (data || []).map((dossier) => this.getDossierWithExtension(dossier.id)),
    )

    return {
      data: dossiersWithExtension,
      count,
      limit,
      offset,
    }
  }

  /**
   * T115: Get all documents linked to a dossier
   * Retrieves positions, MOUs, and briefs linked to a specific dossier
   */
  async getDocumentsForDossier(dossierId: string): Promise<{
    positions: Array<{
      id: string
      title_en: string
      title_ar: string
      link_type: string
      notes?: string
      status: string
      created_at: string
    }>
    mous: Array<{
      id: string
      title: string
      status: string
      effective_date?: string
      expiry_date?: string
      signatory_role: 'signatory_1' | 'signatory_2'
    }>
  }> {
    // Get linked positions
    const { data: positionLinks, error: positionError } = await this.supabase
      .from('position_dossier_links')
      .select(
        `
        link_type,
        notes,
        created_at,
        positions:position_id (
          id,
          title_en,
          title_ar,
          status
        )
      `,
      )
      .eq('dossier_id', dossierId)

    if (positionError) {
      throw new Error(`Failed to fetch linked positions: ${positionError.message}`)
    }

    // Get linked MOUs (where dossier is either signatory)
    const { data: mousAsSignatory1, error: mou1Error } = await this.supabase
      .from('mous')
      .select('id, title, status, effective_date, expiry_date')
      .eq('signatory_1_dossier_id', dossierId)
      .is('deleted_at', null)

    const { data: mousAsSignatory2, error: mou2Error } = await this.supabase
      .from('mous')
      .select('id, title, status, effective_date, expiry_date')
      .eq('signatory_2_dossier_id', dossierId)
      .is('deleted_at', null)

    if (mou1Error) {
      throw new Error(`Failed to fetch MOUs (signatory 1): ${mou1Error.message}`)
    }
    if (mou2Error) {
      throw new Error(`Failed to fetch MOUs (signatory 2): ${mou2Error.message}`)
    }

    // Transform position data
    const positions = (positionLinks || []).map((link: any) => ({
      id: link.positions.id,
      title_en: link.positions.title_en,
      title_ar: link.positions.title_ar,
      link_type: link.link_type,
      notes: link.notes,
      status: link.positions.status,
      created_at: link.created_at,
    }))

    // Transform MOU data
    const mous = [
      ...(mousAsSignatory1 || []).map((mou: any) => ({
        ...mou,
        signatory_role: 'signatory_1' as const,
      })),
      ...(mousAsSignatory2 || []).map((mou: any) => ({
        ...mou,
        signatory_role: 'signatory_2' as const,
      })),
    ]

    return {
      positions,
      mous,
    }
  }

  /**
   * T116: Link a document (position/MOU/brief) to a dossier
   * Creates a link between a position and a dossier with specified relationship type
   */
  async linkDocumentToDossier(input: {
    positionId: string
    dossierId: string
    linkType: 'applies_to' | 'related_to' | 'endorsed_by' | 'opposed_by'
    notes?: string
    userId?: string
  }): Promise<{
    id: string
    position_id: string
    dossier_id: string
    link_type: string
    notes?: string
    created_at: string
  }> {
    const { positionId, dossierId, linkType, notes, userId } = input

    // Verify position exists
    const { data: position, error: positionError } = await this.supabase
      .from('positions')
      .select('id')
      .eq('id', positionId)
      .single()

    if (positionError || !position) {
      throw new Error(`Position not found: ${positionId}`)
    }

    // Verify dossier exists and get its details
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .select('id, type, sensitivity_level')
      .eq('id', dossierId)
      .single()

    if (dossierError || !dossier) {
      throw new Error(`Dossier not found: ${dossierId}`)
    }

    // Create the link
    const { data, error } = await this.supabase
      .from('position_dossier_links')
      .insert({
        position_id: positionId,
        dossier_id: dossierId,
        link_type: linkType,
        notes,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      // Check if it's a uniqueness violation
      if (error.code === '23505') {
        throw new Error(
          `Link already exists between position ${positionId} and dossier ${dossierId} with type ${linkType}`,
        )
      }
      throw new Error(`Failed to create document link: ${error.message}`)
    }

    return data
  }

  /**
   * Unlink a position from a dossier
   * Removes the link between a position and a dossier
   */
  async unlinkDocumentFromDossier(input: {
    positionId: string
    dossierId: string
    linkType: string
  }): Promise<void> {
    const { positionId, dossierId, linkType } = input

    const { error } = await this.supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', positionId)
      .eq('dossier_id', dossierId)
      .eq('link_type', linkType)

    if (error) {
      throw new Error(`Failed to remove document link: ${error.message}`)
    }
  }

  /**
   * Get persons for an organization (T123 - User Story 7)
   * Returns all VIP persons associated with a specific organization
   *
   * @param organizationId - UUID of the organization
   * @returns Array of person dossiers with their extension data
   */
  async getPersonsForOrganization(organizationId: string) {
    const { data, error } = await this.supabase
      .from('dossiers')
      .select(
        `
        *,
        extension:persons(*)
      `,
      )
      .eq('type', 'person')
      .eq('extension.organization_id', organizationId)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch persons for organization: ${error.message}`)
    }

    return data
  }
}

export default DossierService
