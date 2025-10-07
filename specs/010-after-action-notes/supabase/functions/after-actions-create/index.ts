import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Validation schema
const CreateAfterActionSchema = z.object({
  engagement_id: z.string().uuid(),
  is_confidential: z.boolean(),
  attendees: z.array(z.string()).max(100).optional(),
  notes: z.string().optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
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
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = CreateAfterActionSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { engagement_id, is_confidential, attendees, notes } = validationResult.data;

    // Get user ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get engagement to extract dossier_id
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagements')
      .select('dossier_id')
      .eq('id', engagement_id)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create after-action record
    const { data: afterAction, error } = await supabaseClient
      .from('after_action_records')
      .insert({
        engagement_id,
        dossier_id: engagement.dossier_id,
        is_confidential,
        attendees: attendees || [],
        notes,
        publication_status: 'draft',
        version: 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (engagement_id already has after-action)
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'Conflict',
            message: 'An after-action record already exists for this engagement',
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for RLS policy violation
      if (error.code === 'PGRST301') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw error;
    }

    return new Response(JSON.stringify(afterAction), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('After-actions-create function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
