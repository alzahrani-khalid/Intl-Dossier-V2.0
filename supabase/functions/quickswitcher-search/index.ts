/**
 * Supabase Edge Function: QuickSwitcher Search
 * Feature: global-search-quickswitcher
 *
 * GET /quickswitcher-search - Fast typeahead search for QuickSwitcher (Cmd+K)
 *
 * Query Parameters:
 * - q: Search query (required, min 2 characters)
 * - limit: Max results (optional, default 20, max 50)
 *
 * Returns results grouped into DOSSIERS and RELATED WORK sections
 * using the optimized quickswitcher_search_v2 RPC function.
 *
 * Performance: Single RPC call, target <50ms DB execution
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface DossierResult {
  id: string;
  type: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status: string;
  relevance_score: number;
  matched_field: string;
  updated_at: string;
}

interface WorkResult {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  status?: string;
  priority?: string;
  relevance_score: number;
  matched_field: string;
  updated_at: string;
  deadline?: string;
  dossier_context?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
  };
}

interface RPCResult {
  dossiers: DossierResult[];
  positions: WorkResult[];
  tasks: WorkResult[];
  commitments: WorkResult[];
  error?: string;
}

interface QuickSwitcherResponse {
  dossiers: DossierResult[];
  related_work: WorkResult[];
  query: {
    text: string;
    normalized: string;
  };
  took_ms: number;
  cache_hit: boolean;
}

/**
 * Detect language of search query
 */
function detectLanguage(text: string): 'en' | 'ar' | 'mixed' {
  const arabicPattern = /[\u0600-\u06FF]/;
  const englishPattern = /[a-zA-Z]/;

  const hasArabic = arabicPattern.test(text);
  const hasEnglish = englishPattern.test(text);

  if (hasArabic && hasEnglish) return 'mixed';
  if (hasArabic) return 'ar';
  return 'en';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only GET method is allowed',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const startTime = Date.now();

    // Parse query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    // Validate query
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query must be at least 2 characters',
          message_ar: 'يجب أن يكون الاستعلام على الأقل حرفين',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get auth token
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

    // Create Supabase client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();

    // Call the optimized RPC function (single round-trip)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('quickswitcher_search_v2', {
      p_query: normalizedQuery,
      p_limit: limit,
    });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return new Response(
        JSON.stringify({
          error: 'search_failed',
          message: rpcError.message,
          message_ar: 'فشل البحث',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = rpcResult as RPCResult;

    // Check for RPC validation error
    if (result.error) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: result.error,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Combine positions, tasks, and commitments into related_work
    const relatedWork: WorkResult[] = [
      ...(result.positions || []),
      ...(result.tasks || []),
      ...(result.commitments || []),
    ].sort((a, b) => b.relevance_score - a.relevance_score);

    const tookMs = Date.now() - startTime;

    // Build response
    const response: QuickSwitcherResponse = {
      dossiers: result.dossiers || [],
      related_work: relatedWork,
      query: {
        text: query,
        normalized: normalizedQuery,
      },
      took_ms: tookMs,
      cache_hit: false,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${tookMs}ms`,
        // Add cache headers for browser caching
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('QuickSwitcher search error:', error);
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
