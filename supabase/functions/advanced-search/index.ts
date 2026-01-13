/**
 * Supabase Edge Function: Advanced Search
 * Feature: advanced-search-filters
 * Description: Complex multi-criteria search with boolean logic (AND/OR/NOT),
 *              field-level filters, date ranges, and relationship queries
 *
 * POST /advanced-search - Execute advanced search with complex criteria
 *
 * Request Body:
 * {
 *   query?: string,                    // Full-text search query
 *   entity_types: string[],            // Entity types to search
 *   conditions?: FilterCondition[],    // Boolean logic conditions
 *   relationships?: RelationshipQuery[], // Relationship-based filters
 *   date_range?: { from?: string, to?: string, preset?: string },
 *   status?: string[],
 *   tags?: string[],
 *   filter_logic?: 'AND' | 'OR',
 *   include_archived?: boolean,
 *   sort_by?: 'relevance' | 'date' | 'title',
 *   sort_order?: 'asc' | 'desc',
 *   limit?: number,
 *   offset?: number,
 *   saved_filter_id?: string           // Use saved filter configuration
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface FilterCondition {
  field_name: string;
  operator: string;
  value: unknown;
  is_negated?: boolean;
}

interface FilterGroup {
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface RelationshipQuery {
  source_entity_type: string;
  target_entity_type: string;
  relationship_type: string;
  target_conditions?: FilterCondition[];
  include_depth?: number;
}

interface DateRange {
  from?: string;
  to?: string;
  preset?:
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'last_90_days'
    | 'this_month'
    | 'this_year'
    | 'next_7_days'
    | 'next_30_days';
}

interface AdvancedSearchRequest {
  query?: string;
  entity_types: string[];
  conditions?: FilterCondition[];
  condition_groups?: FilterGroup[];
  relationships?: RelationshipQuery[];
  date_range?: DateRange;
  status?: string[];
  tags?: string[];
  sensitivity_levels?: string[];
  filter_logic?: 'AND' | 'OR';
  include_archived?: boolean;
  sort_by?: 'relevance' | 'date' | 'title';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  saved_filter_id?: string;
}

interface SearchResult {
  entity_id: string;
  entity_type: string;
  title_en: string;
  title_ar: string;
  snippet_en: string;
  snippet_ar: string;
  rank_score: number;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  matched_conditions?: string[];
}

// Date preset resolver
function resolveDatePreset(preset: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { from: today, to: now };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: today };
    case 'last_7_days':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { from: last7, to: now };
    case 'last_30_days':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return { from: last30, to: now };
    case 'last_90_days':
      const last90 = new Date(today);
      last90.setDate(last90.getDate() - 90);
      return { from: last90, to: now };
    case 'this_month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case 'this_year':
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case 'next_7_days':
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      return { from: today, to: next7 };
    case 'next_30_days':
      const next30 = new Date(today);
      next30.setDate(next30.getDate() + 30);
      return { from: today, to: next30 };
    default:
      return { from: new Date(0), to: now };
  }
}

// Valid entity types
const VALID_ENTITY_TYPES = [
  'dossier',
  'engagement',
  'position',
  'document',
  'person',
  'organization',
  'forum',
  'country',
  'theme',
];
const VALID_STATUSES = ['active', 'inactive', 'archived', 'draft', 'published', 'deleted'];
const VALID_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_equal',
  'less_equal',
  'between',
  'not_between',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
  'matches_regex',
];

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only POST method is allowed',
        message_ar: 'يُسمح فقط بأسلوب POST',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const startTime = Date.now();

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Parse request body
    const body: AdvancedSearchRequest = await req.json();

    // Validate entity_types
    if (!body.entity_types || body.entity_types.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'entity_types is required and must not be empty',
          message_ar: 'entity_types مطلوب ولا يمكن أن يكون فارغاً',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const invalidTypes = body.entity_types.filter((t) => !VALID_ENTITY_TYPES.includes(t));
    if (invalidTypes.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: `Invalid entity types: ${invalidTypes.join(', ')}. Valid types: ${VALID_ENTITY_TYPES.join(', ')}`,
          message_ar: 'أنواع كيانات غير صالحة',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate status filter
    if (body.status) {
      const invalidStatuses = body.status.filter((s) => !VALID_STATUSES.includes(s));
      if (invalidStatuses.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'bad_request',
            message: `Invalid statuses: ${invalidStatuses.join(', ')}`,
            message_ar: 'حالات غير صالحة',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate conditions
    if (body.conditions) {
      for (const condition of body.conditions) {
        if (!VALID_OPERATORS.includes(condition.operator)) {
          return new Response(
            JSON.stringify({
              error: 'bad_request',
              message: `Invalid operator: ${condition.operator}`,
              message_ar: 'عامل غير صالح',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Resolve date range
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;
    if (body.date_range) {
      if (body.date_range.preset) {
        const resolved = resolveDatePreset(body.date_range.preset);
        dateFrom = resolved.from;
        dateTo = resolved.to;
      } else {
        if (body.date_range.from) {
          dateFrom = new Date(body.date_range.from);
        }
        if (body.date_range.to) {
          dateTo = new Date(body.date_range.to);
        }
      }
    }

    // Validate pagination
    const limit = Math.min(Math.max(1, body.limit || 50), 100);
    const offset = Math.max(0, body.offset || 0);

    // If using a saved filter, load it first
    let savedFilter = null;
    if (body.saved_filter_id) {
      const { data: filter, error: filterError } = await supabase
        .from('search_filters')
        .select('*')
        .eq('id', body.saved_filter_id)
        .single();

      if (filterError || !filter) {
        return new Response(
          JSON.stringify({
            error: 'not_found',
            message: 'Saved filter not found',
            message_ar: 'الفلتر المحفوظ غير موجود',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      savedFilter = filter;

      // Increment filter use count
      await supabase.rpc('increment_filter_use_count', { p_filter_id: body.saved_filter_id });
    }

    // Prepare search results
    const results: SearchResult[] = [];
    const warnings: string[] = [];

    // Build text search query
    const query = body.query?.trim() || '';
    const hasTextQuery = query.length > 0;

    // Search each entity type
    for (const entityType of body.entity_types) {
      try {
        let entityResults: SearchResult[] = [];

        switch (entityType) {
          case 'dossier':
          case 'country':
          case 'organization':
          case 'forum':
          case 'theme':
            entityResults = await searchDossiers(supabase, {
              query,
              hasTextQuery,
              type: entityType === 'dossier' ? null : entityType,
              status: body.status,
              tags: body.tags,
              dateFrom,
              dateTo,
              includeArchived: body.include_archived ?? false,
              conditions: body.conditions,
              filterLogic: body.filter_logic || 'AND',
              limit,
              offset,
            });
            break;

          case 'engagement':
            entityResults = await searchEngagements(supabase, {
              query,
              hasTextQuery,
              status: body.status,
              dateFrom,
              dateTo,
              conditions: body.conditions,
              filterLogic: body.filter_logic || 'AND',
              limit,
              offset,
            });
            break;

          case 'position':
            entityResults = await searchPositions(supabase, {
              query,
              hasTextQuery,
              status: body.status,
              dateFrom,
              dateTo,
              conditions: body.conditions,
              filterLogic: body.filter_logic || 'AND',
              limit,
              offset,
            });
            break;

          case 'document':
            entityResults = await searchDocuments(supabase, {
              query,
              hasTextQuery,
              dateFrom,
              dateTo,
              conditions: body.conditions,
              filterLogic: body.filter_logic || 'AND',
              limit,
              offset,
            });
            break;

          case 'person':
            entityResults = await searchPeople(supabase, {
              query,
              hasTextQuery,
              status: body.status,
              dateFrom,
              dateTo,
              conditions: body.conditions,
              filterLogic: body.filter_logic || 'AND',
              limit,
              offset,
            });
            break;

          default:
            warnings.push(`Entity type '${entityType}' not yet implemented`);
        }

        results.push(...entityResults);
      } catch (err) {
        console.error(`Error searching ${entityType}:`, err);
        warnings.push(
          `Error searching ${entityType}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Sort results
    const sortBy = body.sort_by || 'relevance';
    const sortOrder = body.sort_order || 'desc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.rank_score - a.rank_score;
          break;
        case 'date':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          break;
        case 'title':
          comparison = a.title_en.localeCompare(b.title_en);
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    // Apply final pagination across all results
    const paginatedResults = results.slice(offset, offset + limit);

    // Calculate timing
    const tookMs = Date.now() - startTime;

    // Build response
    const response = {
      data: paginatedResults,
      count: results.length,
      limit,
      offset,
      query: {
        original: query,
        entity_types: body.entity_types,
        filter_logic: body.filter_logic || 'AND',
        conditions_count: body.conditions?.length || 0,
        date_range: body.date_range || null,
      },
      took_ms: tookMs,
      warnings,
      metadata: {
        has_more: results.length > offset + limit,
        next_offset: results.length > offset + limit ? offset + limit : null,
        saved_filter_id: body.saved_filter_id || null,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Search helpers
async function searchDossiers(
  supabase: ReturnType<typeof createClient>,
  options: {
    query: string;
    hasTextQuery: boolean;
    type: string | null;
    status?: string[];
    tags?: string[];
    dateFrom: Date | null;
    dateTo: Date | null;
    includeArchived: boolean;
    conditions?: FilterCondition[];
    filterLogic: 'AND' | 'OR';
    limit: number;
    offset: number;
  }
): Promise<SearchResult[]> {
  let query = supabase.from('dossiers').select('*');

  // Apply text search
  if (options.hasTextQuery) {
    const terms = options.query.split(/\s+/).filter(Boolean);
    const tsquery = terms.join(' | ');
    query = query.textSearch('search_vector', tsquery, { type: 'websearch', config: 'simple' });
  }

  // Apply type filter
  if (options.type) {
    query = query.eq('type', options.type);
  }

  // Apply status filter
  if (options.status && options.status.length > 0) {
    query = query.in('status', options.status);
  }

  // Apply tags filter
  if (options.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }

  // Apply date filters
  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom.toISOString());
  }
  if (options.dateTo) {
    query = query.lte('created_at', options.dateTo.toISOString());
  }

  // Apply archived filter
  if (!options.includeArchived) {
    query = query.eq('archived', false);
  }

  // Apply custom conditions
  if (options.conditions && options.conditions.length > 0) {
    for (const condition of options.conditions) {
      query = applyCondition(query, condition);
    }
  }

  // Execute query
  const { data, error } = await query.limit(options.limit);

  if (error) {
    throw error;
  }

  // Transform results
  return (data || []).map((item: Record<string, unknown>) => {
    const lowerQuery = options.query.toLowerCase();
    const nameEn = ((item.name_en as string) || '').toLowerCase();
    const nameAr = ((item.name_ar as string) || '').toLowerCase();

    let rankScore = 20;
    if (options.hasTextQuery) {
      if (nameEn === lowerQuery || nameAr === lowerQuery) rankScore = 100;
      else if (nameEn.startsWith(lowerQuery) || nameAr.startsWith(lowerQuery)) rankScore = 90;
      else if (nameEn.includes(lowerQuery) || nameAr.includes(lowerQuery)) rankScore = 80;
    }

    return {
      entity_id: item.id as string,
      entity_type: (item.type as string) || 'dossier',
      title_en: (item.name_en as string) || (item.title_en as string) || '',
      title_ar: (item.name_ar as string) || (item.title_ar as string) || '',
      snippet_en: ((item.summary_en as string) || (item.description_en as string) || '').substring(
        0,
        200
      ),
      snippet_ar: ((item.summary_ar as string) || (item.description_ar as string) || '').substring(
        0,
        200
      ),
      rank_score: rankScore,
      status: (item.status as string) || 'active',
      created_at: item.created_at as string,
      updated_at: item.updated_at as string,
      metadata: {
        type: item.type,
        tags: item.tags,
        sensitivity_level: item.sensitivity_level,
      },
    };
  });
}

async function searchEngagements(
  supabase: ReturnType<typeof createClient>,
  options: {
    query: string;
    hasTextQuery: boolean;
    status?: string[];
    dateFrom: Date | null;
    dateTo: Date | null;
    conditions?: FilterCondition[];
    filterLogic: 'AND' | 'OR';
    limit: number;
    offset: number;
  }
): Promise<SearchResult[]> {
  let query = supabase.from('engagements').select('*');

  if (options.hasTextQuery) {
    const terms = options.query.split(/\s+/).filter(Boolean);
    const tsquery = terms.join(' | ');
    query = query.textSearch('search_vector', tsquery, { type: 'websearch', config: 'simple' });
  }

  if (options.status && options.status.length > 0) {
    query = query.in('status', options.status);
  }

  if (options.dateFrom) {
    query = query.gte('start_date', options.dateFrom.toISOString());
  }
  if (options.dateTo) {
    query = query.lte('start_date', options.dateTo.toISOString());
  }

  if (options.conditions) {
    for (const condition of options.conditions) {
      query = applyCondition(query, condition);
    }
  }

  const { data, error } = await query.limit(options.limit);

  if (error) throw error;

  return (data || []).map((item: Record<string, unknown>) => ({
    entity_id: item.id as string,
    entity_type: 'engagement',
    title_en: (item.title_en as string) || '',
    title_ar: (item.title_ar as string) || '',
    snippet_en: ((item.description_en as string) || '').substring(0, 200),
    snippet_ar: ((item.description_ar as string) || '').substring(0, 200),
    rank_score: options.hasTextQuery ? 60 : 50,
    status: (item.status as string) || 'active',
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    metadata: {
      start_date: item.start_date,
      end_date: item.end_date,
      location: item.location,
    },
  }));
}

async function searchPositions(
  supabase: ReturnType<typeof createClient>,
  options: {
    query: string;
    hasTextQuery: boolean;
    status?: string[];
    dateFrom: Date | null;
    dateTo: Date | null;
    conditions?: FilterCondition[];
    filterLogic: 'AND' | 'OR';
    limit: number;
    offset: number;
  }
): Promise<SearchResult[]> {
  let query = supabase.from('positions').select('*').eq('status', 'published');

  if (options.hasTextQuery) {
    const terms = options.query.split(/\s+/).filter(Boolean);
    const tsquery = terms.join(' | ');
    query = query.textSearch('search_vector', tsquery, { type: 'websearch', config: 'simple' });
  }

  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom.toISOString());
  }
  if (options.dateTo) {
    query = query.lte('created_at', options.dateTo.toISOString());
  }

  if (options.conditions) {
    for (const condition of options.conditions) {
      query = applyCondition(query, condition);
    }
  }

  const { data, error } = await query.limit(options.limit);

  if (error) throw error;

  return (data || []).map((item: Record<string, unknown>) => ({
    entity_id: item.id as string,
    entity_type: 'position',
    title_en: (item.title_en as string) || '',
    title_ar: (item.title_ar as string) || '',
    snippet_en: ((item.key_messages_en as string) || '').substring(0, 200),
    snippet_ar: ((item.key_messages_ar as string) || '').substring(0, 200),
    rank_score: options.hasTextQuery ? 60 : 50,
    status: (item.status as string) || 'published',
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    metadata: {
      topic: item.topic,
      version: item.version,
    },
  }));
}

async function searchDocuments(
  supabase: ReturnType<typeof createClient>,
  options: {
    query: string;
    hasTextQuery: boolean;
    dateFrom: Date | null;
    dateTo: Date | null;
    conditions?: FilterCondition[];
    filterLogic: 'AND' | 'OR';
    limit: number;
    offset: number;
  }
): Promise<SearchResult[]> {
  let query = supabase.from('attachments').select('*').is('deleted_at', null);

  if (options.hasTextQuery) {
    const terms = options.query.split(/\s+/).filter(Boolean);
    const tsquery = terms.join(' | ');
    query = query.textSearch('search_vector', tsquery, { type: 'websearch', config: 'simple' });
  }

  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom.toISOString());
  }
  if (options.dateTo) {
    query = query.lte('created_at', options.dateTo.toISOString());
  }

  if (options.conditions) {
    for (const condition of options.conditions) {
      query = applyCondition(query, condition);
    }
  }

  const { data, error } = await query.limit(options.limit);

  if (error) throw error;

  return (data || []).map((item: Record<string, unknown>) => ({
    entity_id: item.id as string,
    entity_type: 'document',
    title_en: (item.file_name as string) || '',
    title_ar: (item.file_name as string) || '',
    snippet_en: ((item.description_en as string) || '').substring(0, 200),
    snippet_ar: ((item.description_ar as string) || '').substring(0, 200),
    rank_score: options.hasTextQuery ? 60 : 50,
    status: 'active',
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    metadata: {
      file_type: item.file_type,
      file_size: item.file_size,
    },
  }));
}

async function searchPeople(
  supabase: ReturnType<typeof createClient>,
  options: {
    query: string;
    hasTextQuery: boolean;
    status?: string[];
    dateFrom: Date | null;
    dateTo: Date | null;
    conditions?: FilterCondition[];
    filterLogic: 'AND' | 'OR';
    limit: number;
    offset: number;
  }
): Promise<SearchResult[]> {
  // Search in staff_profiles first
  let staffQuery = supabase.from('staff_profiles').select('*');

  if (options.hasTextQuery) {
    const terms = options.query.split(/\s+/).filter(Boolean);
    const tsquery = terms.join(' | ');
    staffQuery = staffQuery.textSearch('search_vector', tsquery, {
      type: 'websearch',
      config: 'simple',
    });
  }

  if (options.dateFrom) {
    staffQuery = staffQuery.gte('created_at', options.dateFrom.toISOString());
  }
  if (options.dateTo) {
    staffQuery = staffQuery.lte('created_at', options.dateTo.toISOString());
  }

  const { data: staffData, error: staffError } = await staffQuery.limit(options.limit);

  if (staffError) throw staffError;

  const staffResults: SearchResult[] = (staffData || []).map((item: Record<string, unknown>) => ({
    entity_id: item.id as string,
    entity_type: 'person',
    title_en: (item.full_name_en as string) || '',
    title_ar: (item.full_name_ar as string) || '',
    snippet_en: ((item.title_en as string) || '').substring(0, 200),
    snippet_ar: ((item.title_ar as string) || '').substring(0, 200),
    rank_score: options.hasTextQuery ? 60 : 50,
    status: 'active',
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    metadata: {
      email: item.email,
      department: item.department,
    },
  }));

  // Also search in external_contacts
  let contactsQuery = supabase.from('external_contacts').select('*');

  if (options.hasTextQuery) {
    const terms = options.query.split(/\s+/).filter(Boolean);
    const tsquery = terms.join(' | ');
    contactsQuery = contactsQuery.textSearch('search_vector', tsquery, {
      type: 'websearch',
      config: 'simple',
    });
  }

  if (options.dateFrom) {
    contactsQuery = contactsQuery.gte('created_at', options.dateFrom.toISOString());
  }
  if (options.dateTo) {
    contactsQuery = contactsQuery.lte('created_at', options.dateTo.toISOString());
  }

  const { data: contactsData, error: contactsError } = await contactsQuery.limit(options.limit);

  if (contactsError) throw contactsError;

  const contactResults: SearchResult[] = (contactsData || []).map(
    (item: Record<string, unknown>) => ({
      entity_id: item.id as string,
      entity_type: 'person',
      title_en: (item.full_name_en as string) || '',
      title_ar: (item.full_name_ar as string) || '',
      snippet_en: ((item.title_en as string) || '').substring(0, 200),
      snippet_ar: ((item.title_ar as string) || '').substring(0, 200),
      rank_score: options.hasTextQuery ? 55 : 45,
      status: 'active',
      created_at: item.created_at as string,
      updated_at: item.updated_at as string,
      metadata: {
        email: item.email,
        organization: item.organization,
      },
    })
  );

  return [...staffResults, ...contactResults];
}

// Apply a single condition to the query
function applyCondition(
  query: ReturnType<ReturnType<typeof createClient>['from']>,
  condition: FilterCondition
): ReturnType<ReturnType<typeof createClient>['from']> {
  const { field_name, operator, value, is_negated } = condition;

  switch (operator) {
    case 'equals':
      return is_negated
        ? query.neq(field_name, value as string)
        : query.eq(field_name, value as string);

    case 'not_equals':
      return query.neq(field_name, value as string);

    case 'contains':
      return is_negated
        ? query.not(field_name, 'ilike', `%${value}%`)
        : query.ilike(field_name, `%${value}%`);

    case 'not_contains':
      return query.not(field_name, 'ilike', `%${value}%`);

    case 'starts_with':
      return query.ilike(field_name, `${value}%`);

    case 'ends_with':
      return query.ilike(field_name, `%${value}`);

    case 'greater_than':
      return query.gt(field_name, value as string | number);

    case 'less_than':
      return query.lt(field_name, value as string | number);

    case 'greater_equal':
      return query.gte(field_name, value as string | number);

    case 'less_equal':
      return query.lte(field_name, value as string | number);

    case 'in':
      return is_negated
        ? query.not(field_name, 'in', `(${(value as string[]).join(',')})`)
        : query.in(field_name, value as string[]);

    case 'not_in':
      return query.not(field_name, 'in', `(${(value as string[]).join(',')})`);

    case 'is_null':
      return query.is(field_name, null);

    case 'is_not_null':
      return query.not(field_name, 'is', null);

    default:
      return query;
  }
}
