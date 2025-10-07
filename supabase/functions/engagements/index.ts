// T036: Supabase Edge Function for engagements (CRUD)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateEngagementRequest {
  dossier_id: string;
  title: string;
  engagement_type: string;
  engagement_date: string;
  location?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const engagementId = pathSegments[pathSegments.length - 1];

    // POST /engagements
    if (req.method === 'POST') {
      const body: CreateEngagementRequest = await req.json();

      // Validate engagement_type
      const validTypes = ['meeting', 'consultation', 'coordination', 'workshop', 'conference', 'site_visit', 'other'];
      if (!validTypes.includes(body.engagement_type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid engagement_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check dossier access
      const { data: dossierAccess } = await supabaseClient
        .from('dossier_owners')
        .select('*')
        .eq('dossier_id', body.dossier_id)
        .eq('user_id', (await supabaseClient.auth.getUser()).data.user?.id)
        .single();

      if (!dossierAccess) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized dossier access' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('engagements')
        .insert({
          ...body,
          created_by: (await supabaseClient.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /engagements/{id}
    if (req.method === 'GET' && engagementId && engagementId !== 'engagements') {
      const { data, error } = await supabaseClient
        .from('engagements')
        .select('*')
        .eq('id', engagementId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Engagement not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /engagements/{id}
    if (req.method === 'PATCH' && engagementId) {
      const body = await req.json();

      const { data, error } = await supabaseClient
        .from('engagements')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', engagementId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /dossiers/{dossierId}/engagements (list)
    if (req.method === 'GET' && url.pathname.includes('/dossiers/')) {
      const dossierId = pathSegments[pathSegments.indexOf('dossiers') + 1];
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const { data, error, count } = await supabaseClient
        .from('engagements')
        .select('*', { count: 'exact' })
        .eq('dossier_id', dossierId)
        .range(offset, offset + limit - 1)
        .order('engagement_date', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, total: count, limit, offset }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});