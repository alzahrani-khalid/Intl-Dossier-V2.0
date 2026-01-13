/**
 * Dossier Relationships Edge Function
 * Feature: universal-relationship-crud
 *
 * Comprehensive REST API for managing relationships between any dossier types:
 * - GET /dossier-relationships - List relationships with filters
 * - GET /dossier-relationships/:id - Get single relationship
 * - GET /dossier-relationships/dossier/:dossierId - Get all relationships for a dossier
 * - POST /dossier-relationships - Create new relationship
 * - PATCH /dossier-relationships/:id - Update relationship
 * - DELETE /dossier-relationships/:id - Delete relationship
 *
 * Supports relationship types: member_of, participates_in, cooperates_with,
 * bilateral_relation, partnership, parent_of, subsidiary_of, related_to, etc.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface RelationshipCreateRequest {
  source_dossier_id: string;
  target_dossier_id: string;
  relationship_type: string;
  relationship_metadata?: Record<string, unknown>;
  notes_en?: string;
  notes_ar?: string;
  effective_from?: string;
  effective_to?: string;
  status?: 'active' | 'historical' | 'terminated';
}

interface RelationshipUpdateRequest {
  relationship_type?: string;
  relationship_metadata?: Record<string, unknown>;
  notes_en?: string;
  notes_ar?: string;
  effective_from?: string;
  effective_to?: string;
  status?: 'active' | 'historical' | 'terminated';
}

interface RelationshipListParams {
  source_dossier_id?: string;
  target_dossier_id?: string;
  dossier_id?: string; // Either source or target
  relationship_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// Valid relationship types
const VALID_RELATIONSHIP_TYPES = [
  'member_of',
  'participates_in',
  'cooperates_with',
  'bilateral_relation',
  'partnership',
  'parent_of',
  'subsidiary_of',
  'related_to',
  'represents',
  'hosted_by',
  'sponsored_by',
  'involves',
  'discusses',
  'participant_in',
  'observer_of',
  'affiliate_of',
  'successor_of',
  'predecessor_of',
];

// ============================================================================
// Helper Functions
// ============================================================================

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

function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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

function validateRelationshipType(type: string): boolean {
  return VALID_RELATIONSHIP_TYPES.includes(type);
}

// ============================================================================
// Main Handler
// ============================================================================

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
    // pathParts[0] = "dossier-relationships"
    const secondPart = pathParts[1]; // Could be relationship ID or "dossier"
    const thirdPart = pathParts[2]; // Could be dossier ID when secondPart is "dossier"

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /dossier-relationships/dossier/:dossierId - Get all relationships for a dossier
        if (secondPart === 'dossier' && thirdPart) {
          const dossierId = thirdPart;
          const relationshipType = url.searchParams.get('relationship_type');
          const status = url.searchParams.get('status');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
          const offset = parseInt(url.searchParams.get('offset') || '0');

          let query = supabase
            .from('dossier_relationships')
            .select(
              `
              id,
              source_dossier_id,
              target_dossier_id,
              relationship_type,
              relationship_metadata,
              notes_en,
              notes_ar,
              effective_from,
              effective_to,
              status,
              created_at,
              created_by,
              source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status),
              target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar, status)
            `
            )
            .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);

          if (relationshipType) {
            query = query.eq('relationship_type', relationshipType);
          }
          if (status) {
            query = query.eq('status', status);
          }

          const { data, error } = await query
            .order('effective_from', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          // Get total count
          const { count } = await supabase
            .from('dossier_relationships')
            .select('*', { count: 'exact', head: true })
            .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);

          return successResponse({
            data: data || [],
            pagination: {
              total: count || 0,
              limit,
              offset,
              has_more: (data?.length || 0) === limit,
            },
          });
        }

        // GET /dossier-relationships/:id - Get single relationship
        if (secondPart && secondPart !== 'dossier') {
          const relationshipId = secondPart;

          const { data, error } = await supabase
            .from('dossier_relationships')
            .select(
              `
              id,
              source_dossier_id,
              target_dossier_id,
              relationship_type,
              relationship_metadata,
              notes_en,
              notes_ar,
              effective_from,
              effective_to,
              status,
              created_at,
              created_by,
              source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status),
              target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar, status)
            `
            )
            .eq('id', relationshipId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return errorResponse(
                'NOT_FOUND',
                'Relationship not found',
                'العلاقة غير موجودة',
                404
              );
            }
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse(data);
        }

        // GET /dossier-relationships - List relationships with filters
        const sourceDossierId = url.searchParams.get('source_dossier_id');
        const targetDossierId = url.searchParams.get('target_dossier_id');
        const dossierId = url.searchParams.get('dossier_id');
        const relationshipType = url.searchParams.get('relationship_type');
        const status = url.searchParams.get('status');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        let query = supabase.from('dossier_relationships').select(
          `
            id,
            source_dossier_id,
            target_dossier_id,
            relationship_type,
            relationship_metadata,
            notes_en,
            notes_ar,
            effective_from,
            effective_to,
            status,
            created_at,
            created_by,
            source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status),
            target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar, status)
          `
        );

        if (sourceDossierId) {
          query = query.eq('source_dossier_id', sourceDossierId);
        }
        if (targetDossierId) {
          query = query.eq('target_dossier_id', targetDossierId);
        }
        if (dossierId) {
          query = query.or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);
        }
        if (relationshipType) {
          query = query.eq('relationship_type', relationshipType);
        }
        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        return successResponse({
          data: data || [],
          pagination: {
            limit,
            offset,
            has_more: (data?.length || 0) === limit,
          },
        });
      }

      case 'POST': {
        // POST /dossier-relationships - Create new relationship
        const body: RelationshipCreateRequest = await req.json();

        // Validation
        if (!body.source_dossier_id || !body.target_dossier_id) {
          return errorResponse(
            'VALIDATION_ERROR',
            'source_dossier_id and target_dossier_id are required',
            'معرف المصدر والهدف مطلوبان',
            400
          );
        }

        if (!body.relationship_type) {
          return errorResponse(
            'VALIDATION_ERROR',
            'relationship_type is required',
            'نوع العلاقة مطلوب',
            400
          );
        }

        if (!validateRelationshipType(body.relationship_type)) {
          return errorResponse(
            'VALIDATION_ERROR',
            `Invalid relationship_type. Valid types are: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
            `نوع العلاقة غير صالح. الأنواع الصالحة هي: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
            400
          );
        }

        if (body.source_dossier_id === body.target_dossier_id) {
          return errorResponse(
            'VALIDATION_ERROR',
            'A dossier cannot have a relationship with itself',
            'لا يمكن أن يكون للملف علاقة مع نفسه',
            400
          );
        }

        // Verify both dossiers exist
        const { data: sourceDossier, error: sourceError } = await supabase
          .from('dossiers')
          .select('id, type, name_en')
          .eq('id', body.source_dossier_id)
          .single();

        if (sourceError || !sourceDossier) {
          return errorResponse(
            'NOT_FOUND',
            'Source dossier not found',
            'الملف المصدر غير موجود',
            404
          );
        }

        const { data: targetDossier, error: targetError } = await supabase
          .from('dossiers')
          .select('id, type, name_en')
          .eq('id', body.target_dossier_id)
          .single();

        if (targetError || !targetDossier) {
          return errorResponse(
            'NOT_FOUND',
            'Target dossier not found',
            'الملف الهدف غير موجود',
            404
          );
        }

        // Check for duplicate relationship
        const { data: existingRelationship } = await supabase
          .from('dossier_relationships')
          .select('id')
          .eq('source_dossier_id', body.source_dossier_id)
          .eq('target_dossier_id', body.target_dossier_id)
          .eq('relationship_type', body.relationship_type)
          .eq('status', 'active')
          .maybeSingle();

        if (existingRelationship) {
          return errorResponse(
            'DUPLICATE_ERROR',
            'An active relationship of this type already exists between these dossiers',
            'توجد بالفعل علاقة نشطة من هذا النوع بين هذين الملفين',
            409
          );
        }

        // Create relationship
        const { data, error } = await supabase
          .from('dossier_relationships')
          .insert({
            source_dossier_id: body.source_dossier_id,
            target_dossier_id: body.target_dossier_id,
            relationship_type: body.relationship_type,
            relationship_metadata: body.relationship_metadata || {},
            notes_en: body.notes_en,
            notes_ar: body.notes_ar,
            effective_from: body.effective_from || new Date().toISOString(),
            effective_to: body.effective_to,
            status: body.status || 'active',
            created_by: user.id,
          })
          .select(
            `
            id,
            source_dossier_id,
            target_dossier_id,
            relationship_type,
            relationship_metadata,
            notes_en,
            notes_ar,
            effective_from,
            effective_to,
            status,
            created_at,
            created_by,
            source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status),
            target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar, status)
          `
          )
          .single();

        if (error) {
          return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإنشاء', 500, error);
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            Location: `/dossier-relationships/${data.id}`,
          },
        });
      }

      case 'PATCH': {
        // PATCH /dossier-relationships/:id - Update relationship
        if (!secondPart) {
          return errorResponse(
            'BAD_REQUEST',
            'Relationship ID required',
            'معرف العلاقة مطلوب',
            400
          );
        }

        const relationshipId = secondPart;
        const body: RelationshipUpdateRequest = await req.json();

        // Validate relationship type if provided
        if (body.relationship_type && !validateRelationshipType(body.relationship_type)) {
          return errorResponse(
            'VALIDATION_ERROR',
            `Invalid relationship_type. Valid types are: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
            `نوع العلاقة غير صالح. الأنواع الصالحة هي: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
            400
          );
        }

        // Build update object
        const updates: Record<string, unknown> = {};
        if (body.relationship_type !== undefined)
          updates.relationship_type = body.relationship_type;
        if (body.relationship_metadata !== undefined)
          updates.relationship_metadata = body.relationship_metadata;
        if (body.notes_en !== undefined) updates.notes_en = body.notes_en;
        if (body.notes_ar !== undefined) updates.notes_ar = body.notes_ar;
        if (body.effective_from !== undefined) updates.effective_from = body.effective_from;
        if (body.effective_to !== undefined) updates.effective_to = body.effective_to;
        if (body.status !== undefined) updates.status = body.status;

        if (Object.keys(updates).length === 0) {
          return errorResponse(
            'VALIDATION_ERROR',
            'No fields to update',
            'لا توجد حقول للتحديث',
            400
          );
        }

        const { data, error } = await supabase
          .from('dossier_relationships')
          .update(updates)
          .eq('id', relationshipId)
          .select(
            `
            id,
            source_dossier_id,
            target_dossier_id,
            relationship_type,
            relationship_metadata,
            notes_en,
            notes_ar,
            effective_from,
            effective_to,
            status,
            created_at,
            created_by,
            source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status),
            target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar, status)
          `
          )
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return errorResponse('NOT_FOUND', 'Relationship not found', 'العلاقة غير موجودة', 404);
          }
          return errorResponse('UPDATE_ERROR', error.message, 'خطأ في التحديث', 500, error);
        }

        return successResponse(data);
      }

      case 'DELETE': {
        // DELETE /dossier-relationships/:id - Delete relationship
        if (!secondPart) {
          return errorResponse(
            'BAD_REQUEST',
            'Relationship ID required',
            'معرف العلاقة مطلوب',
            400
          );
        }

        const relationshipId = secondPart;

        // Check if relationship exists
        const { data: existing, error: checkError } = await supabase
          .from('dossier_relationships')
          .select('id')
          .eq('id', relationshipId)
          .single();

        if (checkError || !existing) {
          return errorResponse('NOT_FOUND', 'Relationship not found', 'العلاقة غير موجودة', 404);
        }

        const { error } = await supabase
          .from('dossier_relationships')
          .delete()
          .eq('id', relationshipId);

        if (error) {
          return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500, error);
        }

        return successResponse({ success: true, id: relationshipId });
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
