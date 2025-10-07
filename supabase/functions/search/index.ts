/**
 * Supabase Edge Function: Global Search
 * Feature: 015-search-retrieval-spec
 * Task: T039
 *
 * GET /search - Global search across all entity types
 *
 * Query Parameters:
 * - q: Search query (required, max 500 chars)
 * - type: Entity type filter (optional, comma-separated)
 * - lang: Preferred language for snippets (optional)
 * - limit: Results per page (optional, default 20, max 100)
 * - offset: Pagination offset (optional, default 0)
 * - include_archived: Include archived items (optional, default true)
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
    const entityTypes = url.searchParams.get('type') || 'all';
    const lang = url.searchParams.get('lang') || 'both';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const includeArchived = url.searchParams.get('include_archived') !== 'false';

    // Validate query
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query parameter is required and cannot be empty',
          details: {
            message: 'Query parameter is required and cannot be empty',
            message_ar: 'معلمة الاستعلام مطلوبة ولا يمكن أن تكون فارغة'
          }
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

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Detect language
    const arabicRegex = /[\u0600-\u06FF]/;
    const englishRegex = /[A-Za-z]/;
    const hasArabic = arabicRegex.test(processedQuery);
    const hasEnglish = englishRegex.test(processedQuery);

    let languageDetected: 'ar' | 'en' | 'mixed' = 'en';
    if (hasArabic && hasEnglish) {
      languageDetected = 'mixed';
    } else if (hasArabic) {
      languageDetected = 'ar';
    }

    // Detect boolean operators
    const hasBooleanOperators = /\b(AND|OR|NOT)\b/.test(processedQuery);

    // Normalize query
    const normalizedQuery = processedQuery.toLowerCase().trim();

    // Parse entity types
    const requestedTypes = entityTypes === 'all'
      ? ['dossiers', 'people', 'engagements', 'positions', 'mous', 'documents']
      : entityTypes.split(',').map(t => t.trim());

    // Map entity types to tables
    const tableMap: Record<string, string> = {
      'dossiers': 'dossiers',
      'people': 'users',  // Changed from staff_profiles to users
      'engagements': 'engagements',
      'positions': 'positions',
      'mous': 'mous',
      'documents': 'attachments'
    };

    // Execute search across entity types using database function
    const results: any[] = [];
    const counts: Record<string, number> = {
      total: 0,
      dossiers: 0,
      people: 0,
      engagements: 0,
      positions: 0,
      mous: 0,
      documents: 0,
      restricted: 0
    };

    // Search configuration based on language
    const searchConfig = languageDetected === 'ar' ? 'arabic' : 'english';

    // Use database function for full-text search
    for (const type of requestedTypes) {
      try {
        // Call search_entities_fulltext function
        const { data, error } = await supabase.rpc('search_entities_fulltext', {
          p_entity_type: type,
          p_query: processedQuery,
          p_language: searchConfig,
          p_limit: validatedLimit,
          p_offset: validatedOffset
        });

        if (error) {
          console.error(`Error searching ${type}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          // Transform results to match response schema
          const typedResults = data.map((item: any) => ({
            id: item.entity_id,
            type: item.entity_type,
            title_en: item.entity_title_en || '',
            title_ar: item.entity_title_ar || '',
            snippet_en: item.entity_snippet_en || '',
            snippet_ar: item.entity_snippet_ar || '',
            rank_score: Math.min(1.0, item.rank_score * 10), // Normalize to 0-1 range
            updated_at: item.updated_at,
            match_type: 'exact',
            is_archived: false // Will be determined from status if available
          }));

          results.push(...typedResults);
          counts[type] = data.length;
          counts.total += data.length;
        }

        // For people search, also search external_contacts
        if (type === 'people') {
          const { data: externalData, error: externalError } = await supabase.rpc('search_entities_fulltext', {
            p_entity_type: 'external_contacts',
            p_query: processedQuery,
            p_language: searchConfig,
            p_limit: validatedLimit,
            p_offset: validatedOffset
          });

          if (!externalError && externalData && externalData.length > 0) {
            const externalResults = externalData.map((item: any) => ({
              id: item.entity_id,
              type: 'person',
              title_en: item.entity_title_en || '',
              title_ar: item.entity_title_ar || '',
              snippet_en: item.entity_snippet_en || '',
              snippet_ar: item.entity_snippet_ar || '',
              rank_score: Math.min(1.0, item.rank_score * 10),
              updated_at: item.updated_at,
              match_type: 'exact',
              is_archived: false
            }));

            results.push(...externalResults);
            counts.people += externalData.length;
            counts.total += externalData.length;
          }
        }
      } catch (err) {
        console.error(`Error searching ${type}:`, err);
      }
    }

    // Sort results by rank_score DESC
    results.sort((a, b) => b.rank_score - a.rank_score);

    // Calculate took_ms
    const tookMs = Date.now() - startTime;

    // Build response
    const response = {
      results: results.slice(0, validatedLimit),
      counts,
      query: {
        original: query,
        normalized: normalizedQuery,
        language_detected: languageDetected,
        has_boolean_operators: hasBooleanOperators
      },
      took_ms: tookMs,
      warnings,
      metadata: {
        has_more: counts.total > validatedOffset + validatedLimit,
        next_offset: counts.total > validatedOffset + validatedLimit
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
