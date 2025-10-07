import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  const { position_id, comments } = await req.json();
  
  if (!comments) {
    return new Response(JSON.stringify({ error: 'Comments required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });

  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('approvals').insert({
    position_id,
    stage: 1,
    approver_id: user!.id,
    action: 'request_revisions',
    comments,
  });

  const { data: updated } = await supabase
    .from('positions')
    .update({ status: 'draft', current_stage: 0 })
    .eq('id', position_id)
    .select()
    .single();

  return new Response(JSON.stringify(updated), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
