/**
 * Supabase Edge Function: QuickSwitcher Search
 * Feature: global-search-quickswitcher
 *
 * GET /quickswitcher-search - Fast typeahead search for QuickSwitcher (Cmd+K)
 *
 * Query Parameters:
 * - q: Search query (required, min 2 characters)
 * - limit: Max results (optional, default 20, max 50)
 * - lang: Language preference (optional, 'en' | 'ar')
 *
 * Returns results grouped into DOSSIERS and RELATED WORK sections
 * with type badges and dossier context.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Dossier types to search
const DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
];

// Related work types
const WORK_TYPES = ['position', 'task', 'commitment', 'intake', 'mou'];

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
  stats?: {
    total_engagements: number;
    total_documents: number;
    total_positions: number;
  };
}

interface WorkResult {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
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

interface QuickSwitcherResponse {
  dossiers: DossierResult[];
  related_work: WorkResult[];
  query: {
    text: string;
    normalized: string;
    language_detected: 'en' | 'ar' | 'mixed';
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

/**
 * Calculate fuzzy match score
 */
function calculateMatchScore(query: string, text: string, isExactPrefix: boolean): number {
  if (!text) return 0;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact prefix match = highest score
  if (textLower.startsWith(queryLower)) {
    const lengthRatio = queryLower.length / textLower.length;
    return 0.9 + lengthRatio * 0.1;
  }

  // Contains query = medium score
  if (textLower.includes(queryLower)) {
    const position = textLower.indexOf(queryLower);
    const positionScore = 1 - position / textLower.length;
    return 0.5 + positionScore * 0.3;
  }

  // Word boundary match
  const words = textLower.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(queryLower)) {
      return 0.6;
    }
  }

  return 0;
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
    const lang = url.searchParams.get('lang') as 'en' | 'ar' | null;

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

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Detect language and normalize query
    const detectedLang = lang || detectLanguage(query);
    const normalizedQuery = query.toLowerCase().trim();

    // Search dossiers
    const dossierResults: DossierResult[] = [];

    // Query dossiers table with fuzzy search
    const { data: dossiers, error: dossierError } = await supabase
      .from('dossiers')
      .select(
        `
        id,
        type,
        name_en,
        name_ar,
        description_en,
        description_ar,
        status,
        is_archived,
        updated_at
      `
      )
      .or(
        `name_en.ilike.%${normalizedQuery}%,name_ar.ilike.%${normalizedQuery}%,description_en.ilike.%${normalizedQuery}%`
      )
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!dossierError && dossiers) {
      for (const d of dossiers) {
        // Determine which field matched
        const matchedField = d.name_en?.toLowerCase().includes(normalizedQuery)
          ? 'name_en'
          : d.name_ar?.includes(normalizedQuery)
            ? 'name_ar'
            : 'description_en';

        const matchText =
          matchedField === 'name_en'
            ? d.name_en
            : matchedField === 'name_ar'
              ? d.name_ar
              : d.description_en;

        const score = calculateMatchScore(
          normalizedQuery,
          matchText || '',
          matchedField.includes('name')
        );

        if (score > 0.1) {
          dossierResults.push({
            id: d.id,
            type: d.type,
            name_en: d.name_en || '',
            name_ar: d.name_ar || '',
            description_en: d.description_en,
            description_ar: d.description_ar,
            status: d.is_archived ? 'archived' : 'active',
            relevance_score: score,
            matched_field: matchedField,
            updated_at: d.updated_at,
          });
        }
      }
    }

    // Sort dossiers by score
    dossierResults.sort((a, b) => b.relevance_score - a.relevance_score);

    // Search related work items (positions, tasks, commitments)
    const workResults: WorkResult[] = [];

    // Search positions
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select(
        `
        id,
        title_en,
        title_ar,
        summary_en,
        summary_ar,
        status,
        updated_at,
        dossier_id,
        dossiers:dossier_id (
          id,
          type,
          name_en,
          name_ar
        )
      `
      )
      .or(`title_en.ilike.%${normalizedQuery}%,title_ar.ilike.%${normalizedQuery}%`)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(Math.floor(limit / 2));

    if (!posError && positions) {
      for (const p of positions) {
        const matchedField = p.title_en?.toLowerCase().includes(normalizedQuery)
          ? 'title_en'
          : 'title_ar';

        const matchText = matchedField === 'title_en' ? p.title_en : p.title_ar;

        const score = calculateMatchScore(normalizedQuery, matchText || '', true);

        if (score > 0.1) {
          const dossier = Array.isArray(p.dossiers) ? p.dossiers[0] : p.dossiers;
          workResults.push({
            id: p.id,
            type: 'position',
            title_en: p.title_en || '',
            title_ar: p.title_ar || '',
            description_en: p.summary_en,
            description_ar: p.summary_ar,
            status: p.status,
            relevance_score: score,
            matched_field: matchedField,
            updated_at: p.updated_at,
            dossier_context: dossier
              ? {
                  id: dossier.id,
                  type: dossier.type,
                  name_en: dossier.name_en || '',
                  name_ar: dossier.name_ar || '',
                }
              : undefined,
          });
        }
      }
    }

    // Search tasks
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select(
        `
        id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        status,
        priority,
        deadline,
        updated_at
      `
      )
      .or(`title_en.ilike.%${normalizedQuery}%,title_ar.ilike.%${normalizedQuery}%`)
      .not('status', 'in', '(cancelled,completed)')
      .order('updated_at', { ascending: false })
      .limit(Math.floor(limit / 3));

    if (!taskError && tasks) {
      for (const t of tasks) {
        const matchedField = t.title_en?.toLowerCase().includes(normalizedQuery)
          ? 'title_en'
          : 'title_ar';

        const matchText = matchedField === 'title_en' ? t.title_en : t.title_ar;

        const score = calculateMatchScore(normalizedQuery, matchText || '', true);

        if (score > 0.1) {
          workResults.push({
            id: t.id,
            type: 'task',
            title_en: t.title_en || '',
            title_ar: t.title_ar || '',
            description_en: t.description_en,
            description_ar: t.description_ar,
            status: t.status,
            priority: t.priority,
            relevance_score: score,
            matched_field: matchedField,
            updated_at: t.updated_at,
            deadline: t.deadline,
          });
        }
      }
    }

    // Search commitments
    const { data: commitments, error: commitError } = await supabase
      .from('commitments')
      .select(
        `
        id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        status,
        priority,
        deadline,
        updated_at,
        dossier_id,
        dossiers:dossier_id (
          id,
          type,
          name_en,
          name_ar
        )
      `
      )
      .or(`title_en.ilike.%${normalizedQuery}%,title_ar.ilike.%${normalizedQuery}%`)
      .not('status', 'eq', 'cancelled')
      .order('updated_at', { ascending: false })
      .limit(Math.floor(limit / 3));

    if (!commitError && commitments) {
      for (const c of commitments) {
        const matchedField = c.title_en?.toLowerCase().includes(normalizedQuery)
          ? 'title_en'
          : 'title_ar';

        const matchText = matchedField === 'title_en' ? c.title_en : c.title_ar;

        const score = calculateMatchScore(normalizedQuery, matchText || '', true);

        if (score > 0.1) {
          const dossier = Array.isArray(c.dossiers) ? c.dossiers[0] : c.dossiers;
          workResults.push({
            id: c.id,
            type: 'commitment',
            title_en: c.title_en || '',
            title_ar: c.title_ar || '',
            description_en: c.description_en,
            description_ar: c.description_ar,
            status: c.status,
            priority: c.priority,
            relevance_score: score,
            matched_field: matchedField,
            updated_at: c.updated_at,
            deadline: c.deadline,
            dossier_context: dossier
              ? {
                  id: dossier.id,
                  type: dossier.type,
                  name_en: dossier.name_en || '',
                  name_ar: dossier.name_ar || '',
                }
              : undefined,
          });
        }
      }
    }

    // Sort work results by score
    workResults.sort((a, b) => b.relevance_score - a.relevance_score);

    const tookMs = Date.now() - startTime;

    // Build response
    const response: QuickSwitcherResponse = {
      dossiers: dossierResults.slice(0, Math.ceil(limit * 0.6)),
      related_work: workResults.slice(0, Math.ceil(limit * 0.4)),
      query: {
        text: query,
        normalized: normalizedQuery,
        language_detected: detectedLang === 'en' || detectedLang === 'ar' ? detectedLang : 'mixed',
      },
      took_ms: tookMs,
      cache_hit: false, // TODO: Implement Redis caching
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${tookMs}ms`,
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
