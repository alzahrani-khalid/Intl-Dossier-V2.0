/**
 * Topics Edge Function
 *
 * Handles CRUD operations for topic dossiers (policy areas, strategic priorities).
 *
 * Endpoints:
 * - GET /topics - List topics with filters (category, parent_id, search, pagination)
 * - GET /topics/:id - Get single topic joined with dossier data
 * - GET /topics/:id/subtopics - Child topics where parent_theme_id = :id
 * - POST /topics - Create (dossier + topics row in transaction)
 * - PATCH /topics/:id - Update topic extension fields
 * - DELETE /topics/:id - Soft delete via dossier status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

interface ErrorResponse {
  code: string;
  message_en: string;
  message_ar: string;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message_en: string, message_ar: string, status: number) {
  const error: ErrorResponse = { code, message_en, message_ar };
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return { user: null, error: 'No token provided' };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  return { user, error: error?.message };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    // Use anon key with user token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Authenticate user
    const { user, error: authError } = await getAuthUser(req, supabase);
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Unauthorized', 'غير مصرح', 401);
    }

    // Parse URL and route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Path structure: /topics, /topics/:id, /topics/:id/subtopics
    const topicId = pathParts[1];
    const subResource = pathParts[2]; // subtopics

    switch (req.method) {
      // ========================================================================
      // GET REQUESTS
      // ========================================================================
      case 'GET': {
        // GET /topics/:id/subtopics
        if (topicId && subResource === 'subtopics') {
          const { data, error } = await supabase
            .from('topics')
            .select(
              `
              *,
              dossier:id (
                id, type, name_en, name_ar, description_en, description_ar,
                abbreviation, status, sensitivity_level, tags, created_at, updated_at
              )
            `
            )
            .eq('parent_theme_id', topicId)
            .order('created_at', { ascending: false });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
          }

          // Flatten dossier data into each topic
          const subtopics = (data || [])
            .filter((t: any) => t.dossier?.status === 'active')
            .map((t: any) => ({
              ...t.dossier,
              extension: {
                theme_category: t.theme_category,
                parent_theme_id: t.parent_theme_id,
              },
            }));

          return jsonResponse({ data: subtopics });
        }

        // GET /topics/:id - Get single topic with dossier data
        if (topicId) {
          const { data: topic, error: topicError } = await supabase
            .from('topics')
            .select(
              `
              *,
              dossier:id (
                id, type, name_en, name_ar, description_en, description_ar,
                abbreviation, status, sensitivity_level, tags, created_at, updated_at
              )
            `
            )
            .eq('id', topicId)
            .single();

          if (topicError) {
            return errorResponse('QUERY_ERROR', topicError.message, 'خطأ في الاستعلام', 500);
          }
          if (!topic) {
            return errorResponse('NOT_FOUND', 'Topic not found', 'الموضوع غير موجود', 404);
          }

          const result = {
            ...topic.dossier,
            extension: {
              theme_category: topic.theme_category,
              parent_theme_id: topic.parent_theme_id,
            },
          };

          return jsonResponse(result);
        }

        // GET /topics - List with filters
        const search = url.searchParams.get('search') || undefined;
        const category = url.searchParams.get('category') || undefined;
        const parentId = url.searchParams.get('parent_id') || undefined;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        let query = supabase
          .from('topics')
          .select(
            `
            *,
            dossier:id (
              id, type, name_en, name_ar, description_en, description_ar,
              abbreviation, status, sensitivity_level, tags, created_at, updated_at
            )
          `
          )
          .range(offset, offset + limit - 1);

        if (category) {
          query = query.eq('theme_category', category);
        }

        if (parentId) {
          query = query.eq('parent_theme_id', parentId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
        }

        // Filter active and apply search, then flatten
        let topics = (data || [])
          .filter((t: any) => t.dossier?.status === 'active')
          .map((t: any) => ({
            ...t.dossier,
            extension: {
              theme_category: t.theme_category,
              parent_theme_id: t.parent_theme_id,
            },
          }));

        // Apply search filter on name
        if (search) {
          const searchLower = search.toLowerCase();
          topics = topics.filter(
            (t: any) =>
              t.name_en?.toLowerCase().includes(searchLower) || t.name_ar?.includes(search)
          );
        }

        // Get total count
        const { count } = await supabase
          .from('dossiers')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'topic')
          .not('status', 'in', '(archived,deleted)');

        return jsonResponse({
          data: topics,
          pagination: {
            total: count || 0,
            limit,
            offset,
            has_more: topics.length === limit,
          },
        });
      }

      // ========================================================================
      // POST REQUESTS
      // ========================================================================
      case 'POST': {
        const body = await req.json();

        if (!body.name_en?.trim()) {
          return errorResponse(
            'VALIDATION_ERROR',
            'name_en is required',
            'الاسم بالإنجليزية مطلوب',
            400
          );
        }

        // Create dossier first
        const { data: dossier, error: dossierError } = await supabase
          .from('dossiers')
          .insert({
            type: 'topic',
            name_en: body.name_en.trim(),
            name_ar: body.name_ar?.trim() || body.name_en.trim(),
            description_en: body.description_en,
            description_ar: body.description_ar,
            abbreviation: body.abbreviation,
            status: 'active',
            sensitivity_level: body.sensitivity_level || 0,
            tags: body.tags || [],
          })
          .select()
          .single();

        if (dossierError) {
          return errorResponse('INSERT_ERROR', dossierError.message, 'خطأ في إنشاء الملف', 500);
        }

        // Create topics extension
        const { error: topicError } = await supabase.from('topics').insert({
          id: dossier.id,
          theme_category: body.theme_category || null,
          parent_theme_id: body.parent_theme_id || null,
        });

        if (topicError) {
          // Rollback dossier
          await supabaseAdmin.from('dossiers').delete().eq('id', dossier.id);
          return errorResponse('INSERT_ERROR', topicError.message, 'خطأ في إنشاء الموضوع', 500);
        }

        // Auto-assign creator as owner
        await supabase.from('dossier_owners').insert({
          dossier_id: dossier.id,
          user_id: user.id,
          role_type: 'owner',
        });

        return jsonResponse(
          {
            ...dossier,
            extension: {
              theme_category: body.theme_category || null,
              parent_theme_id: body.parent_theme_id || null,
            },
          },
          201
        );
      }

      // ========================================================================
      // PATCH REQUESTS
      // ========================================================================
      case 'PATCH': {
        if (!topicId) {
          return errorResponse('BAD_REQUEST', 'Topic ID required', 'معرف الموضوع مطلوب', 400);
        }

        const body = await req.json();

        // Update dossier fields
        const dossierUpdates: Record<string, unknown> = {};
        if (body.name_en !== undefined) dossierUpdates.name_en = body.name_en;
        if (body.name_ar !== undefined) dossierUpdates.name_ar = body.name_ar;
        if (body.description_en !== undefined) dossierUpdates.description_en = body.description_en;
        if (body.description_ar !== undefined) dossierUpdates.description_ar = body.description_ar;
        if (body.abbreviation !== undefined) dossierUpdates.abbreviation = body.abbreviation;
        if (body.status !== undefined) dossierUpdates.status = body.status;
        if (body.sensitivity_level !== undefined)
          dossierUpdates.sensitivity_level = body.sensitivity_level;
        if (body.tags !== undefined) dossierUpdates.tags = body.tags;

        if (Object.keys(dossierUpdates).length > 0) {
          const { error: dossierError } = await supabase
            .from('dossiers')
            .update(dossierUpdates)
            .eq('id', topicId);

          if (dossierError) {
            return errorResponse('UPDATE_ERROR', dossierError.message, 'خطأ في التحديث', 500);
          }
        }

        // Update topics extension fields
        const topicUpdates: Record<string, unknown> = {};
        if (body.theme_category !== undefined) topicUpdates.theme_category = body.theme_category;
        if (body.parent_theme_id !== undefined) topicUpdates.parent_theme_id = body.parent_theme_id;

        if (Object.keys(topicUpdates).length > 0) {
          const { error: topicError } = await supabase
            .from('topics')
            .update(topicUpdates)
            .eq('id', topicId);

          if (topicError) {
            return errorResponse('UPDATE_ERROR', topicError.message, 'خطأ في التحديث', 500);
          }
        }

        // Return updated topic
        const { data: updated } = await supabase
          .from('topics')
          .select(
            `
            *,
            dossier:id (
              id, type, name_en, name_ar, description_en, description_ar,
              abbreviation, status, sensitivity_level, tags, created_at, updated_at
            )
          `
          )
          .eq('id', topicId)
          .single();

        if (updated) {
          return jsonResponse({
            ...updated.dossier,
            extension: {
              theme_category: updated.theme_category,
              parent_theme_id: updated.parent_theme_id,
            },
          });
        }

        return jsonResponse({ success: true });
      }

      // ========================================================================
      // DELETE REQUESTS
      // ========================================================================
      case 'DELETE': {
        if (!topicId) {
          return errorResponse('BAD_REQUEST', 'Topic ID required', 'معرف الموضوع مطلوب', 400);
        }

        // Soft delete via dossier status
        const { error } = await supabase
          .from('dossiers')
          .update({ status: 'archived' })
          .eq('id', topicId)
          .eq('type', 'topic');

        if (error) {
          return errorResponse('DELETE_ERROR', error.message, 'خطأ في الأرشفة', 500);
        }
        return jsonResponse({ success: true });
      }

      default:
        return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة', 405);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
