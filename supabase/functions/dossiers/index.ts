import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { COLUMNS } from '../_shared/query-columns.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DossierRequest {
  action: 'create' | 'get' | 'update' | 'delete' | 'list';
  type?: 'country' | 'organization' | 'forum' | 'engagement' | 'theme' | 'working_group' | 'person';
  id?: string;
  data?: Record<string, unknown>;
  filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Handle RESTful GET request (e.g., /dossiers/{id})
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id || id === 'dossiers') {
        return new Response(JSON.stringify({ error: 'Dossier ID is required for GET requests' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get dossier with type check
      const { data: dossier, error: dossierError } = await supabaseClient
        .from('dossiers')
        .select(COLUMNS.DOSSIERS.DETAIL)
        .eq('id', id)
        .single();

      if (dossierError) {
        throw dossierError;
      }

      // Get extension data based on type
      const extensionTableMap: Record<string, string> = {
        country: 'countries',
        organization: 'organizations',
        forum: 'forums',
        engagement: 'engagements',
        theme: 'themes',
        working_group: 'working_groups',
        person: 'persons',
      };

      const tableName = extensionTableMap[dossier.type];
      let result;
      if (tableName) {
        const { data: extensionData, error: extensionError } = await supabaseClient
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (extensionError) {
          throw extensionError;
        }

        result = { ...dossier, extensionData };
      } else {
        result = dossier;
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Parse request body for POST requests
    const { action, type, id, data, filters }: DossierRequest = await req.json();

    // Validate action
    const validActions = ['create', 'get', 'update', 'delete', 'list'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let result;

    switch (action) {
      case 'create': {
        if (!type || !data) {
          return new Response(
            JSON.stringify({ error: 'Type and data are required for create action' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Validate type
        const validTypes = [
          'country',
          'organization',
          'forum',
          'engagement',
          'theme',
          'working_group',
          'person',
        ];
        if (!validTypes.includes(type)) {
          return new Response(
            JSON.stringify({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Create base dossier
        const { data: dossier, error: dossierError } = await supabaseClient
          .from('dossiers')
          .insert({
            type,
            name_en: data.name_en,
            name_ar: data.name_ar,
            description_en: data.description_en,
            description_ar: data.description_ar,
            status: data.status || 'active',
            sensitivity_level: data.sensitivity_level || 1,
            tags: data.tags || [],
            metadata: data.metadata || {},
          })
          .select()
          .single();

        if (dossierError) {
          throw dossierError;
        }

        // Create extension data based on type
        const extensionTableMap: Record<string, string> = {
          country: 'countries',
          organization: 'organizations',
          forum: 'forums',
          engagement: 'engagements',
          theme: 'themes',
          working_group: 'working_groups',
          person: 'persons',
        };

        const tableName = extensionTableMap[type];
        if (tableName && data.extensionData) {
          const { error: extensionError } = await supabaseClient.from(tableName).insert({
            id: dossier.id,
            ...data.extensionData,
          });

          if (extensionError) {
            // Rollback: delete dossier if extension insert fails
            await supabaseClient.from('dossiers').delete().eq('id', dossier.id);
            throw extensionError;
          }
        }

        // Fetch complete dossier with extension
        const { data: completeDossier, error: fetchError } = await supabaseClient
          .from('dossiers')
          .select(`*, ${tableName}(*)`)
          .eq('id', dossier.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        result = completeDossier;
        break;
      }

      case 'get': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required for get action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get dossier with type check
        const { data: dossier, error: dossierError } = await supabaseClient
          .from('dossiers')
          .select(COLUMNS.DOSSIERS.DETAIL)
          .eq('id', id)
          .single();

        if (dossierError) {
          throw dossierError;
        }

        // Get extension data based on type
        const extensionTableMap: Record<string, string> = {
          country: 'countries',
          organization: 'organizations',
          forum: 'forums',
          engagement: 'engagements',
          theme: 'themes',
          working_group: 'working_groups',
          person: 'persons',
        };

        const tableName = extensionTableMap[dossier.type];
        if (tableName) {
          const { data: extensionData, error: extensionError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();

          if (extensionError) {
            throw extensionError;
          }

          result = { ...dossier, extensionData };
        } else {
          result = dossier;
        }
        break;
      }

      case 'update': {
        if (!id || !data) {
          return new Response(
            JSON.stringify({ error: 'ID and data are required for update action' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get current dossier type for validation
        const { data: currentDossier, error: typeCheckError } = await supabaseClient
          .from('dossiers')
          .select('type')
          .eq('id', id)
          .single();

        if (typeCheckError) {
          throw typeCheckError;
        }

        // Prevent type changes
        if (data.type && data.type !== currentDossier.type) {
          return new Response(
            JSON.stringify({
              error: 'Type mismatch: Cannot change dossier type after creation',
              currentType: currentDossier.type,
              attemptedType: data.type,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Extract extension data
        const { extensionData, type: _, ...baseFields } = data;

        // Update base dossier
        if (Object.keys(baseFields).length > 0) {
          const { error: updateError } = await supabaseClient
            .from('dossiers')
            .update(baseFields)
            .eq('id', id);

          if (updateError) {
            throw updateError;
          }
        }

        // Update extension data if provided
        if (extensionData) {
          const extensionTableMap: Record<string, string> = {
            country: 'countries',
            organization: 'organizations',
            forum: 'forums',
            engagement: 'engagements',
            theme: 'themes',
            working_group: 'working_groups',
            person: 'persons',
          };

          const tableName = extensionTableMap[currentDossier.type];
          if (tableName) {
            const { error: extensionUpdateError } = await supabaseClient
              .from(tableName)
              .update(extensionData)
              .eq('id', id);

            if (extensionUpdateError) {
              throw extensionUpdateError;
            }
          }
        }

        // Fetch updated dossier
        const { data: updatedDossier, error: fetchError } = await supabaseClient
          .from('dossiers')
          .select(COLUMNS.DOSSIERS.DETAIL)
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Get extension data
        const extensionTableMap: Record<string, string> = {
          country: 'countries',
          organization: 'organizations',
          forum: 'forums',
          engagement: 'engagements',
          theme: 'themes',
          working_group: 'working_groups',
          person: 'persons',
        };

        const tableName = extensionTableMap[updatedDossier.type];
        if (tableName) {
          const { data: finalExtensionData } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();

          result = { ...updatedDossier, extensionData: finalExtensionData };
        } else {
          result = updatedDossier;
        }
        break;
      }

      case 'delete': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required for delete action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // CASCADE will automatically delete extension and relationships
        const { error: deleteError } = await supabaseClient.from('dossiers').delete().eq('id', id);

        if (deleteError) {
          throw deleteError;
        }

        result = { success: true, id };
        break;
      }

      case 'list': {
        let query = supabaseClient
          .from('dossiers')
          .select(COLUMNS.DOSSIERS.LIST, { count: 'exact' });

        // Apply filters
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        // Apply pagination
        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data: dossiers, error: listError, count } = await query;

        if (listError) {
          throw listError;
        }

        // Fetch extension data for each dossier (in parallel)
        const dossiersWithExtension = await Promise.all(
          (dossiers || []).map(async (dossier) => {
            const extensionTableMap: Record<string, string> = {
              country: 'countries',
              organization: 'organizations',
              forum: 'forums',
              engagement: 'engagements',
              theme: 'themes',
              working_group: 'working_groups',
              person: 'persons',
            };

            const tableName = extensionTableMap[dossier.type];
            if (tableName) {
              const { data: extensionData } = await supabaseClient
                .from(tableName)
                .select('*')
                .eq('id', dossier.id)
                .single();

              return { ...dossier, extensionData };
            }
            return dossier;
          })
        );

        result = {
          data: dossiersWithExtension,
          count,
          limit,
          offset,
        };
        break;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing dossier request:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
