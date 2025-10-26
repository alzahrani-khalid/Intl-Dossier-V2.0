/**
 * Edge Function: List Organizations
 *
 * Lists organizations with filtering and pagination
 *
 * @endpoint GET /functions/v1/organizations-list
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user (JWT validation)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const params = url.searchParams;

    const search = params.get('search') || undefined;
    const type = params.get('type') || undefined;
    const country = params.get('country') || undefined;
    const limit = Math.min(parseInt(params.get('limit') || '50'), 100);
    const offset = parseInt(params.get('offset') || '0');
    const sortBy = params.get('sort_by') || 'created_at';
    const sortOrder = params.get('sort_order') === 'asc' ? 'asc' : 'desc';

    // Build query
    let query = supabaseClient
      .from('cd_organizations')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (country) {
      query = query.eq('country', country);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Return results with count for pagination
    return new Response(
      JSON.stringify({
        data: data || [],
        count: count || 0,
        limit,
        offset
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error listing organizations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});