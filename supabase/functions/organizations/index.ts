import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface OrganizationRequest {
  code: string;
  name_en: string;
  name_ar: string;
  type: 'government' | 'ngo' | 'private' | 'international' | 'academic';
  country_id: string;
  parent_organization_id?: string;
  website?: string;
  email?: string;
  phone?: string;
  address_en?: string;
  address_ar?: string;
  logo_url?: string;
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
  established_date?: string;
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
    const id = pathParts[pathParts.length - 1] !== 'organizations' ? pathParts[pathParts.length - 1] : null;
    const isHierarchy = pathParts.includes('hierarchy');
    const isChildren = pathParts.includes('children');

    switch (req.method) {
      case 'GET': {
        if (id && isHierarchy) {
          const buildHierarchy = async (orgId: string, depth: number = 0, maxDepth: number = 5): Promise<any> => {
            if (depth >= maxDepth) return null;

            const { data: org, error: orgError } = await supabaseClient
              .from('organizations')
              .select('*, country:countries(*)')
              .eq('id', orgId)
              .single();

            if (orgError || !org) return null;

            const { data: children, error: childError } = await supabaseClient
              .from('organizations')
              .select('id')
              .eq('parent_organization_id', orgId);

            if (!childError && children && children.length > 0) {
              const childPromises = children.map(child => 
                buildHierarchy(child.id, depth + 1, maxDepth)
              );
              const childHierarchies = await Promise.all(childPromises);
              org.children = childHierarchies.filter(child => child !== null);
            } else {
              org.children = [];
            }

            return org;
          };

          const hierarchy = await buildHierarchy(id);
          
          if (!hierarchy) {
            return new Response(
              JSON.stringify({ error: 'Organization not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(hierarchy),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (id && isChildren) {
          const { data, error } = await supabaseClient
            .from('organizations')
            .select('*, country:countries(*)')
            .eq('parent_organization_id', id);

          if (error) throw error;

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (id) {
          const { data, error } = await supabaseClient
            .from('organizations')
            .select('*, country:countries(*), parent:parent_organization_id(name_en, name_ar)')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Organization not found' }),
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
          const type = searchParams.get('type');
          const countryId = searchParams.get('country_id');
          const status = searchParams.get('status');
          const parentOnly = searchParams.get('parent_only') === 'true';
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('organizations')
            .select('*, country:countries(name_en, name_ar)', { count: 'exact' });

          if (search) {
            query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%,code.ilike.%${search}%`);
          }
          if (type) {
            query = query.eq('type', type);
          }
          if (countryId) {
            query = query.eq('country_id', countryId);
          }
          if (status) {
            query = query.eq('status', status);
          }
          if (parentOnly) {
            query = query.is('parent_organization_id', null);
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
        const body: OrganizationRequest = await req.json();

        if (!body.code || !body.name_en || !body.name_ar || !body.type || !body.country_id) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.code.length < 3 || body.code.length > 20) {
          return new Response(
            JSON.stringify({ error: 'Code must be 3-20 characters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.parent_organization_id === body.code) {
          return new Response(
            JSON.stringify({ error: 'Organization cannot be its own parent' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const organizationData = {
          ...body,
          code: body.code.toUpperCase(),
          status: body.status || 'pending'
        };

        const { data, error } = await supabaseClient
          .from('organizations')
          .insert(organizationData)
          .select('*, country:countries(*)')
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Organization with this code already exists' }),
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
            JSON.stringify({ error: 'Organization ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<OrganizationRequest> = await req.json();

        if (body.code) body.code = body.code.toUpperCase();

        if (body.parent_organization_id === id) {
          return new Response(
            JSON.stringify({ error: 'Organization cannot be its own parent' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.parent_organization_id) {
          const checkCircular = async (parentId: string, targetId: string): Promise<boolean> => {
            if (parentId === targetId) return true;
            
            const { data } = await supabaseClient
              .from('organizations')
              .select('parent_organization_id')
              .eq('id', parentId)
              .single();
            
            if (!data || !data.parent_organization_id) return false;
            return checkCircular(data.parent_organization_id, targetId);
          };

          const hasCircular = await checkCircular(body.parent_organization_id, id);
          if (hasCircular) {
            return new Response(
              JSON.stringify({ error: 'Circular hierarchy detected' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data, error } = await supabaseClient
          .from('organizations')
          .update(body)
          .eq('id', id)
          .select('*, country:countries(*)')
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Organization with this code already exists' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw error;
        }

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Organization not found' }),
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
            JSON.stringify({ error: 'Organization ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: children } = await supabaseClient
          .from('organizations')
          .select('id')
          .eq('parent_organization_id', id);

        if (children && children.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete organization with child organizations' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('organizations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Organization deleted successfully' }),
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
    console.error('Error in organizations function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});