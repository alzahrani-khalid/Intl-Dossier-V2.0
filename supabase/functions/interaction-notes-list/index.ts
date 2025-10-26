/**
 * Edge Function: List Interaction Notes
 *
 * Lists interaction notes with filtering by contact_id, date range, and type
 *
 * @endpoint GET /functions/v1/interaction-notes-list
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid interaction types
const INTERACTION_TYPES = ['meeting', 'email', 'call', 'conference', 'other'];

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
    const contactId = url.searchParams.get('contact_id');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sort_by') || 'date';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: 'limit must be between 1 and 100' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (offset < 0) {
      return new Response(
        JSON.stringify({ error: 'offset must be non-negative' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (type && !INTERACTION_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Must be one of: ${INTERACTION_TYPES.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['date', 'created_at'].includes(sortBy)) {
      return new Response(
        JSON.stringify({ error: 'sort_by must be either "date" or "created_at"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return new Response(
        JSON.stringify({ error: 'sort_order must be either "asc" or "desc"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Build query
    let query = supabaseClient
      .from('cd_interaction_notes')
      .select('*, cd_contacts!inner(full_name, position, organization_id)')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get total count if needed
    let totalCount = null;
    if (url.searchParams.get('count') === 'true') {
      const countQuery = supabaseClient
        .from('cd_interaction_notes')
        .select('*', { count: 'exact', head: true });

      // Apply same filters for count
      if (contactId) {
        countQuery.eq('contact_id', contactId);
      }
      if (dateFrom) {
        countQuery.gte('date', dateFrom);
      }
      if (dateTo) {
        countQuery.lte('date', dateTo);
      }
      if (type) {
        countQuery.eq('type', type);
      }

      const { count: totalRows } = await countQuery;
      totalCount = totalRows;
    }

    // Prepare response
    const response = {
      data: data || [],
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: totalCount ? (offset + limit) < totalCount : null,
      },
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error listing interaction notes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});