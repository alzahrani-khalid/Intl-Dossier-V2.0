import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { position_id, comments } = await req.json()

  if (!comments) {
    return new Response(JSON.stringify({ error: 'Comments required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authHeader } },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Authorization: only approver-role users (supervisor/admin) may request revisions.
  // Role is resolved from public.users, never from client-settable user_metadata.
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!['supervisor', 'admin'].includes(userRecord?.role)) {
    return new Response(
      JSON.stringify({ error: 'forbidden', message: 'Only an approver can request revisions' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // The position must be under review at its current stage to send it back for revisions.
  const { data: position } = await supabase
    .from('positions')
    .select('id, status, current_stage')
    .eq('id', position_id)
    .single()
  if (!position) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (position.status !== 'under_review') {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: `Cannot request revisions for position with status: ${position.status}`,
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  await supabase.from('approvals').insert({
    position_id,
    stage: position.current_stage,
    approver_id: user.id,
    action: 'request_revisions',
    comments,
  })

  const { data: updated } = await supabase
    .from('positions')
    .update({ status: 'draft', current_stage: 0 })
    .eq('id', position_id)
    .select()
    .single()

  return new Response(JSON.stringify(updated), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
