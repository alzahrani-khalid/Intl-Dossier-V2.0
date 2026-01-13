/**
 * Persons Edge Function
 * Feature: persons-entity-management
 *
 * Comprehensive API for managing person dossiers with:
 * - GET /persons - List persons with filters
 * - GET /persons/:id - Get single person with full profile
 * - GET /persons/:id/network - Get relationship network
 * - POST /persons - Create new person
 * - PATCH /persons/:id - Update person
 * - POST /persons/:id/roles - Add role
 * - POST /persons/:id/affiliations - Add affiliation
 * - POST /persons/:id/relationships - Add relationship
 * - DELETE /persons/:id - Archive person
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface PersonCreateRequest {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  title_en?: string;
  title_ar?: string;
  organization_id?: string;
  nationality_country_id?: string;
  email?: string;
  phone?: string;
  biography_en?: string;
  biography_ar?: string;
  photo_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  expertise_areas?: string[];
  languages?: string[];
  importance_level?: number;
  sensitivity_level?: number;
  tags?: string[];
}

interface PersonUpdateRequest {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  title_en?: string;
  title_ar?: string;
  organization_id?: string;
  nationality_country_id?: string;
  email?: string;
  phone?: string;
  biography_en?: string;
  biography_ar?: string;
  photo_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  expertise_areas?: string[];
  languages?: string[];
  importance_level?: number;
  notes?: string;
  tags?: string[];
  status?: 'active' | 'inactive' | 'archived';
}

interface RoleCreateRequest {
  organization_id?: string;
  organization_name_en?: string;
  organization_name_ar?: string;
  role_title_en: string;
  role_title_ar?: string;
  department_en?: string;
  department_ar?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description_en?: string;
  description_ar?: string;
}

interface AffiliationCreateRequest {
  organization_id?: string;
  organization_name_en?: string;
  organization_name_ar?: string;
  affiliation_type: string;
  position_title_en?: string;
  position_title_ar?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  notes?: string;
}

interface RelationshipCreateRequest {
  to_person_id: string;
  relationship_type: string;
  strength?: number;
  notes?: string;
  start_date?: string;
  end_date?: string;
}

// Helper to create error response
function errorResponse(
  code: string,
  message_en: string,
  message_ar: string,
  status: number,
  details?: unknown
) {
  return new Response(
    JSON.stringify({
      error: { code, message_en, message_ar, details },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Helper to get authenticated user
async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid user session' };
  }

  return { user, error: null };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    // Authenticate
    const { user, error: authError } = await getAuthUser(req, supabase);
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', authError || 'Unauthorized', 'غير مصرح', 401);
    }

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionName = pathParts[0]; // "persons"
    const personId = pathParts[1];
    const subResource = pathParts[2]; // "roles", "affiliations", "relationships", "network"

    // Route handling
    switch (req.method) {
      case 'GET': {
        if (personId && subResource === 'network') {
          // GET /persons/:id/network - Get relationship network
          const depth = parseInt(url.searchParams.get('depth') || '1');
          const { data, error } = await supabase.rpc('get_person_network', {
            p_person_id: personId,
            p_depth: Math.min(depth, 3), // Max depth 3 for performance
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (personId) {
          // GET /persons/:id - Get single person with full profile
          const { data, error } = await supabase.rpc('get_person_full', {
            p_person_id: personId,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          if (!data?.person) {
            return errorResponse('NOT_FOUND', 'Person not found', 'الشخص غير موجود', 404);
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // GET /persons - List persons with filters
        const search = url.searchParams.get('search') || undefined;
        const organizationId = url.searchParams.get('organization_id') || undefined;
        const nationalityId = url.searchParams.get('nationality_id') || undefined;
        const importanceLevel = url.searchParams.get('importance_level')
          ? parseInt(url.searchParams.get('importance_level')!)
          : undefined;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error } = await supabase.rpc('search_persons_advanced', {
          p_search_term: search,
          p_organization_id: organizationId,
          p_nationality_id: nationalityId,
          p_importance_level: importanceLevel,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        // Get total count
        const { count } = await supabase
          .from('dossiers')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'person')
          .neq('status', 'archived');

        return new Response(
          JSON.stringify({
            data: data || [],
            pagination: {
              total: count || 0,
              limit,
              offset,
              has_more: (data?.length || 0) === limit,
            },
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60, s-maxage=300',
            },
          }
        );
      }

      case 'POST': {
        if (personId && subResource === 'roles') {
          // POST /persons/:id/roles - Add role
          const body: RoleCreateRequest = await req.json();

          if (!body.role_title_en) {
            return errorResponse(
              'VALIDATION_ERROR',
              'role_title_en is required',
              'عنوان الدور مطلوب',
              400
            );
          }

          const { data, error } = await supabase
            .from('person_roles')
            .insert({
              person_id: personId,
              organization_id: body.organization_id,
              organization_name_en: body.organization_name_en,
              organization_name_ar: body.organization_name_ar,
              role_title_en: body.role_title_en,
              role_title_ar: body.role_title_ar,
              department_en: body.department_en,
              department_ar: body.department_ar,
              start_date: body.start_date,
              end_date: body.end_date,
              is_current: body.is_current || false,
              description_en: body.description_en,
              description_ar: body.description_ar,
              created_by: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإضافة', 500, error);
          }

          return new Response(JSON.stringify(data), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (personId && subResource === 'affiliations') {
          // POST /persons/:id/affiliations - Add affiliation
          const body: AffiliationCreateRequest = await req.json();

          if (!body.affiliation_type) {
            return errorResponse(
              'VALIDATION_ERROR',
              'affiliation_type is required',
              'نوع الانتماء مطلوب',
              400
            );
          }

          const { data, error } = await supabase
            .from('person_affiliations')
            .insert({
              person_id: personId,
              organization_id: body.organization_id,
              organization_name_en: body.organization_name_en,
              organization_name_ar: body.organization_name_ar,
              affiliation_type: body.affiliation_type,
              position_title_en: body.position_title_en,
              position_title_ar: body.position_title_ar,
              start_date: body.start_date,
              end_date: body.end_date,
              is_active: body.is_active ?? true,
              notes: body.notes,
              created_by: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإضافة', 500, error);
          }

          return new Response(JSON.stringify(data), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (personId && subResource === 'relationships') {
          // POST /persons/:id/relationships - Add relationship
          const body: RelationshipCreateRequest = await req.json();

          if (!body.to_person_id || !body.relationship_type) {
            return errorResponse(
              'VALIDATION_ERROR',
              'to_person_id and relationship_type are required',
              'معرف الشخص ونوع العلاقة مطلوبان',
              400
            );
          }

          const { data, error } = await supabase
            .from('person_relationships')
            .insert({
              from_person_id: personId,
              to_person_id: body.to_person_id,
              relationship_type: body.relationship_type,
              strength: body.strength || 3,
              notes: body.notes,
              start_date: body.start_date,
              end_date: body.end_date,
              created_by: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإضافة', 500, error);
          }

          return new Response(JSON.stringify(data), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // POST /persons - Create new person
        const body: PersonCreateRequest = await req.json();

        // Validation
        if (!body.name_en || body.name_en.trim().length === 0) {
          return errorResponse(
            'VALIDATION_ERROR',
            'name_en is required',
            'الاسم بالإنجليزية مطلوب',
            400
          );
        }
        if (!body.name_ar || body.name_ar.trim().length === 0) {
          return errorResponse(
            'VALIDATION_ERROR',
            'name_ar is required',
            'الاسم بالعربية مطلوب',
            400
          );
        }

        // Start transaction - create dossier first
        const { data: dossier, error: dossierError } = await supabase
          .from('dossiers')
          .insert({
            type: 'person',
            name_en: body.name_en.trim(),
            name_ar: body.name_ar.trim(),
            description_en: body.description_en,
            description_ar: body.description_ar,
            status: 'active',
            sensitivity_level: body.sensitivity_level || 1,
            tags: body.tags || [],
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (dossierError) {
          return errorResponse(
            'INSERT_ERROR',
            dossierError.message,
            'خطأ في الإنشاء',
            500,
            dossierError
          );
        }

        // Create person extension
        const { data: person, error: personError } = await supabase
          .from('persons')
          .insert({
            id: dossier.id,
            title_en: body.title_en,
            title_ar: body.title_ar,
            organization_id: body.organization_id,
            nationality_country_id: body.nationality_country_id,
            email: body.email,
            phone: body.phone,
            biography_en: body.biography_en,
            biography_ar: body.biography_ar,
            photo_url: body.photo_url,
            linkedin_url: body.linkedin_url,
            twitter_url: body.twitter_url,
            expertise_areas: body.expertise_areas || [],
            languages: body.languages || [],
            importance_level: body.importance_level || 1,
          })
          .select()
          .single();

        if (personError) {
          // Rollback - delete dossier
          await supabase.from('dossiers').delete().eq('id', dossier.id);
          return errorResponse(
            'INSERT_ERROR',
            personError.message,
            'خطأ في الإنشاء',
            500,
            personError
          );
        }

        // Auto-assign creator as owner
        await supabase.from('dossier_owners').insert({
          dossier_id: dossier.id,
          user_id: user.id,
          role_type: 'owner',
        });

        return new Response(
          JSON.stringify({
            ...dossier,
            extension: person,
          }),
          {
            status: 201,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              Location: `/persons/${dossier.id}`,
            },
          }
        );
      }

      case 'PATCH': {
        if (!personId) {
          return errorResponse('BAD_REQUEST', 'Person ID required', 'معرف الشخص مطلوب', 400);
        }

        const body: PersonUpdateRequest = await req.json();

        // Update dossier fields if present
        const dossierUpdates: Record<string, unknown> = {};
        if (body.name_en !== undefined) dossierUpdates.name_en = body.name_en;
        if (body.name_ar !== undefined) dossierUpdates.name_ar = body.name_ar;
        if (body.description_en !== undefined) dossierUpdates.description_en = body.description_en;
        if (body.description_ar !== undefined) dossierUpdates.description_ar = body.description_ar;
        if (body.tags !== undefined) dossierUpdates.tags = body.tags;
        if (body.status !== undefined) dossierUpdates.status = body.status;
        dossierUpdates.updated_by = user.id;
        dossierUpdates.updated_at = new Date().toISOString();

        if (Object.keys(dossierUpdates).length > 2) {
          const { error: dossierError } = await supabase
            .from('dossiers')
            .update(dossierUpdates)
            .eq('id', personId);

          if (dossierError) {
            return errorResponse(
              'UPDATE_ERROR',
              dossierError.message,
              'خطأ في التحديث',
              500,
              dossierError
            );
          }
        }

        // Update person extension fields
        const personUpdates: Record<string, unknown> = {};
        if (body.title_en !== undefined) personUpdates.title_en = body.title_en;
        if (body.title_ar !== undefined) personUpdates.title_ar = body.title_ar;
        if (body.organization_id !== undefined)
          personUpdates.organization_id = body.organization_id;
        if (body.nationality_country_id !== undefined)
          personUpdates.nationality_country_id = body.nationality_country_id;
        if (body.email !== undefined) personUpdates.email = body.email;
        if (body.phone !== undefined) personUpdates.phone = body.phone;
        if (body.biography_en !== undefined) personUpdates.biography_en = body.biography_en;
        if (body.biography_ar !== undefined) personUpdates.biography_ar = body.biography_ar;
        if (body.photo_url !== undefined) personUpdates.photo_url = body.photo_url;
        if (body.linkedin_url !== undefined) personUpdates.linkedin_url = body.linkedin_url;
        if (body.twitter_url !== undefined) personUpdates.twitter_url = body.twitter_url;
        if (body.expertise_areas !== undefined)
          personUpdates.expertise_areas = body.expertise_areas;
        if (body.languages !== undefined) personUpdates.languages = body.languages;
        if (body.importance_level !== undefined)
          personUpdates.importance_level = body.importance_level;
        if (body.notes !== undefined) personUpdates.notes = body.notes;

        if (Object.keys(personUpdates).length > 0) {
          const { error: personError } = await supabase
            .from('persons')
            .update(personUpdates)
            .eq('id', personId);

          if (personError) {
            return errorResponse(
              'UPDATE_ERROR',
              personError.message,
              'خطأ في التحديث',
              500,
              personError
            );
          }
        }

        // Fetch updated person
        const { data } = await supabase.rpc('get_person_full', {
          p_person_id: personId,
        });

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        if (!personId) {
          return errorResponse('BAD_REQUEST', 'Person ID required', 'معرف الشخص مطلوب', 400);
        }

        // Check if deleting sub-resource
        if (subResource === 'roles') {
          const roleId = url.searchParams.get('role_id');
          if (!roleId) {
            return errorResponse('BAD_REQUEST', 'Role ID required', 'معرف الدور مطلوب', 400);
          }
          const { error } = await supabase
            .from('person_roles')
            .delete()
            .eq('id', roleId)
            .eq('person_id', personId);

          if (error) {
            return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500, error);
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (subResource === 'affiliations') {
          const affiliationId = url.searchParams.get('affiliation_id');
          if (!affiliationId) {
            return errorResponse(
              'BAD_REQUEST',
              'Affiliation ID required',
              'معرف الانتماء مطلوب',
              400
            );
          }
          const { error } = await supabase
            .from('person_affiliations')
            .delete()
            .eq('id', affiliationId)
            .eq('person_id', personId);

          if (error) {
            return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500, error);
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (subResource === 'relationships') {
          const relationshipId = url.searchParams.get('relationship_id');
          if (!relationshipId) {
            return errorResponse(
              'BAD_REQUEST',
              'Relationship ID required',
              'معرف العلاقة مطلوب',
              400
            );
          }
          const { error } = await supabase
            .from('person_relationships')
            .delete()
            .eq('id', relationshipId);

          if (error) {
            return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500, error);
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Archive person (soft delete)
        const { error } = await supabase
          .from('dossiers')
          .update({
            status: 'archived',
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', personId);

        if (error) {
          return errorResponse('DELETE_ERROR', error.message, 'خطأ في الأرشفة', 500, error);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return errorResponse(
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          'الطريقة غير مسموح بها',
          405
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500,
      { correlation_id: crypto.randomUUID() }
    );
  }
});
