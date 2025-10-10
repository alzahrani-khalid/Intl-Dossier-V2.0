// T039: DELETE /dossiers/{parentId}/relationships/{childId} Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const parentId = url.searchParams.get('parentId');
    const childId = url.searchParams.get('childId');
    const relationshipType = url.searchParams.get('relationshipType');

    if (!parentId || !childId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: parentId, childId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build delete query
    let query = supabaseClient
      .from('dossier_relationships')
      .delete()
      .eq('parent_dossier_id', parentId)
      .eq('child_dossier_id', childId);

    // Add relationship_type filter if provided
    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      // Check if it's a permission error
      if (deleteError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not own this dossier' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ message: 'Relationship deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dossiers-relationships-delete:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
