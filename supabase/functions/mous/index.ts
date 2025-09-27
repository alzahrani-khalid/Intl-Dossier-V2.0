import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface MoURequest {
  reference_number?: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  workflow_state?: 'draft' | 'internal_review' | 'external_review' | 'negotiation' | 'signed' | 'active' | 'renewed' | 'expired';
  primary_party_id: string;
  secondary_party_id: string;
  document_url?: string;
  document_version?: number;
  signing_date?: string;
  effective_date?: string;
  expiry_date?: string;
  auto_renewal?: boolean;
  renewal_period_months?: number;
  owner_id: string;
}

const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  'draft': ['internal_review'],
  'internal_review': ['external_review', 'draft'],
  'external_review': ['negotiation', 'internal_review'],
  'negotiation': ['signed', 'external_review'],
  'signed': ['active'],
  'active': ['renewed', 'expired'],
  'expired': ['renewed'],
  'renewed': ['active']
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1] !== 'mous' ? pathParts[pathParts.length - 1] : null;
    const isTransition = pathParts.includes('transition');

    switch (req.method) {
      case 'GET': {
        if (id) {
          const { data, error } = await supabaseClient
            .from('mous')
            .select(`
              *,
              primary_party:primary_party_id(name_en, name_ar),
              secondary_party:secondary_party_id(name_en, name_ar),
              owner:owner_id(full_name, email)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'MoU not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const searchParams = url.searchParams;
          const search = searchParams.get('search');
          const workflowState = searchParams.get('workflow_state');
          const primaryPartyId = searchParams.get('primary_party_id');
          const secondaryPartyId = searchParams.get('secondary_party_id');
          const expiringSoon = searchParams.get('expiring_soon') === 'true';
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('mous')
            .select(`
              *,
              primary_party:primary_party_id(name_en, name_ar),
              secondary_party:secondary_party_id(name_en, name_ar),
              owner:owner_id(full_name)
            `, { count: 'exact' });

          if (search) {
            query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%,reference_number.ilike.%${search}%`);
          }
          if (workflowState) {
            query = query.eq('workflow_state', workflowState);
          }
          if (primaryPartyId) {
            query = query.eq('primary_party_id', primaryPartyId);
          }
          if (secondaryPartyId) {
            query = query.eq('secondary_party_id', secondaryPartyId);
          }
          if (expiringSoon) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            query = query.lte('expiry_date', thirtyDaysFromNow.toISOString());
            query = query.gte('expiry_date', new Date().toISOString());
          }

          query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) throw error;

          return new Response(
            JSON.stringify({
              data,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'POST': {
        if (isTransition && id) {
          const { target_state } = await req.json();
          
          const { data: currentMoU, error: fetchError } = await supabaseClient
            .from('mous')
            .select('workflow_state')
            .eq('id', id)
            .single();

          if (fetchError || !currentMoU) {
            return new Response(
              JSON.stringify({ error: 'MoU not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const allowedTransitions = WORKFLOW_TRANSITIONS[currentMoU.workflow_state] || [];
          
          if (!allowedTransitions.includes(target_state)) {
            return new Response(
              JSON.stringify({ 
                error: `Invalid transition from ${currentMoU.workflow_state} to ${target_state}`,
                allowed_transitions: allowedTransitions
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const updateData: any = { 
            workflow_state: target_state,
            updated_at: new Date().toISOString()
          };

          if (target_state === 'active' && currentMoU.workflow_state === 'signed') {
            updateData.effective_date = new Date().toISOString();
          }

          const { data, error } = await supabaseClient
            .from('mous')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({
              message: `MoU transitioned from ${currentMoU.workflow_state} to ${target_state}`,
              data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: MoURequest = await req.json();

        if (!body.title_en || !body.title_ar || !body.primary_party_id || !body.secondary_party_id || !body.owner_id) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.primary_party_id === body.secondary_party_id) {
          return new Response(
            JSON.stringify({ error: 'Primary and secondary parties must be different' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.effective_date && body.expiry_date) {
          if (new Date(body.expiry_date) <= new Date(body.effective_date)) {
            return new Response(
              JSON.stringify({ error: 'Expiry date must be after effective date' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        if (!body.reference_number) {
          const year = new Date().getFullYear();
          const { count } = await supabaseClient
            .from('mous')
            .select('*', { count: 'exact', head: true })
            .like('reference_number', `MOU-${year}-%`);
          
          const nextNumber = String((count || 0) + 1).padStart(4, '0');
          body.reference_number = `MOU-${year}-${nextNumber}`;
        }

        const mouData = {
          ...body,
          workflow_state: body.workflow_state || 'draft',
          document_version: body.document_version || 1
        };

        const { data, error } = await supabaseClient
          .from('mous')
          .insert(mouData)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'MoU with this reference number already exists' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify(data),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'MoU ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<MoURequest> = await req.json();

        if (body.primary_party_id && body.secondary_party_id && 
            body.primary_party_id === body.secondary_party_id) {
          return new Response(
            JSON.stringify({ error: 'Primary and secondary parties must be different' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.effective_date && body.expiry_date) {
          if (new Date(body.expiry_date) <= new Date(body.effective_date)) {
            return new Response(
              JSON.stringify({ error: 'Expiry date must be after effective date' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        if (body.document_url) {
          const { data: current } = await supabaseClient
            .from('mous')
            .select('document_version')
            .eq('id', id)
            .single();
          
          if (current) {
            body.document_version = (current.document_version || 1) + 1;
          }
        }

        const { data, error } = await supabaseClient
          .from('mous')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'MoU with this reference number already exists' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw error;
        }

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'MoU not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'MoU ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: mou } = await supabaseClient
          .from('mous')
          .select('workflow_state')
          .eq('id', id)
          .single();

        if (mou && ['active', 'signed'].includes(mou.workflow_state)) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete active or signed MoUs' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('mous')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'MoU deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in mous function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});