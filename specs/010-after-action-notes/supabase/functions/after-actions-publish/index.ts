import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const afterActionId = pathParts[pathParts.length - 2]; // Second to last (before "publish")

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current after-action to check confidentiality
    const { data: current, error: fetchError } = await supabaseClient
      .from('after_action_records')
      .select('is_confidential, publication_status')
      .eq('id', afterActionId)
      .single();

    if (fetchError || !current) {
      return new Response(
        JSON.stringify({ error: 'After-action not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If confidential, check for step-up MFA (simplified for now)
    if (current.is_confidential) {
      const body = await req.json();
      if (!body.mfa_token) {
        return new Response(
          JSON.stringify({
            error: 'step_up_required',
            message: 'This record is confidential. MFA verification required.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // TODO: Verify MFA token with Supabase auth.mfa.verify
    }

    // Create version snapshot before publishing
    const { data: versionSnapshot, error: versionError } = await supabaseClient
      .from('after_action_versions')
      .insert({
        after_action_id: afterActionId,
        version_number: 1,
        content: current,
        change_summary: 'Initial publication',
        changed_by: user.id,
      })
      .select()
      .single();

    if (versionError) {
      console.error('Failed to create version snapshot:', versionError);
    }

    // Publish the after-action
    const { data: afterAction, error } = await supabaseClient
      .from('after_action_records')
      .update({
        publication_status: 'published',
        published_by: user.id,
        published_at: new Date().toISOString(),
      })
      .eq('id', afterActionId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(afterAction), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('After-actions-publish error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
