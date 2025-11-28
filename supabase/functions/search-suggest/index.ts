/**
 * Supabase Edge Function: Search Suggestions (Typeahead)
 * Feature: 015-search-retrieval-spec
 * Task: T040
 *
 * GET /search-suggest - Typeahead suggestions for search
 *
 * Query Parameters:
 * - q: Search prefix (required, max 100 chars)
 * - type: Entity type filter (optional, comma-separated)
 * - limit: Number of suggestions (optional, default 10, max 20)
 *
 * Performance Target: <200ms absolute (p100)
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
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Validate query
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query parameter is required and cannot be empty',
          message_ar: 'معلمة الاستعلام مطلوبة ولا يمكن أن تكون فارغة'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate query length (100 char limit for suggestions)
    if (query.length > 100) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query too long (maximum 100 characters for suggestions)',
          message_ar: 'الاستعلام طويل جدًا (الحد الأقصى 100 حرفًا للاقتراحات)'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate limit
    const validatedLimit = Math.min(Math.max(1, limit), 20);

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
    const hasArabic = arabicRegex.test(query);
    const hasEnglish = englishRegex.test(query);

    let languageDetected: 'ar' | 'en' | 'mixed' = 'en';
    if (hasArabic && hasEnglish) {
      languageDetected = 'mixed';
    } else if (hasArabic) {
      languageDetected = 'ar';
    }

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();

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

    // Execute prefix search across entity types using trigram similarity
    const suggestions: any[] = [];

    // Use trigram similarity for fast, fuzzy prefix matching
    for (const type of requestedTypes) {
      const tableName = tableMap[type];
      if (!tableName) continue;

      try {
        // Build query with trigram similarity
        // Use similarity() function for fuzzy matching
        let selectFields = 'id, created_at, updated_at';
        let titleField = 'title_en';
        let titleFieldAr = 'title_ar';
        let descField = 'description_en';
        let descFieldAr = 'description_ar';

        // Adjust field names based on table
        if (tableName === 'users') {
          titleField = 'name_en';
          titleFieldAr = 'name_ar';
          descField = 'department';
          descFieldAr = 'department';
        } else if (tableName === 'dossiers') {
          titleField = 'name_en';
          titleFieldAr = 'name_ar';
          descField = 'description_en';
          descFieldAr = 'description_ar';
        }

        selectFields += `, ${titleField}, ${titleFieldAr}`;
        if (descField) selectFields += `, ${descField}, ${descFieldAr}`;

        // Query with prefix match (faster than full similarity for typeahead)
        const { data, error } = await supabase
          .from(tableName)
          .select(selectFields)
          .or(`${titleField}.ilike.${normalizedQuery}%,${titleFieldAr}.ilike.${normalizedQuery}%`)
          .limit(validatedLimit);

        if (error) {
          console.error(`Error getting suggestions for ${type}:`, error);
          continue;
        }

        // Add to suggestions with proper type mapping
        if (data && data.length > 0) {
          const typeLabel = type === 'people' ? 'person' : type.slice(0, -1);

          const typedSuggestions = data.map((item: any) => {
            const title_en = item[titleField] || '';
            const title_ar = item[titleFieldAr] || '';
            const preview_en = item[descField] || '';
            const preview_ar = item[descFieldAr] || '';

            // Calculate simple match score based on prefix position
            const enMatch = title_en.toLowerCase().indexOf(normalizedQuery);
            const arMatch = title_ar.indexOf(normalizedQuery);
            const matchPos = enMatch >= 0 ? enMatch : (arMatch >= 0 ? arMatch : 99);
            const score = 1.0 - (matchPos * 0.1); // Earlier matches score higher

            return {
              id: item.id,
              type: typeLabel,
              title_en,
              title_ar,
              preview_en: preview_en.substring(0, 100), // Limit preview length
              preview_ar: preview_ar.substring(0, 100),
              score: Math.max(0.1, Math.min(1.0, score)),
              match_position: matchPos
            };
          });

          suggestions.push(...typedSuggestions);
        }
      } catch (err) {
        console.error(`Error getting suggestions for ${type}:`, err);
      }
    }

    // Sort by score DESC, then by match position
    suggestions.sort((a, b) => {
      if (Math.abs(a.score - b.score) > 0.01) {
        return b.score - a.score;
      }
      return a.match_position - b.match_position;
    });

    // Limit to requested number
    const limitedSuggestions = suggestions.slice(0, validatedLimit);

    // Calculate took_ms
    const tookMs = Date.now() - startTime;

    // Check if performance target met (<200ms)
    if (tookMs > 200) {
      console.warn(`Suggestion performance SLA missed: ${tookMs}ms > 200ms`);
    }

    // Build response
    const response = {
      suggestions: limitedSuggestions,
      query: {
        original: query,
        normalized: normalizedQuery,
        language_detected: languageDetected
      },
      took_ms: tookMs,
      cache_hit: false, // TODO: Implement Redis cache check
      metadata: {
        total_suggestions: limitedSuggestions.length,
        types_searched: requestedTypes
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Response-Time': `${tookMs}ms`,
          'X-Cache-Hit': 'false'
        }
      }
    );

  } catch (error) {
    console.error('Suggestion error:', error);
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
