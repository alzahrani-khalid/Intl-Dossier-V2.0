import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { position_id, comments, elevated_token } = await req.json();
    
    if (!elevated_token) {
      return new Response(
        JSON.stringify({ error: 'Step-up authentication required', error_ar: 'مطلوب مصادقة خطوة' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { data: position } = await supabase.from('positions').select('*').eq('id', position_id).single();

    if (!position) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('approvals').insert({
      position_id,
      stage: position.current_stage,
      approver_id: user!.id,
      action: 'approve',
      comments,
      step_up_verified: true,
    });

    const finalStage = position.approval_chain_config?.stages?.length || 3;
    const newStatus = position.current_stage + 1 >= finalStage ? 'approved' : 'under_review';
    
    const { data: updated } = await supabase
      .from('positions')
      .update({
        current_stage: position.current_stage + 1,
        status: newStatus,
      })
      .eq('id', position_id)
      .select()
      .single();

    return new Response(JSON.stringify(updated), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
