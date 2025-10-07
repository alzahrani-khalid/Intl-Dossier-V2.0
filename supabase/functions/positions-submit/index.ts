import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { position_id } = await req.json();

    if (!position_id) {
      return new Response(
        JSON.stringify({ error: 'position_id is required', error_ar: 'معرف الموقف مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: position } = await supabase
      .from('positions')
      .select('*')
      .eq('id', position_id)
      .single();

    if (!position || !position.content_en || !position.content_ar) {
      return new Response(
        JSON.stringify({ error: 'Bilingual content required', error_ar: 'المحتوى ثنائي اللغة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: updated } = await supabase
      .from('positions')
      .update({ status: 'under_review', current_stage: 1 })
      .eq('id', position_id)
      .select()
      .single();

    return new Response(
      JSON.stringify({ position: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
