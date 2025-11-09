/**
 * Supabase Edge Function: Get Operation Progress
 * 
 * Fetches the current progress of a running operation
 * 
 * Endpoint: /functions/v1/operation-progress?id=<progress_id>
 * Method: GET
 * Auth: Required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client (using anon key for RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get progress ID from query params
    const url = new URL(req.url);
    const progressId = url.searchParams.get('id');

    if (!progressId) {
      return new Response(
        JSON.stringify({ error: 'Missing progress ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch progress record (RLS will ensure user can only see their own)
    const { data: progress, error } = await supabase
      .from('operation_progress')
      .select('*')
      .eq('id', progressId)
      .single();

    if (error || !progress) {
      return new Response(
        JSON.stringify({ error: 'Progress record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate percentage
    const percentage = progress.total_items > 0
      ? Math.round((progress.processed_items / progress.total_items) * 100)
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        progress: {
          ...progress,
          percentage,
          is_complete: progress.status === 'completed' || progress.status === 'failed',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Operation Progress] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

