import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface CountryRequest {
  iso_code_2: string;
  iso_code_3: string;
  name_en: string;
  name_ar: string;
  region: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  sub_region?: string;
  capital_en?: string;
  capital_ar?: string;
  population?: number;
  area_sq_km?: number;
  flag_url?: string;
  status?: 'active' | 'inactive';
}

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
    const id = pathParts[pathParts.length - 1] !== 'countries' ? pathParts[pathParts.length - 1] : null;

    switch (req.method) {
      case 'GET': {
        if (id) {
          const { data, error } = await supabaseClient
            .from('countries')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Country not found' }),
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
          const region = searchParams.get('region');
          const status = searchParams.get('status');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('countries')
            .select('*', { count: 'exact' });

          if (search) {
            query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`);
          }
          if (region) {
            query = query.eq('region', region);
          }
          if (status) {
            query = query.eq('status', status);
          }

          query = query
            .order('name_en')
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
        const body: CountryRequest = await req.json();

        if (!body.iso_code_2 || !body.iso_code_3 || !body.name_en || !body.name_ar || !body.region) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.iso_code_2.length !== 2 || body.iso_code_3.length !== 3) {
          return new Response(
            JSON.stringify({ error: 'Invalid ISO code length' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const countryData = {
          ...body,
          iso_code_2: body.iso_code_2.toUpperCase(),
          iso_code_3: body.iso_code_3.toUpperCase(),
          status: body.status || 'active'
        };

        const { data, error } = await supabaseClient
          .from('countries')
          .insert(countryData)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Country with this ISO code already exists' }),
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
            JSON.stringify({ error: 'Country ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<CountryRequest> = await req.json();

        if (body.iso_code_2) body.iso_code_2 = body.iso_code_2.toUpperCase();
        if (body.iso_code_3) body.iso_code_3 = body.iso_code_3.toUpperCase();

        const { data, error } = await supabaseClient
          .from('countries')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Country with this ISO code already exists' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw error;
        }

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Country not found' }),
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
            JSON.stringify({ error: 'Country ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('countries')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Country deleted successfully' }),
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
    console.error('Error in countries function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});