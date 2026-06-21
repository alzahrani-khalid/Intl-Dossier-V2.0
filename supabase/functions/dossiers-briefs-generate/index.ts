import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { generateBriefTemplate, prePopulateTemplate } from '../_shared/brief-template.ts';

interface GenerateBriefRequest {
  date_range_start?: string;
  date_range_end?: string;
  sections?: string[];
}

interface BriefContent {
  summary: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message_en: 'Method not allowed',
          message_ar: 'الطريقة غير مسموح بها',
        },
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract dossier ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const dossierId = pathParts[pathParts.indexOf('dossiers') + 1];

    if (!dossierId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'MISSING_ID',
            message_en: 'Dossier ID is required',
            message_ar: 'معرف الملف مطلوب',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: GenerateBriefRequest = await req.json().catch(() => ({}));

    // Fetch dossier data
    const { data: dossier, error: dossierError } = await supabaseClient
      .from('dossiers')
      .select('*')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message_en: 'Dossier not found or access denied',
            message_ar: 'الملف غير موجود أو الوصول مرفوض',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch timeline events in date range
    let timelineQuery = supabaseClient
      .from('dossier_timeline')
      .select('*')
      .eq('dossier_id', dossierId);

    if (body.date_range_start) {
      timelineQuery = timelineQuery.gte('event_date', body.date_range_start);
    }
    if (body.date_range_end) {
      timelineQuery = timelineQuery.lte('event_date', body.date_range_end);
    }

    const { data: timelineEvents, error: timelineError } = await timelineQuery
      .order('event_date', { ascending: false })
      .limit(50);

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
    }

    const events = timelineEvents || [];

    // -----------------------------------------------------------------------
    // RETIRED (Phase 74, D3 / EVAL-04): the legacy external-LLM generate+persist
    // branch is removed. It targeted a DEAD pre-swap `briefs`
    // schema (verified live 2026-06-20; DEFER-73-01-A/B) and would have raised
    // PGRST204 at runtime. The SUPPORTED, audited brief-write path is the
    // SECURITY INVOKER `persist_brief(p_dossier_id, p_content, p_title,
    // p_summary)` RPC (migration 20260621090100_phase73_persist_brief.sql),
    // committed under the caller JWT by the copilot `propose_brief` HITL surface
    // (P73 73-03).
    //
    // This function NO LONGER generates briefs. It returns the manual brief
    // template (pre-populated from the dossier + recent timeline) and directs
    // callers to the copilot propose-brief flow for AI generation. No external
    // egress; no service-role; `briefs` is not written here.
    // -----------------------------------------------------------------------

    // Manual template fallback (the sole, supported response of this function).
    const template = generateBriefTemplate();
    const prePopulated = prePopulateTemplate(
      {
        id: dossier.id,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
        type: dossier.type,
        summary_en: dossier.summary_en,
        summary_ar: dossier.summary_ar,
        tags: dossier.tags || [],
      },
      events
    );

    return new Response(
      JSON.stringify({
        notice: {
          code: 'BRIEF_GENERATION_RETIRED',
          message_en:
            'Automated brief generation here is retired. Use the assistant (propose brief) for AI ' +
            'generation, or fill the manual template below.',
          message_ar:
            'تم إيقاف إنشاء الموجز الآلي هنا. استخدم المساعد (اقتراح موجز) للإنشاء بالذكاء الاصطناعي، ' +
            'أو املأ النموذج اليدوي أدناه.',
        },
        fallback: {
          template,
          pre_populated_data: prePopulated,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
