import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Aligned to the current `mous` schema (dossier-linked, multi-tenant):
//   title / title_ar, type (mou_type), mou_category, lifecycle_state (mou_state),
//   signatory_1_dossier_id / signatory_2_dossier_id, country_id, organization_id (tenant),
//   tenant_id, created_by / last_modified_by, dates (jsonb), effective_date / expiry_date.
// organization_id + tenant_id are resolved from the caller's profile (tenant); the RLS
// policy mous_org_isolation_insert enforces organization_id == caller's tenant org.

interface MoURequest {
  reference_number?: string;
  title: string;
  title_ar: string;
  type: 'bilateral' | 'multilateral' | 'framework' | 'technical';
  mou_category: 'data_exchange' | 'capacity_building' | 'strategic' | 'technical';
  lifecycle_state?: 'draft' | 'negotiation' | 'pending_approval' | 'signed' | 'active' | 'suspended' | 'expired' | 'terminated';
  description?: string;
  country_id?: string | null;
  signatory_1_dossier_id?: string | null;
  signatory_2_dossier_id?: string | null;
  effective_date?: string | null;
  expiry_date?: string | null;
  dates?: Record<string, unknown>;
  parties?: unknown;
}

// Valid mou_state transitions.
const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  draft: ['negotiation', 'pending_approval'],
  negotiation: ['pending_approval', 'signed', 'draft'],
  pending_approval: ['signed', 'negotiation'],
  signed: ['active'],
  active: ['suspended', 'expired', 'terminated'],
  suspended: ['active', 'terminated'],
  expired: ['terminated'],
  terminated: [],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1] !== 'mous' ? pathParts[pathParts.length - 1] : null;
    const isTransition = pathParts.includes('transition');

    switch (req.method) {
      case 'GET': {
        if (id) {
          const { data, error } = await supabaseClient.from('mous').select('*').eq('id', id).single();
          if (error) throw error;
          if (!data) return json({ error: 'MoU not found' }, 404);
          return json(data);
        }
        const sp = url.searchParams;
        const search = sp.get('search');
        const lifecycleState = sp.get('lifecycle_state');
        const countryId = sp.get('country_id');
        const expiringSoon = sp.get('expiring_soon') === 'true';
        const page = parseInt(sp.get('page') || '1');
        const limit = Math.min(parseInt(sp.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;

        let query = supabaseClient.from('mous').select('*', { count: 'exact' });
        if (search) query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,reference_number.ilike.%${search}%`);
        if (lifecycleState) query = query.eq('lifecycle_state', lifecycleState);
        if (countryId) query = query.eq('country_id', countryId);
        if (expiringSoon) {
          const in30 = new Date();
          in30.setDate(in30.getDate() + 30);
          query = query.lte('expiry_date', in30.toISOString().slice(0, 10)).gte('expiry_date', new Date().toISOString().slice(0, 10));
        }
        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        return json({ data, pagination: { page, limit, total: count, totalPages: Math.ceil((count || 0) / limit) } });
      }

      case 'POST': {
        // State transition: POST /mous/:id/transition { target_state }
        if (isTransition && id) {
          const { target_state } = await req.json();
          const { data: current, error: fetchError } = await supabaseClient
            .from('mous').select('lifecycle_state').eq('id', id).single();
          if (fetchError || !current) return json({ error: 'MoU not found' }, 404);

          const allowed = LIFECYCLE_TRANSITIONS[current.lifecycle_state] || [];
          if (!allowed.includes(target_state)) {
            return json({ error: `Invalid transition from ${current.lifecycle_state} to ${target_state}`, allowed_transitions: allowed }, 400);
          }

          const update: Record<string, unknown> = { lifecycle_state: target_state, updated_at: new Date().toISOString() };
          if (target_state === 'active' && current.lifecycle_state === 'signed') {
            update.effective_date = new Date().toISOString().slice(0, 10);
          }
          const { data, error } = await supabaseClient.from('mous').update(update).eq('id', id).select().single();
          if (error) throw error;
          return json({ message: `MoU transitioned from ${current.lifecycle_state} to ${target_state}`, data });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (!user) return json({ error: 'Invalid user session' }, 401);

        // Resolve the caller's tenant org (RLS requires organization_id == this).
        const { data: profile } = await supabaseClient
          .from('profiles').select('organization_id').eq('user_id', user.id).single();
        const orgId = profile?.organization_id;
        if (!orgId) return json({ error: 'Caller has no organization on profile; cannot create MoU' }, 400);

        const body: MoURequest = await req.json();
        if (!body.title || !body.title_ar || !body.type || !body.mou_category) {
          return json({ error: 'Missing required fields: title, title_ar, type, mou_category' }, 400);
        }
        if (body.signatory_1_dossier_id && body.signatory_2_dossier_id &&
            body.signatory_1_dossier_id === body.signatory_2_dossier_id) {
          return json({ error: 'Signatory dossiers must be different' }, 400);
        }
        if (body.effective_date && body.expiry_date && new Date(body.expiry_date) <= new Date(body.effective_date)) {
          return json({ error: 'Expiry date must be after effective date' }, 400);
        }

        let referenceNumber = body.reference_number;
        if (!referenceNumber) {
          const year = new Date().getFullYear();
          const { count } = await supabaseClient
            .from('mous').select('*', { count: 'exact', head: true }).like('reference_number', `MOU-${year}-%`);
          referenceNumber = `MOU-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
        }

        const mouData = {
          reference_number: referenceNumber,
          title: body.title,
          title_ar: body.title_ar,
          type: body.type,
          mou_category: body.mou_category,
          lifecycle_state: body.lifecycle_state || 'draft',
          description: body.description ?? null,
          organization_id: orgId,
          tenant_id: orgId,
          created_by: user.id,
          last_modified_by: user.id,
          country_id: body.country_id ?? null,
          signatory_1_dossier_id: body.signatory_1_dossier_id ?? null,
          signatory_2_dossier_id: body.signatory_2_dossier_id ?? null,
          effective_date: body.effective_date ?? null,
          expiry_date: body.expiry_date ?? null,
          dates: body.dates ?? {},
          ...(body.parties !== undefined ? { parties: body.parties } : {}),
        };

        const { data, error } = await supabaseClient.from('mous').insert(mouData).select().single();
        if (error) {
          if (error.code === '23505') return json({ error: 'MoU with this reference number already exists' }, 409);
          throw error;
        }
        return json(data, 201);
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) return json({ error: 'MoU ID required' }, 400);
        const body: Partial<MoURequest> = await req.json();
        if (body.signatory_1_dossier_id && body.signatory_2_dossier_id &&
            body.signatory_1_dossier_id === body.signatory_2_dossier_id) {
          return json({ error: 'Signatory dossiers must be different' }, 400);
        }
        if (body.effective_date && body.expiry_date && new Date(body.expiry_date) <= new Date(body.effective_date)) {
          return json({ error: 'Expiry date must be after effective date' }, 400);
        }
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        const update = { ...body, ...(user ? { last_modified_by: user.id } : {}) };
        const { data, error } = await supabaseClient.from('mous').update(update).eq('id', id).select().single();
        if (error) {
          if (error.code === '23505') return json({ error: 'MoU with this reference number already exists' }, 409);
          throw error;
        }
        if (!data) return json({ error: 'MoU not found' }, 404);
        return json(data);
      }

      case 'DELETE': {
        if (!id) return json({ error: 'MoU ID required' }, 400);
        const { data: mou } = await supabaseClient.from('mous').select('lifecycle_state').eq('id', id).single();
        if (mou && ['active', 'signed'].includes(mou.lifecycle_state)) {
          return json({ error: 'Cannot delete active or signed MoUs' }, 400);
        }
        const { error } = await supabaseClient.from('mous').delete().eq('id', id);
        if (error) throw error;
        return json({ message: 'MoU deleted successfully' });
      }

      default:
        return json({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Error in mous function:', error);
    return json({ error: (error as Error).message || 'Internal server error' }, 500);
  }
});
