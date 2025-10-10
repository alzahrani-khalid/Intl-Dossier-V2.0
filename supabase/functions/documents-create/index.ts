// T044: POST /documents Edge Function (Document upload)
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

    const body = await req.json();
    const {
      owner_type,
      owner_id,
      document_type,
      title_en,
      title_ar,
      storage_path,
      file_size,
      mime_type,
      metadata,
    } = body;

    // Validate required fields
    if (!owner_type || !owner_id || !document_type || !storage_path) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: owner_type, owner_id, document_type, storage_path',
        }),
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

    // Create document record
    const { data: document, error: insertError } = await supabaseClient
      .from('documents')
      .insert({
        owner_type,
        owner_id,
        document_type,
        title_en,
        title_ar,
        storage_path,
        file_size,
        mime_type,
        metadata,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a permission error
      if (insertError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to upload documents for this entity' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify(document),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in documents-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
