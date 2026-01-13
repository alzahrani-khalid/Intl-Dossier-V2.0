/**
 * Supabase Edge Function: Search Suggestions
 * Feature: Enhanced search with real-time suggestions, fuzzy matching, search history
 * Description: Provides intelligent search suggestions with fuzzy matching for typos,
 *              search history management, and adaptive filters with result counts
 *
 * Endpoints:
 * GET  /search-suggestions?q=<query>&types=<entity_types>&limit=<n>
 * POST /search-suggestions/history - Add search to history
 * GET  /search-suggestions/history - Get user's search history
 * DELETE /search-suggestions/history - Clear user's search history
 * GET  /search-suggestions/filter-counts - Get adaptive filter counts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Types
interface SearchSuggestion {
  suggestion: string;
  suggestion_ar: string | null;
  suggestion_type: 'title' | 'tag' | 'keyword' | 'name' | 'topic' | 'popular' | 'history';
  entity_type: string;
  similarity_score: number;
  frequency: number;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  entity_types: string[];
  result_count: number;
  filters_applied: Record<string, unknown>;
  created_at: string;
}

interface FilterCount {
  filter_type: string;
  filter_value: string;
  result_count: number;
}

interface AddHistoryRequest {
  query: string;
  entity_types: string[];
  result_count: number;
  filters?: Record<string, unknown>;
}

interface FilterCountsRequest {
  cache_key: string;
  entity_types: string[];
  base_query?: string;
  compute_if_missing?: boolean;
}

// No-results suggestion types
interface TypoCorrection {
  original: string;
  corrected: string;
  similarity_score: number;
}

interface RelatedTerm {
  term: string;
  term_ar: string | null;
  category: 'synonym' | 'broader' | 'narrower' | 'related';
  confidence: number;
}

interface PopularSearchSuggestion {
  query: string;
  search_count: number;
  result_count: number;
  entity_types: string[];
}

interface RecentContent {
  id: string;
  title_en: string;
  title_ar: string | null;
  entity_type: string;
  created_at: string;
  preview?: string;
}

interface CreateEntitySuggestion {
  entity_type: string;
  suggested_name: string;
  suggested_name_ar?: string;
  route: string;
  prefill_params?: Record<string, string>;
}

interface WorkspaceSearchHistory {
  query: string;
  result_count: number;
  entity_types: string[];
  searched_at: string;
  user_name?: string;
}

interface ActionableSearchTip {
  category: 'spelling' | 'broader' | 'filters' | 'entity_specific' | 'general';
  tip: string;
  tip_ar: string;
  action?: {
    type: 'remove_filters' | 'change_entity_type' | 'use_semantic_search';
    payload?: Record<string, unknown>;
  };
}

interface NoResultsSuggestions {
  original_query: string;
  typo_corrections: TypoCorrection[];
  related_terms: RelatedTerm[];
  popular_searches: PopularSearchSuggestion[];
  recent_content: RecentContent[];
  create_suggestion?: CreateEntitySuggestion;
  search_tips: string[];
  workspace_history?: WorkspaceSearchHistory[];
  actionable_tips?: ActionableSearchTip[];
  active_filters_count?: number;
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

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/search-suggestions\/?/, '').split('/')[0];

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

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Invalid or expired token',
          message_ar: 'رمز غير صالح أو منتهي الصلاحية',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route requests
    switch (path) {
      case 'history':
        return handleHistory(req, supabase, user.id);
      case 'filter-counts':
        return handleFilterCounts(req, supabase);
      case 'no-results':
        return handleNoResultsSuggestions(req, supabase, user.id);
      default:
        return handleSuggestions(req, supabase, user.id);
    }
  } catch (error) {
    console.error('Search suggestions error:', error);
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

/**
 * Handle GET /search-suggestions - Get search suggestions with fuzzy matching
 */
async function handleSuggestions(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only GET method allowed for suggestions',
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q') || '';
  const typesParam = url.searchParams.get('types') || 'dossier';
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)), 20);
  const minSimilarity = parseFloat(url.searchParams.get('min_similarity') || '0.3');
  const includeHistory = url.searchParams.get('include_history') !== 'false';

  // Parse entity types
  const entityTypes = typesParam.split(',').filter((t) => VALID_ENTITY_TYPES.includes(t));
  if (entityTypes.length === 0) {
    entityTypes.push('dossier');
  }

  // Return empty if query is too short
  if (query.trim().length < 2) {
    return new Response(
      JSON.stringify({
        suggestions: [],
        history: includeHistory ? await getUserRecentHistory(supabase, userId, entityTypes, 5) : [],
        popular: await getPopularSearches(supabase, entityTypes, 5),
        query: query,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  // Get fuzzy suggestions from database
  const { data: suggestions, error: suggestionsError } = await supabase.rpc(
    'get_search_suggestions',
    {
      p_query: query,
      p_entity_types: entityTypes,
      p_limit: limit,
      p_min_similarity: minSimilarity,
    }
  );

  if (suggestionsError) {
    console.error('Suggestions error:', suggestionsError);
    // Fall back to simple ILIKE search
    const fallbackSuggestions = await getFallbackSuggestions(supabase, query, entityTypes, limit);
    return new Response(
      JSON.stringify({
        suggestions: fallbackSuggestions,
        history: includeHistory ? await getUserRecentHistory(supabase, userId, entityTypes, 3) : [],
        popular: [],
        query: query,
        took_ms: Date.now() - startTime,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get user's matching history items
  let historyItems: SearchHistoryItem[] = [];
  if (includeHistory) {
    const { data: history } = await supabase
      .from('search_history')
      .select('id, query, entity_types, result_count, filters_applied, created_at')
      .eq('user_id', userId)
      .ilike('query_normalized', `%${query.toLowerCase()}%`)
      .order('created_at', { ascending: false })
      .limit(3);

    historyItems = (history || []).map((h: Record<string, unknown>) => ({
      id: h.id as string,
      query: h.query as string,
      entity_types: h.entity_types as string[],
      result_count: h.result_count as number,
      filters_applied: h.filters_applied as Record<string, unknown>,
      created_at: h.created_at as string,
    }));
  }

  // Build response with categorized suggestions
  const categorizedSuggestions = categorizeSuggestions(suggestions || [], historyItems);

  return new Response(
    JSON.stringify({
      suggestions: categorizedSuggestions,
      query: query,
      entity_types: entityTypes,
      took_ms: Date.now() - startTime,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle search history operations (GET, POST, DELETE)
 */
async function handleHistory(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  switch (req.method) {
    case 'GET':
      return getHistory(supabase, userId, req);
    case 'POST':
      return addHistory(supabase, userId, req);
    case 'DELETE':
      return clearHistory(supabase, userId);
    default:
      return new Response(
        JSON.stringify({ error: 'method_not_allowed', message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}

/**
 * Get user's search history
 */
async function getHistory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  req: Request
): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)), 50);
  const typesParam = url.searchParams.get('types');
  const entityTypes = typesParam
    ? typesParam.split(',').filter((t) => VALID_ENTITY_TYPES.includes(t))
    : null;

  const { data, error } = await supabase.rpc('get_user_search_history', {
    p_user_id: userId,
    p_limit: limit,
    p_entity_types: entityTypes,
  });

  if (error) {
    console.error('Get history error:', error);
    return new Response(JSON.stringify({ error: 'database_error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ history: data || [], count: (data || []).length }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Add search to history
 */
async function addHistory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  req: Request
): Promise<Response> {
  let body: AddHistoryRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate request
  if (!body.query || body.query.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'query is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.entity_types || body.entity_types.length === 0) {
    body.entity_types = ['dossier'];
  }

  // Validate entity types
  const validTypes = body.entity_types.filter((t) => VALID_ENTITY_TYPES.includes(t));
  if (validTypes.length === 0) {
    validTypes.push('dossier');
  }

  const { data, error } = await supabase.rpc('add_search_history', {
    p_user_id: userId,
    p_query: body.query.trim(),
    p_entity_types: validTypes,
    p_result_count: body.result_count || 0,
    p_filters: body.filters || {},
  });

  if (error) {
    console.error('Add history error:', error);
    return new Response(JSON.stringify({ error: 'database_error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, history_id: data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Clear user's search history
 */
async function clearHistory(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const { data, error } = await supabase.rpc('clear_user_search_history', { p_user_id: userId });

  if (error) {
    console.error('Clear history error:', error);
    return new Response(JSON.stringify({ error: 'database_error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, deleted_count: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle filter counts for adaptive filtering
 */
async function handleFilterCounts(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Only POST method allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let body: FilterCountsRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.cache_key || !body.entity_types) {
    return new Response(
      JSON.stringify({ error: 'bad_request', message: 'cache_key and entity_types are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Try to get from cache first
  const { data: cachedCounts, error: cacheError } = await supabase.rpc('get_filter_counts', {
    p_cache_key: body.cache_key,
    p_entity_types: body.entity_types,
    p_base_query: body.base_query || null,
  });

  if (!cacheError && cachedCounts && cachedCounts.length > 0) {
    return new Response(JSON.stringify({ filter_counts: cachedCounts, from_cache: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // If no cache and compute_if_missing is true, compute counts
  if (body.compute_if_missing) {
    const filterCounts = await computeFilterCounts(supabase, body.entity_types, body.base_query);

    // Cache the results
    for (const fc of filterCounts) {
      await supabase.rpc('cache_filter_counts', {
        p_cache_key: body.cache_key,
        p_filter_type: fc.filter_type,
        p_filter_value: fc.filter_value,
        p_result_count: fc.result_count,
        p_ttl_minutes: 5,
      });
    }

    return new Response(JSON.stringify({ filter_counts: filterCounts, from_cache: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ filter_counts: [], from_cache: false }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper functions

/**
 * Get user's recent search history
 */
async function getUserRecentHistory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entityTypes: string[],
  limit: number
): Promise<SearchHistoryItem[]> {
  const { data } = await supabase
    .from('search_history')
    .select('id, query, entity_types, result_count, filters_applied, created_at')
    .eq('user_id', userId)
    .overlaps('entity_types', entityTypes)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((h: Record<string, unknown>) => ({
    id: h.id as string,
    query: h.query as string,
    entity_types: h.entity_types as string[],
    result_count: h.result_count as number,
    filters_applied: h.filters_applied as Record<string, unknown>,
    created_at: h.created_at as string,
  }));
}

/**
 * Get popular searches
 */
async function getPopularSearches(
  supabase: ReturnType<typeof createClient>,
  entityTypes: string[],
  limit: number
): Promise<{ query: string; count: number }[]> {
  const { data } = await supabase
    .from('popular_searches')
    .select('display_query, search_count')
    .overlaps('entity_types', entityTypes)
    .order('search_count', { ascending: false })
    .limit(limit);

  return (data || []).map((p: Record<string, unknown>) => ({
    query: p.display_query as string,
    count: p.search_count as number,
  }));
}

/**
 * Fallback suggestions using simple ILIKE matching
 */
async function getFallbackSuggestions(
  supabase: ReturnType<typeof createClient>,
  query: string,
  entityTypes: string[],
  limit: number
): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = [];
  const normalizedQuery = query.toLowerCase();

  // Search dossiers if included
  if (
    entityTypes.some((t) => ['dossier', 'country', 'organization', 'forum', 'theme'].includes(t))
  ) {
    const { data: dossiers } = await supabase
      .from('dossiers')
      .select('name_en, name_ar, type')
      .or(`name_en.ilike.%${normalizedQuery}%,name_ar.ilike.%${normalizedQuery}%`)
      .limit(limit);

    for (const d of dossiers || []) {
      suggestions.push({
        suggestion: d.name_en as string,
        suggestion_ar: d.name_ar as string | null,
        suggestion_type: 'title',
        entity_type: (d.type as string) || 'dossier',
        similarity_score: 0.5,
        frequency: 1,
      });
    }
  }

  // Search engagements if included (using location_en/location_ar)
  if (entityTypes.includes('engagement')) {
    const { data: engagements } = await supabase
      .from('engagements')
      .select('location_en, location_ar, engagement_type')
      .or(
        `location_en.ilike.%${normalizedQuery}%,location_ar.ilike.%${normalizedQuery}%,engagement_type.ilike.%${normalizedQuery}%`
      )
      .limit(limit);

    for (const e of engagements || []) {
      if (e.location_en) {
        suggestions.push({
          suggestion: e.location_en as string,
          suggestion_ar: e.location_ar as string | null,
          suggestion_type: 'title',
          entity_type: 'engagement',
          similarity_score: 0.5,
          frequency: 1,
        });
      }
    }
  }

  return suggestions.slice(0, limit);
}

/**
 * Categorize suggestions by type
 */
function categorizeSuggestions(
  dbSuggestions: SearchSuggestion[],
  historyItems: SearchHistoryItem[]
): {
  titles: SearchSuggestion[];
  tags: SearchSuggestion[];
  popular: SearchSuggestion[];
  history: { query: string; result_count: number; created_at: string }[];
} {
  const titles: SearchSuggestion[] = [];
  const tags: SearchSuggestion[] = [];
  const popular: SearchSuggestion[] = [];

  for (const s of dbSuggestions) {
    if (s.suggestion_type === 'popular') {
      popular.push(s);
    } else if (s.suggestion_type === 'tag') {
      tags.push(s);
    } else {
      titles.push(s);
    }
  }

  return {
    titles: titles.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 8),
    tags: tags.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
    popular: popular.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
    history: historyItems.map((h) => ({
      query: h.query,
      result_count: h.result_count,
      created_at: h.created_at,
    })),
  };
}

/**
 * Compute filter counts for adaptive filtering
 */
async function computeFilterCounts(
  supabase: ReturnType<typeof createClient>,
  entityTypes: string[],
  baseQuery?: string
): Promise<FilterCount[]> {
  const counts: FilterCount[] = [];

  // Count by status
  const statusValues = ['active', 'inactive', 'archived', 'draft', 'published'];
  for (const status of statusValues) {
    let query = supabase
      .from('dossiers')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);
    if (baseQuery) {
      query = query.textSearch('search_vector', baseQuery, { type: 'websearch', config: 'simple' });
    }
    const { count } = await query;
    counts.push({ filter_type: 'status', filter_value: status, result_count: count || 0 });
  }

  // Count by dossier type
  const typeValues = ['country', 'organization', 'forum', 'theme'];
  for (const type of typeValues) {
    let query = supabase
      .from('dossiers')
      .select('id', { count: 'exact', head: true })
      .eq('type', type);
    if (baseQuery) {
      query = query.textSearch('search_vector', baseQuery, { type: 'websearch', config: 'simple' });
    }
    const { count } = await query;
    counts.push({ filter_type: 'type', filter_value: type, result_count: count || 0 });
  }

  // Count by date ranges
  const now = new Date();
  const dateRanges = [
    { preset: 'last_7_days', from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { preset: 'last_30_days', from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    { preset: 'last_90_days', from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
  ];

  for (const range of dateRanges) {
    let query = supabase
      .from('dossiers')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', range.from.toISOString());
    if (baseQuery) {
      query = query.textSearch('search_vector', baseQuery, { type: 'websearch', config: 'simple' });
    }
    const { count } = await query;
    counts.push({
      filter_type: 'date_range',
      filter_value: range.preset,
      result_count: count || 0,
    });
  }

  return counts;
}

// =============================================================================
// No-Results Intelligent Suggestions Handler
// =============================================================================

/**
 * Handle GET /search-suggestions/no-results - Get intelligent suggestions when search returns no results
 */
async function handleNoResultsSuggestions(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Only GET method allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q') || '';
  const typesParam = url.searchParams.get('types') || 'dossier';
  const language = url.searchParams.get('lang') || 'en';

  // Parse entity types
  const entityTypes = typesParam.split(',').filter((t) => VALID_ENTITY_TYPES.includes(t));
  if (entityTypes.length === 0) {
    entityTypes.push('dossier');
  }

  // Return empty if query is too short
  if (query.trim().length < 2) {
    return new Response(
      JSON.stringify({
        original_query: query,
        typo_corrections: [],
        related_terms: [],
        popular_searches: [],
        recent_content: [],
        search_tips: getSearchTips(language),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  // Run all suggestions fetching in parallel for performance
  const [typoCorrections, relatedTerms, popularSearches, recentContent, workspaceHistory] =
    await Promise.all([
      getTypoCorrections(supabase, query, entityTypes),
      getRelatedTerms(supabase, query, entityTypes),
      getPopularSearchesForNoResults(supabase, query, entityTypes),
      getRecentContent(supabase, entityTypes),
      getWorkspaceSearchHistory(supabase, query, entityTypes),
    ]);

  // Build create suggestion based on entity type
  const createSuggestion = buildCreateSuggestion(query, entityTypes[0]);

  // Build actionable tips based on the query analysis
  const actionableTips = buildActionableTips(query, entityTypes, language);

  const response: NoResultsSuggestions = {
    original_query: query,
    typo_corrections: typoCorrections,
    related_terms: relatedTerms,
    popular_searches: popularSearches,
    recent_content: recentContent,
    create_suggestion: createSuggestion,
    search_tips: getSearchTips(language),
    workspace_history: workspaceHistory,
    actionable_tips: actionableTips,
  };

  return new Response(
    JSON.stringify({
      ...response,
      took_ms: Date.now() - startTime,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get typo corrections using trigram similarity
 */
async function getTypoCorrections(
  supabase: ReturnType<typeof createClient>,
  query: string,
  entityTypes: string[]
): Promise<TypoCorrection[]> {
  const corrections: TypoCorrection[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  try {
    // Use trigram similarity to find close matches
    const { data } = await supabase
      .from('dossiers')
      .select('name_en, name_ar')
      .or(
        `name_en.ilike.%${normalizedQuery.slice(0, 3)}%,name_ar.ilike.%${normalizedQuery.slice(0, 3)}%`
      )
      .limit(20);

    if (data) {
      for (const item of data) {
        // Check English name
        if (item.name_en) {
          const similarity = calculateLevenshteinSimilarity(
            normalizedQuery,
            item.name_en.toLowerCase()
          );
          if (similarity >= 0.6 && similarity < 1.0) {
            corrections.push({
              original: query,
              corrected: item.name_en,
              similarity_score: similarity,
            });
          }
        }
        // Check Arabic name
        if (item.name_ar) {
          const similarity = calculateLevenshteinSimilarity(
            normalizedQuery,
            item.name_ar.toLowerCase()
          );
          if (similarity >= 0.6 && similarity < 1.0) {
            corrections.push({
              original: query,
              corrected: item.name_ar,
              similarity_score: similarity,
            });
          }
        }
      }
    }

    // Sort by similarity and return top 3
    return corrections.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 3);
  } catch (error) {
    console.error('Typo correction error:', error);
    return [];
  }
}

/**
 * Get related terms based on similar content
 */
async function getRelatedTerms(
  supabase: ReturnType<typeof createClient>,
  query: string,
  entityTypes: string[]
): Promise<RelatedTerm[]> {
  const terms: RelatedTerm[] = [];
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  try {
    // Search for items with partial word matches
    for (const word of queryWords) {
      if (word.length < 3) continue;

      const { data } = await supabase
        .from('dossiers')
        .select('name_en, name_ar, type')
        .or(`name_en.ilike.%${word}%,name_ar.ilike.%${word}%`)
        .neq('name_en', query)
        .limit(5);

      if (data) {
        for (const item of data) {
          if (item.name_en && !terms.some((t) => t.term === item.name_en)) {
            terms.push({
              term: item.name_en,
              term_ar: item.name_ar || null,
              category: 'related',
              confidence: 0.7,
            });
          }
        }
      }
    }

    return terms.slice(0, 5);
  } catch (error) {
    console.error('Related terms error:', error);
    return [];
  }
}

/**
 * Get popular searches that might be relevant
 */
async function getPopularSearchesForNoResults(
  supabase: ReturnType<typeof createClient>,
  query: string,
  entityTypes: string[]
): Promise<PopularSearchSuggestion[]> {
  try {
    // First try to find popular searches with similar query patterns
    const { data: similarPopular } = await supabase
      .from('popular_searches')
      .select('display_query, search_count, result_count, entity_types')
      .overlaps('entity_types', entityTypes)
      .gt('result_count', 0)
      .order('search_count', { ascending: false })
      .limit(5);

    if (similarPopular && similarPopular.length > 0) {
      return similarPopular.map((p: Record<string, unknown>) => ({
        query: p.display_query as string,
        search_count: p.search_count as number,
        result_count: p.result_count as number,
        entity_types: p.entity_types as string[],
      }));
    }

    return [];
  } catch (error) {
    console.error('Popular searches error:', error);
    return [];
  }
}

/**
 * Get recently added content
 */
async function getRecentContent(
  supabase: ReturnType<typeof createClient>,
  entityTypes: string[]
): Promise<RecentContent[]> {
  const content: RecentContent[] = [];

  try {
    // Get recent dossiers
    if (
      entityTypes.some((t) => ['dossier', 'country', 'organization', 'forum', 'theme'].includes(t))
    ) {
      const { data: dossiers } = await supabase
        .from('dossiers')
        .select('id, name_en, name_ar, type, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (dossiers) {
        for (const d of dossiers) {
          content.push({
            id: d.id as string,
            title_en: d.name_en as string,
            title_ar: d.name_ar as string | null,
            entity_type: (d.type as string) || 'dossier',
            created_at: d.created_at as string,
          });
        }
      }
    }

    // Get recent engagements
    if (entityTypes.includes('engagement')) {
      const { data: engagements } = await supabase
        .from('engagements')
        .select('id, title_en, title_ar, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (engagements) {
        for (const e of engagements) {
          content.push({
            id: e.id as string,
            title_en: e.title_en as string,
            title_ar: e.title_ar as string | null,
            entity_type: 'engagement',
            created_at: e.created_at as string,
          });
        }
      }
    }

    // Sort by created_at and return top 5
    return content
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Recent content error:', error);
    return [];
  }
}

/**
 * Build create entity suggestion
 */
function buildCreateSuggestion(
  query: string,
  entityType: string
): CreateEntitySuggestion | undefined {
  const routeMap: Record<string, string> = {
    dossier: '/dossiers/new',
    country: '/dossiers/new?type=country',
    organization: '/dossiers/new?type=organization',
    forum: '/dossiers/new?type=forum',
    theme: '/dossiers/new?type=theme',
    engagement: '/engagements/new',
    position: '/positions/new',
    document: '/documents/new',
    person: '/persons/new',
  };

  const route = routeMap[entityType] || routeMap['dossier'];

  return {
    entity_type: entityType,
    suggested_name: query,
    route: route,
    prefill_params: {
      name_en: query,
    },
  };
}

/**
 * Get workspace search history - successful searches that returned results
 */
async function getWorkspaceSearchHistory(
  supabase: ReturnType<typeof createClient>,
  query: string,
  entityTypes: string[]
): Promise<WorkspaceSearchHistory[]> {
  try {
    // Get successful searches from the workspace that returned results
    // These are searches by any user that had results
    const { data: history } = await supabase
      .from('search_history')
      .select('query, result_count, entity_types, created_at')
      .gt('result_count', 0)
      .overlaps('entity_types', entityTypes)
      .order('result_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (!history || history.length === 0) {
      return [];
    }

    // Filter to only show unique queries that are different from the current query
    const seenQueries = new Set<string>();
    const normalizedQuery = query.toLowerCase().trim();

    return (history as Array<Record<string, unknown>>)
      .filter((item) => {
        const itemQuery = (item.query as string).toLowerCase().trim();
        if (seenQueries.has(itemQuery) || itemQuery === normalizedQuery) {
          return false;
        }
        seenQueries.add(itemQuery);
        return true;
      })
      .map((item) => ({
        query: item.query as string,
        result_count: item.result_count as number,
        entity_types: item.entity_types as string[],
        searched_at: item.created_at as string,
      }))
      .slice(0, 5);
  } catch (error) {
    console.error('Workspace history error:', error);
    return [];
  }
}

/**
 * Build actionable tips based on query analysis
 */
function buildActionableTips(
  query: string,
  entityTypes: string[],
  language: string
): ActionableSearchTip[] {
  const tips: ActionableSearchTip[] = [];
  const words = query.trim().split(/\s+/);

  // Tip: Check spelling if query has potential typos
  if (words.some((word) => word.length > 3)) {
    tips.push({
      category: 'spelling',
      tip: 'Double-check the spelling of your search terms',
      tip_ar: 'تحقق من إملاء مصطلحات البحث',
    });
  }

  // Tip: Use broader terms if query is very specific
  if (words.length > 3 || query.length > 30) {
    tips.push({
      category: 'broader',
      tip: 'Try using fewer or more general keywords',
      tip_ar: 'جرب استخدام كلمات مفتاحية أقل أو أكثر عمومية',
    });
  }

  // Tip: Search in specific entity types
  if (entityTypes.includes('dossier') || entityTypes.length > 2) {
    tips.push({
      category: 'entity_specific',
      tip: 'Try searching within a specific category like Countries, Organizations, or Forums',
      tip_ar: 'جرب البحث ضمن فئة محددة مثل الدول أو المنظمات أو المنتديات',
      action: {
        type: 'change_entity_type',
        payload: { entityType: 'country' },
      },
    });
  }

  // Tip: Try semantic search
  tips.push({
    category: 'general',
    tip: 'Try using semantic search for natural language queries',
    tip_ar: 'جرب استخدام البحث الدلالي للاستعلامات باللغة الطبيعية',
    action: {
      type: 'use_semantic_search',
    },
  });

  return tips.slice(0, 4); // Limit to 4 tips
}

/**
 * Get search tips based on language
 */
function getSearchTips(language: string): string[] {
  if (language === 'ar') {
    return [
      'جرب كلمات مفتاحية مختلفة',
      'تحقق من الإملاء',
      'استخدم مصطلحات أعم',
      'جرب البحث بلغة أخرى',
    ];
  }
  return [
    'Try different keywords',
    'Check your spelling',
    'Use broader terms',
    'Try searching in another language',
  ];
}

/**
 * Calculate Levenshtein similarity between two strings
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const longerLength = longer.length;
  if (longerLength === 0) return 1;

  // Calculate Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter.charAt(i - 1) === longer.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[shorter.length][longer.length];
  return (longerLength - distance) / longerLength;
}
