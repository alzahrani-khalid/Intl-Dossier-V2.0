import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const UpdateAfterActionSchema = z.object({
  attendees: z.array(z.string()).max(100).optional(),
  notes: z.string().optional(),
  is_confidential: z.boolean().optional(),
  version: z.number().int().positive(),
});

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

    if (req.method !== 'PATCH') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const afterActionId = pathParts[pathParts.length - 1];

    const body = await req.json();
    const validationResult = UpdateAfterActionSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { version, ...updateData } = validationResult.data;
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Optimistic locking: update only if version matches
    const { data: afterAction, error } = await supabaseClient
      .from('after_action_records')
      .update({
        ...updateData,
        version: version + 1,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', afterActionId)
      .eq('version', version)
      .select()
      .single();

    if (error || !afterAction) {
      // Check if no rows were updated (version mismatch)
      if (!afterAction) {
        const { data: current } = await supabaseClient
          .from('after_action_records')
          .select('version')
          .eq('id', afterActionId)
          .single();

        return new Response(
          JSON.stringify({
            error: 'Version conflict',
            message: 'The record has been modified by another user',
            current_version: current?.version,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    return new Response(JSON.stringify(afterAction), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('After-actions-update error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
