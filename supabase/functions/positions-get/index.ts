import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-get
 * GET /positions/{id}
 *
 * Returns a single position by ID
 * RLS enforces access control based on:
 * - Draft: only author can view
 * - Under review: approvers at current stage can view
 * - Published: users in audience groups can view
 */

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const position_id = url.searchParams.get('position_id');

    if (!position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          error_ar: 'رأس التفويض مفقود'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Fetch position with RLS enforcement
    const { data: position, error } = await supabase
      .from('positions')
      .select('*')
      .eq('id', position_id)
      .single();

    if (error) {
      // RLS will cause error if user doesn't have access
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            error: 'Position not found or access denied',
            error_ar: 'الموقف غير موجود أو تم رفض الوصول'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error fetching position:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch position',
          error_ar: 'فشل في جلب الموقف',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!position) {
      return new Response(
        JSON.stringify({
          error: 'Position not found',
          error_ar: 'الموقف غير موجود'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return position without audience groups for now
    const result = {
      ...position,
      audience_groups: []
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        error_ar: 'خطأ داخلي في الخادم'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
