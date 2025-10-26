/**
 * Supabase Edge Function: Unified Search
 * Feature: 026-unified-dossier-architecture
 * Task: T105 - Unified search across all 7 dossier types
 *
 * GET /search - Search across all dossier types with RLS integration
 *
 * Query Parameters:
 * - q: Search query (required, max 500 chars)
 * - types: Dossier type filter (optional, comma-separated: country,organization,forum,engagement,theme,working_group,person)
 * - status: Status filter (optional, comma-separated: active,inactive,archived,deleted)
 * - sensitivity_max: Maximum sensitivity level (optional, 0-5)
 * - limit: Results per page (optional, default 50, max 100)
 * - offset: Pagination offset (optional, default 0)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Parse query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const typesParam = url.searchParams.get('types');
    const statusParam = url.searchParams.get('status');
    const sensitivityMax = url.searchParams.get('sensitivity_max');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate query
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query parameter "q" is required and cannot be empty',
          message_ar: 'معلمة الاستعلام "q" مطلوبة ولا يمكن أن تكون فارغة'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate and truncate query if needed
    const warnings: string[] = [];
    let processedQuery = query;
    if (query.length > 500) {
      processedQuery = query.substring(0, 500);
      warnings.push('Query truncated to 500 characters');
    }

    // Validate limit
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedOffset = Math.max(0, offset);

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with user's token (RLS will apply automatically)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Parse dossier types filter
    const types = typesParam ? typesParam.split(',').map(t => t.trim()) : undefined;
    const validTypes = ['country', 'organization', 'forum', 'engagement', 'theme', 'working_group', 'person'];
    if (types && types.some(t => !validTypes.includes(t))) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: `Invalid dossier types. Valid types: ${validTypes.join(', ')}`,
          message_ar: 'أنواع ملفات غير صالحة'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse status filter
    const statusFilter = statusParam ? statusParam.split(',').map(s => s.trim()) : undefined;
    const validStatuses = ['active', 'inactive', 'archived', 'deleted'];
    if (statusFilter && statusFilter.some(s => !validStatuses.includes(s))) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: `Invalid status values. Valid statuses: ${validStatuses.join(', ')}`,
          message_ar: 'قيم حالة غير صالحة'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform query for full-text search (split terms and join with OR)
    const terms = processedQuery
      .replace(/[^\w\s\u0600-\u06FF]/gi, '') // Keep alphanumeric, spaces, and Arabic
      .split(/\s+/)
      .filter(Boolean);

    const tsquery = terms.join(' | '); // OR operator for broader results

    // Build search query
    let dbQuery = supabase
      .from('dossiers')
      .select('*', { count: 'exact' })
      .textSearch('search_vector', tsquery, {
        type: 'websearch',
        config: 'simple',
      });

    // Apply type filter
    if (types && types.length > 0) {
      dbQuery = dbQuery.in('type', types);
    }

    // Apply status filter (default: exclude deleted)
    if (statusFilter && statusFilter.length > 0) {
      dbQuery = dbQuery.in('status', statusFilter);
    } else {
      dbQuery = dbQuery.neq('status', 'deleted');
    }

    // Apply sensitivity filter
    if (sensitivityMax !== null && sensitivityMax !== undefined) {
      const maxLevel = parseInt(sensitivityMax);
      if (isNaN(maxLevel) || maxLevel < 0 || maxLevel > 5) {
        return new Response(
          JSON.stringify({
            error: 'bad_request',
            message: 'sensitivity_max must be between 0 and 5',
            message_ar: 'يجب أن تكون sensitivity_max بين 0 و 5'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      dbQuery = dbQuery.lte('sensitivity_level', maxLevel);
    }

    // Apply pagination
    dbQuery = dbQuery.range(validatedOffset, validatedOffset + validatedLimit - 1);

    // Execute query
    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Search error:', error);
      return new Response(
        JSON.stringify({
          error: 'database_error',
          message: error.message,
          message_ar: 'حدث خطأ في قاعدة البيانات'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate ranking and format results
    const results = (data || []).map((dossier: any) => {
      // Calculate rank (exact match > partial match > description match)
      let rank = 20; // Default rank
      const lowerQuery = processedQuery.toLowerCase();
      const nameEn = (dossier.name_en || '').toLowerCase();
      const nameAr = (dossier.name_ar || '').toLowerCase();
      const descEn = (dossier.description_en || '').toLowerCase();
      const descAr = (dossier.description_ar || '').toLowerCase();

      if (nameEn === lowerQuery || nameAr === lowerQuery) {
        rank = 100; // Exact match
      } else if (nameEn.startsWith(lowerQuery) || nameAr.startsWith(lowerQuery)) {
        rank = 90; // Starts with
      } else if (nameEn.includes(lowerQuery) || nameAr.includes(lowerQuery)) {
        rank = 80; // Contains in name
      } else if (descEn.includes(lowerQuery) || descAr.includes(lowerQuery)) {
        rank = 60; // Contains in description
      }

      // Generate snippet
      let snippet = '';
      if (nameEn.includes(lowerQuery)) {
        snippet = dossier.name_en;
      } else if (nameAr.includes(lowerQuery)) {
        snippet = dossier.name_ar;
      } else if (descEn.includes(lowerQuery)) {
        const index = descEn.indexOf(lowerQuery);
        const start = Math.max(0, index - 50);
        const end = Math.min(dossier.description_en.length, index + processedQuery.length + 50);
        snippet = (start > 0 ? '...' : '') +
                  dossier.description_en.substring(start, end) +
                  (end < dossier.description_en.length ? '...' : '');
      } else if (descAr.includes(lowerQuery)) {
        const index = descAr.indexOf(lowerQuery);
        const start = Math.max(0, index - 50);
        const end = Math.min(dossier.description_ar.length, index + processedQuery.length + 50);
        snippet = (start > 0 ? '...' : '') +
                  dossier.description_ar.substring(start, end) +
                  (end < dossier.description_ar.length ? '...' : '');
      }

      return {
        id: dossier.id,
        type: dossier.type,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
        description_en: dossier.description_en || null,
        description_ar: dossier.description_ar || null,
        status: dossier.status,
        sensitivity_level: dossier.sensitivity_level,
        tags: dossier.tags || [],
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
        rank,
        snippet: snippet || dossier.description_en?.substring(0, 150) || ''
      };
    });

    // Sort by rank (exact match > relevance > status > alphabetical)
    results.sort((a: any, b: any) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      if (a.status !== b.status) {
        const statusOrder: Record<string, number> = {
          active: 0, inactive: 1, archived: 2, deleted: 3
        };
        return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
      }
      return a.name_en.localeCompare(b.name_en);
    });

    // Calculate took_ms
    const tookMs = Date.now() - startTime;

    // Build response
    const response = {
      data: results,
      count: count || 0,
      limit: validatedLimit,
      offset: validatedOffset,
      query: {
        original: query,
        normalized: processedQuery,
        terms,
        tsquery
      },
      took_ms: tookMs,
      warnings,
      metadata: {
        has_more: (count || 0) > validatedOffset + validatedLimit,
        next_offset: (count || 0) > validatedOffset + validatedLimit
          ? validatedOffset + validatedLimit
          : null
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
